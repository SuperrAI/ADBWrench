'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageLayout } from '@/design-system/patterns/PageLayout/PageLayout';
import { useDevice } from '@/context/device-context';
import {
  fetchAllDeviceInfo,
  formatDeviceInfoText,
  type FullDeviceInfo
} from '@/services/device-info';
import {
  TerminalLoadingState,
  TerminalGrid,
  TerminalGridCell,
} from '@/components/ui/TerminalUI';

// Auto-refresh intervals
const AUTO_REFRESH_INTERVALS = [
  { label: 'OFF', value: 0 },
  { label: '5S', value: 5000 },
  { label: '10S', value: 10000 },
  { label: '30S', value: 30000 },
];

// Copyable value component
function CopyableValue({
  value,
  label,
  className = ''
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const textToCopy = label ? `${label}: ${value}` : value;
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    } catch {}
  };

  return (
    <span
      onClick={handleCopy}
      className={`cursor-pointer hover:text-orange-500 transition-colors ${copied ? 'text-orange-500' : ''} ${className}`}
      title="Click to copy"
    >
      {copied ? 'Copied!' : value}
    </span>
  );
}


export default function DashboardPage() {
  const { connectionState, deviceInfo, handleConnectionError } = useDevice();
  const [fullInfo, setFullInfo] = useState<FullDeviceInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(0);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchInfo = useCallback(async () => {
    if (connectionState !== 'connected' || !deviceInfo) return;

    setLoading(true);
    setError(null);

    try {
      const info = await fetchAllDeviceInfo(deviceInfo.serial);
      setFullInfo(info);
      setLastRefresh(new Date());
    } catch (err) {
      // Check if this is a connection error (device unplugged)
      if (!handleConnectionError(err)) {
        setError(err instanceof Error ? err.message : 'Failed to fetch device info');
      }
    } finally {
      setLoading(false);
    }
  }, [connectionState, deviceInfo, handleConnectionError]);

  useEffect(() => {
    if (connectionState === 'connected' && deviceInfo && !fullInfo) {
      fetchInfo();
    }
  }, [connectionState, deviceInfo, fullInfo, fetchInfo]);

  useEffect(() => {
    if (connectionState !== 'connected') {
      setFullInfo(null);
      setLastRefresh(null);
    }
  }, [connectionState]);

  useEffect(() => {
    if (autoRefresh === 0 || connectionState !== 'connected') return;
    const interval = setInterval(fetchInfo, autoRefresh);
    return () => clearInterval(interval);
  }, [autoRefresh, connectionState, fetchInfo]);

  const handleCopyAll = async () => {
    if (!fullInfo) return;
    try {
      const text = formatDeviceInfoText(fullInfo);
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard fail
    }
  };

  // Not connected state
  if (connectionState !== 'connected') {
    return (
      <PageLayout>
        <div className="h-full flex items-center justify-center p-8 font-mono">
          <div className="text-center">
            <pre className="text-muted-foreground mb-4 text-xs">
{`    _____
   |     |
   | [X] |
   |_____|
     | |`}
            </pre>
            <div className="text-sm mb-2">NO DEVICE CONNECTED</div>
            <div className="text-xs text-muted-foreground">
              Connect an Android device via USB to continue.
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="h-full flex flex-col font-mono">
        {/* Header */}
        <div className="border-b border-border p-3 flex-shrink-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-sm uppercase tracking-wider">
                DASHBOARD // {deviceInfo?.model || 'DEVICE'}
              </h1>
              <div className="text-xs text-muted-foreground mt-1">
                LAST UPDATE: {lastRefresh ? lastRefresh.toLocaleTimeString() : '--:--:--'}
                {autoRefresh > 0 && <span className="text-green-500 ml-2">[AUTO]</span>}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Auto-refresh selector */}
              <div className="flex items-center border border-border text-xs">
                {AUTO_REFRESH_INTERVALS.map((opt, i) => (
                  <button
                    key={opt.value}
                    onClick={() => setAutoRefresh(opt.value)}
                    className={`px-2 py-1 ${
                      autoRefresh === opt.value
                        ? 'bg-foreground text-background'
                        : 'hover:bg-muted'
                    } ${i > 0 ? 'border-l border-border' : ''}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <button
                onClick={fetchInfo}
                disabled={loading}
                className="w-[100px] py-1 border border-border text-xs hover:bg-muted disabled:opacity-50 text-center"
              >
                [ {loading ? '...' : 'REFRESH'} ]
              </button>

              <button
                onClick={handleCopyAll}
                disabled={!fullInfo}
                className="w-[100px] py-1 border border-foreground bg-foreground text-background text-xs hover:bg-foreground/90 disabled:opacity-50 text-center"
              >
                [ {copied ? 'COPIED!' : 'EXPORT'} ]
              </button>
            </div>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="border-b border-red-500 p-3 text-red-500 text-xs">
            [!] ERROR: {error}
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 overflow-auto p-4">
          {loading && !fullInfo ? (
            <TerminalLoadingState label="LOADING DEVICE INFO" sublabel="Fetching device properties..." />
          ) : fullInfo ? (
            <div className="space-y-4">
              {/* Top row - Identity & Battery & Storage */}
              <TerminalGrid cols={3}>
                {/* Device Identity */}
                <TerminalGridCell className="flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">DEVICE IDENTITY</div>
                    <div className="text-right">
                      <div className="text-lg font-bold"><CopyableValue value={fullInfo.identity.model} label="Model" /></div>
                      <div className="text-[10px] text-muted-foreground"><CopyableValue value={fullInfo.identity.manufacturer} label="Manufacturer" /></div>
                    </div>
                  </div>
                  <div className="flex-1" />
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between border-b border-border/50 pb-2">
                      <span className="text-muted-foreground">CODENAME</span>
                      <CopyableValue value={fullInfo.identity.device} label="Codename" />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">SERIAL</span>
                      <CopyableValue value={fullInfo.identity.serial} label="Serial Number" className="font-mono text-[10px]" />
                    </div>
                  </div>
                </TerminalGridCell>

                {/* Battery */}
                <TerminalGridCell>
                  <div className="flex justify-between items-start mb-3">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">POWER & BATTERY</div>
                    <div className="text-right">
                      <div className="text-xl font-bold"><CopyableValue value={`${fullInfo.battery.level}%`} label="Battery Level" /></div>
                      <div className="text-[10px] text-muted-foreground"><CopyableValue value={fullInfo.battery.status} label="Battery Status" /></div>
                    </div>
                  </div>
                  <div className="w-full bg-muted/30 h-6 mb-4">
                    <div
                      className="h-full bg-green-500"
                      style={{ width: `${fullInfo.battery.level}%` }}
                    />
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between border-b border-border/50 pb-2">
                      <span className="text-muted-foreground">HEALTH</span>
                      <CopyableValue value={fullInfo.battery.health} label="Battery Health" />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">TEMP</span>
                      <CopyableValue value={`${(Number(fullInfo.battery.temperature) / 10).toFixed(1)}°C`} label="Battery Temperature" />
                    </div>
                  </div>
                </TerminalGridCell>

                {/* Storage */}
                <TerminalGridCell>
                  <div className="flex justify-between items-start mb-3">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">STORAGE</div>
                    <div className="text-right">
                      <div className="text-xl font-bold"><CopyableValue value={`${fullInfo.storage.usagePercent}%`} label="Storage Used" /></div>
                      <div className="text-[10px] text-muted-foreground">USED</div>
                    </div>
                  </div>
                  <div className="w-full bg-muted/30 h-6 mb-4">
                    <div
                      className="h-full bg-orange-500"
                      style={{ width: `${fullInfo.storage.usagePercent}%` }}
                    />
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between border-b border-border/50 pb-2">
                      <span className="text-muted-foreground">TOTAL</span>
                      <CopyableValue value={fullInfo.storage.totalStorage} label="Total Storage" />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">FREE</span>
                      <CopyableValue value={fullInfo.storage.availableStorage} label="Free Storage" />
                    </div>
                  </div>
                </TerminalGridCell>
              </TerminalGrid>

              {/* Hardware & Software */}
              <TerminalGrid cols={2}>
                {/* Hardware */}
                <TerminalGridCell>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3">HARDWARE SPECS</div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between border-b border-border/50 pb-2">
                      <span className="text-muted-foreground">PLATFORM</span>
                      <CopyableValue value={fullInfo.hardware.hardwarePlatform} label="Platform" />
                    </div>
                    <div className="flex justify-between border-b border-border/50 pb-2">
                      <span className="text-muted-foreground">CPU ABI</span>
                      <CopyableValue value={fullInfo.hardware.cpuArchitecture} label="CPU ABI" />
                    </div>
                    <div className="flex justify-between border-b border-border/50 pb-2">
                      <span className="text-muted-foreground">RAM</span>
                      <CopyableValue value={fullInfo.hardware.totalRam} label="RAM" />
                    </div>
                    <div className="flex justify-between border-b border-border/50 pb-2">
                      <span className="text-muted-foreground">RESOLUTION</span>
                      <CopyableValue value={fullInfo.hardware.displayResolution} label="Display Resolution" />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">DENSITY</span>
                      <CopyableValue value={fullInfo.hardware.displayDensity} label="Display Density" />
                    </div>
                  </div>
                </TerminalGridCell>

                {/* Software */}
                <TerminalGridCell>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3">SOFTWARE BUILD</div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between border-b border-border/50 pb-2">
                      <span className="text-muted-foreground">ANDROID</span>
                      <CopyableValue value={fullInfo.build.androidVersion} label="Android Version" />
                    </div>
                    <div className="flex justify-between border-b border-border/50 pb-2">
                      <span className="text-muted-foreground">SDK LEVEL</span>
                      <CopyableValue value={fullInfo.build.sdkLevel} label="SDK Level" />
                    </div>
                    <div className="flex justify-between border-b border-border/50 pb-2">
                      <span className="text-muted-foreground">SECURITY</span>
                      <CopyableValue value={fullInfo.build.securityPatch} label="Security Patch" />
                    </div>
                    <div className="flex justify-between border-b border-border/50 pb-2">
                      <span className="text-muted-foreground">BUILD ID</span>
                      <CopyableValue value={fullInfo.build.buildDate} label="Build ID" />
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground shrink-0">FINGERPRINT</span>
                      <CopyableValue
                        value={fullInfo.build.buildFingerprint}
                        label="Build Fingerprint"
                        className="truncate"
                      />
                    </div>
                  </div>
                </TerminalGridCell>
              </TerminalGrid>
            </div>
          ) : null}
        </div>
      </div>
    </PageLayout>
  );
}
