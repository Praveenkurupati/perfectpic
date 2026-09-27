"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Star, ShieldCheck, Droplet, Layout, Check, ChevronRight, 
  Sparkles, BookOpen, ArrowRight 
} from "lucide-react";
import { api } from "@/lib/api";
import BookCard, { BookItem } from "@/features/catalog/components/BookCard";
import ExploreCard from "@/features/catalog/components/ExploreCard";

// Top 5 Indian photobooks prioritized for India launch
const fallbackTemplates: BookItem[] = [
  {
    id: 'tpl-1',
    slug: 'trek-series-nethravathi',
    seriesLabel: 'trek series',
    bookType: 'custom photobook',
    title: 'custom photobook',
    displayName: 'Netravati Peak Cloud Trails',
    tagline: 'emerald valleys & western monsoon mist',
    subtitle: 'Chikmagalur Ghats Ridge Hike',
    coverImage: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop',
    coverColor: '#4E7055',
    spineText: 'NETRAVATI',
    rating: 4.9,
    reviewCount: 88,
    fromPrice: 1999,
    badge: 'trending'
  },
  {
    id: 'tpl-2',
    slug: 'travel-series-kerala',
    seriesLabel: 'travel series',
    bookType: 'custom photobook',
    title: 'custom photobook',
    displayName: 'Kerala Gods Own Country',
    tagline: 'swaying palms, backwaters & spice trails',
    subtitle: 'Alleppey, Kumarakom & Kochi',
    coverImage: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&auto=format&fit=crop',
    coverColor: '#3B7A57',
    spineText: 'KERALA',
    rating: 5.0,
    reviewCount: 145,
    fromPrice: 1999,
    badge: 'bestseller'
  },
  {
    id: 'tpl-3',
    slug: 'trek-series-himalaya',
    seriesLabel: 'trek series',
    bookType: 'custom photobook',
    title: 'custom photobook',
    displayName: 'Himalayan Summit Chronicles',
    tagline: 'eternal snowfields & high prayer flags',
    subtitle: 'Great Himalayan Range Expeditions',
    coverImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop',
    coverColor: '#415A77',
    spineText: 'HIMALAYAS',
    rating: 4.9,
    reviewCount: 94,
    fromPrice: 1999,
    badge: 'popular'
  },
  {
    id: 'tpl-4',
    slug: 'travel-series-varkala',
    seriesLabel: 'travel series',
    bookType: 'custom photobook',
    title: 'custom photobook',
    displayName: 'Varkala Bohemian Cliffs',
    tagline: 'red laterite cliffs & arabian sea sunset',
    subtitle: 'North Cliff Surf & Beach Diaries',
    coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop',
    coverColor: '#D87040',
    spineText: 'VARKALA',
    rating: 4.9,
    reviewCount: 92,
    fromPrice: 1999,
    badge: 'popular'
  },
  {
    id: 'tpl-5',
    slug: 'trek-series-kudremukh',
    seriesLabel: 'trek series',
    bookType: 'custom photobook',
    title: 'custom photobook',
    displayName: 'Kudremukh Rolling Meadows',
    tagline: 'shola forests & horse-face peak',
    subtitle: 'Kudremukh National Park Trail',
    coverImage: 'https://images.unsplash.com/photo-1511497584788-87676104235f?w=800&auto=format&fit=crop',
    coverColor: '#606C38',
    spineText: 'KUDREMUKH',
    rating: 4.8,
    reviewCount: 76,
    fromPrice: 1999,
    badge: 'new'
  }
];

