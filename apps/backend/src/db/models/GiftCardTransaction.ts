// apps/backend/src/db/models/GiftCardTransaction.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export type GiftCardTransactionType = 
  | 'issuance' 
  | 'redemption' 
  | 'wallet_claim' 
  | 'admin_adjustment' 
  | 'refund';

export interface IGiftCardTransaction {
  id?: string;
  giftCardId: string;
  giftCardCode: string;
  type: GiftCardTransactionType;
  amount: number; // positive for credits/issuance, negative for redemptions
  balanceBefore: number;
  balanceAfter: number;
  orderId?: string | null;
  orderNumber?: string | null;
  userId?: string | null;
  customerEmail?: string;
  description: string;
  createdAt?: Date;
}

export interface IGiftCardTransactionDocument extends IGiftCardTransaction, Document {}

const GiftCardTransactionSchema: Schema<IGiftCardTransactionDocument> = new Schema<IGiftCardTransactionDocument>(
  {
    giftCardId: {
      type: String,
      required: true,
      index: true,
    },
    giftCardCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['issuance', 'redemption', 'wallet_claim', 'admin_adjustment', 'refund'],
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    balanceBefore: {
      type: Number,
      required: true,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
    orderId: {
      type: String,
      default: null,
      index: true,
    },
    orderNumber: {
      type: String,
      default: null,
      index: true,
    },
    userId: {
      type: String,
      default: null,
      index: true,
    },
    customerEmail: {
      type: String,
      default: '',
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      transform(_doc, ret: any) {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const GiftCardTransaction: Model<IGiftCardTransactionDocument> =
  (mongoose.models.GiftCardTransaction as Model<IGiftCardTransactionDocument>) ||
  mongoose.model<IGiftCardTransactionDocument>('GiftCardTransaction', GiftCardTransactionSchema);
