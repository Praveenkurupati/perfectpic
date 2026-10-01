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
  Gift,
  TrendingDown,
  Layers
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { cn } from "@/lib/utils";

interface BundleTierItem {
  id?: string;
  bundleId: string;
  minQuantity: number;
  name: string;
  discountAmount: number;
  freeShipping: boolean;
  badge?: string;
  description: string;
  isActive?: boolean;
  displayOrder: number;
}

export default function BundlesManagementPage() {
  const [bundles, setBundles] = useState<BundleTierItem[]>([]);
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
    minQuantity: 3,
    name: "3 Books Pack",
    discountAmount: 300,
    freeShipping: true,
    badge: "Popular",
    description: "Save ₹300 off + Free All-India Shipping. Perfect for gifting parents and in-laws.",
    isActive: true,
    displayOrder: 1,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAllBundles();
      if (res && res.bundles) {
        setBundles(res.bundles);
      }
    } catch (err: any) {
      console.error("Failed to load bundle tiers:", err);
      // Fallback
      setBundles([
        {
          bundleId: 'bundle-3',
          minQuantity: 3,
          name: '3 Books Pack',
          discountAmount: 300,
          freeShipping: true,
          badge: 'Popular',
          description: 'Save ₹300 off + Free All-India Shipping. Perfect for gifting parents and in-laws.',
          isActive: true,
          displayOrder: 1,
        },
        {
          bundleId: 'bundle-6',
          minQuantity: 6,
          name: '6 Books Pack',
          discountAmount: 1800,
          freeShipping: true,
          badge: 'Extended Family',
          description: 'Save ₹1,800 off + Free All-India Shipping. Ideal for vacations, trips, and family reunions.',
          isActive: true,
          displayOrder: 2,
        },
        {
          bundleId: 'bundle-12',
          minQuantity: 12,
          name: '12 Books Master Pack',
          discountAmount: 4500,
          freeShipping: true,
          badge: "Collector's Master",
          description: 'Save ₹4,500 off + Free All-India Shipping. Comprehensive heirloom edition for milestone weddings and annual chronicles.',
          isActive: true,
          displayOrder: 3,
        },
      ]);
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
      minQuantity: 3,
      name: "3 Books Pack",
      discountAmount: 300,
      freeShipping: true,
      badge: "Popular",
      description: "Save ₹300 off + Free All-India Shipping.",
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
      discountAmount: item.discountAmount,
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
    if (formData.minQuantity < 2) {
      showNotification('error', 'Minimum book quantity must be at least 2');
      return;
    }
    if (formData.discountAmount < 0) {
      showNotification('error', 'Discount amount cannot be negative');
      return;
    }

    setSaving(true);
    try {
      if (editingItem) {
        const idToUpdate = editingItem.id || editingItem.bundleId;
        await adminApi.updateBundle(idToUpdate, formData);
        showNotification('success', `Updated ${formData.name} successfully.`);
      } else {
        await adminApi.createBundle({
          ...formData,
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
      showNotification('success', 'Reset all bundle tiers to factory defaults (3, 6, 12 books).');
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
  const minThreshold = bundles.reduce((min, b) => (b.minQuantity < min ? b.minQuantity : min), 999);

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
            <span>Multi-Book Pricing & Promotions</span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl text-noir-950 font-bold">
            Bundles & Volume Discounts
          </h1>
          <p className="text-sm text-noir-600 mt-1 max-w-2xl">
            Configure automated multi-copy photobook bundles (e.g. <strong>3 Books Save ₹300</strong>, <strong>6 Books Save ₹1,800</strong>, <strong>12 Books Save ₹4,500</strong>). These discounts automatically trigger in customer carts and checkout.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setResetConfirmOpen(true)}
            className="px-4 py-2.5 border border-cream-300 hover:border-noir-900 bg-white hover:bg-cream-50 text-noir-700 text-xs font-mono uppercase tracking-wider rounded-sm transition-all flex items-center gap-2"
            title="Reset to 3, 6, and 12 books default discounts"
          >
            <RotateCcw size={14} />
            <span>Reset Defaults</span>
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
            Live on Storefront & Cart
          </span>
        </div>

        <div className="bg-white border border-cream-300 p-5 rounded-sm shadow-xs">
          <div className="flex justify-between items-center text-noir-500 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Max Savings Tier</span>
            <TrendingDown size={16} className="text-emerald-600" />
          </div>
          <div className="font-serif text-3xl font-bold text-emerald-700">
            ₹{maxSavings.toLocaleString('en-IN')} <span className="text-xs font-mono text-noir-500 font-normal">OFF</span>
          </div>
          <span className="text-[11px] text-noir-500 font-medium mt-1 block">
            For 12 Books Master Pack
          </span>
        </div>

        <div className="bg-white border border-cream-300 p-5 rounded-sm shadow-xs">
          <div className="flex justify-between items-center text-noir-500 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Entry Threshold</span>
            <Layers size={16} className="text-blue-600" />
          </div>
          <div className="font-serif text-3xl font-bold text-noir-950">
            {minThreshold === 999 ? 3 : minThreshold} <span className="text-xs font-mono text-noir-500 font-normal">Books</span>
          </div>
          <span className="text-[11px] text-noir-500 font-medium mt-1 block">
            First volume savings barrier
          </span>
        </div>

        <div className="bg-white border border-cream-300 p-5 rounded-sm shadow-xs">
          <div className="flex justify-between items-center text-noir-500 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Shipping Benefit</span>
            <Truck size={16} className="text-emerald-600" />
          </div>
          <div className="font-serif text-3xl font-bold text-emerald-700">
            FREE
          </div>
          <span className="text-[11px] text-noir-500 font-medium mt-1 block">
            All-India Express Delivery
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
            Directly reflected on Homepage, Cart & Checkout
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {bundles.filter(b => b.isActive !== false).map((bundle) => (
            <div
              key={bundle.bundleId}
              className="bg-white border border-cream-300 p-6 rounded-sm relative shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="font-serif text-2xl font-bold text-noir-950">
                    {bundle.minQuantity} Books
                  </span>
                  {bundle.badge && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full font-mono bg-amber-100 text-amber-950 border border-amber-300">
                      {bundle.badge}
                    </span>
                  )}
                </div>

                <div className="text-foil-gold font-semibold text-base mb-2">
                  Save ₹{bundle.discountAmount.toLocaleString('en-IN')} off
                </div>

                <p className="text-xs text-noir-600 mb-4 leading-relaxed line-clamp-2">
                  {bundle.description}
                </p>
              </div>

              <div className="pt-3 border-t border-cream-200 flex items-center justify-between text-xs text-emerald-700 font-medium">
                <span className="flex items-center gap-1">
                  <Check size={14} className="text-emerald-600 stroke-[3]" />
                  <span>Free Shipping Included</span>
                </span>
                <span className="font-mono text-noir-400 text-[11px]">
                  ~₹{Math.round(bundle.discountAmount / bundle.minQuantity)}/book
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Management Table */}
      <div className="bg-white border border-cream-300 rounded-sm shadow-xs overflow-hidden">
        <div className="p-5 border-b border-cream-200 flex justify-between items-center">
          <h2 className="font-serif text-xl font-bold text-noir-950">
            Active Bundle Configurations
          </h2>
          <span className="text-xs font-mono text-noir-500">
            Sorted by minimum book volume
          </span>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-2 border-noir-950 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-xs font-mono uppercase tracking-wider text-noir-600">Loading bundle tiers...</p>
          </div>
        ) : bundles.length === 0 ? (
          <div className="py-16 text-center">
            <Boxes size={36} className="text-noir-300 mx-auto mb-3" />
            <p className="text-sm font-serif text-noir-700">No volume bundle tiers found.</p>
            <button
              onClick={handleResetDefaults}
              className="mt-3 px-4 py-2 bg-noir-950 text-cream-50 text-xs font-mono uppercase rounded-sm"
            >
              Restore Standard Tiers
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-cream-100/70 border-b border-cream-200 text-[11px] font-mono uppercase tracking-wider text-noir-600">
                  <th className="py-3 px-5">Books Required</th>
                  <th className="py-3 px-5">Tier Title</th>
                  <th className="py-3 px-5">Discount Savings</th>
                  <th className="py-3 px-5">Per-Book Benefit</th>
                  <th className="py-3 px-5">Badge Label</th>
                  <th className="py-3 px-5">Free Shipping</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200 text-sm">
                {bundles.map((bundle) => {
                  const perBook = Math.round(bundle.discountAmount / bundle.minQuantity);
                  return (
                    <tr key={bundle.bundleId} className="hover:bg-cream-50/50 transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2">
                          <span className="font-serif text-2xl font-bold text-noir-950">
                            {bundle.minQuantity}
                          </span>
                          <span className="text-xs uppercase text-noir-500 font-mono">books</span>
                        </div>
                      </td>

                      <td className="py-4 px-5">
                        <span className="font-semibold text-noir-900 block">{bundle.name}</span>
                        <span className="text-xs text-noir-500 font-mono">{bundle.bundleId}</span>
                      </td>

                      <td className="py-4 px-5">
                        <span className="font-mono font-bold text-emerald-700 text-base">
                          Save ₹{bundle.discountAmount.toLocaleString('en-IN')}
                        </span>
                      </td>

                      <td className="py-4 px-5 font-mono text-xs text-noir-600">
                        ₹{perBook.toLocaleString('en-IN')} off / copy
                      </td>

                      <td className="py-4 px-5">
                        {bundle.badge ? (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full font-mono bg-amber-100 text-amber-950 border border-amber-300">
                            {bundle.badge}
                          </span>
                        ) : (
                          <span className="text-xs text-noir-400 font-mono">—</span>
                        )}
                      </td>

                      <td className="py-4 px-5">
                        {bundle.freeShipping !== false ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-semibold font-mono">
                            <Check size={14} className="stroke-[3]" />
                            <span>FREE</span>
                          </span>
                        ) : (
                          <span className="text-xs text-noir-400 font-mono">Standard</span>
                        )}
                      </td>

                      <td className="py-4 px-5">
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

                      <td className="py-4 px-5 text-right">
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

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-sm border border-cream-300 w-full max-w-lg shadow-2xl overflow-hidden animate-scale-up">
            <div className="p-6 border-b border-cream-200 flex justify-between items-center bg-cream-50">
              <div className="flex items-center gap-2">
                <Boxes size={18} className="text-foil-gold" />
                <h3 className="font-serif text-xl font-bold text-noir-950">
                  {editingItem ? "Edit Bundle Tier" : "Create New Bundle Tier"}
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

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono font-semibold text-noir-700 uppercase tracking-wider block mb-1.5">
                    Minimum Quantity (Books)*
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="100"
                    required
                    value={formData.minQuantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10) || 2;
                      setFormData(prev => ({
                        ...prev,
                        minQuantity: val,
                        name: prev.name.includes("Books") ? `${val} Books Pack` : prev.name,
                      }));
                    }}
                    className="w-full px-3 py-2 border border-cream-300 rounded-sm font-mono text-sm focus:outline-none focus:border-noir-900"
                  />
                  <span className="text-[10px] text-noir-400 font-mono mt-1 block">
                    e.g. 3, 6, 12 copies
                  </span>
                </div>

                <div>
                  <label className="text-xs font-mono font-semibold text-noir-700 uppercase tracking-wider block mb-1.5">
                    Discount Amount (₹)*
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    required
                    value={formData.discountAmount}
                    onChange={(e) => setFormData({ ...formData, discountAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-cream-300 rounded-sm font-mono text-sm focus:outline-none focus:border-noir-900 font-bold text-emerald-700"
                  />
                  <span className="text-[10px] text-noir-400 font-mono mt-1 block">
                    e.g. ₹300, ₹1,800, ₹4,500
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-mono font-semibold text-noir-700 uppercase tracking-wider block mb-1.5">
                  Tier Title / Pack Name*
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-cream-300 rounded-sm text-sm focus:outline-none focus:border-noir-900"
                  placeholder="e.g. 3 Books Pack"
                />
              </div>

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
                    placeholder="e.g. Popular, Best Value"
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
                    Include 100% Free Shipping for this bundle
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
                    Publish immediately (Show on Storefront & Cart)
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
                  <span>{editingItem ? "Update Bundle" : "Create Bundle"}</span>
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
              <h3 className="font-serif text-lg font-bold text-noir-950">Restore Factory Tiers?</h3>
            </div>
            <p className="text-xs text-noir-600 leading-relaxed mb-6">
              This will reset the volume bundles back to the verified standard configuration:
              <br /><br />
              • <strong>3 Books</strong>: Save ₹300 off + Free Shipping<br />
              • <strong>6 Books</strong>: Save ₹1,800 off + Free Shipping<br />
              • <strong>12 Books</strong>: Save ₹4,500 off + Free Shipping
            </p>
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
                Reset to Defaults
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
