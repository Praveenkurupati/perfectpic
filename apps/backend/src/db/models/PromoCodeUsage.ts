// apps/backend/src/db/models/PromoCodeUsage.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IPromoCodeUsage extends Document {
  id?: string;
  promoCodeId: string;
  code: string;
  userId?: string;
  customerEmail: string;
  customerPhone?: string;
  orderId?: string;
  orderNumber?: string;
  discountAmount: number;
  orderTotal: number;
  usedAt: Date;
}

const PromoCodeUsageSchema: Schema = new Schema(
  {
    promoCodeId: {
      type: String,
      required: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
      uppercase: true,
      index: true,
    },
    userId: {
      type: String,
      index: true,
    },
    customerEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    customerPhone: {
      type: String,
      trim: true,
    },
    orderId: {
      type: String,
      index: true,
    },
    orderNumber: {
      type: String,
      index: true,
    },
    discountAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    orderTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    usedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
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

export const PromoCodeUsage: mongoose.Model<IPromoCodeUsage> =
  (mongoose.models.PromoCodeUsage as mongoose.Model<IPromoCodeUsage>) ||
  mongoose.model<IPromoCodeUsage>('PromoCodeUsage', PromoCodeUsageSchema);
