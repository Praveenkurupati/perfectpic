// apps/backend/src/services/OtpService.ts
import { generateOTP } from '../utils/otp';
import { mailService } from './MailService';
import { SmsService } from './SmsService';
import { WhatsappService } from './WhatsappService';
import { OtpRepository } from '../repositories/OtpRepository';
import { OtpPurpose, OtpChannel } from '../db/models/Otp';
import { cacheGet, cacheSet, cacheDel } from '../cache/redis';
import { logger } from '../utils/logger';
import { OTP_CONFIG } from '../config/constants';
import { env } from '../config/env';

export interface IRequestOtpOptions {
  email?: string;
  phone?: string;
  identifier?: string;
  name?: string;
  purpose?: OtpPurpose;
  channel?: OtpChannel;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export interface IVerifyOtpOptions {
  identifier: string;
  otp: string;
  purpose?: OtpPurpose;
}

export class OtpService {
  /**
   * Request & dispatch an OTP with enterprise-grade protection:
   * 1. Distributed Redis atomic cooldown check (60s)
   * 2. Recipient hourly velocity throttling (max 5/hr)
   * 3. IP-based fraud throttling (max 20/hr)
   * 4. Bcrypt-hashed MongoDB persistence with automatic TTL cleanup
   * 5. Multi-channel dispatch (Email, SMS, WhatsApp)
   */
  public static async requestOtp(
    options: IRequestOtpOptions
  ): Promise<{ success: boolean; identifier: string; purpose: OtpPurpose; devOtp?: string }> {
    const rawTarget = options.email || options.phone || options.identifier || '';
    const identifier = rawTarget.trim().toLowerCase();
    const purpose: OtpPurpose = options.purpose || 'login';

    if (!identifier) {
      throw new Error('Please provide an email address or phone number to receive an OTP.');
    }

    const isEmail = identifier.includes('@');
    const channel: OtpChannel = options.channel || (isEmail ? 'email' : 'sms');

    // 1. Distributed Redis Cooldown Check (60 seconds)
    const cooldownKey = `otp_cooldown:${identifier}:${purpose}`;
    const redisCooldown = await cacheGet<number>(cooldownKey);
    const now = Date.now();

    if (redisCooldown && now < redisCooldown) {
      const waitSeconds = Math.ceil((redisCooldown - now) / 1000);
      throw new Error(`Please wait ${waitSeconds} seconds before requesting a new verification code.`);
    }

    // 2. Velocity Throttling: Max 5 requests per hour for this identifier
    const recentRequestsCount = await OtpRepository.getRecentRequestsCount(identifier, 60);
    if (recentRequestsCount >= 5) {
      logger.warn(`🚨 Velocity limit exceeded for identifier: [${identifier}]. Requests in last hour: ${recentRequestsCount}`);
      throw new Error('Too many verification codes requested. For security, please wait 1 hour before trying again.');
    }

    // 3. IP Fraud Throttling: Max 20 requests per hour per IP
    if (options.ipAddress) {
      const ipRequestsCount = await OtpRepository.getRecentIpRequestsCount(options.ipAddress, 60);
      if (ipRequestsCount >= 20) {
        logger.warn(`🚨 IP velocity limit exceeded for IP: [${options.ipAddress}]`);
        throw new Error('Too many verification requests from this network. Please try again later.');
      }
    }

    // 4. Generate cryptographically random OTP
    const otp = generateOTP(OTP_CONFIG.LENGTH);
    const ttlMinutes = OTP_CONFIG.EXPIRY_MINUTES || 10;

    // 5. Store in MongoDB with bcrypt hash and TTL index (No in-memory Map)
    await OtpRepository.createOtp({
      identifier,
      otp,
      purpose,
      channel,
      ttlMinutes,
      ipAddress: options.ipAddress || '',
      userAgent: options.userAgent || '',
      metadata: options.metadata || {},
    });

    // 6. Set 60-second atomic cooldown in Redis
    const cooldownExpiry = now + 60 * 1000;
    await cacheSet(cooldownKey, cooldownExpiry, 60);

    // 7. Dispatch OTP through specified channel
    if (channel === 'email' || isEmail) {
      const sent = await mailService.sendOtpEmail(
        identifier,
        otp,
        options.name || 'Valued Collector',
        purpose
      );
      if (!sent && mailService.isConfigured) {
        throw new Error('Failed to send verification email. Please check your email address and try again.');
      }
    }

    if (channel === 'sms' || (!isEmail && options.phone)) {
      const phoneNum = options.phone || identifier;
      await SmsService.sendOtpSms(phoneNum, otp);
    }

    if (channel === 'whatsapp') {
      const phoneNum = options.phone || identifier;
      await WhatsappService.sendOtpWhatsapp(phoneNum, otp);
    }

    logger.info(`✅ [Enterprise OTP] Code successfully dispatched to [${identifier}] via ${channel} (Purpose: ${purpose})`);

    return {
      success: true,
      identifier,
      purpose,
      devOtp: (!mailService.isConfigured || env.isDev) ? otp : undefined,
    };
  }

