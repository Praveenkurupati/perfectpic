"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import BookCard, { BookItem } from "@/features/catalog/components/BookCard";
import { api } from "@/lib/api";
import { Sparkles, ArrowLeft, Search, X } from "lucide-react";
import Link from "next/link";
import { Pagination } from "@/components/ui/Pagination";

const popularTags = [
  { id: "all", label: "All" },
  { id: "trek", label: "🏔️ Trekking" },
  { id: "himalayas", label: "❄️ Himalayas" },
  { id: "kerala", label: "🌴 Kerala" },
  { id: "beach", label: "🌊 Beaches" },
  { id: "western ghats", label: "🍃 Western Ghats" },
  { id: "rajasthan", label: "🏰 Heritage" },
  { id: "anniversary", label: "🥂 Anniversary" },
];

function TemplatesContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const initialTag = searchParams.get("tag") || "all";

  const [books, setBooks] = useState<BookItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedTag, setSelectedTag] = useState<string>(initialTag);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(9);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
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
    { id: "trek series", label: "trek series" },
    { id: "travel series", label: "travel series" },
    { id: "travel edit", label: "travel edit" },
    { id: "moments series", label: "moments series" },
    { id: "anniversary series", label: "anniversary series" }
  ];

  // Multi-dimensional filtering: category + tag + text search
  const filteredBooks = books.filter(book => {
    // 1. Category match
    const matchesCategory = activeCategory === "all" || 
      book.seriesLabel?.toLowerCase() === activeCategory.toLowerCase() ||
      book.category?.toLowerCase() === activeCategory.toLowerCase();

    // 2. Tag match
    const matchesTag = selectedTag === "all" ||
      (book.tags && book.tags.some(t => t.toLowerCase() === selectedTag.toLowerCase()));

    // 3. Search query match (title, displayName, tagline, subtitle, tags)
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q ||
      book.title?.toLowerCase().includes(q) ||
      book.displayName?.toLowerCase().includes(q) ||
      book.tagline?.toLowerCase().includes(q) ||
      book.subtitle?.toLowerCase().includes(q) ||
      book.seriesLabel?.toLowerCase().includes(q) ||
      (book.tags && book.tags.some(t => t.toLowerCase().includes(q)));

    return matchesCategory && matchesTag && matchesSearch;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, selectedTag, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredBooks.length / pageSize));
  const paginatedBooks = filteredBooks.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="min-h-screen bg-[#faf8f5] py-16 md:py-24 px-4 md:px-8">
      <div className="container mx-auto max-w-7xl">
        {/* Breadcrumb / Top Link */}
        <div className="mb-8 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-neutral-500 hover:text-black transition-colors">
            <ArrowLeft size={14} className="mr-1.5" />
            <span>Back to Home</span>
          </Link>
          <span className="text-xs text-neutral-400 font-mono">
            {filteredBooks.length} {filteredBooks.length === 1 ? "edition" : "editions"} available
          </span>
        </div>

        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-neutral-200 rounded-full text-xs font-semibold uppercase tracking-wider text-neutral-800 mb-4 shadow-sm">
            <Sparkles size={14} className="text-foil-gold" />
            <span>Curated Photobook & Magazine Catalog</span>
          </div>
          <h1 className="font-serif text-4xl md:text-6xl text-neutral-900 font-medium tracking-tight mb-4">
            Heirloom Series Collection
          </h1>
          <p className="text-neutral-600 text-sm md:text-base leading-relaxed">
            From iconic Indian Himalayan treks to coastal retreats and milestone anniversaries. Each book features exactly one photo per page with elegant gallery margins, printed on 100% tear-proof lay-flat synthetic paper.
          </p>

          {/* Search Bar */}
          <div className="mt-8 max-w-xl mx-auto relative">
            <div className="relative flex items-center">
              <Search className="absolute left-4 w-4 h-4 text-neutral-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search treks, destinations, or themes (e.g. Annapurna, Nethravathi, Kerala)..."
                className="w-full pl-11 pr-10 py-3.5 bg-white border border-neutral-300 rounded-full text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 shadow-sm transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 p-1 text-neutral-400 hover:text-neutral-700 rounded-full"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Quick Tag Filter Pills */}
          <div className="flex flex-wrap justify-center items-center gap-2 mt-4">
            {popularTags.map(tag => (
              <button
                key={tag.id}
                onClick={() => setSelectedTag(tag.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  selectedTag === tag.id
                    ? "bg-neutral-900 text-white shadow-xs"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                {tag.label}
              </button>
            ))}
          </div>

          {/* Series Category Filter Chips */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold lowercase tracking-wide transition-all ${
                  activeCategory === cat.id
                    ? "bg-amber-900/90 text-white shadow-sm"
                    : "bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100 hover:text-black"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Books Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-neutral-200 h-96 animate-pulse p-6" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {paginatedBooks.map(book => (
                <BookCard key={book.id || book.slug} book={book} />
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="mt-8 border-t border-neutral-200/80 pt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredBooks.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                itemLabel="heirloom editions"
              />
            </div>
          </>
        )}

        {!loading && filteredBooks.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-neutral-200 max-w-xl mx-auto p-8 shadow-sm">
            <p className="text-base font-semibold text-neutral-900 mb-1">No matching photo books found</p>
            <p className="text-neutral-500 text-xs mb-6">
              We couldn&apos;t find any books matching &ldquo;{searchQuery || selectedTag}&rdquo;. Try another trek, region, or clear filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedTag("all");
                setActiveCategory("all");
              }}
              className="px-5 py-2 bg-neutral-900 text-white text-xs font-semibold rounded-full hover:bg-black transition-colors"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TemplatesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#faf8f5] flex items-center justify-center text-sm text-neutral-500">Loading catalog...</div>}>
      <TemplatesContent />
    </Suspense>
  );
}
