'use client';

import { useEffect, useCallback, useRef } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  action: () => void;
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

// Helper to format shortcut for display
export function formatShortcut(shortcut: Omit<KeyboardShortcut, 'action' | 'description'>): string {
  const parts: string[] = [];

  // Use Cmd on Mac, Ctrl on other platforms
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac');

  if (shortcut.ctrl || shortcut.meta) {
    parts.push(isMac ? '⌘' : 'Ctrl');
  }
  if (shortcut.alt) {
    parts.push(isMac ? '⌥' : 'Alt');
  }
  if (shortcut.shift) {
    parts.push(isMac ? '⇧' : 'Shift');
  }

  // Format special keys
  let keyDisplay = shortcut.key;
  if (shortcut.key === 'Escape') keyDisplay = 'Esc';
  if (shortcut.key === ' ') keyDisplay = 'Space';
  if (shortcut.key === 'ArrowUp') keyDisplay = '↑';
  if (shortcut.key === 'ArrowDown') keyDisplay = '↓';
  if (shortcut.key === 'ArrowLeft') keyDisplay = '←';
  if (shortcut.key === 'ArrowRight') keyDisplay = '→';

  parts.push(keyDisplay.toUpperCase());

  return parts.join(isMac ? '' : '+');
}

export function useKeyboardShortcuts({ shortcuts, enabled = true }: UseKeyboardShortcutsOptions) {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Don't trigger shortcuts when typing in input fields
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      // Allow Escape to work even in input fields
      if (event.key !== 'Escape') {
        return;
      }
    }

    for (const shortcut of shortcutsRef.current) {
      const ctrlOrMeta = shortcut.ctrl || shortcut.meta;
      const matchesCtrlMeta = ctrlOrMeta
        ? event.ctrlKey || event.metaKey
        : !event.ctrlKey && !event.metaKey;

      const matchesShift = shortcut.shift ? event.shiftKey : !event.shiftKey;
      const matchesAlt = shortcut.alt ? event.altKey : !event.altKey;
      const matchesKey = event.key.toLowerCase() === shortcut.key.toLowerCase();

      if (matchesKey && matchesCtrlMeta && matchesShift && matchesAlt) {
        event.preventDefault();
        shortcut.action();
        return;
      }
    }
  }, [enabled]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Predefined shortcuts registry for the app
export const APP_SHORTCUTS = {
  HELP: { key: '?', shift: true, description: 'Show keyboard shortcuts' },
  CLOSE: { key: 'Escape', description: 'Close modal/dialog' },
  COMMAND_PALETTE: { key: 'k', meta: true, description: 'Open command palette' },
  TOGGLE_THEME: { key: 'd', meta: true, description: 'Toggle dark/light theme' },
  CONNECT_DEVICE: { key: 'u', meta: true, description: 'Connect USB device' },
  SCREENSHOT: { key: 's', meta: true, shift: true, description: 'Take screenshot' },
} as const;

export default useKeyboardShortcuts;
