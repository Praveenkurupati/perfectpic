"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { useCartStore } from "@/stores/useCartStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { trackEvent } from "@/lib/analytics";
import { Check, Minus, Plus, X } from "lucide-react";

const POPULAR_TEMPLATES = [
  {
    slug: "kerala",
    series: "travel series",
    title: "kerala",
    price: 1999,
    coverImage:
      "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&auto=format&fit=crop",
  },
  {
    slug: "netravati",
    series: "trek series",
    title: "netravati",
    price: 1999,
    coverImage:
      "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop",
  },
  {
    slug: "himalaya",
    series: "trek series",
    title: "himalaya",
    price: 1999,
    coverImage:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop",
  },
  {
    slug: "wedding",
    series: "celebration",
    title: "wedding",
    price: 1999,
    coverImage:
      "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop",
  },
];

export default function CartPage() {
  const router = useRouter();
  const {
    items,
    removeItem,
    increaseQuantity,
    decreaseQuantity,
    fetchBundleTiers,
    getPhotobookCount,
    getBundleDiscount,
    getSubtotal,
    getTotal,
    discount,
    discountAmount,
    promoCode,
    applyPromoCode,
    removePromoCode,
  } = useCartStore();

  const { user, isAuthenticated } = useAuthStore();

  const [mounted, setMounted] = useState(false);
  const [discountInput, setDiscountInput] = useState("");
  const [discountStatus, setDiscountStatus] = useState<"idle" | "success" | "error">("idle");
  const [discountMessage, setDiscountMessage] = useState("");
  const [isApplyingCode, setIsApplyingCode] = useState(false);

  // Delivery Pincode checker state
  const [pincode, setPincode] = useState("");
  const [pincodeChecked, setPincodeChecked] = useState(false);
  const [pincodeMessage, setPincodeMessage] = useState<string | null>(null);

  // Remove confirmation modal state
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [itemToRemoveId, setItemToRemoveId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    fetchBundleTiers();
  }, [fetchBundleTiers]);

  // Handle promo code apply
  const handleApplyDiscount = async () => {
    const code = discountInput.trim().toUpperCase();
    if (!code) return;

    setIsApplyingCode(true);
    setDiscountStatus("idle");
    setDiscountMessage("");

    try {
      const res = await applyPromoCode(code, user?.email, user?.id);
      if (res.success) {
        setDiscountStatus("success");
        setDiscountMessage("code applied — bundle saving added");
      } else {
        setDiscountStatus("error");
        setDiscountMessage("that code isn't valid or has expired.");
      }
    } catch {
      setDiscountStatus("error");
      setDiscountMessage("that code isn't valid or has expired.");
    } finally {
      setIsApplyingCode(false);
    }
  };

  const handleClearDiscount = () => {
    removePromoCode();
    setDiscountInput("");
    setDiscountStatus("idle");
    setDiscountMessage("");
  };

  // Handle pincode check
  const handleCheckPincode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pincode.trim() || pincode.trim().length < 6) {
      setPincodeMessage("please enter a valid 6-digit pincode.");
      setPincodeChecked(true);
      return;
    }
    setPincodeChecked(true);
    setPincodeMessage("delivery available · free standard delivery in 3–5 days.");
  };

  // Trigger Remove Modal
  const promptRemoveItem = (id: string) => {
    setItemToRemoveId(id);
    setRemoveModalOpen(true);
  };

  const handleConfirmRemove = () => {
    if (itemToRemoveId) {
      removeItem(itemToRemoveId);
      setItemToRemoveId(null);
    }
    setRemoveModalOpen(false);
  };

  // Proceed to Checkout
  const handleProceedCheckout = (asGuest = false) => {
    if (items.length === 0) return;
    trackEvent("cart_action", "Proceed to Checkout Clicked", {
      itemsCount: items.length,
      asGuest,
      subtotal: getSubtotal(),
      total: getTotal(),
    });

    if (asGuest) {
      router.push("/checkout?guest=true");
    } else if (isAuthenticated) {
      router.push("/checkout");
    } else {
      router.push("/login?redirect=/checkout");
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#F4F2ED] flex items-center justify-center font-sans">
        <div className="w-7 h-7 border-2 border-[#0A0A0A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalBooks = getPhotobookCount();
  const subtotal = getSubtotal();
  const bundleInfo = getBundleDiscount();
  const bundleDiscount = bundleInfo.discountAmount;
  const promoDiscountVal =
    discountAmount > 0 ? discountAmount : Math.round(subtotal * (discount || 0));
  const totalSavings = bundleDiscount + promoDiscountVal;
  const grandTotal = getTotal();

  const totalCartCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0);

  return (
    <div className="min-h-screen bg-[#F4F2ED] text-[#0A0A0A] font-sans flex flex-col justify-between selection:bg-[#0A0A0A] selection:text-white">
      {/* 1. Top Announcement Bar */}
      <div>
        <div className="bg-[#0A0A0A] text-[#D9D6CF] py-2 px-4 text-center text-[11px] md:text-xs font-medium tracking-wide">
          bundle &amp; save · free delivery across india · 100% reprint policy
        </div>

        {/* 2. Global Header */}
        <header className="border-b border-[#D9D6CF]/70 bg-[#F4F2ED]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center" aria-label="perfectpic homepage">
              <BrandLogo variant="light" height={32} className="h-7 md:h-8 w-auto" />
            </Link>

            {/* Nav Links */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link
                href="/templates"
                className="text-xs md:text-sm font-medium text-[#2A2926] hover:text-[#0A0A0A] transition-colors lowercase"
              >
                shop
              </Link>
              <Link
                href="/templates"
                className="text-xs md:text-sm font-medium text-[#2A2926] hover:text-[#0A0A0A] transition-colors lowercase"
              >
                templates
              </Link>
              <Link
                href="/projects"
                className="text-xs md:text-sm font-medium text-[#2A2926] hover:text-[#0A0A0A] transition-colors lowercase"
              >
                my projects
              </Link>
              <Link
                href="/orders"
                className="text-xs md:text-sm font-medium text-[#2A2926] hover:text-[#0A0A0A] transition-colors lowercase"
              >
                track order
              </Link>
            </nav>

            {/* Cart Pill */}
            <Link
              href="/cart"
              className="border border-[#0A0A0A] rounded-full px-5 py-2 text-xs md:text-sm font-medium text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white transition-all lowercase"
              aria-label="Shopping Cart"
            >
              cart ({totalCartCount})
            </Link>
          </div>
        </header>
      </div>

      {/* 3. Main Content: Empty Cart vs Cart With Items */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 w-full">
        {items.length === 0 ? (
          /* ========================================================
             EMPTY CART STATE (media_1792048542783.png)
             ======================================================== */
          <div className="py-6 sm:py-12">
            {/* Empty Graphic + Callouts */}
            <div className="text-center max-w-xl mx-auto mb-16 sm:mb-24">
              {/* Minimalist Book Outline Icon in Circle */}
              <div className="w-16 h-16 rounded-full bg-white border border-[#D9D6CF] shadow-xs flex items-center justify-center mx-auto mb-6">
                <svg
                  width="24"
                  height="20"
                  viewBox="0 0 24 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-[#0A0A0A]"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="2" width="20" height="16" rx="3.5" />
                </svg>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[#0A0A0A] lowercase mb-3">
                your cart is empty.
              </h1>

              <p className="text-xs sm:text-sm md:text-base text-[#706E69] font-normal mb-8">
                start a book and it will wait for you here.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-row items-center justify-center gap-3 sm:gap-4">
                <Link
                  href="/templates"
                  className="bg-[#0A0A0A] hover:bg-black text-white px-6 sm:px-7 py-3 rounded-full text-xs sm:text-sm font-medium transition-colors shadow-xs lowercase"
                >
                  browse books
                </Link>

                <Link
                  href="/templates"
                  className="bg-white border border-[#0A0A0A] text-[#0A0A0A] hover:bg-[#FAF9F6] px-6 sm:px-7 py-3 rounded-full text-xs sm:text-sm font-medium transition-colors shadow-xs lowercase"
                >
                  explore templates
                </Link>
              </div>
            </div>

            {/* Popular Right Now Grid */}
            <div className="pt-6">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0A0A0A] lowercase mb-6 text-left">
                popular right now
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {POPULAR_TEMPLATES.map((tpl) => (
                  <Link
                    key={tpl.slug}
                    href={`/configure?template=${tpl.slug}`}
                    className="group block text-left"
                  >
                    <div className="aspect-[1/1.05] rounded-3xl bg-[#DDD8D0] overflow-hidden relative mb-3 transition-transform duration-300 group-hover:scale-102">
                      <img
                        src={tpl.coverImage}
                        alt={tpl.title}
                        className="w-full h-full object-cover group-hover:opacity-95 transition-opacity"
                        loading="lazy"
                      />
                    </div>

                    <span className="text-[11px] font-medium text-[#706E69] lowercase block mb-0.5">
                      {tpl.series}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-[#0A0A0A] lowercase leading-snug">
                      {tpl.title}
                    </h3>
                    <p className="text-xs sm:text-sm font-semibold text-[#0A0A0A] mt-0.5">
                      from ₹{tpl.price.toLocaleString("en-IN")}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================
             CART WITH ITEMS STATE (media_1792048654548.png)
             ======================================================== */
          <div>
            {/* Header: Title & Subtitle */}
            <div className="mb-8">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[#0A0A0A] lowercase">
                your cart.
              </h1>
              <p className="text-xs sm:text-sm text-[#706E69] mt-1 font-normal lowercase">
                {items.length} {items.length === 1 ? "item" : "items"}
              </p>
            </div>

            {/* Two-Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Items List & Promo Code */}
              <div className="lg:col-span-7 space-y-4">
                {items.map((item) => {
                  const unitPrice = item.basePrice + (item.extraPagesPrice || 0);
                  const itemQuantity = item.quantity || 1;
                  const itemTotal = unitPrice * itemQuantity;

                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-3xl p-5 sm:p-6 border border-[#D9D6CF]/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      {/* Left: Thumbnail & Info */}
                      <div className="flex items-start sm:items-center gap-4 min-w-0">
                        {/* Square Thumbnail */}
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#DDD8D0] overflow-hidden shrink-0">
                          <img
                            src={
                              item.thumbnail ||
                              "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&auto=format&fit=crop"
                            }
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Title, Details, Actions */}
                        <div className="min-w-0">
                          <h3 className="text-base sm:text-lg font-bold text-[#0A0A0A] lowercase leading-snug truncate">
                            {item.title} — custom photobook
                          </h3>
                          <p className="text-xs text-[#706E69] mt-0.5 mb-3 lowercase font-normal">
                            {item.theme || "travel series"} · {item.dimensions || '8.25" × 8.25"'} ·{" "}
                            {item.coverType || "hardcover"}
                          </p>

                          {/* Stepper + Action Links */}
                          <div className="flex flex-wrap items-center gap-4">
                            <Link
                              href={item.projectId ? `/studio/${item.projectId}` : "/configure"}
                              className="text-xs font-medium text-[#0A0A0A] hover:underline lowercase"
                            >
                              edit book
                            </Link>

                            <button
                              type="button"
                              onClick={() => promptRemoveItem(item.id)}
                              className="text-xs font-medium text-[#706E69] hover:text-[#0A0A0A] transition-colors lowercase"
                            >
                              remove
                            </button>

                            {/* Stepper: - N + */}
                            <div className="inline-flex items-center gap-3 border border-[#D9D6CF] rounded-full px-3 py-1 text-xs font-medium bg-white">
                              <button
                                type="button"
                                onClick={() => decreaseQuantity(item.id)}
                                className="text-[#0A0A0A] hover:opacity-60 transition-opacity p-0.5"
                                aria-label="Decrease quantity"
                              >
                                <Minus size={12} strokeWidth={2.5} />
                              </button>
                              <span className="font-semibold min-w-[12px] text-center text-[#0A0A0A]">
                                {itemQuantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => increaseQuantity(item.id)}
                                className="text-[#0A0A0A] hover:opacity-60 transition-opacity p-0.5"
                                aria-label="Increase quantity"
                              >
                                <Plus size={12} strokeWidth={2.5} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Price */}
                      <div className="text-right sm:self-center shrink-0">
                        <span className="text-lg sm:text-xl font-bold text-[#0A0A0A] font-sans">
                          ₹{itemTotal.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Discount Code Card */}
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#D9D6CF]/80 shadow-xs">
                  <label className="block text-xs font-bold text-[#0A0A0A] lowercase mb-2.5">
                    discount code
                  </label>

                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={discountInput}
                      onChange={(e) => setDiscountInput(e.target.value.toUpperCase())}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleApplyDiscount();
                      }}
                      placeholder="e.g. BUNDLE3"
                      className="flex-1 rounded-2xl border border-[#0A0A0A] px-4 py-3 text-xs sm:text-sm uppercase tracking-wider font-medium text-[#0A0A0A] bg-transparent focus:outline-none focus:ring-1 focus:ring-black"
                    />
                    <button
                      type="button"
                      onClick={handleApplyDiscount}
                      disabled={isApplyingCode || !discountInput.trim()}
                      className="bg-[#0A0A0A] hover:bg-black text-white px-6 sm:px-7 py-3 rounded-full text-xs sm:text-sm font-medium transition-colors lowercase shrink-0 disabled:opacity-50"
                    >
                      {isApplyingCode ? "applying..." : "apply"}
                    </button>
                  </div>

                  {/* Feedback states */}
                  {discountStatus === "success" && (
                    <div className="mt-3 text-xs text-[#0A0A0A] font-medium flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Check size={14} className="text-[#0A0A0A]" />
                        <span>{discountMessage}</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleClearDiscount}
                        className="text-[#706E69] hover:text-[#0A0A0A] transition-colors p-1"
                        title="Remove code"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}

                  {discountStatus === "error" && (
                    <div className="mt-3 text-xs text-[#0A0A0A] font-medium">
                      {discountMessage}
                    </div>
                  )}

                  {promoCode && discountStatus !== "success" && (
                    <div className="mt-3 text-xs text-[#0A0A0A] font-medium flex items-center justify-between">
                      <span>✓ code &ldquo;{promoCode}&rdquo; active</span>
                      <button
                        type="button"
                        onClick={handleClearDiscount}
                        className="text-xs text-[#706E69] hover:underline lowercase"
                      >
                        remove
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Order Summary Card */}
              <div className="lg:col-span-5">
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#D9D6CF]/80 shadow-xs sticky top-24">
                  <h2 className="text-xl font-bold text-[#0A0A0A] lowercase mb-5">
                    order summary
                  </h2>

                  {/* Delivery Pincode Checker */}
                  <div className="mb-5">
                    <label className="block text-xs text-[#706E69] lowercase mb-1.5">
                      delivery to pincode
                    </label>
                    <form onSubmit={handleCheckPincode} className="flex items-center gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                        placeholder="000000"
                        className="flex-1 rounded-xl border border-[#D9D6CF] px-4 py-2.5 text-xs sm:text-sm text-[#0A0A0A] tracking-wider font-mono focus:outline-none focus:ring-1 focus:ring-black"
                      />
                      <button
                        type="submit"
                        className="border border-[#0A0A0A] hover:bg-[#FAF9F6] text-[#0A0A0A] px-5 py-2.5 rounded-full text-xs sm:text-sm font-medium transition-colors lowercase shrink-0"
                      >
                        check
                      </button>
                    </form>

                    <p className="text-xs text-[#0A0A0A] font-medium mt-2 lowercase">
                      {pincodeMessage || "free delivery across india"}
                    </p>
                  </div>

                  <div className="border-t border-[#D9D6CF]/70 my-4" />

                  {/* Line Items */}
                  <div className="space-y-3 text-xs sm:text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-[#706E69] lowercase">
                        subtotal ({totalBooks} {totalBooks === 1 ? "book" : "books"})
                      </span>
                      <span className="font-medium text-[#0A0A0A]">
                        ₹{subtotal.toLocaleString("en-IN")}
                      </span>
                    </div>

                    {totalSavings > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-[#706E69] lowercase">bundle saving</span>
                        <span className="font-medium text-[#0A0A0A]">
                          −₹{totalSavings.toLocaleString("en-IN")}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <span className="text-[#706E69] lowercase">delivery</span>
                      <span className="font-medium text-[#0A0A0A] lowercase">free</span>
                    </div>
                  </div>

                  <div className="border-t border-[#D9D6CF]/70 my-4" />

                  {/* Grand Total */}
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
                      ₹{grandTotal.toLocaleString("en-IN")}
                    </span>
                  </div>

                  {/* Checkout & Guest Buttons */}
                  <div className="mt-6 space-y-2.5">
                    <button
                      type="button"
                      onClick={() => handleProceedCheckout(false)}
                      className="w-full py-4 rounded-full bg-[#0A0A0A] hover:bg-black text-white font-medium text-xs sm:text-sm transition-colors shadow-xs lowercase"
                    >
                      checkout
                    </button>

                    <button
                      type="button"
                      onClick={() => handleProceedCheckout(true)}
                      className="w-full py-4 rounded-full border border-[#0A0A0A] text-[#0A0A0A] hover:bg-[#FAF9F6] font-medium text-xs sm:text-sm transition-colors shadow-xs lowercase"
                    >
                      continue as guest
                    </button>
                  </div>

                  {/* Returning Customer Link */}
                  <div className="mt-5 text-center">
                    <Link
                      href="/login?redirect=/checkout"
                      className="text-xs text-[#706E69] hover:text-[#0A0A0A] hover:underline transition-colors lowercase"
                    >
                      returning customer? sign in to use saved addresses.
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 4. Bottom Footer */}
      <footer className="border-t border-[#D9D6CF]/70 py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <p className="text-xs text-[#706E69] lowercase font-normal">
          © 2026 perfectpic · made with love in india
        </p>
      </footer>

      {/* 5. Remove Confirmation Modal (media_1792048593432.png Modal 1) */}
      <ConfirmationModal
        isOpen={removeModalOpen}
        type="remove-book"
        onCancel={() => setRemoveModalOpen(false)}
        onConfirm={handleConfirmRemove}
      />
    </div>
  );
}
