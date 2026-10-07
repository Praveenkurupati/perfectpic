import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  id?: string;
  slug: string;
  seriesLabel: string;
  bookType: string;
  title: string;
  displayName: string;
  tagline: string;
  subtitle: string;
  description: string;
  category: string;
  coverImage: string;
  coverColor: string;
  spineText: string;
  rating: number;
  reviewCount: number;
  fromPrice: number;
  pricing: { [key: string]: number };
  basePages: number;
  maxPhotos: number;
  badge?: string;
  priority?: number;
  tags?: string[];
  pageOptions?: number[];
  defaultOptions: {
    size: string;
    cover: string;
    theme: string;
    color: string;
    packaging: string;
  };
  templatePhotos: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema = new Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    seriesLabel: { type: String, default: 'travel series' },
    bookType: { type: String, default: 'custom photobook' },
    title: { type: String, default: 'custom photobook' },
    displayName: { type: String, required: true },
    tagline: { type: String, default: 'your journeys, perfectly told' },
    subtitle: { type: String, default: '' },
    description: { type: String, default: '' },
    category: { type: String, default: 'Travel', index: true },
    tags: { type: [String], default: [], index: true },
    pageOptions: { type: [Number], default: [12, 24, 32, 60, 120] },
    coverImage: { type: String, required: true },
    coverColor: { type: String, default: '#F8BAC7' },
    spineText: { type: String, default: 'PHOTOBOOK' },
    rating: { type: Number, default: 5.0 },
    reviewCount: { type: Number, default: 72 },
    fromPrice: { type: Number, default: 1999 },
    pricing: { type: Schema.Types.Mixed, default: { '8.25': 1999, '10': 2499 } },
    basePages: { type: Number, default: 32 },
    maxPhotos: { type: Number, default: 120 },
    badge: { type: String, default: '' },
    priority: { type: Number, default: 0, index: true },
    featured: { type: Boolean, default: true },
    defaultOptions: {
      type: Object,
      default: {
        size: '8.25x8.25',
        cover: 'cov-1',
        theme: 'theme-4',
        color: 'col-1',
        packaging: 'pack-1'
      }
    },
    templatePhotos: { type: [String], default: [] }
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
      }
    }
  }
);

// High-speed catalog compound indexes
ProductSchema.index({ category: 1, priority: -1 });
ProductSchema.index({ featured: 1, priority: -1 });

export const Product: mongoose.Model<IProduct> = 
  (mongoose.models.Product as mongoose.Model<IProduct>) || mongoose.model<IProduct>('Product', ProductSchema);
