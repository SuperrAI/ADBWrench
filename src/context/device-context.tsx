'use client';

import { createContext, useContext, useState, useEffect, PropsWithChildren, useCallback } from 'react';
import * as adbService from '@/services/adb';

export type ConnectionState = 'disconnected' | 'connecting' | 'unauthorized' | 'connected' | 'connection-lost';

// Helper to detect USB transfer/connection errors
function isConnectionError(error: unknown): boolean {
  if (error instanceof DOMException) {
    // Handle specific DOMException types
    if (error.name === 'NotFoundError' || error.name === 'NetworkError') {
      return true;
    }
  }
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    const name = error.name?.toLowerCase() || '';
    return (
      name === 'notfounderror' ||
      name === 'networkerror' ||
      message.includes('transfer error') ||
      message.includes('device unavailable') ||
      message.includes('device has been lost') ||
      message.includes('no device connected') ||
      message.includes('the device was disconnected') ||
      message.includes('transferin') ||
      message.includes('networkerror')
    );
  }
  return false;
}

export interface DeviceInfo {
  serial: string;
  model: string;
  manufacturer: string;
  device: string;
  androidVersion?: string;
  sdkLevel?: string;
}

export interface AuthorizedDevice {
  serial: string;
  name: string;
}

interface DeviceContextType {
  connectionState: ConnectionState;
  deviceInfo: DeviceInfo | null;
  lastConnectedDevice: DeviceInfo | null;
  error: string | null;
  isWebUsbSupported: boolean;
  connect: () => Promise<void>;
  connectToDevice: (serial: string) => Promise<void>;
  requestNewDevice: () => Promise<void>;
  getAuthorizedDevices: () => Promise<AuthorizedDevice[]>;
  disconnect: () => Promise<void>;
  tryReconnect: () => Promise<void>;
  dismissConnectionLost: () => void;
  handleConnectionError: (error: unknown) => boolean;
  shell: (command: string) => Promise<string>;
}

const DeviceContext = createContext<DeviceContextType>({
  connectionState: 'disconnected',
  deviceInfo: null,
  lastConnectedDevice: null,
  error: null,
  isWebUsbSupported: false,
  connect: async () => {},
  connectToDevice: async () => {},
  requestNewDevice: async () => {},
  getAuthorizedDevices: async () => [],
  disconnect: async () => {},
  tryReconnect: async () => {},
  dismissConnectionLost: () => {},
  handleConnectionError: () => false,
  shell: async () => '',
});

