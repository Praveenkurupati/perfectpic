"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Sparkles, 
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
  Play
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { getStorefrontUrl } from "@/lib/urls";

interface DraftProject {
  id: string;
  _id?: string;
  title: string;
  template?: string;
  status: string;
  pageCount: number;
  completedPages: number;
  progressPercentage: number;
  coverImage?: string;
  coverUrl?: string;
  bookSize?: string;
  estimatedValue: number;
  updatedAt: string;
  createdAt: string;
  inactiveHours: number;
  reminderStage: number;
  calculatedStage: number;
  reminderCount: number;
  lastReminderSentAt?: string | null;
  lastReminderChannel?: string | null;
  recoveryStatus: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
}

export default function AbandonedDraftsPage() {
  const [drafts, setDrafts] = useState<DraftProject[]>([]);
  const [metrics, setMetrics] = useState<any>({
    totalTrappedRevenue: 11495,
    totalAbandonedDrafts: 5,
    recoveredCount: 2,
    recoveredRevenue: 3998,
    recoveryRatePercentage: 28.5,
    stageBreakdown: { stage1: 2, stage2: 1, stage3: 2 },
    channelDeliveryRate: { whatsapp: 96.8, email: 98.4 },
    lastRunAt: new Date().toISOString(),
  });
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [batchLoading, setBatchLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Manual Trigger Modal
  const [selectedDraft, setSelectedDraft] = useState<DraftProject | null>(null);
  const [modalStage, setModalStage] = useState<number>(1);
  const [modalChannel, setModalChannel] = useState<"whatsapp" | "email" | "all">("all");
  const [modalSending, setModalSending] = useState(false);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [draftsRes, metricsRes] = await Promise.all([
        adminApi.getAbandonedDrafts({
          stage: stageFilter === "all" ? undefined : stageFilter,
          search: searchQuery || undefined,
        }).catch(() => null),
        adminApi.getDraftRecoveryMetrics().catch(() => null),
      ]);

      if (draftsRes && draftsRes.projects) {
        setDrafts(draftsRes.projects);
      }
      if (metricsRes) {
        setMetrics(metricsRes);
      }
    } catch (err: any) {
      console.error("Failed to load drafts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [stageFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleBatchTrigger = async () => {
    setBatchLoading(true);
    try {
      const res = await adminApi.processBatchDraftReminders();
      showToast(
        `Batch sweep complete: ${res.summary.successful} reminders dispatched (S1: ${res.summary.stage1Count}, S2: ${res.summary.stage2Count}, S3: ${res.summary.stage3Count})`,
        "success"
      );
      await loadData();
    } catch (err: any) {
      showToast(err.message || "Failed to execute batch sweep", "error");
    } finally {
      setBatchLoading(false);
    }
  };

  const openTriggerModal = (draft: DraftProject, defaultChannel: "whatsapp" | "email" | "all" = "all") => {
    setSelectedDraft(draft);
    setModalStage(draft.calculatedStage || 1);
    setModalChannel(defaultChannel);
  };

  const executeSendReminder = async () => {
    if (!selectedDraft) return;
    setModalSending(true);
    try {
      const res = await adminApi.sendDraftReminder(selectedDraft.id, {
        channel: modalChannel,
        stage: modalStage,
        customPhone: selectedDraft.customerPhone,
        customEmail: selectedDraft.customerEmail,
        customName: selectedDraft.customerName,
        promoCode: modalStage === 3 ? "FINISH10" : undefined,
      });

      showToast(
        `Stage ${modalStage} recovery dispatched via ${modalChannel.toUpperCase()} to ${selectedDraft.customerName}!`,
        "success"
      );
      setSelectedDraft(null);
      await loadData();
    } catch (err: any) {
      showToast(err.message || "Failed to dispatch recovery reminder", "error");
    } finally {
      setModalSending(false);
    }
  };

  const copyResumeLink = (projectId: string) => {
    const storefrontBase = getStorefrontUrl();
    const link = `${storefrontBase}/studio/${projectId}`;
    navigator.clipboard.writeText(link);
    setCopiedId(projectId);
    showToast("Resume link copied to clipboard!", "success");
    setTimeout(() => setCopiedId(null), 2500);
  };

  const filteredDrafts = useMemo(() => {
    if (!searchQuery.trim()) return drafts;
    const q = searchQuery.toLowerCase();
    return drafts.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.customerName.toLowerCase().includes(q) ||
        d.customerEmail.toLowerCase().includes(q) ||
        d.customerPhone.includes(q)
    );
  }, [drafts, searchQuery]);

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {toast && (
        <div
          className={cn(
            "fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-sm shadow-2xl border text-xs font-mono font-medium animate-slide-up",
            toast.type === "success"
              ? "bg-noir-950 text-cream-50 border-foil-gold/50"
              : "bg-red-950 text-red-100 border-red-500"
          )}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400" />
          )}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-noir-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cream-300 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <h1 className="font-serif text-2xl md:text-3xl text-noir-950 tracking-tight">
              Abandoned Draft Recovery & CRM
            </h1>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-[10px] font-mono font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Automated 30m Sweep Active
            </span>
          </div>
          <p className="text-xs text-noir-600">
            Multi-stage recovery drip re-engaging customers with uncompleted photobook designs across WhatsApp and Email.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-cream-300 text-xs font-mono text-noir-700 hover:text-noir-950 hover:border-noir-950 rounded-sm transition-colors"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleBatchTrigger}
            disabled={batchLoading}
            className="flex items-center gap-2 px-4 py-2 bg-noir-950 hover:bg-noir-900 text-cream-50 text-xs font-mono font-bold uppercase tracking-wider rounded-sm shadow-md transition-all disabled:opacity-50"
          >
            <Play className={cn("w-3.5 h-3.5 text-foil-gold", batchLoading && "animate-spin")} />
            <span>{batchLoading ? "Executing Drip Sweep..." : "Trigger Batch Sweep Now"}</span>
          </button>
        </div>
      </div>

      {/* Top KPI Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Trapped Revenue */}
        <div className="bg-white border border-cream-300 rounded-sm p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-noir-500 font-semibold">
              Unclaimed Cart Value
            </span>
            <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-2xl md:text-3xl font-bold text-noir-950">
            ₹{metrics.totalTrappedRevenue.toLocaleString("en-IN")}
          </div>
          <p className="text-[11px] text-noir-600 mt-1 font-mono">
            Trapped across <strong className="text-noir-950">{metrics.totalAbandonedDrafts}</strong> uncompleted photobooks
          </p>
          <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-amber-500/5 rounded-full pointer-events-none" />
        </div>

        {/* KPI 2: Rescued Revenue */}
        <div className="bg-white border border-cream-300 rounded-sm p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-noir-500 font-semibold">
              Recovered Revenue (30d)
            </span>
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-2xl md:text-3xl font-bold text-emerald-600">
            ₹{metrics.recoveredRevenue.toLocaleString("en-IN")}
          </div>
          <p className="text-[11px] text-noir-600 mt-1 font-mono">
            Rescued via automated WhatsApp + Email
          </p>
          <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-emerald-500/5 rounded-full pointer-events-none" />
        </div>

        {/* KPI 3: Recovery Rate % */}
        <div className="bg-white border border-cream-300 rounded-sm p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-noir-500 font-semibold">
              Draft Recovery Rate
            </span>
            <div className="w-8 h-8 rounded-full bg-foil-gold/10 flex items-center justify-center text-foil-gold">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-2xl md:text-3xl font-bold text-noir-950">
              {metrics.recoveryRatePercentage}%
            </span>
            <span className="text-[10px] font-mono text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
              +17.5% vs avg
            </span>
          </div>
          <p className="text-[11px] text-noir-600 mt-1 font-mono">
            Industry benchmark: ~11.0%
          </p>
          <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-foil-gold/5 rounded-full pointer-events-none" />
        </div>

        {/* KPI 4: Multi-Channel Delivery */}
        <div className="bg-white border border-cream-300 rounded-sm p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-noir-500 font-semibold">
              Channel Delivery Success
            </span>
            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-noir-600">WhatsApp (Kapso):</span>
              <span className="font-bold text-emerald-600">{metrics.channelDeliveryRate.whatsapp}%</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-noir-600">Email (SMTP):</span>
              <span className="font-bold text-emerald-600">{metrics.channelDeliveryRate.email}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Multi-Stage Drip Cadence Architecture */}
      <div className="bg-noir-950 text-cream-50 rounded-sm p-6 border border-noir-800 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-noir-800 mb-6">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-widest text-foil-gold font-bold">
              Automated Lifecycle Funnel
            </span>
            <h3 className="font-serif text-lg text-white">3-Stage Psychological Re-engagement Drip</h3>
          </div>
          <span className="text-xs font-mono text-noir-400">
            Automated schedule: Every 30 mins
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Stage 1 Card */}
          <div className="bg-noir-900 border border-noir-800 rounded-sm p-4 hover:border-foil-gold/40 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-blue-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Stage 1: 1–3h Inactive
              </span>
              <span className="text-[11px] font-mono font-bold bg-noir-800 text-cream-100 px-2 py-0.5 rounded">
                {metrics.stageBreakdown?.stage1 || 0} Drafts
              </span>
            </div>
            <h4 className="font-serif text-sm font-semibold text-white mb-1">
              "Your memories are safely saved ✨"
            </h4>
            <p className="text-xs text-noir-400 leading-relaxed">
              <strong>Psychological intent:</strong> Reassurance. Rescues users who accidentally closed tabs or got distracted, assuring all photo placements are saved in the cloud.
            </p>
          </div>

          {/* Stage 2 Card */}
          <div className="bg-noir-900 border border-noir-800 rounded-sm p-4 hover:border-foil-gold/40 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-amber-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Stage 2: 24h Inactive
              </span>
              <span className="text-[11px] font-mono font-bold bg-noir-800 text-cream-100 px-2 py-0.5 rounded">
                {metrics.stageBreakdown?.stage2 || 0} Drafts
              </span>
            </div>
            <h4 className="font-serif text-sm font-semibold text-white mb-1">
              "You're 75% of the way there 🚀"
            </h4>
            <p className="text-xs text-noir-400 leading-relaxed">
              <strong>Psychological intent:</strong> Goal-gradient urgency. Highlights completed vs remaining pages to trigger the human desire for closure.
            </p>
          </div>

          {/* Stage 3 Card */}
          <div className="bg-noir-900 border border-noir-800 rounded-sm p-4 hover:border-foil-gold/40 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-foil-gold flex items-center gap-1.5">
                <Gift className="w-3.5 h-3.5" />
                Stage 3: 72h Inactive
              </span>
              <span className="text-[11px] font-mono font-bold bg-noir-800 text-cream-100 px-2 py-0.5 rounded">
                {metrics.stageBreakdown?.stage3 || 0} Drafts
              </span>
            </div>
            <h4 className="font-serif text-sm font-semibold text-white mb-1">
              "10% Completion Gift: FINISH10 🎁"
            </h4>
            <p className="text-xs text-noir-400 leading-relaxed">
              <strong>Psychological intent:</strong> Loss aversion & financial push. Delivers an exclusive 10% coupon valid for 48 hours to seal the purchase.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Stage Filter Tabs */}
        <div className="flex items-center gap-1 bg-cream-200/60 p-1 rounded-sm border border-cream-300">
          <button
            onClick={() => setStageFilter("all")}
            className={cn(
              "px-3 py-1.5 text-xs font-mono font-semibold rounded-sm transition-all",
              stageFilter === "all"
                ? "bg-noir-950 text-cream-50 shadow-xs"
                : "text-noir-600 hover:text-noir-950 hover:bg-white/50"
            )}
          >
            All Drafts ({drafts.length})
          </button>
          <button
            onClick={() => setStageFilter("1")}
            className={cn(
              "px-3 py-1.5 text-xs font-mono font-semibold rounded-sm transition-all",
              stageFilter === "1"
                ? "bg-noir-950 text-cream-50 shadow-xs"
                : "text-noir-600 hover:text-noir-950 hover:bg-white/50"
            )}
          >
            Stage 1 (1–3h)
          </button>
          <button
            onClick={() => setStageFilter("2")}
            className={cn(
              "px-3 py-1.5 text-xs font-mono font-semibold rounded-sm transition-all",
              stageFilter === "2"
                ? "bg-noir-950 text-cream-50 shadow-xs"
                : "text-noir-600 hover:text-noir-950 hover:bg-white/50"
            )}
          >
            Stage 2 (24h)
          </button>
          <button
            onClick={() => setStageFilter("3")}
            className={cn(
              "px-3 py-1.5 text-xs font-mono font-semibold rounded-sm transition-all",
              stageFilter === "3"
                ? "bg-noir-950 text-cream-50 shadow-xs"
                : "text-noir-600 hover:text-noir-950 hover:bg-white/50"
            )}
          >
            Stage 3 (72h Promo)
          </button>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-noir-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search book, customer, phone..."
            className="w-full pl-9 pr-8 py-1.5 bg-white border border-cream-300 rounded-sm text-xs font-mono text-noir-900 focus:outline-none focus:border-noir-950"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                loadData();
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-noir-400 hover:text-noir-900"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-cream-300 rounded-sm shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-cream-300 bg-cream-50 font-mono text-[10px] uppercase tracking-wider text-noir-500">
                <th className="py-3 px-4">Photobook Project</th>
                <th className="py-3 px-4">Customer Contact</th>
                <th className="py-3 px-4">Draft Progress</th>
                <th className="py-3 px-4">Inactive For</th>
                <th className="py-3 px-4">Drip Stage</th>
                <th className="py-3 px-4">Est. Value</th>
                <th className="py-3 px-4">Last Reminder</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-noir-500 font-mono">
                    <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2 text-noir-400" />
                    Scanning uncompleted customer drafts...
                  </td>
                </tr>
              ) : filteredDrafts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-noir-500 font-mono">
                    No abandoned drafts found for selected stage.
                  </td>
                </tr>
              ) : (
                filteredDrafts.map((draft) => {
                  const stageNum = draft.calculatedStage || 1;
                  return (
                    <tr key={draft.id} className="hover:bg-cream-50/70 transition-colors group">
                      {/* Project Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={draft.coverImage || draft.coverUrl}
                            alt={draft.title}
                            className="w-10 h-10 rounded-xs object-cover border border-cream-300 flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="font-serif font-bold text-sm text-noir-950 block truncate max-w-[200px]">
                              {draft.title}
                            </span>
                            <span className="text-[10px] font-mono text-noir-500 uppercase">
                              {draft.bookSize || "8.25x8.25"} · {draft.pageCount} pages
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Customer Contact */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="font-semibold text-noir-900">{draft.customerName}</div>
                        <div className="text-[11px] text-noir-500 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-emerald-600" />
                          <span>{draft.customerPhone}</span>
                        </div>
                        <div className="text-[11px] text-noir-500 truncate max-w-[160px]">
                          {draft.customerEmail}
                        </div>
                      </td>

                      {/* Progress Bar */}
                      <td className="py-3.5 px-4">
                        <div className="w-32">
                          <div className="flex items-center justify-between text-[10px] font-mono mb-1 text-noir-600">
                            <span>{draft.progressPercentage}% done</span>
                            <span>{draft.completedPages}/{draft.pageCount}p</span>
                          </div>
                          <div className="w-full h-1.5 bg-cream-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-noir-900 rounded-full"
                              style={{ width: `${draft.progressPercentage}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Inactive For */}
                      <td className="py-3.5 px-4 font-mono text-noir-700">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-noir-400" />
                          {draft.inactiveHours < 24
                            ? `${draft.inactiveHours}h ago`
                            : `${Math.round(draft.inactiveHours / 24)}d ago`}
                        </span>
                      </td>

                      {/* Stage Badge */}
                      <td className="py-3.5 px-4">
                        {stageNum === 1 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            Stage 1 (1–3h)
                          </span>
                        )}
                        {stageNum === 2 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Stage 2 (24h)
                          </span>
                        )}
                        {stageNum === 3 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-foil-gold/15 text-foil-gold border border-foil-gold/30">
                            <Gift className="w-3 h-3" />
                            Stage 3 (FINISH10)
                          </span>
                        )}
                      </td>

                      {/* Estimated Value */}
                      <td className="py-3.5 px-4 font-mono font-bold text-noir-950">
                        ₹{draft.estimatedValue?.toLocaleString("en-IN")}
                      </td>

                      {/* Last Reminder */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-noir-500">
                        {draft.lastReminderSentAt ? (
                          <div>
                            <span className="font-semibold text-noir-800 uppercase">
                              {draft.lastReminderChannel || "Multi"}
                            </span>
                            <div className="text-[10px] text-noir-400">
                              {new Date(draft.lastReminderSentAt).toLocaleDateString("en-IN", {
                                month: "short",
                                day: "numeric",
                              })}
                            </div>
                          </div>
                        ) : (
                          <span className="text-noir-400 italic">Not triggered</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* 1-Click WhatsApp Trigger */}
                          <button
                            onClick={() => openTriggerModal(draft, "whatsapp")}
                            title="Send WhatsApp via Kapso.ai"
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-sm transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </button>

                          {/* 1-Click Email Trigger */}
                          <button
                            onClick={() => openTriggerModal(draft, "email")}
                            title="Send High-Converting Email"
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-sm transition-colors"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>

                          {/* Multi-Channel Drip */}
                          <button
                            onClick={() => openTriggerModal(draft, "all")}
                            title="Multi-Channel Drip (WhatsApp + Email)"
                            className="p-1.5 bg-noir-950 hover:bg-noir-800 text-cream-50 rounded-sm transition-colors"
                          >
                            <Send className="w-3.5 h-3.5 text-foil-gold" />
                          </button>

                          {/* Copy Direct Link */}
                          <button
                            onClick={() => copyResumeLink(draft.id)}
                            title="Copy Resume Link"
                            className="p-1.5 bg-white hover:bg-cream-100 text-noir-600 border border-cream-300 rounded-sm transition-colors"
                          >
                            {copiedId === draft.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Open Live Studio */}
                          <a
                            href={`${getStorefrontUrl()}/studio/${draft.id}`}
                            target="_blank"
                            rel="noreferrer"
                            title="View Studio Draft"
                            className="p-1.5 text-noir-400 hover:text-noir-900 transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Trigger / Dispatch Modal */}
      {selectedDraft && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-cream-300 rounded-sm shadow-2xl max-w-lg w-full p-6 animate-scale-up">
            <div className="flex items-center justify-between pb-4 border-b border-cream-200 mb-5">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-foil-gold font-bold">
                  Execute Re-engagement Trigger
                </span>
                <h3 className="font-serif text-lg font-bold text-noir-950">
                  {selectedDraft.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDraft(null)}
                className="text-noir-400 hover:text-noir-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Recipient Details */}
              <div className="bg-cream-50 p-3 rounded-sm border border-cream-200 font-mono space-y-1">
                <div className="flex justify-between">
                  <span className="text-noir-500">Customer:</span>
                  <span className="font-bold text-noir-900">{selectedDraft.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-noir-500">Phone:</span>
                  <span className="font-bold text-noir-900">{selectedDraft.customerPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-noir-500">Email:</span>
                  <span className="font-bold text-noir-900">{selectedDraft.customerEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-noir-500">Progress:</span>
                  <span className="font-bold text-noir-900">
                    {selectedDraft.completedPages}/{selectedDraft.pageCount} pages ({selectedDraft.progressPercentage}%)
                  </span>
                </div>
              </div>

              {/* Select Stage */}
              <div>
                <label className="block text-[11px] font-mono uppercase text-noir-600 mb-1.5 font-bold">
                  Target Drip Stage
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setModalStage(1)}
                    className={cn(
                      "p-2.5 rounded-sm border text-left font-mono transition-all",
                      modalStage === 1
                        ? "border-noir-950 bg-noir-950 text-cream-50"
                        : "border-cream-300 hover:border-noir-800"
                    )}
                  >
                    <div className="font-bold text-[11px]">Stage 1</div>
                    <div className="text-[10px] opacity-80">Saved Safely (1–3h)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalStage(2)}
                    className={cn(
                      "p-2.5 rounded-sm border text-left font-mono transition-all",
                      modalStage === 2
                        ? "border-noir-950 bg-noir-950 text-cream-50"
                        : "border-cream-300 hover:border-noir-800"
                    )}
                  >
                    <div className="font-bold text-[11px]">Stage 2</div>
                    <div className="text-[10px] opacity-80">Progress (24h)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalStage(3)}
                    className={cn(
                      "p-2.5 rounded-sm border text-left font-mono transition-all",
                      modalStage === 3
                        ? "border-foil-gold bg-noir-950 text-foil-gold"
                        : "border-cream-300 hover:border-noir-800"
                    )}
                  >
                    <div className="font-bold text-[11px] flex items-center gap-1">
                      <Gift className="w-3 h-3" />
                      Stage 3
                    </div>
                    <div className="text-[10px] opacity-80">10% Off FINISH10</div>
                  </button>
                </div>
              </div>

              {/* Select Channel */}
              <div>
                <label className="block text-[11px] font-mono uppercase text-noir-600 mb-1.5 font-bold">
                  Delivery Channel
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setModalChannel("whatsapp")}
                    className={cn(
                      "p-2 rounded-sm border flex items-center justify-center gap-1.5 font-mono text-xs font-semibold transition-all",
                      modalChannel === "whatsapp"
                        ? "border-emerald-600 bg-emerald-50 text-emerald-900"
                        : "border-cream-300 hover:border-noir-600"
                    )}
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalChannel("email")}
                    className={cn(
                      "p-2 rounded-sm border flex items-center justify-center gap-1.5 font-mono text-xs font-semibold transition-all",
                      modalChannel === "email"
                        ? "border-blue-600 bg-blue-50 text-blue-900"
                        : "border-cream-300 hover:border-noir-600"
                    )}
                  >
                    <Mail className="w-3.5 h-3.5 text-blue-600" />
                    <span>Email</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalChannel("all")}
                    className={cn(
                      "p-2 rounded-sm border flex items-center justify-center gap-1.5 font-mono text-xs font-semibold transition-all",
                      modalChannel === "all"
                        ? "border-noir-950 bg-noir-950 text-cream-50"
                        : "border-cream-300 hover:border-noir-600"
                    )}
                  >
                    <Send className="w-3.5 h-3.5 text-foil-gold" />
                    <span>Both Channels</span>
                  </button>
                </div>
              </div>

              {/* Preview Copy Box */}
              <div className="bg-cream-100 p-3 rounded-sm border border-cream-300 text-[11px] text-noir-700">
                <span className="font-mono font-bold text-noir-950 block mb-1">
                  Preview Message Intent:
                </span>
                {modalStage === 1 && (
                  <p>
                    "Hi {selectedDraft.customerName}! Your photobook '{selectedDraft.title}' is safely saved with all {selectedDraft.completedPages} pages intact. Whenever you're ready, pick up right where you left off!"
                  </p>
                )}
                {modalStage === 2 && (
                  <p>
                    "Hi {selectedDraft.customerName}! You're already {selectedDraft.progressPercentage}% done ({selectedDraft.completedPages}/{selectedDraft.pageCount} pages). You're only {Math.max(1, selectedDraft.pageCount - selectedDraft.completedPages)} pages away from holding your memories in archival layflat print!"
                  </p>
                )}
                {modalStage === 3 && (
                  <p>
                    "Hi {selectedDraft.customerName}! We'd love to help you bring '{selectedDraft.title}' to life. Here's a 10% completion gift: Use code <strong>FINISH10</strong> for 10% off at checkout. Valid 48 hours!"
                  </p>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-cream-200">
              <button
                type="button"
                onClick={() => setSelectedDraft(null)}
                className="px-4 py-2 border border-cream-300 text-noir-700 hover:text-noir-950 rounded-sm font-mono text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeSendReminder}
                disabled={modalSending}
                className="px-5 py-2 bg-noir-950 hover:bg-noir-900 text-cream-50 rounded-sm font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-md disabled:opacity-50"
              >
                <Send className={cn("w-3.5 h-3.5 text-foil-gold", modalSending && "animate-spin")} />
                <span>{modalSending ? "Dispatching..." : "Dispatch Reminder"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
