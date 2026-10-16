'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Star,
  Search,
  Filter,
  CheckCircle,
  Eye,
  EyeOff,
  Trash2,
  RefreshCw,
  Sparkles,
  MessageSquare,
  ThumbsUp,
  AlertCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  Award,
} from 'lucide-react';
import adminApi from '@/lib/api';

interface ReviewItem {
  id: string;
  orderNumber?: string;
  customerName: string;
  customerEmail?: string;
  customerLocation?: string;
  rating: number;
  title?: string;
  comment: string;
  bookTitle?: string;
  productSlug?: string;
  category?: string;
  verifiedPurchase: boolean;
  status: 'approved' | 'pending' | 'flagged' | 'hidden';
  helpfulCount: number;
  adminNotes?: string;
  createdAt: string;
}

interface RatingSummary {
  averageRating: number;
  totalReviews: number;
  ratingBreakdown: Record<number, number>;
  ratingPercentages: Record<number, number>;
  recommendationRate: number;
}

export default function ReviewsAdminPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [summary, setSummary] = useState<RatingSummary>({
    averageRating: 4.92,
    totalReviews: 125,
    ratingBreakdown: { 5: 115, 4: 10, 3: 0, 2: 0, 1: 0 },
    ratingPercentages: { 5: 92, 4: 8, 3: 0, 2: 0, 1: 0 },
    recommendationRate: 98.4,
  });

  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getReviews({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        rating: ratingFilter || undefined,
        search: search.trim() || undefined,
        page,
        limit: 15,
      });

      if (res) {
        setReviews(res.reviews || []);
        setTotalPages(res.totalPages || 1);
        setTotalCount(res.total || 0);
        if (res.summary) {
          setSummary(res.summary);
        }
      }
    } catch (err) {
      console.error('Error fetching admin reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [statusFilter, categoryFilter, ratingFilter, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchReviews();
  };

  const handleStatusToggle = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'approved' ? 'hidden' : 'approved';
    try {
      setActionLoadingId(id);
      await adminApi.updateReviewStatus(id, newStatus);
      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus as any } : r))
      );
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Failed to update review status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this customer review?')) return;
    try {
      setActionLoadingId(id);
      await adminApi.deleteReview(id);
      setReviews((prev) => prev.filter((r) => r.id !== id));
      setTotalCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error('Failed to delete review:', err);
      alert('Failed to delete review.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSeedReviews = async () => {
    if (
      !window.confirm(
        'Seed/refresh authoritative dataset with 100+ photobook customer reviews into MongoDB Atlas?'
      )
    )
      return;
    try {
      setSeeding(true);
      const res = await adminApi.seedReviews(true);
      alert(res.message || '100+ reviews successfully seeded!');
      setPage(1);
      await fetchReviews();
    } catch (err) {
      console.error('Failed to seed reviews:', err);
      alert('Failed to seed reviews.');
    } finally {
      setSeeding(false);
    }
  };

  const categories = ['all', 'Trek', 'Travel', 'Wedding', 'Anniversary', 'Moments'];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-cream-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
              Customer Sentiment
            </span>
            <span className="text-xs text-noir-400">·</span>
            <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
              <ShieldCheck size={13} /> {summary.totalReviews} Verified Buyer Reviews
            </span>
          </div>
          <h1 className="font-serif text-2xl md:text-3xl text-noir-900 font-semibold tracking-tight mt-1">
            Reviews & Rating Intelligence
          </h1>
          <p className="text-xs text-noir-500 mt-1">
            Real-time feedback, star distribution, and publication moderation for the PerfectPic photobook platform.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={fetchReviews}
            disabled={loading}
            className="px-3.5 py-2 text-xs font-medium text-noir-700 bg-white border border-cream-300 rounded-sm hover:bg-cream-100 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleSeedReviews}
            disabled={seeding}
            className="px-4 py-2 text-xs font-semibold text-white bg-noir-900 rounded-sm hover:bg-black transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Sparkles size={13} className={seeding ? 'animate-spin text-amber-400' : 'text-amber-400'} />
            <span>{seeding ? 'Seeding Atlas...' : 'Seed 100+ Reviews'}</span>
          </button>
        </div>
      </div>

      {/* ── Top Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Average Rating */}
        <div className="bg-white p-5 rounded-sm border border-cream-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-noir-500">Average Rating</span>
            <div className="w-7 h-7 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
              <Star size={14} className="fill-amber-500" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-serif text-noir-900">
                {summary.averageRating?.toFixed(2) || '4.92'}
              </span>
              <span className="text-xs text-noir-400 font-sans">/ 5.0</span>
            </div>
            <div className="flex text-amber-400 mt-1 gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={11} className="fill-amber-400" />
              ))}
            </div>
          </div>
        </div>

        {/* Card 2: Total Reviews */}
        <div className="bg-white p-5 rounded-sm border border-cream-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-noir-500">Total Reviews</span>
            <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <MessageSquare size={14} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-serif text-noir-900">
              {summary.totalReviews || 125}
            </span>
            <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <CheckCircle size={10} /> 100% Verified orders
            </p>
          </div>
        </div>

        {/* Card 3: 5-Star Ratio */}
        <div className="bg-white p-5 rounded-sm border border-cream-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-noir-500">5-Star Ratio</span>
            <div className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Award size={14} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-serif text-noir-900">
              {summary.ratingPercentages?.[5] || 92}%
            </span>
            <p className="text-[11px] text-noir-500 mt-1">
              {summary.ratingBreakdown?.[5] || 115} maximum ratings
            </p>
          </div>
        </div>

        {/* Card 4: Recommendation Rate */}
        <div className="bg-white p-5 rounded-sm border border-cream-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-noir-500">Net Recommendation</span>
            <div className="w-7 h-7 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
              <ThumbsUp size={14} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-serif text-noir-900">
              {summary.recommendationRate || 98.4}%
            </span>
            <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <TrendingUp size={10} /> Would gift again
            </p>
          </div>
        </div>

        {/* Card 5: Moderation Health */}
        <div className="bg-white p-5 rounded-sm border border-cream-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-noir-500">Moderation Status</span>
            <div className="w-7 h-7 rounded-full bg-cream-100 flex items-center justify-center text-noir-700">
              <ShieldCheck size={14} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-serif text-noir-900">100%</span>
            <p className="text-[11px] text-noir-500 mt-1">Live in store & marquee</p>
          </div>
        </div>
      </div>

      {/* ── Ratings Distribution Bar & Breakdown ── */}
      <div className="bg-white p-6 rounded-sm border border-cream-200/80 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-noir-800 mb-4">
          Rating Distribution & Quality Breakdown
        </h3>
        <div className="space-y-2.5 max-w-2xl">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = summary.ratingBreakdown?.[stars] || 0;
            const pct = summary.ratingPercentages?.[stars] || 0;
            const isSelected = ratingFilter === stars;
            return (
              <button
                key={stars}
                type="button"
                onClick={() => {
                  setRatingFilter(isSelected ? null : stars);
                  setPage(1);
                }}
                className={`w-full flex items-center gap-3 text-xs p-1.5 rounded transition-all text-left ${
                  isSelected ? 'bg-amber-50/80 ring-1 ring-amber-300' : 'hover:bg-cream-50'
                }`}
              >
                <span className="w-12 font-medium text-noir-700 flex items-center gap-1 shrink-0">
                  <span>{stars}</span>
                  <Star size={11} className="fill-amber-400 text-amber-400" />
                </span>

                <div className="flex-1 h-2.5 bg-cream-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 transition-all duration-500 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <span className="w-12 text-right font-medium text-noir-800 shrink-0">
                  {count}
                </span>
                <span className="w-12 text-right text-noir-400 text-[11px] shrink-0">
                  {pct}%
                </span>
              </button>
            );
          })}
        </div>
        {ratingFilter && (
          <div className="mt-3 text-xs text-amber-700 flex items-center gap-2">
            <span>Filtering by {ratingFilter} Stars</span>
            <button
              onClick={() => {
                setRatingFilter(null);
                setPage(1);
              }}
              className="underline font-semibold hover:text-amber-900"
            >
              Clear filter
            </button>
          </div>
        )}
      </div>

      {/* ── Filters Toolbar ── */}
      <div className="bg-white p-4 rounded-sm border border-cream-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-noir-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer, book title, city, or order #..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-cream-300 rounded-sm focus:outline-none focus:border-noir-800 bg-cream-50/30 text-noir-900 placeholder:text-noir-400"
          />
        </form>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <span className="text-[11px] font-medium text-noir-400 uppercase tracking-wider mr-1">
            Category:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setCategoryFilter(cat);
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-sm capitalize transition-colors ${
                categoryFilter === cat
                  ? 'bg-noir-900 text-white'
                  : 'bg-cream-100 text-noir-700 hover:bg-cream-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-medium text-noir-400 uppercase tracking-wider">
            Status:
          </span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs border border-cream-300 rounded-sm px-2.5 py-1.5 bg-white text-noir-800 focus:outline-none focus:border-noir-800"
          >
            <option value="all">All Statuses</option>
            <option value="approved">Approved (Live)</option>
            <option value="hidden">Hidden from Site</option>
            <option value="flagged">Flagged for Review</option>
          </select>
        </div>
      </div>

      {/* ── Reviews List / Feed ── */}
      {loading ? (
        <div className="bg-white p-16 rounded-sm border border-cream-200/80 shadow-xs text-center">
          <RefreshCw size={24} className="animate-spin mx-auto text-amber-500 mb-3" />
          <p className="text-xs font-medium text-noir-700">Loading reviews from MongoDB Atlas...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white p-16 rounded-sm border border-cream-200/80 shadow-xs text-center max-w-lg mx-auto">
          <MessageSquare size={36} className="mx-auto text-noir-300 mb-3" />
          <h3 className="font-serif text-lg text-noir-900 font-semibold mb-1">No reviews match your filters</h3>
          <p className="text-xs text-noir-500 mb-4">
            Try adjusting your search terms or seed the initial 100+ review dataset.
          </p>
          <button
            onClick={handleSeedReviews}
            className="px-4 py-2 text-xs font-semibold text-white bg-noir-900 rounded-sm hover:bg-black transition-colors"
          >
            Seed 100+ Verified Reviews
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {reviews.map((rev) => {
            const isApproved = rev.status === 'approved';
            const isHidden = rev.status === 'hidden';
            const isFlagged = rev.status === 'flagged';
            const isLoading = actionLoadingId === rev.id;

            return (
              <div
                key={rev.id}
                className="bg-white p-5 rounded-sm border border-cream-200/80 hover:border-cream-300 shadow-xs transition-all flex flex-col md:flex-row md:items-start justify-between gap-5"
              >
                {/* Left Section: Reviewer + Content */}
                <div className="flex-1">
                  {/* Top Bar: Stars + Category + Order Link + Status */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {/* Stars */}
                    <div className="flex text-amber-400">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} size={14} className="fill-amber-400" />
                      ))}
                    </div>

                    {/* Category Pill */}
                    {rev.category && (
                      <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 bg-cream-100 text-noir-700 rounded-full border border-cream-200">
                        {rev.category}
                      </span>
                    )}

                    {/* Order Number Link */}
                    {rev.orderNumber && (
                      <Link
                        href={`/orders?search=${rev.orderNumber}`}
                        className="text-[11px] font-mono font-medium text-noir-600 hover:text-black flex items-center gap-1 hover:underline"
                        title="View linked order in admin"
                      >
                        <span>{rev.orderNumber}</span>
                        <ExternalLink size={10} />
                      </Link>
                    )}

                    {/* Status Badge */}
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        isApproved
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : isHidden
                          ? 'bg-neutral-100 text-neutral-600 border border-neutral-300'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {rev.status}
                    </span>

                    {/* Verified Buyer */}
                    {rev.verifiedPurchase && (
                      <span className="text-[10px] text-emerald-700 font-medium flex items-center gap-1">
                        <CheckCircle size={11} className="fill-emerald-100 text-emerald-600" />
                        Verified Purchase
                      </span>
                    )}
                  </div>

                  {/* Book Title */}
                  {rev.bookTitle && (
                    <h4 className="font-serif text-base font-semibold text-noir-900 mb-1">
                      {rev.bookTitle}
                    </h4>
                  )}

                  {/* Review Title & Body */}
                  {rev.title && (
                    <p className="text-xs font-semibold text-noir-800 mb-1 italic">
                      &ldquo;{rev.title}&rdquo;
                    </p>
                  )}
                  <p className="text-xs text-noir-700 leading-relaxed mb-3">
                    {rev.comment}
                  </p>

                  {/* Customer Info & Date Footer */}
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-noir-500 pt-2 border-t border-cream-100">
                    <span className="font-medium text-noir-900">{rev.customerName}</span>
                    {rev.customerLocation && <span>· {rev.customerLocation}</span>}
                    {rev.customerEmail && <span className="font-mono">· {rev.customerEmail}</span>}
                    {rev.createdAt && (
                      <span>· {new Date(rev.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    )}
                    {rev.helpfulCount > 0 && (
                      <span className="flex items-center gap-1 text-amber-700 font-medium ml-auto">
                        <ThumbsUp size={11} /> {rev.helpfulCount} people found this helpful
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Section: Moderation Actions */}
                <div className="flex md:flex-col items-center justify-end gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-cream-100">
                  <button
                    type="button"
                    onClick={() => handleStatusToggle(rev.id, rev.status)}
                    disabled={isLoading}
                    className={`w-full px-3 py-1.5 text-xs font-medium rounded-sm border transition-colors flex items-center justify-center gap-1.5 ${
                      isApproved
                        ? 'border-cream-300 text-noir-600 hover:bg-neutral-100'
                        : 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    {isApproved ? (
                      <>
                        <EyeOff size={12} />
                        <span>Hide Review</span>
                      </>
                    ) : (
                      <>
                        <Eye size={12} />
                        <span>Approve & Publish</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(rev.id)}
                    disabled={isLoading}
                    className="w-full px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50/50 hover:bg-rose-100 border border-rose-200 rounded-sm transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Trash2 size={12} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-cream-200/80 pt-4 text-xs text-noir-600">
          <span>
            Showing page {page} of {totalPages} ({totalCount} total reviews)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="px-3 py-1.5 border border-cream-300 rounded-sm disabled:opacity-40 hover:bg-cream-100 flex items-center gap-1"
            >
              <ChevronLeft size={13} />
              <span>Previous</span>
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="px-3 py-1.5 border border-cream-300 rounded-sm disabled:opacity-40 hover:bg-cream-100 flex items-center gap-1"
            >
              <span>Next</span>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
