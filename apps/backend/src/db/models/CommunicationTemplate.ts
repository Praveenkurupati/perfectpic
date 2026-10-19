// apps/backend/src/db/models/CommunicationTemplate.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export type TemplateChannel = 'email' | 'whatsapp';
export type TemplateCategory = 'marketing' | 'transactional' | 'retention' | 'announcement';
export type TemplateStatus = 'draft' | 'active' | 'archived' | 'submitted' | 'approved' | 'rejected';

export interface IWhatsappComponent {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
  format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  text?: string;
  buttons?: Array<{
    type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
    text: string;
    url?: string;
    phoneNumber?: string;
  }>;
}

export interface ICommunicationTemplate extends Document {
  name: string;
  slug: string;
  description?: string;
  channel: TemplateChannel;
  category: TemplateCategory;
  status: TemplateStatus;
  version: number;

  // Email specific fields
  subject?: string;
  preheader?: string;
  contentHtml?: string;
  contentText?: string;

  // WhatsApp specific fields
  whatsappTemplateName?: string;
  whatsappLanguageCode?: string;
  whatsappCategory?: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  whatsappComponents?: IWhatsappComponent[];
  metaApprovalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAUSED' | 'DISABLED';
  metaRejectionReason?: string;

  // Extracted variables and preview fixtures
  variables: string[];
  sampleData: Record<string, string>;

  // Metadata
  providerTemplateId?: string;
  tags: string[];
  createdBy: string;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CommunicationTemplateSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: '' },
    channel: { type: String, enum: ['email', 'whatsapp'], required: true, index: true },
    category: { 
      type: String, 
      enum: ['marketing', 'transactional', 'retention', 'announcement'], 
      default: 'marketing',
      index: true 
    },
    status: { 
      type: String, 
      enum: ['draft', 'active', 'archived', 'submitted', 'approved', 'rejected'], 
      default: 'active',
      index: true 
    },
    version: { type: Number, default: 1 },

    subject: { type: String, trim: true },
    preheader: { type: String, trim: true },
    contentHtml: { type: String },
    contentText: { type: String },

    whatsappTemplateName: { type: String, trim: true },
    whatsappLanguageCode: { type: String, default: 'en_US' },
    whatsappCategory: { type: String, enum: ['MARKETING', 'UTILITY', 'AUTHENTICATION'], default: 'MARKETING' },
    whatsappComponents: { type: Array, default: [] },
    metaApprovalStatus: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED', 'PAUSED', 'DISABLED'], default: 'APPROVED' },
    metaRejectionReason: { type: String },

    variables: { type: [String], default: [] },
    sampleData: { type: Object, default: () => ({}) },

    providerTemplateId: { type: String },
    tags: { type: [String], default: [] },
    createdBy: { type: String, default: 'Admin' },
    isSystem: { type: Boolean, default: false },
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

CommunicationTemplateSchema.index({ channel: 1, status: 1 });
CommunicationTemplateSchema.index({ category: 1, channel: 1 });

export const CommunicationTemplate: Model<ICommunicationTemplate> =
  (mongoose.models.CommunicationTemplate as Model<ICommunicationTemplate>) ||
  mongoose.model<ICommunicationTemplate>('CommunicationTemplate', CommunicationTemplateSchema);
