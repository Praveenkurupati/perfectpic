"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  User as UserIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Orders", href: "/orders", icon: ShoppingCart },
  { name: "Production", href: "/production", icon: Printer },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Tickets", href: "/tickets", icon: Ticket },
  { name: "Site Config", href: "/settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-cream-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[260px] bg-noir-950 text-cream-50 flex flex-col flex-shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-noir-800">
          <span className="text-lg tracking-[0.2em] uppercase font-bold text-cream-50">PerfectPic</span>
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
                    ? "bg-noir-800 border-l-2 border-foil-gold text-white" 
                    : "text-noir-300 hover:bg-noir-800/50 hover:text-white"
                )}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-noir-800">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-noir-800 flex items-center justify-center">
              <UserIcon className="w-4 h-4 text-cream-50" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Admin User</p>
              <p className="text-xs text-noir-400 truncate">admin@perfectpic.in</p>
            </div>
          </div>
          <Link href="/login" className="flex items-center text-sm text-noir-400 hover:text-white transition-colors w-full px-2 py-2 rounded-sm hover:bg-noir-800/50">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-cream-50 border-b border-cream-300 flex items-center justify-between px-8 flex-shrink-0">
          <div className="flex-1 max-w-lg">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-noir-400" />
              <input 
                type="text" 
                placeholder="Search orders, customers..." 
                className="w-full pl-10 pr-4 py-2 bg-cream-100 border-none rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-noir-300 transition-shadow"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="relative p-2 text-noir-600 hover:text-noir-900 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-cream-50"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-noir-950 flex items-center justify-center cursor-pointer">
              <UserIcon className="w-4 h-4 text-cream-50" />
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
