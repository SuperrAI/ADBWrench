'use client';

import { cn } from '@/lib/utils';
import { LLMProvider, LLMProviderConfig } from '@/services/llm';
import { ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface ProviderSelectorProps {
  providers: LLMProviderConfig[];
  selectedProvider: LLMProvider;
  selectedModel: string;
  onProviderChange: (provider: LLMProvider) => void;
  onModelChange: (model: string) => void;
  className?: string;
}

export function ProviderSelector({
  providers,
  selectedProvider,
  selectedModel,
  onProviderChange,
  onModelChange,
  className,
}: ProviderSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentProvider = providers.find((p) => p.id === selectedProvider);
  const currentModel = currentProvider?.models.find((m) => m.id === selectedModel);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 py-1 border border-border hover:bg-muted text-xs font-mono"
      >
        <span className="uppercase">{currentProvider?.name || 'SELECT'}</span>
        <ChevronDown className={cn('w-3 h-3 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 min-w-[200px] border border-border bg-background z-50 shadow-lg">
          {/* Provider Selection */}
          <div className="border-b border-border">
            <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground bg-muted/50">
              Provider
            </div>
            {providers.map((provider) => (
              <button
                key={provider.id}
                onClick={() => {
                  onProviderChange(provider.id);
                }}
                className={cn(
                  'w-full px-3 py-2 text-left text-xs hover:bg-muted flex items-center justify-between',
                  selectedProvider === provider.id && 'bg-muted'
                )}
              >
                <span>{provider.name}</span>
                {selectedProvider === provider.id && (
                  <span className="text-green-500">●</span>
                )}
              </button>
            ))}
          </div>

          {/* Model Selection */}
          {currentProvider && (
            <div>
              <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground bg-muted/50">
                Model
              </div>
              {currentProvider.models.map((model) => (
                <button
                  key={model.id}
                  onClick={() => {
                    onModelChange(model.id);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'w-full px-3 py-2 text-left text-xs hover:bg-muted flex items-center justify-between',
                    selectedModel === model.id && 'bg-muted'
                  )}
                >
                  <span>{model.name}</span>
                  {selectedModel === model.id && (
                    <span className="text-green-500">●</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
