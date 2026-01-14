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
  TerminalProgressBar,
  TerminalSpinner,
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

export default function DashboardPage() {
  const { connectionState, deviceInfo } = useDevice();
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
      setError(err instanceof Error ? err.message : 'Failed to fetch device info');
    } finally {
      setLoading(false);
    }
  }, [connectionState, deviceInfo]);

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
                className="px-3 py-1 border border-border text-xs hover:bg-muted disabled:opacity-50"
              >
                [ {loading ? 'LOADING...' : 'REFRESH'} ]
              </button>

              <button
                onClick={handleCopyAll}
                disabled={!fullInfo}
                className="px-3 py-1 border border-foreground bg-foreground text-background text-xs hover:bg-foreground/90 disabled:opacity-50"
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
            <div className="flex items-center justify-center h-full">
              <TerminalSpinner label="LOADING DEVICE INFO" />
            </div>
          ) : fullInfo ? (
            <div className="space-y-4">
              {/* Top row - Identity & Battery & Storage */}
              <TerminalGrid cols={3}>
                {/* Device Identity */}
                <TerminalGridCell>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3">DEVICE IDENTITY</div>
                  <pre className="text-xs mb-3 text-center text-muted-foreground">
{`  _____
 |     |
 |  O  |
 |_____|`}
                  </pre>
                  <div className="text-base font-bold text-center">{fullInfo.identity.model}</div>
                  <div className="text-xs text-muted-foreground text-center mb-3">{fullInfo.identity.manufacturer}</div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">CODENAME</span>
                      <span>{fullInfo.identity.device}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">SERIAL</span>
                      <span>{fullInfo.identity.serial}</span>
                    </div>
                  </div>
                </TerminalGridCell>

                {/* Battery */}
                <TerminalGridCell>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3">POWER & BATTERY</div>
                  <div className="text-center mb-4">
                    <div className="text-3xl font-bold">{fullInfo.battery.level}%</div>
                    <div className="text-xs text-muted-foreground">{fullInfo.battery.status}</div>
                  </div>
                  <TerminalProgressBar
                    value={fullInfo.battery.level}
                    width={20}
                    showPercentage={false}
                    className="justify-center"
                  />
                  <div className="mt-4 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">HEALTH</span>
                      <span>{fullInfo.battery.health}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">TEMP</span>
                      <span>{(Number(fullInfo.battery.temperature) / 10).toFixed(1)}°C</span>
                    </div>
                  </div>
                </TerminalGridCell>

                {/* Storage */}
                <TerminalGridCell>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3">STORAGE</div>
                  <div className="text-center mb-4">
                    <div className="text-3xl font-bold">{fullInfo.storage.usagePercent}%</div>
                    <div className="text-xs text-muted-foreground">USED</div>
                  </div>
                  <TerminalProgressBar
                    value={fullInfo.storage.usagePercent}
                    width={20}
                    showPercentage={false}
                    className="justify-center"
                  />
                  <div className="mt-4 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">TOTAL</span>
                      <span>{fullInfo.storage.totalStorage}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">FREE</span>
                      <span>{fullInfo.storage.availableStorage}</span>
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
                      <span>{fullInfo.hardware.hardwarePlatform}</span>
                    </div>
                    <div className="flex justify-between border-b border-border/50 pb-2">
                      <span className="text-muted-foreground">CPU ABI</span>
                      <span>{fullInfo.hardware.cpuArchitecture}</span>
                    </div>
                    <div className="flex justify-between border-b border-border/50 pb-2">
                      <span className="text-muted-foreground">RAM</span>
                      <span>{fullInfo.hardware.totalRam}</span>
                    </div>
                    <div className="flex justify-between border-b border-border/50 pb-2">
                      <span className="text-muted-foreground">RESOLUTION</span>
                      <span>{fullInfo.hardware.displayResolution}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">DENSITY</span>
                      <span>{fullInfo.hardware.displayDensity}</span>
                    </div>
                  </div>
                </TerminalGridCell>

                {/* Software */}
                <TerminalGridCell>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3">SOFTWARE BUILD</div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between border-b border-border/50 pb-2">
                      <span className="text-muted-foreground">ANDROID</span>
                      <span>{fullInfo.build.androidVersion}</span>
                    </div>
                    <div className="flex justify-between border-b border-border/50 pb-2">
                      <span className="text-muted-foreground">SDK LEVEL</span>
                      <span>{fullInfo.build.sdkLevel}</span>
                    </div>
                    <div className="flex justify-between border-b border-border/50 pb-2">
                      <span className="text-muted-foreground">SECURITY</span>
                      <span>{fullInfo.build.securityPatch}</span>
                    </div>
                    <div className="flex justify-between border-b border-border/50 pb-2">
                      <span className="text-muted-foreground">BUILD ID</span>
                      <span>{fullInfo.build.buildDate}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-1">FINGERPRINT</span>
                      <code className="text-[10px] break-all block bg-muted/30 p-2 border border-border">
                        {fullInfo.build.buildFingerprint}
                      </code>
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
