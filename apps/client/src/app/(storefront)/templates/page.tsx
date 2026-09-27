"use client";

import { useState, useEffect } from "react";
import BookCard, { BookItem } from "@/features/catalog/components/BookCard";
import { api } from "@/lib/api";
import { Sparkles, ArrowLeft } from "lucide-react";
import Link from "next/link";

const fallbackTemplates: BookItem[] = [
  {
    id: 'tpl-1',
    slug: 'travel-series-paris',
    seriesLabel: 'travel series',
    bookType: 'custom photobook',
    title: 'custom photobook',
    displayName: 'Paris Journey Hardcover',
    tagline: 'your journeys, perfectly told',
    subtitle: 'Timeless moments across the City of Light',
    coverImage: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop',
    coverColor: '#F8BAC7',
    spineText: 'PARIS',
    rating: 5.0,
    reviewCount: 72,
    fromPrice: 1999,
    badge: 'bestseller'
  },
  {
    id: 'tpl-2',
    slug: 'travel-edit-paris',
    seriesLabel: 'travel edit',
    bookType: 'custom magazine',
    title: 'custom magazine',
    displayName: 'The Paris Chapter Edit',
    tagline: 'your travels, front-page featured',
    subtitle: 'Glossy editorial magazine with headline features',
    coverImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop',
    coverColor: '#F5C4CD',
    spineText: 'PARIS EDIT',
    rating: 5.0,
    reviewCount: 72,
    fromPrice: 2499,
    badge: ''
  },
  {
    id: 'tpl-3',
    slug: 'moments-series-summer',
    seriesLabel: 'moments series',
    bookType: 'custom photobook',
    title: 'custom photobook',
    displayName: 'Summer 2026 Coastal Moments',
    tagline: 'your moments, forever kept',
    subtitle: 'Sun-drenched pool days and sunset beach dinners',
    coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop',
    coverColor: '#72C2C6',
    spineText: 'SUMMER 2026',
    rating: 5.0,
    reviewCount: 72,
    fromPrice: 1999,
    badge: 'new'
  },
  {
    id: 'tpl-4',
    slug: 'sri-lanka-travel',
    seriesLabel: 'travel series',
    bookType: 'custom photobook',
    title: 'custom photobook',
    displayName: 'Sri Lanka Tea Hills & Coasts',
    tagline: 'raw landscapes, forever captured',
    subtitle: 'From Sigiriya rock fortress to Ella misty peaks',
    coverImage: 'https://images.unsplash.com/photo-1588416936097-41850ab3d86d?w=800&auto=format&fit=crop',
    coverColor: '#2D4A3E',
    spineText: 'SRI LANKA',
    rating: 4.9,
    reviewCount: 114,
    fromPrice: 1999,
    badge: 'popular'
  },
  {
    id: 'tpl-5',
    slug: 'first-anniversary',
    seriesLabel: 'anniversary series',
    bookType: 'custom photobook',
    title: 'custom photobook',
    displayName: 'Our 1st Anniversary Keepsake',
    tagline: 'years of love, timelessly bound',
    subtitle: 'Celebrating 365 days of laughter and milestones',
    coverImage: 'https://images.unsplash.com/photo-1529636798458-92182e662485?w=800&auto=format&fit=crop',
    coverColor: '#E3C28C',
    spineText: 'CHAPTER ONE',
    rating: 5.0,
    reviewCount: 96,
    fromPrice: 1999,
    badge: 'new'
  }
];

export default function TemplatesPage() {
  const [books, setBooks] = useState<BookItem[]>(fallbackTemplates);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getProducts()
      .then(res => {
        if (res && res.products && res.products.length > 0) {
          setBooks(res.products);
        }
      })
      .catch(err => {
        console.warn("Using offline fallback templates", err);
      })
      .finally(() => setLoading(false));
  }, []);

  const categories = [
    { id: "all", label: "all series" },
    { id: "travel series", label: "travel series" },
    { id: "travel edit", label: "travel edit" },
    { id: "moments series", label: "moments series" },
    { id: "anniversary series", label: "anniversary series" }
  ];

  const filteredBooks = activeCategory === "all"
    ? books
    : books.filter(b => b.seriesLabel?.toLowerCase() === activeCategory.toLowerCase());

  return (
    <div className="min-h-screen bg-[#faf8f5] py-16 md:py-24 px-4 md:px-8">
      <div className="container mx-auto max-w-7xl">
        {/* Breadcrumb / Top Link */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-neutral-500 hover:text-black transition-colors">
            <ArrowLeft size={14} className="mr-1.5" />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-neutral-200 rounded-full text-xs font-semibold uppercase tracking-wider text-neutral-800 mb-4 shadow-sm">
            <Sparkles size={14} className="text-foil-gold" />
            <span>Curated Photobook & Magazine Catalog</span>
          </div>
          <h1 className="font-serif text-4xl md:text-6xl text-neutral-900 font-medium tracking-tight mb-4">
            Heirloom Series Collection
          </h1>
          <p className="text-neutral-600 text-sm md:text-base leading-relaxed">
            Each book is individually handcrafted with 100% tear-proof lay-flat synthetic paper, ultra-HD 12K Indigo reproduction, and customized spine typography.
          </p>

          {/* Filter Chips */}
          <div className="flex flex-wrap justify-center gap-2 mt-8">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-5 py-2 rounded-full text-xs font-semibold lowercase tracking-wide transition-all ${
                  activeCategory === cat.id
                    ? "bg-neutral-900 text-white shadow-sm"
                    : "bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100 hover:text-black"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Books Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredBooks.map(book => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>

        {filteredBooks.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-neutral-200">
            <p className="text-neutral-500 text-sm">No books found in this series currently.</p>
          </div>
        )}
      </div>
    </div>
  );
}
