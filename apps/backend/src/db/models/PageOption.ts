// apps/backend/src/db/models/PageOption.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IPageOption extends Document {
  id?: string;
  pageOptionId: string;
  count: number;
  name: string;
  photos: number;
  badge?: string; // e.g. "Popular", "Extended", "Collector's"
  priceAdjustment: number; // e.g. 0, 600, 1000, 1400, -700
  description: string;
  isDefault: boolean;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const PageOptionSchema: Schema = new Schema(
  {
    pageOptionId: { type: String, required: true, unique: true, index: true },
    count: { type: Number, required: true, index: true },
    name: { type: String, required: true },
    photos: { type: Number, required: true },
    badge: { type: String, default: '' },
    priceAdjustment: { type: Number, default: 0 },
    description: { type: String, default: '' },
    isDefault: { type: Boolean, default: false },
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

export const PageOption: mongoose.Model<IPageOption> =
  (mongoose.models.PageOption as mongoose.Model<IPageOption>) ||
  mongoose.model<IPageOption>('PageOption', PageOptionSchema);

export default PageOption;
