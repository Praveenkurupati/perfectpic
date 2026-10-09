'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useCartStore } from '@/stores/useCartStore';
import { 
  Download, 
  Star, 
  CheckCircle2, 
  X, 
  MessageSquare, 
  ThumbsUp, 
  Sparkles, 
  Loader2,
  PackageCheck,
  Check,
  ShoppingBag
} from 'lucide-react';
import { generateGstInvoicePdf } from '@/lib/invoiceGenerator';
import { generateBookProofPdf, generateBookPdfBlob } from '@/lib/pdfGenerator';
import { LazyImage } from '@/components/ui/LazyImage';
import { Pagination } from '@/components/ui/Pagination';

interface OrderReview {
  rating: number;
  printQuality: number;
  bindingQuality: number;
  packagingQuality: number;
  feedback: string;
  recommend: boolean;
  reviewerName: string;
  submittedAt: string;
}

export default function OrdersPage() {
  const router = useRouter();
  const { addItem, setAccessory, setPackagingAddon, setIsGift } = useCartStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(5);
  const [reorderNotification, setReorderNotification] = useState<string | null>(null);

  // Review modal state
  const [selectedOrderForReview, setSelectedOrderForReview] = useState<any | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState<string | null>(null);

  // Form ratings
  const [overallRating, setOverallRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [printQuality, setPrintQuality] = useState(5);
  const [bindingQuality, setBindingQuality] = useState(5);
  const [packagingQuality, setPackagingQuality] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [recommend, setRecommend] = useState(true);
  const [generatingPdfOrderId, setGeneratingPdfOrderId] = useState<string | null>(null);

  const handleDownloadOrderPhotobookPdf = async (order: any) => {
    const orderId = order.orderNumber || order.id;
    setGeneratingPdfOrderId(orderId);

    try {
      // 1. Check if snapshot exists in order object or in localStorage
      let snapshot = order.projectSnapshot || order.projectManifest;
      if (!snapshot && typeof window !== 'undefined') {
        try {
          snapshot = JSON.parse(
            localStorage.getItem(`pp_snapshot_${order.projectId}`) ||
            localStorage.getItem(`pp_snapshot_${orderId}`) ||
            'null'
          );
        } catch {}
      }

      // If snapshot is available, generate the high-res photobook with all photos (exact match to 3D Preview)
      if (snapshot) {
        await generateBookProofPdf({
          title: snapshot.title || order.title || 'Curated Photobook',
          subtitle: snapshot.subtitle,
          seriesLabel: snapshot.seriesLabel,
          dimensions: snapshot.dimensions || order.dimensions || '8.25" × 8.25"',
          pageCount: snapshot.pageCount || order.pageCount || 32,
          theme: snapshot.theme || order.theme || 'Minimal Modern',
          coverImage: snapshot.coverImage || order.coverUrl || order.thumbnail,
          coverColor: snapshot.coverColor,
          coverConfig: snapshot.coverConfig,
          photos: snapshot.photos,
          pagePhotos: snapshot.pagePhotos,
          slotPhotos: snapshot.slotPhotos,
          slotCrops: snapshot.slotCrops,
          pageLayouts: snapshot.pageLayouts,
          pageBackgrounds: snapshot.pageBackgrounds,
          projectId: snapshot.projectId || order.projectId || orderId,
        });

        // Background sync to S3 so subsequent downloads have verified file
        try {
          const blob = await generateBookPdfBlob({
            title: snapshot.title || order.title || 'Curated Photobook',
            subtitle: snapshot.subtitle,
            seriesLabel: snapshot.seriesLabel,
            dimensions: snapshot.dimensions || order.dimensions || '8.25" × 8.25"',
            pageCount: snapshot.pageCount || order.pageCount || 32,
            theme: snapshot.theme || order.theme || 'Minimal Modern',
            coverImage: snapshot.coverImage || order.coverUrl || order.thumbnail,
            coverColor: snapshot.coverColor,
            coverConfig: snapshot.coverConfig,
            photos: snapshot.photos,
            pagePhotos: snapshot.pagePhotos,
            slotPhotos: snapshot.slotPhotos,
            slotCrops: snapshot.slotCrops,
            pageLayouts: snapshot.pageLayouts,
            pageBackgrounds: snapshot.pageBackgrounds,
            projectId: snapshot.projectId || order.projectId || orderId,
          });

          const uploadRes = await api.uploadPdf(blob, `Photobook-${orderId}.pdf`, orderId);
          if (uploadRes?.url) {
            await api.updateOrderPdf(orderId, uploadRes.url).catch(() => {});
            setOrders(prev => prev.map(o => (o.orderNumber || o.id) === orderId ? { ...o, pdfUrl: uploadRes.url } : o));
          }
        } catch (uploadErr) {
          console.warn('Background S3 upload notice:', uploadErr);
        }
        return;
      }

      // 2. If no client snapshot, check if order.pdfUrl exists and trigger download
      if (order.pdfUrl) {
        const link = document.createElement('a');
        link.href = order.pdfUrl;
        link.target = '_blank';
        link.download = `Photobook-${orderId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      // 3. Fallback: generate high-res proof with available order photos
      await generateBookProofPdf({
        title: order.title || 'Curated Photobook',
        dimensions: order.dimensions || '8.25" × 8.25"',
        pageCount: order.pageCount || 32,
        coverImage: order.coverUrl || order.thumbnail,
        photos: order.photos || (order.thumbnail ? [order.thumbnail] : []),
        projectId: order.projectId || orderId,
      });
    } catch (err: any) {
      console.error('Failed to generate photobook PDF:', err);
      alert('Could not download photobook PDF. Please try again.');
    } finally {
      setGeneratingPdfOrderId(null);
    }
  };

  const handleReorderOrder = (order: any) => {
    const orderNum = order.orderNumber || order.id || 'order';
    const primaryItem = order.items && order.items.length > 0 ? order.items[0] : null;

    const title = primaryItem?.title || order.title || 'Curated Photobook Keepsake';
    const dimensions = primaryItem?.dimensions || order.dimensions || '8.25" × 8.25"';
    const pageCount = primaryItem?.pageCount || order.pageCount || 40;
    const theme = primaryItem?.theme || order.theme || 'Minimal Modern';
    const basePrice = primaryItem?.price || order.pricing?.subtotal || order.total || order.amount || 1999;
    const thumbnail = primaryItem?.thumbnail || order.coverUrl || order.thumbnail || 'https://images.unsplash.com/photo-1544928147-79a2dbc1f389?q=80&w=300&auto=format&fit=crop';

    addItem({
      id: `reorder-${orderNum}-${Date.now()}`,
      projectId: order.projectId || `proj-${orderNum}`,
      title,
      dimensions,
      pageCount,
      theme,
      basePrice,
      extraPagesPrice: 0,
      thumbnail,
      quantity: 1,
      projectSnapshot: order.projectSnapshot || undefined,
    });

    if (order.packaging) {
      if (order.packaging.keepsakeBox !== undefined) setAccessory('keepsakeBox', !!order.packaging.keepsakeBox);
      if (order.packaging.giftWrap !== undefined) setAccessory('giftWrap', !!order.packaging.giftWrap);
      if (order.packaging.uvGlaze !== undefined) setAccessory('uvGlaze', !!order.packaging.uvGlaze);
      if (order.packaging.miniPolaroids !== undefined) setAccessory('miniPolaroids', !!order.packaging.miniPolaroids);
      setPackagingAddon(true);
    }
    if (order.isGift !== undefined) {
      setIsGift(!!order.isGift);
    }

    setReorderNotification(`Added another copy of "${title}" to your cart! Redirecting to checkout...`);
    setTimeout(() => {
      router.push('/cart');
    }, 500);
  };

  useEffect(() => {
    api.getOrders()
      .then(res => {
        const fetchedOrders = res.orders || [];
        // Augment with locally cached reviews if any
        const enriched = fetchedOrders.map((o: any) => {
          const cached = getCachedReview(o.orderNumber || o.id);
          if (cached && !o.review) {
            return { ...o, review: cached };
          }
          return o;
        });
        setOrders(enriched);
      })
      .catch(err => {
        console.warn("Failed to fetch orders from server:", err);
        setOrders([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const getCachedReview = (orderId: string): OrderReview | null => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(`pp_review_${orderId}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const setCachedReview = (orderId: string, review: OrderReview) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`pp_review_${orderId}`, JSON.stringify(review));
      } catch (e) {
        console.warn('Failed to cache review:', e);
      }
    }
  };

  const getStatusColor = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'delivered') return 'text-emerald-800 bg-emerald-50 border-emerald-300';
    if (s === 'dispatched') return 'text-indigo-800 bg-indigo-50 border-indigo-300';
    if (s === 'qc') return 'text-cyan-800 bg-cyan-50 border-cyan-300';
    if (s === 'printing') return 'text-amber-800 bg-amber-50 border-amber-300';
    if (s === 'production') return 'text-purple-800 bg-purple-50 border-purple-300';
    if (s === 'confirmed') return 'text-blue-800 bg-blue-50 border-blue-300';
    return 'text-noir-700 bg-cream-100 border-cream-300';
  };

  const getStatusLabel = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'delivered') return 'Delivered';
    if (s === 'dispatched') return 'Dispatched (In Transit)';
    if (s === 'qc') return 'Quality Check (QC Passed)';
    if (s === 'printing') return 'Printing on Press';
    if (s === 'production') return 'In Production (Prepress)';
    if (s === 'confirmed') return 'Order Confirmed';
    return (status || 'Processing').toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handleOpenReviewModal = (order: any) => {
    setSelectedOrderForReview(order);
    const existing = order.review || getCachedReview(order.orderNumber || order.id);
    if (existing) {
      setOverallRating(existing.rating || 5);
      setPrintQuality(existing.printQuality || 5);
      setBindingQuality(existing.bindingQuality || 5);
      setPackagingQuality(existing.packagingQuality || 5);
      setFeedback(existing.feedback || '');
      setRecommend(existing.recommend ?? true);
    } else {
      setOverallRating(5);
      setPrintQuality(5);
      setBindingQuality(5);
      setPackagingQuality(5);
      setFeedback('');
      setRecommend(true);
    }
    setReviewSuccessMsg(null);
    setReviewModalOpen(true);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForReview) return;

    setSubmittingReview(true);
    const orderId = selectedOrderForReview.orderNumber || selectedOrderForReview.id;
    const reviewData: OrderReview = {
      rating: overallRating,
      printQuality,
      bindingQuality,
      packagingQuality,
      feedback: feedback.trim(),
      recommend,
      reviewerName: selectedOrderForReview.customerName || 'Valued Customer',
      submittedAt: new Date().toISOString(),
    };

    try {
      await api.submitReview(orderId, reviewData);
    } catch (err: any) {
      console.warn('Backend review submission fallback to local store:', err.message);
    }

    setCachedReview(orderId, reviewData);

    // Update local orders list state
    setOrders(prev => prev.map(o => {
      if ((o.orderNumber || o.id) === orderId) {
        return { ...o, review: reviewData };
      }
      return o;
    }));

    setSubmittingReview(false);
    setReviewSuccessMsg('Thank you! Your feedback helps us maintain heirloom quality.');

    setTimeout(() => {
      setReviewModalOpen(false);
      setReviewSuccessMsg(null);
    }, 1500);
  };

  const getRatingLabel = (score: number) => {
    switch (score) {
      case 1: return '1 - Needs Improvement';
      case 2: return '2 - Fair Quality';
      case 3: return '3 - Good Photobook';
      case 4: return '4 - Great Experience';
      case 5: return '5 - Exceptional Heirloom';
      default: return '5 - Exceptional Heirloom';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-cream-200">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-noir-900">Your Orders</h2>
          <p className="text-xs text-noir-500 uppercase tracking-wider mt-0.5">
            Track production, download tax invoices, and rate delivered keepsakes
          </p>
        </div>
        <span className="text-xs text-noir-500 uppercase tracking-wider">{orders.length} order(s) found</span>
      </div>

      {reorderNotification && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-950 px-4 py-3 rounded-sm flex items-center gap-2 text-xs font-semibold animate-fade-in shadow-xs">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{reorderNotification}</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="bg-white p-6 rounded-sm shadow-sm border border-cream-200 flex flex-col md:flex-row md:items-center justify-between gap-6 animate-pulse">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-cream-200 rounded-sm shrink-0"></div>
                <div className="space-y-2">
                  <div className="h-6 bg-cream-200 w-32 rounded-sm"></div>
                  <div className="h-4 bg-cream-200 w-48 rounded-sm"></div>
                  <div className="h-5 bg-cream-200 w-20 rounded-sm"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          {orders.length === 0 ? (
            <div className="bg-white p-12 text-center border border-cream-200 rounded-sm">
              <p className="text-noir-500 mb-4">You have no orders yet.</p>
              <a href="/configure" className="text-sm font-medium border border-noir-900 px-4 py-2 rounded-sm hover:bg-cream-50">Start Creating</a>
            </div>
          ) : (
            (() => {
              const totalPages = Math.max(1, Math.ceil(orders.length / pageSize));
              const paginatedOrders = orders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

              return (
                <>
                  {paginatedOrders.map(order => {
                    const isDelivered = order.status?.toLowerCase() === 'delivered';
                    const review = order.review || getCachedReview(order.orderNumber || order.id);

                    return (
                      <div 
                        key={order.id || order.orderNumber} 
                        className="bg-white p-6 rounded-sm shadow-luxury-xs border border-cream-200 hover:border-cream-300 transition-all flex flex-col justify-between gap-6"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                          {/* Left: Book Cover + Details */}
                          <div className="flex items-start sm:items-center gap-5">
                            <div className="w-20 h-20 bg-cream-100 rounded-sm overflow-hidden shrink-0 border border-cream-200 shadow-sm relative">
                              <LazyImage 
                                src={order.coverUrl || order.thumbnail || "https://images.unsplash.com/photo-1544928147-79a2dbc1f389?q=80&w=150&auto=format&fit=crop"} 
                                alt="Cover" 
                                className="w-full h-full object-cover"
                                containerClassName="w-full h-full" 
                              />
                            </div>
                            <div>
                        <h3 className="font-serif text-xl font-medium text-noir-950 mb-1">{order.title}</h3>
                        <p className="text-xs text-noir-500 mb-2 font-mono">
                          Order #{order.orderNumber || order.id} • {formatDate(order.createdAt || order.date)}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[11px] px-2.5 py-0.5 rounded-sm border ${getStatusColor(order.status)} font-semibold tracking-wider uppercase`}>
                            {getStatusLabel(order.status)}
                          </span>

                          {/* Archival Packaging Badges */}
                          {order.packaging?.keepsakeBox && (
                            <span className="text-[10px] bg-cream-100 text-noir-800 px-2 py-0.5 rounded-xs border border-cream-200 font-medium">
                              🎁 Velvet Box
                            </span>
                          )}
                          {order.packaging?.giftWrap && (
                            <span className="text-[10px] bg-cream-100 text-noir-800 px-2 py-0.5 rounded-xs border border-cream-200 font-medium">
                              🎀 Ribbon Wrap
                            </span>
                          )}
                          {order.packaging?.uvGlaze && (
                            <span className="text-[10px] bg-cream-100 text-noir-800 px-2 py-0.5 rounded-xs border border-cream-200 font-medium">
                              🛡️ UV Glaze
                            </span>
                          )}
                          {order.packaging?.miniPolaroids && (
                            <span className="text-[10px] bg-cream-100 text-noir-800 px-2 py-0.5 rounded-xs border border-cream-200 font-medium">
                              📷 10 Polaroids
                            </span>
                          )}

                          {isDelivered && review && (
                            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 bg-amber-50 border border-foil-gold/40 text-amber-900 rounded-sm font-semibold">
                              <Star size={11} className="fill-amber-500 text-amber-500" />
                              <span>Rated {review.rating}.0 / 5</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Price + Action Buttons */}
                    <div className="flex md:flex-col items-center md:items-end justify-between gap-3 border-t md:border-t-0 pt-4 md:pt-0 border-cream-200">
                      <span className="font-serif text-2xl font-semibold text-noir-950">
                        ₹{(order.total || order.amount)?.toLocaleString('en-IN')}
                      </span>
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* GST Invoice Button */}
                        <button 
                          onClick={() => generateGstInvoicePdf({
                            orderNumber: order.orderNumber || order.id,
                            date: order.createdAt || order.date,
                            customerName: order.customerName || 'Valued Customer',
                            customerEmail: order.customerEmail,
                            customerPhone: order.customerPhone,
                            shippingAddress: order.shippingAddress,
                            items: order.items && order.items.length > 0 ? order.items : [
                              {
                                title: order.title || 'Custom Photobook Keepsake',
                                quantity: 1,
                                price: Math.max(0, (order.total || order.amount || 1999) - (order.packaging?.total || 0)),
                                dimensions: order.dimensions || '8.25" × 8.25"',
                                pageCount: order.pageCount || 40,
                              },
                              ...(order.packaging?.keepsakeBox ? [{ title: 'Keepsake Velvet Presentation Box', quantity: 1, price: 499, pageCount: 0 }] : []),
                              ...(order.packaging?.giftWrap ? [{ title: 'Artisan Ribbon Wrap & Calligraphy Card', quantity: 1, price: 199, pageCount: 0 }] : []),
                              ...(order.packaging?.uvGlaze ? [{ title: 'Archival UV Anti-Scratch Page Glaze', quantity: 1, price: 249, pageCount: 0 }] : []),
                              ...(order.packaging?.miniPolaroids ? [{ title: '10 Mini Polaroid Keepsake Prints', quantity: 1, price: 149, pageCount: 0 }] : []),
                            ],
                            total: order.total || order.amount || 1999,
                          })}
                          className="text-xs font-medium border border-cream-300 px-3 py-2 rounded-sm hover:bg-cream-100 transition-colors flex items-center gap-1.5 text-noir-700 shadow-sm"
                          title="Download Official GST Tax Invoice"
                        >
                          <Download size={13} />
                          <span>GST Invoice</span>
                        </button>

                        {/* Ultra-HD Photobook PDF Button */}
                        <button
                          onClick={() => handleDownloadOrderPhotobookPdf(order)}
                          disabled={generatingPdfOrderId === (order.orderNumber || order.id)}
                          className="text-xs font-medium border border-amber-300 bg-amber-50/60 hover:bg-amber-100 disabled:opacity-60 text-noir-900 px-3 py-2 rounded-sm transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                          title="Download Ultra-HD Photobook PDF with high-resolution photos"
                        >
                          {generatingPdfOrderId === (order.orderNumber || order.id) ? (
                            <>
                              <Loader2 size={13} className="text-foil-gold animate-spin" />
                              <span>Generating PDF...</span>
                            </>
                          ) : (
                            <>
                              <Download size={13} className="text-foil-gold" />
                              <span>Photobook PDF</span>
                            </>
                          )}
                        </button>

                        {/* Rate & Review Button for Delivered Orders */}
                        {isDelivered && (
                          <button
                            onClick={() => handleOpenReviewModal(order)}
                            className="text-xs font-semibold uppercase tracking-wider px-3.5 py-2 rounded-sm transition-all flex items-center gap-1.5 bg-amber-50 text-amber-900 border border-foil-gold/60 hover:bg-amber-100 shadow-sm"
                          >
                            <Star size={13} className="fill-amber-500 text-amber-500" />
                            <span>{review ? 'Edit Review' : 'Rate & Review'}</span>
                          </button>
                        )}

                        {/* One-Click Photobook Reorder Flow (PROD-02) */}
                        <button
                          onClick={() => handleReorderOrder(order)}
                          className="text-xs font-semibold uppercase tracking-wider bg-noir-950 text-cream-50 hover:bg-noir-900 px-3.5 py-2 rounded-sm transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                          title="Add an exact duplicate copy of this keepsake directly to cart"
                        >
                          <ShoppingBag size={13} className="text-foil-gold" />
                          <span>Order Another Copy</span>
                        </button>

                        {/* Track Order for in-flight orders */}
                        {!isDelivered && (
                          <a 
                            href={`/confirmation/${order.orderNumber || order.id}`}
                            className="text-xs font-semibold uppercase tracking-wider border border-noir-900 px-3.5 py-2 rounded-sm hover:bg-noir-950 hover:text-cream-50 transition-colors"
                          >
                            Track Order
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Production & Fulfillment Progress Stepper */}
                  <div className="pt-3 border-t border-cream-100">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-noir-600 mb-2 gap-1">
                      <span className="font-semibold text-noir-900 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                        <span>Fulfillment Stage: {getStatusLabel(order.status)}</span>
                      </span>
                      {order.shippingDetails?.trackingNumber && (
                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          <span>{order.shippingDetails.carrier || 'BlueDart'}: {order.shippingDetails.trackingNumber}</span>
                          {order.shippingDetails.trackingUrl && (
                            <a
                              href={order.shippingDetails.trackingUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="underline hover:text-indigo-950 font-bold"
                            >
                              Track
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Stage Milestones */}
                    <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
                      {[
                        { id: 'confirmed', label: 'Confirmed' },
                        { id: 'production', label: 'Production' },
                        { id: 'printing', label: 'Printing' },
                        { id: 'qc', label: 'QC Check' },
                        { id: 'dispatched', label: 'Dispatched' },
                        { id: 'delivered', label: 'Delivered' },
                      ].map((st, sIdx) => {
                        const stageOrder = ['confirmed', 'production', 'printing', 'qc', 'dispatched', 'delivered'];
                        const currentIdx = stageOrder.indexOf((order.status || 'confirmed').toLowerCase());
                        const isPast = currentIdx > sIdx;
                        const isCurrent = currentIdx === sIdx;

                        return (
                          <div key={st.id} className="text-center">
                            <div className={`h-1.5 rounded-full mb-1 transition-all ${
                              isPast ? 'bg-emerald-600' : isCurrent ? 'bg-noir-950 animate-pulse' : 'bg-cream-200'
                            }`} />
                            <span className={`text-[9px] sm:text-[10px] block truncate font-medium ${
                              isCurrent ? 'text-noir-950 font-bold' : isPast ? 'text-emerald-700' : 'text-noir-400'
                            }`}>
                              {st.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Customer Review Snippet if reviewed */}
                  {review && review.feedback && (
                    <div className="mt-2 pt-3 border-t border-cream-100 bg-cream-50/50 p-3 rounded-sm flex items-start gap-2.5">
                      <MessageSquare size={14} className="text-foil-gold shrink-0 mt-0.5" />
                      <div className="text-xs text-noir-700">
                        <span className="font-semibold text-noir-900 mr-2">Your Feedback:</span>
                        &ldquo;{review.feedback}&rdquo;
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {orders.length > pageSize && (
              <div className="pt-2 border-t border-cream-200">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={orders.length}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  itemLabel="orders"
                />
              </div>
            )}
          </>
        );
      })()
    )}
  </div>
)}

      {/* Review Modal */}
      {reviewModalOpen && selectedOrderForReview && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-cream-300 rounded-sm shadow-luxury-2xl max-w-lg w-full p-6 md:p-8 my-8 relative">
            <button
              onClick={() => setReviewModalOpen(false)}
              className="absolute top-5 right-5 text-noir-400 hover:text-noir-900 transition-colors p-1"
            >
              <X size={20} />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-4 mb-6 pb-4 border-b border-cream-200">
              <div className="w-14 h-14 bg-cream-100 rounded-sm overflow-hidden shrink-0 border border-cream-200 relative">
                <LazyImage
                  src={selectedOrderForReview.coverUrl || selectedOrderForReview.thumbnail || "https://images.unsplash.com/photo-1544928147-79a2dbc1f389?q=80&w=150&auto=format&fit=crop"}
                  alt="Book Cover"
                  className="w-full h-full object-cover"
                  containerClassName="w-full h-full"
                />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-foil-gold flex items-center gap-1">
                  <PackageCheck size={12} />
                  <span>Delivered Keepsake Review</span>
                </span>
                <h3 className="font-serif text-xl font-semibold text-noir-950 mt-0.5">
                  {selectedOrderForReview.title}
                </h3>
                <p className="text-xs text-noir-500 font-mono">
                  Order #{selectedOrderForReview.orderNumber || selectedOrderForReview.id}
                </p>
              </div>
            </div>

            {reviewSuccessMsg ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 size={28} />
                </div>
                <h4 className="font-serif text-xl text-noir-900 font-semibold">Review Saved</h4>
                <p className="text-xs text-noir-600 max-w-xs mx-auto">{reviewSuccessMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-5">
                {/* 1. Overall Star Rating */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs uppercase tracking-wider text-noir-800 font-semibold">
                      Overall Experience *
                    </label>
                    <span className="text-xs font-semibold text-foil-gold">
                      {getRatingLabel(hoverRating || overallRating)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setOverallRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 text-cream-300 hover:scale-110 transition-transform focus:outline-none"
                      >
                        <Star
                          size={28}
                          className={`${
                            star <= (hoverRating || overallRating)
                              ? 'text-amber-500 fill-amber-500'
                              : 'text-cream-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Specific Quality Criteria */}
                <div className="p-4 bg-cream-50/70 border border-cream-200 rounded-sm space-y-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-noir-700">
                    Artisan Quality Assessment
                  </p>

                  {/* Print Vibrancy */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-noir-700">12K Indigo Print Vibrancy</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setPrintQuality(s)}
                          className="focus:outline-none p-0.5"
                        >
                          <Star
                            size={16}
                            className={s <= printQuality ? 'text-amber-500 fill-amber-500' : 'text-cream-300'}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Layflat Binding */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-noir-700">180° Layflat Binding Flatness</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setBindingQuality(s)}
                          className="focus:outline-none p-0.5"
                        >
                          <Star
                            size={16}
                            className={s <= bindingQuality ? 'text-amber-500 fill-amber-500' : 'text-cream-300'}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Packaging */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-noir-700">Keepsake Box & Protection</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setPackagingQuality(s)}
                          className="focus:outline-none p-0.5"
                        >
                          <Star
                            size={16}
                            className={s <= packagingQuality ? 'text-amber-500 fill-amber-500' : 'text-cream-300'}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3. Written Feedback Textarea */}
                <div>
                  <label className="block text-xs uppercase tracking-wider mb-1.5 text-noir-700 font-semibold">
                    Customer Experience & Review
                  </label>
                  <textarea
                    rows={4}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Tell us about the unboxing, colors, non-tearable pages, and paper texture..."
                    className="w-full border border-cream-300 rounded-sm p-3 bg-cream-50/50 focus:border-foil-gold focus:outline-none text-sm text-noir-900"
                  ></textarea>
                </div>

                {/* 4. Recommendation Toggle */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <ThumbsUp size={16} className="text-foil-gold" />
                    <span className="text-xs text-noir-800 font-medium">
                      Would you recommend PerfectPic to friends & family?
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setRecommend(true)}
                      className={`px-3 py-1 text-xs font-semibold rounded-sm border transition-colors ${
                        recommend
                          ? 'bg-noir-900 text-cream-50 border-noir-900'
                          : 'border-cream-300 text-noir-600 hover:bg-cream-100'
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecommend(false)}
                      className={`px-3 py-1 text-xs font-semibold rounded-sm border transition-colors ${
                        !recommend
                          ? 'bg-noir-900 text-cream-50 border-noir-900'
                          : 'border-cream-300 text-noir-600 hover:bg-cream-100'
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>

                {/* Buttons */}
                <div className="pt-4 flex items-center justify-end gap-3 border-t border-cream-200">
                  <button
                    type="button"
                    onClick={() => setReviewModalOpen(false)}
                    className="px-4 py-2.5 border border-cream-300 text-noir-700 rounded-sm text-xs font-semibold uppercase tracking-wider hover:bg-cream-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="px-6 py-2.5 bg-noir-950 text-cream-50 rounded-sm text-xs font-semibold uppercase tracking-wider hover:bg-noir-900 transition-colors shadow-luxury-md flex items-center gap-2 disabled:opacity-50"
                  >
                    {submittingReview ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} className="text-foil-gold" />
                        <span>Submit Review</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
