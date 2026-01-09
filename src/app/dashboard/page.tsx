'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageLayout } from '@/design-system/patterns/PageLayout/PageLayout';
import { EmptyState } from '@/components/ui/EmptyState';
import { useDevice } from '@/context/device-context';
import { Button } from '@/design-system/components/Button';
import { InfoPanel, InfoRow, ProgressBar, BatteryIndicator } from '@/components/ui/InfoPanel';
import {
  fetchAllDeviceInfo,
  formatDeviceInfoText,
  type FullDeviceInfo,
} from '@/services/device-info';
import { textStyles } from '@/design-system/foundations/typography';
import { Green } from '@/design-system/foundations/colors';

// Icons
const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2C10.2091 2 12.1182 3.28 13.1429 5.14286"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M10 5H14V1"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="5" y="5" width="9" height="9" rx="1" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M11 5V3C11 2.44772 10.5523 2 10 2H3C2.44772 2 2 2.44772 2 3V10C2 10.5523 2.44772 11 3 11H5"
      stroke="currentColor"
      strokeWidth="1.5"
    />
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M13.3334 4L6.00002 11.3333L2.66669 8"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const DeviceIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="1" width="10" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    <line x1="6" y1="12" x2="10" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const BuildIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M13 5L8 2L3 5V11L8 14L13 11V5Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path d="M8 8V14" stroke="currentColor" strokeWidth="1.5" />
    <path d="M3 5L8 8L13 5" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const CpuIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="4" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" />
    <path d="M6 1V4M10 1V4M6 12V15M10 12V15M1 6H4M1 10H4M12 6H15M12 10H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const StorageIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="3" width="12" height="10" rx="1" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="5" cy="8" r="1" fill="currentColor" />
    <path d="M8 6H12M8 10H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const BatteryIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="4" width="10" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" />
    <path d="M12 6.5H13.5C13.7761 6.5 14 6.72386 14 7V9C14 9.27614 13.7761 9.5 13.5 9.5H12" stroke="currentColor" strokeWidth="1.5" />
    <path d="M5 7V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const AUTO_REFRESH_INTERVALS = [
  { label: 'Off', value: 0 },
  { label: '5s', value: 5000 },
  { label: '10s', value: 10000 },
  { label: '30s', value: 30000 },
  { label: '60s', value: 60000 },
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

  // Initial fetch on connection
  useEffect(() => {
    if (connectionState === 'connected' && deviceInfo && !fullInfo) {
      fetchInfo();
    }
  }, [connectionState, deviceInfo, fullInfo, fetchInfo]);

  // Reset info when disconnected
  useEffect(() => {
    if (connectionState !== 'connected') {
      setFullInfo(null);
      setLastRefresh(null);
    }
  }, [connectionState]);

  // Auto-refresh
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
      // Clipboard API failed
    }
  };

  const handleRefresh = () => {
    fetchInfo();
  };

  if (connectionState !== 'connected') {
    return (
      <PageLayout>
        <div className="h-full flex items-center justify-center p-8">
          <EmptyState
            title="No Device Connected"
            description="Connect an Android device via USB to view device information and use debugging tools."
          />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h1 style={{ ...textStyles.h4 }} className="text-foreground">
              Device Dashboard
            </h1>
            {lastRefresh && (
              <p className="text-xs text-muted-foreground mt-1">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* Auto-refresh selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Auto-refresh:</span>
              <select
                value={autoRefresh}
                onChange={(e) => setAutoRefresh(Number(e.target.value))}
                className="text-sm bg-background border border-border rounded px-2 py-1 text-foreground"
              >
                {AUTO_REFRESH_INTERVALS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Refresh button */}
            <Button
              variant="ghost"
              size="small"
              icon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={loading}
            >
              Refresh
            </Button>

            {/* Copy All button */}
            <Button
              variant="secondary"
              size="small"
              icon={copied ? <CheckIcon /> : <CopyIcon />}
              onClick={handleCopyAll}
              disabled={!fullInfo}
            >
              {copied ? 'Copied!' : 'Copy All'}
            </Button>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Device Identity */}
            <InfoPanel title="Device Identity" icon={<DeviceIcon />} loading={loading && !fullInfo}>
              {fullInfo && (
                <>
                  <InfoRow label="Model" value={fullInfo.identity.model} />
                  <InfoRow label="Manufacturer" value={fullInfo.identity.manufacturer} />
                  <InfoRow label="Device" value={fullInfo.identity.device} />
                  <InfoRow label="Serial" value={fullInfo.identity.serial} />
                </>
              )}
            </InfoPanel>

            {/* Build Information */}
            <InfoPanel title="Build Information" icon={<BuildIcon />} loading={loading && !fullInfo}>
              {fullInfo && (
                <>
                  <InfoRow label="Android Version" value={fullInfo.build.androidVersion} />
                  <InfoRow label="SDK Level" value={fullInfo.build.sdkLevel} />
                  <InfoRow label="Security Patch" value={fullInfo.build.securityPatch} />
                  <InfoRow label="Build Date" value={fullInfo.build.buildDate} />
                </>
              )}
            </InfoPanel>

            {/* Hardware Information */}
            <InfoPanel title="Hardware" icon={<CpuIcon />} loading={loading && !fullInfo}>
              {fullInfo && (
                <>
                  <InfoRow label="CPU Architecture" value={fullInfo.hardware.cpuArchitecture} />
                  <InfoRow label="Hardware" value={fullInfo.hardware.hardwarePlatform} />
                  <InfoRow label="Total RAM" value={fullInfo.hardware.totalRam} />
                  <InfoRow label="Display" value={fullInfo.hardware.displayResolution} />
                  <InfoRow label="Density" value={fullInfo.hardware.displayDensity} />
                </>
              )}
            </InfoPanel>

            {/* Storage Information */}
            <InfoPanel title="Storage" icon={<StorageIcon />} loading={loading && !fullInfo}>
              {fullInfo && (
                <>
                  <InfoRow label="Total" value={fullInfo.storage.totalStorage} />
                  <InfoRow label="Used" value={fullInfo.storage.usedStorage} />
                  <InfoRow label="Available" value={fullInfo.storage.availableStorage} />
                  <div className="py-2">
                    <span className="text-xs text-muted-foreground block mb-2">Usage</span>
                    <ProgressBar value={fullInfo.storage.usagePercent} />
                  </div>
                </>
              )}
            </InfoPanel>

            {/* Battery Information */}
            <InfoPanel title="Battery" icon={<BatteryIcon />} loading={loading && !fullInfo}>
              {fullInfo && (
                <>
                  <div className="py-3">
                    <BatteryIndicator
                      level={fullInfo.battery.level}
                      status={fullInfo.battery.status}
                    />
                  </div>
                  <InfoRow label="Status" value={fullInfo.battery.status} />
                  <InfoRow label="Health" value={fullInfo.battery.health} />
                  <InfoRow label="Temperature" value={fullInfo.battery.temperature} />
                  <InfoRow label="Voltage" value={fullInfo.battery.voltage} />
                  <InfoRow label="Technology" value={fullInfo.battery.technology} />
                </>
              )}
            </InfoPanel>

            {/* Build Fingerprint - spans full width on larger screens */}
            <InfoPanel
              title="Build Fingerprint"
              icon={<BuildIcon />}
              loading={loading && !fullInfo}
              className="md:col-span-2 lg:col-span-1"
            >
              {fullInfo && (
                <div className="py-2">
                  <p
                    className="text-xs text-muted-foreground break-all font-mono"
                    style={{ lineHeight: '1.5' }}
                  >
                    {fullInfo.build.buildFingerprint}
                  </p>
                </div>
              )}
            </InfoPanel>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
