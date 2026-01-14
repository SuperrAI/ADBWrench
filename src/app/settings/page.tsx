'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageLayout } from '@/design-system/patterns/PageLayout/PageLayout';
import { useDevice } from '@/context/device-context';
import { shell } from '@/services/adb';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { TerminalSpinner } from '@/components/ui/TerminalUI';

type Namespace = 'system' | 'secure' | 'global';

interface Setting {
  namespace: Namespace;
  key: string;
  value: string;
}

interface QuickSetting {
  name: string;
  description: string;
  namespace: Namespace;
  key: string;
  enableValue: string;
  disableValue: string;
}

const NAMESPACES: Namespace[] = ['system', 'secure', 'global'];

const QUICK_SETTINGS: QuickSetting[] = [
  {
    name: 'WIRELESS ADB',
    description: 'Enable debugging over network',
    namespace: 'global',
    key: 'adb_wifi_enabled',
    enableValue: '1',
    disableValue: '0',
  },
  {
    name: 'SHOW TOUCHES',
    description: 'Visual feedback for interactions',
    namespace: 'system',
    key: 'show_touches',
    enableValue: '1',
    disableValue: '0',
  },
  {
    name: 'POINTER LOCATION',
    description: 'Overlay coordinate data',
    namespace: 'system',
    key: 'pointer_location',
    enableValue: '1',
    disableValue: '0',
  },
  {
    name: 'STAY AWAKE',
    description: 'Keep screen on while charging',
    namespace: 'global',
    key: 'stay_on_while_plugged_in',
    enableValue: '3',
    disableValue: '0',
  },
  {
    name: 'GPU DEBUG',
    description: 'Force enable GPU debug layers',
    namespace: 'global',
    key: 'enable_gpu_debug_layers',
    enableValue: '1',
    disableValue: '0',
  },
  {
    name: 'ANIMATOR SCALE',
    description: 'Window animation scale',
    namespace: 'global',
    key: 'animator_duration_scale',
    enableValue: '1.0',
    disableValue: '0',
  },
];

