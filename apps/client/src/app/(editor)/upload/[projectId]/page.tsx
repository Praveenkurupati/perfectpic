'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { UploadCloud, Check, Trash2, Plus, Sparkles, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useEditorStore } from '@/stores/useEditorStore';
import { compressImage } from '@/lib/imageCompressor';
import { trackEvent } from '@/lib/analytics';

function UploadContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = (params?.projectId as string) || 'new-project';
  const templateSlug = searchParams.get('template');
  const pagesParam = searchParams.get('pages') || '32';
  const pageCountNum = parseInt(pagesParam, 10) || 32;

  const { photos, setPhotos, addPhoto, removePhoto, setTemplate, setPageCount } = useEditorStore();
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [templateName, setTemplateName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);

  // Sync page count
  useEffect(() => {
    if (pageCountNum) {
      setPageCount(pageCountNum);
    }
  }, [pageCountNum, setPageCount]);

  // If template is passed in URL and store is empty, load template photos
  useEffect(() => {
    if (templateSlug) {
      setLoadingTemplate(true);
      api.getProduct(templateSlug)
        .then(res => {
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
        .catch(err => {
          console.warn("Could not fetch template for upload page:", err);
        })
        .finally(() => {
          setLoadingTemplate(false);
        });
    }
  }, [templateSlug, setPhotos, setTemplate]);

  const processFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (fileArray.length === 0) return;

    setIsUploading(true);
    const total = fileArray.length;

    for (let i = 0; i < total; i++) {
      const file = fileArray[i]!;
      setUploadStatus(`Optimizing & uploading ${i + 1} of ${total} (${file.name})...`);

      try {
        // Step 1: Compress high-res camera shot client-side
        const compressed = await compressImage(file, { maxDimension: 1800, quality: 0.82 });

        // Step 2: Upload to backend persistent storage
        let photoUrl = '';
        try {
          const res = await api.uploadPhoto(compressed);
          photoUrl = res.url;
        } catch {
          // Graceful fallback if offline
          photoUrl = URL.createObjectURL(compressed);
        }

        // Step 3: Add to project store
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

  const handleContinue = () => {
    trackEvent('photo_upload', `Uploaded ${photos.length} Photos`, {
      photosCount: photos.length,
      projectId,
      pages: pageCountNum,
      template: templateSlug || 'custom',
    });
    router.push(`/processing/${projectId}?pages=${pageCountNum}`);
  };

  return (
    <div className="min-h-screen bg-cream-50 font-sans text-noir-900 py-8 px-4 md:px-8 pb-48 scroll-smooth">
      <div className="max-w-6xl mx-auto">
        {/* Navigation Breadcrumb / Back button */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href={`/configure${templateSlug ? `?template=${templateSlug}` : ''}`}
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-noir-600 hover:text-noir-950 transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Back to Configuration</span>
          </Link>
          <div className="text-xs text-noir-500 font-medium">
            <span className="font-semibold text-noir-950">Step 2:</span> Photo Selection & Curation
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-4 border-b border-cream-200">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-foil-gold font-semibold mb-1">
              <Sparkles size={14} />
              <span>Smart Curation</span>
            </div>
            <h1 className="font-serif text-3xl md:text-5xl text-noir-950 font-medium">Upload Your Photos</h1>
            <p className="text-sm text-noir-600 mt-1">
              {templateName 
                ? `Customizing "${templateName}". Review template photos and add your own memories.` 
                : 'Select high-resolution photos for optimal print quality. Our smart engine will group by story.'}
            </p>
          </div>

          <div className="mt-4 md:mt-0 text-right">
            <div className="flex items-baseline md:justify-end gap-1.5">
              <span className="text-2xl font-serif font-bold text-noir-950">{photos.length}</span>
              <span className="text-sm text-noir-500 font-mono">/ {pageCountNum} Target</span>
            </div>
            <span className="text-xs text-noir-500 uppercase tracking-wider block">Photos in Project</span>
            <span className="text-[11px] text-foil-gold font-mono block mt-0.5">1 photo per page standard</span>
          </div>
        </div>

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
                  <span className="bg-noir-950 text-cream-50 px-6 py-2.5 rounded-sm text-sm font-medium mb-3 shadow-sm group-hover:bg-noir-900 transition-colors">
                    Browse Files from Device
                  </span>
                  <p className="text-noir-700 text-sm font-medium">Or drag and drop photos directly here</p>
                  <p className="text-xs text-noir-500 mt-2">Auto-compressed for print quality • High-res JPEG, PNG, HEIC, WebP</p>
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

            {/* Uploaded Photos Grid */}
            <div className="bg-white p-6 border border-cream-300 rounded-sm">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-serif text-2xl font-medium text-noir-950">Photo Collection ({photos.length})</h3>
                  <p className="text-xs text-noir-500">Tap trash icon to remove any photo from auto-curation</p>
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
                  {photos.map((photo) => (
                    <div 
                      key={photo.id} 
                      className="group relative aspect-square bg-cream-100 rounded-sm overflow-hidden border border-cream-200 shadow-sm"
                    >
                      <img src={photo.url} alt="Uploaded" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button 
                          onClick={() => removePhoto(photo.id)}
                          className="w-8 h-8 bg-white text-red-600 rounded-full flex items-center justify-center hover:bg-red-50 transition-colors shadow-sm"
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
                <div className="text-center py-16 text-noir-500 border border-dashed border-cream-300 rounded-sm">
                  <p className="font-serif text-xl text-noir-700 mb-1">No photos added yet</p>
                  <p className="text-xs text-noir-500 max-w-sm mx-auto">
                    Upload photos above or import from Google Photos or iCloud to let our AI layout your photobook.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar / Cloud Source Integration */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white p-6 border border-cream-300 rounded-sm">
              <h3 className="font-serif text-xl font-medium mb-4 text-noir-950">Cloud Photo Sources</h3>
              <p className="text-xs text-noir-600 mb-4">Connect external accounts to import albums seamlessly:</p>
              
              <div className="space-y-2.5">
                {[
                  { name: 'Google Photos', icon: '📸', desc: 'Direct album import' },
                  { name: 'Apple iCloud', icon: '☁️', desc: 'Sync from iOS gallery' },
                  { name: 'Instagram', icon: '✨', desc: 'Feed & Saved stories' }
                ].map(source => (
                  <button 
                    key={source.name} 
                    onClick={() => alert(`${source.name} cloud connector initialized.`)}
                    className="w-full bg-cream-50 border border-cream-200 p-3.5 rounded-sm flex items-center gap-3.5 hover:border-noir-950 transition-colors text-left"
                  >
                    <span className="text-2xl">{source.icon}</span>
                    <div>
                      <span className="text-sm font-semibold text-noir-900 block">{source.name}</span>
                      <span className="text-[11px] text-noir-500">{source.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-cream-100 p-6 border border-cream-300 rounded-sm text-xs text-noir-700 space-y-2">
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

      {/* Floating Bottom Sticky Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-cream-300 p-4 z-40 px-6 md:px-12 flex justify-between items-center shadow-luxury-lg">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-2xl font-bold text-noir-950">{photos.length}</span>
            <span className="text-xs text-noir-600 font-mono">/ {pageCountNum} Pages Selected (1 photo / page)</span>
          </div>
          <p className="text-[11px] text-noir-500 hidden sm:block">
            {photos.length >= pageCountNum 
              ? `All ${pageCountNum} page slots ready for layout.` 
              : `Selected ${pageCountNum} pages. Unfilled pages can be assigned or auto-filled inside the Studio.`}
          </p>
        </div>

        <button 
          onClick={handleContinue}
          className="bg-noir-950 text-cream-50 px-8 py-3.5 rounded-sm font-medium tracking-wide hover:bg-noir-900 transition-colors flex items-center gap-2 shadow-sm"
        >
          <span>Continue to Smart Layout</span>
          <ArrowRight size={16} />
        </button>
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
