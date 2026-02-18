/**
 * Scrcpy Service
 *
 * Manages the scrcpy server lifecycle for live screen mirroring.
 * Uses @yume-chan/adb-scrcpy to push the server binary, start it,
 * and provide an H.264 video stream for decoding via WebCodecs.
 */

import type { Adb } from '@yume-chan/adb';
import { AdbScrcpyClient, AdbScrcpyOptionsLatest } from '@yume-chan/adb-scrcpy';
import { ScrcpyVideoCodecId } from '@yume-chan/scrcpy';
import type { ScrcpyVideoCodecId as ScrcpyVideoCodecIdType } from '@yume-chan/scrcpy';
import type { ScrcpyVideoStreamMetadata } from '@yume-chan/scrcpy';
import type { ScrcpyControlMessageWriter } from '@yume-chan/scrcpy';
import { getCurrentAdb } from './adb';

export type { ScrcpyControlMessageWriter } from '@yume-chan/scrcpy';

// Path where the scrcpy-server binary is stored on the device
const DEVICE_SERVER_PATH = '/data/local/tmp/scrcpy-server.jar';

// URL to fetch the scrcpy-server binary from the public directory
const SERVER_BINARY_URL = '/scrcpy-server';

// Active session reference for cleanup
let activeClient: AdbScrcpyClient<AdbScrcpyOptionsLatest<boolean>> | null = null;

/**
 * Structural interface matching AdbScrcpyVideoStream.
 * We define this here rather than importing the class directly
 * because AdbScrcpyVideoStream is not re-exported from the
 * @yume-chan/adb-scrcpy package index.
 */
export interface ScrcpyVideoStreamHandle {
  readonly metadata: ScrcpyVideoStreamMetadata;
  // ReadableStream from @yume-chan/stream-extra; using 'unknown' for the dest
  // type to avoid importing the non-standard ReadableStream/WritableStream types
  readonly stream: { pipeTo: (dest: unknown) => Promise<void> };
  readonly sizeChanged: (
    callback: (size: { width: number; height: number }) => void
  ) => void;
  readonly width: number;
  readonly height: number;
}

export interface ScrcpySessionResult {
  /** The parsed video stream containing H.264 packets */
  videoStream: ScrcpyVideoStreamHandle;
  /** Video codec used by the server */
  codec: ScrcpyVideoCodecIdType;
  /** Control message writer for injecting touch/key events (undefined if control disabled) */
  controller: ScrcpyControlMessageWriter | undefined;
  /** Stop the scrcpy session and clean up resources */
  stop: () => Promise<void>;
}

export interface ScrcpyStartOptions {
  /** Max dimension in pixels (0 = no limit). Default: 1920 */
  maxSize?: number;
  /** Video bit rate in bits/sec. Default: 8_000_000 */
  videoBitRate?: number;
  /** Max frames per second (0 = no limit). Default: 30 */
  maxFps?: number;
}

/**
 * Fetch the scrcpy-server binary from the public directory.
 * Returns a ReadableStream of the binary data suitable for pushing to device.
 */
