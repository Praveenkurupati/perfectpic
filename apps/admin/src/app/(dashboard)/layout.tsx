"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Printer, 
  Users, 
  Ticket, 
  Settings, 
  Search, 
  Bell, 
  LogOut, 
  User as UserIcon, 
  BookOpen, 
  ExternalLink,
  Activity,
  Tag,
  Award,
  Layers,
  Boxes,
  Clock,
  Truck,
  IndianRupee,
  Compass,
  BookMarked,
  ShieldAlert,
  FileSpreadsheet,
  FileCheck2,
  AlertCircle,
  X,
  ArrowRight,
  Sparkles,
  Star
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStorefrontUrl } from "@/lib/urls";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { adminApi } from "@/lib/api";

interface NavSection {
  title: string;
  items: Array<{
    name: string;
    href: string;
    icon: any;
    badge?: string;
    badgeColor?: string;
  }>;
}

const navSections: NavSection[] = [
  {
    title: "Command Center",
    items: [
      { name: "Command Center", href: "/", icon: LayoutDashboard },
      { name: "Daily Summary", href: "/daily-summary", icon: FileCheck2 },
    ],
  },
  {
    title: "Operations & SLA",
    items: [
      { name: "Orders (360°)", href: "/orders", icon: ShoppingCart },
      { name: "SLA Intelligence", href: "/sla", icon: Clock, badge: "94.2%", badgeColor: "bg-emerald-500/20 text-emerald-400" },
      { name: "Production & Capacity", href: "/production", icon: Printer },
      { name: "Shipping & Logistics", href: "/shipping", icon: Truck },
      { name: "Customers & LTV", href: "/customers", icon: Users },
      { name: "Support & Tickets", href: "/tickets", icon: Ticket },
      { name: "Reviews & Ratings", href: "/reviews", icon: Star, badge: "4.9★", badgeColor: "bg-amber-500/20 text-amber-400" },
    ],
  },
  {
    title: "Commerce & Funnel",
    items: [
      { name: "Template Catalog", href: "/templates", icon: BookOpen },
      { name: "Page Options", href: "/pages", icon: Layers },
      { name: "Volume Bundles", href: "/bundles", icon: Boxes, badge: "4 Tiers", badgeColor: "bg-foil-gold/20 text-foil-gold" },
      { name: "Promo Codes", href: "/promos", icon: Tag },
      { name: "Abandoned Drafts & CRM", href: "/drafts", icon: Sparkles, badge: "Recovery", badgeColor: "bg-foil-gold/20 text-foil-gold" },
      { name: "Influencer Creators", href: "/influencers", icon: Award },
      { name: "Conversion Funnel", href: "/analytics/funnel", icon: Activity },
      { name: "User Behaviour", href: "/analytics/behaviour", icon: Activity },
    ],
  },
  {
    title: "Finance & Economics",
    items: [
      { name: "Financial Control", href: "/finance", icon: IndianRupee },
    ],
  },
  {
    title: "Strategy & Governance",
    items: [
      { name: "Business Model Canvas", href: "/strategy", icon: Compass },
      { name: "KPI Dictionary", href: "/kpis", icon: BookMarked },
      { name: "Team & Roles", href: "/team", icon: ShieldAlert },
      { name: "Audit Trail", href: "/audit-logs", icon: FileSpreadsheet },
      { name: "Platform Settings", href: "/settings", icon: Settings },
    ],
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<{ name: string; email: string; role?: string } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("admin_token");
      if (!token) {
        router.push("/login");
        return;
      }
      const userStr = localStorage.getItem("admin_user");
      if (userStr) {
        try {
          setAdminUser(JSON.parse(userStr));
        } catch {
          setAdminUser({ name: "Admin User", email: "admin@perfectpic.in", role: "Super Admin" });
        }
      } else {
        setAdminUser({ name: "Admin User", email: "admin@perfectpic.in", role: "Super Admin" });
      }
      setMounted(true);
    }
  }, [router]);

  useEffect(() => {
    adminApi
      .getAlerts()
      .then((res) => {
        if (res && res.alerts) setAlerts(res.alerts);
      })
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_user");
    }
    router.push("/login");
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    if (query.toUpperCase().startsWith("PP-") || !isNaN(Number(query))) {
      router.push(`/orders?search=${encodeURIComponent(query)}`);
    } else {
      router.push(`/orders?search=${encodeURIComponent(query)}`);
    }
  };

  if (!mounted) {
    return (
      <div className="flex h-screen bg-noir-950 items-center justify-center text-cream-50 font-sans">
        <div className="text-center">
          <p className="text-sm font-semibold tracking-widest uppercase">Verifying Command Center Access...</p>
        </div>
      </div>
    );
  }

  const criticalCount = alerts.filter(a => a.severity === 'critical').length;

  return (
    <div className="flex h-screen bg-cream-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-[270px] bg-noir-950 text-cream-50 flex flex-col flex-shrink-0 border-r border-noir-800">
        <div className="h-16 flex items-center justify-between px-5 border-b border-noir-800/80 bg-noir-950/80 backdrop-blur-xs">
          <Link href="/" className="flex items-center">
            <BrandLogo variant="dark" height={28} showSubtitle={false} className="h-7 w-auto" />
          </Link>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] uppercase font-mono font-bold bg-foil-gold/20 text-foil-gold px-1.5 py-0.5 rounded">
              HQ Live
            </span>
          </div>
        </div>
        
        <nav className="flex-1 py-4 px-3 space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-noir-800">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <div className="px-3 text-[10px] uppercase font-mono font-bold tracking-widest text-noir-500 mb-1.5">
                {section.title}
              </div>
              {section.items.map((item) => {
                const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/");
                const Icon = item.icon;
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-sm text-xs transition-colors",
                      isActive 
                        ? "bg-noir-800 border-l-2 border-foil-gold text-white font-semibold shadow-xs" 
                        : "text-noir-300 hover:bg-noir-800/40 hover:text-white"
                    )}
                  >
                    <div className="flex items-center min-w-0">
                      <Icon className={cn("w-4 h-4 mr-2.5 flex-shrink-0", isActive ? "text-foil-gold" : "text-noir-400")} />
                      <span className="truncate">{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className={cn("text-[9px] font-mono uppercase px-1.5 py-0.2 rounded font-bold ml-1.5", item.badgeColor || "bg-noir-800 text-noir-300")}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}

          <div className="pt-3 border-t border-noir-800/80">
            <a
              href={getStorefrontUrl()}
              target="_blank"
              rel="noreferrer"
              className="flex items-center px-3 py-2 text-xs uppercase font-mono tracking-wider text-noir-400 hover:text-foil-gold transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-2" />
              Live Storefront →
            </a>
          </div>
        </nav>
        
        <div className="p-4 border-t border-noir-800 bg-noir-900/60">
          <div className="flex items-center space-x-3 mb-2.5">
            <div className="w-8 h-8 rounded-full bg-noir-800 border border-foil-gold/40 flex items-center justify-center">
              <UserIcon className="w-4 h-4 text-foil-gold" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{adminUser?.name || "Admin User"}</p>
              <p className="text-[11px] text-noir-400 truncate font-mono">{adminUser?.role || "CEO / Administrator"}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center text-[11px] text-red-400 hover:text-red-300 transition-colors w-full px-2 py-1 rounded-sm hover:bg-noir-800/50 uppercase font-mono tracking-wider font-semibold"
          >
            <LogOut className="w-3 h-3 mr-2" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-cream-300 flex items-center justify-between px-8 flex-shrink-0 z-20">
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-lg">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-noir-400" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search orders (e.g. PP-8491), customers, SLA tickets..." 
                className="w-full pl-10 pr-12 py-2 bg-cream-50 border border-cream-300 rounded-sm text-xs text-noir-900 focus:outline-none focus:border-noir-950 font-mono transition-colors"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-noir-400 border border-cream-300 px-1.5 py-0.5 rounded bg-white">
                ↵
              </span>
            </div>
          </form>
          
          <div className="flex items-center space-x-4">
            {/* Attention Notifications Dropdown Button */}
            <div className="relative">
              <button 
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 text-noir-600 hover:text-noir-950 hover:bg-cream-100 rounded-sm transition-colors"
                title="Attention Required Center"
              >
                <Bell className="w-5 h-5" />
                {alerts.length > 0 && (
                  <span className={cn(
                    "absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full border border-white",
                    criticalCount > 0 ? "bg-red-500 animate-ping" : "bg-amber-500"
                  )} />
                )}
              </button>

              {/* Notification Drawer Popover */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white border border-cream-300 rounded-sm shadow-2xl p-4 z-50 animate-scale-up">
                  <div className="flex items-center justify-between pb-3 border-b border-cream-200 mb-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="font-serif font-bold text-sm text-noir-950">
                        Attention Required ({alerts.length})
                      </span>
                    </div>
                    <button 
                      onClick={() => setNotificationsOpen(false)}
                      className="text-noir-400 hover:text-noir-900"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2.5 max-h-80 overflow-y-auto">
                    {alerts.length === 0 ? (
                      <p className="text-xs text-noir-500 py-4 text-center">No outstanding alerts. All operations within SLA.</p>
                    ) : (
                      alerts.map((alert) => (
                        <div 
                          key={alert.id}
                          className={cn(
                            "p-3 rounded-sm border text-xs space-y-1 transition-all",
                            alert.severity === "critical" 
                              ? "bg-red-50/70 border-red-200 text-red-950" 
                              : "bg-amber-50/70 border-amber-200 text-amber-950"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-[11px] uppercase tracking-wider font-mono">
                              {alert.severity === "critical" ? "🔴 Critical" : "🟠 Warning"}
                            </span>
                            <span className="font-mono text-[10px] text-noir-400">{alert.entity}</span>
                          </div>
                          <p className="font-medium text-xs leading-snug">{alert.title}</p>
                          <p className="text-[11px] text-noir-600 line-clamp-2">{alert.reason}</p>
                          <div className="pt-1 flex items-center justify-between">
                            <span className="text-[10px] font-mono text-noir-500">Role: {alert.assignedRole}</span>
                            <Link 
                              href={alert.actionUrl}
                              onClick={() => setNotificationsOpen(false)}
                              className="inline-flex items-center gap-1 font-mono text-[10px] uppercase font-bold text-noir-950 hover:underline"
                            >
                              <span>Act</span>
                              <ArrowRight className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pl-3 border-l border-cream-200">
              <div className="w-8 h-8 rounded-full bg-noir-950 flex items-center justify-center text-cream-50 text-xs font-bold font-serif shadow-xs">
                {adminUser?.name?.charAt(0) || "P"}
              </div>
              <div className="hidden md:block text-left">
                <span className="text-xs font-semibold text-noir-900 block leading-tight">{adminUser?.name || "Administrator"}</span>
                <span className="text-[10px] font-mono uppercase text-foil-gold font-bold">Executive Access</span>
              </div>
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-cream-50 p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
