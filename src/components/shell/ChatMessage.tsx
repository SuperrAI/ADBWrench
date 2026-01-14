'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChatMessage as ChatMessageType } from '@/services/llm';
import { Play, Copy, Check } from 'lucide-react';

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming?: boolean;
  streamingContent?: string;
  onExecute?: (command: string) => void;
}

export function ChatMessage({ message, isStreaming, streamingContent, onExecute }: ChatMessageProps) {
  const content = isStreaming ? streamingContent : message.content;
  const isUser = message.role === 'user';
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleCopy = async (command: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(command);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1500);
    } catch {
      // Ignore copy errors
    }
  };

  const handleExecute = (command: string) => {
    if (onExecute) {
      onExecute(command);
    }
  };

  // Parse content to highlight shell commands
  const renderContent = (text: string | undefined) => {
    if (!text) return null;

    // Split by shell tags
    const parts = text.split(/(<shell>[\s\S]*?<\/shell>)/g);

    return parts.map((part, idx) => {
      const shellMatch = part.match(/<shell>([\s\S]*?)<\/shell>/);
      if (shellMatch) {
        const command = shellMatch[1].trim();
        return (
          <div key={idx} className="my-2 border border-orange-500/50 bg-orange-500/5">
            <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-orange-500 border-b border-orange-500/50 flex items-center justify-between">
              <span>COMMAND</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleCopy(command, idx)}
                  className="p-1 hover:bg-orange-500/20 rounded transition-colors"
                  title="Copy command"
                >
                  {copiedIdx === idx ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
                {onExecute && (
                  <button
                    onClick={() => handleExecute(command)}
                    className="p-1 hover:bg-orange-500/20 rounded transition-colors"
                    title="Run command"
                  >
                    <Play className="w-3 h-3 fill-current" />
                  </button>
                )}
              </div>
            </div>
            <div className="px-3 py-2 text-orange-500">
              <code>{command}</code>
            </div>
          </div>
        );
      }
      return part ? (
        <span key={idx} className="whitespace-pre-wrap">
          {part}
        </span>
      ) : null;
    });
  };

  return (
    <div className={cn('mb-3', isUser ? 'pl-4' : 'pr-4')}>
      <div
        className={cn(
          'text-[10px] uppercase tracking-wider mb-1',
          isUser ? 'text-right text-muted-foreground' : 'text-blue-500'
        )}
      >
        {isUser ? 'YOU' : 'AI'}
      </div>
      <div
        className={cn(
          'text-xs leading-relaxed',
          isUser
            ? 'text-right text-muted-foreground'
            : 'text-foreground'
        )}
      >
        {renderContent(content)}
        {isStreaming && (
          <span className="inline-block w-2 h-3 bg-foreground animate-pulse ml-0.5" />
        )}
      </div>
    </div>
  );
}
