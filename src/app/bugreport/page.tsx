'use client';

import { useState, useRef, useCallback } from 'react';
import PageLayout from '@/design-system/patterns/PageLayout/PageLayout';
import { useDevice } from '@/context/device-context';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/design-system/components/Button';
import { shell, shellStream, pullFile } from '@/services/adb';
import { toast } from 'sonner';

interface BugreportEntry {
  id: string;
  filename: string;
  status: 'generating' | 'completed' | 'failed' | 'cancelled';
  startTime: number;
  endTime?: number;
  progress: number;
  path?: string;
  error?: string;
}

// Estimated time for bugreport generation (typically 2-5 minutes)
const ESTIMATED_DURATION_MS = 180000; // 3 minutes

export default function BugreportPage() {
  const { connectionState } = useDevice();
  const isConnected = connectionState === 'connected';

  const [currentReport, setCurrentReport] = useState<BugreportEntry | null>(null);
  const [history, setHistory] = useState<BugreportEntry[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const abortRef = useRef<{ exit: () => void } | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Start bugreport generation
  const startBugreport = useCallback(async () => {
    if (isGenerating) return;

    const id = `bugreport-${Date.now()}`;
    const startTime = Date.now();

    const newReport: BugreportEntry = {
      id,
      filename: `bugreport-${new Date().toISOString().replace(/[:.]/g, '-')}.zip`,
      status: 'generating',
      startTime,
      progress: 0,
    };

    setCurrentReport(newReport);
    setIsGenerating(true);

    // Start progress estimation
    progressIntervalRef.current = setInterval(() => {
      setCurrentReport((prev) => {
        if (!prev || prev.status !== 'generating') return prev;
        const elapsed = Date.now() - prev.startTime;
        const estimatedProgress = Math.min(95, Math.round((elapsed / ESTIMATED_DURATION_MS) * 100));
        return { ...prev, progress: estimatedProgress };
      });
    }, 1000);

    try {
      // Try bugreportz first (creates ZIP directly), fall back to bugreport
      let output = '';
      let bugreportPath = '';

      // Use bugreportz which outputs path to the generated file
      const stream = await shellStream(
        'bugreportz',
        (data) => {
          output += data;
          // Parse progress from bugreportz output
          const progressMatch = data.match(/(\d+)\/(\d+)/);
          if (progressMatch) {
            const current = parseInt(progressMatch[1], 10);
            const total = parseInt(progressMatch[2], 10);
            if (total > 0) {
              setCurrentReport((prev) =>
                prev ? { ...prev, progress: Math.round((current / total) * 100) } : prev
              );
            }
          }
        },
        (error) => {
          output += error;
        }
      );

      abortRef.current = stream;

      // Wait for completion by checking output
      await new Promise<void>((resolve, reject) => {
        const checkInterval = setInterval(async () => {
          // Check if bugreportz completed
          if (output.includes('OK:')) {
            clearInterval(checkInterval);
            const pathMatch = output.match(/OK:\s*(.+\.zip)/);
            if (pathMatch) {
              bugreportPath = pathMatch[1].trim();
            }
            resolve();
          } else if (output.includes('FAIL:') || output.includes('error')) {
            clearInterval(checkInterval);
            reject(new Error('Bugreport generation failed'));
          }
        }, 1000);

        // Timeout after 10 minutes
        setTimeout(() => {
          clearInterval(checkInterval);
          if (!bugreportPath) {
            reject(new Error('Bugreport generation timed out'));
          }
        }, 600000);
      });

      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }

      // Update report with success
      const completedReport: BugreportEntry = {
        ...newReport,
        status: 'completed',
        progress: 100,
        endTime: Date.now(),
        path: bugreportPath,
      };

      setCurrentReport(completedReport);
      setHistory((prev) => [completedReport, ...prev]);
      toast.success('Bugreport generated successfully');
    } catch (error) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }

      const failedReport: BugreportEntry = {
        ...newReport,
        status: 'failed',
        endTime: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      setCurrentReport(failedReport);
      setHistory((prev) => [failedReport, ...prev]);
      toast.error(`Bugreport failed: ${failedReport.error}`);
    } finally {
      setIsGenerating(false);
      abortRef.current = null;
    }
  }, [isGenerating]);

  // Cancel bugreport generation
  const cancelBugreport = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.exit();
    }

    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    setCurrentReport((prev) => {
      if (prev) {
        const cancelled: BugreportEntry = {
          ...prev,
          status: 'cancelled',
          endTime: Date.now(),
        };
        setHistory((h) => [cancelled, ...h]);
        return cancelled;
      }
      return null;
    });

    setIsGenerating(false);
    toast.info('Bugreport cancelled');
  }, []);

  // Download bugreport
  const downloadBugreport = useCallback(async (report: BugreportEntry) => {
    if (!report.path) {
      toast.error('No bugreport file path available');
      return;
    }

    try {
      toast.info('Downloading bugreport...');
      const data = await pullFile(report.path);

      const blob = new Blob([data], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = report.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Bugreport downloaded');
    } catch (error) {
      toast.error(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, []);

  // Format duration
  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Get estimated time remaining
  const getEstimatedRemaining = (report: BugreportEntry): string => {
    if (report.status !== 'generating') return '-';
    const elapsed = Date.now() - report.startTime;
    const remaining = Math.max(0, ESTIMATED_DURATION_MS - elapsed);
    return `~${formatDuration(remaining)}`;
  };

  // Format timestamp
  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString();
  };

  if (!isConnected) {
    return (
      <PageLayout>
        <div className="h-full flex items-center justify-center p-6">
          <EmptyState
            title="No Device Connected"
            description="Connect an Android device to generate bugreports."
          />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="h-full flex flex-col p-4 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Bugreport Generator</h1>
            <p className="text-gray-400 text-sm mt-1">
              Generate Android bugreports for debugging and diagnostics
            </p>
          </div>
          <Button
            variant={isGenerating ? 'warning' : 'primary'}
            onClick={isGenerating ? cancelBugreport : startBugreport}
          >
            {isGenerating ? 'Cancel' : 'Generate Bugreport'}
          </Button>
        </div>

        {/* Info Box */}
        <div className="bg-blue-900/20 border border-blue-800 rounded-md p-4 mb-6">
          <h3 className="text-blue-400 font-medium mb-2">About Bugreports</h3>
          <p className="text-gray-300 text-sm">
            Bugreports contain comprehensive system logs, device state, and diagnostic information.
            Generation typically takes 2-5 minutes. The resulting ZIP file can be analyzed using
            Android Studio or shared with developers for debugging.
          </p>
        </div>

        {/* Current Report Progress */}
        {currentReport && currentReport.status === 'generating' && (
          <div className="bg-gray-800 rounded-md p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Generating Bugreport</h3>
                <p className="text-gray-400 text-sm">
                  Started at {formatTime(currentReport.startTime)}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-mono">{currentReport.progress}%</div>
                <div className="text-gray-400 text-sm">
                  Est. remaining: {getEstimatedRemaining(currentReport)}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-500"
                style={{ width: `${currentReport.progress}%` }}
              />
            </div>

            <p className="text-gray-400 text-sm mt-4 text-center">
              Please wait... This may take several minutes.
            </p>
          </div>
        )}

        {/* History */}
        <div className="flex-1">
          <h2 className="text-lg font-semibold mb-4">Report History</h2>

          {history.length === 0 ? (
            <div className="bg-gray-800 rounded-md p-8 text-center text-gray-400">
              <p>No bugreports generated yet this session.</p>
              <p className="text-sm mt-2">Click &quot;Generate Bugreport&quot; to create one.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((report) => (
                <div
                  key={report.id}
                  className="bg-gray-800 rounded-md p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    {/* Status Icon */}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        report.status === 'completed'
                          ? 'bg-green-900/50 text-green-400'
                          : report.status === 'failed'
                          ? 'bg-red-900/50 text-red-400'
                          : 'bg-yellow-900/50 text-yellow-400'
                      }`}
                    >
                      {report.status === 'completed' ? '✓' : report.status === 'failed' ? '✕' : '○'}
                    </div>

                    <div>
                      <div className="font-medium">{report.filename}</div>
                      <div className="text-sm text-gray-400">
                        {formatTime(report.startTime)}
                        {report.endTime && ` • Duration: ${formatDuration(report.endTime - report.startTime)}`}
                      </div>
                      {report.error && (
                        <div className="text-sm text-red-400">{report.error}</div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {report.status === 'completed' && report.path && (
                      <Button
                        variant="primary"
                        size="small"
                        onClick={() => downloadBugreport(report)}
                      >
                        Download
                      </Button>
                    )}
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        report.status === 'completed'
                          ? 'bg-green-900/30 text-green-400'
                          : report.status === 'failed'
                          ? 'bg-red-900/30 text-red-400'
                          : 'bg-yellow-900/30 text-yellow-400'
                      }`}
                    >
                      {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
