"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingCart, User, Menu, X, ChevronDown } from "lucide-react";
import { m } from "motion/react";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  "Travel", "Baby & First Year", "Wedding", "Birthday", "Anniversary", "Festivals", "Specials"
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled ? "bg-cream-50/95 backdrop-blur-md border-b border-cream-300 py-3" : "bg-transparent py-5"
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
            <div className="absolute top-full left-0 mt-2 w-48 bg-cream-50 border border-cream-300 shadow-luxury-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-2">
              {CATEGORIES.map(cat => (
                <Link key={cat} href={`/configure?category=${cat.toLowerCase().replace(/ /g, '-')}`} className="block px-4 py-2 text-sm text-noir-700 hover:bg-cream-100 hover:text-noir-950 transition-colors">
                  {cat}
                </Link>
              ))}
            </div>
          </div>
          <Link href="/orders" className="text-[11px] font-medium uppercase tracking-[0.2em] text-noir-700 hover:text-noir-950 transition-colors">
            Track Orders
          </Link>
          <Link href="/pricing" className="text-[11px] font-medium uppercase tracking-[0.2em] text-noir-700 hover:text-noir-950 transition-colors">
            Pricing
          </Link>
          <Link href="/faq" className="text-[11px] font-medium uppercase tracking-[0.2em] text-noir-700 hover:text-noir-950 transition-colors">
            FAQs
          </Link>
          <Link href="/projects" className="text-[11px] font-medium uppercase tracking-[0.2em] text-noir-700 hover:text-noir-950 transition-colors">
            My Projects
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center space-x-4 md:space-x-6">
          <Link href="/settings" className="text-noir-900 hover:text-noir-700 transition-colors hidden md:block" title="Account Settings">
            <User size={20} />
          </Link>
          <Link href="/cart" className="relative text-noir-900 hover:text-noir-700 transition-colors">
            <ShoppingCart size={20} />
            <span className="absolute -top-2 -right-2 bg-noir-950 text-cream-50 text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
              {cartCount}
            </span>
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
            <Link href="/configure" className="text-[11px] font-medium uppercase tracking-[0.2em] text-noir-700">Categories</Link>
            <Link href="/orders" className="text-[11px] font-medium uppercase tracking-[0.2em] text-noir-700">Track Orders</Link>
            <Link href="/pricing" className="text-[11px] font-medium uppercase tracking-[0.2em] text-noir-700">Pricing</Link>
            <Link href="/faq" className="text-[11px] font-medium uppercase tracking-[0.2em] text-noir-700">FAQs</Link>
            <Link href="/projects" className="text-[11px] font-medium uppercase tracking-[0.2em] text-noir-700">My Projects</Link>
            <Link href="/settings" className="text-[11px] font-medium uppercase tracking-[0.2em] text-noir-700">Account Settings</Link>
          </nav>
        </m.div>
      )}
    </header>
  );
}
