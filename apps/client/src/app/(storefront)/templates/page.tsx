'use client';

import { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import ModernBookCard from '@/features/catalog/components/ModernBookCard';
import { fallbackCatalog, FallbackBook } from '@/features/catalog/data/catalogFallback';

function CatalogContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || 'all';

  const [activeFilter, setActiveFilter] = useState<string>(initialCategory.toLowerCase());
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'price-asc' | 'price-desc'>('popular');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState<number>(12);

  const filterCategories = [
    { id: 'all', label: 'all' },
    { id: 'travel', label: 'travel' },
    { id: 'trek', label: 'trek' },
    { id: 'wedding', label: 'wedding' },
    { id: 'baby', label: 'baby' },
    { id: 'birthday', label: 'birthday' },
    { id: 'anniversary', label: 'anniversary' },
    { id: 'festivals', label: 'festivals' },
  ];

  const filteredBooks = useMemo(() => {
    let list = fallbackCatalog.filter((book) => {
      if (activeFilter === 'all') return true;
      const cat = book.category?.toLowerCase() || '';
      const series = book.seriesLabel?.toLowerCase() || '';
      const tags = (book.tags || []).map((t) => t.toLowerCase());

      if (activeFilter === 'travel') return cat === 'travel' || series.includes('travel');
      if (activeFilter === 'trek') return cat === 'trek' || series.includes('trek');
      if (activeFilter === 'wedding') return cat === 'wedding' || series.includes('wedding');
      if (activeFilter === 'baby') return cat === 'baby' || series.includes('baby');
      if (activeFilter === 'birthday') return cat === 'birthday' || series.includes('birthday');
      if (activeFilter === 'anniversary') return cat === 'anniversary' || series.includes('couples') || series.includes('anniversary');
      if (activeFilter === 'festivals') return cat === 'festivals' || series.includes('festivals');

      return tags.includes(activeFilter) || cat.includes(activeFilter);
    });

    if (sortBy === 'price-asc') {
      list = [...list].sort((a, b) => (a.fromPrice || 1999) - (b.fromPrice || 1999));
    } else if (sortBy === 'price-desc') {
      list = [...list].sort((a, b) => (b.fromPrice || 1999) - (a.fromPrice || 1999));
    } else if (sortBy === 'newest') {
      list = [...list].sort((a, b) => (b.badge === 'new' ? 1 : 0) - (a.badge === 'new' ? 1 : 0));
    } else {
      // popular
      list = [...list].sort((a, b) => (b.priority || 0) - (a.priority || 0));
    }

    return list;
  }, [activeFilter, sortBy]);

  const displayedBooks = filteredBooks.slice(0, visibleCount);
  const hasMore = visibleCount < filteredBooks.length;

  return (
    <div className="min-h-screen bg-white text-gray-900 pt-28 pb-20 select-none">
      <div className="container mx-auto px-4 md:px-8 max-w-7xl">
        {/* 1. Breadcrumbs */}
        <div className="mb-4">
          <p className="text-xs text-gray-400 font-mono">
            <Link href="/" className="hover:text-black transition-colors">home</Link>
            <span className="mx-1.5">/</span>
            <span className="text-gray-900 font-medium">shop</span>
          </p>
        </div>

        {/* 2. Hero Header (Mockup: all books.) */}
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-black lowercase">
            all books.
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 max-w-2xl mt-3 leading-relaxed">
            lay-flat photobooks for every journey and milestone. printed on archival paper, delivered across india.
          </p>
        </div>

        {/* 3. Filter Pills Row & Sort Dropdown (Mockup) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 pb-2 border-b border-gray-100">
          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {filterCategories.map((cat) => {
              const isActive = activeFilter === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setActiveFilter(cat.id);
                    setVisibleCount(12);
                  }}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-black text-white shadow-xs'
                      : 'bg-white border border-gray-300 text-gray-700 hover:border-black hover:text-black'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Sort Dropdown */}
          <div className="relative shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
              className="px-4 py-1.5 rounded-full border border-gray-300 bg-white text-xs text-gray-700 hover:border-black flex items-center gap-1.5 transition-colors shadow-2xs font-medium"
            >
              <span>sort: {sortBy.replace('-', ' ')}</span>
              <ChevronDown size={13} className="text-gray-500" />
            </button>

            {sortDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 z-40 animate-in fade-in zoom-in-95 text-xs">
                {[
                  { id: 'popular', label: 'popular' },
                  { id: 'newest', label: 'newest' },
                  { id: 'price-asc', label: 'price: low to high' },
                  { id: 'price-desc', label: 'price: high to low' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setSortBy(opt.id as any);
                      setSortDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-1.5 hover:bg-gray-50 transition-colors ${
                      sortBy === opt.id ? 'font-bold text-black bg-gray-50' : 'text-gray-600'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 4. Books Catalog Grid (Mockup: 4 columns) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 gap-y-10">
          {displayedBooks.map((book) => (
            <ModernBookCard key={book.slug} book={book} />
          ))}
        </div>

        {/* 5. Load More Button */}
        {hasMore && (
          <div className="flex justify-center mt-12 mb-16">
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + 12)}
              className="px-8 py-2.5 rounded-full border border-gray-300 bg-white text-black text-xs font-semibold hover:border-black transition-all shadow-2xs"
            >
              load more
            </button>
          </div>
        )}

        {/* 6. Bundle & Save Banner (Mockup solid black banner) */}
        <div className="bg-black text-white p-8 sm:p-12 md:p-14 rounded-2xl md:rounded-3xl mt-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
          <div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white lowercase">
              bundle &amp; save.
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-2 font-mono">
              2 books save ₹300 · 6 books save ₹1,500 · 12 books save ₹4,500
            </p>
          </div>
          <Link
            href="/configure?bundle=true"
            className="px-6 py-2.5 rounded-full bg-white text-black text-xs font-semibold hover:bg-gray-100 transition-colors shadow-xs whitespace-nowrap self-stretch sm:self-auto text-center"
          >
            shop bundles
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function TemplatesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center text-xs font-mono text-gray-400">loading books...</div>}>
      <CatalogContent />
    </Suspense>
  );
}
