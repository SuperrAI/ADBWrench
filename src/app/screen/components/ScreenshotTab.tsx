'use client';

import { useState, useCallback } from 'react';
import { captureScreenshot } from '@/services/adb';
import { useDevice } from '@/context/device-context';
import { cn } from '@/lib/utils';

const MAX_HISTORY = 10;

interface Screenshot {
  id: string;
  data: string;
  timestamp: Date;
}

export function ScreenshotTab() {
  const { connectionState, handleConnectionError } = useDevice();
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [selectedScreenshot, setSelectedScreenshot] = useState<Screenshot | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCapture = useCallback(async () => {
    if (connectionState !== 'connected') return;

    setIsCapturing(true);
    setError(null);

    try {
      const pngData = await captureScreenshot();
      // Convert Uint8Array to base64 in chunks to avoid stack overflow
      const chunkSize = 8192;
      let binary = '';
      for (let i = 0; i < pngData.length; i += chunkSize) {
        const chunk = pngData.subarray(i, i + chunkSize);
        binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
      }
      const base64 = btoa(binary);
      const dataUrl = `data:image/png;base64,${base64}`;

      const newScreenshot: Screenshot = {
        id: `screenshot-${Date.now()}`,
        data: dataUrl,
        timestamp: new Date(),
      };

      setScreenshots((prev) => [newScreenshot, ...prev].slice(0, MAX_HISTORY));
      setSelectedScreenshot(newScreenshot);
    } catch (err) {
      if (!handleConnectionError(err)) {
        setError(err instanceof Error ? err.message : 'Failed to capture screenshot');
      }
    } finally {
      setIsCapturing(false);
    }
  }, [connectionState, handleConnectionError]);

  const handleDownload = useCallback(() => {
    if (!selectedScreenshot) return;
    const a = document.createElement('a');
    a.href = selectedScreenshot.data;
    a.download = `screenshot-${selectedScreenshot.timestamp.toISOString().replace(/[:.]/g, '-')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [selectedScreenshot]);

  const handleCopy = useCallback(async () => {
    if (!selectedScreenshot) return;
    try {
      const response = await fetch(selectedScreenshot.data);
      const blob = await response.blob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Failed to copy to clipboard');
    }
  }, [selectedScreenshot]);

  const handleDelete = useCallback((id: string) => {
    setScreenshots((prev) => prev.filter((s) => s.id !== id));
    if (selectedScreenshot?.id === id) setSelectedScreenshot(null);
  }, [selectedScreenshot]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Controls Bar */}
      <div className="border-b border-border p-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {screenshots.length} CAPTURES | READY
          </div>
          <button
            onClick={handleCapture}
            disabled={isCapturing}
            className="px-2 py-1 border border-green-500 text-green-500 hover:bg-green-500/10 disabled:opacity-50 text-xs"
          >
            [ {isCapturing ? 'CAPTURING...' : 'CAPTURE'} ]
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="border-b border-red-500 p-2 text-red-500 text-xs">
          [!] ERROR: {error}
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Preview Area */}
        <div className={cn(
          "flex-1 flex flex-col items-center justify-center p-6 bg-background",
          screenshots.length > 0 && "border-r border-border"
        )}>
          {selectedScreenshot ? (
            <div className="flex flex-col items-center gap-4 max-h-full">
              {/* eslint-disable-next-line @next/next/no-img-element -- using base64 data URL */}
              <img
                src={selectedScreenshot.data}
                alt="Screenshot preview"
                className="max-w-full max-h-[calc(100vh-300px)] object-contain border border-border"
              />
              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={handleDownload}
                  className="px-2 py-1 border border-border hover:bg-muted"
                >
                  [ DOWNLOAD ]
                </button>
                <button
                  onClick={handleCopy}
                  className="px-2 py-1 border border-border hover:bg-muted"
                >
                  [ {copied ? 'COPIED!' : 'COPY'} ]
                </button>
                <button
                  onClick={() => handleDelete(selectedScreenshot.id)}
                  className="px-2 py-1 border border-red-500 text-red-500 hover:bg-red-500/10"
                >
                  [ DELETE ]
                </button>
              </div>
              <div className="text-[10px] text-muted-foreground">
                {selectedScreenshot.timestamp.toLocaleString()}
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground text-xs text-center">
              <pre className="mb-4">{`>_`}</pre>
              <p>NO SCREENSHOT SELECTED</p>
              <p className="text-muted-foreground mt-2">CLICK CAPTURE TO TAKE A SCREENSHOT</p>
            </div>
          )}
        </div>

        {/* History Sidebar */}
        {screenshots.length > 0 && (
          <div className="w-48 border-l border-border flex-shrink-0 overflow-y-auto bg-background">
            <div className="p-3 border-b border-border">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                HISTORY ({screenshots.length})
              </div>
            </div>
            <div className="p-2 space-y-2">
              {screenshots.map((screenshot) => (
                <button
                  key={screenshot.id}
                  onClick={() => setSelectedScreenshot(screenshot)}
                  className={cn(
                    "w-full border overflow-hidden relative group",
                    selectedScreenshot?.id === screenshot.id
                      ? "border-orange-500"
                      : "border-border hover:border-muted-foreground"
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- using base64 data URL */}
                  <img
                    src={screenshot.data}
                    alt="Screenshot thumbnail"
                    className="w-full h-auto"
                  />
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(screenshot.id); }}
                    className="absolute top-1 right-1 bg-red-500 text-white text-[10px] px-1 opacity-0 group-hover:opacity-100"
                  >
                    X
                  </button>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
