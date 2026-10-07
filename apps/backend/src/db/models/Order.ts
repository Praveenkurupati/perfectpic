import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderItem {
  id?: string;
  projectId?: string;
  title: string;
  dimensions?: string;
  pageCount?: number;
  theme?: string;
  coverType?: string;
  coverColor?: string;
  paperFinish?: string;
  binding?: string;
  price: number;
  quantity: number;
  thumbnail?: string;
  pdfUrl?: string;
}

export interface IProjectSnapshot {
  projectId?: string;
  title?: string;
  subtitle?: string;
  seriesLabel?: string;
  coverImage?: string;
  coverColor?: string;
  coverConfig?: {
    title?: string;
    subtitle?: string;
    spineText?: string;
    foilColor?: 'gold' | 'silver' | 'rose-gold' | 'black';
    backgroundColor?: string;
  };
  bookConfig?: {
    size?: string;
    coverType?: string;
    theme?: string;
    color?: string;
    packaging?: string;
    pages?: number;
    price?: number;
  };
  pageCount?: number;
  photos?: string[];
  pagePhotos?: Record<number, any>;
  slotPhotos?: Record<string, any>;
  slotCrops?: Record<string, any>;
  pageLayouts?: Record<number, string>;
  pageBackgrounds?: Record<number, string>;
  [key: string]: any;
}

export interface IOrder extends Document {
  id?: string;
  orderNumber: string;
  title: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  guestToken?: string;
  amount: number;
  total: number;
  status: string;
  pdfUrl?: string;
  printPdfUrl?: string;
  invoiceUrl?: string;
  coverUrl?: string;
  thumbnail?: string;
  dimensions?: string;
  pageCount?: number;
  itemsCount?: number;
  items?: IOrderItem[];
  projectSnapshot?: IProjectSnapshot;
  specifications?: {
    dimensions?: string;
    pageCount?: number;
    coverType?: string;
    paperStock?: string;
    binding?: string;
    printProcess?: string;
    foilColor?: string;
    colorProfile?: string;
    [key: string]: any;
  };
  pricing?: {
    subtotal?: number;
    shipping?: number;
    packagingAddon?: boolean;
    packagingPrice?: number;
    discount?: number;
    promoCode?: string | null;
    total?: number;
    currency?: string;
    [key: string]: any;
  };
  packaging?: {
    keepsakeBox?: boolean;
    giftWrap?: boolean;
    uvGlaze?: boolean;
    miniPolaroids?: boolean;
    total?: number;
    [key: string]: any;
  };
  accessories?: {
    keepsakeBox?: boolean;
    giftWrap?: boolean;
    uvGlaze?: boolean;
    miniPolaroids?: boolean;
    total?: number;
    items?: Array<{ id: string; title?: string; name?: string; price: number; dimensions?: string }>;
    [key: string]: any;
  };
  isGift?: boolean;
  shippingAddress?: {
    fullName?: string;
    phone?: string;
    email?: string;
    addressLine1?: string;
    addressLine2?: string;
    landmark?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
    [key: string]: any;
  };
  deliveryOption?: string; // 'standard' | 'express'
  shippingDetails?: {
    carrier?: string;
    trackingNumber?: string;
    trackingUrl?: string;
    dispatchedAt?: Date | string;
    estimatedDelivery?: Date | string;
    deliveredAt?: Date | string;
    [key: string]: any;
  };
  paymentDetails?: {
    gateway?: string;
    status?: string;
    transactionId?: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    paidAt?: Date | string;
    [key: string]: any;
  };
  production?: {
    printerPartner?: string;
    jobSheetId?: string;
    status?: string;
    notes?: string;
    stageNotes?: Array<{
      stage: string;
      note: string;
      createdAt: Date | string;
      updatedBy?: string;
    }>;
    startedAt?: Date | string;
    printedAt?: Date | string;
    qcAt?: Date | string;
    completedAt?: Date | string;
    [key: string]: any;
  };
  recipients?: Array<{
    recipientName: string;
    phone?: string;
    email?: string;
    addressLine1: string;
    addressLine2?: string;
    landmark?: string;
    city: string;
    state: string;
    pincode: string;
    giftMessage?: string;
    itemIndexes?: number[];
  }>;
  auditLog?: Array<{
    action: string;
    updatedBy: string;
    timestamp: Date | string;
    details?: string;
    previousValue?: any;
    newValue?: any;
  }>;
  review?: any;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema: Schema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    customerName: { type: String, default: 'Guest User' },
    customerEmail: { type: String, index: true },
    customerPhone: { type: String },
    guestToken: { type: String, index: true },
    amount: { type: Number, required: true },
    total: { type: Number, required: true },
    status: { type: String, default: 'confirmed', index: true }, // pending, confirmed, production, printing, qc, dispatched, delivered, cancelled
    pdfUrl: { type: String }, // AWS S3 URL for print-ready Photobook PDF
    printPdfUrl: { type: String }, // Direct alias for commercial print shop
    invoiceUrl: { type: String }, // Tax invoice proof PDF link
    coverUrl: { type: String },
    thumbnail: { type: String },
    dimensions: { type: String, default: '8.25" × 8.25"' },
    pageCount: { type: Number, default: 40 },
    itemsCount: { type: Number, default: 1 },
    items: { type: Array, default: [] },
    projectSnapshot: { type: Object }, // Complete pages, layouts, slot photos, and crops snapshot
    specifications: { type: Object },
    pricing: { type: Object },
    packaging: { type: Object },
    accessories: { type: Object },
    isGift: { type: Boolean, default: false },
    shippingAddress: { type: Object },
    recipients: { type: Array, default: [] },
    auditLog: { type: Array, default: [] },
    deliveryOption: { type: String, default: 'standard' },
    shippingDetails: { type: Object },
    paymentDetails: { type: Object },
    production: { type: Object },
    review: { type: Object }
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

// High-concurrency compound query indexes
OrderSchema.index({ customerEmail: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ createdAt: -1 });

export const Order: mongoose.Model<IOrder> = 
  (mongoose.models.Order as mongoose.Model<IOrder>) || mongoose.model<IOrder>('Order', OrderSchema);
