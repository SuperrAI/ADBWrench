'use client';

import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Terminal-style Progress Bar using ASCII characters
 * Example: [||||||||||||........] 60%
 */
interface ProgressBarProps {
  value: number; // 0-100
  width?: number; // number of characters
  showPercentage?: boolean;
  label?: string;
  className?: string;
}

export function TerminalProgressBar({
  value,
  width = 20,
  showPercentage = true,
  label,
  className
}: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));
  const filled = Math.round((clampedValue / 100) * width);
  const empty = width - filled;

  // Use block characters for thicker bars
  const filledChar = '█';  // Full block
  const emptyChar = '░';   // Light shade

  return (
    <div className={cn("font-mono", className)}>
      {label && <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{label}</div>}
      <div className="flex items-center gap-2">
        <span className="text-sm tracking-tighter">
          <span className="text-orange-500">{filledChar.repeat(filled)}</span>
          <span className="text-muted-foreground/30">{emptyChar.repeat(empty)}</span>
        </span>
        {showPercentage && <span className="text-xs">{clampedValue}%</span>}
      </div>
    </div>
  );
}

/**
 * Terminal-style Spinner using ASCII characters
 * Animates through: | / - \
 */
interface SpinnerProps {
  label?: string;
  className?: string;
}

export function TerminalSpinner({ label = "LOADING", className }: SpinnerProps) {
  const [frame, setFrame] = React.useState(0);
  const frames = ['|', '/', '-', '\\'];

  React.useEffect(() => {
    const interval = setInterval(() => {
      setFrame(f => (f + 1) % frames.length);
    }, 150);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className={cn("font-mono text-xs", className)}>
      {label} {frames[frame]}
    </span>
  );
}

/**
 * Terminal-style ASCII Radial Spinner (like the reference image)
 */
export function TerminalRadialSpinner({ className }: { className?: string }) {
  const [frame, setFrame] = React.useState(0);

  // ASCII art frames for radial spinner
  const frames = [
    `  |  \n / \\ \n  O  \n \\ / \n  |  `,
    ` /   \n|   |\n  O  \n|   |\n \\   `,
    `     \n \\ / \n--O--\n / \\ \n     `,
    `   \\ \n|   |\n  O  \n|   |\n   / `,
  ];

  React.useEffect(() => {
    const interval = setInterval(() => {
      setFrame(f => (f + 1) % frames.length);
    }, 200);
    return () => clearInterval(interval);
  }, []);

  return (
    <pre className={cn("font-mono text-xs leading-tight", className)}>
      {frames[frame]}
    </pre>
  );
}

/**
 * Terminal-style Dots Loader
 * Example: LOADING...
 */
export function TerminalDotsLoader({ label = "LOADING", className }: SpinnerProps) {
  const [dots, setDots] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setDots(d => (d + 1) % 4);
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className={cn("font-mono text-xs uppercase", className)}>
      {label}{'.'.repeat(dots)}
    </span>
  );
}

/**
 * Terminal-style bordered box/card
 */
interface TerminalBoxProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export function TerminalBox({ children, title, className }: TerminalBoxProps) {
  return (
    <div className={cn("border border-border font-mono", className)}>
      {title && (
        <div className="px-3 py-2 border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground">
          {title}
        </div>
      )}
      <div className="p-3">
        {children}
      </div>
    </div>
  );
}

/**
 * Terminal-style button
 */
interface TerminalButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'primary';
  className?: string;
}

export function TerminalButton({
  children,
  onClick,
  disabled,
  variant = 'default',
  className
}: TerminalButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "font-mono text-xs uppercase tracking-wider px-4 py-2 border transition-colors",
        variant === 'default' && "border-border hover:bg-muted text-foreground",
        variant === 'primary' && "border-foreground bg-foreground text-background hover:bg-foreground/90",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      [ {children} ]
    </button>
  );
}

/**
 * Terminal-style status indicator
 */
interface StatusIndicatorProps {
  status: 'ok' | 'error' | 'warning' | 'pending';
  label?: string;
  className?: string;
}

export function TerminalStatus({ status, label, className }: StatusIndicatorProps) {
  const statusMap = {
    ok: { char: '●', color: 'text-green-500', text: 'OK' },
    error: { char: '●', color: 'text-red-500', text: 'ERROR' },
    warning: { char: '●', color: 'text-orange-500', text: 'WARN' },
    pending: { char: '○', color: 'text-muted-foreground', text: 'PENDING' },
  };

  const { char, color, text } = statusMap[status];

  return (
    <span className={cn("font-mono text-xs uppercase flex items-center gap-2", className)}>
      <span className={color}>{char}</span>
      <span>{label || text}</span>
    </span>
  );
}

/**
 * Terminal-style key-value display
 */
interface KeyValueProps {
  label: string;
  value: React.ReactNode;
  className?: string;
}

export function TerminalKeyValue({ label, value, className }: KeyValueProps) {
  return (
    <div className={cn("font-mono", className)}>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{label}</div>
      <div className="text-sm">{value}</div>
    </div>
  );
}

/**
 * Terminal-style data grid (like the reference image)
 */
interface GridProps {
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4;
  className?: string;
}

export function TerminalGrid({ children, cols = 3, className }: GridProps) {
  const colClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn(
      "grid border border-border divide-x divide-y divide-border",
      colClass[cols],
      className
    )}>
      {children}
    </div>
  );
}

export function TerminalGridCell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("p-4 font-mono", className)}>
      {children}
    </div>
  );
}

/**
 * ASCII art icons as text
 */
export const ASCIIIcons = {
  folder: '[D]',
  file: '[F]',
  app: '[A]',
  phone: '[P]',
  connected: '[*]',
  disconnected: '[ ]',
  arrow: '->',
  check: '[✓]',
  cross: '[✗]',
  warning: '[!]',
  info: '[i]',
  battery: (level: number) => {
    const bars = Math.round(level / 20);
    return `[${'+'.repeat(bars)}${'-'.repeat(5-bars)}]`;
  },
  storage: (used: number, total: number) => {
    const pct = Math.round((used / total) * 10);
    return `[${'+'.repeat(pct)}${'.'.repeat(10-pct)}]`;
  },
};
