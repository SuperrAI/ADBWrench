'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import PageLayout from '@/design-system/patterns/PageLayout/PageLayout';
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

// Common location shortcuts
const SHORTCUTS = [
  { label: 'SD Card', path: '/sdcard' },
  { label: 'Download', path: '/sdcard/Download' },
  { label: 'DCIM', path: '/sdcard/DCIM' },
  { label: 'Temp', path: '/data/local/tmp' },
];

// Format file size
function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

export default function FilesPage() {
  const { connectionState } = useDevice();
  const isConnected = connectionState === 'connected';

  const [currentPath, setCurrentPath] = useState('/sdcard');
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [transferProgress, setTransferProgress] = useState<{ type: 'upload' | 'download'; progress: number; name: string } | null>(null);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<FileEntry | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load directory contents
  const loadDirectory = useCallback(async (path: string) => {
    if (!isConnected) return;

    setLoading(true);
    setError(null);
    setSelectedFiles(new Set());

    try {
      const files = await listDirectory(path);
      setEntries(files);
      setCurrentPath(path);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load directory';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [isConnected]);

  // Load initial directory
  useEffect(() => {
    if (isConnected) {
      loadDirectory(currentPath);
    }
  }, [isConnected]);

  // Navigate to a path
  const navigateTo = (path: string) => {
    loadDirectory(path);
  };

  // Navigate up one level
  const navigateUp = () => {
    const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/';
    navigateTo(parentPath);
  };

  // Handle file/folder click
  const handleEntryClick = (entry: FileEntry) => {
    if (entry.isDirectory) {
      navigateTo(entry.path);
    }
  };

  // Toggle file selection
  const toggleSelection = (entry: FileEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSelection = new Set(selectedFiles);
    if (newSelection.has(entry.path)) {
      newSelection.delete(entry.path);
    } else {
      newSelection.add(entry.path);
    }
    setSelectedFiles(newSelection);
  };

  // Select all files
  const selectAll = () => {
    const filePaths = entries.filter(e => !e.isDirectory).map(e => e.path);
    setSelectedFiles(new Set(filePaths));
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedFiles(new Set());
  };

  // Download a single file
  const downloadFile = async (entry: FileEntry) => {
    try {
      setTransferProgress({ type: 'download', progress: 0, name: entry.name });

      const data = await pullFileWithProgress(entry.path, (downloaded, total) => {
        const progress = Math.round((downloaded / total) * 100);
        setTransferProgress({ type: 'download', progress, name: entry.name });
      });

      // Create download
      const blob = new Blob([data]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = entry.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Downloaded ${entry.name}`);
    } catch (err) {
      toast.error(`Failed to download: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setTransferProgress(null);
    }
  };

  // Download selected files
  const downloadSelected = async () => {
    for (const path of selectedFiles) {
      const entry = entries.find(e => e.path === path);
      if (entry && !entry.isDirectory) {
        await downloadFile(entry);
      }
    }
    clearSelection();
  };

  // Upload files
  const uploadFiles = async (files: FileList) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        setTransferProgress({ type: 'upload', progress: 0, name: file.name });

        const buffer = await file.arrayBuffer();
        const data = new Uint8Array(buffer);
        const remotePath = `${currentPath}/${file.name}`;

        await pushFile(remotePath, data, (progress) => {
          setTransferProgress({ type: 'upload', progress, name: file.name });
        });

        toast.success(`Uploaded ${file.name}`);
      } catch (err) {
        toast.error(`Failed to upload ${file.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    setTransferProgress(null);
    loadDirectory(currentPath);
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(e.target.files);
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files);
    }
  };

  // Create new folder
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const newPath = `${currentPath}/${newFolderName.trim()}`;
      await createDirectory(newPath);
      toast.success(`Created folder: ${newFolderName}`);
      setShowNewFolderDialog(false);
      setNewFolderName('');
      loadDirectory(currentPath);
    } catch (err) {
      toast.error(`Failed to create folder: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Delete file/folder
  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      if (deleteTarget.isDirectory) {
        await deleteDirectory(deleteTarget.path);
      } else {
        await deleteFile(deleteTarget.path);
      }
      toast.success(`Deleted ${deleteTarget.name}`);
      setDeleteTarget(null);
      loadDirectory(currentPath);
    } catch (err) {
      toast.error(`Failed to delete: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Parse breadcrumbs
  const breadcrumbs = currentPath.split('/').filter(Boolean);

  if (!isConnected) {
    return (
      <PageLayout>
        <div className="h-full flex items-center justify-center p-6">
          <EmptyState
            title="No Device Connected"
            description="Connect an Android device to browse files."
          />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div
        className={`h-full flex flex-col p-4 ${dragOver ? 'bg-blue-500/10' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">File Browser</h1>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="small"
              onClick={() => fileInputRef.current?.click()}
            >
              Upload
            </Button>
            <Button
              variant="secondary"
              size="small"
              onClick={() => setShowNewFolderDialog(true)}
            >
              New Folder
            </Button>
            <Button
              variant="secondary"
              size="small"
              onClick={() => loadDirectory(currentPath)}
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Shortcuts */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {SHORTCUTS.map((shortcut) => (
            <button
              key={shortcut.path}
              onClick={() => navigateTo(shortcut.path)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                currentPath === shortcut.path
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {shortcut.label}
            </button>
          ))}
        </div>

        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-1 mb-4 text-sm bg-gray-800 rounded-md p-2 overflow-x-auto">
          <button
            onClick={() => navigateTo('/')}
            className="text-blue-400 hover:text-blue-300 flex-shrink-0"
          >
            /
          </button>
          {breadcrumbs.map((crumb, index) => {
            const path = '/' + breadcrumbs.slice(0, index + 1).join('/');
            return (
              <span key={path} className="flex items-center flex-shrink-0">
                <span className="text-gray-500 mx-1">/</span>
                <button
                  onClick={() => navigateTo(path)}
                  className={`hover:text-blue-300 ${
                    index === breadcrumbs.length - 1 ? 'text-white' : 'text-blue-400'
                  }`}
                >
                  {crumb}
                </button>
              </span>
            );
          })}
        </div>

        {/* Selection toolbar */}
        {selectedFiles.size > 0 && (
          <div className="flex items-center gap-4 mb-4 p-2 bg-blue-900/30 rounded-md">
            <span className="text-sm text-gray-300">{selectedFiles.size} selected</span>
            <Button variant="secondary" size="small" onClick={downloadSelected}>
              Download Selected
            </Button>
            <Button variant="secondary" size="small" onClick={clearSelection}>
              Clear Selection
            </Button>
            <Button variant="secondary" size="small" onClick={selectAll}>
              Select All Files
            </Button>
          </div>
        )}

        {/* Transfer Progress */}
        {transferProgress && (
          <div className="mb-4 p-3 bg-gray-800 rounded-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">
                {transferProgress.type === 'upload' ? 'Uploading' : 'Downloading'}: {transferProgress.name}
              </span>
              <span className="text-sm text-gray-400">{transferProgress.progress}%</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${transferProgress.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* File List */}
        <div className="flex-1 overflow-auto bg-gray-900 rounded-md">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-gray-400">
              Loading...
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-32 text-red-400">
              <p>{error}</p>
              <Button variant="secondary" size="small" className="mt-2" onClick={navigateUp}>
                Go Back
              </Button>
            </div>
          ) : entries.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-400">
              Empty directory
            </div>
          ) : (
            <table className="w-full">
              <thead className="sticky top-0 bg-gray-800">
                <tr className="text-left text-sm text-gray-400">
                  <th className="p-2 w-8"></th>
                  <th className="p-2">Name</th>
                  <th className="p-2 w-24 text-right">Size</th>
                  <th className="p-2 w-28">Permissions</th>
                  <th className="p-2 w-40">Modified</th>
                  <th className="p-2 w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* Parent directory row */}
                {currentPath !== '/' && (
                  <tr
                    className="border-t border-gray-800 hover:bg-gray-800 cursor-pointer"
                    onClick={navigateUp}
                  >
                    <td className="p-2"></td>
                    <td className="p-2">
                      <span className="flex items-center gap-2">
                        <span className="text-blue-400">📁</span>
                        <span className="text-gray-400">..</span>
                      </span>
                    </td>
                    <td className="p-2"></td>
                    <td className="p-2"></td>
                    <td className="p-2"></td>
                    <td className="p-2"></td>
                  </tr>
                )}
                {entries.map((entry) => (
                  <tr
                    key={entry.path}
                    className={`border-t border-gray-800 hover:bg-gray-800 ${
                      entry.isDirectory ? 'cursor-pointer' : ''
                    } ${selectedFiles.has(entry.path) ? 'bg-blue-900/30' : ''}`}
                    onClick={() => handleEntryClick(entry)}
                  >
                    <td className="p-2">
                      {!entry.isDirectory && (
                        <input
                          type="checkbox"
                          checked={selectedFiles.has(entry.path)}
                          onChange={() => {}}
                          onClick={(e) => toggleSelection(entry, e)}
                          className="rounded"
                        />
                      )}
                    </td>
                    <td className="p-2">
                      <span className="flex items-center gap-2">
                        <span className={entry.isDirectory ? 'text-blue-400' : 'text-gray-400'}>
                          {entry.isDirectory ? '📁' : entry.isSymlink ? '🔗' : '📄'}
                        </span>
                        <span className={entry.isDirectory ? 'text-blue-400' : ''}>
                          {entry.name}
                          {entry.isSymlink && entry.linkTarget && (
                            <span className="text-gray-500 text-sm ml-2">→ {entry.linkTarget}</span>
                          )}
                        </span>
                      </span>
                    </td>
                    <td className="p-2 text-right text-sm text-gray-400">
                      {entry.isDirectory ? '-' : formatSize(entry.size)}
                    </td>
                    <td className="p-2 text-sm font-mono text-gray-500">
                      {entry.permissions}
                    </td>
                    <td className="p-2 text-sm text-gray-400">
                      {entry.modifiedDate}
                    </td>
                    <td className="p-2">
                      <div className="flex gap-1">
                        {!entry.isDirectory && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadFile(entry);
                            }}
                            className="p-1 text-sm text-blue-400 hover:text-blue-300"
                            title="Download"
                          >
                            ⬇️
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(entry);
                          }}
                          className="p-1 text-sm text-red-400 hover:text-red-300"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Drag and drop overlay */}
        {dragOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-blue-500/20 border-2 border-dashed border-blue-500 rounded-lg pointer-events-none">
            <div className="text-xl text-blue-400">Drop files to upload</div>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileInputChange}
        />

        {/* New Folder Dialog */}
        {showNewFolderDialog && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-96">
              <h2 className="text-lg font-semibold mb-4">New Folder</h2>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name"
                className="w-full p-2 bg-gray-700 rounded-md mb-4"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateFolder();
                  if (e.key === 'Escape') {
                    setShowNewFolderDialog(false);
                    setNewFolderName('');
                  }
                }}
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowNewFolderDialog(false);
                    setNewFolderName('');
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
                  Create
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {deleteTarget && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-96">
              <h2 className="text-lg font-semibold mb-4">Confirm Delete</h2>
              <p className="text-gray-300 mb-4">
                Are you sure you want to delete{' '}
                <span className="font-medium text-white">{deleteTarget.name}</span>?
                {deleteTarget.isDirectory && (
                  <span className="block text-yellow-400 text-sm mt-2">
                    This will delete all contents inside the folder.
                  </span>
                )}
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
                  Cancel
                </Button>
                <Button variant="warning" onClick={handleDelete}>
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
