'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDevice, type AuthorizedDevice } from '@/context/device-context';
import { TerminalSpinner } from './TerminalUI';

interface DeviceSelectorProps {
  onConnected?: () => void;
}

export function DeviceSelector({ onConnected }: DeviceSelectorProps) {
  const {
    connectionState,
    isWebUsbSupported,
    error,
    connectToDevice,
    requestNewDevice,
    getAuthorizedDevices,
  } = useDevice();

  const [devices, setDevices] = useState<AuthorizedDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSerial, setSelectedSerial] = useState<string | null>(null);

  // Load authorized devices on mount
  const loadDevices = useCallback(async () => {
    setLoading(true);
    const authorizedDevices = await getAuthorizedDevices();
    setDevices(authorizedDevices);
    setLoading(false);
  }, [getAuthorizedDevices]);

  useEffect(() => {
    if (isWebUsbSupported) {
      loadDevices();
    } else {
      setLoading(false);
    }
  }, [isWebUsbSupported, loadDevices]);

  // Notify parent when connected
  useEffect(() => {
    if (connectionState === 'connected' && onConnected) {
      onConnected();
    }
  }, [connectionState, onConnected]);

  const handleSelectDevice = async (serial: string) => {
    setSelectedSerial(serial);
    await connectToDevice(serial);
  };

  const handleAddNewDevice = async () => {
    setSelectedSerial(null);
    await requestNewDevice();
    // Reload devices after adding new one
    await loadDevices();
  };

  // Loading state
  if (loading) {
    return (
      <div className="border border-border p-4">
        <div className="text-center">
          <TerminalSpinner label="SCANNING DEVICES" />
        </div>
      </div>
    );
  }

  // Connecting state
  if (connectionState === 'connecting') {
    return (
      <div className="border border-orange-500 p-4">
        <div className="text-center">
          <TerminalSpinner label="CONNECTING" />
        </div>
      </div>
    );
  }

  // Unauthorized state (waiting for device approval)
  if (connectionState === 'unauthorized') {
    return (
      <div className="border border-orange-500 p-4">
        <div className="text-orange-500 text-sm font-bold mb-4">[?] AUTHORIZATION REQUIRED</div>
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="flex gap-3">
            <span className="text-orange-500">[1]</span>
            <span>Unlock your Android device screen</span>
          </div>
          <div className="flex gap-3">
            <span className="text-orange-500">[2]</span>
            <span>Look for &quot;Allow USB debugging?&quot; prompt</span>
          </div>
          <div className="flex gap-3">
            <span className="text-orange-500">[3]</span>
            <span>Tap ALLOW (check &quot;Always allow&quot;)</span>
          </div>
        </div>
        <div className="mt-6 text-center">
          <TerminalSpinner label="WAITING FOR PERMISSION" />
        </div>
      </div>
    );
  }

  // Error display
  const errorDisplay = error && (
    <div className="border border-red-500 p-4 mb-4">
      <div className="text-red-500 text-sm">[!] {error}</div>
    </div>
  );

  // No authorized devices - show only add new button
  if (devices.length === 0) {
    return (
      <div className="space-y-4">
        {errorDisplay}
        <div className="border border-border p-4">
          <div className="text-xs text-muted-foreground text-center mb-4">
            NO AUTHORIZED DEVICES FOUND
          </div>
          <button
            onClick={handleAddNewDevice}
            className="w-full py-3 border border-border hover:border-orange-500 hover:text-orange-500 transition-colors text-sm"
          >
            [ CONNECT NEW DEVICE ]
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground text-center">
          Ensure USB debugging is enabled in Developer Settings
        </p>
      </div>
    );
  }

  // Show authorized devices list
  return (
    <div className="space-y-4">
      {errorDisplay}

      <div className="border border-border">
        <div className="border-b border-border p-3">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">
            AUTHORIZED DEVICES ({devices.length})
          </div>
        </div>

        <div className="divide-y divide-border">
          {devices.map((device) => (
            <button
              key={device.serial}
              onClick={() => handleSelectDevice(device.serial)}
              className={`w-full p-3 text-left hover:bg-muted/50 transition-colors ${
                selectedSerial === device.serial ? 'bg-muted/30' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm">{device.name}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">
                    {device.serial}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">[ SELECT ]</span>
              </div>
            </button>
          ))}
        </div>

        <div className="border-t border-border p-3">
          <button
            onClick={handleAddNewDevice}
            className="w-full py-2 border border-dashed border-border hover:border-orange-500 hover:text-orange-500 transition-colors text-xs"
          >
            + ADD NEW DEVICE
          </button>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground text-center">
        Select a device or add a new one
      </p>
    </div>
  );
}
