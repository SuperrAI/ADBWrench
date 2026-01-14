'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';
import { useAIAssistant } from '@/context/ai-assistant-context';
import { getProviderConfigs, getProvider } from '@/services/llm';
import { ChatMessage } from './ChatMessage';
import { APIKeyInput } from './APIKeyInput';
import { ProviderSelector } from './ProviderSelector';
import { TerminalSpinner } from '@/components/ui/TerminalUI';
import { Settings, Trash2, X } from 'lucide-react';

interface AIAssistantPanelProps {
  className?: string;
}

export function AIAssistantPanel({ className }: AIAssistantPanelProps) {
  const {
    isPanelOpen,
    setPanelOpen,
    config,
    apiKey,
    setProvider,
    setModel,
    setApiKey,
    isConfigured,
    messages,
    isLoading,
    isInterpreting,
    streamingContent,
    error,
    sendMessage,
    clearHistory,
    stopGeneration,
    executeCommandRef,
  } = useAIAssistant();

  const handleExecuteCommand = (command: string) => {
    if (executeCommandRef.current) {
      executeCommandRef.current(command);
    }
  };

  const [input, setInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const providers = getProviderConfigs();
  const currentProvider = config ? getProvider(config.provider) : null;
  const isKeyValid = currentProvider && apiKey ? currentProvider.validateApiKey(apiKey) : undefined;

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // Focus input when panel opens
  useEffect(() => {
    if (isPanelOpen && isConfigured) {
      inputRef.current?.focus();
    }
  }, [isPanelOpen, isConfigured]);

  // Show settings if not configured
  useEffect(() => {
    if (isPanelOpen && !isConfigured) {
      setShowSettings(true);
    }
  }, [isPanelOpen, isConfigured]);

  const handleSubmit = () => {
    if (!input.trim() || isLoading || !isConfigured) return;
    sendMessage(input);
    setInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!isPanelOpen) return null;

  return (
    <div
      className={cn(
        'flex flex-col h-full border-l border-border bg-background font-mono',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="text-xs uppercase tracking-wider">AI ASSIST</h2>
          {isConfigured && (
            <span className="text-green-500 text-[10px]">●</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={cn(
              'p-1.5 hover:bg-muted',
              showSettings && 'bg-muted'
            )}
            title="Settings"
          >
            <Settings className="w-3 h-3" />
          </button>
          {messages.length > 0 && (
            <button
              onClick={clearHistory}
              className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground"
              title="Clear history"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
          <button
            onClick={() => setPanelOpen(false)}
            className="p-1.5 hover:bg-muted"
            title="Close panel"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="border-b border-border p-3 space-y-3 flex-shrink-0 bg-muted/30">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
              Provider & Model
            </div>
            <ProviderSelector
              providers={providers}
              selectedProvider={config?.provider || 'openai'}
              selectedModel={config?.model || ''}
              onProviderChange={setProvider}
              onModelChange={setModel}
            />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
              API Key
              {currentProvider && (
                <span className="ml-2 text-muted-foreground/70">
                  ({currentProvider.config.apiKeyPlaceholder})
                </span>
              )}
            </div>
            <APIKeyInput
              value={apiKey}
              onChange={setApiKey}
              placeholder={currentProvider?.config.apiKeyPlaceholder || 'Enter API key...'}
              isValid={isKeyValid}
            />
            {isKeyValid === false && apiKey && (
              <div className="text-[10px] text-red-500 mt-1">
                Invalid key format
              </div>
            )}
          </div>
          <div className="text-[10px] text-muted-foreground">
            Your key is stored locally in the browser. We never send it to our servers.
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3">
        {messages.length === 0 && !isLoading ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
            <pre className="text-2xl mb-3">{'?_'}</pre>
            <div className="text-xs uppercase">
              {isConfigured ? 'Ask anything about ADB' : 'Configure API key above'}
            </div>
            {isConfigured && (
              <div className="text-[10px] mt-2 max-w-[200px]">
                Describe what you want to do and I&apos;ll provide the shell command
              </div>
            )}
          </div>
        ) : (
          <>
            {messages.map((message, idx) => (
              <ChatMessage
                key={message.id}
                message={message}
                isStreaming={isLoading && idx === messages.length - 1 && message.role === 'assistant'}
                streamingContent={streamingContent}
                onExecute={handleExecuteCommand}
              />
            ))}
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="mb-3">
                <div className="text-[10px] uppercase tracking-wider mb-1 text-blue-500">
                  AI
                </div>
                <div className="text-xs">
                  {streamingContent ? (
                    <ChatMessage
                      message={{
                        id: 'streaming',
                        role: 'assistant',
                        content: streamingContent,
                        timestamp: new Date(),
                      }}
                      isStreaming
                      streamingContent={streamingContent}
                      onExecute={handleExecuteCommand}
                    />
                  ) : (
                    <TerminalSpinner label="THINKING" />
                  )}
                </div>
              </div>
            )}
            {isInterpreting && (
              <div className="mb-3">
                <div className="text-[10px] uppercase tracking-wider mb-1 text-green-500">
                  AI ANSWER
                </div>
                <div className="text-xs">
                  {streamingContent ? (
                    <div className="bg-green-500/5 border-l-2 border-green-500 pl-3 py-2">
                      {streamingContent}
                      <span className="inline-block w-2 h-3 bg-foreground animate-pulse ml-0.5" />
                    </div>
                  ) : (
                    <TerminalSpinner label="INTERPRETING" />
                  )}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="px-3 py-2 text-xs text-red-500 border-t border-red-500/30 bg-red-500/5 flex-shrink-0">
          [!] {error}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border p-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-blue-500 text-sm">?</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isConfigured ? 'What do you want to do?' : 'Configure API key first'}
            disabled={!isConfigured || isLoading}
            className="flex-1 bg-transparent border-none outline-none text-xs placeholder:text-muted-foreground/50 disabled:opacity-50"
            autoComplete="off"
          />
          {isLoading ? (
            <button
              onClick={stopGeneration}
              className="px-2 py-1 border border-red-500 text-red-500 text-[10px] hover:bg-red-500/10"
            >
              [ STOP ]
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || !isConfigured}
              className="px-2 py-1 border border-foreground bg-foreground text-background text-[10px] disabled:opacity-50"
            >
              [ ASK ]
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
