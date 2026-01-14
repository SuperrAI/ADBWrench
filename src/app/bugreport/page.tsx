'use client';

import { useState, useRef, useCallback } from 'react';
import { PageLayout } from '@/design-system/patterns/PageLayout/PageLayout';
import { useDevice } from '@/context/device-context';
import { shellStream, pullFile } from '@/services/adb';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { TerminalSpinner, TerminalProgressBar } from '@/components/ui/TerminalUI';

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

const ESTIMATED_DURATION_MS = 180000; // 3 minutes

export default function BugreportPage() {
  const { connectionState } = useDevice();
  const isConnected = connectionState === 'connected';

  const [currentReport, setCurrentReport] = useState<BugreportEntry | null>(null);
  const [history, setHistory] = useState<BugreportEntry[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const abortRef = useRef<{ exit: () => void } | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

    progressIntervalRef.current = setInterval(() => {
      setCurrentReport((prev) => {
        if (!prev || prev.status !== 'generating') return prev;
        const elapsed = Date.now() - prev.startTime;
        const estimatedProgress = Math.min(95, Math.round((elapsed / ESTIMATED_DURATION_MS) * 100));
        return { ...prev, progress: estimatedProgress };
      });
    }, 1000);

    try {
      let output = '';
      let bugreportPath = '';

      const stream = await shellStream(
        'bugreportz',
        (data) => {
          output += data;
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

      await new Promise<void>((resolve, reject) => {
        const checkInterval = setInterval(async () => {
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

  const downloadBugreport = useCallback(async (report: BugreportEntry) => {
    if (!report.path) {
      toast.error('No bugreport file path available');
      return;
    }

    try {
      toast.info('Downloading bugreport...');
      const data = await pullFile(report.path);

      const blob = new Blob([data.buffer as ArrayBuffer], { type: 'application/zip' });
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

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getEstimatedRemaining = (report: BugreportEntry): string => {
    if (report.status !== 'generating') return '-';
    const elapsed = Date.now() - report.startTime;
    const remaining = Math.max(0, ESTIMATED_DURATION_MS - elapsed);
    return `~${formatDuration(remaining)}`;
  };

  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getStatusIndicator = (status: string) => {
    switch (status) {
      case 'completed': return { text: '[OK]', color: 'text-green-500' };
      case 'failed': return { text: '[FAIL]', color: 'text-red-500' };
      case 'cancelled': return { text: '[STOP]', color: 'text-orange-500' };
      default: return { text: '[...]', color: 'text-muted-foreground' };
    }
  };

  if (!isConnected) {
    return (
      <PageLayout>
        <div className="h-full flex items-center justify-center p-8 font-mono">
          <div className="text-center">
            <pre className="text-muted-foreground mb-4 text-xs">
{`  _______
 |  BUG  |
 | [ZIP] |
 |_______|`}
            </pre>
            <div className="text-sm mb-2">BUGREPORT DISCONNECTED</div>
            <div className="text-xs text-muted-foreground">
              Connect a device to generate bugreports.
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
              <h1 className="text-sm uppercase tracking-wider">BUGREPORT // GENERATOR</h1>
              <div className="text-xs text-muted-foreground mt-1">
                {isGenerating ? 'GENERATING...' : 'READY'}
              </div>
            </div>

            <button
              onClick={isGenerating ? cancelBugreport : startBugreport}
              className={cn(
                "px-3 py-1 border text-xs",
                isGenerating
                  ? "border-red-500 text-red-500 hover:bg-red-500/10"
                  : "border-green-500 text-green-500 hover:bg-green-500/10"
              )}
            >
              [ {isGenerating ? 'CANCEL' : 'GENERATE'} ]
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {/* Info Box */}
          <div className="border border-border p-4">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">[i] ABOUT BUGREPORTS</div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Bugreports contain comprehensive system logs, device state, and diagnostic information.</p>
              <p>Generation typically takes 2-5 minutes. The resulting ZIP file can be analyzed using Android Studio.</p>
            </div>
          </div>

          {/* Current Report Progress */}
          {currentReport && currentReport.status === 'generating' && (
            <div className="border border-orange-500 p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm uppercase">GENERATING BUGREPORT</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    STARTED: {formatTime(currentReport.startTime)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-orange-500">{currentReport.progress}%</div>
                  <div className="text-xs text-muted-foreground">
                    EST: {getEstimatedRemaining(currentReport)}
                  </div>
                </div>
              </div>

              <TerminalProgressBar value={currentReport.progress} width={40} showPercentage={false} />

              <div className="text-xs text-muted-foreground mt-3 text-center">
                <TerminalSpinner label="WORKING" /> | PLEASE WAIT...
              </div>
            </div>
          )}

          {/* History */}
          <div className="border border-border">
            <div className="p-3 border-b border-border">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                REPORT HISTORY ({history.length})
              </div>
            </div>

            {history.length === 0 ? (
              <div className="text-center text-muted-foreground py-8 text-xs">
                <pre className="mb-2">
{`[ZIP]`}
                </pre>
                NO BUGREPORTS GENERATED YET
              </div>
            ) : (
              <div className="divide-y divide-border text-xs">
                {history.map((report) => {
                  const status = getStatusIndicator(report.status);
                  return (
                    <div
                      key={report.id}
                      className="flex items-center justify-between p-3 hover:bg-muted"
                    >
                      <div className="flex items-center gap-3">
                        <span className={cn("font-bold", status.color)}>{status.text}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span>[ZIP]</span>
                            <span>{report.filename}</span>
                          </div>
                          <div className="text-muted-foreground mt-1">
                            {formatTime(report.startTime)}
                            {report.endTime && ` | ${formatDuration(report.endTime - report.startTime)}`}
                          </div>
                          {report.error && (
                            <div className="text-red-500 mt-1">[!] {report.error}</div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {report.status === 'completed' && report.path && (
                          <button
                            onClick={() => downloadBugreport(report)}
                            className="px-2 py-1 border border-green-500 text-green-500 hover:bg-green-500/10"
                          >
                            [ DOWNLOAD ]
                          </button>
                        )}
                        <span className={cn(
                          "px-2 py-1 border",
                          report.status === 'completed' && "border-green-500 text-green-500",
                          report.status === 'failed' && "border-red-500 text-red-500",
                          report.status === 'cancelled' && "border-orange-500 text-orange-500"
                        )}>
                          {report.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="border-t border-border p-2 flex-shrink-0 bg-background">
          <div className="text-[10px] text-muted-foreground">
            GENERATE DIAGNOSTIC REPORTS | BUGREPORTZ
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
