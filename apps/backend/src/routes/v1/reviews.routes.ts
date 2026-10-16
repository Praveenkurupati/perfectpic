// apps/backend/src/routes/v1/reviews.routes.ts
import { Router } from 'express';
import { ReviewController } from '../../controllers/ReviewController';

const router = Router();

// ─── Public Endpoints ────────────────────────────────────────────────────────
// List approved reviews with filters (category, productSlug, minRating, page, limit)
router.get('/', ReviewController.getPublicReviews);

// Aggregated rating statistics (average rating, total counts, star breakdown)
router.get('/summary', ReviewController.getRatingSummary);

// Submit a review for an order or product
router.post('/', ReviewController.submitReview);

// Fetch a review for a specific order by orderNumber
router.get('/order/:orderNumber', ReviewController.getReviewByOrder);

// ─── Admin Endpoints ─────────────────────────────────────────────────────────
// List all reviews with moderation filters (status, search, rating)
router.get('/admin', ReviewController.getAdminReviews);

// Update review status (approve, hide, flag) & admin notes
router.patch('/admin/:id/status', ReviewController.updateAdminReviewStatus);

// Delete a review
router.delete('/admin/:id', ReviewController.deleteAdminReview);

// Seed or reset review dataset
router.post('/admin/seed', ReviewController.seedReviews);

export default router;
