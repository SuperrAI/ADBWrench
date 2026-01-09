'use client';

import { createContext, useContext, useState, useEffect, PropsWithChildren, useCallback } from 'react';
import * as adbService from '@/services/adb';

export type ConnectionState = 'disconnected' | 'connecting' | 'unauthorized' | 'connected';

export interface DeviceInfo {
  serial: string;
  model: string;
  manufacturer: string;
  device: string;
  androidVersion?: string;
  sdkLevel?: string;
}

interface DeviceContextType {
  connectionState: ConnectionState;
  deviceInfo: DeviceInfo | null;
  error: string | null;
  isWebUsbSupported: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  tryReconnect: () => Promise<void>;
  shell: (command: string) => Promise<string>;
}

const DeviceContext = createContext<DeviceContextType>({
  connectionState: 'disconnected',
  deviceInfo: null,
  error: null,
  isWebUsbSupported: false,
  connect: async () => {},
  disconnect: async () => {},
  tryReconnect: async () => {},
  shell: async () => '',
});

export function DeviceProvider({ children }: PropsWithChildren) {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isWebUsbSupported, setIsWebUsbSupported] = useState(false);

  // Check WebUSB support on mount
  useEffect(() => {
    setIsWebUsbSupported(adbService.isWebUsbSupported());
  }, []);

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

  const connect = useCallback(async () => {
    if (!isWebUsbSupported) {
      setError('WebUSB is not supported in this browser. Please use Chrome, Edge, or Opera.');
      return;
    }

    setConnectionState('connecting');
    setError(null);

    try {
      // Request device from user
      const device = await adbService.requestDevice();

      if (!device) {
        // User cancelled
        setConnectionState('disconnected');
        return;
      }

      // Connect to the device
      const result = await adbService.connectToDevice(device, () => {
        // Called when waiting for user authorization on device
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
        setConnectionState('connected');
      } else {
        setConnectionState('disconnected');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reconnect';
      setError(message);
      setConnectionState('disconnected');
    }
  }, [isWebUsbSupported]);

  const shell = useCallback(async (command: string): Promise<string> => {
    if (connectionState !== 'connected') {
      throw new Error('No device connected');
    }
    return adbService.shell(command);
  }, [connectionState]);

  return (
    <DeviceContext.Provider
      value={{
        connectionState,
        deviceInfo,
        error,
        isWebUsbSupported,
        connect,
        disconnect,
        tryReconnect,
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
