"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  CalendarHeart,
  Search, 
  RefreshCw, 
  Mail, 
  Phone, 
  Send, 
  Copy, 
  Check, 
  Clock, 
  AlertCircle, 
  TrendingUp, 
  IndianRupee, 
  CheckCircle2, 
  ExternalLink,
  ChevronRight,
  Gift,
  Flame,
  ShieldCheck,
  Percent,
  Layers,
  ArrowUpRight,
  SlidersHorizontal,
  X,
  Play,
  Heart,
  Plane,
  Baby,
  Cake,
  Sparkles,
  Calendar,
  MessageSquare
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { getStorefrontUrl } from "@/lib/urls";

interface MilestoneCandidate {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  orderTitle: string;
  orderDate: string;
  daysSinceOrder: number;
  yearsElapsed: number;
  nextAnniversaryYear: number;
  nextAnniversaryDate: string;
  daysUntil: number;
  stage: number;
  stageName: string;
  occasionType: string;
  milestoneLabel: string;
  thumbnail?: string;
  coverUrl?: string;
  orderTotal: number;
  remindersSent: Array<{
    stage: number;
    sentAt: string;
    channel: string;
    promoCode?: string;
  }>;
  hasSentCurrentStage: boolean;
  reorderUrl: string;
  isOptedOut?: boolean;
}

interface AnniversaryMetrics {
  totalUpcomingMilestones30d: number;
  totalUpcomingMilestones60d: number;
  totalRemindersSent: number;
  repeatConversionRate: number;
  attributedRevenue: number;
  repeatOrdersCount: number;
  stageBreakdown: { stage1: number; stage2: number; stage3: number };
  occasionBreakdown: Record<string, number>;
  channelDeliveryRate: { whatsapp: number; email: number };
  lastSweepAt?: string;
}

