'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useEditorStore, Photo, PageLayout, SlotCropConfig } from '@/stores/useEditorStore';
import { 
  ChevronLeft, 
  ChevronRight, 
  Image as ImageIcon, 
  Trash2, 
  Check, 
  Sparkles, 
  Crop,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import PortionCutModal from './PortionCutModal';
import { getSpineMetrics } from '@/lib/spineCalculator';

interface SlotProps {
  slotId: string;
  photo: Photo | null;
  isSelected: boolean;
  onSelect: (slotId: string) => void;
  onRemove: (slotId: string) => void;
  onOpenCutModal?: (slotId: string, photo: Photo, label?: string) => void;
  crop?: SlotCropConfig;
  label?: string;
  bookSize?: string;
  slotWidthFraction?: number;
}

function PhotoSlot({
  slotId,
  photo,
  isSelected,
  onSelect,
  onRemove,
  onOpenCutModal,
  crop,
  label,
  bookSize,
  slotWidthFraction = 1,
}: SlotProps) {
  const focalX = crop?.x ?? 50;
  const focalY = crop?.y ?? 50;
  const zoom = crop?.zoom ?? 1;

  // Track image natural dimensions for printed DPI calculation
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);

  const isLargeBook = (bookSize || '').includes('10');
  const baseInches = isLargeBook ? 10 : 8.25;
  const physicalWidthInches = Math.max(1.8, baseInches * slotWidthFraction);
  const dpi = naturalSize ? Math.round(naturalSize.width / physicalWidthInches) : null;
  const isUltraHD = dpi !== null && dpi >= 300;
  const isGoodQuality = dpi !== null && dpi >= 180 && dpi < 300;
  const isLowRes = dpi !== null && dpi < 180;

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
            crossOrigin="anonymous"
            onLoad={(e) => {
              const img = e.currentTarget;
              if (img.naturalWidth && img.naturalHeight) {
                setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
              }
            }}
            style={{
              objectFit: 'cover',
              objectPosition: `${focalX}% ${focalY}%`,
              transform: `scale(${zoom})`,
              transformOrigin: `${focalX}% ${focalY}%`,
            }}
            className="w-full h-full transition-transform duration-300"
          />

          {/* Live DPI Resolution Quality Badge */}
          {dpi !== null && (
            <div className="absolute top-1.5 left-1.5 z-20 pointer-events-auto">
              {isUltraHD && (
                <span
                  className="px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 shadow-sm flex items-center gap-1 backdrop-blur-xs"
                  title={`Crisp Print Quality: ${naturalSize?.width}×${naturalSize?.height}px produces ${dpi} DPI (exceeds 300 DPI press standard)`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>300+ DPI (HD)</span>
                </span>
              )}
              {isGoodQuality && (
                <span
                  className="px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold bg-amber-950/90 text-amber-300 border border-amber-500/50 shadow-sm flex items-center gap-1 backdrop-blur-xs"
                  title={`Good Quality: ${naturalSize?.width}×${naturalSize?.height}px produces ${dpi} DPI (recommended range: 180-300 DPI)`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  <span>{dpi} DPI (Good)</span>
                </span>
              )}
              {isLowRes && (
                <span
                  className="px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold bg-rose-950/95 text-rose-200 border border-rose-500/80 shadow-md flex items-center gap-1 backdrop-blur-xs animate-pulse"
                  title={`Low Resolution Alert: ${naturalSize?.width}×${naturalSize?.height}px produces only ${dpi} DPI. May appear grainy or blurry when printed. Recommended: 1500px+ width.`}
                >
                  <AlertTriangle className="w-2.5 h-2.5 text-rose-400" />
                  <span>⚠️ {dpi} DPI (Blurry Risk)</span>
                </span>
              )}
            </div>
          )}

          <div className={`absolute inset-0 bg-black/45 transition-opacity flex items-center justify-center gap-1.5 p-1 z-30 ${
            isSelected ? 'opacity-100 pointer-events-auto' : 'opacity-0 group-hover:opacity-100'
          }`}>
            {onOpenCutModal && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenCutModal(slotId, photo, label);
                }}
                className="px-2 py-1 bg-white/95 text-noir-900 rounded-sm text-[10px] font-semibold hover:bg-white flex items-center gap-1 shadow-sm transition-all hover:scale-105"
                title="Cut / Choose Portion"
              >
                <Crop size={11} className="text-foil-gold" />
                <span>Cut / Portion</span>
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(slotId);
              }}
              className="px-2 py-1 bg-red-600/90 text-white rounded-sm text-[10px] font-semibold hover:bg-red-700 flex items-center gap-1 shadow-sm transition-all hover:scale-105"
              title="Remove photo"
            >
              <Trash2 size={11} />
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
  slotCrops,
  pagePhotos,
  onRemovePhoto,
  onOpenCutModal,
  bookSize,
}: {
  pageNum: number;
  layout: PageLayout;
  selectedSlot: string | null;
  onSelectSlot: (slotId: string) => void;
  slotPhotos: Record<string, Photo | null>;
  slotCrops: Record<string, SlotCropConfig>;
  pagePhotos: Record<number, Photo | null>;
  onRemovePhoto: (slotId: string) => void;
  onOpenCutModal?: (slotId: string, photo: Photo, label?: string) => void;
  bookSize?: string;
}) {
  const getPhoto = (subIndex: number) => {
    const slotId = `${pageNum}_${subIndex}`;
    return slotPhotos[slotId] || (subIndex === 0 ? pagePhotos[pageNum] || null : null);
  };

  const getCrop = (slotId: string) => slotCrops[slotId] || { position: 'center', x: 50, y: 50, zoom: 1 };

  if (layout === '2-photo-v') {
    return (
      <div className="flex-1 my-2 grid grid-rows-2 gap-2 h-full">
        <PhotoSlot
          slotId={`${pageNum}_0`}
          photo={getPhoto(0)}
          crop={getCrop(`${pageNum}_0`)}
          isSelected={selectedSlot === `${pageNum}_0`}
          onSelect={onSelectSlot}
          onRemove={onRemovePhoto}
          onOpenCutModal={onOpenCutModal}
          bookSize={bookSize}
          slotWidthFraction={1}
          label="Top Slot"
        />
        <PhotoSlot
          slotId={`${pageNum}_1`}
          photo={getPhoto(1)}
          crop={getCrop(`${pageNum}_1`)}
          isSelected={selectedSlot === `${pageNum}_1`}
          onSelect={onSelectSlot}
          onRemove={onRemovePhoto}
          onOpenCutModal={onOpenCutModal}
          bookSize={bookSize}
          slotWidthFraction={1}
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
          crop={getCrop(`${pageNum}_0`)}
          isSelected={selectedSlot === `${pageNum}_0`}
          onSelect={onSelectSlot}
          onRemove={onRemovePhoto}
          onOpenCutModal={onOpenCutModal}
          bookSize={bookSize}
          slotWidthFraction={0.5}
          label="Left Slot"
        />
        <PhotoSlot
          slotId={`${pageNum}_1`}
          photo={getPhoto(1)}
          crop={getCrop(`${pageNum}_1`)}
          isSelected={selectedSlot === `${pageNum}_1`}
          onSelect={onSelectSlot}
          onRemove={onRemovePhoto}
          onOpenCutModal={onOpenCutModal}
          bookSize={bookSize}
          slotWidthFraction={0.5}
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
          crop={getCrop(`${pageNum}_0`)}
          isSelected={selectedSlot === `${pageNum}_0`}
          onSelect={onSelectSlot}
          onRemove={onRemovePhoto}
          onOpenCutModal={onOpenCutModal}
          bookSize={bookSize}
          slotWidthFraction={0.5}
          label="Featured Slot"
        />
        <div className="grid grid-rows-2 gap-2">
          <PhotoSlot
            slotId={`${pageNum}_1`}
            photo={getPhoto(1)}
            crop={getCrop(`${pageNum}_1`)}
            isSelected={selectedSlot === `${pageNum}_1`}
            onSelect={onSelectSlot}
            onRemove={onRemovePhoto}
            onOpenCutModal={onOpenCutModal}
            bookSize={bookSize}
            slotWidthFraction={0.5}
            label="Slot 2"
          />
          <PhotoSlot
            slotId={`${pageNum}_2`}
            photo={getPhoto(2)}
            crop={getCrop(`${pageNum}_2`)}
            isSelected={selectedSlot === `${pageNum}_2`}
            onSelect={onSelectSlot}
            onRemove={onRemovePhoto}
            onOpenCutModal={onOpenCutModal}
            bookSize={bookSize}
            slotWidthFraction={0.5}
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
            crop={getCrop(`${pageNum}_${idx}`)}
            isSelected={selectedSlot === `${pageNum}_${idx}`}
            onSelect={onSelectSlot}
            onRemove={onRemovePhoto}
            onOpenCutModal={onOpenCutModal}
            bookSize={bookSize}
            slotWidthFraction={0.5}
            label={`Slot ${idx + 1}`}
          />
        ))}
      </div>
    );
  }

  if (layout === '6-photo-grid') {
    return (
      <div className="flex-1 my-2 grid grid-cols-3 grid-rows-2 gap-1.5 h-full">
        {[0, 1, 2, 3, 4, 5].map((idx) => (
          <PhotoSlot
            key={idx}
            slotId={`${pageNum}_${idx}`}
            photo={getPhoto(idx)}
            crop={getCrop(`${pageNum}_${idx}`)}
            isSelected={selectedSlot === `${pageNum}_${idx}`}
            onSelect={onSelectSlot}
            onRemove={onRemovePhoto}
            onOpenCutModal={onOpenCutModal}
            bookSize={bookSize}
            slotWidthFraction={0.33}
            label={`Slot ${idx + 1}`}
          />
        ))}
      </div>
    );
  }

  if (layout === '1-photo-full') {
    const fullPhoto = slotPhotos[`${pageNum}_0`] || slotPhotos[`${pageNum}`] || pagePhotos[pageNum] || null;
    return (
      <div className="flex-1 -mx-8 -my-6 md:-mx-10 md:-my-8 h-[calc(100%+3rem)] md:h-[calc(100%+4rem)]">
        <PhotoSlot
          slotId={`${pageNum}`}
          photo={fullPhoto}
          crop={getCrop(`${pageNum}`) || getCrop(`${pageNum}_0`)}
          isSelected={selectedSlot === `${pageNum}` || selectedSlot === `${pageNum}_0`}
          onSelect={onSelectSlot}
          onRemove={onRemovePhoto}
          onOpenCutModal={onOpenCutModal}
          bookSize={bookSize}
          slotWidthFraction={1}
          label={`Full Bleed Page ${pageNum}`}
        />
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
        crop={getCrop(`${pageNum}`) || getCrop(`${pageNum}_0`)}
        isSelected={selectedSlot === `${pageNum}` || selectedSlot === `${pageNum}_0`}
        onSelect={onSelectSlot}
        onRemove={onRemovePhoto}
        onOpenCutModal={onOpenCutModal}
        bookSize={bookSize}
        slotWidthFraction={1}
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
    slotCrops,
    setSlotCrop,
    pageLayouts,
    pageBackgrounds,
    coverConfig,
    selectedSlot,
    setSelectedSlot,
    assignPhotoToSlot,
    template,
    bookConfig,
  } = useEditorStore();

  const [showGuides, setShowGuides] = useState(true);

  const [cutModalState, setCutModalState] = useState<{
    isOpen: boolean;
    slotId: string;
    photo: Photo | null;
    label?: string;
  }>({
    isOpen: false,
    slotId: '',
    photo: null,
  });

  const handleOpenCutModal = (slotId: string, photo: Photo, label?: string) => {
    setCutModalState({
      isOpen: true,
      slotId,
      photo,
      label,
    });
  };

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
  const spineMetrics = getSpineMetrics(pageCount);
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

  const isPanoramic = !isCover && !isBack && (leftLayout === '2-page-panoramic' || rightLayout === '2-page-panoramic');
  const [mobilePageView, setMobilePageView] = useState<'spread' | 'left' | 'right'>('spread');
  const isSinglePage = !isCover && !isBack && !isPanoramic && (mobilePageView === 'left' || mobilePageView === 'right');
  const baseWidth = isCover || isBack || isSinglePage ? 420 : 840;
  const baseHeight = isCover || isBack ? 520 : 480;

  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.clientWidth;
      const isMobile = window.innerWidth < 768;
      const padding = isMobile ? 16 : 48;
      const availableWidth = Math.max(260, containerWidth - padding);
      const computedScale = Math.min(1, availableWidth / baseWidth);
      setScale(computedScale);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) observer.observe(containerRef.current);

    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, [baseWidth, isCover, isBack, mobilePageView]);

  const renderLeftPage = (isSingle: boolean = false) => (
    <div
      onClick={() => setSelectedSlot(leftPageNum.toString())}
      className={`${
        isSingle
          ? 'w-[420px] h-[480px] shadow-luxury-2xl rounded-sm border border-cream-300'
          : 'flex-1 border-r border-black/10'
      } relative p-6 sm:p-8 md:p-10 flex flex-col justify-between cursor-pointer transition-all ${
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
        slotCrops={slotCrops}
        pagePhotos={pagePhotos}
        onRemovePhoto={(id) => assignPhotoToSlot(id, null)}
        onOpenCutModal={handleOpenCutModal}
        bookSize={bookConfig.size}
      />

      {/* Left Page Bleed & Safe Zone Overlay */}
      {showGuides && (
        <div className="absolute inset-0 pointer-events-none z-20">
          <div className="absolute inset-2 border border-dashed border-rose-500/50 rounded-xs">
            <span className="absolute top-0.5 left-1 text-[7.5px] font-mono font-bold text-rose-500 bg-white/90 px-1 py-0.2 rounded">
              3mm Cut Line
            </span>
          </div>
          <div className="absolute inset-6 border border-dashed border-teal-500/50 rounded-xs">
            <span className="absolute bottom-0.5 right-1 text-[7.5px] font-mono font-bold text-teal-600 bg-white/90 px-1 py-0.2 rounded">
              Safe Zone
            </span>
          </div>
        </div>
      )}

      {/* Bottom Editorial Footnote */}
      <div className="flex justify-between items-center text-[10px] text-noir-400 font-serif">
        <span>— {leftPageNum < 10 ? `0${leftPageNum}` : leftPageNum} —</span>
        <span className="text-[9px] uppercase tracking-wider text-noir-300">PerfectPic Lay-Flat</span>
      </div>
    </div>
  );

  const renderRightPage = (isSingle: boolean = false) => (
    <div
      onClick={() => setSelectedSlot(rightPageNum.toString())}
      className={`${
        isSingle
          ? 'w-[420px] h-[480px] shadow-luxury-2xl rounded-sm border border-cream-300'
          : 'flex-1'
      } relative p-6 sm:p-8 md:p-10 flex flex-col justify-between cursor-pointer transition-all ${
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
        slotCrops={slotCrops}
        pagePhotos={pagePhotos}
        onRemovePhoto={(id) => assignPhotoToSlot(id, null)}
        onOpenCutModal={handleOpenCutModal}
        bookSize={bookConfig.size}
      />

      {/* Right Page Bleed & Safe Zone Overlay */}
      {showGuides && (
        <div className="absolute inset-0 pointer-events-none z-20">
          <div className="absolute inset-2 border border-dashed border-rose-500/50 rounded-xs">
            <span className="absolute top-0.5 left-1 text-[7.5px] font-mono font-bold text-rose-500 bg-white/90 px-1 py-0.2 rounded">
              3mm Cut Line
            </span>
          </div>
          <div className="absolute inset-6 border border-dashed border-teal-500/50 rounded-xs">
            <span className="absolute bottom-0.5 right-1 text-[7.5px] font-mono font-bold text-teal-600 bg-white/90 px-1 py-0.2 rounded">
              Safe Zone
            </span>
          </div>
        </div>
      )}

      {/* Bottom Editorial Footnote */}
      <div className="flex justify-between items-center text-[10px] text-noir-400 font-serif">
        <span className="text-[9px] uppercase tracking-wider text-noir-300">Archival Series</span>
        <span>— {rightPageNum < 10 ? `0${rightPageNum}` : rightPageNum} —</span>
      </div>
    </div>
  );

  return (
    <div ref={containerRef} className="flex flex-col items-center justify-center w-full max-w-5xl select-none px-2 sm:px-4">
      {/* Top Spread Info & Status */}
      <div className="flex items-center justify-between w-full max-w-4xl px-1 sm:px-4 mb-3 text-xs flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-noir-900 uppercase tracking-widest text-[10px] sm:text-[11px]">
            {isCover ? 'Front Cover' : isBack ? 'Back Cover' : `Pages ${leftPageNum} – ${rightPageNum} of ${pageCount}`}
          </span>
          <span className="text-noir-400 hidden sm:inline">•</span>
          <span className="text-noir-500 font-medium text-[10px] sm:text-[11px] hidden sm:inline">
            {isCover
              ? `Foil: ${coverConfig.foilColor?.toUpperCase() || 'GOLD'}`
              : `Layouts: P${leftPageNum} (${leftLayout}), P${rightPageNum} (${rightLayout})`}
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Print Safety Guides Toggle */}
          <button
            type="button"
            onClick={() => setShowGuides(!showGuides)}
            className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded text-[10px] sm:text-[11px] font-semibold flex items-center gap-1.5 transition-all border ${
              showGuides
                ? 'bg-noir-950 text-white border-noir-900 shadow-sm'
                : 'bg-white text-noir-600 border-cream-300 hover:border-noir-900'
            }`}
            title="Toggle mechanical trim cut lines, safe margins, and gutter fold guides"
          >
            <ShieldAlert size={11} className={showGuides ? 'text-foil-gold' : 'text-noir-400'} />
            <span>Guides: {showGuides ? 'ON' : 'OFF'}</span>
          </button>

          <span className="text-[10px] sm:text-[11px] text-noir-500 hidden md:inline">
            Target Slot: <strong className="text-noir-950 font-mono">{selectedSlot || 'None'}</strong>
          </span>
        </div>
      </div>

      {/* Mobile Page View Toggle (Inside non-panoramic spreads only) */}
      {!isCover && !isBack && !isPanoramic && (
        <div className="flex md:hidden items-center bg-cream-200/80 p-0.5 rounded-full border border-cream-300 mb-3 text-[10px] font-mono shadow-xs">
          <button
            type="button"
            onClick={() => setMobilePageView('spread')}
            className={`px-2.5 py-1 rounded-full transition-all ${
              mobilePageView === 'spread' ? 'bg-noir-950 text-white font-bold shadow-xs' : 'text-noir-700 hover:text-noir-950'
            }`}
          >
            Both Pages
          </button>
          <button
            type="button"
            onClick={() => setMobilePageView('left')}
            className={`px-2.5 py-1 rounded-full transition-all ${
              mobilePageView === 'left' ? 'bg-noir-950 text-white font-bold shadow-xs' : 'text-noir-700 hover:text-noir-950'
            }`}
          >
            Page {leftPageNum}
          </button>
          <button
            type="button"
            onClick={() => setMobilePageView('right')}
            className={`px-2.5 py-1 rounded-full transition-all ${
              mobilePageView === 'right' ? 'bg-noir-950 text-white font-bold shadow-xs' : 'text-noir-700 hover:text-noir-950'
            }`}
          >
            Page {rightPageNum}
          </button>
        </div>
      )}

      {/* Main Spread Viewport with Side Navigation Controls */}
      <div className="relative flex items-center justify-center w-full">
        {/* Previous Spread Button (Desktop) */}
        <button
          onClick={handlePrev}
          disabled={currentSpreadIndex === 0}
          className="hidden md:flex absolute -left-4 md:-left-8 z-30 p-2.5 rounded-full bg-white/90 backdrop-blur-sm border border-cream-300 shadow-luxury-md text-noir-700 hover:text-noir-950 hover:bg-white disabled:opacity-30 disabled:pointer-events-none transition-all"
          title="Previous Spread"
        >
          <ChevronLeft size={20} />
        </button>

        {/* Scaled Book Container */}
        <div
          style={{
            width: `${baseWidth * scale}px`,
            height: `${baseHeight * scale}px`,
            position: 'relative',
          }}
          className="transition-all duration-150"
        >
          <div
            style={{
              width: `${baseWidth}px`,
              height: `${baseHeight}px`,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              position: 'absolute',
              top: 0,
              left: 0,
            }}
          >
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
                {/* Book Spine (Dynamic Bindery Spine Calculator) */}
                <div 
                  style={{ width: `${spineMetrics.spineWidthPx}px` }}
                  className="bg-black/20 flex items-center justify-center border-r border-black/15 relative overflow-hidden shrink-0 transition-all duration-300 group/spine"
                  title={`Dynamic Spine: ${spineMetrics.spineWidthMm}mm (${spineMetrics.spineWidthInches} in) • ${spineMetrics.pageCount} Pages (${spineMetrics.sheetCount} Layflat Spreads)`}
                >
                  <span 
                    className="font-bold text-white tracking-[0.25em] uppercase transform -rotate-90 whitespace-nowrap drop-shadow-sm font-mono select-none"
                    style={{ fontSize: `${spineMetrics.recommendedFontSizePt}px` }}
                  >
                    {spineText}
                  </span>
                  <div className="absolute inset-y-0 right-0 w-[1px] bg-white/20" />
                </div>

                {/* Front Cover Layout */}
                <div className="flex-1 p-8 flex flex-col justify-between relative bg-neutral-900/5">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-white/90 block">
                      {template?.seriesLabel || 'Curated Photobook'}
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
                    <PhotoSlot
                      slotId="0"
                      photo={coverPhoto}
                      crop={slotCrops['0']}
                      isSelected={selectedSlot === '0'}
                      onSelect={(id) => setSelectedSlot(id)}
                      onRemove={(id) => assignPhotoToSlot(id, null)}
                      onOpenCutModal={handleOpenCutModal}
                      bookSize={bookConfig.size}
                      slotWidthFraction={0.9}
                      label="Front Cover Photo"
                    />
                  </div>

                  <div className="flex justify-between items-end text-white/80 text-[10px] uppercase tracking-widest font-mono">
                    <span>{bookConfig.size} Precision-Bound</span>
                    <span>{pageCount} Pages</span>
                  </div>
                </div>

                {/* Front Cover 3mm Bleed Cut Guide */}
                {showGuides && (
                  <div className="absolute inset-2 border border-dashed border-rose-400/60 pointer-events-none z-30 rounded-xs">
                    <span className="absolute top-1 left-2 text-[7.5px] font-mono font-bold text-rose-300 bg-black/60 px-1 py-0.2 rounded">
                      3mm Cover Trim Bleed
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* ======================================================== */}
            {/* 2. OPEN TWO-PAGE SPREAD VIEW (Dynamic Multi-Photo Layouts) */}
            {/* ======================================================== */}
            {!isCover && !isBack && isPanoramic && (
              <div
                onClick={() => setSelectedSlot(`spread_${currentSpreadIndex}`)}
                className={`relative shadow-luxury-2xl bg-white rounded-sm flex flex-col justify-between w-[840px] h-[480px] border border-cream-300 overflow-hidden p-6 md:p-8 cursor-pointer transition-all ${
                  selectedSlot === `spread_${currentSpreadIndex}`
                    ? 'ring-2 ring-inset ring-foil-gold'
                    : 'hover:bg-cream-50/20'
                }`}
                style={{ backgroundColor: leftBg }}
              >
                {/* Top Spread Bar */}
                <div className="flex justify-between items-center text-[10px] text-noir-500 uppercase tracking-widest font-mono z-30">
                  <span className="font-bold bg-noir-950 text-foil-gold px-2 py-0.5 rounded-xs">
                    Two-Page Panoramic Spread (Pages {leftPageNum} – {rightPageNum})
                  </span>
                  <span className="text-noir-400">180° Zero-Gutter Lay-Flat Spanning</span>
                </div>

                {/* Seamless Panoramic Slot Spanning Both Pages */}
                <div className="flex-1 my-3 relative h-full">
                  <PhotoSlot
                    slotId={`spread_${currentSpreadIndex}`}
                    photo={slotPhotos[`spread_${currentSpreadIndex}`] || slotPhotos[`${leftPageNum}_0`] || pagePhotos[leftPageNum] || null}
                    crop={slotCrops[`spread_${currentSpreadIndex}`] || slotCrops[`${leftPageNum}_0`]}
                    isSelected={selectedSlot === `spread_${currentSpreadIndex}`}
                    onSelect={(id) => setSelectedSlot(id)}
                    onRemove={(id) => assignPhotoToSlot(id, null)}
                    onOpenCutModal={handleOpenCutModal}
                    bookSize={bookConfig.size}
                    slotWidthFraction={2}
                    label="Grand Panoramic Photo (Spans Across Both Pages)"
                  />
                </div>

                {/* Print Bleed & Safe Zone Overlay for Panoramic Spread */}
                {showGuides && (
                  <div className="absolute inset-0 pointer-events-none z-20">
                    <div className="absolute inset-2 border border-dashed border-rose-500/50 rounded-xs">
                      <span className="absolute top-0.5 left-1 text-[7.5px] font-mono font-bold text-rose-500 bg-white/90 px-1 py-0.2 rounded">
                        3mm Cut Bleed
                      </span>
                    </div>
                    <div className="absolute inset-6 border border-dashed border-teal-500/50 rounded-xs">
                      <span className="absolute bottom-0.5 right-1 text-[7.5px] font-mono font-bold text-teal-600 bg-white/90 px-1 py-0.2 rounded">
                        Safe Zone (Keep faces inside)
                      </span>
                    </div>
                  </div>
                )}

                {/* Spine Center Fold Guide Line */}
                <div className="absolute inset-y-0 left-1/2 w-[1px] bg-black/25 pointer-events-none z-20 border-r border-dashed border-white/60" />
                <div className="absolute inset-y-0 left-1/2 -ml-4 w-8 bg-gradient-to-r from-black/10 via-transparent to-black/10 pointer-events-none z-10" />

                {/* Bottom Editorial Footnote */}
                <div className="flex justify-between items-center text-[10px] text-noir-400 font-serif z-30">
                  <span>— Page {leftPageNum} —</span>
                  <span className="text-[9px] uppercase tracking-wider text-noir-400 font-mono">180° Layflat Panoramic View</span>
                  <span>— Page {rightPageNum} —</span>
                </div>
              </div>
            )}

            {!isCover && !isBack && !isPanoramic && (
              <>
                {mobilePageView === 'left' && renderLeftPage(true)}
                {mobilePageView === 'right' && renderRightPage(true)}
                {mobilePageView === 'spread' && (
                  <div className="relative shadow-luxury-2xl bg-white rounded-sm flex w-[840px] h-[480px] border border-cream-300 overflow-hidden">
                    {renderLeftPage(false)}
                    {/* Spine Center Fold Illusion & Crease Shadow */}
                    <div className="absolute inset-y-0 left-1/2 -ml-5 w-10 bg-gradient-to-r from-black/15 via-black/5 to-black/15 pointer-events-none z-20" />
                    <div className="absolute inset-y-0 left-1/2 w-[1px] bg-black/20 pointer-events-none z-20" />
                    {renderRightPage(false)}
                  </div>
                )}
              </>
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
          </div>
        </div>

        {/* Next Spread Button (Desktop) */}
        <button
          onClick={handleNext}
          disabled={currentSpreadIndex >= totalSpreads + 1}
          className="hidden md:flex absolute -right-4 md:-right-8 z-30 p-2.5 rounded-full bg-white/90 backdrop-blur-sm border border-cream-300 shadow-luxury-md text-noir-700 hover:text-noir-950 hover:bg-white disabled:opacity-30 disabled:pointer-events-none transition-all"
          title="Next Spread"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Mobile Spread Navigation Bar under canvas */}
      <div className="flex md:hidden items-center justify-between w-full max-w-sm px-3 mt-3 z-10">
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentSpreadIndex === 0}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white border border-cream-300 shadow-xs text-xs font-mono font-medium text-noir-800 disabled:opacity-30"
        >
          <ChevronLeft size={14} /> Prev
        </button>
        <span className="text-[11px] font-mono text-noir-700 bg-white/90 px-3 py-1 rounded-full border border-cream-200 shadow-2xs font-semibold">
          {isCover ? 'Front Cover' : isBack ? 'Back Cover' : `Spread ${currentSpreadIndex}/${totalSpreads}`}
        </span>
        <button
          type="button"
          onClick={handleNext}
          disabled={currentSpreadIndex >= totalSpreads + 1}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white border border-cream-300 shadow-xs text-xs font-mono font-medium text-noir-800 disabled:opacity-30"
        >
          Next <ChevronRight size={14} />
        </button>
      </div>

      {/* Interactive Image Cut & Portion Selection Modal */}
      {cutModalState.isOpen && cutModalState.photo && (
        <PortionCutModal
          isOpen={cutModalState.isOpen}
          onClose={() => setCutModalState({ isOpen: false, slotId: '', photo: null })}
          slotId={cutModalState.slotId}
          photo={cutModalState.photo}
          label={cutModalState.label}
          currentCrop={slotCrops[cutModalState.slotId]}
          onApplyCrop={(slotId, crop) => setSlotCrop(slotId, crop)}
        />
      )}
    </div>
  );
}
