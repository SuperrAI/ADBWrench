'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { PageLayout } from '@/design-system/patterns/PageLayout/PageLayout';
import { useDevice } from '@/context/device-context';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/design-system/components/Button';
import {
  listDirectory,
  pullFileWithProgress,
  pushFile,
  deleteFile,
  deleteDirectory,
  createDirectory,
  FileEntry,
} from '@/services/adb';
import { toast } from 'sonner';
import {
  Folder,
  File,
  ChevronRight,
  Home,
  Upload,
  FolderPlus,
  RefreshCw,
  Download,
  Trash2,
  Grid2X2,
  List as ListIcon,
  Image as ImageIcon,
  FileText,
  Music,
  Video,
  Code,
  Box,
  MoreVertical,
  Check,
  ArrowUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

const SHORTCUTS = [
  { label: 'SD Card', path: '/sdcard', icon: Home },
  { label: 'Downloads', path: '/sdcard/Download', icon: Download },
  { label: 'Photos', path: '/sdcard/DCIM', icon: ImageIcon },
  { label: 'Temp', path: '/data/local/tmp', icon: Box },
];

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

const getFileIcon = (entry: FileEntry) => {
  if (entry.isDirectory) return <Folder className="w-full h-full fill-blue-500/20 text-blue-500" />;

  const ext = entry.name.split('.').pop()?.toLowerCase();

  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return <ImageIcon className="w-full h-full text-purple-500" />;
  if (['mp4', 'mkv', 'webm'].includes(ext || '')) return <Video className="w-full h-full text-red-500" />;
  if (['mp3', 'wav', 'ogg'].includes(ext || '')) return <Music className="w-full h-full text-pink-500" />;
  if (['json', 'xml', 'js', 'ts', 'html', 'css'].includes(ext || '')) return <Code className="w-full h-full text-emerald-500" />;
  if (['txt', 'log', 'md'].includes(ext || '')) return <FileText className="w-full h-full text-slate-500" />;
  if (['apk'].includes(ext || '')) return <Box className="w-full h-full text-green-600" />;

  return <File className="w-full h-full text-muted-foreground" />;
};

export default function FilesPage() {
  const { connectionState } = useDevice();
  const [currentPath, setCurrentPath] = useState('/sdcard');
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [transferProgress, setTransferProgress] = useState<{ type: 'upload' | 'download'; progress: number; name: string } | null>(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDirectory = useCallback(async (path: string) => {
    if (connectionState !== 'connected') return;
    setLoading(true);
    try {
      const files = await listDirectory(path);
      // Sort: Folders first, then files
      const sorted = files.sort((a, b) => {
        if (a.isDirectory === b.isDirectory) return a.name.localeCompare(b.name);
        return a.isDirectory ? -1 : 1;
      });
      setEntries(sorted);
      setCurrentPath(path);
      setSelectedFiles(new Set());
    } catch (err) {
      toast.error('Failed to access directory');
    } finally {
      setLoading(false);
    }
  }, [connectionState]);

  useEffect(() => {
    if (connectionState === 'connected') loadDirectory(currentPath);
  }, [connectionState, loadDirectory]);

  const navigateTo = (path: string) => loadDirectory(path);
  const navigateUp = () => {
    const parent = currentPath.split('/').slice(0, -1).join('/') || '/';
    navigateTo(parent);
  };

  const handleEntryClick = (entry: FileEntry) => {
    if (entry.isDirectory) navigateTo(entry.path);
    else handleToggleSelect(entry);
  };

  const handleToggleSelect = (entry: FileEntry) => {
    const next = new Set(selectedFiles);
    if (next.has(entry.path)) next.delete(entry.path);
    else next.add(entry.path);
    setSelectedFiles(next);
  };

  // ... (keep transfer logic largely same, just UI update) ...
  const downloadSelected = async () => {
    for (const path of selectedFiles) {
      const entry = entries.find(e => e.path === path);
      if (entry && !entry.isDirectory) {
        setTransferProgress({ type: 'download', progress: 0, name: entry.name });
        try {
          const data = await pullFileWithProgress(entry.path, (loaded, total) => {
            setTransferProgress({ type: 'download', progress: Math.round((loaded / total) * 100), name: entry.name });
          });
          // Download logic
          const url = URL.createObjectURL(new Blob([data as any]));
          const a = document.createElement('a'); a.href = url; a.download = entry.name;
          document.body.appendChild(a); a.click(); document.body.removeChild(a);
          URL.revokeObjectURL(url);
        } catch (e) { toast.error(`Failed: ${entry.name}`); }
      }
    }
    setTransferProgress(null);
    setSelectedFiles(new Set());
  };

  const deleteSelected = async () => {
    for (const path of selectedFiles) {
      const entry = entries.find(e => e.path === path);
      if (!entry) continue;
      try {
        if (entry.isDirectory) await deleteDirectory(path);
        else await deleteFile(path);
      } catch (e) { toast.error(`Failed delete: ${entry.name}`); }
    }
    loadDirectory(currentPath); // Refresh
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const files = Array.from(e.target.files);
    for (const file of files) {
      setTransferProgress({ type: 'upload', progress: 0, name: file.name });
      try {
        const data = new Uint8Array(await file.arrayBuffer());
        await pushFile(`${currentPath}/${file.name}`, data, (p) => {
          setTransferProgress({ type: 'upload', progress: p, name: file.name });
        });
      } catch (e) { toast.error(`Failed upload: ${file.name}`); }
    }
    setTransferProgress(null);
    loadDirectory(currentPath);
  };

  const handleCreateDir = async () => {
    if (!newFolderName.trim()) return;
    try {
      await createDirectory(`${currentPath}/${newFolderName.trim()}`);
      setNewFolderName('');
      setShowNewFolder(false);
      loadDirectory(currentPath);
    } catch (e) { toast.error('Failed to create folder'); }
  };

  if (connectionState !== 'connected') {
    return (
      <PageLayout>
        <div className="h-full flex items-center justify-center p-8">
          <EmptyState title="File Browser" description="Connect a device to browse system files." icon={<Folder className="w-16 h-16 text-muted-foreground/30" />} />
        </div>
      </PageLayout>
    );
  }

  const breadcrumbs = currentPath.split('/').filter(Boolean);

  return (
    <PageLayout>
      <div
        className="h-full flex flex-col bg-background relative"
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          // Handle drop upload logic would go here if extending
        }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border/60 bg-card/30 backdrop-blur-sm z-10 flex flex-col gap-4">

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <Button variant="ghost" size="small" iconOnly icon={<Home className="w-4 h-4" />} onClick={() => navigateTo('/')} />
              {breadcrumbs.map((crumb, i) => (
                <div key={i} className="flex items-center gap-1 shrink-0 text-sm">
                  <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                  <button
                    onClick={() => navigateTo('/' + breadcrumbs.slice(0, i + 1).join('/'))}
                    className={cn("hover:text-primary transition-colors font-medium px-1.5 py-0.5 rounded hover:bg-muted", i === breadcrumbs.length - 1 ? "text-foreground" : "text-muted-foreground")}
                  >
                    {crumb}
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center border border-border rounded-lg p-1 bg-background mr-2">
                <button onClick={() => setViewMode('grid')} className={cn("p-1.5 rounded transition-all", viewMode === 'grid' ? "bg-muted shadow-sm" : "hover:bg-muted/50 text-muted-foreground")}>
                  <Grid2X2 className="w-4 h-4" />
                </button>
                <button onClick={() => setViewMode('list')} className={cn("p-1.5 rounded transition-all", viewMode === 'list' ? "bg-muted shadow-sm" : "hover:bg-muted/50 text-muted-foreground")}>
                  <ListIcon className="w-4 h-4" />
                </button>
              </div>
              <Button variant="outline" size="small" icon={<RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />} onClick={() => loadDirectory(currentPath)} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="primary" size="small" icon={<MoreVertical className="w-4 h-4" />}>Actions</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowNewFolder(true)}>
                    <FolderPlus className="w-4 h-4 mr-2" /> New Folder
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                    <Upload className="w-4 h-4 mr-2" /> Upload Files
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Toolbar / Selection */}
          <div className="flex items-center justify-between h-8">
            <div className="flex gap-2">
              {SHORTCUTS.map(sc => (
                <button
                  key={sc.path}
                  onClick={() => navigateTo(sc.path)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/50 hover:bg-muted border border-border/50 text-xs font-medium transition-colors"
                >
                  <sc.icon className="w-3 h-3 text-muted-foreground" /> {sc.label}
                </button>
              ))}
              {currentPath !== '/' && (
                <button onClick={navigateUp} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/50 hover:bg-muted border border-border/50 text-xs font-medium transition-colors">
                  <ArrowUp className="w-3 h-3" /> Up
                </button>
              )}
            </div>

            <AnimatePresence>
              {selectedFiles.size > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                  className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-1 rounded-full text-xs text-primary"
                >
                  <span className="font-semibold">{selectedFiles.size} selected</span>
                  <div className="h-3 w-px bg-primary/20 mx-1" />
                  <button onClick={downloadSelected} className="hover:underline flex items-center gap-1"><Download className="w-3 h-3" /> Download</button>
                  <button onClick={deleteSelected} className="hover:underline flex items-center gap-1 text-destructive"><Trash2 className="w-3 h-3" /> Delete</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Create Folder Modal Overlay */}
        {showNewFolder && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-card border border-border p-6 rounded-xl shadow-2xl w-80">
              <h3 className="text-lg font-semibold mb-4">New Folder</h3>
              <input
                autoFocus
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                placeholder="Folder Name"
                className="w-full bg-background border border-border rounded-lg px-3 py-2 mb-4 outline-none focus:ring-2 focus:ring-primary/50"
                onKeyDown={e => e.key === 'Enter' && handleCreateDir()}
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="small" onClick={() => setShowNewFolder(false)}>Cancel</Button>
                <Button variant="primary" size="small" onClick={handleCreateDir}>Create</Button>
              </div>
            </div>
          </div>
        )}

        {/* Transfer Progress */}
        <AnimatePresence>
          {transferProgress && (
            <motion.div
              initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="absolute bottom-6 right-6 z-50 bg-card border border-border p-4 rounded-xl shadow-2xl w-80"
            >
              <div className="flex justify-between items-center mb-2 text-sm font-medium">
                <span>{transferProgress.type === 'upload' ? 'Uploading' : 'Downloading'}...</span>
                <span>{transferProgress.progress}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${transferProgress.progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2 truncate">{transferProgress.name}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-muted-foreground/20 bg-muted/20">
          {entries.length === 0 && !loading ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <div className="p-6 rounded-2xl bg-card/50 border border-border/50">
                <Folder className="w-16 h-16 mb-4 stroke-[1.5] text-muted-foreground/40 mx-auto" />
                <p className="text-sm font-medium">This directory is empty</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Upload files or create a new folder</p>
              </div>
            </div>
          ) : (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
                {entries.map(entry => (
                  <div
                    key={entry.path}
                    onClick={() => handleEntryClick(entry)}
                    className={cn(
                      "group relative flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-200 cursor-pointer border bg-card/80 backdrop-blur-sm shadow-sm",
                      selectedFiles.has(entry.path)
                        ? "bg-primary/10 border-primary/30 ring-2 ring-primary/20 shadow-md"
                        : "border-border/40 hover:bg-card hover:border-border hover:shadow-md hover:scale-[1.02]"
                    )}
                  >
                    <div className="w-14 h-14 mb-1 transition-transform duration-200 group-hover:scale-105">
                      {getFileIcon(entry)}
                    </div>
                    <p className="text-xs text-center font-medium truncate w-full px-1 leading-tight">{entry.name}</p>
                    {!entry.isDirectory && (
                      <p className="text-[10px] text-muted-foreground/60 font-mono">{formatSize(entry.size)}</p>
                    )}

                    {/* Selection Checkbox (Visible on hover or selected) */}
                    <div
                      className={cn(
                        "absolute top-2 right-2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-150 shadow-sm",
                        selectedFiles.has(entry.path)
                          ? "border-primary bg-primary text-white scale-100"
                          : "border-border/60 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 hover:border-primary/50"
                      )}
                      onClick={(e) => { e.stopPropagation(); handleToggleSelect(entry); }}
                    >
                      {selectedFiles.has(entry.path) && <Check className="w-3 h-3" strokeWidth={3} />}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-1 bg-card/50 rounded-xl border border-border/40 overflow-hidden">
                {entries.map((entry, index) => (
                  <div
                    key={entry.path}
                    onClick={() => handleEntryClick(entry)}
                    className={cn(
                      "flex items-center gap-4 px-4 py-3 cursor-pointer transition-all duration-150",
                      selectedFiles.has(entry.path)
                        ? "bg-primary/10"
                        : "hover:bg-muted/50",
                      index !== entries.length - 1 && "border-b border-border/30"
                    )}
                  >
                    <div className="w-9 h-9 shrink-0">{getFileIcon(entry)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{entry.name}</p>
                      <p className="text-xs text-muted-foreground/70">{entry.permissions} • {entry.modifiedDate}</p>
                    </div>
                    <div className="text-xs font-mono text-muted-foreground tabular-nums px-2">
                      {entry.isDirectory ? <span className="text-muted-foreground/40">—</span> : formatSize(entry.size)}
                    </div>
                    <div
                      className={cn(
                        "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-150 cursor-pointer",
                        selectedFiles.has(entry.path)
                          ? "bg-primary border-primary text-white"
                          : "border-border/50 hover:border-primary/50 text-transparent"
                      )}
                      onClick={(e) => { e.stopPropagation(); handleToggleSelect(entry); }}
                    >
                      <Check className="w-3 h-3" strokeWidth={3} />
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* File Input */}
        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleUpload} />

        {/* Drag Overlay */}
        <AnimatePresence>
          {dragOver && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-primary/20 backdrop-blur-sm border-2 border-dashed border-primary m-4 rounded-xl flex items-center justify-center pointer-events-none"
            >
              <div className="bg-background px-6 py-3 rounded-full shadow-lg flex items-center gap-2 text-primary font-medium">
                <Upload className="w-5 h-5" /> Drop files to upload
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </PageLayout>
  );
}
