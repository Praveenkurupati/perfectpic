"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, Menu, X, ChevronDown, LogOut, Package, FolderOpen, Shield, MapPin, Settings } from "lucide-react";
import { m } from "motion/react";
import { cn } from "@/lib/utils";
import { getAdminPortalUrl } from "@/lib/urls";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCartStore } from "@/stores/useCartStore";
import { BrandLogo } from "@/components/brand/BrandLogo";

const CATEGORIES = [
  "Travel", "Baby & First Year", "Wedding", "Birthday", "Anniversary", "Festivals", "Specials"
];

export function Header() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { user, isAuthenticated, logout, initialize } = useAuthStore();
  const { items } = useCartStore();

  useEffect(() => {
    setMounted(true);
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
  const isUserAuthenticated = mounted && isAuthenticated && !!user;

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Top Announcement Bar */}
      <div className="bg-[#0A0A0A] text-[#D9D6CF] py-2 px-4 text-center text-[11px] md:text-xs font-medium tracking-wide">
        bundle &amp; save · free delivery across india · 100% reprint policy
      </div>

      {/* Main Navigation Bar */}
      <div
        className={cn(
          "transition-all duration-300 border-b border-[#D9D6CF]/70",
          (isScrolled || !isHome)
            ? "bg-[#F4F2ED]/95 backdrop-blur-md py-3 shadow-xs" 
            : "bg-[#F4F2ED] py-3.5"
        )}
      >
        <div className="container mx-auto px-4 md:px-8 flex items-center justify-between">
          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden text-[#0A0A0A] p-1"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          {/* Logo */}
          <Link href="/" className="flex-shrink-0 flex items-center" aria-label="perfectpic homepage">
            <BrandLogo variant="light" height={32} className="h-7 md:h-8 w-auto" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-7">
            <div className="group relative">
              <Link 
                href="/templates" 
                className="flex items-center space-x-1 text-xs font-medium text-[#2A2926] hover:text-[#0A0A0A] transition-colors lowercase"
              >
                <span>shop</span>
                <ChevronDown size={13} className="text-[#5C5A55]" />
              </Link>
              <div className="absolute top-full left-0 mt-2 w-48 bg-[#F4F2ED] border border-[#D9D6CF] shadow-luxury-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-2 rounded-xl">
                {CATEGORIES.map(cat => (
                  <Link 
                    key={cat} 
                    href={`/configure?category=${cat.toLowerCase().replace(/ /g, '-')}`} 
                    className="block px-4 py-1.5 text-xs text-[#2A2926] hover:bg-white hover:text-[#0A0A0A] transition-colors lowercase"
                  >
                    {cat.toLowerCase()}
                  </Link>
                ))}
              </div>
            </div>
            <Link href="/templates" className="text-xs font-medium text-[#2A2926] hover:text-[#0A0A0A] transition-colors lowercase">
              templates
            </Link>
            <Link href="/pricing" className="text-xs font-medium text-[#2A2926] hover:text-[#0A0A0A] transition-colors lowercase">
              pricing
            </Link>
            <Link href="/faq" className="text-xs font-medium text-[#2A2926] hover:text-[#0A0A0A] transition-colors lowercase">
              about
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-4 md:space-x-5">
            {isUserAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 text-xs font-medium lowercase text-[#0A0A0A] hover:text-[#5C5A55] transition-colors py-1 px-2 rounded-full hover:bg-white"
                >
                  <div className="w-7 h-7 rounded-full bg-[#0A0A0A] text-white flex items-center justify-center text-xs font-semibold">
                    {user.name ? user.name.slice(0, 1).toUpperCase() : 'u'}
                  </div>
                  <span className="hidden lg:inline-block max-w-[120px] truncate">{user.name}</span>
                  <ChevronDown size={13} />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-[#D9D6CF] shadow-luxury-lg rounded-xl py-2 z-50 text-[#0A0A0A]">
                    <div className="px-4 py-2 border-b border-[#D9D6CF]/50">
                      <p className="text-sm font-semibold truncate">{user.name}</p>
                      <p className="text-xs text-[#5C5A55] truncate">{user.email || user.phone}</p>
                      {user.role === 'admin' && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-[#0A0A0A] text-white text-[10px] font-bold lowercase rounded">
                          admin
                        </span>
                      )}
                    </div>
                    <Link 
                      href="/orders" 
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center px-4 py-2 text-xs font-medium lowercase hover:bg-[#F4F2ED] transition-colors"
                    >
                      <Package size={14} className="mr-2.5 text-[#5C5A55]" />
                      my orders
                    </Link>
                    <Link 
                      href="/projects" 
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center px-4 py-2 text-xs font-medium lowercase hover:bg-[#F4F2ED] transition-colors"
                    >
                      <FolderOpen size={14} className="mr-2.5 text-[#5C5A55]" />
                      my projects
                    </Link>
                    <Link 
                      href="/addresses" 
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center px-4 py-2 text-xs font-medium lowercase hover:bg-[#F4F2ED] transition-colors"
                    >
                      <MapPin size={14} className="mr-2.5 text-[#5C5A55]" />
                      saved addresses
                    </Link>
                    <Link 
                      href="/settings" 
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center px-4 py-2 text-xs font-medium lowercase hover:bg-[#F4F2ED] transition-colors"
                    >
                      <Settings size={14} className="mr-2.5 text-[#5C5A55]" />
                      account settings
                    </Link>
                    {user.role === 'admin' && (
                      <a 
                        href={getAdminPortalUrl()} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center px-4 py-2 text-xs font-medium lowercase text-[#0A0A0A] hover:bg-[#F4F2ED] transition-colors"
                      >
                        <Shield size={14} className="mr-2.5" />
                        admin portal
                      </a>
                    )}
                    <div className="border-t border-[#D9D6CF]/50 mt-1 pt-1">
                      <button
                        onClick={() => {
                          logout();
                          setUserDropdownOpen(false);
                        }}
                        className="w-full flex items-center px-4 py-2 text-xs font-medium lowercase text-red-600 hover:bg-red-50 transition-colors text-left"
                      >
                        <LogOut size={14} className="mr-2.5" />
                        sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href={loginRedirectUrl}
                className="text-xs font-medium lowercase text-[#0A0A0A] hover:text-[#5C5A55] transition-colors"
              >
                sign in
              </Link>
            )}

            <Link href="/cart" className="relative text-[#0A0A0A] hover:text-[#5C5A55] transition-colors p-1" aria-label="Shopping Cart">
              <ShoppingCart size={19} />
              {mounted && items.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#0A0A0A] text-white text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                  {items.length}
                </span>
              )}
            </Link>

            <Link
              href="/configure"
              className="hidden sm:inline-flex items-center justify-center rounded-full bg-[#0A0A0A] text-white hover:bg-[#2A2926] px-4 py-2 text-xs font-medium lowercase transition-colors shadow-xs"
            >
              start a book
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <m.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden bg-[#F4F2ED] border-b border-[#D9D6CF] px-6 py-6"
        >
          <nav className="flex flex-col space-y-4">
            {isUserAuthenticated && user && (
              <div className="pb-3 border-b border-[#D9D6CF]">
                <p className="text-sm font-semibold text-[#0A0A0A]">{user.name}</p>
                <p className="text-xs text-[#5C5A55]">{user.email || user.phone}</p>
              </div>
            )}
            <Link href="/templates" onClick={() => setMobileMenuOpen(false)} className="text-xs font-medium text-[#0A0A0A] lowercase">shop</Link>
            <Link href="/templates" onClick={() => setMobileMenuOpen(false)} className="text-xs font-medium text-[#0A0A0A] lowercase">templates</Link>
            <Link href="/pricing" onClick={() => setMobileMenuOpen(false)} className="text-xs font-medium text-[#0A0A0A] lowercase">pricing</Link>
            <Link href="/faq" onClick={() => setMobileMenuOpen(false)} className="text-xs font-medium text-[#0A0A0A] lowercase">about</Link>
            {isUserAuthenticated ? (
              <>
                <Link href="/orders" onClick={() => setMobileMenuOpen(false)} className="text-xs font-medium text-[#0A0A0A] lowercase">my orders</Link>
                <Link href="/projects" onClick={() => setMobileMenuOpen(false)} className="text-xs font-medium text-[#0A0A0A] lowercase">my projects</Link>
                <Link href="/addresses" onClick={() => setMobileMenuOpen(false)} className="text-xs font-medium text-[#0A0A0A] lowercase">saved addresses</Link>
                <Link href="/settings" onClick={() => setMobileMenuOpen(false)} className="text-xs font-medium text-[#0A0A0A] lowercase">account settings</Link>
                {user?.role === 'admin' && (
                  <a 
                    href={getAdminPortalUrl()} 
                    target="_blank" 
                    rel="noreferrer" 
                    onClick={() => setMobileMenuOpen(false)} 
                    className="text-xs font-medium text-[#0A0A0A] flex items-center gap-1.5 lowercase"
                  >
                    <Shield size={12} />
                    admin portal
                  </a>
                )}
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-left text-xs font-medium text-red-600 pt-2 lowercase"
                >
                  sign out
                </button>
              </>
            ) : (
              <Link href={loginRedirectUrl} onClick={() => setMobileMenuOpen(false)} className="text-xs font-medium text-[#0A0A0A] pt-2 lowercase">
                sign in
              </Link>
            )}
            <div className="pt-2">
              <Link
                href="/configure"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full inline-flex items-center justify-center rounded-full bg-[#0A0A0A] text-white py-2.5 text-xs font-medium lowercase"
              >
                start my design
              </Link>
            </div>
          </nav>
        </m.div>
      )}
    </header>
  );
}
