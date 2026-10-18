// apps/backend/src/db/models/StoreCreditLedger.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export type StoreCreditLedgerType = 
  | 'gift_card_claim' 
  | 'order_redemption' 
  | 'admin_grant' 
  | 'order_refund' 
  | 'promotional_bonus';

export interface IStoreCreditLedger {
  id?: string;
  userId: string;
  userEmail: string;
  type: StoreCreditLedgerType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  referenceId?: string | null;
  description: string;
  createdAt?: Date;
}

export interface IStoreCreditLedgerDocument extends IStoreCreditLedger, Document {}

const StoreCreditLedgerSchema: Schema<IStoreCreditLedgerDocument> = new Schema<IStoreCreditLedgerDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    userEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['gift_card_claim', 'order_redemption', 'admin_grant', 'order_refund', 'promotional_bonus'],
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
    referenceId: {
      type: String,
      default: null,
      index: true,
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

export const StoreCreditLedger: Model<IStoreCreditLedgerDocument> =
  (mongoose.models.StoreCreditLedger as Model<IStoreCreditLedgerDocument>) ||
  mongoose.model<IStoreCreditLedgerDocument>('StoreCreditLedger', StoreCreditLedgerSchema);
