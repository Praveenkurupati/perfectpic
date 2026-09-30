// apps/client/src/features/checkout/components/PackagingUpsellModal.tsx
'use client';

import React from 'react';
import { 
  X, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Gift, 
  Image as ImageIcon, 
  ArrowRight,
  ChevronRight
} from 'lucide-react';
import { 
  useCartStore, 
  PackagingAccessories, 
  ACCESSORY_DETAILS, 
  ACCESSORY_PRICES 
} from '@/stores/useCartStore';

interface PackagingUpsellModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: () => void;
}

export default function PackagingUpsellModal({
  isOpen,
  onClose,
  onProceed,
}: PackagingUpsellModalProps) {
  const { accessories, toggleAccessory, getAccessoriesTotal } = useCartStore();

  if (!isOpen) return null;

  const accessoriesTotal = getAccessoriesTotal();
  const selectedCount = Object.values(accessories).filter(Boolean).length;

  const options: Array<{
    key: keyof PackagingAccessories;
    title: string;
    price: number;
    badge: string;
    description: string;
    visual: React.ReactNode;
  }> = [
    {
      key: 'keepsakeBox',
      title: ACCESSORY_DETAILS.keepsakeBox.title,
      price: ACCESSORY_PRICES.keepsakeBox,
      badge: 'Bestseller (82% Add This)',
      description: 'Luxury custom-fitted rigid presentation box with gold foil insignia and magnetic ribbon closure.',
      visual: (
        <div className="w-12 h-12 rounded-sm bg-gradient-to-br from-amber-900/20 via-neutral-900/30 to-amber-950/40 border border-foil-gold/40 flex items-center justify-center shrink-0 shadow-inner">
          <Gift className="w-6 h-6 text-foil-gold" />
        </div>
      ),
    },
    {
      key: 'uvGlaze',
      title: ACCESSORY_DETAILS.uvGlaze.title,
      price: ACCESSORY_PRICES.uvGlaze,
      badge: 'Archival Essential',
      description: 'Diamond clear micro-coating protecting every page against fingerprints, moisture spills, and UV fading.',
      visual: (
        <div className="w-12 h-12 rounded-sm bg-gradient-to-br from-emerald-900/20 via-teal-900/30 to-emerald-950/40 border border-emerald-500/40 flex items-center justify-center shrink-0 shadow-inner">
          <ShieldCheck className="w-6 h-6 text-emerald-600" />
        </div>
      ),
    },
    {
      key: 'giftWrap',
      title: ACCESSORY_DETAILS.giftWrap.title,
      price: ACCESSORY_PRICES.giftWrap,
      badge: 'Gift Ready',
      description: 'Emerald green satin ribbon wrap with personalized calligraphy note. All price invoices removed.',
      visual: (
        <div className="w-12 h-12 rounded-sm bg-gradient-to-br from-rose-900/20 via-pink-900/30 to-rose-950/40 border border-rose-400/40 flex items-center justify-center shrink-0 shadow-inner">
          <Sparkles className="w-6 h-6 text-rose-500" />
        </div>
      ),
    },
    {
      key: 'miniPolaroids',
      title: ACCESSORY_DETAILS.miniPolaroids.title,
      price: ACCESSORY_PRICES.miniPolaroids,
      badge: 'Pocket Keepsakes',
      description: 'Set of 10 retro square 2×3" mini prints printed on thick 300 GSM archival cotton cardstock.',
      visual: (
        <div className="w-12 h-12 rounded-sm bg-gradient-to-br from-indigo-900/20 via-blue-900/30 to-indigo-950/40 border border-indigo-400/40 flex items-center justify-center shrink-0 shadow-inner">
          <ImageIcon className="w-6 h-6 text-indigo-500" />
        </div>
      ),
    },
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-noir-950/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-sm border border-cream-200 shadow-luxury-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-cream-200 flex items-start justify-between bg-gradient-to-b from-cream-50/80 to-white">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-amber-100 text-amber-900 border border-amber-300">
                Bindery Concierge
              </span>
              <span className="text-xs text-noir-500">• Heirloom Upgrades</span>
            </div>
            <h2 className="font-serif text-2xl text-noir-950 font-medium">
              Elevate Your Photobook Keepsake
            </h2>
            <p className="text-xs text-noir-600 mt-1">
              Select archival presentation packaging and protective finishes before confirming your print run.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-cream-100 text-noir-400 hover:text-noir-900 transition-colors"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Options List */}
        <div className="p-6 space-y-3 overflow-y-auto flex-1">
          {options.map((opt) => {
            const isSelected = !!accessories[opt.key];
            return (
              <div
                key={opt.key}
                onClick={() => toggleAccessory(opt.key)}
                className={`p-3.5 rounded-sm border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'border-foil-gold bg-amber-50/60 shadow-sm ring-1 ring-foil-gold'
                    : 'border-cream-300 bg-white hover:border-noir-400 hover:bg-cream-50/40'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  {opt.visual}
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-serif text-sm font-semibold text-noir-950">
                        {opt.title}
                      </span>
                      <span className="text-[9.5px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-cream-100 text-noir-700 border border-cream-200">
                        {opt.badge}
                      </span>
                    </div>
                    <p className="text-xs text-noir-500 leading-snug line-clamp-2">
                      {opt.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="font-serif text-sm font-bold text-noir-950 block">
                      +₹{opt.price}
                    </span>
                    <span className="text-[10px] text-noir-400 uppercase tracking-wider block">
                      one-time
                    </span>
                  </div>

                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                      isSelected
                        ? 'bg-noir-950 border-noir-950 text-cream-50'
                        : 'border-cream-300 bg-white'
                    }`}
                  >
                    {isSelected && <Check size={12} className="stroke-[3]" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-cream-200 bg-cream-50/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-center sm:text-left">
            <span className="text-xs text-noir-500 block">
              {selectedCount > 0 
                ? `${selectedCount} upgrade${selectedCount > 1 ? 's' : ''} selected` 
                : 'No add-ons selected'}
            </span>
            <span className="font-serif text-base font-bold text-noir-950">
              {accessoriesTotal > 0 ? `+₹${accessoriesTotal.toLocaleString('en-IN')}` : 'Standard Presentation (Included)'}
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onProceed}
              className="flex-1 sm:flex-none text-xs text-noir-600 hover:text-noir-950 font-medium px-3 py-2.5 transition-colors underline-offset-4 hover:underline"
            >
              Skip Upgrades
            </button>

            <button
              onClick={onProceed}
              className="flex-1 sm:flex-none bg-noir-950 text-cream-50 px-5 py-3 rounded-sm text-xs font-semibold tracking-widest uppercase hover:bg-noir-900 transition-all flex items-center justify-center gap-2 shadow-luxury-sm"
            >
              <span>{selectedCount > 0 ? 'Add & Continue' : 'Continue to Payment'}</span>
              <ArrowRight size={14} className="text-foil-gold" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
