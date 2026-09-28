'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, BookOpen, Sparkles, Layers } from 'lucide-react';

interface BookFlipPreviewProps {
  currentSpread: number; // 0 = Cover, 1 = Pages 1-2, ..., totalSpreads + 1 = Back
  totalSpreads: number;
  onSpreadChange: (spread: number) => void;
  pageCount: number;
  pagePhotos: Record<number, any>;
  samplePhotos: string[];
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
  pagePhotos,
  samplePhotos,
  bookTitle,
  seriesLabel = 'the travel series',
  subtitle = 'Curated Photobook Edition',
  coverImage,
  coverColor = '#F8BAC7',
  dimensions = '8.25" × 8.25"',
  zoomLevel = 1,
}: BookFlipPreviewProps) {
  // Get photo for a specific page number
  const getPhotoForPage = (pageNumber: number): string => {
    if (pagePhotos && pagePhotos[pageNumber]?.url) {
      return pagePhotos[pageNumber].url;
    }
    // Fallback to sample photos cycling through
    if (samplePhotos && samplePhotos.length > 0) {
      const index = (pageNumber - 1) % samplePhotos.length;
      return samplePhotos[index] || samplePhotos[0]!;
    }
    return 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop';
  };

  const leftPageNumber = (currentSpread - 1) * 2 + 1;
  const rightPageNumber = (currentSpread - 1) * 2 + 2;

  const leftPhotoUrl = getPhotoForPage(leftPageNumber);
  const rightPhotoUrl = getPhotoForPage(rightPageNumber);
  const effectiveCover = coverImage || samplePhotos[0] || 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop';

  return (
    <div 
      className="relative flex items-center justify-center transition-transform duration-300 select-none"
      style={{ transform: `scale(${zoomLevel})` }}
    >
      <AnimatePresence mode="wait">
        {/* SPREAD 0: FRONT COVER */}
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
            {/* 3D Hardcover Book Container */}
            <div 
              className="relative rounded-r-md shadow-2xl shadow-black/80 flex flex-col justify-between overflow-hidden border-r-4 border-b-4 border-black/40 transition-transform duration-500 group-hover:scale-[1.02]"
              style={{
                width: '460px',
                height: '460px',
                backgroundColor: coverColor || '#F8BAC7',
              }}
            >
              {/* Spine edge highlight and shadow */}
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/40 via-black/10 to-transparent z-20 pointer-events-none" />
              <div className="absolute left-7 top-0 bottom-0 w-1 bg-white/20 z-20 pointer-events-none" />

              {/* Cover Header */}
              <div className="p-8 z-10">
                <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-noir-900/70 font-semibold block mb-1">
                  {seriesLabel}
                </span>
                <h2 className="font-serif text-3xl font-bold text-noir-950 tracking-wide uppercase leading-tight drop-shadow-xs">
                  {bookTitle}
                </h2>
                <p className="text-xs text-noir-800/80 font-sans tracking-wider mt-1">
                  {subtitle}
                </p>
              </div>

              {/* Cover Center Archival Photo */}
              <div className="mx-8 mb-4 flex-1 rounded-sm overflow-hidden shadow-lg border border-black/15 bg-white relative">
                <img
                  src={effectiveCover}
                  alt={bookTitle}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
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

        {/* SPREAD 1 to N: INSIDE LAY-FLAT DOUBLE PAGE SPREAD */}
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
            {/* LEFT PAGE */}
            <div className="flex-1 p-8 flex flex-col justify-between relative bg-white border-r border-noir-200/50">
              {/* Top Page Header / Location */}
              <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-widest text-noir-400">
                <span>{bookTitle}</span>
                <span>Vol. I</span>
              </div>

              {/* Center Photo Area with Archival Gallery Margins (Strictly 1 photo per page) */}
              <div className="flex-1 my-3 flex items-center justify-center">
                <div className="w-full h-[330px] rounded-xs overflow-hidden shadow-md border border-noir-200/60 bg-cream-100 relative group">
                  <img
                    src={leftPhotoUrl}
                    alt={`Page ${leftPageNumber}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-xs rounded-xs text-[9px] font-mono text-cream-100 uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                    12K Indigo Press • 300 DPI
                  </div>
                </div>
              </div>

              {/* Page Number Footer */}
              <div className="flex justify-between items-center text-[11px] font-mono text-noir-400">
                <span>{leftPageNumber < 10 ? `0${leftPageNumber}` : leftPageNumber}</span>
                <span className="text-[9px] uppercase tracking-wider text-noir-300">Archival 200 GSM</span>
              </div>
            </div>

            {/* CENTER 180° LAY-FLAT BINDING SEAM (Zero Gutter Loss Shadow Effect) */}
            <div className="w-8 absolute left-1/2 -ml-4 inset-y-0 bg-gradient-to-r from-black/25 via-transparent to-black/25 pointer-events-none z-20" />
            <div className="w-px absolute left-1/2 inset-y-0 bg-black/30 pointer-events-none z-20" />

            {/* RIGHT PAGE */}
            <div className="flex-1 p-8 flex flex-col justify-between relative bg-white">
              {/* Top Page Header */}
              <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-widest text-noir-400">
                <span>{subtitle}</span>
                <span>Heirloom Series</span>
              </div>

              {/* Center Photo Area with Archival Gallery Margins (Strictly 1 photo per page) */}
              <div className="flex-1 my-3 flex items-center justify-center">
                <div className="w-full h-[330px] rounded-xs overflow-hidden shadow-md border border-noir-200/60 bg-cream-100 relative group">
                  <img
                    src={rightPhotoUrl}
                    alt={`Page ${rightPageNumber}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 backdrop-blur-xs rounded-xs text-[9px] font-mono text-cream-100 uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                    Archival Matte Lay-Flat
                  </div>
                </div>
              </div>

              {/* Page Number Footer */}
              <div className="flex justify-between items-center text-[11px] font-mono text-noir-400">
                <span className="text-[9px] uppercase tracking-wider text-noir-300">PerfectPic Signature</span>
                <span>{rightPageNumber < 10 ? `0${rightPageNumber}` : rightPageNumber}</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* SPREAD N+1: BACK COVER */}
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
                backgroundColor: coverColor || '#F8BAC7',
              }}
            >
              {/* Spine edge shadow on right side for back cover */}
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black/40 via-black/10 to-transparent z-20 pointer-events-none" />

              <div className="text-center pt-8 z-10">
                <p className="text-xs uppercase tracking-[0.3em] font-mono text-noir-800">
                  {bookTitle}
                </p>
                <div className="w-12 h-px bg-noir-900/30 mx-auto my-3" />
                <p className="text-[11px] text-noir-700/80 font-serif italic max-w-[260px] mx-auto">
                  "Every journey deserves a permanent place in print."
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
