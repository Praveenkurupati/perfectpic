// apps/client/src/components/common/DpdpConsentBanner.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Cookie, Sliders, ChevronDown, ChevronUp, Check } from 'lucide-react';

export interface DpdpConsentState {
  consentedAt: string;
  essential: boolean; // Always true
  analytics: boolean;
  photoProcessing: boolean;
  version: string;
}

const STORAGE_KEY = 'pp_dpdp_consent';
const CONSENT_VERSION = '1.0';

export const DpdpConsentBanner: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [analyticsConsent, setAnalyticsConsent] = useState(true);
  const [photoConsent, setPhotoConsent] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        // Show banner after brief delay for smooth entrance
        const timer = setTimeout(() => setIsOpen(true), 800);
        return () => clearTimeout(timer);
      }
    } catch {
      // LocalStorage access restricted in private mode
    }
  }, []);

  const saveConsent = (analytics: boolean, photoProcessing: boolean) => {
    const consentRecord: DpdpConsentState = {
      consentedAt: new Date().toISOString(),
      essential: true,
      analytics,
      photoProcessing,
      version: CONSENT_VERSION,
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(consentRecord));
    } catch {
      // Ignore storage errors
    }

    setIsOpen(false);
  };

  const handleAcceptAll = () => {
    saveConsent(true, true);
  };

  const handleEssentialOnly = () => {
    saveConsent(false, true);
  };

  const handleSaveCustom = () => {
    saveConsent(analyticsConsent, photoConsent);
  };

  if (!isOpen) return null;

  return (
    <aside
      role="region"
      aria-label="Privacy and Data Protection Notice"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-xl z-50 animate-fade-in"
    >
      <div className="bg-white/95 backdrop-blur-md border border-cream-300 rounded-sm shadow-2xl p-5 md:p-6 text-noir-900 font-sans">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="p-2 rounded-sm bg-cream-100 text-foil-gold shrink-0">
            <ShieldCheck className="w-5 h-5 stroke-[1.75]" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-semibold text-noir-950">
              Your Privacy & Data Protection (DPDP Act 2023)
            </h3>
            <p className="text-xs text-noir-600 mt-1 leading-relaxed">
              We respect your digital privacy. In accordance with India’s Digital Personal Data Protection Act, we only process your photographs and order details to render and print your photobooks, and use privacy-first telemetry to improve bindery workflows.
            </p>
          </div>
        </div>

        {/* Customization Details (Collapsible) */}
        {showCustomize && (
          <div className="my-4 pt-3 border-t border-cream-200 space-y-3 text-xs">
            {/* Essential */}
            <div className="flex items-center justify-between p-2.5 bg-cream-50 rounded-sm">
              <div>
                <p className="font-semibold text-noir-900 flex items-center gap-1.5">
                  <Cookie className="w-3.5 h-3.5 text-noir-500" />
                  Essential Services & Print Production
                </p>
                <p className="text-noir-500 text-[11px] mt-0.5">
                  Required for project session state, cart integrity, and commercial print compilation.
                </p>
              </div>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Mandatory
              </span>
            </div>

            {/* Photo Processing */}
            <div className="flex items-center justify-between p-2.5 bg-cream-50 rounded-sm">
              <div className="pr-4">
                <p className="font-semibold text-noir-900">High-Resolution Photo Processing</p>
                <p className="text-noir-500 text-[11px] mt-0.5">
                  Allows temporary S3 storage and automated print layout rasterization. Retained strictly according to our 30-day lifecycle rule.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={photoConsent}
                  onChange={(e) => setPhotoConsent(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-cream-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-cream-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-noir-900"></div>
              </label>
            </div>

            {/* Performance Analytics */}
            <div className="flex items-center justify-between p-2.5 bg-cream-50 rounded-sm">
              <div className="pr-4">
                <p className="font-semibold text-noir-900">Performance & Funnel Analytics</p>
                <p className="text-noir-500 text-[11px] mt-0.5">
                  Anonymized Core Web Vitals and drop-off diagnostics to optimize studio speed.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={analyticsConsent}
                  onChange={(e) => setAnalyticsConsent(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-cream-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-cream-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-noir-900"></div>
              </label>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-cream-100">
          <button
            type="button"
            onClick={() => setShowCustomize(!showCustomize)}
            className="inline-flex items-center justify-center gap-1 text-[11px] font-semibold text-noir-600 hover:text-noir-950 transition-colors py-1.5 px-2"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{showCustomize ? 'Hide Preferences' : 'Customize Preferences'}</span>
            {showCustomize ? <ChevronUp className="w-3.5 h-3.5 ml-0.5" /> : <ChevronDown className="w-3.5 h-3.5 ml-0.5" />}
          </button>

          <div className="flex items-center gap-2">
            {showCustomize ? (
              <button
                type="button"
                onClick={handleSaveCustom}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-noir-950 text-cream-50 text-xs font-semibold rounded-sm hover:bg-noir-900 transition-colors shadow-sm"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Preferences</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleEssentialOnly}
                  className="flex-1 sm:flex-initial px-3.5 py-2 text-xs font-medium text-noir-700 bg-cream-100 hover:bg-cream-200 rounded-sm transition-colors"
                >
                  Essential Only
                </button>
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="flex-1 sm:flex-initial px-4 py-2 text-xs font-semibold text-cream-50 bg-noir-950 hover:bg-noir-900 rounded-sm transition-colors shadow-sm"
                >
                  Accept All
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default DpdpConsentBanner;
