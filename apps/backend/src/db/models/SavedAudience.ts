// apps/backend/src/db/models/SavedAudience.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export type AudienceType = 'dynamic' | 'static';

export interface ISavedAudience extends Document {
  name: string;
  description?: string;
  type: AudienceType;
  filter: Record<string, any>;
  staticRecipientIds?: (mongoose.Types.ObjectId | string)[];
  lastEstimatedCount: number;
  lastEstimatedBreakdown?: {
    totalMatched: number;
    emailEligible: number;
    whatsappEligible: number;
    suppressed: number;
    missingContact: number;
  };
  lastEstimatedAt?: Date;
  tags: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const SavedAudienceSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    description: { type: String, default: '' },
    type: { type: String, enum: ['dynamic', 'static'], default: 'dynamic', index: true },
    filter: { type: Object, default: () => ({}) },
    staticRecipientIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    lastEstimatedCount: { type: Number, default: 0 },
    lastEstimatedBreakdown: { type: Object },
    lastEstimatedAt: { type: Date },
    tags: { type: [String], default: [] },
    createdBy: { type: String, default: 'Admin' },
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

export const SavedAudience: Model<ISavedAudience> =
  (mongoose.models.SavedAudience as Model<ISavedAudience>) ||
  mongoose.model<ISavedAudience>('SavedAudience', SavedAudienceSchema);
