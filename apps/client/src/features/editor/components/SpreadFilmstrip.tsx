'use client';

import { useEditorStore } from '@/stores/useEditorStore';
import { Plus } from 'lucide-react';
import { normalizeImageUrl, handleImageError } from '@/lib/urls';

export default function SpreadFilmstrip() {
  const { 
    pageCount, 
    currentSpreadIndex, 
    setCurrentSpreadIndex, 
    pagePhotos, 
    slotPhotos,
    pageLayouts,
    addSpread,
    template
  } = useEditorStore();

  const totalSpreads = Math.ceil(pageCount / 2);
  const coverBg = template?.coverColor || '#F8BAC7';

  const spreadsList = [];

  // 1. Cover
  spreadsList.push({
    index: 0,
    label: 'cover',
    isCover: true,
    isBack: false,
    leftNum: 0,
    rightNum: 0
  });

  // 2. Inside Spreads
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
    label: 'back',
    isCover: false,
    isBack: true,
    leftNum: 0,
    rightNum: 0
  });

  return (
    <div className="w-full flex flex-col select-none py-2 px-4">
      {/* Filmstrip Header (Mockup: spreads · 16 and + add spread) */}
      <div className="flex justify-between items-center mb-2 px-1">
        <div className="flex items-center gap-1.5 text-xs text-gray-700 font-medium">
          <span className="font-bold text-gray-950">spreads</span>
          <span>·</span>
          <span className="font-mono text-gray-500">{totalSpreads}</span>
        </div>

        <button
          type="button"
          onClick={() => addSpread()}
          className="inline-flex items-center gap-1 text-xs font-semibold text-gray-700 hover:text-black transition-colors"
        >
          <Plus size={13} className="stroke-[2.5]" />
          <span>add spread</span>
        </button>
      </div>
      
      {/* Horizontal Scroll of Thumbnails */}
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
        {spreadsList.map((spread) => {
          const isActive = currentSpreadIndex === spread.index;
          const leftPhoto = slotPhotos[`${spread.leftNum}_0`] || pagePhotos[spread.leftNum];
          const rightPhoto = slotPhotos[`${spread.rightNum}_0`] || pagePhotos[spread.rightNum];
          const coverPhoto = slotPhotos['0'] || pagePhotos[0] || (template?.coverImage ? { url: template.coverImage } : null);

          return (
            <div 
              key={spread.index} 
              onClick={() => setCurrentSpreadIndex(spread.index)}
              className="shrink-0 cursor-pointer flex flex-col items-center gap-1 group"
            >
              {/* Thumbnail Container */}
              <div 
                className={`h-14 w-24 sm:w-26 rounded-lg overflow-hidden transition-all duration-150 p-1 flex items-center justify-center bg-white ${
                  isActive 
                    ? 'border-2 border-black ring-1 ring-black shadow-md' 
                    : 'border border-gray-200 hover:border-gray-400 bg-white/80'
                }`}
              >
                {spread.isCover ? (
                  <div 
                    className="w-full h-full rounded-sm overflow-hidden flex items-center justify-center relative shadow-inner"
                    style={{ backgroundColor: coverBg }}
                  >
                    {coverPhoto?.url ? (
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
                ) : spread.isBack ? (
                  <div 
                    className="w-full h-full rounded-sm overflow-hidden flex items-center justify-center shadow-inner"
                    style={{ backgroundColor: coverBg }}
                  >
                    <span className="text-[9px] font-bold text-white uppercase tracking-wider">Back</span>
                  </div>
                ) : (
                  <div className="w-full h-full flex gap-1 rounded-sm overflow-hidden bg-gray-100 p-0.5">
                    {/* Left Page Mini */}
                    <div className="flex-1 bg-white rounded-xs overflow-hidden relative flex items-center justify-center border border-gray-200/60">
                      {leftPhoto?.url ? (
                        <img 
                          src={normalizeImageUrl(leftPhoto.url)} 
                          alt={`P.${spread.leftNum}`} 
                          data-original-url={leftPhoto.url}
                          className="w-full h-full object-cover" 
                          onError={handleImageError}
                        />
                      ) : (
                        <span className="text-[8px] text-gray-300 font-mono">{spread.leftNum}</span>
                      )}
                    </div>
                    {/* Right Page Mini */}
                    <div className="flex-1 bg-white rounded-xs overflow-hidden relative flex items-center justify-center border border-gray-200/60">
                      {rightPhoto?.url ? (
                        <img 
                          src={normalizeImageUrl(rightPhoto.url)} 
                          alt={`P.${spread.rightNum}`} 
                          data-original-url={rightPhoto.url}
                          className="w-full h-full object-cover" 
                          onError={handleImageError}
                        />
                      ) : (
                        <span className="text-[8px] text-gray-300 font-mono">{spread.rightNum}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Page Numbers Label */}
              <span className={`text-[10px] font-medium transition-colors ${
                isActive ? 'text-black font-bold' : 'text-gray-400 group-hover:text-gray-700'
              }`}>
                {spread.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
