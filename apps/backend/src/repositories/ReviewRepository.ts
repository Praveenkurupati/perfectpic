// apps/backend/src/repositories/ReviewRepository.ts
import mongoose from 'mongoose';
import { Review, IReview } from '../db/models/Review';
import { Order } from '../db/models/Order';
import { isDbConnected } from '../db/connection';
import { generateExpandedReviews } from '../data/seedReviews';

export interface ReviewFilterOptions {
  category?: string;
  productSlug?: string;
  minRating?: number;
  rating?: number;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

// In-memory fallback dataset for offline/mock development
let inMemoryReviews: any[] = [];

function ensureInMemorySeeded() {
  if (inMemoryReviews.length === 0) {
    const raw = generateExpandedReviews();
    inMemoryReviews = raw.map((r, idx) => ({
      id: `rev-${idx + 1}`,
      _id: `rev-${idx + 1}`,
      ...r,
    }));
  }
}

export class ReviewRepository {
  /**
   * Seed reviews into MongoDB Atlas if collection has fewer than 50 records.
   */
  public static async seedReviewsIfEmpty(force = false): Promise<number> {
    if (isDbConnected()) {
      const existingCount = await Review.countDocuments();
      if (existingCount < 50 || force) {
        if (force) {
          await Review.deleteMany({});
        }
        const seedData = generateExpandedReviews();
        await Review.insertMany(seedData);
        console.log(`✨ [ReviewRepository] Successfully seeded ${seedData.length} reviews into MongoDB Atlas!`);
        return seedData.length;
      }
      return existingCount;
    }

    ensureInMemorySeeded();
    return inMemoryReviews.length;
  }

  /**
   * Create a new customer review & sync with Order if orderNumber / orderId provided.
   */
  public static async createReview(data: Partial<IReview>): Promise<any> {
    const payload = {
      ...data,
      rating: Number(data.rating) || 5,
      status: data.status || 'approved',
      verifiedPurchase: data.verifiedPurchase !== false,
      helpfulCount: data.helpfulCount || 0,
    };

    if (isDbConnected()) {
      const doc = await Review.create(payload);

      // If orderNumber is present, sync with Order document
      if (payload.orderNumber) {
        await Order.findOneAndUpdate(
          { orderNumber: payload.orderNumber },
          {
            review: {
              id: doc._id.toString(),
              rating: doc.rating,
              title: doc.title,
              comment: doc.comment,
              submittedAt: doc.createdAt,
            },
          }
        ).catch(() => {});
      }

      return doc.toJSON();
    }

    ensureInMemorySeeded();
    const mockItem = {
      id: `rev-${Date.now()}`,
      _id: `rev-${Date.now()}`,
      ...payload,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    inMemoryReviews.unshift(mockItem);
    return mockItem;
  }

  /**
   * Find reviews with search, category, rating, status filters and pagination.
   */
  public static async findReviews(options: ReviewFilterOptions = {}) {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(options.limit) || 20));
    const skip = (page - 1) * limit;

    if (isDbConnected()) {
      const query: any = {};

      if (options.status && options.status !== 'all') {
        query.status = options.status;
      } else if (!options.status) {
        query.status = 'approved';
      }

      if (options.category && options.category.toLowerCase() !== 'all') {
        query.category = { $regex: new RegExp(`^${options.category}$`, 'i') };
      }

      if (options.productSlug && options.productSlug !== 'all') {
        query.productSlug = options.productSlug;
      }

      if (options.rating) {
        query.rating = Number(options.rating);
      } else if (options.minRating) {
        query.rating = { $gte: Number(options.minRating) };
      }

      if (options.search) {
        const s = options.search.trim();
        query.$or = [
          { customerName: { $regex: s, $options: 'i' } },
          { bookTitle: { $regex: s, $options: 'i' } },
          { comment: { $regex: s, $options: 'i' } },
          { title: { $regex: s, $options: 'i' } },
          { orderNumber: { $regex: s, $options: 'i' } },
          { customerLocation: { $regex: s, $options: 'i' } },
        ];
      }

      let sortSpec: any = { createdAt: -1 };
      if (options.sort === 'highest') sortSpec = { rating: -1, createdAt: -1 };
      if (options.sort === 'lowest') sortSpec = { rating: 1, createdAt: -1 };
      if (options.sort === 'helpful') sortSpec = { helpfulCount: -1, createdAt: -1 };

      const [docs, total] = await Promise.all([
        Review.find(query).sort(sortSpec).skip(skip).limit(limit).lean(),
        Review.countDocuments(query),
      ]);

      const reviews = docs.map((d: any) => ({
        ...d,
        id: d._id ? d._id.toString() : d.id,
      }));

      return {
        reviews,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      };
    }

    // In-memory fallback
    ensureInMemorySeeded();
    let filtered = [...inMemoryReviews];

    if (options.status && options.status !== 'all') {
      filtered = filtered.filter((r) => r.status === options.status);
    } else if (!options.status) {
      filtered = filtered.filter((r) => r.status === 'approved');
    }

    if (options.category && options.category.toLowerCase() !== 'all') {
      filtered = filtered.filter(
        (r) => r.category && r.category.toLowerCase() === options.category?.toLowerCase()
      );
    }

    if (options.productSlug && options.productSlug !== 'all') {
      filtered = filtered.filter((r) => r.productSlug === options.productSlug);
    }

