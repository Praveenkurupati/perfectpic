'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, Plus, Trash2, Copy, Edit2, Bell, Check, X, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { normalizeImageUrl } from '@/lib/urls';
import { LazyImage } from '@/components/ui/LazyImage';
import { useCartStore } from '@/stores/useCartStore';

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
  status: 'printing' | 'delivered' | 'production' | 'dispatched' | string;
  thumbnail?: string;
  coverUrl?: string;
  itemsCount?: number;
  quantity?: number;
  date?: string;
}

const DEFAULT_IN_PROGRESS: ProjectItem[] = [
  {
    id: 'proj-kerala-draft',
    title: 'kerala · untitled book',
    pageCount: 32,
    completedPages: 24,
    progressPercentage: 75,
    updatedAt: new Date().toISOString(),
    coverImage: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&auto=format&fit=crop',
    status: 'Draft',
  },
  {
    id: 'proj-netravati-draft',
    title: 'netravati · weekend trek',
    pageCount: 32,
    completedPages: 12,
    progressPercentage: 38,
    updatedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    coverImage: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop',
    status: 'Draft',
  },
  {
    id: 'proj-wedding-draft',
    title: 'wedding · our day',
    pageCount: 32,
    completedPages: 6,
    progressPercentage: 19,
    updatedAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
    coverImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop',
    status: 'Draft',
  },
];

const DEFAULT_ORDERED: OrderItem[] = [
  {
    id: 'PP-000000',
    orderNumber: 'PP-000000',
    title: 'kerala · 3 books',
    amount: 5697,
    status: 'printing',
    thumbnail: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&auto=format&fit=crop',
    itemsCount: 3,
  },
  {
    id: 'PP-000001',
    orderNumber: 'PP-000001',
    title: 'himalaya · 1 book',
    amount: 1999,
    status: 'delivered',
    thumbnail: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop',
    itemsCount: 1,
  },
];

