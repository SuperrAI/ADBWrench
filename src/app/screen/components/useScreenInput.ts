/**
 * useScreenInput - Custom hook for touch input on the live view canvas.
 *
 * Converts browser PointerEvents into scrcpy injectTouch control messages,
 * handling coordinate transformation from the CSS-rendered canvas to device
 * screen coordinates, accounting for letterboxing from object-fit: contain.
 */

import { useEffect, useRef, useCallback } from 'react';
import type { RefObject } from 'react';
import type { ScrcpyControlMessageWriter } from '@/services/scrcpy';
import {
  AndroidMotionEventAction,
  AndroidMotionEventButton,
} from '@yume-chan/scrcpy';
import type { AndroidMotionEventAction as AndroidMotionEventActionType } from '@yume-chan/scrcpy';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseScreenInputOptions {
  /** Ref to the container div that holds the canvas */
  canvasContainerRef: RefObject<HTMLDivElement | null>;
  /** Scrcpy control message writer, null when not available */
  controller: ScrcpyControlMessageWriter | null;
  /** Current video stream resolution (not device native resolution) */
  resolution: { width: number; height: number };
  /** Whether input injection is enabled */
  enabled: boolean;
}

interface DeviceCoords {
  x: number;
  y: number;
  inBounds: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Minimum interval between MOVE injections in ms (~60 per second) */
const MOVE_THROTTLE_MS = 16;

/** Pointer ID for generic finger touch (-2 per scrcpy convention) */
const FINGER_POINTER_ID = BigInt(-2);

// ---------------------------------------------------------------------------
// Coordinate transformation
// ---------------------------------------------------------------------------

/**
 * Convert a browser PointerEvent position to device coordinates.
 *
 * The canvas uses object-fit: contain which may letterbox the video.
 * We need to find the actual rendered video area within the canvas element
 * and map the pointer position to device pixel coordinates.
 */
function getDeviceCoords(
  event: PointerEvent,
  canvas: HTMLCanvasElement,
  videoWidth: number,
  videoHeight: number
): DeviceCoords {
  const rect = canvas.getBoundingClientRect();

  const canvasAspect = rect.width / rect.height;
  const videoAspect = videoWidth / videoHeight;

  let displayWidth: number;
  let displayHeight: number;
  let offsetX: number;
  let offsetY: number;

  if (canvasAspect > videoAspect) {
    // Letterboxed on sides (pillarboxed)
    displayHeight = rect.height;
    displayWidth = rect.height * videoAspect;
    offsetX = (rect.width - displayWidth) / 2;
    offsetY = 0;
  } else {
    // Letterboxed on top/bottom
    displayWidth = rect.width;
    displayHeight = rect.width / videoAspect;
    offsetX = 0;
    offsetY = (rect.height - displayHeight) / 2;
  }

  const relX = (event.clientX - rect.left - offsetX) / displayWidth;
  const relY = (event.clientY - rect.top - offsetY) / displayHeight;

  return {
    x: Math.round(Math.max(0, Math.min(videoWidth, relX * videoWidth))),
    y: Math.round(Math.max(0, Math.min(videoHeight, relY * videoHeight))),
    inBounds: relX >= 0 && relX <= 1 && relY >= 0 && relY <= 1,
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useScreenInput({
  canvasContainerRef,
  controller,
  resolution,
  enabled,
}: UseScreenInputOptions): void {
  // Track whether a pointer is currently down to handle move events correctly
  const isPointerDownRef = useRef(false);
  // Timestamp of last injected MOVE event for throttling
  const lastMoveTimeRef = useRef(0);

  /**
   * Get the canvas element from the container. The WebGL renderer's canvas
   * is appended as a child of the container div.
   */
  const getCanvas = useCallback((): HTMLCanvasElement | null => {
    const container = canvasContainerRef.current;
    if (!container) return null;
    return container.querySelector('canvas');
  }, [canvasContainerRef]);

  /**
   * Inject a touch message into scrcpy.
   */
  const injectTouch = useCallback(
    async (
      action: AndroidMotionEventActionType,
      event: PointerEvent,
      canvas: HTMLCanvasElement
    ): Promise<void> => {
      if (!controller || resolution.width === 0 || resolution.height === 0) {
        return;
      }

      const coords = getDeviceCoords(
        event,
        canvas,
        resolution.width,
        resolution.height
      );

      // For Down events, ignore out-of-bounds taps
      if (action === AndroidMotionEventAction.Down && !coords.inBounds) {
        return;
      }

      // actionButton identifies which button *changed* — only meaningful for
      // Down and Up events. For Move it must be None.
      const isTransition =
        action === AndroidMotionEventAction.Down ||
        action === AndroidMotionEventAction.Up;
      const actionButton = isTransition
        ? AndroidMotionEventButton.Primary
        : AndroidMotionEventButton.None;

      // buttons = currently held buttons bitmask.
      // Held during Down and Move; zero for Up/Cancel.
      const isRelease =
        action === AndroidMotionEventAction.Up ||
        action === AndroidMotionEventAction.Cancel;
      const buttons = isRelease
        ? AndroidMotionEventButton.None
        : AndroidMotionEventButton.Primary;

      const pressure = isRelease ? 0 : 1.0;

      try {
        await controller.injectTouch({
          action,
          pointerId: FINGER_POINTER_ID,
          pointerX: coords.x,
          pointerY: coords.y,
          videoWidth: resolution.width,
          videoHeight: resolution.height,
          pressure,
          actionButton,
          buttons,
        });
      } catch (err) {
        // Log but do not throw -- a failed injection should not crash the UI
        console.warn('[useScreenInput] Failed to inject touch:', err);
      }
    },
    [controller, resolution]
  );

  useEffect(() => {
    if (!enabled || !controller) return;

    const canvas = getCanvas();
    if (!canvas) return;

    // Prevent browser default gestures on the canvas (scrolling, back-nav, etc.)
    canvas.style.touchAction = 'none';

    const handlePointerDown = (event: PointerEvent) => {
      event.preventDefault();
      isPointerDownRef.current = true;
      lastMoveTimeRef.current = 0;

      // Capture the pointer so we keep receiving events if it leaves the canvas
      canvas.setPointerCapture(event.pointerId);

      injectTouch(AndroidMotionEventAction.Down, event, canvas);
    };

    const handlePointerMove = (event: PointerEvent) => {
      event.preventDefault();

      if (!isPointerDownRef.current) return;

      // Throttle move events to ~60/s
      const now = performance.now();
      if (now - lastMoveTimeRef.current < MOVE_THROTTLE_MS) return;
      lastMoveTimeRef.current = now;

      injectTouch(AndroidMotionEventAction.Move, event, canvas);
    };

    const handlePointerUp = (event: PointerEvent) => {
      event.preventDefault();

      if (!isPointerDownRef.current) return;
      isPointerDownRef.current = false;

      injectTouch(AndroidMotionEventAction.Up, event, canvas);
    };

    const handlePointerCancel = (event: PointerEvent) => {
      event.preventDefault();

      if (!isPointerDownRef.current) return;
      isPointerDownRef.current = false;

      injectTouch(AndroidMotionEventAction.Cancel, event, canvas);
    };

    // Prevent context menu on long press / right-click on the canvas
    const handleContextMenu = (event: Event) => {
      event.preventDefault();
    };

    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointercancel', handlePointerCancel);
    canvas.addEventListener('contextmenu', handleContextMenu);

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointercancel', handlePointerCancel);
      canvas.removeEventListener('contextmenu', handleContextMenu);

      // Reset touch-action when input is disabled
      canvas.style.touchAction = '';

      isPointerDownRef.current = false;
    };
  }, [enabled, controller, getCanvas, injectTouch]);
}
