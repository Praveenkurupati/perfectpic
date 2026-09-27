"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Star, ShieldCheck, Droplet, Layout, Check, ChevronRight, 
  Eye, X, Sparkles, BookOpen, Layers, ArrowRight 
} from "lucide-react";
import { api } from "@/lib/api";

// Fallback books data so the catalog renders instantly even before backend fetch
const fallbackTemplates = [
  {
    id: 'tpl-1',
    slug: 'sri-lanka-travel',
    title: 'Sri Lanka Travel Diary',
    subtitle: 'A journey through the tear drop of India',
    description: 'Perfect for capturing the vibrant colors, ancient ruins, misty tea hills, and golden beaches of Sri Lanka.',
    category: 'Travel',
    coverImage: 'https://images.unsplash.com/photo-1588416936097-41850ab3d86d?w=800&auto=format&fit=crop',
    templatePhotos: [
      'https://images.unsplash.com/photo-1580974582391-a6649c82a85f?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1579564177579-22a49f50f2fb?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1620216664966-218eb8a40d51?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1533050487297-09b450131914?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1586526462747-d5d1ea857f13?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1625736173007-88fcf32d20d7?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1582496739818-d4cbf2826cce?w=600&auto=format&fit=crop'
    ],
    pricing: { '8.25': 1999, '10': 2499 },
    basePages: 40,
    maxPhotos: 100,
    badge: 'Bestseller'
  },
  {
    id: 'tpl-2',
    slug: 'colombia-adventure',
    title: 'Colombia Adventure',
    subtitle: 'Vibrant colonial streets, coffee valleys & Andean peaks',
    description: 'Document your journey through the colorful balconies of Cartagena, the wax palms of Salento, and lush coffee fincas.',
    category: 'Travel',
    coverImage: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=800&auto=format&fit=crop',
    templatePhotos: [
      'https://images.unsplash.com/photo-1583321526487-75d8d067ed77?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1589133342379-450f28246bc5?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1538354670077-7422f0853515?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1601614917409-e137b75249f0?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1587399887756-3c072b220d53?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1588691880947-f376cc0954b8?w=600&auto=format&fit=crop'
    ],
    pricing: { '8.25': 1999, '10': 2499 },
    basePages: 40,
    maxPhotos: 80,
    badge: 'New'
  },
  {
    id: 'tpl-3',
    slug: 'annapurna-base-camp',
    title: 'Annapurna Base Camp',
    subtitle: 'Trekking into the sanctuary of the majestic Himalayas',
    description: 'A grand book for a grand adventure. Showcase the awe-inspiring peaks, prayer flags, sunrise summits, and the spirit of high-altitude trekking.',
    category: 'Travel',
    coverImage: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop',
    templatePhotos: [
      'https://images.unsplash.com/photo-1522204646733-5c7ffce4141d?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1541819612089-a2991e2b585d?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1544735716-f2868ff8373b?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1517408800924-42f885e72d24?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1548110594-e3c3b52d439b?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1629851722883-9bfa3d0d603a?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1551608674-f25bbfb8a4f6?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1510252879573-0ff7dc218412?w=600&auto=format&fit=crop'
    ],
    pricing: { '8.25': 2499, '10': 2999 },
    basePages: 48,
    maxPhotos: 120,
    badge: 'Popular Pick'
  },
  {
    id: 'tpl-4',
    slug: 'first-anniversary',
    title: 'Our 1st Anniversary',
    subtitle: 'Celebrating 365 days of love, laughter & new chapters',
    description: 'Relive the most romantic moments, candid smiles, and first-year milestones in a luxury lay-flat keepsake book.',
    category: 'Anniversary',
    coverImage: 'https://images.unsplash.com/photo-1529636798458-92182e662485?w=800&auto=format&fit=crop',
    templatePhotos: [
      'https://images.unsplash.com/photo-1518193026322-26162334f664?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1494955870715-979c4f10164f?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&auto=format&fit=crop'
    ],
    pricing: { '8.25': 1999, '10': 2499 },
    basePages: 36,
    maxPhotos: 75,
    badge: 'Milestone'
  }
];

