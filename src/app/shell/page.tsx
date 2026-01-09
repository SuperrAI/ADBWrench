'use client';

import { useState, useEffect, useRef, useCallback, KeyboardEvent } from 'react';
import { PageLayout } from '@/design-system/patterns/PageLayout/PageLayout';
import { EmptyState } from '@/components/ui/EmptyState';
import { useDevice } from '@/context/device-context';
import { Button } from '@/design-system/components/Button';
import { shell, shellStream } from '@/services/adb';
import { textStyles } from '@/design-system/foundations/typography';
import { cn } from '@/lib/utils';

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

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 4H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path
      d="M5 4V3C5 2.44772 5.44772 2 6 2H10C10.5523 2 11 2.44772 11 3V4"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M3 4L4 13C4 13.5523 4.44772 14 5 14H11C11.5523 14 12 13.5523 12 13L13 4"
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

const TerminalIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="2" width="14" height="12" rx="1" stroke="currentColor" strokeWidth="1.5" />
    <path d="M4 6L6 8L4 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 10H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// Preset commands
const PRESET_COMMANDS = [
  { label: 'getprop', command: 'getprop', description: 'List all system properties' },
  { label: 'pm list packages', command: 'pm list packages', description: 'List installed packages' },
  { label: 'dumpsys battery', command: 'dumpsys battery', description: 'Battery status' },
  { label: 'df -h', command: 'df -h', description: 'Disk usage' },
  { label: 'top -n 1', command: 'top -n 1', description: 'Process list snapshot' },
  { label: 'ps -A', command: 'ps -A', description: 'All processes' },
];

// Storage key for command history
const HISTORY_STORAGE_KEY = 'superrwrench-shell-history';
const MAX_HISTORY_SIZE = 100;

// Output entry type
interface OutputEntry {
  id: string;
  type: 'command' | 'output' | 'error';
  content: string;
  timestamp: Date;
}

