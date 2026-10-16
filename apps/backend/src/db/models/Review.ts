import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  id?: string;
  orderId?: mongoose.Types.ObjectId | string;
  orderNumber?: string;
  userId?: mongoose.Types.ObjectId | string;
  customerName: string;
  customerEmail?: string;
  customerLocation?: string;
  rating: number; // 1 - 5
  title?: string;
  comment: string;
  productSlug?: string;
  bookTitle?: string;
  category?: string;
  verifiedPurchase: boolean;
  images?: string[];
  status: 'approved' | 'pending' | 'flagged' | 'hidden';
  helpfulCount: number;
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema: Schema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', index: true },
    orderNumber: { type: String, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    customerName: { type: String, required: true },
    customerEmail: { type: String },
    customerLocation: { type: String, default: 'India' },
    rating: { type: Number, required: true, min: 1, max: 5, index: true },
    title: { type: String },
    comment: { type: String, required: true },
    productSlug: { type: String, index: true },
    bookTitle: { type: String },
    category: { type: String, index: true, default: 'Travel' },
    verifiedPurchase: { type: Boolean, default: true },
    images: { type: [String], default: [] },
    status: {
      type: String,
      enum: ['approved', 'pending', 'flagged', 'hidden'],
      default: 'approved',
      index: true,
    },
    helpfulCount: { type: Number, default: 0 },
    adminNotes: { type: String },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret: any) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// High-speed query indexes
ReviewSchema.index({ status: 1, createdAt: -1 });
ReviewSchema.index({ status: 1, rating: -1 });
ReviewSchema.index({ category: 1, status: 1, createdAt: -1 });
ReviewSchema.index({ productSlug: 1, status: 1 });
ReviewSchema.index({ createdAt: -1 });

export const Review: mongoose.Model<IReview> =
  (mongoose.models.Review as mongoose.Model<IReview>) ||
  mongoose.model<IReview>('Review', ReviewSchema);

export default Review;
