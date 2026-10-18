'use client';

import { useState, useEffect } from 'react';
import { useEditorStore, Photo } from '@/stores/useEditorStore';
import { 
  UploadCloud, 
  Check, 
  Plus, 
  Image as ImageIcon, 
  Loader2, 
  Sparkles, 
  Star, 
  Layers 
} from 'lucide-react';
import GooglePhotoPickerModal, { GooglePhotosLogo, GoogleDriveLogo } from '@/components/photos/GooglePhotoPickerModal';
import BurstCleanupModal from './BurstCleanupModal';
import { compressImage, fileToDataUrl, isImageFile } from '@/lib/imageCompressor';
import { analyzeImageQuality } from '@/lib/imageQualityAnalyzer';
import { api } from '@/lib/api';
import { normalizeImageUrl, handleImageError } from '@/lib/urls';

export default function PhotoTray() {
  const { 
    photos, 
    photoFilter, 
    setPhotoFilter, 
    addPhoto, 
    selectedSlot, 
    setSelectedSlot,
    assignPhotoToSlot,
    currentSpreadIndex,
    pageCount,
    pageLayouts,
    burstGroups,
    detectBurstPhotos,
    isDetectingBursts,
  } = useEditorStore();

  const [cloudPickerOpen, setCloudPickerOpen] = useState(false);
  const [cloudInitialTab, setCloudInitialTab] = useState<'photos' | 'drive'>('photos');
  const [burstModalOpen, setBurstModalOpen] = useState(false);
  const [isUploadingTray, setIsUploadingTray] = useState(false);
  const [trayProgress, setTrayProgress] = useState('');

  // Auto-detect bursts when photo count changes
  useEffect(() => {
    if (photos.length >= 2) {
      detectBurstPhotos().catch(() => {});
    }
  }, [photos.length]);

  const handleTrayUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const fileArray = Array.from(e.target.files).filter(isImageFile);
    if (fileArray.length === 0) return;

    setIsUploadingTray(true);
    for (let idx = 0; idx < fileArray.length; idx++) {
      const file = fileArray[idx]!;
      setTrayProgress(`${idx + 1}/${fileArray.length}`);
      try {
        const [compressed, qualityReport] = await Promise.all([
          compressImage(file, { maxDimension: 2400, quality: 0.85 }),
          analyzeImageQuality(file),
        ]);
        let photoUrl = '';
        try {
          const res = await api.uploadPhoto(compressed);
          photoUrl = res.url;
        } catch {
          photoUrl = await fileToDataUrl(compressed);
        }
        addPhoto({
          id: `upload-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
          url: photoUrl,
          usedCount: 0,
          flagged: false,
          name: file.name,
          width: qualityReport.naturalWidth,
          height: qualityReport.naturalHeight,
          blurScore: qualityReport.blurScore,
          isBlurry: qualityReport.isBlurry,
          isLowRes: qualityReport.isLowResForSinglePage,
          qualityGrade: qualityReport.qualityGrade,
          summary: qualityReport.summary,
          recommendedLayout: qualityReport.recommendedLayout,
        });
      } catch (err) {
        console.error('Tray upload error:', err);
      }
    }
    setIsUploadingTray(false);
    setTrayProgress('');
    e.target.value = '';
  };

  const reviewCount = photos.filter(p => p.isBlurry || p.isLowRes).length;
  const uniqueCount = photos.filter(p => !p.isExcludedFromAutofill && (!p.isDuplicateOrBurst || p.isBestPick)).length;
  const burstCount = photos.filter(p => p.burstGroupId !== undefined).length;

  const filteredPhotos = photos.filter(p => {
    if (photoFilter === 'unique') return !p.isExcludedFromAutofill && (!p.isDuplicateOrBurst || p.isBestPick);
    if (photoFilter === 'bursts') return p.burstGroupId !== undefined;
    if (photoFilter === 'unused') return (p.usedCount || 0) === 0;
    if (photoFilter === 'flagged') return p.flagged || p.isBlurry || p.isLowRes;
    return true;
  });

  const placedCount = photos.filter(p => (p.usedCount || 0) > 0).length;

  const leftPageNum = (currentSpreadIndex - 1) * 2 + 1;
  const rightPageNum = (currentSpreadIndex - 1) * 2 + 2;
  const isInsideSpread = currentSpreadIndex > 0 && currentSpreadIndex <= Math.ceil(pageCount / 2);
  const isPanoramic = isInsideSpread && (pageLayouts[leftPageNum] === '2-page-panoramic' || pageLayouts[rightPageNum] === '2-page-panoramic');

  // Handle clicking a photo to place it
  const handlePhotoClick = (photo: Photo) => {
    const defaultSlot = currentSpreadIndex === 0
      ? '0'
      : isPanoramic
      ? `spread_${currentSpreadIndex}`
      : `${leftPageNum}_0`;
    const targetSlot = selectedSlot || defaultSlot;
    assignPhotoToSlot(targetSlot, photo);
  };

  const handlePlaceLeft = (e: React.MouseEvent, photo: Photo) => {
    e.stopPropagation();
    assignPhotoToSlot(`${leftPageNum}_0`, photo);
    setSelectedSlot(`${rightPageNum}_0`);
  };

  const handlePlaceRight = (e: React.MouseEvent, photo: Photo) => {
    e.stopPropagation();
    assignPhotoToSlot(`${rightPageNum}_0`, photo);
    setSelectedSlot(rightPageNum < pageCount ? `${rightPageNum + 1}_0` : null);
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-white select-none">
      {/* Tray Header */}
      <div className="p-4 border-b border-gray-100 bg-white shrink-0">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-bold text-gray-950">your photos</h2>
          <span className="text-xs text-gray-400 font-medium font-mono">
            {photos.length} added · {placedCount} used
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto scrollbar-none pb-0.5">
          <button
            type="button"
            onClick={() => setPhotoFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              photoFilter === 'all'
                ? 'bg-black text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:text-black hover:bg-gray-200'
            }`}
          >
            all ({photos.length})
          </button>

          {burstGroups.length > 0 && (
            <button
              type="button"
              onClick={() => setPhotoFilter('unique')}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
                photoFilter === 'unique'
                  ? 'bg-noir-950 text-foil-gold shadow-xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              <Star size={11} className="fill-foil-gold text-foil-gold" />
              <span>unique ({uniqueCount})</span>
            </button>
          )}

          {burstGroups.length > 0 && (
            <button
              type="button"
              onClick={() => setPhotoFilter('bursts')}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
                photoFilter === 'bursts'
                  ? 'bg-black text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:text-black hover:bg-gray-200'
              }`}
            >
              <Layers size={11} />
              <span>bursts ({burstCount})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setPhotoFilter('unused')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              photoFilter === 'unused'
                ? 'bg-black text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:text-black hover:bg-gray-200'
            }`}
          >
            unused ({photos.length - placedCount})
          </button>

          {reviewCount > 0 && (
            <button
              type="button"
              onClick={() => setPhotoFilter('flagged')}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
                photoFilter === 'flagged'
                  ? 'bg-rose-950 text-rose-200 shadow-xs'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              <span>⚠️ review</span>
              <span className="font-mono text-[10px]">({reviewCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Burst Cleanup Banner */}
      {burstGroups.length > 0 && (
        <div className="bg-amber-50/90 border-b border-amber-200/80 px-4 py-2 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-3.5 h-3.5 text-foil-gold shrink-0" />
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-gray-950 block truncate">
                {burstGroups.length} Burst Sets Detected
              </span>
              <span className="text-[10px] text-gray-500 font-mono block">
                Filter out duplicate continuous shots
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setBurstModalOpen(true)}
            className="px-2.5 py-1 bg-noir-950 text-foil-gold hover:bg-black rounded-lg text-[10px] font-bold font-mono uppercase tracking-wider shrink-0 shadow-2xs"
          >
            Clean Up
          </button>
        </div>
      )}
      
      {/* Photos Grid & Independent Scrolling Area */}
      {photos.length === 0 ? (
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-6 text-center text-gray-400">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3 text-gray-400 border border-gray-200">
            <ImageIcon size={22} />
          </div>
          <h4 className="text-xs font-bold text-gray-900 mb-1">no photos yet</h4>
          <p className="text-xs text-gray-400 leading-relaxed max-w-[200px]">
            add photos below from your device or cloud library.
          </p>
        </div>
      ) : filteredPhotos.length === 0 ? (
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-6 text-center text-gray-400">
          <p className="text-xs text-gray-400">no photos match selected filter.</p>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto p-3.5 grid grid-cols-2 gap-2.5 content-start">
          {filteredPhotos.map((photo) => {
            const isPlaced = (photo.usedCount || 0) > 0;
            const isExcluded = !!photo.isExcludedFromAutofill;

            return (
              <div 
                key={photo.id} 
                onClick={() => handlePhotoClick(photo)}
                className={`aspect-square bg-gray-100 rounded-xl relative group overflow-hidden cursor-pointer shadow-2xs border transition-all ${
                  photo.isBestPick
                    ? 'border-foil-gold/60 ring-1 ring-foil-gold/30'
                    : isExcluded
                    ? 'opacity-40 border-gray-200 grayscale-30'
                    : 'border-gray-100 hover:shadow-md'
                }`}
                title={
                  photo.isBestPick
                    ? 'Best pick from burst group (sharpest optics)'
                    : photo.isDuplicateOrBurst
                    ? 'Burst duplicate shot'
                    : 'Click to place into targeted layout slot'
                }
              >
                <img 
                  src={normalizeImageUrl(photo.url)} 
                  alt={photo.name || 'Photo'} 
                  data-original-url={photo.url}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                  onError={handleImageError}
                />
                
                {/* Quality & Burst Badges Container */}
                <div className="absolute top-1.5 left-1.5 z-10 pointer-events-none flex flex-col gap-1 items-start">
                  {/* Burst Best Pick Gold Star Badge */}
                  {photo.isBestPick && (
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-noir-950/95 text-foil-gold border border-foil-gold/60 shadow-xs flex items-center gap-1 backdrop-blur-xs">
                      <Star size={8} className="fill-foil-gold text-foil-gold" />
                      <span>best</span>
                    </span>
                  )}

                  {/* Non-best Burst Shot Badge */}
                  {!photo.isBestPick && photo.burstGroupId && (
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-black/75 text-gray-300 shadow-xs flex items-center gap-1 backdrop-blur-xs">
                      <span>burst</span>
                    </span>
                  )}

                  {/* Quality Pill */}
                  {photo.isBlurry ? (
                    <span
                      className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-rose-950/90 text-rose-300 border border-rose-500/60 shadow-xs flex items-center gap-1 backdrop-blur-xs"
                      title="Motion blur detected: may look soft in physical print"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                      <span>blurry</span>
                    </span>
                  ) : photo.qualityGrade === 'A+' ? (
                    <span
                      className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-emerald-950/90 text-emerald-300 border border-emerald-500/60 shadow-xs flex items-center gap-1 backdrop-blur-xs"
                      title="Gallery Ultra HD: 300+ DPI ready"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      <span>300+</span>
                    </span>
                  ) : photo.isLowRes ? (
                    <span
                      className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-amber-950/90 text-amber-300 border border-amber-500/60 shadow-xs flex items-center gap-1 backdrop-blur-xs"
                      title="Low resolution: recommend using in 2-4 photo grid layouts"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                      <span>grid</span>
                    </span>
                  ) : null}
                </div>

                {/* Placed badge */}
                {isPlaced && (
                  <div className="absolute bottom-1.5 right-1.5 w-5 h-5 rounded-full bg-black text-white flex items-center justify-center shadow-xs z-10 pointer-events-none">
                    <Check size={11} strokeWidth={3} />
                  </div>
                )}

                {/* Hover overlay with quick place buttons */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-1 z-20">
                  {isInsideSpread && (
                    <div className="flex gap-1 w-full px-1">
                      {isPanoramic ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            assignPhotoToSlot(`spread_${currentSpreadIndex}`, photo);
                          }}
                          className="flex-1 py-1 bg-white/95 hover:bg-white text-gray-900 rounded-md text-[10px] font-bold shadow-xs transition-colors"
                        >
                          Place Spread
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={(e) => handlePlaceLeft(e, photo)}
                            className="flex-1 py-1 bg-white/95 hover:bg-white text-gray-900 rounded-md text-[10px] font-bold shadow-xs transition-colors"
                          >
                            P.{leftPageNum}
                          </button>
                          <button
                            onClick={(e) => handlePlaceRight(e, photo)}
                            className="flex-1 py-1 bg-white/95 hover:bg-white text-gray-900 rounded-md text-[10px] font-bold shadow-xs transition-colors"
                          >
                            P.{rightPageNum}
                          </button>
                        </>
                      )}
                    </div>
                  )}
                  <span className="text-[10px] text-white font-medium">Click to place</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Upload and Cloud Import Action Buttons */}
      <div className="p-3.5 border-t border-gray-100 bg-white space-y-2 shrink-0">
        {isUploadingTray ? (
          <div className="w-full py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 flex items-center justify-center text-center gap-2 shadow-2xs">
            <Loader2 size={14} className="animate-spin text-black" />
            <span>uploading photo {trayProgress}...</span>
          </div>
        ) : (
          <label className="w-full py-2.5 bg-gray-50 border border-dashed border-gray-300 rounded-xl text-xs font-semibold text-gray-900 hover:border-black transition-colors flex items-center justify-center cursor-pointer text-center gap-1.5 shadow-2xs">
            <UploadCloud size={14} />
            <span>+ add photos</span>
            <input 
              type="file" 
              multiple 
              accept="image/*,.heic,.heif,.dng,.cr2,.nef,.arw,.tiff,.tif,.bmp,.webp,.avif" 
              className="hidden" 
              onChange={handleTrayUpload} 
            />
          </label>
        )}

        {/* Quick Google Cloud Import Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setCloudInitialTab('photos');
              setCloudPickerOpen(true);
            }}
            className="py-2 px-2.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 flex items-center justify-center gap-1.5 transition-colors shadow-2xs group"
          >
            <GooglePhotosLogo className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            <span>Google Photos</span>
          </button>
          
          <button
            type="button"
            onClick={() => {
              setCloudInitialTab('drive');
              setCloudPickerOpen(true);
            }}
            className="py-2 px-2.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 flex items-center justify-center gap-1.5 transition-colors shadow-2xs group"
          >
            <GoogleDriveLogo className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            <span>Google Drive</span>
          </button>
        </div>
      </div>

      {/* Cloud Photo Picker Modal */}
      <GooglePhotoPickerModal
        isOpen={cloudPickerOpen}
        onClose={() => setCloudPickerOpen(false)}
        initialTab={cloudInitialTab}
      />

      {/* Burst Cleanup Modal */}
      <BurstCleanupModal
        isOpen={burstModalOpen}
        onClose={() => setBurstModalOpen(false)}
      />
    </div>
  );
}
