'use client';

import { useEffect } from 'react';
import { useDevice } from '@/context/device-context';
import { useRouter } from 'next/navigation';
import { TerminalSpinner } from './TerminalUI';

export function ConnectionLostOverlay() {
  const {
    connectionState,
    lastConnectedDevice,
    error,
    tryReconnect,
    dismissConnectionLost,
  } = useDevice();
  const router = useRouter();

  // Determine if overlay should be shown
  const shouldShow =
    (connectionState === 'connection-lost') ||
    (connectionState === 'connecting' && lastConnectedDevice);

  // Lock background scroll when overlay is visible
  useEffect(() => {
    if (shouldShow) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [shouldShow]);

  // Only show when connection is lost
  if (!shouldShow) {
    return null;
  }

  const handleGoHome = () => {
    dismissConnectionLost();
    router.push('/');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm font-mono">
      <div className="w-full max-w-lg mx-4">
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
            {/* Error Display */}
            {error && (
              <div className="border border-red-500 p-4">
                <div className="text-red-500 text-sm">[!] ERROR: {error}</div>
              </div>
            )}

            {/* Reconnecting State */}
            {connectionState === 'connecting' ? (
              <div className="border border-orange-500 p-4">
                <div className="text-center">
                  <TerminalSpinner label="RECONNECTING" />
                </div>
              </div>
            ) : (
              /* Connection Lost State */
              <div className="border border-red-500 p-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 bg-red-500" />
                  <span className="text-red-500 text-sm font-bold">[!] CONNECTION LOST</span>
                </div>

                <p className="text-xs text-muted-foreground mb-4">
                  The USB connection to your device was interrupted.
                </p>

                {/* Last Device Info */}
                {lastConnectedDevice && (
                  <div className="space-y-1 text-xs mb-6 border-t border-border/50 pt-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">DEVICE</span>
                      <span className="text-foreground">{lastConnectedDevice.model}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">SERIAL</span>
                      <span className="text-foreground">{lastConnectedDevice.serial}</span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-2">
                  <button
                    onClick={tryReconnect}
                    className="w-full py-3 text-center border border-orange-500 text-orange-500 hover:bg-orange-500/10 transition-colors text-sm"
                  >
                    [ TRY RECONNECT ]
                  </button>
                  <button
                    onClick={handleGoHome}
                    className="w-full py-3 text-center border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors text-sm"
                  >
                    [ GO HOME ]
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border px-3 flex items-center justify-between min-h-[36px]">
            <span className="text-[10px] text-muted-foreground">
              Reconnect the USB cable to continue
            </span>
            <span className="text-[10px] text-muted-foreground">
              By Superr.ai
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
