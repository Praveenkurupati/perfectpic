'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { 
  Plus, 
  Trash2, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  Eye, 
  Download 
} from 'lucide-react';
import { api } from '@/lib/api';
import { useEditorStore, Photo } from '@/stores/useEditorStore';
import { compressImage, fileToDataUrl, isImageFile } from '@/lib/imageCompressor';
import { normalizeImageUrl, handleImageError } from '@/lib/urls';
import { trackEvent } from '@/lib/analytics';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { getFallbackProduct } from '@/features/catalog/data/catalogFallback';
import GooglePhotoPickerModal, { GooglePhotosLogo, GoogleDriveLogo } from '@/components/photos/GooglePhotoPickerModal';

interface FailedUploadItem {
  id: string;
  file: File;
  name: string;
  previewUrl: string;
  error?: string;
}

interface UploadingItem {
  id: string;
  name: string;
  progress: number;
}

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

  // Failed uploads tracking for retry functionality
  const [failedUploads, setFailedUploads] = useState<FailedUploadItem[]>([]);
  // Currently uploading items
  const [uploadingQueue, setUploadingQueue] = useState<UploadingItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [validationAlert, setValidationAlert] = useState<string | null>(null);

  // Photo Preview Modal (Lightbox) state
  const [previewPhotoIndex, setPreviewPhotoIndex] = useState<number | null>(null);

  // Template resolution
  const fallbackBook = useMemo(() => getFallbackProduct(templateSlug), [templateSlug]);
  const [templateData, setTemplateData] = useState<any>(fallbackBook || null);

  // Cloud pickers
  const [pickerModalOpen, setPickerModalOpen] = useState(false);
  const [pickerInitialTab, setPickerInitialTab] = useState<'photos' | 'drive'>('photos');

  // Initialize project state
  useEffect(() => {
    if (projectId) {
      initProject(projectId, { pages: initialPageCount });
      setPageCount(initialPageCount);
    }
  }, [projectId, initProject, initialPageCount, setPageCount]);

  // Fetch product template
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
          if (fallbackBook) {
            setTemplate(fallbackBook);
            setTemplateData(fallbackBook);
          }
        });
    }
  }, [templateSlug, setTemplate, fallbackBook]);

  /**
   * Fast Batch Image Processor with Promise.all
   * Concurrently compresses and uploads photos in parallel for maximum speed.
   */
  const uploadBatch = useCallback(async (filesToUpload: { file: File; id?: string }[]) => {
    if (filesToUpload.length === 0) return;

    setIsUploading(true);
    setValidationAlert(null);

    // Create queue items
    const newQueueItems: UploadingItem[] = filesToUpload.map(({ file, id }) => ({
      id: id || `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: file.name,
      progress: 10,
    }));

    setUploadingQueue((prev) => [...prev, ...newQueueItems]);

    // Use Promise.all to process all images at once
    const uploadPromises = filesToUpload.map(async ({ file, id }) => {
      const uploadId = id || `upload-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      let localBlobUrl = '';

      try {
        localBlobUrl = URL.createObjectURL(file);

        // 1. Fast parallel client compression (max 2400px, 0.85 quality)
        const compressed = await compressImage(file, { maxDimension: 2400, quality: 0.85 });

        // Update progress in queue
        setUploadingQueue((prev) =>
          prev.map((q) => (q.id === uploadId ? { ...q, progress: 60 } : q))
        );

        // 2. Direct S3 or API streaming upload
        let finalUrl = '';
        try {
          const res = await api.uploadPhoto(compressed);
          finalUrl = res.url;
        } catch (netErr) {
          console.warn('API upload fallback to data URL:', netErr);
          finalUrl = await fileToDataUrl(compressed);
        }

        // 3. Add to editor store
        addPhoto({
          id: uploadId,
          url: finalUrl,
          usedCount: 0,
          flagged: false,
          name: file.name,
        });

        // Remove from failed uploads if it was previously failing
        setFailedUploads((prev) => prev.filter((item) => item.id !== uploadId));

        return { success: true, id: uploadId };
      } catch (err: any) {
        console.error(`Upload failed for ${file.name}:`, err);

        // Track as failed upload for retry
        setFailedUploads((prev) => {
          const exists = prev.some((p) => p.id === uploadId);
          if (exists) return prev;
          return [
            ...prev,
            {
              id: uploadId,
              file,
              name: file.name,
              previewUrl: localBlobUrl || '',
              error: err?.message || 'Upload failed',
            },
          ];
        });

        return { success: false, id: uploadId, file, name: file.name };
      } finally {
        // Remove from uploading queue
        setUploadingQueue((prev) => prev.filter((q) => q.id !== uploadId));
      }
    });

    await Promise.all(uploadPromises);
    setIsUploading(false);
  }, [addPhoto]);

  // Handle file selection from input or dropzone
  const processFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(isImageFile);
    if (fileArray.length === 0) {
      setValidationAlert('No supported image files detected. Please use JPG, PNG, WebP or HEIC.');
      return;
    }

    const items = fileArray.map((file) => ({
      file,
      id: `photo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    }));

    uploadBatch(items);
  };

  // Retry All failed uploads at once
  const handleRetryAll = () => {
    if (failedUploads.length === 0) return;
    const itemsToRetry = failedUploads.map((f) => ({ file: f.file, id: f.id }));
    uploadBatch(itemsToRetry);
  };

  // Retry a single failed photo
  const handleRetrySingle = (item: FailedUploadItem) => {
    uploadBatch([{ file: item.file, id: item.id }]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
      e.target.value = ''; // Reset input to allow re-uploading same file
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

  const handleContinue = () => {
    if (photos.length === 0) {
      setValidationAlert('Please add at least 1 photo before proceeding.');
      return;
    }

    trackEvent('photo_upload', `Uploaded ${photos.length} Photos`, {
      photosCount: photos.length,
      projectId,
      pages: initialPageCount,
      template: templateSlug || 'custom',
    });

    const targetUrl = `/processing/${projectId}?pages=${initialPageCount}&template=${encodeURIComponent(templateSlug)}&size=${encodeURIComponent(sizeParam)}`;
    router.push(targetUrl);
  };

  // Lightbox Preview Handlers
  const openPreview = (index: number) => {
    setPreviewPhotoIndex(index);
  };

  const closePreview = () => {
    setPreviewPhotoIndex(null);
  };

  const nextPreview = () => {
    if (previewPhotoIndex !== null && photos.length > 0) {
      setPreviewPhotoIndex((previewPhotoIndex + 1) % photos.length);
    }
  };

  const prevPreview = () => {
    if (previewPhotoIndex !== null && photos.length > 0) {
      setPreviewPhotoIndex((previewPhotoIndex - 1 + photos.length) % photos.length);
    }
  };

  // Handle keyboard navigation for preview lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (previewPhotoIndex === null) return;
      if (e.key === 'Escape') closePreview();
      if (e.key === 'ArrowRight') nextPreview();
      if (e.key === 'ArrowLeft') prevPreview();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewPhotoIndex, photos.length]);

  // Book metadata
  const displayTitle = (templateData?.shortTitle || fallbackBook?.shortTitle || templateData?.displayName || 'kerala').toLowerCase();
  const seriesLabel = (templateData?.seriesLabel || fallbackBook?.seriesLabel || 'travel series').toLowerCase();
  const bookCoverImage = templateData?.coverImage || fallbackBook?.coverImage || 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&auto=format&fit=crop';

  const totalAttempted = photos.length + failedUploads.length;

  return (
    <div className="min-h-screen bg-[#F4F2ED] font-sans text-[#0A0A0A] flex flex-col justify-between selection:bg-[#0A0A0A] selection:text-white">
      {/* 1. Header matching media_1792056417094.png */}
      <header className="bg-white border-b border-[#ECEAE4] sticky top-0 z-40 px-4 sm:px-6 md:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Left: Brand Logo */}
          <Link href="/" className="flex items-center" aria-label="perfectpic homepage">
            <BrandLogo variant="light" height={30} className="h-7 md:h-7.5 w-auto" />
          </Link>

          {/* Right: need help? link */}
          <Link
            href="/faq"
            className="text-xs md:text-sm font-medium text-[#0A0A0A] hover:underline transition-all lowercase"
          >
            need help?
          </Link>
        </div>
      </header>

      {/* 2. Main Page Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-12 w-full flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Column (8 cols): Title, Banners, Upload Dropzone, Photos Grid */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Step label & Heading */}
            <div>
              <span className="text-xs text-[#706E69] font-medium lowercase block mb-1">
                step 1 of 4
              </span>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#0A0A0A] lowercase">
                add your photos.
              </h1>
            </div>

            {/* Validation Banner if format error */}
            {validationAlert && (
              <div className="bg-white border border-red-300 text-red-900 text-xs rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs">
                <span>{validationAlert}</span>
                <button
                  type="button"
                  onClick={() => setValidationAlert(null)}
                  className="font-bold text-red-900 hover:underline shrink-0"
                >
                  dismiss
                </button>
              </div>
            )}

            {/* 3. Failed Upload Banner matching reference design */}
            {failedUploads.length > 0 && (
              <div className="bg-white rounded-2xl border border-[#0A0A0A] p-4 sm:p-5 flex items-center justify-between gap-4 shadow-xs animate-in fade-in">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Black circle with exclamation icon */}
                  <div className="w-8 h-8 rounded-full bg-[#0A0A0A] text-white flex items-center justify-center font-bold text-sm shrink-0">
                    !
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-bold text-[#0A0A0A] leading-tight">
                      {failedUploads.length} {failedUploads.length === 1 ? "photo couldn't" : "photos couldn't"} be uploaded.
                    </h3>
                    <p className="text-[11px] sm:text-xs text-[#706E69] mt-0.5 leading-snug">
                      check the format (jpg, png or heic) and try again.
                    </p>
                  </div>
                </div>

                {/* Solid Black Retry All Button */}
                <button
                  type="button"
                  onClick={handleRetryAll}
                  disabled={isUploading}
                  className="bg-[#0A0A0A] hover:bg-black text-white px-5 sm:px-6 py-2.5 rounded-full text-xs sm:text-sm font-medium transition-colors shrink-0 lowercase disabled:opacity-50"
                >
                  {isUploading ? 'retrying...' : 'retry all'}
                </button>
              </div>
            )}

            {/* 4. Dashed Upload Dropzone matching reference design */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border border-dashed ${
                isDragging ? 'border-black bg-black/[0.03]' : 'border-[#B8B5AE] bg-transparent'
              } rounded-3xl p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-center gap-4 text-center transition-all`}
            >
              <span className="text-xs sm:text-sm font-medium text-[#0A0A0A] lowercase">
                drag photos here or
              </span>

              <button
                type="button"
                onClick={triggerFileInput}
                disabled={isUploading}
                className="bg-white border border-[#0A0A0A] hover:bg-[#FAF9F6] text-[#0A0A0A] px-6 sm:px-7 py-3 rounded-full text-xs sm:text-sm font-medium transition-colors shadow-xs lowercase"
              >
                choose from device
              </button>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/heic,image/heif,image/webp,image/avif"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
              />
            </div>

            {/* Optional Cloud Photos / Drive Import */}
            <div className="flex items-center justify-center sm:justify-start gap-3 text-xs text-[#706E69] pt-1">
              <span>or import from:</span>
              <button
                type="button"
                onClick={() => { setPickerInitialTab('photos'); setPickerModalOpen(true); }}
                className="inline-flex items-center gap-1.5 hover:text-[#0A0A0A] transition-colors font-medium lowercase"
              >
                <GooglePhotosLogo className="w-3.5 h-3.5" />
                <span>google photos</span>
              </button>
              <span className="text-neutral-300">·</span>
              <button
                type="button"
                onClick={() => { setPickerInitialTab('drive'); setPickerModalOpen(true); }}
                className="inline-flex items-center gap-1.5 hover:text-[#0A0A0A] transition-colors font-medium lowercase"
              >
                <GoogleDriveLogo className="w-3.5 h-3.5" />
                <span>google drive</span>
              </button>
            </div>

            {/* 5. Photos Grid Header */}
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#0A0A0A] lowercase mb-4">
                uploaded · {photos.length} {failedUploads.length > 0 ? `of ${totalAttempted}` : ''} photo{photos.length === 1 ? '' : 's'}
              </h2>

              {/* 6-Column Responsive Photo Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 sm:gap-4">
                {/* 1. Successfully Uploaded Photos */}
                {photos.map((photo, idx) => (
                  <div
                    key={photo.id}
                    onClick={() => openPreview(idx)}
                    className="aspect-square rounded-2xl overflow-hidden relative group cursor-pointer bg-[#DDD8D0] shadow-2xs hover:shadow-xs transition-all"
                    title="Click to preview full size"
                  >
                    <img
                      src={normalizeImageUrl(photo.url)}
                      alt={photo.name || `Photo ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={handleImageError}
                    />

                    {/* Quick preview icon indicator on hover */}
                    <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <Eye size={18} className="drop-shadow-sm" />
                    </div>

                    {/* Delete button on hover */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removePhoto(photo.id);
                      }}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-white/95 text-red-600 hover:bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-xs"
                      title="Remove photo"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}

                {/* 2. Currently Uploading Queue Tiles */}
                {uploadingQueue.map((item) => (
                  <div
                    key={item.id}
                    className="aspect-square rounded-2xl bg-[#484642] flex flex-col items-center justify-center p-2 text-center text-white relative overflow-hidden shadow-xs animate-pulse"
                  >
                    <Loader2 size={18} className="animate-spin text-white mb-1.5" />
                    <span className="text-[10px] sm:text-xs font-medium text-white/90 lowercase">
                      uploading
                    </span>
                  </div>
                ))}

                {/* 3. Failed Upload Tiles (Matches media_1792056417094.png dark charcoal tiles) */}
                {failedUploads.map((failed) => (
                  <div
                    key={failed.id}
                    onClick={() => handleRetrySingle(failed)}
                    className="aspect-square rounded-2xl bg-[#383734] hover:bg-[#2C2B28] flex flex-col items-center justify-center p-2 text-center text-white cursor-pointer transition-colors relative shadow-xs group"
                    title={`Failed: ${failed.name}. Tap to retry`}
                  >
                    <span className="text-xs font-bold text-white lowercase">
                      failed
                    </span>
                    <span className="text-[10px] text-gray-300 mt-1 lowercase underline group-hover:text-white">
                      tap to retry
                    </span>
                  </div>
                ))}

                {/* 4. Empty placeholders when no photos are uploaded yet */}
                {photos.length === 0 && failedUploads.length === 0 && uploadingQueue.length === 0 && (
                  <>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        onClick={triggerFileInput}
                        className="aspect-square rounded-2xl bg-[#E6E2D8]/70 border border-dashed border-[#D2CDC3] flex items-center justify-center cursor-pointer hover:bg-[#E0DBD0] transition-colors"
                        title="Click to add photos"
                      >
                        <Plus size={16} className="text-[#9E9A90]" />
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Column (4 cols): Sticky Book Summary Card matching media_1792056417094.png */}
          <div className="lg:col-span-4 sticky top-20">
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#D9D6CF]/80 shadow-xs">
              
              {/* Template Cover Thumbnail */}
              <div className="aspect-[1/1.2] rounded-2xl bg-[#DDD8D0] overflow-hidden mb-4 relative shadow-2xs">
                {bookCoverImage ? (
                  <img
                    src={bookCoverImage}
                    alt={displayTitle}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-[#706E69]">
                    cover
                  </div>
                )}
              </div>

              {/* Template Title & Series */}
              <div className="mb-4">
                <span className="text-[11px] font-medium text-[#706E69] lowercase block mb-0.5">
                  {seriesLabel}
                </span>
                <h2 className="text-2xl font-bold text-[#0A0A0A] lowercase leading-tight">
                  {displayTitle}
                </h2>
              </div>

              <div className="border-t border-[#D9D6CF]/70 my-5" />

              {/* Photos Added Counter & Progress Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-[#706E69] lowercase">photos added</span>
                  <span className="font-bold text-[#0A0A0A] font-mono">
                    {photos.length} / 120
                  </span>
                </div>
                <div className="w-full h-1 bg-[#E5E2DC] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#0A0A0A] rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (photos.length / 120) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Continue Button */}
              <button
                type="button"
                onClick={handleContinue}
                className="w-full py-4 rounded-full bg-[#0A0A0A] hover:bg-black text-white font-medium text-xs sm:text-sm transition-colors shadow-xs lowercase mb-3"
              >
                continue
              </button>

              {/* Helper text matching reference design */}
              <p className="text-xs text-[#706E69] leading-relaxed lowercase">
                {photos.length > 0
                  ? `you can continue with the ${photos.length} photos that uploaded.`
                  : 'upload at least 1 photo to continue.'}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* 6. High-Resolution Photo Preview Lightbox Modal (onclick requirement) */}
      {previewPhotoIndex !== null && photos[previewPhotoIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-in fade-in duration-200"
          onClick={closePreview}
        >
          {/* Lightbox Top Bar */}
          <div className="flex items-center justify-between text-white max-w-5xl mx-auto w-full z-10">
            <span className="text-xs sm:text-sm font-medium lowercase">
              {photos[previewPhotoIndex].name || `photo ${previewPhotoIndex + 1}`} · {previewPhotoIndex + 1} of {photos.length}
            </span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (previewPhotoIndex === null) return;
                  const currentPhoto = photos[previewPhotoIndex];
                  if (!currentPhoto) return;
                  removePhoto(currentPhoto.id);
                  if (photos.length <= 1) {
                    closePreview();
                  } else if (previewPhotoIndex >= photos.length - 1) {
                    setPreviewPhotoIndex(Math.max(0, photos.length - 2));
                  }
                }}
                className="p-2 rounded-full bg-white/10 hover:bg-red-600 text-white transition-colors"
                title="Delete photo"
              >
                <Trash2 size={16} />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  closePreview();
                }}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Close preview"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Lightbox Image View & Prev/Next Arrows */}
          <div
            className="flex-1 flex items-center justify-between max-w-5xl mx-auto w-full py-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Prev Arrow */}
            {photos.length > 1 && (
              <button
                type="button"
                onClick={prevPreview}
                className="p-3 rounded-full bg-black/60 hover:bg-black/90 text-white transition-colors z-10 shrink-0"
                aria-label="Previous photo"
              >
                <ChevronLeft size={24} />
              </button>
            )}

            {/* Central Large Photo */}
            <div className="flex-1 flex items-center justify-center px-4 max-h-[75vh]">
              <img
                src={normalizeImageUrl(photos[previewPhotoIndex].url)}
                alt={photos[previewPhotoIndex].name || 'Photo preview'}
                className="max-h-[75vh] max-w-full rounded-2xl object-contain shadow-2xl"
              />
            </div>

            {/* Next Arrow */}
            {photos.length > 1 && (
              <button
                type="button"
                onClick={nextPreview}
                className="p-3 rounded-full bg-black/60 hover:bg-black/90 text-white transition-colors z-10 shrink-0"
                aria-label="Next photo"
              >
                <ChevronRight size={24} />
              </button>
            )}
          </div>

          {/* Lightbox Bottom Bar */}
          <div className="text-center text-xs text-white/60 lowercase pb-2">
            press esc to close · arrow keys to navigate
          </div>
        </div>
      )}

      {/* Cloud Photo Picker Modal */}
      <GooglePhotoPickerModal
        isOpen={pickerModalOpen}
        onClose={() => setPickerModalOpen(false)}
        initialTab={pickerInitialTab}
        onImportSuccess={() => setPickerModalOpen(false)}
      />
    </div>
  );
}

export default function UploadPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F4F2ED] flex items-center justify-center font-sans">
          <div className="w-7 h-7 border-2 border-[#0A0A0A] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <UploadContent />
    </Suspense>
  );
}
