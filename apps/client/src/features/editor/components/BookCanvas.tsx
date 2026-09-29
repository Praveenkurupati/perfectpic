'use client';

import { useEditorStore, Photo, PageLayout } from '@/stores/useEditorStore';
import { ChevronLeft, ChevronRight, Image as ImageIcon, Trash2, Check, Sparkles } from 'lucide-react';

interface SlotProps {
  slotId: string;
  photo: Photo | null;
  isSelected: boolean;
  onSelect: (slotId: string) => void;
  onRemove: (slotId: string) => void;
  label?: string;
}

function PhotoSlot({ slotId, photo, isSelected, onSelect, onRemove, label }: SlotProps) {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSelect(slotId);
      }}
      className={`relative w-full h-full rounded-sm overflow-hidden border transition-all cursor-pointer group flex items-center justify-center ${
        isSelected
          ? 'border-foil-gold ring-2 ring-foil-gold bg-amber-50/50 shadow-sm'
          : 'border-cream-300 bg-[#faf8f5] hover:border-noir-900'
      }`}
    >
      {photo ? (
        <>
          <img
            src={photo.url}
            alt={label || 'Slot Photo'}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(slotId);
              }}
              className="px-2.5 py-1 bg-red-600/90 text-white rounded-sm text-[11px] font-semibold hover:bg-red-700 flex items-center gap-1 shadow-sm"
              title="Remove photo"
            >
              <Trash2 size={12} />
              <span>Remove</span>
            </button>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center p-3 text-center text-cream-500 group-hover:text-noir-700 transition-colors">
          <ImageIcon size={18} className="mb-1" />
          <span className="text-[10px] font-semibold text-noir-600">{label || 'Empty Slot'}</span>
          <span className="text-[9px] text-noir-400 mt-0.5">Click to place photo</span>
        </div>
      )}
    </div>
  );
}

function RenderPageSlots({
  pageNum,
  layout,
  selectedSlot,
  onSelectSlot,
  slotPhotos,
  pagePhotos,
  onRemovePhoto,
}: {
  pageNum: number;
  layout: PageLayout;
  selectedSlot: string | null;
  onSelectSlot: (slotId: string) => void;
  slotPhotos: Record<string, Photo | null>;
  pagePhotos: Record<number, Photo | null>;
  onRemovePhoto: (slotId: string) => void;
}) {
  const getPhoto = (subIndex: number) => {
    const slotId = `${pageNum}_${subIndex}`;
    return slotPhotos[slotId] || (subIndex === 0 ? pagePhotos[pageNum] || null : null);
  };

  if (layout === '2-photo-v') {
    return (
      <div className="flex-1 my-2 grid grid-rows-2 gap-2 h-full">
        <PhotoSlot
          slotId={`${pageNum}_0`}
          photo={getPhoto(0)}
          isSelected={selectedSlot === `${pageNum}_0`}
          onSelect={onSelectSlot}
          onRemove={onRemovePhoto}
          label="Top Slot"
        />
        <PhotoSlot
          slotId={`${pageNum}_1`}
          photo={getPhoto(1)}
          isSelected={selectedSlot === `${pageNum}_1`}
          onSelect={onSelectSlot}
          onRemove={onRemovePhoto}
          label="Bottom Slot"
        />
      </div>
    );
  }

  if (layout === '2-photo-h') {
    return (
      <div className="flex-1 my-2 grid grid-cols-2 gap-2 h-full">
        <PhotoSlot
          slotId={`${pageNum}_0`}
          photo={getPhoto(0)}
          isSelected={selectedSlot === `${pageNum}_0`}
          onSelect={onSelectSlot}
          onRemove={onRemovePhoto}
          label="Left Slot"
        />
        <PhotoSlot
          slotId={`${pageNum}_1`}
          photo={getPhoto(1)}
          isSelected={selectedSlot === `${pageNum}_1`}
          onSelect={onSelectSlot}
          onRemove={onRemovePhoto}
          label="Right Slot"
        />
      </div>
    );
  }

  if (layout === '3-photo') {
    return (
      <div className="flex-1 my-2 grid grid-cols-2 gap-2 h-full">
        <PhotoSlot
          slotId={`${pageNum}_0`}
          photo={getPhoto(0)}
          isSelected={selectedSlot === `${pageNum}_0`}
          onSelect={onSelectSlot}
          onRemove={onRemovePhoto}
          label="Featured Slot"
        />
        <div className="grid grid-rows-2 gap-2">
          <PhotoSlot
            slotId={`${pageNum}_1`}
            photo={getPhoto(1)}
            isSelected={selectedSlot === `${pageNum}_1`}
            onSelect={onSelectSlot}
            onRemove={onRemovePhoto}
            label="Slot 2"
          />
          <PhotoSlot
            slotId={`${pageNum}_2`}
            photo={getPhoto(2)}
            isSelected={selectedSlot === `${pageNum}_2`}
            onSelect={onSelectSlot}
            onRemove={onRemovePhoto}
            label="Slot 3"
          />
        </div>
      </div>
    );
  }

  if (layout === '4-photo') {
    return (
      <div className="flex-1 my-2 grid grid-cols-2 grid-rows-2 gap-2 h-full">
        {[0, 1, 2, 3].map((idx) => (
          <PhotoSlot
            key={idx}
            slotId={`${pageNum}_${idx}`}
            photo={getPhoto(idx)}
            isSelected={selectedSlot === `${pageNum}_${idx}`}
            onSelect={onSelectSlot}
            onRemove={onRemovePhoto}
            label={`Slot ${idx + 1}`}
          />
        ))}
      </div>
    );
  }

  // Default: '1-photo'
  const singlePhoto = slotPhotos[`${pageNum}_0`] || slotPhotos[`${pageNum}`] || pagePhotos[pageNum] || null;
  return (
    <div className="flex-1 my-3 h-full">
      <PhotoSlot
        slotId={`${pageNum}`}
        photo={singlePhoto}
        isSelected={selectedSlot === `${pageNum}` || selectedSlot === `${pageNum}_0`}
        onSelect={onSelectSlot}
        onRemove={onRemovePhoto}
        label={`Page ${pageNum} Photo`}
      />
    </div>
  );
}

