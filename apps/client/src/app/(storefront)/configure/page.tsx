"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronRight, ArrowRight, Check, Image as ImageIcon, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { trackEvent } from "@/lib/analytics";

function ConfigureContent() {
  const searchParams = useSearchParams();
  const templateSlug = searchParams.get("template");
  const categoryParam = searchParams.get("category");
  const pagesParam = searchParams.get("pages");
  const sizeParam = searchParams.get("size");

  const [step, setStep] = useState(1);
  const [size, setSize] = useState(sizeParam || "8.25x8.25");
  const [pageCount, setPageCount] = useState<number>(pagesParam ? (parseInt(pagesParam, 10) || 32) : 32);
  const [cover, setCover] = useState("cov-1");
  const [theme, setTheme] = useState("theme-1");
  const [color, setColor] = useState("col-1");
  const [packaging, setPackaging] = useState("pack-1");

  const [configData, setConfigData] = useState<any>(null);
  const [templateData, setTemplateData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fallback defaults if API is not running
  const defaultConfig = {
    sizes: [
      { id: "8.25x8.25", name: '8.25" × 8.25" Square', size: '8.25" × 8.25"', price: 1999, description: 'Our most popular size, perfect for coffee tables and bookshelf display.' },
      { id: "10x10", name: '10" × 10" Grand Square', size: '10" × 10"', price: 2499, description: 'Expansive gallery scale for panoramic spreads and grand memories.' }
    ],
    pageOptions: [
      { count: 32, name: '32 Pages', photos: 32, badge: 'Popular', priceAdjustment: 0, default: true, description: '32 photo slots (1 photo per page). Our most popular standard edition.' },
      { count: 50, name: '50 Pages', photos: 50, badge: 'Extended', priceAdjustment: 600, default: false, description: '50 photo slots (1 photo per page). Extended journey with generous story room.' },
      { count: 60, name: '60 Pages', photos: 60, badge: "Collector's", priceAdjustment: 1000, default: false, description: '60 photo slots (1 photo per page). Curated archival album.' },
      { count: 72, name: '72 Pages', photos: 72, badge: "Collector's", priceAdjustment: 1400, default: false, description: '72 photo slots (1 photo per page). Deluxe milestone celebration chronicle.' },
      { count: 12, name: '12 Pages', photos: 12, badge: '', priceAdjustment: -700, default: false, description: '12 photo slots (1 photo per page). Compact pocket keepsake.' },
      { count: 24, name: '24 Pages', photos: 24, badge: '', priceAdjustment: -300, default: false, description: '24 photo slots (1 photo per page). Weekend getaway edition.' },
      { count: 120, name: '120 Pages', photos: 120, badge: "Collector's Master", priceAdjustment: 2800, default: false, description: '120 photo slots (1 photo per page). Comprehensive annual encyclopedia.' }
    ],
    covers: [
      { id: "cov-1", name: "Hardcover Laminar", desc: "Silky matte anti-scratch lamination with rigid luxury board", price: 0 },
      { id: "cov-2", name: "Hardcover Vegan Leather", desc: "Supple premium Italian leatherette with foil debossing", price: 500 },
      { id: "cov-3", name: "Softcover Artisan", desc: "Lightweight flexible softcover with velvety touch", price: -300 }
    ],
    themes: [
      { id: "theme-1", name: "Minimal Modern", desc: "Sleek layouts, ample breathing room, editorial typography." },
      { id: "theme-2", name: "Classic Cream", desc: "Timeless borders, warm ivory tones, serif accents." },
      { id: "theme-3", name: "Dark Luxe", desc: "Dramatic obsidian pages with vivid color contrast." },
      { id: "theme-4", name: "Wanderlust", desc: "Story-driven spreads with GPS stamps and journey maps." },
      { id: "theme-5", name: "Romance", desc: "Delicate floral embellishments and soft pastel hues." }
    ],
    colors: [
      { id: "col-1", name: "Ivory White", hex: "#FAF8F5" },
      { id: "col-2", name: "Midnight Black", hex: "#0A0A0A" },
      { id: "col-3", name: "Dusty Rose", hex: "#D8A47F" },
      { id: "col-4", name: "Ocean Blue", hex: "#3B606E" },
      { id: "col-5", name: "Forest Green", hex: "#2D4A3E" }
    ],
    packaging: [
      { id: "pack-1", name: "Standard Eco Box", price: 0, desc: "Recyclable protective rigid packaging with dust pouch." },
      { id: "pack-2", name: "Luxury Keepsake Box", price: 499, desc: "Cloth-bound magnetic clamshell box with ribbon pull." },
      { id: "pack-3", name: "Gilded Gift Packaging", price: 199, desc: "Hand-wrapped in bespoke parchment paper with wax seal." }
    ]
  };

  // Helper to normalize API data
  const normalizeSizes = (raw?: any[]) => raw?.map((s: any) => ({
    id: s.dimensions || s.id || s.name,
    name: s.name,
    size: s.dimensions ? `${s.dimensions.replace('x', '" × ')}"` : s.size || s.name,
    price: s.basePrice ?? s.price ?? 1999,
    description: s.description || ''
  })) || defaultConfig.sizes;

  const normalizeCovers = (raw?: any[]) => raw?.map((c: any) => ({
    id: c.id,
    name: c.name,
    desc: c.description || c.desc || (c.included ? 'Included by default' : ''),
    price: c.priceAdjustment ?? c.price ?? 0,
  })) || defaultConfig.covers;

  const normalizeThemes = (raw?: any[]) => raw?.map((t: any) => ({
    id: t.id,
    name: t.name,
    desc: t.desc || '',
  })) || defaultConfig.themes;

  const normalizeColors = (raw?: any[]) => raw?.map((c: any) => ({
    id: c.id,
    name: c.name,
    hex: c.hex || '#FAF8F5',
  })) || defaultConfig.colors;

  const normalizePackaging = (raw?: any[]) => raw?.map((p: any) => ({
    id: p.id,
    name: p.name,
    desc: p.description || p.desc || '',
    price: p.priceAdjustment ?? p.price ?? 0,
  })) || defaultConfig.packaging;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [configRes, pageOptionsRes] = await Promise.all([
          api.getProductConfig().catch(() => null),
          api.getPageOptions().catch(() => null),
        ]);

        const dynamicPageOptions = (pageOptionsRes && pageOptionsRes.pageOptions && pageOptionsRes.pageOptions.length > 0)
          ? pageOptionsRes.pageOptions
          : (configRes?.pageCountOptions || defaultConfig.pageOptions);

        setConfigData({
          sizes: normalizeSizes(configRes?.sizes),
          pageOptions: dynamicPageOptions,
          covers: normalizeCovers(configRes?.covers),
          themes: normalizeThemes(configRes?.themes),
          colors: normalizeColors(configRes?.colors),
          packaging: normalizePackaging(configRes?.packaging),
        });

        if (templateSlug) {
          const tplRes = await api.getProduct(templateSlug);
          setTemplateData(tplRes);
          if (tplRes?.defaultOptions) {
            if (tplRes.defaultOptions.size) setSize(tplRes.defaultOptions.size);
            if (tplRes.defaultOptions.cover) setCover(tplRes.defaultOptions.cover);
            if (tplRes.defaultOptions.theme) setTheme(tplRes.defaultOptions.theme);
            if (tplRes.defaultOptions.color) setColor(tplRes.defaultOptions.color);
            if (tplRes.defaultOptions.packaging) setPackaging(tplRes.defaultOptions.packaging);
          }
        }
      } catch (err) {
        console.warn("Failed to load backend config, using defaults", err);
        setConfigData(defaultConfig);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateSlug, categoryParam]);

  if (loading || !configData) {
    return (
      <div className="container mx-auto px-4 py-32 flex justify-center items-center min-h-screen">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-noir-950 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-noir-700 font-serif">Loading customization studio...</p>
        </div>
      </div>
    );
  }

  const sizes = configData.sizes;
  const pageOptions = configData.pageOptions || defaultConfig.pageOptions;
  const covers = configData.covers;
  const themes = configData.themes;
  const colors = configData.colors;
  const packagings = configData.packaging;

  const currentSizeObj = sizes.find((s: any) => s.id === size) || sizes[0];
  const currentPageOption = pageOptions.find((p: any) => p.count === pageCount) || pageOptions[0];
  const currentCoverObj = covers.find((c: any) => c.id === cover) || covers[0];
  const currentThemeObj = themes.find((t: any) => t.id === theme) || themes[0];
  const currentColorObj = colors.find((c: any) => c.id === color) || colors[0];
  const currentPackagingObj = packagings.find((p: any) => p.id === packaging) || packagings[0];

  // Primary capacity editions requested: 32 (Popular), 50 (Extended), 60 (Collector's), 72 (Collector's)
  const primaryCounts = [32, 50, 60, 72];
  const primaryPageOptions = pageOptions
    .filter((opt: any) => primaryCounts.includes(opt.count))
    .sort((a: any, b: any) => primaryCounts.indexOf(a.count) - primaryCounts.indexOf(b.count));
  const otherPageOptions = pageOptions
    .filter((opt: any) => !primaryCounts.includes(opt.count))
    .sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0) || a.count - b.count);

  const basePrice = currentSizeObj?.price || 1999;
  const pageAdjustment = currentPageOption?.priceAdjustment || 0;
  const coverPrice = currentCoverObj?.price || 0;
  const packagingPrice = currentPackagingObj?.price || 0;
  const currentPrice = basePrice + pageAdjustment + coverPrice + packagingPrice;

  return (
    <div className="container mx-auto px-4 py-12 md:py-20 min-h-screen">
      {/* Template Header if template was selected */}
      {templateData && (
        <div className="mb-10 p-6 md:p-8 bg-cream-100 border border-cream-300 rounded-sm shadow-luxury-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 shrink-0 bg-white shadow-sm overflow-hidden rounded-sm border border-cream-300">
                <img 
                  src={templateData.coverImage || "https://images.unsplash.com/photo-1544928147-79a2dbc1f389?w=300&q=80"} 
                  alt={templateData.title} 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-foil-gold mb-1">
                  <Sparkles size={12} />
                  <span>{templateData.category} Template • {templateData.badge || 'Selected'}</span>
                </div>
                <h2 className="font-serif text-2xl md:text-3xl font-medium text-noir-950">{templateData.displayName || templateData.title}</h2>
                <p className="text-xs md:text-sm text-noir-600 mt-1 max-w-xl">{templateData.subtitle || templateData.description}</p>
                {templateData.tags && templateData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {templateData.tags.map((t: string, i: number) => (
                      <span key={i} className="text-[10px] bg-cream-200/80 text-noir-700 px-2 py-0.5 rounded-sm font-mono">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="text-left md:text-right shrink-0">
              <span className="text-xs text-noir-500 block">Editorial Layout Standard</span>
              <span className="font-medium text-sm text-noir-900 block mt-0.5">
                Exactly 1 Photo Per Page • Gallery Margins
              </span>
              <span className="text-xs text-noir-600 font-mono mt-1 block">
                {pageCount} Pages ({pageCount} Photos Total)
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-4 border-b border-cream-200">
        <div>
          <h1 className="font-serif text-3xl md:text-5xl text-noir-950 font-medium">Configure Your Photobook</h1>
          <p className="text-sm text-noir-600 mt-1">Select size, page count, cover material, theme styling, and packaging.</p>
        </div>
      </div>

      {/* Step Indicator Tabs */}
      <div className="flex items-center space-x-2 text-xs uppercase tracking-[0.2em] font-semibold text-noir-600 mb-10 overflow-x-auto pb-3">
        <button onClick={() => setStep(1)} className={cn("px-3 py-1.5 rounded-sm transition-colors", step === 1 ? "bg-noir-950 text-cream-50" : "hover:text-noir-950")}>
          1. Size
        </button>
        <ChevronRight size={14} className="text-cream-400 shrink-0" />
        <button onClick={() => setStep(2)} className={cn("px-3 py-1.5 rounded-sm transition-colors", step === 2 ? "bg-noir-950 text-cream-50" : "hover:text-noir-950")}>
          2. Pages
        </button>
        <ChevronRight size={14} className="text-cream-400 shrink-0" />
        <button onClick={() => setStep(3)} className={cn("px-3 py-1.5 rounded-sm transition-colors", step === 3 ? "bg-noir-950 text-cream-50" : "hover:text-noir-950")}>
          3. Cover
        </button>
        <ChevronRight size={14} className="text-cream-400 shrink-0" />
        <button onClick={() => setStep(4)} className={cn("px-3 py-1.5 rounded-sm transition-colors", step === 4 ? "bg-noir-950 text-cream-50" : "hover:text-noir-950")}>
          4. Theme
        </button>
        <ChevronRight size={14} className="text-cream-400 shrink-0" />
        <button onClick={() => setStep(5)} className={cn("px-3 py-1.5 rounded-sm transition-colors", step === 5 ? "bg-noir-950 text-cream-50" : "hover:text-noir-950")}>
          5. Color
        </button>
        <ChevronRight size={14} className="text-cream-400 shrink-0" />
        <button onClick={() => setStep(6)} className={cn("px-3 py-1.5 rounded-sm transition-colors", step === 6 ? "bg-noir-950 text-cream-50" : "hover:text-noir-950")}>
          6. Packaging
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-10">
          
          {/* Step 1: Size */}
          <section className={step === 1 ? "block" : "hidden"}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-2xl text-noir-950">Step 1: Choose Your Book Size</h2>
              <span className="text-xs text-noir-500">100% Lay-Flat Synthetic Paper</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sizes.map((s: any) => (
                <button 
                  key={s.id}
                  onClick={() => { setSize(s.id); }}
                  className={cn(
                    "p-6 border rounded-sm text-left transition-all relative flex flex-col justify-between",
                    size === s.id 
                      ? "border-noir-950 bg-cream-100 shadow-luxury-md ring-1 ring-noir-950" 
                      : "border-cream-300 hover:border-noir-900 bg-white"
                  )}
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-16 h-16 bg-cream-200 border border-cream-300 flex items-center justify-center font-serif text-sm font-semibold">
                        {s.size?.split(' ')[0] || s.id}
                      </div>
                      {size === s.id && (
                        <span className="w-6 h-6 bg-noir-950 text-cream-50 rounded-full flex items-center justify-center">
                          <Check size={14} />
                        </span>
                      )}
                    </div>
                    <h3 className="font-serif text-xl font-medium text-noir-950">{s.name}</h3>
                    <p className="text-xs text-noir-600 mt-1 leading-relaxed">{s.description}</p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-cream-200 flex justify-between items-baseline">
                    <span className="text-xs text-noir-500">Base Price (32 Pages)</span>
                    <span className="font-serif text-xl font-semibold text-noir-950">₹{s.price.toLocaleString('en-IN')}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-8 flex justify-end">
              <button 
                onClick={() => setStep(2)} 
                className="flex items-center px-8 py-3.5 bg-noir-950 text-cream-50 text-sm font-medium rounded-sm hover:bg-noir-900 transition-colors"
              >
                <span>Continue to Page Count</span>
                <ChevronRight size={16} className="ml-2" />
              </button>
            </div>
          </section>

          {/* Step 2: Select Pages (1 photo per page) */}
          <section className={step === 2 ? "block" : "hidden"}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="font-serif text-2xl md:text-3xl text-noir-950">
                  Step 2: Select Pages (1 photo per page)
                </h2>
                <p className="text-xs text-noir-600 mt-1">
                  Archival fine-art standard: Exactly <strong>1 photo per page</strong> surrounded by generous gallery margins.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-cream-200/80 border border-cream-300 rounded-full text-xs font-mono text-noir-950 font-bold self-start sm:self-auto shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{pageCount} Photos / {pageCount} Pages</span>
              </div>
            </div>

            {/* Primary Capacity Editions (32 Popular, 50 Extended, 60 Collector's, 72 Collector's) */}
            <div className="mb-8">
              <span className="text-[11px] font-bold uppercase tracking-widest text-noir-500 font-mono block mb-3">
                Featured Capacity Editions
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {primaryPageOptions.map((opt: any) => {
                  const isSelected = pageCount === opt.count;
                  return (
                    <button
                      key={opt.count}
                      type="button"
                      onClick={() => setPageCount(opt.count)}
                      className={cn(
                        "p-5 border rounded-sm text-left transition-all relative flex flex-col justify-between group",
                        isSelected
                          ? "border-noir-950 bg-cream-100/90 shadow-luxury-md ring-2 ring-noir-950"
                          : "border-cream-300 hover:border-noir-900 bg-white hover:shadow-xs"
                      )}
                    >
                      <div>
                        {/* Top: Count & Badge */}
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-serif text-3xl font-bold text-noir-950 tracking-tight">
                              {opt.count}
                            </span>
                            <span className="text-xs uppercase tracking-wider text-noir-500 font-mono">
                              pages
                            </span>
                          </div>

                          {opt.badge && (
                            <span className={cn(
                              "text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full font-mono shadow-2xs",
                              opt.badge.toLowerCase().includes('popular') && "bg-amber-100 text-amber-950 border border-amber-300",
                              opt.badge.toLowerCase().includes('extended') && "bg-blue-100 text-blue-950 border border-blue-300",
                              opt.badge.toLowerCase().includes('collector') && "bg-purple-100 text-purple-950 border border-purple-300",
                              !opt.badge.toLowerCase().includes('popular') && 
                              !opt.badge.toLowerCase().includes('extended') && 
                              !opt.badge.toLowerCase().includes('collector') && "bg-cream-200 text-noir-800 border border-cream-300"
                            )}>
                              {opt.badge}
                            </span>
                          )}
                        </div>

                        {/* Middle: Photos rule */}
                        <div className="mt-2.5 mb-1.5">
                          <p className="text-xs font-bold text-noir-900">
                            {opt.photos || opt.count} Photos / {opt.count} Pages
                          </p>
                          <span className="text-[10px] text-foil-gold font-semibold uppercase tracking-wider font-mono">
                            1 photo per page
                          </span>
                        </div>

                        <p className="text-[11px] text-noir-600 mt-2 leading-relaxed">
                          {opt.description}
                        </p>
                      </div>

                      {/* Bottom line: Adjustment & Indicator */}
                      <div className="mt-5 pt-3 border-t border-cream-200 flex justify-between items-center text-xs">
                        <span className="font-bold text-noir-950 font-mono text-[11px]">
                          {opt.priceAdjustment === 0
                            ? 'Standard (Included)'
                            : opt.priceAdjustment > 0
                            ? `+₹${opt.priceAdjustment.toLocaleString('en-IN')}`
                            : `-₹${Math.abs(opt.priceAdjustment).toLocaleString('en-IN')}`}
                        </span>

                        <div className={cn(
                          "w-5 h-5 rounded-full flex items-center justify-center transition-all",
                          isSelected ? "bg-noir-950 text-cream-50" : "border border-cream-300 group-hover:border-noir-400"
                        )}>
                          {isSelected && <Check size={12} className="stroke-[3]" />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Other Sizes (12, 24, 120 pages) */}
            {otherPageOptions.length > 0 && (
              <div className="pt-2">
                <span className="text-[11px] font-bold uppercase tracking-widest text-noir-500 font-mono block mb-3">
                  Other Sizes ({otherPageOptions.map((o: any) => `${o.count} pages`).join(', ')})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {otherPageOptions.map((opt: any) => {
                    const isSelected = pageCount === opt.count;
                    return (
                      <button
                        key={opt.count}
                        type="button"
                        onClick={() => setPageCount(opt.count)}
                        className={cn(
                          "p-4 border rounded-sm text-left transition-all relative flex flex-col justify-between group",
                          isSelected
                            ? "border-noir-950 bg-cream-100/90 shadow-luxury-md ring-2 ring-noir-950"
                            : "border-cream-300 hover:border-noir-900 bg-white hover:shadow-xs"
                        )}
                      >
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-baseline gap-1.5">
                              <span className="font-serif text-2xl font-bold text-noir-950">
                                {opt.count}
                              </span>
                              <span className="text-xs uppercase tracking-wider text-noir-500 font-mono">
                                pages
                              </span>
                            </div>
                            {opt.badge && (
                              <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cream-200 text-noir-800 font-mono">
                                {opt.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-bold text-noir-900">
                            {opt.photos || opt.count} Photos / {opt.count} Pages
                          </p>
                          <span className="text-[10px] text-noir-500 font-mono">1 photo per page</span>
                          <p className="text-[11px] text-noir-600 mt-1 line-clamp-2">
                            {opt.description}
                          </p>
                        </div>

                        <div className="mt-4 pt-2.5 border-t border-cream-200 flex justify-between items-center text-xs">
                          <span className="font-bold text-noir-950 font-mono text-[11px]">
                            {opt.priceAdjustment === 0
                              ? 'Standard (Included)'
                              : opt.priceAdjustment > 0
                              ? `+₹${opt.priceAdjustment.toLocaleString('en-IN')}`
                              : `-₹${Math.abs(opt.priceAdjustment).toLocaleString('en-IN')}`}
                          </span>
                          <div className={cn(
                            "w-4 h-4 rounded-full flex items-center justify-center transition-all",
                            isSelected ? "bg-noir-950 text-cream-50" : "border border-cream-300"
                          )}>
                            {isSelected && <Check size={10} className="stroke-[3]" />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-8 flex justify-between">
              <button onClick={() => setStep(1)} className="px-6 py-3 border border-cream-300 text-sm font-medium rounded-sm hover:bg-cream-100">
                Back
              </button>
              <button onClick={() => setStep(3)} className="flex items-center px-8 py-3.5 bg-noir-950 text-cream-50 text-sm font-medium rounded-sm hover:bg-noir-900">
                <span>Continue to Cover Style</span>
                <ChevronRight size={16} className="ml-2" />
              </button>
            </div>
          </section>

          {/* Step 3: Cover */}
          <section className={step === 3 ? "block" : "hidden"}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-2xl text-noir-950">Step 3: Cover Material & Finish</h2>
              <span className="text-xs text-noir-500">Precision Lay-Flat Binding</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {covers.map((c: any) => (
                <button 
                  key={c.id}
                  onClick={() => setCover(c.id)}
                  className={cn(
                    "p-6 border rounded-sm text-left transition-all relative flex flex-col justify-between",
                    cover === c.id 
                      ? "border-noir-950 bg-cream-100 shadow-luxury-md ring-1 ring-noir-950" 
                      : "border-cream-300 hover:border-noir-900 bg-white"
                  )}
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-serif text-lg font-medium text-noir-950">{c.name}</h3>
                      {cover === c.id && (
                        <span className="w-5 h-5 bg-noir-950 text-cream-50 rounded-full flex items-center justify-center">
                          <Check size={12} />
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-noir-600 leading-relaxed">{c.desc}</p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-cream-200">
                    <span className="text-xs font-semibold text-noir-900">
                      {c.price > 0 ? `+₹${c.price.toLocaleString('en-IN')}` : c.price < 0 ? `-₹${Math.abs(c.price).toLocaleString('en-IN')}` : 'Included'}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-8 flex justify-between">
              <button onClick={() => setStep(2)} className="px-6 py-3 border border-cream-300 text-sm font-medium rounded-sm hover:bg-cream-100">
                Back
              </button>
              <button onClick={() => setStep(4)} className="flex items-center px-8 py-3.5 bg-noir-950 text-cream-50 text-sm font-medium rounded-sm hover:bg-noir-900">
                <span>Continue to Theme</span>
                <ChevronRight size={16} className="ml-2" />
              </button>
            </div>
          </section>

          {/* Step 4: Theme */}
          <section className={step === 4 ? "block" : "hidden"}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-2xl text-noir-950">Step 4: Studio Layout Theme</h2>
              <span className="text-xs text-noir-500">Auto-formatted by AI</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {themes.map((t: any) => (
                <button 
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={cn(
                    "p-6 border rounded-sm text-left transition-all relative flex flex-col justify-between",
                    theme === t.id 
                      ? "border-noir-950 bg-cream-100 shadow-luxury-md ring-1 ring-noir-950" 
                      : "border-cream-300 hover:border-noir-900 bg-white"
                  )}
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-serif text-lg font-medium text-noir-950">{t.name}</h3>
                      {theme === t.id && (
                        <span className="w-5 h-5 bg-noir-950 text-cream-50 rounded-full flex items-center justify-center">
                          <Check size={12} />
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-noir-600 leading-relaxed">{t.desc}</p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-cream-200">
                    <span className="text-xs text-noir-500">Included</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-8 flex justify-between">
              <button onClick={() => setStep(3)} className="px-6 py-3 border border-cream-300 text-sm font-medium rounded-sm hover:bg-cream-100">
                Back
              </button>
              <button onClick={() => setStep(5)} className="flex items-center px-8 py-3.5 bg-noir-950 text-cream-50 text-sm font-medium rounded-sm hover:bg-noir-900">
                <span>Continue to Color Palette</span>
                <ChevronRight size={16} className="ml-2" />
              </button>
            </div>
          </section>

          {/* Step 5: Color */}
          <section className={step === 5 ? "block" : "hidden"}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-2xl text-noir-950">Step 5: Color Palette & Foil Accents</h2>
              <span className="text-xs text-noir-500">Bespoke Spine Embossing</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {colors.map((c: any) => (
                <button 
                  key={c.id}
                  onClick={() => setColor(c.id)}
                  className={cn(
                    "p-4 border rounded-sm text-center transition-all flex flex-col items-center justify-between",
                    color === c.id 
                      ? "border-noir-950 bg-cream-100 shadow-luxury-md ring-1 ring-noir-950" 
                      : "border-cream-300 hover:border-noir-900 bg-white"
                  )}
                >
                  <div 
                    className="w-12 h-12 rounded-full border border-cream-300 mb-3 shadow-sm relative flex items-center justify-center"
                    style={{ backgroundColor: c.hex }}
                  >
                    {color === c.id && (
                      <span className={cn(
                        "w-4 h-4 rounded-full flex items-center justify-center",
                        c.hex === '#0A0A0A' || c.hex === '#2D4A3E' || c.hex === '#3B606E' ? "text-white" : "text-noir-950"
                      )}>
                        <Check size={12} />
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-medium text-noir-900">{c.name}</span>
                </button>
              ))}
            </div>

            <div className="mt-8 flex justify-between">
              <button onClick={() => setStep(4)} className="px-6 py-3 border border-cream-300 text-sm font-medium rounded-sm hover:bg-cream-100">
                Back
              </button>
              <button onClick={() => setStep(6)} className="flex items-center px-8 py-3.5 bg-noir-950 text-cream-50 text-sm font-medium rounded-sm hover:bg-noir-900">
                <span>Continue to Packaging</span>
                <ChevronRight size={16} className="ml-2" />
              </button>
            </div>
          </section>

          {/* Step 6: Packaging */}
          <section className={step === 6 ? "block" : "hidden"}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-2xl text-noir-950">Step 6: Packaging & Presentation Box</h2>
              <span className="text-xs text-noir-500">Heirloom Unboxing Experience</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {packagings.map((p: any) => (
                <button 
                  key={p.id}
                  onClick={() => setPackaging(p.id)}
                  className={cn(
                    "p-6 border rounded-sm text-left transition-all relative flex flex-col justify-between",
                    packaging === p.id 
                      ? "border-noir-950 bg-cream-100 shadow-luxury-md ring-1 ring-noir-950" 
                      : "border-cream-300 hover:border-noir-900 bg-white"
                  )}
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-serif text-lg font-medium text-noir-950">{p.name}</h3>
                      {packaging === p.id && (
                        <span className="w-5 h-5 bg-noir-950 text-cream-50 rounded-full flex items-center justify-center">
                          <Check size={12} />
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-noir-600 leading-relaxed">{p.desc}</p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-cream-200">
                    <span className="text-xs font-semibold text-noir-900">
                      {p.price > 0 ? `+₹${p.price.toLocaleString('en-IN')}` : 'Included'}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-8 flex justify-between">
              <button onClick={() => setStep(5)} className="px-6 py-3 border border-cream-300 text-sm font-medium rounded-sm hover:bg-cream-100">
                Back
              </button>
            </div>
          </section>

        </div>

        {/* Dynamic Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-cream-100 p-8 border border-cream-300 rounded-sm shadow-luxury-sm">
            <h3 className="font-serif text-2xl font-semibold mb-6 border-b border-cream-300 pb-4 text-noir-950">
              Order Specification
            </h3>
            
            <div className="space-y-4 mb-8 text-sm">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-noir-500 block text-xs uppercase tracking-wider">Size & Scale</span>
                  <span className="font-medium text-noir-900">{currentSizeObj?.name}</span>
                </div>
                <span className="font-serif text-noir-950">₹{basePrice.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between items-start">
                <div>
                  <span className="text-noir-500 block text-xs uppercase tracking-wider">Page Count & Capacity</span>
                  <span className="font-medium text-noir-900">{pageCount} Pages ({pageCount} Photos • 1/Page)</span>
                </div>
                <span className="font-serif text-noir-950">
                  {pageAdjustment > 0 ? `+₹${pageAdjustment.toLocaleString('en-IN')}` : pageAdjustment < 0 ? `-₹${Math.abs(pageAdjustment).toLocaleString('en-IN')}` : 'Included'}
                </span>
              </div>

              <div className="flex justify-between items-start">
                <div>
                  <span className="text-noir-500 block text-xs uppercase tracking-wider">Cover Finish</span>
                  <span className="font-medium text-noir-900">{currentCoverObj?.name}</span>
                </div>
                <span className="font-serif text-noir-950">
                  {coverPrice > 0 ? `+₹${coverPrice.toLocaleString('en-IN')}` : coverPrice < 0 ? `-₹${Math.abs(coverPrice).toLocaleString('en-IN')}` : 'Included'}
                </span>
              </div>

              <div className="flex justify-between items-start">
                <div>
                  <span className="text-noir-500 block text-xs uppercase tracking-wider">Theme & Layout</span>
                  <span className="font-medium text-noir-900">{currentThemeObj?.name}</span>
                </div>
                <span className="text-xs text-noir-500">Included</span>
              </div>

              <div className="flex justify-between items-start">
                <div>
                  <span className="text-noir-500 block text-xs uppercase tracking-wider">Palette Accent</span>
                  <span className="font-medium text-noir-900">{currentColorObj?.name}</span>
                </div>
                <span className="text-xs text-noir-500">Included</span>
              </div>

              <div className="flex justify-between items-start">
                <div>
                  <span className="text-noir-500 block text-xs uppercase tracking-wider">Packaging Box</span>
                  <span className="font-medium text-noir-900">{currentPackagingObj?.name}</span>
                </div>
                <span className="font-serif text-noir-950">
                  {packagingPrice > 0 ? `+₹${packagingPrice.toLocaleString('en-IN')}` : 'Included'}
                </span>
              </div>

              <div className="flex justify-between items-start">
                <div>
                  <span className="text-noir-500 block text-xs uppercase tracking-wider">Layout Rule</span>
                  <span className="font-medium text-noir-900 text-xs">1 Photo per Page (Gallery Margins)</span>
                </div>
                <span className="text-xs text-noir-500">Standard</span>
              </div>
            </div>

            <div className="border-t border-cream-300 pt-5 mb-8">
              <div className="flex justify-between items-baseline">
                <span className="font-serif text-lg text-noir-900">Estimated Total</span>
                <span className="font-serif text-3xl font-semibold text-noir-950">
                  ₹{currentPrice.toLocaleString('en-IN')}
                </span>
              </div>
              <p className="text-xs text-noir-600 mt-1">GST included. Free Pan-India insured courier delivery.</p>
            </div>

            <Link 
              href={`/upload/new-project?size=${encodeURIComponent(size)}&pages=${pageCount}&cover=${encodeURIComponent(cover)}&theme=${encodeURIComponent(theme)}&color=${encodeURIComponent(color)}&packaging=${encodeURIComponent(packaging)}${templateSlug ? `&template=${encodeURIComponent(templateSlug)}` : ''}`} 
              onClick={() => {
                trackEvent('config_change', `Configured Book: ${size} (${pageCount} Pages)`, {
                  size,
                  pageCount,
                  cover,
                  theme,
                  color,
                  packaging,
                  templateSlug: templateSlug || 'custom',
                  estimatedPrice: currentPrice,
                });
              }}
              className="w-full flex items-center justify-center px-6 py-4 bg-noir-950 text-cream-50 font-medium hover:bg-noir-900 transition-all rounded-sm text-center shadow-luxury-md"
            >
              <span>Continue to Upload Photos</span>
              <ArrowRight size={18} className="ml-2" />
            </Link>

            <p className="text-[11px] text-center text-noir-500 mt-4">
              Step 1 of 3: You will customize each page in Studio next.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConfigurePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-cream-50">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-noir-950 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-3 text-sm text-noir-700">Initializing Configuration...</p>
        </div>
      </div>
    }>
      <ConfigureContent />
    </Suspense>
  );
}