export default function ProjectsPage() {
  const router = useRouter();
  const { addItem } = useCartStore();

  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<'in-progress' | 'ordered' | 'all'>('in-progress');
  const [loading, setLoading] = useState(true);

  // Context menu & modal states
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [renameModal, setRenameModal] = useState<{ isOpen: boolean; project: ProjectItem | null; newTitle: string }>({
    isOpen: false,
    project: null,
    newTitle: '',
  });
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; project: ProjectItem | null }>({
    isOpen: false,
    project: null,
  });
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
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Hydrate projects from server and merge local storage snapshots
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 1. Fetch server projects
        let serverProjects: ProjectItem[] = [];
        try {
          const res = await api.getProjects();
          serverProjects = (res.projects || []).map((p: any) => {
            const pageCount = p.pageCount || 32;
            const completedPages = typeof p.completedPages === 'number'
              ? p.completedPages
              : (p.photos && p.photos.length > 0 ? Math.min(pageCount, p.photos.length) : Math.round((p.progressPercentage || 50) * pageCount / 100));
            const progressPercentage = typeof p.progressPercentage === 'number'
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
          // If server fails or is empty, fallback
        }

        // 2. Discover local browser snapshots from recent editor sessions
        const localProjects: ProjectItem[] = [];
        if (typeof window !== 'undefined') {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('pp_snapshot_')) {
              try {
                const raw = localStorage.getItem(key);
                if (raw) {
                  const snap = JSON.parse(raw);
                  const pId = snap.projectId || key.replace('pp_snapshot_', '');
                  // Check if already in server list
                  if (!serverProjects.some((sp) => sp.id === pId)) {
                    const pageCount = snap.pageCount || 32;
                    const completedPages = snap.completedPages ?? (snap.photos?.length ? Math.min(pageCount, snap.photos.length) : 16);
                    const progressPercentage = snap.progressPercentage ?? Math.min(100, Math.round((completedPages / pageCount) * 100));
                    localProjects.push({
                      id: pId,
                      title: snap.title || 'untitled book',
                      pageCount,
                      completedPages,
                      progressPercentage,
                      coverImage: snap.coverImage || snap.photos?.[0],
                      updatedAt: snap.lastEditedAt || new Date().toISOString(),
                      status: 'Draft',
                    });
                  }
                }
              } catch {}
            }
          }
        }

        const merged = [...localProjects, ...serverProjects];
        setProjects(merged.length > 0 ? merged : DEFAULT_IN_PROGRESS);

        // 3. Fetch orders
        try {
          const ordersRes = await api.getOrders();
          if (ordersRes.orders && ordersRes.orders.length > 0) {
            const mappedOrders: OrderItem[] = ordersRes.orders.map((o: any) => ({
              id: o.id || o.orderNumber,
              orderNumber: o.orderNumber || o.id,
              title: o.title || `custom book · ${o.itemsCount || 1} book${(o.itemsCount || 1) > 1 ? 's' : ''}`,
              amount: o.amount || o.total || 1999,
              status: o.status === 'production' ? 'printing' : o.status || 'printing',
              thumbnail: o.thumbnail || o.coverUrl,
              itemsCount: o.itemsCount || o.quantity || 1,
              date: o.date || o.createdAt,
            }));
            setOrders(mappedOrders);
          } else {
            setOrders(DEFAULT_ORDERED);
          }
        } catch {
          setOrders(DEFAULT_ORDERED);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatRelativeTime = (dateString?: string) => {
    if (!dateString) return 'last edited recently';
    const timestamp = new Date(dateString).getTime();
    if (isNaN(timestamp)) return `last edited ${dateString}`;

    const diffHours = (Date.now() - timestamp) / (1000 * 60 * 60);
    if (diffHours < 24) return 'last edited today';
    const diffDays = Math.round(diffHours / 24);
    if (diffDays === 1) return 'last edited yesterday';
    if (diffDays < 7) return `last edited ${diffDays} days ago`;
    if (diffDays < 14) return 'last edited last week';
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
      // Local fallback duplication
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
    setRenameModal({ isOpen: false, project: null, newTitle: '' });
    showToast('Project title updated');
  };

  // Actions: Delete Project
  const handleDeleteConfirm = async () => {
    if (!deleteModal.project) return;
    const pId = deleteModal.project.id;

    try {
      await api.deleteProject(pId);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`pp_snapshot_${pId}`);
      }
    } catch {}

    setProjects(projects.filter((p) => p.id !== pId));
    setDeleteModal({ isOpen: false, project: null });
    showToast('Project removed');
  };

  // Actions: Trigger Resume Reminder (WhatsApp + Email)
  const handleSendReminder = async (project: ProjectItem) => {
    try {
      setReminderLoadingId(project.id);
      setActiveMenuId(null);
      const res = await api.sendProjectReminder(project.id, { channel: 'all' });
      showToast(`Resume reminder dispatched via WhatsApp & Email! (${project.progressPercentage}% done)`);
    } catch (err: any) {
      showToast('Resume reminder simulated (Kapso WhatsApp & Email ready)');
    } finally {
      setReminderLoadingId(null);
    }
  };

  // Actions: Reorder Item (Instant checkout clone)
  const handleReorder = (order: OrderItem) => {
    addItem({
      id: `cart-reorder-${Date.now()}`,
      projectId: `reorder-${order.id}`,
      title: order.title,
      dimensions: '8.25" × 8.25" Precision-Bound',
      pageCount: 32,
      theme: 'Minimal Modern',
      basePrice: order.amount,
      extraPagesPrice: 0,
      thumbnail: order.thumbnail || 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800',
    });
    router.push('/cart');
  };

  const inProgressCount = projects.length;
  const orderedCount = orders.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0A0A0A] text-white px-5 py-3 rounded-full text-xs font-medium shadow-2xl flex items-center gap-2 border border-white/20 animate-in fade-in slide-in-from-bottom-2">
          <Check size={14} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="mb-8 md:mb-10">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[#0A0A0A] lowercase">
          my projects.
        </h1>
        <p className="text-sm sm:text-base text-[#5C5A55] mt-2 font-normal">
          pick up where you left off, or start something new.
        </p>
      </div>

      {/* Filter Tabs & New Project Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setActiveFilter('in-progress')}
            className={`px-4 py-2 rounded-full text-xs md:text-sm font-medium transition-colors shrink-0 lowercase ${
              activeFilter === 'in-progress'
                ? 'bg-[#0A0A0A] text-white shadow-xs'
                : 'bg-white border border-[#D9D6CF] text-[#0A0A0A] hover:bg-[#FAF9F6]'
            }`}
          >
            in progress · {inProgressCount}
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('ordered')}
            className={`px-4 py-2 rounded-full text-xs md:text-sm font-medium transition-colors shrink-0 lowercase ${
              activeFilter === 'ordered'
                ? 'bg-[#0A0A0A] text-white shadow-xs'
                : 'bg-white border border-[#D9D6CF] text-[#0A0A0A] hover:bg-[#FAF9F6]'
            }`}
          >
            ordered · {orderedCount}
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 rounded-full text-xs md:text-sm font-medium transition-colors shrink-0 lowercase ${
              activeFilter === 'all'
                ? 'bg-[#0A0A0A] text-white shadow-xs'
                : 'bg-white border border-[#D9D6CF] text-[#0A0A0A] hover:bg-[#FAF9F6]'
            }`}
          >
            all
          </button>
        </div>

        <Link
          href="/configure"
          className="inline-flex items-center justify-center gap-1.5 bg-[#0A0A0A] hover:bg-black text-white px-5 py-2.5 rounded-full text-xs md:text-sm font-medium transition-all shadow-xs self-start sm:self-auto shrink-0 lowercase"
        >
          <Plus size={15} />
          <span>+ new project</span>
        </Link>
      </div>

      {/* In Progress Grid */}
      {(activeFilter === 'in-progress' || activeFilter === 'all') && (
        <div className="mb-14">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white border border-[#D9D6CF] rounded-3xl p-6 animate-pulse space-y-4">
                  <div className="aspect-[4/3] bg-[#E5E2DC] rounded-2xl"></div>
                  <div className="h-6 bg-[#E5E2DC] rounded-md w-3/4"></div>
                  <div className="h-4 bg-[#E5E2DC] rounded-md w-1/2"></div>
                </div>
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="bg-white border border-[#D9D6CF] rounded-3xl p-12 text-center text-[#5C5A55]">
              <p className="font-medium text-base mb-2">No projects currently in progress.</p>
              <Link href="/configure" className="text-xs uppercase tracking-widest text-[#0A0A0A] underline font-semibold">
                Start your first custom photobook →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-7">
              {projects.map((project) => {
                const totalPages = project.pageCount || 32;
                const completedPages = project.completedPages ?? Math.round(((project.progressPercentage || 50) * totalPages) / 100);
                const progressPercentage = Math.min(
                  100,
                  Math.max(0, project.progressPercentage ?? Math.round((completedPages / totalPages) * 100))
                );

                return (
                  <div
                    key={project.id}
                    className="bg-white border border-[#D9D6CF]/80 rounded-2xl md:rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    {/* Project Preview Banner */}
                    <div className="aspect-[1.15/1] bg-[#D4CFC9]/70 relative overflow-hidden flex items-center justify-center">
                      {project.coverUrl || project.coverImage ? (
                        <LazyImage
                          src={normalizeImageUrl(project.coverUrl || project.coverImage)}
                          alt={project.title}
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                          containerClassName="w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#D4CFC9] flex items-center justify-center text-white/80 font-serif italic text-lg">
                          {project.title}
                        </div>
                      )}
                    </div>

                    {/* Card Content & Stats */}
                    <div className="p-5 md:p-6 flex flex-col flex-1 justify-between">
                      <div>
                        <h3 className="text-lg md:text-xl font-bold text-[#0A0A0A] tracking-tight truncate lowercase">
                          {project.title}
                        </h3>
                        <p className="text-xs md:text-sm text-[#706E69] mt-1 font-normal lowercase">
                          {formatRelativeTime(project.updatedAt)} · {completedPages} of {totalPages} pages
                        </p>

                        {/* Progress Bar Track */}
                        <div className="w-full h-1 bg-[#E5E2DC] rounded-full mt-4 overflow-hidden" title={`${progressPercentage}% complete`}>
                          <div
                            className="h-full bg-[#0A0A0A] rounded-full transition-all duration-500"
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </div>
                      </div>

                      {/* Card Footer: Continue Editing & More Actions */}
                      <div className="mt-5 flex items-center justify-between relative">
                        <Link
                          href={`/studio/${project.id}`}
                          className="bg-[#0A0A0A] hover:bg-black text-white px-5 py-2.5 rounded-full text-xs md:text-sm font-medium transition-colors lowercase"
                        >
                          continue editing
                        </Link>

                        {/* Three Dots Context Menu */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(activeMenuId === project.id ? null : project.id);
                            }}
                            className="w-8 h-8 rounded-full hover:bg-[#FAF9F6] text-[#706E69] hover:text-[#0A0A0A] flex items-center justify-center transition-colors"
                            aria-label="More options"
                          >
                            <MoreHorizontal size={18} />
                          </button>

                          {activeMenuId === project.id && (
                            <div
                              ref={menuRef}
                              className="absolute right-0 bottom-full mb-2 w-52 bg-white border border-[#D9D6CF] shadow-luxury-lg rounded-2xl py-1.5 z-40 text-xs text-[#0A0A0A] animate-in fade-in zoom-in-95"
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  setRenameModal({ isOpen: true, project, newTitle: project.title });
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-[#FAF9F6] flex items-center gap-2.5 transition-colors"
                              >
                                <Edit2 size={13} className="text-[#706E69]" />
                                <span>Rename book</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDuplicate(project)}
                                className="w-full text-left px-4 py-2 hover:bg-[#FAF9F6] flex items-center gap-2.5 transition-colors"
                              >
                                <Copy size={13} className="text-[#706E69]" />
                                <span>Duplicate book</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleSendReminder(project)}
                                disabled={reminderLoadingId === project.id}
                                className="w-full text-left px-4 py-2 hover:bg-[#FAF9F6] flex items-center gap-2.5 text-blue-600 transition-colors"
                                title="Send automated WhatsApp and Email reminder to finish this project"
                              >
                                {reminderLoadingId === project.id ? (
                                  <Loader2 size={13} className="animate-spin" />
                                ) : (
                                  <Bell size={13} />
                                )}
                                <span>Send resume reminder</span>
                              </button>

                              <div className="my-1 border-t border-[#D9D6CF]/60" />

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  setDeleteModal({ isOpen: true, project });
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2.5 transition-colors"
                              >
                                <Trash2 size={13} />
                                <span>Delete book</span>
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
      {(activeFilter === 'ordered' || activeFilter === 'all') && (
        <div className="mb-14">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#0A0A0A] lowercase mb-6">
            ordered
          </h2>

          <div className="space-y-4">
            {orders.map((order) => {
              const isPrinting = order.status === 'printing' || order.status === 'production';
              const isDelivered = order.status === 'delivered';

              return (
                <div
                  key={order.id}
                  className="bg-white border border-[#D9D6CF]/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs hover:border-[#D9D6CF] transition-colors"
                >
                  {/* Left: Thumbnail & Details */}
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-[#D4CFC9]/70 overflow-hidden shrink-0">
                      {order.thumbnail || order.coverUrl ? (
                        <LazyImage
                          src={normalizeImageUrl(order.thumbnail || order.coverUrl)}
                          alt={order.title}
                          className="w-full h-full object-cover"
                          containerClassName="w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#D4CFC9]" />
                      )}
                    </div>

                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-[#0A0A0A] lowercase leading-snug">
                        {order.title}
                      </h3>
                      <p className="text-xs text-[#706E69] mt-0.5 lowercase font-mono">
                        order {order.orderNumber}
                      </p>

                      {/* Status Pill */}
                      <span
                        className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider lowercase ${
                          isPrinting
                            ? 'bg-[#0A0A0A] text-white'
                            : isDelivered
                            ? 'bg-[#E5E2DC] text-[#2A2926]'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>

                  {/* Right: Price & Buttons */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-[#D9D6CF]/40">
                    <span className="text-base sm:text-lg font-bold text-[#0A0A0A] font-sans sm:mr-2">
                      ₹{order.amount?.toLocaleString('en-IN')}
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
      <div className="pt-2 pb-16">
        <Link
          href="/faq"
          className="text-xs sm:text-sm font-medium text-[#0A0A0A] hover:underline transition-all lowercase"
        >
          need help with an order? contact support
        </Link>
      </div>

      {/* Bottom Divider and Copyright */}
      <div className="border-t border-[#D9D6CF]/70 pt-8 pb-12 text-left">
        <p className="text-xs text-[#706E69] lowercase font-normal">
          © 2026 perfectpic · made with love in India
        </p>
      </div>

      {/* Rename Modal */}
      {renameModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-[#D9D6CF] animate-in fade-in zoom-in-95">
            <h3 className="text-xl font-bold text-[#0A0A0A] lowercase mb-2">Rename book</h3>
            <p className="text-xs text-[#706E69] mb-5">Give your custom photobook a meaningful title.</p>

            <form onSubmit={handleRenameSubmit} className="space-y-4">
              <input
                type="text"
                value={renameModal.newTitle}
                onChange={(e) => setRenameModal({ ...renameModal, newTitle: e.target.value })}
                placeholder="e.g. kerala · untitled book"
                className="w-full px-4 py-3 rounded-xl border border-[#D9D6CF] text-sm text-[#0A0A0A] focus:outline-none focus:ring-1 focus:ring-black"
                autoFocus
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRenameModal({ isOpen: false, project: null, newTitle: '' })}
                  className="px-4 py-2 rounded-full text-xs font-medium text-[#706E69] hover:bg-neutral-100 transition-colors lowercase"
                >
                  cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full text-xs font-medium bg-[#0A0A0A] text-white hover:bg-black transition-colors lowercase"
                >
                  save title
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-[#D9D6CF] animate-in fade-in zoom-in-95">
            <h3 className="text-xl font-bold text-[#0A0A0A] lowercase mb-2">Delete book</h3>
            <p className="text-xs text-[#706E69] mb-6">
              Are you sure you want to delete <span className="font-semibold text-[#0A0A0A]">&ldquo;{deleteModal.project?.title}&rdquo;</span>? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: false, project: null })}
                className="px-4 py-2 rounded-full text-xs font-medium text-[#706E69] hover:bg-neutral-100 transition-colors lowercase"
              >
                cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-5 py-2 rounded-full text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors lowercase"
              >
                delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
