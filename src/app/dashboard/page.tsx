'use client';

import { PageLayout } from '@/design-system/patterns/PageLayout/PageLayout';
import { EmptyState } from '@/components/ui/EmptyState';
import { useDevice } from '@/context/device-context';

export default function DashboardPage() {
  const { connectionState, deviceInfo } = useDevice();

  return (
    <PageLayout>
      <div className="h-full flex flex-col">
        <div className="flex-1 flex items-center justify-center p-8">
          {connectionState !== 'connected' ? (
            <EmptyState
              title="No Device Connected"
              description="Connect an Android device via USB to view device information and use debugging tools."
            />
          ) : (
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold text-foreground">
                Device Dashboard
              </h2>
              {deviceInfo && (
                <div className="text-muted-foreground">
                  <p>{deviceInfo.manufacturer} {deviceInfo.model}</p>
                  <p className="text-sm">Serial: {deviceInfo.serial}</p>
                </div>
              )}
              <p className="text-sm text-muted-foreground/70">
                Device information and controls will be available here once Ticket 4 (F2) is implemented.
              </p>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
