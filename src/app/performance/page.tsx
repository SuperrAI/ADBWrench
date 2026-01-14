'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { PageLayout } from '@/design-system/patterns/PageLayout/PageLayout';
import { useDevice } from '@/context/device-context';
import { shell } from '@/services/adb';
import { cn } from '@/lib/utils';
import { TerminalSpinner, TerminalProgressBar } from '@/components/ui/TerminalUI';

interface CpuData { timestamp: number; usage: number; }
interface MemoryData { timestamp: number; total: number; used: number; available: number; }
interface ProcessInfo { pid: string; user: string; cpu: number; mem: number; name: string; }
interface BatteryInfo { level: number; temperature: number; voltage: number; status: string; }

const MAX_DATA_POINTS = 30;

export default function PerformancePage() {
  const { connectionState } = useDevice();
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [refreshRate, setRefreshRate] = useState(2000);
  const [cpuHistory, setCpuHistory] = useState<CpuData[]>([]);
  const [memoryHistory, setMemoryHistory] = useState<MemoryData[]>([]);
  const [processes, setProcesses] = useState<ProcessInfo[]>([]);
  const [battery, setBattery] = useState<BatteryInfo | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const parseCpuUsage = useCallback(async (): Promise<number> => {
    try {
      const topHeader = await shell('top -n 1 -b -m 1 | head -5');
      const match = topHeader.match(/User\s+(\d+)%.*System\s+(\d+)%/i) || topHeader.match(/(\d+)%\s+user.*(\d+)%\s+sys/i);
      if (match) return Math.min(100, Number(match[1]) + Number(match[2]));
      return 0;
    } catch { return 0; }
  }, []);

  const parseMemory = useCallback(async () => {
    try {
      const output = await shell('cat /proc/meminfo');
      const getVal = (key: string) => {
        const m = output.match(new RegExp(`${key}:\\s+(\\d+)`));
        return m ? parseInt(m[1], 10) * 1024 : 0;
      };
      const total = getVal('MemTotal');
      const available = getVal('MemAvailable') || (getVal('MemFree') + getVal('Buffers') + getVal('Cached'));
      return { total, available, used: total - available };
    } catch { return { total: 0, used: 0, available: 0 }; }
  }, []);

  const parseBattery = useCallback(async (): Promise<BatteryInfo | null> => {
    try {
      const output = await shell('dumpsys battery');
      const getVal = (regex: RegExp) => parseInt(output.match(regex)?.[1] || '0', 10);
      return {
        level: getVal(/level:\s*(\d+)/),
        temperature: getVal(/temperature:\s*(\d+)/) / 10,
        voltage: getVal(/voltage:\s*(\d+)/) / 1000,
        status: output.match(/status:\s*(\d+)/)?.[1] === '2' ? 'CHARGING' : 'DISCHARGING'
      };
    } catch { return null; }
  }, []);

  const parseProcesses = useCallback(async (): Promise<ProcessInfo[]> => {
    try {
      const output = await shell('top -n 1 -b -m 10');
      const lines = output.split('\n');
      const headerIdx = lines.findIndex(l => l.includes('PID'));
      if (headerIdx === -1) return [];

      return lines.slice(headerIdx + 1, headerIdx + 11).map(line => {
        const parts = line.trim().split(/\s+/);
        if (parts.length < 9) return null;
        const cpuIdx = parts.findIndex(p => p.includes('%') && !p.includes('CPU')) !== -1
          ? parts.findIndex(p => p.includes('%'))
          : 8;

        return {
          pid: parts[0],
          user: parts[1],
          cpu: parseFloat(parts[cpuIdx] || '0'),
          mem: parseFloat(parts[cpuIdx + 1] || '0'),
          name: parts[parts.length - 1]
        };
      }).filter(Boolean) as ProcessInfo[];
    } catch { return []; }
  }, []);

  const collect = useCallback(async () => {
    const timestamp = Date.now();
    const [cpu, mem, batt, procs] = await Promise.all([parseCpuUsage(), parseMemory(), parseBattery(), parseProcesses()]);

    setCpuHistory(prev => [...prev.slice(-MAX_DATA_POINTS), { timestamp, usage: cpu }]);
    setMemoryHistory(prev => [...prev.slice(-MAX_DATA_POINTS), { timestamp, ...mem }]);
    setBattery(batt);
    setProcesses(procs);
  }, [parseCpuUsage, parseMemory, parseBattery, parseProcesses]);

  useEffect(() => {
    if (isMonitoring && connectionState === 'connected') {
      collect();
      intervalRef.current = setInterval(collect, refreshRate);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isMonitoring, connectionState, refreshRate, collect]);

  const formatBytes = (b: number) => {
    if (!b) return '0B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(b) / Math.log(1024));
    return `${(b / Math.pow(1024, i)).toFixed(1)}${units[i]}`;
  };

  const currentCpu = cpuHistory.slice(-1)[0]?.usage || 0;
  const currentMem = memoryHistory.slice(-1)[0];
  const memPercent = currentMem ? Math.round((currentMem.used / currentMem.total) * 100) : 0;

  if (connectionState !== 'connected') {
    return (
      <PageLayout>
        <div className="h-full flex items-center justify-center p-8 font-mono">
          <div className="text-center">
            <pre className="text-muted-foreground mb-4 text-xs">
{`  ______
 | CPU  |
 | MEM  |
 |______|`}
            </pre>
            <div className="text-sm mb-2">PERFORMANCE DISCONNECTED</div>
            <div className="text-xs text-muted-foreground">
              Connect a device to monitor performance.
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="h-full flex flex-col font-mono overflow-hidden">
        {/* Header */}
        <div className="border-b border-border p-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-sm uppercase tracking-wider">PERFORMANCE // MONITOR</h1>
              <div className="text-xs text-muted-foreground mt-1">
                {isMonitoring ? 'MONITORING...' : 'STOPPED'} | INTERVAL: {refreshRate / 1000}S
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1">
                {[1000, 2000, 5000].map(r => (
                  <button
                    key={r}
                    onClick={() => setRefreshRate(r)}
                    className={cn(
                      "px-2 py-1 border",
                      refreshRate === r ? "border-orange-500 text-orange-500" : "border-border text-muted-foreground"
                    )}
                  >
                    {r / 1000}S
                  </button>
                ))}
              </div>

              <button
                onClick={() => setIsMonitoring(!isMonitoring)}
                className={cn(
                  "px-2 py-1 border",
                  isMonitoring
                    ? "border-red-500 text-red-500 hover:bg-red-500/10"
                    : "border-green-500 text-green-500 hover:bg-green-500/10"
                )}
              >
                [ {isMonitoring ? 'STOP' : 'START'} ]
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {/* KPI Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* CPU */}
            <div className="border border-border p-4">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">CPU LOAD</div>
              <div className="text-2xl font-bold">{currentCpu}%</div>
              <TerminalProgressBar value={currentCpu} width={15} showPercentage={false} className="mt-2" />
            </div>

            {/* Memory */}
            <div className="border border-border p-4">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">MEMORY</div>
              <div className="text-2xl font-bold">{memPercent}%</div>
              <TerminalProgressBar value={memPercent} width={15} showPercentage={false} className="mt-2" />
              <div className="text-[10px] text-muted-foreground mt-1">
                {currentMem ? formatBytes(currentMem.used) : '--'} / {currentMem ? formatBytes(currentMem.total) : '--'}
              </div>
            </div>

            {/* Battery */}
            <div className="border border-border p-4">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">BATTERY</div>
              <div className={cn(
                "text-2xl font-bold",
                (battery?.level || 0) <= 20 ? "text-red-500" : (battery?.level || 0) <= 50 ? "text-orange-500" : "text-green-500"
              )}>
                {battery?.level || 0}%
              </div>
              <TerminalProgressBar value={battery?.level || 0} width={15} showPercentage={false} className="mt-2" />
              <div className="text-[10px] text-muted-foreground mt-1">{battery?.status || '--'}</div>
            </div>

            {/* Temperature */}
            <div className="border border-border p-4">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">TEMPERATURE</div>
              <div className={cn(
                "text-2xl font-bold",
                (battery?.temperature || 0) >= 45 ? "text-red-500" : (battery?.temperature || 0) >= 35 ? "text-orange-500" : ""
              )}>
                {battery?.temperature || 0}°C
              </div>
              <div className="text-[10px] text-muted-foreground mt-2">
                VOLTAGE: {battery?.voltage || 0}V
              </div>
            </div>
          </div>

          {/* CPU History */}
          <div className="border border-border p-4">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3">CPU HISTORY</div>
            {cpuHistory.length === 0 ? (
              <div className="text-center text-zinc-600 py-4 text-xs">
                {isMonitoring ? <TerminalSpinner label="COLLECTING" /> : 'START MONITORING TO SEE DATA'}
              </div>
            ) : (
              <div className="flex items-end gap-1 h-16">
                {cpuHistory.map((d, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-orange-500"
                    style={{ height: `${d.usage}%` }}
                    title={`${d.usage}%`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Memory History */}
          <div className="border border-border p-4">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3">MEMORY HISTORY</div>
            {memoryHistory.length === 0 ? (
              <div className="text-center text-zinc-600 py-4 text-xs">
                {isMonitoring ? <TerminalSpinner label="COLLECTING" /> : 'START MONITORING TO SEE DATA'}
              </div>
            ) : (
              <div className="flex items-end gap-1 h-16">
                {memoryHistory.map((d, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-green-500"
                    style={{ height: `${(d.used / d.total) * 100}%` }}
                    title={`${Math.round((d.used / d.total) * 100)}%`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Top Processes */}
          <div className="border border-border">
            <div className="p-3 border-b border-border">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                TOP PROCESSES ({processes.length})
              </div>
            </div>
            {processes.length === 0 ? (
              <div className="text-center text-zinc-600 py-8 text-xs">
                {isMonitoring ? <TerminalSpinner label="LOADING" /> : 'START MONITORING TO SEE PROCESSES'}
              </div>
            ) : (
              <div className="divide-y divide-border text-xs">
                <div className="flex items-center gap-3 p-2 bg-muted text-muted-foreground">
                  <span className="w-16">PID</span>
                  <span className="flex-1">NAME</span>
                  <span className="w-12">USER</span>
                  <span className="w-12 text-right">CPU%</span>
                  <span className="w-12 text-right">MEM%</span>
                </div>
                {processes.map((proc, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 hover:bg-muted">
                    <span className="w-16 text-muted-foreground">{proc.pid}</span>
                    <span className="flex-1 truncate">{proc.name}</span>
                    <span className="w-12 text-muted-foreground">{proc.user}</span>
                    <span className={cn(
                      "w-12 text-right",
                      proc.cpu > 50 ? "text-red-500" : proc.cpu > 20 ? "text-orange-500" : ""
                    )}>
                      {proc.cpu.toFixed(1)}
                    </span>
                    <span className="w-12 text-right text-muted-foreground">{proc.mem.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="border-t border-border p-2 flex-shrink-0 bg-zinc-950">
          <div className="text-[10px] text-zinc-600">
            REAL-TIME PERFORMANCE MONITORING | CPU | MEMORY | BATTERY | PROCESSES
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
