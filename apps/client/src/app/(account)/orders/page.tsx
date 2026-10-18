'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Check, Download, ExternalLink, HelpCircle, Search, ArrowRight, Loader2, Star, CheckCircle, Sparkles, RotateCcw } from 'lucide-react';
import { api } from '@/lib/api';
import { normalizeImageUrl } from '@/lib/urls';
import { LazyImage } from '@/components/ui/LazyImage';
import { generateGstInvoicePdf } from '@/lib/invoiceGenerator';
import { ReorderModal } from '@/components/orders/ReorderModal';

interface OrderTimelineStep {
  id: string;
  title: string;
  subtitle: string;
  completed: boolean;
  active: boolean;
  dateStr?: string;
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  title: string;
  productTitle?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  date?: string;
  createdAt?: string;
  amount: number;
  total: number;
  subtotal?: number;
  bundleSavings?: number;
  discount?: number;
  deliveryFee?: number;
  status: 'confirmed' | 'printing' | 'production' | 'qc' | 'shipped' | 'dispatched' | 'delivered' | string;
  paymentMethod?: string;
  paymentStatus?: string;
  shippingAddress?: {
    name?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    pincode?: string;
    phone?: string;
  };
  thumbnail?: string;
  coverUrl?: string;
  itemsCount?: number;
  quantity?: number;
  pageCount?: number;
  dimensions?: string;
  seriesLabel?: string;
  coverType?: string;
  binding?: string;
  items?: Array<{
    title: string;
    series?: string;
    dimensions?: string;
    coverType?: string;
    binding?: string;
    quantity: number;
    price: number;
    thumbnail?: string;
  }>;
}

