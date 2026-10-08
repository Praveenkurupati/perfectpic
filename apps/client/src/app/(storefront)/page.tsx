"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Star,
  Check,
  ChevronDown,
  ChevronUp,
  ArrowRight,
} from "lucide-react";
import { api } from "@/lib/api";
import BookCard, { BookItem } from "@/features/catalog/components/BookCard";
import ExploreCard from "@/features/catalog/components/ExploreCard";

// Top Indian photobooks prioritized for India launch
const fallbackTemplates: BookItem[] = [
  {
    id: "tpl-1",
    slug: "trek-series-nethravathi",
    seriesLabel: "trek series",
    bookType: "custom photobook",
    title: "custom photobook",
    displayName: "Netravati Peak Cloud Trails",
    tagline: "emerald valleys & western monsoon mist",
    subtitle: "Chikmagalur Ghats Ridge Hike",
    coverImage:
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop",
    coverColor: "#4E7055",
    spineText: "NETRAVATI",
    rating: 4.9,
    reviewCount: 88,
    fromPrice: 1999,
    badge: "trending",
  },
  {
    id: "tpl-2",
    slug: "travel-series-kerala",
    seriesLabel: "travel series",
    bookType: "custom photobook",
    title: "custom photobook",
    displayName: "Kerala Gods Own Country",
    tagline: "swaying palms, backwaters & spice trails",
    subtitle: "Alleppey, Kumarakom & Kochi",
    coverImage:
      "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&auto=format&fit=crop",
    coverColor: "#3B7A57",
    spineText: "KERALA",
    rating: 5.0,
    reviewCount: 145,
    fromPrice: 1999,
    badge: "bestseller",
  },
  {
    id: "tpl-3",
    slug: "trek-series-himalaya",
    seriesLabel: "trek series",
    bookType: "custom photobook",
    title: "custom photobook",
    displayName: "Himalayan Summit Chronicles",
    tagline: "eternal snowfields & high prayer flags",
    subtitle: "Great Himalayan Range Expeditions",
    coverImage:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop",
    coverColor: "#415A77",
    spineText: "HIMALAYAS",
    rating: 4.9,
    reviewCount: 94,
    fromPrice: 1999,
    badge: "popular",
  },
  {
    id: "tpl-4",
    slug: "travel-series-varkala",
    seriesLabel: "travel series",
    bookType: "custom photobook",
    title: "custom photobook",
    displayName: "Varkala Bohemian Cliffs",
    tagline: "red laterite cliffs & arabian sea sunset",
    subtitle: "North Cliff Surf & Beach Diaries",
    coverImage:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop",
    coverColor: "#D87040",
    spineText: "VARKALA",
    rating: 4.9,
    reviewCount: 92,
    fromPrice: 1999,
    badge: "popular",
  },
  {
    id: "tpl-5",
    slug: "trek-series-kudremukh",
    seriesLabel: "trek series",
    bookType: "custom photobook",
    title: "custom photobook",
    displayName: "Kudremukh Rolling Meadows",
    tagline: "shola forests & horse-face peak",
    subtitle: "Kudremukh National Park Trail",
    coverImage:
      "https://images.unsplash.com/photo-1511497584788-87676104235f?w=800&auto=format&fit=crop",
    coverColor: "#606C38",
    spineText: "KUDREMUKH",
    rating: 4.8,
    reviewCount: 76,
    fromPrice: 1999,
    badge: "new",
  },
];

const categoryTiles = [
  {
    title: "travel",
    subtitle: "adventures, treks & road trips",
    image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&auto=format&fit=crop",
    filter: "travel series",
  },
  {
    title: "baby & first year",
    subtitle: "milestones, smiles & tiny steps",
    image: "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=600&auto=format&fit=crop",
    filter: "baby",
  },
  {
    title: "wedding",
    subtitle: "ceremonies, portraits & vows",
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&auto=format&fit=crop",
    filter: "wedding",
  },
  {
    title: "everyday",
    subtitle: "candid moments & family dinners",
    image: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=600&auto=format&fit=crop",
    filter: "moments series",
  },
  {
    title: "anniversary",
    subtitle: "years together & celebrations",
    image: "https://images.unsplash.com/photo-1529636798458-92182e662485?w=600&auto=format&fit=crop",
    filter: "anniversary series",
  },
  {
    title: "festivals",
    subtitle: "diwali, holi & family reunions",
    image: "https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=600&auto=format&fit=crop",
    filter: "festivals",
  },
  {
    title: "vacation",
    subtitle: "beach escapes & hill stations",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop",
    filter: "travel edit",
  },
];

