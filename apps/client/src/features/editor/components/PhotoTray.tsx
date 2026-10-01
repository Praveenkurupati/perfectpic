'use client';

import { useState } from 'react';
import { useEditorStore, Photo } from '@/stores/useEditorStore';
import { UploadCloud, Check, Plus, ArrowLeftRight, Image as ImageIcon, Cloud, Loader2 } from 'lucide-react';
import GooglePhotoPickerModal, { GooglePhotosLogo, GoogleDriveLogo } from '@/components/photos/GooglePhotoPickerModal';
import { compressImage, fileToDataUrl, isImageFile } from '@/lib/imageCompressor';
import { api } from '@/lib/api';
import { normalizeImageUrl } from '@/lib/urls';

const defaultSamplePhotos: Photo[] = [
  { id: 'sample-1', url: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop', usedCount: 0, flagged: false, name: 'Himalayan Ridge' },
  { id: 'sample-2', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop', usedCount: 0, flagged: false, name: 'Alpine Summit' },
  { id: 'sample-3', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop', usedCount: 0, flagged: false, name: 'Yosemite Mist' },
  { id: 'sample-4', url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=800&auto=format&fit=crop', usedCount: 0, flagged: false, name: 'Coffee Mountain' },
  { id: 'sample-5', url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop', usedCount: 0, flagged: false, name: 'Parisian Avenue' },
  { id: 'sample-6', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop', usedCount: 0, flagged: false, name: 'Golden Sands' }
];

export default function PhotoTray() {
  const { 
    photos, 
    photoFilter, 
    setPhotoFilter, 
    addPhoto, 
    selectedSlot, 
    setSelectedSlot,
    assignPhotoToPage,
    assignPhotoToSlot,
    currentSpreadIndex,
    pageCount,
    pagePhotos,
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

  const displayPhotos: Photo[] = photos.length > 0 ? photos : defaultSamplePhotos;

  const filteredPhotos = displayPhotos.filter(p => {
    if (photoFilter === 'unused') return (p.usedCount || 0) === 0;
    if (photoFilter === 'flagged') return p.flagged;
    return true;
  });

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
      : leftPageNum.toString();
    const targetSlot = selectedSlot || defaultSlot;
    assignPhotoToSlot(targetSlot, photo);
  };

  const handlePlaceLeft = (e: React.MouseEvent, photo: Photo) => {
    e.stopPropagation();
    assignPhotoToSlot(leftPageNum.toString(), photo);
    setSelectedSlot(rightPageNum.toString());
  };

  const handlePlaceRight = (e: React.MouseEvent, photo: Photo) => {
    e.stopPropagation();
    assignPhotoToSlot(rightPageNum.toString(), photo);
    setSelectedSlot(rightPageNum < pageCount ? (rightPageNum + 1).toString() : null);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Tray Header */}
      <div className="p-3 border-b border-cream-300 bg-cream-50/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-noir-900">
            Photos ({displayPhotos.length})
          </span>
          {selectedSlot !== null ? (
            <span className="text-[10px] text-foil-gold font-semibold uppercase tracking-wider font-mono">
              Target: {selectedSlot.startsWith('spread_') ? 'Panoramic Spread' : `Slot ${selectedSlot}`}
            </span>
          ) : isPanoramic ? (
            <span className="text-[10px] text-foil-gold font-semibold uppercase tracking-wider font-mono">
              Target: Panoramic Spread
            </span>
          ) : null}
        </div>
        <p className="text-[11px] text-noir-500 leading-tight">
          {isPanoramic
            ? 'Click any photo to span across the double-page panoramic spread.'
            : 'Click any photo to assign into the active page or selected layout slot.'}
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-cream-200 text-[11px] uppercase tracking-wider font-semibold">
        {[
          { key: 'all', label: `All (${displayPhotos.length})` },
          { key: 'unused', label: 'Unused' }
        ].map(filter => (
          <button 
            key={filter.key}
            onClick={() => setPhotoFilter(filter.key as any)}
            className={`flex-1 py-2 text-center border-b-2 transition-colors ${
              photoFilter === filter.key 
                ? 'border-noir-950 text-noir-950 font-bold' 
                : 'border-transparent text-noir-400 hover:text-noir-700'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>
      
      {/* Photos Grid */}
      <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-2 content-start">
        {filteredPhotos.map((photo) => {
          const isPlaced = (photo.usedCount || 0) > 0;

          return (
            <div 
              key={photo.id} 
              onClick={() => handlePhotoClick(photo)}
              className="aspect-square bg-cream-100 rounded-sm relative group overflow-hidden cursor-pointer shadow-xs border border-cream-300 hover:border-foil-gold transition-all"
              title="Click to place on target page or slot"
            >
              <img 
                src={normalizeImageUrl(photo.url)} 
                alt={photo.name || 'Photo'} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
              />
              
              {/* Placed badge */}
              {isPlaced && (
                <span className="absolute top-1 right-1 bg-black/75 backdrop-blur-xs text-cream-50 text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-[2px] font-semibold flex items-center gap-0.5">
                  <Check size={10} /> Placed
                </span>
              )}

              {/* Hover overlay with quick place buttons */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-1">
                {isInsideSpread && (
                  <div className="flex gap-1 w-full">
                    {isPanoramic ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          assignPhotoToSlot(`spread_${currentSpreadIndex}`, photo);
                        }}
                        className="flex-1 py-1 bg-white/90 hover:bg-white text-noir-900 rounded-[2px] text-[10px] font-bold shadow-xs transition-colors"
                      >
                        Place Panoramic Spread
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={(e) => handlePlaceLeft(e, photo)}
                          className="flex-1 py-1 bg-white/90 hover:bg-white text-noir-900 rounded-[2px] text-[10px] font-bold shadow-xs transition-colors"
                        >
                          P.{leftPageNum}
                        </button>
                        <button
                          onClick={(e) => handlePlaceRight(e, photo)}
                          className="flex-1 py-1 bg-white/90 hover:bg-white text-noir-900 rounded-[2px] text-[10px] font-bold shadow-xs transition-colors"
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
      
      {/* Upload and Cloud Import Action Buttons */}
      <div className="p-3 border-t border-cream-300 bg-cream-50 space-y-2">
        {isUploadingTray ? (
          <div className="w-full py-2 bg-cream-100 border border-foil-gold/50 rounded-sm text-xs font-semibold text-noir-900 flex items-center justify-center text-center gap-1.5 shadow-xs">
            <Loader2 size={14} className="text-foil-gold animate-spin" />
            <span>Uploading photo {trayProgress}...</span>
          </div>
        ) : (
          <label className="w-full py-2 bg-white border border-dashed border-cream-400 rounded-sm text-xs font-semibold text-noir-900 hover:border-noir-950 transition-colors flex items-center justify-center cursor-pointer text-center gap-1.5 shadow-xs">
            <UploadCloud size={14} />
            <span>Upload from Device</span>
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
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => {
              setCloudInitialTab('photos');
              setCloudPickerOpen(true);
            }}
            className="py-1.5 px-2 bg-white hover:bg-cream-100 border border-cream-300 rounded-sm text-[11px] font-semibold text-noir-900 flex items-center justify-center gap-1.5 transition-colors shadow-xs group"
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
            className="py-1.5 px-2 bg-white hover:bg-cream-100 border border-cream-300 rounded-sm text-[11px] font-semibold text-noir-900 flex items-center justify-center gap-1.5 transition-colors shadow-xs group"
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
