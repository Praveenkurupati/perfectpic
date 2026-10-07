import mongoose, { Schema, Document } from 'mongoose';

export interface IProject extends Document {
  id?: string;
  userId?: mongoose.Types.ObjectId | string;
  guestSessionId?: string;
  title: string;
  template?: string;
  status: string; // Draft, Completed, Processing
  coverUrl?: string;
  coverImage?: string;
  pageCount?: number;
  bookSize?: string;
  coverType?: string;
  theme?: string;
  color?: string;
  packaging?: string;
  photos?: any[];
  pages?: any[];
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    guestSessionId: { type: String, index: true },
    title: { type: String, required: true },
    template: { type: String, default: 'custom' },
    status: { type: String, default: 'Draft', index: true },
    coverUrl: { type: String },
    coverImage: { type: String },
    pageCount: { type: Number, default: 40 },
    bookSize: { type: String, default: '8.25x8.25' },
    coverType: { type: String, default: 'cov-1' },
    theme: { type: String, default: 'theme-1' },
    color: { type: String, default: 'col-1' },
    packaging: { type: String, default: 'pack-1' },
    photos: { type: [Object], default: [] },
    pages: { type: [Object], default: [] }
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

ProjectSchema.index({ userId: 1, updatedAt: -1 });
ProjectSchema.index({ guestSessionId: 1, updatedAt: -1 });
ProjectSchema.index({ userId: 1, status: 1, updatedAt: -1 });
ProjectSchema.index({ guestSessionId: 1, status: 1, updatedAt: -1 });
ProjectSchema.index({ userId: 1, createdAt: -1 });

export const Project: mongoose.Model<IProject> = 
  (mongoose.models.Project as mongoose.Model<IProject>) || mongoose.model<IProject>('Project', ProjectSchema);