export default function BookCanvas() {
  const {
    pageCount,
    currentSpreadIndex,
    setCurrentSpreadIndex,
    pagePhotos,
    slotPhotos,
    pageLayouts,
    pageBackgrounds,
    coverConfig,
    selectedSlot,
    setSelectedSlot,
    assignPhotoToSlot,
    template,
    bookConfig,
  } = useEditorStore();

  const totalSpreads = Math.ceil(pageCount / 2);
  const isCover = currentSpreadIndex === 0;
  const isBack = currentSpreadIndex === totalSpreads + 1;

  const leftPageNum = (currentSpreadIndex - 1) * 2 + 1;
  const rightPageNum = (currentSpreadIndex - 1) * 2 + 2;

  const coverPhoto: Photo | null =
    slotPhotos['0'] ||
    pagePhotos[0] ||
    (template?.coverImage ? { id: 'cover', url: template.coverImage, usedCount: 1, flagged: false } : null);

  const coverBg = coverConfig.backgroundColor || template?.coverColor || '#F8BAC7';
  const spineText = coverConfig.spineText || template?.spineText || 'PERFECTPIC';
  const coverTitle = coverConfig.title || template?.displayName || template?.title || 'Our Travel Journey';
  const coverSubtitle = coverConfig.subtitle || template?.tagline || 'your journeys, perfectly told';

  // Foil finish gradient styling
  const foilClasses = {
    gold: 'bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-100 text-transparent bg-clip-text drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]',
    silver: 'bg-gradient-to-r from-slate-100 via-slate-300 to-gray-100 text-transparent bg-clip-text drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]',
    'rose-gold': 'bg-gradient-to-r from-rose-200 via-rose-300 to-amber-100 text-transparent bg-clip-text drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]',
    black: 'text-noir-950 drop-shadow-[0_1px_1px_rgba(255,255,255,0.2)]',
  }[coverConfig.foilColor || 'gold'];

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

  const leftLayout = pageLayouts[leftPageNum] || '1-photo';
  const rightLayout = pageLayouts[rightPageNum] || '1-photo';
  const leftBg = pageBackgrounds[leftPageNum] || '#FFFFFF';
  const rightBg = pageBackgrounds[rightPageNum] || '#FFFFFF';

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-5xl select-none">
      {/* Top Spread Info & Status */}
      <div className="flex items-center justify-between w-full max-w-4xl px-4 mb-4 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-noir-900 uppercase tracking-widest text-[11px]">
            {isCover ? 'Front Cover' : isBack ? 'Back Cover' : `Pages ${leftPageNum} – ${rightPageNum} of ${pageCount}`}
          </span>
          <span className="text-noir-400">•</span>
          <span className="text-noir-500 font-medium">
            {isCover
              ? `Foil Finish: ${coverConfig.foilColor?.toUpperCase() || 'GOLD'}`
              : `Layouts: P${leftPageNum} (${leftLayout}), P${rightPageNum} (${rightLayout})`}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] text-noir-500">
            Target Slot: <strong className="text-noir-950 font-mono">{selectedSlot || 'None'}</strong>
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
            onClick={() => setSelectedSlot('0')}
            className={`relative w-[420px] h-[520px] rounded-r-md shadow-luxury-xl border border-black/10 flex overflow-hidden cursor-pointer transition-all duration-300 ${
              selectedSlot === '0' ? 'ring-2 ring-foil-gold ring-offset-4' : ''
            }`}
            style={{ backgroundColor: coverBg }}
          >
            {/* Book Spine */}
            <div className="w-10 bg-black/15 flex items-center justify-center border-r border-black/15 relative overflow-hidden shrink-0">
              <span className="text-[10px] font-bold text-white tracking-[0.3em] uppercase transform -rotate-90 whitespace-nowrap drop-shadow-sm font-mono">
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
                <h2 className={`font-serif text-2xl font-bold uppercase tracking-wider ${foilClasses}`}>
                  {coverTitle}
                </h2>
                <p className="text-xs text-white/80 italic font-serif">
                  {coverSubtitle}
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
        {/* 2. OPEN TWO-PAGE SPREAD VIEW (Dynamic Multi-Photo Layouts) */}
        {/* ======================================================== */}
        {!isCover && !isBack && (
          <div className="relative shadow-luxury-2xl bg-white rounded-sm flex w-[840px] h-[480px] border border-cream-300 overflow-hidden">
            {/* ----------------- LEFT PAGE ----------------- */}
            <div
              onClick={() => setSelectedSlot(leftPageNum.toString())}
              className={`flex-1 border-r border-black/10 relative p-8 md:p-10 flex flex-col justify-between cursor-pointer transition-all ${
                selectedSlot?.startsWith(leftPageNum.toString())
                  ? 'ring-2 ring-inset ring-foil-gold'
                  : 'hover:bg-cream-50/30'
              }`}
              style={{ backgroundColor: leftBg }}
            >
              {/* Top Page Header / Number */}
              <div className="flex justify-between items-center text-[10px] text-noir-400 uppercase tracking-widest font-mono">
                <span>Page {leftPageNum} ({leftLayout})</span>
                {selectedSlot?.startsWith(leftPageNum.toString()) && (
                  <span className="inline-flex items-center gap-1 text-foil-gold font-bold">
                    <Check size={12} /> Active Page
                  </span>
                )}
              </div>

              {/* Dynamic Photo Slot Grid for Left Page */}
              <RenderPageSlots
                pageNum={leftPageNum}
                layout={leftLayout}
                selectedSlot={selectedSlot}
                onSelectSlot={(id) => setSelectedSlot(id)}
                slotPhotos={slotPhotos}
                pagePhotos={pagePhotos}
                onRemovePhoto={(id) => assignPhotoToSlot(id, null)}
              />

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
              onClick={() => setSelectedSlot(rightPageNum.toString())}
              className={`flex-1 relative p-8 md:p-10 flex flex-col justify-between cursor-pointer transition-all ${
                selectedSlot?.startsWith(rightPageNum.toString())
                  ? 'ring-2 ring-inset ring-foil-gold'
                  : 'hover:bg-cream-50/30'
              }`}
              style={{ backgroundColor: rightBg }}
            >
              {/* Top Page Header / Number */}
              <div className="flex justify-between items-center text-[10px] text-noir-400 uppercase tracking-widest font-mono">
                {selectedSlot?.startsWith(rightPageNum.toString()) ? (
                  <span className="inline-flex items-center gap-1 text-foil-gold font-bold">
                    <Check size={12} /> Active Page
                  </span>
                ) : <span />}
                <span>Page {rightPageNum} ({rightLayout})</span>
              </div>

              {/* Dynamic Photo Slot Grid for Right Page */}
              <RenderPageSlots
                pageNum={rightPageNum}
                layout={rightLayout}
                selectedSlot={selectedSlot}
                onSelectSlot={(id) => setSelectedSlot(id)}
                slotPhotos={slotPhotos}
                pagePhotos={pagePhotos}
                onRemovePhoto={(id) => assignPhotoToSlot(id, null)}
              />

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
