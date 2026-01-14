'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { PageLayout } from '@/design-system/patterns/PageLayout/PageLayout';
import { useDevice } from '@/context/device-context';
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
import { cn } from '@/lib/utils';
import { TerminalSpinner, TerminalProgressBar } from '@/components/ui/TerminalUI';

const SHORTCUTS = [
  { label: 'SDCARD', path: '/sdcard' },
  { label: 'DOWNLOAD', path: '/sdcard/Download' },
  { label: 'DCIM', path: '/sdcard/DCIM' },
  { label: 'TMP', path: '/data/local/tmp' },
];

function formatSize(bytes: number): string {
  if (bytes === 0) return '0B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)}${units[i]}`;
}

export default function FilesPage() {
  const { connectionState } = useDevice();
  const [currentPath, setCurrentPath] = useState('/sdcard');
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [transferProgress, setTransferProgress] = useState<{ type: 'upload' | 'download'; progress: number; name: string } | null>(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDirectory = useCallback(async (path: string) => {
    if (connectionState !== 'connected') return;
    setLoading(true);
    try {
      const files = await listDirectory(path);
      const sorted = files.sort((a, b) => {
        if (a.isDirectory === b.isDirectory) return a.name.localeCompare(b.name);
        return a.isDirectory ? -1 : 1;
      });
      setEntries(sorted);
      setCurrentPath(path);
      setSelectedFiles(new Set());
    } catch {
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

  const downloadSelected = async () => {
    for (const path of selectedFiles) {
      const entry = entries.find(e => e.path === path);
      if (entry && !entry.isDirectory) {
        setTransferProgress({ type: 'download', progress: 0, name: entry.name });
        try {
          const data = await pullFileWithProgress(entry.path, (loaded, total) => {
            setTransferProgress({ type: 'download', progress: Math.round((loaded / total) * 100), name: entry.name });
          });
          const url = URL.createObjectURL(new Blob([data as unknown as BlobPart]));
          const a = document.createElement('a'); a.href = url; a.download = entry.name;
          document.body.appendChild(a); a.click(); document.body.removeChild(a);
          URL.revokeObjectURL(url);
        } catch { toast.error(`Failed: ${entry.name}`); }
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
      } catch { toast.error(`Failed delete: ${entry.name}`); }
    }
    loadDirectory(currentPath);
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
      } catch { toast.error(`Failed upload: ${file.name}`); }
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
    } catch { toast.error('Failed to create folder'); }
  };

  if (connectionState !== 'connected') {
    return (
      <PageLayout>
        <div className="h-full flex items-center justify-center p-8 font-mono">
          <div className="text-center">
            <pre className="text-muted-foreground mb-4 text-xs">
{`  ______
 |      |
 | [D]  |
 |______|
   ||`}
            </pre>
            <div className="text-sm mb-2">FILE BROWSER DISCONNECTED</div>
            <div className="text-xs text-muted-foreground">
              Connect a device to browse files.
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  const breadcrumbs = currentPath.split('/').filter(Boolean);

  return (
    <PageLayout>
      <div className="h-full flex flex-col font-mono overflow-hidden">
        {/* Header */}
        <div className="border-b border-border p-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-sm uppercase tracking-wider">FILES // BROWSER</h1>
              <div className="text-xs text-muted-foreground mt-1">
                {entries.length} ITEMS | {selectedFiles.size} SELECTED
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-2 py-1 border border-border hover:bg-muted"
              >
                [ UPLOAD ]
              </button>
              <button
                onClick={() => setShowNewFolder(true)}
                className="px-2 py-1 border border-border hover:bg-muted"
              >
                [ NEW DIR ]
              </button>
              <button
                onClick={() => loadDirectory(currentPath)}
                disabled={loading}
                className="px-2 py-1 border border-border hover:bg-muted disabled:opacity-50"
              >
                [ {loading ? '...' : 'REFRESH'} ]
              </button>
            </div>
          </div>
        </div>

        {/* Breadcrumb & Shortcuts */}
        <div className="border-b border-border p-2 flex-shrink-0 text-xs">
          <div className="flex items-center gap-2 mb-2">
            <button onClick={() => navigateTo('/')} className="text-orange-500 hover:underline">/</button>
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1">
                <span className="text-muted-foreground">/</span>
                <button
                  onClick={() => navigateTo('/' + breadcrumbs.slice(0, i + 1).join('/'))}
                  className={cn("hover:underline", i === breadcrumbs.length - 1 ? "text-foreground" : "text-muted-foreground")}
                >
                  {crumb}
                </button>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">QUICK:</span>
            {SHORTCUTS.map(sc => (
              <button
                key={sc.path}
                onClick={() => navigateTo(sc.path)}
                className="px-2 py-0.5 border border-border hover:bg-muted"
              >
                {sc.label}
              </button>
            ))}
            {currentPath !== '/' && (
              <button onClick={navigateUp} className="px-2 py-0.5 border border-border hover:bg-muted ml-2">
                [ UP ]
              </button>
            )}
          </div>
        </div>

        {/* Selection Actions */}
        {selectedFiles.size > 0 && (
          <div className="border-b border-orange-500 p-2 flex-shrink-0 flex items-center justify-between text-xs bg-orange-500/10">
            <span className="text-orange-500">{selectedFiles.size} SELECTED</span>
            <div className="flex items-center gap-2">
              <button onClick={downloadSelected} className="px-2 py-1 border border-border hover:bg-muted">
                [ DOWNLOAD ]
              </button>
              <button onClick={deleteSelected} className="px-2 py-1 border border-red-500 text-red-500 hover:bg-red-500/10">
                [ DELETE ]
              </button>
              <button onClick={() => setSelectedFiles(new Set())} className="px-2 py-1 border border-border hover:bg-muted">
                [ CLEAR ]
              </button>
            </div>
          </div>
        )}

        {/* View Toggle */}
        <div className="border-b border-border p-2 flex-shrink-0 flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">VIEW:</span>
          <button
            onClick={() => setViewMode('list')}
            className={cn("px-2 py-0.5 border", viewMode === 'list' ? "border-orange-500 text-orange-500" : "border-border text-muted-foreground")}
          >
            LIST
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={cn("px-2 py-0.5 border", viewMode === 'grid' ? "border-orange-500 text-orange-500" : "border-border text-muted-foreground")}
          >
            GRID
          </button>
        </div>

        {/* Transfer Progress */}
        {transferProgress && (
          <div className="border-b border-orange-500 p-3 flex-shrink-0 bg-background">
            <div className="text-xs text-orange-500 mb-2">
              {transferProgress.type === 'upload' ? 'UPLOADING' : 'DOWNLOADING'}: {transferProgress.name}
            </div>
            <TerminalProgressBar value={transferProgress.progress} width={30} />
          </div>
        )}

        {/* File List */}
        <div className="flex-1 overflow-y-auto">
          {loading && entries.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <TerminalSpinner label="LOADING" />
            </div>
          ) : entries.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-xs">
              <pre className="mb-4">{`[EMPTY]`}</pre>
              <p>DIRECTORY IS EMPTY</p>
            </div>
          ) : viewMode === 'list' ? (
            <div className="divide-y divide-border">
              {entries.map(entry => (
                <div
                  key={entry.path}
                  onClick={() => handleEntryClick(entry)}
                  className={cn(
                    "flex items-center gap-3 p-3 hover:bg-muted cursor-pointer text-xs",
                    selectedFiles.has(entry.path) && "bg-muted"
                  )}
                >
                  <span className={entry.isDirectory ? "text-blue-500" : "text-orange-500"}>
                    {entry.isDirectory ? '[D]' : '[F]'}
                  </span>
                  <div className="flex-1 min-w-0 truncate">{entry.name}</div>
                  <div className="text-muted-foreground text-[10px] w-16 text-right">
                    {entry.isDirectory ? '--' : formatSize(entry.size)}
                  </div>
                  <div className="text-muted-foreground text-[10px] w-20 truncate">
                    {entry.permissions}
                  </div>
                  <div
                    onClick={(e) => { e.stopPropagation(); handleToggleSelect(entry); }}
                    className={cn(
                      "w-4 h-4 border flex items-center justify-center cursor-pointer",
                      selectedFiles.has(entry.path) ? "border-orange-500 text-orange-500" : "border-border"
                    )}
                  >
                    {selectedFiles.has(entry.path) && 'X'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 p-3">
              {entries.map(entry => (
                <div
                  key={entry.path}
                  onClick={() => handleEntryClick(entry)}
                  className={cn(
                    "border border-border p-3 hover:bg-muted cursor-pointer text-xs text-center",
                    selectedFiles.has(entry.path) && "border-orange-500 bg-muted"
                  )}
                >
                  <div className={cn("text-lg mb-1", entry.isDirectory ? "text-blue-500" : "text-orange-500")}>
                    {entry.isDirectory ? '[D]' : '[F]'}
                  </div>
                  <div className="truncate text-[10px]">{entry.name}</div>
                  {!entry.isDirectory && (
                    <div className="text-muted-foreground text-[10px] mt-1">{formatSize(entry.size)}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* New Folder Modal */}
        {showNewFolder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="border border-border bg-background p-4 w-80">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3">NEW FOLDER</div>
              <input
                autoFocus
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                placeholder="Folder name..."
                className="w-full bg-transparent border border-border px-2 py-1 mb-3 outline-none focus:border-orange-500 text-xs"
                onKeyDown={e => e.key === 'Enter' && handleCreateDir()}
              />
              <div className="flex justify-end gap-2 text-xs">
                <button onClick={() => setShowNewFolder(false)} className="px-2 py-1 border border-border hover:bg-muted">
                  [ CANCEL ]
                </button>
                <button onClick={handleCreateDir} className="px-2 py-1 border border-orange-500 text-orange-500 hover:bg-orange-500/10">
                  [ CREATE ]
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Hidden File Input */}
        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleUpload} />

        {/* Footer */}
        <div className="border-t border-border p-2 flex-shrink-0 bg-background">
          <div className="text-[10px] text-muted-foreground">
            [D]=DIRECTORY [F]=FILE | CLICK TO SELECT | DOUBLE-CLICK DIR TO ENTER
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
