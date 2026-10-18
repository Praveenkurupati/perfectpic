// apps/client/src/components/checkout/DeliveryMethodStep.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Truck, Zap, Clock, ShieldCheck, Sparkles } from 'lucide-react';

export type DeliveryOptionType = 'standard' | 'express' | 'rush';

interface DeliveryMethodStepProps {
  selectedOption: DeliveryOptionType;
  onChange: (option: DeliveryOptionType) => void;
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
  const rushStart = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
  const rushEnd = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

  // Live countdown timer to 3:00 PM daily dispatch cutoff
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    dispatchDateStr: string;
  }>({ hours: 0, minutes: 0, seconds: 0, dispatchDateStr: '' });

  useEffect(() => {
    const updateCountdown = () => {
      const current = new Date();
      const cutoff = new Date();
      cutoff.setHours(15, 0, 0, 0);

      const targetDispatch = new Date();
      if (current.getTime() >= cutoff.getTime()) {
        cutoff.setDate(cutoff.getDate() + 1);
        targetDispatch.setDate(targetDispatch.getDate() + 2);
      } else {
        targetDispatch.setDate(targetDispatch.getDate() + 1);
      }

      const diffMs = Math.max(0, cutoff.getTime() - current.getTime());
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      const dispatchDateStr = targetDispatch.toLocaleDateString('en-IN', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });

      setTimeLeft({ hours, minutes, seconds, dispatchDateStr });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="bg-white p-6 sm:p-8 rounded-sm shadow-sm border border-cream-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <h2 className="font-serif text-2xl flex items-center gap-2 text-noir-900">
            <Truck className="w-5 h-5 text-noir-700" />
            <span>Shipping & Production Speed</span>
          </h2>
          <p className="text-xs text-noir-500 mt-1">
            Choose standard complimentary delivery or upgrade to 24-hour priority dispatch.
          </p>
        </div>

        {/* Rush SLA Badge Highlight */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-900 rounded-full text-xs font-medium self-start sm:self-auto">
          <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500 animate-pulse" />
          <span>Need it urgently? 24H Rush Available</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Option 1: Standard Shipping */}
        <label
          onClick={() => onChange('standard')}
          className={`flex flex-col justify-between p-5 rounded-sm border cursor-pointer transition-all relative ${
            selectedOption === 'standard'
              ? 'border-noir-950 bg-cream-50/70 ring-1 ring-noir-950 shadow-sm'
              : 'border-cream-200 hover:border-cream-300 bg-white'
          }`}
        >
          <div>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="deliveryOption"
                  checked={selectedOption === 'standard'}
                  onChange={() => onChange('standard')}
                  className="accent-noir-950 cursor-pointer"
                />
                <span className="font-semibold text-sm text-noir-900">Standard</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                FREE
              </span>
            </div>

            <p className="text-xs font-medium text-noir-700 mb-1">
              Est. Arrival: {formatDayMonth(stdStart)} – {formatDayMonth(stdEnd)}
            </p>
            <p className="text-[11px] text-noir-500 leading-relaxed mb-3">
              Standard secure surface courier with end-to-end tracking link via SMS & email.
            </p>
          </div>

          <div className="pt-3 border-t border-cream-100 text-[10px] text-noir-500 space-y-1">
            <div>• 3–4 days bindery production</div>
            <div>• All-India surface network</div>
          </div>
        </label>

        {/* Option 2: Express Priority */}
        <label
          onClick={() => onChange('express')}
          className={`flex flex-col justify-between p-5 rounded-sm border cursor-pointer transition-all relative ${
            selectedOption === 'express'
              ? 'border-noir-950 bg-cream-50/70 ring-1 ring-noir-950 shadow-sm'
              : 'border-cream-200 hover:border-cream-300 bg-white'
          }`}
        >
          <div>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="deliveryOption"
                  checked={selectedOption === 'express'}
                  onChange={() => onChange('express')}
                  className="accent-noir-950 cursor-pointer"
                />
                <span className="font-semibold text-sm text-noir-900 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>Express Air</span>
                </span>
              </div>
              <span className="text-xs font-bold text-noir-900 font-mono">₹299</span>
            </div>

            <p className="text-xs font-medium text-noir-700 mb-1">
              Est. Arrival: {formatDayMonth(expStart)} – {formatDayMonth(expEnd)}
            </p>
            <p className="text-[11px] text-noir-500 leading-relaxed mb-3">
              Expedited bindery queue & priority Air Express courier dispatch.
            </p>
          </div>

          <div className="pt-3 border-t border-cream-100 text-[10px] text-noir-500 space-y-1">
            <div>• 2 days bindery processing</div>
            <div>• Domestic Air Cargo express</div>
          </div>
        </label>

        {/* Option 3: ⚡ Rush Production (24-Hour Dispatch Guarantee) */}
        <label
          onClick={() => onChange('rush')}
          className={`flex flex-col justify-between p-5 rounded-sm border-2 cursor-pointer transition-all relative overflow-hidden ${
            selectedOption === 'rush'
              ? 'border-amber-600 bg-amber-50/40 ring-1 ring-amber-600 shadow-md'
              : 'border-amber-300 hover:border-amber-500 bg-gradient-to-b from-amber-50/20 to-white'
          }`}
        >
          {/* Top Banner Badge */}
          <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-bl shadow-sm flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5" />
            <span>24H Guarantee</span>
          </div>

          <div>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="deliveryOption"
                  checked={selectedOption === 'rush'}
                  onChange={() => onChange('rush')}
                  className="accent-amber-600 cursor-pointer"
                />
                <span className="font-semibold text-sm text-noir-950 flex items-center gap-1 text-amber-950">
                  <Zap className="w-4 h-4 text-amber-600 fill-amber-500 animate-bounce" />
                  <span>Rush 24H</span>
                </span>
              </div>
              <span className="text-xs font-bold text-amber-950 font-mono">₹499</span>
            </div>

            <div className="mb-2">
              <span className="inline-block text-[10px] font-bold tracking-wider uppercase text-amber-800 bg-amber-100/80 px-1.5 py-0.5 rounded">
                ⚡ Dispatches by {timeLeft.dispatchDateStr || 'Tomorrow'}
              </span>
            </div>

            <p className="text-xs font-medium text-noir-900 mb-1">
              Est. Arrival: {formatDayMonth(rushStart)} – {formatDayMonth(rushEnd)}
            </p>
            <p className="text-[11px] text-noir-600 leading-relaxed mb-3">
              Jumps directly to front of HP Indigo queue. Hand-crafted & dispatched within 24 business hours.
            </p>
          </div>

          {/* Countdown & SLA Bullet Points */}
          <div>
            {/* Live Cutoff Countdown Timer */}
            <div className="bg-amber-100/60 border border-amber-200/80 rounded px-2.5 py-1.5 mb-2.5 flex items-center gap-2 text-amber-900">
              <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <div className="text-[11px] leading-tight">
                Order within{' '}
                <span className="font-mono font-bold text-amber-950">
                  {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
                </span>{' '}
                for tomorrow&apos;s dispatch
              </div>
            </div>

            <div className="pt-2 border-t border-amber-200/60 text-[10px] text-amber-900 space-y-1">
              <div className="flex items-center gap-1 font-medium">
                <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>Priority 1 Queue Jump & BlueDart Air</span>
              </div>
              <div className="text-noir-500">100% On-time guarantee or ₹499 fee refunded</div>
            </div>
          </div>
        </label>
      </div>
    </section>
  );
};

export default DeliveryMethodStep;
