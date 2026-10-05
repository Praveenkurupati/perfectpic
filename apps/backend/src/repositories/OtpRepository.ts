// apps/backend/src/repositories/OtpRepository.ts
import bcrypt from 'bcryptjs';
import { Otp, IOtpDocument, OtpPurpose, OtpChannel } from '../db/models/Otp';
import { isDbConnected } from '../db/connection';
import { logger } from '../utils/logger';

export interface ICreateOtpParams {
  identifier: string;
  otp: string;
  purpose: OtpPurpose;
  channel?: OtpChannel;
  ttlMinutes?: number;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export class OtpRepository {
  /**
   * Creates and stores an encrypted OTP document in MongoDB.
   * Atomically supersedes and invalidates any existing pending OTPs for the same (identifier, purpose).
   */
  public static async createOtp(params: ICreateOtpParams): Promise<IOtpDocument | any> {
    const {
      identifier,
      otp,
      purpose,
      channel = 'email',
      ttlMinutes = 10,
      ipAddress = '',
      userAgent = '',
      metadata = {},
    } = params;

    const normalizedIdentifier = identifier.toLowerCase().trim();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    if (isDbConnected()) {
      try {
        // 1. Invalidate any prior active OTPs for this identifier & purpose to prevent race conditions
        await Otp.updateMany(
          {
            identifier: normalizedIdentifier,
            purpose,
            isVerified: false,
          },
          {
            $set: { isVerified: true, verifiedAt: new Date() },
          }
        );

        // 2. Persist new encrypted OTP document
        const created = await Otp.create({
          identifier: normalizedIdentifier,
          otpHash,
          purpose,
          channel,
          attempts: 0,
          maxAttempts: 5,
          isVerified: false,
          expiresAt,
          ipAddress,
          userAgent,
          metadata,
          resendCount: 0,
          lastResentAt: new Date(),
        });

        logger.info(`💾 Persistent OTP document created in MongoDB for [${normalizedIdentifier}] (Purpose: ${purpose})`);
        return created;
      } catch (err: any) {
        logger.error(`Failed to store OTP in MongoDB: ${err.message}`);
      }
    }

    // In-memory fallback if database is offline during bootstrap
    return {
      id: 'mock_otp_' + Date.now(),
      identifier: normalizedIdentifier,
      otpHash,
      purpose,
      channel,
      attempts: 0,
      maxAttempts: 5,
      isVerified: false,
      expiresAt,
      compareOtp: async (candidate: string) => bcrypt.compare(candidate, otpHash),
    };
  }

  /**
   * Find the most recent active, unverified, unexpired OTP for this identifier and purpose
   */
  public static async findActiveOtp(
    identifier: string,
    purpose: OtpPurpose
  ): Promise<IOtpDocument | null> {
    if (!isDbConnected()) return null;

    const normalizedIdentifier = identifier.toLowerCase().trim();
    try {
      return await Otp.findOne({
        identifier: normalizedIdentifier,
        purpose,
        isVerified: false,
        expiresAt: { $gt: new Date() },
      }).sort({ createdAt: -1 });
    } catch (err: any) {
      logger.error(`Error querying active OTP: ${err.message}`);
      return null;
    }
  }

  /**
   * Atomically increment the failed attempt count
   */
  public static async incrementAttempts(otpId: string): Promise<number> {
    if (!isDbConnected()) return 1;

    try {
      const updated = await Otp.findByIdAndUpdate(
        otpId,
        { $inc: { attempts: 1 } },
        { new: true }
      );
      return updated ? updated.attempts : 1;
    } catch (err: any) {
      logger.error(`Error incrementing OTP attempts: ${err.message}`);
      return 1;
    }
  }

  /**
   * Atomically mark OTP as verified and record timestamp
   */
  public static async markVerified(otpId: string): Promise<boolean> {
    if (!isDbConnected()) return true;

    try {
      const updated = await Otp.findByIdAndUpdate(otpId, {
        $set: {
          isVerified: true,
          verifiedAt: new Date(),
        },
      });
      return !!updated;
    } catch (err: any) {
      logger.error(`Error marking OTP verified: ${err.message}`);
      return false;
    }
  }

  /**
   * Velocity check: How many OTPs were requested for this email in the last N minutes
   */
  public static async getRecentRequestsCount(
    identifier: string,
    windowMinutes = 60
  ): Promise<number> {
    if (!isDbConnected()) return 0;

    const normalizedIdentifier = identifier.toLowerCase().trim();
    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);

    try {
      return await Otp.countDocuments({
        identifier: normalizedIdentifier,
        createdAt: { $gte: windowStart },
      });
    } catch {
      return 0;
    }
  }

  /**
   * IP Velocity check: How many OTPs were requested from this IP address in the last N minutes
   */
  public static async getRecentIpRequestsCount(
    ipAddress: string,
    windowMinutes = 60
  ): Promise<number> {
    if (!isDbConnected() || !ipAddress) return 0;

    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);
    try {
      return await Otp.countDocuments({
        ipAddress,
        createdAt: { $gte: windowStart },
      });
    } catch {
      return 0;
    }
  }
}

export default OtpRepository;
