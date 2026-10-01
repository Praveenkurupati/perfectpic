"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  ArrowRight,
  Clock,
  Printer,
  ShieldCheck,
  Truck,
  PackageCheck,
  Layers,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MessageSquare,
  Sparkles,
  ExternalLink,
  ChevronDown
} from "lucide-react";
import { recentOrders } from "@/lib/mock-data";
import { adminApi } from "@/lib/api";
import { cn } from "@/lib/utils";

export interface StageConfig {
  id: string;
  label: string;
  step: number;
  color: string;
  badgeClass: string;
  dotClass: string;
  next: string | null;
  nextLabel: string;
  desc: string;
}

export const ORDER_STAGES: StageConfig[] = [
  { 
    id: 'confirmed', 
    label: 'Confirmed', 
    step: 1, 
    color: 'blue', 
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-200', 
    dotClass: 'bg-blue-500', 
    next: 'production', 
    nextLabel: 'Move to Production', 
    desc: 'Preflight check complete, queued for bindery' 
  },
  { 
    id: 'production', 
    label: 'Production', 
    step: 2, 
    color: 'purple', 
    badgeClass: 'bg-purple-50 text-purple-800 border-purple-200', 
    dotClass: 'bg-purple-500', 
    next: 'printing', 
    nextLabel: 'Send to Press', 
    desc: 'Prepress imposition & color calibration' 
  },
  { 
    id: 'printing', 
    label: 'Printing', 
    step: 3, 
    color: 'amber', 
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200', 
    dotClass: 'bg-amber-500', 
    next: 'qc', 
    nextLabel: 'Send to QC', 
    desc: 'Active press run on HP Indigo 12K' 
  },
  { 
    id: 'qc', 
    label: 'QC Inspection', 
    step: 4, 
    color: 'cyan', 
    badgeClass: 'bg-cyan-50 text-cyan-800 border-cyan-200', 
    dotClass: 'bg-cyan-500', 
    next: 'dispatched', 
    nextLabel: 'Approve & Dispatch', 
    desc: 'Color fidelity, lay-flat binding & finish audit' 
  },
  { 
    id: 'dispatched', 
    label: 'Dispatched', 
    step: 5, 
    color: 'indigo', 
    badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200', 
    dotClass: 'bg-indigo-500', 
    next: 'delivered', 
    nextLabel: 'Mark Delivered', 
    desc: 'Handed to BlueDart Express with AWB' 
  },
  { 
    id: 'delivered', 
    label: 'Delivered', 
    step: 6, 
    color: 'emerald', 
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200', 
    dotClass: 'bg-emerald-500', 
    next: null, 
    nextLabel: 'Completed', 
    desc: 'Successfully delivered to customer' 
  },
  { 
    id: 'cancelled', 
    label: 'Cancelled', 
    step: 0, 
    color: 'rose', 
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200', 
    dotClass: 'bg-rose-500', 
    next: null, 
    nextLabel: 'Cancelled', 
    desc: 'Order voided or refunded' 
  },
];

