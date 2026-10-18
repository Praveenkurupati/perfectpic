'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  X, 
  Sparkles, 
  Check, 
  Truck, 
  Gift, 
  ShieldCheck, 
  Loader2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  ArrowRight, 
  Printer, 
  RotateCcw 
} from 'lucide-react';
import { api } from '@/lib/api';
import { useCartStore } from '@/stores/useCartStore';
import { normalizeImageUrl } from '@/lib/urls';
import { LazyImage } from '@/components/ui/LazyImage';

export interface ReorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: string;
    orderNumber: string;
    title: string;
    productTitle?: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    amount?: number;
    total: number;
    subtotal?: number;
    dimensions?: string;
    pageCount?: number;
    coverType?: string;
    binding?: string;
    thumbnail?: string;
    coverUrl?: string;
    pdfUrl?: string;
    printPdfUrl?: string;
    shippingAddress?: any;
    items?: any[];
    projectSnapshot?: any;
  } | null;
}

export function ReorderModal({ isOpen, onClose, order }: ReorderModalProps) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const applyPromoCode = useCartStore((s) => s.applyPromoCode);

  const [quantity, setQuantity] = useState(1);
  const [shippingMode, setShippingMode] = useState<'original' | 'gift'>('original');
  const [giftName, setGiftName] = useState('');
  const [giftPhone, setGiftPhone] = useState('');
  const [giftAddressLine, setGiftAddressLine] = useState('');
  const [giftCity, setGiftCity] = useState('');
  const [giftState, setGiftState] = useState('');
  const [giftPincode, setGiftPincode] = useState('');
  const [giftMessage, setGiftMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !order) return null;

  const originalAddress = order.shippingAddress || {};
  const bookTitle = order.productTitle || order.title || 'Archival Custom Photobook';
  const dimensions = order.dimensions || '8.25" × 8.25"';
  const pageCount = order.pageCount || 40;
  const coverBinding = `${order.coverType || 'Hardcover'} · ${order.binding || '180° Lay-Flat'}`;
  const thumbnail = order.coverUrl || order.thumbnail || 'https://images.unsplash.com/photo-1544928147-79a2dbc1f389?w=800&auto=format&fit=crop';
  
  // Calculate pricing based on single book unit price with 15% family re-order discount
  const singleBookBasePrice = order.items?.[0]?.price || Math.round(order.total / (order.items?.[0]?.quantity || 1)) || 1999;
  const grossSubtotal = singleBookBasePrice * quantity;
  // 15% discount for re-orders
  const discountAmount = Math.round(grossSubtotal * 0.15);
  const netTotal = grossSubtotal - discountAmount;

  const handleAddToCart = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      // Add to cart store with reorder flag
      addItem({
        id: `reorder-${Date.now()}-${order.id}`,
        projectId: order.id,
        title: `${bookTitle} (Reprint)`,
        dimensions,
        pageCount,
        theme: 'Minimal Modern',
        basePrice: singleBookBasePrice,
        extraPagesPrice: 0,
        thumbnail,
        quantity,
        pdfUrl: order.pdfUrl || order.printPdfUrl,
        coverType: order.coverType || 'Hardcover',
        projectSnapshot: order.projectSnapshot,
      });

      // Apply REORDER15 discount code automatically
      await applyPromoCode('REORDER15', order.customerEmail);

      onClose();
      router.push('/cart');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Could not add re-order to cart.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDirectReorder = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const resolvedShippingAddress = shippingMode === 'original'
        ? originalAddress
        : {
            fullName: giftName.trim() || originalAddress.fullName || originalAddress.name,
            phone: giftPhone.trim() || originalAddress.phone,
            addressLine1: giftAddressLine.trim(),
            city: giftCity.trim(),
            state: giftState.trim(),
            pincode: giftPincode.trim(),
            country: 'India',
          };

      if (shippingMode === 'gift') {
        if (!giftName.trim() || !giftAddressLine.trim() || !giftPincode.trim()) {
          setErrorMessage('Please provide recipient name, delivery address line, and pincode.');
          setIsSubmitting(false);
          return;
        }
      }

      const res = await api.reorder(order.id, {
        quantity,
        shippingAddress: resolvedShippingAddress,
        isGift: shippingMode === 'gift',
        giftMessage: shippingMode === 'gift' ? giftMessage.trim() : undefined,
        promoCode: 'REORDER15',
        customerEmail: order.customerEmail,
        customerPhone: shippingMode === 'gift' ? giftPhone.trim() : order.customerPhone,
        customerName: shippingMode === 'gift' ? giftName.trim() : (originalAddress.fullName || originalAddress.name || order.customerName),
      });

      const newOrderNumber = res.orderNumber || res.id || res.reorder?.orderNumber || res.reorder?.id;
      onClose();
      router.push(`/confirmation/${newOrderNumber}`);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to place re-order. You can add to cart instead.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-[#FAF9F6] border border-[#D9D6CF] rounded-3xl w-full max-w-xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 md:p-7 border-b border-[#D9D6CF]/60 flex items-start justify-between bg-white rounded-t-3xl">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <RotateCcw size={11} className="text-amber-700" />
                <span>1-click re-order</span>
              </span>
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles size={11} className="text-emerald-600" />
                <span>15% off family copy</span>
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-[#0A0A0A] lowercase tracking-tight">
              order another copy.
            </h2>
            <p className="text-xs text-[#706E69] mt-0.5 lowercase">
              identical archival reprint · master pdf verified & ready for press
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-neutral-100 text-[#706E69] hover:text-[#0A0A0A] transition-colors"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 md:p-7 space-y-6 flex-1">
          {/* Photobook Details Preview Card */}
          <div className="bg-white border border-[#D9D6CF] rounded-2xl p-4 flex items-center gap-4 shadow-2xs">
            <div className="w-16 h-20 rounded-xl bg-neutral-200 overflow-hidden shrink-0 border border-neutral-200">
              <LazyImage
                src={normalizeImageUrl(thumbnail)}
                alt={bookTitle}
                className="w-full h-full object-cover"
                containerClassName="w-full h-full"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm md:text-base font-bold text-[#0A0A0A] lowercase truncate">
                {bookTitle}
              </h3>
              <p className="text-xs text-[#706E69] mt-0.5 lowercase">
                {dimensions} · {pageCount} pages · {coverBinding}
              </p>
              <div className="flex items-center gap-1.5 mt-2 text-[11px] font-medium text-emerald-800">
                <ShieldCheck size={13} className="text-emerald-700 shrink-0" />
                <span className="truncate">zero reproofing delay · master pdf archived</span>
              </div>
            </div>
          </div>

          {/* Quantity Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-[#0A0A0A] lowercase">
                how many copies?
              </label>
              <span className="text-xs text-[#706E69] lowercase">
                {quantity} {quantity === 1 ? 'copy' : 'copies'} selected
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center bg-white border border-[#D9D6CF] rounded-full p-1 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#0A0A0A] hover:bg-neutral-100 disabled:opacity-30 transition-colors"
                >
                  <Minus size={14} />
                </button>
                <span className="w-10 text-center font-mono font-bold text-sm text-[#0A0A0A]">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#0A0A0A] hover:bg-neutral-100 transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {[1, 2, 4].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setQuantity(preset)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      quantity === preset
                        ? 'bg-[#0A0A0A] text-white'
                        : 'bg-white border border-[#D9D6CF] text-[#706E69] hover:text-[#0A0A0A]'
                    }`}
                  >
                    {preset === 1 ? '1 Copy' : preset === 2 ? '2 Copies (Duo)' : '4 Copies (Family)'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Shipping Destination Choice */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-[#0A0A0A] lowercase block">
              where should we ship this copy?
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setShippingMode('original')}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  shippingMode === 'original'
                    ? 'bg-white border-[#0A0A0A] shadow-xs'
                    : 'bg-white/60 border-[#D9D6CF] hover:border-neutral-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#0A0A0A] lowercase flex items-center gap-1.5">
                    <Truck size={13} />
                    <span>same delivery address</span>
                  </span>
                  {shippingMode === 'original' && <Check size={14} className="text-[#0A0A0A]" />}
                </div>
                <p className="text-[11px] text-[#706E69] truncate lowercase">
                  {originalAddress.fullName || originalAddress.name || 'your saved address'}
                </p>
                <p className="text-[11px] text-[#706E69] truncate lowercase">
                  {[originalAddress.city, originalAddress.state].filter(Boolean).join(', ')} — {originalAddress.pincode || originalAddress.postalCode}
                </p>
              </button>

              <button
                type="button"
                onClick={() => setShippingMode('gift')}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  shippingMode === 'gift'
                    ? 'bg-white border-[#0A0A0A] shadow-xs'
                    : 'bg-white/60 border-[#D9D6CF] hover:border-neutral-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#0A0A0A] lowercase flex items-center gap-1.5">
                    <Gift size={13} className="text-amber-800" />
                    <span>send as gift to family</span>
                  </span>
                  {shippingMode === 'gift' && <Check size={14} className="text-[#0A0A0A]" />}
                </div>
                <p className="text-[11px] text-[#706E69] lowercase">
                  enter recipient name & address
                </p>
                <p className="text-[11px] text-amber-800 font-medium lowercase">
                  + complimentary gift ribbon & card
                </p>
              </button>
            </div>

            {/* Expanded Gift Recipient Form */}
            {shippingMode === 'gift' && (
              <div className="bg-white border border-[#D9D6CF] rounded-2xl p-4 space-y-3 mt-3 animate-in fade-in duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-[#706E69] lowercase mb-1">
                      recipient name *
                    </label>
                    <input
                      type="text"
                      value={giftName}
                      onChange={(e) => setGiftName(e.target.value)}
                      placeholder="e.g. Ramesh & Sunita Sharma"
                      className="w-full px-3 py-2 rounded-xl border border-[#D9D6CF] text-xs text-[#0A0A0A] focus:outline-none focus:ring-1 focus:ring-black lowercase"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[#706E69] lowercase mb-1">
                      recipient phone (for delivery updates)
                    </label>
                    <input
                      type="text"
                      value={giftPhone}
                      onChange={(e) => setGiftPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 rounded-xl border border-[#D9D6CF] text-xs text-[#0A0A0A] focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#706E69] lowercase mb-1">
                    delivery street address *
                  </label>
                  <input
                    type="text"
                    value={giftAddressLine}
                    onChange={(e) => setGiftAddressLine(e.target.value)}
                    placeholder="flat no., building name, street, locality"
                    className="w-full px-3 py-2 rounded-xl border border-[#D9D6CF] text-xs text-[#0A0A0A] focus:outline-none focus:ring-1 focus:ring-black lowercase"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-[#706E69] lowercase mb-1">
                      city
                    </label>
                    <input
                      type="text"
                      value={giftCity}
                      onChange={(e) => setGiftCity(e.target.value)}
                      placeholder="e.g. Pune"
                      className="w-full px-3 py-2 rounded-xl border border-[#D9D6CF] text-xs text-[#0A0A0A] focus:outline-none focus:ring-1 focus:ring-black lowercase"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[#706E69] lowercase mb-1">
                      state
                    </label>
                    <input
                      type="text"
                      value={giftState}
                      onChange={(e) => setGiftState(e.target.value)}
                      placeholder="e.g. Maharashtra"
                      className="w-full px-3 py-2 rounded-xl border border-[#D9D6CF] text-xs text-[#0A0A0A] focus:outline-none focus:ring-1 focus:ring-black lowercase"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[#706E69] lowercase mb-1">
                      pincode *
                    </label>
                    <input
                      type="text"
                      value={giftPincode}
                      onChange={(e) => setGiftPincode(e.target.value)}
                      placeholder="411001"
                      className="w-full px-3 py-2 rounded-xl border border-[#D9D6CF] text-xs text-[#0A0A0A] focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#706E69] lowercase mb-1">
                    personal gift message (printed on calligraphy card)
                  </label>
                  <textarea
                    rows={2}
                    value={giftMessage}
                    onChange={(e) => setGiftMessage(e.target.value)}
                    placeholder="e.g. Dearest Mom & Dad, sending you an identical copy of our unforgettable trip..."
                    className="w-full px-3 py-2 rounded-xl border border-[#D9D6CF] text-xs text-[#0A0A0A] focus:outline-none focus:ring-1 focus:ring-black lowercase"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Pricing Breakdown Card */}
          <div className="bg-white border border-[#D9D6CF] rounded-2xl p-4.5 space-y-2">
            <div className="flex items-center justify-between text-xs text-[#706E69] lowercase">
              <span>book unit price (qty {quantity})</span>
              <span className="font-sans text-[#0A0A0A]">₹{grossSubtotal.toLocaleString('en-IN')}</span>
            </div>

            <div className="flex items-center justify-between text-xs font-medium text-emerald-800 lowercase">
              <span className="flex items-center gap-1">
                <span>family re-order discount (15% off)</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-900 px-1.5 py-0.2 rounded-xs font-mono">REORDER15</span>
              </span>
              <span className="font-sans text-emerald-800">-₹{discountAmount.toLocaleString('en-IN')}</span>
            </div>

            <div className="flex items-center justify-between text-xs text-[#706E69] lowercase">
              <span>express all-india delivery</span>
              <span className="font-sans text-emerald-800 font-semibold">free</span>
            </div>

            <div className="border-t border-[#D9D6CF]/70 pt-3 mt-1 flex items-center justify-between">
              <div>
                <span className="text-base font-bold text-[#0A0A0A] lowercase">total payable</span>
                <p className="text-[11px] text-emerald-800 font-medium">you save ₹{discountAmount.toLocaleString('en-IN')} on this copy</p>
              </div>
              <span className="text-xl md:text-2xl font-bold font-sans text-[#0A0A0A]">
                ₹{netTotal.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 lowercase">
              {errorMessage}
            </div>
          )}
        </div>

        {/* Modal Footer / Actions */}
        <div className="p-6 border-t border-[#D9D6CF]/60 bg-white rounded-b-3xl flex flex-col sm:flex-row items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-5 py-2.5 rounded-full border border-[#D9D6CF] hover:bg-[#FAF9F6] text-xs font-semibold text-[#0A0A0A] transition-colors lowercase flex items-center justify-center gap-1.5"
          >
            <ShoppingBag size={14} />
            <span>add to cart & continue</span>
          </button>

          <button
            type="button"
            onClick={handleDirectReorder}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#0A0A0A] hover:bg-black text-white text-xs font-semibold transition-colors lowercase flex items-center justify-center gap-2 shadow-xs"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>preparing re-order...</span>
              </>
            ) : (
              <>
                <span>1-click re-order (₹{netTotal.toLocaleString('en-IN')})</span>
                <ArrowRight size={13} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
export default ReorderModal;
