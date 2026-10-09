'use client';

import { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  Star, 
  Check, 
  ChevronDown, 
  Plus, 
  Minus, 
  ChevronRight,
  ShieldCheck,
  Truck,
  RotateCcw
} from 'lucide-react';
import { 
  fallbackCatalog, 
  getFallbackProduct, 
  FallbackBook 
} from '@/features/catalog/data/catalogFallback';
import ModernBookCard from '@/features/catalog/components/ModernBookCard';
import { trackEvent } from '@/lib/analytics';

function ProductDetailContent() {
  const params = useParams();
  const router = useRouter();
  const slugParam = (params?.slug as string) || 'travel-series-kerala';

  const book: FallbackBook = useMemo(() => {
    return getFallbackProduct(slugParam) || fallbackCatalog[0]!;
  }, [slugParam]);

  const [activeView, setActiveView] = useState<'cover' | 'spread1' | 'spread2' | 'spine'>('cover');
  const [selectedSize, setSelectedSize] = useState<'8.25' | '10'>('8.25');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  const displayShortTitle = book.shortTitle || book.displayName?.toLowerCase().replace(/ peak.*| gods.*| summit.*| cliff.*| rolling.*| coastal.*| milestones| celebrations| keepsake| album| traditions| chronicle/g, '') || book.title;

  const currentPrice = selectedSize === '10' 
    ? (book.pricing?.['10'] || 2499) 
    : (book.fromPrice || 1999);

  // Recommendations: 4 similar or popular books excluding the current book
  const similarBooks = useMemo(() => {
    const others = fallbackCatalog.filter(b => b.slug !== book.slug && b.shortTitle !== book.shortTitle);
    // Prioritize same category/series, then popular
    const sameSeries = others.filter(b => b.category === book.category || b.seriesLabel === book.seriesLabel);
    const remaining = others.filter(b => !sameSeries.includes(b));
    return [...sameSeries, ...remaining].slice(0, 4);
  }, [book]);

  const handleStartBook = (autoArrange: boolean = false) => {
    trackEvent('config_change', 'start_book_clicked', {
      slug: book.slug,
      size: selectedSize,
      autoArrange,
    });
    const url = `/upload/new-project?template=${book.slug}&size=${selectedSize}${autoArrange ? '&autoArrange=true' : ''}`;
    router.push(url);
  };

  const faqs = [
    {
      q: "what's included in the price?",
      a: `₹${currentPrice.toLocaleString('en-IN')} covers a standard ${selectedSize === '10' ? '10" × 10"' : '8.25" × 8.25"'} hardcover with 32 pages, up to 120 photos, archival lay-flat binding, and free pan-india delivery.`
    },
    {
      q: "will my photos look the same in print?",
      a: "yes. our 12-color archival pigment presses replicate digital color gamuts with delta-e under 1.5. if anything does not match your screen, our 100% reprint policy covers a complimentary express reprint."
    },
    {
      q: "can i switch templates after i start?",
      a: "yes! inside the editor studio, you can switch layouts, covers, backgrounds, and themes anytime with a single click."
    },
    {
      q: "what is your reprint policy?",
      a: "if there is any print imperfection, tonal shift, or transit damage, we reprint and express-ship your photobook free of charge. no questions asked."
    }
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900 pt-28 pb-20 select-none">
      <div className="container mx-auto px-4 md:px-8 max-w-7xl">
        {/* 1. Breadcrumbs (Mockup: home / shop / travel series / kerala) */}
        <div className="mb-6">
          <p className="text-xs text-gray-400 font-mono">
            <Link href="/" className="hover:text-black transition-colors">home</Link>
            <span className="mx-1.5">/</span>
            <Link href="/templates" className="hover:text-black transition-colors">shop</Link>
            <span className="mx-1.5">/</span>
            <span className="text-gray-500 lowercase">{book.seriesLabel}</span>
            <span className="mx-1.5">/</span>
            <span className="text-gray-900 font-medium lowercase">{displayShortTitle}</span>
          </p>
        </div>

        {/* 2. Top Hero Section: Split 2 Columns (Mockup) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start mb-24">
          {/* Left Column: Photobook Preview & Thumbnails (lg:col-span-7) */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            {/* Main Book Stage */}
            <div 
              className="aspect-[4/3] rounded-2xl relative overflow-hidden flex items-center justify-center p-6 border border-black/5 shadow-xs transition-all duration-300"
              style={{ backgroundColor: book.mockupBg || '#D8D4CC' }}
            >
              {/* Cover View */}
              {activeView === 'cover' && (
                <div className="relative w-72 sm:w-80 h-80 sm:h-96 rounded-r-md shadow-2xl overflow-hidden border border-black/10 flex transition-all animate-in fade-in">
                  {/* Spine on left */}
                  <div className="w-8 bg-black/20 flex items-center justify-center border-r border-black/15 shrink-0 relative overflow-hidden">
                    <span className="text-[10px] font-bold text-white tracking-[0.25em] uppercase transform -rotate-90 whitespace-nowrap select-none">
                      {book.spineText || displayShortTitle.toUpperCase()}
                    </span>
                    <div className="absolute inset-y-0 right-0 w-[1px] bg-white/20" />
                  </div>
                  {/* Cover Art */}
                  <div className="flex-1 relative overflow-hidden bg-neutral-900">
                    <img 
                      src={book.coverImage} 
                      alt={displayShortTitle} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 p-5 flex flex-col justify-between text-white">
                      <span className="text-[9px] uppercase tracking-widest text-white/80 font-mono">{book.seriesLabel}</span>
                      <div>
                        <h2 className="font-serif text-2xl font-bold uppercase tracking-wider">{displayShortTitle}</h2>
                        <p className="text-[11px] text-white/80 mt-1 italic">{book.subtitle}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Inside Spread 1 (Two-page layflat view) */}
              {activeView === 'spread1' && (
                <div className="relative w-full max-w-lg aspect-[16/9] bg-white rounded-md shadow-2xl overflow-hidden flex border border-black/10 p-3 sm:p-4 gap-2 transition-all animate-in fade-in">
                  <div className="flex-1 bg-gray-100 rounded-sm overflow-hidden relative">
                    <img 
                      src={book.templatePhotos[0] || book.coverImage} 
                      alt="Spread Left" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Crease shadow */}
                  <div className="w-[1px] bg-black/20 shrink-0 relative">
                    <div className="absolute inset-y-0 -left-2 w-4 bg-gradient-to-r from-black/10 via-transparent to-black/10 pointer-events-none" />
                  </div>
                  <div className="flex-1 bg-gray-100 rounded-sm overflow-hidden relative">
                    <img 
                      src={book.templatePhotos[1] || book.coverImage} 
                      alt="Spread Right" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              {/* Inside Spread 2 (Panoramic layflat view) */}
              {activeView === 'spread2' && (
                <div className="relative w-full max-w-lg aspect-[16/9] bg-white rounded-md shadow-2xl overflow-hidden flex flex-col justify-between border border-black/10 p-4 transition-all animate-in fade-in">
                  <div className="flex-1 relative overflow-hidden rounded-sm">
                    <img 
                      src={book.templatePhotos[2] || book.coverImage} 
                      alt="Spread Panoramic" 
                      className="w-full h-full object-cover"
                    />
                    {/* Spine crease line */}
                    <div className="absolute inset-y-0 left-1/2 w-[1px] bg-black/20" />
                  </div>
                  <div className="flex justify-between items-center text-[9px] text-gray-400 font-mono mt-2">
                    <span>180° zero-gutter layflat</span>
                    <span>archival matte 200-year color</span>
                  </div>
                </div>
              )}

              {/* Spine & Back View */}
              {activeView === 'spine' && (
                <div className="relative w-64 h-80 rounded-l-md shadow-2xl bg-neutral-900 text-white flex flex-col justify-between p-8 text-center transition-all animate-in fade-in">
                  <span className="font-serif text-lg font-bold tracking-widest uppercase">PERFECTPIC</span>
                  <div className="space-y-1">
                    <p className="text-xs italic text-white/80">&ldquo;every journey captured with enduring precision.&rdquo;</p>
                    <span className="text-[10px] text-white/50 font-mono block mt-2">Archival Editions · Bengaluru</span>
                  </div>
                  <span className="text-[9px] text-white/40 uppercase tracking-widest font-mono">100% Layflat Guarantee</span>
                </div>
              )}

              {/* Subtle edge overlay */}
              <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-2xl pointer-events-none" />
            </div>

            {/* 4 Thumbnails Below Main Display (Mockup) */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { id: 'cover', label: 'cover', img: book.coverImage },
                { id: 'spread1', label: 'spread 1', img: book.templatePhotos[0] || book.coverImage },
                { id: 'spread2', label: 'spread 2', img: book.templatePhotos[1] || book.coverImage },
                { id: 'spine', label: 'spine', img: book.coverImage },
              ].map((thumb) => {
                const isActive = activeView === thumb.id;
                return (
                  <button
                    key={thumb.id}
                    type="button"
                    onClick={() => setActiveView(thumb.id as any)}
                    className={`aspect-[4/3] rounded-xl overflow-hidden relative border transition-all ${
                      isActive
                        ? 'border-2 border-black ring-1 ring-black shadow-xs'
                        : 'border-gray-200 hover:border-gray-400 opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: book.mockupBg || '#D8D4CC' }}
                  >
                    <img 
                      src={thumb.img} 
                      alt={thumb.label} 
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[8px] font-mono px-1 rounded-xs">
                      {thumb.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Title, Pricing, Specs, CTAs (lg:col-span-5) */}
          <div className="lg:col-span-5 flex flex-col">
            {/* Series Label */}
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              {book.seriesLabel}
            </span>

            {/* Title (Mockup: kerala — custom photobook) */}
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-black lowercase leading-tight mb-2">
              {displayShortTitle} — custom photobook
            </h1>

            {/* Rating & Reviews */}
            <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium mb-4">
              <div className="flex text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={13} fill="currentColor" />
                ))}
              </div>
              <span className="font-bold text-black">4.9</span>
              <span className="text-gray-400">·</span>
              <span className="text-gray-500 font-mono">2,124 reviews</span>
            </div>

            {/* Price & Taxes */}
            <div className="mb-5">
              <div className="text-3xl font-bold text-black font-sans">
                from ₹{currentPrice.toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                inclusive of all taxes · free delivery across india
              </p>
            </div>

            <div className="w-full h-px bg-gray-100 mb-5" />

            {/* Size Selector Dropdown / Option Card */}
            <div className="mb-5">
              <label className="text-xs font-semibold text-gray-700 block mb-1.5 lowercase">
                template size
              </label>
              <div className="relative">
                <select
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value as any)}
                  className="w-full py-3 px-4 rounded-xl border border-gray-300 bg-white text-xs font-medium text-gray-900 appearance-none focus:outline-none focus:border-black cursor-pointer shadow-2xs"
                >
                  <option value="8.25">standard 8.25" × 8.25" (included)</option>
                  <option value="10">large 10" × 10" (+₹500)</option>
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
            </div>

            {/* Feature Bullets with Checkmarks (Mockup) */}
            <div className="space-y-2 mb-6 text-xs text-gray-700">
              <div className="flex items-center gap-2">
                <Check size={14} className="text-black stroke-[2.5] shrink-0" />
                <span>32 pages, up to 120 photos</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={14} className="text-black stroke-[2.5] shrink-0" />
                <span>lay-flat hardcover with silky matte finish</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={14} className="text-black stroke-[2.5] shrink-0" />
                <span>12-color archival pigment print, 200-year color</span>
              </div>
            </div>

            {/* Action Buttons (Mockup: fit my photos & smart creation) */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => handleStartBook(false)}
                className="w-full py-3.5 px-6 rounded-full bg-black text-white text-xs font-semibold hover:bg-neutral-800 transition-colors shadow-xs flex items-center justify-center gap-2"
              >
                <span>fit my photos</span>
              </button>

              <button
                type="button"
                onClick={() => handleStartBook(true)}
                className="w-full py-3.5 px-6 rounded-full bg-white border border-gray-300 text-black text-xs font-semibold hover:bg-gray-50 transition-colors shadow-xs flex items-center justify-center gap-2"
              >
                <span>smart creation — auto-arrange my photos</span>
              </button>
            </div>

            {/* Trust Badges */}
            <p className="text-[11px] text-gray-400 text-center font-mono mt-4">
              100% reprint policy · fast delivery · secure payments
            </p>
          </div>
        </div>

        {/* 3. Section: "everything in the book." (Mockup specs table) */}
        <section className="mb-24 pt-12 border-t border-gray-100">
          <div className="mb-6">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-400 block mb-1">
              technical specs
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-black lowercase">
              everything in the book.
            </h2>
          </div>

          <div className="border-t border-gray-200">
            {[
              { label: 'size', val: selectedSize === '10' ? 'large 10" × 10"' : 'standard 8.25" × 8.25"' },
              { label: 'cover', val: 'premium hardcover' },
              { label: 'binding', val: 'lay-flat, seamless spreads' },
              { label: 'paper', val: 'non-tearable archival, silky matte' },
              { label: 'print', val: '12-color archival pigment print' },
              { label: 'pages', val: '32 included, up to 120 photos' },
              { label: 'delivery', val: 'free, insured, across india' },
            ].map((spec) => (
              <div key={spec.label} className="py-3.5 border-b border-gray-200 flex justify-between items-center text-xs">
                <span className="text-gray-400 lowercase font-medium">{spec.label}</span>
                <span className="text-black font-semibold lowercase text-right">{spec.val}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 4. Section: "three steps. about five minutes." (Mockup) */}
        <section className="mb-24">
          <div className="mb-8">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-400 block mb-1">
              how it works
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-black lowercase">
              three steps. about five minutes.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-gray-200 pt-8">
            <div>
              <span className="text-4xl font-bold text-gray-300 font-mono block mb-2">01</span>
              <h3 className="font-bold text-sm text-black lowercase mb-1">pick a template</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                choose a cover and starting layout designed specifically for your story.
              </p>
            </div>

            <div>
              <span className="text-4xl font-bold text-gray-300 font-mono block mb-2">02</span>
              <h3 className="font-bold text-sm text-black lowercase mb-1">smart creation</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                upload photos and let smart creation arrange them with perfect pacing in minutes.
              </p>
            </div>

            <div>
              <span className="text-4xl font-bold text-gray-300 font-mono block mb-2">03</span>
              <h3 className="font-bold text-sm text-black lowercase mb-1">print &amp; deliver</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                printed in bengaluru on layflat archival paper and express-delivered across india.
              </p>
            </div>
          </div>
        </section>

        {/* 5. Section: "rated 4.9 by 500+ families." (Mockup reviews) */}
        <section className="mb-24">
          <div className="mb-8">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-400 block mb-1">
              reviews
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-black lowercase">
              rated 4.9 by 500+ families.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#FAF8F5] rounded-2xl p-6 border border-gray-100 flex flex-col justify-between">
              <div>
                <div className="flex text-amber-500 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={13} fill="currentColor" />
                  ))}
                </div>
                <p className="text-xs text-gray-800 leading-relaxed italic mb-4">
                  &ldquo;the color vibrancy blew us away. exactly as we remember our wedding.&rdquo;
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-black lowercase">priya &amp; arjun sharma</p>
                <p className="text-[11px] text-gray-400 font-mono mt-0.5">bengaluru · verified</p>
              </div>
            </div>

            <div className="bg-[#FAF8F5] rounded-2xl p-6 border border-gray-100 flex flex-col justify-between">
              <div>
                <div className="flex text-amber-500 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={13} fill="currentColor" />
                  ))}
                </div>
                <p className="text-xs text-gray-800 leading-relaxed italic mb-4">
                  &ldquo;the 180° layflat panoramic spreads are pure magic. no gutter cut.&rdquo;
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-black lowercase">vikram malhotra</p>
                <p className="text-[11px] text-gray-400 font-mono mt-0.5">mumbai · verified</p>
              </div>
            </div>

            <div className="bg-[#FAF8F5] rounded-2xl p-6 border border-gray-100 flex flex-col justify-between">
              <div>
                <div className="flex text-amber-500 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={13} fill="currentColor" />
                  ))}
                </div>
                <p className="text-xs text-gray-800 leading-relaxed italic mb-4">
                  &ldquo;the matte finish doesn't pick up a single fingerprint. a true heirloom.&rdquo;
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-black lowercase">ananya &amp; rohan kulkarni</p>
                <p className="text-[11px] text-gray-400 font-mono mt-0.5">delhi · verified</p>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Section: "questions, answered." (Mockup FAQ Accordion) */}
        <section className="mb-24">
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-black lowercase">
              questions, answered.
            </h2>
          </div>

          <div className="border-t border-gray-200">
            {faqs.map((faq, idx) => {
              const isOpen = expandedFaq === idx;
              return (
                <div key={idx} className="border-b border-gray-200">
                  <button
                    type="button"
                    onClick={() => setExpandedFaq(isOpen ? null : idx)}
                    className="w-full py-4 flex items-center justify-between text-left text-xs sm:text-sm font-semibold text-black hover:text-gray-600 transition-colors lowercase"
                  >
                    <span>{faq.q}</span>
                    <span className="text-gray-500 font-mono text-base ml-2">
                      {isOpen ? '−' : '+'}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="pb-4 text-xs text-gray-600 leading-relaxed animate-in fade-in">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 7. Section: User Request - Recommend / Similar Books Below */}
        <section className="mb-24">
          <div className="flex justify-between items-end mb-8">
            <div>
              <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-400 block mb-1">
                more editions
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-black lowercase">
                similar photobooks.
              </h2>
            </div>
            <Link 
              href="/templates" 
              className="text-xs font-semibold text-black hover:underline flex items-center gap-1"
            >
              <span>view all books</span>
              <ChevronRight size={13} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 gap-y-10">
            {similarBooks.map((simBook) => (
              <ModernBookCard key={simBook.slug} book={simBook} />
            ))}
          </div>
        </section>

        {/* 8. Bottom CTA Banner (Mockup: start your book.) */}
        <div className="bg-black text-white p-8 sm:p-12 md:p-14 rounded-2xl md:rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
          <div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white lowercase">
              start your book.
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-2 font-mono">
              fit your photos or let smart creation auto-arrange them in seconds.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleStartBook(false)}
            className="px-8 py-3 rounded-full bg-white text-black text-xs font-semibold hover:bg-gray-100 transition-colors shadow-xs whitespace-nowrap self-stretch sm:self-auto text-center"
          >
            fit my photos
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProductDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center text-xs font-mono text-gray-400">loading photobook...</div>}>
      <ProductDetailContent />
    </Suspense>
  );
}
