'use client';

import { useEditorStore, PageLayout } from '@/stores/useEditorStore';
import { Sparkles, Type, Palette, BookOpen, Check } from 'lucide-react';

export default function EditorRightPanel() {
  const {
    currentSpreadIndex,
    pageCount,
    selectedSlot,
    pageLayouts,
    setPageLayout,
    coverConfig,
    updateCoverConfig,
    pageBackgrounds,
    setPageBackground,
    autoPopulatePages,
    captions,
    setCaption,
    captionCase,
    setCaptionCase,
    activeSidebarTab,
  } = useEditorStore();

  const isCover = currentSpreadIndex === 0;
  const isBack = currentSpreadIndex === Math.ceil(pageCount / 2) + 1;

  // Determine targeted page number
  const leftPageNum = (currentSpreadIndex - 1) * 2 + 1;
  const rightPageNum = (currentSpreadIndex - 1) * 2 + 2;

  let targetedPageNum = leftPageNum;
  if (selectedSlot) {
    const parsed = parseInt(selectedSlot.split('_')[0] || '', 10);
    if (!isNaN(parsed) && parsed > 0) {
      targetedPageNum = parsed;
    }
  }

  const currentLayout: PageLayout = pageLayouts[targetedPageNum] || '1-photo';
  const currentCaption = captions[targetedPageNum] || '';

  // Count slot count for targeted layout
  const slotCountMap: Record<PageLayout, number> = {
    '1-photo': 1,
    '1-photo-full': 1,
    '2-photo-v': 2,
    '2-photo-h': 2,
    '3-photo': 3,
    '3-photo-h': 3,
    '4-photo': 4,
    '6-photo-grid': 6,
    '2-page-panoramic': 1,
  };
  const activePhotosCount = slotCountMap[currentLayout] || 1;

  const layoutCards: { id: PageLayout; label: string; photoCount: number; wireframe: React.ReactNode }[] = [
    {
      id: '1-photo',
      label: '1 photo',
      photoCount: 1,
      wireframe: (
        <div className="w-full h-full p-2 flex items-center justify-center">
          <div className="w-4/5 h-4/5 bg-gray-300 rounded-sm" />
        </div>
      ),
    },
    {
      id: '2-photo-h',
      label: '2 photos h',
      photoCount: 2,
      wireframe: (
        <div className="w-full h-full p-1.5 grid grid-cols-2 gap-1">
          <div className="bg-gray-300 rounded-xs" />
          <div className="bg-gray-300 rounded-xs" />
        </div>
      ),
    },
    {
      id: '2-photo-v',
      label: '2 photos v',
      photoCount: 2,
      wireframe: (
        <div className="w-full h-full p-1.5 grid grid-rows-2 gap-1">
          <div className="bg-gray-300 rounded-xs" />
          <div className="bg-gray-300 rounded-xs" />
        </div>
      ),
    },
    {
      id: '3-photo',
      label: '3 photos',
      photoCount: 3,
      wireframe: (
        <div className="w-full h-full p-1.5 grid grid-cols-2 gap-1">
          <div className="bg-gray-300 rounded-xs" />
          <div className="grid grid-rows-2 gap-1">
            <div className="bg-gray-300 rounded-xs" />
            <div className="bg-gray-300 rounded-xs" />
          </div>
        </div>
      ),
    },
    {
      id: '3-photo-h',
      label: '3 photos h',
      photoCount: 3,
      wireframe: (
        <div className="w-full h-full p-1.5 flex flex-col gap-1">
          <div className="h-3/5 bg-gray-300 rounded-xs" />
          <div className="h-2/5 grid grid-cols-2 gap-1">
            <div className="bg-gray-300 rounded-xs" />
            <div className="bg-gray-300 rounded-xs" />
          </div>
        </div>
      ),
    },
    {
      id: '4-photo',
      label: '4 photos',
      photoCount: 4,
      wireframe: (
        <div className="w-full h-full p-1.5 grid grid-cols-2 grid-rows-2 gap-1">
          <div className="bg-gray-300 rounded-xs" />
          <div className="bg-gray-300 rounded-xs" />
          <div className="bg-gray-300 rounded-xs" />
          <div className="bg-gray-300 rounded-xs" />
        </div>
      ),
    },
  ];

  const handleCaptionChange = (val: string) => {
    let formatted = val;
    if (captionCase === 'lower') {
      formatted = val.toLowerCase();
    } else if (captionCase === 'upper') {
      formatted = val.toUpperCase();
    } else if (captionCase === 'sentence' && val.length > 0) {
      formatted = val.charAt(0).toUpperCase() + val.slice(1);
    }
    setCaption(targetedPageNum, formatted);
  };

  const handleCaseSelect = (c: 'lower' | 'sentence' | 'upper') => {
    setCaptionCase(c);
    const existing = captions[targetedPageNum] || '';
    if (!existing) return;
    let formatted = existing;
    if (c === 'lower') formatted = existing.toLowerCase();
    if (c === 'upper') formatted = existing.toUpperCase();
    if (c === 'sentence') formatted = existing.charAt(0).toUpperCase() + existing.slice(1);
    setCaption(targetedPageNum, formatted);
  };

  const bgPalette = [
    { color: '#FFFFFF', name: 'White' },
    { color: '#FAF8F5', name: 'Cream' },
    { color: '#F4F0E8', name: 'Warm Linen' },
    { color: '#DFD7C7', name: 'Sandstone' },
    { color: '#FDF2F4', name: 'Pale Rose' },
    { color: '#EFF4F0', name: 'Sage' },
    { color: '#18181B', name: 'Matte Noir' },
  ];

  const foilOptions = [
    { id: 'gold', name: 'Gold Foil', color: '#D4AF37' },
    { id: 'silver', name: 'Silver Foil', color: '#C0C0C0' },
    { id: 'rose-gold', name: 'Rose Gold', color: '#B76E79' },
    { id: 'black', name: 'Matte Black', color: '#18181B' },
  ] as const;

  // Background Tab Content
  if (activeSidebarTab === 'background') {
    return (
      <div className="p-5 flex flex-col gap-6 text-gray-900 select-none">
        <div>
          <h3 className="text-sm font-bold text-gray-950">background color</h3>
          <p className="text-xs text-gray-400 mt-0.5">page {targetedPageNum} tone</p>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {bgPalette.map((item) => {
            const isSelected = (pageBackgrounds[targetedPageNum] || '#FFFFFF') === item.color;
            return (
              <button
                key={item.color}
                type="button"
                onClick={() => setPageBackground(targetedPageNum, item.color)}
                className={`flex flex-col items-center gap-1.5 group`}
              >
                <div
                  style={{ backgroundColor: item.color }}
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${
                    isSelected ? 'border-2 border-black ring-1 ring-black shadow-xs' : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {isSelected && <Check size={14} className={item.color === '#18181B' ? 'text-white' : 'text-black'} />}
                </div>
                <span className="text-[10px] text-gray-500 font-medium">{item.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Cover Tab Content
  if (activeSidebarTab === 'cover' || isCover || isBack) {
    return (
      <div className="p-5 flex flex-col gap-6 text-gray-900 select-none">
        <div>
          <h3 className="text-sm font-bold text-gray-950">cover design</h3>
          <p className="text-xs text-gray-400 mt-0.5">foil finishes & title typography</p>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-700 block mb-2">foil imprint finish</label>
          <div className="grid grid-cols-2 gap-2">
            {foilOptions.map((foil) => {
              const isSelected = (coverConfig.foilColor || 'gold') === foil.id;
              return (
                <button
                  key={foil.id}
                  type="button"
                  onClick={() => updateCoverConfig({ foilColor: foil.id })}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                    isSelected ? 'border-2 border-black bg-gray-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: foil.color }} />
                  <span>{foil.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">book title</label>
            <input
              type="text"
              value={coverConfig.title || ''}
              onChange={(e) => updateCoverConfig({ title: e.target.value })}
              placeholder="Our Story"
              className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-black"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">subtitle</label>
            <input
              type="text"
              value={coverConfig.subtitle || ''}
              onChange={(e) => updateCoverConfig({ subtitle: e.target.value })}
              placeholder="Keepsake Edition"
              className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-black"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">spine text</label>
            <input
              type="text"
              value={coverConfig.spineText || ''}
              onChange={(e) => updateCoverConfig({ spineText: e.target.value })}
              placeholder="PERFECTPIC"
              className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-black uppercase font-mono"
            />
          </div>
        </div>
      </div>
    );
  }

  // Default: Layouts + Smart Creation + Caption (matches mockup media_1791563079911.png)
  return (
    <div className="p-5 flex flex-col gap-6 text-gray-900 select-none">
      {/* 1. Layouts Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-950">layouts</h3>
          <span className="text-xs text-gray-400 font-medium">{activePhotosCount} photos</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {layoutCards.map((card) => {
            const isSelected = currentLayout === card.id;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => setPageLayout(targetedPageNum, card.id)}
                className={`group aspect-[4/3] rounded-xl border p-2 flex flex-col items-center justify-between transition-all bg-white hover:bg-gray-50/50 ${
                  isSelected
                    ? 'border-2 border-black ring-1 ring-black shadow-xs'
                    : 'border-gray-200 hover:border-gray-400'
                }`}
                title={`Apply ${card.label}`}
              >
                <div className="w-full flex-1 rounded-sm overflow-hidden bg-gray-100 flex items-center justify-center">
                  {card.wireframe}
                </div>
                <span className="text-[10px] text-gray-500 font-medium mt-1 truncate w-full text-center">
                  {card.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Smart Creation Section (Solid Black Card) */}
      <div className="bg-black text-white p-4.5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Sparkles size={14} className="text-amber-400" />
          <h4 className="text-xs font-semibold text-white">smart creation</h4>
        </div>
        <p className="text-[11px] text-gray-400 leading-relaxed mb-3">
          automatically arrange your photos with smart balance and pacing.
        </p>
        <button
          type="button"
          onClick={() => autoPopulatePages()}
          className="w-full py-2 px-4 rounded-full bg-white text-black text-xs font-semibold hover:bg-gray-100 transition-colors shadow-xs flex items-center justify-center gap-1.5"
        >
          <Sparkles size={12} className="text-black" />
          <span>auto-arrange</span>
        </button>
      </div>

      {/* 3. Caption Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-gray-950">caption</h3>
          <span className="text-xs text-gray-400">p.{targetedPageNum}</span>
        </div>

        <input
          type="text"
          value={currentCaption}
          onChange={(e) => handleCaptionChange(e.target.value)}
          placeholder="enter page caption..."
          className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-black text-gray-900 transition-all placeholder:text-gray-400"
        />

        {/* Casing Pills aa, Aa, AA */}
        <div className="flex items-center gap-2 mt-2.5">
          {[
            { id: 'lower', label: 'aa' },
            { id: 'sentence', label: 'Aa' },
            { id: 'upper', label: 'AA' },
          ].map((item) => {
            const isSelected = captionCase === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleCaseSelect(item.id as any)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-black text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:text-black hover:bg-gray-200'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
