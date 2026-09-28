"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Star,
  Truck,
  ShieldCheck,
  TreePine,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Check,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  BookOpen,
  HelpCircle,
  Eye,
  Layers,
  ShieldAlert,
  Heart,
} from "lucide-react";
import { api } from "@/lib/api";
import {
  fallbackCatalog,
  getFallbackProduct,
  FallbackBook,
} from "@/features/catalog/data/catalogFallback";
import BookCard from "@/features/catalog/components/BookCard";

export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slugParam = (params?.slug as string) || "travel-series-paris";

  const fallback: FallbackBook = useMemo(
    () => (getFallbackProduct(slugParam) || fallbackCatalog[0]) as FallbackBook,
    [slugParam]
  );
  const [book, setBook] = useState<FallbackBook>(fallback);
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState<
    "cover" | "spread1" | "spread2" | "spine" | "back"
  >("cover");
  const [selectedPages, setSelectedPages] = useState<number>(32);
  const [selectedSize, setSelectedSize] = useState<string>("8.25x8.25");
  const [expandedAccordion, setExpandedAccordion] = useState<string | null>(
    "how-it-works"
  );
  const [relatedBooks, setRelatedBooks] = useState<FallbackBook[]>([]);

  // Calculate dynamic delivery date (e.g. 18 days from current day -> exactly matches '15 October' around end of September)
  const deliveryDateFormatted = useMemo(() => {
    const target = new Date();
    target.setDate(target.getDate() + 18);
    const day = target.getDate();
    const month = target.toLocaleString("en-US", { month: "long" });
    return `${day} ${month}`;
  }, []);

  // Fetch product by slug with fallback
  useEffect(() => {
    const fb: FallbackBook = (getFallbackProduct(slugParam) || fallbackCatalog[0]) as FallbackBook;
    setBook(fb);

    api
      .getProduct(slugParam)
      .then((res) => {
        if (res && (res.slug || res.displayName || res.title)) {
          setBook({
            slug: res.slug || slugParam,
            seriesLabel: res.seriesLabel || fb.seriesLabel,
            bookType: res.bookType || fb.bookType,
            title: res.title || fb.title,
            displayName: res.displayName || fb.displayName,
            tagline: res.tagline || fb.tagline,
            subtitle: res.subtitle || fb.subtitle,
            description: res.description || fb.description,
            category: res.category || fb.category,
            tags: res.tags || fb.tags,
            pageOptions: res.pageOptions || [50, 100, 150, 200, 32, 60, 120],
            coverImage: res.coverImage || fb.coverImage,
            coverColor: res.coverColor || fb.coverColor,
            spineText: res.spineText || fb.spineText,
            rating: res.rating || fb.rating,
            reviewCount: res.reviewCount || fb.reviewCount,
            fromPrice: res.fromPrice || fb.fromPrice,
            pricing: res.pricing || fb.pricing,
            basePages: res.basePages || fb.basePages,
            maxPhotos: res.maxPhotos || fb.maxPhotos,
            badge: res.badge || fb.badge,
            featured: res.featured ?? fb.featured,
            templatePhotos:
              res.templatePhotos && res.templatePhotos.length > 0
                ? res.templatePhotos
                : fb.templatePhotos,
          });
        }
      })
      .catch((err) => {
        console.warn("Using offline fallback book data:", err);
      });

    // Populate related recommendations
    const related = fallbackCatalog
      .filter((b) => b.slug !== slugParam)
      .slice(0, 3);
    setRelatedBooks(related);
  }, [slugParam]);

  // Dynamic price calculation
  const calculatedPrice = useMemo(() => {
    if (!book) return 1999;
    const base = book.fromPrice || 1999;
    const sizeAdjustment = selectedSize === "10x10" ? 500 : 0;

    // Page count adjustments
    let pageAdjustment = 0;
    switch (selectedPages) {
      case 12:
        pageAdjustment = -700;
        break;
      case 24:
        pageAdjustment = -300;
        break;
      case 32:
        pageAdjustment = 0;
        break;
      case 50:
        pageAdjustment = 0;
        break; // standard base
      case 60:
        pageAdjustment = 600;
        break;
      case 100:
        pageAdjustment = 1400;
        break;
      case 120:
        pageAdjustment = 2000;
        break;
      case 150:
        pageAdjustment = 2600;
        break;
      case 200:
        pageAdjustment = 3500;
        break;
      default:
        pageAdjustment = 0;
    }

    return Math.max(999, base + sizeAdjustment + pageAdjustment);
  }, [book, selectedPages, selectedSize]);

  const comparePrice = useMemo(() => {
    return Math.round(calculatedPrice * 1.45);
  }, [calculatedPrice]);

  const toggleAccordion = (id: string) => {
    setExpandedAccordion((prev) => (prev === id ? null : id));
  };

  const currentBook = book || fallback;
  const coverBg = currentBook.coverColor || "#F8BAC7";
  const samplePhoto1 =
    currentBook.templatePhotos?.[0] || currentBook.coverImage;
  const samplePhoto2 =
    currentBook.templatePhotos?.[1] || currentBook.coverImage;

  return (
    <div className="min-h-screen bg-[#faf8f5] text-neutral-900 font-sans antialiased pt-20 md:pt-24">
      {/* Top Breadcrumb Bar */}
      <div className="border-b border-neutral-200/80 bg-white/90 backdrop-blur-md sticky top-[60px] md:top-[68px] z-20 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3.5 flex items-center justify-between">
          <nav className="flex items-center space-x-2 text-xs text-neutral-500 font-medium lowercase">
            <Link
              href="/"
              className="hover:text-black transition-colors flex items-center gap-1"
            >
              <span>home</span>
            </Link>
            <span>/</span>
            <Link
              href="/templates"
              className="hover:text-black transition-colors"
            >
              <span>photo books</span>
            </Link>
            <span>/</span>
            <span className="text-neutral-400">{currentBook.seriesLabel}</span>
            <span>/</span>
            <span className="text-neutral-900 font-semibold">
              {currentBook.displayName || currentBook.title}
            </span>
          </nav>

          <Link
            href="/templates"
            className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-neutral-600 hover:text-black transition-colors"
          >
            <ArrowLeft size={13} />
            <span>view all series</span>
          </Link>
        </div>
      </div>

      {/* Main Product Showcase Section */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* LEFT COLUMN: Interactive 3D Mockup & Visual Spread Viewer */}
          <div className="lg:col-span-6 lg:sticky lg:top-36 space-y-6">
            {/* Main Stage Presentation Area */}
            <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 md:p-10 shadow-sm relative overflow-hidden flex flex-col items-center justify-center min-h-[480px]">
              {/* Top View Mode Pills */}
              <div className="w-full flex justify-center mb-6 z-10">
                <div className="inline-flex bg-neutral-100 p-1 rounded-full border border-neutral-200/80 text-[11px] font-medium text-neutral-600">
                  <button
                    onClick={() => setActiveView("cover")}
                    className={`px-3 py-1 rounded-full transition-all ${
                      activeView === "cover"
                        ? "bg-white text-black shadow-xs font-semibold"
                        : "hover:text-black"
                    }`}
                  >
                    Front Cover
                  </button>
                  <button
                    onClick={() => setActiveView("spread1")}
                    className={`px-3 py-1 rounded-full transition-all ${
                      activeView === "spread1"
                        ? "bg-white text-black shadow-xs font-semibold"
                        : "hover:text-black"
                    }`}
                  >
                    Inside Spread
                  </button>
                  <button
                    onClick={() => setActiveView("spine")}
                    className={`px-3 py-1 rounded-full transition-all ${
                      activeView === "spine"
                        ? "bg-white text-black shadow-xs font-semibold"
                        : "hover:text-black"
                    }`}
                  >
                    Spine & Binding
                  </button>
                  <button
                    onClick={() => setActiveView("back")}
                    className={`px-3 py-1 rounded-full transition-all ${
                      activeView === "back"
                        ? "bg-white text-black shadow-xs font-semibold"
                        : "hover:text-black"
                    }`}
                  >
                    Back Cover
                  </button>
                </div>
              </div>

              {/* View 1: 3D Standing Hardcover Book */}
              {activeView === "cover" && (
                <div className="relative py-8 flex items-center justify-center perspective-[1200px] animate-fade-in">
                  {/* Floor Shadow */}
                  <div className="absolute -bottom-6 w-56 h-8 bg-black/25 rounded-full blur-lg transform scale-x-125" />

                  {/* Standing Book Assembly */}
                  <div
                    className="relative w-56 h-72 md:w-64 md:h-80 rounded-r-[5px] flex overflow-hidden shadow-[0_28px_50px_-15px_rgba(0,0,0,0.35)] border border-black/15 transition-transform duration-500 hover:rotate-0 transform rotate-[-3deg] hover:scale-105"
                    style={{ backgroundColor: coverBg }}
                  >
                    {/* Left Spine with Real Depth Crease */}
                    <div className="w-8 bg-black/20 flex items-center justify-center border-r border-black/20 shrink-0 relative overflow-hidden">
                      <span className="text-[10px] md:text-xs font-bold text-white tracking-[0.28em] uppercase transform -rotate-90 whitespace-nowrap select-none drop-shadow-md">
                        {currentBook.spineText || "PERFECTPIC"}
                      </span>
                      <div className="absolute inset-y-0 right-0 w-[1px] bg-white/25" />
                    </div>

                    {/* Front Cover Artwork Area */}
                    <div className="flex-1 relative overflow-hidden bg-neutral-100 flex flex-col justify-between p-3.5">
                      <img
                        src={currentBook.coverImage}
                        alt={currentBook.displayName || currentBook.title}
                        className="w-full h-full object-cover absolute inset-0 transition-transform duration-700 hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/25 pointer-events-none" />

                      {/* Top Cover Typography */}
                      <div className="relative z-10">
                        <span className="font-display text-base md:text-lg font-bold tracking-[0.2em] text-white uppercase drop-shadow-md block">
                          {currentBook.spineText || "ALBUM"}
                        </span>
                        <span className="text-[9px] uppercase tracking-widest text-white/90 block drop-shadow-sm">
                          {currentBook.seriesLabel}
                        </span>
                      </div>

                      {/* Bottom Cover Title */}
                      <div className="relative z-10">
                        <p className="text-xs md:text-sm font-semibold text-white uppercase tracking-wider line-clamp-2 drop-shadow-md">
                          {currentBook.displayName || currentBook.title}
                        </p>
                        <p className="text-[9px] text-white/80 lowercase italic mt-0.5 drop-shadow-sm">
                          {currentBook.tagline}
                        </p>
                      </div>

                      {/* Right Page Edge Thickness */}
                      <div className="absolute inset-y-0 right-0 w-[4px] bg-gradient-to-l from-white/95 to-transparent pointer-events-none" />
                    </div>
                  </div>
                </div>
              )}

              {/* View 2: Open Double-Page Layflat Spread (1 photo per page + gallery margins) */}
              {activeView === "spread1" && (
                <div className="w-full max-w-lg py-6 animate-fade-in flex flex-col items-center">
                  <div className="relative w-full aspect-[16/10] bg-[#faf8f5] rounded-md shadow-2xl border border-neutral-300 flex overflow-hidden">
                    {/* Center Layflat 180° Fold Seam */}
                    <div className="absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 bg-gradient-to-r from-black/15 via-black/25 to-black/15 z-20 shadow-xs" />

                    {/* Left Page (1 Photo with Gallery Margins) */}
                    <div className="w-1/2 h-full p-4 md:p-6 bg-white flex flex-col justify-between border-r border-neutral-200/60 relative">
                      <div className="flex-1 bg-neutral-100 rounded-[2px] overflow-hidden shadow-inner border border-neutral-200 p-2 flex items-center justify-center">
                        <img
                          src={samplePhoto1}
                          alt="Left Spread Photo"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="text-center mt-2.5">
                        <span className="text-[9px] text-neutral-400 font-mono tracking-widest uppercase">
                          Page 04 — Curated Moment
                        </span>
                      </div>
                    </div>

                    {/* Right Page (1 Photo with Gallery Margins) */}
                    <div className="w-1/2 h-full p-4 md:p-6 bg-white flex flex-col justify-between relative">
                      <div className="flex-1 bg-neutral-100 rounded-[2px] overflow-hidden shadow-inner border border-neutral-200 p-2 flex items-center justify-center">
                        <img
                          src={samplePhoto2}
                          alt="Right Spread Photo"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="text-center mt-2.5">
                        <span className="text-[9px] text-neutral-400 font-mono tracking-widest uppercase">
                          Page 05 — Full Bleed Frame
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-neutral-500 font-medium text-center mt-4">
                    📖 100% Lay-Flat 180° Spread · Exactly 1 Photo Per Page with
                    Archival Gallery Margins
                  </p>
                </div>
              )}

              {/* View 3: Spine & Industrial Pur-melt Precision Binding */}
              {activeView === "spine" && (
                <div className="py-8 flex flex-col items-center animate-fade-in">
                  <div
                    className="w-16 h-72 rounded-[4px] shadow-2xl flex flex-col justify-between py-6 items-center relative overflow-hidden border border-black/20"
                    style={{ backgroundColor: coverBg }}
                  >
                    <span className="text-[9px] font-bold text-white tracking-[0.2em] uppercase transform -rotate-90 select-none">
                      PERFECTPIC
                    </span>
                    <span className="text-xs font-bold text-white tracking-[0.25em] uppercase transform -rotate-90 whitespace-nowrap select-none drop-shadow-md">
                      {currentBook.spineText || "PHOTOBOOK"}
                    </span>
                    <span className="text-[8px] font-mono text-white/80 tracking-wider">
                      {selectedPages}P
                    </span>
                    {/* Realistic crease highlight */}
                    <div className="absolute inset-y-0 left-2 w-[1px] bg-white/20" />
                    <div className="absolute inset-y-0 right-2 w-[1px] bg-black/25" />
                  </div>
                  <p className="text-xs text-neutral-600 mt-4 text-center font-medium">
                    Reinforced Archival Spine with Precision Lay-Flat Binding Core
                  </p>
                </div>
              )}

              {/* View 4: Back Cover Minimalist Showcase */}
              {activeView === "back" && (
                <div className="py-8 flex flex-col items-center animate-fade-in">
                  <div
                    className="w-56 h-72 md:w-64 md:h-80 rounded-l-[5px] shadow-2xl flex flex-col justify-between p-6 relative overflow-hidden border border-black/15"
                    style={{ backgroundColor: coverBg }}
                  >
                    <div className="text-center pt-8">
                      <span className="font-serif text-lg font-bold text-white tracking-widest uppercase block">
                        PERFECTPIC
                      </span>
                      <span className="text-[9px] text-white/80 uppercase tracking-widest block mt-1">
                        Archival Fine Art Press
                      </span>
                    </div>

                    <div className="text-center pb-4">
                      <div className="inline-block bg-white/90 px-3 py-1.5 rounded text-[9px] font-mono text-neutral-800 tracking-wider">
                        ISBN 978-81-99201-44-8
                      </div>
                      <p className="text-[8px] text-white/70 mt-1 uppercase tracking-widest">
                        Printed on 12K Indigo Synthetic Paper
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom Thumbnail Switcher Strip */}
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-neutral-100 w-full justify-center">
                <button
                  onClick={() => setActiveView("cover")}
                  className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all p-0.5 ${
                    activeView === "cover"
                      ? "border-neutral-900 scale-105"
                      : "border-neutral-200 opacity-60 hover:opacity-100"
                  }`}
                >
                  <img
                    src={currentBook.coverImage}
                    alt="Cover Thumb"
                    className="w-full h-full object-cover rounded"
                  />
                </button>
                <button
                  onClick={() => setActiveView("spread1")}
                  className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all p-0.5 bg-neutral-100 flex items-center justify-center text-xs font-serif ${
                    activeView === "spread1"
                      ? "border-neutral-900 scale-105"
                      : "border-neutral-200 opacity-60 hover:opacity-100"
                  }`}
                >
                  📖 Spread
                </button>
                <button
                  onClick={() => setActiveView("spine")}
                  className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all p-0.5 flex items-center justify-center text-xs ${
                    activeView === "spine"
                      ? "border-neutral-900 scale-105"
                      : "border-neutral-200 opacity-60 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: coverBg }}
                >
                  <span className="text-[10px] font-bold text-white uppercase transform -rotate-90">
                    Spine
                  </span>
                </button>
                <button
                  onClick={() => setActiveView("back")}
                  className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all p-0.5 flex items-center justify-center text-[10px] text-white font-medium ${
                    activeView === "back"
                      ? "border-neutral-900 scale-105"
                      : "border-neutral-200 opacity-60 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: coverBg }}
                >
                  Back
                </button>
              </div>
            </div>

            {/* Quality Seals Row */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-white border border-neutral-200/80 rounded-xl p-3.5 shadow-2xs">
                <span className="text-lg block mb-0.5">💎</span>
                <span className="text-[11px] font-bold text-neutral-900 block">
                  12K Ultra-HD
                </span>
                <span className="text-[10px] text-neutral-500">
                  HP Indigo Press
                </span>
              </div>
              <div className="bg-white border border-neutral-200/80 rounded-xl p-3.5 shadow-2xs">
                <span className="text-lg block mb-0.5">🛡️</span>
                <span className="text-[11px] font-bold text-neutral-900 block">
                  Tear-Resistant
                </span>
                <span className="text-[10px] text-neutral-500">
                  Synthetic Paper
                </span>
              </div>
              <div className="bg-white border border-neutral-200/80 rounded-xl p-3.5 shadow-2xs">
                <span className="text-lg block mb-0.5">📖</span>
                <span className="text-[11px] font-bold text-neutral-900 block">
                  180° Lay-Flat
                </span>
                <span className="text-[10px] text-neutral-500">
                  Zero Gutter Loss
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Product Configurator, Pricing, Trust Proof & Details */}
          <div className="lg:col-span-6 space-y-6">
            {/* Header: Series, Title, Rating */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold tracking-tight text-neutral-400 lowercase select-none">
                  {currentBook.seriesLabel}
                </span>
                {currentBook.badge && (
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#fcedea] text-[#d96a54] lowercase tracking-wide">
                    {currentBook.badge}
                  </span>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl font-serif font-bold text-neutral-900 tracking-tight leading-tight lowercase">
                {currentBook.displayName || currentBook.title}
              </h1>

              <p className="text-sm text-neutral-500 mt-1.5 lowercase font-normal leading-relaxed">
                {currentBook.tagline || currentBook.subtitle}
              </p>

              {/* Star Ratings Row */}
              <div className="flex items-center gap-2 mt-3">
                <div className="flex text-amber-500">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={15}
                      fill="currentColor"
                      stroke="none"
                      className="text-amber-500"
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-neutral-900">5.0</span>
                <span className="text-xs text-neutral-400 font-medium">
                  ({currentBook.reviewCount || 72} reviews)
                </span>
                <span className="text-neutral-300">·</span>
                <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                  Verified Buyer Favorite
                </span>
              </div>
            </div>

            {/* Pricing Section */}
            <div className="bg-white border border-neutral-200/90 rounded-2xl p-5 shadow-xs">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl md:text-4xl font-serif font-bold text-neutral-900 tracking-tight">
                  ₹{calculatedPrice.toLocaleString("en-IN")}
                </span>
                <span className="text-lg text-neutral-400 line-through">
                  ₹{comparePrice.toLocaleString("en-IN")}
                </span>
                <span className="text-xs font-bold text-[#d96a54] bg-[#fcedea] px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Save 31%
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Inclusive of all taxes · Free insured express delivery across
                India
              </p>
            </div>

            {/* ESTIMATED DELIVERY TICKER (User Requested Spec) */}
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-900 shrink-0">
                <Truck size={18} />
              </div>
              <div>
                <p className="text-xs text-neutral-600 font-medium lowercase">
                  order today & get it delivered by
                </p>
                <p className="text-lg font-serif font-bold text-neutral-900 tracking-tight mt-0.5">
                  {deliveryDateFormatted}
                </p>
              </div>
            </div>

            {/* ECO-IMPACT TRUST PROOF (User Requested Spec) */}
            {/* <div className="bg-[#f0f8f4] border border-[#cbe6d8] rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <TreePine size={18} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-emerald-950 lowercase">
                    1 tree planted for every 5 books sold
                  </p>
                  <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                    We partner with global reforestation programs to offset 100%
                    of print carbon.
                  </p>
                </div>
              </div>
              <div className="text-right pl-3 border-l border-emerald-200 shrink-0 hidden sm:block">
                <span className="text-xs font-bold text-emerald-900 block font-mono">
                  61,375
                </span>
                <span className="text-[10px] text-emerald-700 uppercase tracking-wider">
                  trees planted
                </span>
              </div>
            </div> */}

            {/* PAGE SELECTION CHIPS (User Requested Spec: 50, 100, 150, 200 pages + standard options) */}
            <div>
              <div className="flex justify-between items-center mb-2.5">
                <label className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                  Select Pages{" "}
                  <span className="font-normal text-neutral-500 lowercase">
                    (1 photo per page)
                  </span>
                </label>
                <span className="text-xs font-mono font-semibold text-neutral-600">
                  {selectedPages} Photos / {selectedPages} Pages
                </span>
              </div>

              {/* Primary 4 Chips requested by user: 50, 100, 150, 200 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { count: 32, label: "32", note: "Popular" },
                  { count: 50, label: "50", note: "Extended" },
                  { count: 60, label: "60", note: "Collector's" },
                  { count: 72, label: "72", note: "Collector's" },
                ].map((tier) => (
                  <button
                    key={tier.count}
                    onClick={() => setSelectedPages(tier.count)}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      selectedPages === tier.count
                        ? "border-neutral-950 bg-neutral-950 text-white shadow-md scale-[1.02]"
                        : "border-neutral-200 bg-white hover:border-neutral-400 text-neutral-900"
                    }`}
                  >
                    <span className="text-xl font-bold font-serif block leading-none">
                      {tier.label}
                    </span>
                    <span className="text-[11px] block mt-1 lowercase font-medium">
                      pages
                    </span>
                    <span
                      className={`text-[10px] block mt-1 uppercase tracking-wider ${
                        selectedPages === tier.count
                          ? "text-amber-300"
                          : "text-neutral-400"
                      }`}
                    >
                      {tier.note}
                    </span>
                  </button>
                ))}
              </div>

              {/* Secondary Options Pills (12, 24, 32, 60, 120 pages) */}
              <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1">
                <span className="text-[11px] text-neutral-400 lowercase shrink-0">
                  other sizes:
                </span>
                {[12, 24, 120].map((p) => (
                  <button
                    key={p}
                    onClick={() => setSelectedPages(p)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors shrink-0 ${
                      selectedPages === p
                        ? "bg-neutral-800 text-white border-neutral-800"
                        : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400"
                    }`}
                  >
                    {p} pages
                  </button>
                ))}
              </div>
            </div>

            {/* BOOK FORMAT & DIMENSIONS SELECTOR */}
            <div>
              <label className="text-xs font-bold text-neutral-900 uppercase tracking-wider block mb-2.5">
                Book Dimensions & Format
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSelectedSize("8.25x8.25")}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    selectedSize === "8.25x8.25"
                      ? "border-neutral-900 bg-neutral-900 text-white shadow-sm"
                      : "border-neutral-200 bg-white hover:border-neutral-400 text-neutral-900"
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-bold">
                      8.25&quot; × 8.25&quot; Square
                    </span>
                    <span
                      className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded ${
                        selectedSize === "8.25x8.25"
                          ? "bg-white/20 text-white"
                          : "bg-neutral-100 text-neutral-600"
                      }`}
                    >
                      Included
                    </span>
                  </div>
                  <p
                    className={`text-xs ${selectedSize === "8.25x8.25" ? "text-neutral-300" : "text-neutral-500"}`}
                  >
                    Our most popular format for coffee tables & bookshelf
                    display.
                  </p>
                </button>

                <button
                  onClick={() => setSelectedSize("10x10")}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    selectedSize === "10x10"
                      ? "border-neutral-900 bg-neutral-900 text-white shadow-sm"
                      : "border-neutral-200 bg-white hover:border-neutral-400 text-neutral-900"
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-bold">
                      10&quot; × 10&quot; Grand Square
                    </span>
                    <span
                      className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded ${
                        selectedSize === "10x10"
                          ? "bg-amber-300 text-neutral-950 font-bold"
                          : "bg-neutral-100 text-neutral-600"
                      }`}
                    >
                      +₹500
                    </span>
                  </div>
                  <p
                    className={`text-xs ${selectedSize === "10x10" ? "text-neutral-300" : "text-neutral-500"}`}
                  >
                    Expansive gallery scale for dramatic panoramic landscape
                    spreads.
                  </p>
                </button>
              </div>
            </div>

            {/* ACTION BUTTONS (Start My Design / Smart Creation with AI) */}
            <div className="space-y-3 pt-2">
              {/* Primary CTA: Start My Design */}
              <Link
                href={`/configure?template=${encodeURIComponent(currentBook.slug)}&pages=${selectedPages}&size=${encodeURIComponent(selectedSize)}`}
                className="w-full py-4 px-6 rounded-full bg-[#363636] hover:bg-black text-white text-center text-base font-semibold tracking-tight transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 group"
              >
                <span>start my design</span>
                <ArrowRight
                  size={18}
                  className="transform group-hover:translate-x-1 transition-transform"
                />
              </Link>

              {/* Secondary CTA: Smart Creation with AI */}
              {/* <Link
                href={`/upload/new-project?template=${encodeURIComponent(currentBook.slug)}&pages=${selectedPages}&size=${encodeURIComponent(selectedSize)}&mode=ai`}
                className="w-full py-3.5 px-6 rounded-full bg-white hover:bg-neutral-50 border-2 border-neutral-900 text-neutral-950 text-center text-sm font-semibold tracking-tight transition-all duration-200 flex items-center justify-center gap-2 shadow-2xs"
              >
                <Sparkles size={16} className="text-amber-500" />
                <span>smart creation with AI (instant auto-build)</span>
              </Link>

              <div className="text-center pt-1">
                <Link
                  href={`/upload/new-project?template=${encodeURIComponent(currentBook.slug)}&pages=${selectedPages}&size=${encodeURIComponent(selectedSize)}&mode=scratch`}
                  className="text-xs text-neutral-500 hover:text-black underline underline-offset-4 font-medium transition-colors"
                >
                  or start from scratch with blank canvas
                </Link>
              </div> */}
            </div>

            {/* Key Features Bullet List */}
            <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 space-y-2.5 text-xs text-neutral-700">
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Check size={12} strokeWidth={3} />
                </div>
                <span>
                  <strong>Exactly 1 photo per page</strong> with elegant white
                  gallery margins
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Check size={12} strokeWidth={3} />
                </div>
                <span>
                  <strong>100% Lay-Flat binding</strong> opens flat at 180° with
                  zero gutter distortion
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Check size={12} strokeWidth={3} />
                </div>
                <span>
                  <strong>Archival 12K Ultra-HD printing</strong> on
                  non-tearable synthetic paper
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Check size={12} strokeWidth={3} />
                </div>
                <span>
                  Water-resistant, smudge-proof, and fingerprint-resistant satin
                  finish
                </span>
              </div>
            </div>

            {/* ACCORDION DISCLOSURES (Exact User Copy) */}
            <div className="space-y-3 pt-2">
              {/* Accordion 1: How It Works */}
              <div className="border border-neutral-200/90 bg-white rounded-2xl overflow-hidden transition-all">
                <button
                  onClick={() => toggleAccordion("how-it-works")}
                  className="w-full p-5 flex items-center justify-between text-left hover:bg-neutral-50/50 transition-colors"
                >
                  <span className="text-sm font-bold text-neutral-900">
                    How It Works
                  </span>
                  {expandedAccordion === "how-it-works" ? (
                    <ChevronUp size={18} />
                  ) : (
                    <ChevronDown size={18} />
                  )}
                </button>
                {expandedAccordion === "how-it-works" && (
                  <div className="px-5 pb-5 pt-1 text-xs text-neutral-600 space-y-3 leading-relaxed border-t border-neutral-100">
                    <p>
                      Simply select one of our beautiful templates from the
                      catalog and click <strong>“start my design”</strong>. This
                      will mean your chosen template will populate as the front
                      and back cover in the editor.
                    </p>
                    <p>
                      Once you have clicked <strong>“start my design”</strong>{" "}
                      or <strong>“start from scratch”</strong> you’ll have 2
                      options: <strong>smart creation with AI</strong> or create
                      your book manually.
                    </p>
                    <p>
                      <strong>Smart creation</strong> will instantly craft your
                      project for you, picking the best images, skipping
                      duplicates and poor quality shots, while organizing
                      everything without you lifting a finger.
                    </p>
                    <p>
                      Both options allow you to fully customize every single
                      page, captions, layout, and finish before placing your
                      order.
                    </p>
                  </div>
                )}
              </div>

              {/* Accordion 2: Product Specifications */}
              <div className="border border-neutral-200/90 bg-white rounded-2xl overflow-hidden transition-all">
                <button
                  onClick={() => toggleAccordion("specifications")}
                  className="w-full p-5 flex items-center justify-between text-left hover:bg-neutral-50/50 transition-colors"
                >
                  <span className="text-sm font-bold text-neutral-900">
                    Product Specifications
                  </span>
                  {expandedAccordion === "specifications" ? (
                    <ChevronUp size={18} />
                  ) : (
                    <ChevronDown size={18} />
                  )}
                </button>
                {expandedAccordion === "specifications" && (
                  <div className="px-5 pb-5 pt-1 text-xs text-neutral-600 space-y-3 leading-relaxed border-t border-neutral-100">
                    <div>
                      <h4 className="font-semibold text-neutral-900 mb-1">
                        Hardcover Perfect Binding
                      </h4>
                      <p>
                        A5 (5.8&quot; × 8.3&quot;) & A4 (8.3&quot; × 11.7&quot;)
                        with gloss finish.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-neutral-900 mb-1">
                        Lay-Flat Photobooks
                      </h4>
                      <p>
                        A4 (8.3&quot; × 11.7&quot;) & Square (8.25&quot; ×
                        8.25&quot;, 10&quot; × 10&quot;) with premium
                        luster/matte finish.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-neutral-900 mb-1">
                        Print Technology & Paper Substrate
                      </h4>
                      <p>
                        Archival 12K Ultra-HD Indigo printing on non-tearable
                        synthetic paper. 100% waterproof and smudge-proof.
                      </p>
                    </div>

                    <div className="p-3 bg-neutral-50 rounded-xl text-neutral-500 italic">
                      Note: All sizes, page counts, and cover options are
                      selectable in editor before ordering.
                    </div>
                  </div>
                )}
              </div>

              {/* Accordion 3: Shipping & Delivery */}
              <div className="border border-neutral-200/90 bg-white rounded-2xl overflow-hidden transition-all">
                <button
                  onClick={() => toggleAccordion("shipping")}
                  className="w-full p-5 flex items-center justify-between text-left hover:bg-neutral-50/50 transition-colors"
                >
                  <span className="text-sm font-bold text-neutral-900">
                    Shipping & Delivery
                  </span>
                  {expandedAccordion === "shipping" ? (
                    <ChevronUp size={18} />
                  ) : (
                    <ChevronDown size={18} />
                  )}
                </button>
                {expandedAccordion === "shipping" && (
                  <div className="px-5 pb-5 pt-1 text-xs text-neutral-600 space-y-3 leading-relaxed border-t border-neutral-100">
                    <div>
                      <h4 className="font-semibold text-neutral-900 mb-1">
                        Domestic PAN-India Express Delivery
                      </h4>
                      <p>
                        3–7 business days via BlueDart & Delhivery with
                        end-to-end SMS & WhatsApp live tracking.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-neutral-900 mb-1">
                        Global Worldwide Shipping
                      </h4>
                      <p>
                        We deliver worldwide via DHL Express. Estimated transit
                        windows:
                      </p>
                      <ul className="list-disc pl-5 mt-1 space-y-1">
                        <li>
                          <strong>Singapore & UAE:</strong> 3–6 business days
                        </li>
                        <li>
                          <strong>United Kingdom:</strong> 4–7 business days
                        </li>
                        <li>
                          <strong>Austria, Belgium, France, Germany:</strong>{" "}
                          5–8 business days
                        </li>
                        <li>
                          <strong>United States & Canada:</strong> 5–9 business
                          days
                        </li>
                        <li>
                          <strong>Australia & New Zealand:</strong> 6–10
                          business days
                        </li>
                        <li>
                          <strong>Rest of the World:</strong> 7–14 business days
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-neutral-900 mb-1">
                        Packaging
                      </h4>
                      <p>
                        Every book is individually shrink-wrapped and encased in
                        our crushproof reinforced eco-mailer with water barrier.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Accordion 4: 30-Day Guarantee & Free Reprint Policy */}
              <div className="border border-neutral-200/90 bg-white rounded-2xl overflow-hidden transition-all">
                <button
                  onClick={() => toggleAccordion("guarantee")}
                  className="w-full p-5 flex items-center justify-between text-left hover:bg-neutral-50/50 transition-colors"
                >
                  <span className="text-sm font-bold text-neutral-900">
                    30-Day Guarantee & Free Reprints
                  </span>
                  {expandedAccordion === "guarantee" ? (
                    <ChevronUp size={18} />
                  ) : (
                    <ChevronDown size={18} />
                  )}
                </button>
                {expandedAccordion === "guarantee" && (
                  <div className="px-5 pb-5 pt-1 text-xs text-neutral-600 space-y-3 leading-relaxed border-t border-neutral-100">
                    <p>
                      We stand 100% behind our precision quality. If your
                      photobook arrives damaged in transit, with manufacturing
                      defects, or binding flaws, contact us at{" "}
                      <a
                        href="mailto:support@perfectpic.in"
                        className="text-neutral-900 font-bold underline"
                      >
                        support@perfectpic.in
                      </a>{" "}
                      within 30 days of delivery.
                    </p>
                    <p>
                      Simply attach photos of the issue, and our team will issue
                      an immediate <strong>100% free reprint</strong> with
                      priority express shipping.
                    </p>
                    <p className="text-neutral-500 italic">
                      Note: While our automated editor flags low-resolution
                      images, we cannot offer reprints for user typos or
                      intentional low-res photos approved during preview.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recommended More Editions Carousel */}
      <div className="bg-white border-t border-neutral-200 py-16 px-4 md:px-8 mt-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-8">
            <div>
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest block mb-1">
                Curated Catalog
              </span>
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-neutral-900">
                Explore More Curated Editions
              </h2>
            </div>
            <Link
              href="/templates"
              className="text-xs font-bold text-neutral-900 hover:underline uppercase tracking-wider hidden sm:block"
            >
              Browse All Series →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedBooks.map((relBook) => (
              <BookCard key={relBook.slug} book={relBook as any} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
