"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Package, FolderOpen, Settings, LogOut, User as UserIcon, MapPin } from "lucide-react";
import { Header } from "@/features/landing/components/Header";
import { Footer } from "@/features/landing/components/Footer";
import { useAuthStore } from "@/stores/useAuthStore";
import { cn } from "@/lib/utils";
import { getAdminPortalUrl } from "@/lib/urls";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout, initialize } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    initialize();
    setMounted(true);
  }, [initialize]);

  useEffect(() => {
    if (mounted && !isAuthenticated && pathname !== '/projects') {
      router.push(`/login?redirect=${encodeURIComponent(pathname || '/orders')}`);
    }
  }, [mounted, isAuthenticated, pathname, router]);

  if (pathname === '/projects') {
    return <>{children}</>;
  }

  if (!mounted || !isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col bg-cream-50">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-32 flex items-center justify-center">
          <div className="text-center">
            <p className="font-serif text-2xl mb-2 text-noir-900">Redirecting to Sign In...</p>
            <p className="text-xs text-noir-500 uppercase tracking-widest">
              Please sign in to access your account
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const navLinks = [
    { href: "/orders", label: "My Orders", icon: Package },
    { href: "/projects", label: "Saved Projects", icon: FolderOpen },
    { href: "/addresses", label: "Saved Addresses", icon: MapPin },
    { href: "/settings", label: "Account Settings", icon: Settings },
  ];

  if (pathname === '/orders' || pathname.startsWith('/track')) {
    return (
      <div className="flex min-h-screen flex-col bg-[#F4F2ED]">
        <Header />
        <main className="flex-1 pt-28 pb-20">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-cream-50">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-24 md:py-32">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 pb-4 border-b border-cream-200">
            <div>
              <h1 className="font-serif text-3xl md:text-4xl font-semibold text-noir-900">My Account</h1>
              <p className="text-xs uppercase tracking-wider text-noir-500 mt-1">
                Welcome back, {user?.name || "Customer"} ({user?.email || user?.phone})
              </p>
            </div>
            {user?.role === "admin" && (
              <a
                href={getAdminPortalUrl()}
                target="_blank"
                rel="noreferrer"
                className="mt-3 sm:mt-0 inline-flex items-center px-3 py-1.5 bg-noir-900 text-cream-50 text-xs font-semibold uppercase tracking-wider rounded-sm hover:bg-noir-800 transition-colors"
              >
                Open Admin Portal →
              </a>
            )}
          </div>
          
          <div className="flex flex-col md:flex-row gap-6 md:gap-8">
            {/* Sidebar / Mobile Pill Navigation */}
            <aside className="w-full md:w-64 shrink-0">
              <nav className="flex flex-row md:flex-col overflow-x-auto no-scrollbar gap-2 md:gap-0 md:space-y-1 pb-2 md:pb-0">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "flex items-center shrink-0 px-3 py-2 md:px-4 md:py-3 rounded-sm font-medium transition-colors text-xs md:text-sm whitespace-nowrap",
                        isActive
                          ? "bg-white border border-cream-300 text-noir-950 shadow-luxury-sm font-semibold"
                          : "text-noir-600 bg-cream-100/60 md:bg-transparent hover:bg-cream-100 hover:text-noir-950"
                      )}
                    >
                      <Icon size={16} className={cn("mr-2 md:mr-3 md:w-[18px] md:h-[18px]", isActive ? "text-foil-gold" : "text-noir-400")} />
                      {link.label}
                    </Link>
                  );
                })}

                <button
                  onClick={() => {
                    logout();
                    router.push("/");
                  }}
                  className="flex items-center shrink-0 px-3 py-2 md:px-4 md:py-3 hover:bg-red-50 hover:text-red-600 rounded-sm text-noir-600 transition-colors text-left text-xs md:text-sm whitespace-nowrap md:mt-4 bg-cream-100/60 md:bg-transparent"
                >
                  <LogOut size={16} className="mr-2 md:mr-3 md:w-[18px] md:h-[18px]" />
                  Sign Out
                </button>
              </nav>
            </aside>
            
            {/* Main Content Area */}
            <div className="flex-1">
              {children}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
