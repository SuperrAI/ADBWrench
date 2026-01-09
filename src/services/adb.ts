/**
 * ADB Service
 *
 * Handles WebUSB device discovery, ADB protocol communication,
 * and connection lifecycle management using @yume-chan/adb libraries.
 */

import { Adb, AdbDaemonTransport } from '@yume-chan/adb';
import { AdbDaemonWebUsbDeviceManager, AdbDaemonWebUsbDevice } from '@yume-chan/adb-daemon-webusb';
import AdbWebCredentialStore from '@yume-chan/adb-credential-web';
import type { DeviceInfo } from '@/context/device-context';

// Credential store for RSA keys (uses IndexedDB)
let credentialStore: AdbWebCredentialStore | null = null;

// Device manager for WebUSB
let deviceManager: AdbDaemonWebUsbDeviceManager | null = null;

// Current ADB connection
let currentAdb: Adb | null = null;
let currentDevice: AdbDaemonWebUsbDevice | null = null;

// Storage key for last connected device
const LAST_DEVICE_SERIAL_KEY = 'superrwrench-last-device';

/**
 * Check if WebUSB is supported in this browser
 */
export function isWebUsbSupported(): boolean {
  return typeof navigator !== 'undefined' && 'usb' in navigator;
}

/**
 * Initialize the ADB credential store
 */
async function getCredentialStore(): Promise<AdbWebCredentialStore> {
  if (!credentialStore) {
    credentialStore = new AdbWebCredentialStore();
  }
  return credentialStore;
}

/**
 * Initialize the device manager
 */
function getDeviceManager(): AdbDaemonWebUsbDeviceManager | undefined {
  if (!isWebUsbSupported()) {
    return undefined;
  }
  if (!deviceManager) {
    deviceManager = new AdbDaemonWebUsbDeviceManager(navigator.usb);
  }
  return deviceManager;
}

/**
 * Request user to select a USB device
 * Returns the selected device or null if cancelled
 */
export async function requestDevice(): Promise<AdbDaemonWebUsbDevice | null> {
  const manager = getDeviceManager();
  if (!manager) {
    throw new Error('WebUSB is not supported in this browser');
  }

  try {
    const device = await manager.requestDevice();
    return device ?? null;
  } catch (error) {
    // User cancelled the picker
    if (error instanceof DOMException && error.name === 'NotFoundError') {
      return null;
    }
    throw error;
  }
}

/**
 * Get list of previously authorized devices
 */
export async function getDevices(): Promise<AdbDaemonWebUsbDevice[]> {
  const manager = getDeviceManager();
  if (!manager) {
    return [];
  }
  return manager.getDevices();
}

/**
 * Connect to a specific device
 */
export async function connectToDevice(
  device: AdbDaemonWebUsbDevice,
  onAuthPending?: () => void
): Promise<{ adb: Adb; deviceInfo: DeviceInfo }> {
  const store = await getCredentialStore();

  // Create transport connection
  const connection = await device.connect();

  // Notify that authentication may be required
  onAuthPending?.();

  // Wrap in transport with authentication
  const transport = await AdbDaemonTransport.authenticate({
    serial: device.serial,
    connection,
    credentialStore: store,
  });

  // Create ADB instance
  const adb = new Adb(transport);

  // Store references
  currentAdb = adb;
  currentDevice = device;

  // Save last connected device serial
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(LAST_DEVICE_SERIAL_KEY, device.serial);
  }

  // Get device info
  const deviceInfo = await getDeviceInfo(adb, device.serial);

  return { adb, deviceInfo };
}

/**
 * Get device information by running shell commands
 */
async function getDeviceInfo(adb: Adb, serial: string): Promise<DeviceInfo> {
  const getProp = async (prop: string): Promise<string> => {
    try {
      // shellProtocol returns WaitResult with stdout, noneProtocol returns string directly
      if (adb.subprocess.shellProtocol) {
        const result = await adb.subprocess.shellProtocol.spawnWaitText(['getprop', prop]);
        return result.stdout.trim();
      } else {
        const result = await adb.subprocess.noneProtocol.spawnWaitText(['getprop', prop]);
        return result.trim();
      }
    } catch {
      return '';
    }
  };

  const [model, manufacturer, device, androidVersion, sdkLevel] = await Promise.all([
    getProp('ro.product.model'),
    getProp('ro.product.manufacturer'),
    getProp('ro.product.device'),
    getProp('ro.build.version.release'),
    getProp('ro.build.version.sdk'),
  ]);

  return {
    serial,
    model: model || 'Unknown Model',
    manufacturer: manufacturer || 'Unknown',
    device: device || 'unknown',
    androidVersion,
    sdkLevel,
  };
}

/**
 * Disconnect from the current device
 */
export async function disconnect(): Promise<void> {
  if (currentAdb) {
    await currentAdb.close();
    currentAdb = null;
  }
  currentDevice = null;
}

/**
 * Get the current ADB connection
 */
export function getCurrentAdb(): Adb | null {
  return currentAdb;
}

