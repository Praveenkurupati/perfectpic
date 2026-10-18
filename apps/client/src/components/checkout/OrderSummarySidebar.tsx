// apps/client/src/components/checkout/OrderSummarySidebar.tsx
'use client';

import React, { useState, useEffect } from 'react';
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
  BookOpen,
  Zap,
  Wallet,
  CreditCard,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  useCartStore,
  ACCESSORY_PRICES,
} from '@/stores/useCartStore';

interface OrderSummarySidebarProps {
  deliveryOption: 'standard' | 'express' | 'rush';
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
    appliedGiftCard,
    applyGiftCard,
    removeGiftCard,
    useStoreCredit,
    setUseStoreCredit,
    walletBalance,
    fetchWalletBalance,
    getPayableBeforeCredits,
    getGiftCardDeduction,
    getStoreCreditDeduction,
  } = useCartStore();

  const [inputCode, setInputCode] = useState('');
  const [promoError, setPromoError] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  // Gift card state
  const [giftCardInput, setGiftCardInput] = useState('');
  const [giftCardPin, setGiftCardPin] = useState('');
  const [giftCardError, setGiftCardError] = useState('');
  const [giftCardSuccess, setGiftCardSuccess] = useState('');
  const [isApplyingGiftCard, setIsApplyingGiftCard] = useState(false);
  const [showGiftCardForm, setShowGiftCardForm] = useState(false);

  useEffect(() => {
    fetchWalletBalance();
  }, [fetchWalletBalance]);

  const bundleInfo = getBundleDiscount();
  const bundleDiscount = bundleInfo.discountAmount;
  const totalBooks = getPhotobookCount();
  const accessoriesTotal = getAccessoriesTotal();
  const subtotal = getSubtotal();
  const shippingFee = deliveryOption === 'rush' ? 499 : deliveryOption === 'express' ? 299 : 0;
  const giftCardDeduction = getGiftCardDeduction();
  const storeCreditDeduction = getStoreCreditDeduction();
  const payableBeforeCredits = getPayableBeforeCredits();

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

  const handleApplyGiftCard = async () => {
    if (!giftCardInput.trim()) return;
    setIsApplyingGiftCard(true);
    setGiftCardError('');
    setGiftCardSuccess('');
    try {
      const res = await applyGiftCard(giftCardInput.trim(), giftCardPin.trim() || undefined);
      if (res.success) {
        setGiftCardSuccess(res.message);
        setGiftCardInput('');
        setGiftCardPin('');
      } else {
        setGiftCardError(res.message || 'Invalid gift card or PIN.');
      }
    } catch (err: any) {
      setGiftCardError(err.message || 'Failed to verify gift card.');
    } finally {
      setIsApplyingGiftCard(false);
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
        {accessories.miniBookCompanion && !accessories.miniBookDuo && (
          <div className="flex items-center justify-between text-xs text-noir-800 bg-amber-50/70 p-2 rounded-xs border border-amber-200/80">
            <span className="flex items-center gap-1.5">
              <BookOpen size={12} className="text-amber-700" />
              <span>1x Mini-Book Companion (6"×6")</span>
            </span>
            <span className="font-mono font-semibold">+₹{ACCESSORY_PRICES.miniBookCompanion}</span>
          </div>
        )}
        {accessories.miniBookDuo && (
          <div className="flex items-center justify-between text-xs text-noir-800 bg-amber-50/70 p-2 rounded-xs border border-amber-200/80">
            <span className="flex items-center gap-1.5">
              <BookOpen size={12} className="text-amber-700" />
              <span>2x Mini-Books ("Grandparents Pack")</span>
            </span>
            <span className="font-mono font-semibold">+₹{ACCESSORY_PRICES.miniBookDuo}</span>
          </div>
        )}
      </div>

      {/* Digital Store Credit Option (if customer has balance in wallet) */}
      {walletBalance > 0 && (
        <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-sm">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-emerald-900 select-none">
              <input
                type="checkbox"
                checked={useStoreCredit}
                onChange={(e) => setUseStoreCredit(e.target.checked)}
                className="accent-emerald-700 w-4 h-4 rounded cursor-pointer"
              />
              <span className="flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-emerald-700" />
                <span>Apply Store Credit</span>
              </span>
            </label>
            <span className="text-[11px] font-mono text-emerald-800">
              ₹{walletBalance.toLocaleString('en-IN')} available
            </span>
          </div>
          {useStoreCredit && storeCreditDeduction > 0 && (
            <div className="mt-2 pt-2 border-t border-emerald-200/60 flex items-center justify-between text-xs text-emerald-800 font-medium">
              <span>Credit Applied to Order:</span>
              <span className="font-mono font-bold">-₹{storeCreditDeduction.toLocaleString('en-IN')}</span>
            </div>
          )}
        </div>
      )}

      {/* Gift Card Section */}
      <div className="space-y-2">
        {appliedGiftCard ? (
          <div className="flex items-center justify-between p-3 bg-noir-950 text-cream-50 rounded-sm text-xs border border-foil-gold/40 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-foil-gold/20 border border-foil-gold/50 flex items-center justify-center shrink-0">
                <Gift className="w-3.5 h-3.5 text-foil-gold" />
              </div>
              <div>
                <span className="font-mono font-bold tracking-wider text-foil-gold block">
                  {appliedGiftCard.code}
                </span>
                <span className="text-[10px] text-cream-300 block">
                  Available: ₹{appliedGiftCard.balance.toLocaleString('en-IN')} • Deducted: ₹{giftCardDeduction.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={removeGiftCard}
              className="text-cream-400 hover:text-white transition-colors p-1"
              title="Remove gift card"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div>
            {!showGiftCardForm ? (
              <button
                type="button"
                onClick={() => setShowGiftCardForm(true)}
                className="w-full py-2 px-3 text-xs text-noir-700 bg-cream-50 hover:bg-cream-100 border border-cream-300 rounded-sm flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2 font-medium">
                  <Gift className="w-3.5 h-3.5 text-amber-600" />
                  <span>Have a Gift Card?</span>
                </span>
                <span className="text-[11px] text-foil-gold font-medium uppercase tracking-wider">
                  + Redeem
                </span>
              </button>
            ) : (
              <div className="p-3 bg-cream-50/80 border border-cream-300 rounded-sm space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-noir-900 flex items-center gap-1.5">
                    <Gift className="w-3.5 h-3.5 text-amber-600" />
                    <span>Redeem Gift Card</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowGiftCardForm(false);
                      setGiftCardError('');
                      setGiftCardSuccess('');
                    }}
                    className="text-noir-500 hover:text-noir-900 text-[10px] uppercase tracking-wider font-semibold"
                  >
                    Cancel
                  </button>
                </div>

                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={giftCardInput}
                    onChange={(e) => setGiftCardInput(e.target.value.toUpperCase())}
                    placeholder="PPGC-XXXX-XXXX-XXXX"
                    className="w-full border border-cream-300 px-3 py-1.5 rounded-sm text-xs uppercase tracking-wider font-mono focus:outline-none focus:border-noir-950 bg-white"
                  />
                  <div className="flex gap-2">
                    <input
                      type="password"
                      maxLength={4}
                      value={giftCardPin}
                      onChange={(e) => setGiftCardPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="PIN (4 Digits)"
                      className="w-32 border border-cream-300 px-3 py-1.5 rounded-sm text-xs font-mono focus:outline-none focus:border-noir-950 bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleApplyGiftCard}
                      disabled={isApplyingGiftCard || !giftCardInput.trim()}
                      className="flex-1 px-3 py-1.5 bg-noir-950 text-cream-50 text-xs font-semibold uppercase tracking-wider rounded-sm hover:bg-noir-900 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {isApplyingGiftCard ? 'Verifying...' : 'Apply Card'}
                    </button>
                  </div>
                </div>

                {giftCardError && (
                  <p className="text-[11px] text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{giftCardError}</span>
                  </p>
                )}
                {giftCardSuccess && (
                  <p className="text-[11px] text-emerald-700 flex items-center gap-1 font-medium">
                    <Check className="w-3 h-3 shrink-0" />
                    <span>{giftCardSuccess}</span>
                  </p>
                )}
              </div>
            )}
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

        <div className="flex justify-between items-center">
          <span>
            {deliveryOption === 'rush' ? (
              <span className="flex items-center gap-1.5 text-amber-900 font-medium">
                <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500 animate-pulse" />
                <span>⚡ Rush 24H Dispatch</span>
              </span>
            ) : deliveryOption === 'express' ? (
              'Shipping (Express Air)'
            ) : (
              'Shipping (Standard)'
            )}
          </span>
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

        {deliveryOption === 'rush' && (
          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded text-amber-950 text-xs flex items-start gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-snug">
              <span className="font-bold block text-amber-900">⚡ 24-Hour Dispatch SLA</span>
              <span className="text-amber-800">
                Front-of-queue priority printing & Air Express courier delivery guaranteed.
              </span>
            </div>
          </div>
        )}

        {/* Deductions from Gift Card & Store Credit */}
        {giftCardDeduction > 0 && (
          <div className="flex justify-between text-emerald-700 font-semibold pt-1 border-t border-cream-100">
            <span className="flex items-center gap-1">
              <Gift size={12} className="text-amber-600" />
              <span>Gift Card ({appliedGiftCard?.code})</span>
            </span>
            <span className="font-mono">-₹{giftCardDeduction.toLocaleString('en-IN')}</span>
          </div>
        )}

        {storeCreditDeduction > 0 && (
          <div className="flex justify-between text-emerald-700 font-semibold pt-1 border-t border-cream-100">
            <span className="flex items-center gap-1">
              <Wallet size={12} className="text-emerald-700" />
              <span>Store Credit Applied</span>
            </span>
            <span className="font-mono">-₹{storeCreditDeduction.toLocaleString('en-IN')}</span>
          </div>
        )}
      </div>

      {/* Total Due */}
      <div className="space-y-2 pt-1">
        <div className="flex items-baseline justify-between">
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

        {finalTotal === 0 && (giftCardDeduction > 0 || storeCreditDeduction > 0) && (
          <div className="p-2 bg-emerald-50 border border-emerald-300 rounded text-center text-emerald-800 text-[11px] font-semibold tracking-wide uppercase">
            ✓ 100% Covered by Gift Card / Credit (Zero Payable)
          </div>
        )}
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
