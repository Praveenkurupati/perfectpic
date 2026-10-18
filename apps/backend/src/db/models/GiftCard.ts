// apps/backend/src/db/models/GiftCard.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export type GiftCardStatus = 
  | 'active' 
  | 'partially_redeemed' 
  | 'fully_redeemed' 
  | 'expired' 
  | 'frozen' 
  | 'cancelled';

export type GiftCardTheme = 
  | 'classic' 
  | 'anniversary' 
  | 'wedding' 
  | 'baby' 
  | 'birthday' 
  | 'holiday';

export interface IGiftCardRecipient {
  name: string;
  email: string;
  phone?: string;
}

export interface IGiftCardSender {
  name: string;
  email: string;
  phone?: string;
}

export interface IGiftCard {
  id?: string;
  code: string;
  pin: string;
  initialAmount: number;
  currentBalance: number;
  currency: string;
  status: GiftCardStatus;
  theme: GiftCardTheme;
  recipient: IGiftCardRecipient;
  sender: IGiftCardSender;
  message?: string;
  deliveryMethod: 'email' | 'whatsapp' | 'scheduled';
  scheduledDeliveryDate?: Date | null;
  isDelivered: boolean;
  deliveredAt?: Date | null;
  expiresAt?: Date | null;
  purchaserOrderId?: string;
  claimantUserId?: string | null;
  claimedAt?: Date | null;
  issuedBy: 'storefront_purchase' | 'admin_courtesy' | 'loyalty_reward';
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IGiftCardDocument extends IGiftCard, Document {}

const GiftCardSchema: Schema<IGiftCardDocument> = new Schema<IGiftCardDocument>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    pin: {
      type: String,
      required: true,
      trim: true,
    },
    initialAmount: {
      type: Number,
      required: true,
      min: 100,
    },
    currentBalance: {
      type: Number,
      required: true,
      min: 0,
      index: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    status: {
      type: String,
      enum: ['active', 'partially_redeemed', 'fully_redeemed', 'expired', 'frozen', 'cancelled'],
      default: 'active',
      index: true,
    },
    theme: {
      type: String,
      enum: ['classic', 'anniversary', 'wedding', 'baby', 'birthday', 'holiday'],
      default: 'classic',
    },
    recipient: {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true, lowercase: true, index: true },
      phone: { type: String, trim: true, default: '' },
    },
    sender: {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true, lowercase: true },
      phone: { type: String, trim: true, default: '' },
    },
    message: {
      type: String,
      trim: true,
      default: '',
    },
    deliveryMethod: {
      type: String,
      enum: ['email', 'whatsapp', 'scheduled'],
      default: 'email',
    },
    scheduledDeliveryDate: {
      type: Date,
      default: null,
    },
    isDelivered: {
      type: Boolean,
      default: false,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
      index: true,
    },
    purchaserOrderId: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    claimantUserId: {
      type: String,
      default: null,
      index: true,
    },
    claimedAt: {
      type: Date,
      default: null,
    },
    issuedBy: {
      type: String,
      enum: ['storefront_purchase', 'admin_courtesy', 'loyalty_reward'],
      default: 'storefront_purchase',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
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

export const GiftCard: Model<IGiftCardDocument> =
  (mongoose.models.GiftCard as Model<IGiftCardDocument>) ||
  mongoose.model<IGiftCardDocument>('GiftCard', GiftCardSchema);
