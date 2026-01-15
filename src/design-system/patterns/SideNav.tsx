'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LucideIcon, Usb, X, Sun, Moon, Sparkles } from 'lucide-react';
import { useDevice } from '@/context/device-context';
import { useTheme } from '@/context/theme-context';

interface NavItem {
  href: string;
  title: string;
  lucideIcon?: LucideIcon;
  section?: string;
}

interface SideNavProps {
  className?: string;
  navItems?: NavItem[];
}

// Group navigation items by section
const groupBySection = (items: NavItem[]) => {
  const sections: { [key: string]: NavItem[] } = {
    'MAIN': [],
    'TOOLS': [],
    'SYSTEM': [],
  };

  items.forEach(item => {
    if (['Dashboard'].includes(item.title)) {
      sections['MAIN'].push(item);
    } else if (['Shell', 'Logcat', 'Screenshot', 'Apps', 'Files'].includes(item.title)) {
      sections['TOOLS'].push(item);
    } else {
      sections['SYSTEM'].push(item);
    }
  });

  return sections;
};

export function SideNav({ className, navItems = [] }: SideNavProps) {
  const pathname = usePathname();
  const { deviceInfo, connectionState, connect, disconnect, isWebUsbSupported } = useDevice();
  const { resolvedTheme, setTheme } = useTheme();

  const isItemActive = (item: NavItem) => {
    return item.href === pathname || pathname?.startsWith(item.href + '/');
  };

  const sections = groupBySection(navItems);

  const renderNavItem = (item: NavItem) => {
    const isActive = isItemActive(item);
    const IconComponent = item.lucideIcon;
    const hasAI = item.title === 'Shell';

    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          'flex items-center gap-3 px-3 py-2 text-sm font-mono transition-colors',
          isActive
            ? 'text-orange-500 bg-orange-500/10'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        )}
      >
        {IconComponent && (
          <IconComponent
            className="w-4 h-4 flex-shrink-0"
            strokeWidth={1.5}
          />
        )}
        <span>{item.title}</span>
        {hasAI && (
          <span className="ml-auto flex items-center gap-0.5 text-[9px] px-1 bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <Sparkles className="w-2.5 h-2.5" />
            AI
          </span>
        )}
      </Link>
    );
  };

  const renderSection = (title: string, items: NavItem[]) => {
    if (items.length === 0) return null;

    return (
      <div key={title} className="mb-4">
        <div className="px-3 py-2 text-[10px] font-mono font-medium text-muted-foreground tracking-wider uppercase">
          {title}
        </div>
        <div className="flex flex-col">
          {items.map(renderNavItem)}
        </div>
      </div>
    );
  };

  return (
    <nav
      className={cn(
        'flex flex-col h-full bg-background border-r border-border',
        'w-[220px] min-w-[220px]',
        className
      )}
    >
      {/* Header */}
      <div className="p-3 border-b border-border flex-shrink-0">
        <Link href="/">
          <div className="font-mono text-sm uppercase tracking-wider">ADB Wrench</div>
        </Link>
        <a
          href="https://x.com/superr_ai"
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-xs text-muted-foreground mt-1 block hover:text-orange-500 transition-colors"
        >
          By Superr
        </a>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto py-4">
        {renderSection('MAIN', sections['MAIN'])}
        {renderSection('TOOLS', sections['TOOLS'])}
        {renderSection('SYSTEM', sections['SYSTEM'])}
      </div>

      {/* Device Connection Widget */}
      <div className="flex-shrink-0 border-t border-border">
        {connectionState === 'connected' && deviceInfo ? (
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500" />
                <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">Connected</span>
              </div>
              <button
                onClick={disconnect}
                className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="Disconnect"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <div className="font-mono text-xs text-foreground truncate" title={deviceInfo.model}>
              {deviceInfo.model}
            </div>
            <div className="font-mono text-[10px] text-muted-foreground truncate" title={deviceInfo.serial}>
              {deviceInfo.serial}
            </div>
          </div>
        ) : connectionState === 'connecting' ? (
          <div className="p-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-500 animate-pulse" />
              <span className="font-mono text-xs text-muted-foreground">Connecting...</span>
            </div>
          </div>
        ) : (
          <button
            onClick={connect}
            disabled={!isWebUsbSupported}
            className={cn(
              "w-full p-3 flex items-center gap-2 font-mono text-xs transition-colors",
              isWebUsbSupported
                ? "hover:bg-muted text-muted-foreground hover:text-foreground"
                : "text-muted-foreground/50 cursor-not-allowed"
            )}
          >
            <Usb className="w-4 h-4" />
            <span>{isWebUsbSupported ? 'Connect Device' : 'WebUSB Not Supported'}</span>
          </button>
        )}

        {/* Footer with Version & Theme Toggle */}
        <div className="px-3 border-t border-border flex items-center justify-between min-h-[36px]">
          <span className="font-mono text-[10px] text-muted-foreground">v1.0.0</span>
          <button
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            {resolvedTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </nav>
  );
}

export default SideNav;
