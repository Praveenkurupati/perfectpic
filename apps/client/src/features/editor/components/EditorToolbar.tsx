'use client';

import { useState } from 'react';
import { useEditorStore, PageLayout } from '@/stores/useEditorStore';
import { LayoutGrid, Sparkles, Type, Palette, Check } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';

const panels = ['Layouts', 'Cover', 'Backgrounds'] as const;

export default function EditorToolbar() {
  const [activePanel, setActivePanel] = useState<string>('Layouts');

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

  const layoutOptions: { id: PageLayout; label: string; iconDesc: string }[] = [
    { id: '1-photo', label: '1 Photo', iconDesc: 'Gallery single' },
    { id: '2-photo-v', label: '2 Photos', iconDesc: 'Stacked vertical' },
    { id: '2-photo-h', label: '2 Photos', iconDesc: 'Side by side' },
    { id: '3-photo', label: '3 Photos', iconDesc: 'Featured + 2 small' },
    { id: '4-photo', label: '4 Photos', iconDesc: '2×2 Grid collage' },
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

  return (
    <div className="flex flex-col h-full bg-white select-none">
      {/* Targeted Page / Context Indicator */}
      <div className="p-3 bg-cream-100/70 border-b border-cream-200 text-xs">
        <span className="text-[10px] uppercase font-bold tracking-wider text-noir-500 block mb-0.5">
          Active Customization:
        </span>
        <span className="font-serif font-semibold text-noir-900">
          {isCover ? 'Front Cover Foil & Text' : isBack ? 'Back Cover' : `Page ${targetedPageNum} (of ${pageCount})`}
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
                    <>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[11px] font-semibold text-noir-600 uppercase tracking-wider">
                          Target: Page {targetedPageNum}
                        </span>
                        <span className="text-[10px] text-foil-gold font-mono">
                          {currentLayout.toUpperCase()}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2.5">
                        {layoutOptions.map((opt) => {
                          const isSelected = currentLayout === opt.id;
                          return (
                            <button
                              key={opt.id}
                              onClick={() => {
                                setPageLayout(targetedPageNum, opt.id);
                                trackEvent('editor_action', `Selected Layout: ${opt.label}`, {
                                  layout: opt.id,
                                  page: targetedPageNum,
                                });
                              }}
                              className={`p-3 rounded-sm border text-left flex flex-col justify-between transition-all ${
                                isSelected
                                  ? 'bg-amber-50/80 border-foil-gold ring-1 ring-foil-gold shadow-sm'
                                  : 'bg-white border-cream-300 hover:border-noir-900'
                              }`}
                            >
                              <div className="flex items-center justify-between w-full mb-1">
                                <span className="font-serif text-xs font-bold text-noir-950">{opt.label}</span>
                                {isSelected && <Check size={12} className="text-foil-gold stroke-[3]" />}
                              </div>
                              <span className="text-[10px] text-noir-500 leading-tight">{opt.iconDesc}</span>
                            </button>
                          );
                        })}
                      </div>
                    </>
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
