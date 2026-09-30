'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, BookOpen, Sparkles, Layers } from 'lucide-react';
import { Photo, PageLayout, CoverConfig, SlotCropConfig } from '@/stores/useEditorStore';

interface BookFlipPreviewProps {
  currentSpread: number; // 0 = Cover, 1 = Pages 1-2, ..., totalSpreads + 1 = Back
  totalSpreads: number;
  onSpreadChange: (spread: number) => void;
  pageCount: number;
  pagePhotos?: Record<number, Photo | null>;
  slotPhotos?: Record<string, Photo | null>;
  slotCrops?: Record<string, SlotCropConfig>;
  pageLayouts?: Record<number, PageLayout>;
  pageBackgrounds?: Record<number, string>;
  coverConfig?: CoverConfig;
  samplePhotos?: string[];
  bookTitle: string;
  seriesLabel?: string;
  subtitle?: string;
  coverImage?: string;
  coverColor?: string;
  dimensions?: string;
  zoomLevel?: number;
}

export default function BookFlipPreview({
  currentSpread,
  totalSpreads,
  onSpreadChange,
  pageCount,
  pagePhotos = {},
  slotPhotos = {},
  slotCrops = {},
  pageLayouts = {},
  pageBackgrounds = {},
  coverConfig,
  samplePhotos = [],
  bookTitle,
  seriesLabel = 'the travel series',
  subtitle = 'Curated Photobook Edition',
  coverImage,
  coverColor = '#F8BAC7',
  dimensions = '8.25" × 8.25"',
  zoomLevel = 1,
}: BookFlipPreviewProps) {
  // Foil gradient styling for the cover
  const foilColor = coverConfig?.foilColor || 'gold';
  const foilClasses = {
    gold: 'bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-100 text-transparent bg-clip-text drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]',
    silver: 'bg-gradient-to-r from-slate-100 via-slate-300 to-gray-100 text-transparent bg-clip-text drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]',
    'rose-gold': 'bg-gradient-to-r from-rose-200 via-rose-300 to-amber-100 text-transparent bg-clip-text drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]',
    black: 'text-noir-950 drop-shadow-[0_1px_1px_rgba(255,255,255,0.2)]',
  }[foilColor];

  const displayTitle = coverConfig?.title || bookTitle;
  const displaySubtitle = coverConfig?.subtitle || subtitle;
  const displaySpine = coverConfig?.spineText || 'PERFECTPIC ARCHIVAL';
  const effectiveCoverBg = coverConfig?.backgroundColor || coverColor;

  // Retrieve photo for a specific slot, with deterministic fallback
  const getSlotPhotoUrl = (pageNum: number, subIndex: number): string => {
    const slotId = `${pageNum}_${subIndex}`;
    if (slotPhotos && slotPhotos[slotId]?.url) {
      return slotPhotos[slotId]!.url;
    }
    if (subIndex === 0 && pagePhotos && pagePhotos[pageNum]?.url) {
      return pagePhotos[pageNum]!.url;
    }
    if (samplePhotos && samplePhotos.length > 0) {
      const idx = (pageNum * 3 + subIndex) % samplePhotos.length;
      return samplePhotos[idx] || samplePhotos[0]!;
    }
    return 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop';
  };

  // Retrieve panoramic photo spanning both pages
  const getPanoramicPhotoUrl = (spreadIndex: number, leftPageNum: number): string => {
    const spreadSlotId = `spread_${spreadIndex}`;
    if (slotPhotos && slotPhotos[spreadSlotId]?.url) {
      return slotPhotos[spreadSlotId]!.url;
    }
    if (slotPhotos && slotPhotos[`${leftPageNum}_0`]?.url) {
      return slotPhotos[`${leftPageNum}_0`]!.url;
    }
    if (pagePhotos && pagePhotos[leftPageNum]?.url) {
      return pagePhotos[leftPageNum]!.url;
    }
    if (samplePhotos && samplePhotos.length > 0) {
      const idx = (spreadIndex - 1) % samplePhotos.length;
      return samplePhotos[idx] || samplePhotos[0]!;
    }
    return 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1600&auto=format&fit=crop';
  };

  const leftPageNumber = (currentSpread - 1) * 2 + 1;
  const rightPageNumber = (currentSpread - 1) * 2 + 2;

  const leftLayout: PageLayout = pageLayouts[leftPageNumber] || '1-photo';
  const rightLayout: PageLayout = pageLayouts[rightPageNumber] || '1-photo';
  const leftBg = pageBackgrounds[leftPageNumber] || '#FFFFFF';
  const rightBg = pageBackgrounds[rightPageNumber] || '#FFFFFF';

  const isPanoramicSpread = leftLayout === '2-page-panoramic' || rightLayout === '2-page-panoramic';

  const effectiveCover =
    slotPhotos['0']?.url ||
    pagePhotos[0]?.url ||
    coverImage ||
    samplePhotos[0] ||
    'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop';

  // Sub-component to render photo slot inside the 3D preview
  const RenderPreviewSlot = ({
    url,
    label,
    crop,
  }: {
    url: string;
    label?: string;
    crop?: SlotCropConfig;
  }) => {
    const focalX = crop?.x ?? 50;
    const focalY = crop?.y ?? 50;
    const zoom = crop?.zoom ?? 1;

    return (
      <div className="w-full h-full rounded-xs overflow-hidden shadow-sm border border-noir-200/60 bg-cream-100 relative group">
        <img
          src={url}
          alt={label || 'Photo'}
          crossOrigin="anonymous"
          style={{
            objectFit: 'cover',
            objectPosition: `${focalX}% ${focalY}%`,
            transform: `scale(${zoom})`,
            transformOrigin: `${focalX}% ${focalY}%`,
          }}
          className="w-full h-full transition-transform duration-300"
        />
        <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 bg-black/60 backdrop-blur-xs rounded-xs text-[8px] font-mono text-cream-100 uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          12K Indigo • 300 DPI
        </div>
      </div>
    );
  };

  // Render multi-photo layouts matching the Studio Editor design
  const renderLayoutContent = (pageNum: number, layout: PageLayout) => {
    const getCrop = (subIndex: number) =>
      slotCrops[`${pageNum}_${subIndex}`] || (subIndex === 0 ? slotCrops[`${pageNum}`] : undefined);

    switch (layout) {
      case '1-photo-full': {
        const url = getSlotPhotoUrl(pageNum, 0);
        return (
          <div className="flex-1 -mx-8 -my-6 md:-mx-10 md:-my-8 h-[calc(100%+3rem)] md:h-[calc(100%+4rem)] overflow-hidden">
            <RenderPreviewSlot url={url} label={`Full Bleed Page ${pageNum}`} crop={getCrop(0)} />
          </div>
        );
      }

      case '2-photo-v': {
        return (
          <div className="flex-1 my-2 grid grid-rows-2 gap-2 h-full">
            <RenderPreviewSlot url={getSlotPhotoUrl(pageNum, 0)} label="Top Slot" crop={getCrop(0)} />
            <RenderPreviewSlot url={getSlotPhotoUrl(pageNum, 1)} label="Bottom Slot" crop={getCrop(1)} />
          </div>
        );
      }

      case '2-photo-h': {
        return (
          <div className="flex-1 my-2 grid grid-cols-2 gap-2 h-full">
            <RenderPreviewSlot url={getSlotPhotoUrl(pageNum, 0)} label="Left Slot" crop={getCrop(0)} />
            <RenderPreviewSlot url={getSlotPhotoUrl(pageNum, 1)} label="Right Slot" crop={getCrop(1)} />
          </div>
        );
      }

      case '3-photo': {
        return (
          <div className="flex-1 my-2 grid grid-cols-2 gap-2 h-full">
            <RenderPreviewSlot url={getSlotPhotoUrl(pageNum, 0)} label="Hero Slot" crop={getCrop(0)} />
            <div className="grid grid-rows-2 gap-2 h-full">
              <RenderPreviewSlot url={getSlotPhotoUrl(pageNum, 1)} label="Top Slot" crop={getCrop(1)} />
              <RenderPreviewSlot url={getSlotPhotoUrl(pageNum, 2)} label="Bottom Slot" crop={getCrop(2)} />
            </div>
          </div>
        );
      }

      case '4-photo': {
        return (
          <div className="flex-1 my-2 grid grid-cols-2 grid-rows-2 gap-2 h-full">
            {[0, 1, 2, 3].map((idx) => (
              <RenderPreviewSlot
                key={idx}
                url={getSlotPhotoUrl(pageNum, idx)}
                label={`Slot ${idx + 1}`}
                crop={getCrop(idx)}
              />
            ))}
          </div>
        );
      }

      case '6-photo-grid': {
        return (
          <div className="flex-1 my-2 grid grid-cols-3 grid-rows-2 gap-1.5 h-full">
            {[0, 1, 2, 3, 4, 5].map((idx) => (
              <RenderPreviewSlot
                key={idx}
                url={getSlotPhotoUrl(pageNum, idx)}
                label={`Slot ${idx + 1}`}
                crop={getCrop(idx)}
              />
            ))}
          </div>
        );
      }

      case '1-photo':
      default: {
        const url = getSlotPhotoUrl(pageNum, 0);
        return (
          <div className="flex-1 my-3 flex items-center justify-center h-full">
            <div className="w-full h-[330px] rounded-xs overflow-hidden shadow-md border border-noir-200/60 bg-cream-100 relative group">
              <RenderPreviewSlot url={url} label={`Page ${pageNum}`} crop={getCrop(0)} />
            </div>
          </div>
        );
      }
    }
  };

  return (
    <div 
      className="relative flex items-center justify-center transition-transform duration-300 select-none"
      style={{ transform: `scale(${zoomLevel})` }}
    >
      <AnimatePresence mode="wait">
        {/* ======================================================== */}
        {/* SPREAD 0: FRONT COVER (3D Hardcover Book with Custom Foil & Color) */}
        {/* ======================================================== */}
        {currentSpread === 0 && (
          <motion.div
            key="cover"
            initial={{ opacity: 0, rotateY: -20, scale: 0.95 }}
            animate={{ opacity: 1, rotateY: 0, scale: 1 }}
            exit={{ opacity: 0, rotateY: 20, scale: 0.95 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            onClick={() => onSpreadChange(1)}
            className="cursor-pointer group perspective-1000"
          >
            <div 
              className="relative rounded-r-md shadow-2xl shadow-black/80 flex flex-col justify-between overflow-hidden border-r-4 border-b-4 border-black/40 transition-transform duration-500 group-hover:scale-[1.02]"
              style={{
                width: '460px',
                height: '460px',
                backgroundColor: effectiveCoverBg || '#F8BAC7',
              }}
            >
              {/* Spine edge highlight and realistic 3D shadow */}
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/40 via-black/10 to-transparent z-20 pointer-events-none" />
              <div className="absolute left-7 top-0 bottom-0 w-1 bg-white/20 z-20 pointer-events-none" />

              {/* Cover Header */}
              <div className="p-8 z-10">
                <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-noir-900/70 font-semibold block mb-1">
                  {seriesLabel}
                </span>
                <h2 className={`font-serif text-3xl font-bold tracking-wide uppercase leading-tight ${foilClasses}`}>
                  {displayTitle}
                </h2>
                <p className="text-xs text-noir-800/80 font-sans tracking-wider mt-1">
                  {displaySubtitle}
                </p>
              </div>

              {/* Cover Center Archival Photo */}
              <div className="mx-8 mb-4 flex-1 rounded-sm overflow-hidden shadow-lg border border-black/15 bg-white relative">
                <img
                  src={effectiveCover}
                  alt={displayTitle}
                  crossOrigin="anonymous"
                  style={{
                    objectFit: 'cover',
                    objectPosition: `${slotCrops['0']?.x ?? 50}% ${slotCrops['0']?.y ?? 50}%`,
                    transform: `scale(${slotCrops['0']?.zoom ?? 1})`,
                    transformOrigin: `${slotCrops['0']?.x ?? 50}% ${slotCrops['0']?.y ?? 50}%`,
                  }}
                  className="w-full h-full transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Cover Footer */}
              <div className="px-8 pb-6 flex items-center justify-between text-noir-900/80 z-10">
                <span className="text-[10px] font-mono tracking-widest uppercase">
                  {pageCount} Pages • {dimensions}
                </span>
                <span className="text-[10px] font-mono uppercase tracking-widest text-noir-950 font-bold flex items-center gap-1 group-hover:text-foil-gold transition-colors">
                  Open Book <ChevronRight size={12} />
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* ======================================================== */}
        {/* SPREAD 1 to N: INSIDE LAY-FLAT DOUBLE PAGE SPREAD */}
        {/* ======================================================== */}
        {currentSpread > 0 && currentSpread <= totalSpreads && (
          <motion.div
            key={`spread-${currentSpread}`}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="flex relative shadow-2xl shadow-black/80 rounded-sm bg-[#FAF8F5] overflow-hidden border border-black/20"
            style={{ width: '880px', height: '480px' }}
          >
            {/* OPTION A: 2-PAGE PANORAMIC SPREAD (Continuous Grand Photo Spanning Both Pages) */}
            {isPanoramicSpread ? (
              <div 
                className="w-full h-full p-8 flex flex-col justify-between relative"
                style={{ backgroundColor: leftBg }}
              >
                {/* Top Panoramic Bar */}
                <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-widest text-noir-500 z-30">
                  <span className="font-semibold text-noir-800">{displayTitle} • Panoramic Edition</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-noir-900 text-foil-gold font-bold text-[9px] shadow-sm">
                    180° Layflat Panoramic Spread (Pages {leftPageNumber}–{rightPageNumber})
                  </span>
                  <span className="text-noir-500">Vol. I</span>
                </div>

                {/* Grand Panoramic Photo Container */}
                <div className="flex-1 my-3 relative overflow-hidden rounded-xs shadow-md border border-noir-300/60 bg-cream-100 group">
                  <img
                    src={getPanoramicPhotoUrl(currentSpread, leftPageNumber)}
                    alt={`Panoramic Spread ${leftPageNumber}-${rightPageNumber}`}
                    crossOrigin="anonymous"
                    style={{
                      objectFit: 'cover',
                      objectPosition: `${(slotCrops[`spread_${currentSpread}`]?.x ?? slotCrops[`${leftPageNumber}_0`]?.x ?? slotCrops[`${leftPageNumber}`]?.x ?? 50)}% ${(slotCrops[`spread_${currentSpread}`]?.y ?? slotCrops[`${leftPageNumber}_0`]?.y ?? slotCrops[`${leftPageNumber}`]?.y ?? 50)}%`,
                      transform: `scale(${slotCrops[`spread_${currentSpread}`]?.zoom ?? slotCrops[`${leftPageNumber}_0`]?.zoom ?? slotCrops[`${leftPageNumber}`]?.zoom ?? 1})`,
                      transformOrigin: `${(slotCrops[`spread_${currentSpread}`]?.x ?? slotCrops[`${leftPageNumber}_0`]?.x ?? slotCrops[`${leftPageNumber}`]?.x ?? 50)}% ${(slotCrops[`spread_${currentSpread}`]?.y ?? slotCrops[`${leftPageNumber}_0`]?.y ?? slotCrops[`${leftPageNumber}`]?.y ?? 50)}%`,
                    }}
                    className="w-full h-full transition-transform duration-500"
                  />
                  <div className="absolute bottom-2 left-3 px-2 py-0.5 bg-black/60 backdrop-blur-xs rounded-xs text-[9px] font-mono text-cream-100 uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                    12K Ultra-HD Panoramic • Zero Gutter Loss
                  </div>
                </div>

                {/* Center 180° Layflat Seam & Fold Line */}
                <div className="w-8 absolute left-1/2 -ml-4 inset-y-0 bg-gradient-to-r from-black/20 via-transparent to-black/20 pointer-events-none z-20" />
                <div className="w-px absolute left-1/2 inset-y-0 bg-black/25 pointer-events-none z-20" />

                {/* Bottom Footer */}
                <div className="flex justify-between items-center text-[11px] font-mono text-noir-500 z-30">
                  <span>{leftPageNumber < 10 ? `0${leftPageNumber}` : leftPageNumber}</span>
                  <span className="text-[9px] uppercase tracking-wider text-noir-400 font-serif">
                    Archival 200 GSM • Continuous Layflat Spread
                  </span>
                  <span>{rightPageNumber < 10 ? `0${rightPageNumber}` : rightPageNumber}</span>
                </div>
              </div>
            ) : (
              /* OPTION B: SEPARATE PAGES WITH MULTI-PHOTO EDITORIAL LAYOUTS */
              <>
                {/* ----------------- LEFT PAGE ----------------- */}
                <div 
                  className="flex-1 p-8 flex flex-col justify-between relative border-r border-noir-200/50"
                  style={{ backgroundColor: leftBg }}
                >
                  {/* Top Page Header */}
                  <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-widest text-noir-400 mb-1">
                    <span className="truncate max-w-[180px]">{displayTitle}</span>
                    <span className="text-noir-500 font-bold capitalize">
                      {leftLayout === '1-photo' ? 'Classic' : leftLayout}
                    </span>
                  </div>

                  {/* Dynamic Photo Slot Layout */}
                  <div className="flex-1 relative flex flex-col justify-center overflow-hidden">
                    {renderLayoutContent(leftPageNumber, leftLayout)}
                  </div>

                  {/* Page Number Footer */}
                  <div className="flex justify-between items-center text-[11px] font-mono text-noir-400 mt-1">
                    <span>{leftPageNumber < 10 ? `0${leftPageNumber}` : leftPageNumber}</span>
                    <span className="text-[9px] uppercase tracking-wider text-noir-300">Archival 200 GSM</span>
                  </div>
                </div>

                {/* CENTER 180° LAY-FLAT BINDING SEAM (Zero Gutter Loss Shadow Effect) */}
                <div className="w-8 absolute left-1/2 -ml-4 inset-y-0 bg-gradient-to-r from-black/25 via-transparent to-black/25 pointer-events-none z-20" />
                <div className="w-px absolute left-1/2 inset-y-0 bg-black/30 pointer-events-none z-20" />

                {/* ----------------- RIGHT PAGE ----------------- */}
                <div 
                  className="flex-1 p-8 flex flex-col justify-between relative"
                  style={{ backgroundColor: rightBg }}
                >
                  {/* Top Page Header */}
                  <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-widest text-noir-400 mb-1">
                    <span className="text-noir-500 font-bold capitalize">
                      {rightLayout === '1-photo' ? 'Classic' : rightLayout}
                    </span>
                    <span className="truncate max-w-[180px]">{displaySubtitle}</span>
                  </div>

                  {/* Dynamic Photo Slot Layout */}
                  <div className="flex-1 relative flex flex-col justify-center overflow-hidden">
                    {renderLayoutContent(rightPageNumber, rightLayout)}
                  </div>

                  {/* Page Number Footer */}
                  <div className="flex justify-between items-center text-[11px] font-mono text-noir-400 mt-1">
                    <span className="text-[9px] uppercase tracking-wider text-noir-300">PerfectPic Signature</span>
                    <span>{rightPageNumber < 10 ? `0${rightPageNumber}` : rightPageNumber}</span>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* ======================================================== */}
        {/* SPREAD N+1: BACK COVER */}
        {/* ======================================================== */}
        {currentSpread > totalSpreads && (
          <motion.div
            key="back"
            initial={{ opacity: 0, rotateY: 20, scale: 0.95 }}
            animate={{ opacity: 1, rotateY: 0, scale: 1 }}
            exit={{ opacity: 0, rotateY: -20, scale: 0.95 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            onClick={() => onSpreadChange(0)}
            className="cursor-pointer group perspective-1000"
          >
            <div 
              className="relative rounded-l-md shadow-2xl shadow-black/80 flex flex-col justify-between p-10 overflow-hidden border-l-4 border-b-4 border-black/40 text-noir-950 transition-transform duration-500 group-hover:scale-[1.02]"
              style={{
                width: '460px',
                height: '460px',
                backgroundColor: effectiveCoverBg || '#F8BAC7',
              }}
            >
              {/* Spine edge shadow on right side for back cover */}
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black/40 via-black/10 to-transparent z-20 pointer-events-none" />

              <div className="text-center pt-8 z-10">
                <p className={`text-xs uppercase tracking-[0.3em] font-mono ${foilClasses}`}>
                  {displayTitle}
                </p>
                <div className="w-12 h-px bg-noir-900/30 mx-auto my-3" />
                <p className="text-[11px] text-noir-700/80 font-serif italic max-w-[260px] mx-auto">
                  &ldquo;Every journey deserves a permanent place in print.&rdquo;
                </p>
              </div>

              <div className="text-center z-10 my-auto">
                <div className="w-16 h-16 rounded-full border-2 border-noir-900/30 mx-auto flex items-center justify-center text-noir-900/70 mb-3">
                  <BookOpen size={24} />
                </div>
                <p className="font-mono text-[10px] tracking-widest uppercase text-noir-800 font-bold">
                  PERFECTPIC ARCHIVAL PRESS
                </p>
                <p className="text-[9px] text-noir-600 font-mono mt-0.5">
                  100% Tear-Resistant Synthetic Paper • Made in India
                </p>
              </div>

              <div className="flex justify-between items-end border-t border-noir-900/15 pt-4 z-10">
                <div className="space-y-0.5">
                  <div className="h-6 w-24 bg-noir-900/20 rounded-xs flex items-center justify-center font-mono text-[9px] text-noir-900/60 tracking-wider">
                    ISBN-978-PP-26
                  </div>
                  <span className="text-[9px] font-mono text-noir-600 block">PAN-INDIA INSURED</span>
                </div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-noir-950 font-bold flex items-center gap-1 group-hover:text-foil-gold transition-colors">
                  <ChevronLeft size={12} /> Return to Cover
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
