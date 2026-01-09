'use client';

import { useState, useEffect, useCallback } from 'react';
import PageLayout from '@/design-system/patterns/PageLayout/PageLayout';
import { useDevice } from '@/context/device-context';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/design-system/components/Button';
import { shell } from '@/services/adb';
import { toast } from 'sonner';

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
    name: 'ADB over Network',
    description: 'Enable wireless ADB debugging on port 5555',
    namespace: 'global',
    key: 'adb_wifi_enabled',
    enableValue: '1',
    disableValue: '0',
  },
  {
    name: 'Show Touches',
    description: 'Display visual feedback for touch events',
    namespace: 'system',
    key: 'show_touches',
    enableValue: '1',
    disableValue: '0',
  },
  {
    name: 'Pointer Location',
    description: 'Show pointer coordinates on screen',
    namespace: 'system',
    key: 'pointer_location',
    enableValue: '1',
    disableValue: '0',
  },
  {
    name: 'Stay Awake (Charging)',
    description: 'Keep screen on while charging',
    namespace: 'global',
    key: 'stay_on_while_plugged_in',
    enableValue: '3', // USB + AC
    disableValue: '0',
  },
  {
    name: 'GPU Debug Layers',
    description: 'Enable GPU debug layers for graphics debugging',
    namespace: 'global',
    key: 'enable_gpu_debug_layers',
    enableValue: '1',
    disableValue: '0',
  },
  {
    name: 'Animator Duration Scale',
    description: 'Animation speed (0=off, 1=normal)',
    namespace: 'global',
    key: 'animator_duration_scale',
    enableValue: '1.0',
    disableValue: '0',
  },
];

