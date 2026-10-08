'use client';

import { useEditorStore } from '@/stores/useEditorStore';
import { Sparkles } from 'lucide-react';
import { normalizeImageUrl, handleImageError } from '@/lib/urls';

export default function SpreadFilmstrip() {
  const { 
    pageCount, 
    currentSpreadIndex, 
    setCurrentSpreadIndex, 
    pagePhotos, 
    autoPopulatePages,
    template
  } = useEditorStore();

  const totalSpreads = Math.ceil(pageCount / 2);
  const coverBg = template?.coverColor || '#F8BAC7';

  // Count placed photos
  const placedCount = Object.keys(pagePhotos).filter(k => Number(k) > 0 && pagePhotos[Number(k)]).length;

  const spreadsList = [];

  // 1. Cover
  spreadsList.push({
    index: 0,
    label: 'Cover',
    isCover: true,
    isBack: false,
    leftNum: 0,
    rightNum: 0
  });

  // 2. Inside Spreads (1 photo per page)
  for (let i = 1; i <= totalSpreads; i++) {
    const leftNum = (i - 1) * 2 + 1;
    const rightNum = (i - 1) * 2 + 2;
    spreadsList.push({
      index: i,
      label: `${leftNum} – ${rightNum}`,
      isCover: false,
      isBack: false,
      leftNum,
      rightNum
    });
  }

  // 3. Back Cover
  spreadsList.push({
    index: totalSpreads + 1,
    label: 'Back',
    isCover: false,
    isBack: true,
    leftNum: 0,
    rightNum: 0
  });

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Filmstrip Header */}
      <div className="flex justify-between items-center px-4 py-2 border-b border-cream-200 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold uppercase tracking-wider text-noir-800 text-[11px]">
            Spread Filmstrip
          </span>
          <span className="text-noir-400">•</span>
          <span className="text-noir-600 font-mono text-[11px]">
            {placedCount} of {pageCount} pages placed (1 photo / page)
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => autoPopulatePages()}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-cream-100 hover:bg-cream-200 text-noir-900 rounded-sm text-[11px] font-medium border border-cream-300 transition-colors"
          >
            <Sparkles size={12} className="text-foil-gold" />
            <span>Auto-Fill Album</span>
          </button>
        </div>
      </div>
      
      {/* Horizontal Scroll of Thumbnails */}
      <div className="flex-1 flex items-center px-4 gap-3 overflow-x-auto no-scrollbar py-2">
        {spreadsList.map((spread) => {
          const isActive = currentSpreadIndex === spread.index;
          const leftPhoto = pagePhotos[spread.leftNum];
          const rightPhoto = pagePhotos[spread.rightNum];
          const coverPhoto = pagePhotos[0];

          return (
            <div 
              key={spread.index} 
              onClick={() => setCurrentSpreadIndex(spread.index)}
              className="flex-shrink-0 cursor-pointer flex flex-col items-center gap-1.5 group"
            >
              {/* Thumbnail Container */}
              <div 
                className={`
                  ${spread.isCover || spread.isBack ? 'w-14' : 'w-24'} 
                  h-16 rounded-sm shadow-xs border transition-all duration-200 overflow-hidden relative flex
                  ${isActive 
                    ? 'ring-2 ring-foil-gold ring-offset-2 border-foil-gold' 
                    : 'border-cream-300 group-hover:border-noir-500'}
                `}
                style={{ backgroundColor: (spread.isCover || spread.isBack) ? coverBg : '#FFFFFF' }}
              >
                {/* Cover thumbnail */}
                {spread.isCover && (
                  <div className="w-full h-full relative overflow-hidden flex items-center justify-center">
                    {coverPhoto ? (
                      <img 
                        src={normalizeImageUrl(coverPhoto.url)} 
                        alt="Cover" 
                        data-original-url={coverPhoto.url}
                        className="w-full h-full object-cover" 
                        onError={handleImageError}
                      />
                    ) : (
                      <span className="text-[9px] font-bold text-white uppercase tracking-wider">Cover</span>
                    )}
                  </div>
                )}

                {/* Back thumbnail */}
                {spread.isBack && (
                  <div className="w-full h-full flex items-center justify-center text-white/80">
                    <span className="text-[9px] font-bold uppercase tracking-wider">Back</span>
                  </div>
                )}

                {/* Two-page inside spread thumbnail (1 photo per page) */}
                {!spread.isCover && !spread.isBack && (
                  <>
                    {/* Left half */}
                    <div className="flex-1 h-full border-r border-cream-200 bg-cream-50 p-1 flex items-center justify-center overflow-hidden">
                      {leftPhoto ? (
                        <img 
                          src={normalizeImageUrl(leftPhoto.url)} 
                          alt={`p${spread.leftNum}`} 
                          data-original-url={leftPhoto.url}
                          className="w-full h-full object-cover rounded-[1px]" 
                          onError={handleImageError}
                        />
                      ) : (
                        <span className="text-[8px] text-cream-400 font-mono">{spread.leftNum}</span>
                      )}
                    </div>
                    {/* Right half */}
                    <div className="flex-1 h-full bg-cream-50 p-1 flex items-center justify-center overflow-hidden">
                      {rightPhoto ? (
                        <img 
                          src={normalizeImageUrl(rightPhoto.url)} 
                          alt={`p${spread.rightNum}`} 
                          data-original-url={rightPhoto.url}
                          className="w-full h-full object-cover rounded-[1px]" 
                          onError={handleImageError}
                        />
                      ) : (
                        <span className="text-[8px] text-cream-400 font-mono">{spread.rightNum}</span>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Label */}
              <span className={`text-[10px] tabular-nums font-mono ${isActive ? 'text-foil-gold font-bold' : 'text-noir-500'}`}>
                {spread.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
