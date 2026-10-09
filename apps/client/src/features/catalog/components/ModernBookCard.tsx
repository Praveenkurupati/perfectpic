'use client';

import Link from 'next/link';
import { FallbackBook } from '../data/catalogFallback';

export default function ModernBookCard({ book }: { book: FallbackBook }) {
  const displayTitle = book.shortTitle || book.displayName?.toLowerCase().replace(/ peak.*| gods.*| summit.*| cliff.*| rolling.*| coastal.*| milestones| celebrations| keepsake| album| traditions| chronicle/g, '') || book.title;

  return (
    <Link 
      href={`/templates/${book.slug}`} 
      className="group block select-none"
      title={`View ${displayTitle} custom photobook`}
    >
      {/* 1. Book Cover Box (Mockup aspect-ratio with subtle book depth) */}
      <div 
        className="aspect-[4/5] rounded-2xl relative overflow-hidden transition-all duration-300 group-hover:shadow-md group-hover:-translate-y-1 border border-black/5 flex items-center justify-center bg-[#D8D4CC]"
        style={{ backgroundColor: book.mockupBg || '#D8D4CC' }}
      >
        {book.coverImage && (
          <img 
            src={book.coverImage} 
            alt={displayTitle}
            className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        )}

        {/* Realistic Book Spine Crease & Layflat Edge */}
        <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/25 via-black/10 to-transparent pointer-events-none" />
        <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-2xl pointer-events-none" />

        {/* Badge in Top-Left (Mockup: bestseller / new) */}
        {book.badge && (
          <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs text-black text-[10px] font-semibold px-2.5 py-0.5 rounded-full shadow-2xs">
            {book.badge}
          </span>
        )}
      </div>

      {/* 2. Metadata Below Book */}
      <div className="mt-2.5">
        <span className="text-[11px] text-gray-400 font-medium block lowercase">
          {book.seriesLabel}
        </span>
        <h3 className="font-bold text-sm text-black tracking-tight lowercase group-hover:text-gray-700 transition-colors mt-0.5">
          {displayTitle}
        </h3>
        <span className="text-xs text-gray-600 font-medium block mt-0.5">
          from ₹{(book.fromPrice || 1999).toLocaleString('en-IN')}
        </span>
      </div>
    </Link>
  );
}
