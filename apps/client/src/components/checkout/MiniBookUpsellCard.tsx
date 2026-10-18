// apps/client/src/components/checkout/MiniBookUpsellCard.tsx
'use client';

import React from 'react';
import { BookOpen, Sparkles, Check, Heart, ShieldCheck, Gift } from 'lucide-react';
import { useCartStore } from '@/stores/useCartStore';

interface MiniBookUpsellCardProps {
  primaryItem?: any;
}

export const MiniBookUpsellCard: React.FC<MiniBookUpsellCardProps> = ({ primaryItem }) => {
  const { accessories, setMiniBookOption } = useCartStore();

  const currentOption: 'none' | 'single' | 'duo' = accessories.miniBookDuo
    ? 'duo'
    : accessories.miniBookCompanion
    ? 'single'
    : 'none';

  const coverImg = primaryItem?.thumbnail || primaryItem?.coverImage || primaryItem?.projectSnapshot?.coverImage;
  const bookTitle = primaryItem?.title || 'Heirloom Photobook';

  return (
    <section className="bg-gradient-to-br from-amber-50/50 via-white to-amber-50/30 p-6 md:p-8 rounded-sm shadow-sm border border-amber-200/80 relative overflow-hidden">
      {/* Decorative luxury ambient glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-200/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

      {/* Header with Luxury Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 relative">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-amber-100 text-amber-900 border border-amber-300">
              <Sparkles className="w-3 h-3 text-amber-600" />
              Prepress Companion Edition
            </span>
            <span className="text-xs text-noir-500 font-medium">• Zero Extra Design Effort</span>
          </div>
          <h2 className="font-serif text-2xl md:text-3xl text-noir-950 font-medium">
            Add Pocket Mini-Book Replicas (6" × 6")
          </h2>
          <p className="text-xs text-noir-600 mt-1 max-w-xl leading-relaxed">
            Prepress automatically scales down your master photobook into pocket-sized softcover editions. Perfect for grandparents, office desks, or travel keepsakes.
          </p>
        </div>

        {/* Visual Mini Mockup */}
        {coverImg && (
          <div className="relative shrink-0 flex items-center justify-center p-2">
            <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-sm overflow-hidden shadow-luxury-md border-2 border-white ring-1 ring-amber-300 group">
              <img
                src={coverImg}
                alt="Mini-Book Preview"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-noir-950/70 via-transparent to-transparent flex items-end p-1.5">
                <span className="text-[9px] font-mono font-bold text-cream-50 uppercase tracking-tighter">
                  6" × 6" Pocket
                </span>
              </div>
            </div>
            {/* Soft shadow book depth cue */}
            <div className="absolute -bottom-1 w-16 h-2 bg-noir-950/20 blur-xs rounded-full pointer-events-none" />
          </div>
        )}
      </div>

      {/* 3-Tier Option Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
        {/* Tier 1: None */}
        <div
          onClick={() => setMiniBookOption('none')}
          className={`p-4 rounded-sm border cursor-pointer transition-all flex flex-col justify-between ${
            currentOption === 'none'
              ? 'border-noir-950 bg-white ring-1 ring-noir-950 shadow-xs'
              : 'border-cream-300 bg-white/70 hover:border-cream-400 hover:bg-white'
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="font-serif text-sm font-semibold text-noir-800">
                Master Book Only
              </span>
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                  currentOption === 'none'
                    ? 'border-noir-950 bg-noir-950 text-cream-50'
                    : 'border-cream-400 bg-white'
                }`}
              >
                {currentOption === 'none' && <div className="w-1.5 h-1.5 rounded-full bg-cream-50" />}
              </div>
            </div>
            <p className="text-xs text-noir-500 leading-relaxed mb-3">
              Only print your primary heirloom photobook edition.
            </p>
          </div>
          <div className="pt-2 border-t border-cream-100 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-noir-400 font-medium">Standard</span>
            <span className="font-mono text-sm font-semibold text-noir-700">₹0</span>
          </div>
        </div>

        {/* Tier 2: 1 Mini-Book Companion */}
        <div
          onClick={() => setMiniBookOption('single')}
          className={`p-4 rounded-sm border cursor-pointer transition-all flex flex-col justify-between relative ${
            currentOption === 'single'
              ? 'border-amber-600 bg-amber-50/80 ring-2 ring-amber-500/70 shadow-sm'
              : 'border-amber-200 bg-white hover:border-amber-400 hover:bg-amber-50/30'
          }`}
        >
          {/* Top Badge */}
          <div className="absolute -top-2.5 left-4 bg-amber-700 text-cream-50 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded shadow-2xs">
            Save 40% (₹400 Off)
          </div>

          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5 pt-1">
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-amber-700" />
                <span className="font-serif text-sm font-bold text-noir-950">
                  1 Pocket Mini-Book
                </span>
              </div>
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                  currentOption === 'single'
                    ? 'border-amber-700 bg-amber-700 text-cream-50'
                    : 'border-cream-400 bg-white'
                }`}
              >
                {currentOption === 'single' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
              </div>
            </div>
            <p className="text-xs text-noir-600 leading-relaxed mb-3">
              One 6" × 6" pocket velvet softcover edition of <span className="font-medium text-noir-800 italic">{bookTitle}</span>.
            </p>
          </div>

          <div className="pt-2 border-t border-amber-200/80 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-noir-400 line-through font-mono">₹999</span>
              <span className="font-mono text-base font-bold text-noir-950">+₹599</span>
            </div>
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
              Popular Keepsake
            </span>
          </div>
        </div>

        {/* Tier 3: 2 Mini-Books (Grandparents Pack) */}
        <div
          onClick={() => setMiniBookOption('duo')}
          className={`p-4 rounded-sm border cursor-pointer transition-all flex flex-col justify-between relative ${
            currentOption === 'duo'
              ? 'border-amber-700 bg-amber-100/70 ring-2 ring-amber-600 shadow-md'
              : 'border-amber-300 bg-gradient-to-b from-amber-50/40 to-white hover:border-amber-500 hover:bg-amber-50/60'
          }`}
        >
          {/* Top Badge */}
          <div className="absolute -top-2.5 left-4 bg-gradient-to-r from-amber-800 to-amber-950 text-cream-50 text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded shadow-xs flex items-center gap-1">
            <Sparkles size={10} className="text-foil-gold" />
            <span>Best Value • Save 50%</span>
          </div>

          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5 pt-1">
              <div className="flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-rose-600 fill-rose-600/20" />
                <span className="font-serif text-sm font-bold text-noir-950">
                  2 Mini-Books (Grandparents Pack)
                </span>
              </div>
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                  currentOption === 'duo'
                    ? 'border-amber-800 bg-amber-800 text-cream-50'
                    : 'border-cream-400 bg-white'
                }`}
              >
                {currentOption === 'duo' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
              </div>
            </div>
            <p className="text-xs text-noir-600 leading-relaxed mb-3">
              Two identical 6" × 6" pocket editions. Thoughtful gift for both sides of the family.
            </p>
          </div>

          <div className="pt-2 border-t border-amber-300/80 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-noir-400 line-through font-mono">₹1,998</span>
              <span className="font-mono text-base font-bold text-noir-950">+₹999</span>
            </div>
            <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
              ₹500 / each
            </span>
          </div>
        </div>
      </div>

      {/* Prepress Trust Guarantee Footer */}
      <div className="mt-5 pt-4 border-t border-amber-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-noir-600">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>
            <strong>100% Prepress Alignment:</strong> Uses the exact verified page layout, photos, and captions from your master photobook.
          </span>
        </div>
        <span className="text-[11px] text-amber-900 font-medium shrink-0">
          📦 Ships together in the same secure parcel
        </span>
      </div>
    </section>
  );
};

export default MiniBookUpsellCard;
