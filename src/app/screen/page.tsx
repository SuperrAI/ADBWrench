'use client';

import { useState } from 'react';
import { PageLayout } from '@/design-system/patterns/PageLayout/PageLayout';
import { useDevice } from '@/context/device-context';
import { cn } from '@/lib/utils';
import { ScreenshotTab } from './components/ScreenshotTab';
import { RecordTab } from './components/RecordTab';
import { LiveViewTab } from './components/LiveViewTab';

type ScreenTab = 'screenshot' | 'record' | 'live';

type ScreenTabConfig = {
  id: ScreenTab;
  label: string;
  headerSuffix: string;
  subtitle: string;
};

const TABS: ScreenTabConfig[] = [
  { id: 'screenshot', label: 'SCREENSHOT', headerSuffix: 'CAPTURE', subtitle: 'INSTANT CAPTURE | PNG FORMAT' },
  { id: 'record', label: 'RECORD', headerSuffix: 'RECORD', subtitle: 'VIDEO UP TO 3MIN | MP4 FORMAT' },
  { id: 'live', label: 'LIVE VIEW', headerSuffix: 'LIVE', subtitle: 'REAL-TIME MIRRORING | SCRCPY + WEBCODECS' },
];

export default function ScreenPage() {
  const { connectionState } = useDevice();
  const [activeTab, setActiveTab] = useState<ScreenTab>('screenshot');

  const activeTabConfig = TABS.find((t) => t.id === activeTab)!;

  if (connectionState !== 'connected') {
    return (
      <PageLayout>
        <div className="h-full flex items-center justify-center p-8 font-mono">
          <div className="text-center">
            <div className="text-sm mb-2">SCREEN DISCONNECTED</div>
            <div className="text-xs text-muted-foreground">
              Connect a device to use screen capture features.
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="h-full flex flex-col font-mono overflow-hidden">
        {/* Header with Tab Navigation */}
        <div className="border-b border-border p-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-sm uppercase tracking-wider">
                SCREEN // {activeTabConfig.headerSuffix}
              </h1>
              <div className="text-xs text-muted-foreground mt-1">
                {activeTabConfig.subtitle}
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'px-2 py-1 border text-xs uppercase transition-colors',
                    activeTab === tab.id
                      ? 'border-orange-500 text-orange-500 bg-orange-500/10'
                      : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'screenshot' && <ScreenshotTab />}
        {activeTab === 'record' && <RecordTab />}
        {activeTab === 'live' && <LiveViewTab />}

        {/* Footer */}
        <div className="border-t border-border px-3 flex-shrink-0 bg-background flex items-center min-h-[36px]">
          <span className="text-[10px] text-muted-foreground">
            {activeTabConfig.label}: {activeTabConfig.subtitle}
          </span>
        </div>
      </div>
    </PageLayout>
  );
}
