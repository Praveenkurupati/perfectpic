'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useEditorStore } from '@/stores/useEditorStore';

const BookCanvas = dynamic(() => import('@/features/editor/components/BookCanvas'), { ssr: false });
const EditorToolbar = dynamic(() => import('@/features/editor/components/EditorToolbar'), { ssr: false });
const PhotoTray = dynamic(() => import('@/features/editor/components/PhotoTray'), { ssr: false });
const SpreadFilmstrip = dynamic(() => import('@/features/editor/components/SpreadFilmstrip'), { ssr: false });

export default function StudioPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = (params?.projectId as string) || '';
  const { undo, redo, bookConfig } = useEditorStore();

  return (
    <div className="h-screen flex flex-col bg-cream-50 font-sans text-noir-900 overflow-hidden">
      {/* Top Bar */}
      <header className="h-14 border-b border-cream-300 bg-white flex items-center justify-between px-4 z-10 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push(`/upload/${projectId}`)} className="p-2 hover:bg-cream-50 rounded-sm">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          </button>
          <div>
            <h1 className="font-serif font-bold text-lg leading-none tracking-wide">Untitled Project</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-noir-500 mt-1">{bookConfig.size} • {bookConfig.coverType} • ₹2,499</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button onClick={undo} className="p-2 hover:bg-cream-50 rounded-sm" title="Undo">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
          </button>
          <button onClick={redo} className="p-2 hover:bg-cream-50 rounded-sm" title="Redo">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/></svg>
          </button>
          <div className="w-px h-6 bg-cream-300 mx-2" />
          <button 
            onClick={() => router.push(`/preview/${projectId}`)}
            className="px-4 py-2 text-sm font-medium border border-noir-900 rounded-sm hover:bg-cream-100 transition-colors"
          >
            3D Preview
          </button>
          <button 
            onClick={() => router.push(`/preview/${projectId}`)}
            className="px-4 py-2 text-sm font-medium bg-noir-950 text-cream-50 rounded-sm hover:bg-noir-900 transition-colors"
          >
            Approve & Order
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-[280px] bg-white border-r border-cream-300 flex flex-col shrink-0 z-10 overflow-y-auto">
          <EditorToolbar />
        </aside>

        {/* Center Canvas */}
        <main className="flex-1 bg-cream-100 relative flex flex-col items-center justify-center p-8 overflow-hidden">
          <div className="absolute top-4 left-4 text-xs text-noir-500 uppercase tracking-wider">Pages 2-3</div>
          <BookCanvas />
        </main>

        {/* Right Sidebar */}
        <aside className="w-[260px] bg-white border-l border-cream-300 flex flex-col shrink-0 z-10 overflow-hidden">
          <PhotoTray />
        </aside>
      </div>

      {/* Bottom Filmstrip */}
      <footer className="h-32 bg-white border-t border-cream-300 shrink-0 z-10">
        <SpreadFilmstrip />
      </footer>
    </div>
  );
}
