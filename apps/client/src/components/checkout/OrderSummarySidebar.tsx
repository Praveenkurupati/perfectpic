// apps/client/src/components/checkout/OrderSummarySidebar.tsx
'use client';

import React, { useState } from 'react';
import {
  Tag,
  Gift,
  Sparkles,
  ShieldCheck,
  ShoppingBag,
  Check,
  X,
  AlertCircle,
  Lock,
} from 'lucide-react';
import {
  useCartStore,
  ACCESSORY_PRICES,
} from '@/stores/useCartStore';

interface OrderSummarySidebarProps {
  deliveryOption: 'standard' | 'express';
  finalTotal: number;
}

export const OrderSummarySidebar: React.FC<OrderSummarySidebarProps> = ({
  deliveryOption,
  finalTotal,
}) => {
  const {
    items,
    getSubtotal,
    promoCode,
    discount,
    discountAmount,
    accessories,
    getAccessoriesTotal,
    getBundleDiscount,
    getPhotobookCount,
    applyPromoCode,
    removePromoCode,
  } = useCartStore();

  const [inputCode, setInputCode] = useState('');
  const [promoError, setPromoError] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  const bundleInfo = getBundleDiscount();
  const bundleDiscount = bundleInfo.discountAmount;
  const totalBooks = getPhotobookCount();
  const accessoriesTotal = getAccessoriesTotal();
  const subtotal = getSubtotal();
  const shippingFee = deliveryOption === 'express' ? 299 : 0;

  const handleApplyPromo = async () => {
    if (!inputCode.trim()) return;
    setIsApplying(true);
    setPromoError('');
    try {
      const success = await applyPromoCode(inputCode.trim());
      if (success) {
        setInputCode('');
      } else {
        setPromoError('Invalid or expired promotional code.');
      }
    } catch (err: any) {
      setPromoError(err.message || 'Failed to apply promotional code.');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-sm shadow-sm border border-cream-200 sticky top-8 space-y-6">
      <h2 className="font-serif text-2xl text-noir-900">Order Summary</h2>

      {/* Cart Line Items */}
      <div className="space-y-3 pb-4 border-b border-cream-200 max-h-72 overflow-y-auto pr-1">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 text-xs">
            {item.thumbnail ? (
              <img
                src={item.thumbnail}
                alt={item.title}
                className="w-12 h-12 object-cover rounded-xs border border-cream-200 shrink-0"
              />
            ) : (
              <div className="w-12 h-12 bg-cream-100 flex items-center justify-center rounded-xs shrink-0 text-noir-400">
                <ShoppingBag className="w-5 h-5" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <span className="font-semibold text-noir-900 block truncate">
                {item.title}
              </span>
              <span className="text-[10px] text-noir-500">
                {item.dimensions || '8.25" × 8.25"'} • {item.pageCount} Pages • Qty:{' '}
                {item.quantity || 1}
              </span>
            </div>
            <span className="font-mono font-medium text-noir-900 shrink-0">
              ₹
              {(
                (item.basePrice + (item.extraPagesPrice || 0)) *
                (item.quantity || 1)
              ).toLocaleString('en-IN')}
            </span>
          </div>
        ))}

        {/* Selected Accessories Line Items */}
        {accessories.keepsakeBox && (
          <div className="flex items-center justify-between text-xs text-noir-700 bg-cream-50/70 p-2 rounded-xs border border-cream-200">
            <span className="flex items-center gap-1.5">
              <Gift size={12} className="text-amber-600" />
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

      {/* Promo Code Input */}
      <div className="space-y-2">
        {promoCode ? (
          <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-sm text-xs">
            <div className="flex items-center gap-2 text-emerald-800">
              <Tag className="w-3.5 h-3.5" />
              <span className="font-mono font-bold tracking-wider">{promoCode}</span>
              <span className="text-[10px] text-emerald-600 font-semibold">
                (-₹{(discountAmount || Math.round(subtotal * (discount || 0))).toLocaleString('en-IN')})
              </span>
            </div>
            <button
              type="button"
              onClick={removePromoCode}
              className="text-noir-500 hover:text-noir-900 transition-colors p-1"
              title="Remove promo code"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                placeholder="PROMO CODE"
                className="flex-1 border border-cream-300 px-3 py-2 rounded-sm text-xs uppercase tracking-wider font-mono focus:outline-none focus:border-noir-950"
              />
              <button
                type="button"
                onClick={handleApplyPromo}
                disabled={isApplying || !inputCode.trim()}
                className="px-4 py-2 bg-noir-950 text-cream-50 text-xs font-semibold uppercase tracking-wider rounded-sm hover:bg-noir-900 transition-colors disabled:opacity-50"
              >
                {isApplying ? '...' : 'Apply'}
              </button>
            </div>
            {promoError && (
              <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {promoError}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Financial Breakdown Table */}
      <div className="space-y-2.5 pb-6 border-b border-cream-200 text-xs text-noir-700">
        <div className="flex justify-between">
          <span>Subtotal ({totalBooks} {totalBooks === 1 ? 'Book' : 'Books'})</span>
          <span className="font-mono">₹{subtotal.toLocaleString('en-IN')}</span>
        </div>

        {accessoriesTotal > 0 && (
          <div className="flex justify-between">
            <span>Presentation & Add-ons</span>
            <span className="font-mono">+₹{accessoriesTotal.toLocaleString('en-IN')}</span>
          </div>
        )}

        {bundleDiscount > 0 && (
          <div className="flex justify-between text-emerald-700 font-medium">
            <span>Volume Bundle Discount ({bundleInfo.qualifyingTier?.name})</span>
            <span className="font-mono">-₹{bundleDiscount.toLocaleString('en-IN')}</span>
          </div>
        )}

        {(discountAmount > 0 || (discount && discount > 0)) && (
          <div className="flex justify-between text-emerald-700 font-medium">
            <span>Promotional Voucher</span>
            <span className="font-mono">
              -₹{(discountAmount || Math.round(subtotal * (discount || 0))).toLocaleString('en-IN')}
            </span>
          </div>
        )}

        <div className="flex justify-between">
          <span>Shipping ({deliveryOption === 'express' ? 'Express Courier' : 'Standard'})</span>
          <span className="font-mono">
            {shippingFee === 0 ? (
              <span className="text-emerald-700 font-bold uppercase tracking-wider text-[10px]">
                FREE
              </span>
            ) : (
              `+₹${shippingFee}`
            )}
          </span>
        </div>
      </div>

      {/* Total Due */}
      <div className="flex items-baseline justify-between pt-1">
        <div>
          <span className="font-serif text-lg font-bold text-noir-950 block">
            Total Payable
          </span>
          <span className="text-[10px] text-noir-500 uppercase tracking-wider">
            All Taxes & GST Included
          </span>
        </div>
        <span className="font-serif text-3xl font-bold text-noir-950 font-mono">
          ₹{finalTotal.toLocaleString('en-IN')}
        </span>
      </div>

      {/* Archival Quality Trust Seals */}
      <div className="pt-4 border-t border-cream-100 space-y-2 text-[11px] text-noir-500 leading-relaxed">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Archival 200-Year Pigment Inks & Fine Art Layflat Binding</span>
        </div>
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>RBI-Authorized Payment Gateway with 256-Bit SSL Encryption</span>
        </div>
      </div>
    </div>
  );
};

export default OrderSummarySidebar;
