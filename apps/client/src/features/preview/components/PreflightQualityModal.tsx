'use client';

import React from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  X, 
  ShieldAlert, 
  Eye, 
  Edit3 
} from 'lucide-react';
import { PreflightAuditReport, FlaggedSlotIssue } from '@/stores/useEditorStore';
import { normalizeImageUrl } from '@/lib/urls';

interface PreflightQualityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedAnyway: () => void;
  onGoToPage: (pageNum: number) => void;
  auditReport: PreflightAuditReport;
}

export default function PreflightQualityModal({
  isOpen,
  onClose,
  onProceedAnyway,
  onGoToPage,
  auditReport,
}: PreflightQualityModalProps) {
  if (!isOpen) return null;

  const { flaggedIssues, totalPlaced, ultraHdCount, goodCount } = auditReport;
  const passedCount = ultraHdCount + goodCount;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-[#FAF9F5] border border-black/10 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-black/10 bg-white flex items-start justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 border border-amber-200 text-amber-800 flex items-center justify-center shrink-0">
              <ShieldAlert size={20} />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-amber-700 font-bold block">
                Pre-Flight Press Inspection
              </span>
              <h2 className="font-serif text-xl sm:text-2xl text-noir-900 font-bold leading-tight">
                Review Print Quality Before Ordering
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-black rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Summary Banner */}
          <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-4 text-xs sm:text-sm text-amber-900 leading-relaxed">
            <p>
              We detected <strong className="font-bold">{flaggedIssues.length} photo{flaggedIssues.length === 1 ? '' : 's'}</strong> that may print with noticeable softness or pixelation. 
              While {passedCount} of your {totalPlaced} photos meet our archival 300 DPI press standard, we want to ensure you are 100% satisfied with your physical photobook.
            </p>
          </div>

          {/* Flagged Issues List */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase font-mono tracking-widest text-gray-500 font-bold">
              Photos Requiring Attention ({flaggedIssues.length})
            </h3>

            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
              {flaggedIssues.map((issue: FlaggedSlotIssue, idx: number) => {
                const isCover = issue.pageNum === 0;
                const pageLabel = isCover ? 'Front Cover' : `Page ${issue.pageNum}`;

                return (
                  <div
                    key={`${issue.slotId}_${idx}`}
                    className="p-3.5 bg-white border border-black/10 rounded-xl flex items-center justify-between gap-3 shadow-2xs hover:border-black/30 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Photo Thumbnail */}
                      <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden relative shrink-0 border border-black/5">
                        <img
                          src={normalizeImageUrl(issue.photo.url)}
                          alt={pageLabel}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[8px] font-mono text-center py-0.5 truncate">
                          {pageLabel}
                        </span>
                      </div>

                      {/* Issue Details */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-xs text-gray-900">
                            {pageLabel}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-950/90 text-rose-200 border border-rose-500/70">
                            {issue.isBlurry ? '⚠️ Blurry' : `⚠️ ${issue.effectiveDpi} DPI`}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-1">
                          {issue.reason}
                        </p>
                        <p className="text-[11px] text-amber-700 italic line-clamp-1 mt-0.5">
                          💡 {issue.suggestion}
                        </p>
                      </div>
                    </div>

                    {/* Quick Edit Action Button */}
                    <button
                      type="button"
                      onClick={() => onGoToPage(issue.pageNum)}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-black hover:text-white text-gray-900 rounded-lg text-xs font-semibold shrink-0 transition-colors flex items-center gap-1"
                    >
                      <span>Fix in Studio</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Tips Box */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-xs text-gray-600 space-y-1">
            <span className="font-bold text-gray-900 block">How to fix quality alerts in seconds:</span>
            <ul className="list-disc list-inside space-y-0.5 text-gray-600 text-[11px]">
              <li><strong>Zoom Out:</strong> If you used the crop tool to zoom into a face, zoom out to restore native resolution.</li>
              <li><strong>Change Layout:</strong> Moving a photo from full-bleed to a 2 or 4-photo grid dramatically multiplies printed DPI.</li>
              <li><strong>Replace Photo:</strong> Swap out WhatsApp or compressed photos with original camera roll originals.</li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-6 border-t border-black/10 bg-white flex flex-col-reverse sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onProceedAnyway}
            className="w-full sm:w-auto px-4 py-2.5 text-xs text-gray-600 hover:text-black font-medium transition-colors text-center"
          >
            I Understand — Print My Book Anyway
          </button>

          <button
            type="button"
            onClick={() => onGoToPage(flaggedIssues[0]?.pageNum || 1)}
            className="w-full sm:w-auto px-6 py-3 rounded-full bg-black hover:bg-noir-900 text-white text-xs sm:text-sm font-semibold transition-all shadow-md flex items-center justify-center gap-2"
          >
            <Edit3 size={14} />
            <span>Return to Studio to Fix Layouts</span>
          </button>
        </div>
      </div>
    </div>
  );
}
