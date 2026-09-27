"use client";

import Link from "next/link";
import { Star } from "lucide-react";

export interface BookItem {
  id: string;
  slug: string;
  seriesLabel: string; // e.g. "travel series", "travel edit", "moments series"
  bookType?: 'custom photobook' | 'custom magazine' | string;
  title: string; // e.g. "custom photobook", "custom magazine"
  displayName?: string;
  tagline: string; // e.g. "your journeys, perfectly told"
  subtitle?: string;
  category?: string;
  tags?: string[];
  pageOptions?: number[];
  coverImage: string;
  coverColor?: string;
  spineText?: string;
  rating?: number;
  reviewCount?: number;
  fromPrice: number;
  badge?: string; // "new", "bestseller", etc.
}

export default function BookCard({ book }: { book: BookItem }) {
  const isMagazine = book.bookType === 'custom magazine';
  const coverBg = book.coverColor || (isMagazine ? '#F5C4CD' : '#F8BAC7');

  return (
    <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 shadow-sm hover:shadow-luxury-md transition-all duration-300 flex flex-col justify-between group">
      <div>
        {/* Top Header: Series Name (lowercase) & Optional Badge */}
        <div className="flex justify-between items-center mb-6">
          <span className="text-base font-bold tracking-tight text-neutral-400 lowercase select-none">
            {book.seriesLabel}
          </span>
          {book.badge && (
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#fcedea] text-[#d96a54] lowercase tracking-wide">
              {book.badge}
            </span>
          )}
        </div>

        {/* 3D Photobook / Magazine Presentation Showcase (Clickable to detail page) */}
        <Link 
          href={`/templates/${book.slug}`}
          className="h-72 w-full flex items-center justify-center py-4 px-2 mb-6 perspective-[1000px] cursor-pointer block"
          title="Click to view full specifications & options"
        >
          {isMagazine ? (
            /* Custom Magazine Mockup */
            <div className="relative w-44 h-60 rounded-[3px] p-2.5 shadow-2xl transition-transform duration-500 group-hover:scale-105 group-hover:-translate-y-1" style={{ backgroundColor: coverBg }}>
              <div className="w-full h-full relative overflow-hidden rounded-[2px] bg-neutral-900 border border-white/20">
                <img 
                  src={book.coverImage} 
                  alt={book.displayName || book.title} 
                  className="w-full h-full object-cover" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 p-3 flex flex-col justify-between">
                  <span className="font-serif text-xl font-bold tracking-[0.2em] text-white text-center uppercase">
                    {book.spineText || 'MAGAZINE'}
                  </span>
                  <div className="text-left">
                    <span className="text-[8px] uppercase tracking-widest text-white/80 block">Curated Edition</span>
                    <span className="text-[10px] font-semibold text-white tracking-wider uppercase block">
                      {book.displayName || 'The Editorial'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* 3D Standing Hardcover Photobook Mockup */
            <div className="relative group/book flex items-center justify-center">
              {/* Floor Shadow */}
              <div className="absolute -bottom-4 w-40 h-6 bg-black/20 rounded-full blur-md transform scale-x-110" />

              {/* Standing Book Assembly */}
              <div 
                className="relative w-40 h-56 rounded-r-[4px] flex overflow-hidden shadow-[0_20px_35px_-10px_rgba(0,0,0,0.3)] border border-black/10 transition-transform duration-500 group-hover:rotate-0 transform rotate-[-3deg] group-hover:scale-105"
                style={{ backgroundColor: coverBg }}
              >
                {/* Book Spine on the Left */}
                <div className="w-6 bg-black/15 flex items-center justify-center border-r border-black/15 shrink-0 relative overflow-hidden">
                  <span className="text-[9px] font-bold text-white tracking-[0.25em] uppercase transform -rotate-90 whitespace-nowrap select-none drop-shadow-sm">
                    {book.spineText || 'PERFECTPIC'}
                  </span>
                  {/* Spine Crease Illusion */}
                  <div className="absolute inset-y-0 right-0 w-[1px] bg-white/20" />
                </div>

                {/* Front Cover Artwork */}
                <div className="flex-1 relative overflow-hidden bg-neutral-100 flex flex-col justify-between p-2.5">
                  <img 
                    src={book.coverImage} 
                    alt={book.displayName || book.title} 
                    className="w-full h-full object-cover absolute inset-0" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />
                  
                  <div className="relative z-10">
                    <span className="font-display text-sm font-bold tracking-[0.2em] text-white uppercase drop-shadow-md">
                      {book.spineText || 'ALBUM'}
                    </span>
                  </div>

                  <div className="relative z-10">
                    <p className="text-[9px] font-semibold text-white uppercase tracking-wider line-clamp-1 drop-shadow-md">
                      {book.displayName || 'Photobook'}
                    </p>
                  </div>

                  {/* Right Page Edge Thickness */}
                  <div className="absolute inset-y-0 right-0 w-[3px] bg-gradient-to-l from-white/90 to-transparent" />
                </div>
              </div>
            </div>
          )}
        </Link>

        {/* Rating and Price Row */}
        <div className="flex items-center justify-between mb-2">
          {/* 5 Stars Rating */}
          <div className="flex items-center space-x-1">
            <div className="flex text-neutral-400">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star 
                  key={s} 
                  size={14} 
                  fill="currentColor" 
                  stroke="none" 
                  className="text-neutral-400" 
                />
              ))}
            </div>
            <span className="text-xs text-neutral-400 font-medium ml-1">
              ({book.reviewCount || 72})
            </span>
          </div>

          {/* Price */}
          <div className="text-right flex items-baseline gap-1">
            <span className="text-[11px] text-neutral-400 lowercase">from</span>
            <span className="text-lg font-bold text-neutral-900 tracking-tight">
              ₹{book.fromPrice?.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Book Title (lowercase bold, clickable to detail view) */}
        <Link href={`/templates/${book.slug}`} className="hover:text-amber-900 transition-colors block">
          <h3 className="text-xl font-bold text-neutral-900 tracking-tight leading-snug lowercase">
            {book.title}
          </h3>
        </Link>

        {/* Tagline (lowercase subtle) */}
        <p className="text-xs text-neutral-500 mt-1 lowercase font-normal leading-relaxed">
          {book.tagline || book.subtitle}
        </p>

        {/* Search Meta Tags */}
        {book.tags && book.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {book.tags.slice(0, 3).map((tag, idx) => (
              <span key={idx} className="text-[10px] text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full font-mono">
                #{tag}
              </span>
            ))}
            {book.tags.length > 3 && (
              <span className="text-[10px] text-neutral-400 self-center">+{book.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>

      {/* Button: start my design */}
      <div className="mt-6 pt-2">
        <Link
          href={`/configure?template=${book.slug}`}
          className="w-full block py-3.5 px-6 rounded-full bg-[#363636] hover:bg-black text-white text-center text-sm font-semibold tracking-tight transition-all duration-200 shadow-sm hover:shadow"
        >
          start my design
        </Link>
      </div>
    </div>
  );
}
