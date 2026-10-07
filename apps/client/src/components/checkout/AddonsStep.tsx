// apps/client/src/components/checkout/AddonsStep.tsx
'use client';

import React from 'react';
import { Sparkles, Check } from 'lucide-react';
import {
  useCartStore,
  ACCESSORY_DETAILS,
  PackagingAccessories,
} from '@/stores/useCartStore';

export const AddonsStep: React.FC = () => {
  const { accessories, toggleAccessory } = useCartStore();

  const options: Array<keyof PackagingAccessories> = [
    'keepsakeBox',
    'giftWrap',
    'uvGlaze',
    'miniPolaroids',
  ];

  return (
    <section className="bg-white p-8 rounded-sm shadow-sm border border-cream-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-serif text-2xl flex items-center gap-2 text-noir-900">
            <Sparkles className="w-5 h-5 text-amber-600" />
            <span>Luxury Packaging & Keepsake Add-ons</span>
          </h2>
          <p className="text-xs text-noir-500 mt-1">
            Elevate your heirloom photobook into an unforgettable presentation.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {options.map((key) => {
          const item = ACCESSORY_DETAILS[key];
          const isSelected = accessories[key];

          return (
            <div
              key={key}
              onClick={() => toggleAccessory(key)}
              className={`p-4 rounded-sm border cursor-pointer transition-all flex flex-col justify-between ${
                isSelected
                  ? 'border-noir-950 bg-cream-50/70 ring-1 ring-noir-950'
                  : 'border-cream-200 hover:border-cream-300 bg-white'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{item.icon}</span>
                    <span className="font-serif font-semibold text-sm text-noir-900 leading-snug">
                      {item.title}
                    </span>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-sm border flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-noir-950 border-noir-950 text-cream-50'
                        : 'border-cream-300 bg-white'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>

                <p className="text-xs text-noir-600 leading-relaxed mb-3">
                  {item.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-cream-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {item.badge}
                </span>
                <span className="font-mono text-sm font-bold text-noir-900">
                  +₹{item.price}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default AddonsStep;
