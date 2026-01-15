'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { PageLayout } from '@/design-system/patterns/PageLayout/PageLayout';
import { useDevice } from '@/context/device-context';
import { shell } from '@/services/adb';
import { cn } from '@/lib/utils';
import { TerminalSpinner, TerminalGrid, TerminalGridCell } from '@/components/ui/TerminalUI';

interface CpuData { timestamp: number; usage: number; }
interface MemoryData { timestamp: number; total: number; used: number; available: number; }
interface ProcessInfo { pid: string; user: string; cpu: number; mem: number; name: string; }
interface BatteryInfo { level: number; temperature: number; voltage: number; status: string; }

const MAX_DATA_POINTS = 60;

// ASCII sparkline characters for terminal-style charts
const SPARKLINE_CHARS = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

function getSparklineChar(value: number, max: number = 100): string {
  const normalized = Math.min(Math.max(value / max, 0), 1);
  const index = Math.floor(normalized * (SPARKLINE_CHARS.length - 1));
  return SPARKLINE_CHARS[index];
}

function SparklineChart({
  data,
  getValue,
  color = 'text-orange-500',
  label,
  currentValue,
  unit = '%',
  isMonitoring = false
}: {
  data: { timestamp: number }[];
  getValue: (d: { timestamp: number }) => number;
  color?: string;
  label: string;
  currentValue: number;
  unit?: string;
  isMonitoring?: boolean;
}) {
  const sparkline = data.map(d => getSparklineChar(getValue(d))).join('');
  const minVal = data.length ? Math.min(...data.map(getValue)) : 0;
  const maxVal = data.length ? Math.max(...data.map(getValue)) : 0;
  const avgVal = data.length ? Math.round(data.reduce((acc, d) => acc + getValue(d), 0) / data.length) : 0;

  return (
    <div className="border border-border p-4">
      <div className="flex justify-between items-start mb-3">
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
        <div className="text-right">
          <div className={cn("text-xl font-bold", color)}>{currentValue}{unit}</div>
          <div className="text-[10px] text-muted-foreground">CURRENT</div>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="text-center text-muted-foreground py-6 text-xs">
          {isMonitoring ? <TerminalSpinner label="COLLECTING" /> : 'START MONITORING TO SEE DATA'}
        </div>
      ) : (
        <>
          {/* Sparkline */}
          <div className={cn("font-mono text-lg tracking-tighter overflow-hidden whitespace-nowrap", color)}>
            {sparkline || '▁'.repeat(30)}
          </div>

          {/* Stats row */}
          <div className="flex justify-between text-xs mt-3 pt-3 border-t border-border/50">
            <div>
              <span className="text-muted-foreground">MIN </span>
              <span>{minVal}{unit}</span>
            </div>
            <div>
              <span className="text-muted-foreground">AVG </span>
              <span>{avgVal}{unit}</span>
            </div>
            <div>
              <span className="text-muted-foreground">MAX </span>
              <span>{maxVal}{unit}</span>
            </div>
            <div>
              <span className="text-muted-foreground">SAMPLES </span>
              <span>{data.length}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

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
      const match = topHeader.match(/User\s+(\d+)%.*System\s+(\d+)%/i)
        || topHeader.match(/(\d+)%\s*user.*(\d+)%\s*sys/i)  // "3% user" or "3%user"
        || topHeader.match(/(\d+)%user.*(\d+)%sys/i);       // "3%user...17%sys"
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
        voltage: getVal(/^\s*voltage:\s*(\d+)/m) / 1000, // millivolts to volts
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

          {/* KPI Grid - Dashboard style */}
          <TerminalGrid cols={4}>
            {/* CPU */}
            <TerminalGridCell>
              <div className="flex justify-between items-start mb-3">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">CPU LOAD</div>
                <div className="text-right">
                  <div className={cn(
                    "text-xl font-bold",
                    currentCpu >= 80 ? "text-red-500" : currentCpu >= 50 ? "text-orange-500" : ""
                  )}>{currentCpu}%</div>
                  <div className="text-[10px] text-muted-foreground">USAGE</div>
                </div>
              </div>
              <div className="w-full bg-muted/30 h-4 mb-3">
                <div
                  className={cn(
                    "h-full transition-all",
                    currentCpu >= 80 ? "bg-red-500" : currentCpu >= 50 ? "bg-orange-500" : "bg-green-500"
                  )}
                  style={{ width: `${currentCpu}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground">
                {isMonitoring ? 'MONITORING' : 'STOPPED'}
              </div>
            </TerminalGridCell>

            {/* Memory */}
            <TerminalGridCell>
              <div className="flex justify-between items-start mb-3">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">MEMORY</div>
                <div className="text-right">
                  <div className={cn(
                    "text-xl font-bold",
                    memPercent >= 90 ? "text-red-500" : memPercent >= 70 ? "text-orange-500" : ""
                  )}>{memPercent}%</div>
                  <div className="text-[10px] text-muted-foreground">USED</div>
                </div>
              </div>
              <div className="w-full bg-muted/30 h-4 mb-3">
                <div
                  className={cn(
                    "h-full transition-all",
                    memPercent >= 90 ? "bg-red-500" : memPercent >= 70 ? "bg-orange-500" : "bg-green-500"
                  )}
                  style={{ width: `${memPercent}%` }}
                />
              </div>
              <div className="text-xs">
                <span className="text-muted-foreground">USED </span>
                {currentMem ? formatBytes(currentMem.used) : '--'}
              </div>
            </TerminalGridCell>

            {/* Battery */}
            <TerminalGridCell>
              <div className="flex justify-between items-start mb-3">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">BATTERY</div>
                <div className="text-right">
                  <div className={cn(
                    "text-xl font-bold",
                    (battery?.level || 0) <= 20 ? "text-red-500" : (battery?.level || 0) <= 50 ? "text-orange-500" : "text-green-500"
                  )}>{battery?.level || 0}%</div>
                  <div className="text-[10px] text-muted-foreground">{battery?.status || '--'}</div>
                </div>
              </div>
              <div className="w-full bg-muted/30 h-4 mb-3">
                <div
                  className={cn(
                    "h-full transition-all",
                    (battery?.level || 0) <= 20 ? "bg-red-500" : (battery?.level || 0) <= 50 ? "bg-orange-500" : "bg-green-500"
                  )}
                  style={{ width: `${battery?.level || 0}%` }}
                />
              </div>
              <div className="text-xs">
                <span className="text-muted-foreground">HEALTH </span>
                {battery ? 'GOOD' : '--'}
              </div>
            </TerminalGridCell>

            {/* Temperature */}
            <TerminalGridCell>
              <div className="flex justify-between items-start mb-3">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">TEMPERATURE</div>
                <div className="text-right">
                  <div className={cn(
                    "text-xl font-bold",
                    (battery?.temperature || 0) >= 45 ? "text-red-500" : (battery?.temperature || 0) >= 35 ? "text-orange-500" : ""
                  )}>{battery?.temperature || 0}°C</div>
                  <div className="text-[10px] text-muted-foreground">BATTERY</div>
                </div>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">VOLTAGE</span>
                  <span>{battery?.voltage || 0}V</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">STATUS</span>
                  <span className={battery?.status === 'CHARGING' ? 'text-green-500' : ''}>{battery?.status || '--'}</span>
                </div>
              </div>
            </TerminalGridCell>
          </TerminalGrid>

          {/* CPU History - Sparkline */}
          <SparklineChart
            data={cpuHistory}
            getValue={(d) => (d as CpuData).usage}
            color="text-orange-500"
            label="CPU HISTORY"
            currentValue={currentCpu}
            isMonitoring={isMonitoring}
          />

          {/* Memory History - Sparkline */}
          <SparklineChart
            data={memoryHistory}
            getValue={(d) => {
              const m = d as MemoryData;
              return m.total ? Math.round((m.used / m.total) * 100) : 0;
            }}
            color="text-green-500"
            label="MEMORY HISTORY"
            currentValue={memPercent}
            isMonitoring={isMonitoring}
          />

          {/* Top Processes */}
          <div className="border border-border">
            <div className="p-3 border-b border-border">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                TOP PROCESSES ({processes.length})
              </div>
            </div>
            {processes.length === 0 ? (
              <div className="text-center text-muted-foreground py-8 text-xs">
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
        <div className="border-t border-border px-3 flex-shrink-0 bg-background flex items-center min-h-[36px]">
          <span className="text-[10px] text-muted-foreground">
            REAL-TIME PERFORMANCE MONITORING | CPU | MEMORY | BATTERY | PROCESSES
          </span>
        </div>
      </div>
    </PageLayout>
  );
}
