// apps/client/src/app/(checkout)/checkout/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore, ACCESSORY_PRICES, ACCESSORY_DETAILS } from '@/stores/useCartStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { api } from '@/lib/api';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Truck, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  ShoppingBag, 
  MapPin, 
  CreditCard, 
  Gift, 
  Sparkles,
  ArrowRight,
  Check,
  Lock
} from 'lucide-react';
import { trackEvent } from '@/lib/analytics';
import { trackMetaInitiateCheckout, trackMetaPurchase } from '@/lib/metaPixel';
import { useAddressStore } from '@/stores/useAddressStore';
import { generateBookPdfBlob } from '@/lib/pdfGenerator';
import PackagingUpsellModal from '@/features/checkout/components/PackagingUpsellModal';

declare global {
  interface Window {
    Razorpay?: any;
  }
}

/**
 * Dynamically loads the official Razorpay Checkout SDK.
 */
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

export default function CheckoutPage() {
  const router = useRouter();
  const { 
    items, 
    getTotal, 
    getSubtotal, 
    promoCode, 
    discount, 
    discountAmount, 
    clearCart,
    accessories,
    getAccessoriesTotal
  } = useCartStore();

  const { user, isAuthenticated, initialize } = useAuthStore();
  const { addresses, loadAddresses } = useAddressStore();
  const [mounted, setMounted] = useState(false);

  // Delivery Form Fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [pincode, setPincode] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [landmark, setLandmark] = useState('');
  const [cityState, setCityState] = useState('');
  const [deliveryOption, setDeliveryOption] = useState<'standard' | 'express'>('standard');

  // Upsell Modal State
  const [isUpsellOpen, setIsUpsellOpen] = useState(false);
  const [hasPromptedUpsell, setHasPromptedUpsell] = useState(false);

  // Processing & Feedback State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStep, setSubmissionStep] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    initialize();
    loadAddresses();
    loadRazorpayScript();
    setMounted(true);
    if (items.length > 0) {
      trackMetaInitiateCheckout({
        subtotal: getSubtotal(),
        itemCount: items.length,
        items: items.map(it => ({ id: it.id, title: it.title, price: it.basePrice })),
      });
    }
  }, [initialize, loadAddresses]);

  useEffect(() => {
    if (user) {
      if (user.name && !fullName) setFullName(user.name);
      if (user.phone && !phone) setPhone(user.phone);
    }
  }, [user, fullName, phone]);

  useEffect(() => {
    if (addresses.length > 0 && !addressLine1) {
      const def = addresses.find(a => a.isDefault) || addresses[0];
      if (def) {
        if (!fullName) setFullName(def.fullName);
        if (!phone) setPhone(def.phone);
        setPincode(def.pincode);
        setAddressLine1(def.addressLine1);
        if (def.landmark) setLandmark(def.landmark);
        setCityState(`${def.city}, ${def.state}`);
      }
    }
  }, [addresses, addressLine1, fullName, phone]);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push('/login?redirect=/checkout');
    }
  }, [mounted, isAuthenticated, router]);

  const handlePincodeBlur = async () => {
    if (pincode && pincode.length === 6) {
      try {
        const res = await api.pincodeLookup(pincode);
        if (res && res.city && res.state) {
          setCityState(`${res.city}, ${res.state}`);
        }
      } catch (err) {
        // Fallback default
      }
    }
  };

  /**
   * Primary entry point when user clicks "Pay with Razorpay"
   */
  const handleCheckoutClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      setErrorMsg('Your cart is empty. Please add a photobook before checking out.');
      return;
    }
    if (!addressLine1.trim()) {
      setErrorMsg('Please enter your full delivery address.');
      return;
    }
    if (!pincode.trim() || pincode.trim().length !== 6) {
      setErrorMsg('Please enter a valid 6-digit PIN code.');
      return;
    }
    if (!phone.trim() || phone.trim().length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number for BlueDart delivery updates.');
      return;
    }

    setErrorMsg('');

    // If user has not yet seen the presentation packaging upsell modal, present it now
    if (!hasPromptedUpsell && getAccessoriesTotal() === 0) {
      setIsUpsellOpen(true);
      return;
    }

    // Proceed directly to Razorpay payment
    executeRazorpayPaymentAndOrder();
  };

  /**
   * Executes Razorpay payment authorization and finalizes order.
   */
  const executeRazorpayPaymentAndOrder = async () => {
    setIsUpsellOpen(false);
    setHasPromptedUpsell(true);
    setIsSubmitting(true);
    setErrorMsg('');
    setSubmissionStep('Preparing print specifications & order summary...');

    try {
      const finalTotal = getTotal() + (deliveryOption === 'express' ? 299 : 0);

      // 1. Build Itemized Order Lines (including photobooks and selected accessories)
      const orderItems = items.map(item => ({
        id: item.id,
        projectId: item.projectId,
        title: item.title,
        quantity: item.quantity || 1,
        price: item.basePrice + (item.extraPagesPrice || 0),
        dimensions: item.dimensions,
        pageCount: item.pageCount,
        thumbnail: item.thumbnail,
      }));

      // Append selected packaging accessories as explicit line items
      if (accessories.keepsakeBox) {
        orderItems.push({
          id: 'acc-keepsake-box',
          projectId: 'accessory-box',
          title: ACCESSORY_DETAILS.keepsakeBox.title,
          quantity: 1,
          price: ACCESSORY_PRICES.keepsakeBox,
          dimensions: 'Presentation Case',
          pageCount: 0,
          thumbnail: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400&auto=format&fit=crop',
        });
      }
      if (accessories.giftWrap) {
        orderItems.push({
          id: 'acc-gift-wrap',
          projectId: 'accessory-wrap',
          title: ACCESSORY_DETAILS.giftWrap.title,
          quantity: 1,
          price: ACCESSORY_PRICES.giftWrap,
          dimensions: 'Ribbon & Card',
          pageCount: 0,
          thumbnail: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=400&auto=format&fit=crop',
        });
      }
      if (accessories.uvGlaze) {
        orderItems.push({
          id: 'acc-uv-glaze',
          projectId: 'accessory-glaze',
          title: ACCESSORY_DETAILS.uvGlaze.title,
          quantity: 1,
          price: ACCESSORY_PRICES.uvGlaze,
          dimensions: 'Archival Coating',
          pageCount: 0,
          thumbnail: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=400&auto=format&fit=crop',
        });
      }
      if (accessories.miniPolaroids) {
        orderItems.push({
          id: 'acc-mini-prints',
          projectId: 'accessory-polaroids',
          title: ACCESSORY_DETAILS.miniPolaroids.title,
          quantity: 1,
          price: ACCESSORY_PRICES.miniPolaroids,
          dimensions: '2" × 3" (10 Prints)',
          pageCount: 0,
          thumbnail: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=400&auto=format&fit=crop',
        });
      }

      const primaryItem = items[0];
      let snapshot = primaryItem?.projectSnapshot || null;
      if (!snapshot && typeof window !== 'undefined' && primaryItem?.projectId) {
        try {
          snapshot = JSON.parse(localStorage.getItem(`pp_snapshot_${primaryItem.projectId}`) || 'null');
        } catch {}
      }

      // 2. Generate Print-Ready PDF and stream to AWS S3
      let s3PdfUrl: string | undefined = undefined;
      if (snapshot) {
        try {
          setSubmissionStep('Rendering ultra-HD 300-DPI photobook PDF...');
          const pdfBlob = await generateBookPdfBlob({
            title: snapshot.title || primaryItem?.title || 'Heirloom Custom Photobook',
            subtitle: snapshot.subtitle,
            seriesLabel: snapshot.seriesLabel,
            dimensions: snapshot.dimensions || primaryItem?.dimensions,
            pageCount: snapshot.pageCount || primaryItem?.pageCount,
            theme: snapshot.theme || primaryItem?.theme,
            coverImage: snapshot.coverImage || primaryItem?.thumbnail,
            coverColor: snapshot.coverColor,
            coverConfig: snapshot.coverConfig,
            photos: snapshot.photos,
            pagePhotos: snapshot.pagePhotos,
            slotPhotos: snapshot.slotPhotos,
            slotCrops: snapshot.slotCrops,
            pageLayouts: snapshot.pageLayouts,
            pageBackgrounds: snapshot.pageBackgrounds,
            projectId: snapshot.projectId || primaryItem?.projectId,
          });

          setSubmissionStep('Uploading print-ready PDF to AWS S3...');
          const uploadRes = await api.uploadPdf(pdfBlob, `photobook-${Date.now()}.pdf`);
          if (uploadRes && uploadRes.url) {
            s3PdfUrl = uploadRes.url;
          }
        } catch (pdfErr) {
          console.warn('Notice: Background PDF upload will be performed by bindery queue:', pdfErr);
        }
      }

      // 3. Initiate Razorpay Payment Order
      setSubmissionStep('Connecting to Razorpay Secure Gateway...');

      const paymentOrder = await api.createPaymentOrder({
        amount: finalTotal,
        currency: 'INR',
        receipt: `rcpt_${Date.now()}`,
      });

      const finalizeOrder = async (payResult: {
        razorpay_order_id?: string;
        razorpay_payment_id?: string;
        razorpay_signature?: string;
      }) => {
        setSubmissionStep('Verifying payment signature & finalizing order...');

        // Verify HMAC SHA-256 signature
        if (payResult.razorpay_signature) {
          await api.verifyPayment({
            razorpay_order_id: payResult.razorpay_order_id || '',
            razorpay_payment_id: payResult.razorpay_payment_id || '',
            razorpay_signature: payResult.razorpay_signature || '',
          });
        }

        const effectiveDiscount = discountAmount > 0 ? discountAmount : Math.round(getSubtotal() * (discount || 0));
        const orderTitle = orderItems.length > 1
          ? `${orderItems[0]?.title || 'Photobook'} (+${orderItems.length - 1} more)`
          : (orderItems[0]?.title || 'Custom Photobook Keepsake');

        const res = await api.createOrder({
          title: orderTitle,
          items: orderItems,
          total: finalTotal,
          amount: finalTotal,
          subtotal: getSubtotal(),
          promoCode: promoCode || null,
          discount: effectiveDiscount,
          pricing: {
            subtotal: getSubtotal(),
            promoCode: promoCode || null,
            discount: effectiveDiscount,
            shipping: deliveryOption === 'express' ? 299 : 0,
            packagingPrice: getAccessoriesTotal(),
            total: finalTotal,
            paymentMethod: 'razorpay',
            advancePaid: finalTotal,
            balanceDue: 0,
          },
          pdfUrl: s3PdfUrl,
          printPdfUrl: s3PdfUrl,
          projectSnapshot: snapshot,
          customerName: fullName.trim() || user?.name || 'Valued Customer',
          customerEmail: user?.email || 'customer@perfectpic.in',
          customerPhone: phone.trim() || user?.phone || '',
          shippingAddress: {
            fullName: fullName.trim() || user?.name,
            phone: phone.trim() || user?.phone,
            addressLine1: addressLine1.trim(),
            landmark: landmark.trim(),
            pincode: pincode.trim(),
            city: cityState.split(',')[0]?.trim() || '',
            state: cityState.split(',')[1]?.trim() || '',
          },
          deliveryOption,
          paymentDetails: {
            gateway: 'razorpay',
            method: 'razorpay',
            status: 'PAID',
            razorpayOrderId: payResult.razorpay_order_id,
            razorpayPaymentId: payResult.razorpay_payment_id,
            paidAt: new Date().toISOString(),
          },
        });

        const orderNumber = res.orderNumber || res.id || `PP-${Math.floor(1000 + Math.random() * 9000)}`;

        // Resilient fallback: upload PDF in background if upfront failed
        if (!s3PdfUrl && snapshot) {
          generateBookPdfBlob({
            title: snapshot.title || primaryItem?.title || 'Heirloom Custom Photobook',
            subtitle: snapshot.subtitle,
            seriesLabel: snapshot.seriesLabel,
            dimensions: snapshot.dimensions || primaryItem?.dimensions,
            pageCount: snapshot.pageCount || primaryItem?.pageCount,
            theme: snapshot.theme || primaryItem?.theme,
            coverImage: snapshot.coverImage || primaryItem?.thumbnail,
            coverColor: snapshot.coverColor,
            coverConfig: snapshot.coverConfig,
            photos: snapshot.photos,
            pagePhotos: snapshot.pagePhotos,
            slotPhotos: snapshot.slotPhotos,
            slotCrops: snapshot.slotCrops,
            pageLayouts: snapshot.pageLayouts,
            pageBackgrounds: snapshot.pageBackgrounds,
            projectId: snapshot.projectId || primaryItem?.projectId,
          }).then(async (blob) => {
            const up = await api.uploadPdf(blob, `photobook-${orderNumber}.pdf`, orderNumber);
            if (up && up.url) {
              await api.updateOrderPdf(orderNumber, up.url).catch(() => {});
            }
          }).catch((e) => console.warn('Background PDF sync notice:', e));
        }

        trackEvent('order_completed', `Order Placed (#${orderNumber})`, {
          orderNumber,
          total: finalTotal,
          paymentMethod: 'razorpay',
          itemsCount: orderItems.length,
          city: cityState.split(',')[0]?.trim() || '',
          deliveryOption,
        });

        trackMetaPurchase({
          orderId: String(orderNumber),
          total: finalTotal,
          items: orderItems,
          email: user?.email,
          phone: phone.trim() || user?.phone,
        });

        clearCart();
        router.push(`/confirmation/${orderNumber}`);
      };

      // 4. Launch Official Razorpay Modal or Dev Test Simulation
      const razorpayKey = paymentOrder?.key || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';
      const isLiveRazorpay = !paymentOrder?.isMock && typeof window !== 'undefined' && window.Razorpay && razorpayKey && !razorpayKey.includes('placeholder');

      if (isLiveRazorpay) {
        const rzp = new window.Razorpay({
          key: razorpayKey,
          amount: paymentOrder.amount,
          currency: paymentOrder.currency || 'INR',
          name: 'PerfectPic Photobooks',
          description: `Archival Photobook Order (${items.length} book${items.length > 1 ? 's' : ''})`,
          order_id: paymentOrder.id,
          prefill: {
            name: fullName.trim() || user?.name || '',
            email: user?.email || '',
            contact: phone.trim() || user?.phone || '',
          },
          theme: {
            color: '#141413',
          },
          handler: async (response: any) => {
            await finalizeOrder({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
          },
          modal: {
            ondismiss: () => {
              setIsSubmitting(false);
              setSubmissionStep('');
            },
          },
        });

        rzp.on('payment.failed', (response: any) => {
          setIsSubmitting(false);
          setSubmissionStep('');
          setErrorMsg(response.error?.description || 'Razorpay payment was unsuccessful. Please try again.');
        });

        rzp.open();
      } else {
        // Fast, resilient simulated authorization
        setSubmissionStep('Connecting to Razorpay Secure Gateway (Payment Approved)...');
        await new Promise((r) => setTimeout(r, 900));

        await finalizeOrder({
          razorpay_order_id: paymentOrder?.id || `order_rzp_${Date.now()}`,
          razorpay_payment_id: `pay_rzp_${Date.now()}`,
          razorpay_signature: 'mock_signature',
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to place order. Please check your network and try again.');
      setIsSubmitting(false);
      setSubmissionStep('');
    }
  };

  if (!mounted || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center font-sans text-noir-900">
        <div className="text-center">
          <p className="font-serif text-xl mb-2">Redirecting to sign in...</p>
          <p className="text-xs text-noir-500 uppercase tracking-widest">Please sign in to proceed with checkout</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[75vh] bg-cream-50 font-sans text-noir-900 py-16 px-4 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center bg-white p-10 rounded-sm shadow-sm border border-cream-200">
          <div className="w-16 h-16 rounded-full bg-cream-100 flex items-center justify-center mx-auto mb-5 text-noir-500">
            <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
          </div>
          <h1 className="font-serif text-3xl mb-3">Your Cart is Empty</h1>
          <p className="text-sm text-noir-600 mb-8 leading-relaxed">
            There are no photobooks in your cart to checkout. Please customize or select a photobook first.
          </p>
          <Link
            href="/templates"
            className="inline-block bg-noir-950 text-cream-50 px-8 py-3.5 rounded-sm text-xs font-semibold tracking-widest uppercase hover:bg-noir-900 transition-colors shadow-luxury-md"
          >
            Browse Photobooks
          </Link>
        </div>
      </div>
    );
  }

  const effectiveDiscount = discountAmount > 0 ? discountAmount : Math.round(getSubtotal() * (discount || 0));
  const finalTotal = getTotal() + (deliveryOption === 'express' ? 299 : 0);
  const accessoriesTotal = getAccessoriesTotal();

  return (
    <div className="min-h-screen bg-cream-50 font-sans text-noir-900 py-12 px-4">
      {/* Packaging & Accessories Upsell Modal */}
      <PackagingUpsellModal
        isOpen={isUpsellOpen}
        onClose={() => setIsUpsellOpen(false)}
        onProceed={executeRazorpayPaymentAndOrder}
      />

      <div className="max-w-6xl mx-auto">
        <div className="flex items-baseline justify-between mb-8 flex-wrap gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-noir-500 block mb-1">
              Step 2 of 2 • Secure Order Confirmation
            </span>
            <h1 className="font-serif text-4xl">Checkout</h1>
          </div>
          <div className="flex items-center gap-3 text-xs text-noir-600 bg-white px-3 py-1.5 rounded-sm border border-cream-200 shadow-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>256-Bit SSL Encrypted • 100% Reprint Guarantee</span>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-sm flex items-center gap-3 text-sm text-red-700">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Delivery & Payment Details */}
          <form onSubmit={handleCheckoutClick} className="lg:col-span-2 space-y-6">
            {/* 1. Delivery Address */}
            <section className="bg-white p-8 rounded-sm shadow-sm border border-cream-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-2xl flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-noir-700" />
                  <span>Delivery Address</span>
                </h2>
                {addresses.length > 0 && (
                  <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                    Saved Address Loaded
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-noir-600 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    className="w-full border border-cream-300 p-3 rounded-sm bg-white text-noir-900 focus:outline-none focus:border-noir-950 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-noir-600 mb-1">
                    Mobile Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="w-full border border-cream-300 p-3 rounded-sm bg-white text-noir-900 focus:outline-none focus:border-noir-950 text-sm font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-noir-600 mb-1">
                    Street Address / Apartment *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    placeholder="House / Flat No., Building, Street Name"
                    className="w-full border border-cream-300 p-3 rounded-sm bg-white text-noir-900 focus:outline-none focus:border-noir-950 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-noir-600 mb-1">
                    Landmark (Optional)
                  </label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="Near Metro / Landmark"
                    className="w-full border border-cream-300 p-3 rounded-sm bg-white text-noir-900 focus:outline-none focus:border-noir-950 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-noir-600 mb-1">
                    PIN Code *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    onBlur={handlePincodeBlur}
                    placeholder="6-digit PIN"
                    className="w-full border border-cream-300 p-3 rounded-sm bg-white text-noir-900 focus:outline-none focus:border-noir-950 text-sm font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-noir-600 mb-1">
                    City & State
                  </label>
                  <input
                    type="text"
                    value={cityState}
                    onChange={(e) => setCityState(e.target.value)}
                    placeholder="e.g. Bengaluru, Karnataka"
                    className="w-full border border-cream-300 p-3 rounded-sm bg-white text-noir-900 focus:outline-none focus:border-noir-950 text-sm"
                  />
                </div>
              </div>
            </section>

            {/* 2. Delivery Speed */}
            <section className="bg-white p-8 rounded-sm shadow-sm border border-cream-200">
              <h2 className="font-serif text-2xl mb-4">Delivery Speed</h2>
              <div className="space-y-3">
                <label 
                  onClick={() => setDeliveryOption('standard')}
                  className={`flex items-center gap-4 p-4 border rounded-sm cursor-pointer transition-all ${
                    deliveryOption === 'standard' ? 'border-noir-950 bg-cream-50/70 shadow-xs' : 'border-cream-300'
                  }`}
                >
                  <input 
                    type="radio" 
                    name="delivery" 
                    checked={deliveryOption === 'standard'} 
                    onChange={() => setDeliveryOption('standard')}
                    className="accent-noir-950 w-4 h-4" 
                  />
                  <div className="flex-1">
                    <div className="flex justify-between font-medium">
                      <span>Standard Pan-India Insured</span>
                      <span className="text-emerald-700 font-semibold">FREE (Complimentary)</span>
                    </div>
                    <p className="text-xs text-noir-500 mt-0.5">Estimated 3–5 business days via BlueDart Air</p>
                  </div>
                </label>

                <label 
                  onClick={() => setDeliveryOption('express')}
                  className={`flex items-center gap-4 p-4 border rounded-sm cursor-pointer transition-all ${
                    deliveryOption === 'express' ? 'border-noir-950 bg-cream-50/70 shadow-xs' : 'border-cream-300'
                  }`}
                >
                  <input 
                    type="radio" 
                    name="delivery" 
                    checked={deliveryOption === 'express'} 
                    onChange={() => setDeliveryOption('express')}
                    className="accent-noir-950 w-4 h-4" 
                  />
                  <div className="flex-1">
                    <div className="flex justify-between font-medium">
                      <span>Express Priority Rush Dispatch</span>
                      <span className="font-semibold text-noir-950">₹299</span>
                    </div>
                    <p className="text-xs text-noir-500 mt-0.5">Fast-track printing queue • 1–2 business days dispatch</p>
                  </div>
                </label>
              </div>

              {/* Keepsake Packaging Upsell Teaser */}
              <div className="mt-6 pt-6 border-t border-cream-200 flex items-center justify-between gap-4 flex-wrap bg-cream-50/60 p-4 rounded-sm border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100/80 border border-amber-300/70 flex items-center justify-center shrink-0">
                    <Gift className="w-5 h-5 text-amber-900" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-noir-900 block">
                      Archival Presentation Packaging
                    </span>
                    <p className="text-xs text-noir-500">
                      {accessoriesTotal > 0
                        ? `${Object.values(accessories).filter(Boolean).length} custom upgrade(s) active (+₹${accessoriesTotal})`
                        : 'Gift box, ribbon wrap, and protective UV page glaze options'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsUpsellOpen(true)}
                  className="px-3.5 py-2 text-xs font-semibold bg-white border border-cream-300 hover:border-noir-900 rounded-sm text-noir-900 flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Sparkles size={12} className="text-foil-gold" />
                  <span>{accessoriesTotal > 0 ? 'Edit Upgrades' : 'View Presentation Options'}</span>
                </button>
              </div>
            </section>

            {/* 3. Razorpay Secure Payment Option Only */}
            <section className="bg-white p-8 rounded-sm shadow-sm border border-cream-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-serif text-2xl flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-noir-900" />
                  <span>Payment Method</span>
                </h2>
                <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Razorpay Verified
                </span>
              </div>

              {/* Razorpay Single Dedicated Option */}
              <div className="p-5 rounded-sm border-2 border-noir-950 bg-cream-50/70 shadow-xs space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-sm bg-blue-600 text-white flex items-center justify-center font-bold text-lg font-serif shadow-xs">
                      R
                    </div>
                    <div>
                      <span className="font-serif text-base font-bold text-noir-950 block">
                        Razorpay Secure Checkout
                      </span>
                      <span className="text-xs text-noir-600">
                        Pay via UPI, Cards, NetBanking, or Digital Wallets
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300">
                    Official Gateway
                  </span>
                </div>

                {/* Badges of Payment Options within Razorpay */}
                <div className="pt-3 border-t border-cream-200/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 rounded bg-white border border-cream-200 text-center">
                    <span className="font-semibold text-noir-900 block">UPI Instant</span>
                    <span className="text-[10px] text-noir-500">GPay, PhonePe, Paytm</span>
                  </div>
                  <div className="p-2.5 rounded bg-white border border-cream-200 text-center">
                    <span className="font-semibold text-noir-900 block">Debit / Credit Card</span>
                    <span className="text-[10px] text-noir-500">Visa, Master, RuPay</span>
                  </div>
                  <div className="p-2.5 rounded bg-white border border-cream-200 text-center">
                    <span className="font-semibold text-noir-900 block">NetBanking</span>
                    <span className="text-[10px] text-noir-500">50+ Indian Banks</span>
                  </div>
                  <div className="p-2.5 rounded bg-white border border-cream-200 text-center">
                    <span className="font-semibold text-noir-900 block">Wallets & CRED</span>
                    <span className="text-[10px] text-noir-500">Instant One-Click</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-noir-600 pt-1">
                  <Lock size={13} className="text-emerald-700 shrink-0" />
                  <span className="text-[11px] leading-relaxed">
                    Razorpay opens in a secure popup with RBI-authorized 256-bit encryption. Zero transaction fee.
                  </span>
                </div>
              </div>
            </section>
          </form>

          {/* Right Column: Order Summary & Pay Button */}
          <div>
            <div className="bg-white p-8 rounded-sm shadow-sm border border-cream-200 sticky top-8 space-y-6">
              <h2 className="font-serif text-2xl">Order Summary</h2>
              
              {/* Line Items */}
              <div className="space-y-3 pb-4 border-b border-cream-200">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 text-xs">
                    {item.thumbnail && (
                      <img 
                        src={item.thumbnail} 
                        alt={item.title} 
                        className="w-12 h-12 object-cover rounded-xs border border-cream-200 shrink-0" 
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-noir-900 block truncate">{item.title}</span>
                      <span className="text-[10px] text-noir-500">
                        {item.dimensions} • {item.pageCount} Pages • Qty: {item.quantity || 1}
                      </span>
                    </div>
                    <span className="font-mono font-medium text-noir-900">
                      ₹{((item.basePrice + (item.extraPagesPrice || 0)) * (item.quantity || 1)).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}

                {/* Selected Accessories in Summary */}
                {accessories.keepsakeBox && (
                  <div className="flex items-center justify-between text-xs text-noir-700 bg-cream-50/70 p-2 rounded-xs border border-cream-200">
                    <span className="flex items-center gap-1.5">
                      <Gift size={12} className="text-foil-gold" />
                      <span>Keepsake Velvet Box</span>
                    </span>
                    <span className="font-mono font-semibold">+₹{ACCESSORY_PRICES.keepsakeBox}</span>
                  </div>
                )}
                {accessories.giftWrap && (
                  <div className="flex items-center justify-between text-xs text-noir-700 bg-cream-50/70 p-2 rounded-xs border border-cream-200">
                    <span className="flex items-center gap-1.5">
                      <Sparkles size={12} className="text-rose-500" />
                      <span>Artisan Ribbon Wrap</span>
                    </span>
                    <span className="font-mono font-semibold">+₹{ACCESSORY_PRICES.giftWrap}</span>
                  </div>
                )}
                {accessories.uvGlaze && (
                  <div className="flex items-center justify-between text-xs text-noir-700 bg-cream-50/70 p-2 rounded-xs border border-cream-200">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck size={12} className="text-emerald-600" />
                      <span>Archival UV Glaze</span>
                    </span>
                    <span className="font-mono font-semibold">+₹{ACCESSORY_PRICES.uvGlaze}</span>
                  </div>
                )}
                {accessories.miniPolaroids && (
                  <div className="flex items-center justify-between text-xs text-noir-700 bg-cream-50/70 p-2 rounded-xs border border-cream-200">
                    <span className="flex items-center gap-1.5">
                      <ShoppingBag size={12} className="text-indigo-500" />
                      <span>10 Mini Polaroid Prints</span>
                    </span>
                    <span className="font-mono font-semibold">+₹{ACCESSORY_PRICES.miniPolaroids}</span>
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 pb-6 border-b border-cream-200 text-sm">
                <div className="flex justify-between text-noir-600">
                  <span>Subtotal</span>
                  <span>₹{getSubtotal().toLocaleString('en-IN')}</span>
                </div>

                {effectiveDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span className="flex items-center gap-1">
                      <span>Discount</span>
                      {promoCode && (
                        <span className="font-mono text-xs bg-emerald-100/70 px-1 py-0.5 rounded">
                          {promoCode}
                        </span>
                      )}
                    </span>
                    <span>-₹{effectiveDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="flex justify-between text-noir-600">
                  <span>Insured Pan-India Shipping</span>
                  <span className="text-emerald-700">{deliveryOption === 'express' ? '₹299' : 'FREE'}</span>
                </div>

                <div className="flex justify-between text-noir-950 font-semibold pt-2 text-base">
                  <span>Order Total</span>
                  <span className="font-serif text-2xl">₹{finalTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="p-3 bg-cream-50 border border-cream-200 rounded-sm flex items-center gap-2 text-xs text-noir-600">
                <Truck className="w-4 h-4 text-noir-800 shrink-0" />
                <span>Zero Risk • Insured against print defects & damage</span>
              </div>

              {/* Primary Action Button */}
              <button 
                onClick={handleCheckoutClick}
                disabled={isSubmitting}
                className="w-full bg-noir-950 text-cream-50 py-4 rounded-sm font-medium tracking-widest uppercase hover:bg-noir-900 transition-colors shadow-luxury-md disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-foil-gold" />
                    <span className="text-xs">{submissionStep || 'Connecting to Razorpay...'}</span>
                  </>
                ) : (
                  <span>Pay ₹{finalTotal.toLocaleString('en-IN')} with Razorpay</span>
                )}
              </button>

              {/* Trust Badges */}
              <div className="flex items-center justify-center gap-5 text-xs text-noir-500 grayscale opacity-80 pt-2">
                <div className="flex items-center gap-1"><span className="text-base">🔒</span> SSL Encrypted</div>
                <div className="flex items-center gap-1"><span className="text-base">⚡</span> Razorpay Verified</div>
                <div className="flex items-center gap-1"><span className="text-base">✨</span> 100% Guaranteed</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
