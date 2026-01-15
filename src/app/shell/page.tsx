'use client';

import { useState, useEffect, useRef, useCallback, KeyboardEvent } from 'react';
import { PageLayout } from '@/design-system/patterns/PageLayout/PageLayout';
import { useDevice } from '@/context/device-context';
import { useAIAssistant } from '@/context/ai-assistant-context';
import { shell, shellStream } from '@/services/adb';
import { cn } from '@/lib/utils';
import { TerminalSpinner } from '@/components/ui/TerminalUI';
import { AIAssistantPanel } from '@/components/shell';
import { Sparkles } from 'lucide-react';

// --- Preset Commands Data ---
const PRESET_COMMANDS = [
  { label: 'GETPROP', command: 'getprop' },
  { label: 'PACKAGES', command: 'pm list packages' },
  { label: 'BATTERY', command: 'dumpsys battery' },
  { label: 'DISK', command: 'df -h' },
  { label: 'TOP', command: 'top -n 1' },
  { label: 'PS', command: 'ps -A' },
  { label: 'NETSTAT', command: 'netstat' },
  { label: 'IP', command: 'ip addr show' },
];

const HISTORY_STORAGE_KEY = 'adbwrench-shell-history';
const MAX_HISTORY_SIZE = 100;

interface OutputEntry {
  id: string;
  type: 'command' | 'output' | 'error';
  content: string;
  timestamp: Date;
}

