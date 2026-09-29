import mongoose, { Schema, Document } from 'mongoose';

export interface IAddress extends Document {
  id?: string;
  userId?: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  type: 'home' | 'office' | 'studio' | 'other';
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema: Schema = new Schema(
  {
    userId: { type: String, index: true },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    addressLine1: { type: String, required: true, trim: true },
    addressLine2: { type: String, trim: true, default: '' },
    landmark: { type: String, trim: true, default: '' },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true, index: true },
    type: { type: String, enum: ['home', 'office', 'studio', 'other'], default: 'home' },
    isDefault: { type: Boolean, default: false }
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

export const Address: mongoose.Model<IAddress> =
  (mongoose.models.Address as mongoose.Model<IAddress>) || mongoose.model<IAddress>('Address', AddressSchema);
