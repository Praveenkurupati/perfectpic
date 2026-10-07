'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { 
  CheckCircle2, 
  PackageCheck, 
  Printer, 
  Truck, 
  FileText, 
  Download, 
  Loader2, 
  ShieldCheck, 
  MapPin, 
  CreditCard,
  Layers,
  ArrowRight
} from 'lucide-react';
import { generateGstInvoicePdf } from '@/lib/invoiceGenerator';

export default function ConfirmationPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const orderId = (params?.orderId as string) || '';
  const token = searchParams?.get('token') || '';
  const email = searchParams?.get('email') || '';

  const [order, setOrder] = useState<any>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    api.getOrder(orderId, { token, email })
      .then((res) => {
        const orderData = res?.order || res;
        if (orderData) setOrder(orderData);
      })
      .catch((err) => {
        console.warn('Order confirmation lookup notice:', err);
      });
  }, [orderId, token, email]);

  const orderNum = order?.orderNumber || order?.id || orderId || 'PP-6262';
  const displayTotal = Number(order?.total || order?.amount) || 2499;
  const displayDate = order?.createdAt 
    ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const currentStatus = (order?.status || 'paid').toLowerCase();
  const stages = ['paid', 'production', 'printing', 'dispatched', 'delivered'];
  const currentStageIndex = Math.max(0, stages.indexOf(currentStatus));

  // Price calculations (18% GST inclusive standard)
  const taxableTotal = Math.round((displayTotal / 1.18) * 100) / 100;
  const gstTotal = Math.round((displayTotal - taxableTotal) * 100) / 100;
  const customerState = order?.shippingAddress?.state || 'Karnataka';
  const isIntraState = customerState.toLowerCase().includes('karnataka');
  const cgstAmount = isIntraState ? Math.round((gstTotal / 2) * 100) / 100 : 0;
  const sgstAmount = isIntraState ? Math.round((gstTotal - cgstAmount) * 100) / 100 : 0;
  const igstAmount = isIntraState ? 0 : gstTotal;

  // Book specifications
  const bookTitle = order?.title || `Heirloom Custom Photobook Edition (${orderNum})`;
  const dimensions = order?.dimensions || '8.25" × 8.25" Precision';
  const pageCount = order?.pageCount || 40;
  const coverUrl = order?.coverUrl || order?.thumbnail || 'https://images.unsplash.com/photo-1544928147-79a2dbc1f389?w=800&auto=format&fit=crop';

  // Customer info
  const customerName = order?.customerName || order?.shippingAddress?.fullName || 'Praveen Kumar';
  const customerEmail = order?.customerEmail || 'customer@perfectpic.in';
  const customerPhone = order?.customerPhone || order?.shippingAddress?.phone || '+91 98765 43210';
  const addressLine1 = order?.shippingAddress?.addressLine1 || 'Indiranagar 100ft Road, 4th Cross';
  const city = order?.shippingAddress?.city || 'Bengaluru';
  const state = order?.shippingAddress?.state || 'Karnataka';
  const pincode = order?.shippingAddress?.pincode || '560038';

  // Packaging & Add-on extraction
  const orderItemsList = Array.isArray(order?.items) ? order.items : [];
  
  const hasKeepsakeBox = Boolean(
    order?.packaging?.keepsakeBox ||
    order?.accessories?.keepsakeBox ||
    orderItemsList.some((i: any) => i.id === 'acc-keepsake-box' || i.id === 'keepsakeBox' || /keepsake|velvet box/i.test(i.title || ''))
  );

  const hasGiftWrap = Boolean(
    order?.packaging?.giftWrap ||
    order?.accessories?.giftWrap ||
    order?.isGift ||
    orderItemsList.some((i: any) => i.id === 'acc-gift-wrap' || i.id === 'giftWrap' || /ribbon|gift wrap|calligraphy/i.test(i.title || ''))
  );

  const hasUvGlaze = Boolean(
    order?.packaging?.uvGlaze ||
    order?.accessories?.uvGlaze ||
    orderItemsList.some((i: any) => i.id === 'acc-uv-glaze' || i.id === 'uvGlaze' || /uv glaze|anti-scratch/i.test(i.title || ''))
  );

  const hasMiniPolaroids = Boolean(
    order?.packaging?.miniPolaroids ||
    order?.accessories?.miniPolaroids ||
    orderItemsList.some((i: any) => i.id === 'acc-mini-prints' || i.id === 'miniPolaroids' || /polaroid/i.test(i.title || ''))
  );

  const packagingTotal = order?.pricing?.packagingPrice ?? order?.packaging?.total ?? (
    (hasKeepsakeBox ? 499 : 0) +
    (hasGiftWrap ? 199 : 0) +
    (hasUvGlaze ? 249 : 0) +
    (hasMiniPolaroids ? 149 : 0)
  );

  const hasPackagingUpgrades = hasKeepsakeBox || hasGiftWrap || hasUvGlaze || hasMiniPolaroids;
  const baseBookPrice = Math.max(0, displayTotal - packagingTotal);

  const handleDownloadInvoice = async () => {
    try {
      setIsDownloadingPdf(true);
      await generateGstInvoicePdf({
        orderNumber: orderNum,
        date: order?.createdAt || order?.date,
        customerName,
        customerEmail,
        customerPhone,
        shippingAddress: {
          fullName: customerName,
          phone: customerPhone,
          addressLine1,
          city,
          state,
          pincode,
        },
        items: (order?.items && Array.isArray(order.items) && order.items.length > 0)
          ? order.items.map((it: any) => ({
              title: it.title || bookTitle,
              quantity: it.quantity || 1,
              price: it.price || displayTotal,
              dimensions: it.dimensions || dimensions,
              pageCount: it.pageCount || (it.id?.startsWith('acc-') ? 0 : pageCount),
            }))
          : [
              {
                title: bookTitle,
                quantity: 1,
                price: baseBookPrice > 0 ? baseBookPrice : displayTotal,
                dimensions,
                pageCount,
              },
              ...(hasKeepsakeBox ? [{ title: 'Keepsake Velvet Presentation Box', quantity: 1, price: 499, pageCount: 0 }] : []),
              ...(hasGiftWrap ? [{ title: 'Artisan Ribbon Wrap & Calligraphy Card', quantity: 1, price: 199, pageCount: 0 }] : []),
              ...(hasUvGlaze ? [{ title: 'Archival UV Anti-Scratch Page Glaze', quantity: 1, price: 249, pageCount: 0 }] : []),
              ...(hasMiniPolaroids ? [{ title: '10 Mini Polaroid Keepsake Prints', quantity: 1, price: 149, pageCount: 0 }] : []),
            ],
        total: displayTotal,
      });
    } catch (err) {
      console.error('GST Invoice generation error:', err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 font-sans text-noir-900 py-12 md:py-16 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Top Confirmation Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center shadow-xs"
          >
            <CheckCircle2 className="w-9 h-9 text-emerald-600" />
          </motion.div>

          <span className="text-xs uppercase font-bold tracking-[0.2em] text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
            Payment Confirmed • In Production
          </span>
          <h1 className="font-serif text-3xl md:text-5xl font-semibold text-noir-950">
            Order Confirmed!
          </h1>
          <p className="text-noir-600 max-w-lg text-sm leading-relaxed">
            Thank you for creating with PerfectPic. Your custom photobook edition is now in our precision HP Indigo 12K print queue at perfectpic.in.
          </p>
        </div>

        {/* Order Meta Bar */}
        <div className="bg-white p-5 md:p-6 rounded-sm shadow-xs border border-cream-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
            <div>
              <span className="block text-[10px] text-noir-400 uppercase tracking-widest font-semibold mb-1">
                Order ID
              </span>
              <span className="font-mono font-bold text-noir-950 text-base">
                #{orderNum}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-noir-400 uppercase tracking-widest font-semibold mb-1">
                Order Date
              </span>
              <span className="font-medium text-noir-900">
                {displayDate}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-noir-400 uppercase tracking-widest font-semibold mb-1">
                Total Amount Paid
              </span>
              <span className="font-serif font-bold text-noir-950 text-base">
                ₹{displayTotal.toLocaleString('en-IN')}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-noir-400 uppercase tracking-widest font-semibold mb-1">
                Express Logistics
              </span>
              <span className="font-medium text-emerald-800 flex items-center gap-1.5">
                <Truck size={14} /> BlueDart Apex Air
              </span>
            </div>
          </div>

          {/* Timeline Stepper */}
          <div className="mt-8 pt-6 border-t border-cream-200 relative">
            <div className="absolute top-9 left-6 right-6 h-[2px] bg-cream-200" />
            <div 
              className="absolute top-9 left-6 h-[2px] bg-noir-950 transition-all duration-500" 
              style={{ width: `${(currentStageIndex / (stages.length - 1)) * 90}%` }}
            />
            
            <div className="flex justify-between relative z-10">
              {['Paid', 'Production', 'Printing', 'Dispatched', 'Delivered'].map((step, i) => {
                const isPastOrCurrent = i <= currentStageIndex;
                return (
                  <div key={step} className="flex flex-col items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 bg-white transition-colors ${
                      isPastOrCurrent ? 'border-noir-950 text-noir-950' : 'border-cream-300 text-noir-300'
                    }`}>
                      <div className={`w-2.5 h-2.5 rounded-full ${isPastOrCurrent ? 'bg-noir-950' : 'bg-transparent'}`} />
                    </div>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                      isPastOrCurrent ? 'text-noir-950' : 'text-noir-400'
                    }`}>
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Specifications & Price Breakdown (2-Column Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 1: Book Specifications */}
          <div className="bg-white p-6 rounded-sm shadow-xs border border-cream-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-cream-200 mb-4">
                <div className="flex items-center gap-2 text-noir-950 font-serif font-semibold text-base">
                  <Layers size={16} className="text-foil-gold" />
                  <span>Book Specifications</span>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-noir-500 bg-cream-100 px-2 py-0.5 rounded-xs">
                  HSN 4901 10 10
                </span>
              </div>

              <div className="flex gap-4 mb-4">
                <div className="w-24 h-24 bg-cream-100 rounded-sm overflow-hidden shrink-0 border border-cream-200 shadow-xs">
                  <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-serif font-bold text-noir-950 text-base leading-snug">
                    {bookTitle}
                  </h3>
                  <p className="text-xs text-noir-500">
                    Precision Lay-Flat Archival Edition
                  </p>
                  <p className="text-xs text-emerald-800 font-medium pt-1">
                    ✓ 180° Lay-Flat Zero-Gutter Core
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs pt-3 border-t border-cream-100">
                <div>
                  <span className="text-noir-400 block text-[10px] uppercase tracking-wider">Dimensions</span>
                  <span className="font-medium text-noir-900">{dimensions}</span>
                </div>
                <div>
                  <span className="text-noir-400 block text-[10px] uppercase tracking-wider">Page Count</span>
                  <span className="font-medium text-noir-900">{pageCount} Pages ({Math.ceil(pageCount / 2)} Spreads)</span>
                </div>
                <div>
                  <span className="text-noir-400 block text-[10px] uppercase tracking-wider">Print Press</span>
                  <span className="font-medium text-noir-900">HP Indigo 12K Digital</span>
                </div>
                <div>
                  <span className="text-noir-400 block text-[10px] uppercase tracking-wider">Paper Stock</span>
                  <span className="font-medium text-noir-900">200 GSM Archival Matte</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-cream-100 flex items-center justify-between text-[11px] text-noir-500">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-700" />
                7-Day Free Reprint Guarantee
              </span>
              <span>ISO 9706 Acid-Free</span>
            </div>
          </div>

          {/* Card 2: Transparent Price & GST Structure */}
          <div className="bg-white p-6 rounded-sm shadow-xs border border-cream-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-cream-200 mb-4">
                <div className="flex items-center gap-2 text-noir-950 font-serif font-semibold text-base">
                  <CreditCard size={16} className="text-foil-gold" />
                  <span>Price & Tax Structure</span>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-xs border border-emerald-200">
                  GST Paid (Rule 46)
                </span>
              </div>

              <div className="space-y-3 text-xs">
                {/* Taxable Value */}
                <div className="flex justify-between items-center text-noir-700">
                  <span>Base Book Subtotal (Taxable Value)</span>
                  <span className="font-mono font-medium">₹{taxableTotal.toLocaleString('en-IN')}</span>
                </div>

                {/* GST Breakdown */}
                {isIntraState ? (
                  <>
                    <div className="flex justify-between items-center text-noir-600 pl-3 border-l-2 border-cream-300">
                      <span>CGST (9.0% Central GST)</span>
                      <span className="font-mono">₹{cgstAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center text-noir-600 pl-3 border-l-2 border-cream-300">
                      <span>SGST (9.0% State GST)</span>
                      <span className="font-mono">₹{sgstAmount.toLocaleString('en-IN')}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between items-center text-noir-600 pl-3 border-l-2 border-cream-300">
                    <span>IGST (18.0% Integrated GST)</span>
                    <span className="font-mono">₹{igstAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                {/* Packaging & Accessories Upgrades */}
                {hasPackagingUpgrades && (
                  <div className="space-y-1.5 pt-1 pb-1">
                    <div className="flex justify-between items-center text-amber-900 bg-amber-50/70 p-2 rounded-xs border border-amber-200/70">
                      <span className="font-medium flex items-center gap-1.5">
                        <span>✨ Archival Presentation Packaging</span>
                      </span>
                      <span className="font-mono font-bold">+₹{packagingTotal.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 px-1">
                      {hasKeepsakeBox && <span className="text-[10px] bg-cream-100 text-noir-800 px-2 py-0.5 rounded-full border border-cream-200">🎁 Velvet Box</span>}
                      {hasGiftWrap && <span className="text-[10px] bg-cream-100 text-noir-800 px-2 py-0.5 rounded-full border border-cream-200">🎀 Ribbon Wrap</span>}
                      {hasUvGlaze && <span className="text-[10px] bg-cream-100 text-noir-800 px-2 py-0.5 rounded-full border border-cream-200">🛡️ UV Glaze</span>}
                      {hasMiniPolaroids && <span className="text-[10px] bg-cream-100 text-noir-800 px-2 py-0.5 rounded-full border border-cream-200">📷 10 Polaroids</span>}
                    </div>
                  </div>
                )}

                {/* Shipping */}
                <div className="flex justify-between items-center text-noir-700">
                  <span>Pan-India Insured Transit (BlueDart Air)</span>
                  <span className="font-semibold text-emerald-700">FREE</span>
                </div>

                {/* Total Divider */}
                <div className="pt-3 border-t border-cream-200 flex justify-between items-baseline">
                  <div>
                    <span className="font-bold text-noir-950 text-sm block">Total Paid Amount</span>
                    <span className="text-[10px] text-noir-500">Inclusive of all statutory taxes</span>
                  </div>
                  <span className="font-serif text-2xl font-bold text-noir-950">
                    ₹{displayTotal.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Delivery Destination Footnote */}
            <div className="mt-6 pt-4 border-t border-cream-100 bg-cream-50/70 -mx-6 -mb-6 p-4 rounded-b-sm">
              <div className="flex items-start gap-2 text-xs">
                <MapPin size={14} className="text-noir-500 shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-noir-700">
                  <p className="font-semibold text-noir-900">{customerName} ({customerPhone})</p>
                  <p className="text-[11px] leading-tight text-noir-600">
                    {addressLine1}, {city}, {state} - {pincode}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls & Official GST Invoice Download */}
        <div className="bg-white p-6 rounded-sm shadow-xs border border-cream-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="font-serif text-base font-semibold text-noir-950 flex items-center justify-center sm:justify-start gap-2">
              <FileText size={16} className="text-foil-gold" />
              <span>Official Indian GST Tax Invoice</span>
            </h4>
            <p className="text-xs text-noir-500">
              Download your signed GST-compliant Tax Invoice (HSN 4901, Rule 46 of CGST Rules 2017).
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleDownloadInvoice}
              disabled={isDownloadingPdf}
              className="w-full sm:w-auto px-6 py-3 bg-foil-gold text-noir-950 hover:brightness-110 rounded-sm font-bold text-xs uppercase tracking-wider text-center transition-all flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
              title="Download Signed Official Indian GST Tax Invoice"
            >
              {isDownloadingPdf ? (
                <>
                  <Loader2 size={15} className="animate-spin text-noir-950" />
                  <span>Generating Invoice...</span>
                </>
              ) : (
                <>
                  <Download size={15} />
                  <span>Download GST Invoice (PDF)</span>
                </>
              )}
            </button>

            {order?.pdfUrl && (
              <a
                href={order.pdfUrl}
                target="_blank"
                rel="noreferrer"
                download={`Photobook-Proof-${orderNum}.pdf`}
                className="w-full sm:w-auto px-5 py-3 border border-amber-300 text-noir-900 bg-amber-50/60 hover:bg-amber-100 rounded-sm font-semibold text-xs uppercase tracking-wider text-center transition-all flex items-center justify-center gap-2 shadow-xs"
                title="Download Ultra-HD Photobook Print PDF from AWS S3"
              >
                <Download size={15} className="text-foil-gold" />
                <span>Photobook PDF</span>
              </a>
            )}

            <Link 
              href="/orders" 
              className="w-full sm:w-auto px-5 py-3 bg-noir-950 text-cream-50 hover:bg-noir-900 rounded-sm font-medium text-xs uppercase tracking-wider text-center transition-colors shadow-xs"
            >
              View My Orders
            </Link>

            <Link 
              href="/" 
              className="w-full sm:w-auto px-5 py-3 border border-cream-300 text-noir-800 hover:bg-cream-100 rounded-sm font-medium text-xs uppercase tracking-wider transition-colors text-center"
            >
              Storefront
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
