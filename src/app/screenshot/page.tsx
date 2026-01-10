'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { PageLayout } from '@/design-system/patterns/PageLayout/PageLayout';
import { EmptyState } from '@/components/ui/EmptyState';
import { useDevice } from '@/context/device-context';
import { Button } from '@/design-system/components/Button';
import { captureScreenshot, shellStream, pullFile, deleteFile } from '@/services/adb';
import { cn } from '@/lib/utils';
import {
  Camera,
  Video,
  Square,
  Download,
  Copy,
  Trash2,
  Check,
  Clock,
  Image as ImageIcon,
  Monitor
} from 'lucide-react';

// Recording duration options (in seconds)
const DURATION_OPTIONS = [
  { value: 30, label: '30s' },
  { value: 60, label: '1m' },
  { value: 120, label: '2m' },
  { value: 180, label: '3m' },
];

const MAX_HISTORY = 10;

interface Screenshot {
  id: string;
  data: string; // base64 data URL
  timestamp: Date;
}

export default function ScreenshotPage() {
  const { connectionState } = useDevice();
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
  const recordingPathRef = useRef<string>('/sdcard/superrwrench_recording.mp4');

  // Capture screenshot
  const handleCapture = useCallback(async () => {
    if (connectionState !== 'connected') return;

    setIsCapturing(true);
    setError(null);

    try {
      const pngData = await captureScreenshot();

      // Convert to base64 data URL
      const base64 = btoa(String.fromCharCode(...pngData));
      const dataUrl = `data:image/png;base64,${base64}`;

      const newScreenshot: Screenshot = {
        id: `screenshot-${Date.now()}`,
        data: dataUrl,
        timestamp: new Date(),
      };

      setScreenshots((prev) => {
        const updated = [newScreenshot, ...prev].slice(0, MAX_HISTORY);
        return updated;
      });
      setSelectedScreenshot(newScreenshot);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to capture screenshot');
    } finally {
      setIsCapturing(false);
    }
  }, [connectionState]);

  // Start recording
  const handleStartRecording = useCallback(async () => {
    if (connectionState !== 'connected') return;

    setIsRecording(true);
    setRecordingElapsed(0);
    setError(null);

    try {
      // Start timer
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingElapsed((prev) => {
          if (prev >= recordingDuration - 1) {
            // Auto-stop when duration reached
            handleStopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

      // Start recording
      const { exit } = await shellStream(
        `screenrecord --time-limit ${recordingDuration} ${recordingPathRef.current}`,
        () => {}, // stdout
        () => {}  // stderr
      );
      stopRecordingRef.current = exit;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start recording');
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  }, [connectionState, recordingDuration]);

  // Stop recording and download
  const handleStopRecording = useCallback(async () => {
    // Stop the timer
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    // Stop the recording process
    if (stopRecordingRef.current) {
      stopRecordingRef.current();
      stopRecordingRef.current = null;
    }

    setIsRecording(false);

    // Wait a moment for the file to be finalized
    await new Promise((resolve) => setTimeout(resolve, 1000));

    try {
      // Pull the file
      const videoData = await pullFile(recordingPathRef.current);

      // Create download
      const blob = new Blob([videoData.buffer as ArrayBuffer], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recording-${new Date().toISOString().replace(/[:.]/g, '-')}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Clean up file on device
      await deleteFile(recordingPathRef.current);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download recording');
    }
  }, []);

  // Download screenshot
  const handleDownload = useCallback(() => {
    if (!selectedScreenshot) return;

    const a = document.createElement('a');
    a.href = selectedScreenshot.data;
    a.download = `screenshot-${selectedScreenshot.timestamp.toISOString().replace(/[:.]/g, '-')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [selectedScreenshot]);

  // Copy to clipboard
  const handleCopy = useCallback(async () => {
    if (!selectedScreenshot) return;

    try {
      // Convert data URL to blob
      const response = await fetch(selectedScreenshot.data);
      const blob = await response.blob();

      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: try copying the data URL
      try {
        await navigator.clipboard.writeText(selectedScreenshot.data);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        setError('Failed to copy to clipboard');
      }
    }
  }, [selectedScreenshot]);

  // Delete screenshot
  const handleDelete = useCallback((id: string) => {
    setScreenshots((prev) => prev.filter((s) => s.id !== id));
    if (selectedScreenshot?.id === id) {
      setSelectedScreenshot(null);
    }
  }, [selectedScreenshot]);

  // Format elapsed time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (stopRecordingRef.current) {
        stopRecordingRef.current();
      }
    };
  }, []);

  if (connectionState !== 'connected') {
    return (
      <PageLayout>
        <div className="h-full flex items-center justify-center p-8">
          <EmptyState
            title="No Device Connected"
            description="Connect an Android device via USB to capture screenshots and recordings."
            icon={<Monitor className="w-16 h-16 text-muted-foreground/30" />}
          />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="h-full flex flex-col overflow-hidden bg-background">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-card/30 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Screenshot & Recording</h1>
              <p className="text-xs text-muted-foreground">Capture device screen</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Screenshot button */}
            <Button
              variant="primary"
              size="small"
              icon={<Camera className="w-4 h-4" />}
              onClick={handleCapture}
              disabled={isCapturing || isRecording}
            >
              {isCapturing ? 'Capturing...' : 'Screenshot'}
            </Button>

            {/* Recording controls */}
            {!isRecording ? (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/40 rounded-md border border-border/50">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <select
                    value={recordingDuration}
                    onChange={(e) => setRecordingDuration(Number(e.target.value))}
                    className="bg-transparent text-xs font-medium outline-none cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {DURATION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <Button
                  variant="secondary"
                  size="small"
                  icon={<Video className="w-4 h-4" />}
                  onClick={handleStartRecording}
                  disabled={isCapturing}
                >
                  Record
                </Button>
              </>
            ) : (
              <Button
                variant="warning"
                size="small"
                icon={<Square className="w-3 h-3 fill-current" />}
                onClick={handleStopRecording}
              >
                Stop ({formatTime(recordingElapsed)} / {formatTime(recordingDuration)})
              </Button>
            )}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-destructive/10 border border-destructive/30">
            <p className="text-sm text-destructive font-medium">{error}</p>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Preview area */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-muted/20">
            {selectedScreenshot ? (
              <div className="flex flex-col items-center gap-4 max-h-full">
                <div className="relative group">
                  <img
                    src={selectedScreenshot.data}
                    alt="Screenshot preview"
                    className="max-w-full max-h-[calc(100vh-300px)] object-contain rounded-xl shadow-2xl border border-border/50"
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>
                <div className="flex items-center gap-2 p-2 bg-card/80 backdrop-blur-sm rounded-xl border border-border/50 shadow-lg">
                  <Button
                    variant="secondary"
                    size="small"
                    icon={<Download className="w-4 h-4" />}
                    onClick={handleDownload}
                  >
                    Download
                  </Button>
                  <Button
                    variant="secondary"
                    size="small"
                    icon={copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    onClick={handleCopy}
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="small"
                    icon={<Trash2 className="w-4 h-4" />}
                    onClick={() => handleDelete(selectedScreenshot.id)}
                    className="hover:bg-destructive/10 hover:text-destructive"
                  >
                    Delete
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground font-medium">
                  {selectedScreenshot.timestamp.toLocaleString()}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-8">
                <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center mb-6">
                  <ImageIcon className="w-10 h-10 text-muted-foreground/30" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Ready to Capture</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Click <span className="font-medium text-primary">Screenshot</span> to capture the device screen
                  or <span className="font-medium text-primary">Record</span> to capture video
                </p>
              </div>
            )}
          </div>

          {/* History sidebar */}
          {screenshots.length > 0 && (
            <div className="w-56 border-l border-border/60 bg-card/30 backdrop-blur-sm overflow-y-auto shrink-0 scrollbar-thin scrollbar-thumb-muted-foreground/20">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    History
                  </h3>
                  <span className="text-xs font-mono text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                    {screenshots.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {screenshots.map((screenshot) => (
                    <button
                      key={screenshot.id}
                      onClick={() => setSelectedScreenshot(screenshot)}
                      className={cn(
                        'w-full aspect-video rounded-lg overflow-hidden transition-all duration-200 relative group',
                        selectedScreenshot?.id === screenshot.id
                          ? 'ring-2 ring-primary ring-offset-2 ring-offset-card shadow-lg'
                          : 'border border-border/50 hover:border-primary/50 hover:shadow-md hover:scale-[1.02]'
                      )}
                    >
                      <img
                        src={screenshot.data}
                        alt="Screenshot thumbnail"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(screenshot.id);
                          }}
                          className="p-1.5 bg-destructive/90 hover:bg-destructive rounded-md text-white transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recording indicator */}
        {isRecording && (
          <div className="px-4 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white text-center text-sm flex items-center justify-center gap-3 shadow-lg">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
            <span className="font-medium">Recording in progress</span>
            <span className="font-mono bg-white/20 px-2 py-0.5 rounded-md">
              {formatTime(recordingElapsed)} / {formatTime(recordingDuration)}
            </span>
            <Button
              variant="ghost"
              size="small"
              onClick={handleStopRecording}
              className="ml-2 bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              Stop Recording
            </Button>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
