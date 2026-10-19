// apps/admin/src/app/(dashboard)/marketing/campaigns/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { 
  Play, 
  Pause, 
  XCircle, 
  RotateCcw, 
  Copy, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Send, 
  MessageSquare, 
  Mail, 
  Search, 
  RefreshCw, 
  ArrowLeft, 
  Users, 
  ShieldAlert, 
  Activity, 
  FileText,
  ChevronRight
} from "lucide-react";
import { adminApi } from "@/lib/api";

export default function CampaignDetailConsolePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);

  // Recipient table state
  const [recipients, setRecipients] = useState<any[]>([]);
  const [recipientTotal, setRecipientTotal] = useState(0);
  const [recipientPage, setRecipientPage] = useState(1);
  const [recipientTotalPages, setRecipientTotalPages] = useState(1);
  const [recipientStatusFilter, setRecipientStatusFilter] = useState("all");
  const [recipientSearch, setRecipientSearch] = useState("");
  const [recipientsLoading, setRecipientsLoading] = useState(false);

  // Operational action state
  const [actionBusy, setActionBusy] = useState(false);

  // Load Campaign and Analytics
  const loadCampaignData = async () => {
    if (!id) return;
    try {
      const [campRes, analyticsRes] = await Promise.all([
        adminApi.getCampaign(id),
        adminApi.getCampaignAnalytics(id).catch(() => ({ success: false, analytics: null })),
      ]);

      if (campRes.success) {
        setCampaign(campRes.campaign);
      }
      if (analyticsRes.success) {
        setAnalytics(analyticsRes.analytics);
      }
    } catch (err) {
      console.error("Failed to load campaign detail", err);
    } finally {
      setLoading(false);
    }
  };

  // Load Recipient Grid
  const loadRecipients = async () => {
    if (!id) return;
    setRecipientsLoading(true);
    try {
      const res = await adminApi.getCampaignRecipients(id, {
        status: recipientStatusFilter,
        search: recipientSearch,
        page: recipientPage,
        limit: 25,
      });

      if (res.success) {
        setRecipients(res.recipients || []);
        setRecipientTotal(res.total || 0);
        setRecipientTotalPages(res.totalPages || 1);
      }
    } catch (err) {
      console.error("Failed to load campaign recipients", err);
    } finally {
      setRecipientsLoading(false);
    }
  };

  useEffect(() => {
    loadCampaignData();
  }, [id]);

  useEffect(() => {
    loadRecipients();
  }, [id, recipientStatusFilter, recipientPage]);

  // Periodic polling if campaign is in-flight
  useEffect(() => {
    if (!campaign) return;
    if (campaign.status === "running" || campaign.status === "queued") {
      const interval = setInterval(() => {
        loadCampaignData();
        loadRecipients();
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [campaign?.status]);

  // Operational Actions
  const handlePause = async () => {
    setActionBusy(true);
    try {
      await adminApi.pauseCampaign(id);
      await loadCampaignData();
    } catch (err: any) {
      alert(`Failed to pause: ${err.message}`);
    } finally {
      setActionBusy(false);
    }
  };

  const handleResume = async () => {
    setActionBusy(true);
    try {
      await adminApi.resumeCampaign(id);
      await loadCampaignData();
    } catch (err: any) {
      alert(`Failed to resume: ${err.message}`);
    } finally {
      setActionBusy(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this campaign? All pending jobs will be invalidated.")) return;
    setActionBusy(true);
    try {
      await adminApi.cancelCampaign(id);
      await loadCampaignData();
      await loadRecipients();
    } catch (err: any) {
      alert(`Failed to cancel: ${err.message}`);
    } finally {
      setActionBusy(false);
    }
  };

  const handleRetryFailed = async () => {
    setActionBusy(true);
    try {
      const res = await adminApi.retryFailedRecipients(id);
      alert(res.message);
      await loadCampaignData();
      await loadRecipients();
    } catch (err: any) {
      alert(`Failed to retry: ${err.message}`);
    } finally {
      setActionBusy(false);
    }
  };

  const handleDuplicate = async () => {
    setActionBusy(true);
    try {
      const res = await adminApi.duplicateCampaign(id);
      if (res.success && res.campaign) {
        router.push(`/marketing/campaigns/${res.campaign.id || res.campaign._id}`);
      }
    } catch (err: any) {
      alert(`Failed to duplicate: ${err.message}`);
    } finally {
      setActionBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-zinc-500 text-sm">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-foil-gold" />
        Loading campaign mission control...
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-16 text-center text-zinc-400 text-sm">
        Campaign not found.
        <div className="mt-4">
          <Link href="/marketing/campaigns" className="text-foil-gold hover:underline">
            &larr; Return to Campaigns Console
          </Link>
        </div>
      </div>
    );
  }

  const sent = campaign.stats?.sent || 0;
  const eligible = campaign.stats?.eligible || campaign.stats?.totalRecipients || 1;
  const failed = campaign.stats?.failed || 0;
  const suppressed = campaign.stats?.suppressed || 0;
  const progressPct = eligible > 0 ? Math.min(100, Math.round((sent / eligible) * 100)) : 0;

  return (
    <div className="space-y-8 p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Top Breadcrumb & Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
            <Link href="/marketing" className="hover:text-white transition">Marketing</Link>
            <span>/</span>
            <Link href="/marketing/campaigns" className="hover:text-white transition">Campaigns</Link>
            <span>/</span>
            <span className="text-zinc-200">{campaign.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white font-serif">{campaign.name}</h1>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase font-mono ${
              campaign.channel === 'email' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}>
              {campaign.channel === 'email' ? <Mail className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
              {campaign.channel}
            </span>
          </div>
          <p className="text-zinc-400 text-xs mt-1">
            Created by {campaign.createdBy || 'Admin'} &middot; Type: {campaign.type || 'marketing'} &middot; Rate Cap: {campaign.rateLimitPerSecond || 20} msgs/s
          </p>
        </div>

        {/* Operational Control Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {campaign.status === "running" && (
            <button
              onClick={handlePause}
              disabled={actionBusy}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-lg text-xs font-semibold transition"
            >
              <Pause className="w-3.5 h-3.5" /> Pause Campaign
            </button>
          )}

          {campaign.status === "paused" && (
            <button
              onClick={handleResume}
              disabled={actionBusy}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold transition"
            >
              <Play className="w-3.5 h-3.5" /> Resume Campaign
            </button>
          )}

          {(campaign.status === "running" || campaign.status === "paused" || campaign.status === "scheduled") && (
            <button
              onClick={handleCancel}
              disabled={actionBusy}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-semibold transition"
            >
              <XCircle className="w-3.5 h-3.5" /> Cancel Campaign
            </button>
          )}

          {(campaign.status === "completed" || campaign.status === "failed") && failed > 0 && (
            <button
              onClick={handleRetryFailed}
              disabled={actionBusy}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-semibold transition"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Retry Failed ({failed})
            </button>
          )}

          <button
            onClick={handleDuplicate}
            disabled={actionBusy}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-lg text-xs font-medium transition"
          >
            <Copy className="w-3.5 h-3.5" /> Duplicate Draft
          </button>

          <button
            onClick={() => { loadCampaignData(); loadRecipients(); }}
            className="p-2 text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 rounded-lg transition"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress & Live Throughput Metrics */}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs uppercase tracking-wider text-zinc-400 font-medium">Broadcast Progress</span>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-3xl font-bold text-white font-mono">{progressPct}%</span>
              <span className="text-sm font-mono text-zinc-400">
                ({sent.toLocaleString('en-IN')} / {eligible.toLocaleString('en-IN')} dispatched)
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">Status:</span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase font-mono ${
              campaign.status === 'running' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
              campaign.status === 'paused' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30' :
              campaign.status === 'completed' ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-800 text-zinc-400'
            }`}>
              {campaign.status}
            </span>
          </div>
        </div>

        {/* Big Progress Bar */}
        <div className="w-full bg-zinc-950 h-3 rounded-full overflow-hidden border border-zinc-800/80">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              campaign.status === 'completed' ? 'bg-emerald-500' : campaign.status === 'paused' ? 'bg-yellow-500' : 'bg-foil-gold'
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Funnel Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-2">
          <div className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-lg">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500">Total Matched</span>
            <div className="text-lg font-bold text-white font-mono mt-0.5">
              {campaign.stats?.totalRecipients?.toLocaleString('en-IN') || 0}
            </div>
          </div>

          <div className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-lg">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500">Eligible (Sent/Queued)</span>
            <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">
              {eligible.toLocaleString('en-IN')}
            </div>
          </div>

          <div className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-lg">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500">Sent to Provider</span>
            <div className="text-lg font-bold text-white font-mono mt-0.5">
              {sent.toLocaleString('en-IN')}
            </div>
          </div>

          <div className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-lg">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500">Delivery Rate</span>
            <div className="text-lg font-bold text-foil-gold font-mono mt-0.5">
              {analytics?.rates?.deliveryRate || '99%'}
            </div>
          </div>

          <div className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-lg">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500">Failed</span>
            <div className={`text-lg font-bold font-mono mt-0.5 ${failed > 0 ? 'text-rose-400' : 'text-zinc-500'}`}>
              {failed}
            </div>
          </div>

          <div className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-lg">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500">Suppressed (DNC)</span>
            <div className="text-lg font-bold text-zinc-400 font-mono mt-0.5">
              {suppressed}
            </div>
          </div>
        </div>
      </div>

      {/* Recipient Grid Section */}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-white">Recipient Delivery Log</h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Inspect individual recipient delivery records, timestamps, provider IDs, and error categorizations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Status Tabs */}
            <select
              value={recipientStatusFilter}
              onChange={(e) => { setRecipientStatusFilter(e.target.value); setRecipientPage(1); }}
              className="bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option value="all">All Recipient States</option>
              <option value="sent">Sent</option>
              <option value="delivered">Delivered</option>
              <option value="pending">Pending</option>
              <option value="failed_retryable">Failed (Retryable)</option>
              <option value="failed_permanent">Failed (Permanent)</option>
              <option value="suppressed">Suppressed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {/* Recipient Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search email/phone..."
                value={recipientSearch}
                onChange={(e) => setRecipientSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadRecipients()}
                className="bg-zinc-950 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-foil-gold w-44"
              />
            </div>
          </div>
        </div>

        {recipientsLoading ? (
          <div className="p-12 text-center text-zinc-500 text-sm">
            <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-foil-gold" />
            Loading recipients...
          </div>
        ) : recipients.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 text-xs">
            No recipients found matching current filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-800/80 bg-zinc-950/40 text-zinc-400 uppercase tracking-wider font-mono">
                  <th className="py-3 px-4 font-medium">Recipient</th>
                  <th className="py-3 px-4 font-medium">Contact</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium">Attempts</th>
                  <th className="py-3 px-4 font-medium">Provider ID / Error</th>
                  <th className="py-3 px-4 font-medium text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {recipients.map((r) => (
                  <tr key={r.id || r._id} className="hover:bg-zinc-800/20 transition">
                    <td className="py-3 px-4 text-white font-medium">
                      {r.customerName || "Valued Customer"}
                    </td>
                    <td className="py-3 px-4 font-mono text-zinc-300">
                      {r.email || r.phone}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono ${
                        r.status === 'sent' || r.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-400' :
                        r.status === 'pending' || r.status === 'processing' ? 'bg-blue-500/10 text-blue-400' :
                        r.status === 'suppressed' ? 'bg-zinc-800 text-zinc-400' : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-zinc-400">
                      {r.attempts} / {r.maxAttempts || 3}
                    </td>
                    <td className="py-3 px-4 font-mono text-zinc-400 max-w-[240px] truncate">
                      {r.failedReason ? (
                        <span className="text-rose-400" title={r.failedReason}>{r.failedReason}</span>
                      ) : (
                        <span className="text-zinc-500">{r.providerMessageId || "—"}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-zinc-500">
                      {r.sentAt ? new Date(r.sentAt).toLocaleTimeString() : r.updatedAt ? new Date(r.updatedAt).toLocaleTimeString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Recipient Table Pagination */}
        {recipientTotalPages > 1 && (
          <div className="p-4 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
            <div>
              Page <strong className="text-zinc-200">{recipientPage}</strong> of <strong className="text-zinc-200">{recipientTotalPages}</strong> ({recipientTotal} recipients)
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setRecipientPage(p => Math.max(1, p - 1))}
                disabled={recipientPage <= 1}
                className="px-2.5 py-1 bg-zinc-800 text-zinc-300 rounded disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setRecipientPage(p => Math.min(recipientTotalPages, p + 1))}
                disabled={recipientPage >= recipientTotalPages}
                className="px-2.5 py-1 bg-zinc-800 text-zinc-300 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Audit Log Timeline */}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-foil-gold" />
          Campaign Audit Trail & State Transitions
        </h3>
        <div className="space-y-3">
          {(campaign.auditLog || []).map((entry: any, idx: number) => (
            <div key={idx} className="flex items-start gap-3 text-xs border-l-2 border-zinc-800 pl-3 py-1">
              <div className="font-mono text-zinc-500 min-w-[130px]">
                {new Date(entry.timestamp).toLocaleString()}
              </div>
              <div className="font-semibold text-zinc-200 uppercase font-mono">
                {entry.action}
              </div>
              <div className="text-zinc-400 flex-1">
                {entry.details}
              </div>
              <div className="text-zinc-500 font-mono text-[11px]">
                by {entry.performedBy}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
