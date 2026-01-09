'use client';

import { Button } from '@/design-system/components/Button';
import { useDevice } from '@/context/device-context';
import { Pill } from '@/design-system/components/Pills';
import Link from 'next/link';
import { Red, Amber } from '@/design-system/foundations/colors';

const UsbIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M10 2V14M10 2L7 5M10 2L13 5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="10" cy="17" r="2" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M5 10H7V12H5V10Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M13 8L15 10L13 12"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const WarningIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M8 5.33333V8M8 10.6667H8.00667M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2C11.3137 2 14 4.68629 14 8Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CheckIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M13.3334 4L6.00002 11.3333L2.66669 8"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function Home() {
  const { connect, connectionState, isWebUsbSupported, error, deviceInfo } = useDevice();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-background">
      <div className="text-center space-y-6 max-w-lg">
        <h1 className="text-4xl font-bold text-foreground">SuperrWrench</h1>
        <p className="text-lg text-muted-foreground">
          Browser-based Android device debugging and management
        </p>

        {/* Browser compatibility warning */}
        {!isWebUsbSupported && (
          <div
            className="flex items-center gap-3 p-4 rounded-lg border"
            style={{ borderColor: Red.R300, backgroundColor: `${Red.R50}` }}
          >
            <span style={{ color: Red.R500 }}>
              <WarningIcon />
            </span>
            <div className="text-left">
              <p className="text-sm font-medium" style={{ color: Red.R700 }}>
                Browser Not Supported
              </p>
              <p className="text-xs" style={{ color: Red.R600 }}>
                WebUSB is required. Please use Chrome, Edge, or Opera on desktop.
              </p>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div
            className="flex items-center gap-3 p-4 rounded-lg border"
            style={{ borderColor: Red.R300, backgroundColor: `${Red.R50}` }}
          >
            <span style={{ color: Red.R500 }}>
              <WarningIcon />
            </span>
            <p className="text-sm text-left" style={{ color: Red.R700 }}>
              {error}
            </p>
          </div>
        )}

        {/* Unauthorized state - waiting for device approval */}
        {connectionState === 'unauthorized' && (
          <div
            className="flex items-center gap-3 p-4 rounded-lg border"
            style={{ borderColor: Amber.A300, backgroundColor: `${Amber.A50}` }}
          >
            <span style={{ color: Amber.A600 }}>
              <WarningIcon />
            </span>
            <div className="text-left">
              <p className="text-sm font-medium" style={{ color: Amber.A700 }}>
                Authorization Required
              </p>
              <p className="text-xs" style={{ color: Amber.A600 }}>
                Please check your Android device and tap &quot;Allow&quot; on the USB debugging prompt.
              </p>
            </div>
          </div>
        )}

        {/* Connected state */}
        {connectionState === 'connected' && deviceInfo && (
          <div className="flex items-center justify-center gap-2">
            <Pill
              variant="category"
              icon={<CheckIcon />}
              label={`Connected to ${deviceInfo.manufacturer} ${deviceInfo.model}`}
            />
          </div>
        )}

        {/* Instructions */}
        {isWebUsbSupported && connectionState === 'disconnected' && (
          <p className="text-sm text-muted-foreground/70">
            Connect your Android device via USB to get started.
            <br />
            Make sure USB debugging is enabled in Developer Options.
          </p>
        )}

        {/* Action buttons */}
        <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center items-center">
          {connectionState === 'disconnected' && isWebUsbSupported && (
            <Button
              variant="primary"
              size="large"
              icon={<UsbIcon />}
              onClick={connect}
            >
              Connect Device
            </Button>
          )}
          {connectionState === 'connecting' && (
            <Button
              variant="loading"
              size="large"
              loadingText="Connecting..."
            />
          )}
          {connectionState === 'unauthorized' && (
            <Button
              variant="loading"
              size="large"
              loadingText="Waiting for authorization..."
            />
          )}
          {connectionState === 'connected' && (
            <Link href="/dashboard">
              <Button variant="primary" size="large">
                Go to Dashboard
              </Button>
            </Link>
          )}
        </div>

        {/* Help text */}
        <div className="pt-4 space-y-2">
          <p className="text-xs text-muted-foreground/50">
            Press <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">?</kbd> for keyboard shortcuts
          </p>
          {isWebUsbSupported && connectionState === 'disconnected' && (
            <p className="text-xs text-muted-foreground/40">
              Press <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">Cmd+U</kbd> to connect
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
