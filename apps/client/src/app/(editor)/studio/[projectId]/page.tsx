'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useEditorStore } from '@/stores/useEditorStore';
import { useCartStore } from '@/stores/useCartStore';
import { 
  Undo, 
  Redo, 
  Eye, 
  ArrowLeft, 
  Download, 
  Loader2,
  Image as ImageIcon,
  LayoutGrid,
  Type,
  Palette,
  BookOpen
} from 'lucide-react';
import { generateBookProofPdf } from '@/lib/pdfGenerator';
import { trackEvent } from '@/lib/analytics';

const BookCanvas = dynamic(() => import('@/features/editor/components/BookCanvas'), { ssr: false });
const PhotoTray = dynamic(() => import('@/features/editor/components/PhotoTray'), { ssr: false });
const SpreadFilmstrip = dynamic(() => import('@/features/editor/components/SpreadFilmstrip'), { ssr: false });
const EditorRightPanel = dynamic(() => import('@/features/editor/components/EditorRightPanel'), { ssr: false });
const MobileEditorDock = dynamic(() => import('@/features/editor/components/MobileEditorDock'), { ssr: false });

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
    photos,
    pagePhotos, 
    slotPhotos, 
    slotCrops, 
    pageLayouts, 
    pageBackgrounds, 
    coverConfig,
    activeSidebarTab,
    setActiveSidebarTab,
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
      if (e.key === 'ArrowLeft' && currentSpreadIndex > 0) {
        setCurrentSpreadIndex(currentSpreadIndex - 1);
      } else if (e.key === 'ArrowRight' && currentSpreadIndex <= totalSpreads) {
        setCurrentSpreadIndex(currentSpreadIndex + 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSpreadIndex, pageCount, setCurrentSpreadIndex]);

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

  const saveSnapshot = () => {
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
    return projectSnapshot;
  };

  const handleApproveAndOrder = () => {
    const thumbnail = pagePhotos[0]?.url || template?.coverImage || 'https://images.unsplash.com/photo-1544928147-79a2dbc1f389?w=400';
    const projectSnapshot = saveSnapshot();

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

  const toolRailItems = [
    { id: 'photos', label: 'photos', icon: ImageIcon },
    { id: 'layouts', label: 'layouts', icon: LayoutGrid },
    { id: 'text', label: 'text', icon: Type },
    { id: 'background', label: 'background', icon: Palette },
    { id: 'cover', label: 'cover', icon: BookOpen },
  ] as const;

  const displayBookTitle = template?.displayName || template?.title || 'kerala';

  return (
    <div className="h-screen flex flex-col bg-white font-sans text-gray-900 overflow-hidden select-none">
      {/* 1a. Mobile Top Header (< lg) matching reference design media_1791638307136.png */}
      <header className="lg:hidden h-14 border-b border-gray-200/80 bg-white flex items-center justify-between px-4 z-30 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button 
            type="button"
            onClick={() => router.push(`/upload/${projectId}`)} 
            className="p-1 -ml-1 text-black hover:bg-gray-100 rounded-full transition-colors shrink-0"
            title="Back to Upload"
          >
            <ArrowLeft size={20} className="stroke-[2.2]" />
          </button>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-gray-950 truncate max-w-[210px] sm:max-w-xs">
              {displayBookTitle} · untitled
            </h1>
            <p className="text-[11px] text-gray-400 font-normal leading-tight mt-0.5">
              saved just now
            </p>
          </div>
        </div>

        <button 
          type="button"
          onClick={handleApproveAndOrder}
          className="px-5 py-2 rounded-full bg-black text-white text-xs font-semibold hover:bg-neutral-800 shadow-xs transition-colors shrink-0"
        >
          continue
        </button>
      </header>

      {/* 1b. Desktop Top Header (>= lg) */}
      <header className="hidden lg:flex h-14 border-b border-gray-200 bg-white items-center justify-between px-5 z-30 shrink-0">
        {/* Left: Brand Squircle + Book Title + Saved Indicator */}
        <div className="flex items-center gap-3 min-w-0">
          <button 
            type="button"
            onClick={() => router.push(`/upload/${projectId}`)} 
            className="p-1 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-black transition-colors shrink-0"
            title="Back to Upload"
          >
            <ArrowLeft size={16} />
          </button>

          <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
            P
          </div>

          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-gray-950 truncate max-w-[240px] md:max-w-none">
              {template?.displayName || template?.title || 'untitled book'}
            </h1>
            <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-mono leading-none mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span>saved just now</span>
            </div>
          </div>
        </div>
        
        {/* Center: Undo & Redo Pills */}
        <div className="flex items-center gap-1 bg-gray-100/90 rounded-full p-0.5 border border-gray-200">
          <button 
            type="button"
            onClick={undo} 
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white text-gray-600 hover:text-black transition-colors" 
            title="Undo"
          >
            <Undo size={13} />
          </button>
          <button 
            type="button"
            onClick={redo} 
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white text-gray-600 hover:text-black transition-colors" 
            title="Redo"
          >
            <Redo size={13} />
          </button>
        </div>

        {/* Right: PDF Proof + Preview + Continue Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button 
            type="button"
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
            title="Download PDF proof"
          >
            {isExportingPdf ? (
              <Loader2 size={15} className="animate-spin text-black" />
            ) : (
              <Download size={15} />
            )}
          </button>

          <button 
            type="button"
            onClick={() => {
              trackEvent('editor_action', 'studio_preview_viewed', { projectId, pageCount });
              saveSnapshot();
              router.push(`/preview/${projectId}`);
            }}
            className="px-4 py-1.5 rounded-full border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50 shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Eye size={13} />
            <span>preview</span>
          </button>

          <button 
            type="button"
            onClick={handleApproveAndOrder}
            className="px-5 py-1.5 rounded-full bg-black text-white text-xs font-medium hover:bg-neutral-800 shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <span>continue</span>
          </button>
        </div>
      </header>

      {/* 2. Main Studio Workspace Layout */}
      <div className="flex-1 min-h-0 flex overflow-hidden relative">
        {/* Far-Left Tool Rail (64px wide: photos, layouts, text, background, cover) - Desktop Only */}
        <aside className="hidden lg:flex w-16 h-full bg-white border-r border-gray-200 flex-col items-center py-4 gap-4 shrink-0 z-20">
          {toolRailItems.map((item) => {
            const isTabActive = activeSidebarTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSidebarTab(item.id)}
                className={`flex flex-col items-center justify-center w-12 py-2 rounded-xl transition-all ${
                  isTabActive
                    ? 'text-black bg-gray-100 font-semibold shadow-2xs'
                    : 'text-gray-400 hover:text-gray-800 hover:bg-gray-50'
                }`}
                title={item.label}
              >
                <Icon size={19} className={isTabActive ? 'text-black' : 'text-gray-400'} />
                <span className="text-[10px] mt-1 tracking-tight capitalize">{item.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Left Panel: "your photos" Tray (270px wide) - Desktop Only */}
        <aside className="hidden lg:flex w-[270px] h-full min-h-0 bg-white border-r border-gray-200 flex-col shrink-0 z-10 overflow-hidden">
          <PhotoTray />
        </aside>

        {/* Center Column: Warm Beige Canvas + Floating Action Capsule + Bottom Filmstrip / Dock */}
        <main className="flex-1 min-h-0 bg-[#EBE7DF] relative flex flex-col overflow-hidden min-w-0">
          {/* Canvas Spread Area */}
          <div className="flex-1 min-h-0 relative flex flex-col items-center justify-between lg:justify-center p-2 sm:p-4 lg:p-6 overflow-y-auto lg:overflow-auto no-scrollbar">
            <BookCanvas />

            {/* Mobile Spread Filmstrip (< lg) - positioned right below zoom and above bottom dock */}
            <div className="lg:hidden w-full max-w-md my-2 shrink-0">
              <SpreadFilmstrip compact={true} />
            </div>
          </div>

          {/* Desktop Spread Filmstrip (>= lg) */}
          <div className="hidden lg:flex h-32 bg-[#EBE7DF] border-t border-black/5 shrink-0 z-10 flex-col justify-center">
            <SpreadFilmstrip />
          </div>

          {/* Mobile Docked Bottom Sheet (< lg) matching screenshot media_1791638307136.png */}
          <div className="lg:hidden shrink-0 w-full z-30">
            <MobileEditorDock />
          </div>
        </main>

        {/* Right Panel: Layouts + Smart Creation + Caption (280px wide) - Desktop Only */}
        <aside className="hidden lg:flex w-[280px] h-full min-h-0 bg-white border-l border-gray-200 flex-col shrink-0 z-10 overflow-y-auto">
          <EditorRightPanel />
        </aside>
      </div>
    </div>
  );
}

export default function StudioPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-[#EBE7DF] flex items-center justify-center text-sm font-sans text-gray-600">loading studio...</div>}>
      <StudioContent />
    </Suspense>
  );
}
