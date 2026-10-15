"use client";

import { useState, useEffect } from "react";
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  Boxes, 
  RotateCcw, 
  Sparkles, 
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  Truck,
  TrendingUp,
  Percent,
  Layers,
  IndianRupee,
  Calculator
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { cn } from "@/lib/utils";

interface BundleTierItem {
  id?: string;
  bundleId: string;
  minQuantity: number;
  name: string;
  price: number;
  perBookPrice?: number;
  discountAmount: number;
  netPrice?: number;
  printCost?: number;
  shippingCost?: number;
  grossProfit?: number;
  marginPerBook?: number;
  marginPercentage?: number;
  freeShipping: boolean;
  badge?: string;
  description: string;
  isActive?: boolean;
  displayOrder: number;
}

const AUTHORITATIVE_FALLBACK_TIERS: BundleTierItem[] = [
  {
    bundleId: 'bundle-1',
    minQuantity: 1,
    name: '1 Book (Single)',
    price: 1999,
    perBookPrice: 1999,
    discountAmount: 0,
    netPrice: 1738,
    printCost: 515,
    shippingCost: 110,
    grossProfit: 1113,
    marginPerBook: 1113,
    marginPercentage: 55.7,
    freeShipping: true,
    badge: 'Single',
    description: 'Our handcrafted archival single photobook, 8.25" × 8.25", 32 pages with archival lay-flat binding.',
    isActive: true,
    displayOrder: 1,
  },
  {
    bundleId: 'bundle-2',
    minQuantity: 2,
    name: '2 Books (Duo)',
    price: 3499,
    perBookPrice: 1750,
    discountAmount: 499,
    netPrice: 3042,
    printCost: 1030,
    shippingCost: 150,
    grossProfit: 1862,
    marginPerBook: 931,
    marginPercentage: 53.2,
    freeShipping: true,
    badge: 'Duo',
    description: 'Save ₹499 off + Free All-India Shipping. Perfect for gifting parents and in-laws or keeping a duplicate volume.',
    isActive: true,
    displayOrder: 2,
  },
  {
    bundleId: 'bundle-4',
    minQuantity: 4,
    name: '4 Books (Quartet)',
    price: 6399,
    perBookPrice: 1600,
    discountAmount: 1597,
    netPrice: 5563,
    printCost: 2060,
    shippingCost: 240,
    grossProfit: 3263,
    marginPerBook: 816,
    marginPercentage: 51.0,
    freeShipping: true,
    badge: 'Popular',
    description: 'Save ₹1,597 off + Free All-India Shipping. Ideal for family vacations, milestone gifts, and multi-home keepsakes.',
    isActive: true,
    displayOrder: 3,
  },
  {
    bundleId: 'bundle-6',
    minQuantity: 6,
    name: '6 Books (Collector)',
    price: 8999,
    perBookPrice: 1500,
    discountAmount: 2995,
    netPrice: 7823,
    printCost: 3090,
    shippingCost: 330,
    grossProfit: 4403,
    marginPerBook: 734,
    marginPercentage: 48.9,
    freeShipping: true,
    badge: 'Collector',
    description: 'Save ₹2,995 off + Free All-India Shipping. Our finest volume collection for large family gatherings, weddings, and annual archives.',
    isActive: true,
    displayOrder: 4,
  },
];

