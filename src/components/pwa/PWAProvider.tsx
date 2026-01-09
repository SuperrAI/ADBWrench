'use client';

import { OfflineIndicator } from './OfflineIndicator';
import { UpdateNotification } from './UpdateNotification';
import { InstallPrompt } from './InstallPrompt';

interface PWAProviderProps {
  children: React.ReactNode;
}

export function PWAProvider({ children }: PWAProviderProps) {
  return (
    <>
      {children}
      <OfflineIndicator />
      <UpdateNotification />
      <InstallPrompt />
    </>
  );
}

export default PWAProvider;
