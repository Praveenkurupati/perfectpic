'use client';

import { useState } from 'react';
import { useEditorStore, Photo } from '@/stores/useEditorStore';
import { UploadCloud, Check, Plus, Image as ImageIcon, Loader2 } from 'lucide-react';
import GooglePhotoPickerModal, { GooglePhotosLogo, GoogleDriveLogo } from '@/components/photos/GooglePhotoPickerModal';
import { compressImage, fileToDataUrl, isImageFile } from '@/lib/imageCompressor';
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
    pageLayouts
  } = useEditorStore();

  const [cloudPickerOpen, setCloudPickerOpen] = useState(false);
  const [cloudInitialTab, setCloudInitialTab] = useState<'photos' | 'drive'>('photos');
  const [isUploadingTray, setIsUploadingTray] = useState(false);
  const [trayProgress, setTrayProgress] = useState('');

  const handleTrayUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const fileArray = Array.from(e.target.files).filter(isImageFile);
    if (fileArray.length === 0) return;

    setIsUploadingTray(true);
    for (let idx = 0; idx < fileArray.length; idx++) {
      const file = fileArray[idx]!;
      setTrayProgress(`${idx + 1}/${fileArray.length}`);
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
          id: `upload-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
          url: photoUrl,
          usedCount: 0,
          flagged: false,
          name: file.name
        });
      } catch (err) {
        console.error('Tray upload error:', err);
      }
    }
    setIsUploadingTray(false);
    setTrayProgress('');
    e.target.value = '';
  };

  const filteredPhotos = photos.filter(p => {
    if (photoFilter === 'unused') return (p.usedCount || 0) === 0;
    if (photoFilter === 'flagged') return p.flagged;
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
        <div className="flex items-center gap-1.5 mt-2.5">
          <button
            type="button"
            onClick={() => setPhotoFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              photoFilter === 'all'
                ? 'bg-black text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:text-black hover:bg-gray-200'
            }`}
          >
            all ({photos.length})
          </button>
          <button
            type="button"
            onClick={() => setPhotoFilter('unused')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              photoFilter === 'unused'
                ? 'bg-black text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:text-black hover:bg-gray-200'
            }`}
          >
            unused ({photos.length - placedCount})
          </button>
        </div>
      </div>
      
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
          <p className="text-xs text-gray-400">no unused photos left.</p>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto p-3.5 grid grid-cols-2 gap-2.5 content-start">
          {filteredPhotos.map((photo) => {
            const isPlaced = (photo.usedCount || 0) > 0;

            return (
              <div 
                key={photo.id} 
                onClick={() => handlePhotoClick(photo)}
                className="aspect-square bg-gray-100 rounded-xl relative group overflow-hidden cursor-pointer shadow-2xs border border-gray-100 hover:shadow-md transition-all"
                title="Click to place into targeted layout slot"
              >
                <img 
                  src={normalizeImageUrl(photo.url)} 
                  alt={photo.name || 'Photo'} 
                  data-original-url={photo.url}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                  onError={handleImageError}
                />
                
                {/* Placed badge (Mockup circular checkmark in corner) */}
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
    </div>
  );
}
