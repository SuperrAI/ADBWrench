'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { PageLayout } from '@/design-system/patterns/PageLayout/PageLayout';
import { useDevice } from '@/context/device-context';
import { captureScreenshot, shellStream, pullFile, deleteFile } from '@/services/adb';
import { cn } from '@/lib/utils';
import { TerminalSpinner, TerminalProgressBar } from '@/components/ui/TerminalUI';

const DURATION_OPTIONS = [
  { value: 30, label: '30S' },
  { value: 60, label: '1M' },
  { value: 120, label: '2M' },
  { value: 180, label: '3M' },
];

const MAX_HISTORY = 10;

interface Screenshot {
  id: string;
  data: string;
  timestamp: Date;
}

export default function ScreenshotPage() {
  const { connectionState, handleConnectionError } = useDevice();
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [selectedScreenshot, setSelectedScreenshot] = useState<Screenshot | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(180);
  const [recordingElapsed, setRecordingElapsed] = useState(0);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stopRecordingRef = useRef<(() => void) | null>(null);
  const recordingTimerRef = useRef<number | null>(null);
  const recordingPathRef = useRef<string>('/sdcard/adbwrench_recording.mp4');

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

  const handleStartRecording = useCallback(async () => {
    if (connectionState !== 'connected') return;

    setIsRecording(true);
    setRecordingElapsed(0);
    setError(null);

    try {
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingElapsed((prev) => {
          if (prev >= recordingDuration - 1) {
            handleStopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

      const { exit } = await shellStream(
        `screenrecord --time-limit ${recordingDuration} ${recordingPathRef.current}`,
        () => {},
        () => {}
      );
      stopRecordingRef.current = exit;
    } catch (err) {
      if (!handleConnectionError(err)) {
        setError(err instanceof Error ? err.message : 'Failed to start recording');
      }
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  }, [connectionState, recordingDuration, handleConnectionError]);

  const handleStopRecording = useCallback(async () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (stopRecordingRef.current) {
      stopRecordingRef.current();
      stopRecordingRef.current = null;
    }

    setIsRecording(false);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    try {
      const videoData = await pullFile(recordingPathRef.current);
      const blob = new Blob([videoData.buffer as ArrayBuffer], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recording-${new Date().toISOString().replace(/[:.]/g, '-')}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      await deleteFile(recordingPathRef.current);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download recording');
    }
  }, []);

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

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (stopRecordingRef.current) stopRecordingRef.current();
    };
  }, []);

  if (connectionState !== 'connected') {
    return (
      <PageLayout>
        <div className="h-full flex items-center justify-center p-8 font-mono">
          <div className="text-center">
            <div className="text-sm mb-2">SCREENSHOT DISCONNECTED</div>
            <div className="text-xs text-muted-foreground">
              Connect a device to capture screenshots.
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
              <h1 className="text-sm uppercase tracking-wider">SCREENSHOT // CAPTURE</h1>
              <div className="text-xs text-muted-foreground mt-1">
                {screenshots.length} CAPTURES | {isRecording ? 'RECORDING...' : 'READY'}
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={handleCapture}
                disabled={isCapturing || isRecording}
                className="px-2 py-1 border border-green-500 text-green-500 hover:bg-green-500/10 disabled:opacity-50"
              >
                [ {isCapturing ? 'CAPTURING...' : 'SCREENSHOT'} ]
              </button>

              {!isRecording ? (
                <>
                  <div className="flex border border-border">
                    {DURATION_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setRecordingDuration(opt.value)}
                        className={cn(
                          'px-2 py-1 text-xs transition-colors',
                          recordingDuration === opt.value
                            ? 'bg-foreground text-background'
                            : 'hover:bg-muted',
                          opt.value !== DURATION_OPTIONS[0].value && 'border-l border-border'
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleStartRecording}
                    disabled={isCapturing}
                    className="px-2 py-1 border border-orange-500 text-orange-500 hover:bg-orange-500/10 disabled:opacity-50"
                  >
                    [ RECORD ]
                  </button>
                </>
              ) : (
                <button
                  onClick={handleStopRecording}
                  className="px-2 py-1 border border-red-500 text-red-500 hover:bg-red-500/10"
                >
                  [ STOP {formatTime(recordingElapsed)}/{formatTime(recordingDuration)} ]
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="border-b border-red-500 p-2 text-red-500 text-xs">
            [!] ERROR: {error}
          </div>
        )}

        {/* Recording Progress */}
        {isRecording && (
          <div className="border-b border-red-500 p-3 flex-shrink-0 bg-red-500/10">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-red-500">● RECORDING IN PROGRESS</span>
              <span>{formatTime(recordingElapsed)} / {formatTime(recordingDuration)}</span>
            </div>
            <TerminalProgressBar
              value={Math.round((recordingElapsed / recordingDuration) * 100)}
              width={40}
              showPercentage={false}
            />
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
                <p className="text-muted-foreground mt-2">CLICK SCREENSHOT TO CAPTURE</p>
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

        {/* Footer */}
        <div className="border-t border-border px-3 flex-shrink-0 bg-background flex items-center min-h-[36px]">
          <span className="text-[10px] text-muted-foreground">
            SCREENSHOT: INSTANT CAPTURE | RECORD: VIDEO UP TO 3MIN
          </span>
        </div>
      </div>
    </PageLayout>
  );
}