async function fetchServerBinary(): Promise<ReadableStream<Uint8Array>> {
  const response = await fetch(SERVER_BINARY_URL);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch scrcpy-server binary: ${response.status} ${response.statusText}`
    );
  }

  const blob = await response.blob();
  return blob.stream() as unknown as ReadableStream<Uint8Array>;
}

/**
 * Push the scrcpy-server binary to the connected device.
 * This must be done before starting the server.
 */
async function pushServerBinary(adb: Adb): Promise<void> {
  console.log('[scrcpy] Fetching server binary...');
  const serverStream = await fetchServerBinary();

  console.log('[scrcpy] Pushing server binary to device...');
  await AdbScrcpyClient.pushServer(
    adb,
    serverStream as Parameters<typeof AdbScrcpyClient.pushServer>[1],
    DEVICE_SERVER_PATH
  );
  console.log('[scrcpy] Server binary pushed successfully.');
}

/**
 * Start the scrcpy server on the connected device and return the video stream.
 *
 * Audio is DISABLED to reduce bandwidth. Control is ENABLED to allow
 * touch/stylus input injection. The video stream MUST be consumed
 * continuously or the connection will stall. The control stream's
 * read side is automatically drained by AdbScrcpyClient internally.
 */
export async function startScrcpyServer(
  options?: ScrcpyStartOptions
): Promise<ScrcpySessionResult> {
  const adb = getCurrentAdb();
  if (!adb) {
    throw new Error('No device connected. Connect a device first.');
  }

  // Stop any existing session before starting a new one
  if (activeClient) {
    console.log('[scrcpy] Stopping existing session before starting new one...');
    await stopScrcpyServer();
  }

  // Push the server binary to the device
  await pushServerBinary(adb);

  // Configure scrcpy options with video + control (no audio).
  // Control is enabled for touch/stylus input injection. The
  // AdbScrcpyClient automatically drains the control read stream
  // via its internal #parseDeviceMessages handler, so no deadlock.
  const scrcpyOptions = new AdbScrcpyOptionsLatest<true>({
    video: true as const,
    audio: false,
    control: true,
    // Video settings
    videoCodec: 'h264',
    maxSize: options?.maxSize ?? 1920,
    videoBitRate: options?.videoBitRate ?? 8_000_000,
    maxFps: options?.maxFps ?? 30,
    // Required protocol settings
    tunnelForward: false,
    sendDeviceMeta: true,
    sendFrameMeta: true,
    sendCodecMeta: true,
    sendDummyByte: true,
    // Behavior settings
    powerOn: true,
    cleanup: true,
    stayAwake: false,
    powerOffOnClose: false,
    clipboardAutosync: false,
    downsizeOnError: true,
  });

  console.log('[scrcpy] Starting scrcpy server...');

  let client: AdbScrcpyClient<AdbScrcpyOptionsLatest<true>>;
  try {
    client = await AdbScrcpyClient.start(adb, DEVICE_SERVER_PATH, scrcpyOptions);
  } catch (error) {
    console.error('[scrcpy] Failed to start server:', error);
    throw new Error(
      `Failed to start scrcpy server: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  // Store as active client for cleanup. Use type assertion since the generic
  // parameter (true vs boolean) differs but the underlying class is the same.
  activeClient = client as unknown as AdbScrcpyClient<AdbScrcpyOptionsLatest<boolean>>;

  console.log('[scrcpy] Server started. Waiting for video stream...');

  // Consume the output stream to prevent blocking.
  // This runs in the background and logs server output for debugging.
  const outputReader = client.output.getReader();
  (async () => {
    try {
      while (true) {
        const { done, value } = await outputReader.read();
        if (done) break;
        console.log('[scrcpy:server]', value);
      }
    } catch {
      // Stream closed, expected during shutdown
    }
  })();

  // Get the video stream (this is a Promise that resolves once the stream is ready)
  const videoStreamPromise = client.videoStream;
  if (!videoStreamPromise) {
    await client.close();
    activeClient = null;
    throw new Error('Video stream not available. Video may have been disabled.');
  }

  let videoStream: ScrcpyVideoStreamHandle;
  try {
    // The videoStream getter returns a Promise<AdbScrcpyVideoStream>
    const resolvedStream = await videoStreamPromise;
    videoStream = resolvedStream as unknown as ScrcpyVideoStreamHandle;
  } catch (error) {
    console.error('[scrcpy] Failed to get video stream:', error);
    await client.close();
    activeClient = null;
    throw new Error(
      `Failed to get video stream: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  console.log('[scrcpy] Video stream ready:', {
    codec: videoStream.metadata.codec,
    width: videoStream.metadata.width,
    height: videoStream.metadata.height,
    deviceName: videoStream.metadata.deviceName,
  });

  const stop = async () => {
    try {
      await client.close();
    } catch (error) {
      console.warn('[scrcpy] Error during stop:', error);
    }
    if (activeClient === (client as unknown)) {
      activeClient = null;
    }
  };

  return {
    videoStream,
    codec: videoStream.metadata.codec ?? ScrcpyVideoCodecId.H264,
    controller: client.controller,
    stop,
  };
}

/**
 * Stop the currently active scrcpy session.
 * Safe to call even if no session is active.
 */
export async function stopScrcpyServer(): Promise<void> {
  const client = activeClient;
  activeClient = null;

  if (client) {
    console.log('[scrcpy] Stopping scrcpy server...');
    try {
      await client.close();
    } catch (error) {
      console.warn('[scrcpy] Error stopping server:', error);
    }
    console.log('[scrcpy] Server stopped.');
  }
}

/**
 * Check if there is an active scrcpy session.
 */
export function isScrcpyActive(): boolean {
  return activeClient !== null;
}
