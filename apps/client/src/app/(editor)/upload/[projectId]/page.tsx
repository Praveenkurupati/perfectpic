'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { 
  UploadCloud, 
  Check, 
  Trash2, 
  Plus, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Layers, 
  Wand2,
  Lock,
  Image as ImageIcon
} from 'lucide-react';
import { api } from '@/lib/api';
import { useEditorStore, getMinPhotosRequired } from '@/stores/useEditorStore';
import { compressImage } from '@/lib/imageCompressor';
import { trackEvent } from '@/lib/analytics';

const sampleDemoPhotos = [
  'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1588416936097-41850ab3d86d?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1529636798458-92182e662485?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1512100356356-de1b84283e18?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1503220317375-aaad61436b1b?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1511497584788-87676104235f?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&auto=format&fit=crop',
];

function UploadContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = (params?.projectId as string) || 'new-project';
  const templateSlug = searchParams.get('template');
  const pagesParam = searchParams.get('pages') || '32';
  const initialPageCount = parseInt(pagesParam, 10) || 32;

  const [currentPageCount, setCurrentPageCount] = useState<number>(initialPageCount);
  const { photos, setPhotos, addPhoto, removePhoto, setTemplate, setPageCount } = useEditorStore();
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [templateName, setTemplateName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [validationAlert, setValidationAlert] = useState<string | null>(null);

  // Dynamic minimum photos calculation based on selected pages
  const minRequired = getMinPhotosRequired(currentPageCount);
  const uploadedCount = photos.length;
  const isRequirementMet = uploadedCount >= minRequired;
  const remainingCount = Math.max(0, minRequired - uploadedCount);
  const progressPercent = Math.min(100, Math.round((uploadedCount / minRequired) * 100));

  // Sync page count with store
  useEffect(() => {
    if (currentPageCount) {
      setPageCount(currentPageCount);
    }
  }, [currentPageCount, setPageCount]);

  // Load template photos if templateSlug is provided
  useEffect(() => {
    if (templateSlug) {
      setLoadingTemplate(true);
      api.getProduct(templateSlug)
        .then((res) => {
          if (res) {
            setTemplate(res);
            setTemplateName(res.displayName || res.title);
            if (res.templatePhotos && res.templatePhotos.length > 0) {
              const initialPhotos = res.templatePhotos.map((url: string, index: number) => ({
                id: `tpl-${templateSlug}-${index}`,
                url,
                usedCount: 0,
                flagged: false,
                name: `Template Photo ${index + 1}`
              }));
              setPhotos(initialPhotos);
            }
          }
        })
        .catch((err) => {
          console.warn('Could not fetch template for upload page:', err);
        })
        .finally(() => {
          setLoadingTemplate(false);
        });
    }
  }, [templateSlug, setPhotos, setTemplate]);

  const processFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (fileArray.length === 0) return;

    setIsUploading(true);
    setValidationAlert(null);
    const total = fileArray.length;

    for (let i = 0; i < total; i++) {
      const file = fileArray[i]!;
      setUploadStatus(`Optimizing & uploading ${i + 1} of ${total} (${file.name})...`);

      try {
        const compressed = await compressImage(file, { maxDimension: 1800, quality: 0.82 });

        let photoUrl = '';
        try {
          const res = await api.uploadPhoto(compressed);
          photoUrl = res.url;
        } catch {
          photoUrl = URL.createObjectURL(compressed);
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
    setUploadStatus('');
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

  // Quick fill remaining slots with high-res travel photos to satisfy validation
  const handleAutoFillDemoPhotos = () => {
    const needed = Math.max(0, minRequired - photos.length);
    if (needed <= 0) return;

    const available = sampleDemoPhotos.filter((url) => !photos.some((p) => p.url === url));
    const pool = available.length >= needed ? available : sampleDemoPhotos;
    const toAdd = pool.slice(0, needed);

    toAdd.forEach((url, idx) => {
      addPhoto({
        id: `demo-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        url,
        usedCount: 0,
        flagged: false,
        name: `Travel Highlight ${photos.length + idx + 1}`,
      });
    });

    setValidationAlert(null);
    trackEvent('photo_upload', `Auto-filled Demo Photos to meet ${minRequired} min requirement`, {
      pageCount: currentPageCount,
      minRequired,
    });
  };

  const handleContinue = () => {
    if (!isRequirementMet) {
      setValidationAlert(
        `Upload requirement not met: A ${currentPageCount}-page photobook requires at least ${minRequired} photos before you can proceed to layout design. Please upload ${remainingCount} more photo${remainingCount > 1 ? 's' : ''}.`
      );
      window.scrollTo({ top: 140, behavior: 'smooth' });
      return;
    }

    trackEvent('photo_upload', `Uploaded ${photos.length} Photos (Target: ${currentPageCount} Pages, Min: ${minRequired})`, {
      photosCount: photos.length,
      projectId,
      pages: currentPageCount,
      minRequired,
      template: templateSlug || 'custom',
    });
    router.push(`/processing/${projectId}?pages=${currentPageCount}`);
  };

  return (
    <div className="min-h-screen bg-cream-50 font-sans text-noir-900 py-8 px-4 md:px-8 pb-48 scroll-smooth">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Navigation Breadcrumb / Back button */}
        <div className="flex items-center justify-between">
          <Link
            href={`/configure${templateSlug ? `?template=${templateSlug}` : ''}`}
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-noir-600 hover:text-noir-950 transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Back to Configuration</span>
          </Link>
          <div className="text-xs text-noir-500 font-medium">
            <span className="font-semibold text-noir-950">Step 2:</span> Photo Selection & Dynamic Validation
          </div>
        </div>

        {/* Page Title & Real-time Validation Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between pb-5 border-b border-cream-200 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-foil-gold font-semibold mb-1">
              <Sparkles size={14} />
              <span>Smart Curation & Layout Validation</span>
            </div>
            <h1 className="font-serif text-3xl md:text-5xl text-noir-950 font-medium">
              Upload Your Photos
            </h1>
            <p className="text-sm text-noir-600 mt-1 max-w-xl">
              {templateName 
                ? `Customizing "${templateName}". Review template photos and add your own memories.` 
                : `Upload high-resolution photographs for your ${currentPageCount}-page edition. Our validation engine ensures full layout coverage before designing.`}
            </p>
          </div>

          {/* Target & Minimum Requirements Card */}
          <div className="bg-white p-4 rounded-sm border border-cream-300 shadow-xs text-right min-w-[240px]">
            <div className="flex items-baseline justify-end gap-1.5">
              <span className="text-2xl font-serif font-bold text-noir-950">{uploadedCount}</span>
              <span className="text-xs text-noir-500 font-mono">/ {minRequired} Minimum</span>
              <span className="text-xs text-noir-400 font-mono">({currentPageCount} Pages)</span>
            </div>
            <div className="mt-1 flex items-center justify-end gap-1.5">
              {isRequirementMet ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 size={12} /> Requirement Met
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  <AlertCircle size={12} /> {remainingCount} More Needed
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Page Count Format Selector Pills */}
        <div className="bg-white p-4 rounded-sm border border-cream-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-noir-700 font-medium">
            <Layers size={15} className="text-foil-gold shrink-0" />
            <span>Photobook Edition Format:</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[12, 24, 32, 60, 120].map((count) => {
              const req = getMinPhotosRequired(count);
              const isSelected = currentPageCount === count;
              return (
                <button
                  key={count}
                  type="button"
                  onClick={() => setCurrentPageCount(count)}
                  className={`px-3 py-1.5 rounded-sm text-[11px] font-medium transition-all ${
                    isSelected
                      ? 'bg-noir-950 text-cream-50 font-bold shadow-xs'
                      : 'bg-cream-100 text-noir-700 hover:bg-cream-200'
                  }`}
                >
                  {count} Pages (Min {req})
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Validation Status Banner */}
        {!isRequirementMet ? (
          <div className="bg-amber-50 border border-amber-300 p-5 rounded-sm shadow-xs space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                <AlertCircle size={18} />
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="text-sm font-bold text-amber-950">
                  Minimum Photo Upload Requirement: {minRequired} Photos for {currentPageCount}-Page Edition
                </h3>
                <p className="text-xs text-amber-800 leading-relaxed">
                  To ensure every page spread has rich archival photo coverage, please upload at least{' '}
                  <strong>{minRequired} photos</strong> before proceeding to the Studio Editor. You have uploaded{' '}
                  <strong>{uploadedCount}</strong>, so <strong>{remainingCount} more photo{remainingCount > 1 ? 's are' : ' is'} required</strong>.
                </p>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[11px] font-semibold text-amber-900 font-mono">
                <span>Upload Progress: {uploadedCount} of {minRequired} Photos</span>
                <span>{progressPercent}% Complete</span>
              </div>
              <div className="h-2.5 w-full bg-amber-200/70 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-600 transition-all duration-300 rounded-full" 
                  style={{ width: `${progressPercent}%` }} 
                />
              </div>
            </div>

            {/* Quick Helper Button for Instant Testing / Filling */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleAutoFillDemoPhotos}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-sm text-xs font-semibold flex items-center gap-2 transition-colors shadow-xs"
              >
                <Wand2 size={13} />
                <span>Auto-Fill {remainingCount} Demo Travel Photos to Reach {minRequired}</span>
              </button>
              <span className="text-[11px] text-amber-800 italic">
                (Instantly satisfy the {minRequired}-photo requirement for quick testing or preview)
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-sm shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                  ✓ Photo Requirement Met ({uploadedCount} Photos Ready)
                </h3>
                <p className="text-xs text-emerald-800">
                  Minimum of {minRequired} photos satisfied for your {currentPageCount}-page edition. You can proceed to design or add more photos.
                </p>
              </div>
            </div>
            <button
              onClick={handleContinue}
              className="px-5 py-2.5 bg-noir-950 hover:bg-noir-900 text-cream-50 rounded-sm text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-xs shrink-0"
            >
              <span>Design Photobook</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}

        {/* Validation Error Toast Alert if user tried to proceed */}
        {validationAlert && (
          <div className="bg-red-50 border border-red-300 p-4 rounded-sm text-xs text-red-900 flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
              <span>{validationAlert}</span>
            </div>
            <button 
              onClick={() => setValidationAlert(null)}
              className="text-red-700 hover:text-red-900 font-bold text-xs"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Main Grid: Upload Dropzone & Collection */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-8">
            
            {/* Drag & Drop Upload Zone */}
            <label
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed ${
                isDragging ? 'border-foil-gold bg-cream-100 scale-[1.01]' : 'border-cream-400 bg-white'
              } p-10 md:p-12 rounded-sm flex flex-col items-center justify-center text-center cursor-pointer hover:border-noir-950 hover:bg-cream-100/60 transition-all group`}
            >
              {isUploading ? (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-cream-100 rounded-full flex items-center justify-center mb-4">
                    <Loader2 size={28} className="text-foil-gold animate-spin" />
                  </div>
                  <span className="text-sm font-semibold text-noir-950 mb-1">
                    Compressing & Uploading Photos
                  </span>
                  <p className="text-xs text-noir-500 font-mono animate-pulse">{uploadStatus}</p>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 bg-cream-100 group-hover:bg-cream-200 rounded-full flex items-center justify-center mb-4 transition-colors">
                    <UploadCloud size={28} className="text-noir-900" />
                  </div>
                  <span className="bg-noir-950 text-cream-50 px-6 py-2.5 rounded-sm text-sm font-medium mb-3 shadow-xs group-hover:bg-noir-900 transition-colors">
                    Browse Files from Device
                  </span>
                  <p className="text-noir-800 text-sm font-medium">Or drag and drop photos directly here</p>
                  <p className="text-xs text-noir-500 mt-2">
                    Minimum requirement: <strong>{minRequired} photos</strong> for {currentPageCount} pages • High-res JPEG, PNG, HEIC, WebP
                  </p>
                </>
              )}
              <input 
                type="file" 
                multiple 
                accept="image/*" 
                onChange={handleFileUpload} 
                disabled={isUploading}
                className="hidden" 
              />
            </label>

            {/* Uploaded Photos Collection */}
            <div className="bg-white p-6 border border-cream-300 rounded-sm">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-serif text-2xl font-medium text-noir-950">
                    Photo Collection ({photos.length})
                  </h3>
                  <p className="text-xs text-noir-500">
                    {photos.length < minRequired
                      ? `Upload at least ${minRequired - photos.length} more photo${minRequired - photos.length > 1 ? 's' : ''} to reach the ${minRequired} minimum.`
                      : `All ${photos.length} photos ready. Tap trash icon to remove any unwanted take.`}
                  </p>
                </div>
                {photos.length > 0 && (
                  <button 
                    onClick={() => setPhotos([])} 
                    className="text-xs text-red-600 hover:text-red-700 font-semibold"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {loadingTemplate ? (
                <div className="py-16 text-center text-noir-600 flex flex-col items-center">
                  <div className="w-8 h-8 border-2 border-noir-950 border-t-transparent rounded-full animate-spin mb-3"></div>
                  <p className="text-sm">Loading template photos...</p>
                </div>
              ) : photos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {photos.map((photo, idx) => (
                    <div 
                      key={photo.id} 
                      className="group relative aspect-square bg-cream-100 rounded-sm overflow-hidden border border-cream-200 shadow-xs"
                    >
                      <img src={photo.url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                      
                      {/* Photo number indicator */}
                      <span className="absolute top-1.5 left-1.5 bg-black/60 backdrop-blur-xs text-white text-[9px] px-1.5 py-0.5 rounded-[2px] font-mono">
                        #{idx + 1}
                      </span>

                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button 
                          onClick={() => removePhoto(photo.id)}
                          className="w-8 h-8 bg-white text-red-600 rounded-full flex items-center justify-center hover:bg-red-50 transition-colors shadow-xs"
                          title="Remove photo"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {/* Plus card */}
                  <label className="aspect-square border border-dashed border-cream-400 bg-cream-50 hover:bg-cream-100 rounded-sm flex flex-col items-center justify-center cursor-pointer transition-colors text-noir-600">
                    <Plus size={24} className="mb-1" />
                    <span className="text-xs font-semibold">Add More</span>
                    <input type="file" multiple accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              ) : (
                <div className="text-center py-16 text-noir-500 border border-dashed border-cream-300 rounded-sm space-y-4">
                  <div className="w-12 h-12 rounded-full bg-cream-200 text-noir-600 flex items-center justify-center mx-auto">
                    <ImageIcon size={24} />
                  </div>
                  <div>
                    <p className="font-serif text-xl text-noir-800 mb-1">No photos added yet</p>
                    <p className="text-xs text-noir-500 max-w-sm mx-auto">
                      Upload at least {minRequired} photos above to unlock layout design for your {currentPageCount}-page photobook.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoFillDemoPhotos}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-cream-200 hover:bg-cream-300 text-noir-900 rounded-sm text-xs font-semibold transition-colors"
                  >
                    <Wand2 size={13} />
                    <span>Auto-Fill with {minRequired} Sample Travel Photos</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Validation Summary Box */}
            <div className="bg-white p-5 border border-cream-300 rounded-sm space-y-3">
              <h3 className="font-serif text-lg font-medium text-noir-950 border-b border-cream-200 pb-2">
                Validation Rules
              </h3>
              <div className="space-y-2 text-xs text-noir-700">
                <div className="flex justify-between items-center py-1 border-b border-cream-100">
                  <span className="text-noir-500">Selected Pages:</span>
                  <span className="font-bold text-noir-950 font-mono">{currentPageCount} Pages</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-cream-100">
                  <span className="text-noir-500">Minimum Required:</span>
                  <span className="font-bold text-foil-gold font-mono">{minRequired} Photos</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-cream-100">
                  <span className="text-noir-500">Uploaded Count:</span>
                  <span className="font-bold font-mono">{uploadedCount} Photos</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-noir-500">Design Status:</span>
                  <span className={`font-bold ${isRequirementMet ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {isRequirementMet ? 'UNLOCKED' : `LOCKED (-${remainingCount})`}
                  </span>
                </div>
              </div>
            </div>

            {/* Cloud Sources */}
            <div className="bg-white p-5 border border-cream-300 rounded-sm">
              <h3 className="font-serif text-lg font-medium mb-2 text-noir-950">Cloud Photo Sources</h3>
              <p className="text-xs text-noir-600 mb-3">Connect external accounts to import albums seamlessly:</p>
              
              <div className="space-y-2">
                {[
                  { name: 'Google Photos', icon: '📸', desc: 'Direct album import' },
                  { name: 'Apple iCloud', icon: '☁️', desc: 'Sync from iOS gallery' },
                  { name: 'Instagram', icon: '✨', desc: 'Feed & Saved stories' }
                ].map((source) => (
                  <button 
                    key={source.name} 
                    onClick={() => alert(`${source.name} cloud connector initialized.`)}
                    className="w-full bg-cream-50 border border-cream-200 p-2.5 rounded-sm flex items-center gap-3 hover:border-noir-950 transition-colors text-left"
                  >
                    <span className="text-xl">{source.icon}</span>
                    <div>
                      <span className="text-xs font-semibold text-noir-900 block">{source.name}</span>
                      <span className="text-[10px] text-noir-500">{source.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quality Assurances */}
            <div className="bg-cream-100 p-5 border border-cream-300 rounded-sm text-xs text-noir-700 space-y-2">
              <span className="font-bold text-noir-950 block">AI Smart Layout Highlights:</span>
              <p className="flex items-start gap-1.5">
                <Check size={14} className="text-foil-gold shrink-0 mt-0.5" />
                <span>Auto-deduplicates blurry & similar takes</span>
              </p>
              <p className="flex items-start gap-1.5">
                <Check size={14} className="text-foil-gold shrink-0 mt-0.5" />
                <span>Chronological & location-based timeline grouping</span>
              </p>
              <p className="flex items-start gap-1.5">
                <Check size={14} className="text-foil-gold shrink-0 mt-0.5" />
                <span>Smart face-aware centering for panoramic spreads</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Bottom Sticky Bar with Dynamic Validation Enforcement */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-cream-300 p-4 z-40 px-6 md:px-12 flex flex-col sm:flex-row justify-between items-center shadow-luxury-lg gap-4">
        <div className="w-full sm:w-auto">
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-2xl font-bold text-noir-950">{uploadedCount}</span>
            <span className="text-xs text-noir-600 font-mono">
              / {minRequired} Minimum Photos Required ({currentPageCount} Pages Selected)
            </span>
          </div>
          
          <div className="w-full sm:w-64 h-1.5 bg-cream-200 rounded-full overflow-hidden mt-1.5 mb-1">
            <div 
              className={`h-full transition-all duration-300 ${
                isRequirementMet ? 'bg-emerald-600' : 'bg-amber-600'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <p className="text-[11px] text-noir-500">
            {isRequirementMet ? (
              <span className="text-emerald-700 font-medium">
                ✓ Requirement satisfied ({uploadedCount} photos). Ready to generate smart layouts.
              </span>
            ) : (
              <span className="text-amber-800 font-medium">
                ⚠️ Upload at least {remainingCount} more photo{remainingCount > 1 ? 's' : ''} to unlock layout design.
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {!isRequirementMet && (
            <button
              type="button"
              onClick={handleAutoFillDemoPhotos}
              className="hidden md:flex px-4 py-3 border border-amber-400 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-sm text-xs font-semibold items-center gap-1.5 transition-colors"
              title={`Add ${remainingCount} demo photos to reach ${minRequired}`}
            >
              <Wand2 size={14} />
              <span>Fill Remaining ({remainingCount})</span>
            </button>
          )}

          <button 
            type="button"
            onClick={handleContinue}
            disabled={!isRequirementMet}
            className={`w-full sm:w-auto px-8 py-3.5 rounded-sm font-semibold tracking-wide text-xs uppercase flex items-center justify-center gap-2 transition-all shadow-xs ${
              isRequirementMet
                ? 'bg-noir-950 text-cream-50 hover:bg-noir-900 cursor-pointer'
                : 'bg-neutral-300 text-neutral-500 cursor-not-allowed border border-neutral-300'
            }`}
            title={
              isRequirementMet
                ? 'Proceed to Smart Layout'
                : `Upload at least ${minRequired} photos before proceeding (currently ${uploadedCount})`
            }
          >
            {!isRequirementMet ? (
              <>
                <Lock size={14} />
                <span>Upload {remainingCount} More to Proceed</span>
              </>
            ) : (
              <>
                <span>Continue to Smart Layout</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UploadPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-cream-50">
        <div className="w-8 h-8 border-2 border-noir-950 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <UploadContent />
    </Suspense>
  );
}
