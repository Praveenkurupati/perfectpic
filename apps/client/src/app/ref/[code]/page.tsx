// apps/client/src/app/ref/[code]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getApiBaseUrl } from '@/lib/urls';
import { Sparkles, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function CreatorReferralPage() {
  const params = useParams();
  const router = useRouter();
  const rawCode = (params?.code as string) || '';
  const code = rawCode.trim().toUpperCase();

  const [status, setStatus] = useState<'loading' | 'success' | 'redirecting'>('loading');

  useEffect(() => {
    if (!code) {
      router.push('/templates');
      return;
    }

    // 1. Store referral code locally
    try {
      localStorage.setItem('pp_ref_code', code);
      localStorage.setItem('pp_applied_promo', code);
    } catch {
      // ignore
    }

    // 2. Track referral click on backend
    fetch(`${getApiBaseUrl()}/api/v1/promos/ref-click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
      keepalive: true,
    }).catch(() => {});

    setStatus('success');

    // 3. Auto-redirect to templates after 1.8 seconds
    const timer = setTimeout(() => {
      setStatus('redirecting');
      router.push(`/templates?ref=${encodeURIComponent(code)}`);
    }, 1800);

    return () => clearTimeout(timer);
  }, [code, router]);

  return (
    <div className="min-h-screen bg-noir-950 flex flex-col items-center justify-center p-6 text-cream-50 font-sans relative overflow-hidden">
      {/* Decorative gradient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/10 to-pink-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-md w-full bg-noir-900/90 border border-white/10 rounded-2xl p-8 text-center shadow-2xl backdrop-blur-xl">
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500 mx-auto flex items-center justify-center mb-6 shadow-lg shadow-pink-500/20">
          <Sparkles className="w-8 h-8 text-white animate-pulse" />
        </div>

        <span className="text-[11px] font-mono tracking-widest uppercase text-foil-gold border border-foil-gold/30 px-3 py-1 rounded-full bg-foil-gold/5">
          Creator Partner VIP Access
        </span>

        <h1 className="text-2xl md:text-3xl font-serif font-bold text-white mt-4 mb-2">
          Special Invitation Unlocked
        </h1>

        <p className="text-sm text-cream-300 mb-6 leading-relaxed">
          Exclusive discount voucher <strong className="text-white font-mono bg-white/10 px-2 py-0.5 rounded">{code}</strong> has been secured for your custom photobook.
        </p>

        <div className="flex items-center justify-center gap-2 text-xs text-cream-400 font-mono mb-6">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
          <span>Applying discount & entering studio...</span>
        </div>

        <Link
          href={`/templates?ref=${encodeURIComponent(code)}`}
          className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white font-semibold text-sm shadow-lg shadow-purple-500/25 transition-all hover:scale-[1.02]"
        >
          <span>Explore Collections</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="mt-8 text-center text-xs text-cream-500 font-mono tracking-wider">
        PERFECTPIC ARCHIVAL EDITIONS • LIFETIME LAY-FLAT BINDING
      </div>
    </div>
  );
}
