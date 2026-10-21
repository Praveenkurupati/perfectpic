"use client";

import { useState, useEffect, useCallback } from "react";
import { adminApi } from "@/lib/api";
import { 
  Printer, 
  Download, 
  ChevronRight, 
  Loader2, 
  CheckCircle2, 
  FileText, 
  AlertTriangle,
  RefreshCw,
  Play,
  Flame,
  Activity,
  X,
  Server,
  Cpu,
  Layers
} from "lucide-react";
import { generateAdminProductionPdf } from "@/lib/pdfGenerator";

interface QueueItem {
  id: string;
  orderNumber: string;
  title: string;
  customerName?: string;
  dimensions?: string;
  pages?: number;
  status: string;
  dueDate?: string;
  pdfUrl?: string;
  thumbnail?: string;
}

interface QueueJob {
  id: string;
  name: string;
  status: string;
  progress: number;
  attempts: number;
  maxAttempts: number;
  failedReason?: string;
  stackTrace?: string[];
  createdAt: number;
  data?: any;
}

const defaultColumns = [
  { id: "pending", name: "Awaiting PDF", count: 0 },
  { id: "rendering", name: "Rendering", count: 0 },
  { id: "printing", name: "Printing", count: 0 },
  { id: "qc", name: "Quality Check", count: 0 },
  { id: "ready", name: "Ready to Ship", count: 0 },
];

