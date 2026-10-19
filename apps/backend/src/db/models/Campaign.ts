// apps/backend/src/db/models/Campaign.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export type CampaignChannel = 'email' | 'whatsapp';
export type CampaignType = 'marketing' | 'transactional' | 'retention' | 'announcement';
export type CampaignStatus = 
  | 'draft' 
  | 'audience_selected' 
  | 'ready' 
  | 'scheduled' 
  | 'queued' 
  | 'running' 
  | 'paused' 
  | 'completed' 
  | 'failed' 
  | 'cancelled';

export interface ICampaignStats {
  totalRecipients: number;
  eligible: number;
  queued: number;
  sent: number;
  delivered: number;
  read: number;
  clicked: number;
  bounced: number;
  failed: number;
  pending: number;
  cancelled: number;
  suppressed: number;
}

export interface ICampaignAuditEntry {
  action: string;
  performedBy: string;
  timestamp: Date;
  details?: string;
  previousStatus?: string;
  newStatus?: string;
}

export interface ICampaign extends Document {
  name: string;
  description?: string;
  channel: CampaignChannel;
  type: CampaignType;
  status: CampaignStatus;
  templateId?: mongoose.Types.ObjectId | string;
  templateVersion?: number;
  templateSnapshot?: {
    subject?: string;
    preheader?: string;
    contentHtml?: string;
    contentText?: string;
    whatsappTemplateName?: string;
    whatsappLanguageCode?: string;
    whatsappComponents?: any[];
    variables?: string[];
  };
  audienceFilter: Record<string, any>;
  audienceSnapshot?: {
    totalMatched: number;
    totalEligible: number;
    excludedCount: number;
    exclusionBreakdown: Record<string, number>;
    snapshotTakenAt?: Date;
  };
  scheduledAt?: Date | null;
  startedAt?: Date | null;
  completedAt?: Date | null;
  pausedAt?: Date | null;
  cancelledAt?: Date | null;
  stats: ICampaignStats;
  utm?: {
    source: string;
    medium: string;
    campaign: string;
    content?: string;
  };
  rateLimitPerSecond: number;
  provider: string; // 'ses' | 'smtp' | 'meta_cloud' | 'mock'
  createdBy: string;
  auditLog: ICampaignAuditEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const CampaignSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    description: { type: String, default: '' },
    channel: { type: String, enum: ['email', 'whatsapp'], required: true, index: true },
    type: { type: String, enum: ['marketing', 'transactional', 'retention', 'announcement'], default: 'marketing' },
    status: { 
      type: String, 
      enum: ['draft', 'audience_selected', 'ready', 'scheduled', 'queued', 'running', 'paused', 'completed', 'failed', 'cancelled'], 
      default: 'draft',
      index: true 
    },
    templateId: { type: Schema.Types.ObjectId, ref: 'CommunicationTemplate' },
    templateVersion: { type: Number, default: 1 },
    templateSnapshot: { type: Object },
    audienceFilter: { type: Object, default: () => ({}) },
    audienceSnapshot: { type: Object },
    scheduledAt: { type: Date, default: null, index: true },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    pausedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    stats: {
      type: Object,
      default: () => ({
        totalRecipients: 0,
        eligible: 0,
        queued: 0,
        sent: 0,
        delivered: 0,
        read: 0,
        clicked: 0,
        bounced: 0,
        failed: 0,
        pending: 0,
        cancelled: 0,
        suppressed: 0,
      }),
    },
    utm: {
      type: Object,
      default: () => ({ source: 'perfectpic', medium: 'campaign', campaign: 'promo' }),
    },
    rateLimitPerSecond: { type: Number, default: 20 },
    provider: { type: String, default: 'default' },
    createdBy: { type: String, default: 'Admin' },
    auditLog: { type: Array, default: [] },
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

// High-performance query indexes
CampaignSchema.index({ status: 1, createdAt: -1 });
CampaignSchema.index({ channel: 1, status: 1 });
CampaignSchema.index({ scheduledAt: 1, status: 1 });

export const Campaign: Model<ICampaign> = 
  (mongoose.models.Campaign as Model<ICampaign>) || mongoose.model<ICampaign>('Campaign', CampaignSchema);
