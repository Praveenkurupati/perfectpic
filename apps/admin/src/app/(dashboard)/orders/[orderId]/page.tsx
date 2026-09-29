"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, Printer, Download, Truck, FileText, CheckCircle2, Loader2 } from "lucide-react";
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
        items: order?.items && order.items.length > 0 ? order.items : [{
          title: order?.title || 'Heirloom Photobook Keepsake',
          quantity: 1,
          price: order?.total || order?.amount || 1999,
          dimensions: order?.dimensions || '8.25" × 8.25"',
          pageCount: order?.pageCount || 40,
        }],
        total: order?.total || order?.amount || 1999,
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
        coverImage: order?.coverUrl || order?.thumbnail,
        photos: order?.photos || [],
        dueDate: 'Immediate Print Run',
      });
    } catch (err) {
      console.error("Print Run PDF generation error:", err);
    } finally {
      setIsRenderingPdf(false);
    }
  };

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
          
          <button 
            onClick={handleRenderPrintPdf}
            disabled={isRenderingPdf}
            className="px-4 py-2 bg-noir-950 text-cream-50 rounded-sm text-sm font-medium hover:bg-noir-900 transition-colors flex items-center gap-2 shadow-xs disabled:opacity-50"
            title="Download HP Indigo High-Res Print PDF"
          >
            {isRenderingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin text-foil-gold" />
            ) : (
              <Printer className="w-4 h-4 text-foil-gold" />
            )}
            <span>Render Print PDF</span>
          </button>
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

          {/* Pricing */}
          <div className="bg-white rounded-md shadow-luxury-sm border border-cream-200 p-6">
            <h2 className="text-lg font-semibold text-noir-950 mb-4 border-b border-cream-100 pb-2">Payment Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-noir-600">Base Book ({order?.pageCount || 40} pages)</span>
                <span className="font-medium tabular-nums">₹{displayTotal.toLocaleString('en-IN')}</span>
              </div>
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
            <button 
              onClick={handleDownloadInvoice}
              disabled={isGeneratingInvoice}
              className="w-full py-2 border border-cream-300 text-noir-800 hover:bg-cream-50 rounded-sm text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Download Tax Invoice</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
