// apps/backend/src/controllers/ReviewController.ts
import { Request, Response, NextFunction } from 'express';
import { ReviewService } from '../services/ReviewService';

export class ReviewController {
  /**
   * Public: Get approved reviews with category / product filters & pagination.
   */
  public static async getPublicReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const { category, productSlug, minRating, rating, search, page, limit, sort } = req.query;
      const data = await ReviewService.getPublicReviews({
        category: category as string,
        productSlug: productSlug as string,
        minRating: minRating ? Number(minRating) : undefined,
        rating: rating ? Number(rating) : undefined,
        search: search as string,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 50,
        sort: sort as string,
      });
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Public: Get aggregated rating score, breakdown and recommendation rate.
   */
  public static async getRatingSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const { category, productSlug } = req.query;
      const summary = await ReviewService.getRatingSummary({
        category: category as string,
        productSlug: productSlug as string,
      });
      res.status(200).json(summary);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Public / Authenticated: Submit a review for an order or product.
   */
  public static async submitReview(req: Request, res: Response, next: NextFunction) {
    try {
      const review = await ReviewService.submitReview(req.body);
      res.status(201).json({
        message: 'Review submitted successfully! Thank you for sharing your experience.',
        review,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Public / Authenticated: Get review for a specific order.
   */
  public static async getReviewByOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const orderNumber = String(req.params.orderNumber || '');
      const review = await ReviewService.getReviewByOrder(orderNumber);
      res.status(200).json({ review });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin: Get all reviews (including pending / hidden / flagged) with filters.
   */
  public static async getAdminReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, category, rating, search, page, limit, sort } = req.query;
      const data = await ReviewService.getAdminReviews({
        status: status as string,
        category: category as string,
        rating: rating ? Number(rating) : undefined,
        search: search as string,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 50,
        sort: sort as string,
      });
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin: Moderate review status (approve, hide, flag).
   */
  public static async updateAdminReviewStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id || '');
      const { status, adminNotes } = req.body;
      const updated = await ReviewService.updateReviewStatus(id, status, adminNotes);
      res.status(200).json({
        message: `Review status updated to '${status}'.`,
        review: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin: Delete a review.
   */
  public static async deleteAdminReview(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id || '');
      await ReviewService.deleteReview(id);
      res.status(200).json({
        message: 'Review deleted successfully.',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin / Dev: Seed reviews dataset.
   */
  public static async seedReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const force = req.query.force === 'true' || req.body.force === true;
      const result = await ReviewService.seedReviews(force);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}

export default ReviewController;
