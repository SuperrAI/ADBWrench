'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Monitor, AlertTriangle } from 'lucide-react';
import { useDevice } from '@/context/device-context';
import { cn } from '@/lib/utils';
import {
  startScrcpyServer,
  stopScrcpyServer,
  isScrcpyActive,
} from '@/services/scrcpy';
import { getScreenResolution } from '@/services/adb';
import type { ScrcpySessionResult } from '@/services/scrcpy';

type StreamStatus = 'idle' | 'connecting' | 'streaming' | 'error';

const QUALITY_PRESETS = [
  { label: 'LOW', maxSize: 960, videoBitRate: 2_000_000, maxFps: 15 },
  { label: 'MED', maxSize: 1280, videoBitRate: 4_000_000, maxFps: 24 },
  { label: 'HIGH', maxSize: 1920, videoBitRate: 8_000_000, maxFps: 30 },
  { label: 'NATIVE', maxSize: 0, videoBitRate: 12_000_000, maxFps: 60 },
] as const;

/**
 * LiveViewTab - Real-time screen mirroring via scrcpy + WebCodecs.
 *
 * This component manages the full lifecycle of a scrcpy session:
 * 1. Push server binary to device
 * 2. Start scrcpy with H.264 video
 * 3. Decode with WebCodecs VideoDecoder
 * 4. Render to a WebGL canvas
 *
 * Audio and control are disabled to avoid ADB multiplexing deadlocks.
 */
