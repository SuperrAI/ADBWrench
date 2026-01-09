'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { PageLayout } from '@/design-system/patterns/PageLayout/PageLayout';
import { EmptyState } from '@/components/ui/EmptyState';
import { useDevice } from '@/context/device-context';
import { Button } from '@/design-system/components/Button';
import {
  listPackages,
  getPackageDetails,
  launchApp,
  forceStopApp,
  clearAppData,
  uninstallApp,
  enablePackage,
  disablePackage,
  extractApk,
  type PackageInfo,
  type PackageDetails,
} from '@/services/packages';
import { textStyles } from '@/design-system/foundations/typography';
import { cn } from '@/lib/utils';

// Icons
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="7" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" />
    <path d="M10 10L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const PlayIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 3L13 8L4 13V3Z" fill="currentColor" />
  </svg>
);

const StopIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="10" height="10" rx="1" fill="currentColor" />
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 4H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M5 4V3C5 2.44772 5.44772 2 6 2H10C10.5523 2 11 2.44772 11 3V4" stroke="currentColor" strokeWidth="1.5" />
    <path d="M3 4L4 13C4 13.5523 4.44772 14 5 14H11C11.5523 14 12 13.5523 12 13L13 4" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const ClearIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 2L14 14M14 2L2 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const DownloadIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 2V10M8 10L5 7M8 10L11 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2 12V13C2 13.5523 2.44772 14 3 14H13C13.5523 14 14 13.5523 14 13V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2C10.2091 2 12.1182 3.28 13.1429 5.14286" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M10 5H14V1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

type FilterType = 'all' | 'user' | 'system';

// Confirmation dialog component
function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border border-border rounded-lg p-6 max-w-md mx-4">
        <h3 style={{ ...textStyles.h4 }} className="text-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-4">{message}</p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="small" onClick={onCancel}>Cancel</Button>
          <Button variant="primary" size="small" onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}

