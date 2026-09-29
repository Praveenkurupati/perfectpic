'use client';

import { useState, useEffect } from 'react';
import { useCartStore } from '@/stores/useCartStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShoppingBag, Trash2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';

export default function CartPage() {
  const router = useRouter();
  const { 
    items, 
    removeItem, 
    getSubtotal, 
    getTotal, 
    discount, 
    promoCode, 
    applyPromoCode, 
    packagingAddon, 
    setPackagingAddon 
  } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  
  const [mounted, setMounted] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [promoMessage, setPromoMessage] = useState<{ text: string; error?: boolean } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleApplyPromo = () => {
    if (!inputCode.trim()) return;
    const success = applyPromoCode(inputCode.trim());
    if (success) {
      setPromoMessage({ text: 'Promo code WELCOME10 applied! 10% discount added.' });
    } else {
      setPromoMessage({ text: 'Invalid promo code. Try WELCOME10', error: true });
    }
  };

  const handleProceedToCheckout = () => {
    if (items.length === 0) return;
    trackEvent('cart_action', 'Proceed to Checkout Clicked', {
      itemsCount: items.length,
      subtotal: getSubtotal(),
      total: getTotal(),
      isAuthenticated,
    });
    if (isAuthenticated) {
      router.push('/checkout');
    } else {
      router.push('/login?redirect=/checkout');
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center font-sans text-noir-900">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-noir-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="font-serif text-lg">Loading Cart...</p>
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
            You haven't added any custom photobooks yet. Browse our curated collections to start designing your heirloom keepsake.
          </p>
          <Link
            href="/templates"
            className="inline-flex items-center justify-center gap-2 bg-noir-950 text-cream-50 px-8 py-3.5 rounded-sm text-xs font-semibold tracking-widest uppercase hover:bg-noir-900 transition-colors shadow-luxury-md"
          >
            <span>Explore Collections</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 font-sans text-noir-900 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-baseline justify-between mb-8 pb-4 border-b border-cream-200">
          <h1 className="font-serif text-4xl md:text-5xl">Your Cart</h1>
          <span className="text-xs uppercase tracking-widest text-noir-500 font-semibold">
            {items.length} {items.length === 1 ? 'Book' : 'Books'}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            {/* Cart Items */}
            {items.map(item => (
              <div key={item.id} className="flex flex-col sm:flex-row gap-6 bg-white p-6 rounded-sm shadow-sm border border-cream-200">
                <div className="w-32 h-32 bg-cream-100 rounded-sm overflow-hidden shrink-0">
                  <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="font-serif text-2xl mb-1">{item.title}</h3>
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="text-noir-400 hover:text-red-600 transition-colors p-1"
                        title="Remove photobook"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <p className="text-sm text-noir-500 mb-4">{item.dimensions} • {item.theme}</p>
                  </div>
                  
                  <div className="space-y-1.5 text-sm pt-2 border-t border-cream-100">
                    <div className="flex justify-between">
                      <span className="text-noir-600">Base Book ({item.pageCount || 40} pages)</span>
                      <span className="font-medium">₹{item.basePrice?.toLocaleString('en-IN')}</span>
                    </div>
                    {item.extraPagesPrice > 0 && (
                      <div className="flex justify-between text-noir-600">
                        <span>Extra Pages Add-on</span>
                        <span>+₹{item.extraPagesPrice?.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Add-ons */}
            <div className="bg-white p-6 rounded-sm shadow-sm border border-cream-200">
              <h3 className="font-serif text-xl mb-4">Enhance Your Order</h3>
              
              <label className="flex items-start gap-4 p-4 border border-cream-300 rounded-sm cursor-pointer hover:border-foil-gold transition-colors">
                <input 
                  type="checkbox" 
                  className="mt-1 accent-noir-900 w-4 h-4"
                  checked={packagingAddon}
                  onChange={(e) => setPackagingAddon(e.target.checked)}
                />
                <div className="flex-1">
                  <div className="flex justify-between font-medium">
                    <span>Premium Keepsake Box</span>
                    <span>₹499</span>
                  </div>
                  <p className="text-sm text-noir-500 mt-1">A beautiful linen box to preserve your memories forever.</p>
                </div>
              </label>
              
              <div className="mt-4 p-4 bg-cream-100 rounded-sm flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold block">Free Gift Included! 🎁</span>
                  <span className="text-xs text-noir-600">Polaroid Magnet Set with your order</span>
                </div>
                <span className="text-green-600 font-bold text-sm">FREE</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-sm shadow-sm border border-cream-200 sticky top-8">
              <h3 className="font-serif text-xl mb-6">Order Summary</h3>
              
              <div className="space-y-2 mb-6">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    placeholder="Promo Code (e.g. WELCOME10)" 
                    className="flex-1 border border-cream-300 rounded-sm px-3 py-2 text-sm uppercase focus:outline-none focus:border-noir-900" 
                  />
                  <button 
                    onClick={handleApplyPromo}
                    className="bg-noir-900 text-white px-4 py-2 rounded-sm text-sm font-medium hover:bg-noir-800 transition-colors"
                  >
                    Apply
                  </button>
                </div>
                {promoMessage && (
                  <p className={`text-xs ${promoMessage.error ? 'text-red-600' : 'text-emerald-700 font-medium'}`}>
                    {promoMessage.text}
                  </p>
                )}
                {promoCode && (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-700">
                    <CheckCircle2 size={13} />
                    <span>Code &apos;{promoCode}&apos; active</span>
                  </div>
                )}
              </div>

              <div className="space-y-3 text-sm mb-6 pb-6 border-b border-cream-200">
                <div className="flex justify-between">
                  <span className="text-noir-600">Subtotal</span>
                  <span>₹{getSubtotal().toLocaleString('en-IN')}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount (10%)</span>
                    <span>-₹{Math.round(getSubtotal() * discount).toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-noir-600">Shipping</span>
                  <span className="text-emerald-700 font-medium">FREE</span>
                </div>
              </div>

              <div className="flex justify-between font-serif text-2xl mb-8">
                <span>Total</span>
                <span>₹{getTotal().toLocaleString('en-IN')}</span>
              </div>

              <button 
                onClick={handleProceedToCheckout}
                className="w-full bg-noir-950 text-cream-50 py-4 rounded-sm font-medium tracking-widest uppercase hover:bg-noir-900 transition-colors"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
