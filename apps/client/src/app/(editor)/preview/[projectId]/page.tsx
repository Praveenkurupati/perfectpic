'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const BookFlipPreview = dynamic(() => import('@/features/preview/components/BookFlipPreview'), { ssr: false });

export default function PreviewPage({ params }: { params: { projectId: string } }) {
  const router = useRouter();
  const [approved, setApproved] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-noir-800 text-cream-50 font-sans">
      <header className="h-16 flex items-center justify-between px-8 border-b border-noir-700 bg-noir-900 shrink-0">
        <h1 className="font-serif text-2xl tracking-wide">3D Preview</h1>
        <button onClick={() => router.push(`/studio/${params.projectId}`)} className="text-sm hover:text-foil-gold uppercase tracking-widest">
          Close Preview
        </button>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Book Flip Area */}
        <div className="flex-1 flex items-center justify-center relative p-12">
          <BookFlipPreview />
          
          {/* Controls */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 bg-noir-900/80 px-6 py-3 rounded-full backdrop-blur-sm">
            <button className="p-2 hover:text-foil-gold"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg></button>
            <span className="text-sm tabular-nums tracking-widest">PAGE 4 - 5</span>
            <button className="p-2 hover:text-foil-gold"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg></button>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="w-[320px] bg-noir-900 border-l border-noir-700 flex flex-col shrink-0">
          <div className="p-6 flex-1 overflow-y-auto">
            <h3 className="font-serif text-xl mb-6 text-foil-gold">Pre-flight Checklist</h3>
            <ul className="space-y-4 text-sm">
              <li className="flex gap-3"><span className="text-green-500">✅</span> All photo slots filled</li>
              <li className="flex gap-3"><span className="text-yellow-500">⚠️</span> 3 images below 300 DPI</li>
              <li className="flex gap-3"><span className="text-green-500">✅</span> No text crossing bleed lines</li>
              <li className="flex gap-3"><span className="text-green-500">✅</span> Spine text reviewed</li>
            </ul>
          </div>
          
          <div className="p-6 border-t border-noir-700 space-y-4 bg-noir-950">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                className="mt-1 accent-foil-gold"
                checked={approved}
                onChange={(e) => setApproved(e.target.checked)}
              />
              <span className="text-xs text-noir-300 group-hover:text-cream-50 transition-colors">
                I have reviewed my spelling, image crops, and layout. I approve this book for printing.
              </span>
            </label>
            
            <div className="space-y-2">
              <button 
                onClick={() => router.push(`/cart`)}
                disabled={!approved}
                className="w-full py-3 bg-foil-gold text-noir-950 font-medium rounded-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-opacity-90 transition-all"
              >
                Approve & Add to Cart
              </button>
              <button 
                onClick={() => router.push(`/studio/${params.projectId}`)}
                className="w-full py-3 border border-noir-700 text-cream-50 rounded-sm hover:bg-noir-800 transition-colors text-sm"
              >
                Make Changes
              </button>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
