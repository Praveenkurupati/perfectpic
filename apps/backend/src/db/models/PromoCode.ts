// apps/backend/src/db/models/PromoCode.ts
import mongoose, { Schema, Document } from 'mongoose';

export type DiscountType = 'percentage' | 'fixed';
export type AudienceType = 'ALL' | 'FIRST_ORDER' | 'SPECIFIC_USERS';

export interface IPromoCode extends Document {
  id?: string;
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount?: number | null;
  minOrderAmount: number;
  audienceType: AudienceType;
  allowedUserEmails: string[];
  maxUses?: number | null;
  currentUses: number;
  maxUsesPerUser: number;
  startDate: Date;
  expiresAt?: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PromoCodeSchema: Schema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true,
      default: 'percentage',
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    maxDiscountAmount: {
      type: Number,
      default: null,
    },
    minOrderAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    audienceType: {
      type: String,
      enum: ['ALL', 'FIRST_ORDER', 'SPECIFIC_USERS'],
      default: 'ALL',
    },
    allowedUserEmails: {
      type: [String],
      default: [],
    },
    maxUses: {
      type: Number,
      default: null,
    },
    currentUses: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxUsesPerUser: {
      type: Number,
      default: 1,
      min: 1,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
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

export const PromoCode: mongoose.Model<IPromoCode> =
  (mongoose.models.PromoCode as mongoose.Model<IPromoCode>) ||
  mongoose.model<IPromoCode>('PromoCode', PromoCodeSchema);
