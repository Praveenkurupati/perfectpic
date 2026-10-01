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
  X,
  Layers,
  ShieldCheck,
  PackageCheck,
  AlertCircle,
  MessageSquare,
  Clock,
  ExternalLink,
  ArrowRight,
  Send
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { generateAdminProductionPdf } from "@/lib/pdfGenerator";
import { generateGstInvoicePdf } from "@/lib/invoiceGenerator";
import { generateShippingLabelPdf } from "@/lib/shippingLabelGenerator";
import { cn } from "@/lib/utils";

const STAGES = [
  { 
    id: 'confirmed', 
    label: 'Confirmed', 
    stepNumber: 1,
    icon: CheckCircle2, 
    color: 'blue',
    desc: 'Order verified & preflight passed',
    next: 'production',
    nextLabel: 'Start Prepress Production',
  },
  { 
    id: 'production', 
    label: 'Production', 
    stepNumber: 2,
    icon: Layers, 
    color: 'purple',
    desc: 'Prepress imposition & color calibration',
    next: 'printing',
    nextLabel: 'Send to HP Indigo Press',
  },
  { 
    id: 'printing', 
    label: 'Printing', 
    stepNumber: 3,
    icon: Printer, 
    color: 'amber',
    desc: 'HP Indigo 12K digital press active',
    next: 'qc',
    nextLabel: 'Move to QC Inspection',
  },
  { 
    id: 'qc', 
    label: 'QC Inspection', 
    stepNumber: 4,
    icon: ShieldCheck, 
    color: 'cyan',
    desc: 'Quality audit: binding alignment, UV finish & color fidelity',
    next: 'dispatched',
    nextLabel: 'Approve QC & Hand to Courier',
  },
  { 
    id: 'dispatched', 
    label: 'Dispatched', 
    stepNumber: 5,
    icon: Truck, 
    color: 'indigo',
    desc: 'In transit via BlueDart Express courier',
    next: 'delivered',
    nextLabel: 'Mark Order as Delivered',
  },
  { 
    id: 'delivered', 
    label: 'Delivered', 
    stepNumber: 6,
    icon: PackageCheck, 
    color: 'emerald',
    desc: 'Delivered to customer doorstep',
    next: null,
    nextLabel: 'Completed',
  },
];

