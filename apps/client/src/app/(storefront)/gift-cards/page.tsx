// apps/client/src/app/(storefront)/gift-cards/page.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Gift, 
  Sparkles, 
  Heart, 
  Send, 
  Calendar, 
  ShieldCheck, 
  Check, 
  Copy, 
  Printer, 
  Clock, 
  CreditCard,
  BookOpen,
  ArrowRight,
  Loader2,
  ChevronRight
} from 'lucide-react';
import api from '@/lib/api';

type GiftCardTheme = 'classic' | 'anniversary' | 'wedding' | 'baby' | 'birthday' | 'holiday';

interface ThemeConfig {
  id: GiftCardTheme;
  title: string;
  subtitle: string;
  bgGradient: string;
  accentColor: string;
  tag: string;
}

const THEMES: ThemeConfig[] = [
  {
    id: 'classic',
    title: 'The Classic Keepsake',
    subtitle: 'Timeless foil gold lettering on midnight matte',
    bgGradient: 'from-[#1C1A17] via-[#12110F] to-[#0A0A0A]',
    accentColor: '#D4AF37',
    tag: 'Bestseller',
  },
  {
    id: 'wedding',
    title: 'Wedding Blessings',
    subtitle: 'Champagne silk tones for vows and celebration',
    bgGradient: 'from-[#2A2421] via-[#1F1916] to-[#120E0C]',
    accentColor: '#E6C594',
    tag: 'Weddings',
  },
  {
    id: 'anniversary',
    title: 'Happy Anniversary',
    subtitle: 'Warm burgundy & deep rose gold warmth',
    bgGradient: 'from-[#2D151E] via-[#1F0E14] to-[#0F070A]',
    accentColor: '#F2A7B8',
    tag: 'Romance',
  },
  {
    id: 'baby',
    title: 'A Lifetime of Firsts',
    subtitle: 'Soft sage and warm ivory for tiny memories',
    bgGradient: 'from-[#1C2621] via-[#141B18] to-[#0A0E0C]',
    accentColor: '#A8D5BA',
    tag: 'Baby & Kids',
  },
  {
    id: 'birthday',
    title: 'Birthday Celebration',
    subtitle: 'Festive gold shimmer and joyful lettering',
    bgGradient: 'from-[#221C2B] via-[#17131D] to-[#0D0B10]',
    accentColor: '#D8B4E2',
    tag: 'Celebration',
  },
  {
    id: 'holiday',
    title: 'Holiday Travel & Joy',
    subtitle: 'Deep forest green and radiant gold accents',
    bgGradient: 'from-[#15231D] via-[#0E1713] to-[#080D0B]',
    accentColor: '#C5A059',
    tag: 'Festivals',
  },
];