/**
 * Get the current connected device
 */
export function getCurrentDevice(): AdbDaemonWebUsbDevice | null {
  return currentDevice;
}

/**
 * Execute a shell command on the device
 */
export async function shell(command: string): Promise<string> {
  if (!currentAdb) {
    throw new Error('No device connected');
  }

  // shellProtocol returns WaitResult with stdout, noneProtocol returns string directly
  if (currentAdb.subprocess.shellProtocol) {
    const result = await currentAdb.subprocess.shellProtocol.spawnWaitText(command.split(' '));
    return result.stdout;
  } else {
    return currentAdb.subprocess.noneProtocol.spawnWaitText(command.split(' '));
  }
}

/**
 * Execute a shell command and stream output
 */
export async function shellStream(
  command: string,
  onOutput: (data: string) => void,
  onError?: (data: string) => void
): Promise<{ exit: () => void }> {
  if (!currentAdb) {
    throw new Error('No device connected');
  }

  // shellProtocol has separate stdout/stderr, noneProtocol has combined output
  if (currentAdb.subprocess.shellProtocol) {
    const process = await currentAdb.subprocess.shellProtocol.spawn(command.split(' '));

    // Read stdout
    (async () => {
      const reader = process.stdout.getReader();
      const decoder = new TextDecoder();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          onOutput(decoder.decode(value, { stream: true }));
        }
      } catch {
        // Stream closed
      }
    })();

    // Read stderr if handler provided
    if (onError) {
      (async () => {
        const reader = process.stderr.getReader();
        const decoder = new TextDecoder();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            onError(decoder.decode(value, { stream: true }));
          }
        } catch {
          // Stream closed
        }
      })();
    }

    return {
      exit: () => {
        process.kill();
      },
    };
  } else {
    // noneProtocol has combined output stream (stdout + stderr mixed)
    const process = await currentAdb.subprocess.noneProtocol.spawn(command.split(' '));

    // Read combined output
    (async () => {
      const reader = process.output.getReader();
      const decoder = new TextDecoder();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          onOutput(decoder.decode(value, { stream: true }));
        }
      } catch {
        // Stream closed
      }
    })();

    return {
      exit: () => {
        process.kill();
      },
    };
  }
}

/**
 * Try to auto-reconnect to the last connected device
 */
export async function tryAutoReconnect(
  onAuthPending?: () => void
): Promise<{ adb: Adb; deviceInfo: DeviceInfo } | null> {
  if (typeof localStorage === 'undefined') {
    return null;
  }

  const lastSerial = localStorage.getItem(LAST_DEVICE_SERIAL_KEY);
  if (!lastSerial) {
    return null;
  }

  const devices = await getDevices();
  const device = devices.find((d) => d.serial === lastSerial);

  if (!device) {
    return null;
  }

  try {
    return await connectToDevice(device, onAuthPending);
  } catch {
    // Device no longer authorized or not connected
    return null;
  }
}

/**
 * Clear the saved device serial
 */
export function clearLastDevice(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(LAST_DEVICE_SERIAL_KEY);
  }
}

/**
 * Capture a screenshot and return as Uint8Array (PNG data)
 */
export async function captureScreenshot(): Promise<Uint8Array> {
  if (!currentAdb) {
    throw new Error('No device connected');
  }

  // Use screencap -p which outputs PNG to stdout
  if (currentAdb.subprocess.shellProtocol) {
    const result = await currentAdb.subprocess.shellProtocol.spawnWait(['screencap', '-p']);
    return result.stdout;
  } else {
    const result = await currentAdb.subprocess.noneProtocol.spawnWait(['screencap', '-p']);
    return result;
  }
}

/**
 * Pull a file from the device
 */
export async function pullFile(remotePath: string): Promise<Uint8Array> {
  if (!currentAdb) {
    throw new Error('No device connected');
  }

  const sync = await currentAdb.sync();
  try {
    const chunks: Uint8Array[] = [];
    const stream = await sync.read(remotePath);
    const reader = stream.getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    // Combine chunks
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    return result;
  } finally {
    await sync.dispose();
  }
}

/**
 * Delete a file on the device
 */
export async function deleteFile(remotePath: string): Promise<void> {
  if (!currentAdb) {
    throw new Error('No device connected');
  }

  await shell(`rm -f ${remotePath}`);
}

/**
 * File entry from directory listing
 */
export interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  permissions: string;
  owner: string;
  group: string;
  modifiedDate: string;
  isSymlink: boolean;
  linkTarget?: string;
}

/**
 * List directory contents
 */
