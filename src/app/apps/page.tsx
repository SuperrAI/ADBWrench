'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { PageLayout } from '@/design-system/patterns/PageLayout/PageLayout';
import { useDevice } from '@/context/device-context';
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
import { cn } from '@/lib/utils';
import { TerminalSpinner, TerminalLoadingState } from '@/components/ui/TerminalUI';

export default function AppsPage() {
  const { connectionState } = useDevice();
  const [packages, setPackages] = useState<PackageInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'user' | 'system'>('user');
  const [selectedPkgName, setSelectedPkgName] = useState<string | null>(null);
  const [packageDetails, setPackageDetails] = useState<PackageDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [actionResult, setActionResult] = useState<string | null>(null);

  // Load Packages
  const loadPackages = useCallback(async () => {
    if (connectionState !== 'connected') return;
    setLoading(true);
    try {
      const pkgs = await listPackages(true);
      setPackages(pkgs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [connectionState]);

  useEffect(() => {
    if (connectionState === 'connected') loadPackages();
  }, [connectionState, loadPackages]);

  // Load Details
  useEffect(() => {
    if (!selectedPkgName) return;
    const fetchDetails = async () => {
      setDetailsLoading(true);
      try {
        const details = await getPackageDetails(selectedPkgName);
        setPackageDetails(details);
      } catch (e) {
        console.error(e);
      } finally {
        setDetailsLoading(false);
      }
    };
    fetchDetails();
  }, [selectedPkgName]);

  const filtered = useMemo(() => {
    return packages.filter(p => {
      if (filterType === 'user' && p.isSystem) return false;
      if (filterType === 'system' && !p.isSystem) return false;
      if (searchQuery && !p.packageName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [packages, filterType, searchQuery]);

  // Actions
  const handleAction = async (action: string, fn: () => Promise<unknown>) => {
    setActionResult(`EXECUTING: ${action}...`);
    try {
      await fn();
      setActionResult(`OK: ${action} completed`);
      setTimeout(() => setActionResult(null), 2000);
    } catch (e) {
      setActionResult(`ERROR: ${action} failed`);
      setTimeout(() => setActionResult(null), 3000);
    }
  };

  if (connectionState !== 'connected') {
    return (
      <PageLayout>
        <div className="h-full flex items-center justify-center p-8 font-mono">
          <div className="text-center">
            <pre className="text-muted-foreground mb-4 text-xs">
{`  _____
 | APP |
 |_____|
 |[  ]|
 |____|`}
            </pre>
            <div className="text-sm mb-2">APP MANAGER DISCONNECTED</div>
            <div className="text-xs text-muted-foreground">
              Connect a device to manage applications.
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="h-full flex font-mono overflow-hidden">
        {/* Main List Panel */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-border">
          {/* Header */}
          <div className="border-b border-border p-3 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-sm uppercase tracking-wider">APPS // MANAGER</h1>
                <div className="text-xs text-muted-foreground mt-1">
                  {filtered.length} / {packages.length} PACKAGES
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={loadPackages}
                  disabled={loading}
                  className="px-2 py-1 border border-border hover:bg-muted disabled:opacity-50"
                >
                  [ {loading ? 'LOADING...' : 'REFRESH'} ]
                </button>
              </div>
            </div>
          </div>

          {/* Filters Row */}
          <div className="border-b border-border p-2 flex-shrink-0 flex items-center gap-4 text-xs">
            {/* Search */}
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">SEARCH:</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="package name..."
                className="bg-transparent border-b border-border px-1 py-0.5 outline-none w-40 focus:border-foreground"
              />
            </div>

            <div className="h-4 w-px bg-border" />

            {/* Filter Type */}
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground mr-1">TYPE:</span>
              {(['all', 'user', 'system'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={cn(
                    "px-2 py-0.5 border uppercase",
                    filterType === t
                      ? "border-orange-500 text-orange-500"
                      : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="h-4 w-px bg-border" />

            {/* View Mode */}
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground mr-1">VIEW:</span>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "px-2 py-0.5 border",
                  viewMode === 'list' ? "border-orange-500 text-orange-500" : "border-border text-muted-foreground"
                )}
              >
                LIST
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  "px-2 py-0.5 border",
                  viewMode === 'grid' ? "border-orange-500 text-orange-500" : "border-border text-muted-foreground"
                )}
              >
                GRID
              </button>
            </div>
          </div>

          {/* Package List */}
          <div className="flex-1 overflow-y-auto">
            {loading && packages.length === 0 ? (
              <TerminalLoadingState label="LOADING PACKAGES" sublabel="Fetching installed applications..." />
            ) : viewMode === 'list' ? (
              <div className="divide-y divide-border">
                {filtered.map(pkg => (
                  <div
                    key={pkg.packageName}
                    onClick={() => setSelectedPkgName(pkg.packageName)}
                    className={cn(
                      "flex items-center gap-3 p-3 hover:bg-muted cursor-pointer text-xs",
                      selectedPkgName === pkg.packageName && "bg-muted"
                    )}
                  >
                    <span className="text-orange-500 w-6 text-center">[A]</span>
                    <div className="flex-1 min-w-0">
                      <div className="truncate">{pkg.packageName}</div>
                    </div>
                    <div className="flex items-center gap-2 text-[10px]">
                      {pkg.isSystem && <span className="text-amber-500">[SYS]</span>}
                      <span className={pkg.isEnabled ? "text-green-500" : "text-red-500"}>
                        {pkg.isEnabled ? '[ON]' : '[OFF]'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3">
                {filtered.map(pkg => (
                  <div
                    key={pkg.packageName}
                    onClick={() => setSelectedPkgName(pkg.packageName)}
                    className={cn(
                      "border border-border p-3 hover:bg-muted cursor-pointer text-xs",
                      selectedPkgName === pkg.packageName && "bg-muted border-orange-500"
                    )}
                  >
                    <div className="text-orange-500 mb-1">[A]</div>
                    <div className="truncate text-[10px]" title={pkg.packageName}>
                      {pkg.packageName.split('.').pop()}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] mt-1">
                      {pkg.isSystem && <span className="text-amber-500">[S]</span>}
                      <span className={pkg.isEnabled ? "text-green-500" : "text-red-500"}>
                        {pkg.isEnabled ? '[+]' : '[-]'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Detail Panel */}
        <div className="w-[320px] flex-shrink-0 flex flex-col overflow-hidden bg-background">
          {selectedPkgName ? (
            <>
              {/* Detail Header */}
              <div className="border-b border-border p-3 flex-shrink-0">
                <div className="text-xs text-muted-foreground uppercase tracking-wider">PACKAGE DETAILS</div>
                <button
                  onClick={() => setSelectedPkgName(null)}
                  className="absolute top-3 right-3 text-xs text-muted-foreground hover:text-foreground"
                >
                  [X]
                </button>
              </div>

              {/* Detail Content */}
              <div className="flex-1 overflow-y-auto p-3 text-xs space-y-4">
                {detailsLoading ? (
                  <div className="h-32 flex items-center justify-center">
                    <TerminalSpinner label="LOADING" />
                  </div>
                ) : packageDetails ? (
                  <>
                    {/* Package Name */}
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">PACKAGE</div>
                      <div className="text-foreground break-all">{packageDetails.packageName}</div>
                    </div>

                    {/* Version */}
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">VERSION</div>
                      <div className="text-foreground">{packageDetails.versionName} ({packageDetails.versionCode})</div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">INSTALLED</div>
                        <div className="text-muted-foreground">{packageDetails.firstInstallTime?.split(' ')[0] || '--'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">UPDATED</div>
                        <div className="text-muted-foreground">{packageDetails.lastUpdateTime?.split(' ')[0] || '--'}</div>
                      </div>
                    </div>

                    {/* Path */}
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">PATH</div>
                      <div className="text-muted-foreground text-[10px] break-all">{packageDetails.installedPath}</div>
                    </div>

                    {/* Actions */}
                    <div className="border-t border-border pt-3">
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">ACTIONS</div>
                      <div className="flex flex-wrap gap-1">
                        <button
                          onClick={() => handleAction('LAUNCH', () => launchApp(packageDetails.packageName))}
                          className="px-2 py-1 border border-green-500 text-green-500 hover:bg-green-500/10"
                        >
                          [ OPEN ]
                        </button>
                        <button
                          onClick={() => handleAction('STOP', () => forceStopApp(packageDetails.packageName))}
                          className="px-2 py-1 border border-border hover:bg-muted"
                        >
                          [ STOP ]
                        </button>
                        <button
                          onClick={() => handleAction('CLEAR DATA', () => clearAppData(packageDetails.packageName))}
                          className="px-2 py-1 border border-border hover:bg-muted"
                        >
                          [ CLEAR ]
                        </button>
                        <button
                          onClick={() => handleAction('EXTRACT APK', () => extractApk(packageDetails.packageName))}
                          className="px-2 py-1 border border-border hover:bg-muted"
                        >
                          [ APK ]
                        </button>
                        <button
                          onClick={() => handleAction('UNINSTALL', () => uninstallApp(packageDetails.packageName))}
                          className="px-2 py-1 border border-red-500 text-red-500 hover:bg-red-500/10"
                        >
                          [ DELETE ]
                        </button>
                      </div>
                    </div>

                    {/* Permissions */}
                    <div className="border-t border-border pt-3">
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
                        PERMISSIONS ({packageDetails.permissions.length})
                      </div>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {packageDetails.permissions.length > 0 ? packageDetails.permissions.map(p => (
                          <div key={p} className="text-[10px] text-muted-foreground truncate" title={p}>
                            - {p.split('.').pop()}
                          </div>
                        )) : (
                          <div className="text-muted-foreground italic">No permissions</div>
                        )}
                      </div>
                    </div>

                    {/* Action Result */}
                    {actionResult && (
                      <div className={cn(
                        "border p-2 text-[10px]",
                        actionResult.startsWith('OK') ? "border-green-500 text-green-500" :
                        actionResult.startsWith('ERROR') ? "border-red-500 text-red-500" :
                        "border-orange-500 text-orange-500"
                      )}>
                        {actionResult}
                      </div>
                    )}
                  </>
                ) : null}
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-xs">
              <pre className="mb-4">
{`>_`}
              </pre>
              <p>SELECT A PACKAGE</p>
              <p className="text-muted-foreground mt-2">TO VIEW DETAILS</p>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
