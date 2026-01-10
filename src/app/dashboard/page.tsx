'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageLayout } from '@/design-system/patterns/PageLayout/PageLayout';
import { EmptyState } from '@/components/ui/EmptyState';
import { useDevice } from '@/context/device-context';
import { Button } from '@/design-system/components/Button';
import {
  fetchAllDeviceInfo,
  formatDeviceInfoText,
  type FullDeviceInfo
} from '@/services/device-info';
import {
  RefreshCw,
  Copy,
  Check,
  Smartphone,
  Cpu,
  HardDrive,
  Battery,
  Zap,
  Clock,
  Fingerprint,
  Box,
  Layers
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip
} from 'recharts';

// --- Components ---

const InfoItem = ({ label, value, icon: Icon }: { label: string, value: string | number, icon?: any }) => (
  <div className="flex items-center justify-between py-3 border-b border-border/40 last:border-0 hover:bg-muted/30 px-2 rounded-lg transition-colors">
    <div className="flex items-center gap-2.5 text-muted-foreground">
      {Icon && <Icon className="w-4 h-4 opacity-70" />}
      <span className="text-sm font-medium">{label}</span>
    </div>
    <span className="text-sm font-semibold text-foreground text-right font-mono truncate max-w-[180px]" title={String(value)}>
      {value}
    </span>
  </div>
);

const StatCard = ({ title, icon: Icon, children, className, loading }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className={className}
  >
    <Card className="h-full bg-card/50 backdrop-blur-sm border-white/5 shadow-lg overflow-hidden relative">
      {/* Decorative gradient blob */}
      <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

      <CardHeader className="pb-3 border-b border-border/40 bg-muted/10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Icon className="w-5 h-5" />
          </div>
          <CardTitle className="text-base font-semibold tracking-tight">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-4 bg-muted/50 rounded w-1/3" />
            <div className="h-8 bg-muted/50 rounded w-full" />
            <div className="h-4 bg-muted/50 rounded w-2/3" />
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  </motion.div>
);