    if (options.rating) {
      filtered = filtered.filter((r) => r.rating === Number(options.rating));
    } else if (options.minRating) {
      filtered = filtered.filter((r) => r.rating >= Number(options.minRating));
    }

    if (options.search) {
      const s = options.search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          (r.customerName && r.customerName.toLowerCase().includes(s)) ||
          (r.bookTitle && r.bookTitle.toLowerCase().includes(s)) ||
          (r.comment && r.comment.toLowerCase().includes(s)) ||
          (r.title && r.title.toLowerCase().includes(s)) ||
          (r.orderNumber && r.orderNumber.toLowerCase().includes(s)) ||
          (r.customerLocation && r.customerLocation.toLowerCase().includes(s))
      );
    }

    const total = filtered.length;
    const paginated = filtered.slice(skip, skip + limit);

    return {
      reviews: paginated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Calculate aggregated rating summary: average score, counts, breakdown & recommendation percentage.
   */
  public static async getRatingSummary(filter: { category?: string; productSlug?: string } = {}) {
    if (isDbConnected()) {
      const match: any = { status: 'approved' };
      if (filter.category && filter.category.toLowerCase() !== 'all') {
        match.category = { $regex: new RegExp(`^${filter.category}$`, 'i') };
      }
      if (filter.productSlug && filter.productSlug !== 'all') {
        match.productSlug = filter.productSlug;
      }

      const aggregateRes = await Review.aggregate([
        { $match: match },
        {
          $group: {
            _id: '$rating',
            count: { $sum: 1 },
          },
        },
      ]);

      const breakdown: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      let totalReviews = 0;
      let totalRatingSum = 0;

      aggregateRes.forEach((item: any) => {
        const star = Number(item._id);
        if (breakdown[star] !== undefined) {
          breakdown[star] = item.count;
          totalReviews += item.count;
          totalRatingSum += star * item.count;
        }
      });

      const averageRating = totalReviews > 0 ? Number((totalRatingSum / totalReviews).toFixed(2)) : 5.0;
      const percentages: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

      if (totalReviews > 0) {
        for (let s = 1; s <= 5; s++) {
          const count = breakdown[s] ?? 0;
          percentages[s] = Number(((count / totalReviews) * 100).toFixed(1));
        }
      }

      const positiveCount = (breakdown[5] ?? 0) + (breakdown[4] ?? 0);
      const recommendationRate = totalReviews > 0 ? Number(((positiveCount / totalReviews) * 100).toFixed(1)) : 98.5;

      return {
        averageRating,
        totalReviews,
        ratingBreakdown: breakdown,
        ratingPercentages: percentages,
        recommendationRate,
      };
    }

    ensureInMemorySeeded();
    const approved = inMemoryReviews.filter((r) => r.status === 'approved');
    const breakdown: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let totalReviews = 0;
    let totalRatingSum = 0;

    approved.forEach((r) => {
      const star = Number(r.rating) || 5;
      if (breakdown[star] !== undefined) {
        breakdown[star]++;
        totalReviews++;
        totalRatingSum += star;
      }
    });

    const averageRating = totalReviews > 0 ? Number((totalRatingSum / totalReviews).toFixed(2)) : 4.92;
    const percentages: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    if (totalReviews > 0) {
      for (let s = 1; s <= 5; s++) {
        const count = breakdown[s] ?? 0;
        percentages[s] = Number(((count / totalReviews) * 100).toFixed(1));
      }
    }

    const positiveCount = (breakdown[5] ?? 0) + (breakdown[4] ?? 0);
    const recommendationRate = totalReviews > 0 ? Number(((positiveCount / totalReviews) * 100).toFixed(1)) : 98.4;

    return {
      averageRating,
      totalReviews,
      ratingBreakdown: breakdown,
      ratingPercentages: percentages,
      recommendationRate,
    };
  }

  /**
   * Find review by order number or ID.
   */
  public static async findByOrderNumber(orderNumber: string) {
    if (isDbConnected()) {
      return await Review.findOne({ orderNumber }).lean();
    }
    ensureInMemorySeeded();
    return inMemoryReviews.find((r) => r.orderNumber === orderNumber) || null;
  }

  /**
   * Update review status (approve, hide, flag) and optional adminNotes.
   */
  public static async updateStatus(id: string, status: string, adminNotes?: string) {
    if (isDbConnected()) {
      let query: any = { _id: id };
      if (!mongoose.isValidObjectId(id)) {
        query = { id };
      }
      const updateData: any = { status };
      if (adminNotes !== undefined) updateData.adminNotes = adminNotes;

      return await Review.findOneAndUpdate(query, updateData, { new: true });
    }

    ensureInMemorySeeded();
    const item = inMemoryReviews.find((r) => r.id === id || r._id === id);
    if (item) {
      item.status = status;
      if (adminNotes !== undefined) item.adminNotes = adminNotes;
      return item;
    }
    return null;
  }

  /**
   * Delete review by ID.
   */
  public static async deleteReview(id: string) {
    if (isDbConnected()) {
      let query: any = { _id: id };
      if (!mongoose.isValidObjectId(id)) {
        query = { id };
      }
      return await Review.findOneAndDelete(query);
    }

    ensureInMemorySeeded();
    const index = inMemoryReviews.findIndex((r) => r.id === id || r._id === id);
    if (index !== -1) {
      return inMemoryReviews.splice(index, 1)[0];
    }
    return null;
  }
}

export default ReviewRepository;
