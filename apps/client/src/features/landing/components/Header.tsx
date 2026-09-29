"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, User as UserIcon, Menu, X, ChevronDown, LogOut, Package, FolderOpen, Shield, MapPin, Settings } from "lucide-react";
import { m } from "motion/react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCartStore } from "@/stores/useCartStore";

const CATEGORIES = [
  "Travel", "Baby & First Year", "Wedding", "Birthday", "Anniversary", "Festivals", "Specials"
];

export function Header() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const { user, isAuthenticated, logout, initialize } = useAuthStore();
  const { items } = useCartStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isHome = pathname === "/";
  const loginRedirectUrl = `/login?redirect=${encodeURIComponent(pathname || '/')}`;

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        (isScrolled || !isHome)
          ? "bg-cream-50/95 backdrop-blur-md border-b border-cream-300 py-3.5 shadow-luxury-xs" 
          : "bg-transparent py-5"
      )}
    >
      <div className="container mx-auto px-4 md:px-8 flex items-center justify-between">
        {/* Mobile Menu Toggle */}
        <button 
          className="md:hidden text-noir-900"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Logo */}
        <Link href="/" className="flex-shrink-0">
          <span className="font-display font-bold text-2xl md:text-3xl tracking-[0.3em] uppercase text-noir-950">
            PerfectPic
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-8">
          <div className="group relative">
            <button className="flex items-center space-x-1 text-[11px] font-medium uppercase tracking-[0.2em] text-noir-700 hover:text-noir-950 transition-colors">
              <span>Categories</span>
              <ChevronDown size={14} />
            </button>
            <div className="absolute top-full left-0 mt-2 w-48 bg-cream-50 border border-cream-300 shadow-luxury-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-2 rounded-sm">
              {CATEGORIES.map(cat => (
                <Link key={cat} href={`/configure?category=${cat.toLowerCase().replace(/ /g, '-')}`} className="block px-4 py-2 text-sm text-noir-700 hover:bg-cream-100 hover:text-noir-950 transition-colors">
                  {cat}
                </Link>
              ))}
            </div>
          </div>
          <Link href="/templates" className="text-[11px] font-medium uppercase tracking-[0.2em] text-noir-700 hover:text-noir-950 transition-colors">
            Templates
          </Link>
          <Link href="/pricing" className="text-[11px] font-medium uppercase tracking-[0.2em] text-noir-700 hover:text-noir-950 transition-colors">
            Pricing
          </Link>
          <Link href="/faq" className="text-[11px] font-medium uppercase tracking-[0.2em] text-noir-700 hover:text-noir-950 transition-colors">
            FAQs
          </Link>
          <Link href={isAuthenticated ? "/projects" : loginRedirectUrl} className="text-[11px] font-medium uppercase tracking-[0.2em] text-noir-700 hover:text-noir-950 transition-colors">
            My Projects
          </Link>
          <Link href={isAuthenticated ? "/orders" : loginRedirectUrl} className="text-[11px] font-medium uppercase tracking-[0.2em] text-noir-700 hover:text-noir-950 transition-colors">
            Track Orders
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center space-x-4 md:space-x-5">
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-noir-900 hover:text-foil-gold transition-colors py-1 px-2 rounded hover:bg-cream-100"
              >
                <div className="w-7 h-7 rounded-full bg-noir-900 text-cream-50 flex items-center justify-center text-xs font-semibold">
                  {user.name ? user.name.slice(0, 1).toUpperCase() : 'U'}
                </div>
                <span className="hidden lg:inline-block max-w-[120px] truncate">{user.name}</span>
                <ChevronDown size={14} />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-cream-300 shadow-luxury-lg rounded-sm py-2 z-50 text-noir-900">
                  <div className="px-4 py-2 border-b border-cream-200">
                    <p className="text-sm font-semibold truncate">{user.name}</p>
                    <p className="text-xs text-noir-500 truncate">{user.email || user.phone}</p>
                    {user.role === 'admin' && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-foil-gold/20 text-foil-gold text-[10px] font-bold uppercase rounded">
                        Admin
                      </span>
                    )}
                  </div>
                  <Link 
                    href="/orders" 
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center px-4 py-2 text-xs font-medium uppercase tracking-wider hover:bg-cream-100 transition-colors"
                  >
                    <Package size={14} className="mr-2.5 text-noir-500" />
                    My Orders
                  </Link>
                  <Link 
                    href="/projects" 
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center px-4 py-2 text-xs font-medium uppercase tracking-wider hover:bg-cream-100 transition-colors"
                  >
                    <FolderOpen size={14} className="mr-2.5 text-noir-500" />
                    My Projects
                  </Link>
                  <Link 
                    href="/addresses" 
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center px-4 py-2 text-xs font-medium uppercase tracking-wider hover:bg-cream-100 transition-colors"
                  >
                    <MapPin size={14} className="mr-2.5 text-noir-500" />
                    Saved Addresses
                  </Link>
                  <Link 
                    href="/settings" 
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center px-4 py-2 text-xs font-medium uppercase tracking-wider hover:bg-cream-100 transition-colors"
                  >
                    <Settings size={14} className="mr-2.5 text-noir-500" />
                    Account Settings
                  </Link>
                  {user.role === 'admin' && (
                    <a 
                      href="http://localhost:3001" 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex items-center px-4 py-2 text-xs font-medium uppercase tracking-wider text-amber-700 hover:bg-amber-50 transition-colors"
                    >
                      <Shield size={14} className="mr-2.5" />
                      Admin Portal
                    </a>
                  )}
                  <div className="border-t border-cream-200 mt-1 pt-1">
                    <button
                      onClick={() => {
                        logout();
                        setUserDropdownOpen(false);
                      }}
                      className="w-full flex items-center px-4 py-2 text-xs font-medium uppercase tracking-wider text-red-600 hover:bg-red-50 transition-colors text-left"
                    >
                      <LogOut size={14} className="mr-2.5" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href={loginRedirectUrl}
              className="text-xs font-semibold uppercase tracking-[0.15em] text-noir-900 hover:text-foil-gold border border-noir-900/30 hover:border-foil-gold px-3 py-1.5 rounded-sm transition-colors"
            >
              Sign In
            </Link>
          )}

          <Link href="/cart" className="relative text-noir-900 hover:text-noir-700 transition-colors">
            <ShoppingCart size={20} />
            {items.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-noir-950 text-cream-50 text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                {items.length}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <m.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden bg-cream-50 border-b border-cream-300 px-4 py-6"
        >
          <nav className="flex flex-col space-y-4">
            {isAuthenticated && user && (
              <div className="pb-3 border-b border-cream-200">
                <p className="text-sm font-semibold text-noir-900">{user.name}</p>
                <p className="text-xs text-noir-500">{user.email || user.phone}</p>
              </div>
            )}
            <Link href="/configure" onClick={() => setMobileMenuOpen(false)} className="text-[11px] font-medium uppercase tracking-[0.2em] text-noir-700">Categories</Link>
            <Link href="/templates" onClick={() => setMobileMenuOpen(false)} className="text-[11px] font-medium uppercase tracking-[0.2em] text-noir-700">Templates</Link>
            <Link href="/pricing" onClick={() => setMobileMenuOpen(false)} className="text-[11px] font-medium uppercase tracking-[0.2em] text-noir-700">Pricing</Link>
            <Link href="/faq" onClick={() => setMobileMenuOpen(false)} className="text-[11px] font-medium uppercase tracking-[0.2em] text-noir-700">FAQs</Link>
            {isAuthenticated ? (
              <>
                <Link href="/orders" onClick={() => setMobileMenuOpen(false)} className="text-[11px] font-medium uppercase tracking-[0.2em] text-noir-700">My Orders</Link>
                <Link href="/projects" onClick={() => setMobileMenuOpen(false)} className="text-[11px] font-medium uppercase tracking-[0.2em] text-noir-700">My Projects</Link>
                <Link href="/addresses" onClick={() => setMobileMenuOpen(false)} className="text-[11px] font-medium uppercase tracking-[0.2em] text-noir-700">Saved Addresses</Link>
                <Link href="/settings" onClick={() => setMobileMenuOpen(false)} className="text-[11px] font-medium uppercase tracking-[0.2em] text-noir-700">Account Settings</Link>
              </>
            ) : null}
            {isAuthenticated ? (
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="text-left text-[11px] font-medium uppercase tracking-[0.2em] text-red-600 pt-2"
              >
                Sign Out
              </button>
            ) : (
              <Link href={loginRedirectUrl} onClick={() => setMobileMenuOpen(false)} className="text-[11px] font-medium uppercase tracking-[0.2em] text-foil-gold font-semibold pt-2">
                Sign In
              </Link>
            )}
          </nav>
        </m.div>
      )}
    </header>
  );
}
