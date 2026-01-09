'use client';

import { createContext, useContext, useState, PropsWithChildren, useCallback } from 'react';

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
  connect: () => Promise<void>;
  disconnect: () => void;
  setConnectionState: (state: ConnectionState) => void;
  setDeviceInfo: (info: DeviceInfo | null) => void;
  setError: (error: string | null) => void;
}

const DeviceContext = createContext<DeviceContextType>({
  connectionState: 'disconnected',
  deviceInfo: null,
  error: null,
  connect: async () => {},
  disconnect: () => {},
  setConnectionState: () => {},
  setDeviceInfo: () => {},
  setError: () => {},
});

export function DeviceProvider({ children }: PropsWithChildren) {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    // Placeholder for ADB connection logic (Ticket 3)
    // This will be implemented in F1 - Device Connection Manager
    setConnectionState('connecting');
    setError(null);

    // For now, just show that we're attempting to connect
    // The actual WebUSB + ADB implementation will come in Ticket 3
    console.log('Device connection will be implemented in Ticket 3');
  }, []);

  const disconnect = useCallback(() => {
    setConnectionState('disconnected');
    setDeviceInfo(null);
    setError(null);
  }, []);

  return (
    <DeviceContext.Provider
      value={{
        connectionState,
        deviceInfo,
        error,
        connect,
        disconnect,
        setConnectionState,
        setDeviceInfo,
        setError,
      }}
    >
      {children}
    </DeviceContext.Provider>
  );
}

export function useDevice() {
  return useContext(DeviceContext);
}