export default function Home() {
  const [allProducts, setAllProducts] = useState<BookItem[]>(fallbackTemplates);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  useEffect(() => {
    // Dynamic fetch from centralized backend API
    api.getProducts()
      .then(res => {
        if (res && res.products && res.products.length > 0) {
          setAllProducts(res.products);
        }
      })
      .catch(err => {
        console.warn("Backend API not reachable, using offline catalog:", err);
      });
  }, []);

  const categories = [
    { id: "all", label: "all series" },
    { id: "trek series", label: "trek series" },
    { id: "travel series", label: "travel series" },
    { id: "travel edit", label: "travel edit" },
    { id: "moments series", label: "moments series" },
    { id: "anniversary series", label: "anniversary series" }
  ];

  const filteredProducts = activeCategory === "all" 
    ? allProducts 
    : allProducts.filter(p => p.seriesLabel?.toLowerCase() === activeCategory.toLowerCase());

  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center pt-28 pb-16 overflow-hidden bg-cream-50">
        <div className="container mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Hero Left Content */}
          <div className="lg:col-span-6 z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-cream-200/80 border border-cream-300 rounded-full text-xs font-semibold uppercase tracking-wider text-noir-800 mb-6">
              <Sparkles size={14} className="text-foil-gold" />
              <span>India&apos;s Curated Photobook Platform</span>
            </div>
            <h1 className="font-serif text-5xl md:text-7xl font-medium leading-[1.08] text-noir-950 mb-6">
              Your Memories Deserve An Heirloom.
            </h1>
            <p className="font-sans text-lg text-noir-700 mb-10 leading-relaxed max-w-lg">
              From high Himalayan treks and Western Ghats trails to Kerala backwaters and family milestones. Our smart studio creates seamless panoramic lay-flat photo books crafted in India.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
              <Link 
                href="/configure" 
                className="inline-flex justify-center items-center px-8 py-4 bg-noir-950 text-cream-50 font-medium tracking-wide hover:bg-noir-900 transition-all rounded-sm text-center shadow-luxury-md"
              >
                Start Custom Book
              </Link>
              <a 
                href="#catalog" 
                className="inline-flex justify-center items-center px-8 py-4 bg-white text-noir-900 border border-cream-300 font-medium tracking-wide hover:bg-cream-100 transition-all rounded-sm text-center shadow-sm"
              >
                Explore Indian Collections
              </a>
            </div>
            
            <div className="mt-12 flex flex-wrap gap-3 sm:gap-4">
              <span className="inline-flex items-center px-3.5 py-1.5 bg-white border border-cream-300 rounded-full text-xs font-medium text-noir-700 shadow-sm">
                <Check size={14} className="mr-1.5 text-foil-gold" /> 12K Ultra-HD Indigo
              </span>
              <span className="inline-flex items-center px-3.5 py-1.5 bg-white border border-cream-300 rounded-full text-xs font-medium text-noir-700 shadow-sm">
                <Check size={14} className="mr-1.5 text-foil-gold" /> 100% Non-Tearable Synthetic
              </span>
              <span className="inline-flex items-center px-3.5 py-1.5 bg-white border border-cream-300 rounded-full text-xs font-medium text-noir-700 shadow-sm">
                <Check size={14} className="mr-1.5 text-foil-gold" /> Seamless Lay-Flat Binding
              </span>
            </div>
          </div>
          
          {/* Hero Right Image: User's Reference Curated Journals Tabletop Image */}
          <div className="lg:col-span-6 w-full flex justify-center items-center">
            <div className="relative w-full max-w-[560px] rounded-2xl overflow-hidden shadow-luxury-2xl border border-cream-300/90 bg-white p-3 md:p-4 group transition-all duration-500 hover:shadow-luxury-3xl">
              <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-cream-100">
                <img 
                  src="/images/curated-journals-hero.jpg" 
                  alt="Photomemories: Curated Journals & Hardcovers" 
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
                />
                
                {/* Subtle Luxury Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-noir-950/70 via-transparent to-black/10 pointer-events-none" />

                {/* Floating Gold Pill Badge */}
                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-cream-300 shadow-sm flex items-center gap-1.5">
                  <Sparkles size={12} className="text-foil-gold" />
                  <span className="text-[11px] font-semibold tracking-wider uppercase text-noir-900">Curated Journals</span>
                </div>

                {/* Bottom Overlay Info */}
                <div className="absolute bottom-4 left-4 right-4 text-cream-50 flex items-end justify-between">
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.25em] text-foil-gold font-bold block">
                      Curated Cover Editions
                    </span>
                    <h3 className="font-serif text-xl md:text-2xl font-medium mt-0.5 text-white drop-shadow-md">
                      Bespoke Embossed Hardcovers
                    </h3>
                  </div>
                  <Link 
                    href="#curated-journals"
                    className="hidden sm:inline-flex items-center px-4 py-2 bg-white text-noir-950 text-xs font-semibold uppercase tracking-wider rounded-full shadow-lg hover:bg-cream-100 transition-colors"
                  >
                    View Covers →
                  </Link>
                </div>
              </div>

              {/* Quality Guarantee Ticker Under Image */}
              <div className="mt-3 pt-2.5 border-t border-cream-200/80 flex items-center justify-between text-[11px] text-noir-600 px-1">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Archival Lay-Flat Hardcovers
                </span>
                <span className="hidden sm:inline text-foil-gold font-semibold">Free Delivery PAN-India</span>
                <span>Starting at ₹1,999</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Milestone Quick Grid */}
      <section className="py-16 bg-white border-b border-cream-200">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-10">
            <h2 className="font-serif text-3xl md:text-4xl text-noir-900 mb-2">Designed For Every Indian Journey</h2>
            <p className="text-noir-600 max-w-xl mx-auto text-xs md:text-sm">Pick a milestone theme to jumpstart your layout with curated font pairings and grids.</p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 md:gap-4">
            {[
              { name: "Trekking", emoji: "🏔️", filter: "trek series" },
              { name: "Travel", emoji: "✈️", filter: "travel series" },
              { name: "Magazines", emoji: "📰", filter: "travel edit" },
              { name: "Moments", emoji: "☀️", filter: "moments series" },
              { name: "Anniversary", emoji: "🥂", filter: "anniversary series" },
              { name: "Wedding", emoji: "💍", filter: "wedding" },
              { name: "Baby & Kids", emoji: "👶", filter: "baby" },
              { name: "Festivals", emoji: "🪔", filter: "festivals" }
            ].map((cat, i) => (
              <button 
                key={i} 
                onClick={() => {
                  if (cat.filter.includes('series') || cat.filter.includes('edit')) {
                    setActiveCategory(cat.filter);
                    const el = document.getElementById('catalog');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    window.location.href = `/configure?category=${encodeURIComponent(cat.name)}`;
                  }
                }}
                className={`p-4 rounded-sm border text-center flex flex-col items-center justify-center transition-all cursor-pointer ${
                  activeCategory === cat.filter 
                    ? 'border-noir-950 bg-cream-100 shadow-sm' 
                    : 'border-cream-200 bg-cream-50/60 hover:bg-cream-100 hover:border-cream-300'
                }`}
              >
                <span className="text-3xl mb-2">{cat.emoji}</span>
                <span className="font-medium text-xs text-noir-900">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* PHOTOMEMORIES: CURATED JOURNALS SHOWCASE SECTION */}
      <section id="curated-journals" className="py-20 bg-cream-100/60 border-b border-cream-200">
        <div className="container mx-auto px-4 md:px-8 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Full Curated Journals Art Mockup */}
            <div className="lg:col-span-7">
              <div className="relative rounded-2xl overflow-hidden shadow-luxury-xl border border-cream-300 bg-white p-3 md:p-4">
                <img 
                  src="/images/curated-journals-hero.jpg" 
                  alt="Photomemories: Curated Journals Showcase" 
                  className="w-full h-auto rounded-xl object-cover"
                />
              </div>
            </div>

            {/* Right Column: Highlights & Features */}
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-foil-gold font-bold">
                <BookOpen size={14} />
                <span>Photomemories™ Collection</span>
              </div>
              <h2 className="font-serif text-3xl md:text-5xl text-noir-950 font-medium leading-tight">
                Curated Hardcovers Built for Keepsakes.
              </h2>
              <p className="text-noir-700 text-sm md:text-base leading-relaxed">
                Whether it is the mist of Netravati, the tranquil backwaters of Kerala, or your first anniversary, each cover is crafted with archival cloth-bound board, custom title embossing, and inset photo windows.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-full bg-cream-200 border border-cream-300 flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={16} className="text-foil-gold" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-noir-900">Custom Title Foil & Debossing</h4>
                    <p className="text-xs text-noir-600 mt-0.5">Crisp metallic gold or matte foil lettering along the front and spine.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-full bg-cream-200 border border-cream-300 flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={16} className="text-foil-gold" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-noir-900">Archival Photo Inset Window</h4>
                    <p className="text-xs text-noir-600 mt-0.5">Your hero photograph is recessed with precision beveling directly on the cover.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-full bg-cream-200 border border-cream-300 flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={16} className="text-foil-gold" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-noir-900">100% Lay-Flat Panoramic Binding</h4>
                    <p className="text-xs text-noir-600 mt-0.5">Opens completely flat across every spread so no faces are lost in the center crease.</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/configure"
                  className="inline-flex justify-center items-center px-6 py-3 bg-noir-950 text-cream-50 font-semibold text-xs uppercase tracking-widest rounded-sm hover:bg-noir-900 transition-colors text-center"
                >
                  Customize Any Cover
                </Link>
                <Link
                  href="/templates"
                  className="inline-flex justify-center items-center px-6 py-3 bg-white text-noir-900 border border-cream-300 font-semibold text-xs uppercase tracking-widest rounded-sm hover:bg-cream-100 transition-colors text-center"
                >
                  View All 35+ Books
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Signature Series Book Showcase - Matching User Reference UI */}
      <section id="catalog" className="py-24 bg-[#faf8f5] scroll-mt-16">
        <div className="container mx-auto px-4 md:px-8 max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-foil-gold font-bold mb-2">
                <BookOpen size={14} />
                <span>India Launch Editions</span>
              </div>
              <h2 className="font-serif text-3xl md:text-5xl text-neutral-900 font-medium tracking-tight">
                Curated Series & Editions
              </h2>
              <p className="text-neutral-600 mt-2 text-sm md:text-base max-w-xl leading-relaxed">
                Featured Indian trek series and classic travel journals. Custom printed on high-grade non-tearable synthetic paper with lay-flat spreads.
              </p>
            </div>

            {/* Series Filter Chips */}
            <div className="flex flex-wrap gap-2 self-start md:self-auto">
              {categories.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategory(tab.id)}
                  className={`px-4 py-2 text-xs font-semibold lowercase tracking-wide rounded-full transition-all ${
                    activeCategory === tab.id
                      ? "bg-neutral-900 text-white shadow-sm"
                      : "bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100 hover:text-black"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Book Items Grid (3 Cards per row: 5 Indian books + 6th Explore Card) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.slice(0, 5).map(book => (
              <BookCard key={book.id} book={book} />
            ))}
            <ExploreCard totalCount={allProducts.length || 35} />
          </div>

          {/* View All Templates CTA */}
          <div className="mt-14 text-center">
            <Link
              href="/templates"
              className="inline-flex items-center px-8 py-3.5 bg-white border border-neutral-300 text-neutral-900 rounded-full text-sm font-semibold hover:border-black hover:bg-neutral-50 transition-all shadow-sm group"
            >
              <span>Explore All 35+ Template Collections</span>
              <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Craftsmanship Section */}
      <section className="py-24 bg-white border-t border-cream-200">
        <div className="container mx-auto px-4 md:px-8 max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl md:text-5xl text-noir-900 mb-4">Built to Last. Crafted to Impress.</h2>
            <p className="text-noir-700 max-w-2xl mx-auto">We do not compromise on quality. Every book is printed on industry-leading presses with archival materials.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: "Ultra-HD 12K Print", desc: "Unmatched clarity and color vibrancy that brings your photos to life.", icon: <Star className="w-8 h-8 text-foil-gold mb-4" /> },
              { title: "HP Indigo Certified", desc: "Printed on world-class presses for gallery-quality reproduction.", icon: <ShieldCheck className="w-8 h-8 text-foil-gold mb-4" /> },
              { title: "Non-Tearable Pages", desc: "Synthetic premium paper that resists tearing, perfect for family viewing.", icon: <Layout className="w-8 h-8 text-foil-gold mb-4" /> },
              { title: "Spill-Safe & Waterproof", desc: "Accidents happen. Our pages wipe clean without smudging.", icon: <Droplet className="w-8 h-8 text-foil-gold mb-4" /> },
              { title: "Lay-Flat Binding", desc: "Seamless panoramic spreads that open perfectly flat on the table.", icon: <Layout className="w-8 h-8 text-foil-gold mb-4" /> },
              { title: "Silky Matte Lamination", desc: "A luxurious finish that feels soft to the touch and reduces glare.", icon: <Star className="w-8 h-8 text-foil-gold mb-4" /> },
            ].map((feature, i) => (
              <div key={i} className="bg-cream-50 p-8 border border-cream-300 rounded-sm shadow-luxury-sm">
                {feature.icon}
                <h3 className="font-serif text-xl font-semibold text-noir-900 mb-3">{feature.title}</h3>
                <p className="text-noir-700 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Calculator Highlight */}
      <section className="py-24 bg-noir-950 text-cream-50">
        <div className="container mx-auto px-4 md:px-8 text-center max-w-6xl">
          <h2 className="font-serif text-4xl md:text-5xl mb-4 text-cream-50">Transparent Pricing. No Hidden Costs.</h2>
          <p className="text-cream-50/70 mb-12 max-w-2xl mx-auto">Calculate your exact price before you start. Free shipping PAN-India on all orders.</p>
          
          <div className="max-w-4xl mx-auto bg-noir-900 border border-noir-700 p-8 rounded-sm shadow-luxury-lg">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-8 md:space-y-0">
              <div className="text-left">
                <h3 className="font-sans text-xl font-medium mb-2">Standard 8.25&quot; × 8.25&quot;</h3>
                <p className="text-cream-50/60">Hardcover • 32 Pages (Default) • Up to 120 Photos • Lay-Flat</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-serif mb-2">₹1,999</div>
                <p className="text-cream-50/60 text-sm mb-4">Includes taxes & shipping PAN India</p>
                <Link 
                  href="/configure" 
                  className="inline-flex items-center px-6 py-3 bg-cream-50 text-noir-950 font-medium hover:bg-cream-100 transition-colors rounded-sm"
                >
                  Start Creating <ChevronRight size={16} className="ml-2" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bundle Promotion */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 md:px-8 max-w-6xl">
          <div className="bg-cream-100 border border-foil-gold/30 p-8 md:p-12 rounded-sm text-center shadow-luxury-md">
            <h2 className="font-serif text-3xl md:text-4xl text-noir-900 mb-4">Family & Adventure Bundles</h2>
            <p className="text-noir-700 mb-8 max-w-2xl mx-auto">Perfect for gifting. The more you print, the more you save.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {[
                { count: 3, discount: "₹300 off" },
                { count: 6, discount: "₹1,800 off" },
                { count: 12, discount: "₹4,500 off" }
              ].map((bundle, i) => (
                <div key={i} className="bg-white border border-cream-300 p-6 rounded-sm">
                  <div className="font-serif text-2xl font-semibold mb-2">{bundle.count} Books</div>
                  <div className="text-foil-gold font-medium mb-4">Save {bundle.discount}</div>
                  <div className="text-xs text-noir-700 flex items-center justify-center">
                    <Check size={12} className="mr-1 text-green-600" /> Free Shipping
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-24 bg-cream-50 border-t border-cream-200">
        <div className="container mx-auto px-4 md:px-8 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl md:text-5xl text-noir-900 mb-4">Loved by 10,000+ Indian Explorers & Families</h2>
            <div className="flex items-center justify-center space-x-2 text-noir-900">
              <span className="font-bold text-xl">4.9</span>
              <div className="flex text-foil-gold">
                {[1,2,3,4,5].map(s => <Star key={s} size={20} fill="currentColor" />)}
              </div>
              <span className="text-noir-700">on Google Reviews</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: "Priya S. (Bengaluru)", text: "The print quality blew me away. The Kudremukh trek photos look even better than on my iPhone screen. Worth every single rupee." },
              { name: "Rahul M. (Mumbai)", text: "Our Kerala trip photobook was delivered in 4 days. Non-tearable pages and seamless lay-flat make it look like a luxury gallery volume." },
              { name: "Neha K. (Delhi)", text: "The Himalayan trek edition is stunning. Big bold spreads, no crease obstruction in the center, and the cover foil gives it an heirloom feel." }
            ].map((review, i) => (
              <div key={i} className="bg-white p-8 border border-cream-300 shadow-luxury-sm rounded-sm">
                <div className="flex text-foil-gold mb-4">
                  {[1,2,3,4,5].map(s => <Star key={s} size={16} fill="currentColor" />)}
                </div>
                <p className="text-noir-700 italic mb-6">&ldquo;{review.text}&rdquo;</p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-cream-300 rounded-full flex items-center justify-center text-noir-900 font-bold font-serif mr-3">
                    {review.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-noir-900 text-sm">{review.name}</div>
                    <div className="text-xs text-green-600 flex items-center">
                      <Check size={10} className="mr-1" /> Verified Buyer
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 bg-noir-950 text-cream-50 text-center relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <h2 className="font-serif text-5xl md:text-6xl mb-6 max-w-4xl mx-auto">
            Your Memories Deserve Better Than a Phone Gallery
          </h2>
          <p className="text-xl text-cream-50/70 mb-10 max-w-2xl mx-auto font-sans">
            Bring them into the real world with a premium custom photobook.
          </p>
          <Link 
            href="/configure" 
            className="inline-flex justify-center items-center px-10 py-5 bg-cream-50 text-noir-950 font-semibold tracking-wide hover:bg-cream-100 transition-all rounded-sm text-lg"
          >
            Start Creating Your Book
          </Link>
        </div>
      </section>
    </div>
  );
}
