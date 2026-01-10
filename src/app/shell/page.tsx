'use client';

import { useState, useEffect, useRef, useCallback, KeyboardEvent } from 'react';
import { PageLayout } from '@/design-system/patterns/PageLayout/PageLayout';
import { EmptyState } from '@/components/ui/EmptyState';
import { useDevice } from '@/context/device-context';
import { Button } from '@/design-system/components/Button';
import { shell, shellStream } from '@/services/adb';
import {
  Terminal,
  Play,
  Square,
  Copy,
  Trash2,
  Check,
  Clock,
  ChevronRight,
  Command,
  Smartphone,
  Keyboard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// --- Preset Commands Data ---
const PRESET_COMMANDS = [
  { label: 'System Props', command: 'getprop', description: 'List all system properties' },
  { label: 'List Packages', command: 'pm list packages', description: 'List installed packages' },
  { label: 'Battery', command: 'dumpsys battery', description: 'Battery status' },
  { label: 'Disk Usage', command: 'df -h', description: 'Disk usage' },
  { label: 'Top Processes', command: 'top -n 1', description: 'Process list snapshot' },
  { label: 'All Processes', command: 'ps -A', description: 'All processes' },
  { label: 'Netstat', command: 'netstat', description: 'Network statistics' },
  { label: 'IP Address', command: 'ip addr show', description: 'IP configuration' },
];

const HISTORY_STORAGE_KEY = 'superrwrench-shell-history';
const MAX_HISTORY_SIZE = 100;

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
  const [timeout, setTimeout] = useState(30000);

  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const stopFnRef = useRef<(() => void) | null>(null);

  // Load History
  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      const savedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (savedHistory) {
        try { setHistory(JSON.parse(savedHistory)); } catch { }
      }
    }
  }, []);

  const saveHistory = useCallback((newHistory: string[]) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(newHistory));
    }
  }, []);

  const addToHistory = useCallback((cmd: string) => {
    setHistory((prev) => {
      if (prev[0] === cmd) return prev;
      const newHistory = [cmd, ...prev].slice(0, MAX_HISTORY_SIZE);
      saveHistory(newHistory);
      return newHistory;
    });
    setHistoryIndex(-1);
  }, [saveHistory]);

  const scrollToBottom = useCallback(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, []);

  const addOutput = useCallback((type: OutputEntry['type'], content: string) => {
    setOutput((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random()}`, type, content, timestamp: new Date() },
    ]);
    requestAnimationFrame(scrollToBottom);
  }, [scrollToBottom]);

  const executeCommand = useCallback(async (cmd: string, streaming = false) => {
    if (!cmd.trim() || connectionState !== 'connected') return;
    const trimmedCmd = cmd.trim();

    addOutput('command', trimmedCmd);
    addToHistory(trimmedCmd);
    setCommand('');
    setIsRunning(true);

    try {
      if (streaming) {
        setIsStreaming(true);
        const { exit } = await shellStream(
          trimmedCmd,
          (data) => addOutput('output', data),
          (data) => addOutput('error', data)
        );
        stopFnRef.current = exit;
      } else {
        const timeoutPromise = new Promise<string>((_, reject) => {
          window.setTimeout(() => reject(new Error('Command timed out')), timeout);
        });
        const result = await Promise.race([shell(trimmedCmd), timeoutPromise]);
        if (result) addOutput('output', result);
        setIsRunning(false);
      }
    } catch (err) {
      addOutput('error', err instanceof Error ? err.message : 'Command failed');
      setIsRunning(false);
      setIsStreaming(false);
    }
  }, [connectionState, addOutput, addToHistory, timeout]);

  const stopCommand = useCallback(() => {
    if (stopFnRef.current) {
      stopFnRef.current();
      stopFnRef.current = null;
    }
    setIsRunning(false);
    setIsStreaming(false);
    addOutput('output', '\n[Command stopped]');
  }, [addOutput]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isRunning) executeCommand(command);
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

  const handleCopyOutput = async () => {
    const text = output.map((entry) => entry.content).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch { }
  };

  const runPreset = (cmd: string) => {
    setCommand(cmd);
    inputRef.current?.focus();
  };

  useEffect(() => {
    if (connectionState === 'connected') inputRef.current?.focus();
  }, [connectionState]);

  if (connectionState !== 'connected') {
    return (
      <PageLayout>
        <div className="h-full flex items-center justify-center p-8">
          <EmptyState
            title="Shell Disconnected"
            description="Connect an Android device to access the shell terminal."
            icon={<Terminal className="w-16 h-16 text-muted-foreground/30" />}
          />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="h-[calc(100vh-60px)] flex flex-col overflow-hidden bg-background">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-card/30 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Shell Interface</h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Connected
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 mr-2 px-3 py-1.5 bg-muted/40 rounded-md border border-border/50">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <select
                value={timeout}
                onChange={(e) => setTimeout(Number(e.target.value))}
                className="bg-transparent text-xs font-medium outline-none cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
              >
                <option value={10000}>10s Timeout</option>
                <option value={30000}>30s Timeout</option>
                <option value={60000}>60s Timeout</option>
              </select>
            </div>

            <Button
              variant="ghost"
              size="small"
              onClick={handleCopyOutput}
              disabled={output.length === 0}
              icon={copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            >
              Copy
            </Button>
            <Button
              variant="ghost"
              size="small"
              onClick={() => setOutput([])}
              disabled={output.length === 0}
              icon={<Trash2 className="w-4 h-4" />}
              className="text-muted-foreground hover:text-destructive"
            >
              Clear
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-6 py-3 border-b border-border/40 bg-muted/5 shrink-0 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider shrink-0 mr-2">Quick Ops</span>
            {PRESET_COMMANDS.map((preset) => (
              <button
                key={preset.command}
                onClick={() => runPreset(preset.command)}
                className="group relative px-3 py-1.5 rounded-md bg-card border border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all text-xs font-medium text-muted-foreground hover:text-foreground whitespace-nowrap shadow-sm"
                title={preset.description}
              >
                <span className="font-mono text-primary/70 group-hover:text-primary mr-1.5">$</span>
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Terminal Output */}
        <div
          className="flex-1 overflow-hidden relative group bg-[#0c0c0c]"
          onClick={() => inputRef.current?.focus()}
        >
          <div
            ref={outputRef}
            className="absolute inset-0 overflow-y-auto p-4 font-mono text-sm space-y-1 scroll-smooth"
          >
            {output.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground/30 select-none pointer-events-none">
                <Terminal className="w-12 h-12 mb-4 opacity-20" />
                <p>Ready for input...</p>
                <div className="mt-8 flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1"><Keyboard className="w-3 h-3" /> Type command</span>
                  <span className="flex items-center gap-1"><Command className="w-3 h-3" /> Enter to run</span>
                </div>
              </div>
            ) : (
              output.map((entry) => (
                <div key={entry.id} className="break-all leading-snug">
                  {entry.type === 'command' && (
                    <div className="flex items-start gap-2 mt-4 mb-1 text-primary/90 font-bold select-none">
                      <ChevronRight className="w-4 h-4 mt-0.5" />
                      <span>{entry.content}</span>
                    </div>
                  )}
                  {entry.type === 'output' && (
                    <div className="pl-6 text-neutral-300/90 whitespace-pre-wrap">{entry.content}</div>
                  )}
                  {entry.type === 'error' && (
                    <div className="pl-6 text-red-400 whitespace-pre-wrap">{entry.content}</div>
                  )}
                </div>
              ))
            )}

            {/* Active Streaming Indicator */}
            <AnimatePresence>
              {isStreaming && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="pl-6 mt-2 flex items-center gap-2 text-amber-500 font-mono text-xs"
                >
                  <span className="block w-2 H-2 rounded-full bg-amber-500 animate-pulse" />
                  Streaming active...
                </motion.div>
              )}
            </AnimatePresence>
            <div className="h-8" /> {/* Scroll padding */}
          </div>
        </div>

        {/* Command Input Area */}
        <div className="p-4 bg-card border-t border-border shrink-0 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] z-10">
          <div className="relative flex items-center bg-muted/40 border border-input focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 rounded-xl px-4 py-3 transition-all">
            <span className="text-primary font-mono mr-3 select-none">$</span>
            <input
              ref={inputRef}
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter ADB shell command..."
              className="flex-1 bg-transparent border-none outline-none font-mono text-sm placeholder:text-muted-foreground/50"
              disabled={isRunning && !isStreaming}
              autoComplete="off"
            />
            <div className="flex items-center gap-2 pl-2">
              {isStreaming ? (
                <Button variant="warning" size="small" onClick={stopCommand} icon={<Square className="w-3 h-3 fill-current" />}>
                  Stop
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="small"
                  onClick={() => executeCommand(command)}
                  disabled={!command.trim() || isRunning}
                  icon={<Play className="w-3 h-3 fill-current" />}
                >
                  Execute
                </Button>
              )}
            </div>
          </div>
          <div className="px-1 mt-2 flex justify-between text-[10px] text-muted-foreground font-medium">
            <span>Press <kbd className="font-mono bg-muted px-1 rounded">↑</kbd> <kbd className="font-mono bg-muted px-1 rounded">↓</kbd> for history</span>
            {isStreaming && <span><kbd className="font-mono bg-muted px-1 rounded">Ctrl+C</kbd> to stop</span>}
          </div>
        </div>

      </div>
    </PageLayout>
  );
}
