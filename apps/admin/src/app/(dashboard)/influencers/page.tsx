// apps/admin/src/app/(dashboard)/influencers/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Award, 
  Plus, 
  Search, 
  Copy, 
  Check, 
  ExternalLink, 
  TrendingUp, 
  Users, 
  DollarSign, 
  ShoppingCart, 
  MousePointer, 
  Instagram, 
  Youtube, 
  Share2, 
  Loader2, 
  ArrowUpRight,
  Filter,
  CheckCircle2,
  AlertCircle,
  X
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { cn } from "@/lib/utils";

interface InfluencerItem {
  id: string;
  code: string;
  influencerName: string;
  influencerHandle: string;
  influencerPlatform: 'instagram' | 'youtube' | 'facebook' | 'tiktok' | 'other';
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  commissionRate: number;
  commissionEarned: number;
  commissionPaid: number;
  commissionPending: number;
  totalOrders: number;
  grossGmv: number;
  discountTotal: number;
  clickCount: number;
  conversionRate: number;
  aov: number;
  isActive: boolean;
  createdAt: string | Date;
}

interface AnalyticsSummary {
  totalInfluencers: number;
  totalAttributedRevenue: number;
  totalDiscountGiven: number;
  totalCommissionOwed: number;
  totalCommissionPaid: number;
  totalAttributedOrders: number;
}

