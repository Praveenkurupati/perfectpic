'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useEditorStore } from '@/stores/useEditorStore';
import { useCartStore } from '@/stores/useCartStore';
import { ChevronLeft, ChevronRight, Undo, Redo, Eye, ShoppingBag, ArrowLeft } from 'lucide-react';

const BookCanvas = dynamic(() => import('@/features/editor/components/BookCanvas'), { ssr: false });
const EditorToolbar = dynamic(() => import('@/features/editor/components/EditorToolbar'), { ssr: false });
const PhotoTray = dynamic(() => import('@/features/editor/components/PhotoTray'), { ssr: false });
const SpreadFilmstrip = dynamic(() => import('@/features/editor/components/SpreadFilmstrip'), { ssr: false });

function StudioContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = (params?.projectId as string) || 'untitled-project';

  const { 
    undo, 
    redo, 
    bookConfig, 
    pageCount, 
    setPageCount,
    currentSpreadIndex,
    setCurrentSpreadIndex,
    template,
    pagePhotos
  } = useEditorStore();

  const { addItem } = useCartStore();

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
      if (e.key === 'ArrowLeft' && currentSpreadIndex > 0) {
        setCurrentSpreadIndex(currentSpreadIndex - 1);
      } else if (e.key === 'ArrowRight' && currentSpreadIndex <= totalSpreads) {
        setCurrentSpreadIndex(currentSpreadIndex + 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSpreadIndex, pageCount, setCurrentSpreadIndex]);

  const handleApproveAndOrder = () => {
    const thumbnail = pagePhotos[0]?.url || template?.coverImage || 'https://images.unsplash.com/photo-1544928147-79a2dbc1f389?w=400';
    addItem({
      id: `cart-${Date.now()}`,
      projectId,
      title: template?.displayName || template?.title || 'Heirloom Custom Photobook',
      dimensions: `${bookConfig.size || '8.25" × 8.25"'} Precision-Bound`,
      pageCount: pageCount,
      theme: bookConfig.theme || 'Minimal Modern',
      basePrice: bookConfig.price || 1999,
      extraPagesPrice: 0,
      thumbnail
    });
    router.push('/cart');
  };

  const totalSpreads = Math.ceil(pageCount / 2);

  return (
    <div className="h-screen flex flex-col bg-cream-50 font-sans text-noir-900 overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="h-14 border-b border-cream-300 bg-white flex items-center justify-between px-4 z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push(`/upload/${projectId}`)} 
            className="p-1.5 hover:bg-cream-100 rounded-sm text-noir-600 hover:text-noir-950 transition-colors"
            title="Back to Upload"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="font-serif font-bold text-base leading-none tracking-wide text-noir-950">
              {template?.displayName || template?.title || 'Untitled Project'}
            </h1>
            <p className="text-[10px] uppercase tracking-[0.18em] text-noir-500 mt-1 font-mono">
              {pageCount} Pages • {bookConfig.size || '8.25" × 8.25"'} • 1 Photo / Page Standard • ₹{(bookConfig.price || 1999).toLocaleString('en-IN')}
            </p>
          </div>
        </div>
        
        {/* Undo / Redo & Spread Counter */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-cream-100 rounded-sm p-0.5 border border-cream-300 mr-2">
            <button onClick={undo} className="p-1.5 hover:bg-white rounded-xs text-noir-700 transition-colors" title="Undo">
              <Undo size={14} />
            </button>
            <button onClick={redo} className="p-1.5 hover:bg-white rounded-xs text-noir-700 transition-colors" title="Redo">
              <Redo size={14} />
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs text-noir-600 font-mono px-3 py-1 bg-cream-100 rounded-sm border border-cream-200">
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

          <div className="w-px h-5 bg-cream-300 mx-1" />

          {/* 3D Preview Button */}
          <button 
            onClick={() => router.push(`/preview/${projectId}`)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider border border-noir-900 rounded-sm hover:bg-cream-100 transition-colors"
          >
            <Eye size={13} />
            <span>3D Preview</span>
          </button>

          {/* Approve & Order Button */}
          <button 
            onClick={handleApproveAndOrder}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider bg-noir-950 text-cream-50 rounded-sm hover:bg-noir-900 transition-colors shadow-xs"
          >
            <ShoppingBag size={13} />
            <span>Approve & Order</span>
          </button>
        </div>
      </header>

      {/* Main Studio Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Theme & Layout Controls */}
        <aside className="w-[280px] bg-white border-r border-cream-300 flex flex-col shrink-0 z-10 overflow-y-auto">
          <EditorToolbar />
        </aside>

        {/* Center Canvas: Layflat Book Spread */}
        <main className="flex-1 bg-cream-100/70 relative flex flex-col items-center justify-center p-6 md:p-10 overflow-auto">
          <BookCanvas />
        </main>

        {/* Right Sidebar: Photo Tray */}
        <aside className="w-[280px] bg-white border-l border-cream-300 flex flex-col shrink-0 z-10 overflow-hidden">
          <PhotoTray />
        </aside>
      </div>

      {/* Bottom Spread Filmstrip */}
      <footer className="h-32 bg-white border-t border-cream-300 shrink-0 z-10">
        <SpreadFilmstrip />
      </footer>
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