export default function OrderDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRenderingPdf, setIsRenderingPdf] = useState(false);
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const [isUpdatingStage, setIsUpdatingStage] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Workflow follow-up state
  const [teamNote, setTeamNote] = useState('');
  const [carrier, setCarrier] = useState('BlueDart Express');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [selectedTargetStage, setSelectedTargetStage] = useState<string>('production');

  useEffect(() => {
    adminApi.getOrder(orderId)
      .then((res: any) => {
        const orderData = res?.order || res;
        if (orderData) {
          setOrder(orderData);
          setSelectedTargetStage(orderData.status || 'production');
          if (orderData.shippingDetails?.carrier) setCarrier(orderData.shippingDetails.carrier);
          if (orderData.shippingDetails?.trackingNumber) setTrackingNumber(orderData.shippingDetails.trackingNumber);
        }
      })
      .catch((err: any) => {
        console.warn("Using fallback view for order:", err);
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  const currentStatus = (order?.status || 'confirmed').toLowerCase();
  const currentStageIndex = STAGES.findIndex(s => s.id === currentStatus);
  const currentStageConfig = STAGES[currentStageIndex >= 0 ? currentStageIndex : 0]!;
  const nextStageId = currentStageConfig.next;
  const nextStageConfig = nextStageId ? STAGES.find(s => s.id === nextStageId) : null;

  const displayTotal = order?.total || order?.amount || 1999;
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

  const baseBookPrice = Math.max(0, displayTotal - packagingTotal);

  const handleUpdateStage = async (targetStage: string, noteText?: string) => {
    setIsUpdatingStage(true);
    try {
      const payload: any = {
        notes: (noteText !== undefined ? noteText : teamNote).trim() || undefined,
        updatedBy: 'Admin',
      };
      if (targetStage === 'dispatched') {
        payload.carrier = carrier.trim() || 'BlueDart Express';
        payload.trackingNumber = trackingNumber.trim() || `BD${Math.floor(100000000 + Math.random() * 900000000)}IN`;
        payload.trackingUrl = `https://www.bluedart.com/tracking?awb=${payload.trackingNumber}`;
      }

      await adminApi.updateOrderStatus(orderId, targetStage, payload);

      setOrder((prev: any) => {
        if (!prev) return prev;
        const newNotes = prev.production?.stageNotes ? [...prev.production.stageNotes] : [];
        if (payload.notes) {
          newNotes.push({
            stage: targetStage,
            note: payload.notes,
            createdAt: new Date().toISOString(),
            updatedBy: 'Admin',
          });
        }
        return {
          ...prev,
          status: targetStage,
          production: {
            ...prev.production,
            notes: payload.notes || prev.production?.notes,
            stageNotes: newNotes,
          },
          shippingDetails: payload.trackingNumber ? {
            carrier: payload.carrier,
            trackingNumber: payload.trackingNumber,
            trackingUrl: payload.trackingUrl,
            dispatchedAt: new Date().toISOString(),
          } : prev.shippingDetails,
        };
      });

      setTeamNote('');
      const targetLabel = STAGES.find(s => s.id === targetStage)?.label || targetStage;
      setFeedbackToast(`Order #${orderId} stage updated to ${targetLabel}!`);
      setTimeout(() => setFeedbackToast(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to update order stage');
    } finally {
      setIsUpdatingStage(false);
    }
  };

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
        items: order?.items || [{
          title: order?.title || 'Heirloom Custom Photobook Edition',
          quantity: order?.itemsCount || 1,
          price: displayTotal,
          pageCount: order?.pageCount || 40,
          dimensions: order?.dimensions || '8.25" × 8.25"',
        }],
        total: displayTotal,
      });
    } catch (err) {
      console.error("GST Tax Invoice generation error:", err);
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

  const stageNotesList = order?.production?.stageNotes || [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Toast Notification */}
      {feedbackToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-sm text-emerald-900 text-sm font-medium flex items-center justify-between shadow-luxury-md animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-700" />
            <span>{feedbackToast}</span>
          </div>
          <button onClick={() => setFeedbackToast(null)} className="text-xs uppercase font-semibold text-emerald-800">
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Link href="/orders" className="p-2 hover:bg-cream-100 rounded-full transition-colors text-noir-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-noir-950">
                Order #{order?.orderNumber || orderId}
              </h1>
              <span className="text-xs uppercase tracking-wider px-2.5 py-0.5 rounded-sm font-bold bg-noir-950 text-cream-50">
                {currentStageConfig.label}
              </span>
            </div>
            <p className="text-xs text-noir-500 mt-1">
              {order?.createdAt 
                ? `Placed on ${new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}` 
                : 'Active production queue order'}
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap gap-2.5">
          <button 
            onClick={handleDownloadInvoice}
            disabled={isGeneratingInvoice}
            className="px-3.5 py-2 bg-cream-100 text-noir-900 rounded-sm text-xs font-semibold uppercase tracking-wider hover:bg-cream-200 transition-colors flex items-center gap-1.5 border border-cream-300 disabled:opacity-50"
            title="Download GST Tax Invoice PDF"
          >
            {isGeneratingInvoice ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
            <span>GST Invoice</span>
          </button>

          <button 
            onClick={handlePrintShippingLabel}
            className="px-3.5 py-2 bg-cream-100 text-noir-900 rounded-sm text-xs font-semibold uppercase tracking-wider hover:bg-cream-200 transition-colors flex items-center gap-1.5 border border-cream-300 shadow-xs"
            title="Print Logistics Shipping Label"
          >
            <Truck className="w-3.5 h-3.5 text-noir-700" />
            <span>Shipping Label</span>
          </button>
          
          {order?.pdfUrl ? (
            <a
              href={order.pdfUrl}
              target="_blank"
              rel="noreferrer"
              download={`PerfectPic-Print-${order?.orderNumber || orderId}.pdf`}
              className="px-3.5 py-2 bg-noir-950 text-cream-50 rounded-sm text-xs font-semibold uppercase tracking-wider hover:bg-noir-900 transition-colors flex items-center gap-1.5 shadow-xs"
              title="Download Commercial Print-Ready PDF from AWS S3"
            >
              <Download className="w-3.5 h-3.5 text-foil-gold" />
              <span>Print PDF (S3)</span>
            </a>
          ) : (
            <button 
              onClick={handleRenderPrintPdf}
              disabled={isRenderingPdf}
              className="px-3.5 py-2 bg-noir-950 text-cream-50 rounded-sm text-xs font-semibold uppercase tracking-wider hover:bg-noir-900 transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              title="Compile and Download High-Res Print PDF"
            >
              {isRenderingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin text-foil-gold" /> : <Printer className="w-3.5 h-3.5 text-foil-gold" />}
              <span>Render Print PDF</span>
            </button>
          )}
        </div>
      </div>

      {/* Interactive Fulfillment Stage Pipeline Stepper */}
      <div className="bg-white rounded-md shadow-luxury-sm border border-cream-200 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cream-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-noir-950 flex items-center gap-2">
              <span>Production & Fulfillment Stages</span>
              <span className="text-xs font-normal text-noir-500">
                (Stage {currentStageIndex >= 0 ? currentStageIndex + 1 : 1} of 6)
              </span>
            </h2>
            <p className="text-xs text-noir-500 mt-0.5">
              Current state: <strong className="text-noir-900">{currentStageConfig.label}</strong> — {currentStageConfig.desc}
            </p>
          </div>

          {/* Quick Advance Button */}
          {nextStageConfig && (
            <button
              onClick={() => handleUpdateStage(nextStageConfig.id)}
              disabled={isUpdatingStage}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-sm text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              {isUpdatingStage ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Advancing Stage...</span>
                </>
              ) : (
                <>
                  <span>Advance to {nextStageConfig.label}</span>
                  <ArrowRight size={13} />
                </>
              )}
            </button>
          )}
        </div>

        {/* Stepper Progress Bar */}
        <div className="pt-2 pb-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {STAGES.map((stage, idx) => {
              const isPast = currentStageIndex > idx;
              const isCurrent = currentStageIndex === idx;
              const StageIcon = stage.icon;

              return (
                <button
                  key={stage.id}
                  onClick={() => handleUpdateStage(stage.id)}
                  disabled={isUpdatingStage}
                  className={cn(
                    "p-3 rounded-sm border text-left transition-all relative flex flex-col justify-between group",
                    isCurrent 
                      ? "bg-noir-950 text-cream-50 border-noir-950 shadow-luxury-xs ring-2 ring-noir-950/20"
                      : isPast
                        ? "bg-emerald-50/70 border-emerald-200 text-emerald-950 hover:bg-emerald-100/60"
                        : "bg-cream-50/50 border-cream-200 text-noir-500 hover:bg-cream-100 hover:text-noir-800"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn(
                      "text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-xs",
                      isCurrent ? "bg-foil-gold text-noir-950" : isPast ? "bg-emerald-200 text-emerald-900" : "bg-cream-200 text-noir-600"
                    )}>
                      0{stage.stepNumber}
                    </span>
                    <div className="flex items-center">
                      {isPast ? (
                        <Check size={14} className="text-emerald-700" />
                      ) : (
                        <StageIcon size={14} className={isCurrent ? "text-foil-gold" : "opacity-40"} />
                      )}
                    </div>
                  </div>
                  <div>
                    <div className={cn("text-xs font-bold", isCurrent ? "text-cream-50" : "text-noir-900")}>
                      {stage.label}
                    </div>
                    <div className={cn("text-[10px] line-clamp-1 mt-0.5", isCurrent ? "text-cream-200" : "text-noir-500")}>
                      {stage.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Team Follow-Up & Stage Control Box */}
          <div className="bg-white rounded-md shadow-luxury-sm border border-cream-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-cream-100 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-noir-800" />
                <h2 className="text-lg font-semibold text-noir-950">Team Follow-Up & Stage Notes</h2>
              </div>
              <span className="text-xs text-noir-500">Internal Bindery Log</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-noir-800 uppercase tracking-wider mb-1.5">
                  Update Stage & Post Note to Team
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="block text-[11px] text-noir-600 mb-1">Target Stage</label>
                    <select
                      value={selectedTargetStage}
                      onChange={(e) => setSelectedTargetStage(e.target.value)}
                      className="w-full p-2 bg-cream-50 border border-cream-300 rounded-sm text-xs font-medium focus:outline-none"
                    >
                      {STAGES.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.stepNumber}. {s.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedTargetStage === 'dispatched' && (
                    <>
                      <div>
                        <label className="block text-[11px] text-noir-600 mb-1">Courier Carrier</label>
                        <input
                          type="text"
                          value={carrier}
                          onChange={(e) => setCarrier(e.target.value)}
                          placeholder="BlueDart Express"
                          className="w-full p-2 bg-cream-50 border border-cream-300 rounded-sm text-xs font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-noir-600 mb-1">AWB Tracking #</label>
                        <input
                          type="text"
                          value={trackingNumber}
                          onChange={(e) => setTrackingNumber(e.target.value)}
                          placeholder="BD928374182IN"
                          className="w-full p-2 bg-cream-50 border border-cream-300 rounded-sm text-xs font-mono font-medium"
                        />
                      </div>
                    </>
                  )}
                </div>

                <textarea
                  rows={2}
                  value={teamNote}
                  onChange={(e) => setTeamNote(e.target.value)}
                  placeholder="e.g. Color calibration approved for high-contrast images. Handing off to HP Indigo operator. Priority QC check requested."
                  className="w-full p-3 bg-cream-50 border border-cream-300 rounded-sm text-xs focus:outline-none focus:border-noir-400 focus:ring-1 focus:ring-noir-400"
                ></textarea>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => handleUpdateStage(selectedTargetStage, teamNote)}
                  disabled={isUpdatingStage}
                  className="px-5 py-2 bg-noir-950 hover:bg-noir-900 text-cream-50 rounded-sm text-xs font-semibold uppercase tracking-wider transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isUpdatingStage ? (
                    <>
                      <Loader2 size={13} className="animate-spin text-foil-gold" />
                      <span>Saving Note...</span>
                    </>
                  ) : (
                    <>
                      <Send size={13} />
                      <span>Save Note & Apply Stage</span>
                    </>
                  )}
                </button>
              </div>

              {/* Historical Stage Notes Timeline */}
              {stageNotesList.length > 0 && (
                <div className="pt-3 border-t border-cream-100 space-y-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-noir-600">
                    Follow-Up History ({stageNotesList.length})
                  </h4>
                  <div className="space-y-2">
                    {stageNotesList.map((entry: any, nIdx: number) => (
                      <div key={nIdx} className="p-3 bg-cream-50 rounded-sm border border-cream-200 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-noir-900 uppercase text-[10px] tracking-wider px-1.5 py-0.5 bg-cream-200 rounded-xs">
                            {entry.stage}
                          </span>
                          <span className="text-[11px] text-noir-500">
                            {entry.createdAt ? new Date(entry.createdAt).toLocaleString('en-IN') : 'Logged'} • {entry.updatedBy || 'Admin'}
                          </span>
                        </div>
                        <p className="text-noir-800 leading-relaxed mt-1">
                          {entry.note}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

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
                  <span>{packagingAddonCount} Custom Upgrade{packagingAddonCount > 1 ? 's' : ''} Included</span>
                </span>
              ) : (
                <span className="text-xs text-noir-500">Standard Packaging</span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Keepsake Box */}
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
                      <span>Included</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-cream-200/60 text-noir-400 text-[10px] font-medium uppercase tracking-wider rounded-xs flex items-center gap-1">
                      <X className="w-3 h-3" />
                      <span>Not Selected</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-noir-600 leading-relaxed">
                  Rigid presentation case with midnight black velvet interior and magnetic closure.
                </p>
              </div>

              {/* Ribbon Wrap */}
              <div className={`p-4 rounded-sm border transition-all ${
                hasGiftWrap 
                  ? 'bg-rose-50/50 border-rose-300 ring-1 ring-rose-300/50 shadow-2xs' 
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
                      <span>Included</span>
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

              {/* Archival UV Glaze */}
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

              {/* Mini Polaroids */}
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

          {/* Logistics Tracking Box */}
          {order?.shippingDetails?.trackingNumber && (
            <div className="bg-white rounded-md shadow-luxury-sm border border-cream-200 p-6 space-y-3">
              <h2 className="text-lg font-semibold text-noir-950 border-b border-cream-100 pb-2 flex items-center justify-between">
                <span>Courier Tracking</span>
                <span className="text-[10px] uppercase font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                  {order.shippingDetails.carrier || 'BlueDart'}
                </span>
              </h2>
              <div className="text-xs space-y-2">
                <div>
                  <span className="text-noir-500 block">AWB Number</span>
                  <span className="font-mono font-bold text-sm text-noir-900">
                    {order.shippingDetails.trackingNumber}
                  </span>
                </div>
                {order.shippingDetails.trackingUrl && (
                  <a
                    href={order.shippingDetails.trackingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-indigo-700 hover:text-indigo-900 font-semibold"
                  >
                    <span>Track on BlueDart Website</span>
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>
          )}

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
