'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useDevice, ConnectionState } from '@/context/device-context';
import { Button } from '@/design-system/components/Button';
import { Pill } from '@/design-system/components/Pills';
import { ThemeToggle } from './ThemeToggle';
import { textStyles } from '@/design-system/foundations/typography';
import { Green, Red, Orange, Neutral } from '@/design-system/foundations/colors';

// Status indicator dot
const StatusDot = ({ state }: { state: ConnectionState }) => {
  const colors: Record<ConnectionState, string> = {
    disconnected: Neutral.N400,
    connecting: Orange.O500,
    unauthorized: Red.R500,
    connected: Green.G500,
    'connection-lost': Red.R500,
  };

  return (
    <span
      className="inline-block w-2 h-2 rounded-full"
      style={{ backgroundColor: colors[state] }}
    />
  );
};

// USB icon
const UsbIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M8 1V11M8 1L5 4M8 1L11 4"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="8" cy="14" r="1.5" stroke="currentColor" strokeWidth="1.2" />
    <path
      d="M4 8H6V10H4V8Z"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10 6L12 8L10 10"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Disconnect icon
const DisconnectIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 4L4 12M4 4L12 12"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

interface TopBarProps {
  className?: string;
}

export function TopBar({ className }: TopBarProps) {
  const { connectionState, deviceInfo, error, isWebUsbSupported, connect, disconnect } = useDevice();

  const getStatusLabel = (): string => {
    switch (connectionState) {
      case 'disconnected':
        return 'Disconnected';
      case 'connecting':
        return 'Connecting...';
      case 'unauthorized':
        return 'Unauthorized';
      case 'connected':
        return 'Connected';
      default:
        return 'Unknown';
    }
  };

  const getStatusPillVariant = (): 'default' | 'category' | 'outline' => {
    switch (connectionState) {
      case 'connected':
        return 'category'; // Orange pill for connected (success state)
      case 'connecting':
      case 'unauthorized':
        return 'outline'; // Outline for intermediate states
      default:
        return 'default'; // Default gray for disconnected
    }
  };

  return (
    <div
      className={cn(
        'flex items-center justify-between w-full px-4 py-3 border-b',
        'bg-background border-border',
        className
      )}
    >
      {/* Left side: Connection status */}
      <div className="flex items-center gap-3">
        <Pill
          variant={getStatusPillVariant()}
          icon={<StatusDot state={connectionState} />}
          label={getStatusLabel()}
        />

        {/* Device info when connected */}
        {connectionState === 'connected' && deviceInfo && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span style={{ ...textStyles.body2Med }}>
              {deviceInfo.manufacturer} {deviceInfo.model}
            </span>
            <span className="text-muted-foreground/50">|</span>
            <span style={{ ...textStyles.labelSansMed }} className="text-muted-foreground">
              {deviceInfo.serial}
            </span>
          </div>
        )}

        {/* Unauthorized message */}
        {connectionState === 'unauthorized' && (
          <span className="text-sm" style={{ color: Orange.O600 }}>
            Please accept the USB debugging prompt on your device
          </span>
        )}

        {/* Error message */}
        {error && connectionState === 'disconnected' && (
          <span className="text-sm" style={{ color: Red.R500 }}>
            {error}
          </span>
        )}
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-2">
        {connectionState === 'disconnected' && (
          <Button
            variant="primary"
            size="small"
            icon={<UsbIcon />}
            onClick={connect}
            disabled={!isWebUsbSupported}
          >
            {isWebUsbSupported ? 'Connect Device' : 'WebUSB Not Supported'}
          </Button>
        )}

        {connectionState === 'connecting' && (
          <Button
            variant="loading"
            size="small"
            loadingText="Connecting"
          />
        )}

        {connectionState === 'connected' && (
          <Button
            variant="ghost"
            size="small"
            icon={<DisconnectIcon />}
            onClick={disconnect}
          >
            Disconnect
          </Button>
        )}

        <div className="w-px h-6 bg-border mx-1" />

        <ThemeToggle />
      </div>
    </div>
  );
}

export default TopBar;
