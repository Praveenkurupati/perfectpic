"use client";

import { useState, useEffect } from "react";
import { 
  Plus, Edit3, Trash2, ExternalLink, Star, Check, 
  X, Image as ImageIcon, Sparkles, BookOpen, Search 
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { getStorefrontUrl } from "@/lib/urls";
import { Pagination } from "@/components/ui/Pagination";

interface TemplateItem {
  id: string;
  slug: string;
  seriesLabel: string;
  bookType: string;
  title: string;
  displayName: string;
  tagline: string;
  subtitle: string;
  description: string;
  category: string;
  coverImage: string;
  coverColor?: string;
  spineText?: string;
  rating: number;
  reviewCount: number;
  fromPrice: number;
  pricing: { [key: string]: number };
  basePages: number;
  maxPhotos: number;
  badge?: string;
  featured: boolean;
  tags?: string[];
  pageOptions?: number[];
  templatePhotos?: string[];
}

export default function TemplatesManagementPage() {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    displayName: "",
    seriesLabel: "travel series",
    bookType: "custom photobook",
    title: "custom photobook",
    tagline: "your journeys, perfectly told",
    subtitle: "",
    category: "Travel",
    coverImage: "",
    coverColor: "#F8BAC7",
    spineText: "PHOTOBOOK",
    fromPrice: 1999,
    basePages: 32,
    badge: "new",
    tags: "",
    templatePhotos: ""
  });

  const loadTemplates = () => {
    setLoading(true);
    adminApi.getProducts()
      .then(res => {
        if (res && res.products) {
          setTemplates(res.products);
        }
      })
      .catch(err => {
        console.error("Failed to load templates:", err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const openAddModal = () => {
    setEditingTemplate(null);
    setFormData({
      displayName: "",
      seriesLabel: "trek series",
      bookType: "custom photobook",
      title: "custom photobook",
      tagline: "your journeys, perfectly told",
      subtitle: "Archival heirloom photobook",
      category: "Trek",
      coverImage: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop",
      coverColor: "#5B7B88",
      spineText: "PHOTOBOOK",
      fromPrice: 1999,
      basePages: 32,
      badge: "new",
      tags: "trek, himalayas, mountains, adventure",
      templatePhotos: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop"
    });
    setIsModalOpen(true);
  };

  const openEditModal = (tpl: TemplateItem) => {
    setEditingTemplate(tpl);
    setFormData({
      displayName: tpl.displayName || tpl.title,
      seriesLabel: tpl.seriesLabel || "travel series",
      bookType: tpl.bookType || "custom photobook",
      title: tpl.title || "custom photobook",
      tagline: tpl.tagline || "your journeys, perfectly told",
      subtitle: tpl.subtitle || "",
      category: tpl.category || "Travel",
      coverImage: tpl.coverImage || "",
      coverColor: tpl.coverColor || "#F8BAC7",
      spineText: tpl.spineText || "PHOTOBOOK",
      fromPrice: tpl.fromPrice || 1999,
      basePages: tpl.basePages || 32,
      badge: tpl.badge || "",
      tags: (tpl.tags || []).join(", "),
      templatePhotos: (tpl.templatePhotos || []).join(", ")
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const photosList = formData.templatePhotos
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);

    const tagsList = formData.tags
      .split(",")
      .map(s => s.trim().toLowerCase())
      .filter(Boolean);

    const payload = {
      ...formData,
      fromPrice: Number(formData.fromPrice),
      basePages: Number(formData.basePages),
      tags: tagsList,
      templatePhotos: photosList.length > 0 ? photosList : [formData.coverImage]
    };

    try {
      if (editingTemplate) {
        await adminApi.updateProduct(editingTemplate.id, payload);
        setSuccessMessage("Template updated successfully!");
      } else {
        await adminApi.createProduct(payload);
        setSuccessMessage("New template created successfully!");
      }

      setIsModalOpen(false);
      loadTemplates();
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err: any) {
      alert(`Error saving template: ${err.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await adminApi.deleteProduct(id);
      loadTemplates();
    } catch (err: any) {
      alert(`Error deleting template: ${err.message || 'Unknown error'}`);
    }
  };

  const filteredTemplates = templates.filter(t => {
    const matchesCat = selectedCategory === "all" || t.category.toLowerCase() === selectedCategory.toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || 
      t.displayName?.toLowerCase().includes(query) ||
      t.seriesLabel?.toLowerCase().includes(query) ||
      t.title?.toLowerCase().includes(query) ||
      t.tagline?.toLowerCase().includes(query) ||
      t.tags?.some(tag => tag.toLowerCase().includes(query));
    return matchesCat && matchesSearch;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredTemplates.length / pageSize));
  const paginatedTemplates = filteredTemplates.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-foil-gold font-bold mb-1">
            <BookOpen size={14} />
            <span>Storefront Catalog Manager</span>
          </div>
          <h1 className="text-3xl font-semibold text-noir-950">Template Books Management</h1>
          <p className="text-sm text-noir-500 mt-1">
            Manage the specific book items with pictures, series labels, and pricing displayed on the client Home Page.
          </p>
        </div>

        <button 
          onClick={openAddModal}
          className="inline-flex items-center px-5 py-2.5 bg-noir-950 text-cream-50 rounded-sm text-sm font-medium hover:bg-noir-900 transition-colors shadow-sm self-start md:self-auto"
        >
          <Plus size={16} className="mr-2" />
          <span>Add New Template Book</span>
        </button>
      </div>

      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-sm text-sm flex items-center justify-between">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage("")}><X size={16} /></button>
        </div>
      )}

      {/* Toolbar & Filters */}
      <div className="bg-white p-4 rounded-md shadow-luxury-sm border border-cream-200 flex flex-col sm:flex-row justify-between gap-4 items-center">
        <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "All Series" },
            { id: "trek", label: "Trek Series" },
            { id: "travel", label: "Travel Series" },
            { id: "moments", label: "Moments Series" },
            { id: "anniversary", label: "Anniversary Series" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={cn(
                "px-3.5 py-1.5 rounded-sm text-xs font-semibold uppercase tracking-wider transition-colors whitespace-nowrap",
                selectedCategory === tab.id
                  ? "bg-noir-950 text-cream-50"
                  : "text-noir-600 hover:bg-cream-100 hover:text-noir-950"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-noir-400" />
          <input 
            type="text" 
            placeholder="Search book or series..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-cream-50 border border-cream-300 rounded-sm text-sm focus:outline-none focus:border-noir-900 transition-colors"
          />
        </div>
      </div>

      {/* Templates Grid - Styled exactly like the customer storefront cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-cream-200 h-96 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {paginatedTemplates.map(book => (
            <div 
              key={book.id} 
              className="bg-white border border-neutral-200/90 rounded-2xl p-6 shadow-luxury-sm hover:shadow-luxury-md transition-all flex flex-col justify-between relative group"
            >
              <div>
                {/* Card Top: Series Label & Optional Badge */}
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-bold tracking-tight text-neutral-400 uppercase">
                    {book.seriesLabel}
                  </span>
                  {book.badge && (
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#fcedea] text-[#d96a54] uppercase tracking-wider">
                      {book.badge}
                    </span>
                  )}
                </div>

                {/* 3D Book Mockup Display Area */}
                <div className="py-6 flex justify-center items-center h-64 bg-neutral-50/70 rounded-xl mb-4 overflow-hidden relative">
                  <div className="relative group/mockup flex items-center justify-center">
                    {/* Realistic 3D standing book illusion */}
                    <div 
                      className="relative w-36 h-48 rounded-r-md shadow-2xl flex overflow-hidden border border-black/10 transform rotate-[-4deg] group-hover:rotate-0 transition-transform duration-500"
                      style={{ backgroundColor: book.coverColor || '#F8BAC7' }}
                    >
                      {/* Spine */}
                      <div className="w-5 bg-black/20 flex items-center justify-center border-r border-black/10">
                        <span className="text-[8px] font-bold text-white tracking-[0.2em] uppercase transform -rotate-90 whitespace-nowrap">
                          {book.spineText || 'PHOTOBOOK'}
                        </span>
                      </div>
                      {/* Cover Photo */}
                      <div className="flex-1 relative overflow-hidden">
                        <img 
                          src={book.coverImage} 
                          alt={book.displayName} 
                          className="w-full h-full object-cover" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent flex items-end p-2">
                          <span className="text-[9px] font-semibold text-white uppercase tracking-wider line-clamp-1">
                            {book.displayName}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stars and Price Row */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-1 text-neutral-400 text-xs">
                    <div className="flex text-neutral-300">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} size={12} fill="currentColor" stroke="none" className="text-neutral-400" />
                      ))}
                    </div>
                    <span className="text-[11px] text-neutral-500 font-medium">({book.reviewCount || 72})</span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-neutral-400 uppercase tracking-wider mr-1">from</span>
                    <span className="text-base font-bold text-noir-950 font-serif">₹{book.fromPrice?.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Title & Tagline in lowercase modern font */}
                <h3 className="text-lg font-bold text-neutral-900 tracking-tight leading-tight lowercase">
                  {book.title}
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5 lowercase leading-relaxed">
                  {book.tagline || book.subtitle}
                </p>

                {book.tags && book.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2.5">
                    {book.tags.slice(0, 4).map((tag, idx) => (
                      <span key={idx} className="text-[10px] bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded-sm font-mono">
                        #{tag}
                      </span>
                    ))}
                    {book.tags.length > 4 && (
                      <span className="text-[10px] text-neutral-400 self-center">+{book.tags.length - 4}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Admin Actions Bar */}
              <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center justify-between gap-2">
                <a
                  href={getStorefrontUrl(`/configure?template=${book.slug}`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-xs text-neutral-500 hover:text-noir-950 transition-colors"
                >
                  <ExternalLink size={13} className="mr-1" />
                  <span>Preview Store</span>
                </a>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(book)}
                    className="p-2 border border-cream-300 rounded-sm hover:bg-cream-100 text-noir-800 transition-colors flex items-center text-xs font-medium"
                    title="Edit Template Details"
                  >
                    <Edit3 size={14} className="mr-1" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(book.id, book.displayName)}
                    className="p-2 border border-red-200 rounded-sm hover:bg-red-50 text-red-600 transition-colors"
                    title="Delete Template"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dynamic Enterprise Pagination */}
      <div className="bg-white rounded-md shadow-luxury-sm border border-cream-200 overflow-hidden">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredTemplates.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[6, 9, 18, 36]}
          itemLabel="templates"
        />
      </div>

      {/* Edit / Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-sm shadow-luxury-xl border border-cream-300 p-6 md:p-8 relative">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-noir-400 hover:text-noir-900"
            >
              <X size={20} />
            </button>

            <h2 className="text-2xl font-semibold text-noir-950 mb-1">
              {editingTemplate ? `Edit "${editingTemplate.displayName}"` : "Add New Template Book"}
            </h2>
            <p className="text-xs text-noir-500 mb-6">
              Configure the exact picture, series name, starting price, and typography taglines displayed to clients.
            </p>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-noir-700 mb-1">
                    Display Name
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={formData.displayName} 
                    onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                    placeholder="e.g. Paris Journey Hardcover"
                    className="w-full p-2.5 border border-cream-300 rounded-sm text-sm focus:border-noir-950 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-noir-700 mb-1">
                    Series Name (Lowercase)
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={formData.seriesLabel} 
                    onChange={e => setFormData({ ...formData, seriesLabel: e.target.value })}
                    placeholder="e.g. travel series, moments series"
                    className="w-full p-2.5 border border-cream-300 rounded-sm text-sm focus:border-noir-950 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-noir-700 mb-1">
                    Book Title
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={formData.title} 
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. custom photobook"
                    className="w-full p-2.5 border border-cream-300 rounded-sm text-sm focus:border-noir-950 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-noir-700 mb-1">
                    Tagline (Subtitle)
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={formData.tagline} 
                    onChange={e => setFormData({ ...formData, tagline: e.target.value })}
                    placeholder="e.g. your journeys, perfectly told"
                    className="w-full p-2.5 border border-cream-300 rounded-sm text-sm focus:border-noir-950 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-noir-700 mb-1">
                    Starting Price (₹)
                  </label>
                  <input 
                    type="number" 
                    required 
                    value={formData.fromPrice} 
                    onChange={e => setFormData({ ...formData, fromPrice: Number(e.target.value) })}
                    className="w-full p-2.5 border border-cream-300 rounded-sm text-sm focus:border-noir-950 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-noir-700 mb-1">
                    Category
                  </label>
                  <select 
                    value={formData.category} 
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-2.5 border border-cream-300 rounded-sm text-sm focus:border-noir-950 focus:outline-none bg-white"
                  >
                    <option value="Travel">Travel</option>
                    <option value="Trek">Trek</option>
                    <option value="Moments">Moments</option>
                    <option value="Anniversary">Anniversary</option>
                    <option value="Wedding">Wedding</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-noir-700 mb-1">
                    Badge Tag
                  </label>
                  <select 
                    value={formData.badge} 
                    onChange={e => setFormData({ ...formData, badge: e.target.value })}
                    className="w-full p-2.5 border border-cream-300 rounded-sm text-sm focus:border-noir-950 focus:outline-none bg-white"
                  >
                    <option value="">None</option>
                    <option value="new">new</option>
                    <option value="bestseller">bestseller</option>
                    <option value="popular">popular</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-noir-700 mb-1">
                    Cover Color Theme
                  </label>
                  <div className="flex gap-2 items-center">
                    <input 
                      type="color" 
                      value={formData.coverColor} 
                      onChange={e => setFormData({ ...formData, coverColor: e.target.value })}
                      className="w-10 h-10 rounded cursor-pointer border border-cream-300"
                    />
                    <input 
                      type="text" 
                      value={formData.coverColor} 
                      onChange={e => setFormData({ ...formData, coverColor: e.target.value })}
                      className="flex-1 p-2 border border-cream-300 rounded-sm text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Cover Picture URL with live preview */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-noir-700 mb-1">
                  Cover Picture / Mockup Image URL
                </label>
                <div className="flex gap-3">
                  <input 
                    type="url" 
                    required 
                    value={formData.coverImage} 
                    onChange={e => setFormData({ ...formData, coverImage: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="flex-1 p-2.5 border border-cream-300 rounded-sm text-sm focus:border-noir-950 focus:outline-none"
                  />
                  {formData.coverImage && (
                    <div className="w-10 h-10 rounded overflow-hidden border border-cream-300 shrink-0">
                      <img src={formData.coverImage} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-noir-400 mt-1">
                  Provide any high-res picture URL. This picture will immediately render on the client side photobook.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-noir-700 mb-1">
                  Search Tags & Keywords (Comma-separated)
                </label>
                <input 
                  type="text" 
                  value={formData.tags} 
                  onChange={e => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="e.g. trek, himalayas, kedarkantha, snow, mountains, adventure"
                  className="w-full p-2.5 border border-cream-300 rounded-sm text-sm focus:border-noir-950 focus:outline-none"
                />
                <p className="text-[11px] text-noir-500 mt-1">
                  Used by customers to search for this book on the storefront (e.g. searching "kerala", "trek", "himalayas").
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-noir-700 mb-1">
                  Sample Template Photos (Comma-separated URLs)
                </label>
                <textarea 
                  rows={2}
                  value={formData.templatePhotos}
                  onChange={e => setFormData({ ...formData, templatePhotos: e.target.value })}
                  placeholder="https://image1.jpg, https://image2.jpg"
                  className="w-full p-2.5 border border-cream-300 rounded-sm text-xs focus:border-noir-950 focus:outline-none font-mono"
                />
              </div>

              <div className="pt-4 border-t border-cream-200 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-cream-300 rounded-sm text-sm hover:bg-cream-100"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-noir-950 text-cream-50 rounded-sm text-sm font-medium hover:bg-noir-900 disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingTemplate ? "Update Book" : "Create Book"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
