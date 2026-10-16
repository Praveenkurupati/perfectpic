// apps/backend/src/services/ReviewService.ts
import { ReviewRepository, ReviewFilterOptions } from '../repositories/ReviewRepository';
import { ApiError } from '../utils/apiError';
import { OrderRepository } from '../repositories/OrderRepository';

export class ReviewService {
  /**
   * Get public reviews for the storefront / homepage / product pages.
   */
  public static async getPublicReviews(filters: ReviewFilterOptions = {}) {
    const defaultFilters: ReviewFilterOptions = {
      ...filters,
      status: 'approved',
      limit: filters.limit || 50,
    };

    const [result, summary] = await Promise.all([
      ReviewRepository.findReviews(defaultFilters),
      ReviewRepository.getRatingSummary({
        category: filters.category,
        productSlug: filters.productSlug,
      }),
    ]);

    return {
      ...result,
      summary,
    };
  }

  /**
   * Get aggregated rating breakdown and average score.
   */
  public static async getRatingSummary(filter: { category?: string; productSlug?: string } = {}) {
    return await ReviewRepository.getRatingSummary(filter);
  }

  /**
   * Submit an authentic order review and rating.
   */
  public static async submitReview(data: any) {
    const rating = Number(data.rating);
    if (!rating || rating < 1 || rating > 5) {
      throw ApiError.badRequest('Rating must be an integer between 1 and 5 stars.');
    }

    if (!data.customerName || !data.customerName.trim()) {
      throw ApiError.badRequest('Customer name is required.');
    }

    if (!data.comment || !data.comment.trim()) {
      throw ApiError.badRequest('Review comment is required.');
    }

    // Auto-fill order details if orderNumber provided
    let bookTitle = data.bookTitle;
    let productSlug = data.productSlug;
    let category = data.category || 'Travel';

    if (data.orderNumber) {
      const order = await OrderRepository.findById(data.orderNumber);
      if (order) {
        bookTitle = bookTitle || (order as any).title || 'Custom Photobook';
        category = category || (order as any).projectSnapshot?.bookConfig?.theme || 'Travel';
      }
    }

    const payload = {
      ...data,
      rating,
      bookTitle,
      productSlug,
      category,
      customerName: data.customerName.trim(),
      comment: data.comment.trim(),
      title: data.title ? data.title.trim() : undefined,
      customerLocation: data.customerLocation || 'India',
      status: 'approved', // default approved, can be moderated in admin panel
      verifiedPurchase: true,
      createdAt: new Date(),
    };

    const review = await ReviewRepository.createReview(payload);
    return review;
  }

  /**
   * Fetch review by order number.
   */
  public static async getReviewByOrder(orderNumber: string) {
    if (!orderNumber) {
      throw ApiError.badRequest('Order number is required.');
    }
    const review = await ReviewRepository.findByOrderNumber(orderNumber);
    return review;
  }

  /**
   * Admin: Get all reviews with status and moderation filters.
   */
  public static async getAdminReviews(filters: ReviewFilterOptions = {}) {
    const options: ReviewFilterOptions = {
      ...filters,
      status: filters.status || 'all',
      limit: filters.limit || 50,
    };

    const [result, summary] = await Promise.all([
      ReviewRepository.findReviews(options),
      ReviewRepository.getRatingSummary(),
    ]);

    return {
      ...result,
      summary,
    };
  }

  /**
   * Admin: Update moderation status (approved, hidden, flagged).
   */
  public static async updateReviewStatus(id: string, status: string, adminNotes?: string) {
    const validStatuses = ['approved', 'hidden', 'flagged', 'pending'];
    if (!validStatuses.includes(status)) {
      throw ApiError.badRequest(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const updated = await ReviewRepository.updateStatus(id, status, adminNotes);
    if (!updated) {
      throw ApiError.notFound(`Review with ID '${id}' not found.`);
    }
    return updated;
  }

  /**
   * Admin: Delete review.
   */
  public static async deleteReview(id: string) {
    const deleted = await ReviewRepository.deleteReview(id);
    if (!deleted) {
      throw ApiError.notFound(`Review with ID '${id}' not found.`);
    }
    return deleted;
  }

  /**
   * Seed reviews dataset if count < 50 or force requested.
   */
  public static async seedReviews(force = false) {
    const count = await ReviewRepository.seedReviewsIfEmpty(force);
    return {
      message: `Successfully seeded reviews database! Current total: ${count}`,
      count,
    };
  }
}

export default ReviewService;
