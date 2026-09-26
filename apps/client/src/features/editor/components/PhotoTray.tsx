'use client';

import { useEditorStore } from '@/stores/useEditorStore';

export default function PhotoTray() {
  const { photoFilter, setPhotoFilter } = useEditorStore();

  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b border-cream-300 text-xs uppercase tracking-wider font-medium">
        {['all', 'unused', 'flagged'].map(filter => (
          <button 
            key={filter}
            onClick={() => setPhotoFilter(filter as any)}
            className={`flex-1 py-3 text-center border-b-2 ${photoFilter === filter ? 'border-noir-900 text-noir-900' : 'border-transparent text-noir-400 hover:text-noir-600'}`}
          >
            {filter}
          </button>
        ))}
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 grid grid-cols-2 gap-2 content-start">
        {/* Mock photos */}
        {[1,2,3,4,5,6,7,8].map(i => (
          <div key={i} className="aspect-square bg-cream-200 rounded-sm relative group cursor-grab">
            <div className="absolute inset-0 border-2 border-transparent group-hover:border-foil-gold transition-colors rounded-sm" />
            {i % 3 === 0 && (
              <span className="absolute top-1 right-1 bg-black/60 text-white text-[10px] px-1 rounded-sm">Used</span>
            )}
          </div>
        ))}
      </div>
      
      <div className="p-4 border-t border-cream-300">
        <button className="w-full py-2 border border-dashed border-noir-300 rounded-sm text-sm hover:border-noir-900 transition-colors">
          + Add Photos
        </button>
      </div>
    </div>
  );
}
