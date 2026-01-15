'use client';

import { useEffect } from 'react';
import { useDevice } from '@/context/device-context';
import { TerminalSpinner } from './TerminalUI';

interface DeviceSelectorProps {
  onConnected?: () => void;
}

export function DeviceSelector({ onConnected }: DeviceSelectorProps) {
  const {
    connectionState,
    error,
    connect,
  } = useDevice();

  // Notify parent when connected
  useEffect(() => {
    if (connectionState === 'connected' && onConnected) {
      onConnected();
    }
  }, [connectionState, onConnected]);

  // Connecting state
  if (connectionState === 'connecting') {
    return (
      <div className="text-center py-2">
        <TerminalSpinner label="CONNECTING" />
      </div>
    );
  }

  // Unauthorized state (waiting for device approval)
  if (connectionState === 'unauthorized') {
    return (
      <div>
        <div className="text-orange-500 text-xs font-medium mb-3">[?] CHECK YOUR DEVICE</div>
        <div className="space-y-1.5 text-xs text-muted-foreground mb-4">
          <div>1. Unlock your Android device</div>
          <div>2. Tap ALLOW on the USB debugging prompt</div>
        </div>
        <div className="text-center">
          <TerminalSpinner label="WAITING" />
        </div>
      </div>
    );
  }

  // Default state - show connect button
  return (
    <div>
      <button
        onClick={connect}
        className="w-full py-3 bg-foreground text-background hover:bg-foreground/90 transition-colors text-sm"
      >
        Connect Device
      </button>
      {error && (
        <div className="text-red-500 text-xs mt-3 text-center">[!] {error}</div>
      )}
    </div>
  );
}
