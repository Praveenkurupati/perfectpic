"use client";

import { useState, useEffect } from "react";
import { adminApi } from "@/lib/api";
import { Printer, Download, ChevronRight, Loader2, CheckCircle2, FileText } from "lucide-react";
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
}

const defaultColumns = [
  { id: "pending", name: "Awaiting PDF", count: 12 },
  { id: "rendering", name: "Rendering", count: 2 },
  { id: "printing", name: "Printing", count: 45 },
  { id: "qc", name: "Quality Check", count: 8 },
  { id: "ready", name: "Ready to Ship", count: 15 },
];

export default function ProductionPage() {
  const [columns, setColumns] = useState(defaultColumns);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [batchGenerating, setBatchGenerating] = useState(false);

  const handleDownloadItemPdf = async (item: QueueItem) => {
    try {
      setDownloadingId(item.id);
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
      console.error('Failed to generate print PDF:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleBatchGeneratePdfs = async () => {
    const targetItems = queue.length > 0 ? queue.slice(0, 3) : [];
    if (targetItems.length === 0) return;
    try {
      setBatchGenerating(true);
      for (const it of targetItems) {
        await generateAdminProductionPdf({
          orderNumber: it.orderNumber || it.id,
          title: it.title,
          customerName: it.customerName || 'Customer',
          dimensions: it.dimensions || '8.25" × 8.25"',
          pages: it.pages || 40,
          status: it.status,
          dueDate: it.dueDate,
        });
      }
    } catch (err) {
      console.error('Batch PDF generation notice:', err);
    } finally {
      setBatchGenerating(false);
    }
  };

  const fetchQueue = () => {
    adminApi.getProductionQueue()
      .then(res => {
        if (res && res.columns) {
          setColumns(res.columns);
        }
        if (res && res.queue) {
          setQueue(res.queue);
        }
      })
      .catch(err => {
        console.warn("Using offline production queue data:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleAdvanceStatus = async (orderId: string, currentStatus: string) => {
    const statusFlow = ['pending', 'rendering', 'printing', 'qc', 'ready'];
    const currentIndex = statusFlow.indexOf(currentStatus);
    const nextStatus: string = (currentIndex >= 0 && currentIndex < statusFlow.length - 1 
      ? statusFlow[currentIndex + 1] 
      : 'ready') || 'ready';

    setUpdatingId(orderId);
    try {
      await adminApi.advanceProduction(orderId, nextStatus);
      fetchQueue();
    } catch (err) {
      console.warn("Error advancing status:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex justify-between items-end mb-6 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-semibold text-noir-950">Production Queue</h1>
          <p className="text-sm text-noir-500 mt-1">Manage print renders and fulfillment pipeline.</p>
        </div>
        <div className="space-x-3">
          <button 
            onClick={fetchQueue}
            className="px-4 py-2 bg-cream-100 text-noir-900 rounded-sm text-sm font-medium hover:bg-cream-200 transition-colors border border-cream-300"
          >
            Refresh Queue
          </button>
          <button 
            onClick={handleBatchGeneratePdfs}
            disabled={batchGenerating}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-noir-950 text-cream-50 rounded-sm text-sm font-medium hover:bg-noir-900 transition-colors disabled:opacity-60"
          >
            {batchGenerating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Generating Batch...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Batch Generate PDFs</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
        {columns.map(col => {
          const colItems = queue.filter(item => item.status === col.id);

          return (
            <div key={col.id} className="flex-shrink-0 w-80 bg-cream-100/50 rounded-md border border-cream-200 flex flex-col">
              <div className="p-3 border-b border-cream-200 flex justify-between items-center bg-cream-100 rounded-t-md">
                <h3 className="font-semibold text-sm text-noir-900">{col.name}</h3>
                <span className="bg-cream-50 text-noir-600 text-xs px-2 py-0.5 rounded-full border border-cream-300">
                  {colItems.length > 0 ? colItems.length : col.count}
                </span>
              </div>
              
              <div className="p-3 flex-1 overflow-y-auto space-y-3">
                {colItems.length > 0 ? (
                  colItems.map(item => (
                    <div 
                      key={item.id} 
                      className="bg-white p-3 rounded-sm shadow-sm border border-cream-200 hover:border-foil-gold/50 cursor-pointer transition-colors group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-sm text-noir-950">{item.orderNumber || item.id}</span>
                        <span className="text-[10px] bg-cream-100 text-noir-600 px-1.5 py-0.5 rounded-sm">
                          {item.dimensions || '8.25" × 8.25"'}
                        </span>
                      </div>
                      <p className="text-xs text-noir-500 mb-1">{item.title}</p>
                      <p className="text-[11px] text-noir-400 mb-3">{item.pages || 40} Pages • Hardcover</p>
                      
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-cream-100">
                        <div className="text-xs text-noir-400">Due: {item.dueDate || 'Oct 28'}</div>
                        <div className="flex items-center space-x-1">
                          {col.id === 'pending' && (
                            <button 
                              title="Send to Print"
                              onClick={() => handleAdvanceStatus(item.id, col.id)}
                              className="p-1 text-noir-400 hover:text-noir-950 transition-colors"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {col.id === 'ready' && (
                            <button 
                              title="Download Print PDF"
                              disabled={downloadingId === item.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadItemPdf(item);
                              }}
                              className="p-1 text-noir-400 hover:text-noir-950 transition-colors disabled:opacity-60"
                            >
                              {downloadingId === item.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-foil-gold" />
                              ) : (
                                <Download className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                          <button 
                            disabled={updatingId === item.id}
                            onClick={() => handleAdvanceStatus(item.id, col.id)}
                            title="Advance to Next Stage"
                            className="p-1 text-noir-400 hover:text-foil-gold transition-colors"
                          >
                            {updatingId === item.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  [1, 2].map(i => (
                    <div key={i} className="bg-white p-3 rounded-sm shadow-sm border border-cream-200 hover:border-foil-gold/50 cursor-pointer transition-colors group">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-sm text-noir-950">WB-849{i}</span>
                        <span className="text-[10px] bg-cream-100 text-noir-600 px-1.5 py-0.5 rounded-sm">8.25x8.25"</span>
                      </div>
                      <p className="text-xs text-noir-500 mb-1">Paris Adventure Edition</p>
                      <p className="text-[11px] text-noir-400 mb-3">40 Pages • Hardcover</p>
                      
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-cream-100">
                        <div className="text-xs text-noir-400">Due: Oct 28</div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                          {col.id === 'pending' && <button className="p-1 text-noir-400 hover:text-noir-950"><Printer className="w-3.5 h-3.5" /></button>}
                          {col.id === 'ready' && (
                            <button 
                              title="Download Print PDF"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadItemPdf({
                                  id: `WB-849${i}`,
                                  orderNumber: `WB-849${i}`,
                                  title: 'Paris Adventure Edition',
                                  customerName: 'Customer',
                                  dimensions: '8.25" × 8.25"',
                                  pages: 40,
                                  status: 'ready',
                                  dueDate: 'Oct 28',
                                });
                              }}
                              className="p-1 text-noir-400 hover:text-noir-950"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button className="p-1 text-noir-400 hover:text-noir-950"><ChevronRight className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
