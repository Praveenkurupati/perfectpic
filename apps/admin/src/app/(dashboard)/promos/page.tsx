"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Tag, 
  Plus, 
  Search, 
  Filter, 
  Check, 
  Copy, 
  Calendar, 
  Users, 
  Sparkles, 
  TrendingUp, 
  Percent, 
  Clock, 
  AlertCircle, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Eye, 
  CheckCircle2, 
  X, 
  Loader2,
  ChevronRight
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { cn } from "@/lib/utils";

interface PromoCodeItem {
  id: string;
  code: string;
  description?: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  maxDiscountAmount?: number | null;
  minOrderAmount: number;
  audienceType: "ALL" | "FIRST_ORDER" | "SPECIFIC_USERS";
  allowedUserEmails?: string[];
  maxUses?: number | null;
  currentUses: number;
  maxUsesPerUser: number;
  startDate: string | Date;
  expiresAt?: string | Date | null;
  isActive: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

// Initial fallback data matching user's exact specification
const fallbackPromos: PromoCodeItem[] = [
  {
    id: "promo-launch20",
    code: "LAUNCH20",
    description: "Launch celebration special: 20% off for the first 500 photobook creators.",
    discountType: "percentage",
    discountValue: 20,
    maxDiscountAmount: 600,
    minOrderAmount: 0,
    audienceType: "ALL",
    allowedUserEmails: [],
    maxUses: 500,
    currentUses: 145,
    maxUsesPerUser: 1,
    startDate: "2026-01-01T00:00:00.000Z",
    expiresAt: "2026-12-31T23:59:59.000Z",
    isActive: true,
  },
  {
    id: "promo-festival500",
    code: "FESTIVAL500",
    description: "Festival season flat ₹500 off on luxury orders above ₹3,000.",
    discountType: "fixed",
    discountValue: 500,
    maxDiscountAmount: null,
    minOrderAmount: 3000,
    audienceType: "ALL",
    allowedUserEmails: [],
    maxUses: null,
    currentUses: 0,
    maxUsesPerUser: 2,
    startDate: "2026-09-01T00:00:00.000Z",
    expiresAt: "2026-11-30T23:59:59.000Z",
    isActive: false, // Inactive as in user prompt
  },
  {
    id: "promo-firstpic",
    code: "FIRSTPIC",
    description: "Welcome gift: ₹300 off on first photobook order for new registered customers.",
    discountType: "fixed",
    discountValue: 300,
    maxDiscountAmount: null,
    minOrderAmount: 1999,
    audienceType: "FIRST_ORDER",
    allowedUserEmails: [],
    maxUses: 1000,
    currentUses: 48,
    maxUsesPerUser: 1,
    startDate: "2026-01-01T00:00:00.000Z",
    expiresAt: null,
    isActive: true,
  },
  {
    id: "promo-vipexclusive",
    code: "VIPEXCLUSIVE",
    description: "Exclusive creator club: 25% off for approved VIP designer accounts.",
    discountType: "percentage",
    discountValue: 25,
    maxDiscountAmount: 1000,
    minOrderAmount: 2499,
    audienceType: "SPECIFIC_USERS",
    allowedUserEmails: ["priya@example.com", "rahul@example.com", "vip@perfectpic.in"],
    maxUses: 100,
    currentUses: 6,
    maxUsesPerUser: 3,
    startDate: "2026-08-01T00:00:00.000Z",
    expiresAt: "2026-12-31T23:59:59.000Z",
    isActive: true,
  },
];

export default function PromoCodesPage() {
  const [promos, setPromos] = useState<PromoCodeItem[]>(fallbackPromos);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "expired">("all");
  const [audienceFilter, setAudienceFilter] = useState<string>("ALL");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCodeItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Usages Modal State
  const [usagesModalOpen, setUsagesModalOpen] = useState(false);
  const [selectedPromoUsages, setSelectedPromoUsages] = useState<{ promo: PromoCodeItem; usages: any[] } | null>(null);
  const [loadingUsages, setLoadingUsages] = useState(false);

  // Form Fields
  const [formCode, setFormCode] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDiscountType, setFormDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [formDiscountValue, setFormDiscountValue] = useState<number>(20);
  const [formMaxDiscount, setFormMaxDiscount] = useState<string>("");
  const [formMinOrder, setFormMinOrder] = useState<number>(0);
  const [formAudience, setFormAudience] = useState<"ALL" | "FIRST_ORDER" | "SPECIFIC_USERS">("ALL");
  const [formEmails, setFormEmails] = useState("");
  const [formMaxUses, setFormMaxUses] = useState<string>("");
  const [formMaxUsesPerUser, setFormMaxUsesPerUser] = useState<number>(1);
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [formExpiresAt, setFormExpiresAt] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);