export default function ProductionPage() {
  const [columns, setColumns] = useState(defaultColumns);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [triggeringRenderId, setTriggeringRenderId] = useState<string | null>(null);

  // BullMQ Worker Telemetry state
  const [queueStats, setQueueStats] = useState<any>(null);
  const [activeJobs, setActiveJobs] = useState<QueueJob[]>([]);
  const [failedJobs, setFailedJobs] = useState<QueueJob[]>([]);
  const [isDlqDrawerOpen, setIsDlqDrawerOpen] = useState(false);
  const [retryingJobId, setRetryingJobId] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(true);

  // Fetch production queue and worker telemetry
  const fetchAllData = useCallback(async () => {
    try {
      const [prodRes, statsRes, activeJobsRes, failedJobsRes] = await Promise.allSettled([
        adminApi.getProductionQueue(),
        adminApi.getQueueStats(),
        adminApi.getQueueJobs({ queue: 'print-render-queue', status: 'active', limit: 5 }),
        adminApi.getQueueJobs({ queue: 'print-render-queue', status: 'failed', limit: 20 }),
      ]);

      if (prodRes.status === 'fulfilled' && prodRes.value) {
        if (prodRes.value.columns) setColumns(prodRes.value.columns);
        if (prodRes.value.queue) setQueue(prodRes.value.queue);
      }

      if (statsRes.status === 'fulfilled' && statsRes.value) {
        setQueueStats(statsRes.value);
      }

      if (activeJobsRes.status === 'fulfilled' && activeJobsRes.value?.jobs) {
        setActiveJobs(activeJobsRes.value.jobs);
      }

      if (failedJobsRes.status === 'fulfilled' && failedJobsRes.value?.jobs) {
        setFailedJobs(failedJobsRes.value.jobs);
      }
    } catch (err) {
      console.warn("Queue telemetry notice:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
    // Poll telemetry every 8 seconds for live progress
    const interval = setInterval(() => {
      if (isPolling) fetchAllData();
    }, 8000);
    return () => clearInterval(interval);
  }, [fetchAllData, isPolling]);

  // Handle retry of failed DLQ job
  const handleRetryJob = async (jobId: string) => {
    try {
      setRetryingJobId(jobId);
      await adminApi.retryQueueJob(jobId, 'print-render-queue');
      await fetchAllData();
    } catch (err: any) {
      console.error('Failed to retry job:', err);
    } finally {
      setRetryingJobId(null);
    }
  };

  // Trigger server-side 300 DPI compile for an order
  const handleTriggerPrintRender = async (orderId: string) => {
    try {
      setTriggeringRenderId(orderId);
      await adminApi.triggerOrderPrintRender(orderId);
      await fetchAllData();
    } catch (err) {
      console.error('Trigger render error:', err);
    } finally {
      setTriggeringRenderId(null);
    }
  };

  // Download print PDF: prioritize true server press PDF URL
  const handleDownloadItemPdf = async (item: QueueItem) => {
    try {
      setDownloadingId(item.id);

      if (item.pdfUrl && typeof item.pdfUrl === 'string' && item.pdfUrl.startsWith('http')) {
        // Direct link to true high-fidelity 300 DPI PDF stored on S3
        window.open(item.pdfUrl, '_blank');
        return;
      }

      // Fallback: generate admin quick proof
      await generateAdminProductionPdf({
        orderNumber: item.orderNumber || item.id,
        title: item.title,
        customerName: item.customerName || 'Customer',
        dimensions: item.dimensions || '8.25" × 8.25"',
        pages: item.pages || 40,
        status: item.status,
        dueDate: item.dueDate,
      });
    } catch (err) {
      console.error('Failed to download print PDF:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleAdvanceStatus = async (orderId: string, currentStatus: string) => {
    const statusFlow = ['pending', 'rendering', 'printing', 'qc', 'ready'];
    const currentIndex = statusFlow.indexOf(currentStatus);
    const nextStatus: string = (currentIndex >= 0 && currentIndex < statusFlow.length - 1 
      ? statusFlow[currentIndex + 1] 
      : 'ready') || 'ready';

    setUpdatingId(orderId);
    try {
      await adminApi.advanceProduction(orderId, nextStatus);
      await fetchAllData();
    } catch (err) {
      console.warn("Error advancing status:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const renderQueueStats = queueStats?.queues?.['print-render-queue'] || {
    waiting: 0,
    active: 0,
    completed: 0,
    failed: 0,
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4">
      {/* 1. Header & Live Worker Telemetry Banner */}
      <div className="bg-white rounded-xl border border-cream-200 p-4 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-serif font-bold text-noir-950">Industrial Production Command Center</h1>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Print Render Engine Online</span>
              </span>
            </div>
            <p className="text-xs text-noir-500 mt-0.5">
              Fogra39 CMYK • 300 DPI Press Master Generation & Industrial Automation
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Live Queue Counters */}
            <div className="flex items-center gap-1.5 bg-cream-50 px-3 py-1.5 rounded-lg border border-cream-200 text-xs font-mono">
              <span className="text-noir-500">Waiting:</span>
              <span className="font-bold text-noir-900">{renderQueueStats.waiting}</span>
              <span className="text-cream-300">|</span>
              <span className="text-amber-600">Rendering:</span>
              <span className="font-bold text-amber-700">{renderQueueStats.active}</span>
              <span className="text-cream-300">|</span>
              <span className="text-emerald-600">Completed:</span>
              <span className="font-bold text-emerald-700">{renderQueueStats.completed}</span>
            </div>

            {/* Failed Renders Badge Button */}
            {renderQueueStats.failed > 0 && (
              <button
                type="button"
                onClick={() => setIsDlqDrawerOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-300 hover:bg-rose-100 text-xs font-bold transition-colors animate-pulse"
                title="Inspect Failed Print Jobs"
              >
                <AlertTriangle size={13} className="text-rose-600" />
                <span>Failed Renders: {renderQueueStats.failed}</span>
              </button>
            )}

            <button 
              type="button"
              onClick={() => fetchAllData()}
              className="p-2 bg-cream-100 text-noir-900 rounded-lg hover:bg-cream-200 transition-colors border border-cream-300 text-xs flex items-center gap-1"
              title="Refresh Telemetry"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Active In-Flight Render Tracker Banner */}
        {activeJobs.length > 0 && (
          <div className="mt-3 pt-3 border-t border-cream-100 grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeJobs.map((job) => (
              <div key={job.id} className="bg-amber-50/70 border border-amber-200/80 rounded-lg p-2.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Loader2 size={14} className="animate-spin text-amber-700 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-amber-950 truncate">
                      Rasterizing Order #{job.data?.orderId || job.id}
                    </div>
                    <div className="text-[10px] text-amber-800 font-mono">
                      Compiling 300 DPI spreads with Fogra39 profile
                    </div>
                  </div>
                </div>

                <div className="w-28 shrink-0 text-right">
                  <div className="text-xs font-mono font-bold text-amber-900">{job.progress || 35}%</div>
                  <div className="w-full bg-amber-200 rounded-full h-1.5 mt-1 overflow-hidden">
                    <div 
                      className="bg-amber-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${job.progress || 35}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Kanban Board */}
      <div className="flex-1 flex gap-4 overflow-x-auto pb-4 hide-scrollbar min-h-0">
        {columns.map(col => {
          const colItems = queue.filter(item => item.status === col.id);

          return (
            <div key={col.id} className="flex-shrink-0 w-80 bg-cream-100/50 rounded-xl border border-cream-200 flex flex-col overflow-hidden">
              <div className="p-3 border-b border-cream-200 flex justify-between items-center bg-cream-100 rounded-t-xl shrink-0">
                <h3 className="font-semibold text-sm text-noir-900">{col.name}</h3>
                <span className="bg-cream-50 text-noir-600 text-xs px-2.5 py-0.5 rounded-full border border-cream-300 font-mono font-bold">
                  {colItems.length}
                </span>
              </div>
              
              <div className="p-3 flex-1 overflow-y-auto space-y-3">
                {colItems.length > 0 ? (
                  colItems.map(item => (
                    <div 
                      key={item.id} 
                      className="bg-white p-3.5 rounded-xl shadow-xs border border-cream-200 hover:border-foil-gold/60 transition-all group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-sm text-noir-950 font-mono">{item.orderNumber || item.id}</span>
                        <span className="text-[10px] bg-cream-100 text-noir-700 px-2 py-0.5 rounded-md font-mono">
                          {item.dimensions || '8.25" × 8.25"'}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-noir-800 mb-1">{item.title}</p>
                      <p className="text-[11px] text-noir-400 mb-2.5">{item.pages || 40} Pages • Hardcover</p>

                      {/* PDF Ready Badge if press master exists */}
                      {item.pdfUrl && (
                        <div className="mb-2.5 flex items-center gap-1.5 text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md">
                          <CheckCircle2 size={11} className="text-emerald-600 shrink-0" />
                          <span className="font-mono font-semibold">300 DPI Press Master Ready</span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between pt-2 border-t border-cream-100 text-xs">
                        <div className="text-[11px] text-noir-400 font-mono">
                          Due: {item.dueDate || 'Standard'}
                        </div>

                        <div className="flex items-center gap-1">
                          {/* Render / Re-Render Button */}
                          {(col.id === 'pending' || col.id === 'rendering') && (
                            <button 
                              type="button"
                              title="Start 300 DPI High-Resolution Render"
                              disabled={triggeringRenderId === item.id}
                              onClick={() => handleTriggerPrintRender(item.id)}
                              className="p-1.5 rounded-md text-amber-700 hover:bg-amber-50 transition-colors border border-amber-200"
                            >
                              {triggeringRenderId === item.id ? (
                                <Loader2 size={13} className="animate-spin text-amber-700" />
                              ) : (
                                <Printer size={13} />
                              )}
                            </button>
                          )}

                          {/* Download Press PDF */}
                          <button 
                            type="button"
                            title={item.pdfUrl ? "Download True 300 DPI Press Master" : "Generate Proof PDF"}
                            disabled={downloadingId === item.id}
                            onClick={() => handleDownloadItemPdf(item)}
                            className={`p-1.5 rounded-md transition-colors border ${
                              item.pdfUrl 
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100' 
                                : 'text-noir-600 hover:bg-cream-100 border-cream-300'
                            }`}
                          >
                            {downloadingId === item.id ? (
                              <Loader2 size={13} className="animate-spin text-foil-gold" />
                            ) : (
                              <Download size={13} />
                            )}
                          </button>

                          {/* Advance Status Button */}
                          <button 
                            type="button"
                            disabled={updatingId === item.id}
                            onClick={() => handleAdvanceStatus(item.id, col.id)}
                            title="Advance to Next Stage"
                            className="p-1.5 rounded-md text-noir-400 hover:text-black hover:bg-cream-100 transition-colors"
                          >
                            {updatingId === item.id ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <ChevronRight size={14} />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-32 flex flex-col items-center justify-center text-xs text-noir-400 border border-dashed border-cream-200 rounded-lg">
                    <span>No orders in this stage</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Dead-Letter Queue (DLQ) Inspector Drawer Modal */}
      {isDlqDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-cream-300 shadow-luxury-lg max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-cream-200 flex items-center justify-between bg-rose-50/50">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                <div>
                  <h3 className="font-serif font-bold text-noir-950 text-base">Failed Print Renders & Resolution Center</h3>
                  <p className="text-xs text-rose-800">
                    {failedJobs.length} Failed render jobs requiring operations review
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDlqDrawerOpen(false)}
                className="p-1 rounded-lg text-noir-400 hover:text-noir-900 hover:bg-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-3">
              {failedJobs.length === 0 ? (
                <div className="p-8 text-center text-xs text-noir-500">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <span>All render jobs complete. No failed print files in the queue.</span>
                </div>
              ) : (
                failedJobs.map((job) => (
                  <div key={job.id} className="bg-white border border-rose-200 rounded-xl p-4 shadow-2xs space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-noir-950">Job: {job.id}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 font-mono">
                            Failed after {job.attempts || 3} attempts
                          </span>
                        </div>
                        <div className="text-xs text-noir-700 mt-1">
                          Target Order: <span className="font-bold">{job.data?.orderId || 'Unknown'}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={retryingJobId === job.id}
                        onClick={() => handleRetryJob(job.id)}
                        className="px-3 py-1.5 rounded-lg bg-noir-950 text-white hover:bg-noir-800 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs disabled:opacity-50"
                      >
                        {retryingJobId === job.id ? (
                          <Loader2 size={12} className="animate-spin text-white" />
                        ) : (
                          <RefreshCw size={12} />
                        )}
                        <span>Retry Job</span>
                      </button>
                    </div>

                    <div className="bg-rose-50/70 border border-rose-200/80 rounded-lg p-2.5 text-xs text-rose-900 font-mono">
                      <span className="font-bold block mb-1">Reason:</span>
                      {job.failedReason || 'Unknown render exception'}
                    </div>

                    {job.stackTrace && job.stackTrace.length > 0 && (
                      <details className="text-[11px] text-noir-500">
                        <summary className="cursor-pointer hover:underline font-mono">View Stack Trace</summary>
                        <pre className="mt-1 p-2 bg-cream-50 rounded border border-cream-200 overflow-x-auto text-[10px] font-mono leading-tight">
                          {job.stackTrace.join('\n')}
                        </pre>
                      </details>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="p-3 border-t border-cream-200 bg-cream-50 flex items-center justify-between text-xs text-noir-600">
              <span>Automatic backoff retries: 3 attempts with 2s, 4s, 8s backoff</span>
              <button
                type="button"
                onClick={() => setIsDlqDrawerOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-white border border-cream-300 hover:bg-cream-100 text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
