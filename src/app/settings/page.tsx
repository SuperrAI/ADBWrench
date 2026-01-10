'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageLayout } from '@/design-system/patterns/PageLayout/PageLayout';
import { useDevice } from '@/context/device-context';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/design-system/components/Button';
import { shell } from '@/services/adb';
import { toast } from 'sonner';
import {
  Settings as SettingsIcon,
  Search,
  Zap,
  Smartphone,
  Wifi,
  Eye,
  MousePointer,
  Layers,
  Clock,
  Edit2,
  Trash2,
  Save,
  X,
  RefreshCw,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

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
  icon: any;
}

const NAMESPACES: Namespace[] = ['system', 'secure', 'global'];

const QUICK_SETTINGS: QuickSetting[] = [
  {
    name: 'Wireless ADB',
    description: 'Enable debugging over network',
    namespace: 'global',
    key: 'adb_wifi_enabled',
    enableValue: '1',
    disableValue: '0',
    icon: Wifi
  },
  {
    name: 'Show Touches',
    description: 'Visual feedback for interactions',
    namespace: 'system',
    key: 'show_touches',
    enableValue: '1',
    disableValue: '0',
    icon: MousePointer
  },
  {
    name: 'Pointer Location',
    description: 'Overlay coordinate data',
    namespace: 'system',
    key: 'pointer_location',
    enableValue: '1',
    disableValue: '0',
    icon: Eye
  },
  {
    name: 'Stay Awake',
    description: 'Keep screen on while charging',
    namespace: 'global',
    key: 'stay_on_while_plugged_in',
    enableValue: '3',
    disableValue: '0',
    icon: Zap
  },
  {
    name: 'GPU Layers',
    description: 'Force Enable GPU Debug Layers',
    namespace: 'global',
    key: 'enable_gpu_debug_layers',
    enableValue: '1',
    disableValue: '0',
    icon: Layers
  },
  {
    name: 'Animator Scale',
    description: 'Window animation scale',
    namespace: 'global',
    key: 'animator_duration_scale',
    enableValue: '1.0',
    disableValue: '0',
    icon: Clock
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
    } catch (e) { toast.error(`Failed to load ${namespace} settings`); }
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

  const filtered = settings.filter(s =>
    s.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.value.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (connectionState !== 'connected') {
    return (
      <PageLayout>
        <div className="h-full flex items-center justify-center p-8">
          <EmptyState title="Settings Manager" description="Connect a device to modify system settings." icon={<SettingsIcon className="w-16 h-16 text-muted-foreground/30" />} />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="h-full flex flex-col bg-background relative overflow-hidden">

        {/* Header */}
        <div className="px-6 py-4 border-b border-border/60 bg-card/30 backdrop-blur-sm z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <h1 className="text-lg font-bold tracking-tight">System Settings</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="small" icon={<RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />} onClick={() => loadSettings(activeNamespace)} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-muted-foreground/20">

          {/* Quick Settings Grid */}
          <div className="mb-8">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-1 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5" />
              Quick Toggles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {QUICK_SETTINGS.map(qs => {
                const isEnabled = quickSettingsState[qs.key];
                return (
                  <div
                    key={qs.key}
                    className={cn(
                      "group p-4 rounded-xl border backdrop-blur-sm transition-all duration-200 flex items-center gap-4 cursor-pointer",
                      isEnabled
                        ? "bg-gradient-to-br from-primary/10 via-card/80 to-card border-primary/30 hover:border-primary/50 shadow-sm"
                        : "bg-card/50 border-border/50 hover:bg-card hover:border-border hover:shadow-md"
                    )}
                    onClick={() => toggleQuickSetting(qs)}
                  >
                    <div className={cn(
                      "p-2.5 rounded-xl transition-all duration-200",
                      isEnabled
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                        : "bg-muted/80 text-muted-foreground group-hover:bg-muted"
                    )}>
                      <qs.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={cn("font-medium text-sm", isEnabled && "text-primary")}>{qs.name}</div>
                      <div className="text-[11px] text-muted-foreground truncate" title={qs.description}>{qs.description}</div>
                    </div>
                    <div className={cn(
                      "transition-all duration-200",
                      isEnabled ? "text-primary" : "text-muted-foreground/50 group-hover:text-muted-foreground"
                    )}>
                      {isEnabled ? <ToggleRight className="w-9 h-9" strokeWidth={1.5} /> : <ToggleLeft className="w-9 h-9" strokeWidth={1.5} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Namespace Tabs */}
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 bg-background/95 backdrop-blur z-10 py-2 border-b border-border/40">
            <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
              {NAMESPACES.map(ns => (
                <button
                  key={ns}
                  onClick={() => setActiveNamespace(ns)}
                  className={cn(
                    "px-4 py-1.5 rounded-md text-xs font-medium capitalize transition-all",
                    activeNamespace === ns ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {ns}
                </button>
              ))}
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search keys..."
                className="w-full bg-muted/30 border border-border rounded-lg pl-9 pr-4 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary/50 transition-all hover:bg-muted/50"
              />
            </div>
          </div>

          {/* Settings Grid */}
          <div className="pb-12">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground/50">
                <RefreshCw className="w-8 h-8 animate-spin mb-3" />
                <p className="text-sm">Loading settings...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground/50">
                <Search className="w-10 h-10 mb-3 stroke-[1.5]" />
                <p className="text-sm font-medium">No settings found</p>
                <p className="text-xs mt-1">Try adjusting your search query</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-2">
                {filtered.map((setting) => (
                  <div
                    key={setting.key}
                    className="group flex items-center gap-2 px-3 py-2 rounded-lg bg-card/50 border border-border/40 hover:bg-muted/40 hover:border-border/60 transition-all cursor-pointer"
                    onClick={() => { setEditingSetting(setting); setEditValue(setting.value); }}
                    title={`${setting.key} = ${setting.value}`}
                  >
                    <div className="min-w-0 flex-1 flex items-center gap-2">
                      <span className="font-mono text-[11px] text-muted-foreground truncate max-w-[45%]">
                        {setting.key}
                      </span>
                      <span className="text-muted-foreground/40">=</span>
                      <span className="font-mono text-[11px] text-foreground truncate flex-1">
                        {setting.value || <span className="text-muted-foreground/40 italic">null</span>}
                      </span>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        className="p-1 rounded hover:bg-primary/10 hover:text-primary text-muted-foreground"
                        onClick={(e) => { e.stopPropagation(); setEditingSetting(setting); setEditValue(setting.value); }}
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        className="p-1 rounded hover:bg-destructive/10 hover:text-destructive text-muted-foreground"
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (confirm('Delete setting?')) {
                            await shell(`settings delete ${setting.namespace} ${setting.key}`);
                            loadSettings(activeNamespace);
                          }
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 text-center text-xs text-muted-foreground">
              {filtered.length} settings
            </div>
          </div>

        </div>

        {/* Edit Modal */}
        <AnimatePresence>
          {editingSetting && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="bg-card w-full max-w-md p-6 rounded-xl border border-border shadow-2xl m-4"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Edit Setting</h3>
                  <button onClick={() => setEditingSetting(null)}><X className="w-5 h-5 text-muted-foreground hover:text-foreground" /></button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Namespace</label>
                    <div className="text-sm font-medium">{editingSetting.namespace}</div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Key</label>
                    <div className="text-sm font-mono text-primary break-all">{editingSetting.key}</div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1.5 block">Value</label>
                    <textarea
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      className="w-full h-24 bg-muted/30 border border-border rounded-lg p-3 text-sm font-mono outline-none focus:border-primary/50 focus:bg-muted/50 transition-all resize-none"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="ghost" onClick={() => setEditingSetting(null)}>Cancel</Button>
                    <Button variant="primary" icon={<Save className="w-4 h-4" />} onClick={handleSave}>Save Changes</Button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </PageLayout>
  );
}
