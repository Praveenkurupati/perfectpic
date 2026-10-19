// apps/admin/src/app/(dashboard)/marketing/templates/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Mail, 
  MessageSquare, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Copy, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Code2
} from "lucide-react";
import { adminApi } from "@/lib/api";

export default function CommunicationTemplatesPage() {
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<any[]>([]);
  const [channelFilter, setChannelFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);

  // Form State
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formChannel, setFormChannel] = useState<"email" | "whatsapp">("email");
  const [formCategory, setFormCategory] = useState("marketing");
  const [formSubject, setFormSubject] = useState("");
  const [formHtml, setFormHtml] = useState("");
  const [formWhatsappName, setFormWhatsappName] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getCampaignTemplates({
        channel: channelFilter,
        search: searchTerm,
      });
      if (res.success) {
        setTemplates(res.templates || []);
      }
    } catch (err) {
      console.error("Failed to load templates", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [channelFilter]);

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setFormName("");
    setFormSlug("");
    setFormChannel("email");
    setFormCategory("marketing");
    setFormSubject("Special memories for {{first_name|Friend}}");
    setFormHtml("<h2>Hello {{first_name|Friend}},</h2><p>Here is your exclusive offer {{discount_code|MEMORIES15}}.</p>");
    setFormWhatsappName("");
    setShowModal(true);
  };

  const handleOpenEdit = (t: any) => {
    setEditingTemplate(t);
    setFormName(t.name);
    setFormSlug(t.slug);
    setFormChannel(t.channel);
    setFormCategory(t.category);
    setFormSubject(t.subject || "");
    setFormHtml(t.contentHtml || "");
    setFormWhatsappName(t.whatsappTemplateName || "");
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert("Name is required");
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        name: formName,
        slug: formSlug || formName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        channel: formChannel,
        category: formCategory,
        subject: formSubject,
        contentHtml: formHtml,
        contentText: formHtml.replace(/<[^>]*>?/gm, ""),
        whatsappTemplateName: formWhatsappName,
      };

      if (editingTemplate) {
        await adminApi.updateCampaignTemplate(editingTemplate.id || editingTemplate._id, payload);
      } else {
        await adminApi.createCampaignTemplate(payload);
      }

      setShowModal(false);
      await fetchTemplates();
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this template?")) return;
    try {
      await adminApi.deleteCampaignTemplate(id);
      await fetchTemplates();
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
            <span className="text-zinc-200">Templates</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-serif">Communication Templates</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Build and manage reusable HTML and Meta WhatsApp message templates with dynamic variable bindings.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchTemplates}
            disabled={loading}
            className="p-2 text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 rounded-lg transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-foil-gold' : ''}`} />
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-foil-gold hover:bg-foil-gold/90 text-noir-950 font-semibold rounded-lg text-sm shadow-sm transition"
          >
            <Plus className="w-4 h-4" /> New Template
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {["all", "email", "whatsapp"].map((ch) => (
            <button
              key={ch}
              onClick={() => setChannelFilter(ch)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium uppercase font-mono transition ${
                channelFilter === ch
                  ? "bg-foil-gold text-noir-950 font-bold"
                  : "bg-zinc-900 text-zinc-400 hover:text-white"
              }`}
            >
              {ch}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchTemplates()}
            className="bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-foil-gold w-56"
          />
        </div>
      </div>

      {/* Template Grid */}
      {loading ? (
        <div className="p-16 text-center text-zinc-500 text-sm">
          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-foil-gold" />
          Loading templates...
        </div>
      ) : templates.length === 0 ? (
        <div className="p-16 text-center bg-zinc-900/40 border border-zinc-800 rounded-xl">
          <p className="text-zinc-400 text-sm">No templates found.</p>
          <button
            onClick={handleOpenCreate}
            className="mt-3 text-xs text-foil-gold hover:underline"
          >
            Create your first communication template &rarr;
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t) => (
            <div key={t.id || t._id} className="p-5 bg-zinc-900/40 border border-zinc-800 rounded-xl space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ${
                    t.channel === 'email' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}>
                    {t.channel === 'email' ? <Mail className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
                    {t.channel}
                  </span>
                  <span className="text-[10px] text-zinc-500 uppercase font-mono">{t.category}</span>
                </div>

                <h3 className="font-semibold text-white text-base">{t.name}</h3>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">{t.slug}</p>

                {t.subject && (
                  <div className="mt-2 text-xs text-zinc-300 font-medium truncate">
                    &quot;{t.subject}&quot;
                  </div>
                )}

                {/* Variable Chips */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {(t.variables || []).map((v: string) => (
                    <span key={v} className="px-1.5 py-0.5 bg-zinc-950 border border-zinc-800 rounded text-[10px] text-zinc-400 font-mono">
                      &#123;&#123;{v}&#125;&#125;
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                <span className="text-[10px] text-zinc-500">v{t.version || 1}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(t)}
                    className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded transition"
                    title="Edit"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(t.id || t._id)}
                    className="p-1.5 bg-zinc-800 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 rounded transition"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-semibold text-white text-base">
                {editingTemplate ? "Edit Template" : "New Communication Template"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-white">&times;</button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Template Name *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Abandoned Photobook Cart Recovery"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-foil-gold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Channel</label>
                  <select
                    value={formChannel}
                    onChange={(e: any) => setFormChannel(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="email">Email</option>
                    <option value="whatsapp">WhatsApp</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="marketing">Marketing</option>
                    <option value="retention">Retention</option>
                    <option value="announcement">Announcement</option>
                    <option value="transactional">Transactional</option>
                  </select>
                </div>
              </div>

              {formChannel === "email" ? (
                <>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">Email Subject</label>
                    <input
                      type="text"
                      value={formSubject}
                      onChange={(e) => setFormSubject(e.target.value)}
                      placeholder="e.g. {{first_name}}, your album is waiting!"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">HTML Content</label>
                    <textarea
                      rows={8}
                      value={formHtml}
                      onChange={(e) => setFormHtml(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-200 font-mono focus:outline-none"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Meta WhatsApp Template Name</label>
                  <input
                    type="text"
                    value={formWhatsappName}
                    onChange={(e) => setFormWhatsappName(e.target.value)}
                    placeholder="e.g. order_dispatch_v2"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-foil-gold text-noir-950 font-semibold rounded-lg text-xs"
                >
                  {saving ? "Saving..." : "Save Template"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
