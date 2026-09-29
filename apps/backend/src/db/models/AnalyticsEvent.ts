// apps/backend/src/db/models/AnalyticsEvent.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IAnalyticsEvent extends Document {
  id?: string;
  anonymousId: string;
  sessionId: string;
  userId?: string;
  isLoggedIn: boolean;
  eventType: string; // 'pageview', 'config_change', 'photo_upload', 'editor_action', 'cart_action', 'checkout_step', 'order_completed', 'auth_action'
  eventName: string; // e.g. 'Viewed Studio Editor', 'Selected 3-Photo Layout'
  path: string;
  referrer?: string;
  device: string; // 'desktop' | 'mobile' | 'tablet'
  browser?: string;
  os?: string;
  city?: string;
  country?: string;
  source: string; // 'direct' | 'organic' | 'social' | 'email' | 'campaign'
  metadata?: Record<string, any>;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AnalyticsEventSchema: Schema = new Schema(
  {
    anonymousId: { type: String, required: true, index: true },
    sessionId: { type: String, required: true, index: true },
    userId: { type: String, index: true },
    isLoggedIn: { type: Boolean, default: false, index: true },
    eventType: { type: String, required: true, index: true },
    eventName: { type: String, required: true },
    path: { type: String, required: true, index: true },
    referrer: { type: String },
    device: { type: String, default: 'desktop', index: true },
    browser: { type: String },
    os: { type: String },
    city: { type: String, default: 'Bengaluru' },
    country: { type: String, default: 'IN' },
    source: { type: String, default: 'direct', index: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now, index: true },
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
      },
    },
    collection: 'analytics_events',
  }
);

// Compound indexes for fast aggregation queries
AnalyticsEventSchema.index({ timestamp: -1, isLoggedIn: 1 });
AnalyticsEventSchema.index({ sessionId: 1, timestamp: 1 });
AnalyticsEventSchema.index({ eventType: 1, timestamp: -1 });
AnalyticsEventSchema.index({ source: 1, timestamp: -1 });
AnalyticsEventSchema.index({ device: 1, timestamp: -1 });
AnalyticsEventSchema.index({ 'metadata.layout': 1 });
AnalyticsEventSchema.index({ 'metadata.foilColor': 1 });

export const AnalyticsEvent: mongoose.Model<IAnalyticsEvent> =
  (mongoose.models.AnalyticsEvent as mongoose.Model<IAnalyticsEvent>) ||
  mongoose.model<IAnalyticsEvent>('AnalyticsEvent', AnalyticsEventSchema, 'analytics_events');