const tabs = ["All", "Confirmed", "Production", "Printing", "QC", "Dispatched", "Delivered"];

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState("All");
  const [orders, setOrders] = useState<any[]>(recentOrders);
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modal State for Stage Follow-up
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [modalStage, setModalStage] = useState<string>('production');
  const [modalNotes, setModalNotes] = useState<string>('');
  const [modalCarrier, setModalCarrier] = useState<string>('BlueDart Express');
  const [modalTrackingNumber, setModalTrackingNumber] = useState<string>('');
  const [modalSubmitting, setModalSubmitting] = useState(false);

  const fetchOrders = () => {
    adminApi.getOrders()
      .then(res => {
        if (res && res.orders && res.orders.length > 0) {
          const apiOrders = res.orders.map((o: any) => {
            const items = Array.isArray(o.items) ? o.items : [];
            const hasKeepsakeBox = Boolean(
              o.packaging?.keepsakeBox ||
              o.accessories?.keepsakeBox ||
              items.some((i: any) => i.id === 'acc-keepsake-box' || i.id === 'keepsakeBox' || /keepsake|velvet box/i.test(i.title || ''))
            );
            const hasGiftWrap = Boolean(
              o.packaging?.giftWrap ||
              o.accessories?.giftWrap ||
              o.isGift ||
              items.some((i: any) => i.id === 'acc-gift-wrap' || i.id === 'giftWrap' || /ribbon|gift wrap|calligraphy/i.test(i.title || ''))
            );
            const hasUvGlaze = Boolean(
              o.packaging?.uvGlaze ||
              o.accessories?.uvGlaze ||
              items.some((i: any) => i.id === 'acc-uv-glaze' || i.id === 'uvGlaze' || /uv glaze|anti-scratch/i.test(i.title || ''))
            );
            const hasMiniPolaroids = Boolean(
              o.packaging?.miniPolaroids ||
              o.accessories?.miniPolaroids ||
              items.some((i: any) => i.id === 'acc-mini-prints' || i.id === 'miniPolaroids' || /polaroid/i.test(i.title || ''))
            );

            const packagingBadges: string[] = [];
            if (hasKeepsakeBox) packagingBadges.push('🎁 Velvet Box');
            if (hasGiftWrap) packagingBadges.push('🎀 Ribbon Wrap');
            if (hasUvGlaze) packagingBadges.push('🛡️ UV Glaze');
            if (hasMiniPolaroids) packagingBadges.push('📷 Polaroids');

            const normalizedStatus = (o.status || 'confirmed').toLowerCase();

            return {
              id: o.orderNumber || o.id,
              orderNumber: o.orderNumber || o.id,
              customer: o.title || 'Custom Photobook Keepsake',
              customerName: o.customerName || 'Valued Customer',
              customerPhone: o.customerPhone || o.shippingAddress?.phone || '',
              customerEmail: o.customerEmail || o.email || '',
              date: (o.createdAt || o.date) ? new Date(o.createdAt || o.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '26 Sep 2026',
              pages: o.pageCount || 40,
              size: o.dimensions || '8.25" × 8.25"',
              status: normalizedStatus,
              amount: (o.amount || o.total || 1999).toLocaleString('en-IN'),
              pdfUrl: o.pdfUrl,
              packagingBadges,
              isGift: Boolean(o.isGift || hasGiftWrap),
              production: o.production || {},
              shippingDetails: o.shippingDetails || {},
            };
          });
          setOrders(apiOrders);
        }
      })
      .catch(err => {
        console.warn("Using offline mock orders:", err);
      });
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedbackToast({ message, type });
    setTimeout(() => {
      setFeedbackToast(null);
    }, 4000);
  };

  // Pipeline stage counters
  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: orders.length,
      confirmed: 0,
      production: 0,
      printing: 0,
      qc: 0,
      dispatched: 0,
      delivered: 0,
    };
    orders.forEach(o => {
      const st = (o.status || 'confirmed').toLowerCase();
      if (counts[st] !== undefined) {
        counts[st] += 1;
      }
    });
    return counts;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const st = (order.status || 'confirmed').toLowerCase();
      const matchesTab = activeTab === "All" ||
        (activeTab === "Confirmed" && st === 'confirmed') ||
        (activeTab === "Production" && st === 'production') ||
        (activeTab === "Printing" && st === 'printing') ||
        (activeTab === "QC" && (st === 'qc' || st === 'qc inspection')) ||
        (activeTab === "Dispatched" && st === 'dispatched') ||
        (activeTab === "Delivered" && st === 'delivered');

      const matchesSearch = !searchQuery || 
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerPhone.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesTab && matchesSearch;
    });
  }, [orders, activeTab, searchQuery]);

  const handleQuickAdvance = async (order: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const currentCfg = ORDER_STAGES.find(s => s.id === order.status) || ORDER_STAGES[0]!;
    if (!currentCfg.next) return;

    const nextStage = currentCfg.next;
    setUpdatingOrderId(order.id);

    try {
      await adminApi.updateOrderStatus(order.id, nextStage, {
        notes: `Quick-advanced from ${currentCfg.label} to ${ORDER_STAGES.find(s => s.id === nextStage)?.label || nextStage} by Admin`,
        updatedBy: 'Admin',
      });

      // Update local state
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: nextStage } : o));
      showToast(`Order #${order.id} moved to ${ORDER_STAGES.find(s => s.id === nextStage)?.label || nextStage}!`);
    } catch (err: any) {
      showToast(err.message || 'Failed to update order stage', 'error');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleOpenFollowUpModal = (order: any) => {
    setSelectedOrder(order);
    setModalStage(order.status || 'production');
    setModalNotes('');
    setModalCarrier(order.shippingDetails?.carrier || 'BlueDart Express');
    setModalTrackingNumber(order.shippingDetails?.trackingNumber || `BD${Math.floor(100000000 + Math.random() * 900000000)}IN`);
    setIsModalOpen(true);
  };

  const handleSaveModalStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setModalSubmitting(true);
    try {
      const payload: any = {
        notes: modalNotes.trim() || undefined,
        updatedBy: 'Admin',
      };
      if (modalStage === 'dispatched') {
        payload.carrier = modalCarrier.trim() || 'BlueDart Express';
        payload.trackingNumber = modalTrackingNumber.trim() || `BD${Math.floor(100000000 + Math.random() * 900000000)}IN`;
        payload.trackingUrl = `https://www.bluedart.com/tracking?awb=${payload.trackingNumber}`;
      }

      await adminApi.updateOrderStatus(selectedOrder.id, modalStage, payload);

      setOrders(prev => prev.map(o => {
        if (o.id === selectedOrder.id) {
          const updated = { ...o, status: modalStage };
          if (payload.trackingNumber) {
            updated.shippingDetails = {
              carrier: payload.carrier,
              trackingNumber: payload.trackingNumber,
              trackingUrl: payload.trackingUrl,
            };
          }
          return updated;
        }
        return o;
      }));

      showToast(`Order #${selectedOrder.id} status updated to ${ORDER_STAGES.find(s => s.id === modalStage)?.label || modalStage}`);
      setIsModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to update stage', 'error');
    } finally {
      setModalSubmitting(false);
    }
  };

  const getStageInfo = (status: string): StageConfig => {
    const s = (status || '').toLowerCase();
    return ORDER_STAGES.find(stage => stage.id === s) || {
      id: s,
      label: s.toUpperCase(),
      step: 1,
      color: 'blue',
      badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
      dotClass: 'bg-blue-500',
      next: 'production',
      nextLabel: 'Advance',
      desc: 'Active order',
    };
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Toast Alert */}
      {feedbackToast && (
        <div className={cn(
          "p-4 rounded-sm border shadow-luxury-md flex items-center justify-between transition-all animate-in fade-in slide-in-from-top-2",
          feedbackToast.type === 'success' 
            ? "bg-emerald-50 border-emerald-300 text-emerald-900" 
            : "bg-rose-50 border-rose-300 text-rose-900"
        )}>
          <div className="flex items-center gap-2 text-sm font-medium">
            <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
            <span>{feedbackToast.message}</span>
          </div>
          <button 
            onClick={() => setFeedbackToast(null)}
            className="text-xs uppercase tracking-wider font-semibold opacity-70 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-noir-950 flex items-center gap-2.5">
            <span>Orders & Stage Pipeline</span>
            <span className="text-xs font-mono font-medium px-2 py-0.5 bg-cream-200 text-noir-800 rounded-sm">
              Live Fulfillment
            </span>
          </h1>
          <p className="text-sm text-noir-500 mt-1">
            Track orders through bindery stages: Confirmed → Production → Printing → QC Inspection → Dispatched → Delivered.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="px-3.5 py-1.5 bg-white border border-cream-300 hover:bg-cream-50 rounded-sm text-xs font-medium text-noir-700 transition-colors self-start sm:self-auto"
        >
          ↻ Refresh Orders
        </button>
      </div>

      {/* Pipeline Stage Tracker Counters (Follow up the team faster) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <button
          onClick={() => setActiveTab("All")}
          className={cn(
            "p-3 rounded-sm border text-left transition-all",
            activeTab === "All"
              ? "bg-noir-950 text-cream-50 border-noir-950 shadow-luxury-sm"
              : "bg-white text-noir-800 border-cream-200 hover:border-cream-300 hover:bg-cream-50"
          )}
        >
          <div className="text-[11px] font-semibold uppercase tracking-wider opacity-80">All Orders</div>
          <div className="font-serif text-2xl font-bold mt-1">{stageCounts.all}</div>
          <div className="text-[10px] opacity-70 mt-0.5">Total active</div>
        </button>

        <button
          onClick={() => setActiveTab("Confirmed")}
          className={cn(
            "p-3 rounded-sm border text-left transition-all",
            activeTab === "Confirmed"
              ? "bg-blue-900 text-blue-50 border-blue-900 shadow-luxury-sm"
              : "bg-white text-noir-800 border-cream-200 hover:border-blue-300 hover:bg-blue-50/30"
          )}
        >
          <div className="text-[11px] font-semibold uppercase tracking-wider text-blue-700 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span>Confirmed</span>
          </div>
          <div className="font-serif text-2xl font-bold mt-1 text-blue-950">{stageCounts.confirmed}</div>
          <div className="text-[10px] text-blue-700 mt-0.5">Ready for prep</div>
        </button>

        <button
          onClick={() => setActiveTab("Production")}
          className={cn(
            "p-3 rounded-sm border text-left transition-all",
            activeTab === "Production"
              ? "bg-purple-900 text-purple-50 border-purple-900 shadow-luxury-sm"
              : "bg-white text-noir-800 border-cream-200 hover:border-purple-300 hover:bg-purple-50/30"
          )}
        >
          <div className="text-[11px] font-semibold uppercase tracking-wider text-purple-700 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
            <span>Production</span>
          </div>
          <div className="font-serif text-2xl font-bold mt-1 text-purple-950">{stageCounts.production}</div>
          <div className="text-[10px] text-purple-700 mt-0.5">Prepress & proofing</div>
        </button>

        <button
          onClick={() => setActiveTab("Printing")}
          className={cn(
            "p-3 rounded-sm border text-left transition-all",
            activeTab === "Printing"
              ? "bg-amber-900 text-amber-50 border-amber-900 shadow-luxury-sm"
              : "bg-white text-noir-800 border-cream-200 hover:border-amber-300 hover:bg-amber-50/30"
          )}
        >
          <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>Printing</span>
          </div>
          <div className="font-serif text-2xl font-bold mt-1 text-amber-950">{stageCounts.printing}</div>
          <div className="text-[10px] text-amber-700 mt-0.5">HP Indigo press</div>
        </button>

        <button
          onClick={() => setActiveTab("QC")}
          className={cn(
            "p-3 rounded-sm border text-left transition-all",
            activeTab === "QC"
              ? "bg-cyan-900 text-cyan-50 border-cyan-900 shadow-luxury-sm"
              : "bg-white text-noir-800 border-cream-200 hover:border-cyan-300 hover:bg-cyan-50/30"
          )}
        >
          <div className="text-[11px] font-semibold uppercase tracking-wider text-cyan-700 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
            <span>QC Check</span>
          </div>
          <div className="font-serif text-2xl font-bold mt-1 text-cyan-950">{stageCounts.qc}</div>
          <div className="text-[10px] text-cyan-700 mt-0.5">Inspection & finish</div>
        </button>

        <button
          onClick={() => setActiveTab("Dispatched")}
          className={cn(
            "p-3 rounded-sm border text-left transition-all",
            activeTab === "Dispatched"
              ? "bg-indigo-900 text-indigo-50 border-indigo-900 shadow-luxury-sm"
              : "bg-white text-noir-800 border-cream-200 hover:border-indigo-300 hover:bg-indigo-50/30"
          )}
        >
          <div className="text-[11px] font-semibold uppercase tracking-wider text-indigo-700 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            <span>Dispatched</span>
          </div>
          <div className="font-serif text-2xl font-bold mt-1 text-indigo-950">{stageCounts.dispatched}</div>
          <div className="text-[10px] text-indigo-700 mt-0.5">BlueDart Express</div>
        </button>

        <button
          onClick={() => setActiveTab("Delivered")}
          className={cn(
            "p-3 rounded-sm border text-left transition-all",
            activeTab === "Delivered"
              ? "bg-emerald-900 text-emerald-50 border-emerald-900 shadow-luxury-sm"
              : "bg-white text-noir-800 border-cream-200 hover:border-emerald-300 hover:bg-emerald-50/30"
          )}
        >
          <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Delivered</span>
          </div>
          <div className="font-serif text-2xl font-bold mt-1 text-emerald-950">{stageCounts.delivered}</div>
          <div className="text-[10px] text-emerald-700 mt-0.5">Completed orders</div>
        </button>
      </div>

      <div className="bg-white rounded-md shadow-luxury-sm border border-cream-200">
        {/* Toolbar */}
        <div className="p-4 border-b border-cream-200 flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex space-x-1 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "whitespace-nowrap px-4 py-2 rounded-sm text-sm font-medium transition-colors",
                  activeTab === tab 
                    ? "bg-noir-950 text-cream-50" 
                    : "text-noir-600 hover:bg-cream-100 hover:text-noir-900"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
          
          <div className="relative min-w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-noir-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Order ID, Customer, Phone..." 
              className="w-full pl-9 pr-4 py-2 bg-cream-50 border border-cream-300 rounded-sm text-sm focus:outline-none focus:border-noir-400 focus:ring-1 focus:ring-noir-400 transition-shadow"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-cream-200 bg-cream-50/50">
                <th className="p-4 text-xs font-semibold text-noir-600 uppercase tracking-wider">Order ID</th>
                <th className="p-4 text-xs font-semibold text-noir-600 uppercase tracking-wider">Customer / Keepsake</th>
                <th className="p-4 text-xs font-semibold text-noir-600 uppercase tracking-wider">Date</th>
                <th className="p-4 text-xs font-semibold text-noir-600 uppercase tracking-wider">Spec</th>
                <th className="p-4 text-xs font-semibold text-noir-600 uppercase tracking-wider">Workflow Stage</th>
                <th className="p-4 text-xs font-semibold text-noir-600 uppercase tracking-wider">Amount</th>
                <th className="p-4 text-xs font-semibold text-noir-600 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-sm text-noir-500">
                    No orders match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const stageInfo = getStageInfo(order.status);
                  const isUpdating = updatingOrderId === order.id;

                  return (
                    <tr key={order.id} className="hover:bg-cream-50/40 transition-colors group">
                      {/* Order ID */}
                      <td className="p-4">
                        <Link href={`/orders/${order.id}`} className="font-mono font-semibold text-sm text-noir-950 hover:underline">
                          {order.id}
                        </Link>
                      </td>

                      {/* Customer / Book */}
                      <td className="p-4 text-sm text-noir-800 font-medium">
                        <div className="flex flex-col">
                          <span className="text-noir-900 font-semibold">{order.customer}</span>
                          <span className="text-xs text-noir-500">{order.customerName} {order.customerPhone && `• ${order.customerPhone}`}</span>
                          {order.packagingBadges && order.packagingBadges.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {order.packagingBadges.map((badge: string, bIdx: number) => (
                                <span 
                                  key={bIdx} 
                                  className="text-[10px] font-semibold bg-amber-50 text-amber-900 border border-amber-200/80 px-1.5 py-0.5 rounded-xs"
                                >
                                  {badge}
                                </span>
                              ))}
                              {order.isGift && (
                                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded-xs">
                                  🎁 Gift
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="p-4 text-sm text-noir-500 whitespace-nowrap">{order.date}</td>

                      {/* Spec */}
                      <td className="p-4 text-sm text-noir-600">
                        {order.pages}p, {order.size}
                      </td>

                      {/* Stage & Quick Advance Control */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {/* Current Stage Badge (Click to open follow-up modal) */}
                          <button
                            onClick={() => handleOpenFollowUpModal(order)}
                            title="Click to update stage and add team follow-up notes"
                            className={cn(
                              "text-xs px-2.5 py-1 rounded-sm border flex items-center gap-1.5 font-semibold transition-all hover:shadow-xs",
                              stageInfo.badgeClass
                            )}
                          >
                            <span className={cn("w-2 h-2 rounded-full shrink-0", stageInfo.dotClass)}></span>
                            <span>{stageInfo.label}</span>
                            <ChevronDown size={12} className="opacity-60" />
                          </button>

                          {/* Quick Advance Button (e.g. Move to Printing, Move to QC) */}
                          {stageInfo.next && (
                            <button
                              onClick={(e) => handleQuickAdvance(order, e)}
                              disabled={isUpdating}
                              title={`Advance order to ${stageInfo.nextLabel}`}
                              className="text-[11px] px-2 py-1 bg-cream-100 hover:bg-noir-950 hover:text-cream-50 text-noir-700 font-medium rounded-sm border border-cream-300 transition-colors flex items-center gap-1 disabled:opacity-50"
                            >
                              {isUpdating ? (
                                <Loader2 size={11} className="animate-spin text-noir-700" />
                              ) : (
                                <>
                                  <span>{stageInfo.nextLabel}</span>
                                  <ArrowRight size={11} />
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="p-4 text-sm font-medium tabular-nums text-noir-900">₹{order.amount}</td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end space-x-2 opacity-80 group-hover:opacity-100 transition-opacity">
                          {order.pdfUrl && (
                            <a
                              href={order.pdfUrl}
                              target="_blank"
                              rel="noreferrer"
                              download={`PerfectPic-Print-${order.id}.pdf`}
                              className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 px-2 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-sm flex items-center gap-1 shadow-xs"
                              title="Download Print PDF directly from S3"
                            >
                              <Download className="w-3 h-3 text-emerald-700" />
                              <span>PDF</span>
                            </a>
                          )}
                          <button
                            onClick={() => handleOpenFollowUpModal(order)}
                            className="text-xs font-medium text-noir-700 hover:text-noir-950 px-2 py-1 bg-cream-100 hover:bg-cream-200 rounded-sm flex items-center gap-1"
                            title="Follow-up with production team"
                          >
                            <MessageSquare className="w-3 h-3 text-noir-500" />
                            <span>Follow Up</span>
                          </button>
                          <Link 
                            href={`/orders/${order.id}`}
                            className="text-xs font-medium text-cream-50 bg-noir-950 hover:bg-noir-900 px-2.5 py-1 rounded-sm"
                          >
                            View
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-cream-200 flex items-center justify-between text-sm text-noir-500">
          <div>Showing {filteredOrders.length} results</div>
          <div className="flex space-x-1">
            <button className="p-1 rounded-sm hover:bg-cream-100 border border-transparent disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
            <button className="px-3 py-1 rounded-sm bg-noir-950 text-cream-50 font-medium">1</button>
            <button className="p-1 rounded-sm hover:bg-cream-100 border border-transparent"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {/* Stage Follow-Up & Update Modal */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-md shadow-luxury-lg border border-cream-300 max-w-lg w-full p-6 animate-in fade-in zoom-in-95 space-y-5">
            <div className="flex justify-between items-start border-b border-cream-200 pb-3">
              <div>
                <h3 className="text-lg font-semibold text-noir-950 flex items-center gap-2">
                  <span>Update Order Stage & Follow Up</span>
                </h3>
                <p className="text-xs text-noir-500 mt-0.5">
                  Order #{selectedOrder.id} • {selectedOrder.customer}
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-noir-400 hover:text-noir-950 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveModalStage} className="space-y-4 text-sm">
              {/* Target Stage Selector */}
              <div>
                <label className="block text-xs font-semibold text-noir-800 uppercase tracking-wider mb-2">
                  Select Target Stage
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ORDER_STAGES.filter(s => s.id !== 'cancelled').map((stage) => {
                    const isSelected = modalStage === stage.id;
                    return (
                      <button
                        key={stage.id}
                        type="button"
                        onClick={() => setModalStage(stage.id)}
                        className={cn(
                          "p-2.5 rounded-sm border text-left transition-all flex flex-col justify-between",
                          isSelected
                            ? "bg-noir-950 text-cream-50 border-noir-950 shadow-xs"
                            : "bg-cream-50/50 hover:bg-cream-100/70 border-cream-200 text-noir-800"
                        )}
                      >
                        <div className="flex items-center gap-1.5 font-semibold text-xs">
                          <span className={cn("w-2 h-2 rounded-full", stage.dotClass)}></span>
                          <span>{stage.label}</span>
                        </div>
                        <span className="text-[10px] opacity-70 mt-1 line-clamp-1">{stage.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Courier Tracking input (visible when Dispatched selected) */}
              {modalStage === 'dispatched' && (
                <div className="p-3 bg-indigo-50/60 border border-indigo-200 rounded-sm space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-900">
                    <Truck size={14} className="text-indigo-700" />
                    <span>Courier Logistics Details</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[11px] text-noir-600 mb-1">Carrier Name</label>
                      <input
                        type="text"
                        value={modalCarrier}
                        onChange={(e) => setModalCarrier(e.target.value)}
                        placeholder="BlueDart Express"
                        className="w-full p-2 bg-white border border-cream-300 rounded-sm text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-noir-600 mb-1">AWB Tracking #</label>
                      <input
                        type="text"
                        value={modalTrackingNumber}
                        onChange={(e) => setModalTrackingNumber(e.target.value)}
                        placeholder="BD928374182IN"
                        className="w-full p-2 bg-white border border-cream-300 rounded-sm text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Internal Follow-Up Note */}
              <div>
                <label className="block text-xs font-semibold text-noir-800 uppercase tracking-wider mb-1">
                  Team Follow-Up Note (Optional)
                </label>
                <textarea
                  rows={3}
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  placeholder="e.g. Press run started on Indigo 12K. Color calibration approved for high-contrast mountain photos. Priority order."
                  className="w-full p-2.5 bg-cream-50 border border-cream-300 rounded-sm text-xs focus:outline-none focus:border-noir-400 focus:ring-1 focus:ring-noir-400"
                ></textarea>
                <p className="text-[11px] text-noir-500 mt-1">
                  This note will be logged in the order history for the bindery and QC team to follow up.
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-cream-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-cream-300 rounded-sm text-xs font-medium text-noir-700 hover:bg-cream-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="px-5 py-2 bg-noir-950 hover:bg-noir-900 text-cream-50 rounded-sm text-xs font-semibold uppercase tracking-wider transition-colors shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  {modalSubmitting ? (
                    <>
                      <Loader2 size={13} className="animate-spin text-foil-gold" />
                      <span>Updating Stage...</span>
                    </>
                  ) : (
                    <span>Update Stage & Save Note</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
