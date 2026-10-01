"use client";

import { useState, useEffect } from "react";
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  Layers, 
  Star, 
  RotateCcw, 
  Sparkles, 
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  HelpCircle,
  ArrowUpDown
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { cn } from "@/lib/utils";

interface PageOptionItem {
  id?: string;
  pageOptionId: string;
  count: number;
  name: string;
  photos: number;
  badge?: string;
  priceAdjustment: number;
  description: string;
  isDefault?: boolean;
  default?: boolean;
  isActive?: boolean;
  displayOrder: number;
}

export default function PageOptionsManagementPage() {
  const [pageOptions, setPageOptions] = useState<PageOptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PageOptionItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    count: 32,
    name: "32 Pages",
    photos: 32,
    badge: "Popular",
    priceAdjustment: 0,
    description: "32 photo slots (1 photo per page). Our most popular standard edition.",
    isDefault: false,
    isActive: true,
    displayOrder: 1,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAllPageOptions();
      if (res && res.pageOptions) {
        setPageOptions(res.pageOptions);
      }
    } catch (err: any) {
      console.error("Failed to load page options:", err);
      // Fallback
      setPageOptions([
        { pageOptionId: 'pages-32', count: 32, name: '32 Pages', photos: 32, badge: 'Popular', priceAdjustment: 0, isDefault: true, isActive: true, displayOrder: 1, description: '32 photo slots (1 photo per page). Our most popular standard edition.' },
        { pageOptionId: 'pages-50', count: 50, name: '50 Pages', photos: 50, badge: 'Extended', priceAdjustment: 600, isDefault: false, isActive: true, displayOrder: 2, description: '50 photo slots (1 photo per page). Extended journey with generous story room.' },
        { pageOptionId: 'pages-60', count: 60, name: '60 Pages', photos: 60, badge: "Collector's", priceAdjustment: 1000, isDefault: false, isActive: true, displayOrder: 3, description: '60 photo slots (1 photo per page). Curated heirloom album.' },
        { pageOptionId: 'pages-72', count: 72, name: '72 Pages', photos: 72, badge: "Collector's", priceAdjustment: 1400, isDefault: false, isActive: true, displayOrder: 4, description: '72 photo slots (1 photo per page). Deluxe milestone celebration chronicle.' },
        { pageOptionId: 'pages-12', count: 12, name: '12 Pages', photos: 12, badge: '', priceAdjustment: -700, isDefault: false, isActive: true, displayOrder: 5, description: '12 photo slots (1 photo per page). Compact pocket keepsake.' },
        { pageOptionId: 'pages-24', count: 24, name: '24 Pages', photos: 24, badge: '', priceAdjustment: -300, isDefault: false, isActive: true, displayOrder: 6, description: '24 photo slots (1 photo per page). Weekend getaway edition.' },
        { pageOptionId: 'pages-120', count: 120, name: '120 Pages', photos: 120, badge: "Collector's Master", priceAdjustment: 2800, isDefault: false, isActive: true, displayOrder: 7, description: '120 photo slots (1 photo per page). Comprehensive annual encyclopedia.' },
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
    const nextOrder = pageOptions.length + 1;
    setFormData({
      count: 40,
      name: "40 Pages",
      photos: 40,
      badge: "",
      priceAdjustment: 400,
      description: "40 photo slots (1 photo per page). Archival fine-art edition.",
      isDefault: false,
      isActive: true,
      displayOrder: nextOrder,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: PageOptionItem) => {
    setEditingItem(item);
    setFormData({
      count: item.count,
      name: item.name || `${item.count} Pages`,
      photos: item.photos || item.count,
      badge: item.badge || "",
      priceAdjustment: item.priceAdjustment || 0,
      description: item.description || "",
      isDefault: Boolean(item.isDefault || item.default),
      isActive: item.isActive !== false,
      displayOrder: item.displayOrder || 1,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        count: Number(formData.count),
        name: formData.name || `${formData.count} Pages`,
        photos: Number(formData.photos) || Number(formData.count),
        badge: formData.badge.trim(),
        priceAdjustment: Number(formData.priceAdjustment) || 0,
        description: formData.description,
        isDefault: Boolean(formData.isDefault),
        isActive: Boolean(formData.isActive),
        displayOrder: Number(formData.displayOrder) || 1,
      };

      if (editingItem) {
        const idToUpdate = editingItem.pageOptionId || editingItem.id || String(editingItem.count);
        await adminApi.updatePageOption(idToUpdate, payload);
        showNotification('success', `Page option '${payload.name}' updated successfully.`);
      } else {
        await adminApi.createPageOption(payload);
        showNotification('success', `New page option '${payload.name}' created successfully.`);
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to save page option.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (item: PageOptionItem) => {
    const idToUpdate = item.pageOptionId || item.id || String(item.count);
    const newStatus = !(item.isActive !== false);

    try {
      await adminApi.updatePageOption(idToUpdate, { isActive: newStatus });
      setPageOptions(prev =>
        prev.map(opt =>
          (opt.pageOptionId === idToUpdate || opt.id === idToUpdate || opt.count === item.count)
            ? { ...opt, isActive: newStatus }
            : opt
        )
      );
      showNotification('success', `${item.name} is now ${newStatus ? 'Active' : 'Inactive'} on storefront.`);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to toggle status.');
    }
  };

  const handleSetDefault = async (item: PageOptionItem) => {
    const idToUpdate = item.pageOptionId || item.id || String(item.count);

    try {
      await adminApi.updatePageOption(idToUpdate, { isDefault: true, isActive: true });
      await loadData();
      showNotification('success', `${item.name} set as default storefront selection.`);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to set default.');
    }
  };

  const handleDelete = async (identifier: string) => {
    try {
      await adminApi.deletePageOption(identifier);
      showNotification('success', 'Page option deleted successfully.');
      setDeleteConfirmId(null);
      await loadData();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to delete page option.');
    }
  };

  const handleResetDefaults = async () => {
    try {
      await adminApi.resetPageOptions();
      showNotification('success', 'Page options reset to standard factory defaults.');
      setResetConfirmOpen(false);
      await loadData();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to reset options.');
    }
  };

  const activeCount = pageOptions.filter(p => p.isActive !== false).length;
  const defaultOption = pageOptions.find(p => p.isDefault || p.default);

  return (
    <div className="max-w-6xl mx-auto space-y-6 font-sans">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-sm bg-noir-950 text-cream-50 flex items-center justify-center shadow-xs">
              <Layers size={17} className="text-foil-gold" />
            </div>
            <h1 className="text-2xl font-serif font-bold text-noir-950">Page Options & Capacity Management</h1>
          </div>
          <p className="text-xs text-noir-600 mt-1 max-w-2xl">
            Configure book page capacity, 1 photo per page rules, capacity tiers, badges (Popular, Extended, Collector&apos;s), and dynamic price adjustments.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setResetConfirmOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-cream-300 bg-white hover:bg-cream-100 text-noir-700 rounded-sm text-xs font-semibold transition-colors"
          >
            <RotateCcw size={13} className="text-noir-500" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-noir-950 hover:bg-noir-900 text-cream-50 rounded-sm text-xs font-bold uppercase tracking-wider shadow-xs transition-all"
          >
            <Plus size={14} className="text-foil-gold" />
            <span>Add Page Option</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className={cn(
          "p-3.5 rounded-sm text-xs flex items-center justify-between border animate-fade-in",
          notification.type === 'success' 
            ? "bg-emerald-50 text-emerald-900 border-emerald-200" 
            : "bg-red-50 text-red-900 border-red-200"
        )}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle size={16} className="text-red-600 shrink-0" />
            )}
            <span className="font-medium">{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-noir-400 hover:text-noir-700">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-sm border border-cream-200 shadow-luxury-xs">
          <span className="text-[10px] uppercase font-bold tracking-widest text-noir-400 font-mono">Total Tiers</span>
          <p className="text-2xl font-serif font-bold text-noir-950 mt-1">{pageOptions.length} Tiers</p>
          <p className="text-[11px] text-noir-500 mt-0.5">Configured in system catalog</p>
        </div>

        <div className="bg-white p-4 rounded-sm border border-cream-200 shadow-luxury-xs">
          <span className="text-[10px] uppercase font-bold tracking-widest text-noir-400 font-mono">Storefront Active</span>
          <p className="text-2xl font-serif font-bold text-emerald-700 mt-1">{activeCount} Visible</p>
          <p className="text-[11px] text-noir-500 mt-0.5">Offered to book buyers</p>
        </div>

        <div className="bg-white p-4 rounded-sm border border-cream-200 shadow-luxury-xs">
          <span className="text-[10px] uppercase font-bold tracking-widest text-noir-400 font-mono">Default Selection</span>
          <p className="text-2xl font-serif font-bold text-noir-950 mt-1">
            {defaultOption ? `${defaultOption.count} Pages` : 'None'}
          </p>
          <p className="text-[11px] text-foil-gold font-medium mt-0.5">
            {defaultOption?.badge ? `Badge: ${defaultOption.badge}` : 'Standard Edition'}
          </p>
        </div>

        <div className="bg-white p-4 rounded-sm border border-cream-200 shadow-luxury-xs">
          <span className="text-[10px] uppercase font-bold tracking-widest text-noir-400 font-mono">Archival Layout Rule</span>
          <p className="text-2xl font-serif font-bold text-noir-950 mt-1">1 Photo / Page</p>
          <p className="text-[11px] text-noir-500 mt-0.5">Strict 1:1 spread capacity</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-cream-100 border border-cream-300 p-4 rounded-sm flex items-start gap-3 text-xs text-noir-700">
        <HelpCircle size={18} className="text-foil-gold shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-noir-950">Storefront 1-Photo-Per-Page Integration: </span>
          Changes made here instantly synchronize with the storefront book configuration flow (`/configure`) and editor photo trays. Customers will see your custom badges (such as <strong>Popular</strong>, <strong>Extended</strong>, and <strong>Collector&apos;s</strong>) and exact photo capacity limits.
        </div>
      </div>

      {/* Page Options Table */}
      <div className="bg-white rounded-sm border border-cream-200 shadow-luxury-sm overflow-hidden">
        <div className="p-4 border-b border-cream-200 bg-cream-50/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-noir-950">All Page Tiers</h2>
            <span className="text-xs bg-cream-200 text-noir-700 px-2 py-0.5 rounded-full font-mono font-medium">
              {pageOptions.length}
            </span>
          </div>
          <span className="text-[11px] text-noir-500">Sorted by Display Priority</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-cream-100/50 border-b border-cream-200 text-[10px] uppercase tracking-wider font-semibold text-noir-500">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Pages & Capacity</th>
                <th className="py-3 px-4">Badge</th>
                <th className="py-3 px-4">Price Adjustment</th>
                <th className="py-3 px-4">Default</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-noir-500">
                    <div className="inline-block w-5 h-5 border-2 border-noir-950 border-t-transparent rounded-full animate-spin mb-2" />
                    <p>Loading page options...</p>
                  </td>
                </tr>
              ) : pageOptions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-noir-500">
                    No page options found. Click &quot;Reset Defaults&quot; to restore standard tiers.
                  </td>
                </tr>
              ) : (
                pageOptions.map((opt, idx) => {
                  const isDef = opt.isDefault || opt.default;
                  const isActive = opt.isActive !== false;

                  return (
                    <tr 
                      key={opt.pageOptionId || opt.id || opt.count}
                      className={cn(
                        "hover:bg-cream-50/50 transition-colors",
                        !isActive && "opacity-60 bg-cream-50/30"
                      )}
                    >
                      {/* Priority Order */}
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-noir-400">
                        {opt.displayOrder || idx + 1}
                      </td>

                      {/* Pages & Photos */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-baseline gap-2">
                          <span className="font-serif text-base font-bold text-noir-950">
                            {opt.count} Pages
                          </span>
                          <span className="text-[11px] text-foil-gold font-mono font-semibold">
                            ({opt.photos || opt.count} Photos • 1/page)
                          </span>
                        </div>
                        <span className="text-[10px] text-noir-400 font-mono">
                          ID: {opt.pageOptionId || `pages-${opt.count}`}
                        </span>
                      </td>

                      {/* Badge */}
                      <td className="py-3.5 px-4">
                        {opt.badge ? (
                          <span className={cn(
                            "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono shadow-2xs",
                            opt.badge.toLowerCase().includes('popular') && "bg-amber-100 text-amber-950 border border-amber-300",
                            opt.badge.toLowerCase().includes('extended') && "bg-blue-100 text-blue-950 border border-blue-300",
                            opt.badge.toLowerCase().includes('collector') && "bg-purple-100 text-purple-950 border border-purple-300",
                            !opt.badge.toLowerCase().includes('popular') && 
                            !opt.badge.toLowerCase().includes('extended') && 
                            !opt.badge.toLowerCase().includes('collector') && "bg-cream-200 text-noir-800 border border-cream-300"
                          )}>
                            {opt.badge}
                          </span>
                        ) : (
                          <span className="text-noir-300 text-[11px] italic">—</span>
                        )}
                      </td>

                      {/* Price Adjustment */}
                      <td className="py-3.5 px-4 font-mono font-bold">
                        {opt.priceAdjustment === 0 ? (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                            Standard (₹0)
                          </span>
                        ) : opt.priceAdjustment > 0 ? (
                          <span className="text-noir-900 bg-cream-100 px-2 py-0.5 rounded text-[11px]">
                            +₹{opt.priceAdjustment.toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span className="text-noir-600 bg-cream-100 px-2 py-0.5 rounded text-[11px]">
                            -₹{Math.abs(opt.priceAdjustment).toLocaleString('en-IN')}
                          </span>
                        )}
                      </td>

                      {/* Default Selection */}
                      <td className="py-3.5 px-4">
                        {isDef ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-foil-gold/20 text-noir-950 border border-foil-gold/40 rounded-full font-mono">
                            <Star size={10} className="fill-foil-gold text-foil-gold" /> Default
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSetDefault(opt)}
                            className="text-[11px] text-noir-400 hover:text-noir-900 underline font-medium"
                          >
                            Set Default
                          </button>
                        )}
                      </td>

                      {/* Description */}
                      <td className="py-3.5 px-4 max-w-xs text-noir-600 truncate text-[11px]">
                        {opt.description}
                      </td>

                      {/* Status Toggle */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(opt)}
                          className={cn(
                            "px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-1",
                            isActive 
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100" 
                              : "bg-noir-100 text-noir-500 border border-noir-200 hover:bg-noir-200"
                          )}
                        >
                          {isActive ? <Eye size={11} /> : <EyeOff size={11} />}
                          <span>{isActive ? 'Active' : 'Hidden'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(opt)}
                            className="p-1.5 text-noir-600 hover:text-noir-950 hover:bg-cream-200 rounded-sm transition-colors"
                            title="Edit Page Option"
                          >
                            <Edit3 size={14} />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(opt.pageOptionId || opt.id || String(opt.count))}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-sm transition-colors"
                            title="Delete Page Option"
                          >
                            <Trash2 size={14} />
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

      {/* Edit / Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-md w-full max-w-xl shadow-2xl border border-cream-300 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-cream-200 bg-cream-50/50">
              <div className="flex items-center gap-2">
                <Layers size={18} className="text-foil-gold" />
                <h3 className="font-serif text-lg font-bold text-noir-950">
                  {editingItem ? `Edit ${editingItem.name}` : 'Add New Page Option'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-noir-400 hover:text-noir-900 p-1 rounded-full hover:bg-cream-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-noir-800 uppercase tracking-wider mb-1">
                    Page Count *
                  </label>
                  <input
                    type="number"
                    min={4}
                    max={200}
                    required
                    value={formData.count}
                    onChange={(e) => {
                      const countVal = parseInt(e.target.value, 10) || 0;
                      setFormData(prev => ({
                        ...prev,
                        count: countVal,
                        name: `${countVal} Pages`,
                        photos: countVal // 1 photo per page rule
                      }));
                    }}
                    className="w-full px-3 py-2 text-sm border border-cream-300 rounded-sm bg-cream-50/30 focus:border-noir-950 focus:outline-none"
                    placeholder="e.g. 50"
                  />
                  <p className="text-[10px] text-noir-400 mt-0.5">Physical page count</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-noir-800 uppercase tracking-wider mb-1">
                    Photos Capacity (1 / Page) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    required
                    value={formData.photos}
                    onChange={(e) => setFormData(prev => ({ ...prev, photos: parseInt(e.target.value, 10) || 0 }))}
                    className="w-full px-3 py-2 text-sm border border-cream-300 rounded-sm bg-cream-50/30 focus:border-noir-950 focus:outline-none"
                    placeholder="e.g. 50"
                  />
                  <p className="text-[10px] text-foil-gold mt-0.5">Standard: 1 photo per page</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-noir-800 uppercase tracking-wider mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-cream-300 rounded-sm bg-cream-50/30 focus:border-noir-950 focus:outline-none"
                    placeholder="e.g. 50 Pages"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-noir-800 uppercase tracking-wider mb-1">
                    Badge Tag (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.badge}
                    onChange={(e) => setFormData(prev => ({ ...prev, badge: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-cream-300 rounded-sm bg-cream-50/30 focus:border-noir-950 focus:outline-none"
                    placeholder="Popular, Extended, Collector's"
                  />
                  <div className="flex gap-1.5 mt-1.5">
                    {['Popular', 'Extended', "Collector's"].map(b => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, badge: b }))}
                        className="text-[10px] px-2 py-0.5 bg-cream-100 hover:bg-cream-200 border border-cream-300 rounded font-mono text-noir-700"
                      >
                        +{b}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-noir-800 uppercase tracking-wider mb-1">
                    Price Adjustment (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.priceAdjustment}
                    onChange={(e) => setFormData(prev => ({ ...prev, priceAdjustment: parseInt(e.target.value, 10) || 0 }))}
                    className="w-full px-3 py-2 text-sm border border-cream-300 rounded-sm bg-cream-50/30 focus:border-noir-950 focus:outline-none font-mono"
                    placeholder="0 for base, +600, -300"
                  />
                  <p className="text-[10px] text-noir-400 mt-0.5">0 = included in base book price</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-noir-800 uppercase tracking-wider mb-1">
                    Display Priority Order
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={formData.displayOrder}
                    onChange={(e) => setFormData(prev => ({ ...prev, displayOrder: parseInt(e.target.value, 10) || 1 }))}
                    className="w-full px-3 py-2 text-sm border border-cream-300 rounded-sm bg-cream-50/30 focus:border-noir-950 focus:outline-none font-mono"
                  />
                  <p className="text-[10px] text-noir-400 mt-0.5">Lower number appears first</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-noir-800 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border border-cream-300 rounded-sm bg-cream-50/30 focus:border-noir-950 focus:outline-none leading-relaxed"
                  placeholder="e.g. 50 photo slots (1 photo per page). Extended journey with generous story room."
                />
              </div>

              <div className="flex items-center gap-6 pt-2 border-t border-cream-200">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-noir-900">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
                    className="w-4 h-4 rounded text-noir-950 focus:ring-0"
                  />
                  <span>Set as Default Selection</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-noir-900">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="w-4 h-4 rounded text-noir-950 focus:ring-0"
                  />
                  <span>Visible on Storefront</span>
                </label>
              </div>

              {/* Preview Card */}
              <div className="mt-4 p-4 bg-cream-50 border border-cream-300 rounded-sm">
                <span className="text-[10px] font-bold uppercase tracking-wider text-noir-400 font-mono block mb-2">
                  Storefront Card Preview
                </span>
                <div className="p-4 bg-white border border-noir-950 rounded-sm shadow-sm flex flex-col justify-between max-w-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-serif text-2xl font-bold text-noir-950">{formData.count}</span>
                      <span className="text-xs uppercase tracking-wider text-noir-500 font-mono">Pages</span>
                    </div>
                    {formData.badge && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-mono">
                        {formData.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-noir-900">
                    {formData.photos || formData.count} Photos / {formData.count} Pages (1 / page)
                  </p>
                  <p className="text-[11px] text-noir-600 mt-1 line-clamp-2">{formData.description}</p>
                  <div className="mt-3 pt-2 border-t border-cream-200 flex justify-between items-baseline text-xs font-mono font-bold">
                    <span className="text-noir-500">Adjustment:</span>
                    <span className="text-noir-950">
                      {formData.priceAdjustment === 0 
                        ? 'Standard (Included)' 
                        : formData.priceAdjustment > 0 
                        ? `+₹${formData.priceAdjustment.toLocaleString('en-IN')}` 
                        : `-₹${Math.abs(formData.priceAdjustment).toLocaleString('en-IN')}`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-cream-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-cream-300 rounded-sm text-xs font-semibold text-noir-700 hover:bg-cream-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-noir-950 hover:bg-noir-900 text-cream-50 rounded-sm text-xs font-bold uppercase tracking-wider disabled:opacity-50 flex items-center gap-2 shadow-xs"
                >
                  {saving && <div className="w-3.5 h-3.5 border-2 border-cream-50 border-t-transparent rounded-full animate-spin" />}
                  <span>{editingItem ? 'Save Changes' : 'Create Option'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-md w-full max-w-sm p-6 shadow-2xl border border-cream-300 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle size={22} />
              <h3 className="font-serif text-lg font-bold text-noir-950">Confirm Deletion</h3>
            </div>
            <p className="text-xs text-noir-600 leading-relaxed">
              Are you sure you want to delete this page tier? Existing customer projects using this page count will retain their layout, but it will no longer be selectable on the storefront.
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-3.5 py-1.5 border border-cream-300 rounded-sm text-xs font-semibold text-noir-700 hover:bg-cream-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-sm text-xs font-bold uppercase tracking-wider"
              >
                Delete Option
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-md w-full max-w-sm p-6 shadow-2xl border border-cream-300 space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <RotateCcw size={22} />
              <h3 className="font-serif text-lg font-bold text-noir-950">Reset to Defaults?</h3>
            </div>
            <p className="text-xs text-noir-600 leading-relaxed">
              This will reset all page tiers to the standard factory list: 32 Pages (Popular), 50 Pages (Extended), 60 Pages (Collector&apos;s), 72 Pages (Collector&apos;s), 12 Pages, 24 Pages, and 120 Pages.
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setResetConfirmOpen(false)}
                className="px-3.5 py-1.5 border border-cream-300 rounded-sm text-xs font-semibold text-noir-700 hover:bg-cream-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="px-4 py-1.5 bg-noir-950 hover:bg-noir-900 text-cream-50 rounded-sm text-xs font-bold uppercase tracking-wider"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