export default function AppsPage() {
  const { connectionState } = useDevice();
  const [packages, setPackages] = useState<PackageInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [packageDetails, setPackageDetails] = useState<PackageDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'uninstall' | 'clear';
    packageName: string;
  } | null>(null);

  // Load packages
  const loadPackages = useCallback(async () => {
    if (connectionState !== 'connected') return;

    setLoading(true);
    setError(null);

    try {
      const pkgs = await listPackages(true);
      setPackages(pkgs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load packages');
    } finally {
      setLoading(false);
    }
  }, [connectionState]);

  // Load on mount
  useEffect(() => {
    if (connectionState === 'connected') {
      loadPackages();
    }
  }, [connectionState, loadPackages]);

  // Load package details when selected
  useEffect(() => {
    if (!selectedPackage) {
      setPackageDetails(null);
      return;
    }

    const loadDetails = async () => {
      setDetailsLoading(true);
      try {
        const details = await getPackageDetails(selectedPackage);
        setPackageDetails(details);
      } catch {
        setPackageDetails(null);
      } finally {
        setDetailsLoading(false);
      }
    };

    loadDetails();
  }, [selectedPackage]);

  // Filter packages
  const filteredPackages = useMemo(() => {
    return packages.filter((pkg) => {
      // Filter by type
      if (filterType === 'user' && pkg.isSystem) return false;
      if (filterType === 'system' && !pkg.isSystem) return false;

      // Filter by search
      if (searchQuery) {
        return pkg.packageName.toLowerCase().includes(searchQuery.toLowerCase());
      }

      return true;
    });
  }, [packages, filterType, searchQuery]);

  // Actions
  const handleLaunch = async (packageName: string) => {
    setActionLoading('launch');
    try {
      await launchApp(packageName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to launch app');
    } finally {
      setActionLoading(null);
    }
  };

  const handleForceStop = async (packageName: string) => {
    setActionLoading('stop');
    try {
      await forceStopApp(packageName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop app');
    } finally {
      setActionLoading(null);
    }
  };

  const handleClearData = async (packageName: string) => {
    setActionLoading('clear');
    try {
      await clearAppData(packageName);
      setConfirmAction(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear data');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUninstall = async (packageName: string) => {
    setActionLoading('uninstall');
    try {
      const result = await uninstallApp(packageName);
      if (result.includes('Success')) {
        setPackages((prev) => prev.filter((p) => p.packageName !== packageName));
        setSelectedPackage(null);
      } else {
        setError(`Uninstall failed: ${result}`);
      }
      setConfirmAction(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to uninstall app');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleEnabled = async (packageName: string, currentlyEnabled: boolean) => {
    setActionLoading('toggle');
    try {
      if (currentlyEnabled) {
        await disablePackage(packageName);
      } else {
        await enablePackage(packageName);
      }
      // Refresh details
      const details = await getPackageDetails(packageName);
      setPackageDetails(details);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle app state');
    } finally {
      setActionLoading(null);
    }
  };

  const handleExtractApk = async (packageName: string) => {
    setActionLoading('extract');
    try {
      const apkData = await extractApk(packageName);
      const blob = new Blob([apkData], { type: 'application/vnd.android.package-archive' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${packageName}.apk`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract APK');
    } finally {
      setActionLoading(null);
    }
  };

  if (connectionState !== 'connected') {
    return (
      <PageLayout>
        <div className="h-full flex items-center justify-center p-8">
          <EmptyState
            title="No Device Connected"
            description="Connect an Android device via USB to manage applications."
          />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-4">
            <h1 style={{ ...textStyles.h4 }} className="text-foreground">
              Applications
            </h1>
            <span className="text-xs text-muted-foreground">
              {filteredPackages.length} / {packages.length} packages
            </span>
          </div>
          <Button
            variant="ghost"
            size="small"
            icon={<RefreshIcon />}
            onClick={loadPackages}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="px-6 py-3 border-b border-border shrink-0 flex items-center gap-4">
          {/* Search */}
          <div className="flex items-center gap-2 flex-1 max-w-xs">
            <SearchIcon />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search packages..."
              className="text-sm bg-background border border-border rounded px-2 py-1 flex-1 text-foreground"
            />
          </div>

          {/* Type filter */}
          <div className="flex items-center gap-1">
            {(['all', 'user', 'system'] as FilterType[]).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={cn(
                  'text-xs px-2 py-1 rounded capitalize',
                  filterType === type
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted'
                )}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Package list */}
          <div className="w-80 border-r border-border overflow-y-auto shrink-0">
            {loading ? (
              <div className="p-4 text-center text-muted-foreground">Loading packages...</div>
            ) : filteredPackages.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">No packages found</div>
            ) : (
              <div className="divide-y divide-border">
                {filteredPackages.map((pkg) => (
                  <button
                    key={pkg.packageName}
                    onClick={() => setSelectedPackage(pkg.packageName)}
                    className={cn(
                      'w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors',
                      selectedPackage === pkg.packageName && 'bg-muted'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'text-xs px-1.5 py-0.5 rounded',
                          pkg.isSystem
                            ? 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300'
                            : 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                        )}
                      >
                        {pkg.isSystem ? 'SYS' : 'USER'}
                      </span>
                    </div>
                    <p className="text-sm text-foreground mt-1 truncate font-mono">
                      {pkg.packageName}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Package details */}
          <div className="flex-1 overflow-y-auto p-6">
            {!selectedPackage ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Select a package to view details
              </div>
            ) : detailsLoading ? (
              <div className="text-center text-muted-foreground">Loading details...</div>
            ) : packageDetails ? (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground font-mono">
                      {packageDetails.packageName}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={cn(
                          'text-xs px-1.5 py-0.5 rounded',
                          packageDetails.isSystem
                            ? 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300'
                            : 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                        )}
                      >
                        {packageDetails.isSystem ? 'System' : 'User'}
                      </span>
                      <span
                        className={cn(
                          'text-xs px-1.5 py-0.5 rounded',
                          packageDetails.isEnabled
                            ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                            : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                        )}
                      >
                        {packageDetails.isEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedPackage(null)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <CloseIcon />
                  </button>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    size="small"
                    icon={<PlayIcon />}
                    onClick={() => handleLaunch(packageDetails.packageName)}
                    disabled={actionLoading !== null}
                  >
                    Launch
                  </Button>
                  <Button
                    variant="secondary"
                    size="small"
                    icon={<StopIcon />}
                    onClick={() => handleForceStop(packageDetails.packageName)}
                    disabled={actionLoading !== null}
                  >
                    Force Stop
                  </Button>
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() => handleToggleEnabled(packageDetails.packageName, packageDetails.isEnabled)}
                    disabled={actionLoading !== null}
                  >
                    {packageDetails.isEnabled ? 'Disable' : 'Enable'}
                  </Button>
                  <Button
                    variant="secondary"
                    size="small"
                    icon={<DownloadIcon />}
                    onClick={() => handleExtractApk(packageDetails.packageName)}
                    disabled={actionLoading !== null}
                  >
                    Extract APK
                  </Button>
                  <Button
                    variant="ghost"
                    size="small"
                    icon={<ClearIcon />}
                    onClick={() => setConfirmAction({ type: 'clear', packageName: packageDetails.packageName })}
                    disabled={actionLoading !== null}
                  >
                    Clear Data
                  </Button>
                  {!packageDetails.isSystem && (
                    <Button
                      variant="ghost"
                      size="small"
                      icon={<TrashIcon />}
                      onClick={() => setConfirmAction({ type: 'uninstall', packageName: packageDetails.packageName })}
                      disabled={actionLoading !== null}
                    >
                      Uninstall
                    </Button>
                  )}
                </div>

                {/* Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-xs font-medium text-muted-foreground mb-1">Version</h3>
                    <p className="text-sm text-foreground">
                      {packageDetails.versionName || 'Unknown'} ({packageDetails.versionCode || '?'})
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xs font-medium text-muted-foreground mb-1">Install Path</h3>
                    <p className="text-sm text-foreground font-mono truncate" title={packageDetails.installedPath}>
                      {packageDetails.installedPath || 'Unknown'}
                    </p>
                  </div>
                  {packageDetails.firstInstallTime && (
                    <div>
                      <h3 className="text-xs font-medium text-muted-foreground mb-1">First Installed</h3>
                      <p className="text-sm text-foreground">{packageDetails.firstInstallTime}</p>
                    </div>
                  )}
                  {packageDetails.lastUpdateTime && (
                    <div>
                      <h3 className="text-xs font-medium text-muted-foreground mb-1">Last Updated</h3>
                      <p className="text-sm text-foreground">{packageDetails.lastUpdateTime}</p>
                    </div>
                  )}
                </div>

                {/* Permissions */}
                {packageDetails.permissions.length > 0 && (
                  <div>
                    <h3 className="text-xs font-medium text-muted-foreground mb-2">
                      Permissions ({packageDetails.permissions.length})
                    </h3>
                    <div className="flex flex-wrap gap-1">
                      {packageDetails.permissions.slice(0, 20).map((perm) => (
                        <span
                          key={perm}
                          className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono"
                        >
                          {perm.replace('android.permission.', '')}
                        </span>
                      ))}
                      {packageDetails.permissions.length > 20 && (
                        <span className="text-xs text-muted-foreground">
                          +{packageDetails.permissions.length - 20} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                Could not load package details
              </div>
            )}
          </div>
        </div>

        {/* Confirmation dialogs */}
        {confirmAction?.type === 'uninstall' && (
          <ConfirmDialog
            title="Uninstall Application"
            message={`Are you sure you want to uninstall ${confirmAction.packageName}? This action cannot be undone.`}
            confirmLabel="Uninstall"
            onConfirm={() => handleUninstall(confirmAction.packageName)}
            onCancel={() => setConfirmAction(null)}
          />
        )}
        {confirmAction?.type === 'clear' && (
          <ConfirmDialog
            title="Clear App Data"
            message={`Are you sure you want to clear all data for ${confirmAction.packageName}? This will delete all app settings, databases, and cache.`}
            confirmLabel="Clear Data"
            onConfirm={() => handleClearData(confirmAction.packageName)}
            onCancel={() => setConfirmAction(null)}
          />
        )}
      </div>
    </PageLayout>
  );
}
