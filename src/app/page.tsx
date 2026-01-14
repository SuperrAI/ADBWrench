'use client';

import { useDevice } from '@/context/device-context';
import Link from 'next/link';
import { TerminalSpinner } from '@/components/ui/TerminalUI';

export default function Home() {
  const { connect, connectionState, isWebUsbSupported, error, deviceInfo } = useDevice();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-background font-mono">
      <div className="w-full max-w-lg">
        {/* Hero Card */}
        <div className="border border-border">
          {/* Header */}
          <div className="border-b border-border p-4">
            <h1 className="text-xl uppercase tracking-wider text-center">ADB Wrench</h1>
            <p className="text-xs text-muted-foreground text-center mt-1">
              Browser-based Android debugging tool
            </p>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Browser Support Check */}
            {!isWebUsbSupported && (
              <div className="border border-red-500 p-4">
                <div className="text-red-500 text-sm font-bold mb-2">[!] BROWSER NOT SUPPORTED</div>
                <p className="text-xs text-muted-foreground">
                  ADB Wrench requires WebUSB. Use Chrome, Edge, or Opera on desktop.
                </p>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="border border-red-500 p-4">
                <div className="text-red-500 text-sm">[!] ERROR: {error}</div>
              </div>
            )}

            {/* Connection States */}
            {connectionState === 'unauthorized' ? (
              <div className="border border-orange-500 p-4">
                <div className="text-orange-500 text-sm font-bold mb-4">[?] AUTHORIZATION REQUIRED</div>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex gap-3">
                    <span className="text-orange-500">[1]</span>
                    <span>Unlock your Android device screen</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-orange-500">[2]</span>
                    <span>Look for "Allow USB debugging?" prompt</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-orange-500">[3]</span>
                    <span>Tap ALLOW (check "Always allow")</span>
                  </div>
                </div>
                <div className="mt-6 text-center">
                  <TerminalSpinner label="WAITING FOR PERMISSION" />
                </div>
              </div>
            ) : connectionState === 'connected' && deviceInfo ? (
              <div className="border border-green-500 p-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 bg-green-500" />
                  <span className="text-green-500 text-sm font-bold">[OK] DEVICE CONNECTED</span>
                </div>

                <div className="space-y-1 text-xs mb-6">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">MODEL</span>
                    <span className="text-foreground">{deviceInfo.model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">MANUFACTURER</span>
                    <span className="text-foreground">{deviceInfo.manufacturer}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">SERIAL</span>
                    <span className="text-foreground">{deviceInfo.serial}</span>
                  </div>
                </div>

                <Link
                  href="/dashboard"
                  className="block w-full py-3 text-center border border-green-500 text-green-500 hover:bg-green-500/10 transition-colors text-sm"
                >
                  [ LAUNCH DASHBOARD ]
                </Link>
              </div>
            ) : connectionState === 'connecting' ? (
              <div className="border border-orange-500 p-4">
                <div className="text-center">
                  <TerminalSpinner label="CONNECTING" />
                </div>
              </div>
            ) : isWebUsbSupported && (
              <div className="space-y-4">
                <button
                  onClick={connect}
                  className="w-full py-4 border border-border hover:border-orange-500 hover:text-orange-500 transition-colors text-sm"
                >
                  [ CONNECT DEVICE ]
                </button>
                <p className="text-[10px] text-muted-foreground text-center">
                  Ensure USB debugging is enabled in Developer Settings
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border px-3 flex items-center justify-between min-h-[36px]">
            <span className="text-[10px] text-muted-foreground">
              CMD+U: CONNECT | ?: HELP
            </span>
            <span className="text-[10px] text-muted-foreground">
              By Superr.ai
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
