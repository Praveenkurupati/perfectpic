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
  ArrowLeftRight,
  Maximize2,
  RotateCw,
  ChevronDown
} from 'lucide-react';
import PortionCutModal from './PortionCutModal';
import { getSpineMetrics } from '@/lib/spineCalculator';
import { normalizeImageUrl, getImageProxyUrl } from '@/lib/urls';

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

// Memoized PhotoSlot component with crisp black active border (media_1791563079911.png)
const PhotoSlot = React.memo(function PhotoSlot({
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
  const [imgSrc, setImgSrc] = useState<string>(() => normalizeImageUrl(photo?.url));
  const [hasRetriedProxy, setHasRetriedProxy] = useState(false);

  useEffect(() => {
    setImgSrc(normalizeImageUrl(photo?.url));
    setHasRetriedProxy(false);
  }, [photo?.url]);

  const isLargeBook = (bookSize || '').includes('10');
  const baseInches = isLargeBook ? 10 : 8.25;
  const physicalWidthInches = Math.max(1.8, baseInches * slotWidthFraction);
  const dpi = naturalSize ? Math.round(naturalSize.width / physicalWidthInches) : null;
  const isUltraHD = dpi !== null && dpi >= 300;
  const isGoodQuality = dpi !== null && dpi >= 180 && dpi < 300;
  const isLowRes = dpi !== null && dpi < 180;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={
        photo
          ? `${label || 'Photo slot ' + slotId}: occupied, press Enter or Space to select or edit`
          : `${label || 'Photo slot ' + slotId}: empty, press Enter or Space to select and place photo`
      }
      onClick={(e) => {
        e.stopPropagation();
        onSelect(slotId);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          onSelect(slotId);
        }
      }}
      style={{ 
        backgroundColor: '#F5F3EF',
        touchAction: 'manipulation',
      }}
      className={`relative w-full h-full rounded-xl overflow-hidden border transition-all cursor-pointer group flex items-center justify-center touch-manipulation focus-visible:ring-2 focus-visible:ring-black focus-visible:border-black focus-visible:outline-none focus:outline-none ${
        isSelected
          ? 'border-2 border-black ring-1 ring-black shadow-md'
          : 'border border-black/10 hover:border-black/30'
      }`}
    >
      {photo ? (
        <>
          <img
            src={imgSrc || normalizeImageUrl(photo.url)}
            alt={label || 'Slot Photo'}
            onError={() => {
              if (!hasRetriedProxy && photo.url && !photo.url.startsWith('data:')) {
                setHasRetriedProxy(true);
                setImgSrc(getImageProxyUrl(photo.url));
              }
            }}
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
                  className="px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 shadow-xs flex items-center gap-1 backdrop-blur-xs"
                  title={`Crisp Print Quality: ${naturalSize?.width}×${naturalSize?.height}px produces ${dpi} DPI (exceeds 300 DPI press standard)`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>300+ DPI</span>
                </span>
              )}
              {isGoodQuality && (
                <span
                  className="px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold bg-amber-950/90 text-amber-300 border border-amber-500/50 shadow-xs flex items-center gap-1 backdrop-blur-xs"
                  title={`Good Quality: ${naturalSize?.width}×${naturalSize?.height}px produces ${dpi} DPI (recommended range: 180-300 DPI)`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  <span>{dpi} DPI</span>
                </span>
              )}
              {isLowRes && (
                <span
                  className="px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold bg-rose-950/95 text-rose-200 border border-rose-500/80 shadow-xs flex items-center gap-1 backdrop-blur-xs animate-pulse"
                  title={`Low Resolution Alert: ${naturalSize?.width}×${naturalSize?.height}px produces only ${dpi} DPI. Recommended: 1500px+ width.`}
                >
                  <AlertTriangle className="w-2.5 h-2.5 text-rose-400" />
                  <span>⚠️ {dpi} DPI</span>
                </span>
              )}
            </div>
          )}

          {/* Hover Cut/Portion Tool Button */}
          <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex gap-1">
            {onOpenCutModal && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenCutModal(slotId, photo, label);
                }}
                className="p-1 bg-white/90 hover:bg-white text-gray-900 rounded-md shadow-xs transition-colors"
                title="Crop / Cut photo portion"
              >
                <Crop size={12} />
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(slotId);
              }}
              className="p-1 bg-white/90 hover:bg-red-50 text-gray-700 hover:text-red-600 rounded-md shadow-xs transition-colors"
              title="Remove photo"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center p-3 text-center text-gray-400 group-hover:text-gray-700 transition-colors">
          <ImageIcon size={18} className="mb-1 text-gray-400 group-hover:text-gray-600 transition-colors" />
          <span className="text-[10px] font-semibold text-gray-600">{label || 'Empty Slot'}</span>
          <span className="text-[9px] text-gray-400 mt-0.5">Click to place photo</span>
        </div>
      )}
    </div>
  );
});

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

  if (layout === '3-photo-h') {
    return (
      <div className="flex-1 my-2 flex flex-col gap-2 h-full">
        <div className="h-[58%]">
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
            label="Hero Top Slot"
          />
        </div>
        <div className="h-[42%] grid grid-cols-2 gap-2">
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
            label="Bottom Left Slot"
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
            label="Bottom Right Slot"
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
    setPageLayout,
    pageBackgrounds,
    coverConfig,
    selectedSlot,
    setSelectedSlot,
    assignPhotoToSlot,
    template,
    bookConfig,
    canvasZoom,
    setCanvasZoom,
    toggleSlotFit,
    rotateSlotPhoto,
    photos,
    captions,
  } = useEditorStore();

  const [showGuides, setShowGuides] = useState(false);
  const [layoutMenuOpen, setLayoutMenuOpen] = useState(false);

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

  let targetedPageNum = leftPageNum;
  if (selectedSlot) {
    const parsed = parseInt(selectedSlot.split('_')[0] || '', 10);
    if (!isNaN(parsed) && parsed > 0) {
      targetedPageNum = parsed;
    }
  }

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
    black: 'text-neutral-950 drop-shadow-[0_1px_1px_rgba(255,255,255,0.2)]',
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

  const leftLayout: PageLayout = pageLayouts[leftPageNum] || (pageLayouts as any)[leftPageNum.toString()] || '1-photo';
  const rightLayout: PageLayout = pageLayouts[rightPageNum] || (pageLayouts as any)[rightPageNum.toString()] || '1-photo';
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

  // Floating capsule action handlers
  const handleSwapOrCycle = () => {
    const targetSlot = selectedSlot || `${leftPageNum}_0`;
    const curPhoto = slotPhotos[targetSlot] || pagePhotos[leftPageNum];
    const otherPhotos = photos.filter(p => p.id !== curPhoto?.id);
    if (otherPhotos.length > 0) {
      const nextPhoto = otherPhotos.find(p => (p.usedCount || 0) === 0) || otherPhotos[0];
      if (nextPhoto) assignPhotoToSlot(targetSlot, nextPhoto);
    }
  };

  const zoomFactor = (canvasZoom || 100) / 100;

  const renderLeftPage = (isSingle: boolean = false) => (
    <div
      onClick={() => setSelectedSlot(`${leftPageNum}_0`)}
      className={`${
        isSingle
          ? 'w-[420px] h-[480px] shadow-2xl rounded-sm border border-black/10'
          : 'flex-1 border-r border-black/10'
      } relative p-6 sm:p-8 flex flex-col justify-between cursor-pointer transition-all ${
        selectedSlot?.startsWith(leftPageNum.toString())
          ? 'bg-white'
          : 'hover:bg-gray-50/30'
      }`}
      style={{ backgroundColor: leftBg }}
    >
      {/* Top Page Header */}
      <div className="flex justify-between items-center text-[10px] text-gray-400 font-mono">
        <span>page {leftPageNum}</span>
        {selectedSlot?.startsWith(leftPageNum.toString()) && (
          <span className="inline-flex items-center gap-1 text-black font-semibold">
            <Check size={11} strokeWidth={2.5} /> active
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

      {/* Caption if provided */}
      {captions[leftPageNum] && (
        <p className="text-[10px] text-center text-gray-600 italic font-serif mt-1 truncate">
          {captions[leftPageNum]}
        </p>
      )}
    </div>
  );

  const renderRightPage = (isSingle: boolean = false) => (
    <div
      onClick={() => setSelectedSlot(`${rightPageNum}_0`)}
      className={`${
        isSingle
          ? 'w-[420px] h-[480px] shadow-2xl rounded-sm border border-black/10'
          : 'flex-1'
      } relative p-6 sm:p-8 flex flex-col justify-between cursor-pointer transition-all ${
        selectedSlot?.startsWith(rightPageNum.toString())
          ? 'bg-white'
          : 'hover:bg-gray-50/30'
      }`}
      style={{ backgroundColor: rightBg }}
    >
      {/* Top Page Header */}
      <div className="flex justify-between items-center text-[10px] text-gray-400 font-mono">
        {selectedSlot?.startsWith(rightPageNum.toString()) ? (
          <span className="inline-flex items-center gap-1 text-black font-semibold">
            <Check size={11} strokeWidth={2.5} /> active
          </span>
        ) : <span />}
        <span>page {rightPageNum}</span>
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

      {/* Caption if provided */}
      {captions[rightPageNum] && (
        <p className="text-[10px] text-center text-gray-600 italic font-serif mt-1 truncate">
          {captions[rightPageNum]}
        </p>
      )}
    </div>
  );

  return (
    <div ref={containerRef} className="flex flex-col items-center justify-center w-full max-w-5xl select-none px-2 sm:px-4">
      {/* Floating Contextual Action Pill (Mockup: layout ⌵ | swap | fit | rotate | delete) */}
      <div className="relative flex items-center bg-white/95 backdrop-blur-md rounded-full px-2 py-1 shadow-md border border-black/10 mb-4 z-40 select-none text-xs">
        {/* Layout Button with Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setLayoutMenuOpen(!layoutMenuOpen)}
            className="px-2.5 py-1 rounded-full hover:bg-gray-100 flex items-center gap-1 font-medium text-gray-800 transition-colors"
            title="Choose layout for active page"
          >
            <span>layout</span>
            <ChevronDown size={13} className="text-gray-500" />
          </button>
          {layoutMenuOpen && (
            <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 w-48 z-50 animate-in fade-in zoom-in-95">
              {[
                { id: '1-photo', label: '1 photo full' },
                { id: '2-photo-h', label: '2 photos split h' },
                { id: '2-photo-v', label: '2 photos split v' },
                { id: '3-photo', label: '3 photos (hero left)' },
                { id: '3-photo-h', label: '3 photos (hero top)' },
                { id: '4-photo', label: '4 photos grid' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setPageLayout(targetedPageNum, opt.id as PageLayout);
                    setLayoutMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100 hover:text-black flex items-center justify-between"
                >
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-3.5 bg-gray-200 mx-0.5" />

        {/* Swap Button */}
        <button
          type="button"
          onClick={handleSwapOrCycle}
          className="px-2.5 py-1 rounded-full hover:bg-gray-100 flex items-center gap-1 font-medium text-gray-800 transition-colors"
          title="Swap or cycle photo"
        >
          <ArrowLeftRight size={12} className="text-gray-500" />
          <span>swap</span>
        </button>

        <div className="w-px h-3.5 bg-gray-200 mx-0.5" />

        {/* Fit Button */}
        <button
          type="button"
          onClick={() => {
            const targetSlot = selectedSlot || `${leftPageNum}_0`;
            toggleSlotFit(targetSlot);
          }}
          className="px-2.5 py-1 rounded-full hover:bg-gray-100 flex items-center gap-1 font-medium text-gray-800 transition-colors"
          title="Toggle fit / fill crop"
        >
          <Maximize2 size={12} className="text-gray-500" />
          <span>fit</span>
        </button>

        <div className="w-px h-3.5 bg-gray-200 mx-0.5" />

        {/* Rotate Button */}
        <button
          type="button"
          onClick={() => {
            const targetSlot = selectedSlot || `${leftPageNum}_0`;
            rotateSlotPhoto(targetSlot);
          }}
          className="px-2.5 py-1 rounded-full hover:bg-gray-100 flex items-center gap-1 font-medium text-gray-800 transition-colors"
          title="Rotate crop orientation"
        >
          <RotateCw size={12} className="text-gray-500" />
          <span>rotate</span>
        </button>

        <div className="w-px h-3.5 bg-gray-200 mx-0.5" />

        {/* Crop / Cut Portion Button */}
        <button
          type="button"
          onClick={() => {
            const targetSlot = selectedSlot || `${leftPageNum}_0`;
            const curPhoto = slotPhotos[targetSlot] || pagePhotos[leftPageNum];
            if (curPhoto) handleOpenCutModal(targetSlot, curPhoto);
          }}
          className="px-2.5 py-1 rounded-full hover:bg-gray-100 flex items-center gap-1 font-medium text-gray-800 transition-colors"
          title="Cut / Crop photo"
        >
          <Crop size={12} className="text-gray-500" />
          <span>crop</span>
        </button>

        <div className="w-px h-3.5 bg-gray-200 mx-0.5" />

        {/* Delete Button */}
        <button
          type="button"
          onClick={() => {
            const targetSlot = selectedSlot || `${leftPageNum}_0`;
            assignPhotoToSlot(targetSlot, null);
          }}
          className="px-2.5 py-1 rounded-full hover:bg-red-50 hover:text-red-600 flex items-center gap-1 font-medium text-gray-800 transition-colors"
          title="Remove photo from slot"
        >
          <Trash2 size={12} className="text-gray-500 hover:text-red-600" />
          <span>delete</span>
        </button>
      </div>

      {/* Main Spread Viewport with Side Navigation Controls */}
      <div className="relative flex items-center justify-center w-full">
        {/* Previous Spread Button */}
        <button
          onClick={handlePrev}
          disabled={currentSpreadIndex === 0}
          className="hidden md:flex absolute -left-4 md:-left-8 z-30 w-9 h-9 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm border border-gray-200 shadow-md text-gray-700 hover:text-black hover:bg-white disabled:opacity-20 disabled:pointer-events-none transition-all"
          title="Previous Spread"
        >
          <ChevronLeft size={18} />
        </button>

        {/* Scaled Book Container */}
        <div
          style={{
            width: `${baseWidth * scale * zoomFactor}px`,
            height: `${baseHeight * scale * zoomFactor}px`,
            position: 'relative',
          }}
          className="transition-all duration-150"
        >
          <div
            style={{
              width: `${baseWidth}px`,
              height: `${baseHeight}px`,
              transform: `scale(${scale * zoomFactor})`,
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
                className={`relative w-[420px] h-[520px] rounded-r-md shadow-2xl border border-black/10 flex overflow-hidden cursor-pointer transition-all duration-300 ${
                  selectedSlot === '0' ? 'ring-2 ring-black ring-offset-4' : ''
                }`}
                style={{ backgroundColor: coverBg }}
              >
                {/* Book Spine */}
                <div 
                  style={{ width: `${spineMetrics.spineWidthPx}px` }}
                  className="bg-black/20 flex items-center justify-center border-r border-black/15 relative overflow-hidden shrink-0 transition-all duration-300 group/spine"
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
                    <h2 className={`font-serif text-2xl font-bold uppercase tracking-wider break-words leading-tight ${foilClasses}`}>
                      {coverTitle}
                    </h2>
                    <p className="text-xs text-white/80 italic font-serif break-words">
                      {coverSubtitle}
                    </p>
                  </div>

                  {/* Cover Photo Slot */}
                  <div className="flex-1 my-4 bg-white/10 rounded-xl overflow-hidden relative border border-white/20 shadow-inner group">
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
              </div>
            )}

            {/* ======================================================== */}
            {/* 2. OPEN TWO-PAGE SPREAD VIEW */}
            {/* ======================================================== */}
            {!isCover && !isBack && isPanoramic && (
              <div
                onClick={() => setSelectedSlot(`spread_${currentSpreadIndex}`)}
                className={`relative shadow-2xl bg-white rounded-md flex flex-col justify-between w-[840px] h-[480px] border border-black/10 overflow-hidden p-6 md:p-8 cursor-pointer transition-all ${
                  selectedSlot === `spread_${currentSpreadIndex}`
                    ? 'ring-2 ring-black ring-inset'
                    : 'hover:bg-gray-50/20'
                }`}
                style={{ backgroundColor: leftBg }}
              >
                <div className="flex justify-between items-center text-[10px] text-gray-500 uppercase tracking-widest font-mono z-30">
                  <span className="font-bold bg-black text-white px-2 py-0.5 rounded-sm">
                    panoramic spread (pages {leftPageNum} – {rightPageNum})
                  </span>
                  <span className="text-gray-400">layflat uninterrupted</span>
                </div>

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
                    label="Grand Panoramic Photo"
                  />
                </div>

                <div className="absolute inset-y-0 left-1/2 w-[1px] bg-black/20 pointer-events-none z-20" />
                <div className="absolute inset-y-0 left-1/2 -ml-4 w-8 bg-gradient-to-r from-black/10 via-transparent to-black/10 pointer-events-none z-10" />
              </div>
            )}

            {!isCover && !isBack && !isPanoramic && (
              <>
                {mobilePageView === 'left' && renderLeftPage(true)}
                {mobilePageView === 'right' && renderRightPage(true)}
                {mobilePageView === 'spread' && (
                  <div className="relative shadow-2xl bg-white rounded-md flex w-[840px] h-[480px] border border-black/10 overflow-hidden">
                    {renderLeftPage(false)}
                    {/* Spine Center Fold Shadow */}
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
                className="relative w-[420px] h-[520px] rounded-l-md shadow-2xl border border-black/10 flex flex-col justify-between p-10 overflow-hidden text-center text-white"
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

        {/* Next Spread Button */}
        <button
          onClick={handleNext}
          disabled={currentSpreadIndex >= totalSpreads + 1}
          className="hidden md:flex absolute -right-4 md:-right-8 z-30 w-9 h-9 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm border border-gray-200 shadow-md text-gray-700 hover:text-black hover:bg-white disabled:opacity-20 disabled:pointer-events-none transition-all"
          title="Next Spread"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Page Numbers Below Spread (Mockup: 12 and 13) */}
      {!isCover && !isBack && (
        <div className="flex justify-around items-center w-full max-w-[840px] mt-3 px-12 text-xs font-mono font-medium text-gray-500 select-none">
          <span>{leftPageNum}</span>
          <span>{rightPageNum}</span>
        </div>
      )}

      {/* Zoom Control Pill (Mockup: - 100% +) */}
      <div className="flex items-center gap-2 bg-white/90 backdrop-blur-xs border border-gray-200 rounded-full px-3 py-1 shadow-2xs mt-2 text-xs font-mono text-gray-700 select-none">
        <button
          type="button"
          onClick={() => setCanvasZoom((z) => Math.max(50, z - 10))}
          className="w-5 h-5 flex items-center justify-center hover:bg-gray-100 rounded-full text-gray-600 hover:text-black font-bold"
          title="Zoom Out"
        >
          -
        </button>
        <span className="min-w-9 text-center font-medium">{canvasZoom || 100}%</span>
        <button
          type="button"
          onClick={() => setCanvasZoom((z) => Math.min(150, z + 10))}
          className="w-5 h-5 flex items-center justify-center hover:bg-gray-100 rounded-full text-gray-600 hover:text-black font-bold"
          title="Zoom In"
        >
          +
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
