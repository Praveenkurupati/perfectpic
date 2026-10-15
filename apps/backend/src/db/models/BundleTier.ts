// apps/backend/src/db/models/BundleTier.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IBundleTier extends Document {
  id?: string;
  bundleId: string;
  minQuantity: number;
  name: string;
  price: number; // Customer selling price, e.g. 1999, 3499, 6399, 8999
  perBookPrice?: number; // e.g. 1999, 1750, 1600, 1500
  discountAmount: number; // e.g. 0, 499, 1597, 2995
  netPrice?: number; // Net revenue after taxes/fees, e.g. 1738, 3042, 5563, 7823
  printCost?: number; // Production printing cost, e.g. 515, 1030, 2060, 3090
  shippingCost?: number; // Logistics shipping cost, e.g. 110, 150, 240, 330
  grossProfit?: number; // Net - Print - Shipping, e.g. 1113, 1862, 3263, 4403
  marginPerBook?: number; // Profit per book, e.g. 1113, 931, 816, 734
  marginPercentage?: number; // Margin %, e.g. 55.7, 53.2, 51.0, 48.9
  freeShipping: boolean;
  badge?: string; // e.g. "Single", "Duo", "Quartet", "Collector"
  description: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const BundleTierSchema: Schema = new Schema(
  {
    bundleId: { type: String, required: true, unique: true, index: true },
    minQuantity: { type: Number, required: true, index: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, default: 1999 },
    perBookPrice: { type: Number, default: 1999 },
    discountAmount: { type: Number, required: true, default: 0 },
    netPrice: { type: Number, default: 0 },
    printCost: { type: Number, default: 0 },
    shippingCost: { type: Number, default: 0 },
    grossProfit: { type: Number, default: 0 },
    marginPerBook: { type: Number, default: 0 },
    marginPercentage: { type: Number, default: 0 },
    freeShipping: { type: Boolean, default: true },
    badge: { type: String, default: '' },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true, index: true },
    displayOrder: { type: Number, default: 0, index: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: any) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const BundleTier: mongoose.Model<IBundleTier> =
  (mongoose.models.BundleTier as mongoose.Model<IBundleTier>) ||
  mongoose.model<IBundleTier>('BundleTier', BundleTierSchema);

export default BundleTier;
