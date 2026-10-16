import { z } from "zod";

// ─── Review & Rating Types ──────────────────────────────────────────────────

export const ReviewStatusEnum = z.enum(["approved", "pending", "flagged", "hidden"]);
export type ReviewStatus = z.infer<typeof ReviewStatusEnum>;

export const ReviewSchema = z.object({
  id: z.string(),
  orderId: z.string().optional(),
  orderNumber: z.string().optional(),
  userId: z.string().optional(),
  customerName: z.string(),
  customerEmail: z.string().optional(),
  customerLocation: z.string().optional(),
  rating: z.number().min(1).max(5),
  title: z.string().optional(),
  comment: z.string(),
  productSlug: z.string().optional(),
  bookTitle: z.string().optional(),
  category: z.string().optional(),
  verifiedPurchase: z.boolean().default(true),
  images: z.array(z.string()).default([]),
  status: ReviewStatusEnum.default("approved"),
  helpfulCount: z.number().default(0),
  adminNotes: z.string().optional(),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]).optional(),
});
export type Review = z.infer<typeof ReviewSchema>;

export interface RatingBreakdown {
  5: number;
  4: number;
  3: number;
  2: number;
  1: number;
}

export interface RatingSummary {
  averageRating: number;
  totalReviews: number;
  ratingBreakdown: RatingBreakdown;
  ratingPercentages: RatingBreakdown;
  recommendationRate: number; // percentage, e.g. 98.4%
}
