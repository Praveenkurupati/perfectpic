// apps/admin/src/app/(dashboard)/marketing/audiences/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Users, 
  Plus, 
  Search, 
  Trash2, 
  Send, 
  RefreshCw, 
  Clock, 
  Tag, 
  ChevronRight,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";
import { adminApi } from "@/lib/api";

export default function SavedAudiencesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [audiences, setAudiences] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);

  // Modal Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [customerSegment, setCustomerSegment] = useState("vip");
  const [orderCountMin, setOrderCountMin] = useState<number | undefined>(undefined);
  const [totalSpentMin, setTotalSpentMin] = useState<number | undefined>(undefined);
  const [hasDraftProject, setHasDraftProject] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchAudiences = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getSavedAudiences({ search: searchTerm });
      if (res.success) {
        setAudiences(res.audiences || []);
      }
    } catch (err) {
      console.error("Failed to load saved audiences", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudiences();
  }, []);

  const handleCreateAudience = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Audience name is required");
      return;
    }
    setSaving(true);
    try {
      const filter: any = {
        customerSegment,
        orderCountMin,
        totalSpentMin,
        hasDraftProject,
        respectSuppression: true,
        respectNotificationPreferences: true,
      };

      await adminApi.createSavedAudience({
        name,
        description,
        type: "dynamic",
        filter,
        tags: [customerSegment, hasDraftProject ? "in-progress-studio" : ""].filter(Boolean),
      });

      setShowModal(false);
      await fetchAudiences();
    } catch (err: any) {
      alert(`Failed to save audience: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this saved audience?")) return;
    try {
      await adminApi.deleteSavedAudience(id);
      await fetchAudiences();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
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
            <span className="text-zinc-200">Audiences</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-serif">Saved Audience Segments</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Pre-configured dynamic customer filters for VIP buyers, churn-prevention, and photobook draft recovery.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchAudiences}
            disabled={loading}
            className="p-2 text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 rounded-lg transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-foil-gold' : ''}`} />
          </button>
          <button
            onClick={() => {
              setName("");
              setDescription("");
              setCustomerSegment("vip");
              setOrderCountMin(undefined);
              setTotalSpentMin(undefined);
              setHasDraftProject(false);
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-foil-gold hover:bg-foil-gold/90 text-noir-950 font-semibold rounded-lg text-sm shadow-sm transition"
          >
            <Plus className="w-4 h-4" /> Save New Audience
          </button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="p-16 text-center text-zinc-500 text-sm">
          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-foil-gold" />
          Loading saved audiences...
        </div>
      ) : audiences.length === 0 ? (
        <div className="p-16 text-center bg-zinc-900/40 border border-zinc-800 rounded-xl">
          <p className="text-zinc-400 text-sm">No saved audiences yet.</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-3 text-xs text-foil-gold hover:underline"
          >
            Create your first audience segment &rarr;
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {audiences.map((aud) => (
            <div key={aud.id || aud._id} className="p-5 bg-zinc-900/40 border border-zinc-800 rounded-xl space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    {aud.type || 'dynamic'}
                  </span>
                  <span className="text-xs font-mono text-emerald-400 font-semibold">
                    ~{(aud.lastEstimatedCount || 0).toLocaleString('en-IN')} recipients
                  </span>
                </div>

                <h3 className="font-semibold text-white text-base">{aud.name}</h3>
                {aud.description && (
                  <p className="text-xs text-zinc-400 mt-1">{aud.description}</p>
                )}

                {/* Filter Summary Tags */}
                <div className="mt-3 space-y-1.5 text-xs text-zinc-400">
                  {aud.filter?.customerSegment && (
                    <div className="flex items-center gap-1.5">
                      <Tag className="w-3 h-3 text-foil-gold" />
                      <span>Segment: <strong className="text-zinc-200">{aud.filter.customerSegment}</strong></span>
                    </div>
                  )}
                  {aud.filter?.totalSpentMin && (
                    <div className="flex items-center gap-1.5">
                      <Tag className="w-3 h-3 text-emerald-400" />
                      <span>Min Spent: <strong className="text-zinc-200">₹{aud.filter.totalSpentMin.toLocaleString('en-IN')}</strong></span>
                    </div>
                  )}
                  {aud.filter?.hasDraftProject && (
                    <div className="flex items-center gap-1.5">
                      <Tag className="w-3 h-3 text-blue-400" />
                      <span>Has In-Progress Draft Album</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                <Link
                  href={`/marketing/campaigns/create`}
                  className="flex items-center gap-1 text-xs font-medium text-foil-gold hover:underline"
                >
                  <Send className="w-3 h-3" /> Launch Campaign
                </Link>
                <button
                  onClick={() => handleDelete(aud.id || aud._id)}
                  className="p-1.5 bg-zinc-800 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 rounded transition"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Save Audience Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-semibold text-white text-base">Save New Audience Segment</h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-white">&times;</button>
            </div>

            <form onSubmit={handleCreateAudience} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-zinc-300 mb-1">Audience Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. VIP Collectors - High Spenders"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-foil-gold"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-300 mb-1">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Customers with total purchases exceeding ₹5,000"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-foil-gold"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-300 mb-1">Lifecycle Segment</label>
                <select
                  value={customerSegment}
                  onChange={(e) => setCustomerSegment(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none"
                >
                  <option value="all">All Customers</option>
                  <option value="vip">VIP Buyers (&gt;₹10,000 spent or &gt;3 orders)</option>
                  <option value="active">Active in last 60 days</option>
                  <option value="at_risk">At Risk (no purchase 60-180 days)</option>
                  <option value="churned">Churned (&gt;180 days inactive)</option>
                  <option value="new">New Customers (last 14 days, 0 orders)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-zinc-300 mb-1">Min Orders</label>
                  <input
                    type="number"
                    value={orderCountMin || ""}
                    onChange={(e) => setOrderCountMin(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="e.g. 2"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-zinc-300 mb-1">Min Total Spent (₹)</label>
                  <input
                    type="number"
                    value={totalSpentMin || ""}
                    onChange={(e) => setTotalSpentMin(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="e.g. 5000"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                  <input
                    type="checkbox"
                    checked={hasDraftProject}
                    onChange={(e) => setHasDraftProject(e.target.checked)}
                    className="rounded border-zinc-700 bg-zinc-950 text-foil-gold focus:ring-0"
                  />
                  <span>Must have an in-progress draft album</span>
                </label>
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
                  {saving ? "Saving..." : "Save Audience"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