const PRESET_AMOUNTS = [
  { value: 1000, label: '₹1,000', note: 'Contribution' },
  { value: 1999, label: '₹1,999', note: 'Standard 8.25" Book' },
  { value: 2499, label: '₹2,499', note: 'Large 10" Book' },
  { value: 5000, label: '₹5,000', note: 'Heirloom Bundle' },
];

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function GiftCardsPage() {
  const [selectedTheme, setSelectedTheme] = useState<GiftCardTheme>('classic');
  const [amount, setAmount] = useState<number>(1999);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isCustom, setIsCustom] = useState<boolean>(false);

  // Form State
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [message, setMessage] = useState('');
  const [deliveryType, setDeliveryType] = useState<'immediate' | 'scheduled'>('immediate');
  const [scheduledDate, setScheduledDate] = useState('');

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successModalData, setSuccessModalData] = useState<any | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const activeThemeConfig = THEMES.find((t) => t.id === selectedTheme) || THEMES[0]!;

  const effectiveAmount = isCustom ? Number(customAmount) || 0 : amount;

  const handleSelectPreset = (val: number) => {
    setIsCustom(false);
    setAmount(val);
    setCustomAmount('');
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsCustom(true);
    setCustomAmount(e.target.value);
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (effectiveAmount < 100) {
      setErrorMsg('Please select or enter a gift card amount of at least ₹100.');
      return;
    }
    if (!recipientName.trim()) {
      setErrorMsg('Please provide the recipient’s full name.');
      return;
    }
    if (!recipientEmail.trim() || !recipientEmail.includes('@')) {
      setErrorMsg('Please provide a valid recipient email address.');
      return;
    }
    if (!senderName.trim()) {
      setErrorMsg('Please enter your name.');
      return;
    }
    if (!senderEmail.trim() || !senderEmail.includes('@')) {
      setErrorMsg('Please enter your email address for order receipt confirmation.');
      return;
    }
    if (deliveryType === 'scheduled' && !scheduledDate) {
      setErrorMsg('Please select a scheduled delivery date.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Prepare card payload and payment order
      const purchaseData = {
        amount: effectiveAmount,
        theme: selectedTheme,
        recipient: {
          name: recipientName.trim(),
          email: recipientEmail.trim(),
          phone: recipientPhone.trim() || undefined,
        },
        sender: {
          name: senderName.trim(),
          email: senderEmail.trim(),
        },
        message: message.trim() || undefined,
        deliveryMethod: (deliveryType === 'scheduled' ? 'scheduled' : 'email') as 'email' | 'scheduled',
        scheduledDeliveryDate: deliveryType === 'scheduled' ? scheduledDate : null,
      };

      const res = await api.purchaseGiftCard(purchaseData);
      const rzpOrder = res.order;

      // 2. Razorpay checkout flow
      await loadRazorpayScript();

      if (window.Razorpay && !rzpOrder.isMock) {
        const options = {
          key: rzpOrder.key,
          amount: rzpOrder.amount,
          currency: 'INR',
          name: 'PerfectPic Gift Cards',
          description: `Gift Card for ${recipientName}`,
          order_id: rzpOrder.id,
          prefill: {
            name: senderName,
            email: senderEmail,
          },
          theme: {
            color: '#121212',
          },
          handler: async (paymentRes: any) => {
            try {
              const verifyRes = await api.verifyGiftCardPurchase({
                razorpay_order_id: paymentRes.razorpay_order_id,
                razorpay_payment_id: paymentRes.razorpay_payment_id,
                razorpay_signature: paymentRes.razorpay_signature,
                cardDetails: res.cardDetails,
              });

              setSuccessModalData(verifyRes.card);
            } catch (err: any) {
              setErrorMsg(err.message || 'Payment signature verification failed.');
            } finally {
              setIsSubmitting(false);
            }
          },
          modal: {
            ondismiss: () => {
              setIsSubmitting(false);
            },
          },
        };

        const rzpInstance = new window.Razorpay(options);
        rzpInstance.open();
      } else {
        // Dev Simulation / Direct completion
        const verifyRes = await api.verifyGiftCardPurchase({
          razorpay_order_id: rzpOrder.id,
          razorpay_payment_id: `pay_sim_${Date.now()}`,
          razorpay_signature: 'simulated_sig',
          cardDetails: res.cardDetails,
        });

        setSuccessModalData(verifyRes.card);
        setIsSubmitting(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to initiate gift card order. Please try again.');
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#121212] pt-28 pb-20">
      <div className="container mx-auto px-4 md:px-8 max-w-6xl">
        {/* Header Breadcrumbs & Title */}
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
          <div className="inline-flex items-center gap-1 text-[11px] uppercase tracking-widest text-amber-800 bg-amber-100/70 px-3 py-1 rounded-full font-semibold mb-4">
            <Gift className="w-3.5 h-3.5" />
            <span>Digital Gift Cards</span>
          </div>

          <h1 className="font-serif text-3xl md:text-5xl font-bold tracking-tight text-noir-950 mb-4 leading-tight">
            The Gift of Preserved Memories
          </h1>

          <p className="text-noir-600 text-sm md:text-base leading-relaxed">
            The most thoughtful gift when you don&apos;t have their private photographs. Let your loved ones design their own museum-grade heirloom photobook.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Left Column: Interactive 3D Gold Card Preview */}
          <div className="lg:col-span-5 sticky top-28 space-y-6">
            <div className="text-xs font-semibold uppercase tracking-wider text-noir-500 mb-2 flex items-center justify-between">
              <span>Interactive Live Preview</span>
              <span className="text-amber-700 font-medium">Digital E-Voucher</span>
            </div>

            {/* Visual Luxury Digital Card */}
            <div
              className={`w-full aspect-[1.6/1] rounded-2xl p-7 md:p-8 text-white relative shadow-2xl overflow-hidden bg-gradient-to-br ${activeThemeConfig.bgGradient} border border-white/10 flex flex-col justify-between transition-all duration-500 group`}
            >
              {/* Foil Shimmer Overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-white/10 pointer-events-none" />

              {/* Card Header */}
              <div className="flex items-start justify-between relative z-10">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-lg font-bold tracking-widest uppercase text-cream-50">
                      PerfectPic
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span className="text-[10px] uppercase tracking-widest text-cream-300 font-sans">
                      Heirloom
                    </span>
                  </div>
                  <p className="text-[10px] text-cream-300/80 uppercase tracking-widest mt-0.5 font-mono">
                    Digital Gift Voucher
                  </p>
                </div>

                <div className="text-right">
                  <span
                    className="font-serif text-2xl md:text-3xl font-bold font-mono block"
                    style={{ color: activeThemeConfig.accentColor }}
                  >
                    ₹{effectiveAmount.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-cream-400">
                    No Expiry · Pan-India
                  </span>
                </div>
              </div>

              {/* Card Center Message */}
              <div className="relative z-10 my-auto py-2">
                <p className="text-[11px] text-cream-300 uppercase tracking-wider mb-1">
                  Presented To
                </p>
                <p className="font-serif text-xl md:text-2xl font-bold text-cream-50 truncate">
                  {recipientName || 'Recipient Name'}
                </p>
                {message && (
                  <p className="text-xs text-cream-200/90 italic line-clamp-2 mt-1 font-serif">
                    &ldquo;{message}&rdquo;
                  </p>
                )}
              </div>

              {/* Card Footer */}
              <div className="flex items-end justify-between relative z-10 border-t border-white/10 pt-3">
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-cream-400 block">
                    From
                  </span>
                  <span className="text-xs font-medium text-cream-100 truncate block max-w-[140px]">
                    {senderName || 'Your Name'}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[9px] uppercase tracking-wider text-cream-400 block font-mono">
                    Voucher Code
                  </span>
                  <span className="text-xs font-mono font-bold tracking-widest text-cream-200">
                    PPGC-••••-••••
                  </span>
                </div>
              </div>
            </div>

            {/* Trust Assurances */}
            <div className="bg-white rounded-xl p-5 border border-cream-200 space-y-3 text-xs text-noir-600">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Full Purchase Flexibility:</strong> Valid for any book format, page add-on, or presentation box.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Balance Never Expires:</strong> Can be used over multiple orders or claimed directly to store credit.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <Send className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Instant Delivery:</strong> Dispatched via high-resolution email with printable voucher and WhatsApp notification.
                </span>
              </div>
            </div>

            {/* Already Have a Gift Card CTA */}
            <div className="text-center p-4 bg-cream-100/60 rounded-xl border border-cream-200">
              <p className="text-xs text-noir-600 mb-2">Received a PerfectPic gift card?</p>
              <div className="flex items-center justify-center gap-3">
                <Link
                  href="/wallet"
                  className="text-xs font-bold uppercase tracking-wider text-noir-900 hover:underline flex items-center gap-1"
                >
                  <span>Claim to Wallet</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
                <span className="text-cream-400">·</span>
                <Link
                  href="/configure"
                  className="text-xs font-bold uppercase tracking-wider text-amber-800 hover:underline flex items-center gap-1"
                >
                  <span>Redeem at Checkout</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: Customization & Purchase Form */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-10 border border-cream-200 shadow-sm space-y-8">
            <form onSubmit={handlePurchase} className="space-y-8">
              {/* Step 1: Choose Occasion & Design Theme */}
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider text-noir-900 mb-3">
                  1. Select Occasion Theme
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {THEMES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTheme(t.id)}
                      className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden ${
                        selectedTheme === t.id
                          ? 'border-noir-950 bg-cream-50 ring-2 ring-noir-950 shadow-sm'
                          : 'border-cream-200 hover:border-cream-300 hover:bg-cream-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                          {t.tag}
                        </span>
                        {selectedTheme === t.id && (
                          <div className="w-4 h-4 rounded-full bg-noir-950 text-white flex items-center justify-center">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </div>
                      <div className="font-semibold text-xs text-noir-900">{t.title}</div>
                      <div className="text-[10px] text-noir-500 line-clamp-1 mt-0.5">{t.subtitle}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Choose Gift Amount */}
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider text-noir-900 mb-3">
                  2. Choose Amount
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                  {PRESET_AMOUNTS.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => handleSelectPreset(p.value)}
                      className={`p-4 rounded-xl border text-center transition-all ${
                        !isCustom && amount === p.value
                          ? 'border-noir-950 bg-noir-950 text-cream-50 shadow-md'
                          : 'border-cream-200 hover:border-cream-300 bg-white text-noir-900'
                      }`}
                    >
                      <span className="font-serif text-lg font-bold block">{p.label}</span>
                      <span className="text-[10px] opacity-80 uppercase tracking-wider block mt-0.5">
                        {p.note}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Custom Amount Input */}
                <div className="mt-3 flex items-center gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-noir-400 font-serif text-sm">
                      ₹
                    </span>
                    <input
                      type="number"
                      placeholder="Or enter custom amount (Min ₹100)"
                      value={customAmount}
                      onChange={handleCustomChange}
                      min="100"
                      className={`w-full pl-8 pr-4 py-2.5 rounded-lg border text-sm transition-all focus:outline-none ${
                        isCustom
                          ? 'border-noir-950 ring-1 ring-noir-950 bg-cream-50/40'
                          : 'border-cream-300 focus:border-noir-400'
                      }`}
                    />
                  </div>
                  {isCustom && customAmount && (
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg">
                      Custom: ₹{Number(customAmount).toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
              </div>

              {/* Step 3: Recipient Information */}
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider text-noir-900 mb-3">
                  3. Who is this gift for?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-noir-600 mb-1">Recipient Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Priya Sharma"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-cream-300 text-sm focus:outline-none focus:border-noir-950 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-noir-600 mb-1">Recipient Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="priya@example.com"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-cream-300 text-sm focus:outline-none focus:border-noir-950 transition-colors"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs text-noir-600 mb-1">
                      Recipient WhatsApp Mobile Number (Optional for instant message)
                    </label>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-cream-300 text-sm focus:outline-none focus:border-noir-950 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Step 4: Sender Information & Personal Greeting */}
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider text-noir-900 mb-3">
                  4. Personalize Your Gift Message
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs text-noir-600 mb-1">Your Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Aditya & Ananya"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-cream-300 text-sm focus:outline-none focus:border-noir-950 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-noir-600 mb-1">Your Email (for receipt) *</label>
                    <input
                      type="email"
                      required
                      placeholder="aditya@example.com"
                      value={senderEmail}
                      onChange={(e) => setSenderEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-cream-300 text-sm focus:outline-none focus:border-noir-950 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-noir-600 mb-1">
                    Personal Gift Note (Appears printed on voucher & in email)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Wishing you a lifetime of adventures! Turn your precious moments into something you can hold forever..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-cream-300 text-sm focus:outline-none focus:border-noir-950 transition-colors"
                  />
                </div>
              </div>

              {/* Step 5: Delivery Timing */}
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider text-noir-900 mb-3">
                  5. Delivery Schedule
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <label
                    onClick={() => setDeliveryType('immediate')}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      deliveryType === 'immediate'
                        ? 'border-noir-950 bg-cream-50 ring-1 ring-noir-950'
                        : 'border-cream-200 hover:border-cream-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="deliveryType"
                      checked={deliveryType === 'immediate'}
                      onChange={() => setDeliveryType('immediate')}
                      className="accent-noir-950"
                    />
                    <div>
                      <span className="text-xs font-semibold text-noir-900 block">Deliver Immediately</span>
                      <span className="text-[11px] text-noir-500">Sent within seconds of payment</span>
                    </div>
                  </label>

                  <label
                    onClick={() => setDeliveryType('scheduled')}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      deliveryType === 'scheduled'
                        ? 'border-noir-950 bg-cream-50 ring-1 ring-noir-950'
                        : 'border-cream-200 hover:border-cream-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="deliveryType"
                      checked={deliveryType === 'scheduled'}
                      onChange={() => setDeliveryType('scheduled')}
                      className="accent-noir-950"
                    />
                    <div>
                      <span className="text-xs font-semibold text-noir-900 block">Schedule For Later</span>
                      <span className="text-[11px] text-noir-500">Deliver on their special date</span>
                    </div>
                  </label>
                </div>

                {deliveryType === 'scheduled' && (
                  <div className="mt-3 p-4 bg-cream-50 border border-cream-200 rounded-xl">
                    <label className="block text-xs font-medium text-noir-700 mb-1">
                      Select Delivery Date:
                    </label>
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="px-3.5 py-2 rounded-lg border border-cream-300 text-sm focus:outline-none focus:border-noir-950 bg-white"
                    />
                    <p className="text-[11px] text-noir-500 mt-1.5">
                      Voucher will be automatically dispatched at 9:00 AM IST on the selected date.
                    </p>
                  </div>
                )}
              </div>

              {/* Error Alert */}
              {errorMsg && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs">
                  {errorMsg}
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-4 border-t border-cream-200">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-noir-950 text-cream-50 py-4 rounded-xl font-semibold uppercase tracking-widest text-xs hover:bg-noir-900 transition-colors shadow-luxury-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing Payment...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>Complete Purchase · ₹{effectiveAmount.toLocaleString('en-IN')}</span>
                    </>
                  )}
                </button>
                <p className="text-[11px] text-center text-noir-500 mt-3">
                  Safe &amp; Encrypted 256-bit checkout via Razorpay / UPI / NetBanking / Cards.
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Success Confirmation Modal */}
      {successModalData && (
        <div className="fixed inset-0 bg-noir-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-cream-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6" />
            </div>

            <div className="text-center mb-6">
              <h3 className="font-serif text-2xl font-bold text-noir-950 mb-1">
                Gift Card Successfully Issued!
              </h3>
              <p className="text-xs text-noir-600">
                A digital voucher has been prepared for{' '}
                <strong>{successModalData.recipient?.name || recipientName}</strong>.
              </p>
            </div>

            {/* Voucher Code Card */}
            <div className="bg-gradient-to-br from-[#1C1A17] to-[#0A0A0A] text-white p-6 rounded-xl border border-amber-400/30 text-center mb-6 shadow-inner">
              <span className="text-[10px] uppercase tracking-widest text-amber-400 block mb-1">
                Your Gift Card Code
              </span>
              <div className="font-mono text-2xl font-bold tracking-widest text-cream-50 my-2 select-all">
                {successModalData.code}
              </div>
              <div className="text-xs text-cream-300">
                Security PIN: <strong className="text-white font-mono">{successModalData.pin}</strong>
              </div>
              <div className="mt-3 text-sm font-bold text-amber-300">
                Value: ₹{Number(successModalData.initialAmount).toLocaleString('en-IN')}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => copyToClipboard(`${successModalData.code} (PIN: ${successModalData.pin})`)}
                className="w-full py-3 bg-cream-100 hover:bg-cream-200 text-noir-900 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Copied Code &amp; PIN to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Voucher Code &amp; PIN</span>
                  </>
                )}
              </button>

              <div className="grid grid-cols-2 gap-2.5">
                <Link
                  href={`/configure?giftCard=${successModalData.code}`}
                  className="py-3 bg-noir-950 hover:bg-noir-900 text-cream-50 rounded-xl text-xs font-semibold uppercase tracking-wider text-center transition-colors block"
                >
                  Create Book Now
                </Link>

                <button
                  type="button"
                  onClick={() => setSuccessModalData(null)}
                  className="py-3 bg-white border border-cream-300 hover:bg-cream-50 text-noir-700 rounded-xl text-xs font-medium transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