export default function AnniversariesPage() {
  const [candidates, setCandidates] = useState<MilestoneCandidate[]>([]);
  const [metrics, setMetrics] = useState<AnniversaryMetrics>({
    totalUpcomingMilestones30d: 4,
    totalUpcomingMilestones60d: 7,
    totalRemindersSent: 18,
    repeatConversionRate: 24.8,
    attributedRevenue: 47700,
    repeatOrdersCount: 18,
    stageBreakdown: { stage1: 2, stage2: 3, stage3: 2 },
    occasionBreakdown: {
      wedding: 2,
      anniversary: 2,
      travel: 2,
      baby: 1,
      birthday: 0,
      annual: 0,
      holiday: 0,
      other: 0,
    },
    channelDeliveryRate: { whatsapp: 98.2, email: 99.1 },
    lastSweepAt: new Date().toISOString(),
  });
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [occasionFilter, setOccasionFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sweepLoading, setSweepLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Manual Trigger & Preview Modal State
  const [selectedCandidate, setSelectedCandidate] = useState<MilestoneCandidate | null>(null);
  const [modalStage, setModalStage] = useState<number>(2);
  const [modalChannel, setModalChannel] = useState<"whatsapp" | "email" | "all">("all");
  const [modalPromo, setModalPromo] = useState<string>("ANNIVERSARY15");
  const [modalSending, setModalSending] = useState(false);
  const [modalPreviewTab, setModalPreviewTab] = useState<"whatsapp" | "email">("whatsapp");
  const [previewData, setPreviewData] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [candRes, metricsRes] = await Promise.all([
        adminApi.getUpcomingAnniversaries({
          stage: stageFilter === "all" ? undefined : stageFilter,
          search: searchQuery || undefined,
        }).catch(() => null),
        adminApi.getAnniversaryMetrics().catch(() => null),
      ]);

      if (candRes?.candidates) {
        setCandidates(candRes.candidates);
      }
      if (metricsRes?.metrics) {
        setMetrics(metricsRes.metrics);
      }
    } catch (err: any) {
      console.error("Failed to load anniversary CRM data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [stageFilter, searchQuery]);

  // Load preview whenever modal candidate, stage, or promo changes
  useEffect(() => {
    if (!selectedCandidate) {
      setPreviewData(null);
      return;
    }
    const fetchPreview = async () => {
      setPreviewLoading(true);
      try {
        const res = await adminApi.previewAnniversaryTemplates(selectedCandidate.orderId, {
          stage: modalStage,
          promoCode: modalPromo,
        });
        if (res?.preview) {
          setPreviewData(res.preview);
        }
      } catch (err) {
        console.error("Preview generation failed:", err);
      } finally {
        setPreviewLoading(false);
      }
    };
    fetchPreview();
  }, [selectedCandidate, modalStage, modalPromo]);

  // Filter candidates by occasion
  const filteredCandidates = useMemo(() => {
    if (occasionFilter === "all") return candidates;
    return candidates.filter((c) => c.occasionType.toLowerCase() === occasionFilter.toLowerCase());
  }, [candidates, occasionFilter]);

  const handleOpenModal = (candidate: MilestoneCandidate) => {
    setSelectedCandidate(candidate);
    setModalStage(candidate.stage || 2);
    setModalChannel("all");
    setModalPromo("ANNIVERSARY15");
  };

  const handleTriggerReminder = async () => {
    if (!selectedCandidate) return;
    setModalSending(true);

    try {
      const res = await adminApi.triggerAnniversaryReminder(selectedCandidate.orderId, {
        stage: modalStage,
        channel: modalChannel,
        customPromo: modalPromo,
      });

      if (res?.success) {
        showToast(`✨ Milestone reminder dispatched for ${selectedCandidate.customerName}!`, "success");
        setSelectedCandidate(null);
        loadData();
      } else {
        showToast(res?.message || "Failed to dispatch reminder.", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to dispatch reminder.", "error");
    } finally {
      setModalSending(false);
    }
  };

  const handleProcessSweep = async () => {
    setSweepLoading(true);
    try {
      const res = await adminApi.processAnniversarySweep();
      if (res?.success) {
        showToast(
          `✅ Daily sweep completed: ${res.summary.successful} reminders dispatched across ${res.summary.processed} upcoming milestones!`,
          "success"
        );
        loadData();
      } else {
        showToast("Milestone sweep encountered an error.", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Sweep execution failed.", "error");
    } finally {
      setSweepLoading(false);
    }
  };

  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    showToast("Reorder link with ANNIVERSARY15 promo copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2500);
  };

  const getOccasionIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "wedding":
      case "anniversary":
        return <Heart className="w-3.5 h-3.5 text-rose-400" />;
      case "travel":
        return <Plane className="w-3.5 h-3.5 text-cyan-400" />;
      case "baby":
        return <Baby className="w-3.5 h-3.5 text-purple-400" />;
      case "birthday":
        return <Cake className="w-3.5 h-3.5 text-fuchsia-400" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  const getOccasionBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case "wedding":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "anniversary":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      case "travel":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
      case "baby":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "birthday":
        return "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20";
      default:
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Toast Notification */}
      {toast && (
        <div
          className={cn(
            "fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-lg shadow-2xl border text-sm font-medium transition-all transform animate-in slide-in-from-bottom-5",
            toast.type === "success"
              ? "bg-noir-900 border-emerald-500/40 text-emerald-400"
              : "bg-noir-900 border-rose-500/40 text-rose-400"
          )}
        >
          {toast.type === "success" ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <CalendarHeart className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-serif text-cream-50 font-medium tracking-wide">
                Anniversary & Milestone Reminder Engine
              </h1>
              <p className="text-xs text-noir-400 mt-0.5">
                Automated multi-stage retention engine transforming one-time photobook buyers into lifelong annual collectors.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-noir-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleProcessSweep}
            disabled={sweepLoading}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-noir-950 bg-gradient-to-r from-foil-gold to-amber-300 hover:brightness-110 rounded-lg shadow-lg shadow-foil-gold/10 transition-all disabled:opacity-50"
          >
            {sweepLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-noir-950" />
                <span>Sweeping Milestones...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-noir-950" />
                <span>Run Daily Drip Sweep</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Upcoming in 30 Days */}
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-5 shadow-luxury-sm">
          <div className="flex items-center justify-between text-noir-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Upcoming Milestones</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
              Next 30 Days
            </span>
          </div>
          <div className="text-3xl font-serif font-bold text-cream-50 mt-1">
            {metrics.totalUpcomingMilestones30d}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-noir-400">
              60-Day Horizon: <strong className="text-noir-200">{metrics.totalUpcomingMilestones60d}</strong>
            </span>
            <span className="text-rose-400 font-medium flex items-center gap-1">
              <Flame className="w-3.5 h-3.5" /> High Intent
            </span>
          </div>
        </div>

        {/* Card 2: Reminders Sent */}
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-5 shadow-luxury-sm">
          <div className="flex items-center justify-between text-noir-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Automated Reminders</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-foil-gold/10 text-foil-gold border border-foil-gold/20">
              Dispatched
            </span>
          </div>
          <div className="text-3xl font-serif font-bold text-cream-50 mt-1">
            {metrics.totalRemindersSent}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-emerald-400 flex items-center gap-1">
              <Phone className="w-3 h-3" /> WA: {metrics.channelDeliveryRate.whatsapp}%
            </span>
            <span className="text-cyan-400 flex items-center gap-1">
              <Mail className="w-3 h-3" /> Email: {metrics.channelDeliveryRate.email}%
            </span>
          </div>
        </div>

        {/* Card 3: Milestone Repeat Rate */}
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-5 shadow-luxury-sm">
          <div className="flex items-center justify-between text-noir-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Annual Repeat Rate</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Conversion
            </span>
          </div>
          <div className="text-3xl font-serif font-bold text-emerald-400 mt-1">
            {metrics.repeatConversionRate}%
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-noir-400">
              Attributed: <strong className="text-cream-100">{metrics.repeatOrdersCount} reorders</strong>
            </span>
            <span className="text-emerald-400 font-medium flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" /> +14.2%
            </span>
          </div>
        </div>

        {/* Card 4: Attributed Revenue */}
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-5 shadow-luxury-sm">
          <div className="flex items-center justify-between text-noir-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Milestone Revenue</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              LTV Boost
            </span>
          </div>
          <div className="text-3xl font-serif font-bold text-foil-gold mt-1">
            ₹{metrics.attributedRevenue.toLocaleString("en-IN")}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-noir-400">
            <span>Avg AOV: ₹2,650</span>
            <span className="text-foil-gold font-medium">Coupon: ANNIVERSARY15</span>
          </div>
        </div>
      </div>

      {/* Occasion Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/5 scrollbar-none">
        <span className="text-xs font-semibold uppercase tracking-wider text-noir-400 mr-2 shrink-0">
          Occasion:
        </span>
        {[
          { id: "all", label: "All Occasions", count: candidates.length },
          { id: "wedding", label: "Weddings", count: metrics.occasionBreakdown.wedding },
          { id: "anniversary", label: "Anniversaries", count: metrics.occasionBreakdown.anniversary },
          { id: "travel", label: "Travel & Vacations", count: metrics.occasionBreakdown.travel },
          { id: "baby", label: "Baby & 1st Year", count: metrics.occasionBreakdown.baby },
          { id: "birthday", label: "Birthdays", count: metrics.occasionBreakdown.birthday },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setOccasionFilter(item.id)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 border",
              occasionFilter === item.id
                ? "bg-foil-gold/15 text-foil-gold border-foil-gold/40 shadow-sm"
                : "bg-white/[0.03] text-noir-300 border-white/5 hover:bg-white/[0.08]"
            )}
          >
            <span>{item.label}</span>
            {item.count !== undefined && item.count > 0 && (
              <span
                className={cn(
                  "px-1.5 py-0.2 rounded-full text-[10px]",
                  occasionFilter === item.id ? "bg-foil-gold/30 text-white" : "bg-white/10 text-noir-400"
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Controls & Search Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Stage Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-white/[0.04] border border-white/10 rounded-xl overflow-x-auto">
          {[
            { id: "all", label: "All Stages" },
            { id: "1", label: "Stage 1: Nostalgia (60d)" },
            { id: "2", label: "Stage 2: 15% Privilege (30d)" },
            { id: "3", label: "Stage 3: Urgent Delivery (14d)" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStageFilter(tab.id)}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
                stageFilter === tab.id
                  ? "bg-white/15 text-white shadow-sm font-semibold"
                  : "text-noir-400 hover:text-noir-200 hover:bg-white/5"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[280px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-noir-400" />
          <input
            type="text"
            placeholder="Search collector, email, book title, order #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/[0.03] border border-white/10 rounded-xl text-xs text-cream-50 placeholder-noir-500 focus:outline-none focus:border-foil-gold/50 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-noir-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Candidates Data Table */}
      <div className="rounded-xl border border-white/10 bg-noir-950/40 backdrop-blur-sm overflow-hidden shadow-luxury-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/[0.03] border-b border-white/10 text-noir-400 uppercase tracking-wider text-[11px] font-medium">
              <tr>
                <th className="py-3.5 px-4">Collector & Contact</th>
                <th className="py-3.5 px-4">Original Keepsake Volume</th>
                <th className="py-3.5 px-4">Occasion & Milestone</th>
                <th className="py-3.5 px-4">Anniversary Celebration</th>
                <th className="py-3.5 px-4">Retention Drip Stage</th>
                <th className="py-3.5 px-4">Status & Dispatch</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-noir-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-foil-gold" />
                    <span>Analyzing order histories & calculating anniversary milestones...</span>
                  </td>
                </tr>
              ) : filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-noir-400">
                    <CalendarHeart className="w-8 h-8 mx-auto mb-2 text-noir-600 opacity-60" />
                    <p className="text-sm text-noir-300">No milestone candidates found matching filters.</p>
                    <p className="text-xs text-noir-500 mt-1">
                      Try clearing search or switching to "All Stages".
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((candidate) => (
                  <tr
                    key={candidate.orderId}
                    className="hover:bg-white/[0.02] transition-colors group"
                  >
                    {/* Collector */}
                    <td className="py-4 px-4">
                      <div className="font-medium text-cream-100 text-sm">
                        {candidate.customerName}
                      </div>
                      <div className="text-noir-400 text-xs mt-0.5 flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {candidate.customerEmail || "No email"}
                      </div>
                      {candidate.customerPhone && (
                        <div className="text-noir-400 text-xs mt-0.5 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-emerald-400" /> {candidate.customerPhone}
                        </div>
                      )}
                    </td>

                    {/* Original Book */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        {candidate.thumbnail ? (
                          <img
                            src={candidate.thumbnail}
                            alt={candidate.orderTitle}
                            className="w-12 h-12 object-cover rounded-md border border-white/10 shrink-0 shadow-sm"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-md bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-noir-400">
                            <Sparkles className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                          <div className="font-serif text-cream-100 line-clamp-1 max-w-[180px]">
                            {candidate.orderTitle}
                          </div>
                          <div className="text-[11px] text-noir-400 mt-0.5">
                            Order: <span className="font-mono text-noir-300">{candidate.orderNumber}</span> • ₹{candidate.orderTotal}
                          </div>
                          <div className="text-[10px] text-noir-500">
                            Placed {candidate.daysSinceOrder} days ago
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Occasion */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border",
                            getOccasionBadge(candidate.occasionType)
                          )}
                        >
                          {getOccasionIcon(candidate.occasionType)}
                          <span className="capitalize">{candidate.occasionType}</span>
                        </span>
                      </div>
                      <div className="text-noir-200 font-medium text-xs">
                        {candidate.milestoneLabel}
                      </div>
                      <div className="text-[10px] text-noir-400 mt-0.5">
                        Year {candidate.nextAnniversaryYear} Celebration
                      </div>
                    </td>

                    {/* Celebration Date */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 text-cream-100 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-rose-400" />
                        <span>
                          {new Date(candidate.nextAnniversaryDate).toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="mt-1">
                        {candidate.daysUntil <= 14 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold animate-pulse">
                            <Flame className="w-3 h-3" /> {candidate.daysUntil} days left (Urgent)
                          </span>
                        ) : candidate.daysUntil <= 35 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-semibold">
                            <Clock className="w-3 h-3" /> {candidate.daysUntil} days left
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-medium">
                            <Clock className="w-3 h-3" /> {candidate.daysUntil} days left
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Drip Stage */}
                    <td className="py-4 px-4">
                      {candidate.stage === 1 && (
                        <div className="inline-block px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                          <div className="font-semibold text-[11px]">Stage 1: Nostalgia</div>
                          <div className="text-[10px] text-cyan-400/80">Memory Curation (~60d)</div>
                        </div>
                      )}
                      {candidate.stage === 2 && (
                        <div className="inline-block px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300">
                          <div className="font-semibold text-[11px] flex items-center gap-1">
                            <Percent className="w-3 h-3" /> Stage 2: 15% Off
                          </div>
                          <div className="text-[10px] text-amber-400/80">Loyalty Incentive (~30d)</div>
                        </div>
                      )}
                      {candidate.stage === 3 && (
                        <div className="inline-block px-2.5 py-1 rounded-md bg-rose-500/15 border border-rose-500/40 text-rose-300">
                          <div className="font-semibold text-[11px] flex items-center gap-1">
                            <Flame className="w-3 h-3 text-rose-400" /> Stage 3: Deadline
                          </div>
                          <div className="text-[10px] text-rose-400/80">Guaranteed Print Delivery</div>
                        </div>
                      )}
                    </td>

                    {/* Status & Sent History */}
                    <td className="py-4 px-4">
                      {candidate.remindersSent && candidate.remindersSent.length > 0 ? (
                        <div className="space-y-1">
                          {candidate.remindersSent.map((r, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>Stage {r.stage} Dispatched</span>
                              <span className="text-[10px] text-noir-400">
                                ({new Date(r.sentAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })})
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-noir-400">
                          <Clock className="w-3 h-3" /> Pending Dispatch
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleCopyLink(candidate.reorderUrl, candidate.orderId)}
                          title="Copy customer 1-click reorder link"
                          className="p-2 text-noir-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors"
                        >
                          {copiedId === candidate.orderId ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <button
                          onClick={() => handleOpenModal(candidate)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-foil-gold/20 to-amber-500/20 hover:from-foil-gold/30 hover:to-amber-500/30 text-foil-gold border border-foil-gold/40 shadow-sm transition-all"
                        >
                          <Send className="w-3 h-3" />
                          <span>Send Reminder</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Trigger & Preview Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-3xl rounded-2xl border border-white/15 bg-noir-950 p-6 md:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  CRM Re-Engagement Prompt
                </span>
                <h3 className="text-xl font-serif text-cream-50 font-medium mt-1">
                  Send Milestone Reminder to {selectedCandidate.customerName}
                </h3>
                <p className="text-xs text-noir-400 mt-0.5">
                  Celebrating {selectedCandidate.milestoneLabel} ({selectedCandidate.daysUntil} days remaining)
                </p>
              </div>

              <button
                onClick={() => setSelectedCandidate(null)}
                className="p-2 text-noir-400 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stage Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-noir-300 mb-2">
                1. Select Re-Engagement Stage:
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  {
                    stage: 1,
                    title: "Stage 1: Nostalgia Check-in",
                    subtitle: "Memory reflection (~60d before)",
                    badge: "Gentle",
                  },
                  {
                    stage: 2,
                    title: "Stage 2: 15% Privilege",
                    subtitle: "Loyalty promo code (~30d before)",
                    badge: "High Conversion",
                  },
                  {
                    stage: 3,
                    title: "Stage 3: Print Urgency",
                    subtitle: "Guaranteed delivery (~14d before)",
                    badge: "Final Deadline",
                  },
                ].map((s) => (
                  <button
                    key={s.stage}
                    onClick={() => setModalStage(s.stage)}
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all",
                      modalStage === s.stage
                        ? "bg-foil-gold/15 border-foil-gold/50 shadow-md"
                        : "bg-white/[0.03] border-white/10 hover:bg-white/[0.06]"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-cream-100">{s.title}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-noir-300 uppercase">
                        {s.badge}
                      </span>
                    </div>
                    <div className="text-[11px] text-noir-400 mt-1">{s.subtitle}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Channels & Promo Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Channel Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-noir-300 mb-2">
                  2. Dispatch Channel:
                </label>
                <div className="flex gap-2">
                  {[
                    { id: "all", label: "WhatsApp & Email (Omni)", icon: Sparkles },
                    { id: "whatsapp", label: "WhatsApp Only", icon: Phone },
                    { id: "email", label: "Email Only", icon: Mail },
                  ].map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setModalChannel(c.id as any)}
                      className={cn(
                        "flex-1 p-2.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-all",
                        modalChannel === c.id
                          ? "bg-white/20 border-white/40 text-white font-semibold"
                          : "bg-white/[0.03] border-white/10 text-noir-400 hover:text-white"
                      )}
                    >
                      <c.icon className="w-3.5 h-3.5" />
                      <span>{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Promo Code Override */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-noir-300 mb-2">
                  3. Loyalty Privilege Code:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={modalPromo}
                    onChange={(e) => setModalPromo(e.target.value.toUpperCase())}
                    placeholder="ANNIVERSARY15"
                    className="flex-1 px-3.5 py-2 rounded-lg bg-white/[0.05] border border-white/15 text-xs font-mono font-bold tracking-wider text-foil-gold focus:outline-none focus:border-foil-gold uppercase"
                  />
                  <span className="text-xs text-emerald-400 font-medium">15% Discount</span>
                </div>
              </div>
            </div>

            {/* Live Message Preview */}
            <div className="rounded-xl border border-white/10 bg-black/40 overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5 bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setModalPreviewTab("whatsapp")}
                    className={cn(
                      "px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1.5",
                      modalPreviewTab === "whatsapp"
                        ? "bg-emerald-500/20 text-emerald-400 font-semibold"
                        : "text-noir-400 hover:text-white"
                    )}
                  >
                    <Phone className="w-3 h-3" /> WhatsApp Template
                  </button>
                  <button
                    onClick={() => setModalPreviewTab("email")}
                    className={cn(
                      "px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1.5",
                      modalPreviewTab === "email"
                        ? "bg-cyan-500/20 text-cyan-400 font-semibold"
                        : "text-noir-400 hover:text-white"
                    )}
                  >
                    <Mail className="w-3 h-3" /> Luxury HTML Email
                  </button>
                </div>

                <span className="text-[10px] text-noir-400">Live Customer Preview</span>
              </div>

              <div className="p-4 max-h-60 overflow-y-auto">
                {previewLoading ? (
                  <div className="py-8 text-center text-noir-400 text-xs">
                    <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-1 text-foil-gold" />
                    Rendering preview...
                  </div>
                ) : modalPreviewTab === "whatsapp" ? (
                  <div className="bg-[#0b141a] p-4 rounded-xl border border-emerald-500/20 max-w-lg mx-auto font-sans text-xs text-cream-100 whitespace-pre-wrap leading-relaxed shadow-lg">
                    {previewData?.whatsapp || "Generating WhatsApp copy..."}
                  </div>
                ) : (
                  <div className="bg-white p-4 rounded-xl text-noir-900 max-w-lg mx-auto text-xs shadow-lg">
                    <div className="font-bold text-sm text-black mb-1">
                      Subject: {previewData?.email?.subject}
                    </div>
                    <div className="text-[11px] text-noir-600 mb-3 border-b pb-2">
                      To: {selectedCandidate.customerEmail || "collector@example.com"}
                    </div>
                    <div
                      className="border p-3 rounded bg-[#FAF8F5] text-xs leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: previewData?.email?.html || "<p>Loading email preview...</p>",
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-between border-t border-white/10 pt-4">
              <div className="text-xs text-noir-400">
                Recipient: <strong className="text-white">{selectedCandidate.customerName}</strong> (
                {modalChannel === "whatsapp" ? selectedCandidate.customerPhone : selectedCandidate.customerEmail})
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedCandidate(null)}
                  className="px-4 py-2 text-xs text-noir-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  Cancel
                </button>

                <button
                  onClick={handleTriggerReminder}
                  disabled={modalSending}
                  className="flex items-center gap-2 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-noir-950 bg-gradient-to-r from-foil-gold to-amber-300 hover:brightness-110 rounded-lg shadow-lg shadow-foil-gold/15 transition-all disabled:opacity-50"
                >
                  {modalSending ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-noir-950" />
                      <span>Dispatching...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Dispatch Milestone Reminder</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
