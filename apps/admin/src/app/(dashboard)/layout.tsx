"use client";

import { useEffect, useState } from "react";
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
  Award
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStorefrontUrl } from "@/lib/urls";
import { BrandLogo } from "@/components/brand/BrandLogo";

const navItems = [
  { name: "Executive Overview", href: "/", icon: LayoutDashboard },
  { name: "User Behaviour", href: "/analytics/behaviour", icon: Activity },
  { name: "Template Books", href: "/templates", icon: BookOpen },
  { name: "Orders", href: "/orders", icon: ShoppingCart },
  { name: "Promo Codes", href: "/promos", icon: Tag },
  { name: "Influencers", href: "/influencers", icon: Award },
  { name: "Production", href: "/production", icon: Printer },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Tickets", href: "/tickets", icon: Ticket },
  { name: "Site Config", href: "/settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<{ name: string; email: string } | null>(null);
  const [mounted, setMounted] = useState(false);

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
          setAdminUser({ name: "Admin User", email: "admin@perfectpic.in" });
        }
      } else {
        setAdminUser({ name: "Admin User", email: "admin@perfectpic.in" });
      }
      setMounted(true);
    }
  }, [router]);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_user");
    }
    router.push("/login");
  };

  if (!mounted) {
    return (
      <div className="flex h-screen bg-noir-950 items-center justify-center text-cream-50 font-sans">
        <div className="text-center">
          <p className="text-sm font-semibold tracking-widest uppercase">Verifying Admin Access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-cream-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-[260px] bg-noir-950 text-cream-50 flex flex-col flex-shrink-0">
        <div className="h-16 flex items-center justify-between px-5 border-b border-noir-800">
          <Link href="/" className="flex items-center">
            <BrandLogo variant="dark" height={28} showSubtitle={false} className="h-7 w-auto" />
          </Link>
          <span className="text-[10px] uppercase font-semibold bg-foil-gold/20 text-foil-gold px-1.5 py-0.5 rounded">Admin</span>
        </div>
        
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/");
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2.5 rounded-sm text-sm transition-colors",
                  isActive 
                    ? "bg-noir-800 border-l-2 border-foil-gold text-white font-medium" 
                    : "text-noir-300 hover:bg-noir-800/50 hover:text-white"
                )}
              >
                <Icon className="w-5 h-5 mr-3 text-noir-400" />
                {item.name}
              </Link>
            );
          })}

          <div className="pt-4 border-t border-noir-800 mt-4">
            <a
              href={getStorefrontUrl()}
              target="_blank"
              rel="noreferrer"
              className="flex items-center px-3 py-2 text-xs uppercase tracking-wider text-noir-400 hover:text-white transition-colors"
            >
              <ExternalLink className="w-4 h-4 mr-3" />
              Live Storefront
            </a>
          </div>
        </nav>
        
        <div className="p-4 border-t border-noir-800 bg-noir-900/50">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-noir-800 border border-foil-gold/30 flex items-center justify-center">
              <UserIcon className="w-4 h-4 text-foil-gold" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{adminUser?.name || "Admin User"}</p>
              <p className="text-xs text-noir-400 truncate">{adminUser?.email || "admin@perfectpic.in"}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center text-xs text-red-400 hover:text-red-300 transition-colors w-full px-2 py-1.5 rounded-sm hover:bg-noir-800/50 uppercase tracking-wider font-semibold"
          >
            <LogOut className="w-3.5 h-3.5 mr-2" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-cream-300 flex items-center justify-between px-8 flex-shrink-0">
          <div className="flex-1 max-w-lg">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-noir-400" />
              <input 
                type="text" 
                placeholder="Search orders, photobooks, customers..." 
                className="w-full pl-10 pr-4 py-2 bg-cream-50 border border-cream-200 rounded-full text-sm text-noir-900 focus:outline-none focus:border-noir-900 transition-colors"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="relative p-2 text-noir-600 hover:text-noir-900 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-cream-50"></span>
            </button>
            <div className="flex items-center gap-2 pl-2 border-l border-cream-200">
              <div className="w-8 h-8 rounded-full bg-noir-950 flex items-center justify-center text-cream-50 text-xs font-bold">
                A
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-noir-800 hidden md:inline-block">Admin</span>
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-cream-50 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
