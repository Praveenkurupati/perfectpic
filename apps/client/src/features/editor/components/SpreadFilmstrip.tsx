'use client';

import { useEditorStore } from '@/stores/useEditorStore';

export default function SpreadFilmstrip() {
  const { currentPageIndex, setCurrentPage, pages } = useEditorStore();

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center px-4 py-2 border-b border-cream-200">
        <span className="text-xs font-medium uppercase tracking-widest text-noir-500">Spreads</span>
        <span className="text-xs text-noir-600 tabular-nums">24 / 75 pages <span className="text-foil-gold ml-1">+₹600</span></span>
      </div>
      
      <div className="flex-1 flex items-center px-4 gap-4 overflow-x-auto no-scrollbar">
        {pages.map((page, idx) => (
          <div 
            key={page.id} 
            onClick={() => setCurrentPage(idx)}
            className={`flex-shrink-0 cursor-pointer flex flex-col items-center gap-2 group`}
          >
            <div className={`
              ${page.type === 'spread' ? 'w-24' : 'w-12'} 
              h-16 bg-cream-100 rounded-sm shadow-sm transition-all
              ${currentPageIndex === idx ? 'ring-2 ring-foil-gold ring-offset-2' : 'group-hover:ring-1 group-hover:ring-noir-300'}
            `}>
              <div className="w-full h-full flex items-center justify-center text-[10px] text-cream-400">
                {page.type}
              </div>
            </div>
            <span className="text-[10px] text-noir-500 tabular-nums">{idx === 0 ? 'Cover' : idx === pages.length - 1 ? 'Back' : `${idx*2}-${idx*2+1}`}</span>
          </div>
        ))}
        
        <button className="w-12 h-16 border border-dashed border-cream-400 rounded-sm flex items-center justify-center text-cream-400 hover:text-noir-900 hover:border-noir-900 transition-colors">
          +
        </button>
      </div>
    </div>
  );
}
