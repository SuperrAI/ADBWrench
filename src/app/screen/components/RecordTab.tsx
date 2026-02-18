'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { shellStream, pullFile, deleteFile } from '@/services/adb';
import { useDevice } from '@/context/device-context';
import { cn } from '@/lib/utils';
import { TerminalProgressBar } from '@/components/ui/TerminalUI';

const DURATION_OPTIONS = [
  { value: 30, label: '30S' },
  { value: 60, label: '1M' },
  { value: 120, label: '2M' },
  { value: 180, label: '3M' },
];

// TODO: Upgrade to scrcpy-based recording for unlimited duration in a future iteration.
// The current implementation uses Android's built-in `screenrecord` shell command,
// which is limited to a maximum of 3 minutes per recording. Scrcpy would allow
// unlimited recording duration and better codec control.

export function RecordTab() {
  const { connectionState, handleConnectionError } = useDevice();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(180);
  const [recordingElapsed, setRecordingElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const stopRecordingRef = useRef<(() => void) | null>(null);
  const recordingTimerRef = useRef<number | null>(null);
  const recordingPathRef = useRef<string>('/sdcard/adbwrench_recording.mp4');

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
  }, [connectionState, recordingDuration, handleConnectionError, handleStopRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (stopRecordingRef.current) stopRecordingRef.current();
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Controls Bar */}
      <div className="border-b border-border p-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {isRecording ? 'RECORDING...' : 'READY'} | MAX {formatTime(recordingDuration)}
          </div>
          <div className="flex items-center gap-2 text-xs">
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
                  className="px-2 py-1 border border-red-500 text-red-500 hover:bg-red-500/10"
                >
                  [ RECORD ]
                </button>
              </>
            ) : (
              <button
                onClick={handleStopRecording}
                className="px-2 py-1 border border-red-500 text-red-500 hover:bg-red-500/10 animate-pulse"
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

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        {isRecording ? (
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-4 animate-pulse">●</div>
            <div className="text-sm mb-2">RECORDING SCREEN</div>
            <div className="text-xs text-muted-foreground mb-4">
              {formatTime(recordingElapsed)} / {formatTime(recordingDuration)}
            </div>
            <div className="text-[10px] text-muted-foreground">
              VIDEO WILL DOWNLOAD AUTOMATICALLY WHEN COMPLETE
            </div>
          </div>
        ) : (
          <div className="text-muted-foreground text-xs text-center">
            <pre className="mb-4 text-2xl">{'[REC]'}</pre>
            <p>NO RECORDING IN PROGRESS</p>
            <p className="text-muted-foreground mt-2">SELECT DURATION AND CLICK RECORD TO START</p>
            <div className="mt-6 text-[10px] text-muted-foreground/60 max-w-sm">
              RECORDINGS USE ANDROID SCREENRECORD (MAX 3 MIN).
              VIDEO IS SAVED TO DEVICE AND AUTO-DOWNLOADED WHEN COMPLETE.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
