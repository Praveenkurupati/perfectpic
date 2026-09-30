"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/stores/useCartStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { 
  Trash2, 
  ArrowRight, 
  ShoppingBag, 
  ShieldCheck, 
  Gift, 
  CheckCircle2, 
  Sparkles, 
  Tag, 
  X, 
  Loader2,
  AlertCircle
} from "lucide-react";
import { trackEvent } from "@/lib/analytics";

export default function CartPage() {
  const router = useRouter();
  const { 
    items, 
    removeItem, 
    getSubtotal, 
    getTotal, 
    discount,
    discountAmount, 
    promoCode, 
    appliedPromo,
    applyPromoCode, 
    removePromoCode,
    packagingAddon, 
    setPackagingAddon 
  } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();
  
  const [mounted, setMounted] = useState(false);
  const [inputCode, setInputCode] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const [promoMessage, setPromoMessage] = useState<{ text: string; error?: boolean } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleApplyPromo = async (codeToApply?: string) => {
    const code = (codeToApply || inputCode).trim().toUpperCase();
    if (!code) return;

    setIsApplying(true);
    setPromoMessage(null);

    const res = await applyPromoCode(code, user?.email, user?.id);
    if (res.success) {
      setPromoMessage({ text: res.message, error: false });
      setInputCode("");
    } else {
      setPromoMessage({ text: res.message, error: true });
    }
    setIsApplying(false);
  };

  const handleRemovePromo = () => {
    removePromoCode();
    setPromoMessage(null);
    setInputCode("");
  };

  const handleProceedToCheckout = () => {
    if (items.length === 0) return;
    trackEvent("cart_action", "Proceed to Checkout Clicked", {
      itemsCount: items.length,
      subtotal: getSubtotal(),
      total: getTotal(),
      promoCode: promoCode || null,
      discountAmount,
      isAuthenticated,
    });
    if (isAuthenticated) {
      router.push("/checkout");
    } else {
      router.push("/login?redirect=/checkout");
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center font-sans text-noir-900">
        <div className="w-8 h-8 border-2 border-noir-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 font-sans text-noir-900">
        <div className="w-20 h-20 bg-cream-200/80 rounded-full flex items-center justify-center mb-6">
          <ShoppingBag size={32} className="text-noir-600" />
        </div>
        <h2 className="font-serif text-3xl mb-3">Your cart is empty</h2>
        <p className="text-noir-600 max-w-md mb-8">
          It looks like you haven&apos;t added any photobooks to your cart yet. Design your first custom book in 60 seconds.
        </p>
        <Link 
          href="/templates" 
          className="inline-flex items-center space-x-2 bg-noir-950 text-cream-50 px-8 py-3.5 rounded-sm font-medium hover:bg-noir-900 transition-colors tracking-widest uppercase text-sm"
        >
          <span>Explore Templates</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  const subtotal = getSubtotal();
  const effectiveDiscount = discountAmount > 0 ? discountAmount : Math.round(subtotal * (discount || 0));

  return (
    <div className="min-h-screen bg-cream-50 py-12 font-sans text-noir-900">
      <div className="container mx-auto px-4 md:px-8 max-w-6xl">
        <h1 className="font-serif text-3xl md:text-4xl mb-8">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Items List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-sm shadow-sm border border-cream-200 divide-y divide-cream-200">
              {items.map((item) => (
                <div key={item.id} className="p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                  <div className="w-24 h-24 bg-cream-100 rounded-sm overflow-hidden flex-shrink-0 border border-cream-200">
                    <img 
                      src={item.thumbnail || "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop"} 
                      alt={item.title} 
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1">
                    <h3 className="font-serif text-lg font-medium text-noir-950">{item.title}</h3>
                    <div className="text-xs text-noir-500 mt-1 space-y-0.5">
                      <p>Format: {item.dimensions} • {item.pageCount} Pages (Lay-Flat Archival)</p>
                      <p>Theme: {item.theme.replace(/-/g, " ")}</p>
                      {item.quantity && item.quantity > 1 && (
                        <p className="font-semibold text-noir-700">Quantity: {item.quantity}</p>
                      )}
                    </div>
                    <div className="mt-3 font-medium text-noir-900">
                      ₹{((item.basePrice + (item.extraPagesPrice || 0)) * (item.quantity || 1)).toLocaleString("en-IN")}
                    </div>
                  </div>

                  <button 
                    onClick={() => removeItem(item.id)}
                    className="text-noir-400 hover:text-red-600 transition-colors p-2"
                    title="Remove item"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>

            {/* Packaging Addon */}
            <div className="bg-white p-6 rounded-sm shadow-sm border border-cream-200 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-cream-100 flex items-center justify-center text-noir-800">
                  <Gift size={20} />
                </div>
                <div>
                  <h4 className="font-medium text-sm">Add Keepsake Gift Presentation Box (+₹499)</h4>
                  <p className="text-xs text-noir-500">Rigid archival magnetic-closure box embossed with gold foil.</p>
                </div>
              </div>
              <input 
                type="checkbox" 
                checked={packagingAddon}
                onChange={(e) => setPackagingAddon(e.target.checked)}
                className="w-5 h-5 accent-noir-950 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Right Column: Order Summary & Promo Engine */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-sm shadow-sm border border-cream-200 sticky top-8 space-y-6">
              <h3 className="font-serif text-xl border-b border-cream-200 pb-3">Order Summary</h3>
              
              {/* Promo Code Input / Applied State */}
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-noir-700 mb-1.5 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-noir-800" />
                  Have a Promo Code?
                </label>

                {promoCode ? (
                  <div className="p-3 bg-emerald-50/80 border border-emerald-300 rounded-sm flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-mono font-bold text-xs uppercase text-emerald-950 tracking-wider">
                          {promoCode}
                        </span>
                        <p className="text-[11px] text-emerald-700">
                          {appliedPromo?.description || `Saved ₹${effectiveDiscount.toLocaleString("en-IN")}`}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleRemovePromo}
                      className="text-emerald-800 hover:text-red-600 text-xs font-semibold p-1 transition-colors flex items-center gap-0.5"
                      title="Remove coupon"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={inputCode}
                        onChange={(e) => setInputCode(e.target.value.toUpperCase().replace(/\s/g, ""))}
                        onKeyDown={(e) => { if (e.key === "Enter") handleApplyPromo(); }}
                        placeholder="e.g. LAUNCH20" 
                        className="flex-1 font-mono uppercase border border-cream-300 rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-noir-900 bg-cream-50" 
                      />
                      <button 
                        onClick={() => handleApplyPromo()}
                        disabled={isApplying || !inputCode.trim()}
                        className="bg-noir-950 text-cream-50 px-4 py-2 rounded-sm text-xs font-semibold tracking-wider uppercase hover:bg-noir-900 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {isApplying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Apply"}
                      </button>
                    </div>

                    {promoMessage && (
                      <div className={`p-2 rounded text-xs flex items-start gap-1.5 ${
                        promoMessage.error 
                          ? "bg-red-50 border border-red-200 text-red-700" 
                          : "bg-emerald-50 border border-emerald-200 text-emerald-800"
                      }`}>
                        {promoMessage.error ? (
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        )}
                        <span>{promoMessage.text}</span>
                      </div>
                    )}

                    {/* Quick Suggestion Chips */}
                    <div className="pt-2">
                      <span className="text-[10px] uppercase tracking-wider text-noir-400 font-semibold block mb-1.5">
                        Available Offers
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleApplyPromo("LAUNCH20")}
                          className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded bg-cream-100 hover:bg-cream-200 border border-cream-300 text-noir-800 transition-colors"
                        >
                          <Sparkles className="w-3 h-3 text-foil-gold" />
                          <span>LAUNCH20</span>
                          <span className="text-[10px] text-noir-500 font-sans">(20% OFF)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyPromo("FIRSTPIC")}
                          className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded bg-cream-100 hover:bg-cream-200 border border-cream-300 text-noir-800 transition-colors"
                        >
                          <span>FIRSTPIC</span>
                          <span className="text-[10px] text-noir-500 font-sans">(₹300 OFF)</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 text-sm pt-4 border-t border-cream-200">
                <div className="flex justify-between">
                  <span className="text-noir-600">Subtotal</span>
                  <span>₹{subtotal.toLocaleString("en-IN")}</span>
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
                    <span>-₹{effectiveDiscount.toLocaleString("en-IN")}</span>
                  </div>
                )}

                {packagingAddon && (
                  <div className="flex justify-between text-noir-600">
                    <span>Keepsake Box Addon</span>
                    <span>₹499</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-noir-600">Shipping (All-India)</span>
                  <span className="text-emerald-700 font-medium">FREE</span>
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between font-serif text-2xl pt-4 border-t border-cream-200">
                <span>Total</span>
                <span>₹{getTotal().toLocaleString("en-IN")}</span>
              </div>

              <button 
                onClick={handleProceedToCheckout}
                className="w-full bg-noir-950 text-cream-50 py-4 rounded-sm font-medium tracking-widest uppercase hover:bg-noir-900 transition-colors shadow-luxury-md"
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
