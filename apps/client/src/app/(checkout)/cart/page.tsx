'use client';

import { useCartStore } from '@/stores/useCartStore';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const router = useRouter();
  const { items, getSubtotal, getTotal, discount, packagingAddon, setPackagingAddon } = useCartStore();

  return (
    <div className="min-h-screen bg-cream-50 font-sans text-noir-900 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="font-serif text-5xl mb-8">Your Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            {/* Cart Items */}
            {items.map(item => (
              <div key={item.id} className="flex gap-6 bg-white p-6 rounded-sm shadow-sm border border-cream-200">
                <div className="w-32 h-32 bg-cream-100 rounded-sm overflow-hidden shrink-0">
                  <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <h3 className="font-serif text-2xl mb-1">{item.title}</h3>
                  <p className="text-sm text-noir-500 mb-4">{item.dimensions} • {item.theme}</p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Base Book (20 pages)</span>
                      <span>₹{item.basePrice}</span>
                    </div>
                    <div className="flex justify-between text-noir-600">
                      <span>Extra Pages ({item.pageCount - 20})</span>
                      <span>+₹{item.extraPagesPrice}</span>
                    </div>
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
                  <span className="text-xs text-noir-600">Polaroid Magnet Set (Orders with 24+ pages)</span>
                </div>
                <span className="text-green-600 font-bold text-sm">FREE</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-sm shadow-sm border border-cream-200 sticky top-8">
              <h3 className="font-serif text-xl mb-6">Order Summary</h3>
              
              <div className="flex gap-2 mb-6">
                <input type="text" placeholder="Promo Code" className="flex-1 border border-cream-300 rounded-sm px-3 py-2 text-sm uppercase" />
                <button className="bg-noir-900 text-white px-4 py-2 rounded-sm text-sm font-medium hover:bg-noir-800">Apply</button>
              </div>

              <div className="space-y-3 text-sm mb-6 pb-6 border-b border-cream-200">
                <div className="flex justify-between">
                  <span className="text-noir-600">Subtotal</span>
                  <span>₹{getSubtotal()}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-₹{getSubtotal() * discount}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-noir-600">Shipping</span>
                  <span className="text-green-600">FREE</span>
                </div>
              </div>

              <div className="flex justify-between font-serif text-2xl mb-8">
                <span>Total</span>
                <span>₹{getTotal()}</span>
              </div>

              <button 
                onClick={() => router.push('/auth')}
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
