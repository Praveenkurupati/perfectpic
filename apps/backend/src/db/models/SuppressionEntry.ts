// apps/backend/src/db/models/SuppressionEntry.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export type SuppressionChannel = 'email' | 'whatsapp' | 'all';
export type SuppressionReason = 
  | 'unsubscribed' 
  | 'hard_bounce' 
  | 'complaint' 
  | 'dnc' 
  | 'manual_admin' 
  | 'invalid_number'
  | 'temporary_cooldown';

export interface ISuppressionEntry extends Document {
  identifier: string; // Lowercase email or normalized E.164 phone number
  channel: SuppressionChannel;
  reason: SuppressionReason;
  campaignId?: mongoose.Types.ObjectId | string;
  source?: string; // 'webhook', 'user_unsubscribe_link', 'admin', 'bounce_handler'
  metadata?: Record<string, any>;
  suppressedAt: Date;
  expiresAt?: Date | null; // Null means permanent
  active: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SuppressionEntrySchema: Schema = new Schema(
  {
    identifier: { type: String, required: true, lowercase: true, trim: true, index: true },
    channel: { type: String, enum: ['email', 'whatsapp', 'all'], required: true, index: true },
    reason: { 
      type: String, 
      enum: ['unsubscribed', 'hard_bounce', 'complaint', 'dnc', 'manual_admin', 'invalid_number', 'temporary_cooldown'], 
      required: true,
      index: true 
    },
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign' },
    source: { type: String, default: 'admin' },
    metadata: { type: Object, default: () => ({}) },
    suppressedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: null, index: true },
    active: { type: Boolean, default: true, index: true },
    notes: { type: String, default: '' },
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

// Compound index for instant suppression lookup
SuppressionEntrySchema.index({ identifier: 1, channel: 1, active: 1 });

export const SuppressionEntry: Model<ISuppressionEntry> =
  (mongoose.models.SuppressionEntry as Model<ISuppressionEntry>) ||
  mongoose.model<ISuppressionEntry>('SuppressionEntry', SuppressionEntrySchema);
