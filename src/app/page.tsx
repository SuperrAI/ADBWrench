'use client';

import { useDevice } from '@/context/device-context';
import Link from 'next/link';
import { DeviceSelector } from '@/components/ui/DeviceSelector';

export default function Home() {
  const { connectionState, isWebUsbSupported, deviceInfo } = useDevice();

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

            {/* Connected State */}
            {connectionState === 'connected' && deviceInfo ? (
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
            ) : isWebUsbSupported && (
              /* Device Selector handles: disconnected, connecting, unauthorized states */
              <DeviceSelector />
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
