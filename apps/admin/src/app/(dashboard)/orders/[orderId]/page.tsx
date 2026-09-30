"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Printer, 
  Download, 
  Truck, 
  FileText, 
  CheckCircle2, 
  Loader2, 
  Package, 
  Gift, 
  Sparkles, 
  Check, 
  X 
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { generateAdminProductionPdf } from "@/lib/pdfGenerator";
import { generateGstInvoicePdf } from "@/lib/invoiceGenerator";
import { generateShippingLabelPdf } from "@/lib/shippingLabelGenerator";

export default function OrderDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRenderingPdf, setIsRenderingPdf] = useState(false);
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);

  useEffect(() => {
    adminApi.getOrder(orderId)
      .then((res) => {
        const orderData = res?.order || res;
        if (orderData) setOrder(orderData);
      })
      .catch((err) => {
        console.warn("Using fallback view for order:", err);
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  const displayTotal = order?.total || order?.amount || 1999;
  const displayStatus = (order?.status || 'Confirmed').toUpperCase();
  const displayTitle = order?.title || `Photobook Edition (${orderId})`;
  const customerName = order?.customerName || order?.shippingAddress?.fullName || 'Valued Customer';
  const customerEmail = order?.customerEmail || 'customer@perfectpic.in';
  const customerPhone = order?.customerPhone || order?.shippingAddress?.phone || '+91 98765 43210';
  const addressLine1 = order?.shippingAddress?.addressLine1 || 'Delivery Address on file';
  const city = order?.shippingAddress?.city || 'Bangalore';
  const state = order?.shippingAddress?.state || 'Karnataka';
  const pincode = order?.shippingAddress?.pincode || '560001';

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

  const packagingAddonCount = [hasKeepsakeBox, hasGiftWrap, hasUvGlaze, hasMiniPolaroids].filter(Boolean).length;
  const packagingTotal = order?.pricing?.packagingPrice ?? order?.packaging?.total ?? (
    (hasKeepsakeBox ? 499 : 0) +
    (hasGiftWrap ? 199 : 0) +
    (hasUvGlaze ? 249 : 0) +
    (hasMiniPolaroids ? 149 : 0)
  );

  const isGiftOrder = Boolean(order?.isGift || hasGiftWrap);
  const baseBookPrice = Math.max(0, displayTotal - packagingTotal);

  const handleDownloadInvoice = () => {
    try {
      setIsGeneratingInvoice(true);
      generateGstInvoicePdf({
        orderNumber: order?.orderNumber || orderId,
        date: order?.createdAt,
        customerName: order?.customerName || order?.shippingAddress?.fullName || 'Valued Customer',
        customerEmail: order?.customerEmail,
        customerPhone: order?.customerPhone || order?.shippingAddress?.phone,
        shippingAddress: order?.shippingAddress,
        items: order?.items && order.items.length > 0 ? order.items : [
          {
            title: order?.title || 'Heirloom Photobook Keepsake',
            quantity: 1,
            price: baseBookPrice > 0 ? baseBookPrice : displayTotal,
            dimensions: order?.dimensions || '8.25" × 8.25"',
            pageCount: order?.pageCount || 40,
          },
          ...(hasKeepsakeBox ? [{ title: 'Keepsake Velvet Presentation Box', quantity: 1, price: 499, pageCount: 0 }] : []),
          ...(hasGiftWrap ? [{ title: 'Artisan Ribbon Wrap & Calligraphy Card', quantity: 1, price: 199, pageCount: 0 }] : []),
          ...(hasUvGlaze ? [{ title: 'Archival UV Anti-Scratch Page Glaze', quantity: 1, price: 249, pageCount: 0 }] : []),
          ...(hasMiniPolaroids ? [{ title: '10 Mini Polaroid Keepsake Prints', quantity: 1, price: 149, pageCount: 0 }] : []),
        ],
        total: displayTotal,
      });
    } catch (err) {
      console.error("Invoice PDF generation error:", err);
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  const handlePrintShippingLabel = () => {
    generateShippingLabelPdf({
      orderNumber: order?.orderNumber || orderId,
      customerName: order?.customerName || order?.shippingAddress?.fullName || 'Valued Customer',
      customerPhone: order?.customerPhone || order?.shippingAddress?.phone,
      shippingAddress: order?.shippingAddress,
      weightKg: '0.85 KG',
      paymentMode: 'PREPAID',
    });
  };

  const handleRenderPrintPdf = async () => {
    try {
      setIsRenderingPdf(true);
      await generateAdminProductionPdf({
        orderNumber: order?.orderNumber || orderId,
        title: order?.title || 'Heirloom Photobook Edition',
        customerName: order?.customerName || order?.shippingAddress?.fullName || 'Customer',
        customerEmail: order?.customerEmail,
        dimensions: order?.dimensions || '8.25" × 8.25"',
        pages: order?.pageCount || 40,
        status: order?.status || 'Production',
        packaging: {
          keepsakeBox: hasKeepsakeBox,
          giftWrap: hasGiftWrap,
          uvGlaze: hasUvGlaze,
          miniPolaroids: hasMiniPolaroids,
        },
        coverImage: order?.coverUrl || order?.thumbnail,
        coverConfig: order?.coverConfig,
        photos: order?.photos || [],
        slotPhotos: order?.slotPhotos,
        slotCrops: order?.slotCrops,
        pageLayouts: order?.pageLayouts,
        pageBackgrounds: order?.pageBackgrounds,
        dueDate: 'Immediate Print Run',
      });
    } catch (err) {
      console.error("Print Run PDF generation error:", err);
    } finally {
      setIsRenderingPdf(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/orders" className="p-2 hover:bg-cream-100 rounded-full transition-colors text-noir-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-noir-950 flex items-center gap-3">
              Order #{order?.orderNumber || orderId}
              <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-sm font-semibold bg-emerald-100 text-emerald-800 inline-block align-middle">
                {displayStatus}
              </span>
            </h1>
            <p className="text-sm text-noir-500 mt-1">
              {order?.createdAt 
                ? `Placed on ${new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}` 
                : 'Active production queue order'}
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={handleDownloadInvoice}
            disabled={isGeneratingInvoice}
            className="px-4 py-2 bg-cream-100 text-noir-900 rounded-sm text-sm font-medium hover:bg-cream-200 transition-colors flex items-center gap-2 border border-cream-300 disabled:opacity-50"
            title="Download GST Tax Invoice PDF"
          >
            {isGeneratingInvoice ? (
              <Loader2 className="w-4 h-4 animate-spin text-noir-800" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            <span>GST Invoice</span>
          </button>

          <button 
            onClick={handlePrintShippingLabel}
            className="px-4 py-2 bg-cream-100 text-noir-900 rounded-sm text-sm font-medium hover:bg-cream-200 transition-colors flex items-center gap-2 border border-cream-300 shadow-xs"
            title="Print Logistics Shipping Label"
          >
            <Truck className="w-4 h-4 text-noir-700" />
            <span>Shipping Label</span>
          </button>
          
          {order?.pdfUrl ? (
            <a
              href={order.pdfUrl}
              target="_blank"
              rel="noreferrer"
              download={`PerfectPic-Print-${order?.orderNumber || orderId}.pdf`}
              className="px-4 py-2 bg-noir-950 text-cream-50 rounded-sm text-sm font-medium hover:bg-noir-900 transition-colors flex items-center gap-2 shadow-xs"
              title="Download Commercial Print-Ready PDF from AWS S3"
            >
              <Download className="w-4 h-4 text-foil-gold" />
              <span>Download Print PDF (S3)</span>
            </a>
          ) : (
            <button 
              onClick={handleRenderPrintPdf}
              disabled={isRenderingPdf}
              className="px-4 py-2 bg-noir-950 text-cream-50 rounded-sm text-sm font-medium hover:bg-noir-900 transition-colors flex items-center gap-2 shadow-xs disabled:opacity-50"
              title="Compile and Download High-Res Print PDF"
            >
              {isRenderingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin text-foil-gold" />
              ) : (
                <Printer className="w-4 h-4 text-foil-gold" />
              )}
              <span>Render Print PDF</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Book Details */}
          <div className="bg-white rounded-md shadow-luxury-sm border border-cream-200 p-6">
            <h2 className="text-lg font-semibold text-noir-950 mb-4 border-b border-cream-100 pb-2">Book Specifications</h2>
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="w-36 h-36 bg-cream-100 rounded-sm overflow-hidden shrink-0 border border-cream-200">
                {(order?.coverUrl || order?.thumbnail) ? (
                  <img src={order?.coverUrl || order?.thumbnail} alt="Cover" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-noir-400">
                    <Printer className="w-8 h-8 opacity-40 mb-1" />
                    <span className="text-[10px] uppercase tracking-widest">Cover Plate</span>
                  </div>
                )}
              </div>
              <div className="flex-1 grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                <div>
                  <p className="text-noir-500 mb-1">Edition Title</p>
                  <p className="font-semibold text-noir-950 truncate">{displayTitle}</p>
                </div>
                <div>
                  <p className="text-noir-500 mb-1">Dimensions</p>
                  <p className="font-medium text-noir-900">{order?.dimensions || '8.25" × 8.25" Precision'}</p>
                </div>
                <div>
                  <p className="text-noir-500 mb-1">Binding Standard</p>
                  <p className="font-medium text-noir-900">180° Lay-Flat Pur Core</p>
                </div>
                <div>
                  <p className="text-noir-500 mb-1">Page Count</p>
                  <p className="font-medium text-noir-900 tabular-nums">{order?.pageCount || 40} Pages ({Math.ceil((order?.pageCount || 40) / 2)} Spreads)</p>
                </div>
                <div>
                  <p className="text-noir-500 mb-1">Print Process</p>
                  <p className="font-medium text-emerald-800">HP Indigo 12K (1 Photo/Page)</p>
                </div>
                <div>
                  <p className="text-noir-500 mb-1">Paper Stock</p>
                  <p className="font-medium text-noir-900">200 GSM Heavyweight Matte</p>
                </div>
              </div>
            </div>
          </div>

          {/* Archival Packaging & Fulfillment Add-ons */}
          <div className="bg-white rounded-md shadow-luxury-sm border border-cream-200 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cream-100 pb-3">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-noir-800" />
                <h2 className="text-lg font-semibold text-noir-950">Archival Packaging & Fulfillment Add-ons</h2>
              </div>
              {packagingAddonCount > 0 ? (
                <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-full flex items-center gap-1.5 shadow-2xs w-fit">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>{packagingAddonCount} Upgrades Active (+₹{packagingTotal.toLocaleString('en-IN')})</span>
                </span>
              ) : (
                <span className="text-xs font-medium px-2.5 py-1 bg-cream-100 text-noir-600 border border-cream-200 rounded-full w-fit">
                  Standard Packaging (No Add-ons)
                </span>
              )}
            </div>

            {/* Gift Order Fulfillment Callout */}
            {isGiftOrder && (
              <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-sm flex items-start gap-3 text-emerald-950">
                <Gift className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div className="text-xs space-y-0.5">
                  <p className="font-semibold text-emerald-900 uppercase tracking-wider text-[11px] flex items-center gap-2">
                    <span>Gift Fulfillment Notice</span>
                    <span className="px-1.5 py-0.5 rounded-xs bg-emerald-200/70 text-emerald-800 text-[10px] font-bold">CONCEAL PRICING</span>
                  </p>
                  <p className="text-emerald-800 leading-relaxed">
                    This order is marked as a gift. <strong>Do NOT include pricing or tax invoice in the presentation parcel.</strong> Wrap the book with artisan emerald satin ribbon and insert the personalized calligraphy message card.
                  </p>
                </div>
              </div>
            )}

            {/* Packaging Options 2x2 Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              {/* 1. Keepsake Box */}
              <div className={`p-4 rounded-sm border transition-all ${
                hasKeepsakeBox 
                  ? 'bg-amber-50/50 border-amber-300 ring-1 ring-amber-300/50 shadow-2xs' 
                  : 'bg-cream-50/40 border-cream-200 opacity-60'
              }`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🎁</span>
                    <div>
                      <h4 className="font-semibold text-sm text-noir-950">Keepsake Velvet Box</h4>
                      <p className="text-[11px] text-noir-500 font-medium">₹499 Add-on</p>
                    </div>
                  </div>
                  {hasKeepsakeBox ? (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider rounded-xs flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-700" />
                      <span>Pack in Box</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-cream-200/60 text-noir-400 text-[10px] font-medium uppercase tracking-wider rounded-xs flex items-center gap-1">
                      <X className="w-3 h-3" />
                      <span>Not Selected</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-noir-600 leading-relaxed">
                  Rigid presentation box with gold foil insignia and magnetic ribbon closure.
                </p>
              </div>

              {/* 2. Ribbon & Calligraphy Card */}
              <div className={`p-4 rounded-sm border transition-all ${
                hasGiftWrap 
                  ? 'bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-300/50 shadow-2xs' 
                  : 'bg-cream-50/40 border-cream-200 opacity-60'
              }`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🎀</span>
                    <div>
                      <h4 className="font-semibold text-sm text-noir-950">Ribbon Wrap & Card</h4>
                      <p className="text-[11px] text-noir-500 font-medium">₹199 Add-on</p>
                    </div>
                  </div>
                  {hasGiftWrap ? (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider rounded-xs flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-700" />
                      <span>Wrap Ribbon</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-cream-200/60 text-noir-400 text-[10px] font-medium uppercase tracking-wider rounded-xs flex items-center gap-1">
                      <X className="w-3 h-3" />
                      <span>Not Selected</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-noir-600 leading-relaxed">
                  Emerald green satin ribbon wrap with personalized calligraphy note.
                </p>
              </div>

              {/* 3. Archival UV Glaze */}
              <div className={`p-4 rounded-sm border transition-all ${
                hasUvGlaze 
                  ? 'bg-blue-50/50 border-blue-300 ring-1 ring-blue-300/50 shadow-2xs' 
                  : 'bg-cream-50/40 border-cream-200 opacity-60'
              }`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🛡️</span>
                    <div>
                      <h4 className="font-semibold text-sm text-noir-950">Archival UV Glaze</h4>
                      <p className="text-[11px] text-noir-500 font-medium">₹249 Add-on</p>
                    </div>
                  </div>
                  {hasUvGlaze ? (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider rounded-xs flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-700" />
                      <span>Apply Glaze</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-cream-200/60 text-noir-400 text-[10px] font-medium uppercase tracking-wider rounded-xs flex items-center gap-1">
                      <X className="w-3 h-3" />
                      <span>Not Selected</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-noir-600 leading-relaxed">
                  Diamond clear micro-coating protecting every page against fingerprints, spills, and UV fading.
                </p>
              </div>

              {/* 4. Mini Polaroid Prints */}
              <div className={`p-4 rounded-sm border transition-all ${
                hasMiniPolaroids 
                  ? 'bg-purple-50/50 border-purple-300 ring-1 ring-purple-300/50 shadow-2xs' 
                  : 'bg-cream-50/40 border-cream-200 opacity-60'
              }`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📷</span>
                    <div>
                      <h4 className="font-semibold text-sm text-noir-950">10 Mini Polaroid Prints</h4>
                      <p className="text-[11px] text-noir-500 font-medium">₹149 Add-on</p>
                    </div>
                  </div>
                  {hasMiniPolaroids ? (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider rounded-xs flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-700" />
                      <span>Print 10 Polaroids</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-cream-200/60 text-noir-400 text-[10px] font-medium uppercase tracking-wider rounded-xs flex items-center gap-1">
                      <X className="w-3 h-3" />
                      <span>Not Selected</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-noir-600 leading-relaxed">
                  10 retro square 2×3" photo prints on archival 300 GSM fine-art cotton cardstock.
                </p>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-md shadow-luxury-sm border border-cream-200 p-6">
            <h2 className="text-lg font-semibold text-noir-950 mb-4 border-b border-cream-100 pb-2">Payment Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-noir-600">Base Book ({order?.pageCount || 40} pages)</span>
                <span className="font-medium tabular-nums">₹{baseBookPrice.toLocaleString('en-IN')}</span>
              </div>
              {packagingTotal > 0 && (
                <div className="flex justify-between text-amber-900">
                  <span className="text-noir-700 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Archival Packaging & Accessories ({packagingAddonCount} upgrade{packagingAddonCount > 1 ? 's' : ''})</span>
                  </span>
                  <span className="font-medium tabular-nums text-amber-900">+₹{packagingTotal.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-noir-600">Pan-India Courier (BlueDart Air)</span>
                <span className="font-medium text-emerald-700">FREE</span>
              </div>
              <div className="pt-3 border-t border-cream-100 flex justify-between font-semibold text-base text-noir-950">
                <span>Total Paid</span>
                <span className="tabular-nums font-serif text-xl">₹{displayTotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-xs text-noir-500 mt-2">
                <span>Prepaid & Verified via Payment Gateway</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-md shadow-luxury-sm border border-cream-200 p-6">
            <h2 className="text-lg font-semibold text-noir-950 mb-4 border-b border-cream-100 pb-2">Customer Info</h2>
            <div className="space-y-4 text-sm">
              <div>
                <p className="font-medium text-noir-900">{customerName}</p>
                <p className="text-noir-500 text-xs">{customerEmail}</p>
                <p className="text-noir-500 text-xs">{customerPhone}</p>
              </div>
              <div>
                <p className="text-noir-500 mb-1 font-medium text-xs uppercase tracking-wider">Shipping Address</p>
                <p className="text-noir-800 leading-relaxed text-xs">
                  {addressLine1}<br/>
                  {city}, {state} - {pincode}<br/>
                  India
                </p>
              </div>
            </div>
          </div>

          {/* Quick PDF Actions */}
          <div className="bg-white rounded-md shadow-luxury-sm border border-cream-200 p-6 space-y-3">
            <h2 className="text-lg font-semibold text-noir-950 border-b border-cream-100 pb-2">Bindery PDF Actions</h2>
            {order?.pdfUrl ? (
              <a
                href={order.pdfUrl}
                target="_blank"
                rel="noreferrer"
                download={`PerfectPic-Print-${order?.orderNumber || orderId}.pdf`}
                className="w-full py-2.5 bg-noir-950 hover:bg-noir-900 text-cream-50 rounded-sm text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-xs"
                title="Download Print PDF directly from AWS S3"
              >
                <Download className="w-3.5 h-3.5 text-foil-gold" />
                <span>Download Print PDF (S3)</span>
              </a>
            ) : (
              <button 
                onClick={handleRenderPrintPdf}
                disabled={isRenderingPdf}
                className="w-full py-2.5 bg-noir-950 hover:bg-noir-900 text-cream-50 rounded-sm text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
              >
                {isRenderingPdf ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-foil-gold" />
                    <span>Generating PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5 text-foil-gold" />
                    <span>Download Print PDF</span>
                  </>
                )}
              </button>
            )}
            <button 
              onClick={handleDownloadInvoice}
              disabled={isGeneratingInvoice}
              className="w-full py-2 border border-cream-300 text-noir-800 hover:bg-cream-50 rounded-sm text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Download Tax Invoice</span>
            </button>
            {order?.pdfUrl && (
              <button
                onClick={handleRenderPrintPdf}
                disabled={isRenderingPdf}
                className="w-full py-1.5 text-[11px] text-noir-500 hover:text-noir-800 transition-colors flex items-center justify-center gap-1.5"
                title="Re-render from project snapshot"
              >
                <Printer className="w-3 h-3 text-noir-400" />
                <span>Re-render Print PDF</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
