'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { PageLayout } from '@/design-system/patterns/PageLayout/PageLayout';
import { useDevice } from '@/context/device-context';
import { shellStream } from '@/services/adb';
import { cn } from '@/lib/utils';
import { TerminalSpinner } from '@/components/ui/TerminalUI';

// --- Constants ---
const LOG_LEVELS = {
  V: { name: 'VERBOSE', color: 'text-muted-foreground' },
  D: { name: 'DEBUG', color: 'text-cyan-600 dark:text-cyan-400' },
  I: { name: 'INFO', color: 'text-green-600 dark:text-green-400' },
  W: { name: 'WARN', color: 'text-orange-600 dark:text-orange-400' },
  E: { name: 'ERROR', color: 'text-red-600 dark:text-red-400' },
  F: { name: 'FATAL', color: 'text-red-700 dark:text-red-500' },
} as const;

type LogLevel = keyof typeof LOG_LEVELS;

const BUFFERS = [
  { value: 'main', label: 'MAIN' },
  { value: 'system', label: 'SYSTEM' },
  { value: 'crash', label: 'CRASH' },
  { value: 'events', label: 'EVENTS' },
  { value: 'all', label: 'ALL' },
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
    level: line.includes(' E ') ? 'E' : 'I',
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
    setLogs([]);

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
            return updated.slice(-5000);
          });
        },
        () => { }
      );
      stopFnRef.current = exit;
    } catch {
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

  // Helper to toggle log level
  const toggleLevel = (l: LogLevel) => {
    setLevelFilter(prev => prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l]);
  };

  const handleExport = async () => {
    const text = filteredLogs.map(log => log.raw).join('\n');
    try {
      await navigator.clipboard.writeText(text);
    } catch { }
  };

  if (connectionState !== 'connected') {
    return (
      <PageLayout>
        <div className="h-full flex items-center justify-center p-8 font-mono">
          <div className="text-center">
            <pre className="text-muted-foreground mb-4 text-xs">
{`  _____
 |     |
 | LOG |
 |_____|
   |||`}
            </pre>
            <div className="text-sm mb-2">LOGCAT DISCONNECTED</div>
            <div className="text-xs text-muted-foreground">
              Connect a device to stream logs.
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
              <h1 className="text-sm uppercase tracking-wider">LOGCAT // STREAM</h1>
              <div className="text-xs text-muted-foreground mt-1">
                {filteredLogs.length} EVENTS | BUFFER: {buffer.toUpperCase()}
                {isStreaming && <span className="text-green-500 ml-2">[LIVE]</span>}
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <select
                value={buffer}
                onChange={(e) => setBuffer(e.target.value)}
                disabled={isStreaming}
                className="bg-transparent border border-border px-2 py-1 outline-none disabled:opacity-50"
              >
                {BUFFERS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
              </select>

              {isStreaming ? (
                <button
                  onClick={stopStreaming}
                  className="px-2 py-1 border border-red-500 text-red-500 hover:bg-red-500/10"
                >
                  [ STOP ]
                </button>
              ) : (
                <button
                  onClick={startStreaming}
                  className="px-2 py-1 border border-green-500 text-green-500 hover:bg-green-500/10"
                >
                  [ START ]
                </button>
              )}

              <button
                onClick={clearLogs}
                disabled={logs.length === 0}
                className="px-2 py-1 border border-border hover:bg-muted disabled:opacity-50"
              >
                [ CLEAR ]
              </button>

              <button
                onClick={handleExport}
                disabled={filteredLogs.length === 0}
                className="px-2 py-1 border border-border hover:bg-muted disabled:opacity-50"
              >
                [ COPY ]
              </button>
            </div>
          </div>
        </div>

        {/* Filters Row */}
        <div className="border-b border-border p-2 flex-shrink-0 flex items-center gap-4 overflow-x-auto text-xs">
          {/* Search */}
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">SEARCH:</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="filter..."
              className="bg-transparent border-b border-border px-1 py-0.5 outline-none w-32 focus:border-orange-500"
            />
          </div>

          {/* Tag Filter */}
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">TAG:</span>
            <input
              type="text"
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              placeholder="tag..."
              className="bg-transparent border-b border-border px-1 py-0.5 outline-none w-24 focus:border-orange-500"
            />
          </div>

          <div className="h-4 w-px bg-border" />

          {/* Level Toggles */}
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground mr-1">LEVEL:</span>
            {(Object.keys(LOG_LEVELS) as LogLevel[]).map(level => (
              <button
                key={level}
                onClick={() => toggleLevel(level)}
                className={cn(
                  "px-2 py-0.5 border transition-colors",
                  levelFilter.includes(level)
                    ? `border-current ${LOG_LEVELS[level].color}`
                    : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {level}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-border" />

          {/* Options */}
          <button
            onClick={() => setShowTimestamp(!showTimestamp)}
            className={cn(
              "px-2 py-0.5 border",
              showTimestamp ? "border-orange-500 text-orange-500" : "border-border text-muted-foreground"
            )}
          >
            TIME
          </button>

          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={cn(
              "px-2 py-0.5 border",
              autoScroll ? "border-orange-500 text-orange-500" : "border-border text-muted-foreground"
            )}
          >
            AUTO
          </button>
        </div>

        {/* Logs Output */}
        <div
          ref={logsRef}
          className="flex-1 overflow-y-auto bg-background p-2 text-[11px]"
          onClick={() => {}}
        >
          {filteredLogs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <pre className="mb-4">
{`>_`}
              </pre>
              <p>{isStreaming ? 'WAITING FOR LOGS...' : 'NO LOGS'}</p>
              <p className="text-muted-foreground mt-2">{isStreaming ? '' : 'PRESS START TO BEGIN'}</p>
            </div>
          ) : (
            <div className="space-y-px">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-2 hover:bg-white/5 px-1 leading-snug"
                >
                  {showTimestamp && (
                    <span className="shrink-0 text-muted-foreground w-20 select-none">
                      {log.timestamp?.split(' ')[1]?.substring(0, 8) || '--:--:--'}
                    </span>
                  )}
                  <span className={cn("shrink-0 font-bold w-3 text-center", LOG_LEVELS[log.level].color)}>
                    {log.level}
                  </span>
                  <span className="shrink-0 w-28 truncate text-muted-foreground" title={log.tag}>
                    {log.tag}
                  </span>
                  <span className="flex-1 text-foreground break-all whitespace-pre-wrap">
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          )}

          {isStreaming && (
            <div className="mt-2 text-orange-500">
              <TerminalSpinner label="STREAMING" />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-3 py-2 flex-shrink-0 bg-background">
          <div className="text-[10px] text-muted-foreground flex items-center justify-between">
            <span>V=VERBOSE D=DEBUG I=INFO W=WARN E=ERROR F=FATAL</span>
            <span>{isStreaming && 'CTRL+C OR CLICK STOP TO END'}</span>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
