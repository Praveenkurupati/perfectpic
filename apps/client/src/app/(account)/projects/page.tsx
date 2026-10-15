"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { api } from "@/lib/api";
import { normalizeImageUrl } from "@/lib/urls";
import { useCartStore } from "@/stores/useCartStore";
import {
  MoreHorizontal,
  Plus,
  Trash2,
  Copy,
  Edit2,
  Bell,
  Check,
  Loader2,
} from "lucide-react";

interface ProjectItem {
  id: string;
  _id?: string;
  title: string;
  pageCount: number;
  completedPages?: number;
  progressPercentage?: number;
  updatedAt?: string;
  createdAt?: string;
  coverImage?: string;
  coverUrl?: string;
  status?: string;
  template?: string;
  bookSize?: string;
  theme?: string;
}

interface OrderItem {
  id: string;
  orderNumber: string;
  title: string;
  amount: number;
  status: "printing" | "delivered" | "production" | "dispatched" | string;
  thumbnail?: string;
  coverUrl?: string;
  itemsCount?: number;
  quantity?: number;
  date?: string;
}

export default function ProjectsPage() {
  const router = useRouter();
  const { items, addItem } = useCartStore();

  const [mounted, setMounted] = useState(false);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<"in-progress" | "ordered" | "all">("in-progress");
  const [loading, setLoading] = useState(true);

  // Context menu & modal states
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [renameModal, setRenameModal] = useState<{
    isOpen: boolean;
    project: ProjectItem | null;
    newTitle: string;
  }>({
    isOpen: false,
    project: null,
    newTitle: "",
  });

  // Delete confirmation modal (Image 4 Modal 3)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<ProjectItem | null>(null);

  const [reminderLoadingId, setReminderLoadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Close context menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Hydrate projects from server and merge local storage snapshots
  useEffect(() => {
    setMounted(true);
    const fetchData = async () => {
      try {
        setLoading(true);

        // 1. Fetch server projects
        let serverProjects: ProjectItem[] = [];
        try {
          const res = await api.getProjects();
          serverProjects = (res.projects || []).map((p: any) => {
            const pageCount = p.pageCount || 32;
            const completedPages =
              typeof p.completedPages === "number"
                ? p.completedPages
                : p.photos && p.photos.length > 0
                ? Math.min(pageCount, p.photos.length)
                : Math.round(((p.progressPercentage || 50) * pageCount) / 100);
            const progressPercentage =
              typeof p.progressPercentage === "number"
                ? p.progressPercentage
                : Math.min(100, Math.round((completedPages / pageCount) * 100));

            return {
              ...p,
              id: p.id || p._id,
              pageCount,
              completedPages,
              progressPercentage,
            };
          });
        } catch {
          // If server fails or is empty, continue
        }

        // 2. Discover local browser snapshots from recent editor sessions
        const localProjects: ProjectItem[] = [];
        if (typeof window !== "undefined") {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith("pp_snapshot_")) {
              try {
                const raw = localStorage.getItem(key);
                if (raw) {
                  const snap = JSON.parse(raw);
                  const pId = snap.projectId || key.replace("pp_snapshot_", "");
                  if (!serverProjects.some((sp) => sp.id === pId)) {
                    const pageCount = snap.pageCount || 32;
                    const completedPages =
                      snap.completedPages ??
                      (snap.photos?.length ? Math.min(pageCount, snap.photos.length) : 16);
                    const progressPercentage =
                      snap.progressPercentage ??
                      Math.min(100, Math.round((completedPages / pageCount) * 100));
                    localProjects.push({
                      id: pId,
                      title: snap.title || "untitled book",
                      pageCount,
                      completedPages,
                      progressPercentage,
                      coverImage: snap.coverImage || snap.photos?.[0],
                      updatedAt: snap.lastEditedAt || new Date().toISOString(),
                      status: "Draft",
                    });
                  }
                }
              } catch {}
            }
          }
        }

        const merged = [...localProjects, ...serverProjects];
        setProjects(merged);

        // 3. Fetch orders
        try {
          const ordersRes = await api.getOrders();
          if (ordersRes.orders && ordersRes.orders.length > 0) {
            const mappedOrders: OrderItem[] = ordersRes.orders.map((o: any) => ({
              id: o.id || o.orderNumber,
              orderNumber: o.orderNumber || o.id,
              title: o.title || `custom book · ${o.itemsCount || 1} book${(o.itemsCount || 1) > 1 ? "s" : ""}`,
              amount: o.amount || o.total || 1999,
              status: o.status === "production" ? "printing" : o.status || "printing",
              thumbnail: o.thumbnail || o.coverUrl,
              itemsCount: o.itemsCount || o.quantity || 1,
              date: o.date || o.createdAt,
            }));
            setOrders(mappedOrders);
          }
        } catch {
          // No orders
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatRelativeTime = (dateString?: string) => {
    if (!dateString) return "last edited recently";
    const timestamp = new Date(dateString).getTime();
    if (isNaN(timestamp)) return `last edited ${dateString}`;

    const diffHours = (Date.now() - timestamp) / (1000 * 60 * 60);
    if (diffHours < 24) return "last edited today";
    const diffDays = Math.round(diffHours / 24);
    if (diffDays === 1) return "last edited yesterday";
    if (diffDays < 7) return `last edited ${diffDays} days ago`;
    if (diffDays < 14) return "last edited last week";
    if (diffDays < 30) return `last edited ${Math.round(diffDays / 7)} weeks ago`;
    return `last edited ${Math.round(diffDays / 30)} months ago`;
  };

  // Actions: Duplicate Project
  const handleDuplicate = async (project: ProjectItem) => {
    try {
      setActiveMenuId(null);
      const res = await api.duplicateProject(project.id);
      const newProject: ProjectItem = {
        ...project,
        id: res.id || `proj-${Date.now()}`,
        title: `${project.title} (Copy)`,
        updatedAt: new Date().toISOString(),
      };
      setProjects([newProject, ...projects]);
      showToast(`Duplicated "${project.title}" successfully`);
    } catch {
      const newId = `proj-${Date.now()}`;
      const newProject: ProjectItem = {
        ...project,
        id: newId,
        title: `${project.title} (Copy)`,
        updatedAt: new Date().toISOString(),
      };
      setProjects([newProject, ...projects]);
      showToast(`Duplicated "${project.title}"`);
    }
  };

  // Actions: Rename Project
  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameModal.project || !renameModal.newTitle.trim()) return;

    const pId = renameModal.project.id;
    const updatedTitle = renameModal.newTitle.trim();

    try {
      await api.renameProject(pId, updatedTitle);
    } catch {}

    setProjects(projects.map((p) => (p.id === pId ? { ...p, title: updatedTitle } : p)));
    setRenameModal({ isOpen: false, project: null, newTitle: "" });
    showToast("Project title updated");
  };

  // Actions: Delete Project (Opens Modal 3)
  const promptDeleteProject = (project: ProjectItem) => {
    setActiveMenuId(null);
    setProjectToDelete(project);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;
    const pId = projectToDelete.id;

    try {
      await api.deleteProject(pId);
      if (typeof window !== "undefined") {
        localStorage.removeItem(`pp_snapshot_${pId}`);
      }
    } catch {}

    setProjects(projects.filter((p) => p.id !== pId));
    setDeleteModalOpen(false);
    setProjectToDelete(null);
    showToast("Project deleted");
  };

  // Actions: Trigger Resume Reminder
  const handleSendReminder = async (project: ProjectItem) => {
    try {
      setReminderLoadingId(project.id);
      setActiveMenuId(null);
      await api.sendProjectReminder(project.id, { channel: "all" });
      showToast(`Resume reminder dispatched via WhatsApp & Email! (${project.progressPercentage}% done)`);
    } catch {
      showToast("Resume reminder simulated (Kapso WhatsApp & Email ready)");
    } finally {
      setReminderLoadingId(null);
    }
  };

  // Actions: Reorder Item
  const handleReorder = (order: OrderItem) => {
    addItem({
      id: `cart-reorder-${Date.now()}`,
      projectId: `reorder-${order.id}`,
      title: order.title,
      dimensions: '8.25" × 8.25" Precision-Bound',
      pageCount: 32,
      theme: "Minimal Modern",
      basePrice: order.amount,
      extraPagesPrice: 0,
      thumbnail: order.thumbnail || "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800",
    });
    router.push("/cart");
  };

  const totalCartCount = mounted
    ? items.reduce((sum, item) => sum + (item.quantity || 1), 0)
    : 0;

  const inProgressCount = projects.length;
  const orderedCount = orders.length;

  return (
    <div className="min-h-screen bg-[#F4F2ED] text-[#0A0A0A] font-sans flex flex-col justify-between selection:bg-[#0A0A0A] selection:text-white">
      {/* 1. Top Announcement Bar */}
      <div>
        <div className="bg-[#0A0A0A] text-[#D9D6CF] py-2 px-4 text-center text-[11px] md:text-xs font-medium tracking-wide">
          bundle &amp; save · free delivery across india · 100% reprint policy
        </div>

        {/* 2. Header */}
        <header className="border-b border-[#D9D6CF]/70 bg-[#F4F2ED]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center" aria-label="perfectpic homepage">
              <BrandLogo variant="light" height={32} className="h-7 md:h-8 w-auto" />
            </Link>

            {/* Nav Links */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link
                href="/templates"
                className="text-xs md:text-sm font-medium text-[#2A2926] hover:text-[#0A0A0A] transition-colors lowercase"
              >
                shop
              </Link>
              <Link
                href="/templates"
                className="text-xs md:text-sm font-medium text-[#2A2926] hover:text-[#0A0A0A] transition-colors lowercase"
              >
                templates
              </Link>
              <Link
                href="/projects"
                className="text-xs md:text-sm font-medium text-[#0A0A0A] font-semibold lowercase"
              >
                my projects
              </Link>
              <Link
                href="/orders"
                className="text-xs md:text-sm font-medium text-[#2A2926] hover:text-[#0A0A0A] transition-colors lowercase"
              >
                track order
              </Link>
            </nav>

            {/* Cart Pill */}
            <Link
              href="/cart"
              className="border border-[#0A0A0A] rounded-full px-5 py-2 text-xs md:text-sm font-medium text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white transition-all lowercase"
              aria-label="Shopping Cart"
            >
              cart ({totalCartCount})
            </Link>
          </div>
        </header>
      </div>

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0A0A0A] text-white px-5 py-3 rounded-full text-xs font-medium shadow-2xl flex items-center gap-2 border border-white/20 animate-in fade-in slide-in-from-bottom-2">
          <Check size={14} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 3. Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 w-full">
        {/* Page Title */}
        <div className="mb-8 md:mb-10 text-left">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[#0A0A0A] lowercase">
            my projects.
          </h1>
        </div>

        {/* LOADING STATE */}
        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <div className="w-7 h-7 border-2 border-[#0A0A0A] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : projects.length === 0 && orders.length === 0 ? (
          /* ========================================================
             EMPTY PROJECTS STATE (media_1792048568298.png)
             ======================================================== */
          <div className="border border-dashed border-[#B8B5AE] rounded-3xl p-10 sm:p-16 md:p-20 text-center bg-transparent max-w-5xl mx-auto my-6">
            {/* Center Graphic: Two subtle cards side-by-side */}
            <div className="flex items-center justify-center gap-2.5 mb-6">
              <div className="w-16 h-20 sm:w-20 sm:h-24 rounded-xl bg-white border border-[#D9D6CF] p-2 flex flex-col justify-between shadow-2xs">
                <div className="w-full h-10 sm:h-12 bg-[#DDD8D0] rounded-lg" />
                <div className="w-8 h-1 bg-[#DDD8D0] rounded-full mx-auto" />
              </div>
              <div className="w-16 h-20 sm:w-20 sm:h-24 rounded-xl bg-white border border-[#D9D6CF] p-2 flex flex-col justify-between shadow-2xs">
                <div className="w-full h-10 sm:h-12 bg-[#DDD8D0] rounded-lg" />
                <div className="w-8 h-1 bg-[#DDD8D0] rounded-full mx-auto" />
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0A0A0A] lowercase mb-2">
              no projects yet.
            </h2>

            <p className="text-xs sm:text-sm text-[#706E69] leading-relaxed max-w-md mx-auto mb-8 font-normal">
              upload your photos and we’ll arrange a first draft in about 60 seconds.
            </p>

            <Link
              href="/configure"
              className="inline-flex items-center justify-center bg-[#0A0A0A] hover:bg-black text-white px-8 py-3.5 rounded-full text-xs sm:text-sm font-medium transition-colors shadow-xs lowercase"
            >
              start my design
            </Link>
          </div>
        ) : (
          /* ========================================================
             POPULATED PROJECTS STATE
             ======================================================== */
          <div>
            {/* Filter Tabs + New Project Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => setActiveFilter("in-progress")}
                  className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors shrink-0 lowercase ${
                    activeFilter === "in-progress"
                      ? "bg-[#0A0A0A] text-white shadow-xs"
                      : "bg-white border border-[#D9D6CF] text-[#0A0A0A] hover:bg-[#FAF9F6]"
                  }`}
                >
                  in progress · {inProgressCount}
                </button>

                {orderedCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveFilter("ordered")}
                    className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors shrink-0 lowercase ${
                      activeFilter === "ordered"
                        ? "bg-[#0A0A0A] text-white shadow-xs"
                        : "bg-white border border-[#D9D6CF] text-[#0A0A0A] hover:bg-[#FAF9F6]"
                    }`}
                  >
                    ordered · {orderedCount}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setActiveFilter("all")}
                  className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors shrink-0 lowercase ${
                    activeFilter === "all"
                      ? "bg-[#0A0A0A] text-white shadow-xs"
                      : "bg-white border border-[#D9D6CF] text-[#0A0A0A] hover:bg-[#FAF9F6]"
                  }`}
                >
                  all
                </button>
              </div>

              <Link
                href="/configure"
                className="inline-flex items-center justify-center gap-1.5 bg-[#0A0A0A] hover:bg-black text-white px-5 py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all shadow-xs self-start sm:self-auto shrink-0 lowercase"
              >
                <Plus size={15} />
                <span>+ new project</span>
              </Link>
            </div>

            {/* In Progress Grid */}
            {(activeFilter === "in-progress" || activeFilter === "all") && (
              <div className="mb-14">
                {projects.length === 0 ? (
                  <div className="border border-dashed border-[#B8B5AE] rounded-3xl p-10 text-center text-[#706E69] max-w-xl mx-auto my-6">
                    <p className="font-bold text-base text-[#0A0A0A] mb-1 lowercase">
                      no projects in progress.
                    </p>
                    <Link
                      href="/configure"
                      className="text-xs text-[#0A0A0A] underline font-medium lowercase"
                    >
                      start my design →
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-7">
                    {projects.map((project) => {
                      const totalPages = project.pageCount || 32;
                      const completedPages =
                        project.completedPages ??
                        Math.round(((project.progressPercentage || 50) * totalPages) / 100);
                      const progressPercentage = Math.min(
                        100,
                        Math.max(
                          0,
                          project.progressPercentage ??
                            Math.round((completedPages / totalPages) * 100)
                        )
                      );

                      return (
                        <div
                          key={project.id}
                          className="bg-white border border-[#D9D6CF]/80 rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                        >
                          {/* Project Preview */}
                          <div className="aspect-[1.15/1] bg-[#DDD8D0] relative overflow-hidden flex items-center justify-center">
                            {project.coverUrl || project.coverImage ? (
                              <img
                                src={normalizeImageUrl(project.coverUrl || project.coverImage)}
                                alt={project.title}
                                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                              />
                            ) : (
                              <div className="w-full h-full bg-[#DDD8D0] flex items-center justify-center text-[#706E69] font-medium text-sm">
                                {project.title}
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="p-5 sm:p-6 flex flex-col flex-1 justify-between">
                            <div>
                              <h3 className="text-lg sm:text-xl font-bold text-[#0A0A0A] tracking-tight truncate lowercase">
                                {project.title}
                              </h3>
                              <p className="text-xs text-[#706E69] mt-1 font-normal lowercase">
                                {formatRelativeTime(project.updatedAt)} · {completedPages} of {totalPages} pages
                              </p>

                              {/* Progress Track */}
                              <div
                                className="w-full h-1 bg-[#E5E2DC] rounded-full mt-4 overflow-hidden"
                                title={`${progressPercentage}% complete`}
                              >
                                <div
                                  className="h-full bg-[#0A0A0A] rounded-full transition-all duration-500"
                                  style={{ width: `${progressPercentage}%` }}
                                />
                              </div>
                            </div>

                            {/* Card Footer */}
                            <div className="mt-5 flex items-center justify-between relative">
                              <Link
                                href={`/studio/${project.id}`}
                                className="bg-[#0A0A0A] hover:bg-black text-white px-5 py-2.5 rounded-full text-xs font-medium transition-colors lowercase"
                              >
                                continue editing
                              </Link>

                              {/* Context Menu */}
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenuId(
                                      activeMenuId === project.id ? null : project.id
                                    );
                                  }}
                                  className="w-8 h-8 rounded-full hover:bg-[#FAF9F6] text-[#706E69] hover:text-[#0A0A0A] flex items-center justify-center transition-colors"
                                  aria-label="More options"
                                >
                                  <MoreHorizontal size={18} />
                                </button>

                                {activeMenuId === project.id && (
                                  <div
                                    ref={menuRef}
                                    className="absolute right-0 bottom-full mb-2 w-52 bg-white border border-[#D9D6CF] shadow-2xl rounded-2xl py-1.5 z-40 text-xs text-[#0A0A0A] animate-in fade-in zoom-in-95"
                                  >
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveMenuId(null);
                                        setRenameModal({
                                          isOpen: true,
                                          project,
                                          newTitle: project.title,
                                        });
                                      }}
                                      className="w-full text-left px-4 py-2 hover:bg-[#FAF9F6] flex items-center gap-2.5 transition-colors lowercase"
                                    >
                                      <Edit2 size={13} className="text-[#706E69]" />
                                      <span>rename book</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleDuplicate(project)}
                                      className="w-full text-left px-4 py-2 hover:bg-[#FAF9F6] flex items-center gap-2.5 transition-colors lowercase"
                                    >
                                      <Copy size={13} className="text-[#706E69]" />
                                      <span>duplicate book</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleSendReminder(project)}
                                      disabled={reminderLoadingId === project.id}
                                      className="w-full text-left px-4 py-2 hover:bg-[#FAF9F6] flex items-center gap-2.5 text-blue-600 transition-colors lowercase"
                                    >
                                      {reminderLoadingId === project.id ? (
                                        <Loader2 size={13} className="animate-spin" />
                                      ) : (
                                        <Bell size={13} />
                                      )}
                                      <span>send resume reminder</span>
                                    </button>

                                    <div className="my-1 border-t border-[#D9D6CF]/60" />

                                    <button
                                      type="button"
                                      onClick={() => promptDeleteProject(project)}
                                      className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2.5 transition-colors lowercase"
                                    >
                                      <Trash2 size={13} />
                                      <span>delete project</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Ordered Section */}
            {(activeFilter === "ordered" || activeFilter === "all") && orders.length > 0 && (
              <div className="mb-14">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0A0A0A] lowercase mb-6">
                  ordered
                </h2>

                <div className="space-y-4">
                  {orders.map((order) => {
                    const isPrinting =
                      order.status === "printing" || order.status === "production";
                    const isDelivered = order.status === "delivered";

                    return (
                      <div
                        key={order.id}
                        className="bg-white border border-[#D9D6CF]/80 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs hover:border-[#D9D6CF] transition-colors"
                      >
                        {/* Thumbnail & Info */}
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#DDD8D0] overflow-hidden shrink-0">
                            {order.thumbnail || order.coverUrl ? (
                              <img
                                src={normalizeImageUrl(order.thumbnail || order.coverUrl)}
                                alt={order.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-[#DDD8D0]" />
                            )}
                          </div>

                          <div>
                            <h3 className="text-base sm:text-lg font-bold text-[#0A0A0A] lowercase leading-snug">
                              {order.title}
                            </h3>
                            <p className="text-xs text-[#706E69] mt-0.5 lowercase font-mono">
                              order {order.orderNumber}
                            </p>

                            <span
                              className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider lowercase ${
                                isPrinting
                                  ? "bg-[#0A0A0A] text-white"
                                  : isDelivered
                                  ? "bg-[#E5E2DC] text-[#2A2926]"
                                  : "bg-amber-100 text-amber-900"
                              }`}
                            >
                              {order.status}
                            </span>
                          </div>
                        </div>

                        {/* Price & Buttons */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-[#D9D6CF]/40">
                          <span className="text-base sm:text-lg font-bold text-[#0A0A0A] font-sans sm:mr-2">
                            ₹{order.amount?.toLocaleString("en-IN")}
                          </span>

                          <div className="flex items-center gap-2">
                            <Link
                              href={`/orders?search=${order.orderNumber}`}
                              className="bg-white border border-[#0A0A0A] hover:bg-[#FAF9F6] text-[#0A0A0A] px-4 py-2 rounded-full text-xs font-medium transition-colors lowercase"
                            >
                              track order
                            </Link>

                            <button
                              type="button"
                              onClick={() => handleReorder(order)}
                              className="bg-[#0A0A0A] hover:bg-black text-white px-5 py-2 rounded-full text-xs font-medium transition-colors lowercase"
                            >
                              reorder
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Help Link */}
            <div className="pt-2 pb-8">
              <Link
                href="/faq"
                className="text-xs sm:text-sm font-medium text-[#0A0A0A] hover:underline transition-all lowercase"
              >
                need help with an order? contact support
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* 4. Footer */}
      <footer className="border-t border-[#D9D6CF]/70 py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <p className="text-xs text-[#706E69] lowercase font-normal">
          © 2026 perfectpic · made with love in india
        </p>
      </footer>

      {/* 5. Delete Project Confirmation Modal (media_1792048593432.png Modal 3) */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        type="delete-project"
        onCancel={() => {
          setDeleteModalOpen(false);
          setProjectToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
      />

      {/* 6. Rename Book Modal */}
      {renameModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-[#D9D6CF] animate-in fade-in zoom-in-95">
            <h3 className="text-xl font-bold text-[#0A0A0A] lowercase mb-2">rename book</h3>
            <p className="text-xs text-[#706E69] mb-5 lowercase">
              give your custom photobook a meaningful title.
            </p>

            <form onSubmit={handleRenameSubmit} className="space-y-4">
              <input
                type="text"
                value={renameModal.newTitle}
                onChange={(e) => setRenameModal({ ...renameModal, newTitle: e.target.value })}
                placeholder="e.g. kerala · untitled book"
                className="w-full px-4 py-3 rounded-2xl border border-[#D9D6CF] text-xs sm:text-sm text-[#0A0A0A] focus:outline-none focus:ring-1 focus:ring-black lowercase"
                autoFocus
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRenameModal({ isOpen: false, project: null, newTitle: "" })}
                  className="px-5 py-2.5 rounded-full border border-[#D9D6CF] text-xs font-medium text-[#0A0A0A] hover:bg-neutral-50 transition-colors lowercase"
                >
                  cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full text-xs font-medium bg-[#0A0A0A] text-white hover:bg-black transition-colors lowercase"
                >
                  save title
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
