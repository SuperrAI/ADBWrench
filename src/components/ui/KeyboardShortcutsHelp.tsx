'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './dialog';
import { formatShortcut, APP_SHORTCUTS } from '@/hooks/use-keyboard-shortcuts';
import { Neutral } from '@/design-system/foundations/colors';
import { textStyles } from '@/design-system/foundations/typography';

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ShortcutDisplayProps {
  shortcut: {
    key: string;
    ctrl?: boolean;
    meta?: boolean;
    shift?: boolean;
    alt?: boolean;
    description: string;
  };
}

function ShortcutDisplay({ shortcut }: ShortcutDisplayProps) {
  const formatted = formatShortcut(shortcut);

  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <span style={{ ...textStyles.body2Med }} className="text-foreground">
        {shortcut.description}
      </span>
      <kbd
        className="px-2 py-1 rounded text-xs font-mono"
        style={{
          backgroundColor: Neutral.N100,
          color: Neutral.N700,
          border: `1px solid ${Neutral.N200}`,
        }}
      >
        {formatted}
      </kbd>
    </div>
  );
}

export function KeyboardShortcutsHelp({ open, onOpenChange }: KeyboardShortcutsHelpProps) {
  const shortcuts = [
    { ...APP_SHORTCUTS.HELP, description: 'Show keyboard shortcuts' },
    { ...APP_SHORTCUTS.CLOSE, description: 'Close modal/dialog' },
    { ...APP_SHORTCUTS.TOGGLE_THEME, description: 'Toggle dark/light theme' },
    { ...APP_SHORTCUTS.CONNECT_DEVICE, description: 'Connect USB device' },
    { ...APP_SHORTCUTS.SCREENSHOT, description: 'Take screenshot' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Quick actions available throughout the app
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          {shortcuts.map((shortcut, index) => (
            <ShortcutDisplay key={index} shortcut={shortcut} />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Press <kbd className="px-1 py-0.5 rounded bg-muted text-xs font-mono">Esc</kbd> to close this dialog
        </p>
      </DialogContent>
    </Dialog>
  );
}

export default KeyboardShortcutsHelp;