export default function ShellPage() {
  const { connectionState } = useDevice();
  const [command, setCommand] = useState('');
  const [output, setOutput] = useState<OutputEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [copied, setCopied] = useState(false);
  const [timeout, setTimeout] = useState(30000); // 30 seconds default

  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const stopFnRef = useRef<(() => void) | null>(null);

  // Load history from localStorage
  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      const savedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (savedHistory) {
        try {
          setHistory(JSON.parse(savedHistory));
        } catch {
          // Invalid JSON, ignore
        }
      }
    }
  }, []);

  // Save history to localStorage
  const saveHistory = useCallback((newHistory: string[]) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(newHistory));
    }
  }, []);

  // Add command to history
  const addToHistory = useCallback((cmd: string) => {
    setHistory((prev) => {
      // Don't add duplicates of the last command
      if (prev[0] === cmd) return prev;
      const newHistory = [cmd, ...prev].slice(0, MAX_HISTORY_SIZE);
      saveHistory(newHistory);
      return newHistory;
    });
    setHistoryIndex(-1);
  }, [saveHistory]);

  // Scroll to bottom of output
  const scrollToBottom = useCallback(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, []);

  // Add output entry
  const addOutput = useCallback((type: OutputEntry['type'], content: string) => {
    setOutput((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        type,
        content,
        timestamp: new Date(),
      },
    ]);
    // Scroll after state update
    requestAnimationFrame(scrollToBottom);
  }, [scrollToBottom]);

  // Execute command
  const executeCommand = useCallback(async (cmd: string, streaming = false) => {
    if (!cmd.trim() || connectionState !== 'connected') return;

    const trimmedCmd = cmd.trim();
    addOutput('command', `$ ${trimmedCmd}`);
    addToHistory(trimmedCmd);
    setCommand('');
    setIsRunning(true);

    try {
      if (streaming) {
        setIsStreaming(true);
        const { exit } = await shellStream(
          trimmedCmd,
          (data) => {
            addOutput('output', data);
          },
          (data) => {
            addOutput('error', data);
          }
        );
        stopFnRef.current = exit;
      } else {
        // Non-streaming with timeout
        const timeoutPromise = new Promise<string>((_, reject) => {
          window.setTimeout(() => reject(new Error('Command timed out')), timeout);
        });

        const result = await Promise.race([shell(trimmedCmd), timeoutPromise]);
        if (result) {
          addOutput('output', result);
        }
        setIsRunning(false);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Command failed';
      addOutput('error', message);
      setIsRunning(false);
      setIsStreaming(false);
    }
  }, [connectionState, addOutput, addToHistory, timeout]);

  // Stop streaming command
  const stopCommand = useCallback(() => {
    if (stopFnRef.current) {
      stopFnRef.current();
      stopFnRef.current = null;
    }
    setIsRunning(false);
    setIsStreaming(false);
    addOutput('output', '\n[Command stopped]');
  }, [addOutput]);

  // Handle key down for history navigation and execution
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isRunning) {
        executeCommand(command);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const newIndex = Math.min(historyIndex + 1, history.length - 1);
        setHistoryIndex(newIndex);
        setCommand(history[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCommand(history[newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCommand('');
      }
    } else if (e.key === 'c' && e.ctrlKey && isStreaming) {
      e.preventDefault();
      stopCommand();
    }
  }, [command, history, historyIndex, isRunning, isStreaming, executeCommand, stopCommand]);

  // Copy output to clipboard
  const handleCopyOutput = async () => {
    const text = output
      .map((entry) => entry.content)
      .join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API failed
    }
  };

  // Clear output
  const handleClearOutput = () => {
    setOutput([]);
  };

  // Run preset command
  const runPreset = (cmd: string) => {
    setCommand(cmd);
    inputRef.current?.focus();
  };

  // Focus input on mount
  useEffect(() => {
    if (connectionState === 'connected') {
      inputRef.current?.focus();
    }
  }, [connectionState]);

  if (connectionState !== 'connected') {
    return (
      <PageLayout>
        <div className="h-full flex items-center justify-center p-8">
          <EmptyState
            title="No Device Connected"
            description="Connect an Android device via USB to use the shell interface."
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
          <div className="flex items-center gap-2">
            <TerminalIcon />
            <h1 style={{ ...textStyles.h4 }} className="text-foreground">
              Shell
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Timeout selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Timeout:</span>
              <select
                value={timeout}
                onChange={(e) => setTimeout(Number(e.target.value))}
                className="text-sm bg-background border border-border rounded px-2 py-1 text-foreground"
              >
                <option value={10000}>10s</option>
                <option value={30000}>30s</option>
                <option value={60000}>60s</option>
                <option value={120000}>2m</option>
                <option value={300000}>5m</option>
              </select>
            </div>

            {/* Copy output */}
            <Button
              variant="ghost"
              size="small"
              icon={copied ? <CheckIcon /> : <CopyIcon />}
              onClick={handleCopyOutput}
              disabled={output.length === 0}
            >
              {copied ? 'Copied!' : 'Copy'}
            </Button>

            {/* Clear output */}
            <Button
              variant="ghost"
              size="small"
              icon={<TrashIcon />}
              onClick={handleClearOutput}
              disabled={output.length === 0}
            >
              Clear
            </Button>
          </div>
        </div>

        {/* Preset commands */}
        <div className="px-6 py-3 border-b border-border shrink-0 overflow-x-auto">
          <div className="flex items-center gap-2 flex-nowrap">
            <span className="text-xs text-muted-foreground shrink-0">Quick:</span>
            {PRESET_COMMANDS.map((preset) => (
              <button
                key={preset.command}
                onClick={() => runPreset(preset.command)}
                className={cn(
                  'text-xs px-2 py-1 rounded border whitespace-nowrap',
                  'border-border bg-muted/50 hover:bg-muted',
                  'text-foreground transition-colors'
                )}
                title={preset.description}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Output area */}
        <div
          ref={outputRef}
          className="flex-1 overflow-auto p-4 bg-neutral-950 font-mono text-sm"
        >
          {output.length === 0 ? (
            <div className="text-neutral-500 text-center py-8">
              <p>No output yet. Enter a command below to get started.</p>
              <p className="text-xs mt-2">
                Use ↑/↓ arrows to navigate command history. Press Enter to execute.
              </p>
            </div>
          ) : (
            output.map((entry) => (
              <div
                key={entry.id}
                className={cn(
                  'whitespace-pre-wrap break-all',
                  entry.type === 'command' && 'text-green-400 font-semibold mt-2',
                  entry.type === 'output' && 'text-neutral-200',
                  entry.type === 'error' && 'text-red-400'
                )}
              >
                {entry.content}
              </div>
            ))
          )}
          {isStreaming && (
            <div className="text-amber-400 animate-pulse mt-2">
              ● Streaming... Press Ctrl+C or Stop to cancel
            </div>
          )}
        </div>

        {/* Command input */}
        <div className="px-4 py-3 border-t border-border bg-background shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-green-500 font-mono">$</span>
            <input
              ref={inputRef}
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter shell command..."
              disabled={isRunning && !isStreaming}
              className={cn(
                'flex-1 bg-transparent border-none outline-none',
                'font-mono text-sm text-foreground',
                'placeholder:text-muted-foreground'
              )}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
            />
            {isStreaming ? (
              <Button
                variant="primary"
                size="small"
                icon={<StopIcon />}
                onClick={stopCommand}
              >
                Stop
              </Button>
            ) : (
              <Button
                variant="primary"
                size="small"
                icon={<PlayIcon />}
                onClick={() => executeCommand(command)}
                disabled={!command.trim() || isRunning}
              >
                Run
              </Button>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