export default function SettingsPage() {
  const { connectionState } = useDevice();
  const [activeNamespace, setActiveNamespace] = useState<Namespace>('system');
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSetting, setEditingSetting] = useState<Setting | null>(null);
  const [editValue, setEditValue] = useState('');
  const [quickSettingsState, setQuickSettingsState] = useState<Record<string, boolean>>({});

  const loadSettings = useCallback(async (namespace: Namespace) => {
    if (connectionState !== 'connected') return;
    setLoading(true);
    try {
      const output = await shell(`settings list ${namespace}`);
      const lines = output.trim().split('\n');
      const parsed = lines
        .map(line => {
          const match = line.match(/^([^=]+)=(.*)$/);
          return match ? { namespace, key: match[1], value: match[2] } : null;
        })
        .filter(Boolean) as Setting[];

      setSettings(parsed.sort((a, b) => a.key.localeCompare(b.key)));
    } catch { toast.error(`Failed to load ${namespace} settings`); }
    finally { setLoading(false); }
  }, [connectionState]);

  const loadQuickSettingsState = useCallback(async () => {
    if (connectionState !== 'connected') return;
    const states: Record<string, boolean> = {};
    for (const qs of QUICK_SETTINGS) {
      try {
        const val = (await shell(`settings get ${qs.namespace} ${qs.key}`)).trim();
        states[qs.key] = val === qs.enableValue;
      } catch { states[qs.key] = false; }
    }
    setQuickSettingsState(states);
  }, [connectionState]);

  useEffect(() => {
    if (connectionState === 'connected') {
      loadSettings(activeNamespace);
      loadQuickSettingsState();
    }
  }, [connectionState, activeNamespace, loadSettings, loadQuickSettingsState]);

  const toggleQuickSetting = async (qs: QuickSetting) => {
    const current = quickSettingsState[qs.key];
    const val = current ? qs.disableValue : qs.enableValue;
    try {
      await shell(`settings put ${qs.namespace} ${qs.key} ${val}`);
      setQuickSettingsState(p => ({ ...p, [qs.key]: !current }));
      if (activeNamespace === qs.namespace) loadSettings(activeNamespace);
    } catch { toast.error('Failed to update setting'); }
  };

  const handleSave = async () => {
    if (!editingSetting) return;
    try {
      await shell(`settings put ${editingSetting.namespace} ${editingSetting.key} "${editValue}"`);
      toast.success('Saved');
      setEditingSetting(null);
      loadSettings(activeNamespace);
    } catch { toast.error('Failed to save'); }
  };

  const handleDelete = async (setting: Setting) => {
    if (confirm(`Delete setting: ${setting.key}?`)) {
      try {
        await shell(`settings delete ${setting.namespace} ${setting.key}`);
        toast.success('Deleted');
        loadSettings(activeNamespace);
      } catch { toast.error('Failed to delete'); }
    }
  };

  const filtered = settings.filter(s =>
    s.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.value.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (connectionState !== 'connected') {
    return (
      <PageLayout>
        <div className="h-full flex items-center justify-center p-8 font-mono">
          <div className="text-center">
            <pre className="text-muted-foreground mb-4 text-xs">
{`  _______
 | [=] |
 | SET |
 |_____|`}
            </pre>
            <div className="text-sm mb-2">SETTINGS DISCONNECTED</div>
            <div className="text-xs text-muted-foreground">
              Connect a device to modify settings.
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="h-full flex flex-col font-mono overflow-hidden">
        {/* Header */}
        <div className="border-b border-border p-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-sm uppercase tracking-wider">SETTINGS // SYSTEM</h1>
              <div className="text-xs text-muted-foreground mt-1">
                {loading ? 'LOADING...' : `${filtered.length} SETTINGS`}
              </div>
            </div>

            <button
              onClick={() => loadSettings(activeNamespace)}
              disabled={loading}
              className="px-2 py-1 border border-border hover:bg-muted text-xs disabled:opacity-50"
            >
              [ REFRESH ]
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {/* Quick Toggles */}
          <div className="border border-border">
            <div className="p-3 border-b border-border">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                QUICK TOGGLES
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
              {QUICK_SETTINGS.map(qs => {
                const isEnabled = quickSettingsState[qs.key];
                return (
                  <div
                    key={qs.key}
                    className="p-3 flex items-center justify-between gap-3 hover:bg-muted cursor-pointer"
                    onClick={() => toggleQuickSetting(qs)}
                  >
                    <div className="min-w-0">
                      <div className="text-xs">{qs.name}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{qs.description}</div>
                    </div>
                    <span className={cn(
                      "px-2 py-1 border text-xs shrink-0",
                      isEnabled
                        ? "border-green-500 text-green-500"
                        : "border-border text-muted-foreground"
                    )}>
                      {isEnabled ? '[ON]' : '[OFF]'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Namespace Tabs + Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex gap-1 text-xs">
              {NAMESPACES.map(ns => (
                <button
                  key={ns}
                  onClick={() => setActiveNamespace(ns)}
                  className={cn(
                    "px-3 py-1 border uppercase",
                    activeNamespace === ns
                      ? "border-orange-500 text-orange-500"
                      : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {ns}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="SEARCH..."
              className="bg-transparent border border-border px-3 py-1 text-xs outline-none focus:border-orange-500 w-full sm:w-48"
            />
          </div>

          {/* Settings List */}
          <div className="border border-border">
            <div className="p-3 border-b border-border bg-muted">
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground uppercase">
                <span className="flex-1">KEY</span>
                <span className="w-32 text-right">VALUE</span>
                <span className="w-16 text-right">ACTIONS</span>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8 text-xs text-muted-foreground">
                <TerminalSpinner label="LOADING" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground">
                NO SETTINGS FOUND
              </div>
            ) : (
              <div className="divide-y divide-border text-xs max-h-96 overflow-y-auto">
                {filtered.map((setting) => (
                  <div
                    key={setting.key}
                    className="flex items-center gap-3 p-2 hover:bg-muted group"
                  >
                    <span className="flex-1 truncate text-muted-foreground" title={setting.key}>
                      {setting.key}
                    </span>
                    <span className="w-32 truncate text-right" title={setting.value}>
                      {setting.value || <span className="text-muted-foreground">null</span>}
                    </span>
                    <div className="w-16 flex justify-end gap-1 opacity-0 group-hover:opacity-100">
                      <button
                        onClick={() => { setEditingSetting(setting); setEditValue(setting.value); }}
                        className="px-1 py-0.5 border border-border hover:border-orange-500 hover:text-orange-500"
                      >
                        [E]
                      </button>
                      <button
                        onClick={() => handleDelete(setting)}
                        className="px-1 py-0.5 border border-border hover:border-red-500 hover:text-red-500"
                      >
                        [X]
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="text-center text-[10px] text-muted-foreground">
            {filtered.length} SETTINGS IN {activeNamespace.toUpperCase()}
          </div>

        </div>

        {/* Edit Modal */}
        {editingSetting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="border border-border bg-background p-4 w-96 max-w-[90vw]">
              <div className="flex items-center justify-between mb-4">
                <div className="text-xs text-muted-foreground uppercase tracking-wider">EDIT SETTING</div>
                <button
                  onClick={() => setEditingSetting(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  [X]
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase mb-1">NAMESPACE</div>
                  <div>{editingSetting.namespace}</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase mb-1">KEY</div>
                  <div className="text-orange-500 break-all">{editingSetting.key}</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase mb-1">VALUE</div>
                  <textarea
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    className="w-full h-20 bg-transparent border border-border p-2 outline-none focus:border-orange-500 resize-none"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setEditingSetting(null)}
                    className="px-3 py-1 border border-border hover:bg-muted"
                  >
                    [ CANCEL ]
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-3 py-1 border border-green-500 text-green-500 hover:bg-green-500/10"
                  >
                    [ SAVE ]
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-border px-3 py-2 flex-shrink-0 bg-background flex items-center">
          <span className="text-[10px] text-muted-foreground">
            SYSTEM | SECURE | GLOBAL SETTINGS
          </span>
        </div>
      </div>
    </PageLayout>
  );
}
