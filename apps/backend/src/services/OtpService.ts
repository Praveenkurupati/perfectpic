// apps/backend/src/services/OtpService.ts
import { generateOTP } from '../utils/otp';
import { mailService } from './MailService';
import { SmsService } from './SmsService';
import { WhatsappService } from './WhatsappService';
import { cacheGet, cacheSet, cacheDel } from '../cache/redis';
import { logger } from '../utils/logger';
import { OTP_CONFIG } from '../config/constants';

interface StoredOtpData {
  otp: string;
  expiresAt: number;
  attempts: number;
}

const memoryOtpStore = new Map<string, StoredOtpData>();
const memoryCooldownStore = new Map<string, number>();

export class OtpService {
  /**
   * Request & send OTP to email, phone, or both with rate limit protection
   */
  public static async requestOtp(params: {
    email?: string;
    phone?: string;
    identifier?: string;
    name?: string;
    purpose?: 'login' | 'signup' | 'verification';
  }): Promise<{ success: boolean; identifier: string; devOtp?: string }> {
    const rawTarget = params.email || params.phone || params.identifier || '';
    const identifier = rawTarget.trim().toLowerCase();

    if (!identifier) {
      throw new Error('Please provide an email address or phone number to receive an OTP.');
    }

    // Cooldown check (60 seconds) to prevent SMS/Email toll fraud and spamming
    const cooldownKey = `otp_cooldown:${identifier}`;
    const redisCooldown = await cacheGet<number>(cooldownKey);
    const memCooldown = memoryCooldownStore.get(identifier);
    const now = Date.now();

    if (redisCooldown && now < redisCooldown) {
      const waitSeconds = Math.ceil((redisCooldown - now) / 1000);
      throw new Error(`Please wait ${waitSeconds} seconds before requesting a new verification code.`);
    }

    if (memCooldown && now < memCooldown) {
      const waitSeconds = Math.ceil((memCooldown - now) / 1000);
      throw new Error(`Please wait ${waitSeconds} seconds before requesting a new verification code.`);
    }

    const otp = generateOTP(OTP_CONFIG.LENGTH);
    const ttlSeconds = OTP_CONFIG.EXPIRY_MINUTES * 60;
    const redisKey = `otp:${identifier}`;

    // Set 60-second request cooldown
    const cooldownExpiry = now + 60 * 1000;
    await cacheSet(cooldownKey, cooldownExpiry, 60);
    memoryCooldownStore.set(identifier, cooldownExpiry);

    // Store in Redis or Memory with attempts tracker
    const otpData: StoredOtpData = {
      otp,
      expiresAt: now + ttlSeconds * 1000,
      attempts: 0,
    };

    await cacheSet(redisKey, otpData, ttlSeconds);
    memoryOtpStore.set(identifier, otpData);

    const isEmail = identifier.includes('@');

    // 1. Send via Email if it is an email
    if (isEmail) {
      const sent = await mailService.sendOtpEmail(identifier, otp, params.name || 'Valued Customer', params.purpose || 'login');
      if (!sent && mailService.isConfigured) {
        throw new Error('Failed to send verification email. Please verify your email address and try again.');
      }
    }

    // 2. Send via SMS & WhatsApp if it is a phone number
    if (!isEmail || params.phone) {
      const phoneNum = params.phone || identifier;
      await SmsService.sendOtpSms(phoneNum, otp);
      await WhatsappService.sendOtpWhatsapp(phoneNum, otp);
    }

    logger.info(`✅ OTP dispatched successfully to [${identifier}]`);

    return {
      success: true,
      identifier,
    };
  }

  /**
   * Verify provided OTP against storage with brute-force lockout protection (max 5 attempts)
   */
  public static async verifyOtp(rawIdentifier: string, candidateOtp: string): Promise<boolean> {
    const identifier = (rawIdentifier || '').trim().toLowerCase();
    const redisKey = `otp:${identifier}`;
    const now = Date.now();

    // 1. Check Redis first
    const cachedData = await cacheGet<StoredOtpData | string>(redisKey);
    if (cachedData) {
      const actualOtp = typeof cachedData === 'string' ? cachedData : cachedData.otp;
      const currentAttempts = typeof cachedData === 'object' ? cachedData.attempts || 0 : 0;

      if (actualOtp === candidateOtp) {
        await cacheDel(redisKey);
        await cacheDel(`otp_cooldown:${identifier}`);
        memoryOtpStore.delete(identifier);
        memoryCooldownStore.delete(identifier);
        return true;
      } else {
        // Increment attempt counter
        const nextAttempts = currentAttempts + 1;
        if (nextAttempts >= 5) {
          await cacheDel(redisKey);
          memoryOtpStore.delete(identifier);
          logger.warn(`🚨 Too many failed OTP attempts for [${identifier}]. Invalidating token.`);
          throw new Error('Too many failed verification attempts. This code has expired for security. Please request a new code.');
        } else {
          if (typeof cachedData === 'object') {
            await cacheSet(redisKey, { ...cachedData, attempts: nextAttempts }, 300);
          }
        }
        return false;
      }
    }

    // 2. Check memory store
    const memEntry = memoryOtpStore.get(identifier);
    if (memEntry) {
      if (now > memEntry.expiresAt) {
        memoryOtpStore.delete(identifier);
        return false;
      }
      if (memEntry.otp === candidateOtp) {
        memoryOtpStore.delete(identifier);
        memoryCooldownStore.delete(identifier);
        return true;
      } else {
        memEntry.attempts += 1;
        if (memEntry.attempts >= 5) {
          memoryOtpStore.delete(identifier);
          logger.warn(`🚨 Too many failed OTP attempts for [${identifier}] in memory store.`);
          throw new Error('Too many failed verification attempts. This code has expired for security. Please request a new code.');
        }
      }
    }

    return false;
  }
}

export default OtpService;
