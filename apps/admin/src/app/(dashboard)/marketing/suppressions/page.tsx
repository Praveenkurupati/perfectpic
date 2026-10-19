// apps/admin/src/app/(dashboard)/marketing/suppressions/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ShieldAlert, 
  Plus, 
  Search, 
  Trash2, 
  RefreshCw, 
  RotateCcw, 
  Mail, 
  MessageSquare, 
  AlertTriangle, 
  CheckCircle2 
} from "lucide-react";
import { adminApi } from "@/lib/api";

export default function SuppressionsManagerPage() {
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [channelFilter, setChannelFilter] = useState("all");
  const [reasonFilter, setReasonFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [formIdentifier, setFormIdentifier] = useState("");
  const [formChannel, setFormChannel] = useState("email");
  const [formReason, setFormReason] = useState("unsubscribed");
  const [formNotes, setFormNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchSuppressions = async () => {
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        adminApi.getSuppressions({
          search: searchTerm,
          channel: channelFilter,
          reason: reasonFilter,
          page,
          limit: 25,
        }),
        adminApi.getSuppressionStats().catch(() => ({ success: false, stats: null })),
      ]);

      if (listRes.success) {
        setEntries(listRes.entries || []);
        setTotal(listRes.total || 0);
        setTotalPages(listRes.totalPages || 1);
      }
      if (statsRes.success && statsRes.stats) {
        setStats(statsRes.stats);
      }
    } catch (err) {
      console.error("Failed to fetch suppressions", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppressions();
  }, [channelFilter, reasonFilter, page]);

  const handleAddSuppression = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formIdentifier.trim()) {
      alert("Identifier is required");
      return;
    }
    setSaving(true);
    try {
      await adminApi.addSuppression({
        identifier: formIdentifier.trim(),
        channel: formChannel,
        reason: formReason,
        notes: formNotes,
      });
      setShowModal(false);
      setFormIdentifier("");
      setFormNotes("");
      await fetchSuppressions();
    } catch (err: any) {
      alert(`Failed to add suppression: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleUnsuppress = async (identifier: string, channel: string) => {
    if (!confirm(`Are you sure you want to reactivate ${identifier}? They will become eligible for future communications.`)) return;
    try {
      await adminApi.removeSuppression(identifier, channel);
      await fetchSuppressions();
    } catch (err: any) {
      alert(`Failed to reactivate: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
            <Link href="/marketing" className="hover:text-white transition">Marketing</Link>
            <span>/</span>
            <span className="text-zinc-200">Compliance & Suppressions</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-serif">Suppression & Opt-Out Engine</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Centralized exclusion registry for unsubscribed recipients, hard bounces, complaints, and Do-Not-Call (DNC) numbers.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchSuppressions}
            disabled={loading}
            className="p-2 text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 rounded-lg transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-foil-gold' : ''}`} />
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-foil-gold hover:bg-foil-gold/90 text-noir-950 font-semibold rounded-lg text-sm shadow-sm transition"
          >
            <Plus className="w-4 h-4" /> Add Exclusion
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-zinc-900/40 border border-zinc-800 rounded-xl">
            <span className="text-xs text-zinc-500 uppercase tracking-wider">Total Suppressed</span>
            <div className="text-2xl font-bold text-white font-mono mt-1">
              {stats.totalActive?.toLocaleString('en-IN') || 0}
            </div>
          </div>
          <div className="p-4 bg-zinc-900/40 border border-zinc-800 rounded-xl">
            <span className="text-xs text-zinc-500 uppercase tracking-wider">Email Exclusions</span>
            <div className="text-2xl font-bold text-blue-400 font-mono mt-1">
              {stats.byChannel?.email || 0}
            </div>
          </div>
          <div className="p-4 bg-zinc-900/40 border border-zinc-800 rounded-xl">
            <span className="text-xs text-zinc-500 uppercase tracking-wider">WhatsApp Exclusions</span>
            <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">
              {stats.byChannel?.whatsapp || 0}
            </div>
          </div>
          <div className="p-4 bg-zinc-900/40 border border-zinc-800 rounded-xl">
            <span className="text-xs text-zinc-500 uppercase tracking-wider">Unsubscribes</span>
            <div className="text-2xl font-bold text-rose-400 font-mono mt-1">
              {stats.byReason?.unsubscribed || 0}
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <select
            value={channelFilter}
            onChange={(e) => { setChannelFilter(e.target.value); setPage(1); }}
            className="bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 rounded-lg px-2.5 py-1.5 focus:outline-none"
          >
            <option value="all">All Channels</option>
            <option value="email">Email</option>
            <option value="whatsapp">WhatsApp</option>
          </select>

          <select
            value={reasonFilter}
            onChange={(e) => { setReasonFilter(e.target.value); setPage(1); }}
            className="bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 rounded-lg px-2.5 py-1.5 focus:outline-none"
          >
            <option value="all">All Reasons</option>
            <option value="unsubscribed">Unsubscribed</option>
            <option value="hard_bounce">Hard Bounce</option>
            <option value="complaint">Spam Complaint</option>
            <option value="dnc">Do Not Call (DNC)</option>
            <option value="manual_admin">Admin Added</option>
          </select>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search email/phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchSuppressions()}
            className="bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-foil-gold w-56"
          />
        </div>
      </div>

      {/* Suppression Table */}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-16 text-center text-zinc-500 text-sm">
            <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-foil-gold" />
            Loading exclusions...
          </div>
        ) : entries.length === 0 ? (
          <div className="p-16 text-center text-zinc-400 text-xs">
            No suppression entries match your filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-800/80 bg-zinc-950/40 text-zinc-400 uppercase tracking-wider font-mono">
                  <th className="py-3 px-4 font-medium">Identifier (Email / Phone)</th>
                  <th className="py-3 px-4 font-medium">Channel</th>
                  <th className="py-3 px-4 font-medium">Reason</th>
                  <th className="py-3 px-4 font-medium">Source / Notes</th>
                  <th className="py-3 px-4 font-medium">Date Suppressed</th>
                  <th className="py-3 px-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {entries.map((e) => (
                  <tr key={e.id || e._id} className="hover:bg-zinc-800/20 transition">
                    <td className="py-3 px-4 text-white font-mono font-medium">
                      {e.identifier}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono uppercase ${
                        e.channel === 'email' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {e.channel === 'email' ? <Mail className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
                        {e.channel}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] bg-zinc-800 text-zinc-300 font-mono">
                        {e.reason}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-zinc-400 max-w-[200px] truncate">
                      {e.notes || e.source || "—"}
                    </td>
                    <td className="py-3 px-4 text-zinc-500 font-mono">
                      {new Date(e.suppressedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleUnsuppress(e.identifier, e.channel)}
                        className="px-2.5 py-1 bg-zinc-800 hover:bg-emerald-500/20 text-zinc-300 hover:text-emerald-400 rounded text-[11px] transition"
                        title="Reactivate customer for campaigns"
                      >
                        Reactivate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
            <div>
              Showing page <strong className="text-zinc-200">{page}</strong> of <strong className="text-zinc-200">{totalPages}</strong> ({total} entries)
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-2.5 py-1 bg-zinc-800 text-zinc-300 rounded disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-2.5 py-1 bg-zinc-800 text-zinc-300 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Exclusion Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-semibold text-white text-base">Add Suppression Exclusion</h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-white">&times;</button>
            </div>

            <form onSubmit={handleAddSuppression} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-zinc-300 mb-1">Email or Phone Number *</label>
                <input
                  type="text"
                  placeholder="e.g. user@example.com or +919876543210"
                  value={formIdentifier}
                  onChange={(e) => setFormIdentifier(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-foil-gold font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-zinc-300 mb-1">Channel</label>
                  <select
                    value={formChannel}
                    onChange={(e) => setFormChannel(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="email">Email</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="all">Both Channels</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-zinc-300 mb-1">Reason</label>
                  <select
                    value={formReason}
                    onChange={(e) => setFormReason(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="unsubscribed">Unsubscribed</option>
                    <option value="hard_bounce">Hard Bounce</option>
                    <option value="complaint">Spam Complaint</option>
                    <option value="dnc">Do Not Call (DNC)</option>
                    <option value="manual_admin">Manual Admin Request</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-zinc-300 mb-1">Reason / Support Ticket Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Requested removal via ticket #981"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-foil-gold text-noir-950 font-semibold rounded-lg"
                >
                  {saving ? "Saving..." : "Add to Suppression List"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
