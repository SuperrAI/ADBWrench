'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { textStyles } from '@/design-system/foundations/typography';
import { Neutral } from '@/design-system/foundations/colors';

interface InfoRowProps {
  label: string;
  value: string | number;
  className?: string;
}

export function InfoRow({ label, value, className }: InfoRowProps) {
  return (
    <div className={cn('flex justify-between items-start py-2', className)}>
      <span
        className="text-muted-foreground shrink-0"
        style={{ ...textStyles.body2Med }}
      >
        {label}
      </span>
      <span
        className="text-foreground text-right ml-4 break-all"
        style={{ ...textStyles.body2Med }}
      >
        {value}
      </span>
    </div>
  );
}

interface InfoPanelProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  loading?: boolean;
}

export function InfoPanel({ title, icon, children, className, loading }: InfoPanelProps) {
  return (
    <div
      className={cn(
        'rounded-lg border bg-card p-4',
        'border-border',
        className
      )}
    >
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <h3 style={{ ...textStyles.labelSansMed }} className="text-foreground">
          {title}
        </h3>
      </div>
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between">
              <div
                className="h-4 rounded animate-pulse"
                style={{ backgroundColor: Neutral.N200, width: '30%' }}
              />
              <div
                className="h-4 rounded animate-pulse"
                style={{ backgroundColor: Neutral.N200, width: '40%' }}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="divide-y divide-border">{children}</div>
      )}
    </div>
  );
}

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
}

export function ProgressBar({ value, max = 100, className, showLabel = true }: ProgressBarProps) {
  const percent = Math.min(Math.max((value / max) * 100, 0), 100);
  const isHigh = percent > 80;
  const isMedium = percent > 60;

  return (
    <div className={cn('w-full', className)}>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300',
            isHigh ? 'bg-red-500' : isMedium ? 'bg-amber-500' : 'bg-green-500'
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-muted-foreground mt-1 block text-right">
          {percent.toFixed(0)}%
        </span>
      )}
    </div>
  );
}

interface BatteryIndicatorProps {
  level: number;
  status: string;
  className?: string;
}

export function BatteryIndicator({ level, status, className }: BatteryIndicatorProps) {
  const isCharging = status === 'Charging';
  const isLow = level < 20;
  const isMedium = level < 50;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative w-8 h-4 border-2 border-current rounded-sm">
        <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 w-1 h-2 bg-current rounded-r-sm" />
        <div
          className={cn(
            'h-full transition-all duration-300',
            isLow ? 'bg-red-500' : isMedium ? 'bg-amber-500' : 'bg-green-500'
          )}
          style={{ width: `${level}%` }}
        />
      </div>
      <span className="text-sm font-medium">
        {level}%
        {isCharging && (
          <span className="ml-1 text-green-500">⚡</span>
        )}
      </span>
    </div>
  );
}
