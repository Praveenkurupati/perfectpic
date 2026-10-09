'use client';

import { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { 
  Plus, 
  Check, 
  Trash2, 
  AlertCircle, 
  Loader2 
} from 'lucide-react';
import { api } from '@/lib/api';
import { useEditorStore } from '@/stores/useEditorStore';
import { compressImage, fileToDataUrl, isImageFile } from '@/lib/imageCompressor';
import { normalizeImageUrl, handleImageError } from '@/lib/urls';
import { trackEvent } from '@/lib/analytics';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { getFallbackProduct } from '@/features/catalog/data/catalogFallback';
import GooglePhotoPickerModal, { GooglePhotosLogo, GoogleDriveLogo } from '@/components/photos/GooglePhotoPickerModal';

function UploadContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = (params?.projectId as string) || 'new-project';
  const templateSlug = searchParams.get('template') || 'travel-series-kerala';
  const sizeParam = searchParams.get('size') || '8.25';
  const pagesParam = searchParams.get('pages') || '32';
  const initialPageCount = parseInt(pagesParam, 10) || 32;

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { photos, addPhoto, removePhoto, setTemplate, setPageCount, initProject } = useEditorStore();
  
  // Selected photos for batch operations
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Template resolution
  const fallbackBook = useMemo(() => getFallbackProduct(templateSlug), [templateSlug]);
  const [templateData, setTemplateData] = useState<any>(fallbackBook || null);

  // Upload progress state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadTotal, setUploadTotal] = useState<number>(0);
  const [uploadCurrent, setUploadCurrent] = useState<number>(0);
  const [uploadPercent, setUploadPercent] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const [validationAlert, setValidationAlert] = useState<string | null>(null);

  // Cloud pickers & modals
  const [pickerModalOpen, setPickerModalOpen] = useState(false);
  const [pickerInitialTab, setPickerInitialTab] = useState<'photos' | 'drive'>('photos');
  const [cloudToast, setCloudToast] = useState<string | null>(null);
  const [showLeaveConfirmModal, setShowLeaveConfirmModal] = useState(false);
  const [pendingNavigationUrl, setPendingNavigationUrl] = useState<string | null>(null);

  // Warn user on browser refresh, tab close, or reload if photos have been uploaded
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (photos.length > 0) {
        e.preventDefault();
        e.returnValue = 'You have uploaded photos. If you leave or refresh this page, your photos will be lost and you will need to re-upload them.';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [photos.length]);

  // Initialize project state
  useEffect(() => {
    if (projectId) {
      initProject(projectId, {
        pages: initialPageCount,
      });
      setPageCount(initialPageCount);
    }
  }, [projectId, initProject, initialPageCount, setPageCount]);

  // Fetch product template from API if available
  useEffect(() => {
    if (templateSlug) {
      api.getProduct(templateSlug)
        .then((res) => {
          if (res) {
            setTemplate(res);
            setTemplateData(res);
          }
        })
        .catch(() => {
          // Graceful fallback to static catalog
          if (fallbackBook) {
            setTemplate(fallbackBook);
            setTemplateData(fallbackBook);
          }
        });
    }
  }, [templateSlug, setTemplate, fallbackBook]);

  // File upload processor
  const processFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(isImageFile);
    if (fileArray.length === 0) {
      setValidationAlert('No supported image files detected. We accept JPEG, PNG, HEIC, WebP, TIFF, and RAW photos.');
      return;
    }

    setIsUploading(true);
    setValidationAlert(null);
    const total = fileArray.length;
    setUploadTotal(total);
    setUploadCurrent(0);
    setUploadPercent(0);

    for (let i = 0; i < total; i++) {
      const file = fileArray[i]!;
      setUploadCurrent(i + 1);
      const pct = Math.round(((i + 1) / total) * 100);
      setUploadPercent(pct);

      try {
        const compressed = await compressImage(file, { maxDimension: 2400, quality: 0.85 });

        let photoUrl = '';
        try {
          const res = await api.uploadPhoto(compressed);
          photoUrl = res.url;
        } catch (uploadErr) {
          console.warn('API upload fallback to data URL:', uploadErr);
          photoUrl = await fileToDataUrl(compressed);
        }

        addPhoto({
          id: `upload-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`,
          url: photoUrl,
          usedCount: 0,
          flagged: false,
          name: file.name
        });
      } catch (err) {
        console.error('Failed to process photo:', file.name, err);
      }
    }

    setIsUploading(false);
    setUploadTotal(0);
    setUploadCurrent(0);
    setUploadPercent(0);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleNavigationAttempt = (targetUrl: string) => {
    if (photos.length > 0) {
      setPendingNavigationUrl(targetUrl);
      setShowLeaveConfirmModal(true);
    } else {
      router.push(targetUrl);
    }
  };

  const handleContinue = () => {
    if (photos.length === 0) {
      setValidationAlert('Please add at least 1 photo before proceeding to customise.');
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }

    trackEvent('photo_upload', `Uploaded ${photos.length} Photos (Target: ${initialPageCount} Pages)`, {
      photosCount: photos.length,
      projectId,
      pages: initialPageCount,
      template: templateSlug || 'custom',
    });

    const targetUrl = `/processing/${projectId}?pages=${initialPageCount}&template=${encodeURIComponent(templateSlug)}&size=${encodeURIComponent(sizeParam)}`;
    router.push(targetUrl);
  };

  const handleAddMoreLater = () => {
    trackEvent('photo_upload', 'Add More Later Clicked', {
      photosCount: photos.length,
      projectId,
    });
    const targetUrl = `/studio/${projectId}?pages=${initialPageCount}&template=${encodeURIComponent(templateSlug)}&size=${encodeURIComponent(sizeParam)}`;
    router.push(targetUrl);
  };

  // Selection handlers
  const toggleSelectPhoto = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === photos.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(photos.map(p => p.id));
    }
  };

  const handleDeleteSelected = () => {
    selectedIds.forEach(id => removePhoto(id));
    setSelectedIds([]);
  };

  // Book metadata
  const displayTitle = (templateData?.shortTitle || fallbackBook?.shortTitle || templateData?.displayName || 'kerala').toLowerCase();
  const seriesLabel = (templateData?.seriesLabel || fallbackBook?.seriesLabel || 'travel series').toLowerCase();
  const bookCoverImage = templateData?.coverImage || fallbackBook?.coverImage || 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&auto=format&fit=crop';
  const displayDimensions = sizeParam === '10' ? '10" × 10"' : '8.25" × 8.25"';

  return (
    <div className="min-h-screen bg-[#F4F2EC] font-sans text-black scroll-smooth">
      {/* 1. Header with Logo, Step Indicator, and Save & Exit */}
      <header className="bg-white border-b border-[#ECEAE4] sticky top-0 z-40 px-4 md:px-8 py-3.5">
        <div className="max-w-[1240px] mx-auto flex items-center justify-between">
          {/* Left: Brand Logo */}
          <button 
            type="button" 
            onClick={() => handleNavigationAttempt('/')}
            className="flex items-center select-none"
            title="Return to Home"
          >
            <BrandLogo variant="light" showSubtitle={false} height={26} className="h-6.5 w-auto" />
          </button>

          {/* Center: Stepper (upload · customise · review · checkout) */}
          <nav aria-label="Creation Progress" className="flex items-center gap-4 sm:gap-6 md:gap-8">
            {/* Step 1: upload (Active) */}
            <div className="flex items-center gap-1.5 md:gap-2">
              <span className="w-5 h-5 rounded-full bg-black text-white text-[11px] font-bold flex items-center justify-center">
                1
              </span>
              <span className="text-xs font-bold text-black lowercase">
                upload
              </span>
            </div>

            {/* Step 2: customise */}
            <div className="flex items-center gap-1.5 md:gap-2 text-[#8A8780]">
              <span className="w-5 h-5 rounded-full bg-[#D4D1CA] text-white text-[11px] font-medium flex items-center justify-center">
                2
              </span>
              <span className="text-xs font-medium lowercase hidden sm:inline">
                customise
              </span>
            </div>

            {/* Step 3: review */}
            <div className="flex items-center gap-1.5 md:gap-2 text-[#8A8780]">
              <span className="w-5 h-5 rounded-full bg-[#D4D1CA] text-white text-[11px] font-medium flex items-center justify-center">
                3
              </span>
              <span className="text-xs font-medium lowercase hidden sm:inline">
                review
              </span>
            </div>

            {/* Step 4: checkout */}
            <div className="flex items-center gap-1.5 md:gap-2 text-[#8A8780]">
              <span className="w-5 h-5 rounded-full bg-[#D4D1CA] text-white text-[11px] font-medium flex items-center justify-center">
                4
              </span>
              <span className="text-xs font-medium lowercase hidden sm:inline">
                checkout
              </span>
            </div>
          </nav>

          {/* Right: Save & Exit */}
          <div>
            <button
              type="button"
              onClick={() => handleNavigationAttempt('/projects')}
              className="text-xs font-medium text-black hover:opacity-70 transition-opacity lowercase"
            >
              save & exit
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Page Layout */}
      <main className="max-w-[1240px] mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column (8 cols): Title, Drag Box, Uploaded Grid */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Title & Description */}
            <div>
              <span className="text-xs text-[#7A7873] font-normal lowercase block mb-1.5">
                step 1 of 4
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-black lowercase mb-2">
                add your photos.
              </h1>
              <p className="text-xs sm:text-sm text-[#5C5A55] leading-relaxed max-w-2xl lowercase">
                add up to 120 photos. we'll arrange them into spreads in about 60 seconds, and you can change anything.
              </p>
            </div>

            {/* Validation Banner if present */}
            {validationAlert && (
              <div className="bg-red-50 border border-red-200 text-red-800 text-xs rounded-2xl p-4 flex items-center justify-between gap-3 animate-fade-in">
                <div className="flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0 text-red-600" />
                  <span>{validationAlert}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setValidationAlert(null)}
                  className="text-red-900 font-bold hover:underline shrink-0"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Cloud Toast if present */}
            {cloudToast && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-2xl p-4 flex items-center justify-between gap-3 animate-fade-in">
                <span>{cloudToast}</span>
                <button
                  type="button"
                  onClick={() => setCloudToast(null)}
                  className="text-emerald-950 font-bold hover:underline shrink-0"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Drag & Drop Photos Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border border-dashed ${
                isDragging ? 'border-black bg-black/[0.03]' : 'border-[#B8B4AA] bg-transparent'
              } rounded-3xl p-8 md:p-12 flex flex-col items-center justify-center text-center transition-all`}
            >
              <button
                type="button"
                onClick={triggerFileInput}
                className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center mb-3.5 shadow-xs hover:scale-105 transition-transform"
                aria-label="Add photos"
              >
                <Plus size={22} className="stroke-[2.5]" />
              </button>

              <h3 className="text-lg md:text-xl font-bold text-black tracking-tight mb-1 lowercase">
                drag photos here
              </h3>

              <p className="text-xs md:text-sm text-[#7A7873] mb-4.5 lowercase">
                or choose from your device — jpg, png or heic
              </p>

              <button
                type="button"
                onClick={triggerFileInput}
                disabled={isUploading}
                className="bg-black hover:bg-neutral-800 text-white text-xs md:text-sm font-semibold px-7 py-3 rounded-full transition-colors shadow-xs lowercase"
              >
                choose from device
              </button>

              {/* Cloud photo picker shortcuts */}
              <div className="flex items-center gap-3.5 mt-4 pt-3 border-t border-black/5 text-[11px] text-[#7A7873]">
                <span>or import from:</span>
                <button
                  type="button"
                  onClick={() => { setPickerInitialTab('photos'); setPickerModalOpen(true); }}
                  className="inline-flex items-center gap-1.5 hover:text-black transition-colors font-medium lowercase"
                >
                  <GooglePhotosLogo className="w-3.5 h-3.5" />
                  <span>google photos</span>
                </button>
                <span className="text-black/20">·</span>
                <button
                  type="button"
                  onClick={() => { setPickerInitialTab('drive'); setPickerModalOpen(true); }}
                  className="inline-flex items-center gap-1.5 hover:text-black transition-colors font-medium lowercase"
                >
                  <GoogleDriveLogo className="w-3.5 h-3.5" />
                  <span>google drive</span>
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.heic,.heif,.dng,.cr2,.nef,.arw,.tiff,.tif,.bmp,.webp,.avif"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
              />
            </div>

            {/* Uploaded Photos Section */}
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm md:text-base text-black lowercase">
                    uploaded · {photos.length} photo{photos.length === 1 ? '' : 's'}
                  </h3>
                  {selectedIds.length > 0 && (
                    <span className="text-xs text-[#7A7873]">
                      ({selectedIds.length} selected)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {selectedIds.length > 0 && (
                    <button
                      type="button"
                      onClick={handleDeleteSelected}
                      className="text-xs text-red-600 hover:text-red-700 font-medium transition-colors lowercase cursor-pointer"
                    >
                      delete selected
                    </button>
                  )}
                  {photos.length > 0 && (
                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      className="text-xs text-[#7A7873] hover:text-black font-medium transition-colors lowercase cursor-pointer"
                    >
                      {selectedIds.length === photos.length ? 'deselect all' : 'select all'}
                    </button>
                  )}
                </div>
              </div>

              {/* 6-Column Responsive Photo Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 md:gap-3.5">
                {/* 1. Uploaded Photos */}
                {photos.map((photo, idx) => {
                  const isSelected = selectedIds.includes(photo.id);
                  return (
                    <div
                      key={photo.id}
                      onClick={() => toggleSelectPhoto(photo.id)}
                      className={`aspect-square rounded-2xl overflow-hidden relative group bg-[#D8D4CC] cursor-pointer transition-all ${
                        isSelected ? 'ring-2 ring-black ring-offset-2' : 'hover:opacity-95'
                      }`}
                    >
                      <img
                        src={normalizeImageUrl(photo.url)}
                        alt={photo.name || `Photo ${idx + 1}`}
                        className="w-full h-full object-cover"
                        onError={handleImageError}
                      />

                      {/* Selection circle indicator */}
                      <div className={`absolute top-2 left-2 w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                        isSelected ? 'bg-black text-white' : 'bg-black/30 backdrop-blur-xs text-transparent opacity-0 group-hover:opacity-100'
                      }`}>
                        <Check size={12} className="stroke-[3]" />
                      </div>

                      {/* Delete button on hover */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removePhoto(photo.id);
                          setSelectedIds(prev => prev.filter(id => id !== photo.id));
                        }}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/90 text-red-600 hover:bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-xs"
                        title="Remove photo"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  );
                })}

                {/* 2. Active Uploading State Tile (Matches design mockup exactly) */}
                {isUploading && (
                  <div className="aspect-square rounded-2xl bg-[#484642] flex flex-col items-center justify-center p-3 text-center text-white relative overflow-hidden shadow-xs animate-pulse">
                    <span className="text-[11px] md:text-xs font-medium text-white/90 lowercase">
                      uploading
                    </span>
                    <span className="text-xs md:text-sm font-bold text-white font-mono mt-0.5">
                      {uploadPercent}%
                    </span>
                    <div className="w-3/4 h-1 bg-white/20 rounded-full mt-3 overflow-hidden">
                      <div
                        className="h-full bg-white rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(10, uploadPercent)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* 3. Empty Placeholders if 0 photos and not uploading */}
                {photos.length === 0 && !isUploading && (
                  <>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        onClick={triggerFileInput}
                        className="aspect-square rounded-2xl bg-[#E6E2D8]/70 border border-dashed border-[#D2CDC3] flex items-center justify-center cursor-pointer hover:bg-[#E0DBD0] transition-colors"
                        title="Click to add photos"
                      >
                        <span className="text-[#9E9A90] text-lg font-light">+</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Column (4 cols): Sticky Book Summary Card */}
          <div className="lg:col-span-4 sticky top-24">
            <div className="bg-white rounded-3xl p-6 md:p-7 shadow-xs border border-black/5">
              
              {/* Book Spec Summary Header */}
              <div className="flex items-start gap-4">
                {/* Book Cover Thumbnail */}
                <div className="w-20 h-24 rounded-2xl bg-[#E2DDD5] overflow-hidden shrink-0 border border-black/5 relative shadow-2xs flex items-center justify-center">
                  {bookCoverImage ? (
                    <img
                      src={bookCoverImage}
                      alt={displayTitle}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-[#7A7873] font-medium">cover</span>
                  )}
                  {/* Spine Crease / Shading on left edge */}
                  <div className="absolute inset-y-0 left-0 w-2.5 bg-gradient-to-r from-black/20 to-transparent pointer-events-none" />
                </div>

                {/* Book Details */}
                <div className="min-w-0 flex-1">
                  <span className="text-xs text-[#8A8780] font-medium block lowercase truncate">
                    {seriesLabel}
                  </span>
                  <h2 className="text-2xl font-bold text-black tracking-tight block mt-0.5 lowercase truncate">
                    {displayTitle}
                  </h2>
                  <span className="text-xs text-[#7A7873] block mt-1.5 font-medium">
                    {displayDimensions}
                  </span>
                  <span className="text-xs text-[#7A7873] block">
                    hardcover · lay-flat
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-[#ECEAE3] my-5" />

              {/* Progress Tracker */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-[#7A7873] lowercase font-medium">photos added</span>
                  <span className="font-bold text-black font-mono">
                    {photos.length} / 120
                  </span>
                </div>
                <div className="w-full h-1 bg-[#ECEAE3] rounded-full overflow-hidden mb-6">
                  <div
                    className="h-full bg-black rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (photos.length / 120) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Tips for the best print */}
              <div className="mb-6">
                <h4 className="text-xs font-bold text-black mb-3 lowercase tracking-tight">
                  tips for the best print
                </h4>
                <ul className="space-y-2 text-xs text-[#5C5A55] leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="text-black font-bold shrink-0">✓</span>
                    <span>use original, high-resolution files</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-black font-bold shrink-0">✓</span>
                    <span>portrait and landscape both work</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-black font-bold shrink-0">✓</span>
                    <span>pick your favourites — fewer, better photos</span>
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-1">
                <button
                  type="button"
                  onClick={handleContinue}
                  className="w-full bg-black hover:bg-neutral-800 text-white text-sm font-semibold py-3.5 rounded-full transition-colors lowercase shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>continue</span>
                </button>
                <button
                  type="button"
                  onClick={handleAddMoreLater}
                  className="w-full bg-white border border-[#D0CCC3] hover:bg-[#FAF8F5] text-black text-sm font-medium py-3 rounded-full transition-colors lowercase flex items-center justify-center cursor-pointer"
                >
                  <span>add more later</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Leave Page Confirmation Modal */}
      {showLeaveConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-[#ECEAE4] max-w-md w-full p-6 text-black space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <AlertCircle size={20} />
              </div>
              <div>
                <h3 className="font-bold text-base text-black lowercase">
                  leave upload page?
                </h3>
                <p className="text-xs text-[#7A7873] lowercase">
                  you have {photos.length} uploaded photo{photos.length === 1 ? '' : 's'} in this session.
                </p>
              </div>
            </div>

            <div className="bg-[#FAF8F5] border border-[#EBE8E1] rounded-2xl p-3.5 text-xs text-[#5C5A55] leading-relaxed lowercase">
              if you leave without proceeding, your unassigned photos may need to be re-uploaded.
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowLeaveConfirmModal(false);
                  setPendingNavigationUrl(null);
                }}
                className="px-5 py-2.5 text-xs font-semibold text-black bg-[#F4F2EC] hover:bg-[#EAE7DF] rounded-full transition-colors lowercase"
              >
                stay & keep photos
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLeaveConfirmModal(false);
                  if (pendingNavigationUrl) {
                    router.push(pendingNavigationUrl);
                  }
                }}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-black hover:bg-neutral-800 rounded-full transition-colors lowercase shadow-xs"
              >
                leave page
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cloud Photo Pickers Modal */}
      <GooglePhotoPickerModal
        isOpen={pickerModalOpen}
        onClose={() => setPickerModalOpen(false)}
        initialTab={pickerInitialTab}
        onImportSuccess={(count) => {
          setCloudToast(
            `Successfully imported ${count} photo${count === 1 ? '' : 's'} from Google ${
              pickerInitialTab === 'photos' ? 'Photos' : 'Drive'
            }!`
          );
          setTimeout(() => setCloudToast(null), 5000);
        }}
      />
    </div>
  );
}

export default function UploadPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#F4F2EC]">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <UploadContent />
    </Suspense>
  );
}
