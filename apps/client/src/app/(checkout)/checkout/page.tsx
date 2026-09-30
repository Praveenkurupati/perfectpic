'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/stores/useCartStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { api } from '@/lib/api';
import Link from 'next/link';
import { ShieldCheck, Truck, Loader2, AlertCircle, CheckCircle2, ShoppingBag, MapPin } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';
import { useAddressStore } from '@/stores/useAddressStore';
import { generateBookPdfBlob } from '@/lib/pdfGenerator';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotal, getSubtotal, promoCode, discount, discountAmount, clearCart } = useCartStore();
  const { user, isAuthenticated, initialize } = useAuthStore();
  const { addresses, loadAddresses } = useAddressStore();
  const [mounted, setMounted] = useState(false);

  // Form Fields - clean initial states without mock defaults
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [pincode, setPincode] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [landmark, setLandmark] = useState('');
  const [cityState, setCityState] = useState('');
  const [deliveryOption, setDeliveryOption] = useState<'standard' | 'express'>('standard');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStep, setSubmissionStep] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    initialize();
    loadAddresses();
    setMounted(true);
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

  const handlePlaceOrder = async (e: React.FormEvent) => {
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

    setIsSubmitting(true);
    setErrorMsg('');
    setSubmissionStep('Preparing photobook specifications...');

    try {
      const orderTotal = getTotal() + (deliveryOption === 'express' ? 299 : 0);
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

      const primaryItem = items[0];
      let snapshot = primaryItem?.projectSnapshot || null;
      if (!snapshot && typeof window !== 'undefined' && primaryItem?.projectId) {
        try {
          snapshot = JSON.parse(localStorage.getItem(`pp_snapshot_${primaryItem.projectId}`) || 'null');
        } catch {}
      }

      // Generate ultra-HD Print-Ready Photobook PDF and stream directly to AWS S3
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

      setSubmissionStep('Finalizing order...');
      const orderTitle = orderItems.length > 1
        ? `${orderItems[0]?.title || 'Photobook'} (+${orderItems.length - 1} more)`
        : (orderItems[0]?.title || 'Custom Photobook Keepsake');

      const effectiveDiscount = discountAmount > 0 ? discountAmount : Math.round(getSubtotal() * (discount || 0));

      const res = await api.createOrder({
        title: orderTitle,
        items: orderItems,
        total: orderTotal,
        amount: orderTotal,
        subtotal: getSubtotal(),
        promoCode: promoCode || null,
        discount: effectiveDiscount,
        pricing: {
          subtotal: getSubtotal(),
          promoCode: promoCode || null,
          discount: effectiveDiscount,
          shipping: deliveryOption === 'express' ? 299 : 0,
          total: orderTotal,
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
      });

      const orderNumber = res.orderNumber || res.id || `PP-${Math.floor(1000 + Math.random() * 9000)}`;
      
      // Resilient fallback: If upfront PDF upload did not succeed, complete in background and attach to order
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
        total: orderTotal,
        itemsCount: orderItems.length,
        city: cityState.split(',')[0]?.trim() || '',
        deliveryOption,
      });

      clearCart();
      router.push(`/confirmation/${orderNumber}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to place order. Please try again.');
    } finally {
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

  return (
    <div className="min-h-screen bg-cream-50 font-sans text-noir-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="font-serif text-4xl mb-8">Checkout</h1>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-sm flex items-center gap-3 text-sm text-red-700">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column: Form */}
          <form onSubmit={handlePlaceOrder} className="space-y-10">
            {/* Address */}
            <section className="bg-white p-8 rounded-sm shadow-sm border border-cream-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-2xl text-noir-900">Delivery Address</h2>
                {addresses.length > 0 && (
                  <Link href="/addresses" className="text-xs text-foil-gold font-semibold uppercase tracking-wider hover:underline flex items-center gap-1">
                    <MapPin size={12} />
                    <span>Manage Addresses</span>
                  </Link>
                )}
              </div>

              {addresses.length > 0 && (
                <div className="mb-6 p-3 bg-cream-50/70 border border-cream-200 rounded-sm">
                  <p className="text-[11px] uppercase tracking-wider font-semibold text-noir-600 mb-2">
                    Select from Saved Addresses
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {addresses.map(addr => {
                      const isSelected = addressLine1 === addr.addressLine1 && pincode === addr.pincode;
                      return (
                        <button
                          key={addr.id}
                          type="button"
                          onClick={() => {
                            setFullName(addr.fullName);
                            setPhone(addr.phone);
                            setPincode(addr.pincode);
                            setAddressLine1(addr.addressLine1);
                            setLandmark(addr.landmark || '');
                            setCityState(`${addr.city}, ${addr.state}`);
                          }}
                          className={`text-left p-2.5 rounded-sm border transition-all text-xs ${
                            isSelected 
                              ? 'border-noir-900 bg-white shadow-sm ring-1 ring-noir-900' 
                              : 'border-cream-300 hover:border-cream-400 bg-white/70'
                          }`}
                        >
                          <div className="flex items-center justify-between font-semibold text-noir-900 mb-0.5">
                            <span className="truncate">{addr.fullName}</span>
                            <span className="capitalize text-[10px] px-1.5 py-0.2 bg-cream-200 text-noir-700 rounded text-[9px] font-mono">
                              {addr.type}
                            </span>
                          </div>
                          <p className="text-noir-600 text-[11px] truncate">{addr.addressLine1}</p>
                          <p className="text-noir-500 text-[10px]">{addr.city}, {addr.pincode}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs uppercase tracking-wider mb-1 text-noir-600 font-semibold">Full Name</label>
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Recipient's name"
                    className="w-full border border-cream-300 rounded-sm p-3 focus:border-noir-900 focus:outline-none bg-cream-50 text-sm" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider mb-1 text-noir-600 font-semibold">Phone</label>
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full border border-cream-300 rounded-sm p-3 focus:border-noir-900 focus:outline-none bg-cream-50 text-sm" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider mb-1 text-noir-600 font-semibold">PIN Code</label>
                  <input 
                    type="text" 
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    onBlur={handlePincodeBlur}
                    placeholder="e.g. 560001"
                    maxLength={6}
                    className="w-full border border-cream-300 rounded-sm p-3 focus:border-noir-900 focus:outline-none bg-cream-50 text-sm" 
                    required 
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs uppercase tracking-wider mb-1 text-noir-600 font-semibold">Address Line 1</label>
                  <input 
                    type="text" 
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    placeholder="House/Flat No., Building Name, Street"
                    className="w-full border border-cream-300 rounded-sm p-3 focus:border-noir-900 focus:outline-none bg-cream-50 text-sm" 
                    required 
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs uppercase tracking-wider mb-1 text-noir-600 font-semibold">City & State (Auto-resolved)</label>
                  <input 
                    type="text" 
                    value={cityState}
                    onChange={(e) => setCityState(e.target.value)}
                    placeholder="Auto-filled on PIN entry"
                    className="w-full border border-cream-300 rounded-sm p-3 focus:border-noir-900 focus:outline-none bg-cream-100 text-sm text-noir-700" 
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs uppercase tracking-wider mb-1 text-noir-600 font-semibold">Landmark (Optional)</label>
                  <input 
                    type="text" 
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="e.g. Near Metro Station"
                    className="w-full border border-cream-300 rounded-sm p-3 focus:border-noir-900 focus:outline-none bg-cream-50 text-sm" 
                  />
                </div>
              </div>
            </section>

            {/* Delivery & Gift */}
            <section className="bg-white p-8 rounded-sm shadow-sm border border-cream-200">
              <h2 className="font-serif text-2xl mb-6">Delivery Speed</h2>
              <div className="space-y-4">
                <label 
                  onClick={() => setDeliveryOption('standard')}
                  className={`flex items-center gap-4 p-4 border rounded-sm cursor-pointer transition-colors ${
                    deliveryOption === 'standard' ? 'border-noir-950 bg-cream-50' : 'border-cream-300'
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
                      <span className="text-emerald-700 font-semibold">FREE</span>
                    </div>
                    <p className="text-xs text-noir-500 mt-0.5">Estimated 3–5 business days via BlueDart Air</p>
                  </div>
                </label>
                <label 
                  onClick={() => setDeliveryOption('express')}
                  className={`flex items-center gap-4 p-4 border rounded-sm cursor-pointer transition-colors ${
                    deliveryOption === 'express' ? 'border-noir-950 bg-cream-50' : 'border-cream-300'
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
                      <span>Express Priority Rush</span>
                      <span>₹299</span>
                    </div>
                    <p className="text-xs text-noir-500 mt-0.5">Estimated 1–2 business days dispatch</p>
                  </div>
                </label>
              </div>

              <div className="mt-6 pt-6 border-t border-cream-200">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" className="mt-1 accent-noir-900 w-4 h-4" />
                  <div>
                    <span className="font-medium block text-sm">Complimentary Gift Packaging & Personal Note</span>
                    <p className="text-xs text-noir-500">We will remove price tags and include a bespoke embossed keepsake sleeve.</p>
                  </div>
                </label>
              </div>
            </section>
          </form>

          {/* Right Column: Payment & Summary */}
          <div>
            <div className="bg-white p-8 rounded-sm shadow-sm border border-cream-200 sticky top-8">
              <h2 className="font-serif text-2xl mb-6">Order Summary</h2>
              
              <div className="space-y-3 pb-6 border-b border-cream-200 text-sm">
                <div className="flex justify-between text-noir-600">
                  <span>Subtotal ({items.length} {items.length === 1 ? 'book' : 'books'})</span>
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
                  <span>Total Amount</span>
                  <span className="font-serif text-2xl">₹{finalTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="my-6 p-3 bg-cream-50 border border-cream-200 rounded-sm flex items-center gap-2 text-xs text-noir-600">
                <Truck className="w-4 h-4 text-noir-800 shrink-0" />
                <span>Zero Risk • Insured against print defects & damage</span>
              </div>

              <button 
                onClick={handlePlaceOrder}
                disabled={isSubmitting}
                className="w-full bg-noir-950 text-cream-50 py-4 rounded-sm font-medium tracking-widest uppercase hover:bg-noir-900 transition-colors shadow-luxury-md mb-6 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-foil-gold" />
                    <span className="text-xs">{submissionStep || 'Processing Order...'}</span>
                  </>
                ) : (
                  <span>Place Order & Pay ₹{finalTotal.toLocaleString('en-IN')}</span>
                )}
              </button>

              <div className="flex items-center justify-center gap-6 text-xs text-noir-500 grayscale opacity-70">
                <div className="flex items-center gap-1"><span className="text-lg">🔒</span> SSL Encrypted</div>
                <div className="flex items-center gap-1"><span className="text-lg">🛡️</span> Razorpay Verified</div>
                <div className="flex items-center gap-1"><span className="text-lg">✨</span> 100% Guaranteed</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
