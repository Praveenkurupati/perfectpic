'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useEditorStore } from '@/stores/useEditorStore';
import { useCartStore } from '@/stores/useCartStore';
import { 
  ChevronLeft, 
  ChevronRight, 
  Undo, 
  Redo, 
  Eye, 
  ShoppingBag, 
  ArrowLeft, 
  Download, 
  Loader2,
  Image as ImageIcon,
  LayoutGrid,
  Film,
  X
} from 'lucide-react';
import { generateBookProofPdf } from '@/lib/pdfGenerator';
import { trackEvent } from '@/lib/analytics';

const BookCanvas = dynamic(() => import('@/features/editor/components/BookCanvas'), { ssr: false });
const EditorToolbar = dynamic(() => import('@/features/editor/components/EditorToolbar'), { ssr: false });
const PhotoTray = dynamic(() => import('@/features/editor/components/PhotoTray'), { ssr: false });
const SpreadFilmstrip = dynamic(() => import('@/features/editor/components/SpreadFilmstrip'), { ssr: false });

function StudioContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = (params?.projectId as string) || 'untitled-project';

  const [mobileDrawer, setMobileDrawer] = useState<'photos' | 'toolbar' | 'filmstrip' | null>(null);

  const { 
    undo, 
    redo, 
    bookConfig, 
    pageCount, 
    setPageCount, 
    currentSpreadIndex, 
    setCurrentSpreadIndex, 
    template, 
    photos,
    pagePhotos, 
    slotPhotos, 
    slotCrops, 
    pageLayouts, 
    pageBackgrounds, 
    coverConfig,
    initProject
  } = useEditorStore();

  const { addItem } = useCartStore();

  // Initialize and hydrate project state for this projectId
  useEffect(() => {
    if (projectId) {
      initProject(projectId);
    }
  }, [projectId, initProject]);

  // Read URL query parameter ?pages= and synchronize with store
  useEffect(() => {
    const pagesParam = searchParams.get('pages');
    if (pagesParam) {
      const parsed = parseInt(pagesParam, 10);
      if ([12, 24, 32, 60, 120].includes(parsed)) {
        setPageCount(parsed);
      }
    }
  }, [searchParams, setPageCount]);

  // Keyboard navigation for spreads
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const totalSpreads = Math.ceil(pageCount / 2);
      if (e.key === 'Escape' && mobileDrawer) {
        setMobileDrawer(null);
      } else if (e.key === 'ArrowLeft' && currentSpreadIndex > 0) {
        setCurrentSpreadIndex(currentSpreadIndex - 1);
      } else if (e.key === 'ArrowRight' && currentSpreadIndex <= totalSpreads) {
        setCurrentSpreadIndex(currentSpreadIndex + 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSpreadIndex, pageCount, setCurrentSpreadIndex, mobileDrawer]);

  // Analytics: Emit studio_spread_edited when spread is changed/edited
  useEffect(() => {
    if (projectId) {
      trackEvent('editor_action', 'studio_spread_edited', {
        projectId,
        spreadIndex: currentSpreadIndex,
        pageCount,
      });
    }
  }, [currentSpreadIndex, projectId, pageCount]);

  const handleApproveAndOrder = () => {
    const thumbnail = pagePhotos[0]?.url || template?.coverImage || 'https://images.unsplash.com/photo-1544928147-79a2dbc1f389?w=400';
    const slotPhotoUrls = Object.values(slotPhotos || {})
      .filter((p: any) => p && typeof p.url === 'string')
      .map((p: any) => p.url);
    const pagePhotoUrls = Object.values(pagePhotos || {})
      .filter((p: any) => p && typeof p.url === 'string')
      .map((p: any) => p.url);
    const samplePhotos = template?.templatePhotos || [];
    const combinedUserPhotos = Array.from(new Set([...slotPhotoUrls, ...pagePhotoUrls]));
    const allPhotos = combinedUserPhotos.length > 0 ? combinedUserPhotos : samplePhotos;

    const projectSnapshot = {
      projectId,
      title: template?.displayName || template?.title || 'Heirloom Custom Photobook',
      subtitle: template?.subtitle || 'Curated Monograph Edition',
      seriesLabel: template?.seriesLabel || 'THE TRAVEL SERIES',
      dimensions: bookConfig.size || '8.25" × 8.25"',
      pageCount,
      theme: bookConfig.theme || 'Minimal Modern',
      coverImage: template?.coverImage || samplePhotos[0],
      coverColor: template?.coverColor || '#F8BAC7',
      coverConfig,
      bookConfig,
      photos: allPhotos,
      pagePhotos,
      slotPhotos,
      slotCrops,
      pageLayouts,
      pageBackgrounds,
    };

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`pp_snapshot_${projectId}`, JSON.stringify(projectSnapshot));
      } catch {}
    }

    addItem({
      id: `cart-${projectId}-${Date.now()}`,
      projectId,
      title: template?.displayName || template?.title || 'Heirloom Custom Photobook',
      dimensions: `${bookConfig.size || '8.25" × 8.25"'} Precision-Bound`,
      pageCount: pageCount,
      theme: bookConfig.theme || 'Minimal Modern',
      basePrice: bookConfig.price || 1999,
      extraPagesPrice: 0,
      thumbnail,
      projectSnapshot,
    });
    router.push('/cart');
  };

  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleExportPdf = async () => {
    try {
      setIsExportingPdf(true);
      const slotPhotoUrls = Object.values(slotPhotos || {})
        .filter((p: any) => p && typeof p.url === 'string')
        .map((p: any) => p.url);
      const pagePhotoUrls = Object.values(pagePhotos || {})
        .filter((p: any) => p && typeof p.url === 'string')
        .map((p: any) => p.url);
      const samplePhotos = template?.templatePhotos || [];
      const combinedUserPhotos = Array.from(new Set([...slotPhotoUrls, ...pagePhotoUrls]));
      const allPhotos = combinedUserPhotos.length > 0 ? combinedUserPhotos : samplePhotos;

      await generateBookProofPdf({
        title: template?.displayName || template?.title || 'Heirloom Custom Photobook',
        subtitle: template?.subtitle || 'Curated Monograph Edition',
        seriesLabel: template?.seriesLabel || 'THE TRAVEL SERIES',
        dimensions: bookConfig.size || '8.25" × 8.25"',
        pageCount,
        theme: bookConfig.theme || 'Minimal Modern',
        coverImage: template?.coverImage || samplePhotos[0],
        coverColor: template?.coverColor || '#F8BAC7',
        coverConfig,
        photos: allPhotos,
        pagePhotos,
        slotPhotos,
        slotCrops,
        pageLayouts,
        pageBackgrounds,
        projectId,
      });
    } catch (err) {
      console.error('Studio PDF export error:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const totalSpreads = Math.ceil(pageCount / 2);

  return (
    <div className="h-screen flex flex-col bg-cream-50 font-sans text-noir-900 overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="h-14 border-b border-cream-300 bg-white flex items-center justify-between px-2 sm:px-4 z-20 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button 
            onClick={() => router.push(`/upload/${projectId}`)} 
            className="p-1.5 hover:bg-cream-100 rounded-sm text-noir-600 hover:text-noir-950 transition-colors shrink-0"
            title="Back to Upload"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <h1 className="font-serif font-bold text-sm sm:text-base leading-none tracking-wide text-noir-950 truncate max-w-[130px] sm:max-w-[220px] md:max-w-none">
              {template?.displayName || template?.title || 'Untitled Project'}
            </h1>
            <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.14em] sm:tracking-[0.18em] text-noir-500 mt-1 font-mono truncate">
              {pageCount}P • {bookConfig.size || '8.25" × 8.25"'} • ₹{(bookConfig.price || 1999).toLocaleString('en-IN')}
            </p>
          </div>
        </div>
        
        {/* Undo / Redo & Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="flex items-center bg-cream-100 rounded-sm p-0.5 border border-cream-300">
            <button onClick={undo} className="p-1 sm:p-1.5 hover:bg-white rounded-xs text-noir-700 transition-colors" title="Undo">
              <Undo size={14} />
            </button>
            <button onClick={redo} className="p-1 sm:p-1.5 hover:bg-white rounded-xs text-noir-700 transition-colors" title="Redo">
              <Redo size={14} />
            </button>
          </div>

          {/* Desktop Spread Navigator */}
          <div className="hidden md:flex items-center gap-1.5 text-xs text-noir-600 font-mono px-3 py-1 bg-cream-100 rounded-sm border border-cream-200">
            <button 
              disabled={currentSpreadIndex === 0}
              onClick={() => setCurrentSpreadIndex(Math.max(0, currentSpreadIndex - 1))}
              className="hover:text-noir-950 disabled:opacity-30"
            >
              <ChevronLeft size={14} />
            </button>
            <span>
              {currentSpreadIndex === 0 ? 'Cover' : currentSpreadIndex === totalSpreads + 1 ? 'Back' : `${(currentSpreadIndex - 1) * 2 + 1}–${(currentSpreadIndex - 1) * 2 + 2}`} / {pageCount}
            </span>
            <button 
              disabled={currentSpreadIndex >= totalSpreads + 1}
              onClick={() => setCurrentSpreadIndex(Math.min(totalSpreads + 1, currentSpreadIndex + 1))}
              className="hover:text-noir-950 disabled:opacity-30"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="hidden sm:block w-px h-5 bg-cream-300 mx-0.5 sm:mx-1" />

          {/* Export PDF Proof Button */}
          <button 
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-semibold uppercase tracking-wider border border-noir-300 bg-white hover:bg-cream-100 rounded-sm text-noir-900 transition-colors disabled:opacity-50"
            title="Export 12K Print Proof PDF"
          >
            {isExportingPdf ? (
              <>
                <Loader2 size={13} className="animate-spin text-foil-gold" />
                <span className="hidden md:inline">Exporting...</span>
              </>
            ) : (
              <>
                <Download size={13} className="text-foil-gold" />
                <span className="hidden md:inline">Export PDF</span>
              </>
            )}
          </button>

          {/* 3D Preview Button (Desktop) */}
          <button 
            onClick={() => {
              trackEvent('editor_action', 'studio_preview_viewed', { projectId, pageCount });
              router.push(`/preview/${projectId}`);
            }}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider border border-noir-900 rounded-sm hover:bg-cream-100 transition-colors"
          >
            <Eye size={13} />
            <span>3D Preview</span>
          </button>

          {/* Approve & Order Button */}
          <button 
            onClick={handleApproveAndOrder}
            className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1.5 text-xs font-semibold uppercase tracking-wider bg-noir-950 text-cream-50 rounded-sm hover:bg-noir-900 transition-colors shadow-xs"
          >
            <ShoppingBag size={13} />
            <span className="hidden xs:inline">Order</span>
            <span className="hidden sm:inline">&nbsp;&amp; Approve</span>
          </button>
        </div>
      </header>

      {/* Main Studio Workspace */}
      <div className="flex-1 min-h-0 flex overflow-hidden relative">
        {/* Left Sidebar: Theme & Layout Controls (Desktop) */}
        <aside className="hidden lg:flex w-[280px] h-full min-h-0 bg-white border-r border-cream-300 flex-col shrink-0 z-10 overflow-y-auto">
          <EditorToolbar />
        </aside>

        {/* Center Canvas: Layflat Book Spread */}
        <main className="flex-1 min-h-0 bg-cream-100/70 relative flex flex-col items-center justify-center p-2 sm:p-6 md:p-10 overflow-auto">
          <BookCanvas />
        </main>

        {/* Right Sidebar: Photo Tray (Desktop) */}
        <aside className="hidden lg:flex w-[280px] h-full min-h-0 bg-white border-l border-cream-300 flex-col shrink-0 z-10 overflow-hidden">
          <PhotoTray />
        </aside>
      </div>

      {/* Bottom Spread Filmstrip (Desktop) */}
      <footer className="hidden lg:block h-32 bg-white border-t border-cream-300 shrink-0 z-10">
        <SpreadFilmstrip />
      </footer>

      {/* Mobile Bottom Navigation Dock (< lg) */}
      <nav className="lg:hidden h-16 bg-white border-t border-cream-300 grid grid-cols-4 items-center shrink-0 z-20 px-2 py-1 select-none shadow-[0_-2px_10px_rgba(0,0,0,0.04)]">
        <button
          type="button"
          onClick={() => setMobileDrawer(mobileDrawer === 'photos' ? null : 'photos')}
          className={`flex flex-col items-center justify-center py-1 rounded-sm transition-colors ${
            mobileDrawer === 'photos' ? 'text-foil-gold font-bold bg-cream-100' : 'text-noir-600 hover:text-noir-950'
          }`}
        >
          <div className="relative">
            <ImageIcon size={19} />
            {photos.length > 0 && (
              <span className="absolute -top-1 -right-2 min-w-4 h-4 px-1 rounded-full bg-noir-950 text-white text-[9px] font-mono font-bold flex items-center justify-center">
                {photos.length}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium tracking-tight mt-1">Photos</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileDrawer(mobileDrawer === 'toolbar' ? null : 'toolbar')}
          className={`flex flex-col items-center justify-center py-1 rounded-sm transition-colors ${
            mobileDrawer === 'toolbar' ? 'text-foil-gold font-bold bg-cream-100' : 'text-noir-600 hover:text-noir-950'
          }`}
        >
          <LayoutGrid size={19} />
          <span className="text-[10px] font-medium tracking-tight mt-1">Layouts</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileDrawer(mobileDrawer === 'filmstrip' ? null : 'filmstrip')}
          className={`flex flex-col items-center justify-center py-1 rounded-sm transition-colors ${
            mobileDrawer === 'filmstrip' ? 'text-foil-gold font-bold bg-cream-100' : 'text-noir-600 hover:text-noir-950'
          }`}
        >
          <Film size={19} />
          <span className="text-[10px] font-medium tracking-tight mt-1">Spreads</span>
        </button>

        <button
          type="button"
          onClick={() => router.push(`/preview/${projectId}`)}
          className="flex flex-col items-center justify-center py-1 rounded-sm text-noir-600 hover:text-noir-950 transition-colors"
        >
          <Eye size={19} />
          <span className="text-[10px] font-medium tracking-tight mt-1">3D Proof</span>
        </button>
      </nav>

      {/* Mobile Slide-Up Drawer (< lg) */}
      {mobileDrawer && (
        <div 
          role="dialog" 
          aria-modal="true" 
          aria-label="Studio customization drawer" 
          className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-fade-in"
        >
          <div 
            className="absolute inset-0" 
            onClick={() => setMobileDrawer(null)} 
          />
          <div className="relative bg-white rounded-t-2xl shadow-2xl flex flex-col max-h-[85vh] h-[80vh] z-10 overflow-hidden border-t border-cream-300 pb-[calc(env(safe-area-inset-bottom,16px)+8px)] touch-pan-y">
            {/* Visual Touch Drag Indicator Pill */}
            <div className="w-10 h-1 bg-cream-400/80 rounded-full mx-auto mt-2 mb-0.5 shrink-0" />

            {/* Drawer Header */}
            <div className="flex items-center justify-between px-3.5 sm:px-4 py-2.5 border-b border-cream-200 bg-cream-50/80 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-2 h-2 rounded-full bg-foil-gold shrink-0" />
                <h3 className="font-serif font-bold text-xs sm:text-sm tracking-wide text-noir-950 uppercase truncate">
                  {mobileDrawer === 'photos' && 'Photo Library & Cloud Uploads'}
                  {mobileDrawer === 'toolbar' && 'Layout, Theme & Foil Finishes'}
                  {mobileDrawer === 'filmstrip' && 'All Spreads & Page Navigator'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setMobileDrawer(null)}
                className="p-1.5 rounded-full hover:bg-cream-200 text-noir-500 hover:text-noir-950 transition-colors"
                title="Close Drawer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              {mobileDrawer === 'photos' && <PhotoTray />}
              {mobileDrawer === 'toolbar' && (
                <div className="flex-1 min-h-0 overflow-y-auto">
                  <EditorToolbar />
                </div>
              )}
              {mobileDrawer === 'filmstrip' && (
                <div className="flex-1 min-h-0 overflow-y-auto">
                  <SpreadFilmstrip />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StudioPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-cream-50 flex items-center justify-center text-sm font-serif">Loading Studio...</div>}>
      <StudioContent />
    </Suspense>
  );
}
