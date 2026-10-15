"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { useCartStore } from "@/stores/useCartStore";

export default function NotFound() {
  const [mounted, setMounted] = useState(false);
  const { items } = useCartStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const cartCount = mounted
    ? items.reduce((sum, item) => sum + (item.quantity || 1), 0)
    : 0;

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
                className="text-xs md:text-sm font-medium text-[#2A2926] hover:text-[#0A0A0A] transition-colors lowercase"
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

            {/* Cart Pill Button */}
            <Link
              href="/cart"
              className="border border-[#0A0A0A] rounded-full px-5 py-2 text-xs md:text-sm font-medium text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white transition-all lowercase"
              aria-label="Shopping Cart"
            >
              cart ({cartCount})
            </Link>
          </div>
        </header>
      </div>

      {/* 3. Center 404 Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-16 sm:py-24 max-w-2xl mx-auto">
        <h1 className="text-8xl sm:text-9xl font-bold tracking-tight text-[#0A0A0A] select-none leading-none">
          404
        </h1>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#0A0A0A] mt-5 mb-2 lowercase">
          page not found.
        </h2>

        <p className="text-xs sm:text-sm md:text-base text-[#706E69] font-normal mb-8 max-w-md">
          the page you’re looking for has moved or doesn’t exist.
        </p>

        <Link
          href="/"
          className="inline-flex items-center justify-center bg-[#0A0A0A] hover:bg-black text-white px-8 py-3.5 rounded-full text-xs md:text-sm font-medium transition-all shadow-xs lowercase active:scale-98"
        >
          back to home
        </Link>
      </main>

      {/* 4. Footer */}
      <footer className="border-t border-[#D9D6CF]/70 py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <p className="text-xs text-[#706E69] lowercase font-normal">
          © 2026 perfectpic · made with love in india
        </p>
      </footer>
    </div>
  );
}
