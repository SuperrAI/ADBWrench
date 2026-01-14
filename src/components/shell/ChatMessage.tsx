'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChatMessage as ChatMessageType } from '@/services/llm';
import { Play, Copy, Check, Loader2 } from 'lucide-react';

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

  // Parse basic markdown: bold, italic, inline code, bullet points
  const parseMarkdown = (text: string): React.ReactNode[] => {
    const elements: React.ReactNode[] = [];

    // Split into lines for bullet point handling
    const lines = text.split('\n');

    lines.forEach((line, lineIdx) => {
      // Check for bullet points (- or * at start of line)
      const bulletMatch = line.match(/^(\s*)[-*]\s+(.+)$/);

      if (bulletMatch) {
        const [, indent, content] = bulletMatch;
        elements.push(
          <div key={`line-${lineIdx}`} className="flex items-start gap-1.5" style={{ marginLeft: indent.length * 8 }}>
            <span className="text-muted-foreground select-none">•</span>
            <span>{parseInlineMarkdown(content, lineIdx)}</span>
          </div>
        );
      } else {
        // Regular line - parse inline markdown
        if (lineIdx > 0) elements.push(<br key={`br-${lineIdx}`} />);
        elements.push(
          <span key={`line-${lineIdx}`}>{parseInlineMarkdown(line, lineIdx)}</span>
        );
      }
    });

    return elements;
  };

  // Parse inline markdown: bold, italic, code
  const parseInlineMarkdown = (text: string, keyPrefix: number): React.ReactNode[] => {
    const elements: React.ReactNode[] = [];
    // Combined regex for: **bold**, *italic*, `code`
    // Order matters: check ** before * to avoid conflicts
    const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`)/g;

    let lastIndex = 0;
    let match;
    let matchIdx = 0;

    while ((match = regex.exec(text)) !== null) {
      // Add text before match
      if (match.index > lastIndex) {
        elements.push(text.slice(lastIndex, match.index));
      }

      const key = `${keyPrefix}-${matchIdx++}`;

      if (match[2]) {
        // **bold**
        elements.push(<strong key={key} className="font-semibold">{match[2]}</strong>);
      } else if (match[3]) {
        // *italic*
        elements.push(<em key={key} className="italic">{match[3]}</em>);
      } else if (match[4]) {
        // `code`
        elements.push(
          <code key={key} className="px-1 py-0.5 bg-muted rounded text-[11px]">
            {match[4]}
          </code>
        );
      }

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      elements.push(text.slice(lastIndex));
    }

    return elements.length > 0 ? elements : [text];
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
        <span key={idx}>
          {parseMarkdown(part)}
        </span>
      ) : null;
    });
  };

  // Determine label based on message type
  const getLabel = () => {
    if (isUser) return 'YOU';
    if (message.isInterpretation) return 'AI ANSWER';
    return 'AI';
  };

  return (
    <div className={cn('mb-3', isUser ? 'pl-4' : 'pr-4')}>
      <div
        className={cn(
          'text-[10px] uppercase tracking-wider mb-1 flex items-center gap-2',
          isUser ? 'justify-end text-muted-foreground' : '',
          message.isInterpretation ? 'text-green-500' : !isUser ? 'text-blue-500' : ''
        )}
      >
        <span>{getLabel()}</span>
        {message.awaitingOutput && (
          <span className="flex items-center gap-1 text-orange-500">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>running...</span>
          </span>
        )}
      </div>
      <div
        className={cn(
          'text-xs leading-relaxed',
          isUser && 'text-right text-muted-foreground',
          !isUser && !message.isInterpretation && 'text-foreground',
          message.isInterpretation && 'text-foreground bg-green-500/5 border-l-2 border-green-500 pl-3 py-2'
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
