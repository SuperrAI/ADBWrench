'use client';

import React, { useState, useCallback } from 'react';
import { useKeyboardShortcuts, APP_SHORTCUTS } from '@/hooks/use-keyboard-shortcuts';
import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp';
import { useTheme } from '@/context/theme-context';
import { useDevice } from '@/context/device-context';

interface KeyboardShortcutsProviderProps {
  children: React.ReactNode;
}

export function KeyboardShortcutsProvider({ children }: KeyboardShortcutsProviderProps) {
  const [showHelp, setShowHelp] = useState(false);
  const { setTheme, resolvedTheme } = useTheme();
  const { connect, connectionState } = useDevice();

  const handleToggleTheme = useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  }, [setTheme, resolvedTheme]);

  const handleConnectDevice = useCallback(() => {
    if (connectionState === 'disconnected') {
      connect();
    }
  }, [connect, connectionState]);

  useKeyboardShortcuts({
    shortcuts: [
      {
        ...APP_SHORTCUTS.HELP,
        action: () => setShowHelp(true),
      },
      {
        ...APP_SHORTCUTS.CLOSE,
        action: () => setShowHelp(false),
      },
      {
        ...APP_SHORTCUTS.TOGGLE_THEME,
        action: handleToggleTheme,
      },
      {
        ...APP_SHORTCUTS.CONNECT_DEVICE,
        action: handleConnectDevice,
      },
    ],
  });

  return (
    <>
      {children}
      <KeyboardShortcutsHelp open={showHelp} onOpenChange={setShowHelp} />
    </>
  );
}

export default KeyboardShortcutsProvider;