export default function Home() {
  const [allProducts, setAllProducts] = useState<any[]>(fallbackTemplates);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [previewBook, setPreviewBook] = useState<any | null>(null);

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

  const filteredProducts = activeCategory === "all" 
    ? allProducts 
    : allProducts.filter(p => p.category?.toLowerCase() === activeCategory.toLowerCase());

  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center pt-24 pb-16 overflow-hidden bg-cream-50">
        <div className="container mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="max-w-2xl z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-cream-200/80 border border-cream-300 rounded-full text-xs font-semibold uppercase tracking-wider text-noir-800 mb-6">
              <Sparkles size={14} className="text-foil-gold" />
              <span>India&apos;s Finest Handcrafted Photobooks</span>
            </div>
            <h1 className="font-serif text-5xl md:text-7xl font-medium leading-[1.08] text-noir-950 mb-6">
              Your Memories Deserve An Heirloom.
            </h1>
            <p className="font-sans text-lg text-noir-700 mb-10 leading-relaxed max-w-lg">
              Upload from your phone. Our smart engine crafts seamless panoramic layouts printed on tear-proof, lay-flat luxury paper.
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
                Browse Curated Templates
              </a>
            </div>
            
            <div className="mt-12 flex flex-wrap gap-4">
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
          
          <div className="relative h-[420px] md:h-[580px] w-full flex justify-center items-center">
            {/* Visual Book Showcase Mockup */}
            <div className="relative w-[320px] h-[440px] md:w-[460px] md:h-[580px] rounded-sm overflow-hidden shadow-book-spread border border-cream-300 transform -rotate-3 hover:rotate-0 transition-transform duration-700 group">
              <img 
                src="https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop" 
                alt="Photobook Showcase" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-noir-950/80 via-transparent to-noir-950/20" />
              <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black/40 to-transparent"></div>
              
              <div className="absolute bottom-6 left-6 right-6 text-cream-50">
                <span className="text-[10px] uppercase tracking-[0.25em] text-foil-gold font-semibold">Featured Edition</span>
                <h3 className="font-serif text-2xl font-medium mt-1">Annapurna Base Camp Sanctuary</h3>
                <p className="text-xs text-cream-50/70 mt-1">10&quot; × 10&quot; Grand Lay-Flat Edition</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Milestone Grid */}
      <section className="py-20 bg-white border-b border-cream-200">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-14">
            <h2 className="font-serif text-3xl md:text-5xl text-noir-900 mb-3">Designed For Every Chapter of Life</h2>
            <p className="text-noir-600 max-w-xl mx-auto text-sm md:text-base">Pick a milestone theme to jumpstart your layout with curated font pairings and grids.</p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 md:gap-4">
            {[
              { name: "Travel", emoji: "✈️", filter: "travel" },
              { name: "Anniversary", emoji: "🥂", filter: "anniversary" },
              { name: "Wedding", emoji: "💍", filter: "wedding" },
              { name: "Baby & Kids", emoji: "👶", filter: "baby" },
              { name: "Birthday", emoji: "🎂", filter: "birthday" },
              { name: "Festivals", emoji: "🪔", filter: "festivals" },
              { name: "Pet & Paws", emoji: "🐾", filter: "pets" },
              { name: "Portfolios", emoji: "✨", filter: "portfolios" }
            ].map((cat, i) => (
              <button 
                key={i} 
                onClick={() => {
                  if (cat.filter === 'travel' || cat.filter === 'anniversary') {
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

      {/* E-Commerce Book Catalog Section (Sri Lanka, Colombia, Annapurna, 1st Anniversary) */}
      <section id="catalog" className="py-24 bg-cream-50 scroll-mt-16">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-foil-gold font-semibold mb-2">
                <BookOpen size={14} />
                <span>Curated E-Commerce Catalog</span>
              </div>
              <h2 className="font-serif text-3xl md:text-5xl text-noir-950 font-medium">Ready-To-Customize Books</h2>
              <p className="text-noir-600 mt-2 text-sm md:text-base max-w-xl">
                Start with authentic photo books featuring real destination & milestone templates. Pre-loaded with layouts and sample photos.
              </p>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap gap-2 bg-cream-200/60 p-1.5 rounded-sm border border-cream-300 self-start md:self-auto">
              {[
                { id: "all", label: "All Books" },
                { id: "travel", label: "✈️ Travel Diaries (3)" },
                { id: "anniversary", label: "🥂 Anniversary (1)" },
                { id: "wedding", label: "💍 Wedding" },
                { id: "baby", label: "👶 Baby & Kids" },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategory(tab.id)}
                  className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-sm transition-all ${
                    activeCategory === tab.id
                      ? "bg-noir-950 text-cream-50 shadow-sm"
                      : "text-noir-700 hover:text-noir-950 hover:bg-cream-100"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {filteredProducts.map(product => (
              <div 
                key={product.id} 
                className="group bg-white border border-cream-200 rounded-sm overflow-hidden flex flex-col hover:shadow-luxury-md hover:border-cream-300 transition-all duration-300"
              >
                {/* Cover Image & Quick Action */}
                <div className="relative aspect-[4/3] overflow-hidden bg-cream-100">
                  <img 
                    src={product.coverImage} 
                    alt={product.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                  
                  {/* Badge */}
                  {product.badge && (
                    <span className="absolute top-3 left-3 bg-noir-950 text-cream-50 text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-sm shadow-sm">
                      {product.badge}
                    </span>
                  )}

                  {/* Quick View Button on hover */}
                  <button 
                    onClick={() => setPreviewBook(product)}
                    className="absolute bottom-3 right-3 bg-white/95 text-noir-900 text-xs font-medium px-3 py-1.5 rounded-sm shadow-sm opacity-90 group-hover:opacity-100 transition-all flex items-center gap-1.5 hover:bg-white"
                  >
                    <Eye size={13} />
                    <span>Preview Photos</span>
                  </button>
                </div>

                {/* Details Body */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-foil-gold font-semibold mb-1">
                      <span>{product.category}</span>
                      <span className="text-noir-500 font-normal">{product.basePages} Pages</span>
                    </div>

                    <h3 className="font-serif text-xl text-noir-950 font-medium mb-1.5 leading-snug group-hover:text-foil-gold transition-colors">
                      {product.title}
                    </h3>
                    
                    <p className="text-xs text-noir-600 mb-4 line-clamp-2 leading-relaxed">
                      {product.subtitle || product.description}
                    </p>

                    {/* Template Photos Strip preview */}
                    <div className="mb-4">
                      <span className="text-[10px] uppercase tracking-wider text-noir-500 font-semibold block mb-1.5">
                        Template Sample Photos ({product.templatePhotos?.length || 0})
                      </span>
                      <div className="grid grid-cols-4 gap-1.5">
                        {(product.templatePhotos || []).slice(0, 4).map((imgUrl: string, idx: number) => (
                          <div 
                            key={idx} 
                            onClick={() => setPreviewBook(product)}
                            className="aspect-square bg-cream-200 rounded-[2px] overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                          >
                            <img src={imgUrl} alt={`Sample ${idx + 1}`} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Pricing and Action */}
                  <div className="pt-4 border-t border-cream-200">
                    <div className="flex items-baseline justify-between mb-3">
                      <span className="text-xs text-noir-600">Starting price</span>
                      <span className="font-serif text-2xl font-semibold text-noir-950">
                        ₹{(product.pricing?.['8.25'] || 1999).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setPreviewBook(product)}
                        className="py-2.5 px-3 border border-cream-300 text-noir-900 text-xs font-semibold rounded-sm hover:bg-cream-100 transition-colors text-center"
                      >
                        Quick Look
                      </button>
                      <Link 
                        href={`/configure?template=${product.slug}`} 
                        className="py-2.5 px-3 bg-noir-950 text-cream-50 text-xs font-semibold rounded-sm hover:bg-noir-900 transition-colors text-center flex items-center justify-center gap-1 group-hover:bg-noir-900"
                      >
                        <span>Customize</span>
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-16 bg-white border border-cream-200 rounded-sm">
              <Layers size={36} className="mx-auto text-cream-400 mb-3" />
              <h3 className="font-serif text-2xl text-noir-900 mb-1">New Templates Coming Soon</h3>
              <p className="text-sm text-noir-600 max-w-md mx-auto mb-6">
                Our design studio is curating new layout themes for this category. In the meantime, you can customize any book from scratch!
              </p>
              <Link 
                href="/configure"
                className="inline-flex items-center px-6 py-3 bg-noir-950 text-cream-50 text-sm font-medium rounded-sm"
              >
                Create Custom Book
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Quick View / Template Photos Modal */}
      {previewBook && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-sm shadow-luxury-xl border border-cream-300 p-6 md:p-8 relative">
            <button 
              onClick={() => setPreviewBook(null)}
              className="absolute top-4 right-4 text-noir-500 hover:text-noir-950 p-2"
            >
              <X size={22} />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="aspect-[4/3] rounded-sm overflow-hidden bg-cream-100 border border-cream-200">
                <img src={previewBook.coverImage} alt={previewBook.title} className="w-full h-full object-cover" />
              </div>

              <div>
                <span className="text-[11px] uppercase tracking-widest text-foil-gold font-bold">{previewBook.category} Template</span>
                <h2 className="font-serif text-3xl font-medium text-noir-950 mt-1 mb-2">{previewBook.title}</h2>
                <p className="text-sm text-noir-600 mb-6 leading-relaxed">{previewBook.description}</p>

                <div className="space-y-2.5 text-xs text-noir-700 bg-cream-50 p-4 border border-cream-200 rounded-sm mb-6">
                  <div className="flex justify-between">
                    <span className="text-noir-500">Included Pages:</span>
                    <span className="font-semibold">{previewBook.basePages} Pages (expandable to 100)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-noir-500">Photos Capacity:</span>
                    <span className="font-semibold">Up to {previewBook.maxPhotos} photos</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-noir-500">Paper Quality:</span>
                    <span className="font-semibold">100% Tear-Proof Lay-Flat Synthetic</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-noir-500">Available Sizes:</span>
                    <span className="font-semibold">8.25&quot; × 8.25&quot; and 10&quot; × 10&quot;</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-6">
                  <div>
                    <span className="text-xs text-noir-500">Starting Price</span>
                    <div className="font-serif text-3xl font-semibold text-noir-950">
                      ₹{(previewBook.pricing?.['8.25'] || 1999).toLocaleString('en-IN')}
                    </div>
                  </div>
                  <Link 
                    href={`/configure?template=${previewBook.slug}`}
                    className="px-8 py-3.5 bg-noir-950 text-cream-50 font-medium text-sm rounded-sm hover:bg-noir-900 transition-colors shadow-sm"
                  >
                    Select This Template →
                  </Link>
                </div>
              </div>
            </div>

            {/* Template Photos Gallery */}
            <div>
              <h3 className="font-serif text-xl font-medium text-noir-950 mb-3">
                Pre-Loaded Template Photos ({previewBook.templatePhotos?.length || 0})
              </h3>
              <p className="text-xs text-noir-600 mb-4">
                These high-definition photos are included in the template to guide your layout. You can keep them or swap with your own memories.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {(previewBook.templatePhotos || []).map((photoUrl: string, i: number) => (
                  <div key={i} className="aspect-[4/3] bg-cream-100 rounded-sm overflow-hidden border border-cream-200">
                    <img src={photoUrl} alt={`Template photo ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Craftsmanship Section */}
      <section className="py-24 bg-white border-t border-cream-200">
        <div className="container mx-auto px-4 md:px-8">
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
        <div className="container mx-auto px-4 md:px-8 text-center">
          <h2 className="font-serif text-4xl md:text-5xl mb-4 text-cream-50">Transparent Pricing. No Hidden Costs.</h2>
          <p className="text-cream-50/70 mb-12 max-w-2xl mx-auto">Calculate your exact price before you start. Free shipping PAN-India on all orders.</p>
          
          <div className="max-w-4xl mx-auto bg-noir-900 border border-noir-700 p-8 rounded-sm shadow-luxury-lg">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-8 md:space-y-0">
              <div className="text-left">
                <h3 className="font-sans text-xl font-medium mb-2">Standard 8.25&quot; × 8.25&quot;</h3>
                <p className="text-cream-50/60">Hardcover • 40 Pages • Up to 120 Photos • Lay-Flat</p>
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
        <div className="container mx-auto px-4 md:px-8">
          <div className="bg-cream-100 border border-foil-gold/30 p-8 md:p-12 rounded-sm text-center shadow-luxury-md">
            <h2 className="font-serif text-3xl md:text-4xl text-noir-900 mb-4">Family & Corporate Bundles</h2>
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
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl md:text-5xl text-noir-900 mb-4">Loved by 10,000+ Families</h2>
            <div className="flex items-center justify-center space-x-2 text-noir-900">
              <span className="font-bold text-xl">4.9</span>
              <div className="flex text-foil-gold">
                {[1,2,3,4,5].map(s => <Star key={s} size={20} fill="currentColor" />)}
              </div>
              <span className="text-noir-700">on Google Reviews</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              { name: "Priya S.", text: "The print quality blew me away. It literally looks like a luxury coffee table book you'd buy in a high-end store." },
              { name: "Rahul M.", text: "My toddler spilled water on it the first day. I wiped it off and it was completely fine. Worth every rupee." },
              { name: "Neha K.", text: "The AI layout feature saved me hours. It perfectly grouped photos from our Sri Lanka trip. Highly recommend!" }
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
            Bring them into the real world with a premium handcrafted photobook.
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
