import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export type OtpPurpose = 
  | 'login' 
  | 'signup' 
  | 'password_reset' 
  | 'email_verification' 
  | 'phone_verification' 
  | 'order_verification' 
  | 'sensitive_action';

export type OtpChannel = 'email' | 'sms' | 'whatsapp';

export interface IOtp {
  id?: string;
  identifier: string; // Lowercase email or normalized phone
  otpHash: string; // Hashed with bcrypt for zero plaintext DB exposure
  purpose: OtpPurpose;
  channel: OtpChannel;
  attempts: number;
  maxAttempts: number;
  isVerified: boolean;
  verifiedAt?: Date | null;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  resendCount: number;
  lastResentAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IOtpDocument extends IOtp, Document {
  compareOtp(candidateOtp: string): Promise<boolean>;
}

const OtpSchema: Schema<IOtpDocument> = new Schema<IOtpDocument>(
  {
    identifier: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      enum: [
        'login',
        'signup',
        'password_reset',
        'email_verification',
        'phone_verification',
        'order_verification',
        'sensitive_action',
      ],
      default: 'login',
      index: true,
    },
    channel: {
      type: String,
      enum: ['email', 'sms', 'whatsapp'],
      default: 'email',
    },
    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 5,
    },
    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // MongoDB automatic TTL cleanup
    },
    ipAddress: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    resendCount: {
      type: Number,
      default: 0,
    },
    lastResentAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: any) {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret._id;
        delete ret.__v;
        delete ret.otpHash;
        return ret;
      },
    },
  }
);

// Compound index for lightning-fast active OTP lookup
OtpSchema.index({ identifier: 1, purpose: 1, isVerified: 1, expiresAt: 1 });

// Rate-limiting / anti-abuse indexes
OtpSchema.index({ identifier: 1, createdAt: -1 });
OtpSchema.index({ ipAddress: 1, createdAt: -1 });

// Method to verify candidate OTP using timing-safe bcrypt comparison
OtpSchema.methods.compareOtp = async function (candidateOtp: string): Promise<boolean> {
  if (!this.otpHash || !candidateOtp) return false;
  return bcrypt.compare(candidateOtp, this.otpHash);
};

export const Otp: Model<IOtpDocument> =
  (mongoose.models.Otp as Model<IOtpDocument>) ||
  mongoose.model<IOtpDocument>('Otp', OtpSchema);

export default Otp;