const DEFAULT_ORDERS: OrderDetail[] = [
  {
    id: 'PP-000000',
    orderNumber: 'PP-000000',
    title: 'kerala · 3 books',
    productTitle: 'kerala — custom photobook',
    customerName: 'Priya Sharma',
    customerEmail: 'priya@example.com',
    customerPhone: '+919876543210',
    date: '2026-10-10',
    createdAt: new Date('2026-10-10T14:20:00.000Z').toISOString(),
    amount: 5697,
    total: 5697,
    subtotal: 5997,
    bundleSavings: 300,
    deliveryFee: 0,
    status: 'printing',
    paymentMethod: 'upi',
    paymentStatus: 'paid',
    shippingAddress: {
      name: 'Priya Sharma',
      addressLine1: 'Flat 402, Lotus Residency',
      addressLine2: 'Indiranagar 100 Feet Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560038',
      phone: '+919876543210',
    },
    thumbnail: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&auto=format&fit=crop',
    coverUrl: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&auto=format&fit=crop',
    itemsCount: 3,
    quantity: 3,
    pageCount: 32,
    dimensions: '8.25" × 8.25"',
    seriesLabel: 'travel series',
    coverType: 'hardcover',
    binding: 'lay-flat',
    items: [
      {
        title: 'kerala — custom photobook',
        series: 'travel series',
        dimensions: '8.25" × 8.25"',
        coverType: 'hardcover',
        binding: 'lay-flat',
        quantity: 3,
        price: 1999,
        thumbnail: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&auto=format&fit=crop',
      },
    ],
  },
  {
    id: 'PP-000001',
    orderNumber: 'PP-000001',
    title: 'himalaya · 1 book',
    productTitle: 'himalaya — expedition journal',
    customerName: 'Priya Sharma',
    customerEmail: 'priya@example.com',
    customerPhone: '+919876543210',
    date: '2026-10-05',
    createdAt: new Date('2026-10-05T09:15:00.000Z').toISOString(),
    amount: 1999,
    total: 1999,
    subtotal: 1999,
    bundleSavings: 0,
    deliveryFee: 0,
    status: 'delivered',
    paymentMethod: 'upi',
    paymentStatus: 'paid',
    shippingAddress: {
      name: 'Priya Sharma',
      addressLine1: 'Flat 402, Lotus Residency',
      addressLine2: 'Indiranagar 100 Feet Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560038',
      phone: '+919876543210',
    },
    thumbnail: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop',
    coverUrl: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop',
    itemsCount: 1,
    quantity: 1,
    pageCount: 32,
    dimensions: '8.25" × 8.25"',
    seriesLabel: 'monograph series',
    coverType: 'hardcover',
    binding: 'lay-flat',
    items: [
      {
        title: 'himalaya — expedition journal',
        series: 'monograph series',
        dimensions: '8.25" × 8.25"',
        coverType: 'hardcover',
        binding: 'lay-flat',
        quantity: 1,
        price: 1999,
        thumbnail: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop',
      },
    ],
  },
];

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const queryOrder = searchParams.get('order') || searchParams.get('id') || searchParams.get('search');

  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [lookupNumber, setLookupNumber] = useState('');
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);

  // Order Review & Rating State
  const [orderReview, setOrderReview] = useState<any>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewHoverRating, setReviewHoverRating] = useState<number>(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  // Sync / fetch existing review whenever selectedOrder changes
  useEffect(() => {
    if (!selectedOrder?.orderNumber) {
      setOrderReview(null);
      return;
    }

    if ((selectedOrder as any).review) {
      setOrderReview((selectedOrder as any).review);
      return;
    }

    api
      .getOrderReview(selectedOrder.orderNumber)
      .then((res) => {
        if (res?.review) {
          setOrderReview(res.review);
        } else {
          setOrderReview(null);
        }
      })
      .catch(() => {
        setOrderReview(null);
      });
  }, [selectedOrder?.orderNumber]);

  // Fetch orders dynamically from API
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const res = await api.getOrders();
        if (res.orders && res.orders.length > 0) {
          const parsedOrders: OrderDetail[] = res.orders.map((o: any) => ({
            ...o,
            id: o.id || o.orderNumber,
            orderNumber: o.orderNumber || o.id,
            amount: o.amount || o.total || 1999,
            total: o.total || o.amount || 1999,
            subtotal: o.subtotal || o.total || 1999,
            status: o.status === 'production' ? 'printing' : o.status || 'printing',
            itemsCount: o.itemsCount || o.quantity || 1,
            quantity: o.quantity || o.itemsCount || 1,
            shippingAddress: o.shippingAddress || {
              name: o.customerName || 'Customer',
              addressLine1: 'Delivery Address on File',
              city: 'Mumbai',
              state: 'Maharashtra',
              pincode: '400001',
            },
          }));

          setOrders(parsedOrders);

          // Select matching order from query param or fallback to first order
          if (queryOrder) {
            const matched = parsedOrders.find(
              (o) => o.orderNumber?.toLowerCase() === queryOrder.toLowerCase() || o.id?.toLowerCase() === queryOrder.toLowerCase()
            );
            setSelectedOrder(matched || parsedOrders[0] || null);
          } else {
            setSelectedOrder(parsedOrders[0] || null);
          }
        } else {
          // Fallback to rich dynamic defaults
          setOrders(DEFAULT_ORDERS);
          if (queryOrder) {
            const matched = DEFAULT_ORDERS.find(
              (o) => o.orderNumber?.toLowerCase() === queryOrder.toLowerCase() || o.id?.toLowerCase() === queryOrder.toLowerCase()
            );
            setSelectedOrder(matched || DEFAULT_ORDERS[0] || null);
          } else {
            setSelectedOrder(DEFAULT_ORDERS[0] || null);
          }
        }
      } catch {
        setOrders(DEFAULT_ORDERS);
        setSelectedOrder(DEFAULT_ORDERS[0] || null);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [queryOrder]);

  const handleLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupNumber.trim()) return;

    const trimmed = lookupNumber.trim();
    const found = orders.find(
      (o) => o.orderNumber?.toLowerCase() === trimmed.toLowerCase() || o.id?.toLowerCase() === trimmed.toLowerCase()
    );

    if (found) {
      setSelectedOrder(found);
      setLookupError(null);
      router.push(`/orders?order=${found.orderNumber}`);
    } else {
      setLookupError(`No order found matching "${trimmed}". Please check the order number.`);
    }
  };

  const formatPlacedDate = (dateStr?: string) => {
    if (!dateStr) return 'date';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toLowerCase();
  };

  const formatPlacedDateTime = (dateStr?: string) => {
    if (!dateStr) return 'date · time';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const datePart = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toLowerCase();
    const timePart = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase();
    return `${datePart} · ${timePart}`;
  };

  if (loading || !selectedOrder) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0A0A0A] mb-3" />
        <p className="text-sm font-medium text-[#706E69] lowercase">loading order details...</p>
      </div>
    );
  }

  const order = selectedOrder;
  const statusLower = (order.status || 'printing').toLowerCase();

  // Determine stage progression
  const isPlaced = true;
  const isPrinting = ['printing', 'production', 'qc', 'shipped', 'dispatched', 'delivered'].includes(statusLower);
  const isQc = ['qc', 'quality check', 'shipped', 'dispatched', 'delivered'].includes(statusLower);
  const isShipped = ['shipped', 'dispatched', 'delivered'].includes(statusLower);
  const isDelivered = statusLower === 'delivered';

  const timelineSteps: OrderTimelineStep[] = [
    {
      id: 'step-placed',
      title: 'order placed',
      subtitle: formatPlacedDateTime(order.createdAt || order.date),
      completed: isPlaced,
      active: statusLower === 'confirmed' || statusLower === 'placed',
    },
    {
      id: 'step-printing',
      title: 'printing',
      subtitle: 'your book is being printed on hp indigo',
      completed: isPrinting,
      active: statusLower === 'printing' || statusLower === 'production',
    },
    {
      id: 'step-qc',
      title: 'quality check',
      subtitle: 'pages, binding and finish are inspected',
      completed: isQc,
      active: statusLower === 'qc' || statusLower === 'quality check',
    },
    {
      id: 'step-shipped',
      title: 'shipped',
      subtitle: 'handed to the courier, insured',
      completed: isShipped,
      active: statusLower === 'shipped' || statusLower === 'dispatched',
    },
    {
      id: 'step-delivered',
      title: 'delivered',
      subtitle: 'at your door',
      completed: isDelivered,
      active: statusLower === 'delivered',
    },
  ];

  const primaryItem = order.items && order.items.length > 0 ? order.items[0] : null;
  const productTitle = primaryItem?.title || order.productTitle || order.title || 'custom photobook';
  const seriesText = primaryItem?.series || order.seriesLabel || 'travel series';
  const dimensionsText = primaryItem?.dimensions || order.dimensions || '8.25" × 8.25"';
  const coverBindingText = `${primaryItem?.coverType || order.coverType || 'hardcover'} · ${primaryItem?.binding || order.binding || 'lay-flat'}`;
  const quantityCount = order.quantity || order.itemsCount || primaryItem?.quantity || 1;

  const subtotal = order.subtotal || (order.total + (order.bundleSavings || 0));
  const bundleSaving = order.bundleSavings ?? order.discount ?? (subtotal > order.total ? subtotal - order.total : 0);
  const deliveryText = (order.deliveryFee === 0 || !order.deliveryFee) ? 'free' : `₹${order.deliveryFee}`;

  const address = order.shippingAddress;
  const addressName = address?.name || order.customerName || 'customer';
  const addressLine = [address?.addressLine1, address?.addressLine2].filter(Boolean).join(', ') || 'house no., street, area';
  const cityStatePincode = `${address?.city || 'city'}, ${address?.state || 'state'} — ${address?.pincode || 'pincode'}`;

  const paymentText = `${order.paymentMethod || 'upi'} · ${order.paymentStatus || 'paid'}`.toLowerCase();

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    if (!reviewComment.trim()) {
      setReviewError('Please share a few words about your photobook.');
      return;
    }

    setReviewSubmitting(true);
    setReviewError(null);
    try {
      const res = await api.submitReview({
        orderNumber: order.orderNumber,
        customerName: addressName || order.customerName || 'Verified Collector',
        customerEmail: order.customerEmail,
        customerLocation: cityStatePincode || 'India',
        rating: reviewRating,
        title: reviewTitle.trim() || undefined,
        comment: reviewComment.trim(),
        productSlug: (order as any).productSlug || 'custom-photobook',
        bookTitle: productTitle,
        category: seriesText || 'Travel',
      });

      if (res?.review) {
        setOrderReview(res.review);
      }
      setReviewComment('');
      setReviewTitle('');
    } catch (err: any) {
      setReviewError(err?.message || 'Failed to submit review. Please try again.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Page Heading */}
      <div className="mb-8 md:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[#0A0A0A] lowercase">
            track your order.
          </h1>
        </div>

        {/* Quick Order Switcher if user has multiple orders */}
        {orders.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            <span className="text-xs text-[#706E69] mr-1 lowercase shrink-0">orders:</span>
            {orders.map((o) => (
              <button
                key={o.orderNumber || o.id}
                type="button"
                onClick={() => {
                  setSelectedOrder(o);
                  router.push(`/orders?order=${o.orderNumber}`);
                }}
                className={`px-3 py-1 rounded-full text-xs font-mono font-medium transition-colors shrink-0 ${
                  order.orderNumber === o.orderNumber
                    ? 'bg-[#0A0A0A] text-white'
                    : 'bg-white border border-[#D9D6CF] text-[#706E69] hover:text-[#0A0A0A]'
                }`}
              >
                {o.orderNumber}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Top Order Summary Card */}
      <div className="bg-white border border-[#D9D6CF]/80 rounded-2xl md:rounded-3xl p-6 md:p-8 mb-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-8 md:gap-14">
          {/* Order Number */}
          <div>
            <p className="text-xs text-[#706E69] font-normal lowercase mb-1">order</p>
            <p className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-[#0A0A0A]">
              {order.orderNumber}
            </p>
          </div>

          {/* Placed Date & Books Count */}
          <div>
            <p className="text-xs text-[#706E69] font-normal lowercase mb-1">
              placed on {formatPlacedDate(order.createdAt || order.date)}
            </p>
            <p className="text-lg sm:text-xl font-bold text-[#0A0A0A] lowercase">
              {quantityCount} book{quantityCount > 1 ? 's' : ''} · ₹{order.total?.toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {/* Actions: Re-order, Contact Support & Status Badge */}
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setIsReorderModalOpen(true)}
            className="bg-amber-50 border border-amber-300 hover:bg-amber-100 text-[#0A0A0A] px-4 py-2.5 rounded-full text-xs font-semibold transition-colors lowercase flex items-center gap-1.5 shadow-2xs"
            title="Order an identical reprint copy and save 15%"
          >
            <RotateCcw size={13} className="text-amber-800" />
            <span>order another copy</span>
            <span className="text-[10px] bg-amber-200/80 text-amber-900 px-1.5 py-0.2 rounded-full font-bold">15% off</span>
          </button>

          <Link
            href="/faq"
            className="bg-white border border-[#D9D6CF] hover:bg-[#FAF9F6] text-[#0A0A0A] px-4 py-2.5 rounded-full text-xs font-medium transition-colors lowercase"
          >
            contact support
          </Link>

          {Boolean((order as any).isRushProduction || (order as any).deliveryOption === 'rush' || (order as any).productionPriority === 'RUSH') && (
            <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-3.5 py-2 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1 shadow-xs">
              <span>⚡ 24H Rush Dispatch</span>
            </span>
          )}

          <span className="bg-[#0A0A0A] text-white px-3.5 py-2 rounded-full text-xs font-semibold uppercase tracking-wider">
            {order.status}
          </span>
        </div>
      </div>

      {/* Two Column Layout: Timeline (Left) + Order Details (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
        {/* Left Column: Order Status Timeline */}
        <div className="lg:col-span-7 bg-white border border-[#D9D6CF]/80 rounded-2xl md:rounded-3xl p-6 md:p-9 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-[#0A0A0A] lowercase mb-8 md:mb-10">
              order status
            </h2>

            <div className="relative pl-2">
              {timelineSteps.map((step, idx) => {
                const isLast = idx === timelineSteps.length - 1;
                const nextStep = timelineSteps[idx + 1];
                const lineActive = step.completed && nextStep?.completed;

                return (
                  <div key={step.id} className="relative flex items-start gap-5 pb-9 last:pb-0 group">
                    {/* Connecting Vertical Line */}
                    {!isLast && (
                      <div
                        className={`absolute left-[11px] top-6 bottom-0 w-[2px] transition-colors duration-500 ${
                          lineActive ? 'bg-[#0A0A0A]' : 'bg-[#E5E2DC]'
                        }`}
                      />
                    )}

                    {/* Step Icon Node */}
                    <div className="relative z-10 shrink-0">
                      {step.completed ? (
                        <div className="w-6 h-6 rounded-full bg-[#0A0A0A] text-white flex items-center justify-center shadow-xs">
                          <Check size={13} strokeWidth={3} />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-[#D9D6CF] bg-white flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-transparent" />
                        </div>
                      )}
                    </div>

                    {/* Step Text Info */}
                    <div className="min-w-0 pt-0.5">
                      <h3
                        className={`text-sm md:text-base font-bold lowercase tracking-tight leading-snug ${
                          step.completed ? 'text-[#0A0A0A]' : 'text-[#706E69]'
                        }`}
                      >
                        {step.title}
                      </h3>
                      <p className="text-xs text-[#706E69] mt-0.5 lowercase font-normal leading-relaxed">
                        {step.subtitle}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Download Official Tax Invoice */}
          <div className="pt-8 mt-6 border-t border-[#D9D6CF]/50 flex items-center justify-between">
            <span className="text-xs text-[#706E69] lowercase font-normal">
              need an official gst invoice for your accounting?
            </span>
            <button
              type="button"
              onClick={() =>
                generateGstInvoicePdf({
                  orderNumber: order.orderNumber,
                  date: order.createdAt || order.date,
                  customerName: addressName,
                  customerEmail: order.customerEmail,
                  customerPhone: order.customerPhone,
                  shippingAddress: order.shippingAddress,
                  items: [
                    {
                      title: productTitle,
                      quantity: quantityCount,
                      price: order.total,
                      dimensions: dimensionsText,
                      pageCount: order.pageCount || 32,
                    },
                  ],
                  total: order.total,
                })
              }
              className="text-xs font-semibold text-[#0A0A0A] hover:underline flex items-center gap-1.5 lowercase"
            >
              <Download size={13} />
              <span>download invoice</span>
            </button>
          </div>

          {/* Rate & Review Your Photobook Section */}
          <div className="pt-8 mt-6 border-t border-[#D9D6CF]/60">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#5C5A55] bg-[#F4F2ED] border border-[#D9D6CF] px-2.5 py-0.5 rounded-full">
                collector review & rating
              </span>
            </div>

            {orderReview ? (
              <div className="bg-[#F4F2ED] border border-[#D9D6CF] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex text-[#0A0A0A] gap-0.5">
                    {[...Array(orderReview.rating || 5)].map((_, i) => (
                      <Star key={i} size={15} fill="currentColor" />
                    ))}
                  </div>
                  <span className="text-[11px] text-emerald-800 font-medium flex items-center gap-1">
                    <CheckCircle size={12} className="fill-emerald-100 text-emerald-700" />
                    <span>verified review saved</span>
                  </span>
                </div>

                {orderReview.title && (
                  <h4 className="text-sm font-bold text-[#0A0A0A] lowercase mb-1">
                    &ldquo;{orderReview.title}&rdquo;
                  </h4>
                )}
                <p className="text-xs text-[#2A2926] leading-relaxed lowercase">
                  {orderReview.comment}
                </p>
                <div className="mt-4 pt-3 border-t border-[#D9D6CF]/70 flex items-center justify-between text-[11px] text-[#706E69] lowercase">
                  <span>rated by you ({addressName})</span>
                  <span>thank you for supporting our artisans</span>
                </div>
              </div>
            ) : (
              <div className="bg-[#F4F2ED] border border-[#D9D6CF] rounded-2xl p-6">
                <h3 className="text-base font-bold text-[#0A0A0A] lowercase mb-1">
                  how is your photobook?
                </h3>
                <p className="text-xs text-[#706E69] lowercase mb-4">
                  share your rating on lay-flat binding, paper texture, and print color vibrancy.
                </p>

                <form onSubmit={handleSubmitReview} className="space-y-4">
                  {/* Star Rating Selector */}
                  <div>
                    <label className="block text-[11px] font-medium text-[#706E69] lowercase mb-1.5">
                      your overall rating
                    </label>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const active = (reviewHoverRating || reviewRating) >= star;
                        return (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            onMouseEnter={() => setReviewHoverRating(star)}
                            onMouseLeave={() => setReviewHoverRating(0)}
                            className="p-1 text-[#0A0A0A] hover:scale-110 transition-transform focus:outline-none"
                          >
                            <Star
                              size={22}
                              fill={active ? 'currentColor' : 'none'}
                              className={active ? 'text-[#0A0A0A]' : 'text-[#D9D6CF]'}
                            />
                          </button>
                        );
                      })}
                      <span className="text-xs font-semibold text-[#0A0A0A] ml-2 font-mono">
                        {reviewRating} of 5 stars
                      </span>
                    </div>
                  </div>

                  {/* Review Title */}
                  <div>
                    <label className="block text-[11px] font-medium text-[#706E69] lowercase mb-1">
                      headline (optional)
                    </label>
                    <input
                      type="text"
                      value={reviewTitle}
                      onChange={(e) => setReviewTitle(e.target.value)}
                      placeholder="e.g. Unbelievable print vibrancy & layflat spread"
                      className="w-full px-3.5 py-2 rounded-xl border border-[#D9D6CF] bg-white text-xs text-[#0A0A0A] focus:outline-none focus:ring-1 focus:ring-black placeholder:text-[#706E69]/60 lowercase"
                    />
                  </div>

                  {/* Review Comment */}
                  <div>
                    <label className="block text-[11px] font-medium text-[#706E69] lowercase mb-1">
                      your review *
                    </label>
                    <textarea
                      rows={3}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="describe the print vibrancy, paper thickness, slipcase packaging, and delivery experience..."
                      className="w-full px-3.5 py-2 rounded-xl border border-[#D9D6CF] bg-white text-xs text-[#0A0A0A] focus:outline-none focus:ring-1 focus:ring-black placeholder:text-[#706E69]/60 lowercase leading-relaxed"
                    />
                  </div>

                  {reviewError && (
                    <p className="text-xs text-red-600 lowercase">{reviewError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={reviewSubmitting}
                    className="w-full sm:w-auto px-6 py-2.5 bg-[#0A0A0A] text-white rounded-full text-xs font-medium hover:bg-black transition-colors lowercase flex items-center justify-center gap-2"
                  >
                    {reviewSubmitting ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        <span>submitting review...</span>
                      </>
                    ) : (
                      <span>submit order review</span>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Your Order Details */}
        <div className="lg:col-span-5 bg-white border border-[#D9D6CF]/80 rounded-2xl md:rounded-3xl p-6 md:p-9 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-[#0A0A0A] lowercase mb-6 md:mb-8">
              your order
            </h2>

            {/* Product Item Preview */}
            <div className="flex items-start gap-4">
              <div className="w-20 h-24 rounded-xl bg-[#D4CFC9]/70 overflow-hidden shrink-0 border border-[#D9D6CF]/40">
                {order.coverUrl || order.thumbnail ? (
                  <LazyImage
                    src={normalizeImageUrl(order.coverUrl || order.thumbnail)}
                    alt={productTitle}
                    className="w-full h-full object-cover"
                    containerClassName="w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full bg-[#D4CFC9]" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-[#0A0A0A] lowercase leading-snug truncate">
                  {productTitle}
                </h3>
                <p className="text-xs text-[#706E69] mt-0.5 lowercase">
                  {seriesText} · {dimensionsText}
                </p>
                <p className="text-xs text-[#706E69] lowercase">
                  {coverBindingText}
                </p>
                <p className="text-xs text-[#0A0A0A] font-medium mt-3 lowercase">
                  qty {quantityCount}
                </p>
              </div>
            </div>

            {/* Re-order Another Copy Card for Family */}
            <div className="mt-4 p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#0A0A0A] lowercase flex items-center gap-1">
                  <Sparkles size={12} className="text-amber-700" />
                  <span>want an extra copy for family?</span>
                </p>
                <p className="text-[11px] text-[#706E69] lowercase truncate">
                  reprints ship immediately with verified master pdf
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsReorderModalOpen(true)}
                className="shrink-0 bg-[#0A0A0A] hover:bg-black text-white px-3.5 py-1.5 rounded-full text-xs font-semibold lowercase flex items-center gap-1 shadow-2xs"
              >
                <span>re-order (15% off)</span>
              </button>
            </div>

            {/* Divider */}
            <div className="border-t border-[#D9D6CF]/60 my-6" />

            {/* Delivery Address */}
            <div>
              <p className="text-[11px] text-[#706E69] font-normal lowercase mb-1">
                delivery address
              </p>
              <p className="text-xs font-bold text-[#0A0A0A] lowercase leading-snug">
                {addressName}
              </p>
              <p className="text-xs text-[#0A0A0A] lowercase leading-relaxed mt-0.5">
                {addressLine}
              </p>
              <p className="text-xs text-[#0A0A0A] lowercase leading-relaxed">
                {cityStatePincode}
              </p>
            </div>

            {/* Divider */}
            <div className="border-t border-[#D9D6CF]/60 my-6" />

            {/* Payment Method */}
            <div>
              <p className="text-[11px] text-[#706E69] font-normal lowercase mb-1">
                payment
              </p>
              <p className="text-xs font-medium text-[#0A0A0A] lowercase">
                {paymentText}
              </p>
            </div>

            {/* Divider */}
            <div className="border-t border-[#D9D6CF]/60 my-6" />

            {/* Pricing Breakdown */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs text-[#5C5A55] lowercase">
                <span>subtotal</span>
                <span className="font-sans text-[#0A0A0A]">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>

              {bundleSaving > 0 && (
                <div className="flex items-center justify-between text-xs text-[#5C5A55] lowercase">
                  <span>bundle saving</span>
                  <span className="font-sans text-[#0A0A0A]">-₹{bundleSaving.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-[#5C5A55] lowercase">
                <span>delivery</span>
                <span className="font-sans text-[#0A0A0A]">{deliveryText}</span>
              </div>

              {/* Total Row */}
              <div className="border-t-2 border-[#0A0A0A] pt-3.5 mt-3 flex items-center justify-between">
                <span className="text-base font-bold text-[#0A0A0A] lowercase">total</span>
                <span className="text-xl sm:text-2xl font-bold text-[#0A0A0A] font-sans">
                  ₹{order.total?.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Search Lookup Form */}
      <div className="bg-white/80 backdrop-blur-xs border border-[#D9D6CF] rounded-2xl p-6 mb-12 max-w-xl mx-auto text-center shadow-xs">
        <p className="text-xs font-semibold text-[#0A0A0A] lowercase mb-1">
          tracking a different order?
        </p>
        <p className="text-[11px] text-[#706E69] mb-4 lowercase">
          enter your order number from your confirmation message or email
        </p>

        <form onSubmit={handleLookupSubmit} className="flex items-center gap-2 max-w-md mx-auto">
          <input
            type="text"
            value={lookupNumber}
            onChange={(e) => setLookupNumber(e.target.value)}
            placeholder="e.g. PP-000000"
            className="flex-1 px-4 py-2.5 rounded-full border border-[#D9D6CF] text-xs text-[#0A0A0A] focus:outline-none focus:ring-1 focus:ring-black uppercase font-mono"
          />
          <button
            type="submit"
            className="bg-[#0A0A0A] hover:bg-black text-white px-5 py-2.5 rounded-full text-xs font-medium transition-colors lowercase shrink-0"
          >
            track
          </button>
        </form>

        {lookupError && (
          <p className="text-xs text-red-600 mt-2.5 lowercase">{lookupError}</p>
        )}
      </div>

      {/* Bottom Copyright */}
      <div className="border-t border-[#D9D6CF]/70 pt-8 pb-12 text-left">
        <p className="text-xs text-[#706E69] lowercase font-normal">
          © 2026 perfectpic · made with love in India
        </p>
      </div>

      {/* 1-Click Re-order Modal */}
      <ReorderModal
        isOpen={isReorderModalOpen}
        onClose={() => setIsReorderModalOpen(false)}
        order={order}
      />
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-20 flex justify-center items-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#0A0A0A]" />
        </div>
      }
    >
      <TrackOrderContent />
    </Suspense>
  );
}
