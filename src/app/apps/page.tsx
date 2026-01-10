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
import {
  Search,
  Filter,
  RefreshCw,
  Grid2X2,
  List as ListIcon,
  MoreVertical,
  Play,
  Square,
  Trash2,
  Download,
  Database,
  Info,
  Layers,
  ShieldAlert,
  Calendar,
  HardDrive,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Card } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// Helper to generate a color from string (for placeholders)
const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
};

export default function AppsPage() {
  const { connectionState } = useDevice();
  const [packages, setPackages] = useState<PackageInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'user' | 'system'>('user'); // Default to user apps for cleaner start
  const [selectedPkgName, setSelectedPkgName] = useState<string | null>(null);
  const [packageDetails, setPackageDetails] = useState<PackageDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

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
  const handleAction = async (action: () => Promise<any>) => {
    try {
      await action();
      // Optional: Show toast success
    } catch (e) {
      // Optional: Show toast error
    }
  };

  if (connectionState !== 'connected') {
    return (
      <PageLayout>
        <div className="h-full flex items-center justify-center p-8">
          <EmptyState
            title="App Manager"
            description="Connect a device to manage installed applications."
            icon={<Layers className="w-16 h-16 text-muted-foreground/30" />}
          />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="h-full flex flex-col bg-background relative overflow-hidden">

        {/* Header Control Bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 px-6 py-4 border-b border-border/60 bg-card/30 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Applications</h1>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{filtered.length} visible</span>
                <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                <span>{packages.length} total</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            {/* Search */}
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Seach packages..."
                className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            <div className="flex items-center border border-border rounded-lg p-1 bg-background">
              <button
                onClick={() => setViewMode('grid')}
                className={cn("p-1.5 rounded transition-all", viewMode === 'grid' ? "bg-muted text-foreground shadow-sm" : "text-muted-foreground hover:bg-muted/50")}
              >
                <Grid2X2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn("p-1.5 rounded transition-all", viewMode === 'list' ? "bg-muted text-foreground shadow-sm" : "text-muted-foreground hover:bg-muted/50")}
              >
                <ListIcon className="w-4 h-4" />
              </button>
            </div>

            <Button variant="ghost" size="small" icon={<RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />} onClick={loadPackages} />
          </div>
        </div>

        {/* Filters Tab */}
        <div className="px-6 py-3 border-b border-border/40 bg-muted/5 shrink-0 flex gap-2 overflow-x-auto scrollbar-hide">
          {['all', 'user', 'system'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t as any)}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-medium capitalize border transition-all",
                filterType === t
                  ? "bg-primary/10 text-primary border-primary/20 shadow-sm"
                  : "bg-card border-border/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {t} Apps
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-muted-foreground/20 bg-muted/20">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filtered.map(pkg => (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -3, scale: 1.02 }}
                  key={pkg.packageName}
                  onClick={() => setSelectedPkgName(pkg.packageName)}
                  className="group relative bg-card/80 hover:bg-card border border-border/40 hover:border-border/80 hover:shadow-xl transition-all duration-200 rounded-xl p-4 cursor-pointer flex flex-col items-center text-center gap-3 overflow-hidden backdrop-blur-sm"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-inner"
                    style={{ backgroundColor: stringToColor(pkg.packageName) }} // Placeholder icon
                  >
                    {pkg.packageName.slice(pkg.packageName.lastIndexOf('.') + 1)[0].toUpperCase()}
                  </div>
                  <div className="w-full">
                    <h3 className="font-semibold text-sm truncate w-full" title={pkg.packageName}>
                      {pkg.packageName.split('.').pop()}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate w-full opacity-70">
                      {pkg.packageName}
                    </p>
                  </div>
                  <div className="flex gap-2 mt-1">
                    {pkg.isSystem && <span className="bg-amber-500/10 text-amber-500 text-[10px] px-1.5 py-0.5 rounded border border-amber-500/20 font-medium">SYS</span>}
                    {pkg.isEnabled ? (
                      <span className="bg-green-500/10 text-green-500 text-[10px] px-1.5 py-0.5 rounded border border-green-500/20 font-medium">ON</span>
                    ) : (
                      <span className="bg-red-500/10 text-red-500 text-[10px] px-1.5 py-0.5 rounded border border-red-500/20 font-medium">OFF</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-card/50 rounded-xl border border-border/50 overflow-hidden divide-y divide-border/30">
              {filtered.map(pkg => (
                <div
                  key={pkg.packageName}
                  onClick={() => setSelectedPkgName(pkg.packageName)}
                  className="flex items-center gap-4 p-4 hover:bg-muted/30 cursor-pointer transition-all group"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-sm"
                    style={{ backgroundColor: stringToColor(pkg.packageName) }}
                  >
                    {pkg.packageName.slice(pkg.packageName.lastIndexOf('.') + 1)[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-foreground truncate">{pkg.packageName.split('.').pop()}</h4>
                    <p className="text-xs text-muted-foreground truncate">{pkg.packageName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {pkg.isSystem && <span className="text-[10px] text-amber-500 bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20 font-medium">System</span>}
                    <span className={cn("text-[10px] px-2 py-1 rounded-md border font-medium", pkg.isEnabled ? "text-green-500 bg-green-500/10 border-green-500/20" : "text-red-500 bg-red-500/10 border-red-500/20")}>
                      {pkg.isEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail Sheet */}
        <Sheet open={!!selectedPkgName} onOpenChange={() => setSelectedPkgName(null)}>
          <SheetContent side="right" className="w-[400px] sm:w-[540px] overflow-y-auto border-l border-border/60 bg-background/95 backdrop-blur-xl">
            <SheetHeader className="mb-6">
              <SheetTitle>App Details</SheetTitle>
              <SheetDescription>Manage application state and data.</SheetDescription>
            </SheetHeader>

            {detailsLoading ? (
              <div className="h-64 flex items-center justify-center">
                <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : packageDetails ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                {/* Header Profile */}
                <div className="flex flex-col items-center text-center gap-4 pb-6 border-b border-border/40">
                  <div
                    className="w-24 h-24 rounded-3xl flex items-center justify-center text-white text-3xl font-bold shadow-2xl"
                    style={{ backgroundColor: stringToColor(packageDetails.packageName) }}
                  >
                    {packageDetails.packageName.split('.').pop()?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold truncate max-w-sm">{packageDetails.packageName}</h2>
                    <p className="text-sm text-muted-foreground mt-1 font-mono bg-muted/50 px-2 py-1 rounded inline-block">
                      {packageDetails.versionName} ({packageDetails.versionCode})
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      className="shadow-lg shadow-primary/20"
                      icon={<Play className="w-4 h-4" />}
                      onClick={() => handleAction(() => launchApp(packageDetails.packageName))}
                    >
                      Open
                    </Button>
                    <Button
                      variant="secondary"
                      icon={<Square className="w-4 h-4 fill-current" />}
                      onClick={() => handleAction(() => forceStopApp(packageDetails.packageName))}
                    >
                      Stop
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="small" iconOnly icon={<MoreVertical className="w-4 h-4" />} />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleAction(() => clearAppData(packageDetails.packageName))}>
                          <Database className="w-4 h-4 mr-2" /> Clear Data
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAction(() => extractApk(packageDetails.packageName))}>
                          <Download className="w-4 h-4 mr-2" /> Extract APK
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleAction(() => uninstallApp(packageDetails.packageName))}>
                          <Trash2 className="w-4 h-4 mr-2" /> Uninstall
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg border border-border/50 bg-card/40">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <Info className="w-3.5 h-3.5" /> First Install
                    </div>
                    <p className="text-sm font-medium">{packageDetails.firstInstallTime?.split(' ')[0] || 'Unknown'}</p>
                  </div>
                  <div className="p-3 rounded-lg border border-border/50 bg-card/40">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <Clock className="w-3.5 h-3.5" /> Last Update
                    </div>
                    <p className="text-sm font-medium">{packageDetails.lastUpdateTime?.split(' ')[0] || 'Unknown'}</p>
                  </div>
                  <div className="p-3 rounded-lg border border-border/50 bg-card/40 col-span-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <HardDrive className="w-3.5 h-3.5" /> Path
                    </div>
                    <p className="text-xs font-mono">{packageDetails.installedPath}</p>
                  </div>
                </div>

                {/* Permissions */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" />
                    Permissions <span className="text-xs font-normal text-muted-foreground">({packageDetails.permissions.length})</span>
                  </h3>
                  <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
                    {packageDetails.permissions.length > 0 ? packageDetails.permissions.map(p => (
                      <span key={p} className="text-[10px] px-2 py-1 rounded bg-muted text-muted-foreground font-mono border border-border/50">
                        {p.split('.').pop()}
                      </span>
                    )) : (
                      <span className="text-sm text-muted-foreground italic">No permissions requested</span>
                    )}
                  </div>
                </div>

              </div>
            ) : null}
          </SheetContent>
        </Sheet>

      </div>
    </PageLayout>
  );
}
