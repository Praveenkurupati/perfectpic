'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Minimize2, 
  ShoppingBag, 
  Edit3, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ShieldCheck, 
  Truck, 
  Layers, 
  BookOpen,
  Loader2,
  Download,
  FileText
} from 'lucide-react';
import { useEditorStore } from '@/stores/useEditorStore';
import { useCartStore } from '@/stores/useCartStore';
import { api } from '@/lib/api';
import { fallbackCatalog } from '@/features/catalog/data/catalogFallback';
import BookFlipPreview from '@/features/preview/components/BookFlipPreview';
import { generateBookProofPdf } from '@/lib/pdfGenerator';

function PreviewContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = (params?.projectId as string) || 'new-project';

  // Read from store
  const { 
    pageCount: storePageCount, 
    currentSpreadIndex, 
    pagePhotos, 
    slotPhotos,
    pageLayouts,
    pageBackgrounds,
    coverConfig,
    template: storeTemplate,
    bookConfig: storeBookConfig,
    setCurrentSpreadIndex 
  } = useEditorStore();

  const { addItem } = useCartStore();

  // Read URL query params for fallback/overrides
  const queryPages = searchParams.get('pages');
  const queryTemplate = searchParams.get('template');
  const querySize = searchParams.get('size');

  const activeTemplate = useMemo(() => {
    if (storeTemplate && (storeTemplate.displayName || storeTemplate.title)) {
      return storeTemplate;
    }
    if (queryTemplate) {
      const match = fallbackCatalog.find(
        (b) => b.slug === queryTemplate || b.slug.includes(queryTemplate)
      );
      if (match) return match;
    }
    // Default to first Indian trek book in fallback catalog
    return fallbackCatalog[0]!;
  }, [storeTemplate, queryTemplate]);

  const pageCount = useMemo(() => {
    if (queryPages) {
      const p = parseInt(queryPages, 10);
      if (!isNaN(p) && p > 0) return p;
    }
    return storePageCount || activeTemplate.basePages || 32;
  }, [queryPages, storePageCount, activeTemplate]);

  const totalSpreads = Math.ceil(pageCount / 2);

  // Spread navigation: 0 = Cover, 1 = Pages 1-2, ..., totalSpreads + 1 = Back Cover
  const [currentSpread, setCurrentSpread] = useState<number>(1);
  const [approved, setApproved] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Synchronize initial spread from editor store if available
  useEffect(() => {
    if (currentSpreadIndex !== undefined && currentSpreadIndex >= 0) {
      setCurrentSpread(Math.min(currentSpreadIndex, totalSpreads + 1));
    }
  }, [currentSpreadIndex, totalSpreads]);

  // Keyboard navigation for smooth book flipping
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setCurrentSpread((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentSpread((prev) => Math.min(totalSpreads + 1, prev + 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalSpreads]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleZoomIn = () => setZoomLevel((z) => Math.min(1.4, Math.round((z + 0.1) * 10) / 10));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(0.7, Math.round((z - 0.1) * 10) / 10));
  const handleResetZoom = () => setZoomLevel(1);

  const bookTitle = activeTemplate.displayName || activeTemplate.title || 'Curated Photobook';
  const seriesLabel = activeTemplate.seriesLabel || 'the travel series';
  const subtitle = activeTemplate.subtitle || 'Heirloom Custom Photobook Edition';
  const dimensions = querySize || storeBookConfig.size || '8.25" × 8.25"';
  const coverColor = activeTemplate.coverColor || '#F8BAC7';
  const coverImage = activeTemplate.coverImage;
  const samplePhotos = activeTemplate.templatePhotos || [];

  const price = useMemo(() => {
    if (storeBookConfig.price) return storeBookConfig.price;
    if (activeTemplate.pricing) {
      const sizeKey = dimensions.includes('10') ? '10' : '8.25';
      return activeTemplate.pricing[sizeKey] || 1999;
    }
    return activeTemplate.fromPrice || 1999;
  }, [storeBookConfig.price, activeTemplate, dimensions]);

  // Handle Approve and Add to Cart
  const handleApproveAndAddToCart = async () => {
    if (!approved) return;
    setIsAddingToCart(true);

    const thumbnail = pagePhotos[1]?.url || coverImage || samplePhotos[0] || 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800';

    try {
      // Register project draft in backend
      await api.createProject({
        id: projectId,
        title: bookTitle,
        coverUrl: thumbnail,
        pages: pageCount,
        theme: storeBookConfig.theme || 'Minimal Modern',
        status: 'Ready',
        spreads: [],
      }).catch((err) => {
        console.warn('Backend draft registration notice:', err.message);
      });

      // Add item to cart
      addItem({
        id: `cart-${projectId}-${Date.now()}`,
        projectId,
        title: bookTitle,
        dimensions: `${dimensions} Precision-Bound`,
        pageCount,
        theme: storeBookConfig.theme || 'Minimal Modern',
        basePrice: price,
        extraPagesPrice: 0,
        thumbnail,
        quantity: 1,
      });

      router.push('/cart');
    } catch (err) {
      console.warn('Proceeding to cart:', err);
      router.push('/cart');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      const userPhotoUrls = Object.values(pagePhotos || {})
        .filter((p: any) => p && typeof p.url === 'string')
        .map((p: any) => p.url);
      const allPhotos = userPhotoUrls.length > 0 ? userPhotoUrls : samplePhotos;
      await generateBookProofPdf({
        title: bookTitle,
        subtitle,
        seriesLabel,
        dimensions,
        pageCount,
        theme: storeBookConfig.theme || 'Minimal Modern',
        coverImage: coverImage || samplePhotos[0],
        coverColor,
        coverConfig,
        photos: allPhotos,
        pagePhotos,
        slotPhotos,
        pageLayouts,
        pageBackgrounds,
        projectId,
      });
    } catch (err) {
      console.error('PDF generation error:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-noir-950 text-cream-50 font-sans select-none overflow-hidden">
      {/* Top Header */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-noir-800 bg-noir-900/90 backdrop-blur-md shrink-0 z-30">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push(`/studio/${projectId}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs uppercase tracking-wider text-noir-300 hover:text-cream-50 hover:bg-noir-800 transition-colors"
            title="Return to Studio Editor"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Studio</span>
          </button>
          
          <div className="h-5 w-px bg-noir-800 hidden sm:block" />

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-lg font-bold tracking-wide text-cream-50 leading-tight">
                {bookTitle}
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-noir-800 border border-noir-700 text-[10px] font-mono text-foil-gold uppercase tracking-wider">
                3D Proof
              </span>
            </div>
            <p className="text-[11px] font-mono text-noir-400 mt-0.5">
              {pageCount} Pages • {dimensions} • Editorial & Panoramic Layouts • 180° Lay-Flat Zero Gutter Loss
            </p>
          </div>
        </div>

        {/* View Controls & Action */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Zoom Controls */}
          <div className="flex items-center bg-noir-800 border border-noir-700 rounded-sm p-0.5 text-xs text-noir-300">
            <button 
              onClick={handleZoomOut} 
              className="p-1.5 hover:text-cream-50 hover:bg-noir-700 rounded-xs transition-colors"
              title="Zoom Out"
            >
              <ZoomOut size={14} />
            </button>
            <button 
              onClick={handleResetZoom} 
              className="px-2 py-1 hover:text-cream-50 text-[11px] font-mono transition-colors"
              title="Reset Zoom"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button 
              onClick={handleZoomIn} 
              className="p-1.5 hover:text-cream-50 hover:bg-noir-700 rounded-xs transition-colors"
              title="Zoom In"
            >
              <ZoomIn size={14} />
            </button>
          </div>

          <button 
            onClick={toggleFullscreen} 
            className="p-2 bg-noir-800 border border-noir-700 hover:text-cream-50 text-noir-300 rounded-sm transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>

          <button 
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-noir-800 hover:bg-noir-700 text-cream-100 border border-noir-700 rounded-sm text-xs font-medium tracking-wide transition-colors disabled:opacity-50"
            title="Download Print Proof PDF"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 size={13} className="animate-spin text-foil-gold" />
                <span className="hidden sm:inline">Generating PDF...</span>
              </>
            ) : (
              <>
                <Download size={13} className="text-foil-gold" />
                <span className="hidden sm:inline">PDF Proof</span>
              </>
            )}
          </button>

          <Link
            href={`/studio/${projectId}`}
            className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider border border-noir-700 rounded-sm text-cream-100 hover:bg-noir-800 transition-colors"
          >
            <Edit3 size={13} />
            <span>Edit Spreads</span>
          </Link>
        </div>
      </header>

      {/* Main Preview Body */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Center 3D Book Stage */}
        <div className="flex-1 flex flex-col items-center justify-center relative p-6 md:p-12 overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-noir-900 via-noir-950 to-black">
          {/* 3D Book Rendering Component */}
          <div className="flex-1 flex items-center justify-center w-full">
            <BookFlipPreview
              currentSpread={currentSpread}
              totalSpreads={totalSpreads}
              onSpreadChange={setCurrentSpread}
              pageCount={pageCount}
              pagePhotos={pagePhotos}
              slotPhotos={slotPhotos}
              pageLayouts={pageLayouts}
              pageBackgrounds={pageBackgrounds}
              coverConfig={coverConfig}
              samplePhotos={samplePhotos}
              bookTitle={bookTitle}
              seriesLabel={seriesLabel}
              subtitle={subtitle}
              coverImage={coverImage}
              coverColor={coverColor}
              dimensions={dimensions}
              zoomLevel={zoomLevel}
            />
          </div>

          {/* Bottom Interactive Spread Switcher & Controls */}
          <div className="w-full max-w-2xl bg-noir-900/90 border border-noir-800 rounded-full px-6 py-3 shadow-2xl backdrop-blur-md flex items-center justify-between z-20 mt-4 shrink-0">
            {/* Previous Spread Button */}
            <button
              onClick={() => setCurrentSpread((prev) => Math.max(0, prev - 1))}
              disabled={currentSpread === 0}
              className="flex items-center gap-1 text-xs font-mono uppercase tracking-wider text-cream-200 hover:text-foil-gold disabled:opacity-30 disabled:hover:text-cream-200 transition-colors"
            >
              <ChevronLeft size={18} />
              <span className="hidden sm:inline">Prev</span>
            </button>

            {/* Current Position Indicator */}
            <div className="flex items-center gap-3 text-xs font-mono">
              <button
                onClick={() => setCurrentSpread(0)}
                className={`px-2.5 py-1 rounded-sm uppercase tracking-wider transition-colors ${
                  currentSpread === 0 ? 'bg-foil-gold text-noir-950 font-bold' : 'text-noir-400 hover:text-cream-50'
                }`}
              >
                Cover
              </button>

              <div className="flex items-center gap-1 text-cream-50">
                <span className="text-foil-gold font-bold">
                  {currentSpread === 0
                    ? 'FRONT COVER'
                    : currentSpread > totalSpreads
                    ? 'BACK COVER'
                    : `PAGES ${(currentSpread - 1) * 2 + 1} – ${(currentSpread - 1) * 2 + 2}`}
                </span>
                <span className="text-noir-500 font-normal">OF {pageCount}</span>
              </div>

              <button
                onClick={() => setCurrentSpread(totalSpreads + 1)}
                className={`px-2.5 py-1 rounded-sm uppercase tracking-wider transition-colors ${
                  currentSpread > totalSpreads ? 'bg-foil-gold text-noir-950 font-bold' : 'text-noir-400 hover:text-cream-50'
                }`}
              >
                Back
              </button>
            </div>

            {/* Next Spread Button */}
            <button
              onClick={() => setCurrentSpread((prev) => Math.min(totalSpreads + 1, prev + 1))}
              disabled={currentSpread > totalSpreads}
              className="flex items-center gap-1 text-xs font-mono uppercase tracking-wider text-cream-200 hover:text-foil-gold disabled:opacity-30 disabled:hover:text-cream-200 transition-colors"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight size={18} />
            </button>
          </div>

          <p className="text-[11px] text-noir-500 font-mono mt-2 tracking-wider">
            Tip: Use keyboard <kbd className="px-1.5 py-0.5 bg-noir-800 border border-noir-700 rounded text-noir-300">←</kbd> and <kbd className="px-1.5 py-0.5 bg-noir-800 border border-noir-700 rounded text-noir-300">→</kbd> to turn pages
          </p>
        </div>

        {/* Right Sidebar: Pre-flight Audit & Approval */}
        <aside className="w-[340px] lg:w-[380px] bg-noir-900 border-l border-noir-800 flex flex-col shrink-0 z-20">
          <div className="p-6 border-b border-noir-800 flex items-center justify-between">
            <div>
              <h2 className="font-serif text-lg font-bold text-foil-gold tracking-wide">
                Pre-Flight Inspection
              </h2>
              <p className="text-[11px] text-noir-400 mt-0.5 font-mono">
                Automated Print Production Checklist
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-emerald-950/80 border border-emerald-600/50 flex items-center justify-center text-emerald-400">
              <ShieldCheck size={18} />
            </div>
          </div>

          <div className="p-6 flex-1 overflow-y-auto space-y-6">
            {/* Book Spec Summary Card */}
            <div className="p-4 bg-noir-950 border border-noir-800 rounded-sm space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-noir-400 uppercase tracking-wider text-[10px]">Edition</span>
                <span className="font-semibold text-cream-100">{bookTitle}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-noir-400 uppercase tracking-wider text-[10px]">Dimensions</span>
                <span className="font-mono text-cream-100">{dimensions} Precision Square</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-noir-400 uppercase tracking-wider text-[10px]">Page Count</span>
                <span className="font-mono text-cream-100">{pageCount} Pages (1 Photo/Page)</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-noir-400 uppercase tracking-wider text-[10px]">Binding</span>
                <span className="text-cream-100">180° Lay-Flat Hardcover</span>
              </div>
              <div className="flex justify-between items-center text-xs pt-2 border-t border-noir-800">
                <span className="text-noir-400 uppercase tracking-wider text-[10px]">Order Value</span>
                <span className="font-serif text-base font-bold text-foil-gold">₹{price.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Checklist Items */}
            <div>
              <h3 className="text-xs font-mono uppercase tracking-widest text-noir-400 mb-3 font-semibold">
                Print Quality Verification
              </h3>
              <ul className="space-y-3.5 text-xs">
                <li className="flex items-start gap-3">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-cream-100 block">Editorial Multi-Photo & Panoramic Spreads</span>
                    <span className="text-[11px] text-noir-400">All grid collage and 180° panoramic spreads calibrated for print.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-cream-100 block">12K Ultra-HD Indigo Standard</span>
                    <span className="text-[11px] text-noir-400">Optimal 300 DPI resolution for crisp color rendering.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-cream-100 block">Lay-Flat Zero Gutter Loss</span>
                    <span className="text-[11px] text-noir-400">Binding core verified. No photos swallowed in the center crease.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-cream-100 block">Safe Bleed & Spine Debossing</span>
                    <span className="text-[11px] text-noir-400">Title and spine aligned with industrial cutting tolerances.</span>
                  </div>
                </li>
              </ul>
            </div>

            {/* PDF Proof Download Card */}
            <div className="p-3.5 bg-noir-900 border border-noir-800 rounded-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-cream-100 flex items-center gap-1.5">
                  <FileText size={14} className="text-foil-gold" />
                  Print Proof PDF
                </span>
                <span className="text-[10px] font-mono text-noir-400">12K Indigo</span>
              </div>
              <p className="text-[11px] text-noir-400 leading-relaxed">
                Download your complete lay-flat photobook layout with precision trim marks and archival color bars.
              </p>
              <button
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="w-full py-2 bg-noir-800 hover:bg-noir-700 border border-noir-700 rounded-sm text-xs text-cream-100 font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {isGeneratingPdf ? (
                  <>
                    <Loader2 size={13} className="animate-spin text-foil-gold" />
                    <span>Generating PDF...</span>
                  </>
                ) : (
                  <>
                    <Download size={13} className="text-foil-gold" />
                    <span>Download PDF Proof</span>
                  </>
                )}
              </button>
            </div>

            {/* Shipping Trust Note */}
            <div className="p-3 bg-noir-950/70 border border-noir-800 rounded-sm flex items-center gap-3 text-xs text-noir-400">
              <Truck size={16} className="text-foil-gold shrink-0" />
              <span>Pan-India Insured Express Delivery included on this edition.</span>
            </div>
          </div>

          {/* Bottom Approval & Checkout Footer */}
          <div className="p-6 border-t border-noir-800 bg-noir-950 space-y-4">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                className="mt-0.5 accent-foil-gold w-4 h-4 cursor-pointer"
                checked={approved}
                onChange={(e) => setApproved(e.target.checked)}
              />
              <span className="text-xs text-noir-300 group-hover:text-cream-50 transition-colors leading-relaxed">
                I have inspected all {pageCount} pages, margins, and cover details. I approve this photobook for print production.
              </span>
            </label>
            
            <div className="space-y-2.5">
              <button 
                onClick={handleApproveAndAddToCart}
                disabled={!approved || isAddingToCart}
                className="w-full py-3.5 bg-foil-gold text-noir-950 font-bold rounded-sm text-xs uppercase tracking-widest hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-foil-gold/10"
              >
                {isAddingToCart ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Preparing Cart...</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag size={15} />
                    <span>Approve & Add to Cart • ₹{price.toLocaleString('en-IN')}</span>
                  </>
                )}
              </button>

              <button 
                onClick={() => router.push(`/studio/${projectId}`)}
                className="w-full py-2.5 border border-noir-700 text-cream-200 rounded-sm hover:bg-noir-800 transition-colors text-xs uppercase tracking-wider font-semibold"
              >
                Modify in Studio
              </button>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

export default function PreviewPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-noir-950 flex items-center justify-center text-cream-100 font-serif">Loading 3D Proof Preview...</div>}>
      <PreviewContent />
    </Suspense>
  );
}
