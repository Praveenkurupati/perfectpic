'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Minus, Plus, Check, X, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { useCartStore } from '@/stores/useCartStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAddressStore } from '@/stores/useAddressStore';
import { api } from '@/lib/api';
import { trackMetaInitiateCheckout, trackMetaPurchase } from '@/lib/metaPixel';
import { generateBookPdfBlob } from '@/lib/pdfGenerator';
import { BrandLogo } from '@/components/brand/BrandLogo';

declare global {
  interface Window {
    Razorpay: any;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if (window.Razorpay) return resolve(true);

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function triggerBackgroundPdfUpload(snapshot: any, primaryItem: any, orderId: string) {
  if (!snapshot && !primaryItem) return;
  (async () => {
    try {
      const cleanOrderId = String(orderId).replace(/[^a-zA-Z0-9_-]/g, '');
      const pdfBlob = await generateBookPdfBlob({
        title: snapshot?.title || primaryItem?.title || 'Heirloom Custom Photobook',
        subtitle: snapshot?.subtitle,
        seriesLabel: snapshot?.seriesLabel,
        dimensions: snapshot?.dimensions || primaryItem?.dimensions || '8.25" × 8.25"',
        pageCount: snapshot?.pageCount || primaryItem?.pageCount || 32,
        theme: snapshot?.theme || primaryItem?.theme || 'Minimal Modern',
        coverImage: snapshot?.coverImage || primaryItem?.thumbnail,
        coverColor: snapshot?.coverColor,
        coverConfig: snapshot?.coverConfig,
        photos: snapshot?.photos || [],
        pagePhotos: snapshot?.pagePhotos || {},
        slotPhotos: snapshot?.slotPhotos || {},
        slotCrops: snapshot?.slotCrops || {},
        pageLayouts: snapshot?.pageLayouts || {},
        pageBackgrounds: snapshot?.pageBackgrounds || {},
        projectId: snapshot?.projectId || primaryItem?.projectId,
      });

      const uploadRes = await api.uploadOrderPdf(pdfBlob, cleanOrderId);
      if (uploadRes?.url) {
        await api.updateOrderPdf(cleanOrderId, uploadRes.url).catch(() => {});
        try {
          localStorage.setItem(`pp_pdf_${cleanOrderId}`, uploadRes.url);
        } catch {}
      }
    } catch (err) {
      console.warn('Background PDF generation notice:', err);
    }
  })();
}

export default function CheckoutPage() {
  const router = useRouter();
  const {
    items,
    getTotal,
    getSubtotal,
    promoCode,
    discount,
    discountAmount,
    applyPromoCode,
    removePromoCode,
    increaseQuantity,
    decreaseQuantity,
    clearCart,
    accessories,
    toggleAccessory,
    getAccessoriesTotal,
    getBundleDiscount,
    getPhotobookCount,
    fetchBundleTiers,
  } = useCartStore();

  const { user, isAuthenticated, initialize } = useAuthStore();
  const { addresses, loadAddresses } = useAddressStore();
  const [mounted, setMounted] = useState(false);

  // Form Fields
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [deliveryPhone, setDeliveryPhone] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [pincode, setPincode] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');

  // Discount code box in summary
  const [promoInput, setPromoInput] = useState('');
  const [promoStatus, setPromoStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [promoMessage, setPromoMessage] = useState('');
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStep, setSubmissionStep] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    initialize();
    loadAddresses();
    loadRazorpayScript();
    fetchBundleTiers();
    setMounted(true);

    if (items.length > 0) {
      trackMetaInitiateCheckout({
        subtotal: getSubtotal(),
        itemCount: items.length,
        items: items.map((it) => ({ id: it.id, title: it.title, price: it.basePrice })),
      });
    }
  }, [initialize, loadAddresses, fetchBundleTiers]);

  // Autofill from user profile
  useEffect(() => {
    if (user) {
      if (user.email && !contactEmail) setContactEmail(user.email);
      if (user.phone && !contactPhone) {
        setContactPhone(user.phone);
        if (!deliveryPhone) setDeliveryPhone(user.phone);
      }
      if (user.name && !fullName) setFullName(user.name);
    }
  }, [user]);

  // Autofill from default address if available
  useEffect(() => {
    if (addresses.length > 0 && !addressLine) {
      const def = addresses.find((a) => a.isDefault) || addresses[0];
      if (def) {
        if (!fullName) setFullName(def.fullName);
        if (!deliveryPhone) setDeliveryPhone(def.phone);
        if (!contactPhone) setContactPhone(def.phone);
        setAddressLine(def.addressLine1);
        setPincode(def.pincode);
        setCity(def.city);
        setState(def.state);
      }
    }
  }, [addresses, addressLine]);

  // Handle promo code application
  const handleApplyPromo = async () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;

    setIsApplyingPromo(true);
    setPromoStatus('idle');
    setPromoMessage('');

    try {
      const res = await applyPromoCode(code, contactEmail || user?.email, user?.id);
      if (res.success) {
        setPromoStatus('success');
        setPromoMessage('code applied — bundle saving added');
      } else {
        setPromoStatus('error');
        setPromoMessage("that code isn't valid or has expired.");
      }
    } catch {
      setPromoStatus('error');
      setPromoMessage("that code isn't valid or has expired.");
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const handleClearPromo = () => {
    removePromoCode();
    setPromoInput('');
    setPromoStatus('idle');
    setPromoMessage('');
  };

  // Calculations
  const totalBooks = getPhotobookCount();
  const subtotal = getSubtotal();
  const bundleInfo = getBundleDiscount();
  const bundleDiscount = bundleInfo.discountAmount;
  const couponDiscount = discountAmount > 0 ? discountAmount : Math.round(subtotal * (discount || 0));
  const accessoriesTotal = getAccessoriesTotal();
  const finalTotal = getTotal() + accessoriesTotal;

  // Form Validation
  const validateForm = (): boolean => {
    if (!contactEmail.trim() || !contactEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return false;
    }
    const cleanContactPhone = contactPhone.replace(/\D/g, '');
    if (cleanContactPhone.length < 10) {
      setErrorMsg('Please provide a valid 10-digit contact phone number.');
      return false;
    }
    if (!fullName.trim()) {
      setErrorMsg('Please enter your full delivery name.');
      return false;
    }
    const cleanDeliveryPhone = (deliveryPhone || contactPhone).replace(/\D/g, '');
    if (cleanDeliveryPhone.length < 10) {
      setErrorMsg('Please provide a valid delivery mobile number.');
      return false;
    }
    if (!addressLine.trim()) {
      setErrorMsg('Please enter your delivery street address or house number.');
      return false;
    }
    const cleanPincode = pincode.replace(/\D/g, '');
    if (cleanPincode.length !== 6) {
      setErrorMsg('Please enter a valid 6-digit postal pincode.');
      return false;
    }
    if (!city.trim()) {
      setErrorMsg('Please specify your city.');
      return false;
    }
    if (!state.trim()) {
      setErrorMsg('Please specify your state.');
      return false;
    }

    setErrorMsg('');
    return true;
  };

  // Execute Payment via Razorpay (Direct without extra popup)
  const handlePayClick = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setSubmissionStep('Preparing secure Razorpay checkout...');

    try {
      const primaryItem = items[0];
      let snapshot = primaryItem?.projectSnapshot || null;
      if (!snapshot && typeof window !== 'undefined' && primaryItem?.projectId) {
        try {
          snapshot = JSON.parse(localStorage.getItem(`pp_snapshot_${primaryItem.projectId}`) || 'null');
        } catch {}
      }

      const isProduction =
        process.env.NODE_ENV === 'production' ||
        process.env.NEXT_PUBLIC_APP_ENV === 'production';

      let razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

      // Query dynamic payment config if not hardcoded
      if (!razorpayKey || razorpayKey === 'dummy_key' || razorpayKey === 'test_key') {
        try {
          const cfg = await api.getPaymentConfig();
          if (cfg?.configured && cfg.keyId) {
            razorpayKey = cfg.keyId;
          }
        } catch (e) {
          console.warn('Could not query payment config from backend:', e);
        }
      }

      const hasValidRazorpay = Boolean(
        razorpayKey &&
        razorpayKey !== 'dummy_key' &&
        razorpayKey !== 'test_key' &&
        (razorpayKey.startsWith('rzp_live_') || razorpayKey.startsWith('rzp_test_'))
      );

      // In production, enforce valid Razorpay
      if (isProduction && !hasValidRazorpay) {
        throw new Error('Payment gateway is currently undergoing maintenance. Please try again shortly or contact support.');
      }

      await loadRazorpayScript();

      // Create Razorpay order on backend
      const rzpOrder = await api.createPaymentOrder({
        items: items.map((it) => ({
          templateId: (it as any).templateId || it.id,
          size: it.dimensions,
          pageCount: it.pageCount,
          quantity: it.quantity || 1,
          price: it.basePrice,
          projectId: it.projectId,
          projectSnapshot: it.projectSnapshot,
        })),
        accessories,
        promoCode: promoCode || null,
        deliveryOption: 'standard',
        amount: finalTotal,
      });

      // If Razorpay gateway is loaded and order is active
      if (typeof window !== 'undefined' && window.Razorpay && !rzpOrder.isMock) {
        await new Promise<void>((resolve, reject) => {
          const options = {
            key: rzpOrder.key || razorpayKey,
            amount: rzpOrder.amount || Math.round(finalTotal * 100),
            currency: rzpOrder.currency || 'INR',
            name: 'PerfectPic Photobooks',
            description: primaryItem?.title || 'Custom Photobook Order',
            order_id: rzpOrder.id,
            prefill: {
              name: fullName,
              email: contactEmail,
              contact: contactPhone,
            },
            theme: {
              color: '#0A0A0A',
            },
            modal: {
              ondismiss: () => {
                setIsSubmitting(false);
                setSubmissionStep('');
              },
            },
            handler: async (response: any) => {
              try {
                setSubmissionStep('Verifying payment signature...');
                await api.verifyPayment({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                });

                setSubmissionStep('Finalizing your order...');
                const orderPayload = {
                  title: primaryItem?.title || 'Heirloom Custom Photobook',
                  items: items.map((it) => ({
                    templateId: (it as any).templateId || it.id,
                    size: it.dimensions,
                    pageCount: it.pageCount,
                    quantity: it.quantity || 1,
                    projectId: it.projectId,
                    projectSnapshot: it.projectSnapshot,
                  })),
                  projectSnapshot: snapshot,
                  projectManifest: snapshot,
                  projectId: primaryItem?.projectId,
                  customerName: fullName,
                  customerEmail: contactEmail,
                  customerPhone: contactPhone,
                  userId: user?.id,
                  shippingAddress: {
                    fullName,
                    phone: deliveryPhone || contactPhone,
                    email: contactEmail,
                    addressLine1: addressLine,
                    city,
                    state,
                    postalCode: pincode,
                    pincode,
                    country: 'India',
                  },
                  deliveryOption: 'standard',
                  accessories,
                  promoCode: promoCode || undefined,
                  paymentDetails: {
                    paymentMethod: 'razorpay',
                    razorpayOrderId: response.razorpay_order_id,
                    razorpayPaymentId: response.razorpay_payment_id,
                    razorpaySignature: response.razorpay_signature,
                    transactionId: response.razorpay_payment_id,
                    status: 'completed',
                  },
                };

                const result = await api.createOrder(orderPayload);
                const orderId = result.orderNumber || result.id || (result as any).order?.orderNumber;
                const guestToken = (result as any).guestToken || (result as any).order?.guestToken;

                if (typeof window !== 'undefined' && orderId && snapshot) {
                  try {
                    localStorage.setItem(`pp_snapshot_${orderId}`, JSON.stringify(snapshot));
                  } catch {}
                }

                if (orderId) {
                  triggerBackgroundPdfUpload(snapshot, primaryItem, orderId);
                }

                trackMetaPurchase({
                  orderId: String(orderId),
                  total: finalTotal,
                  items: items.map((it) => ({ id: it.id, title: it.title, price: it.basePrice })),
                });

                clearCart();

                const tokenQuery = guestToken ? `?token=${encodeURIComponent(guestToken)}` : '';
                router.push(`/confirmation/${orderId}${tokenQuery}`);
                resolve();
              } catch (postPayErr: any) {
                reject(postPayErr);
              }
            },
          };

          const rzp = new window.Razorpay(options);
          rzp.on('payment.failed', (failRes: any) => {
            setIsSubmitting(false);
            setSubmissionStep('');
            reject(new Error(failRes?.error?.description || 'Payment transaction failed.'));
          });
          rzp.open();
        });
        return;
      }

      // Offline dev mode fallback or sandbox mock
      setSubmissionStep('Finalizing test order...');
      const orderPayload = {
        title: primaryItem?.title || 'Heirloom Custom Photobook',
        items: items.map((it) => ({
          templateId: (it as any).templateId || it.id,
          size: it.dimensions,
          pageCount: it.pageCount,
          quantity: it.quantity || 1,
          projectId: it.projectId,
          projectSnapshot: it.projectSnapshot,
        })),
        projectSnapshot: snapshot,
        projectManifest: snapshot,
        projectId: primaryItem?.projectId,
        customerName: fullName,
        customerEmail: contactEmail,
        customerPhone: contactPhone,
        userId: user?.id,
        shippingAddress: {
          fullName,
          phone: deliveryPhone || contactPhone,
          email: contactEmail,
          addressLine1: addressLine,
          city,
          state,
          postalCode: pincode,
          pincode,
          country: 'India',
        },
        deliveryOption: 'standard',
        accessories,
        promoCode: promoCode || undefined,
        paymentDetails: {
          paymentMethod: isProduction ? 'razorpay' : 'online_upi',
          transactionId: `tx_${Date.now()}`,
          status: 'completed',
        },
      };

      const result = await api.createOrder(orderPayload);
      const orderId = result.orderNumber || result.id || (result as any).order?.orderNumber;
      const guestToken = (result as any).guestToken || (result as any).order?.guestToken;

      if (typeof window !== 'undefined' && orderId && snapshot) {
        try {
          localStorage.setItem(`pp_snapshot_${orderId}`, JSON.stringify(snapshot));
        } catch {}
      }

      if (orderId) {
        triggerBackgroundPdfUpload(snapshot, primaryItem, orderId);
      }

      trackMetaPurchase({
        orderId: String(orderId),
        total: finalTotal,
        items: items.map((it) => ({ id: it.id, title: it.title, price: it.basePrice })),
      });

      clearCart();

      const tokenQuery = guestToken ? `?token=${encodeURIComponent(guestToken)}` : '';
      router.push(`/confirmation/${orderId}${tokenQuery}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to initiate payment. Please check details and try again.');
      setIsSubmitting(false);
      setSubmissionStep('');
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#F4F2ED] flex items-center justify-center font-sans">
        <div className="w-7 h-7 border-2 border-[#0A0A0A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Back link resolution (to editor if project exists, else to cart)
  const backHref = items[0]?.projectId ? `/studio/${items[0].projectId}` : '/cart';

  return (
    <div className="min-h-screen bg-[#F4F2ED] text-[#0A0A0A] font-sans flex flex-col justify-between selection:bg-[#0A0A0A] selection:text-white">
      {/* 1. Top Announcement Bar */}
      <div>
        <div className="bg-[#0A0A0A] text-[#D9D6CF] py-2 px-4 text-center text-[11px] md:text-xs font-medium tracking-wide">
          bundle &amp; save · free delivery across india · 100% reprint policy
        </div>

        {/* 2. Header matching media_1792056964571.png */}
        <header className="border-b border-[#D9D6CF]/70 bg-[#F4F2ED]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center" aria-label="perfectpic homepage">
              <BrandLogo variant="light" height={32} className="h-7 md:h-8 w-auto" />
            </Link>

            {/* Back link */}
            <Link
              href={backHref}
              className="text-xs md:text-sm font-medium text-[#0A0A0A] hover:underline flex items-center gap-1.5 lowercase"
            >
              ← back to editor
            </Link>
          </div>
        </header>
      </div>

      {/* 3. Main Checkout Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full flex-1">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#0A0A0A] lowercase mb-8">
          checkout.
        </h1>

        {items.length === 0 ? (
          /* Empty Cart Notice */
          <div className="bg-white rounded-3xl p-10 sm:p-14 border border-[#D9D6CF]/80 text-center max-w-lg mx-auto shadow-xs">
            <h2 className="text-2xl font-bold text-[#0A0A0A] lowercase mb-2">
              your cart is empty.
            </h2>
            <p className="text-xs sm:text-sm text-[#706E69] mb-6 lowercase">
              add a photobook before proceeding to checkout.
            </p>
            <Link
              href="/templates"
              className="inline-flex items-center justify-center bg-[#0A0A0A] hover:bg-black text-white px-7 py-3 rounded-full text-xs sm:text-sm font-medium transition-colors shadow-xs lowercase"
            >
              browse books
            </Link>
          </div>
        ) : (
          <form onSubmit={handlePayClick} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column (8 cols): Contact, Delivery Address, Inline Upgrades */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Validation Error Alert */}
              {errorMsg && (
                <div className="bg-white border border-red-300 text-red-900 text-xs rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={15} className="text-red-600 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setErrorMsg('')}
                    className="font-bold text-red-900 hover:underline shrink-0 lowercase"
                  >
                    dismiss
                  </button>
                </div>
              )}

              {/* 1. Contact Card matching media_1792056964571.png */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#D9D6CF]/80 shadow-xs">
                <h2 className="text-base sm:text-lg font-bold text-[#0A0A0A] lowercase mb-4">
                  contact
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Email */}
                  <div>
                    <label className="block text-xs text-[#706E69] lowercase mb-1.5 font-normal">
                      email
                    </label>
                    <input
                      type="email"
                      required
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-2xl border border-[#D9D6CF] px-4 py-3 text-xs sm:text-sm text-[#0A0A0A] focus:outline-none focus:ring-1 focus:ring-black bg-transparent"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs text-[#706E69] lowercase mb-1.5 font-normal">
                      phone
                    </label>
                    <input
                      type="tel"
                      required
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+91 00000 00000"
                      className="w-full rounded-2xl border border-[#D9D6CF] px-4 py-3 text-xs sm:text-sm text-[#0A0A0A] focus:outline-none focus:ring-1 focus:ring-black bg-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Delivery Address Card matching media_1792056964571.png */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#D9D6CF]/80 shadow-xs">
                <h2 className="text-base sm:text-lg font-bold text-[#0A0A0A] lowercase mb-4">
                  delivery address
                </h2>

                <div className="space-y-4">
                  {/* Row 1: Full Name and Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-[#706E69] lowercase mb-1.5 font-normal">
                        full name
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="your name"
                        className="w-full rounded-2xl border border-[#D9D6CF] px-4 py-3 text-xs sm:text-sm text-[#0A0A0A] focus:outline-none focus:ring-1 focus:ring-black bg-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-[#706E69] lowercase mb-1.5 font-normal">
                        phone
                      </label>
                      <input
                        type="tel"
                        required
                        value={deliveryPhone || contactPhone}
                        onChange={(e) => setDeliveryPhone(e.target.value)}
                        placeholder="+91 00000 00000"
                        className="w-full rounded-2xl border border-[#D9D6CF] px-4 py-3 text-xs sm:text-sm text-[#0A0A0A] focus:outline-none focus:ring-1 focus:ring-black bg-transparent"
                      />
                    </div>
                  </div>

                  {/* Row 2: Address Line */}
                  <div>
                    <label className="block text-xs text-[#706E69] lowercase mb-1.5 font-normal">
                      address
                    </label>
                    <input
                      type="text"
                      required
                      value={addressLine}
                      onChange={(e) => setAddressLine(e.target.value)}
                      placeholder="house no., street, area"
                      className="w-full rounded-2xl border border-[#D9D6CF] px-4 py-3 text-xs sm:text-sm text-[#0A0A0A] focus:outline-none focus:ring-1 focus:ring-black bg-transparent"
                    />
                  </div>

                  {/* Row 3: Pincode, City, State */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-[#706E69] lowercase mb-1.5 font-normal">
                        pincode
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                        placeholder="000000"
                        className="w-full rounded-2xl border border-[#D9D6CF] px-4 py-3 text-xs sm:text-sm text-[#0A0A0A] font-mono tracking-wider focus:outline-none focus:ring-1 focus:ring-black bg-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-[#706E69] lowercase mb-1.5 font-normal">
                        city
                      </label>
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="city"
                        className="w-full rounded-2xl border border-[#D9D6CF] px-4 py-3 text-xs sm:text-sm text-[#0A0A0A] focus:outline-none focus:ring-1 focus:ring-black bg-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-[#706E69] lowercase mb-1.5 font-normal">
                        state
                      </label>
                      <input
                        type="text"
                        required
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="state"
                        className="w-full rounded-2xl border border-[#D9D6CF] px-4 py-3 text-xs sm:text-sm text-[#0A0A0A] focus:outline-none focus:ring-1 focus:ring-black bg-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Inline Upgrades (Check before clicking pay - NO POPUPS) */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#D9D6CF]/80 shadow-xs">
                <h2 className="text-base sm:text-lg font-bold text-[#0A0A0A] lowercase mb-4">
                  presentation upgrades (optional)
                </h2>

                <div className="space-y-3">
                  {/* Keepsake Presentation Box */}
                  <label className="flex items-center justify-between p-3.5 rounded-2xl border border-[#D9D6CF]/70 hover:border-[#0A0A0A] cursor-pointer transition-colors bg-white">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={Boolean(accessories.keepsakeBox)}
                        onChange={() => toggleAccessory('keepsakeBox')}
                        className="w-4 h-4 rounded accent-[#0A0A0A] cursor-pointer"
                      />
                      <div>
                        <span className="text-xs sm:text-sm font-bold text-[#0A0A0A] lowercase block">
                          keepsake gift presentation box
                        </span>
                        <span className="text-[11px] text-[#706E69] lowercase">
                          rigid archival keepsake box with gold foil stamping
                        </span>
                      </div>
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-[#0A0A0A] font-sans shrink-0 ml-3">
                      +₹499
                    </span>
                  </label>

                  {/* Ribbon Wrap & Gift Card */}
                  <label className="flex items-center justify-between p-3.5 rounded-2xl border border-[#D9D6CF]/70 hover:border-[#0A0A0A] cursor-pointer transition-colors bg-white">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={Boolean(accessories.giftWrap)}
                        onChange={() => toggleAccessory('giftWrap')}
                        className="w-4 h-4 rounded accent-[#0A0A0A] cursor-pointer"
                      />
                      <div>
                        <span className="text-xs sm:text-sm font-bold text-[#0A0A0A] lowercase block">
                          artisan ribbon wrap &amp; gift card
                        </span>
                        <span className="text-[11px] text-[#706E69] lowercase">
                          hand-tied satin ribbon wrap with personalized calligraphy card
                        </span>
                      </div>
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-[#0A0A0A] font-sans shrink-0 ml-3">
                      +₹199
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Right Column (4 cols): Order Summary matching media_1792056964571.png */}
            <div className="lg:col-span-4 sticky top-20">
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#D9D6CF]/80 shadow-xs">
                <h2 className="text-xl font-bold text-[#0A0A0A] lowercase mb-5">
                  order summary
                </h2>

                {/* Photobook Items */}
                <div className="space-y-4 mb-6">
                  {items.map((item) => {
                    const unitPrice = item.basePrice + (item.extraPagesPrice || 0);
                    const qty = item.quantity || 1;
                    const itemTotal = unitPrice * qty;

                    return (
                      <div key={item.id} className="flex items-center justify-between gap-3">
                        {/* Thumbnail */}
                        <div className="w-16 h-20 sm:w-20 sm:h-24 rounded-2xl bg-[#DDD8D0] overflow-hidden shrink-0 shadow-2xs">
                          <img
                            src={
                              item.thumbnail ||
                              'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&auto=format&fit=crop'
                            }
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Title, Subtitle, Stepper */}
                        <div className="min-w-0 flex-1">
                          <h3 className="text-xs sm:text-sm font-bold text-[#0A0A0A] lowercase leading-snug truncate">
                            {item.title} — custom photobook
                          </h3>
                          <p className="text-[11px] text-[#706E69] mt-0.5 mb-2 lowercase leading-snug">
                            {item.theme || 'travel series'} · {item.dimensions || '8.25" × 8.25"'}
                            <br />
                            {item.coverType || 'hardcover'} · lay-flat
                          </p>

                          {/* Stepper */}
                          <div className="inline-flex items-center gap-3 border border-[#D9D6CF] rounded-full px-2.5 py-0.5 text-xs font-semibold bg-white">
                            <button
                              type="button"
                              onClick={() => decreaseQuantity(item.id)}
                              className="text-[#0A0A0A] hover:opacity-60 transition-opacity p-0.5"
                              aria-label="Decrease quantity"
                            >
                              <Minus size={11} strokeWidth={2.5} />
                            </button>
                            <span className="min-w-[12px] text-center text-[#0A0A0A]">
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => increaseQuantity(item.id)}
                              className="text-[#0A0A0A] hover:opacity-60 transition-opacity p-0.5"
                              aria-label="Increase quantity"
                            >
                              <Plus size={11} strokeWidth={2.5} />
                            </button>
                          </div>
                        </div>

                        {/* Item Total Price */}
                        <div className="text-right shrink-0">
                          <span className="text-sm sm:text-base font-bold text-[#0A0A0A] font-sans">
                            ₹{itemTotal.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Discount Code */}
                <div className="mb-5">
                  <label className="block text-[11px] text-[#706E69] lowercase mb-1.5 font-normal">
                    discount code
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleApplyPromo();
                        }
                      }}
                      placeholder="enter code"
                      className="flex-1 rounded-2xl border border-[#D9D6CF] px-4 py-2.5 text-xs sm:text-sm uppercase tracking-wider text-[#0A0A0A] focus:outline-none focus:ring-1 focus:ring-black bg-transparent"
                    />
                    <button
                      type="button"
                      onClick={handleApplyPromo}
                      disabled={isApplyingPromo || !promoInput.trim()}
                      className="border border-[#0A0A0A] hover:bg-[#FAF9F6] text-[#0A0A0A] px-5 py-2.5 rounded-full text-xs font-medium transition-colors lowercase shrink-0 disabled:opacity-50"
                    >
                      {isApplyingPromo ? 'applying...' : 'apply'}
                    </button>
                  </div>

                  {promoStatus === 'success' && (
                    <div className="mt-2 text-xs text-[#0A0A0A] font-medium flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Check size={13} className="text-[#0A0A0A]" />
                        <span>{promoMessage}</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleClearPromo}
                        className="text-[#706E69] hover:text-[#0A0A0A] p-0.5"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  )}

                  {promoStatus === 'error' && (
                    <div className="mt-2 text-xs text-[#0A0A0A] font-medium">
                      {promoMessage}
                    </div>
                  )}

                  {promoCode && promoStatus !== 'success' && (
                    <div className="mt-2 text-xs text-[#0A0A0A] font-medium flex items-center justify-between">
                      <span>✓ code &ldquo;{promoCode}&rdquo; active</span>
                      <button
                        type="button"
                        onClick={handleClearPromo}
                        className="text-xs text-[#706E69] hover:underline lowercase"
                      >
                        remove
                      </button>
                    </div>
                  )}
                </div>

                <div className="border-t border-[#D9D6CF]/70 my-4" />

                {/* Line Items */}
                <div className="space-y-3 text-xs sm:text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-[#706E69] lowercase">
                      subtotal ({totalBooks} {totalBooks === 1 ? 'book' : 'books'})
                    </span>
                    <span className="font-medium text-[#0A0A0A]">
                      ₹{subtotal.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {bundleDiscount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-[#706E69] lowercase">bundle saving</span>
                      <span className="font-medium text-[#0A0A0A]">
                        −₹{bundleDiscount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}

                  {couponDiscount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-[#706E69] lowercase">coupon discount</span>
                      <span className="font-medium text-[#0A0A0A]">
                        −₹{couponDiscount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}

                  {accessoriesTotal > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-[#706E69] lowercase">upgrades &amp; gift</span>
                      <span className="font-medium text-[#0A0A0A]">
                        +₹{accessoriesTotal.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-[#706E69] lowercase">delivery</span>
                    <span className="font-medium text-[#0A0A0A] lowercase">free</span>
                  </div>
                </div>

                <div className="border-t border-[#D9D6CF]/70 my-4" />

                {/* Total */}
                <div className="flex justify-between items-baseline pt-1">
                  <div>
                    <span className="text-lg font-bold text-[#0A0A0A] lowercase block">
                      total
                    </span>
                    <span className="text-[11px] text-[#706E69] lowercase block">
                      inclusive of all taxes
                    </span>
                  </div>
                  <span className="text-2xl sm:text-3xl font-bold text-[#0A0A0A] font-sans">
                    ₹{finalTotal.toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Direct Pay with Razorpay Button matching media_1792056964571.png */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-full bg-[#0A0A0A] hover:bg-black text-white font-medium text-xs sm:text-sm transition-colors shadow-xs lowercase mt-6 mb-3 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>{submissionStep || 'connecting to razorpay...'}</span>
                    </>
                  ) : (
                    <span>pay ₹{finalTotal.toLocaleString('en-IN')} securely</span>
                  )}
                </button>

                {/* Trust Footer */}
                <p className="text-[10px] text-[#706E69] text-center leading-relaxed lowercase mt-2">
                  secure payments · free insured delivery · 100% reprint policy
                </p>
              </div>
            </div>
          </form>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#D9D6CF]/70 py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <p className="text-xs text-[#706E69] lowercase font-normal">
          © 2026 perfectpic · made with love in india
        </p>
      </footer>
    </div>
  );
}
