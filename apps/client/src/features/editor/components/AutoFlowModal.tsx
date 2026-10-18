// apps/client/src/features/editor/components/AutoFlowModal.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { 
  X, 
  Sparkles, 
  Calendar, 
  Clock, 
  LayoutGrid, 
  BookOpen, 
  Layers, 
  Check, 
  ArrowRight,
  ShieldCheck,
  Maximize2,
  ChevronRight,
  Sliders,
  Flame,
  ScanFace,
} from 'lucide-react';
import { 
  useEditorStore, 
  AutoFlowStyle, 
  AutoFlowOrder 
} from '@/stores/useEditorStore';

interface AutoFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AutoFlowModal({ isOpen, onClose, onSuccess }: AutoFlowModalProps) {
  const { 
    photos, 
    pageCount, 
    applyAutoFlow, 
    getAutoFlowPreview, 
    burstGroups 
  } = useEditorStore();

  const [selectedStyle, setSelectedStyle] = useState<AutoFlowStyle>('curator');
  const [selectedOrder, setSelectedOrder] = useState<AutoFlowOrder>('chronological');
  const [enablePanoramics, setEnablePanoramics] = useState(true);
  const [prioritizeBestPicks, setPrioritizeBestPicks] = useState(true);
  const [generateDateHeaders, setGenerateDateHeaders] = useState(true);
  const [smartFaceCrop, setSmartFaceCrop] = useState(true);
  const [isApplying, setIsApplying] = useState(false);

  // Compute live preview metrics based on user selections
  const previewMetrics = useMemo(() => {
    return getAutoFlowPreview({
      style: selectedStyle,
      order: selectedOrder,
      enablePanoramics,
      prioritizeBestPicks,
      generateDateHeaders,
      smartFaceCrop,
    });
  }, [
    getAutoFlowPreview,
    selectedStyle,
    selectedOrder,
    enablePanoramics,
    prioritizeBestPicks,
    generateDateHeaders,
    smartFaceCrop,
  ]);

  if (!isOpen) return null;

  const handleApply = () => {
    setIsApplying(true);
    setTimeout(() => {
      applyAutoFlow({
        style: selectedStyle,
        order: selectedOrder,
        enablePanoramics,
        prioritizeBestPicks,
        generateDateHeaders,
        smartFaceCrop,
      });
      setIsApplying(false);
      onClose();
      if (onSuccess) onSuccess();
    }, 50);
  };

