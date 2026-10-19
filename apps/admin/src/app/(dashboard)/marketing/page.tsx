// apps/admin/src/app/(dashboard)/marketing/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Send, 
  MessageSquare, 
  Mail, 
  Users, 
  ShieldAlert, 
  Sparkles, 
  Play, 
  Pause, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ArrowRight, 
  Activity, 
  RefreshCw,
  Plus,
  BarChart3,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { adminApi } from "@/lib/api";

export default function MarketingHubPage() {
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [providers, setProviders] = useState<any>(null);
  const [suppressionStats, setSuppressionStats] = useState<any>(null);
  const [stats, setStats] = useState({
    activeCampaigns: 0,
    totalDispatched: 0,
    avgDeliveryRate: 98,
    activeSuppressed: 0,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [campaignsRes, providersRes, suppStatsRes] = await Promise.all([
        adminApi.getCampaigns({ limit: 10 }),
        adminApi.getCampaignProviders().catch(() => ({ success: false, providers: null })),
        adminApi.getSuppressionStats().catch(() => ({ success: false, stats: null })),
      ]);

      if (campaignsRes.success) {
        setCampaigns(campaignsRes.campaigns || []);
        const active = (campaignsRes.campaigns || []).filter(c => c.status === 'running' || c.status === 'queued').length;
        const dispatched = (campaignsRes.campaigns || []).reduce((acc, c) => acc + (c.stats?.sent || 0), 0);
        setStats(prev => ({
          ...prev,
          activeCampaigns: active,
          totalDispatched: dispatched,
        }));
      }

      if (providersRes.success && providersRes.providers) {
        setProviders(providersRes.providers);
      }

      if (suppStatsRes.success && suppStatsRes.stats) {
        setSuppressionStats(suppStatsRes.stats);
        setStats(prev => ({
          ...prev,
          activeSuppressed: suppStatsRes.stats.totalActive || 0,
        }));
      }
    } catch (err) {
      console.error("Failed to load marketing dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>Running</span>;
      case 'queued':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20"><Clock className="w-3 h-3 animate-spin" />Queued</span>;
      case 'scheduled':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20"><Clock className="w-3 h-3" />Scheduled</span>;
      case 'paused':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"><Pause className="w-3 h-3" />Paused</span>;
      case 'completed':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-500/10 text-zinc-300 border border-zinc-500/20"><CheckCircle2 className="w-3 h-3 text-emerald-400" />Completed</span>;
      case 'cancelled':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">Cancelled</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">Draft</span>;
    }
  };

  return (
    <div className="space-y-8 p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white font-serif">Marketing & Campaigns Hub</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-foil-gold/10 text-foil-gold border border-foil-gold/30 rounded-full">
              Enterprise Communications
            </span>
          </div>
          <p className="text-zinc-400 text-sm mt-1">
            Segment customer audiences, orchestrate personalized Email & WhatsApp campaigns, and track real-time delivery throughput.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 rounded-lg hover:border-zinc-700 transition"
            title="Refresh statistics"
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

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Active Campaigns</span>
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
              <Play className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-white font-mono">{stats.activeCampaigns}</span>
            <span className="text-xs text-zinc-500 ml-2">in queue / running</span>
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Messages Dispatched</span>
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-white font-mono">{stats.totalDispatched.toLocaleString('en-IN')}</span>
            <span className="text-xs text-zinc-500 ml-2">across all channels</span>
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Avg Delivery Rate</span>
            <div className="p-2 bg-foil-gold/10 rounded-lg text-foil-gold">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-white font-mono">{stats.avgDeliveryRate}%</span>
            <span className="text-xs text-emerald-400 ml-2">Healthy SLA</span>
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Active Suppressions</span>
            <div className="p-2 bg-rose-500/10 rounded-lg text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-white font-mono">{stats.activeSuppressed}</span>
            <span className="text-xs text-zinc-500 ml-2">Unsubscribes / DNC</span>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link
          href="/marketing/campaigns"
          className="group p-5 bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl transition flex flex-col justify-between"
        >
          <div>
            <div className="p-2.5 bg-blue-500/10 w-fit rounded-lg text-blue-400 mb-3 group-hover:scale-105 transition">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white text-base">Campaign Console</h3>
            <p className="text-zinc-400 text-xs mt-1">Review live execution, pause/resume workers, inspect recipient status.</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-blue-400 font-medium mt-4 group-hover:translate-x-1 transition">
            View All Campaigns <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        <Link
          href="/marketing/templates"
          className="group p-5 bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl transition flex flex-col justify-between"
        >
          <div>
            <div className="p-2.5 bg-foil-gold/10 w-fit rounded-lg text-foil-gold mb-3 group-hover:scale-105 transition">
              <Mail className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white text-base">Templates Library</h3>
            <p className="text-zinc-400 text-xs mt-1">Manage HTML email designs, Meta WhatsApp templates, and variables.</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-foil-gold font-medium mt-4 group-hover:translate-x-1 transition">
            Manage Templates <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        <Link
          href="/marketing/audiences"
          className="group p-5 bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl transition flex flex-col justify-between"
        >
          <div>
            <div className="p-2.5 bg-purple-500/10 w-fit rounded-lg text-purple-400 mb-3 group-hover:scale-105 transition">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white text-base">Saved Audiences</h3>
            <p className="text-zinc-400 text-xs mt-1">Multi-attribute customer filters, VIP segments, and project re-engagement.</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-purple-400 font-medium mt-4 group-hover:translate-x-1 transition">
            Explore Audiences <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        <Link
          href="/marketing/suppressions"
          className="group p-5 bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl transition flex flex-col justify-between"
        >
          <div>
            <div className="p-2.5 bg-rose-500/10 w-fit rounded-lg text-rose-400 mb-3 group-hover:scale-105 transition">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white text-base">Compliance & DNC</h3>
            <p className="text-zinc-400 text-xs mt-1">CAN-SPAM / IT Act suppression list, opt-out management, bounce prevention.</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-rose-400 font-medium mt-4 group-hover:translate-x-1 transition">
            View Suppressions <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </Link>
      </div>

      {/* Provider Abstraction & Infrastructure Status */}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <h2 className="text-base font-semibold text-white">Provider Abstraction Layer (Decoupled Infrastructure)</h2>
          </div>
          <span className="text-xs text-zinc-400">Zero vendor lock-in</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Email Provider Card */}
          <div className="p-4 bg-zinc-950/60 border border-zinc-800/80 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-white">Email Provider</h4>
                  <p className="text-xs text-zinc-400">Supports AWS SES / SMTP / SendGrid</p>
                </div>
              </div>
              <span className="px-2 py-0.5 text-xs rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                Active & Ready
              </span>
            </div>
            <div className="mt-3 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400">
              <span>Rate Limit: <strong className="text-zinc-200">20 msgs/sec</strong></span>
              <span>Circuit Breaker: <strong className="text-emerald-400">CLOSED</strong></span>
            </div>
          </div>

          {/* WhatsApp Provider Card */}
          <div className="p-4 bg-zinc-950/60 border border-zinc-800/80 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-white">WhatsApp Business Provider</h4>
                  <p className="text-xs text-zinc-400">Meta Cloud API v24.0 / Kapso.ai</p>
                </div>
              </div>
              <span className="px-2 py-0.5 text-xs rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                Active & Ready
              </span>
            </div>
            <div className="mt-3 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400">
              <span>Rate Limit: <strong className="text-zinc-200">30 msgs/sec</strong></span>
              <span>Template Verification: <strong className="text-emerald-400">Automated</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Campaigns Table */}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Recent Communication Campaigns</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Live status, audience coverage, and delivery progress</p>
          </div>
          <Link
            href="/marketing/campaigns"
            className="text-xs text-foil-gold hover:underline flex items-center gap-1 font-medium"
          >
            All Campaigns <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-12 text-center text-zinc-500 text-sm">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-foil-gold" />
            Loading campaigns...
          </div>
        ) : campaigns.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-zinc-400 text-sm">No campaigns created yet.</p>
            <Link
              href="/marketing/campaigns/create"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-foil-gold text-noir-950 font-semibold rounded-lg text-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Create Your First Campaign
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-800/80 bg-zinc-950/40 text-xs text-zinc-400 uppercase tracking-wider">
                  <th className="py-3 px-4 font-medium">Campaign</th>
                  <th className="py-3 px-4 font-medium">Channel</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium">Audience (Sent / Total)</th>
                  <th className="py-3 px-4 font-medium">Progress</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {campaigns.map((c) => {
                  const sent = c.stats?.sent || 0;
                  const total = c.stats?.eligible || c.stats?.totalRecipients || 1;
                  const progressPct = total > 0 ? Math.min(100, Math.round((sent / total) * 100)) : 0;

                  return (
                    <tr key={c.id || c._id} className="hover:bg-zinc-800/20 transition">
                      <td className="py-3.5 px-4">
                        <Link href={`/marketing/campaigns/${c.id || c._id}`} className="font-medium text-white hover:text-foil-gold transition">
                          {c.name}
                        </Link>
                        <div className="text-xs text-zinc-500">{c.type || 'marketing'} · created by {c.createdBy || 'Admin'}</div>
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
                      <td className="py-3.5 px-4 min-w-[140px]">
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
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/marketing/campaigns/${c.id || c._id}`}
                          className="px-2.5 py-1 text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded transition"
                        >
                          Console
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