export function LiveViewTab() {
  const { connectionState, handleConnectionError } = useDevice();

  const [status, setStatus] = useState<StreamStatus>('idle');
  const [fps, setFps] = useState(0);
  const [resolution, setResolution] = useState({ width: 0, height: 0 });
  const [deviceResolution, setDeviceResolution] = useState({ width: 0, height: 0 });
  const [error, setError] = useState<string | null>(null);
  const [qualityIndex, setQualityIndex] = useState(3); // Default to NATIVE

  // Refs for managing the streaming session
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<ScrcpySessionResult | null>(null);
  // Using a structural interface to avoid importing the WebCodecs decoder type at
  // module level. The actual instance is assigned when streaming starts via dynamic import.
  interface DecoderHandle {
    framesRendered: number;
    framesSkipped: number;
    writable: unknown;
    sizeChanged: (callback: (size: { width: number; height: number }) => void) => void;
    snapshot: () => Promise<Blob | undefined>;
    dispose: () => void;
    width: number;
    height: number;
  }
  const decoderRef = useRef<DecoderHandle | null>(null);
  const fpsIntervalRef = useRef<number | null>(null);
  const lastFrameCountRef = useRef(0);
  const isMountedRef = useRef(true);
  const pipePromiseRef = useRef<Promise<void> | null>(null);

  /**
   * Check if the browser supports WebCodecs, required for hardware-accelerated
   * H.264 decoding.
   */
  const isWebCodecsSupported = useCallback((): boolean => {
    return typeof globalThis.VideoDecoder !== 'undefined';
  }, []);

  /**
   * Start the FPS counter. Reads framesRendered from the decoder at 1-second
   * intervals to compute the actual displayed frame rate.
   */
  const startFpsCounter = useCallback(() => {
    // Clear any existing interval
    if (fpsIntervalRef.current) {
      clearInterval(fpsIntervalRef.current);
    }
    lastFrameCountRef.current = 0;

    fpsIntervalRef.current = window.setInterval(() => {
      const decoder = decoderRef.current;
      if (!decoder) return;

      const currentFrames = decoder.framesRendered;
      const delta = currentFrames - lastFrameCountRef.current;
      lastFrameCountRef.current = currentFrames;
      setFps(delta);
    }, 1000);
  }, []);

  /**
   * Stop the FPS counter interval.
   */
  const stopFpsCounter = useCallback(() => {
    if (fpsIntervalRef.current) {
      clearInterval(fpsIntervalRef.current);
      fpsIntervalRef.current = null;
    }
    setFps(0);
  }, []);

  /**
   * Clean up all streaming resources: stop the scrcpy session, dispose the
   * decoder, remove the canvas element, and reset state.
   */
  const cleanup = useCallback(async () => {
    stopFpsCounter();

    // Stop the scrcpy session
    const session = sessionRef.current;
    sessionRef.current = null;

    if (session) {
      try {
        await session.stop();
      } catch (err) {
        console.warn('[LiveView] Error stopping session:', err);
      }
    }

    // Wait for the pipe to finish before disposing the decoder,
    // so we don't close the writable while it's still being written to
    if (pipePromiseRef.current) {
      try {
        await pipePromiseRef.current;
      } catch {
        // Pipe errors are expected on shutdown
      }
      pipePromiseRef.current = null;
    }

    // Dispose the decoder
    const decoder = decoderRef.current;
    decoderRef.current = null;

    if (decoder) {
      try {
        decoder.dispose();
      } catch (err) {
        console.warn('[LiveView] Error disposing decoder:', err);
      }
    }

    // Remove the canvas from the container
    const container = canvasContainerRef.current;
    if (container) {
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    }
  }, [stopFpsCounter]);

  /**
   * Stop the live view stream and return to idle state.
   */
  const handleStop = useCallback(async () => {
    await cleanup();
    if (isMountedRef.current) {
      setStatus('idle');
      setResolution({ width: 0, height: 0 });
    }
  }, [cleanup]);

  /**
   * Start the live view stream.
   *
   * Flow:
   * 1. Validate prerequisites (WebCodecs support, device connected)
   * 2. Start scrcpy server (pushes binary + starts server process)
   * 3. Create WebCodecs decoder with WebGL renderer
   * 4. Pipe the video stream to the decoder
   * 5. Update UI with stream metadata
   */
  const handleStart = useCallback(async () => {
    if (connectionState !== 'connected') return;

    if (!isWebCodecsSupported()) {
      setError('WebCodecs is not supported in this browser. Please use a recent version of Chrome or Edge.');
      setStatus('error');
      return;
    }

    setStatus('connecting');
    setError(null);

    try {
      // Dynamically import decoder modules. These are large and only needed
      // when the user actually starts streaming.
      const { WebCodecsVideoDecoder } = await import(
        '@yume-chan/scrcpy-decoder-webcodecs'
      );
      const { WebGLVideoFrameRenderer } = await import(
        '@yume-chan/scrcpy-decoder-webcodecs'
      );

      if (!WebCodecsVideoDecoder.isSupported) {
        setError('WebCodecs VideoDecoder is not supported in this browser.');
        setStatus('error');
        return;
      }

      const quality = QUALITY_PRESETS[qualityIndex];

      // Start the scrcpy server and get the video stream
      const session = await startScrcpyServer({
        maxSize: quality.maxSize,
        videoBitRate: quality.videoBitRate,
        maxFps: quality.maxFps,
      });

      if (!isMountedRef.current) {
        await session.stop();
        return;
      }

      sessionRef.current = session;

      // Create the WebGL renderer with capture enabled (for screenshot feature)
      const renderer = new WebGLVideoFrameRenderer(undefined, true);

      // Create the WebCodecs decoder
      const decoder = new WebCodecsVideoDecoder({
        codec: session.codec,
        renderer,
      });

      decoderRef.current = decoder;

      // Append the renderer's canvas to our container.
      // The canvas must fill the container while maintaining aspect ratio.
      const canvas = renderer.canvas as HTMLCanvasElement;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.objectFit = 'contain';
      canvas.style.display = 'block';

      const container = canvasContainerRef.current;
      if (container) {
        // Clear any previous content
        while (container.firstChild) {
          container.removeChild(container.firstChild);
        }
        container.appendChild(canvas);
      }

      // Listen for size changes from the video stream
      session.videoStream.sizeChanged((size: { width: number; height: number }) => {
        if (isMountedRef.current) {
          setResolution({ width: size.width, height: size.height });
        }
      });

      // Set initial resolution from metadata if available
      if (session.videoStream.width > 0 && session.videoStream.height > 0) {
        setResolution({
          width: session.videoStream.width,
          height: session.videoStream.height,
        });
      }

      // Also listen for size changes from the decoder
      decoder.sizeChanged((size) => {
        if (isMountedRef.current) {
          setResolution({ width: size.width, height: size.height });
        }
      });

      // Pipe the video stream to the decoder's writable sink.
      // This runs continuously in the background until the stream ends.
      pipePromiseRef.current = session.videoStream.stream
        .pipeTo(decoder.writable)
        .catch((pipeErr: unknown) => {
          // Stream errors are expected when stopping
          if (isMountedRef.current && sessionRef.current) {
            console.error('[LiveView] Stream pipe error:', pipeErr);
            setError('Video stream disconnected unexpectedly.');
            setStatus('error');
          }
        });

      // Start FPS tracking
      startFpsCounter();

      if (isMountedRef.current) {
        setStatus('streaming');
      }
    } catch (err) {
      console.error('[LiveView] Failed to start stream:', err);

      // Check if this is a device connection error
      if (!handleConnectionError(err)) {
        const message =
          err instanceof Error ? err.message : 'Failed to start live view';
        if (isMountedRef.current) {
          setError(message);
          setStatus('error');
        }
      }

      // Clean up any partially started resources
      await cleanup();
    }
  }, [
    connectionState,
    qualityIndex,
    isWebCodecsSupported,
    handleConnectionError,
    startFpsCounter,
    cleanup,
  ]);

  /**
   * Grab a screenshot from the current canvas frame.
   * Uses the decoder's snapshot method for high-quality capture.
   */
  const handleGrabScreenshot = useCallback(async () => {
    const decoder = decoderRef.current;
    if (!decoder) return;

    try {
      const blob = await decoder.snapshot();
      if (!blob) {
        setError('No frame available to capture.');
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `liveview-${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[LiveView] Screenshot failed:', err);
      setError('Failed to capture screenshot from stream.');
    }
  }, []);

  // Clean up on unmount
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      // Fire-and-forget cleanup. The refs will be cleared even if the
      // async cleanup hasn't finished when React unmounts us.
      cleanup();
      // Also ensure the server-level session is stopped
      if (isScrcpyActive()) {
        stopScrcpyServer();
      }
    };
  }, [cleanup]);

  // Fetch device screen resolution when connected
  useEffect(() => {
    if (connectionState === 'connected') {
      getScreenResolution()
        .then((res) => {
          if (isMountedRef.current) {
            setDeviceResolution(res);
          }
        })
        .catch(() => {
          // Ignore - device resolution is informational only
        });
    } else {
      setDeviceResolution({ width: 0, height: 0 });
    }
  }, [connectionState]);

  // Stop streaming when device disconnects
  useEffect(() => {
    if (connectionState !== 'connected' && status === 'streaming') {
      handleStop();
    }
  }, [connectionState, status, handleStop]);

  const isStreaming = status === 'streaming';
  const isConnecting = status === 'connecting';
  const hasError = status === 'error';
  const quality = QUALITY_PRESETS[qualityIndex];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Controls Bar */}
      <div className="border-b border-border p-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'text-xs',
                isStreaming && 'text-green-500',
                isConnecting && 'text-orange-500',
                hasError && 'text-red-500',
                status === 'idle' && 'text-muted-foreground'
              )}
            >
              STATUS:{' '}
              {status === 'idle' && 'IDLE'}
              {isConnecting && 'CONNECTING...'}
              {isStreaming && 'STREAMING'}
              {hasError && 'ERROR'}
            </div>

            {/* Quality Selector - only changeable when not streaming */}
            {!isStreaming && !isConnecting && (
              <div className="flex border border-border">
                {QUALITY_PRESETS.map((preset, idx) => (
                  <button
                    key={preset.label}
                    onClick={() => setQualityIndex(idx)}
                    className={cn(
                      'px-2 py-1 text-xs transition-colors',
                      qualityIndex === idx
                        ? 'bg-foreground text-background'
                        : 'hover:bg-muted text-muted-foreground',
                      idx !== 0 && 'border-l border-border'
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            )}

            {isStreaming && (
              <div className="text-[10px] text-muted-foreground">
                {quality.label} | {quality.maxFps}FPS MAX
                {deviceResolution.width > 0 && (
                  <> | DEVICE {deviceResolution.width}x{deviceResolution.height}</>
                )}
              </div>
            )}

            {!isStreaming && !isConnecting && deviceResolution.width > 0 && (
              <div className="text-[10px] text-muted-foreground">
                DEVICE: {deviceResolution.width}x{deviceResolution.height}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isStreaming && (
              <button
                onClick={handleGrabScreenshot}
                className="px-2 py-1 border border-border text-muted-foreground hover:text-foreground hover:bg-muted text-xs"
              >
                [ SCREENSHOT ]
              </button>
            )}

            {!isStreaming && !isConnecting ? (
              <button
                onClick={handleStart}
                disabled={connectionState !== 'connected'}
                className={cn(
                  'px-2 py-1 border text-xs',
                  connectionState === 'connected'
                    ? 'border-green-500 text-green-500 hover:bg-green-500/10'
                    : 'border-border text-muted-foreground/50 cursor-not-allowed'
                )}
              >
                [ START STREAM ]
              </button>
            ) : isConnecting ? (
              <button
                disabled
                className="px-2 py-1 border border-orange-500 text-orange-500 text-xs animate-pulse cursor-wait"
              >
                [ CONNECTING... ]
              </button>
            ) : (
              <button
                onClick={handleStop}
                className="px-2 py-1 border border-red-500 text-red-500 hover:bg-red-500/10 text-xs"
              >
                [ STOP ]
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="border-b border-red-500 p-2 text-red-500 text-xs flex items-center gap-2">
          <AlertTriangle className="w-3 h-3 flex-shrink-0" />
          <span>[!] {error}</span>
          {hasError && (
            <button
              onClick={() => {
                setError(null);
                setStatus('idle');
              }}
              className="ml-auto px-2 py-0.5 border border-red-500 hover:bg-red-500/10 text-[10px]"
            >
              DISMISS
            </button>
          )}
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center p-4 bg-black/20 overflow-hidden min-h-0">
        {isStreaming || isConnecting ? (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Canvas Container - the WebGL canvas gets appended here */}
            <div
              ref={canvasContainerRef}
              className="w-full h-full"
            />

            {/* Connecting Overlay */}
            {isConnecting && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                <div className="text-center">
                  <div className="text-orange-500 text-2xl mb-4 animate-pulse">
                    {'///'}
                  </div>
                  <div className="text-sm mb-2 uppercase tracking-wider">
                    ESTABLISHING CONNECTION
                  </div>
                  <div className="text-xs text-muted-foreground">
                    PUSHING SERVER BINARY AND STARTING SCRCPY...
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Idle / Error State */
          <div className="text-center max-w-md">
            <Monitor
              className="w-16 h-16 mx-auto mb-6 text-muted-foreground/30"
              strokeWidth={1}
            />
            <div className="text-sm mb-2 uppercase tracking-wider">
              LIVE VIEW
            </div>
            <div className="text-xs text-muted-foreground mb-6">
              REAL-TIME SCREEN MIRRORING
            </div>
            <div className="border border-border p-4 text-xs text-muted-foreground/70 leading-relaxed">
              <p className="mb-2">
                STREAMS YOUR DEVICE SCREEN IN REAL-TIME USING SCRCPY
                + WEBCODECS FOR HARDWARE-ACCELERATED H.264 DECODING.
              </p>
              <p className="mb-2">
                SELECT QUALITY PRESET AND CLICK START STREAM TO BEGIN.
              </p>
              <p className="text-[10px]">
                NOTE: SOME APPS WITH FLAG_SECURE MAY SHOW A BLACK SCREEN.
                AUDIO AND TOUCH INPUT ARE NOT SUPPORTED.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      {isStreaming && (
        <div className="border-t border-border px-3 flex-shrink-0 bg-background flex items-center justify-between min-h-[36px]">
          <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
            <span className="text-green-500">
              {'>'} LIVE
            </span>
            <span>
              FPS: <span className="text-foreground">{fps}</span>
            </span>
            {resolution.width > 0 && (
              <span>
                STREAM:{' '}
                <span className="text-foreground">
                  {resolution.width}x{resolution.height}
                </span>
              </span>
            )}
            {deviceResolution.width > 0 && (
              <span>
                DEVICE:{' '}
                <span className="text-foreground">
                  {deviceResolution.width}x{deviceResolution.height}
                </span>
              </span>
            )}
          </div>
          <div className="text-[10px] text-muted-foreground">
            SCRCPY + WEBCODECS
          </div>
        </div>
      )}
    </div>
  );
}