  // Load promos from API
  const loadPromos = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getPromos({
        status: statusFilter,
        search: searchTerm,
        audience: audienceFilter,
      });
      if (res && Array.isArray(res.promos)) {
        setPromos(res.promos);
      }
    } catch (err) {
      console.warn("Using local fallback promos:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPromos();
  }, [statusFilter, audienceFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadPromos();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleToggleStatus = async (promo: PromoCodeItem) => {
    // Optimistic UI update
    setPromos((prev) =>
      prev.map((p) => (p.id === promo.id ? { ...p, isActive: !p.isActive } : p))
    );

    try {
      await adminApi.togglePromoStatus(promo.id);
    } catch (err: any) {
      console.error("Failed to toggle promo status:", err);
      // Revert on error
      setPromos((prev) =>
        prev.map((p) => (p.id === promo.id ? { ...p, isActive: promo.isActive } : p))
      );
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Are you sure you want to delete promo code '${code}'? This cannot be undone.`)) {
      return;
    }

    setPromos((prev) => prev.filter((p) => p.id !== id));
    try {
      await adminApi.deletePromo(id);
    } catch (err: any) {
      console.error("Failed to delete promo:", err);
      loadPromos();
    }
  };

  const openCreateModal = () => {
    setEditingPromo(null);
    setFormCode("");
    setFormDescription("");
    setFormDiscountType("percentage");
    setFormDiscountValue(20);
    setFormMaxDiscount("");
    setFormMinOrder(0);
    setFormAudience("ALL");
    setFormEmails("");
    setFormMaxUses("");
    setFormMaxUsesPerUser(1);
    setFormStartDate(new Date().toISOString().split("T")[0]);
    setFormExpiresAt("");
    setFormIsActive(true);
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (promo: PromoCodeItem) => {
    setEditingPromo(promo);
    setFormCode(promo.code);
    setFormDescription(promo.description || "");
    setFormDiscountType(promo.discountType);
    setFormDiscountValue(promo.discountValue);
    setFormMaxDiscount(promo.maxDiscountAmount ? String(promo.maxDiscountAmount) : "");
    setFormMinOrder(promo.minOrderAmount || 0);
    setFormAudience(promo.audienceType || "ALL");
    setFormEmails(promo.allowedUserEmails ? promo.allowedUserEmails.join(", ") : "");
    setFormMaxUses(promo.maxUses !== null && promo.maxUses !== undefined ? String(promo.maxUses) : "");
    setFormMaxUsesPerUser(promo.maxUsesPerUser || 1);
    
    if (promo.startDate) {
      setFormStartDate(new Date(promo.startDate).toISOString().split("T")[0]);
    }
    if (promo.expiresAt) {
      setFormExpiresAt(new Date(promo.expiresAt).toISOString().split("T")[0] || "");
    } else {
      setFormExpiresAt("");
    }
    setFormIsActive(promo.isActive);
    setFormError("");
    setModalOpen(true);
  };

  const handleSavePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    const code = formCode.trim().toUpperCase();
    if (!code) {
      setFormError("Promo code is required.");
      return;
    }

    if (formDiscountValue <= 0) {
      setFormError("Discount value must be greater than zero.");
      return;
    }

    if (formDiscountType === "percentage" && formDiscountValue > 100) {
      setFormError("Percentage discount cannot exceed 100%.");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      code,
      description: formDescription.trim(),
      discountType: formDiscountType,
      discountValue: Number(formDiscountValue),
      maxDiscountAmount: formMaxDiscount ? Number(formMaxDiscount) : null,
      minOrderAmount: Number(formMinOrder || 0),
      audienceType: formAudience,
      allowedUserEmails: formAudience === "SPECIFIC_USERS" 
        ? formEmails.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
        : [],
      maxUses: formMaxUses ? Number(formMaxUses) : null,
      maxUsesPerUser: Number(formMaxUsesPerUser || 1),
      startDate: formStartDate ? new Date(formStartDate).toISOString() : new Date().toISOString(),
      expiresAt: formExpiresAt ? new Date(formExpiresAt).toISOString() : null,
      isActive: formIsActive,
    };

    try {
      if (editingPromo) {
        const res = await adminApi.updatePromo(editingPromo.id, payload);
        setPromos((prev) =>
          prev.map((p) => (p.id === editingPromo.id ? { ...p, ...res.promo } : p))
        );
      } else {
        const res = await adminApi.createPromo(payload);
        setPromos((prev) => [res.promo, ...prev]);
      }
      setModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || "Failed to save promo code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openUsagesModal = async (promo: PromoCodeItem) => {
    setSelectedPromoUsages({ promo, usages: [] });
    setUsagesModalOpen(true);
    setLoadingUsages(true);

    try {
      const res = await adminApi.getPromoUsages(promo.id);
      setSelectedPromoUsages(res);
    } catch (err) {
      console.warn("Failed to load usages from API, showing local:", err);
      // Fallback local mockup for preview
      setSelectedPromoUsages({
        promo,
        usages: [
          {
            id: "usage-demo-1",
            customerEmail: "customer@example.com",
            orderNumber: "PP-8491",
            discountAmount: promo.discountType === "fixed" ? promo.discountValue : 400,
            orderTotal: 1999,
            usedAt: new Date().toISOString(),
          },
        ],
      });
    } finally {
      setLoadingUsages(false);
    }
  };

  // KPIs
  const stats = useMemo(() => {
    const total = promos.length;
    const active = promos.filter((p) => p.isActive).length;
    const totalRedemptions = promos.reduce((sum, p) => sum + (p.currentUses || 0), 0);
    const firstOrderCodes = promos.filter((p) => p.audienceType === "FIRST_ORDER").length;
    return { total, active, totalRedemptions, firstOrderCodes };
  }, [promos]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-noir-950 flex items-center gap-2.5">
            <Tag className="w-6 h-6 text-noir-800" />
            Promo Codes &amp; Discounts
          </h1>
          <p className="text-sm text-noir-500 mt-1">
            Create and manage promotional discount codes, first-order bonuses, and festival sales campaigns.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-noir-950 hover:bg-noir-900 text-cream-50 text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors shadow-luxury-sm"
        >
          <Plus className="w-4 h-4" />
          Add Promo Code
        </button>
      </div>

      {/* KPI Highlights Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-md border border-cream-200 shadow-luxury-xs">
          <div className="flex items-center justify-between text-noir-500 mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold">Active Codes</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-noir-950">{stats.active}</span>
            <span className="text-xs text-noir-500">of {stats.total} total</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-md border border-cream-200 shadow-luxury-xs">
          <div className="flex items-center justify-between text-noir-500 mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold">Total Redemptions</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-noir-950">{stats.totalRedemptions}</span>
            <span className="text-xs text-emerald-600 font-medium">orders saved</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-md border border-cream-200 shadow-luxury-xs">
          <div className="flex items-center justify-between text-noir-500 mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold">First-Order Promos</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-noir-950">{stats.firstOrderCodes}</span>
            <span className="text-xs text-noir-500">new user incentives</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-md border border-cream-200 shadow-luxury-xs">
          <div className="flex items-center justify-between text-noir-500 mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold">Live System Engine</span>
            <Clock className="w-4 h-4 text-noir-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Auto Quota Enforced
            </span>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-md shadow-luxury-sm border border-cream-200 overflow-hidden">
        {/* Table Controls */}
        <div className="p-4 border-b border-cream-200 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
          {/* Search Input */}
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-noir-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search code or description..."
              className="w-full pl-9 pr-4 py-2 bg-cream-50 border border-cream-300 rounded-sm text-sm focus:outline-none focus:border-noir-400 focus:ring-1 focus:ring-noir-400 transition-shadow"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-sm p-1 bg-cream-100 border border-cream-300 text-xs font-medium">
              <button
                onClick={() => setStatusFilter("all")}
                className={cn(
                  "px-3 py-1 rounded-sm transition-colors",
                  statusFilter === "all" ? "bg-white text-noir-950 font-semibold shadow-xs" : "text-noir-600 hover:text-noir-900"
                )}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter("active")}
                className={cn(
                  "px-3 py-1 rounded-sm transition-colors",
                  statusFilter === "active" ? "bg-white text-emerald-800 font-semibold shadow-xs" : "text-noir-600 hover:text-noir-900"
                )}
              >
                Active
              </button>
              <button
                onClick={() => setStatusFilter("inactive")}
                className={cn(
                  "px-3 py-1 rounded-sm transition-colors",
                  statusFilter === "inactive" ? "bg-white text-noir-950 font-semibold shadow-xs" : "text-noir-600 hover:text-noir-900"
                )}
              >
                Inactive
              </button>
            </div>

            {/* Audience Dropdown */}
            <select
              value={audienceFilter}
              onChange={(e) => setAudienceFilter(e.target.value)}
              className="py-1.5 px-3 bg-cream-50 border border-cream-300 rounded-sm text-xs font-medium text-noir-700 focus:outline-none focus:border-noir-400"
            >
              <option value="ALL">All Audiences</option>
              <option value="FIRST_ORDER">First Order Only</option>
              <option value="SPECIFIC_USERS">Specific Users</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-cream-100 text-noir-600 uppercase tracking-wider text-[11px] font-semibold border-b border-cream-200">
              <tr>
                <th className="py-3 px-4">CODE</th>
                <th className="py-3 px-4">DISCOUNT</th>
                <th className="py-3 px-4">AUDIENCE</th>
                <th className="py-3 px-4">USAGE</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-noir-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-noir-400" />
                    Loading promo codes...
                  </td>
                </tr>
              ) : promos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-noir-500">
                    No promo codes match your filter criteria.
                  </td>
                </tr>
              ) : (
                promos.map((promo) => {
                  const isExpired = promo.expiresAt && new Date(promo.expiresAt) < new Date();
                  const isMaxReached = promo.maxUses !== null && promo.maxUses !== undefined && promo.currentUses >= promo.maxUses;
                  const isPercentage = promo.discountType === "percentage";

                  return (
                    <tr key={promo.id} className="hover:bg-cream-50/60 transition-colors">
                      {/* CODE Column */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm tracking-wider text-noir-950 bg-cream-100 border border-cream-300 px-2.5 py-1 rounded">
                            {promo.code}
                          </span>
                          <button
                            onClick={() => handleCopy(promo.code)}
                            title="Copy code"
                            className="text-noir-400 hover:text-noir-800 transition-colors p-1"
                          >
                            {copiedCode === promo.code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        {promo.description && (
                          <p className="text-xs text-noir-500 mt-1.5 max-w-sm line-clamp-1">
                            {promo.description}
                          </p>
                        )}
                      </td>

                      {/* DISCOUNT Column */}
                      <td className="py-4 px-4">
                        <div className="font-semibold text-noir-900">
                          {isPercentage ? `${promo.discountValue}% OFF` : `₹${promo.discountValue} OFF`}
                        </div>
                        <div className="text-[11px] text-noir-500 mt-0.5 space-x-2">
                          {promo.minOrderAmount > 0 && (
                            <span>Min ₹{promo.minOrderAmount.toLocaleString("en-IN")}</span>
                          )}
                          {isPercentage && promo.maxDiscountAmount && (
                            <span>• Max ₹{promo.maxDiscountAmount.toLocaleString("en-IN")}</span>
                          )}
                          {promo.maxUsesPerUser && promo.maxUsesPerUser > 1 && (
                            <span>• {promo.maxUsesPerUser}x/user</span>
                          )}
                        </div>
                      </td>

                      {/* AUDIENCE Column */}
                      <td className="py-4 px-4">
                        {promo.audienceType === "FIRST_ORDER" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            <Sparkles className="w-3 h-3 text-amber-600" />
                            First Order
                          </span>
                        ) : promo.audienceType === "SPECIFIC_USERS" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-800 border border-purple-200">
                            <Users className="w-3 h-3 text-purple-600" />
                            Specific Users ({promo.allowedUserEmails?.length || 0})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-cream-100 text-noir-700">
                            Everyone
                          </span>
                        )}
                      </td>

                      {/* USAGE Column */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-noir-900">
                            {promo.currentUses} / {promo.maxUses ? promo.maxUses : "Unlimited"}
                          </span>
                        </div>
                        {promo.maxUses && (
                          <div className="w-24 bg-cream-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                isMaxReached ? "bg-red-500" : "bg-noir-900"
                              )}
                              style={{
                                width: `${Math.min(100, ((promo.currentUses || 0) / promo.maxUses) * 100)}%`,
                              }}
                            />
                          </div>
                        )}
                        <button
                          onClick={() => openUsagesModal(promo)}
                          className="text-[11px] text-noir-500 hover:text-noir-900 underline mt-1 block"
                        >
                          View {promo.currentUses} redemptions
                        </button>
                      </td>

                      {/* STATUS Column */}
                      <td className="py-4 px-4">
                        {isExpired ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                            Expired
                          </span>
                        ) : isMaxReached ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
                            Exhausted
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(promo)}
                            className={cn(
                              "inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold transition-colors",
                              promo.isActive
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                                : "bg-cream-100 text-noir-500 border border-cream-300 hover:bg-cream-200"
                            )}
                          >
                            <span
                              className={cn(
                                "w-1.5 h-1.5 rounded-full mr-1.5",
                                promo.isActive ? "bg-emerald-600" : "bg-noir-400"
                              )}
                            />
                            {promo.isActive ? "Active" : "Inactive"}
                          </button>
                        )}
                      </td>

                      {/* ACTIONS Column */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(promo)}
                            title="Edit Promo Code"
                            className="p-1.5 text-noir-600 hover:text-noir-950 hover:bg-cream-100 rounded transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(promo.id, promo.code)}
                            title="Delete Promo Code"
                            className="p-1.5 text-noir-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* Add / Edit Promo Code Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-noir-950/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-xl rounded-md shadow-luxury-xl border border-cream-300 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-5 border-b border-cream-200 flex justify-between items-center bg-cream-50/50">
              <div>
                <h3 className="text-lg font-semibold text-noir-950">
                  {editingPromo ? `Edit Coupon: ${editingPromo.code}` : "Create New Promo Code"}
                </h3>
                <p className="text-xs text-noir-500 mt-0.5">
                  Configure discount value, usage rules, and customer eligibility.
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-noir-400 hover:text-noir-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSavePromo} className="p-6 space-y-5">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Code & Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-noir-700 mb-1">
                    Coupon Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. LAUNCH20"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase().replace(/\s/g, ""))}
                    className="w-full font-mono uppercase px-3 py-2 bg-cream-50 border border-cream-300 rounded-sm text-sm focus:outline-none focus:border-noir-950 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-noir-700 mb-1">
                    Discount Type *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormDiscountType("percentage")}
                      className={cn(
                        "py-2 px-3 text-xs font-semibold rounded border transition-colors flex items-center justify-center gap-1.5",
                        formDiscountType === "percentage"
                          ? "bg-noir-950 text-cream-50 border-noir-950"
                          : "bg-cream-50 text-noir-700 border-cream-300 hover:bg-cream-100"
                      )}
                    >
                      <Percent className="w-3.5 h-3.5" />
                      Percentage %
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormDiscountType("fixed")}
                      className={cn(
                        "py-2 px-3 text-xs font-semibold rounded border transition-colors flex items-center justify-center gap-1.5",
                        formDiscountType === "fixed"
                          ? "bg-noir-950 text-cream-50 border-noir-950"
                          : "bg-cream-50 text-noir-700 border-cream-300 hover:bg-cream-100"
                      )}
                    >
                      <span>₹</span>
                      Fixed Amount
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-noir-700 mb-1">
                  Campaign Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Launch special: 20% off for first 500 orders"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-cream-50 border border-cream-300 rounded-sm text-sm focus:outline-none focus:border-noir-950"
                />
              </div>

              {/* Discount Value & Max Cap */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-noir-700 mb-1">
                    {formDiscountType === "percentage" ? "Discount Percentage (%) *" : "Discount Amount (₹) *"}
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={formDiscountType === "percentage" ? 100 : 50000}
                    value={formDiscountValue}
                    onChange={(e) => setFormDiscountValue(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-cream-50 border border-cream-300 rounded-sm text-sm focus:outline-none focus:border-noir-950"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-noir-700 mb-1">
                    {formDiscountType === "percentage" ? "Max Discount Cap (₹) (Optional)" : "N/A (Fixed)"}
                  </label>
                  <input
                    type="number"
                    disabled={formDiscountType !== "percentage"}
                    placeholder={formDiscountType === "percentage" ? "e.g. 500 (blank = unlimited)" : "Fixed discount"}
                    value={formMaxDiscount}
                    onChange={(e) => setFormMaxDiscount(e.target.value)}
                    className="w-full px-3 py-2 bg-cream-50 border border-cream-300 rounded-sm text-sm focus:outline-none focus:border-noir-950 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Min Order & Target Audience */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-noir-700 mb-1">
                    Min Order Subtotal (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    placeholder="0 for no minimum"
                    value={formMinOrder}
                    onChange={(e) => setFormMinOrder(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-cream-50 border border-cream-300 rounded-sm text-sm focus:outline-none focus:border-noir-950"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-noir-700 mb-1">
                    Target Audience *
                  </label>
                  <select
                    value={formAudience}
                    onChange={(e) => setFormAudience(e.target.value as any)}
                    className="w-full px-3 py-2 bg-cream-50 border border-cream-300 rounded-sm text-sm focus:outline-none focus:border-noir-950"
                  >
                    <option value="ALL">Everyone (General Promotion)</option>
                    <option value="FIRST_ORDER">First Order Only (New Registered Users)</option>
                    <option value="SPECIFIC_USERS">Specific User Accounts Only</option>
                  </select>
                </div>
              </div>

              {/* Allowed Emails if Specific Users */}
              {formAudience === "SPECIFIC_USERS" && (
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-noir-700 mb-1">
                    Allowed Customer Emails (comma-separated)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="user1@example.com, user2@example.com"
                    value={formEmails}
                    onChange={(e) => setFormEmails(e.target.value)}
                    className="w-full px-3 py-2 bg-cream-50 border border-cream-300 rounded-sm text-sm focus:outline-none focus:border-noir-950"
                  />
                </div>
              )}

              {/* Limits & Quota */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-noir-700 mb-1">
                    Total Global Usage Limit
                  </label>
                  <input
                    type="number"
                    min={1}
                    placeholder="Leave blank for Unlimited"
                    value={formMaxUses}
                    onChange={(e) => setFormMaxUses(e.target.value)}
                    className="w-full px-3 py-2 bg-cream-50 border border-cream-300 rounded-sm text-sm focus:outline-none focus:border-noir-950"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-noir-700 mb-1">
                    Max Redemptions Per Customer
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formMaxUsesPerUser}
                    onChange={(e) => setFormMaxUsesPerUser(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-cream-50 border border-cream-300 rounded-sm text-sm focus:outline-none focus:border-noir-950"
                  />
                </div>
              </div>

              {/* Validity Window */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-noir-700 mb-1">
                    Valid From Date
                  </label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-cream-50 border border-cream-300 rounded-sm text-sm focus:outline-none focus:border-noir-950"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-noir-700 mb-1">
                    Expires On Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formExpiresAt}
                    onChange={(e) => setFormExpiresAt(e.target.value)}
                    className="w-full px-3 py-2 bg-cream-50 border border-cream-300 rounded-sm text-sm focus:outline-none focus:border-noir-950"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-cream-200">
                <div>
                  <p className="text-sm font-semibold text-noir-900">Activate Immediately</p>
                  <p className="text-xs text-noir-500">Allow customers to redeem this coupon code now</p>
                </div>
                <input
                  type="checkbox"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-noir-900 border-cream-300 focus:ring-noir-900"
                />
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-cream-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-cream-100 hover:bg-cream-200 text-noir-700 rounded-sm text-xs font-semibold uppercase tracking-wider transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-noir-950 hover:bg-noir-900 text-cream-50 rounded-sm text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingPromo ? "Save Changes" : "Create Code"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Usages History Drawer/Modal */}
      {usagesModalOpen && selectedPromoUsages && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-noir-950/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl rounded-md shadow-luxury-xl border border-cream-300 max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-cream-200 flex justify-between items-center bg-cream-50/50">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-base text-noir-950 bg-cream-100 border border-cream-300 px-2 py-0.5 rounded">
                    {selectedPromoUsages.promo.code}
                  </span>
                  <span className="text-sm font-semibold text-noir-800">Redemption History</span>
                </div>
                <p className="text-xs text-noir-500 mt-1">
                  Total {selectedPromoUsages.promo.currentUses} redemptions recorded
                </p>
              </div>
              <button
                onClick={() => setUsagesModalOpen(false)}
                className="text-noir-400 hover:text-noir-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-5">
              {loadingUsages ? (
                <div className="py-12 text-center text-noir-500">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-noir-400" />
                  Loading redemptions...
                </div>
              ) : selectedPromoUsages.usages.length === 0 ? (
                <div className="py-12 text-center text-noir-500">
                  No customer has redeemed this coupon code yet.
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-cream-100 text-noir-600 uppercase tracking-wider text-[10px] font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">CUSTOMER EMAIL</th>
                      <th className="py-2.5 px-3">ORDER #</th>
                      <th className="py-2.5 px-3">DISCOUNT SAVED</th>
                      <th className="py-2.5 px-3">DATE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream-200 text-xs">
                    {selectedPromoUsages.usages.map((u, i) => (
                      <tr key={u.id || i} className="hover:bg-cream-50/60">
                        <td className="py-3 px-3 font-medium text-noir-900">{u.customerEmail}</td>
                        <td className="py-3 px-3 font-mono text-noir-700">{u.orderNumber || "—"}</td>
                        <td className="py-3 px-3 font-semibold text-emerald-700">₹{u.discountAmount}</td>
                        <td className="py-3 px-3 text-noir-500">
                          {new Date(u.usedAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="p-4 border-t border-cream-200 bg-cream-50 flex justify-end">
              <button
                type="button"
                onClick={() => setUsagesModalOpen(false)}
                className="px-4 py-2 bg-noir-900 text-cream-50 text-xs font-semibold uppercase tracking-wider rounded transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