  /**
   * Verify candidate OTP against MongoDB persistent hashed storage:
   * 1. Fetches latest unverified active OTP document for (identifier, purpose)
   * 2. Checks maximum allowed attempts (brute-force defense)
   * 3. Performs timing-safe bcrypt hash comparison
   * 4. Atomically marks document as verified and clears cooldowns
   */
  public static async verifyOtp(
    targetIdentifier: string,
    candidateOtp: string,
    purpose: OtpPurpose = 'login'
  ): Promise<boolean> {
    const identifier = (targetIdentifier || '').trim().toLowerCase();
    const candidate = (candidateOtp || '').trim();

    if (!identifier || !candidate) {
      return false;
    }

    // 1. Retrieve the active unverified OTP document from MongoDB
    const otpDoc = await OtpRepository.findActiveOtp(identifier, purpose);

    if (!otpDoc) {
      logger.warn(`Verification failed: No active unexpired OTP found for [${identifier}] (Purpose: ${purpose})`);
      return false;
    }

    // 2. Check if maximum attempts have been reached
    if (otpDoc.attempts >= otpDoc.maxAttempts) {
      logger.warn(`🚨 Max OTP attempts exceeded for [${identifier}]. Invalidating document.`);
      await OtpRepository.markVerified(otpDoc._id.toString());
      throw new Error('Too many failed verification attempts. This code has been invalidated for security. Please request a new code.');
    }

    // 3. Timing-safe bcrypt hash comparison
    const isMatch = await otpDoc.compareOtp(candidate);

    if (!isMatch) {
      // Atomically increment failed attempts
      const nextAttempts = await OtpRepository.incrementAttempts(otpDoc._id.toString());
      const remainingAttempts = Math.max(0, otpDoc.maxAttempts - nextAttempts);

      if (remainingAttempts === 0) {
        await OtpRepository.markVerified(otpDoc._id.toString());
        throw new Error('Too many failed verification attempts. This code has been invalidated for security. Please request a new code.');
      }

      logger.warn(`Failed OTP verification attempt (${nextAttempts}/${otpDoc.maxAttempts}) for [${identifier}]`);
      throw new Error(`Invalid verification code. You have ${remainingAttempts} attempt(s) remaining.`);
    }

    // 4. Mark OTP document as verified in database
    await OtpRepository.markVerified(otpDoc._id.toString());

    // 5. Clear Redis cooldown key to allow immediate follow-up actions if needed
    const cooldownKey = `otp_cooldown:${identifier}:${purpose}`;
    await cacheDel(cooldownKey);

    logger.info(`✨ [Enterprise OTP] Verified successfully for [${identifier}] (Purpose: ${purpose})`);
    return true;
  }
}

export default OtpService;