const faqs = [
  {
    q: "what makes your photobooks lay-flat?",
    a: "our books use specialized panoramic lay-flat binding that opens 180 degrees completely flat. there is no middle seam or gutter loss, allowing your photos to span uninterrupted across two full pages.",
  },
  {
    q: "is the paper really non-tearable and waterproof?",
    a: "yes. we use high-grade archival synthetic substrates that are tear-proof, spill-resistant, and water-repellent. accidental coffee or tea spills can simply be wiped away with a dry cloth without leaving any stains.",
  },
  {
    q: "how long does printing and delivery take?",
    a: "each custom photobook is precision printed and bound in bengaluru within 48 to 72 hours. standard insured delivery takes 3 to 5 business days across india with tracking updates sent to your whatsapp and email.",
  },
  {
    q: "can i preview my book before ordering?",
    a: "yes! our online studio lets you preview every single spread, edit captions, swap photos, and inspect the high-resolution digital proof before finalizing your order.",
  },
  {
    q: "what if i am not satisfied with the print quality?",
    a: "we offer a 100% satisfaction guarantee. if there is any printing or binding defect, simply let us know within 7 days and we will reprint your photobook free of charge.",
  },
];

export default function Home() {
  const [allProducts, setAllProducts] = useState<BookItem[]>(fallbackTemplates);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [bundles, setBundles] = useState<any[]>([
    { id: 'b-2', minQuantity: 2, name: '2 books', discountAmount: 300, badge: 'duo pack', price: 3699, perBook: 1849, description: 'perfect for sharing with parents or keeping a duplicate volume.' },
    { id: 'b-6', minQuantity: 6, name: '6 books', discountAmount: 1800, badge: 'popular', price: 5199, perBook: 866, description: 'ideal for weddings, family series, and annual compilations.' },
    { id: 'b-12', minQuantity: 12, name: '12 books', discountAmount: 4500, badge: "collector's choice", price: 7999, perBook: 666, description: 'our best value for complete travel chronicles and milestone archives.' },
  ]);

  useEffect(() => {
    // Dynamic fetch from centralized backend API
    api
      .getProducts()
      .then((res) => {
        if (res && res.products && res.products.length > 0) {
          setAllProducts(res.products);
        }
      })
      .catch((err) => {
        console.warn("Backend API not reachable, using offline catalog:", err);
      });

    // Dynamic fetch of volume discount bundle tiers
    api
      .getBundles()
      .then((res) => {
        if (res && res.bundles && res.bundles.length > 0) {
          const active = res.bundles
            .filter((b: any) => b.active !== false)
            .sort((a: any, b: any) => a.minQuantity - b.minQuantity);
          if (active.length > 0) {
            setBundles(active);
          }
        }
      })
      .catch(() => {});
  }, []);

  const categories = [
    { id: "all", label: "all series" },
    { id: "trek series", label: "trek series" },
    { id: "travel series", label: "travel series" },
    { id: "travel edit", label: "travel edit" },
    { id: "moments series", label: "moments series" },
    { id: "anniversary series", label: "anniversary series" },
  ];

  const filteredProducts =
    activeCategory === "all"
      ? allProducts
      : allProducts.filter(
          (p) => p.seriesLabel?.toLowerCase() === activeCategory.toLowerCase()
        );

  return (
    <div className="flex flex-col w-full bg-white">
      {/* 1. Hero Section: Dark background (#0A0A0A), lowercase headlines, pill buttons */}
      <section className="bg-[#0A0A0A] text-white pt-32 pb-24 md:pt-40 md:pb-32 text-center px-4 md:px-8">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white lowercase leading-[1.08] mb-6">
            your memories deserve an heirloom.
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-[#D9D6CF] max-w-2xl mx-auto mb-10 leading-relaxed font-normal lowercase">
            lay-flat photobooks on archival, non-tearable paper. design online in minutes and get it delivered across india.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/configure"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-full bg-white text-[#0A0A0A] hover:bg-[#F4F2ED] px-8 py-3.5 text-sm font-medium transition-colors shadow-sm lowercase"
            >
              start my design
            </Link>
            <a
              href="#catalog"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-full bg-transparent text-white border border-[#5C5A55] hover:border-white px-8 py-3.5 text-sm font-medium transition-colors lowercase"
            >
              explore collections
            </a>
          </div>
          <p className="text-xs sm:text-sm text-[#9E9B95] mt-8 lowercase tracking-wide">
            starts at ₹1,999 • free pan-india delivery
          </p>
        </div>
      </section>

      {/* 2. Trust Strip (4 Columns): White background, crisp lowercase details */}
      <section className="bg-white border-b border-[#D9D6CF]/70 py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-8 max-w-6xl">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div className="flex flex-col items-center">
              <h3 className="text-sm md:text-base font-bold text-[#0A0A0A] lowercase">100% lay-flat</h3>
              <p className="text-xs text-[#5C5A55] mt-1.5 max-w-[200px] lowercase">
                opens 180° completely flat with zero gutter loss
              </p>
            </div>
            <div className="flex flex-col items-center">
              <h3 className="text-sm md:text-base font-bold text-[#0A0A0A] lowercase">non-tearable</h3>
              <p className="text-xs text-[#5C5A55] mt-1.5 max-w-[200px] lowercase">
                archival synthetic paper built to last generations
              </p>
            </div>
            <div className="flex flex-col items-center">
              <h3 className="text-sm md:text-base font-bold text-[#0A0A0A] lowercase">fast & free</h3>
              <p className="text-xs text-[#5C5A55] mt-1.5 max-w-[200px] lowercase">
                dispatched in 48-72h • free delivery pan-india
              </p>
            </div>
            <div className="flex flex-col items-center">
              <h3 className="text-sm md:text-base font-bold text-[#0A0A0A] lowercase">free reprint</h3>
              <p className="text-xs text-[#5C5A55] mt-1.5 max-w-[200px] lowercase">
                100% satisfaction guaranteed or reprinted free
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Categories / Moments Section: Off-white background, 8-tile grid */}
      <section className="bg-[#F4F2ED] py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-8 max-w-6xl">
          <div className="mb-12">
            <p className="text-xs font-semibold tracking-widest text-[#5C5A55] uppercase mb-2">
              curated moments
            </p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#0A0A0A] lowercase">
              start with a moment that matters.
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {categoryTiles.map((cat, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (cat.filter.includes("series") || cat.filter.includes("edit")) {
                    setActiveCategory(cat.filter);
                    const el = document.getElementById("catalog");
                    el?.scrollIntoView({ behavior: "smooth" });
                  } else {
                    window.location.href = `/configure?category=${encodeURIComponent(cat.title)}`;
                  }
                }}
                className="group relative bg-white border border-[#D9D6CF]/70 rounded-2xl overflow-hidden text-left flex flex-col justify-between hover:shadow-luxury-md hover:-translate-y-1 transition-all duration-300"
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-[#EBE8E1]">
                  <img
                    src={cat.image}
                    alt={cat.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-4 md:p-5">
                  <h3 className="font-bold text-sm md:text-base text-[#0A0A0A] lowercase">
                    {cat.title}
                  </h3>
                  <p className="text-[11px] md:text-xs text-[#5C5A55] mt-0.5 lowercase line-clamp-1">
                    {cat.subtitle}
                  </p>
                </div>
              </button>
            ))}

            {/* 8th Tile: Solid Black Card "all collections →" */}
            <Link
              href="/templates"
              className="group bg-[#0A0A0A] rounded-2xl p-6 md:p-7 text-white flex flex-col justify-between hover:bg-[#2A2926] transition-colors"
            >
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#9E9B95]">
                  explore all
                </span>
                <h3 className="font-bold text-xl md:text-2xl text-white lowercase mt-3 leading-snug">
                  all collections
                </h3>
              </div>
              <div className="pt-8">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/10 group-hover:bg-white group-hover:text-[#0A0A0A] text-white transition-all">
                  <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* 4. Featured Books Section: White background, preserved book card designs & filters */}
      <section id="catalog" className="bg-white py-20 md:py-28 scroll-mt-24">
        <div className="container mx-auto px-4 md:px-8 max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <p className="text-xs font-semibold tracking-widest text-[#5C5A55] uppercase mb-2">
                featured collections
              </p>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#0A0A0A] lowercase">
                made for indian journeys.
              </h2>
              <p className="text-[#5C5A55] mt-2 text-sm md:text-base max-w-xl leading-relaxed lowercase">
                curated indian trek series and travel journals with lay-flat panoramic spreads.
              </p>
            </div>

            {/* Series Filter Chips */}
            <div className="flex flex-wrap gap-2 self-start md:self-auto">
              {categories.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategory(tab.id)}
                  className={`px-4 py-2 text-xs font-medium lowercase rounded-full transition-all ${
                    activeCategory === tab.id
                      ? "bg-[#0A0A0A] text-white shadow-sm"
                      : "bg-white text-[#5C5A55] border border-[#D9D6CF] hover:bg-[#F4F2ED] hover:text-[#0A0A0A]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Book Cards Grid: Preserving previous 3D book mockup presentation */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.slice(0, 5).map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
            <ExploreCard totalCount={allProducts.length || 35} />
          </div>
        </div>
      </section>

      {/* 5. 3-Step Process Section: Off-white background, 3 numbered columns */}
      <section className="bg-[#F4F2ED] py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-8 max-w-6xl">
          <div className="mb-16">
            <p className="text-xs font-semibold tracking-widest text-[#5C5A55] uppercase mb-2">
              how it works
            </p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#0A0A0A] lowercase">
              from camera roll to coffee table in 3 steps.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            <div className="border-t border-[#D9D6CF] pt-6">
              <span className="text-3xl font-light text-[#5C5A55]">01</span>
              <h3 className="text-lg md:text-xl font-bold text-[#0A0A0A] lowercase mt-3 mb-2">
                upload
              </h3>
              <p className="text-sm text-[#5C5A55] leading-relaxed lowercase">
                drag and drop 30 to 150 photos directly from your phone, laptop, or google drive.
              </p>
            </div>

            <div className="border-t border-[#D9D6CF] pt-6">
              <span className="text-3xl font-light text-[#5C5A55]">02</span>
              <h3 className="text-lg md:text-xl font-bold text-[#0A0A0A] lowercase mt-3 mb-2">
                customize & preview
              </h3>
              <p className="text-sm text-[#5C5A55] leading-relaxed lowercase">
                our smart layout engine arranges your photos in seconds. customize fonts, captions, and layouts.
              </p>
            </div>

            <div className="border-t border-[#D9D6CF] pt-6">
              <span className="text-3xl font-light text-[#5C5A55]">03</span>
              <h3 className="text-lg md:text-xl font-bold text-[#0A0A0A] lowercase mt-3 mb-2">
                print & deliver
              </h3>
              <p className="text-sm text-[#5C5A55] leading-relaxed lowercase">
                printed on archival non-tearable paper, bound with precision, and delivered across india in 5–7 days.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Craftsmanship Section: Dark background (#0A0A0A), 3 large feature cards */}
      <section id="craftsmanship" className="bg-[#0A0A0A] text-white py-24 md:py-32">
        <div className="container mx-auto px-4 md:px-8 max-w-6xl">
          <div className="mb-16">
            <p className="text-xs font-semibold tracking-widest text-[#9E9B95] uppercase mb-2">
              craftsmanship & materials
            </p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white lowercase">
              made to last generations.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#1F1E1B] border border-white/10 rounded-2xl overflow-hidden flex flex-col justify-between group hover:border-white/20 transition-colors">
              <div className="aspect-[4/3] w-full overflow-hidden bg-[#2A2926]">
                <img
                  src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop"
                  alt="archival non-tearable paper"
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6 md:p-8">
                <h3 className="font-bold text-lg md:text-xl text-white lowercase mb-2">
                  archival non-tearable paper
                </h3>
                <p className="text-sm text-[#D9D6CF] leading-relaxed lowercase">
                  synthetic waterproof paper that never tears, fades, or yellows. spills wipe clean with a cloth.
                </p>
              </div>
            </div>

            <div className="bg-[#1F1E1B] border border-white/10 rounded-2xl overflow-hidden flex flex-col justify-between group hover:border-white/20 transition-colors">
              <div className="aspect-[4/3] w-full overflow-hidden bg-[#2A2926]">
                <img
                  src="https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&auto=format&fit=crop"
                  alt="panoramic lay-flat binding"
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6 md:p-8">
                <h3 className="font-bold text-lg md:text-xl text-white lowercase mb-2">
                  panoramic lay-flat binding
                </h3>
                <p className="text-sm text-[#D9D6CF] leading-relaxed lowercase">
                  pages open 180° completely flat so your wide landscapes and panoramic photos span seamlessly across both pages.
                </p>
              </div>
            </div>

            <div className="bg-[#1F1E1B] border border-white/10 rounded-2xl overflow-hidden flex flex-col justify-between group hover:border-white/20 transition-colors">
              <div className="aspect-[4/3] w-full overflow-hidden bg-[#2A2926]">
                <img
                  src="https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&auto=format&fit=crop"
                  alt="precision foil-stamped covers"
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6 md:p-8">
                <h3 className="font-bold text-lg md:text-xl text-white lowercase mb-2">
                  precision foil-stamped covers
                </h3>
                <p className="text-sm text-[#D9D6CF] leading-relaxed lowercase">
                  custom metallic foil lettering and debossing on heavy cloth and leatherette hardcovers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Pricing & Bundles Section: White background, 4 tiered cards */}
      <section className="bg-white py-24 md:py-32">
        <div className="container mx-auto px-4 md:px-8 max-w-6xl">
          <div className="mb-16">
            <p className="text-xs font-semibold tracking-widest text-[#5C5A55] uppercase mb-2">
              transparent pricing
            </p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#0A0A0A] lowercase">
              one clear price. free shipping across india.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: Featured Single Book (Black Card) */}
            <div className="bg-[#0A0A0A] text-white rounded-2xl p-7 flex flex-col justify-between shadow-xl">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-[#9E9B95] font-semibold">
                  single photobook
                </span>
                <div className="text-4xl font-bold mt-2 mb-1">₹1,999</div>
                <p className="text-xs text-[#D9D6CF] mb-6">
                  8.25&quot; × 8.25&quot; • 32 pages
                </p>
                <div className="space-y-2.5 text-xs text-[#D9D6CF] border-t border-white/10 pt-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-white" />
                    <span>archival lay-flat binding</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-white" />
                    <span>100% non-tearable paper</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-white" />
                    <span>up to 120 photos included</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-white" />
                    <span>free pan-india delivery</span>
                  </div>
                </div>
              </div>
              <Link
                href="/configure"
                className="w-full inline-flex items-center justify-center rounded-full bg-white text-[#0A0A0A] hover:bg-[#F4F2ED] py-3 text-xs font-medium lowercase transition-colors text-center"
              >
                start my design
              </Link>
            </div>

            {/* Card 2: 2 Books (Duo Pack) */}
            <div className="bg-[#F4F2ED] border border-[#D9D6CF] rounded-2xl p-7 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-[#0A0A0A] lowercase">2 books</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    save ₹300
                  </span>
                </div>
                <div className="text-3xl font-bold text-[#0A0A0A] mb-1">₹3,699</div>
                <p className="text-xs text-[#5C5A55] mb-6 lowercase">
                  ₹1,849 / book
                </p>
                <p className="text-xs text-[#5C5A55] leading-relaxed border-t border-[#D9D6CF] pt-4 mb-6 lowercase">
                  perfect for sharing with parents or keeping a duplicate volume.
                </p>
              </div>
              <Link
                href="/configure"
                className="w-full inline-flex items-center justify-center rounded-full bg-white border border-[#D9D6CF] text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white hover:border-[#0A0A0A] py-3 text-xs font-medium lowercase transition-colors text-center"
              >
                choose duo pack
              </Link>
            </div>

            {/* Card 3: 6 Books (Family Pack) */}
            <div className="bg-[#F4F2ED] border border-[#D9D6CF] rounded-2xl p-7 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-[#0A0A0A] lowercase">6 books</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    save ₹1,800
                  </span>
                </div>
                <div className="text-3xl font-bold text-[#0A0A0A] mb-1">₹5,199</div>
                <p className="text-xs text-[#5C5A55] mb-6 lowercase">
                  ideal for weddings & big trips
                </p>
                <p className="text-xs text-[#5C5A55] leading-relaxed border-t border-[#D9D6CF] pt-4 mb-6 lowercase">
                  ideal for family series, weddings, and annual compilations.
                </p>
              </div>
              <Link
                href="/configure"
                className="w-full inline-flex items-center justify-center rounded-full bg-white border border-[#D9D6CF] text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white hover:border-[#0A0A0A] py-3 text-xs font-medium lowercase transition-colors text-center"
              >
                choose bundle
              </Link>
            </div>

            {/* Card 4: 12 Books (Collector Set) */}
            <div className="bg-[#F4F2ED] border border-[#D9D6CF] rounded-2xl p-7 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-[#0A0A0A] lowercase">12 books</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    save ₹4,500
                  </span>
                </div>
                <div className="text-3xl font-bold text-[#0A0A0A] mb-1">₹7,999</div>
                <p className="text-xs text-[#5C5A55] mb-6 lowercase">
                  collector volume series
                </p>
                <p className="text-xs text-[#5C5A55] leading-relaxed border-t border-[#D9D6CF] pt-4 mb-6 lowercase">
                  our best value for complete travel chronicles and milestone archives.
                </p>
              </div>
              <Link
                href="/configure"
                className="w-full inline-flex items-center justify-center rounded-full bg-white border border-[#D9D6CF] text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white hover:border-[#0A0A0A] py-3 text-xs font-medium lowercase transition-colors text-center"
              >
                choose bundle
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Metrics / Stats Bar: Off-white background, 4 key stats */}
      <section className="bg-[#F4F2ED] border-y border-[#D9D6CF] py-16 md:py-20">
        <div className="container mx-auto px-4 md:px-8 max-w-6xl">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold text-[#0A0A0A]">4.9</div>
              <p className="text-xs text-[#5C5A55] mt-1.5 lowercase">
                average customer rating
              </p>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-[#0A0A0A]">500+</div>
              <p className="text-xs text-[#5C5A55] mt-1.5 lowercase">
                5-star customer reviews
              </p>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-[#0A0A0A]">10k+</div>
              <p className="text-xs text-[#5C5A55] mt-1.5 lowercase">
                photobooks printed
              </p>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-[#0A0A0A]">35+</div>
              <p className="text-xs text-[#5C5A55] mt-1.5 lowercase">
                curated themes & sizes
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Reviews / Testimonials Section: White background, 3 reviews */}
      <section className="bg-white py-24 md:py-32">
        <div className="container mx-auto px-4 md:px-8 max-w-6xl">
          <div className="mb-16">
            <p className="text-xs font-semibold tracking-widest text-[#5C5A55] uppercase mb-2">
              reviews
            </p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#0A0A0A] lowercase">
              loved by families across india.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#F4F2ED] border border-[#D9D6CF] rounded-2xl p-7 flex flex-col justify-between">
              <div>
                <div className="flex gap-1 text-[#0A0A0A] mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={15} fill="currentColor" />
                  ))}
                </div>
                <p className="text-sm text-[#2A2926] leading-relaxed lowercase mb-6">
                  &ldquo;the lay-flat binding is unbelievable. we printed our netravati trek photos and looking at them spread across two pages without gutter loss brings the memory right back.&rdquo;
                </p>
              </div>
              <div className="border-t border-[#D9D6CF]/70 pt-4">
                <p className="text-xs font-bold text-[#0A0A0A] lowercase">rohit & priya sharma</p>
                <p className="text-[11px] text-[#5C5A55] lowercase">bengaluru</p>
              </div>
            </div>

            <div className="bg-[#F4F2ED] border border-[#D9D6CF] rounded-2xl p-7 flex flex-col justify-between">
              <div>
                <div className="flex gap-1 text-[#0A0A0A] mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={15} fill="currentColor" />
                  ))}
                </div>
                <p className="text-sm text-[#2A2926] leading-relaxed lowercase mb-6">
                  &ldquo;the paper quality is truly non-tearable. my 2-year-old flipped through our family album dozens of times and not a single wrinkle or tear. worth every rupee.&rdquo;
                </p>
              </div>
              <div className="border-t border-[#D9D6CF]/70 pt-4">
                <p className="text-xs font-bold text-[#0A0A0A] lowercase">ananya deshmukh</p>
                <p className="text-[11px] text-[#5C5A55] lowercase">mumbai</p>
              </div>
            </div>

            <div className="bg-[#F4F2ED] border border-[#D9D6CF] rounded-2xl p-7 flex flex-col justify-between">
              <div>
                <div className="flex gap-1 text-[#0A0A0A] mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={15} fill="currentColor" />
                  ))}
                </div>
                <p className="text-sm text-[#2A2926] leading-relaxed lowercase mb-6">
                  &ldquo;received the book within 5 days in gorgeous packaging. the foil stamping on the spine makes it look like an art piece on our coffee table.&rdquo;
                </p>
              </div>
              <div className="border-t border-[#D9D6CF]/70 pt-4">
                <p className="text-xs font-bold text-[#0A0A0A] lowercase">vikramaditya varma</p>
                <p className="text-[11px] text-[#5C5A55] lowercase">hyderabad</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 10. FAQ Section: Off-white background, 2-column layout with accordions */}
      <section className="bg-[#F4F2ED] py-24 md:py-32">
        <div className="container mx-auto px-4 md:px-8 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-5">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#0A0A0A] lowercase mb-4">
                questions, answered.
              </h2>
              <p className="text-sm md:text-base text-[#5C5A55] leading-relaxed lowercase">
                everything you need to know about our materials, printing process, and delivery across india.
              </p>
            </div>

            <div className="lg:col-span-7 space-y-4">
              {faqs.map((faq, i) => {
                const isOpen = openFaq === i;
                return (
                  <div
                    key={i}
                    className="bg-white border border-[#D9D6CF] rounded-xl overflow-hidden transition-all"
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      className="w-full p-5 text-left flex items-center justify-between text-sm md:text-base font-bold text-[#0A0A0A] lowercase gap-4"
                    >
                      <span>{faq.q}</span>
                      <span className="shrink-0 text-[#5C5A55]">
                        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 text-xs md:text-sm text-[#5C5A55] leading-relaxed lowercase border-t border-[#D9D6CF]/40 pt-3">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 11. Final CTA Section: Dark background (#0A0A0A), white pill button */}
      <section className="bg-[#0A0A0A] text-white py-28 md:py-36 text-center px-4">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight lowercase text-white mb-4">
            start your book.
          </h2>
          <p className="text-base md:text-lg text-[#D9D6CF] max-w-xl mx-auto mb-10 lowercase">
            upload your photos and see your first spread in 60 seconds.
          </p>
          <Link
            href="/configure"
            className="inline-flex items-center justify-center rounded-full bg-white text-[#0A0A0A] hover:bg-[#F4F2ED] px-10 py-4 text-sm font-medium transition-colors shadow-lg lowercase"
          >
            start my design
          </Link>
        </div>
      </section>
    </div>
  );
}
