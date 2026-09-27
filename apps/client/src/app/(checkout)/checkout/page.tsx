'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/stores/useCartStore';
import { useAuthStore } from '@/stores/useAuthStore';

export default function CheckoutPage() {
  const router = useRouter();
  const { getTotal } = useCartStore();
  const { user, isAuthenticated, initialize } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    initialize();
    setMounted(true);
  }, [initialize]);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push('/login?redirect=/checkout');
    }
  }, [mounted, isAuthenticated, router]);

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/confirmation/WB-8491');
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

  return (
    <div className="min-h-screen bg-cream-50 font-sans text-noir-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="font-serif text-4xl mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column: Form */}
          <form onSubmit={handlePlaceOrder} className="space-y-10">
            {/* Address */}
            <section className="bg-white p-8 rounded-sm shadow-sm border border-cream-200">
              <h2 className="font-serif text-2xl mb-6">Delivery Address</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs uppercase tracking-wider mb-1 text-noir-600">Full Name</label>
                  <input type="text" defaultValue={user?.name || ''} className="w-full border border-cream-300 rounded-sm p-3 focus:border-foil-gold focus:outline-none" required />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider mb-1 text-noir-600">Phone</label>
                  <input type="tel" defaultValue={user?.phone || '+91 98765 43210'} className="w-full border border-cream-300 rounded-sm p-3 focus:border-foil-gold focus:outline-none" required />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider mb-1 text-noir-600">PIN Code</label>
                  <input type="text" className="w-full border border-cream-300 rounded-sm p-3 focus:border-foil-gold focus:outline-none" required />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs uppercase tracking-wider mb-1 text-noir-600">Address Line 1</label>
                  <input type="text" className="w-full border border-cream-300 rounded-sm p-3 focus:border-foil-gold focus:outline-none" required />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs uppercase tracking-wider mb-1 text-noir-600">Landmark (Optional)</label>
                  <input type="text" className="w-full border border-cream-300 rounded-sm p-3 focus:border-foil-gold focus:outline-none" />
                </div>
              </div>
            </section>

            {/* Delivery & Gift */}
            <section className="bg-white p-8 rounded-sm shadow-sm border border-cream-200">
              <h2 className="font-serif text-2xl mb-6">Delivery Options</h2>
              <div className="space-y-4">
                <label className="flex items-center gap-4 p-4 border border-foil-gold bg-cream-50 rounded-sm cursor-pointer">
                  <input type="radio" name="delivery" defaultChecked className="accent-foil-gold w-4 h-4" />
                  <div className="flex-1">
                    <div className="flex justify-between font-medium">
                      <span>Standard Delivery</span>
                      <span className="text-green-600">FREE</span>
                    </div>
                    <p className="text-xs text-noir-500">Estimated 5-7 business days</p>
                  </div>
                </label>
                <label className="flex items-center gap-4 p-4 border border-cream-300 rounded-sm cursor-pointer hover:border-cream-400">
                  <input type="radio" name="delivery" className="accent-foil-gold w-4 h-4" />
                  <div className="flex-1">
                    <div className="flex justify-between font-medium">
                      <span>Express Priority</span>
                      <span>₹299</span>
                    </div>
                    <p className="text-xs text-noir-500">Estimated 2-3 business days</p>
                  </div>
                </label>
              </div>

              <div className="mt-6 pt-6 border-t border-cream-200">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" className="mt-1 accent-noir-900 w-4 h-4" />
                  <div>
                    <span className="font-medium block">This is a gift</span>
                    <p className="text-xs text-noir-500">We will remove the invoice and you can add a free message card.</p>
                  </div>
                </label>
              </div>
            </section>
          </form>

          {/* Right Column: Payment & Summary */}
          <div>
            <div className="bg-white p-8 rounded-sm shadow-sm border border-cream-200 sticky top-8">
              <h2 className="font-serif text-2xl mb-6">Payment</h2>
              
              <div className="flex border-b border-cream-200 mb-6 text-sm">
                <button className="px-4 py-2 border-b-2 border-noir-900 font-medium">Online</button>
                <button className="px-4 py-2 border-b-2 border-transparent text-noir-500 hover:text-noir-900">Partial COD</button>
              </div>

              <div className="bg-cream-50 p-4 border border-cream-200 rounded-sm mb-6 flex items-center justify-center h-32">
                <span className="text-noir-400 text-sm">Razorpay Integration Placeholder</span>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-sm">
                  <span className="text-noir-600">Total Amount</span>
                  <span className="font-serif text-xl">₹{getTotal()}</span>
                </div>
              </div>

              <button 
                onClick={handlePlaceOrder}
                className="w-full bg-noir-950 text-cream-50 py-4 rounded-sm font-medium tracking-widest uppercase hover:bg-noir-900 transition-colors shadow-luxury-md mb-6"
              >
                Pay & Place Order
              </button>

              <div className="flex items-center justify-center gap-6 text-xs text-noir-500 grayscale opacity-70">
                <div className="flex items-center gap-1"><span className="text-lg">🔒</span> SSL Secure</div>
                <div className="flex items-center gap-1"><span className="text-lg">🛡️</span> Razorpay Verified</div>
                <div className="flex items-center gap-1"><span className="text-lg">✨</span> 100% Happiness</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
