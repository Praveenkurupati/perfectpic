// apps/backend/src/repositories/UserRepository.ts
import mongoose from 'mongoose';
import { User, IUserDocument } from '../db/models/User';
import { isDbConnected } from '../db/connection';
import { logger } from '../utils/logger';

export class UserRepository {
  public static async findById(id: string): Promise<IUserDocument | null> {
    if (!isDbConnected() || !mongoose.isValidObjectId(id)) return null;
    try {
      return await User.findById(id);
    } catch (err: any) {
      logger.error('UserRepository findById error:', err.message);
      return null;
    }
  }

  public static async findByEmail(email: string): Promise<IUserDocument | null> {
    if (!isDbConnected()) return null;
    try {
      return await User.findOne({ email: email.toLowerCase().trim() });
    } catch (err: any) {
      logger.error('UserRepository findByEmail error:', err.message);
      return null;
    }
  }

  public static async findByPhone(phone: string): Promise<IUserDocument | null> {
    if (!isDbConnected()) return null;
    try {
      return await User.findOne({ phone: phone.trim() });
    } catch (err: any) {
      logger.error('UserRepository findByPhone error:', err.message);
      return null;
    }
  }

  public static async findByIdentifier(rawIdentifier: string): Promise<IUserDocument | null> {
    if (!isDbConnected()) return null;
    const input = (rawIdentifier || '').trim().toLowerCase();

    try {
      const conditions: any[] = [
        { email: input },
        { phone: input },
      ];

      if (!input.includes('@')) {
        conditions.push({ email: `${input}@perfectpic.in` });
      } else {
        const usernamePart = input.split('@')[0];
        if (usernamePart) {
          conditions.push({ email: `${usernamePart}@perfectpic.in` });
        }
      }

      return await User.findOne({ $or: conditions });
    } catch (err: any) {
      logger.error('UserRepository findByIdentifier error:', err.message);
      return null;
    }
  }

  public static async create(userData: any): Promise<IUserDocument | any> {
    if (isDbConnected()) {
      return await User.create(userData);
    }
    // In-memory fallback
    return {
      _id: 'user_' + Date.now(),
      id: 'user_' + Date.now(),
      ...userData,
      createdAt: new Date(),
    };
  }

  public static async findAll(limit = 50, skip = 0) {
    if (isDbConnected()) {
      const users = await User.find({})
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      const total = await User.countDocuments();
      return { users, total };
    }
    return { users: [], total: 0 };
  }
}

export default UserRepository;