export default function SettingsPage() {
  const { connectionState } = useDevice();
  const isConnected = connectionState === 'connected';

  const [activeNamespace, setActiveNamespace] = useState<Namespace>('system');
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSetting, setEditingSetting] = useState<Setting | null>(null);
  const [editValue, setEditValue] = useState('');
  const [quickSettingsState, setQuickSettingsState] = useState<Record<string, boolean>>({});

  // Load settings from namespace
  const loadSettings = useCallback(async (namespace: Namespace) => {
    setLoading(true);
    try {
      const output = await shell(`settings list ${namespace}`);
      const lines = output.trim().split('\n');
      const parsed: Setting[] = [];

      for (const line of lines) {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          parsed.push({
            namespace,
            key: match[1],
            value: match[2],
          });
        }
      }

      setSettings(parsed.sort((a, b) => a.key.localeCompare(b.key)));
    } catch (error) {
      toast.error(`Failed to load ${namespace} settings`);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load quick settings states
  const loadQuickSettingsState = useCallback(async () => {
    const states: Record<string, boolean> = {};

    for (const qs of QUICK_SETTINGS) {
      try {
        const output = await shell(`settings get ${qs.namespace} ${qs.key}`);
        const value = output.trim();
        states[qs.key] = value === qs.enableValue;
      } catch {
        states[qs.key] = false;
      }
    }

    setQuickSettingsState(states);
  }, []);

  // Initial load
  useEffect(() => {
    if (isConnected) {
      loadSettings(activeNamespace);
      loadQuickSettingsState();
    }
  }, [isConnected, activeNamespace, loadSettings, loadQuickSettingsState]);

  // Toggle quick setting
  const toggleQuickSetting = async (qs: QuickSetting) => {
    const currentState = quickSettingsState[qs.key];
    const newValue = currentState ? qs.disableValue : qs.enableValue;

    try {
      await shell(`settings put ${qs.namespace} ${qs.key} ${newValue}`);
      setQuickSettingsState((prev) => ({
        ...prev,
        [qs.key]: !currentState,
      }));
      toast.success(`${qs.name} ${currentState ? 'disabled' : 'enabled'}`);

      // Reload if viewing same namespace
      if (activeNamespace === qs.namespace) {
        loadSettings(activeNamespace);
      }
    } catch (error) {
      toast.error(`Failed to update ${qs.name}`);
    }
  };

  // Edit setting
  const startEdit = (setting: Setting) => {
    setEditingSetting(setting);
    setEditValue(setting.value);
  };

  // Save setting
  const saveSetting = async () => {
    if (!editingSetting) return;

    try {
      await shell(`settings put ${editingSetting.namespace} ${editingSetting.key} "${editValue}"`);
      toast.success(`Updated ${editingSetting.key}`);
      setEditingSetting(null);
      loadSettings(activeNamespace);
      loadQuickSettingsState();
    } catch (error) {
      toast.error(`Failed to update setting: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Delete/reset setting
  const deleteSetting = async (setting: Setting) => {
    try {
      await shell(`settings delete ${setting.namespace} ${setting.key}`);
      toast.success(`Deleted ${setting.key}`);
      loadSettings(activeNamespace);
    } catch (error) {
      toast.error(`Failed to delete setting`);
    }
  };

  // Get single setting value
  const getSetting = async (namespace: Namespace, key: string): Promise<string> => {
    try {
      const output = await shell(`settings get ${namespace} ${key}`);
      return output.trim();
    } catch {
      return 'null';
    }
  };

  // Filter settings by search query
  const filteredSettings = settings.filter(
    (s) =>
      s.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.value.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isConnected) {
    return (
      <PageLayout>
        <div className="h-full flex items-center justify-center p-6">
          <EmptyState
            title="No Device Connected"
            description="Connect an Android device to view and edit settings."
          />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="h-full flex flex-col p-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Settings Viewer</h1>
        </div>

        {/* Quick Settings */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Quick Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {QUICK_SETTINGS.map((qs) => (
              <div
                key={qs.key}
                className="bg-gray-800 rounded-md p-4 flex items-center justify-between"
              >
                <div>
                  <div className="font-medium">{qs.name}</div>
                  <div className="text-sm text-gray-400">{qs.description}</div>
                </div>
                <button
                  onClick={() => toggleQuickSetting(qs)}
                  className={`w-12 h-6 rounded-full relative transition-colors ${
                    quickSettingsState[qs.key] ? 'bg-blue-600' : 'bg-gray-600'
                  }`}
                >
                  <div
                    className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-all ${
                      quickSettingsState[qs.key] ? 'left-6' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Warning */}
        <div className="bg-yellow-900/20 border border-yellow-800 rounded-md p-3 mb-4">
          <p className="text-yellow-400 text-sm">
            <strong>Warning:</strong> Modifying system settings can affect device behavior.
            Some changes may require a reboot to take effect.
          </p>
        </div>

        {/* Namespace Tabs and Search */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex bg-gray-800 rounded-md p-1">
            {NAMESPACES.map((ns) => (
              <button
                key={ns}
                onClick={() => setActiveNamespace(ns)}
                className={`px-4 py-1.5 text-sm rounded transition-colors capitalize ${
                  activeNamespace === ns
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {ns}
              </button>
            ))}
          </div>

          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search settings..."
              className="w-full px-4 py-2 bg-gray-800 rounded-md text-white placeholder-gray-500"
            />
          </div>

          <Button
            variant="secondary"
            size="small"
            onClick={() => loadSettings(activeNamespace)}
          >
            Refresh
          </Button>
        </div>

        {/* Settings List */}
        <div className="flex-1 overflow-auto bg-gray-900 rounded-md">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-gray-400">
              Loading settings...
            </div>
          ) : filteredSettings.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-400">
              {searchQuery ? 'No matching settings found' : 'No settings found'}
            </div>
          ) : (
            <table className="w-full">
              <thead className="sticky top-0 bg-gray-800">
                <tr className="text-left text-sm text-gray-400">
                  <th className="p-3">Key</th>
                  <th className="p-3">Value</th>
                  <th className="p-3 w-32">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSettings.map((setting) => (
                  <tr key={setting.key} className="border-t border-gray-800 hover:bg-gray-800/50">
                    <td className="p-3">
                      <code className="text-sm text-blue-400">{setting.key}</code>
                    </td>
                    <td className="p-3">
                      <code className="text-sm text-gray-300 break-all">{setting.value || '(empty)'}</code>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(setting)}
                          className="text-sm text-blue-400 hover:text-blue-300"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteSetting(setting)}
                          className="text-sm text-red-400 hover:text-red-300"
                        >
                          Reset
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Settings count */}
        <div className="mt-2 text-sm text-gray-400">
          {filteredSettings.length} of {settings.length} settings
        </div>

        {/* Edit Dialog */}
        {editingSetting && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-[500px] max-w-full mx-4">
              <h2 className="text-lg font-semibold mb-4">Edit Setting</h2>

              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-1">Namespace</label>
                <div className="text-white">{editingSetting.namespace}</div>
              </div>

              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-1">Key</label>
                <code className="text-blue-400">{editingSetting.key}</code>
              </div>

              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-1">Current Value</label>
                <code className="text-gray-300">{editingSetting.value || '(empty)'}</code>
              </div>

              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-1">New Value</label>
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 rounded-md text-white"
                  autoFocus
                />
              </div>

              <div className="bg-yellow-900/20 border border-yellow-800 rounded-md p-3 mb-4">
                <p className="text-yellow-400 text-sm">
                  Changing this setting may affect device behavior. Proceed with caution.
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setEditingSetting(null)}>
                  Cancel
                </Button>
                <Button onClick={saveSetting}>
                  Save
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
