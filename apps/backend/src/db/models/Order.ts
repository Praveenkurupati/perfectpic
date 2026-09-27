import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
  id?: string;
  orderNumber: string;
  title: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  amount: number;
  total: number;
  status: string;
  coverUrl?: string;
  thumbnail?: string;
  dimensions?: string;
  pageCount?: number;
  itemsCount?: number;
  shippingAddress?: any;
  paymentDetails?: any;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema: Schema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    customerName: { type: String, default: 'Guest User' },
    customerEmail: { type: String },
    customerPhone: { type: String },
    amount: { type: Number, required: true },
    total: { type: Number, required: true },
    status: { type: String, default: 'confirmed', index: true }, // pending, confirmed, production, printing, dispatched, delivered
    coverUrl: { type: String },
    thumbnail: { type: String },
    dimensions: { type: String, default: '8.25" × 8.25"' },
    pageCount: { type: Number, default: 40 },
    itemsCount: { type: Number, default: 1 },
    shippingAddress: { type: Object },
    paymentDetails: { type: Object }
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

export const Order: mongoose.Model<IOrder> = 
  (mongoose.models.Order as mongoose.Model<IOrder>) || mongoose.model<IOrder>('Order', OrderSchema);
