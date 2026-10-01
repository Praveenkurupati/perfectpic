// apps/backend/src/db/models/BundleTier.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IBundleTier extends Document {
  id?: string;
  bundleId: string;
  minQuantity: number;
  name: string;
  discountAmount: number; // e.g. 300, 1800, 4500
  freeShipping: boolean;
  badge?: string; // e.g. "Popular", "Extended Family", "Collector's Master"
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
    discountAmount: { type: Number, required: true, default: 0 },
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
