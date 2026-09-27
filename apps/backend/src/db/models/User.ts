import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  password?: string;
  role: 'admin' | 'user';
  avatar?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserDocument extends IUser, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema<IUserDocument> = new Schema<IUserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true, 
      trim: true, 
      index: true 
    },
    phone: { type: String, trim: true, default: '' },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'user'], default: 'user', index: true },
    avatar: { type: String, default: '' }
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: any) {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        return ret;
      }
    }
  }
);

// Method to verify password
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

export const User: Model<IUserDocument> = 
  (mongoose.models.User as Model<IUserDocument>) || 
  mongoose.model<IUserDocument>('User', UserSchema);