export default function BundlesManagementPage() {
  const [bundles, setBundles] = useState<BundleTierItem[]>(AUTHORITATIVE_FALLBACK_TIERS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BundleTierItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    minQuantity: 2,
    name: "2 Books (Duo)",
    price: 3499,
    discountAmount: 499,
    netPrice: 3042,
    printCost: 1030,
    shippingCost: 150,
    freeShipping: true,
    badge: "Duo",
    description: "Save ₹499 off + Free All-India Shipping. Perfect for gifting parents and in-laws.",
    isActive: true,
    displayOrder: 2,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAllBundles();
      if (res && res.bundles && res.bundles.length > 0) {
        setBundles(res.bundles);
      } else {
        setBundles(AUTHORITATIVE_FALLBACK_TIERS);
      }
    } catch (err: any) {
      console.error("Failed to load bundle tiers:", err);
      setBundles(AUTHORITATIVE_FALLBACK_TIERS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    const nextOrder = bundles.length + 1;
    setFormData({
      minQuantity: 4,
      name: "4 Books (Quartet)",
      price: 6399,
      discountAmount: 1597,
      netPrice: 5563,
      printCost: 2060,
      shippingCost: 240,
      freeShipping: true,
      badge: "Popular",
      description: "Save ₹1,597 off + Free All-India Shipping. Ideal for family vacations, milestone gifts, and multi-home keepsakes.",
      isActive: true,
      displayOrder: nextOrder,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: BundleTierItem) => {
    setEditingItem(item);
    setFormData({
      minQuantity: item.minQuantity,
      name: item.name,
      price: item.price ?? 1999,
      discountAmount: item.discountAmount ?? 0,
      netPrice: item.netPrice ?? Math.round((item.price ?? 1999) * 0.8694),
      printCost: item.printCost ?? (item.minQuantity * 515),
      shippingCost: item.shippingCost ?? (item.minQuantity === 1 ? 110 : item.minQuantity === 2 ? 150 : item.minQuantity === 4 ? 240 : 330),
      freeShipping: item.freeShipping !== false,
      badge: item.badge || "",
      description: item.description || "",
      isActive: item.isActive !== false,
      displayOrder: item.displayOrder || 1,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.minQuantity < 1) {
      showNotification('error', 'Minimum book quantity must be at least 1');
      return;
    }
    if (formData.price < 0) {
      showNotification('error', 'Selling price cannot be negative');
      return;
    }
    if (formData.discountAmount < 0) {
      showNotification('error', 'Discount amount cannot be negative');
      return;
    }

    setSaving(true);
    try {
      // Auto-compute financial unit economics
      const grossProfit = (formData.netPrice || 0) - (formData.printCost || 0) - (formData.shippingCost || 0);
      const marginPerBook = Math.round(grossProfit / formData.minQuantity);
      const marginPercentage = formData.price > 0 ? Math.round((grossProfit / formData.price) * 1000) / 10 : 0;
      const perBookPrice = Math.round(formData.price / formData.minQuantity);

      const payload = {
        ...formData,
        perBookPrice,
        grossProfit,
        marginPerBook,
        marginPercentage,
      };

      if (editingItem) {
        const idToUpdate = editingItem.id || editingItem.bundleId;
        await adminApi.updateBundle(idToUpdate, payload);
        showNotification('success', `Updated ${formData.name} successfully.`);
      } else {
        await adminApi.createBundle({
          ...payload,
          bundleId: `bundle-${formData.minQuantity}`,
        });
        showNotification('success', `Created ${formData.name} successfully.`);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to save bundle tier.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (item: BundleTierItem) => {
    try {
      const idToUpdate = item.id || item.bundleId;
      const nextActive = !item.isActive;
      await adminApi.updateBundle(idToUpdate, { isActive: nextActive });
      setBundles(prev => prev.map(b => (b.bundleId === item.bundleId ? { ...b, isActive: nextActive } : b)));
      showNotification('success', `${item.name} is now ${nextActive ? 'active' : 'hidden'}.`);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to update status.');
    }
  };

  const handleDelete = async (idOrBundleId: string) => {
    try {
      await adminApi.deleteBundle(idOrBundleId);
      showNotification('success', 'Bundle tier deleted.');
      setDeleteConfirmId(null);
      loadData();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to delete bundle tier.');
    }
  };

  const handleResetDefaults = async () => {
    setSaving(true);
    try {
      await adminApi.resetBundles();
      showNotification('success', 'Reset all bundle tiers to authoritative 4 options (1, 2, 4, 6 books).');
      setResetConfirmOpen(false);
      loadData();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to reset bundle tiers.');
    } finally {
      setSaving(false);
    }
  };

  const activeCount = bundles.filter(b => b.isActive !== false).length;
  const maxSavings = bundles.reduce((max, b) => (b.discountAmount > max ? b.discountAmount : max), 0);
  const maxProfitTier = bundles.reduce((max, b) => ((b.grossProfit || 0) > (max.grossProfit || 0) ? b : max), bundles[0] || {} as BundleTierItem);
  const avgMargin = bundles.length > 0 
    ? (bundles.reduce((sum, b) => sum + (b.marginPercentage || 0), 0) / bundles.length).toFixed(1)
    : '52.2';

  // Modal computed live preview
  const modalGrossProfit = (formData.netPrice || 0) - (formData.printCost || 0) - (formData.shippingCost || 0);
  const modalMarginPerBook = formData.minQuantity > 0 ? Math.round(modalGrossProfit / formData.minQuantity) : 0;
  const modalMarginPercent = formData.price > 0 ? ((modalGrossProfit / formData.price) * 100).toFixed(1) : '0';
  const modalPerBookPrice = formData.minQuantity > 0 ? Math.round(formData.price / formData.minQuantity) : 0;
  const modalStandardTotal = formData.minQuantity * 1999;
  const modalSavings = Math.max(0, modalStandardTotal - formData.price);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* Toast Notification */}
      {notification && (
        <div
          className={cn(
            "fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-lg shadow-xl border flex items-center gap-3 animate-slide-up text-sm font-medium",
            notification.type === "success"
              ? "bg-emerald-950 text-emerald-100 border-emerald-800"
              : "bg-red-950 text-red-100 border-red-800"
          )}
        >
          {notification.type === "success" ? (
            <CheckCircle2 size={18} className="text-emerald-400" />
          ) : (
            <AlertCircle size={18} className="text-red-400" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header & Main Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cream-300 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-cream-200 text-noir-800 rounded text-xs font-mono font-medium uppercase tracking-wider mb-2">
            <Boxes size={14} className="text-foil-gold" />
            <span>Authoritative Photobook Bundle Pricing</span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl text-noir-950 font-bold">
            Bundle Pricing & Unit Economics
          </h1>
          <p className="text-sm text-noir-600 mt-1 max-w-3xl">
            Manage the 4 dynamic multi-copy photobook bundles (<strong>1 Book Single</strong>, <strong>2 Books Duo</strong>, <strong>4 Books Quartet</strong>, <strong>6 Books Collector</strong>). Selling prices, print costs, shipping fees, and gross margins are stored in MongoDB Atlas and updated dynamically across Storefront, Cart, and Checkout.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setResetConfirmOpen(true)}
            className="px-4 py-2.5 border border-cream-300 hover:border-noir-900 bg-white hover:bg-cream-50 text-noir-700 text-xs font-mono uppercase tracking-wider rounded-sm transition-all flex items-center gap-2"
            title="Reset to authoritative 4 tiers"
          >
            <RotateCcw size={14} />
            <span>Reset 4 Tiers</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-5 py-2.5 bg-noir-950 hover:bg-black text-cream-50 text-xs font-mono uppercase tracking-wider rounded-sm transition-all shadow-md hover:shadow-lg flex items-center gap-2 font-semibold"
          >
            <Plus size={16} />
            <span>Add Bundle Tier</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-cream-300 p-5 rounded-sm shadow-xs">
          <div className="flex justify-between items-center text-noir-500 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Active Tiers</span>
            <Boxes size={16} className="text-foil-gold" />
          </div>
          <div className="font-serif text-3xl font-bold text-noir-950">
            {activeCount} <span className="text-xs font-mono text-noir-400 font-normal">/ {bundles.length} Total</span>
          </div>
          <span className="text-[11px] text-emerald-700 font-medium mt-1 block">
            Stored in MongoDB & Cached in Redis
          </span>
        </div>

        <div className="bg-white border border-cream-300 p-5 rounded-sm shadow-xs">
          <div className="flex justify-between items-center text-noir-500 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Top Profit Tier</span>
            <TrendingUp size={16} className="text-emerald-600" />
          </div>
          <div className="font-serif text-3xl font-bold text-emerald-700">
            ₹{(maxProfitTier.grossProfit || 4403).toLocaleString('en-IN')} <span className="text-xs font-mono text-noir-500 font-normal">Profit</span>
          </div>
          <span className="text-[11px] text-noir-500 font-medium mt-1 block">
            {maxProfitTier.name || '6 Books (Collector)'}
          </span>
        </div>

        <div className="bg-white border border-cream-300 p-5 rounded-sm shadow-xs">
          <div className="flex justify-between items-center text-noir-500 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Average Margin</span>
            <Percent size={16} className="text-blue-600" />
          </div>
          <div className="font-serif text-3xl font-bold text-noir-950">
            {avgMargin}% <span className="text-xs font-mono text-noir-500 font-normal">Gross</span>
          </div>
          <span className="text-[11px] text-noir-500 font-medium mt-1 block">
            Across 4 Authoritative Tiers
          </span>
        </div>

        <div className="bg-white border border-cream-300 p-5 rounded-sm shadow-xs">
          <div className="flex justify-between items-center text-noir-500 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Max Customer Savings</span>
            <IndianRupee size={16} className="text-emerald-600" />
          </div>
          <div className="font-serif text-3xl font-bold text-emerald-700">
            ₹{maxSavings.toLocaleString('en-IN')} <span className="text-xs font-mono text-noir-500 font-normal">OFF</span>
          </div>
          <span className="text-[11px] text-noir-500 font-medium mt-1 block">
            Collector Pack Bundle Discount
          </span>
        </div>
      </div>

      {/* Live Storefront Preview Strip */}
      <div className="bg-cream-100 border border-foil-gold/40 p-6 rounded-sm shadow-luxury-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-foil-gold" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-noir-900">
              Live Customer Storefront Cards Preview
            </span>
          </div>
          <span className="text-[11px] text-noir-500 font-mono">
            Automatically reflects updates in MongoDB to Homepage & Cart
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {bundles.filter(b => b.isActive !== false).map((bundle) => {
            const perBook = bundle.perBookPrice || Math.round(bundle.price / bundle.minQuantity);
            return (
              <div
                key={bundle.bundleId}
                className={cn(
                  "border p-6 rounded-sm relative shadow-xs flex flex-col justify-between transition-all",
                  bundle.minQuantity === 1 ? "bg-noir-950 text-white border-noir-800" : "bg-white border-cream-300 text-noir-950"
                )}
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className={cn("font-serif text-xl font-bold", bundle.minQuantity === 1 ? "text-white" : "text-noir-950")}>
                      {bundle.name}
                    </span>
                    {bundle.badge && (
                      <span className={cn(
                        "text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full font-mono",
                        bundle.minQuantity === 1 
                          ? "bg-noir-800 text-cream-200 border border-noir-700"
                          : "bg-amber-100 text-amber-950 border border-amber-300"
                      )}>
                        {bundle.badge}
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-serif text-3xl font-bold">
                      ₹{bundle.price?.toLocaleString('en-IN')}
                    </span>
                    {bundle.discountAmount > 0 && (
                      <span className="text-xs font-mono text-emerald-500 font-semibold">
                        Save ₹{bundle.discountAmount.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>

                  <div className={cn("text-xs font-mono mb-3", bundle.minQuantity === 1 ? "text-cream-300" : "text-noir-600")}>
                    ₹{perBook.toLocaleString('en-IN')} / book
                  </div>

                  <p className={cn("text-xs leading-relaxed line-clamp-2 mb-4", bundle.minQuantity === 1 ? "text-cream-200/80" : "text-noir-600")}>
                    {bundle.description}
                  </p>
                </div>

                <div className={cn(
                  "pt-3 border-t text-xs font-medium space-y-1.5",
                  bundle.minQuantity === 1 ? "border-noir-800" : "border-cream-200"
                )}>
                  <div className="flex justify-between items-center text-[11px] font-mono">
                    <span className={bundle.minQuantity === 1 ? "text-cream-400" : "text-noir-500"}>Gross Margin:</span>
                    <span className="font-bold text-emerald-500">{bundle.marginPercentage}% (₹{(bundle.grossProfit || 0).toLocaleString('en-IN')})</span>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-600 text-[11px]">
                    <Check size={12} className="stroke-[3]" />
                    <span>Free All-India Express Shipping</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Unit Economics Master Table */}
      <div className="bg-white border border-cream-300 rounded-sm shadow-xs overflow-hidden">
        <div className="p-5 border-b border-cream-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-xl font-bold text-noir-950">
              Bundle Pricing & Unit Economics Master Table
            </h2>
            <p className="text-xs text-noir-500 mt-0.5">
              Strictly 4 Authoritative Tiers: 1 Book (Single), 2 Books (Duo), 4 Books (Quartet), 6 Books (Collector).
            </p>
          </div>
          <span className="text-xs font-mono px-3 py-1 bg-cream-100 rounded text-noir-600">
            Click edit (✎) to update pricing or costs
          </span>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-2 border-noir-950 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-xs font-mono uppercase tracking-wider text-noir-600">Loading bundle unit economics...</p>
          </div>
        ) : bundles.length === 0 ? (
          <div className="py-16 text-center">
            <Boxes size={36} className="text-noir-300 mx-auto mb-3" />
            <p className="text-sm font-serif text-noir-700">No volume bundle tiers found.</p>
            <button
              onClick={handleResetDefaults}
              className="mt-3 px-4 py-2 bg-noir-950 text-cream-50 text-xs font-mono uppercase rounded-sm"
            >
              Restore 4 Authoritative Tiers
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-cream-100/70 border-b border-cream-200 text-[11px] font-mono uppercase tracking-wider text-noir-600">
                  <th className="py-3 px-4">Tier / Books</th>
                  <th className="py-3 px-4">Customer Price</th>
                  <th className="py-3 px-4">Per Book</th>
                  <th className="py-3 px-4">Discount</th>
                  <th className="py-3 px-4">Net Price</th>
                  <th className="py-3 px-4">Print Cost</th>
                  <th className="py-3 px-4">Shipping</th>
                  <th className="py-3 px-4">Profit</th>
                  <th className="py-3 px-4">Margin/Book</th>
                  <th className="py-3 px-4">Margin %</th>
                  <th className="py-3 px-4">Badge</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200 text-sm">
                {bundles.map((bundle) => {
                  const perBook = bundle.perBookPrice || Math.round(bundle.price / bundle.minQuantity);
                  return (
                    <tr key={bundle.bundleId} className="hover:bg-cream-50/50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-semibold text-noir-900">{bundle.name}</div>
                        <div className="text-xs text-noir-400 font-mono">{bundle.bundleId} • {bundle.minQuantity} {bundle.minQuantity === 1 ? 'copy' : 'copies'}</div>
                      </td>

                      <td className="py-4 px-4 font-mono font-bold text-noir-950 text-base">
                        ₹{bundle.price?.toLocaleString('en-IN')}
                      </td>

                      <td className="py-4 px-4 font-mono text-xs text-noir-700">
                        ₹{perBook.toLocaleString('en-IN')}
                      </td>

                      <td className="py-4 px-4">
                        {bundle.discountAmount > 0 ? (
                          <span className="font-mono font-semibold text-emerald-700 text-xs">
                            -₹{bundle.discountAmount.toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span className="text-xs text-noir-400 font-mono">₹0 (Base)</span>
                        )}
                      </td>

                      <td className="py-4 px-4 font-mono text-xs text-noir-700">
                        ₹{(bundle.netPrice || 0).toLocaleString('en-IN')}
                      </td>

                      <td className="py-4 px-4 font-mono text-xs text-red-700">
                        ₹{(bundle.printCost || 0).toLocaleString('en-IN')}
                      </td>

                      <td className="py-4 px-4 font-mono text-xs text-amber-700">
                        ₹{(bundle.shippingCost || 0).toLocaleString('en-IN')}
                      </td>

                      <td className="py-4 px-4 font-mono font-bold text-emerald-800 text-sm">
                        ₹{(bundle.grossProfit || 0).toLocaleString('en-IN')}
                      </td>

                      <td className="py-4 px-4 font-mono text-xs text-emerald-700 font-semibold">
                        ₹{(bundle.marginPerBook || 0).toLocaleString('en-IN')}
                      </td>

                      <td className="py-4 px-4 font-mono font-bold text-noir-900 text-sm">
                        <span className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 text-xs font-semibold">
                          {bundle.marginPercentage}%
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        {bundle.badge ? (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full font-mono bg-amber-100 text-amber-950 border border-amber-300">
                            {bundle.badge}
                          </span>
                        ) : (
                          <span className="text-xs text-noir-400 font-mono">—</span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(bundle)}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium transition-colors",
                            bundle.isActive !== false
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                          )}
                          title="Click to toggle visibility"
                        >
                          {bundle.isActive !== false ? (
                            <>
                              <Eye size={12} />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <EyeOff size={12} />
                              <span>Hidden</span>
                            </>
                          )}
                        </button>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(bundle)}
                            className="p-1.5 text-noir-600 hover:text-noir-950 hover:bg-cream-200 rounded transition-colors"
                            title="Edit bundle tier"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(bundle.id || bundle.bundleId)}
                            className="p-1.5 text-noir-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete bundle tier"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal with Real-Time Unit Economics Calculation */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-sm border border-cream-300 w-full max-w-2xl shadow-2xl overflow-hidden animate-scale-up max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-cream-200 flex justify-between items-center bg-cream-50">
              <div className="flex items-center gap-2">
                <Boxes size={18} className="text-foil-gold" />
                <h3 className="font-serif text-xl font-bold text-noir-950">
                  {editingItem ? `Edit ${editingItem.name}` : "Create New Bundle Tier"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-noir-400 hover:text-noir-900 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5 overflow-y-auto">
              {/* Unit Economics Live Calculator Strip */}
              <div className="bg-cream-100 border border-cream-300 rounded p-4">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-noir-800 uppercase tracking-wider mb-2">
                  <Calculator size={14} className="text-foil-gold" />
                  <span>Real-Time Unit Economics Preview</span>
                </div>
                <div className="grid grid-cols-4 gap-3 text-center">
                  <div className="bg-white p-2.5 rounded border border-cream-200">
                    <span className="text-[10px] uppercase font-mono text-noir-500 block">Per Book Price</span>
                    <span className="font-serif text-base font-bold text-noir-950">₹{modalPerBookPrice.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded border border-cream-200">
                    <span className="text-[10px] uppercase font-mono text-noir-500 block">Gross Profit</span>
                    <span className="font-serif text-base font-bold text-emerald-700">₹{modalGrossProfit.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded border border-cream-200">
                    <span className="text-[10px] uppercase font-mono text-noir-500 block">Margin / Book</span>
                    <span className="font-serif text-base font-bold text-emerald-700">₹{modalMarginPerBook.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded border border-cream-200">
                    <span className="text-[10px] uppercase font-mono text-noir-500 block">Margin %</span>
                    <span className="font-serif text-base font-bold text-noir-950">{modalMarginPercent}%</span>
                  </div>
                </div>
              </div>

              {/* Basic Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono font-semibold text-noir-700 uppercase tracking-wider block mb-1.5">
                    Book Quantity (Copies)*
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={formData.minQuantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10) || 1;
                      setFormData(prev => ({
                        ...prev,
                        minQuantity: val,
                        printCost: val * 515,
                        shippingCost: val === 1 ? 110 : val === 2 ? 150 : val === 4 ? 240 : 330,
                      }));
                    }}
                    className="w-full px-3 py-2 border border-cream-300 rounded-sm font-mono text-sm focus:outline-none focus:border-noir-900"
                  />
                  <span className="text-[10px] text-noir-400 font-mono mt-1 block">
                    e.g. 1, 2, 4, 6 copies
                  </span>
                </div>

                <div>
                  <label className="text-xs font-mono font-semibold text-noir-700 uppercase tracking-wider block mb-1.5">
                    Selling Price (₹)*
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={formData.price}
                    onChange={(e) => {
                      const p = parseFloat(e.target.value) || 0;
                      const standard = formData.minQuantity * 1999;
                      const autoDiscount = Math.max(0, standard - p);
                      setFormData(prev => ({
                        ...prev,
                        price: p,
                        discountAmount: autoDiscount,
                        netPrice: Math.round(p * 0.8694),
                      }));
                    }}
                    className="w-full px-3 py-2 border border-cream-300 rounded-sm font-mono text-sm focus:outline-none focus:border-noir-900 font-bold text-noir-950"
                  />
                  <span className="text-[10px] text-noir-400 font-mono mt-1 block">
                    Customer total: ₹{formData.price?.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Financial Cost Fields */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-mono font-semibold text-noir-700 uppercase tracking-wider block mb-1.5">
                    Net Revenue (₹)*
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.netPrice}
                    onChange={(e) => setFormData({ ...formData, netPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-cream-300 rounded-sm font-mono text-sm focus:outline-none focus:border-noir-900"
                  />
                  <span className="text-[10px] text-noir-400 font-mono mt-1 block">
                    After GST & gateway fees
                  </span>
                </div>

                <div>
                  <label className="text-xs font-mono font-semibold text-noir-700 uppercase tracking-wider block mb-1.5">
                    Print Cost (₹)*
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.printCost}
                    onChange={(e) => setFormData({ ...formData, printCost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-cream-300 rounded-sm font-mono text-sm focus:outline-none focus:border-noir-900 text-red-700"
                  />
                  <span className="text-[10px] text-noir-400 font-mono mt-1 block">
                    Production print expense
                  </span>
                </div>

                <div>
                  <label className="text-xs font-mono font-semibold text-noir-700 uppercase tracking-wider block mb-1.5">
                    Shipping Cost (₹)*
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.shippingCost}
                    onChange={(e) => setFormData({ ...formData, shippingCost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-cream-300 rounded-sm font-mono text-sm focus:outline-none focus:border-noir-900 text-amber-700"
                  />
                  <span className="text-[10px] text-noir-400 font-mono mt-1 block">
                    Logistics freight cost
                  </span>
                </div>
              </div>

              {/* Discount Amount & Name */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono font-semibold text-noir-700 uppercase tracking-wider block mb-1.5">
                    Discount Savings (₹)*
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.discountAmount}
                    onChange={(e) => setFormData({ ...formData, discountAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-cream-300 rounded-sm font-mono text-sm focus:outline-none focus:border-noir-900 text-emerald-700 font-bold"
                  />
                  <span className="text-[10px] text-noir-400 font-mono mt-1 block">
                    Standard is {formData.minQuantity} × ₹1,999 = ₹{modalStandardTotal.toLocaleString('en-IN')} (Saved: ₹{modalSavings.toLocaleString('en-IN')})
                  </span>
                </div>

                <div>
                  <label className="text-xs font-mono font-semibold text-noir-700 uppercase tracking-wider block mb-1.5">
                    Tier Name*
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-cream-300 rounded-sm text-sm focus:outline-none focus:border-noir-900"
                    placeholder="e.g. 2 Books (Duo)"
                  />
                </div>
              </div>

              {/* Badge & Display Order */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono font-semibold text-noir-700 uppercase tracking-wider block mb-1.5">
                    Badge Label (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    className="w-full px-3 py-2 border border-cream-300 rounded-sm text-sm focus:outline-none focus:border-noir-900"
                    placeholder="e.g. Duo, Popular, Collector"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono font-semibold text-noir-700 uppercase tracking-wider block mb-1.5">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 border border-cream-300 rounded-sm font-mono text-sm focus:outline-none focus:border-noir-900"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-mono font-semibold text-noir-700 uppercase tracking-wider block mb-1.5">
                  Marketing Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-cream-300 rounded-sm text-xs focus:outline-none focus:border-noir-900"
                  placeholder="Tell customers why this bundle is beneficial..."
                />
              </div>

              <div className="p-3 bg-cream-100 rounded-sm space-y-2 border border-cream-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.freeShipping}
                    onChange={(e) => setFormData({ ...formData, freeShipping: e.target.checked })}
                    className="w-4 h-4 rounded text-noir-950 focus:ring-0"
                  />
                  <span className="text-xs font-medium text-noir-900">
                    Include 100% Free All-India Express Shipping for this bundle
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded text-noir-950 focus:ring-0"
                  />
                  <span className="text-xs font-medium text-noir-900">
                    Publish immediately (Show on Storefront, Cart & Checkout)
                  </span>
                </label>
              </div>

              <div className="pt-4 border-t border-cream-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-cream-300 text-noir-700 text-xs font-mono uppercase rounded-sm hover:bg-cream-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-noir-950 text-cream-50 text-xs font-mono uppercase rounded-sm hover:bg-black transition-colors font-semibold flex items-center gap-2"
                >
                  {saving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>{editingItem ? "Update Bundle Tier" : "Create Bundle Tier"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-sm border border-cream-300 w-full max-w-md p-6 shadow-2xl animate-scale-up">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <AlertCircle size={22} />
              <h3 className="font-serif text-lg font-bold text-noir-950">Delete Bundle Tier?</h3>
            </div>
            <p className="text-xs text-noir-600 leading-relaxed mb-6">
              Are you sure you want to remove this volume tier? Customers ordering this quantity will no longer automatically receive this bundle discount.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 border border-cream-300 text-noir-700 text-xs font-mono uppercase rounded-sm hover:bg-cream-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-mono uppercase rounded-sm font-semibold"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Defaults Confirmation Modal */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-sm border border-cream-300 w-full max-w-md p-6 shadow-2xl animate-scale-up">
            <div className="flex items-center gap-3 text-amber-600 mb-3">
              <RotateCcw size={22} />
              <h3 className="font-serif text-lg font-bold text-noir-950">Restore 4 Authoritative Tiers?</h3>
            </div>
            <div className="text-xs text-noir-600 leading-relaxed mb-6 space-y-2">
              <p>This will restore the 4 authoritative photobook bundle tiers into MongoDB Atlas:</p>
              <div className="bg-cream-50 p-3 rounded border border-cream-200 font-mono text-[11px] space-y-1">
                <div>• <strong>1 Book (Single)</strong>: ₹1,999 | 55.7% Margin</div>
                <div>• <strong>2 Books (Duo)</strong>: ₹3,499 | Save ₹499 | 53.2% Margin</div>
                <div>• <strong>4 Books (Quartet)</strong>: ₹6,399 | Save ₹1,597 | 51.0% Margin</div>
                <div>• <strong>6 Books (Collector)</strong>: ₹8,999 | Save ₹2,995 | 48.9% Margin</div>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setResetConfirmOpen(false)}
                className="px-4 py-2 border border-cream-300 text-noir-700 text-xs font-mono uppercase rounded-sm hover:bg-cream-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="px-4 py-2 bg-noir-950 hover:bg-black text-cream-50 text-xs font-mono uppercase rounded-sm font-semibold"
              >
                Restore 4 Tiers
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