export function DeviceProvider({ children }: PropsWithChildren) {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [lastConnectedDevice, setLastConnectedDevice] = useState<DeviceInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Initialize WebUSB support synchronously to avoid flicker
  const [isWebUsbSupported] = useState(() => {
    if (typeof window === 'undefined') return false;
    return adbService.isWebUsbSupported();
  });

  // Try to auto-reconnect on mount
  useEffect(() => {
    if (!isWebUsbSupported) return;

    const autoConnect = async () => {
      try {
        const result = await adbService.tryAutoReconnect(() => {
          setConnectionState('unauthorized');
        });

        if (result) {
          setDeviceInfo(result.deviceInfo);
          setConnectionState('connected');
        }
      } catch {
        // Silent fail for auto-reconnect
      }
    };

    autoConnect();
  }, [isWebUsbSupported]);

  // Listen for USB connect events - for auto-detection when a device is plugged in
  useEffect(() => {
    if (!isWebUsbSupported || typeof navigator === 'undefined' || !navigator.usb) return;

    const handleConnect = async () => {
      // Only try auto-connect if we're in disconnected state
      if (connectionState !== 'disconnected') return;

      try {
        const result = await adbService.tryAutoReconnect(() => {
          setConnectionState('unauthorized');
        });

        if (result) {
          setDeviceInfo(result.deviceInfo);
          setConnectionState('connected');
        }
      } catch {
        // Silent fail for auto-reconnect
      }
    };

    navigator.usb.addEventListener('connect', handleConnect);
    return () => {
      navigator.usb.removeEventListener('connect', handleConnect);
    };
  }, [isWebUsbSupported, connectionState]);

  // Listen for USB disconnect events
  useEffect(() => {
    if (!isWebUsbSupported || typeof navigator === 'undefined' || !navigator.usb) return;

    const handleDisconnect = (event: USBConnectionEvent) => {
      const currentDevice = adbService.getCurrentDevice();
      if (currentDevice && event.device === currentDevice.raw) {
        // Store the last connected device info before clearing
        setLastConnectedDevice(deviceInfo);
        setDeviceInfo(null);
        setConnectionState('connection-lost');
        // Clean up the ADB connection - wrap in try-catch since device may already be gone
        try {
          adbService.disconnect().catch(() => {});
        } catch {
          // Ignore errors - device is already disconnected
        }
      }
    };

    navigator.usb.addEventListener('disconnect', handleDisconnect);
    return () => {
      navigator.usb.removeEventListener('disconnect', handleDisconnect);
    };
  }, [isWebUsbSupported, deviceInfo]);

  // Dismiss connection lost and go back to disconnected state
  const dismissConnectionLost = useCallback(() => {
    setConnectionState('disconnected');
    setLastConnectedDevice(null);
    setError(null);
  }, []);

  // Handle connection errors from any component - returns true if it was a connection error
  const handleConnectionError = useCallback((error: unknown): boolean => {
    if (isConnectionError(error) && connectionState === 'connected') {
      setLastConnectedDevice(deviceInfo);
      setDeviceInfo(null);
      setConnectionState('connection-lost');
      adbService.disconnect().catch(() => {});
      return true;
    }
    return false;
  }, [connectionState, deviceInfo]);

  // Get list of previously authorized devices
  const getAuthorizedDevices = useCallback(async (): Promise<AuthorizedDevice[]> => {
    if (!isWebUsbSupported) return [];
    try {
      const devices = await adbService.getDevices();
      const authorizedDevices: AuthorizedDevice[] = [];

      for (const d of devices) {
        try {
          // Accessing properties on a disconnected device throws an error
          // Access each property separately to catch errors properly
          const serial = d.serial;
          let name = serial;
          try {
            name = d.name || serial;
          } catch {
            // name access failed, use serial
          }
          authorizedDevices.push({ serial, name });
        } catch (err) {
          // Device was disconnected or USB transfer error, skip it
          console.warn('Error accessing device properties:', err);
        }
      }

      return authorizedDevices;
    } catch (err) {
      console.warn('Error getting authorized devices:', err);
      return [];
    }
  }, [isWebUsbSupported]);

  // Connect to a specific authorized device by serial
  const connectToDevice = useCallback(async (serial: string) => {
    if (!isWebUsbSupported) {
      setError('WebUSB is not supported in this browser.');
      return;
    }

    setConnectionState('connecting');
    setError(null);

    try {
      const devices = await adbService.getDevices();

      // Find device by serial, handling disconnected devices that throw on property access
      let device: Awaited<ReturnType<typeof adbService.getDevices>>[0] | undefined;
      for (const d of devices) {
        try {
          if (d.serial === serial) {
            device = d;
            break;
          }
        } catch {
          // Device disconnected, skip it
        }
      }

      if (!device) {
        setError('Device not found. It may have been disconnected.');
        setConnectionState('disconnected');
        return;
      }

      const result = await adbService.connectToDevice(device, () => {
        setConnectionState('unauthorized');
      });

      setDeviceInfo(result.deviceInfo);
      setConnectionState('connected');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect to device';
      setError(message);
      setConnectionState('disconnected');
    }
  }, [isWebUsbSupported]);

  // Request a new device via browser picker
  const requestNewDevice = useCallback(async () => {
    if (!isWebUsbSupported) {
      setError('WebUSB is not supported in this browser.');
      return;
    }

    setConnectionState('connecting');
    setError(null);

    try {
      const device = await adbService.requestDevice();

      if (!device) {
        setConnectionState('disconnected');
        return;
      }

      const result = await adbService.connectToDevice(device, () => {
        setConnectionState('unauthorized');
      });

      setDeviceInfo(result.deviceInfo);
      setConnectionState('connected');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect to device';
      setError(message);
      setConnectionState('disconnected');
    }
  }, [isWebUsbSupported]);

  // Smart connect - tries already-paired devices first, then falls back to browser picker
  const connect = useCallback(async () => {
    if (!isWebUsbSupported) {
      setError('WebUSB is not supported in this browser. Please use Chrome, Edge, or Opera.');
      return;
    }

    setConnectionState('connecting');
    setError(null);

    try {
      // First, try to connect to an already-paired device
      const result = await adbService.tryAutoReconnect(() => {
        setConnectionState('unauthorized');
      });

      if (result) {
        // Successfully connected to a paired device
        setDeviceInfo(result.deviceInfo);
        setConnectionState('connected');
        return;
      }

      // No paired devices available, show browser picker
      const device = await adbService.requestDevice();

      if (!device) {
        // User cancelled
        setConnectionState('disconnected');
        return;
      }

      // Connect to the selected device
      const connectResult = await adbService.connectToDevice(device, () => {
        // Called when waiting for user authorization on device
        setConnectionState('unauthorized');
      });

      setDeviceInfo(connectResult.deviceInfo);
      setConnectionState('connected');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect to device';
      setError(message);
      setConnectionState('disconnected');
    }
  }, [isWebUsbSupported]);

  const disconnect = useCallback(async () => {
    try {
      await adbService.disconnect();
    } catch {
      // Ignore disconnect errors
    }
    setConnectionState('disconnected');
    setDeviceInfo(null);
    setError(null);
  }, []);

  const tryReconnect = useCallback(async () => {
    if (!isWebUsbSupported) return;

    setConnectionState('connecting');
    setError(null);

    try {
      const result = await adbService.tryAutoReconnect(() => {
        setConnectionState('unauthorized');
      });

      if (result) {
        setDeviceInfo(result.deviceInfo);
        setLastConnectedDevice(null);
        setConnectionState('connected');
      } else {
        // If reconnect failed from connection-lost, stay in connection-lost
        // Otherwise go to disconnected
        setConnectionState(lastConnectedDevice ? 'connection-lost' : 'disconnected');
      }
    } catch (err) {
      // Don't show connection errors (NotFoundError, NetworkError) as error messages
      // These are expected when device is unplugged
      if (!isConnectionError(err)) {
        const message = err instanceof Error ? err.message : 'Failed to reconnect';
        setError(message);
      }
      // If reconnect failed from connection-lost, stay in connection-lost
      setConnectionState(lastConnectedDevice ? 'connection-lost' : 'disconnected');
    }
  }, [isWebUsbSupported, lastConnectedDevice]);

  const shell = useCallback(async (command: string): Promise<string> => {
    if (connectionState !== 'connected') {
      throw new Error('No device connected');
    }
    try {
      return await adbService.shell(command);
    } catch (err) {
      // Check if this is a connection error and handle it
      if (isConnectionError(err) && deviceInfo) {
        setLastConnectedDevice(deviceInfo);
        setDeviceInfo(null);
        setConnectionState('connection-lost');
        adbService.disconnect().catch(() => {});
      }
      throw err;
    }
  }, [connectionState, deviceInfo]);

  return (
    <DeviceContext.Provider
      value={{
        connectionState,
        deviceInfo,
        lastConnectedDevice,
        error,
        isWebUsbSupported,
        connect,
        connectToDevice,
        requestNewDevice,
        getAuthorizedDevices,
        disconnect,
        tryReconnect,
        dismissConnectionLost,
        handleConnectionError,
        shell,
      }}
    >
      {children}
    </DeviceContext.Provider>
  );
}

export function useDevice() {
  return useContext(DeviceContext);
}
