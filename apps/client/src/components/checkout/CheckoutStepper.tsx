// apps/client/src/components/checkout/CheckoutStepper.tsx
'use client';

import React from 'react';
import { Check, ShieldCheck } from 'lucide-react';

interface CheckoutStepperProps {
  currentStep?: number;
}

export const CheckoutStepper: React.FC<CheckoutStepperProps> = ({ currentStep = 2 }) => {
  const steps = [
    { number: 1, title: 'Photobook Cart' },
    { number: 2, title: 'Shipping & Delivery' },
    { number: 3, title: 'Payment & Receipt' },
  ];

  return (
    <div className="flex items-baseline justify-between mb-8 flex-wrap gap-4">
      <div>
        <div className="flex items-center gap-2 mb-2">
          {steps.map((s, idx) => {
            const isCompleted = s.number < currentStep;
            const isCurrent = s.number === currentStep;

            return (
              <React.Fragment key={s.number}>
                <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                      isCompleted
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-noir-950 text-cream-50'
                        : 'bg-cream-200 text-noir-500'
                    }`}
                  >
                    {isCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : s.number}
                  </span>
                  <span className={isCurrent ? 'text-noir-900 font-bold' : 'text-noir-500'}>
                    {s.title}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <span className="text-cream-300 font-light mx-1">•</span>
                )}
              </React.Fragment>
            );
          })}
        </div>
        <h1 className="font-serif text-4xl text-noir-950">Secure Checkout</h1>
      </div>

      <div className="flex items-center gap-3 text-xs text-noir-600 bg-white px-3.5 py-2 rounded-sm border border-cream-200 shadow-xs">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>256-Bit SSL Encrypted • 100% Archival Print Guarantee</span>
      </div>
    </div>
  );
};

export default CheckoutStepper;
