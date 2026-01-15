'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, X } from 'lucide-react';

interface APIKeyInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isValid?: boolean;
  className?: string;
}

export function APIKeyInput({
  value,
  onChange,
  placeholder = 'Enter API key...',
  isValid,
  className,
}: APIKeyInputProps) {
  const [showKey, setShowKey] = useState(false);

  return (
    <div className={cn('relative', className)}>
      <input
        type={showKey ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'w-full bg-transparent border px-3 py-2 pr-16 text-xs font-mono outline-none transition-colors',
          'placeholder:text-muted-foreground/50',
          isValid === undefined && 'border-border focus:border-foreground',
          isValid === true && 'border-green-500',
          isValid === false && value && 'border-red-500'
        )}
        autoComplete="off"
        spellCheck={false}
      />
      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
        {value && (
          <button
            onClick={() => onChange('')}
            className="p-1 text-muted-foreground hover:text-foreground"
            type="button"
          >
            <X className="w-3 h-3" />
          </button>
        )}
        <button
          onClick={() => setShowKey(!showKey)}
          className="p-1 text-muted-foreground hover:text-foreground"
          type="button"
        >
          {showKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
        </button>
      </div>
    </div>
  );
}
