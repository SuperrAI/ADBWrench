'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import PageLayout from '@/design-system/patterns/PageLayout/PageLayout';
import { useDevice } from '@/context/device-context';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/design-system/components/Button';
import { shell } from '@/services/adb';
import { toast } from 'sonner';

interface CpuData {
  timestamp: number;
  usage: number;
}

interface MemoryData {
  timestamp: number;
  total: number;
  used: number;
  available: number;
}

interface ProcessInfo {
  pid: string;
  user: string;
  cpu: number;
  mem: number;
  name: string;
}

interface BatteryInfo {
  level: number;
  temperature: number;
  voltage: number;
  status: string;
}

const REFRESH_RATES = [
  { label: '1s', value: 1000 },
  { label: '2s', value: 2000 },
  { label: '5s', value: 5000 },
];

const MAX_DATA_POINTS = 60;

export default function PerformancePage() {
  const { connectionState } = useDevice();
  const isConnected = connectionState === 'connected';

  const [isMonitoring, setIsMonitoring] = useState(false);
  const [refreshRate, setRefreshRate] = useState(2000);
  const [cpuHistory, setCpuHistory] = useState<CpuData[]>([]);
  const [memoryHistory, setMemoryHistory] = useState<MemoryData[]>([]);
  const [processes, setProcesses] = useState<ProcessInfo[]>([]);
  const [battery, setBattery] = useState<BatteryInfo | null>(null);
  const [previousBatteryLevel, setPreviousBatteryLevel] = useState<number | null>(null);
  const [drainRate, setDrainRate] = useState<number | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastBatteryCheckRef = useRef<number>(Date.now());

  // Parse CPU usage from /proc/stat
  const parseCpuUsage = useCallback(async (): Promise<number> => {
    try {
      const output = await shell('cat /proc/stat | head -1');
      const parts = output.trim().split(/\s+/);
      if (parts[0] !== 'cpu') return 0;

      const user = parseInt(parts[1], 10) || 0;
      const nice = parseInt(parts[2], 10) || 0;
      const system = parseInt(parts[3], 10) || 0;
      const idle = parseInt(parts[4], 10) || 0;
      const iowait = parseInt(parts[5], 10) || 0;
      const irq = parseInt(parts[6], 10) || 0;
      const softirq = parseInt(parts[7], 10) || 0;

      const total = user + nice + system + idle + iowait + irq + softirq;
      const active = total - idle - iowait;

      // This gives instant usage, not delta-based
      return Math.round((active / total) * 100);
    } catch {
      return 0;
    }
  }, []);

  // Parse memory info from /proc/meminfo
  const parseMemoryInfo = useCallback(async (): Promise<{ total: number; used: number; available: number }> => {
    try {
      const output = await shell('cat /proc/meminfo');
      const lines = output.split('\n');

      let total = 0;
      let available = 0;
      let free = 0;
      let buffers = 0;
      let cached = 0;

      for (const line of lines) {
        const match = line.match(/^(\w+):\s+(\d+)/);
        if (match) {
          const key = match[1];
          const value = parseInt(match[2], 10) * 1024; // Convert from KB to bytes
          if (key === 'MemTotal') total = value;
          if (key === 'MemAvailable') available = value;
          if (key === 'MemFree') free = value;
          if (key === 'Buffers') buffers = value;
          if (key === 'Cached') cached = value;
        }
      }

      // If MemAvailable not present (older Android), calculate it
      if (available === 0) {
        available = free + buffers + cached;
      }

      return {
        total,
        available,
        used: total - available,
      };
    } catch {
      return { total: 0, used: 0, available: 0 };
    }
  }, []);

  // Parse top processes
  const parseProcesses = useCallback(async (): Promise<ProcessInfo[]> => {
    try {
      const output = await shell('top -n 1 -b | head -20');
      const lines = output.split('\n');
      const procs: ProcessInfo[] = [];

      // Find the header line to determine column positions
      let headerIndex = -1;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('PID') && (lines[i].includes('CPU') || lines[i].includes('%CPU'))) {
          headerIndex = i;
          break;
        }
      }

      if (headerIndex === -1) return [];

      // Parse data lines after header
      for (let i = headerIndex + 1; i < lines.length && procs.length < 10; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parts = line.split(/\s+/);
        if (parts.length < 9) continue;

        // Format varies by Android version, try common formats
        // PID USER PR NI VIRT RES SHR S %CPU %MEM TIME+ ARGS
        const pid = parts[0];
        const user = parts[1];
        const cpuStr = parts.find((p) => p.includes('%') || /^\d+\.?\d*$/.test(p));
        let cpu = 0;
        let mem = 0;

        // Try to find CPU and MEM columns
        for (let j = 0; j < parts.length; j++) {
          const val = parseFloat(parts[j]);
          if (!isNaN(val) && val >= 0 && val <= 100) {
            if (cpu === 0) cpu = val;
            else if (mem === 0) {
              mem = val;
              break;
            }
          }
        }

        const name = parts[parts.length - 1];

        if (pid && name) {
          procs.push({ pid, user, cpu, mem, name });
        }
      }

      return procs.sort((a, b) => b.cpu - a.cpu);
    } catch {
      return [];
    }
  }, []);

  // Parse battery info
  const parseBatteryInfo = useCallback(async (): Promise<BatteryInfo | null> => {
    try {
      const output = await shell('dumpsys battery');
      const info: BatteryInfo = {
        level: 0,
        temperature: 0,
        voltage: 0,
        status: 'Unknown',
      };

      const levelMatch = output.match(/level:\s*(\d+)/);
      if (levelMatch) info.level = parseInt(levelMatch[1], 10);

      const tempMatch = output.match(/temperature:\s*(\d+)/);
      if (tempMatch) info.temperature = parseInt(tempMatch[1], 10) / 10; // Convert to Celsius

      const voltageMatch = output.match(/voltage:\s*(\d+)/);
      if (voltageMatch) info.voltage = parseInt(voltageMatch[1], 10) / 1000; // Convert to V

      const statusMatch = output.match(/status:\s*(\d+)/);
      if (statusMatch) {
        const statusCode = parseInt(statusMatch[1], 10);
        const statuses = ['Unknown', 'Unknown', 'Charging', 'Discharging', 'Not charging', 'Full'];
        info.status = statuses[statusCode] || 'Unknown';
      }

      return info;
    } catch {
      return null;
    }
  }, []);

  // Collect all metrics
  const collectMetrics = useCallback(async () => {
    const timestamp = Date.now();

    const [cpuUsage, memInfo, procs, batteryInfo] = await Promise.all([
      parseCpuUsage(),
      parseMemoryInfo(),
      parseProcesses(),
      parseBatteryInfo(),
    ]);

    setCpuHistory((prev) => {
      const newData = [...prev, { timestamp, usage: cpuUsage }];
      return newData.slice(-MAX_DATA_POINTS);
    });

    setMemoryHistory((prev) => {
      const newData = [...prev, { timestamp, ...memInfo }];
      return newData.slice(-MAX_DATA_POINTS);
    });

    setProcesses(procs);

    if (batteryInfo) {
      setBattery(batteryInfo);

      // Calculate drain rate
      if (previousBatteryLevel !== null && batteryInfo.status === 'Discharging') {
        const timeDiff = (timestamp - lastBatteryCheckRef.current) / 1000 / 3600; // hours
        if (timeDiff > 0) {
          const levelDiff = previousBatteryLevel - batteryInfo.level;
          if (levelDiff > 0) {
            setDrainRate(Math.round(levelDiff / timeDiff * 10) / 10); // %/hour
          }
        }
      }

      setPreviousBatteryLevel(batteryInfo.level);
      lastBatteryCheckRef.current = timestamp;
    }
  }, [parseCpuUsage, parseMemoryInfo, parseProcesses, parseBatteryInfo, previousBatteryLevel]);

  // Start/stop monitoring
  useEffect(() => {
    if (isMonitoring && isConnected) {
      collectMetrics(); // Initial collection
      intervalRef.current = setInterval(collectMetrics, refreshRate);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isMonitoring, isConnected, refreshRate, collectMetrics]);

  // Format bytes to human readable
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
  };

  // Export snapshot
  const exportSnapshot = () => {
    const snapshot = {
      timestamp: new Date().toISOString(),
      cpu: cpuHistory.slice(-1)[0]?.usage || 0,
      memory: memoryHistory.slice(-1)[0] || { total: 0, used: 0, available: 0 },
      battery,
      drainRate,
      topProcesses: processes,
    };

    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-snapshot-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Snapshot exported');
  };

  // Simple line graph component
  const Graph = ({ data, maxValue, color, label }: { data: number[]; maxValue: number; color: string; label: string }) => {
    const width = 400;
    const height = 100;
    const padding = 20;

    if (data.length < 2) {
      return (
        <div className="bg-gray-800 rounded-md p-4" style={{ width, height: height + 40 }}>
          <div className="text-sm text-gray-400 mb-2">{label}</div>
          <div className="flex items-center justify-center h-full text-gray-500">Collecting data...</div>
        </div>
      );
    }

    const points = data.map((value, index) => {
      const x = padding + (index / (data.length - 1)) * (width - 2 * padding);
      const y = height - padding - (value / maxValue) * (height - 2 * padding);
      return `${x},${y}`;
    }).join(' ');

    const currentValue = data[data.length - 1];

    return (
      <div className="bg-gray-800 rounded-md p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-400">{label}</span>
          <span className="text-lg font-mono" style={{ color }}>{currentValue.toFixed(1)}%</span>
        </div>
        <svg width={width} height={height} className="w-full">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((pct) => (
            <line
              key={pct}
              x1={padding}
              x2={width - padding}
              y1={height - padding - (pct / 100) * (height - 2 * padding)}
              y2={height - padding - (pct / 100) * (height - 2 * padding)}
              stroke="#374151"
              strokeWidth={1}
            />
          ))}
          {/* Data line */}
          <polyline
            fill="none"
            stroke={color}
            strokeWidth={2}
            points={points}
          />
        </svg>
      </div>
    );
  };

  if (!isConnected) {
    return (
      <PageLayout>
        <div className="h-full flex items-center justify-center p-6">
          <EmptyState
            title="No Device Connected"
            description="Connect an Android device to monitor performance."
          />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="h-full flex flex-col p-4 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Performance Monitor</h1>
          <div className="flex gap-2 items-center">
            {/* Refresh Rate Selector */}
            <div className="flex items-center gap-2 bg-gray-800 rounded-md p-1">
              {REFRESH_RATES.map((rate) => (
                <button
                  key={rate.value}
                  onClick={() => setRefreshRate(rate.value)}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    refreshRate === rate.value
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {rate.label}
                </button>
              ))}
            </div>

            <Button
              variant={isMonitoring ? 'warning' : 'primary'}
              size="small"
              onClick={() => setIsMonitoring(!isMonitoring)}
            >
              {isMonitoring ? 'Stop' : 'Start'} Monitoring
            </Button>

            <Button variant="secondary" size="small" onClick={exportSnapshot}>
              Export Snapshot
            </Button>
          </div>
        </div>

        {/* Graphs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <Graph
            data={cpuHistory.map((d) => d.usage)}
            maxValue={100}
            color="#3B82F6"
            label="CPU Usage"
          />
          <Graph
            data={memoryHistory.map((d) => (d.used / d.total) * 100 || 0)}
            maxValue={100}
            color="#10B981"
            label="Memory Usage"
          />
        </div>

        {/* Battery & Memory Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Memory Details */}
          <div className="bg-gray-800 rounded-md p-4">
            <h3 className="text-sm text-gray-400 mb-2">Memory</h3>
            {memoryHistory.length > 0 ? (
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total:</span>
                  <span>{formatBytes(memoryHistory[memoryHistory.length - 1].total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Used:</span>
                  <span>{formatBytes(memoryHistory[memoryHistory.length - 1].used)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Available:</span>
                  <span>{formatBytes(memoryHistory[memoryHistory.length - 1].available)}</span>
                </div>
              </div>
            ) : (
              <div className="text-gray-500">-</div>
            )}
          </div>

          {/* Battery Info */}
          <div className="bg-gray-800 rounded-md p-4">
            <h3 className="text-sm text-gray-400 mb-2">Battery</h3>
            {battery ? (
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-400">Level:</span>
                  <span className={battery.level < 20 ? 'text-red-400' : ''}>{battery.level}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span>{battery.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Voltage:</span>
                  <span>{battery.voltage.toFixed(2)} V</span>
                </div>
              </div>
            ) : (
              <div className="text-gray-500">-</div>
            )}
          </div>

          {/* Temperature & Drain Rate */}
          <div className="bg-gray-800 rounded-md p-4">
            <h3 className="text-sm text-gray-400 mb-2">Temperature & Drain</h3>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-400">Temperature:</span>
                <span className={battery && battery.temperature > 40 ? 'text-red-400' : ''}>
                  {battery ? `${battery.temperature.toFixed(1)}°C` : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Drain Rate:</span>
                <span>{drainRate !== null ? `${drainRate}%/hr` : '-'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Process Table */}
        <div className="flex-1 bg-gray-800 rounded-md overflow-hidden">
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold">Top Processes</h3>
          </div>
          <div className="overflow-auto max-h-64">
            <table className="w-full">
              <thead className="bg-gray-900 sticky top-0">
                <tr className="text-left text-sm text-gray-400">
                  <th className="p-3">PID</th>
                  <th className="p-3">User</th>
                  <th className="p-3 text-right">CPU %</th>
                  <th className="p-3 text-right">MEM %</th>
                  <th className="p-3">Process</th>
                </tr>
              </thead>
              <tbody>
                {processes.length > 0 ? (
                  processes.map((proc, index) => (
                    <tr key={`${proc.pid}-${index}`} className="border-t border-gray-700">
                      <td className="p-3 font-mono text-sm">{proc.pid}</td>
                      <td className="p-3 text-sm text-gray-400">{proc.user}</td>
                      <td className="p-3 text-right font-mono">
                        <span className={proc.cpu > 50 ? 'text-red-400' : proc.cpu > 20 ? 'text-yellow-400' : ''}>
                          {proc.cpu.toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono">{proc.mem.toFixed(1)}%</td>
                      <td className="p-3 text-sm truncate max-w-xs">{proc.name}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">
                      {isMonitoring ? 'Collecting data...' : 'Start monitoring to see processes'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
