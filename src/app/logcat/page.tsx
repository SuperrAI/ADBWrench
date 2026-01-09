'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { PageLayout } from '@/design-system/patterns/PageLayout/PageLayout';
import { EmptyState } from '@/components/ui/EmptyState';
import { useDevice } from '@/context/device-context';
import { Button } from '@/design-system/components/Button';
import { shellStream } from '@/services/adb';
import { textStyles } from '@/design-system/foundations/typography';
import { cn } from '@/lib/utils';

// Log levels with colors
const LOG_LEVELS = {
  V: { name: 'Verbose', color: 'text-neutral-400', bg: 'bg-neutral-800' },
  D: { name: 'Debug', color: 'text-blue-400', bg: 'bg-blue-900/30' },
  I: { name: 'Info', color: 'text-green-400', bg: 'bg-green-900/30' },
  W: { name: 'Warn', color: 'text-amber-400', bg: 'bg-amber-900/30' },
  E: { name: 'Error', color: 'text-red-400', bg: 'bg-red-900/30' },
  F: { name: 'Fatal', color: 'text-red-600', bg: 'bg-red-900/50' },
} as const;

type LogLevel = keyof typeof LOG_LEVELS;

// Buffer options
const BUFFERS = [
  { value: 'main', label: 'Main' },
  { value: 'system', label: 'System' },
  { value: 'crash', label: 'Crash' },
  { value: 'events', label: 'Events' },
  { value: 'all', label: 'All' },
];

// Max buffer sizes
const MAX_BUFFER_OPTIONS = [
  { value: 1000, label: '1,000' },
  { value: 5000, label: '5,000' },
  { value: 10000, label: '10,000' },
  { value: 25000, label: '25,000' },
  { value: 50000, label: '50,000' },
];

// Icons
const PlayIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 3L13 8L4 13V3Z" fill="currentColor" />
  </svg>
);

const StopIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="10" height="10" rx="1" fill="currentColor" />
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 4H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M5 4V3C5 2.44772 5.44772 2 6 2H10C10.5523 2 11 2.44772 11 3V4" stroke="currentColor" strokeWidth="1.5" />
    <path d="M3 4L4 13C4 13.5523 4.44772 14 5 14H11C11.5523 14 12 13.5523 12 13L13 4" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 2V10M8 10L5 7M8 10L11 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2 12V13C2 13.5523 2.44772 14 3 14H13C13.5523 14 14 13.5523 14 13V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const ScrollIcon = ({ locked }: { locked: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    {locked ? (
      <path d="M8 2V14M8 14L4 10M8 14L12 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    ) : (
      <path d="M4 6H12M4 10H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    )}
  </svg>
);

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="7" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" />
    <path d="M10 10L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// Parsed log entry
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

// Parse logcat line
// Format: MM-DD HH:MM:SS.mmm PID TID LEVEL TAG: MESSAGE
// Or: LEVEL/TAG(PID): MESSAGE (brief format)
function parseLogLine(line: string, id: string): LogEntry | null {
  if (!line.trim()) return null;

  // Try threadtime format: MM-DD HH:MM:SS.mmm PID TID LEVEL TAG: MESSAGE
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

  // Try brief format: LEVEL/TAG(PID): MESSAGE
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

  // Try simple format: LEVEL TAG: MESSAGE
  const simpleMatch = line.match(/^([VDIWEF])\s+(\S+)\s*:\s*(.*)$/);
  if (simpleMatch) {
    return {
      id,
      raw: line,
      level: simpleMatch[1] as LogLevel,
      tag: simpleMatch[2],
      message: simpleMatch[3],
    };
  }

  // Fallback: treat as info message
  return {
    id,
    raw: line,
    level: 'I',
    tag: 'unknown',
    message: line,
  };
}

export default function LogcatPage() {
  const { connectionState } = useDevice();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showTimestamp, setShowTimestamp] = useState(true);
  const [buffer, setBuffer] = useState('main');
  const [maxBuffer, setMaxBuffer] = useState(10000);
  const [levelFilter, setLevelFilter] = useState<LogLevel[]>(['V', 'D', 'I', 'W', 'E', 'F']);
  const [tagFilter, setTagFilter] = useState('');
  const [tagExclude, setTagExclude] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const logsRef = useRef<HTMLDivElement>(null);
  const stopFnRef = useRef<(() => void) | null>(null);
  const logIdRef = useRef(0);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (logsRef.current && autoScroll) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }
  }, [autoScroll]);

  // Add log entries
  const addLogs = useCallback((text: string) => {
    const lines = text.split('\n');
    const newEntries: LogEntry[] = [];

    for (const line of lines) {
      const entry = parseLogLine(line, `log-${logIdRef.current++}`);
      if (entry) {
        newEntries.push(entry);
      }
    }

    if (newEntries.length > 0) {
      setLogs((prev) => {
        const combined = [...prev, ...newEntries];
        // Prune to max buffer size
        if (combined.length > maxBuffer) {
          return combined.slice(-maxBuffer);
        }
        return combined;
      });
      requestAnimationFrame(scrollToBottom);
    }
  }, [maxBuffer, scrollToBottom]);

  // Start streaming
  const startStreaming = useCallback(async () => {
    if (connectionState !== 'connected') return;

    setIsStreaming(true);

    try {
      const bufferArg = buffer === 'all' ? '' : `-b ${buffer}`;
      const command = `logcat -v threadtime ${bufferArg}`;

      const { exit } = await shellStream(
        command,
        (data) => addLogs(data),
        (data) => addLogs(data)
      );
      stopFnRef.current = exit;
    } catch (err) {
      console.error('Failed to start logcat:', err);
      setIsStreaming(false);
    }
  }, [connectionState, buffer, addLogs]);

  // Stop streaming
  const stopStreaming = useCallback(() => {
    if (stopFnRef.current) {
      stopFnRef.current();
      stopFnRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  // Clear logs
  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  // Export logs
  const exportLogs = useCallback(() => {
    const text = filteredLogs
      .map((log) => log.raw)
      .join('\n');

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logcat-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  // Toggle level filter
  const toggleLevel = useCallback((level: LogLevel) => {
    setLevelFilter((prev) => {
      if (prev.includes(level)) {
        return prev.filter((l) => l !== level);
      }
      return [...prev, level];
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stopFnRef.current) {
        stopFnRef.current();
      }
    };
  }, []);

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Level filter
      if (!levelFilter.includes(log.level)) return false;

      // Tag include filter
      if (tagFilter) {
        const tags = tagFilter.split(',').map((t) => t.trim().toLowerCase());
        if (!tags.some((t) => log.tag.toLowerCase().includes(t))) return false;
      }

      // Tag exclude filter
      if (tagExclude) {
        const tags = tagExclude.split(',').map((t) => t.trim().toLowerCase());
        if (tags.some((t) => log.tag.toLowerCase().includes(t))) return false;
      }

      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !log.message.toLowerCase().includes(query) &&
          !log.tag.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [logs, levelFilter, tagFilter, tagExclude, searchQuery]);

  // Highlight search matches
  const highlightText = useCallback((text: string): React.ReactNode => {
    if (!searchQuery) return text;

    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-500/50 text-yellow-200 rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  }, [searchQuery]);

  if (connectionState !== 'connected') {
    return (
      <PageLayout>
        <div className="h-full flex items-center justify-center p-8">
          <EmptyState
            title="No Device Connected"
            description="Connect an Android device via USB to view logcat."
          />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-4">
            <h1 style={{ ...textStyles.h4 }} className="text-foreground">
              Logcat
            </h1>
            <span className="text-xs text-muted-foreground">
              {filteredLogs.length.toLocaleString()} / {logs.length.toLocaleString()} entries
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Buffer selector */}
            <select
              value={buffer}
              onChange={(e) => setBuffer(e.target.value)}
              disabled={isStreaming}
              className="text-xs bg-background border border-border rounded px-2 py-1 text-foreground"
            >
              {BUFFERS.map((b) => (
                <option key={b.value} value={b.value}>{b.label}</option>
              ))}
            </select>

            {/* Max buffer */}
            <select
              value={maxBuffer}
              onChange={(e) => setMaxBuffer(Number(e.target.value))}
              className="text-xs bg-background border border-border rounded px-2 py-1 text-foreground"
            >
              {MAX_BUFFER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label} max</option>
              ))}
            </select>

            {/* Timestamp toggle */}
            <button
              onClick={() => setShowTimestamp(!showTimestamp)}
              className={cn(
                'text-xs px-2 py-1 rounded border',
                showTimestamp
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground'
              )}
            >
              Time
            </button>

            {/* Auto-scroll toggle */}
            <Button
              variant={autoScroll ? 'secondary' : 'ghost'}
              size="small"
              icon={<ScrollIcon locked={autoScroll} />}
              onClick={() => setAutoScroll(!autoScroll)}
            >
              {autoScroll ? 'Auto' : 'Scroll'}
            </Button>

            {/* Start/Stop */}
            {isStreaming ? (
              <Button variant="primary" size="small" icon={<StopIcon />} onClick={stopStreaming}>
                Stop
              </Button>
            ) : (
              <Button variant="primary" size="small" icon={<PlayIcon />} onClick={startStreaming}>
                Start
              </Button>
            )}

            {/* Clear */}
            <Button
              variant="ghost"
              size="small"
              icon={<TrashIcon />}
              onClick={clearLogs}
              disabled={logs.length === 0}
            >
              Clear
            </Button>

            {/* Export */}
            <Button
              variant="ghost"
              size="small"
              icon={<DownloadIcon />}
              onClick={exportLogs}
              disabled={filteredLogs.length === 0}
            >
              Export
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 py-2 border-b border-border shrink-0 flex flex-wrap items-center gap-3">
          {/* Level filters */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground mr-1">Level:</span>
            {(Object.keys(LOG_LEVELS) as LogLevel[]).map((level) => (
              <button
                key={level}
                onClick={() => toggleLevel(level)}
                className={cn(
                  'text-xs px-1.5 py-0.5 rounded font-mono',
                  levelFilter.includes(level)
                    ? `${LOG_LEVELS[level].color} ${LOG_LEVELS[level].bg}`
                    : 'text-muted-foreground bg-muted/30'
                )}
              >
                {level}
              </button>
            ))}
          </div>

          {/* Tag filter */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">Tag:</span>
            <input
              type="text"
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              placeholder="Include..."
              className="text-xs bg-background border border-border rounded px-2 py-1 w-24 text-foreground"
            />
            <input
              type="text"
              value={tagExclude}
              onChange={(e) => setTagExclude(e.target.value)}
              placeholder="Exclude..."
              className="text-xs bg-background border border-border rounded px-2 py-1 w-24 text-foreground"
            />
          </div>

          {/* Search */}
          <div className="flex items-center gap-1 flex-1 max-w-xs">
            <SearchIcon />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search logs..."
              className="text-xs bg-background border border-border rounded px-2 py-1 flex-1 text-foreground"
            />
          </div>
        </div>

        {/* Log output */}
        <div
          ref={logsRef}
          className="flex-1 overflow-auto bg-neutral-950 font-mono text-xs"
        >
          {filteredLogs.length === 0 ? (
            <div className="text-neutral-500 text-center py-8">
              {logs.length === 0 ? (
                <>
                  <p>No logs yet. Click Start to begin streaming.</p>
                  <p className="text-xs mt-2">
                    Select a buffer and configure filters above.
                  </p>
                </>
              ) : (
                <p>No logs match the current filters.</p>
              )}
            </div>
          ) : (
            <div className="p-2">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className={cn(
                    'flex gap-2 py-0.5 hover:bg-white/5',
                    LOG_LEVELS[log.level].color
                  )}
                >
                  {showTimestamp && log.timestamp && (
                    <span className="text-neutral-500 shrink-0 w-[120px]">
                      {log.timestamp}
                    </span>
                  )}
                  <span className={cn('shrink-0 w-4 font-bold', LOG_LEVELS[log.level].color)}>
                    {log.level}
                  </span>
                  <span className="text-cyan-400 shrink-0 w-[140px] truncate" title={log.tag}>
                    {highlightText(log.tag)}
                  </span>
                  <span className="flex-1 break-all">
                    {highlightText(log.message)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status bar */}
        <div className="px-4 py-2 border-t border-border bg-background text-xs text-muted-foreground flex items-center justify-between shrink-0">
          <span>
            {isStreaming ? (
              <span className="text-green-500">● Streaming from {buffer} buffer</span>
            ) : (
              <span>Stopped</span>
            )}
          </span>
          <span>
            Buffer: {logs.length.toLocaleString()} / {maxBuffer.toLocaleString()}
          </span>
        </div>
      </div>
    </PageLayout>
  );
}
