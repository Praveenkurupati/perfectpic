// apps/admin/src/app/(dashboard)/marketing/campaigns/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Send, 
  MessageSquare, 
  Mail, 
  Plus, 
  Search, 
  Filter, 
  Play, 
  Pause, 
  XCircle, 
  RotateCcw, 
  Copy, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  ChevronRight,
  RefreshCw,
  MoreVertical
} from "lucide-react";
import { adminApi } from "@/lib/api";

export default function CampaignsListPage() {
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getCampaigns({
        status: statusFilter,
        channel: channelFilter,
        search: searchTerm,
        page,
        limit: 15,
      });

      if (res.success) {
        setCampaigns(res.campaigns || []);
        setTotal(res.total || 0);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err) {
      console.error("Failed to fetch campaigns", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [statusFilter, channelFilter, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCampaigns();
  };

  const handlePause = async (id: string) => {
    setActionInProgress(id);
    try {
      await adminApi.pauseCampaign(id);
      await fetchCampaigns();
    } catch (err: any) {
      alert(`Failed to pause campaign: ${err.message}`);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleResume = async (id: string) => {
    setActionInProgress(id);
    try {
      await adminApi.resumeCampaign(id);
      await fetchCampaigns();
    } catch (err: any) {
      alert(`Failed to resume campaign: ${err.message}`);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this campaign? Pending messages will not be sent.")) return;
    setActionInProgress(id);
    try {
      await adminApi.cancelCampaign(id);
      await fetchCampaigns();
    } catch (err: any) {
      alert(`Failed to cancel campaign: ${err.message}`);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDuplicate = async (id: string) => {
    setActionInProgress(id);
    try {
      const res = await adminApi.duplicateCampaign(id);
      if (res.success) {
        await fetchCampaigns();
      }
    } catch (err: any) {
      alert(`Failed to duplicate campaign: ${err.message}`);
    } finally {
      setActionInProgress(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>Running</span>;
      case 'queued':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20"><Clock className="w-3 h-3 animate-spin" />Preparing Dispatch</span>;
      case 'scheduled':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20"><Clock className="w-3 h-3" />Scheduled</span>;
      case 'paused':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"><Pause className="w-3 h-3" />Paused</span>;
      case 'completed':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-500/10 text-zinc-300 border border-zinc-500/20"><CheckCircle2 className="w-3 h-3 text-emerald-400" />Completed</span>;
      case 'cancelled':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">Cancelled</span>;
      case 'failed':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20"><AlertTriangle className="w-3 h-3" />Failed</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">Draft</span>;
    }
  };

  const statusTabs = [
    { label: "All Campaigns", value: "all" },
    { label: "Running", value: "running" },
    { label: "Scheduled", value: "scheduled" },
    { label: "Drafts", value: "draft" },
    { label: "Completed", value: "completed" },
    { label: "Paused", value: "paused" },
    { label: "Cancelled", value: "cancelled" },
  ];

  return (
    <div className="space-y-6 p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
            <Link href="/marketing" className="hover:text-white transition">Marketing</Link>
            <span>/</span>
            <span className="text-zinc-200">Campaigns</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-serif">Communication Campaigns Console</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Manage multi-channel broadcasts, monitor delivery progress, and control in-flight dispatches.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchCampaigns}
            disabled={loading}
            className="p-2 text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 rounded-lg hover:border-zinc-700 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-foil-gold' : ''}`} />
          </button>
          <Link
            href="/marketing/campaigns/create"
            className="flex items-center gap-2 px-4 py-2 bg-foil-gold hover:bg-foil-gold/90 text-noir-950 font-semibold rounded-lg shadow-sm transition text-sm"
          >
            <Plus className="w-4 h-4" />
            Create Campaign
          </Link>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setStatusFilter(tab.value); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                statusFilter === tab.value
                  ? "bg-foil-gold text-noir-950 font-semibold"
                  : "bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {/* Channel Selector */}
          <select
            value={channelFilter}
            onChange={(e) => { setChannelFilter(e.target.value); setPage(1); }}
            className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-foil-gold"
          >
            <option value="all">All Channels</option>
            <option value="email">Email Only</option>
            <option value="whatsapp">WhatsApp Only</option>
          </select>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-lg pl-8 pr-3 py-2 w-48 md:w-60 focus:outline-none focus:border-foil-gold"
            />
          </form>
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-16 text-center text-zinc-500 text-sm">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-foil-gold" />
            Loading campaigns...
          </div>
        ) : campaigns.length === 0 ? (
          <div className="p-16 text-center">
            <p className="text-zinc-400 text-sm">No campaigns match your filter criteria.</p>
            <button
              onClick={() => { setStatusFilter("all"); setChannelFilter("all"); setSearchTerm(""); }}
              className="mt-3 text-xs text-foil-gold hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-800/80 bg-zinc-950/40 text-xs text-zinc-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4 font-medium">Campaign Details</th>
                  <th className="py-3.5 px-4 font-medium">Channel</th>
                  <th className="py-3.5 px-4 font-medium">Status</th>
                  <th className="py-3.5 px-4 font-medium">Audience (Sent / Total)</th>
                  <th className="py-3.5 px-4 font-medium">Throughput & Progress</th>
                  <th className="py-3.5 px-4 font-medium">Date</th>
                  <th className="py-3.5 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {campaigns.map((c) => {
                  const id = c.id || c._id;
                  const sent = c.stats?.sent || 0;
                  const total = c.stats?.eligible || c.stats?.totalRecipients || 1;
                  const progressPct = total > 0 ? Math.min(100, Math.round((sent / total) * 100)) : 0;
                  const isActionBusy = actionInProgress === id;

                  return (
                    <tr key={id} className="hover:bg-zinc-800/20 transition">
                      <td className="py-3.5 px-4">
                        <Link href={`/marketing/campaigns/${id}`} className="font-medium text-white hover:text-foil-gold transition block">
                          {c.name}
                        </Link>
                        <div className="text-xs text-zinc-500 mt-0.5">
                          {c.type || 'marketing'} · created by {c.createdBy || 'Admin'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium uppercase font-mono ${
                          c.channel === 'email' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'
                        }`}>
                          {c.channel === 'email' ? <Mail className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
                          {c.channel}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {getStatusBadge(c.status)}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs">
                        <span className="text-white font-semibold">{sent.toLocaleString('en-IN')}</span>
                        <span className="text-zinc-500"> / {total.toLocaleString('en-IN')}</span>
                      </td>
                      <td className="py-3.5 px-4 min-w-[150px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                c.status === 'completed' ? 'bg-emerald-500' : c.status === 'failed' ? 'bg-rose-500' : 'bg-foil-gold'
                              }`}
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono text-zinc-400 w-9 text-right">{progressPct}%</span>
                        </div>
                        {c.rateLimitPerSecond && (
                          <div className="text-[10px] text-zinc-500 mt-1">Cap: {c.rateLimitPerSecond} msg/s</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-zinc-400 font-mono">
                        {c.scheduledAt ? (
                          <span title="Scheduled Date">Sched: {new Date(c.scheduledAt).toLocaleDateString()}</span>
                        ) : c.startedAt ? (
                          <span title="Started Date">Sent: {new Date(c.startedAt).toLocaleDateString()}</span>
                        ) : (
                          <span>Created: {new Date(c.createdAt).toLocaleDateString()}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {c.status === 'running' && (
                            <button
                              onClick={() => handlePause(id)}
                              disabled={isActionBusy}
                              className="p-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 rounded transition"
                              title="Pause campaign"
                            >
                              <Pause className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {c.status === 'paused' && (
                            <button
                              onClick={() => handleResume(id)}
                              disabled={isActionBusy}
                              className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded transition"
                              title="Resume campaign"
                            >
                              <Play className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {(c.status === 'running' || c.status === 'paused' || c.status === 'scheduled') && (
                            <button
                              onClick={() => handleCancel(id)}
                              disabled={isActionBusy}
                              className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded transition"
                              title="Cancel campaign"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDuplicate(id)}
                            disabled={isActionBusy}
                            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded transition"
                            title="Duplicate as new draft"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <Link
                            href={`/marketing/campaigns/${id}`}
                            className="px-2.5 py-1 text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded transition"
                          >
                            Console
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
            <div>
              Showing page <strong className="text-zinc-200">{page}</strong> of <strong className="text-zinc-200">{totalPages}</strong> ({total} campaigns)
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded disabled:opacity-50 transition"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded disabled:opacity-50 transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