  const styleOptions: Array<{
    id: AutoFlowStyle;
    title: string;
    subtitle: string;
    badge: string;
    icon: React.ReactNode;
  }> = [
    {
      id: 'curator',
      title: 'Editorial Curator',
      subtitle: 'Dynamic art director rhythm. Pairs portraits side-by-side, full-bleed hero moments, and dramatic 2-page panoramics.',
      badge: 'Art Director Pick',
      icon: <Sparkles className="w-5 h-5 text-foil-gold" />,
    },
    {
      id: 'classic',
      title: 'Classic Gallery',
      subtitle: 'Minimalist 1-photo per page with generous white archival borders in chronological sequence.',
      badge: 'Timeless Minimal',
      icon: <BookOpen className="w-5 h-5 text-noir-800" />,
    },
    {
      id: 'dense',
      title: 'High-Density Storybook',
      subtitle: 'Uses 2-up, 3-up, and 4-up collage spreads to accommodate more photos across your edition.',
      badge: 'Max Photos',
      icon: <Layers className="w-5 h-5 text-indigo-700" />,
    },
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-noir-950/70 backdrop-blur-sm animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-sm border border-cream-200 shadow-luxury-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-cream-200 flex items-start justify-between bg-gradient-to-r from-cream-50 via-white to-amber-50/40">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-noir-950 text-cream-50">
                Studio Assistant
              </span>
              <span className="text-xs text-noir-500 font-medium">• Chronological Auto-Flow</span>
            </div>
            <h2 className="font-serif text-2xl text-noir-950 font-medium">
              Auto-Flow Chronological Story
            </h2>
            <p className="text-xs text-noir-600 mt-0.5 leading-relaxed">
              Sequence photos from Day 1 to Day N using camera timestamps and aspect-ratio layout matching.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-cream-100 text-noir-400 hover:text-noir-900 transition-colors"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Live Reactive Analysis Banner */}
          <div className="p-4 bg-cream-50/80 border border-cream-200 rounded-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cream-200/60 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-700 shrink-0" />
                <span className="text-xs font-bold text-noir-950">
                  Detected Timeline: {previewMetrics.dateRangeText}
                </span>
              </div>
              <span className="text-[11px] font-mono text-noir-500">
                {photos.length} photos · {pageCount} target pages
              </span>
            </div>

            {/* Metrics Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-white p-2 rounded-xs border border-cream-200 shadow-2xs">
                <span className="font-mono text-sm font-bold text-noir-900 block">
                  {previewMetrics.totalPhotosMapped}
                </span>
                <span className="text-[10px] text-noir-500 uppercase tracking-tight">Mapped Photos</span>
              </div>
              <div className="bg-white p-2 rounded-xs border border-cream-200 shadow-2xs">
                <span className="font-mono text-sm font-bold text-amber-700 block">
                  {previewMetrics.panoramicSpreadsCount}
                </span>
                <span className="text-[10px] text-noir-500 uppercase tracking-tight">Panoramic Spreads</span>
              </div>
              <div className="bg-white p-2 rounded-xs border border-cream-200 shadow-2xs">
                <span className="font-mono text-sm font-bold text-indigo-700 block">
                  {previewMetrics.portraitPairsCount}
                </span>
                <span className="text-[10px] text-noir-500 uppercase tracking-tight">Portrait Pairs</span>
              </div>
              <div className="bg-white p-2 rounded-xs border border-cream-200 shadow-2xs">
                <span className="font-mono text-sm font-bold text-emerald-700 block">
                  100%
                </span>
                <span className="text-[10px] text-noir-500 uppercase tracking-tight">Page Coverage</span>
              </div>
            </div>
          </div>

          {/* Section 1: Choose Story Layout Style */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-noir-700 mb-2">
              1. Choose Editorial Layout Style
            </label>
            <div className="grid grid-cols-1 gap-2.5">
              {styleOptions.map((opt) => {
                const isSelected = selectedStyle === opt.id;
                return (
                  <div
                    key={opt.id}
                    onClick={() => setSelectedStyle(opt.id)}
                    className={`p-3.5 rounded-sm border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-noir-950 bg-amber-50/50 shadow-sm ring-1 ring-noir-950'
                        : 'border-cream-300 bg-white hover:border-noir-300 hover:bg-cream-50/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-sm bg-cream-100 flex items-center justify-center shrink-0 border border-cream-200">
                        {opt.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-serif text-sm font-bold text-noir-950">
                            {opt.title}
                          </span>
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-cream-200/70 text-noir-700">
                            {opt.badge}
                          </span>
                        </div>
                        <p className="text-xs text-noir-600 mt-0.5 leading-snug line-clamp-2">
                          {opt.subtitle}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                        isSelected
                          ? 'border-noir-950 bg-noir-950 text-cream-50'
                          : 'border-cream-400 bg-white'
                      }`}
                    >
                      {isSelected && <Check size={12} className="stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Chronological Sequence Order */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-noir-700 mb-2">
              2. Story Sequence Order
            </label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setSelectedOrder('chronological')}
                className={`p-2.5 rounded-sm border text-center transition-all ${
                  selectedOrder === 'chronological'
                    ? 'border-noir-950 bg-noir-950 text-cream-50 font-bold shadow-xs'
                    : 'border-cream-300 bg-white text-noir-700 hover:border-cream-400'
                }`}
              >
                <div className="text-[11px] font-semibold">Earliest → Latest</div>
                <div className="text-[9.5px] opacity-75">Day 1 to Day N</div>
              </button>
              <button
                type="button"
                onClick={() => setSelectedOrder('reverse')}
                className={`p-2.5 rounded-sm border text-center transition-all ${
                  selectedOrder === 'reverse'
                    ? 'border-noir-950 bg-noir-950 text-cream-50 font-bold shadow-xs'
                    : 'border-cream-300 bg-white text-noir-700 hover:border-cream-400'
                }`}
              >
                <div className="text-[11px] font-semibold">Latest → Earliest</div>
                <div className="text-[9.5px] opacity-75">Most Recent First</div>
              </button>
              <button
                type="button"
                onClick={() => setSelectedOrder('original')}
                className={`p-2.5 rounded-sm border text-center transition-all ${
                  selectedOrder === 'original'
                    ? 'border-noir-950 bg-noir-950 text-cream-50 font-bold shadow-xs'
                    : 'border-cream-300 bg-white text-noir-700 hover:border-cream-400'
                }`}
              >
                <div className="text-[11px] font-semibold">Upload Sequence</div>
                <div className="text-[9.5px] opacity-75">As Selected</div>
              </button>
            </div>
          </div>

          {/* Section 3: Smart Curator Feature Toggles */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-noir-700 mb-2">
              3. Smart Curator Enhancements
            </label>
            <div className="space-y-2 text-xs">
              {/* Toggle 1: Panoramic Spreads */}
              <label className="p-3 bg-white border border-cream-200 rounded-sm flex items-center justify-between cursor-pointer hover:bg-cream-50/40 transition-colors">
                <div className="flex items-center gap-2.5 pr-2">
                  <Maximize2 className="w-4 h-4 text-amber-700 shrink-0" />
                  <div>
                    <span className="font-semibold text-noir-900 block">
                      Auto-detect 2-Page Panoramic Spreads
                    </span>
                    <span className="text-[11px] text-noir-500 block leading-tight">
                      Expands ultra-wide landscapes across both Left and Right pages seamlessly.
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={enablePanoramics}
                  onChange={(e) => setEnablePanoramics(e.target.checked)}
                  className="w-4 h-4 rounded text-noir-950 accent-noir-950 cursor-pointer"
                />
              </label>

              {/* Toggle 2: Prioritize Burst Best Picks */}
              <label className="p-3 bg-white border border-cream-200 rounded-sm flex items-center justify-between cursor-pointer hover:bg-cream-50/40 transition-colors">
                <div className="flex items-center gap-2.5 pr-2">
                  <Flame className="w-4 h-4 text-rose-600 shrink-0" />
                  <div>
                    <span className="font-semibold text-noir-900 block">
                      Filter Burst Duplicates (Prioritize Best Picks)
                    </span>
                    <span className="text-[11px] text-noir-500 block leading-tight">
                      Picks the sharpest shot from rapid bursts and leaves duplicate frames out of the book.
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={prioritizeBestPicks}
                  onChange={(e) => setPrioritizeBestPicks(e.target.checked)}
                  className="w-4 h-4 rounded text-noir-950 accent-noir-950 cursor-pointer"
                />
              </label>

              {/* Toggle 3: Date & Chapter Subtitles */}
              <label className="p-3 bg-white border border-cream-200 rounded-sm flex items-center justify-between cursor-pointer hover:bg-cream-50/40 transition-colors">
                <div className="flex items-center gap-2.5 pr-2">
                  <Clock className="w-4 h-4 text-emerald-700 shrink-0" />
                  <div>
                    <span className="font-semibold text-noir-900 block">
                      Add Subtle Date & Chapter Captions
                    </span>
                    <span className="text-[11px] text-noir-500 block leading-tight">
                      Inserts clean date markers (e.g. "Day 1 · Oct 14") at chapter divider spreads.
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={generateDateHeaders}
                  onChange={(e) => setGenerateDateHeaders(e.target.checked)}
                  className="w-4 h-4 rounded text-noir-950 accent-noir-950 cursor-pointer"
                />
              </label>

              {/* Toggle 4: Face-Centric Smart Cropping */}
              <label className="p-3 bg-white border border-cream-200 rounded-sm flex items-center justify-between cursor-pointer hover:bg-cream-50/40 transition-colors">
                <div className="flex items-center gap-2.5 pr-2">
                  <ScanFace className="w-4 h-4 text-foil-gold shrink-0" />
                  <div>
                    <span className="font-semibold text-noir-900 block">
                      Face-Centric Smart Cropping (MediaPipe)
                    </span>
                    <span className="text-[11px] text-noir-500 block leading-tight">
                      Automatically aligns eye-lines and guarantees generous headroom to eliminate edge decapitations.
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={smartFaceCrop}
                  onChange={(e) => setSmartFaceCrop(e.target.checked)}
                  className="w-4 h-4 rounded text-noir-950 accent-noir-950 cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-cream-200 bg-cream-50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-noir-500">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="hidden sm:inline">100% reversible. Undo anytime with <strong>Ctrl+Z</strong>.</span>
            <span className="sm:hidden">100% reversible.</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-cream-300 text-noir-700 hover:bg-cream-100 rounded-sm text-xs font-semibold uppercase tracking-wider transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={isApplying || photos.length === 0}
              className="px-5 py-2.5 bg-noir-950 text-cream-50 hover:bg-neutral-800 rounded-sm text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-luxury-md disabled:opacity-50"
            >
              <Sparkles size={13} className="text-foil-gold" />
              <span>{isApplying ? 'Composing Story...' : 'Apply Auto-Flow Layout'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