const AUTO_REFRESH_INTERVALS = [
  { label: 'Off', value: 0 },
  { label: '5s', value: 5000 },
  { label: '10s', value: 10000 },
  { label: '30s', value: 30000 },
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

  if (connectionState !== 'connected') {
    return (
      <PageLayout>
        <div className="h-full flex items-center justify-center p-8">
          <EmptyState
            title="No Device Connected"
            description="Connect an Android device via USB to view device information and use debugging tools."
            icon={<Smartphone className="w-16 h-16 text-muted-foreground/30" />}
          />
        </div>
      </PageLayout>
    );
  }

  // Storage Chart Data
  // Storage Chart Data
  // const storageData = ... (removed unused variable relying on invalid props)

  return (
    <PageLayout>
      <div className="h-full flex flex-col space-y-6 pt-2 pb-8 px-8 overflow-y-auto scrollbar-hide">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
              {deviceInfo?.model || 'Device'} Dashboard
            </h1>
            <div className="flex items-center gap-2 mt-1.5 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5 bg-muted/50 px-2 py-0.5 rounded-md font-mono text-xs border border-border/50">
                <Clock className="w-3 h-3" />
                Updated: {lastRefresh ? lastRefresh.toLocaleTimeString() : '--:--'}
              </span>
              {autoRefresh > 0 && <span className="text-green-500 text-xs font-medium px-2">• Live Updates On</span>}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative group">
              <select
                value={autoRefresh}
                onChange={(e) => setAutoRefresh(Number(e.target.value))}
                className="appearance-none bg-background border border-input rounded-lg px-4 py-2 pr-8 text-sm focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                {AUTO_REFRESH_INTERVALS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <RefreshCw className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>

            <Button
              variant="outline"
              size="medium"
              className="gap-2"
              onClick={fetchInfo}
              disabled={loading}
              icon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </Button>

            <Button
              variant={copied ? 'success' : 'primary'}
              size="medium"
              className="gap-2 shadow-lg shadow-primary/10"
              onClick={handleCopyAll}
              disabled={!fullInfo}
              icon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            >
              {copied ? 'Copied' : 'Export Info'}
            </Button>
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium flex items-center gap-3"
          >
            <div className="p-1 rounded-full bg-destructive/20">!</div>
            {error}
          </motion.div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-8">

          {/* 1. Device Identity */}
          <StatCard title="Device Identity" icon={Smartphone} loading={loading && !fullInfo}>
            {fullInfo && (
              <div className="space-y-1">
                <div className="flex items-center justify-center p-6 pb-2">
                  <div className="w-20 h-20 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-2xl flex items-center justify-center">
                    <Smartphone className="w-10 h-10 text-foreground/80" />
                  </div>
                </div>
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold">{fullInfo.identity.model}</h3>
                  <p className="text-sm text-muted-foreground">{fullInfo.identity.manufacturer}</p>
                </div>
                <div className="space-y-0.5">
                  <InfoItem label="Codename" value={fullInfo.identity.device} icon={Box} />
                  <InfoItem label="Serial" value={fullInfo.identity.serial} icon={Fingerprint} />
                </div>
              </div>
            )}
          </StatCard>

          {/* 2. Battery Status */}
          <StatCard title="Power & Battery" icon={Battery} loading={loading && !fullInfo}>
            {fullInfo && (
              <div className="flex flex-col h-full">
                <div className="flex-1 flex flex-col items-center justify-center py-4">
                  <div className="relative w-32 h-32 flex items-center justify-center">
                    {/* Circular Progress for Battery */}
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/20" />
                      <motion.circle
                        cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8"
                        className={fullInfo.battery.level < 20 ? 'text-red-500' : fullInfo.battery.level < 50 ? 'text-amber-500' : 'text-green-500'}
                        strokeDasharray="283"
                        strokeDashoffset={283 - (283 * fullInfo.battery.level) / 100}
                        initial={{ strokeDashoffset: 283 }}
                        animate={{ strokeDashoffset: 283 - (283 * fullInfo.battery.level) / 100 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <Zap className={`w-6 h-6 mb-1 ${fullInfo.battery.status === 'Charging' ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
                      <span className="text-2xl font-bold">{fullInfo.battery.level}%</span>
                    </div>
                  </div>
                  <p className="mt-2 text-sm font-medium text-muted-foreground">{fullInfo.battery.status}</p>
                </div>

                <div className="space-y-0.5">
                  <InfoItem label="Health" value={fullInfo.battery.health} icon={Check} />
                  <InfoItem label="Temperature" value={`${(Number(fullInfo.battery.temperature) / 10).toFixed(1)}°C`} icon={Clock} />
                </div>
              </div>
            )}
          </StatCard>

          {/* 3. Storage */}
          <StatCard title="Storage" icon={HardDrive} loading={loading && !fullInfo}>
            {fullInfo && (
              <div className="flex flex-col h-full">
                <div className="h-40 w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Used', value: fullInfo.storage.usagePercent },
                          { name: 'Free', value: 100 - fullInfo.storage.usagePercent }
                        ]}
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell key="cell-used" fill="hsl(var(--primary))" />
                        <Cell key="cell-free" fill="hsl(var(--muted))" />
                      </Pie>
                      <RechartsTooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <span className="text-xl font-bold block">{fullInfo.storage.usagePercent}%</span>
                      <span className="text-xs text-muted-foreground">Used</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-0.5 mt-2">
                  <InfoItem label="Total" value={fullInfo.storage.totalStorage} />
                  <InfoItem label="Available" value={fullInfo.storage.availableStorage} />
                </div>
              </div>
            )}
          </StatCard>

          {/* 4. Hardware Specs */}
          <StatCard title="Hardware Specs" icon={Cpu} loading={loading && !fullInfo}>
            {fullInfo && (
              <div className="grid grid-cols-1 gap-1">
                <InfoItem label="Platform" value={fullInfo.hardware.hardwarePlatform} icon={Cpu} />
                <InfoItem label="CPU ABI" value={fullInfo.hardware.cpuArchitecture} />
                <InfoItem label="RAM" value={fullInfo.hardware.totalRam} />
                <InfoItem label="Resolution" value={fullInfo.hardware.displayResolution} />
                <InfoItem label="Density" value={fullInfo.hardware.displayDensity} />
              </div>
            )}
          </StatCard>

          {/* 5. Software Build */}
          <StatCard title="Software Build" icon={Layers} loading={loading && !fullInfo} className="md:col-span-2 xl:col-span-2">
            {fullInfo && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                <div className="space-y-1">
                  <InfoItem label="Android Version" value={fullInfo.build.androidVersion} />
                  <InfoItem label="SDK Level" value={fullInfo.build.sdkLevel} />
                  <InfoItem label="Security Patch" value={fullInfo.build.securityPatch} />
                </div>
                <div className="space-y-1">
                  <InfoItem label="Build ID" value={fullInfo.build.buildDate} />
                  {/* Note: buildDate typically comes as an ID or timestamp, renamed label for clarity if needed, or stick to Build Date */}

                  <div className="py-2.5 border-b border-border/40 hover:bg-muted/30 px-2 rounded-lg transition-colors">
                    <span className="text-xs text-muted-foreground block mb-1">Build Fingerprint</span>
                    <code className="text-xs font-mono text-foreground break-all bg-muted/50 p-1.5 rounded block">
                      {fullInfo.build.buildFingerprint}
                    </code>
                  </div>
                </div>
              </div>
            )}
          </StatCard>

        </div>
      </div>
    </PageLayout>
  );
}
