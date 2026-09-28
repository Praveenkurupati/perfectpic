'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/stores/useCartStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { api } from '@/lib/api';
import Link from 'next/link';
import { ShieldCheck, Truck, Loader2, AlertCircle, CheckCircle2, ShoppingBag } from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotal, clearCart } = useCartStore();
  const { user, isAuthenticated, initialize } = useAuthStore();
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
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    initialize();
    setMounted(true);
  }, [initialize]);

  useEffect(() => {
    if (user) {
      if (user.name) setFullName(user.name);
      if (user.phone) setPhone(user.phone);
    }
  }, [user]);

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

    try {
      const orderTotal = getTotal() + (deliveryOption === 'express' ? 299 : 0);
      const orderItems = items.map(item => ({
        id: item.id,
        title: item.title,
        quantity: item.quantity || 1,
        price: item.basePrice + (item.extraPagesPrice || 0),
        dimensions: item.dimensions,
        pageCount: item.pageCount,
        thumbnail: item.thumbnail,
      }));

      const orderTitle = orderItems.length > 1
        ? `${orderItems[0]?.title || 'Photobook'} (+${orderItems.length - 1} more)`
        : (orderItems[0]?.title || 'Custom Photobook Keepsake');

      const res = await api.createOrder({
        title: orderTitle,
        items: orderItems,
        total: orderTotal,
        amount: orderTotal,
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
      clearCart();
      router.push(`/confirmation/${orderNumber}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
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
              <h2 className="font-serif text-2xl mb-6">Delivery Address</h2>
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
                  <span>₹{getTotal().toLocaleString('en-IN')}</span>
                </div>
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
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Order...</span>
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
