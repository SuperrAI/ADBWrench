'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { PageLayout } from '@/design-system/patterns/PageLayout/PageLayout';
import { useDevice } from '@/context/device-context';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/design-system/components/Button';
import { shell } from '@/services/adb';
import { toast } from 'sonner';
import {
  Activity,
  Cpu,
  Zap,
  Thermometer,
  Play,
  Square,
  Download,
  Server,
  Microchip
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

interface CpuData { timestamp: number; usage: number; }
interface MemoryData { timestamp: number; total: number; used: number; available: number; }
interface ProcessInfo { pid: string; user: string; cpu: number; mem: number; name: string; }
interface BatteryInfo { level: number; temperature: number; voltage: number; status: string; }

const MAX_DATA_POINTS = 60;

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
      const output = await shell('cat /proc/stat | head -1');
      const parts = output.trim().split(/\s+/);
      if (parts[0] !== 'cpu') return 0;
      const total = parts.slice(1).map(Number).reduce((a, b) => a + b, 0);
      const idle = Number(parts[4]);
      // Note: This is a simplistic instantaneous calculation. 
      // Ideally should be diff from previous sample. 
      // For now, simpler approximation or 0-100 logic requires state.
      // Let's rely on simple `top -n 1` summary for cleaner % if needed, or stick to this.
      // Actually, standard linux calculation requires 2 samples. 
      // Let's use `dumpsys cpuinfo` or just parsed `top` header for easier real-time avg.
      // Fallback: Use `top` header line if available (simpler for single call)
      const topHeader = await shell('top -n 1 -b -m 1 | head -5');
      const match = topHeader.match(/User\s+(\d+)%.*System\s+(\d+)%/i) || topHeader.match(/(\d+)%\s+user.*(\d+)%\s+sys/i);
      if (match) return Math.min(100, Number(match[1]) + Number(match[2]));
      return 0; // Fallback
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
        status: output.match(/status:\s*(\d+)/)?.[1] === '2' ? 'Charging' : 'Discharging' // 2 is typically charging constant
      };
    } catch { return null; }
  }, []);

  const parseProcesses = useCallback(async (): Promise<ProcessInfo[]> => {
    try {
      const output = await shell('top -n 1 -b -m 10'); // Max 10 sorted by CPU usually
      // Start lines after header (usually look for PID)
      const lines = output.split('\n');
      const headerIdx = lines.findIndex(l => l.includes('PID'));
      if (headerIdx === -1) return [];

      return lines.slice(headerIdx + 1, headerIdx + 11).map(line => {
        const parts = line.trim().split(/\s+/);
        if (parts.length < 9) return null;
        // Heuristic mapping - may vary by android version
        // PID USER PR NI VIRT RES SHR S %CPU %MEM TIME+ ARGS
        const cpuIdx = parts.findIndex(p => p.includes('%') && !p.includes('CPU')) !== -1
          ? parts.findIndex(p => p.includes('%')) // first % col usually CPU
          : 8; // default fallback

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
    if (!b) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(b) / Math.log(1024));
    return `${(b / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
  };

  if (connectionState !== 'connected') {
    return (
      <PageLayout>
        <div className="h-full flex items-center justify-center p-8">
          <EmptyState title="Performance Monitor" description="Connect a device to track metrics." icon={<Activity className="w-16 h-16 text-muted-foreground/30" />} />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="h-full flex flex-col bg-background overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20">

        {/* Header */}
        <div className="px-6 py-4 border-b border-border/60 bg-card/30 backdrop-blur-sm sticky top-0 z-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Activity className="w-5 h-5" />
            </div>
            <h1 className="text-lg font-bold tracking-tight">Performance</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
              {[1000, 2000, 5000].map(r => (
                <button key={r} onClick={() => setRefreshRate(r)} className={cn("px-2 py-1 text-xs rounded transition-all", refreshRate === r ? "bg-background shadow font-medium" : "text-muted-foreground hover:text-foreground")}>
                  {(r / 1000)}s
                </button>
              ))}
            </div>
            <Button
              variant={isMonitoring ? 'warning' : 'primary'}
              size="small"
              icon={isMonitoring ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              onClick={() => setIsMonitoring(!isMonitoring)}
            >
              {isMonitoring ? 'Stop' : 'Start'}
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* CPU Card */}
            <Card className="bg-gradient-to-br from-blue-500/10 via-card/80 to-card border-blue-500/20 backdrop-blur-sm overflow-hidden relative group hover:border-blue-500/40 transition-colors">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-500/20 transition-colors" />
              <CardContent className="p-5 flex items-center justify-between relative">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">CPU Load</p>
                  <p className="text-3xl font-bold mt-1 tabular-nums">{cpuHistory.slice(-1)[0]?.usage || 0}<span className="text-lg text-muted-foreground">%</span></p>
                </div>
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <Cpu className="w-6 h-6 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            {/* Memory Card */}
            <Card className="bg-gradient-to-br from-emerald-500/10 via-card/80 to-card border-emerald-500/20 backdrop-blur-sm overflow-hidden relative group hover:border-emerald-500/40 transition-colors">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-emerald-500/20 transition-colors" />
              <CardContent className="p-5 flex items-center justify-between relative">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Memory Used</p>
                  <p className="text-3xl font-bold mt-1 tabular-nums">{memoryHistory.slice(-1)[0] ? Math.round((memoryHistory.slice(-1)[0].used / memoryHistory.slice(-1)[0].total) * 100) : 0}<span className="text-lg text-muted-foreground">%</span></p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <Server className="w-6 h-6 text-emerald-500" />
                </div>
              </CardContent>
            </Card>

            {/* Battery Card */}
            <Card className={cn(
              "bg-gradient-to-br via-card/80 to-card backdrop-blur-sm overflow-hidden relative group transition-colors",
              (battery?.level || 0) <= 20
                ? "from-red-500/10 border-red-500/20 hover:border-red-500/40"
                : (battery?.level || 0) <= 50
                ? "from-amber-500/10 border-amber-500/20 hover:border-amber-500/40"
                : "from-green-500/10 border-green-500/20 hover:border-green-500/40"
            )}>
              <div className={cn(
                "absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 transition-colors",
                (battery?.level || 0) <= 20 ? "bg-red-500/10 group-hover:bg-red-500/20" :
                (battery?.level || 0) <= 50 ? "bg-amber-500/10 group-hover:bg-amber-500/20" :
                "bg-green-500/10 group-hover:bg-green-500/20"
              )} />
              <CardContent className="p-5 flex items-center justify-between relative">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Battery Level</p>
                  <p className={cn(
                    "text-3xl font-bold mt-1 tabular-nums",
                    (battery?.level || 0) <= 20 ? "text-red-500" : (battery?.level || 0) <= 50 ? "text-amber-500" : "text-green-500"
                  )}>{battery?.level || 0}<span className="text-lg text-muted-foreground">%</span></p>
                  {battery?.status === 'Charging' && <p className="text-[10px] text-amber-500 font-medium mt-0.5">Charging</p>}
                </div>
                <div className={cn(
                  "p-3 rounded-xl border",
                  (battery?.level || 0) <= 20 ? "bg-red-500/10 border-red-500/20" :
                  (battery?.level || 0) <= 50 ? "bg-amber-500/10 border-amber-500/20" :
                  "bg-green-500/10 border-green-500/20"
                )}>
                  <Zap className={cn(
                    "w-6 h-6",
                    battery?.status === 'Charging' ? "text-amber-400 fill-current animate-pulse" :
                    (battery?.level || 0) <= 20 ? "text-red-500" :
                    (battery?.level || 0) <= 50 ? "text-amber-500" : "text-green-500"
                  )} />
                </div>
              </CardContent>
            </Card>

            {/* Temperature Card */}
            <Card className={cn(
              "bg-gradient-to-br via-card/80 to-card backdrop-blur-sm overflow-hidden relative group transition-colors",
              (battery?.temperature || 0) >= 45
                ? "from-red-500/10 border-red-500/20 hover:border-red-500/40"
                : (battery?.temperature || 0) >= 35
                ? "from-orange-500/10 border-orange-500/20 hover:border-orange-500/40"
                : "from-slate-500/10 border-border/50 hover:border-border"
            )}>
              <div className={cn(
                "absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 transition-colors",
                (battery?.temperature || 0) >= 45 ? "bg-red-500/10 group-hover:bg-red-500/20" :
                (battery?.temperature || 0) >= 35 ? "bg-orange-500/10 group-hover:bg-orange-500/20" :
                "bg-slate-500/5 group-hover:bg-slate-500/10"
              )} />
              <CardContent className="p-5 flex items-center justify-between relative">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Temperature</p>
                  <p className={cn(
                    "text-3xl font-bold mt-1 tabular-nums",
                    (battery?.temperature || 0) >= 45 ? "text-red-500" : (battery?.temperature || 0) >= 35 ? "text-orange-500" : ""
                  )}>{battery?.temperature || 0}<span className="text-lg text-muted-foreground">°C</span></p>
                </div>
                <div className={cn(
                  "p-3 rounded-xl border",
                  (battery?.temperature || 0) >= 45 ? "bg-red-500/10 border-red-500/20" :
                  (battery?.temperature || 0) >= 35 ? "bg-orange-500/10 border-orange-500/20" :
                  "bg-slate-500/10 border-border/50"
                )}>
                  <Thermometer className={cn(
                    "w-6 h-6",
                    (battery?.temperature || 0) >= 45 ? "text-red-500" :
                    (battery?.temperature || 0) >= 35 ? "text-orange-500" : "text-muted-foreground"
                  )} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-border/50 bg-card/60 backdrop-blur-sm overflow-hidden">
              <CardHeader className="pb-2 border-b border-border/30">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <CardTitle className="text-sm font-medium">CPU History</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="h-64 p-4 pt-2">
                {cpuHistory.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground/50">
                    <Cpu className="w-10 h-10 mb-2 stroke-[1.5]" />
                    <p className="text-xs">Start monitoring to see CPU data</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={cpuHistory}>
                      <defs>
                        <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="timestamp" tick={false} axisLine={false} />
                      <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fill: '#6b7280', fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', fontSize: '12px' }}
                        itemStyle={{ color: '#fff' }}
                        labelFormatter={() => ''}
                      />
                      <Area type="monotone" dataKey="usage" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCpu)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/60 backdrop-blur-sm overflow-hidden">
              <CardHeader className="pb-2 border-b border-border/30">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <CardTitle className="text-sm font-medium">Memory History (GB)</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="h-64 p-4 pt-2">
                {memoryHistory.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground/50">
                    <Server className="w-10 h-10 mb-2 stroke-[1.5]" />
                    <p className="text-xs">Start monitoring to see memory data</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={memoryHistory}>
                      <defs>
                        <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="timestamp" tick={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fill: '#6b7280', fontSize: 10 }} tickFormatter={(val) => (val / 1024 / 1024 / 1024).toFixed(1)} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', fontSize: '12px' }}
                        itemStyle={{ color: '#fff' }}
                        labelFormatter={() => ''}
                        formatter={(val: number) => [formatBytes(val), 'used']}
                      />
                      <Area type="monotone" dataKey="used" stroke="#10b981" fillOpacity={1} fill="url(#colorMem)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top Processes */}
          <Card className="border-border/50 bg-card/60 backdrop-blur-sm overflow-hidden">
            <CardHeader className="pb-2 border-b border-border/30">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <CardTitle className="text-sm font-medium">Top Processes</CardTitle>
                {processes.length > 0 && (
                  <span className="text-xs text-muted-foreground ml-auto">{processes.length} processes</span>
                )}
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[11px] text-muted-foreground bg-muted/30 uppercase font-semibold tracking-wider">
                  <tr>
                    <th className="px-4 py-3">PID</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3 text-right">CPU%</th>
                    <th className="px-4 py-3 text-right">Mem%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {processes.map((proc, i) => (
                    <tr key={i} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{proc.pid}</td>
                      <td className="px-4 py-3 font-medium truncate max-w-[200px]" title={proc.name}>{proc.name}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{proc.user}</td>
                      <td className={cn("px-4 py-3 text-right font-mono tabular-nums", proc.cpu > 50 ? "text-red-500 font-bold" : proc.cpu > 20 ? "text-amber-500 font-semibold" : "")}>{proc.cpu.toFixed(1)}%</td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-muted-foreground">{proc.mem.toFixed(1)}%</td>
                    </tr>
                  ))}
                  {processes.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-12">
                        <div className="flex flex-col items-center justify-center text-muted-foreground/50">
                          <Microchip className="w-10 h-10 mb-3 stroke-[1.5]" />
                          <p className="text-sm font-medium">No process data</p>
                          <p className="text-xs mt-1">Click Start to begin monitoring</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

        </div>
      </div>
    </PageLayout>
  );
}