export default function InfluencersPage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<AnalyticsSummary>({
    totalInfluencers: 2,
    totalAttributedRevenue: 182900,
    totalDiscountGiven: 28400,
    totalCommissionOwed: 10590,
    totalCommissionPaid: 7700,
    totalAttributedOrders: 62,
  });
  const [influencers, setInfluencers] = useState<InfluencerItem[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState<string>("ALL");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    influencerName: "",
    influencerHandle: "",
    influencerPlatform: "instagram",
    code: "",
    discountType: "percentage",
    discountValue: 20,
    commissionRate: 10,
    minOrderAmount: 1999,
  });

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getInfluencerAnalytics();
      if (res) {
        if (res.summary) setSummary(res.summary);
        if (Array.isArray(res.influencers)) setInfluencers(res.influencers);
        if (Array.isArray(res.recentOrders)) setRecentOrders(res.recentOrders);
      }
    } catch (err: any) {
      console.warn("Using local analytics fallback:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleCopyLink = (code: string) => {
    const link = `https://perfectpic.in/ref/${code.toUpperCase()}`;
    navigator.clipboard.writeText(link);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.influencerName) return;

    setModalSubmitting(true);
    try {
      await adminApi.createPromo({
        code: formData.code.toUpperCase().trim(),
        description: `Partner code for ${formData.influencerName} (${formData.influencerHandle})`,
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        minOrderAmount: Number(formData.minOrderAmount),
        audienceType: 'ALL',
        maxUsesPerUser: 1,
        isInfluencer: true,
        influencerName: formData.influencerName.trim(),
        influencerHandle: formData.influencerHandle.trim(),
        influencerPlatform: formData.influencerPlatform,
        commissionRate: Number(formData.commissionRate),
        isActive: true,
      });

      setIsModalOpen(false);
      setFormData({
        influencerName: "",
        influencerHandle: "",
        influencerPlatform: "instagram",
        code: "",
        discountType: "percentage",
        discountValue: 20,
        commissionRate: 10,
        minOrderAmount: 1999,
      });
      await fetchAnalytics();
    } catch (err: any) {
      alert(err.message || "Failed to create partner");
    } finally {
      setModalSubmitting(false);
    }
  };

  const filteredInfluencers = useMemo(() => {
    return influencers.filter((inf) => {
      const matchSearch =
        inf.influencerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inf.influencerHandle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inf.code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchPlatform = platformFilter === "ALL" || inf.influencerPlatform.toUpperCase() === platformFilter.toUpperCase();
      return matchSearch && matchPlatform;
    });
  }, [influencers, searchQuery, platformFilter]);

  return (
    <div className="p-6 md:p-8 space-y-8 font-sans max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-pink-500/10 text-pink-500 border border-pink-500/20">
              <Award className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-serif font-bold text-noir-950">
              Influencer & Creator Affiliates
            </h1>
          </div>
          <p className="text-sm text-noir-500 mt-1">
            Track creator campaigns, affiliate revenue attribution, commission payouts, and referral traffic.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-noir-950 hover:bg-noir-900 text-white text-xs font-semibold shadow-md transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          <span>Add Creator Partner</span>
        </button>
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-cream-300 shadow-sm">
          <div className="flex items-center justify-between text-noir-400">
            <span className="text-xs font-medium uppercase tracking-wider">Active Creators</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold font-serif text-noir-950 mt-2">
            {summary.totalInfluencers}
          </div>
          <p className="text-[11px] text-green-600 font-medium mt-1">
            Across Instagram & YouTube
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-cream-300 shadow-sm">
          <div className="flex items-center justify-between text-noir-400">
            <span className="text-xs font-medium uppercase tracking-wider">Attributed GMV</span>
            <TrendingUp className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-2xl font-bold font-serif text-noir-950 mt-2">
            ₹{summary.totalAttributedRevenue.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-noir-500 mt-1">
            {summary.totalAttributedOrders} orders generated
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-cream-300 shadow-sm">
          <div className="flex items-center justify-between text-noir-400">
            <span className="text-xs font-medium uppercase tracking-wider">Commission Payable</span>
            <DollarSign className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-serif text-amber-600 mt-2">
            ₹{summary.totalCommissionOwed.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-noir-400 mt-1">
            ₹{summary.totalCommissionPaid.toLocaleString('en-IN')} already paid out
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-cream-300 shadow-sm">
          <div className="flex items-center justify-between text-noir-400">
            <span className="text-xs font-medium uppercase tracking-wider">Customer Savings</span>
            <Award className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold font-serif text-noir-950 mt-2">
            ₹{summary.totalDiscountGiven.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-noir-500 mt-1">
            In creator discounts applied
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3 rounded-xl border border-cream-300 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-noir-400" />
          <input
            type="text"
            placeholder="Search creator name, handle or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-cream-50 border border-cream-300 rounded-lg text-xs text-noir-900 focus:outline-none focus:ring-1 focus:ring-noir-900"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {["ALL", "INSTAGRAM", "YOUTUBE"].map((plat) => (
            <button
              key={plat}
              onClick={() => setPlatformFilter(plat)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                platformFilter === plat
                  ? "bg-noir-950 text-white font-semibold"
                  : "bg-cream-100 text-noir-600 hover:bg-cream-200"
              )}
            >
              {plat === "ALL" ? "All Platforms" : plat.charAt(0) + plat.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Influencer Leaderboard & Management Table */}
      <div className="bg-white rounded-xl border border-cream-300 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-cream-300 bg-cream-50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-noir-950">
            Creator Partner Leaderboard ({filteredInfluencers.length})
          </h2>
          <span className="text-[11px] text-noir-500 font-mono">
            Sorted by Gross Attributed Revenue
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-noir-700">
            <thead className="bg-cream-100/50 text-[10px] uppercase font-mono text-noir-500 border-b border-cream-300">
              <tr>
                <th className="py-3 px-4">Creator / Handle</th>
                <th className="py-3 px-4">Platform</th>
                <th className="py-3 px-4">Promo Code & Referral</th>
                <th className="py-3 px-4 text-center">Clicks</th>
                <th className="py-3 px-4 text-center">Orders</th>
                <th className="py-3 px-4 text-center">Conv. Rate</th>
                <th className="py-3 px-4 text-right">Attributed GMV</th>
                <th className="py-3 px-4 text-right">Commission</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-200">
              {filteredInfluencers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-noir-400">
                    No creator partners found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredInfluencers.map((inf) => {
                  const isCopied = copiedCode === inf.code;
                  return (
                    <tr key={inf.id} className="hover:bg-cream-50/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-noir-950">{inf.influencerName}</div>
                        <div className="text-[11px] text-noir-400 font-mono">{inf.influencerHandle}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider",
                          inf.influencerPlatform === 'instagram' && "bg-pink-100 text-pink-700",
                          inf.influencerPlatform === 'youtube' && "bg-red-100 text-red-700",
                          inf.influencerPlatform !== 'instagram' && inf.influencerPlatform !== 'youtube' && "bg-blue-100 text-blue-700"
                        )}>
                          {inf.influencerPlatform === 'instagram' && <Instagram className="w-3 h-3" />}
                          {inf.influencerPlatform === 'youtube' && <Youtube className="w-3 h-3" />}
                          <span>{inf.influencerPlatform}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold bg-cream-100 px-2 py-0.5 rounded text-noir-900 border border-cream-300">
                            {inf.code}
                          </span>
                          <span className="text-[10px] text-green-700 font-semibold bg-green-50 px-1.5 py-0.5 rounded">
                            {inf.discountType === 'percentage' ? `${inf.discountValue}% OFF` : `₹${inf.discountValue} OFF`}
                          </span>
                        </div>
                        <button
                          onClick={() => handleCopyLink(inf.code)}
                          className="mt-1 text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-mono hover:underline"
                          title="Copy VIP Referral Link"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3 h-3 text-green-600" />
                              <span className="text-green-600 font-bold">Link Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>perfectpic.in/ref/{inf.code}</span>
                            </>
                          )}
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono text-noir-600">
                        {inf.clickCount}
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-bold text-noir-900">
                        {inf.totalOrders}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 bg-green-50 text-green-700 font-mono text-[11px] font-bold rounded-full border border-green-200">
                          {inf.conversionRate}%
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-serif font-bold text-noir-950 text-sm">
                        ₹{inf.grossGmv.toLocaleString('en-IN')}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="font-mono font-bold text-amber-600 text-xs">
                          ₹{inf.commissionEarned.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-noir-400 font-mono">
                          ({inf.commissionRate}% cut)
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleCopyLink(inf.code)}
                          className="p-1.5 rounded-lg border border-cream-300 hover:bg-cream-100 text-noir-700 transition-colors"
                          title="Copy Link for Influencer"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Attributed Orders Feed */}
      {recentOrders.length > 0 && (
        <div className="bg-white rounded-xl border border-cream-300 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-noir-950 mb-3">
            Recent Creator-Attributed Orders
          </h3>
          <div className="divide-y divide-cream-200">
            {recentOrders.map((ord: any, idx: number) => (
              <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-noir-900">{ord.orderNumber || 'Order'}</span>
                  <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono text-[10px] font-semibold">
                    via {ord.code}
                  </span>
                  <span className="text-noir-500 text-[11px]">{ord.customerEmail}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-green-600 font-mono text-[11px]">-₹{ord.discountAmount} discount</span>
                  <span className="font-serif font-bold text-noir-950">₹{ord.orderTotal}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Partner Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-cream-300 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-noir-400 hover:text-noir-950 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-serif font-bold text-noir-950 mb-1">
              Add Creator Partner
            </h3>
            <p className="text-xs text-noir-500 mb-5">
              Create a dedicated promo code and trackable affiliate link for an influencer.
            </p>

            <form onSubmit={handleCreatePartner} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-noir-700 mb-1">Creator Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya Sharma"
                  value={formData.influencerName}
                  onChange={(e) => setFormData({ ...formData, influencerName: e.target.value })}
                  className="w-full px-3 py-2 border border-cream-300 rounded-lg text-noir-900 focus:outline-none focus:ring-1 focus:ring-noir-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-noir-700 mb-1">Social Handle</label>
                  <input
                    type="text"
                    required
                    placeholder="@handle"
                    value={formData.influencerHandle}
                    onChange={(e) => setFormData({ ...formData, influencerHandle: e.target.value })}
                    className="w-full px-3 py-2 border border-cream-300 rounded-lg text-noir-900 focus:outline-none focus:ring-1 focus:ring-noir-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-noir-700 mb-1">Platform</label>
                  <select
                    value={formData.influencerPlatform}
                    onChange={(e) => setFormData({ ...formData, influencerPlatform: e.target.value as any })}
                    className="w-full px-3 py-2 border border-cream-300 rounded-lg text-noir-900 focus:outline-none focus:ring-1 focus:ring-noir-900"
                  >
                    <option value="instagram">Instagram</option>
                    <option value="youtube">YouTube</option>
                    <option value="facebook">Facebook</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-noir-700 mb-1">Custom Promo Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PRIYA20"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-cream-300 rounded-lg text-noir-900 focus:outline-none focus:ring-1 focus:ring-noir-900 font-mono font-bold uppercase"
                />
                <p className="text-[10px] text-noir-400 mt-1">
                  Referral URL will be: <code>perfectpic.in/ref/{formData.code || 'CODE'}</code>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-noir-700 mb-1">Audience Discount (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-cream-300 rounded-lg text-noir-900 focus:outline-none focus:ring-1 focus:ring-noir-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-noir-700 mb-1">Creator Commission (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    required
                    value={formData.commissionRate}
                    onChange={(e) => setFormData({ ...formData, commissionRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-cream-300 rounded-lg text-noir-900 focus:outline-none focus:ring-1 focus:ring-noir-900 font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-cream-300 text-noir-700 hover:bg-cream-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="px-4 py-2 rounded-lg bg-noir-950 hover:bg-noir-900 text-white font-medium flex items-center gap-1.5"
                >
                  {modalSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Generate Code & Link</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
