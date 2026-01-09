'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { PageLayout } from '@/design-system/patterns/PageLayout/PageLayout';
import { EmptyState } from '@/components/ui/EmptyState';
import { useDevice } from '@/context/device-context';
import { Button } from '@/design-system/components/Button';
import { captureScreenshot, shellStream, pullFile, deleteFile } from '@/services/adb';
import { textStyles } from '@/design-system/foundations/typography';
import { cn } from '@/lib/utils';

// Icons
const CameraIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="4" width="14" height="10" rx="1" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="8" cy="9" r="3" stroke="currentColor" strokeWidth="1.5" />
    <path d="M5 4V3C5 2.44772 5.44772 2 6 2H10C10.5523 2 11 2.44772 11 3V4" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const VideoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="3" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1.5" />
    <path d="M11 6L15 4V12L11 10" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
);

const StopIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="10" height="10" rx="1" fill="currentColor" />
  </svg>
);

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 2V10M8 10L5 7M8 10L11 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2 12V13C2 13.5523 2.44772 14 3 14H13C13.5523 14 14 13.5523 14 13V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const CopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="5" y="5" width="9" height="9" rx="1" stroke="currentColor" strokeWidth="1.5" />
    <path d="M11 5V3C11 2.44772 10.5523 2 10 2H3C2.44772 2 2 2.44772 2 3V10C2 10.5523 2.44772 11 3 11H5" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 4H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M5 4V3C5 2.44772 5.44772 2 6 2H10C10.5523 2 11 2.44772 11 3V4" stroke="currentColor" strokeWidth="1.5" />
    <path d="M3 4L4 13C4 13.5523 4.44772 14 5 14H11C11.5523 14 12 13.5523 12 13L13 4" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.3334 4L6.00002 11.3333L2.66669 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

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
      const blob = new Blob([videoData], { type: 'video/mp4' });
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
          <h1 style={{ ...textStyles.h4 }} className="text-foreground">
            Screenshot & Recording
          </h1>
          <div className="flex items-center gap-3">
            {/* Screenshot button */}
            <Button
              variant="primary"
              size="small"
              icon={<CameraIcon />}
              onClick={handleCapture}
              disabled={isCapturing || isRecording}
            >
              {isCapturing ? 'Capturing...' : 'Screenshot'}
            </Button>

            {/* Recording controls */}
            {!isRecording ? (
              <>
                <select
                  value={recordingDuration}
                  onChange={(e) => setRecordingDuration(Number(e.target.value))}
                  className="text-sm bg-background border border-border rounded px-2 py-1 text-foreground"
                >
                  {DURATION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <Button
                  variant="secondary"
                  size="small"
                  icon={<VideoIcon />}
                  onClick={handleStartRecording}
                  disabled={isCapturing}
                >
                  Record
                </Button>
              </>
            ) : (
              <Button
                variant="primary"
                size="small"
                icon={<StopIcon />}
                onClick={handleStopRecording}
              >
                Stop ({formatTime(recordingElapsed)} / {formatTime(recordingDuration)})
              </Button>
            )}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Preview area */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-neutral-100 dark:bg-neutral-900">
            {selectedScreenshot ? (
              <div className="flex flex-col items-center gap-4 max-h-full">
                <img
                  src={selectedScreenshot.data}
                  alt="Screenshot preview"
                  className="max-w-full max-h-[calc(100vh-300px)] object-contain rounded-lg shadow-lg"
                />
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="small"
                    icon={<DownloadIcon />}
                    onClick={handleDownload}
                  >
                    Download
                  </Button>
                  <Button
                    variant="secondary"
                    size="small"
                    icon={copied ? <CheckIcon /> : <CopyIcon />}
                    onClick={handleCopy}
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="small"
                    icon={<TrashIcon />}
                    onClick={() => handleDelete(selectedScreenshot.id)}
                  >
                    Delete
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedScreenshot.timestamp.toLocaleString()}
                </p>
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                <CameraIcon />
                <p className="mt-2">Click "Screenshot" to capture the device screen</p>
                <p className="text-xs mt-1">or "Record" to capture a video</p>
              </div>
            )}
          </div>

          {/* History sidebar */}
          {screenshots.length > 0 && (
            <div className="w-48 border-l border-border bg-background overflow-y-auto shrink-0">
              <div className="p-3">
                <h3 className="text-xs font-medium text-muted-foreground mb-2">
                  History ({screenshots.length})
                </h3>
                <div className="space-y-2">
                  {screenshots.map((screenshot) => (
                    <button
                      key={screenshot.id}
                      onClick={() => setSelectedScreenshot(screenshot)}
                      className={cn(
                        'w-full aspect-video rounded overflow-hidden border-2 transition-colors',
                        selectedScreenshot?.id === screenshot.id
                          ? 'border-primary'
                          : 'border-transparent hover:border-border'
                      )}
                    >
                      <img
                        src={screenshot.data}
                        alt="Screenshot thumbnail"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recording indicator */}
        {isRecording && (
          <div className="px-4 py-2 bg-red-500 text-white text-center text-sm flex items-center justify-center gap-2">
            <span className="animate-pulse">●</span>
            Recording... {formatTime(recordingElapsed)} / {formatTime(recordingDuration)}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
