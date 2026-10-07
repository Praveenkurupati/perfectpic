// apps/client/src/components/checkout/DeliveryMethodStep.tsx
'use client';

import React from 'react';
import { Truck, Zap } from 'lucide-react';

interface DeliveryMethodStepProps {
  selectedOption: 'standard' | 'express';
  onChange: (option: 'standard' | 'express') => void;
}

export const DeliveryMethodStep: React.FC<DeliveryMethodStepProps> = ({
  selectedOption,
  onChange,
}) => {
  // Compute estimated delivery windows
  const now = new Date();
  const formatDayMonth = (d: Date) =>
    d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });

  const stdStart = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
  const stdEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const expStart = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  const expEnd = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  return (
    <section className="bg-white p-8 rounded-sm shadow-sm border border-cream-200">
      <h2 className="font-serif text-2xl flex items-center gap-2 mb-6 text-noir-900">
        <Truck className="w-5 h-5 text-noir-700" />
        <span>Shipping Speed</span>
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Standard Shipping */}
        <label
          onClick={() => onChange('standard')}
          className={`flex items-start gap-4 p-5 rounded-sm border cursor-pointer transition-all ${
            selectedOption === 'standard'
              ? 'border-noir-950 bg-cream-50/70 ring-1 ring-noir-950'
              : 'border-cream-200 hover:border-cream-300'
          }`}
        >
          <input
            type="radio"
            name="deliveryOption"
            checked={selectedOption === 'standard'}
            onChange={() => onChange('standard')}
            className="mt-1 accent-noir-950"
          />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-sm text-noir-900">Standard Delivery</span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                FREE
              </span>
            </div>
            <p className="text-xs text-noir-500 mb-2">
              Est. Arrival: {formatDayMonth(stdStart)} – {formatDayMonth(stdEnd)}
            </p>
            <p className="text-[11px] text-noir-600 leading-relaxed">
              Standard secure courier shipping with full tracking link via SMS & email.
            </p>
          </div>
        </label>

        {/* Express Priority Shipping */}
        <label
          onClick={() => onChange('express')}
          className={`flex items-start gap-4 p-5 rounded-sm border cursor-pointer transition-all ${
            selectedOption === 'express'
              ? 'border-noir-950 bg-cream-50/70 ring-1 ring-noir-950'
              : 'border-cream-200 hover:border-cream-300'
          }`}
        >
          <input
            type="radio"
            name="deliveryOption"
            checked={selectedOption === 'express'}
            onChange={() => onChange('express')}
            className="mt-1 accent-noir-950"
          />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-sm text-noir-900 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>Express Priority</span>
              </span>
              <span className="text-xs font-bold text-noir-900 font-mono">₹299</span>
            </div>
            <p className="text-xs text-noir-500 mb-2">
              Est. Arrival: {formatDayMonth(expStart)} – {formatDayMonth(expEnd)}
            </p>
            <p className="text-[11px] text-noir-600 leading-relaxed">
              Expedited bindery production queue & Air Express priority courier delivery.
            </p>
          </div>
        </label>
      </div>
    </section>
  );
};

export default DeliveryMethodStep;
