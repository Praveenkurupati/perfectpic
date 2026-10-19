// apps/backend/src/db/models/CampaignRecipient.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export type RecipientStatus = 
  | 'pending' 
  | 'processing' 
  | 'sent' 
  | 'delivered' 
  | 'read' 
  | 'clicked' 
  | 'bounced' 
  | 'failed_retryable' 
  | 'failed_permanent' 
  | 'cancelled' 
  | 'suppressed';

export type FailureCategory = 
  | 'consent' 
  | 'suppressed' 
  | 'invalid_contact' 
  | 'provider_error' 
  | 'rate_limit' 
  | 'template_error'
  | 'timeout'
  | 'unknown';

export interface ICampaignRecipient extends Document {
  campaignId: mongoose.Types.ObjectId | string;
  customerId?: mongoose.Types.ObjectId | string;
  email?: string;
  phone?: string;
  customerName?: string;
  channel: 'email' | 'whatsapp';
  status: RecipientStatus;
  idempotencyKey: string;
  variables: Record<string, string>;
  providerMessageId?: string;
  attempts: number;
  maxAttempts: number;
  lastAttemptAt?: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  clickedAt?: Date;
  failedReason?: string;
  failureCategory?: FailureCategory;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignRecipientSchema: Schema = new Schema(
  {
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User' },
    email: { type: String, lowercase: true, trim: true, index: true },
    phone: { type: String, trim: true, index: true },
    customerName: { type: String, default: '' },
    channel: { type: String, enum: ['email', 'whatsapp'], required: true },
    status: { 
      type: String, 
      enum: ['pending', 'processing', 'sent', 'delivered', 'read', 'clicked', 'bounced', 'failed_retryable', 'failed_permanent', 'cancelled', 'suppressed'], 
      default: 'pending',
      index: true 
    },
    idempotencyKey: { type: String, required: true, unique: true },
    variables: { type: Object, default: () => ({}) },
    providerMessageId: { type: String, index: true },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 3 },
    lastAttemptAt: { type: Date },
    sentAt: { type: Date },
    deliveredAt: { type: Date },
    readAt: { type: Date },
    clickedAt: { type: Date },
    failedReason: { type: String },
    failureCategory: { 
      type: String, 
      enum: ['consent', 'suppressed', 'invalid_contact', 'provider_error', 'rate_limit', 'template_error', 'timeout', 'unknown'] 
    },
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

// High-speed compound indexes for queue workers and admin recipient grid queries
CampaignRecipientSchema.index({ campaignId: 1, status: 1 });
CampaignRecipientSchema.index({ campaignId: 1, email: 1 });
CampaignRecipientSchema.index({ campaignId: 1, phone: 1 });
CampaignRecipientSchema.index({ campaignId: 1, createdAt: 1 });

export const CampaignRecipient: Model<ICampaignRecipient> = 
  (mongoose.models.CampaignRecipient as Model<ICampaignRecipient>) || 
  mongoose.model<ICampaignRecipient>('CampaignRecipient', CampaignRecipientSchema);
