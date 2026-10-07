// apps/client/src/components/checkout/PaymentStep.tsx
'use client';

import React from 'react';
import { CreditCard, Lock, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface PaymentStepProps {
  finalTotal: number;
  isSubmitting: boolean;
  submissionStep?: string;
  onSubmit: (e: React.FormEvent) => void;
}

export const PaymentStep: React.FC<PaymentStepProps> = ({
  finalTotal,
  isSubmitting,
  submissionStep,
  onSubmit,
}) => {
  return (
    <section className="bg-white p-8 rounded-sm shadow-sm border border-cream-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-2xl flex items-center gap-2 text-noir-900">
          <CreditCard className="w-5 h-5 text-noir-700" />
          <span>Payment Gateway</span>
        </h2>
        <span className="flex items-center gap-1 text-xs text-emerald-700 font-medium">
          <Lock className="w-3.5 h-3.5" />
          Bank-Grade Security
        </span>
      </div>

      <div className="space-y-4 mb-8">
        {/* Razorpay Unified Option */}
        <div className="p-5 rounded-sm border border-noir-950 bg-cream-50/70 ring-1 ring-noir-950">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="paymentMethod"
                defaultChecked
                className="accent-noir-950"
              />
              <div>
                <span className="font-semibold text-sm text-noir-900 block">
                  Razorpay Secure Gateway
                </span>
                <span className="text-xs text-noir-500">
                  Instant UPI (GPay, PhonePe, Paytm), Credit/Debit Cards, EMI & NetBanking
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
              Zero Surcharge
            </span>
          </div>

          <div className="flex items-center gap-2 pt-3 border-t border-cream-200 flex-wrap text-[11px] text-noir-600">
            <span className="px-2 py-1 bg-white border border-cream-200 rounded text-noir-800 font-mono">
              UPI
            </span>
            <span className="px-2 py-1 bg-white border border-cream-200 rounded text-noir-800 font-mono">
              Visa
            </span>
            <span className="px-2 py-1 bg-white border border-cream-200 rounded text-noir-800 font-mono">
              Mastercard
            </span>
            <span className="px-2 py-1 bg-white border border-cream-200 rounded text-noir-800 font-mono">
              RuPay
            </span>
            <span className="px-2 py-1 bg-white border border-cream-200 rounded text-noir-800 font-mono">
              NetBanking (50+ Banks)
            </span>
          </div>
        </div>
      </div>

      {/* Submit Order Action */}
      <div className="pt-4 border-t border-cream-200">
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="w-full bg-noir-950 text-cream-50 py-4 px-6 rounded-sm font-semibold tracking-wider uppercase text-sm hover:bg-noir-900 transition-all duration-200 shadow-luxury-md flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-cream-50/20 border-t-cream-50 rounded-full animate-spin" />
              <span>{submissionStep || 'Processing Order...'}</span>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <span>Pay & Confirm Order</span>
              <span className="font-mono text-base font-bold text-foil-gold">
                ₹{finalTotal.toLocaleString('en-IN')}
              </span>
            </div>
          )}
        </button>

        <div className="flex items-center justify-center gap-6 mt-4 text-[11px] text-noir-500">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            100% Reprints Guarantee
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Authoritative Server Verified
          </span>
        </div>
      </div>
    </section>
  );
};

export default PaymentStep;
