'use client';

import { useState } from 'react';
import { useEditorStore, PageLayout } from '@/stores/useEditorStore';
import { LayoutGrid, Sparkles, Type, Palette, Check } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';
import { getSpineMetrics } from '@/lib/spineCalculator';

const panels = ['Layouts', 'Cover', 'Backgrounds'] as const;

export default function EditorToolbar() {
  const [activePanel, setActivePanel] = useState<string>('Layouts');

  const {
    currentSpreadIndex,
    pageCount,
    selectedSlot,
    setSelectedSlot,
    pageLayouts,
    setPageLayout,
    coverConfig,
    updateCoverConfig,
    pageBackgrounds,
    setPageBackground,
    template,
  } = useEditorStore();

  const isCover = currentSpreadIndex === 0;
  const isBack = currentSpreadIndex === Math.ceil(pageCount / 2) + 1;

  // Determine which page number is currently targeted (Left or Right page of spread)
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
  const currentBg = pageBackgrounds[targetedPageNum] || '#FFFFFF';

  const layoutCategories = [
    {
      title: 'Each Page 1 Image',
      options: [
        { id: '1-photo' as PageLayout, label: '1 Photo (Classic)', iconDesc: 'Centered gallery margins' },
        { id: '1-photo-full' as PageLayout, label: '1 Photo (Full Bleed)', iconDesc: 'Edge-to-edge full page' },
      ],
    },
    {
      title: 'Two Pages 1 Image (Panoramic)',
      options: [
        { id: '2-page-panoramic' as PageLayout, label: 'Panoramic Spread', iconDesc: 'Spans both Left & Right pages' },
      ],
    },
    {
      title: 'One Page 2 Images',
      options: [
        { id: '2-photo-v' as PageLayout, label: '2 Photos (Vertical)', iconDesc: 'Stacked top & bottom' },
        { id: '2-photo-h' as PageLayout, label: '2 Photos (Horizontal)', iconDesc: 'Side-by-side pair' },
      ],
    },
    {
      title: 'Grid & Story Collages',
      options: [
        { id: '3-photo' as PageLayout, label: '3 Photos (Hero + Duo)', iconDesc: '1 large hero + 2 small' },
        { id: '4-photo' as PageLayout, label: '4 Photos (2×2 Grid)', iconDesc: 'Balanced square collage' },
        { id: '6-photo-grid' as PageLayout, label: '6 Photos (3×2 Grid)', iconDesc: 'Mini story gallery' },
      ],
    },
  ];

  const foilOptions = [
    { id: 'gold', name: 'Gold Foil', color: '#D4AF37', previewClass: 'from-amber-200 via-amber-400 to-yellow-200' },
    { id: 'silver', name: 'Silver Foil', color: '#C0C0C0', previewClass: 'from-slate-200 via-slate-300 to-gray-200' },
    { id: 'rose-gold', name: 'Rose Gold', color: '#B76E79', previewClass: 'from-rose-200 via-rose-300 to-amber-100' },
    { id: 'black', name: 'Matte Black', color: '#18181B', previewClass: 'from-neutral-800 to-black' },
  ] as const;

  const bgPalette = [
    { color: '#FFFFFF', name: 'Pure White' },
    { color: '#FAF8F5', name: 'Ivory Cream' },
    { color: '#F4F0E8', name: 'Warm Linen' },
    { color: '#DFD7C7', name: 'Sandstone' },
    { color: '#FDF2F4', name: 'Pale Rose' },
    { color: '#EFF4F0', name: 'Sage Tint' },
    { color: '#141413', name: 'Midnight Noir' },
  ];

  const handleSelectLayout = (layoutId: PageLayout) => {
    if (layoutId === '2-page-panoramic') {
      setPageLayout(leftPageNum, '2-page-panoramic');
      setPageLayout(rightPageNum, '2-page-panoramic');
      setSelectedSlot(`spread_${currentSpreadIndex}`);
    } else {
      if (pageLayouts[leftPageNum] === '2-page-panoramic' || pageLayouts[rightPageNum] === '2-page-panoramic') {
        setPageLayout(leftPageNum, targetedPageNum === leftPageNum ? layoutId : '1-photo');
        setPageLayout(rightPageNum, targetedPageNum === rightPageNum ? layoutId : '1-photo');
        setSelectedSlot(targetedPageNum.toString());
      } else {
        setPageLayout(targetedPageNum, layoutId);
      }
    }

    trackEvent('editor_action', `Selected Layout: ${layoutId}`, {
      layout: layoutId,
      page: targetedPageNum,
    });
  };

  const isCurrentPanoramic = pageLayouts[leftPageNum] === '2-page-panoramic' || pageLayouts[rightPageNum] === '2-page-panoramic';

  return (
    <div className="flex flex-col h-full bg-white select-none">
      {/* Targeted Page / Context Indicator */}
      <div className="p-3 bg-cream-100/70 border-b border-cream-200 text-xs">
        <span className="text-[10px] uppercase font-bold tracking-wider text-noir-500 block mb-0.5">
          Active Customization:
        </span>
        <span className="font-serif font-semibold text-noir-900">
          {isCover
            ? 'Front Cover Foil & Typography'
            : isBack
            ? 'Back Cover'
            : isCurrentPanoramic
            ? `Panoramic Spread (Pages ${leftPageNum} & ${rightPageNum})`
            : `Page ${targetedPageNum} (of ${pageCount})`}
        </span>
      </div>

      {panels.map((panel) => (
        <div key={panel} className="border-b border-cream-200">
          <button
            onClick={() => setActivePanel(activePanel === panel ? '' : panel)}
            className="w-full px-4 py-3.5 flex justify-between items-center text-xs font-bold uppercase tracking-wider text-noir-800 hover:bg-cream-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              {panel === 'Layouts' && <LayoutGrid size={14} className="text-foil-gold" />}
              {panel === 'Cover' && <Type size={14} className="text-foil-gold" />}
              {panel === 'Backgrounds' && <Palette size={14} className="text-foil-gold" />}
              <span>{panel}</span>
            </div>
            <span className="text-noir-400 font-mono text-base">{activePanel === panel ? '−' : '+'}</span>
          </button>

          {activePanel === panel && (
            <div className="p-4 bg-cream-50/50 space-y-4">
              {/* PANEL 1: LAYOUTS */}
              {panel === 'Layouts' && (
                <div>
                  {isCover || isBack ? (
                    <p className="text-xs text-noir-500 italic">
                      Layouts apply to internal pages. Navigate to any page spread to change photo arrangements.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {/* Page Target Selector for Current Spread */}
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-noir-500">
                            Apply Layout To:
                          </span>
                          <span className="text-[10px] text-foil-gold font-mono uppercase">
                            {isCurrentPanoramic ? 'Panoramic' : `P.${targetedPageNum} (${currentLayout})`}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 p-1 bg-cream-200/60 rounded-sm">
                          <button
                            type="button"
                            onClick={() => setSelectedSlot(leftPageNum.toString())}
                            className={`flex-1 py-1.5 text-[11px] font-semibold rounded-xs transition-all ${
                              targetedPageNum === leftPageNum && !isCurrentPanoramic
                                ? 'bg-white text-noir-950 shadow-xs font-bold'
                                : 'text-noir-600 hover:text-noir-900'
                            }`}
                          >
                            Left Page ({leftPageNum})
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedSlot(rightPageNum.toString())}
                            className={`flex-1 py-1.5 text-[11px] font-semibold rounded-xs transition-all ${
                              targetedPageNum === rightPageNum && !isCurrentPanoramic
                                ? 'bg-white text-noir-950 shadow-xs font-bold'
                                : 'text-noir-600 hover:text-noir-900'
                            }`}
                          >
                            Right Page ({rightPageNum})
                          </button>
                        </div>
                      </div>

                      {/* Categorized Layout Groups */}
                      <div className="space-y-4">
                        {layoutCategories.map((cat) => (
                          <div key={cat.title} className="space-y-1.5">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-noir-600 block">
                              {cat.title}
                            </span>
                            <div className="grid grid-cols-1 gap-2">
                              {cat.options.map((opt) => {
                                const isSelected =
                                  opt.id === '2-page-panoramic'
                                    ? isCurrentPanoramic
                                    : !isCurrentPanoramic && currentLayout === opt.id;

                                return (
                                  <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => handleSelectLayout(opt.id)}
                                    className={`p-2.5 rounded-sm border text-left flex items-center justify-between gap-3 transition-all ${
                                      isSelected
                                        ? 'bg-amber-50/90 border-foil-gold ring-1 ring-foil-gold shadow-xs'
                                        : 'bg-white border-cream-300 hover:border-noir-900'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      {/* Visual Miniature Layout Thumbnail */}
                                      <div className="shrink-0">
                                        {opt.id === '1-photo' && (
                                          <div className="w-10 h-7 bg-cream-100 border border-cream-300 rounded-[2px] p-1 flex items-center justify-center">
                                            <div className="w-6 h-4 bg-noir-800 rounded-[1px]" />
                                          </div>
                                        )}
                                        {opt.id === '1-photo-full' && (
                                          <div className="w-10 h-7 bg-noir-800 border border-cream-300 rounded-[2px]" />
                                        )}
                                        {opt.id === '2-page-panoramic' && (
                                          <div className="w-14 h-7 bg-cream-100 border border-cream-300 rounded-[2px] relative overflow-hidden flex items-center justify-center p-0.5">
                                            <div className="w-full h-full bg-noir-800 rounded-[1px]" />
                                            <div className="absolute inset-y-0 left-1/2 w-[1px] border-r border-dashed border-white/80" />
                                          </div>
                                        )}
                                        {opt.id === '2-photo-v' && (
                                          <div className="w-10 h-7 bg-cream-100 border border-cream-300 rounded-[2px] p-0.5 flex flex-col gap-0.5">
                                            <div className="flex-1 bg-noir-800 rounded-[1px]" />
                                            <div className="flex-1 bg-noir-800 rounded-[1px]" />
                                          </div>
                                        )}
                                        {opt.id === '2-photo-h' && (
                                          <div className="w-10 h-7 bg-cream-100 border border-cream-300 rounded-[2px] p-0.5 flex gap-0.5">
                                            <div className="flex-1 bg-noir-800 rounded-[1px]" />
                                            <div className="flex-1 bg-noir-800 rounded-[1px]" />
                                          </div>
                                        )}
                                        {opt.id === '3-photo' && (
                                          <div className="w-10 h-7 bg-cream-100 border border-cream-300 rounded-[2px] p-0.5 flex gap-0.5">
                                            <div className="w-1/2 bg-noir-800 rounded-[1px]" />
                                            <div className="w-1/2 flex flex-col gap-0.5">
                                              <div className="flex-1 bg-noir-800 rounded-[1px]" />
                                              <div className="flex-1 bg-noir-800 rounded-[1px]" />
                                            </div>
                                          </div>
                                        )}
                                        {opt.id === '4-photo' && (
                                          <div className="w-10 h-7 bg-cream-100 border border-cream-300 rounded-[2px] p-0.5 grid grid-cols-2 grid-rows-2 gap-0.5">
                                            <div className="bg-noir-800 rounded-[1px]" />
                                            <div className="bg-noir-800 rounded-[1px]" />
                                            <div className="bg-noir-800 rounded-[1px]" />
                                            <div className="bg-noir-800 rounded-[1px]" />
                                          </div>
                                        )}
                                        {opt.id === '6-photo-grid' && (
                                          <div className="w-10 h-7 bg-cream-100 border border-cream-300 rounded-[2px] p-0.5 grid grid-cols-3 grid-rows-2 gap-0.5">
                                            <div className="bg-noir-800 rounded-[1px]" />
                                            <div className="bg-noir-800 rounded-[1px]" />
                                            <div className="bg-noir-800 rounded-[1px]" />
                                            <div className="bg-noir-800 rounded-[1px]" />
                                            <div className="bg-noir-800 rounded-[1px]" />
                                            <div className="bg-noir-800 rounded-[1px]" />
                                          </div>
                                        )}
                                      </div>

                                      <div className="flex flex-col">
                                        <span className="font-serif text-xs font-bold text-noir-950">
                                          {opt.label}
                                        </span>
                                        <span className="text-[10px] text-noir-500 leading-tight">
                                          {opt.iconDesc}
                                        </span>
                                      </div>
                                    </div>

                                    {isSelected && (
                                      <Check size={14} className="text-foil-gold stroke-[3] shrink-0" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* PANEL 2: COVER FOIL & TYPOGRAPHY */}
              {panel === 'Cover' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-noir-600 block mb-1">
                      Foil Finish
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {foilOptions.map((foil) => {
                        const isSelected = (coverConfig.foilColor || 'gold') === foil.id;
                        return (
                          <button
                            key={foil.id}
                            onClick={() => {
                              updateCoverConfig({ foilColor: foil.id });
                              trackEvent('editor_action', `Selected Foil: ${foil.name}`, {
                                foilColor: foil.id,
                              });
                            }}
                            className={`p-2 rounded-sm border text-xs font-medium flex items-center gap-2 transition-all ${
                              isSelected
                                ? 'border-foil-gold bg-amber-50/70 ring-1 ring-foil-gold'
                                : 'border-cream-300 bg-white hover:border-noir-900'
                            }`}
                          >
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0"
                              style={{ backgroundColor: foil.color }}
                            />
                            <span className="text-[11px] text-noir-900 truncate">{foil.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-noir-600 block mb-1">
                      Cover Title
                    </label>
                    <input
                      type="text"
                      value={coverConfig.title}
                      onChange={(e) => updateCoverConfig({ title: e.target.value })}
                      placeholder={template?.displayName || 'PERFECTPIC'}
                      className="w-full border border-cream-300 px-3 py-2 text-xs rounded-sm bg-white text-noir-950 font-serif focus:outline-none focus:border-noir-950"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-noir-600 block mb-1">
                      Cover Subtitle / Date
                    </label>
                    <input
                      type="text"
                      value={coverConfig.subtitle}
                      onChange={(e) => updateCoverConfig({ subtitle: e.target.value })}
                      placeholder="Keepsake Edition 2026"
                      className="w-full border border-cream-300 px-3 py-2 text-xs rounded-sm bg-white text-noir-950 focus:outline-none focus:border-noir-950"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-noir-600 block mb-1">
                      Spine Lettering
                    </label>
                    <input
                      type="text"
                      value={coverConfig.spineText}
                      onChange={(e) => updateCoverConfig({ spineText: e.target.value })}
                      placeholder="PERFECTPIC"
                      className="w-full border border-cream-300 px-3 py-2 text-xs rounded-sm bg-white text-noir-950 uppercase font-mono tracking-widest focus:outline-none focus:border-noir-950"
                    />
                  </div>

                  {/* Dynamic Spine Bindery Specs Card */}
                  {(() => {
                    const metrics = getSpineMetrics(pageCount);
                    return (
                      <div className="p-3 bg-cream-50/80 border border-cream-200 rounded-sm space-y-1.5 mt-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-noir-800 uppercase tracking-wider">
                            Calculated Spine
                          </span>
                          <span className="font-mono font-bold text-noir-950 bg-amber-100/80 border border-amber-300/70 px-1.5 py-0.5 rounded text-[11px]">
                            {metrics.spineWidthMm} mm ({metrics.spineWidthInches}&quot;)
                          </span>
                        </div>
                        <p className="text-[10px] text-noir-500 leading-snug">
                          Engineered for {metrics.pageCount} pages ({metrics.sheetCount} lay-flat sheets @ 200 GSM) + 4.0mm binder board wrap.
                        </p>
                        <div className="flex items-center gap-1.5 pt-0.5 text-[10px] text-emerald-700 font-medium">
                          <Check size={11} className="stroke-[3]" />
                          <span>Embossing Depth: {metrics.recommendedFontSizePt}pt Foil Approved</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* PANEL 3: BACKGROUND COLOR */}
              {panel === 'Backgrounds' && (
                <div>
                  <div className="flex justify-between items-center mb-2.5">
                    <span className="text-[11px] font-semibold text-noir-600 uppercase tracking-wider">
                      Page {targetedPageNum} Tint
                    </span>
                    <span className="text-[10px] text-noir-400 font-mono">{currentBg}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {bgPalette.map((item) => {
                      const isSelected = currentBg === item.color;
                      return (
                        <button
                          key={item.color}
                          onClick={() => setPageBackground(targetedPageNum, item.color)}
                          className={`aspect-square rounded-sm border relative shadow-sm transition-transform hover:scale-105 flex items-center justify-center ${
                            isSelected ? 'border-foil-gold ring-2 ring-foil-gold ring-offset-1' : 'border-cream-300'
                          }`}
                          style={{ backgroundColor: item.color }}
                          title={item.name}
                        >
                          {isSelected && (
                            <Check
                              size={14}
                              className={item.color === '#141413' ? 'text-white' : 'text-foil-gold'}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
