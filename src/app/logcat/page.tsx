'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { PageLayout } from '@/design-system/patterns/PageLayout/PageLayout';
import { EmptyState } from '@/components/ui/EmptyState';
import { useDevice } from '@/context/device-context';
import { Button } from '@/design-system/components/Button';
import { shellStream } from '@/services/adb';
import { cn } from '@/lib/utils';
import {
  Play,
  Square,
  Trash2,
  Download,
  Search,
  Filter,
  Clock,
  AlignLeft,
  FileText,
  Pause
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Constants ---
const LOG_LEVELS = {
  V: { name: 'Verbose', color: 'text-zinc-500', bg: 'bg-zinc-500/10', border: 'border-zinc-500/20' },
  D: { name: 'Debug', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  I: { name: 'Info', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  W: { name: 'Warn', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  E: { name: 'Error', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  F: { name: 'Fatal', color: 'text-red-500', bg: 'bg-red-500/20', border: 'border-red-500/40' },
} as const;

type LogLevel = keyof typeof LOG_LEVELS;

const BUFFERS = [
  { value: 'main', label: 'Main' },
  { value: 'system', label: 'System' },
  { value: 'crash', label: 'Crash' },
  { value: 'events', label: 'Events' },
  { value: 'all', label: 'All Buffers' },
];

interface LogEntry {
  id: string;
  raw: string;
  timestamp?: string;
  pid?: string;
  tid?: string;
  level: LogLevel;
  tag: string;
  message: string;
}

// Format: MM-DD HH:MM:SS.mmm PID TID LEVEL TAG: MESSAGE
function parseLogLine(line: string, id: string): LogEntry | null {
  if (!line.trim()) return null;

  const threadtimeMatch = line.match(
    /^(\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}\.\d{3})\s+(\d+)\s+(\d+)\s+([VDIWEF])\s+(\S+)\s*:\s*(.*)$/
  );
  if (threadtimeMatch) {
    return {
      id,
      raw: line,
      timestamp: threadtimeMatch[1],
      pid: threadtimeMatch[2],
      tid: threadtimeMatch[3],
      level: threadtimeMatch[4] as LogLevel,
      tag: threadtimeMatch[5],
      message: threadtimeMatch[6],
    };
  }

  // Brief format fallback
  const briefMatch = line.match(/^([VDIWEF])\/(\S+)\s*\(\s*(\d+)\):\s*(.*)$/);
  if (briefMatch) {
    return {
      id,
      raw: line,
      level: briefMatch[1] as LogLevel,
      tag: briefMatch[2],
      pid: briefMatch[3],
      message: briefMatch[4],
    };
  }

  return {
    id,
    raw: line,
    level: line.includes(' E ') ? 'E' : 'I', // Rough heuristic
    tag: '<unknown>',
    message: line
  };
}

export default function LogcatPage() {
  const { connectionState } = useDevice();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showTimestamp, setShowTimestamp] = useState(true);
  const [buffer, setBuffer] = useState('main');
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<LogLevel[]>(['V', 'D', 'I', 'W', 'E', 'F']);
  const [tagFilter, setTagFilter] = useState('');

  const logsRef = useRef<HTMLDivElement>(null);
  const stopFnRef = useRef<(() => void) | null>(null);
  const logIdRef = useRef(0);

  // Auto-scroll logic
  useEffect(() => {
    if (autoScroll && logsRef.current) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  // Command Stream Handler
  const startStreaming = useCallback(async () => {
    if (connectionState !== 'connected') return;
    setIsStreaming(true);
    setLogs([]); // Clear on start prefers a fresh session usually

    try {
      const bufferArg = buffer === 'all' ? '' : `-b ${buffer}`;
      const { exit } = await shellStream(
        `logcat -v threadtime ${bufferArg}`,
        (data) => {
          const lines = data.split('\n');
          const newEntries = lines
            .map(line => parseLogLine(line, `log-${logIdRef.current++}`))
            .filter(Boolean) as LogEntry[];

          setLogs(prev => {
            const updated = [...prev, ...newEntries];
            return updated.slice(-5000); // Keep last 5000 lines
          });
        },
        () => { } // Ignore stderr for now
      );
      stopFnRef.current = exit;
    } catch (e) {
      setIsStreaming(false);
    }
  }, [connectionState, buffer]);

  const stopStreaming = () => {
    stopFnRef.current?.();
    setIsStreaming(false);
  };

  const clearLogs = () => setLogs([]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (!levelFilter.includes(log.level)) return false;
      if (tagFilter && !log.tag.toLowerCase().includes(tagFilter.toLowerCase())) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return log.message.toLowerCase().includes(q) || log.tag.toLowerCase().includes(q);
      }
      return true;
    });
  }, [logs, levelFilter, tagFilter, searchQuery]);

  // Clean up
  useEffect(() => () => stopStreaming(), []);

  if (connectionState !== 'connected') {
    return (
      <PageLayout>
        <div className="h-full flex items-center justify-center p-8">
          <EmptyState
            title="Logcat Disconnected"
            description="Connect an Android device to start streaming logs."
            icon={<FileText className="w-16 h-16 text-muted-foreground/30" />}
          />
        </div>
      </PageLayout>
    );
  }

  // Helper to toggle log level
  const toggleLevel = (l: LogLevel) => {
    setLevelFilter(prev => prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l]);
  };

  return (
    <PageLayout>
      <div className="h-full flex flex-col bg-background overflow-hidden font-sans">

        {/* Top Control Bar */}
        <div className="flex flex-col border-b border-border/60 bg-card/50 backdrop-blur-md z-10">

          {/* Row 1: Main Controls */}
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <AlignLeft className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-foreground">Logcat</h1>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{filteredLogs.length} events</span>
                  <span className="w-1 h-1 bg-muted-foreground/50 rounded-full" />
                  <span>{buffer}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={buffer}
                onChange={(e) => setBuffer(e.target.value)}
                disabled={isStreaming}
                className="bg-transparent border border-border rounded-md px-2 py-1.5 text-xs font-medium outline-none hover:bg-muted/50 transition-colors"
              >
                {BUFFERS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
              </select>

              <div className="h-6 w-px bg-border mx-1" />

              <Button
                variant={autoScroll ? "secondary" : "ghost"}
                size="small"
                onClick={() => setAutoScroll(!autoScroll)}
                icon={<Clock className={cn("w-3.5 h-3.5", autoScroll && "text-primary")} />}
              >
                Auto-scroll
              </Button>

              {isStreaming ? (
                <Button variant="warning" size="small" onClick={stopStreaming} icon={<Square className="w-3 h-3 fill-current" />}>
                  Stop
                </Button>
              ) : (
                <Button variant="primary" size="small" onClick={startStreaming} icon={<Play className="w-3 h-3 fill-current" />}>
                  Start
                </Button>
              )}

              <Button variant="ghost" size="small" onClick={clearLogs} icon={<Trash2 className="w-4 h-4" />} />
            </div>
          </div>

          {/* Row 2: Filters */}
          <div className="px-4 py-2 bg-muted/20 border-t border-border/40 flex items-center gap-4 overflow-x-auto scrollbar-hide">
            {/* Search */}
            <div className="relative flex items-center group">
              <Search className="w-3.5 h-3.5 absolute left-2.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter logs..."
                className="bg-background border border-border rounded-md pl-8 pr-3 py-1 text-xs w-48 focus:w-64 transition-all outline-none focus:ring-1 focus:ring-primary/20"
              />
            </div>

            {/* Tag Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                placeholder="Tag..."
                className="bg-transparent border-b border-border hover:border-primary/50 focus:border-primary px-1 py-0.5 text-xs outline-none w-24 transition-colors"
              />
            </div>

            <div className="h-4 w-px bg-border mx-2" />

            {/* Level Toggles */}
            <div className="flex items-center gap-1">
              {(Object.keys(LOG_LEVELS) as LogLevel[]).map(level => (
                <button
                  key={level}
                  onClick={() => toggleLevel(level)}
                  className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-bold border transition-all",
                    levelFilter.includes(level)
                      ? `${LOG_LEVELS[level].bg} ${LOG_LEVELS[level].color} ${LOG_LEVELS[level].border}`
                      : "bg-transparent text-muted-foreground border-transparent hover:bg-muted"
                  )}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Logs Virtual List Replacement (Native Scroll) */}
        <div
          ref={logsRef}
          className="flex-1 overflow-y-auto bg-zinc-950 font-mono text-[11px] leading-relaxed scrollbar-thin scrollbar-thumb-zinc-700 hover:scrollbar-thumb-zinc-600"
        >
          {filteredLogs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-600">
              <FileText className="w-12 h-12 mb-2 opacity-20" />
              <p>No matching logs</p>
            </div>
          ) : (
            <div className="w-full">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className={cn(
                    "flex items-start gap-3 px-4 py-[2px] hover:bg-white/5 transition-colors border-l-2",
                    LOG_LEVELS[log.level].color,
                    `border-${LOG_LEVELS[log.level].color.split('-')[1]}-500/50` // Dynamic border color matching level
                  )}
                >
                  {showTimestamp && (
                    <span className="shrink-0 text-zinc-500 w-24 select-none">{log.timestamp?.split(' ')[1] || '--:--:--'}</span>
                  )}
                  <span className={cn("shrink-0 font-bold w-3 text-center select-none", LOG_LEVELS[log.level].color)}>
                    {log.level}
                  </span>
                  <span className="shrink-0 w-32 truncate text-zinc-300 font-semibold" title={log.tag}>
                    {log.tag}
                  </span>
                  <span className="flex-1 text-zinc-400 break-all whitespace-pre-wrap">
                    {log.message}
                  </span>
                </div>
              ))}
              {/* Anchor for auto-scroll */}
              <div className="h-px" />
            </div>
          )}
        </div>

        {/* Streaming Status Footer */}
        {isStreaming && (
          <div className="absolute bottom-4 right-6 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full shadow-lg flex items-center gap-2"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              LIVE
            </motion.div>
          </div>
        )}

      </div>
    </PageLayout>
  );
}
