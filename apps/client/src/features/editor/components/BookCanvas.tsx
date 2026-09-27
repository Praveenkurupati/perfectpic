'use client';

import { useEditorStore, Photo } from '@/stores/useEditorStore';
import { ChevronLeft, ChevronRight, Image as ImageIcon, Trash2, Check, Sparkles } from 'lucide-react';

export default function BookCanvas() {
  const { 
    pageCount, 
    currentSpreadIndex, 
    setCurrentSpreadIndex, 
    pagePhotos, 
    selectedSlot, 
    setSelectedSlot,
    assignPhotoToPage,
    clearPagePhoto,
    template,
    bookConfig
  } = useEditorStore();

  const totalSpreads = Math.ceil(pageCount / 2);
  const isCover = currentSpreadIndex === 0;
  const isBack = currentSpreadIndex === totalSpreads + 1;

  const leftPageNum = (currentSpreadIndex - 1) * 2 + 1;
  const rightPageNum = (currentSpreadIndex - 1) * 2 + 2;

  const leftPhoto: Photo | null = pagePhotos[leftPageNum] || null;
  const rightPhoto: Photo | null = pagePhotos[rightPageNum] || null;
  const coverPhoto: Photo | null = pagePhotos[0] || (template?.coverImage ? { id: 'cover', url: template.coverImage, usedCount: 1, flagged: false } : null);

  const coverBg = template?.coverColor || '#F8BAC7';
  const spineText = template?.spineText || 'PERFECTPIC';

  const handlePrev = () => {
    if (currentSpreadIndex > 0) {
      setCurrentSpreadIndex(currentSpreadIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentSpreadIndex <= totalSpreads) {
      setCurrentSpreadIndex(currentSpreadIndex + 1);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-5xl select-none">
      {/* Top Spread Info & Status */}
      <div className="flex items-center justify-between w-full max-w-4xl px-4 mb-4 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-noir-900 uppercase tracking-widest text-[11px]">
            {isCover ? 'Front Cover' : isBack ? 'Back Cover' : `Pages ${leftPageNum} – ${rightPageNum} of ${pageCount}`}
          </span>
          <span className="text-noir-400">•</span>
          <span className="text-noir-500 font-medium">1 photo per page (archival gallery margin)</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] text-noir-500">
            Selected Slot: <strong className="text-noir-950 font-mono">{selectedSlot !== null ? `Page ${selectedSlot}` : 'None'}</strong>
          </span>
        </div>
      </div>

      {/* Main Spread Viewport with Side Navigation Controls */}
      <div className="relative flex items-center justify-center w-full">
        {/* Previous Spread Button */}
        <button
          onClick={handlePrev}
          disabled={currentSpreadIndex === 0}
          className="absolute -left-4 md:-left-8 z-30 p-2.5 rounded-full bg-white/90 backdrop-blur-sm border border-cream-300 shadow-luxury-md text-noir-700 hover:text-noir-950 hover:bg-white disabled:opacity-30 disabled:pointer-events-none transition-all"
          title="Previous Spread"
        >
          <ChevronLeft size={20} />
        </button>

        {/* ======================================================== */}
        {/* 1. FRONT COVER VIEW */}
        {/* ======================================================== */}
        {isCover && (
          <div 
            onClick={() => setSelectedSlot(0)}
            className={`relative w-[420px] h-[520px] rounded-r-md shadow-luxury-xl border border-black/10 flex overflow-hidden cursor-pointer transition-all duration-300 ${
              selectedSlot === 0 ? 'ring-2 ring-foil-gold ring-offset-4' : ''
            }`}
            style={{ backgroundColor: coverBg }}
          >
            {/* Book Spine */}
            <div className="w-10 bg-black/15 flex items-center justify-center border-r border-black/15 relative overflow-hidden shrink-0">
              <span className="text-[10px] font-bold text-white tracking-[0.3em] uppercase transform -rotate-90 whitespace-nowrap drop-shadow-sm">
                {spineText}
              </span>
              <div className="absolute inset-y-0 right-0 w-[1px] bg-white/20" />
            </div>

            {/* Front Cover Layout */}
            <div className="flex-1 p-8 flex flex-col justify-between relative bg-neutral-900/5">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-white/90 block">
                  {template?.seriesLabel || 'Heirloom Photobook'}
                </span>
                <h2 className="font-serif text-2xl font-bold text-white uppercase tracking-wider drop-shadow-md">
                  {template?.displayName || template?.title || 'Our Travel Journey'}
                </h2>
                <p className="text-xs text-white/80 italic font-serif">
                  {template?.tagline || 'your journeys, perfectly told'}
                </p>
              </div>

              {/* Cover Photo Slot (Gallery Centered) */}
              <div className="flex-1 my-4 bg-white/10 rounded-sm overflow-hidden relative border border-white/20 shadow-inner group">
                {coverPhoto ? (
                  <img src={coverPhoto.url} alt="Cover" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-white/60 p-4 text-center">
                    <ImageIcon size={32} className="mb-2" />
                    <span className="text-xs font-medium">Click a photo from tray to place on Cover</span>
                  </div>
                )}
                {coverPhoto && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <span className="text-xs text-white bg-black/60 px-3 py-1.5 rounded-sm">Click tray photo to replace</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-end text-white/80 text-[10px] uppercase tracking-widest font-mono">
                <span>{bookConfig.size} Precision-Bound</span>
                <span>{pageCount} Pages</span>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 2. OPEN TWO-PAGE SPREAD VIEW (Strict 1 Photo Per Page)  */}
        {/* ======================================================== */}
        {!isCover && !isBack && (
          <div className="relative shadow-luxury-2xl bg-white rounded-sm flex w-[840px] h-[480px] border border-cream-300 overflow-hidden">
            {/* ----------------- LEFT PAGE ----------------- */}
            <div 
              onClick={() => setSelectedSlot(leftPageNum)}
              className={`flex-1 border-r border-black/10 relative p-8 md:p-10 flex flex-col justify-between cursor-pointer transition-all ${
                selectedSlot === leftPageNum ? 'bg-amber-50/40 ring-2 ring-inset ring-foil-gold' : 'hover:bg-cream-50/50'
              }`}
            >
              {/* Top Page Header / Number */}
              <div className="flex justify-between items-center text-[10px] text-noir-400 uppercase tracking-widest font-mono">
                <span>Page {leftPageNum}</span>
                {selectedSlot === leftPageNum && (
                  <span className="inline-flex items-center gap-1 text-foil-gold font-bold">
                    <Check size={12} /> Active Target
                  </span>
                )}
              </div>

              {/* Photo Slot: Exactly 1 Photo Centered with Gallery Margins */}
              <div className="flex-1 my-3 bg-[#faf8f5] border border-cream-300 rounded-sm relative overflow-hidden shadow-inner flex items-center justify-center group">
                {leftPhoto ? (
                  <>
                    <img 
                      src={leftPhoto.url} 
                      alt={`Page ${leftPageNum}`} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" 
                    />
                    {/* Hover actions */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          clearPagePhoto(leftPageNum);
                        }}
                        className="px-3 py-1.5 bg-red-600/90 text-white rounded-sm text-xs font-semibold hover:bg-red-700 flex items-center gap-1 shadow-sm"
                      >
                        <Trash2 size={13} />
                        <span>Remove</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center text-cream-500 group-hover:text-noir-700 transition-colors">
                    <div className="w-12 h-12 rounded-full border-2 border-dashed border-cream-400 flex items-center justify-center mb-2 group-hover:border-noir-600">
                      <ImageIcon size={20} />
                    </div>
                    <span className="text-xs font-semibold">Page {leftPageNum} Photo Slot</span>
                    <span className="text-[10px] text-cream-400 mt-1">Select from photo tray on right</span>
                  </div>
                )}
              </div>

              {/* Bottom Editorial Footnote */}
              <div className="flex justify-between items-center text-[10px] text-noir-400 font-serif">
                <span>— {leftPageNum < 10 ? `0${leftPageNum}` : leftPageNum} —</span>
                <span className="text-[9px] uppercase tracking-wider text-noir-300">PerfectPic Lay-Flat</span>
              </div>
            </div>

            {/* Spine Center Fold Illusion & Crease Shadow */}
            <div className="absolute inset-y-0 left-1/2 -ml-5 w-10 bg-gradient-to-r from-black/15 via-black/5 to-black/15 pointer-events-none z-20" />
            <div className="absolute inset-y-0 left-1/2 w-[1px] bg-black/20 pointer-events-none z-20" />

            {/* ----------------- RIGHT PAGE ----------------- */}
            <div 
              onClick={() => setSelectedSlot(rightPageNum)}
              className={`flex-1 relative p-8 md:p-10 flex flex-col justify-between cursor-pointer transition-all ${
                selectedSlot === rightPageNum ? 'bg-amber-50/40 ring-2 ring-inset ring-foil-gold' : 'hover:bg-cream-50/50'
              }`}
            >
              {/* Top Page Header / Number */}
              <div className="flex justify-between items-center text-[10px] text-noir-400 uppercase tracking-widest font-mono">
                {selectedSlot === rightPageNum ? (
                  <span className="inline-flex items-center gap-1 text-foil-gold font-bold">
                    <Check size={12} /> Active Target
                  </span>
                ) : <span />}
                <span>Page {rightPageNum}</span>
              </div>

              {/* Photo Slot: Exactly 1 Photo Centered with Gallery Margins */}
              <div className="flex-1 my-3 bg-[#faf8f5] border border-cream-300 rounded-sm relative overflow-hidden shadow-inner flex items-center justify-center group">
                {rightPhoto ? (
                  <>
                    <img 
                      src={rightPhoto.url} 
                      alt={`Page ${rightPageNum}`} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" 
                    />
                    {/* Hover actions */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          clearPagePhoto(rightPageNum);
                        }}
                        className="px-3 py-1.5 bg-red-600/90 text-white rounded-sm text-xs font-semibold hover:bg-red-700 flex items-center gap-1 shadow-sm"
                      >
                        <Trash2 size={13} />
                        <span>Remove</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center text-cream-500 group-hover:text-noir-700 transition-colors">
                    <div className="w-12 h-12 rounded-full border-2 border-dashed border-cream-400 flex items-center justify-center mb-2 group-hover:border-noir-600">
                      <ImageIcon size={20} />
                    </div>
                    <span className="text-xs font-semibold">Page {rightPageNum} Photo Slot</span>
                    <span className="text-[10px] text-cream-400 mt-1">Select from photo tray on right</span>
                  </div>
                )}
              </div>

              {/* Bottom Editorial Footnote */}
              <div className="flex justify-between items-center text-[10px] text-noir-400 font-serif">
                <span className="text-[9px] uppercase tracking-wider text-noir-300">Archival Series</span>
                <span>— {rightPageNum < 10 ? `0${rightPageNum}` : rightPageNum} —</span>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 3. BACK COVER VIEW */}
        {/* ======================================================== */}
        {isBack && (
          <div 
            className="relative w-[420px] h-[520px] rounded-l-md shadow-luxury-xl border border-black/10 flex flex-col justify-between p-10 overflow-hidden text-center text-white"
            style={{ backgroundColor: coverBg }}
          >
            <div className="pt-8">
              <span className="font-serif text-2xl font-bold tracking-[0.2em] uppercase">PERFECTPIC</span>
              <p className="text-[10px] tracking-widest uppercase text-white/70 mt-1">Archival Editions India</p>
            </div>

            <div className="space-y-2">
              <div className="w-16 h-16 mx-auto rounded-full border border-white/30 flex items-center justify-center">
                <Sparkles size={24} className="text-white/80" />
              </div>
              <p className="text-xs text-white/80 italic font-serif">
                &ldquo;Every journey captured with enduring precision.&rdquo;
              </p>
            </div>

            <div className="border-t border-white/20 pt-4 text-[10px] text-white/60 uppercase tracking-widest font-mono">
              <p>Printed on Tear-Proof Layflat Synthetic Paper</p>
              <p className="mt-1">ISO 9706 Certified 200-Year Life</p>
            </div>
          </div>
        )}

        {/* Next Spread Button */}
        <button
          onClick={handleNext}
          disabled={currentSpreadIndex >= totalSpreads + 1}
          className="absolute -right-4 md:-right-8 z-30 p-2.5 rounded-full bg-white/90 backdrop-blur-sm border border-cream-300 shadow-luxury-md text-noir-700 hover:text-noir-950 hover:bg-white disabled:opacity-30 disabled:pointer-events-none transition-all"
          title="Next Spread"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