export default function ShellPage() {
  const { connectionState, handleConnectionError} = useDevice();
  const { isPanelOpen, togglePanel, executeCommandRef, onCommandOutputRef, isConfigured } = useAIAssistant();
  const [command, setCommand] = useState('');
  const [output, setOutput] = useState<OutputEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [copied, setCopied] = useState(false);
  const [cmdTimeout, setCmdTimeout] = useState(30000);

  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const stopFnRef = useRef<(() => void) | null>(null);
  // Track if current command is from AI (for interpretation callback)
  const aiCommandRef = useRef<string | null>(null);

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

  const executeCommand = useCallback(async (cmd: string, streaming = false, fromAI = false) => {
    if (!cmd.trim() || connectionState !== 'connected') return;
    const trimmedCmd = cmd.trim();

    // Track if this is an AI-initiated command
    if (fromAI) {
      aiCommandRef.current = trimmedCmd;
    }

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
          window.setTimeout(() => reject(new Error('Command timed out')), cmdTimeout);
        });
        const result = await Promise.race([shell(trimmedCmd), timeoutPromise]);
        if (result) addOutput('output', result);
        setIsRunning(false);

        // Notify AI assistant of command output for interpretation
        if (aiCommandRef.current === trimmedCmd && onCommandOutputRef.current) {
          onCommandOutputRef.current(trimmedCmd, result || '', null);
          aiCommandRef.current = null;
        }
      }
    } catch (err) {
      // Check if this is a connection error (device unplugged)
      if (!handleConnectionError(err)) {
        addOutput('error', err instanceof Error ? err.message : 'Command failed');
      }
      const errorMsg = err instanceof Error ? err.message : 'Command failed';
      addOutput('error', errorMsg);
      setIsRunning(false);
      setIsStreaming(false);

      // Notify AI assistant of error for interpretation
      if (aiCommandRef.current === trimmedCmd && onCommandOutputRef.current) {
        onCommandOutputRef.current(trimmedCmd, '', errorMsg);
        aiCommandRef.current = null;
      }
    }
  }, [connectionState, addOutput, addToHistory, cmdTimeout, handleConnectionError, onCommandOutputRef]);

  const stopCommand = useCallback(() => {
    if (stopFnRef.current) {
      stopFnRef.current();
      stopFnRef.current = null;
    }
    setIsRunning(false);
    setIsStreaming(false);
    addOutput('output', '\n[STOPPED]');
  }, [addOutput]);

  // Wire up AI assistant command execution
  useEffect(() => {
    executeCommandRef.current = (cmd: string) => {
      if (connectionState === 'connected') {
        executeCommand(cmd, false, true); // fromAI = true
      }
    };
    return () => {
      executeCommandRef.current = null;
    };
  }, [executeCommandRef, connectionState, executeCommand]);

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
        <div className="h-full flex items-center justify-center p-8 font-mono">
          <div className="text-center">
            <pre className="text-muted-foreground mb-4 text-xs">
{`  _________
 |  $_ |
 |_________|`}
            </pre>
            <div className="text-sm mb-2">SHELL DISCONNECTED</div>
            <div className="text-xs text-muted-foreground">
              Connect a device to access the shell.
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="h-full flex font-mono overflow-hidden">
        {/* Main Shell Area */}
        <div className={cn(
          'flex flex-col overflow-hidden transition-all duration-200',
          isPanelOpen ? 'w-2/3' : 'w-full'
        )}>
        {/* Header */}
        <div className="border-b border-border p-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-sm uppercase tracking-wider">SHELL // ADB</h1>
              <div className="text-xs text-muted-foreground mt-1">
                <span className="text-green-500">●</span> CONNECTED
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <select
                value={cmdTimeout}
                onChange={(e) => setCmdTimeout(Number(e.target.value))}
                className="bg-transparent border border-border px-2 py-1 outline-none"
              >
                <option value={10000}>10S</option>
                <option value={30000}>30S</option>
                <option value={60000}>60S</option>
              </select>

              <button
                onClick={handleCopyOutput}
                disabled={output.length === 0}
                className="px-2 py-1 border border-border hover:bg-muted disabled:opacity-50"
              >
                [ {copied ? 'COPIED' : 'COPY'} ]
              </button>

              <button
                onClick={() => setOutput([])}
                disabled={output.length === 0}
                className="px-2 py-1 border border-border hover:bg-muted disabled:opacity-50"
              >
                [ CLEAR ]
              </button>

              <button
                onClick={togglePanel}
                className={cn(
                  'px-2 py-1 border flex items-center gap-1.5',
                  isPanelOpen
                    ? 'border-orange-500 text-orange-500 bg-orange-500/10'
                    : 'border-border hover:bg-muted',
                  isConfigured && !isPanelOpen && 'text-orange-500'
                )}
                title="AI Assistant"
              >
                <Sparkles className="w-3 h-3" />
                [ AI ]
              </button>
            </div>
          </div>
        </div>

        {/* Quick Commands */}
        <div className="border-b border-border p-2 flex-shrink-0 flex items-center gap-1 overflow-x-auto text-xs">
          <span className="text-muted-foreground mr-1">QUICK:</span>
          {PRESET_COMMANDS.map((preset) => (
            <button
              key={preset.command}
              onClick={() => runPreset(preset.command)}
              className="px-2 py-0.5 border border-border hover:bg-muted whitespace-nowrap"
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Terminal Output */}
        <div
          className="flex-1 overflow-hidden bg-background"
          onClick={() => inputRef.current?.focus()}
        >
          <div
            ref={outputRef}
            className="h-full overflow-y-auto p-4 text-xs space-y-1"
          >
            {output.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <pre className="mb-4">
{`>_`}
                </pre>
                <p>READY FOR INPUT</p>
                <p className="text-muted-foreground mt-2">TYPE COMMAND + ENTER</p>
              </div>
            ) : (
              output.map((entry) => (
                <div key={entry.id} className="break-all leading-snug">
                  {entry.type === 'command' && (
                    <div className="text-orange-500 mt-3 mb-1">
                      {'>'} {entry.content}
                    </div>
                  )}
                  {entry.type === 'output' && (
                    <div className="text-foreground whitespace-pre-wrap pl-2">{entry.content}</div>
                  )}
                  {entry.type === 'error' && (
                    <div className="text-red-500 whitespace-pre-wrap pl-2">[!] {entry.content}</div>
                  )}
                </div>
              ))
            )}

            {isStreaming && (
              <div className="text-orange-500 mt-2">
                <TerminalSpinner label="STREAMING" />
              </div>
            )}
            <div className="h-4" />
          </div>
        </div>

        {/* Command Input */}
        <div className="border-t border-border p-3 flex-shrink-0 bg-background">
          <div className="flex items-center gap-2">
            <span className="text-orange-500">$</span>
            <input
              ref={inputRef}
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter command..."
              className="terminal-input flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground"
              disabled={isRunning && !isStreaming}
              autoComplete="off"
            />
            <div className="flex items-center gap-1">
              {isStreaming ? (
                <button
                  onClick={stopCommand}
                  className="px-3 py-1 border border-red-500 text-red-500 text-xs hover:bg-red-500/10"
                >
                  [ STOP ]
                </button>
              ) : (
                <button
                  onClick={() => executeCommand(command)}
                  disabled={!command.trim() || isRunning}
                  className="px-3 py-1 border border-foreground bg-foreground text-background text-xs disabled:opacity-50"
                >
                  [ RUN ]
                </button>
              )}
            </div>
          </div>
          <div className="text-[10px] text-muted-foreground mt-2">
            ↑↓ HISTORY | {isStreaming && 'CTRL+C STOP'}
          </div>
        </div>
        </div>

        {/* AI Assistant Panel */}
        {isPanelOpen && (
          <div className="w-1/3 flex-shrink-0">
            <AIAssistantPanel />
          </div>
        )}
      </div>
    </PageLayout>
  );
}
