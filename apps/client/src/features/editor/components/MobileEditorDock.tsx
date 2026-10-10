'use client';

import React, { useState, useRef } from 'react';
import { useEditorStore, Photo, PageLayout } from '@/stores/useEditorStore';
import { Check, Plus, Loader2, Sparkles, Image as ImageIcon } from 'lucide-react';
import { compressImage, fileToDataUrl, isImageFile } from '@/lib/imageCompressor';
import { api } from '@/lib/api';
import { normalizeImageUrl, handleImageError } from '@/lib/urls';

interface MobileEditorDockProps {
  onOpenUploadModal?: () => void;
}

export default function MobileEditorDock({ onOpenUploadModal }: MobileEditorDockProps) {
  const {
    photos,
    addPhoto,
    currentSpreadIndex,
    pageCount,
    selectedSlot,
    setSelectedSlot,
    assignPhotoToSlot,
    pagePhotos,
    slotPhotos,
    pageLayouts,
    setPageLayout,
    captions,
    setCaption,
    captionCase,
    setCaptionCase,
    pageBackgrounds,
    setPageBackground,
    autoPopulatePages,
    activeSidebarTab,
    setActiveSidebarTab,
  } = useEditorStore();

  const [isAutoArranging, setIsAutoArranging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Target page numbers for the current spread
  const leftPageNum = (currentSpreadIndex - 1) * 2 + 1;
  const rightPageNum = (currentSpreadIndex - 1) * 2 + 2;

  // Determine which page is targeted for layout/text/background
  let targetedPageNum = leftPageNum;
  if (selectedSlot) {
    const parsed = parseInt(selectedSlot.split('_')[0] || '', 10);
    if (!isNaN(parsed) && parsed > 0) {
      targetedPageNum = parsed;
    }
  }

  const currentLayout: PageLayout = pageLayouts[targetedPageNum] || '1-photo';
  const currentBg = pageBackgrounds[targetedPageNum] || '#FFFFFF';
  const currentCaption = captions[targetedPageNum] || '';
  const placedCount = photos.filter((p) => (p.usedCount || 0) > 0).length;

  const handlePhotoSelect = (photo: Photo) => {
    // If a slot is selected, assign directly to it
    if (selectedSlot) {
      assignPhotoToSlot(selectedSlot, photo);
      return;
    }

    // Otherwise, find the first empty slot on the current spread
    const isCover = currentSpreadIndex === 0;
    if (isCover) {
      assignPhotoToSlot('0', photo);
      return;
    }

    // Default to left page slot 0 or right page slot 0
    const leftSlot = `${leftPageNum}_0`;
    const rightSlot = `${rightPageNum}_0`;
    if (!slotPhotos[leftSlot] && !pagePhotos[leftPageNum]) {
      assignPhotoToSlot(leftSlot, photo);
      setSelectedSlot(leftSlot);
    } else if (!slotPhotos[rightSlot] && !pagePhotos[rightPageNum]) {
      assignPhotoToSlot(rightSlot, photo);
      setSelectedSlot(rightSlot);
    } else {
      assignPhotoToSlot(leftSlot, photo);
      setSelectedSlot(leftSlot);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files).filter(isImageFile);
    if (files.length === 0) return;

    setIsUploading(true);
    for (let i = 0; i < files.length; i++) {
      const file = files[i]!;
      try {
        const compressed = await compressImage(file, { maxDimension: 2400, quality: 0.85 });
        let photoUrl = '';
        try {
          const res = await api.uploadPhoto(compressed);
          photoUrl = res.url;
        } catch {
          photoUrl = await fileToDataUrl(compressed);
        }
        addPhoto({
          id: `upload-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
          url: photoUrl,
          usedCount: 0,
          flagged: false,
          name: file.name,
        });
      } catch (err) {
        console.error('Mobile tray upload error:', err);
      }
    }
    setIsUploading(false);
    e.target.value = '';
  };

  const handleSmartCreation = () => {
    setIsAutoArranging(true);
    setTimeout(() => {
      autoPopulatePages();
      setIsAutoArranging(false);
    }, 400);
  };

  const layoutCards: { id: PageLayout; label: string; wireframe: React.ReactNode }[] = [
    {
      id: '1-photo',
      label: '1 photo',
      wireframe: (
        <div className="w-full h-full p-2 flex items-center justify-center">
          <div className="w-4/5 h-4/5 bg-gray-300 rounded-xs" />
        </div>
      ),
    },
    {
      id: '1-photo-full',
      label: '1 full bleed',
      wireframe: (
        <div className="w-full h-full bg-gray-300" />
      ),
    },
    {
      id: '2-photo-v',
      label: '2 vertical',
      wireframe: (
        <div className="w-full h-full p-1.5 grid grid-rows-2 gap-1">
          <div className="bg-gray-300 rounded-xs" />
          <div className="bg-gray-300 rounded-xs" />
        </div>
      ),
    },
    {
      id: '2-photo-h',
      label: '2 horizontal',
      wireframe: (
        <div className="w-full h-full p-1.5 grid grid-cols-2 gap-1">
          <div className="bg-gray-300 rounded-xs" />
          <div className="bg-gray-300 rounded-xs" />
        </div>
      ),
    },
    {
      id: '3-photo',
      label: '3 photos (hero left)',
      wireframe: (
        <div className="w-full h-full p-1.5 grid grid-cols-2 gap-1">
          <div className="bg-gray-300 rounded-xs" />
          <div className="grid grid-rows-2 gap-1">
            <div className="bg-gray-300 rounded-xs" />
            <div className="bg-gray-300 rounded-xs" />
          </div>
        </div>
      ),
    },
    {
      id: '3-photo-h',
      label: '3 photos (hero top)',
      wireframe: (
        <div className="w-full h-full p-1.5 flex flex-col gap-1">
          <div className="h-[55%] bg-gray-300 rounded-xs" />
          <div className="h-[45%] grid grid-cols-2 gap-1">
            <div className="bg-gray-300 rounded-xs" />
            <div className="bg-gray-300 rounded-xs" />
          </div>
        </div>
      ),
    },
    {
      id: '4-photo',
      label: '4 photos grid',
      wireframe: (
        <div className="w-full h-full p-1.5 grid grid-cols-2 grid-rows-2 gap-1">
          <div className="bg-gray-300 rounded-xs" />
          <div className="bg-gray-300 rounded-xs" />
          <div className="bg-gray-300 rounded-xs" />
          <div className="bg-gray-300 rounded-xs" />
        </div>
      ),
    },
    {
      id: '6-photo-grid',
      label: '6 photos grid',
      wireframe: (
        <div className="w-full h-full p-1 grid grid-cols-2 grid-rows-3 gap-0.5">
          <div className="bg-gray-300 rounded-xs" />
          <div className="bg-gray-300 rounded-xs" />
          <div className="bg-gray-300 rounded-xs" />
          <div className="bg-gray-300 rounded-xs" />
          <div className="bg-gray-300 rounded-xs" />
          <div className="bg-gray-300 rounded-xs" />
        </div>
      ),
    },
    {
      id: '2-page-panoramic',
      label: 'panoramic spread',
      wireframe: (
        <div className="w-full h-full p-1.5 flex items-center justify-center">
          <div className="w-full h-3/4 bg-gray-300 rounded-xs flex items-center justify-center text-[8px] font-mono text-gray-500">
            panoramic
          </div>
        </div>
      ),
    },
  ];

  const bgPalette = [
    { color: '#FFFFFF', name: 'White' },
    { color: '#FAF8F5', name: 'Ivory' },
    { color: '#F4F0E8', name: 'Linen' },
    { color: '#DFD7C7', name: 'Sand' },
    { color: '#FDF2F4', name: 'Rose' },
    { color: '#EFF4F0', name: 'Sage' },
    { color: '#141413', name: 'Noir' },
  ];

  return (
    <div className="w-full bg-white rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.08)] flex flex-col shrink-0 select-none border-t border-black/5 z-30 transition-all">
      {/* Top Handle Bar */}
      <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-2.5 mb-2 shrink-0" />

      {/* Tab Pills: photos | layouts | text | background */}
      <div className="flex items-center gap-2 px-4 pb-2.5 overflow-x-auto no-scrollbar shrink-0">
        {(['photos', 'layouts', 'text', 'background'] as const).map((tab) => {
          const isActive = activeSidebarTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveSidebarTab(tab)}
              className={`px-5 py-2 rounded-full text-xs font-semibold tracking-wide transition-all ${
                isActive
                  ? 'bg-black text-white shadow-xs'
                  : 'bg-[#F3EFEA] text-neutral-800 hover:bg-neutral-200'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Tab 1: PHOTOS */}
      {activeSidebarTab === 'photos' && (
        <div className="flex flex-col">
          {/* Horizontal Photo Scroll Carousel */}
          <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar px-4 py-1">
            {photos.map((photo) => {
              const isUsed = (photo.usedCount || 0) > 0;
              return (
                <div
                  key={photo.id}
                  onClick={() => handlePhotoSelect(photo)}
                  className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl overflow-hidden shrink-0 relative bg-[#E5E1D8] border border-black/5 cursor-pointer active:scale-95 transition-transform"
                >
                  <img
                    src={normalizeImageUrl(photo.url)}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={handleImageError}
                  />
                  {isUsed && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black text-white flex items-center justify-center shadow-xs">
                      <Check size={11} className="stroke-[3]" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Add Photo Button Tile */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl overflow-hidden shrink-0 relative bg-[#F4F1EA] border border-dashed border-neutral-300 flex flex-col items-center justify-center text-neutral-500 hover:text-black hover:border-black cursor-pointer active:scale-95 transition-all"
            >
              {isUploading ? (
                <Loader2 size={18} className="animate-spin text-black" />
              ) : (
                <>
                  <Plus size={20} className="stroke-[2.5]" />
                  <span className="text-[10px] font-medium mt-1">add</span>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleFileInputChange}
            />
          </div>

          {/* Photos Count Status Text */}
          <p className="text-xs text-neutral-400 font-medium px-4 mt-2.5 mb-2">
            {photos.length} added · {placedCount} used
          </p>

          {/* Smart Creation CTA Button */}
          <div className="px-4 pb-3">
            <button
              type="button"
              onClick={handleSmartCreation}
              disabled={isAutoArranging || photos.length === 0}
              className="w-full py-3.5 bg-black text-white rounded-full font-semibold text-xs sm:text-sm tracking-wide shadow-sm hover:bg-neutral-900 active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {isAutoArranging ? (
                <>
                  <Loader2 size={16} className="animate-spin text-white" />
                  <span>arranging photos...</span>
                </>
              ) : (
                <span>smart creation — auto-arrange</span>
              )}
            </button>
            <p className="text-[11px] text-neutral-400 text-center mt-1">
              edit anything after
            </p>
          </div>
        </div>
      )}

      {/* Tab 2: LAYOUTS */}
      {activeSidebarTab === 'layouts' && (
        <div className="flex flex-col px-4 pb-4">
          {/* Target Page Selector Switcher */}
          <div className="flex items-center justify-between py-1 mb-2 border-b border-gray-100">
            <span className="text-xs text-gray-500 font-medium">
              applying to: <span className="font-bold text-black font-mono">page {targetedPageNum}</span>
            </span>
            <div className="flex items-center gap-1 bg-gray-100 rounded-full p-0.5">
              <button
                type="button"
                onClick={() => setSelectedSlot(`${leftPageNum}_0`)}
                className={`px-3 py-1 rounded-full text-[11px] font-medium transition-colors ${
                  targetedPageNum === leftPageNum ? 'bg-white text-black shadow-2xs font-bold' : 'text-gray-500'
                }`}
              >
                page {leftPageNum}
              </button>
              <button
                type="button"
                onClick={() => setSelectedSlot(`${rightPageNum}_0`)}
                className={`px-3 py-1 rounded-full text-[11px] font-medium transition-colors ${
                  targetedPageNum === rightPageNum ? 'bg-white text-black shadow-2xs font-bold' : 'text-gray-500'
                }`}
              >
                page {rightPageNum}
              </button>
            </div>
          </div>

          {/* Layout Cards Carousel */}
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
            {layoutCards.map((card) => {
              const isSelected = currentLayout === card.id;
              return (
                <div
                  key={card.id}
                  onClick={() => {
                    if (card.id === '2-page-panoramic') {
                      setPageLayout(leftPageNum, '2-page-panoramic');
                      setPageLayout(rightPageNum, '2-page-panoramic');
                      setSelectedSlot(`spread_${currentSpreadIndex}`);
                    } else {
                      setPageLayout(targetedPageNum, card.id);
                    }
                  }}
                  className={`w-24 h-24 shrink-0 rounded-xl p-1.5 flex flex-col items-center justify-between cursor-pointer transition-all ${
                    isSelected
                      ? 'border-2 border-black ring-1 ring-black bg-white shadow-xs'
                      : 'border border-gray-200 bg-gray-50 hover:border-gray-400'
                  }`}
                >
                  <div className="w-full flex-1 rounded-sm overflow-hidden bg-white">
                    {card.wireframe}
                  </div>
                  <span className="text-[10px] font-medium text-gray-700 truncate w-full text-center mt-1">
                    {card.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: TEXT */}
      {activeSidebarTab === 'text' && (
        <div className="flex flex-col px-4 pb-4 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>caption for <span className="font-bold text-black font-mono">page {targetedPageNum}</span></span>
            <div className="flex gap-1">
              {(['lower', 'sentence', 'upper'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setCaptionCase(mode)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                    captionCase === mode ? 'bg-black text-white font-bold' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {mode === 'lower' ? 'aa' : mode === 'sentence' ? 'Aa' : 'AA'}
                </button>
              ))}
            </div>
          </div>

          <input
            type="text"
            value={currentCaption}
            onChange={(e) => setCaption(targetedPageNum, e.target.value)}
            placeholder={`e.g. Day at the beach, 2026`}
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-serif text-black placeholder:text-gray-400 focus:outline-none focus:border-black"
          />

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
            {['Golden Hour', 'Summer Journey', 'The Monograph', 'Cherished Days'].map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setCaption(targetedPageNum, suggestion)}
                className="px-2.5 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-[10px] font-medium text-gray-700 whitespace-nowrap"
              >
                + {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: BACKGROUND */}
      {activeSidebarTab === 'background' && (
        <div className="flex flex-col px-4 pb-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>background for <span className="font-bold text-black font-mono">page {targetedPageNum}</span></span>
            <button
              type="button"
              onClick={() => {
                for (let i = 1; i <= pageCount; i++) {
                  setPageBackground(i, currentBg);
                }
              }}
              className="text-[10px] text-gray-600 hover:text-black font-semibold underline"
            >
              apply to all pages
            </button>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
            {bgPalette.map((bg) => {
              const isSelected = (currentBg || '#FFFFFF').toLowerCase() === bg.color.toLowerCase();
              return (
                <button
                  key={bg.color}
                  type="button"
                  onClick={() => setPageBackground(targetedPageNum, bg.color)}
                  className={`flex flex-col items-center gap-1 shrink-0 p-1 rounded-xl transition-all ${
                    isSelected ? 'ring-2 ring-black ring-offset-2' : ''
                  }`}
                >
                  <div
                    style={{ backgroundColor: bg.color }}
                    className="w-10 h-10 rounded-full border border-black/15 shadow-2xs flex items-center justify-center"
                  >
                    {isSelected && (
                      <Check
                        size={14}
                        className={bg.color === '#141413' ? 'text-white' : 'text-black'}
                      />
                    )}
                  </div>
                  <span className="text-[10px] text-gray-600 font-medium">{bg.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
