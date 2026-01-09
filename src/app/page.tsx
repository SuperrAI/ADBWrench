'use client';

import { Button } from '@/design-system/components/Button';
import { useDevice } from '@/context/device-context';
import Link from 'next/link';

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

export default function Home() {
  const { connect, connectionState } = useDevice();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-background">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-foreground">SuperrWrench</h1>
        <p className="text-lg text-muted-foreground">
          Browser-based Android device debugging and management
        </p>
        <p className="text-sm text-muted-foreground/70 max-w-md mx-auto">
          Connect your Android device via USB to get started. Make sure USB debugging is enabled in Developer Options.
        </p>
        <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center items-center">
          {connectionState === 'disconnected' && (
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
          {connectionState === 'connected' && (
            <Link href="/dashboard">
              <Button variant="primary" size="large">
                Go to Dashboard
              </Button>
            </Link>
          )}
        </div>
        <p className="text-xs text-muted-foreground/50 pt-4">
          Press <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">?</kbd> for keyboard shortcuts
        </p>
      </div>
    </main>
  );
}