export async function listDirectory(path: string): Promise<FileEntry[]> {
  if (!currentAdb) {
    throw new Error('No device connected');
  }

  // Use ls -la for detailed listing
  const output = await shell(`ls -la "${path}"`);
  const lines = output.trim().split('\n');
  const entries: FileEntry[] = [];

  for (const line of lines) {
    // Skip total line and empty lines
    if (line.startsWith('total') || !line.trim()) continue;

    // Parse ls -la output
    // Format: drwxr-xr-x  2 root root  4096 2024-01-15 10:30 dirname
    // or:     -rw-r--r--  1 root root  1234 2024-01-15 10:30 filename
    // symlink: lrwxrwxrwx  1 root root    12 2024-01-15 10:30 link -> target
    const match = line.match(
      /^([dlrwxs-]{10})\s+\d+\s+(\S+)\s+(\S+)\s+(\d+)\s+(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})\s+(.+)$/
    );

    if (match) {
      const permissions = match[1];
      const owner = match[2];
      const group = match[3];
      const size = parseInt(match[4], 10);
      const modifiedDate = match[5];
      let name = match[6];
      let linkTarget: string | undefined;

      // Handle symlinks
      const isSymlink = permissions.startsWith('l');
      if (isSymlink && name.includes(' -> ')) {
        const parts = name.split(' -> ');
        name = parts[0];
        linkTarget = parts[1];
      }

      // Skip . and ..
      if (name === '.' || name === '..') continue;

      const isDirectory = permissions.startsWith('d');
      const fullPath = path.endsWith('/') ? `${path}${name}` : `${path}/${name}`;

      entries.push({
        name,
        path: fullPath,
        isDirectory,
        size,
        permissions,
        owner,
        group,
        modifiedDate,
        isSymlink,
        linkTarget,
      });
    }
  }

  // Sort: directories first, then by name
  return entries.sort((a, b) => {
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;
    return a.name.localeCompare(b.name);
  });
}

/**
 * Create a directory on the device
 */
export async function createDirectory(path: string): Promise<void> {
  if (!currentAdb) {
    throw new Error('No device connected');
  }

  await shell(`mkdir -p "${path}"`);
}

/**
 * Delete a directory on the device (recursive)
 */
export async function deleteDirectory(path: string): Promise<void> {
  if (!currentAdb) {
    throw new Error('No device connected');
  }

  await shell(`rm -rf "${path}"`);
}

/**
 * Check if a path exists on the device
 */
export async function pathExists(path: string): Promise<boolean> {
  if (!currentAdb) {
    throw new Error('No device connected');
  }

  try {
    const output = await shell(`test -e "${path}" && echo "exists" || echo "not found"`);
    return output.trim() === 'exists';
  } catch {
    return false;
  }
}

/**
 * Push a file to the device with optional progress callback
 */
export async function pushFile(
  remotePath: string,
  data: Uint8Array,
  onProgress?: (progress: number) => void
): Promise<void> {
  if (!currentAdb) {
    throw new Error('No device connected');
  }

  const sync = await currentAdb.sync();
  try {
    // Create a simple readable stream that yields the data in chunks
    const chunkSize = 64 * 1024; // 64KB chunks
    let offset = 0;
    const totalSize = data.length;

    // Create an async iterable that yields chunks
    const chunks: Uint8Array[] = [];
    while (offset < totalSize) {
      chunks.push(data.slice(offset, offset + chunkSize));
      offset += chunkSize;
    }

    // Use the write method with a ReadableStream from array
    const stream = new ReadableStream({
      start(controller) {
        let chunkIndex = 0;
        const totalChunks = chunks.length;

        function pushNext() {
          if (chunkIndex >= totalChunks) {
            controller.close();
            return;
          }

          controller.enqueue(chunks[chunkIndex]);
          chunkIndex++;

          if (onProgress) {
            onProgress(Math.min(100, Math.round((chunkIndex / totalChunks) * 100)));
          }
        }

        // Push all chunks immediately
        while (chunkIndex < totalChunks) {
          controller.enqueue(chunks[chunkIndex]);
          chunkIndex++;
          if (onProgress) {
            onProgress(Math.min(100, Math.round((chunkIndex / totalChunks) * 100)));
          }
        }
        controller.close();
      },
    });

    // The sync.write expects a specific structure - use write with filename and file
    // Cast to any to bypass strict type checking for library compatibility
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await sync.write({
      filename: remotePath,
      file: stream as any,
    });
  } finally {
    await sync.dispose();
  }
}

/**
 * Pull a file with progress callback
 */
export async function pullFileWithProgress(
  remotePath: string,
  onProgress?: (progress: number, total: number) => void
): Promise<Uint8Array> {
  if (!currentAdb) {
    throw new Error('No device connected');
  }

  // First get file size
  let totalSize = 0;
  try {
    const statOutput = await shell(`stat -c %s "${remotePath}"`);
    totalSize = parseInt(statOutput.trim(), 10) || 0;
  } catch {
    // Can't get size, proceed without progress
  }

  const sync = await currentAdb.sync();
  try {
    const chunks: Uint8Array[] = [];
    const stream = await sync.read(remotePath);
    const reader = stream.getReader();
    let downloaded = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      downloaded += value.length;

      if (onProgress && totalSize > 0) {
        onProgress(downloaded, totalSize);
      }
    }

    // Combine chunks
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    return result;
  } finally {
    await sync.dispose();
  }
}
