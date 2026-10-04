// apps/backend/src/services/OtpService.ts
import { generateOTP } from '../utils/otp';
import { mailService } from './MailService';
import { SmsService } from './SmsService';
import { WhatsappService } from './WhatsappService';
import { cacheGet, cacheSet, cacheDel } from '../cache/redis';
import { logger } from '../utils/logger';
import { OTP_CONFIG } from '../config/constants';

const memoryOtpStore = new Map<string, { otp: string; expiresAt: number }>();

export class OtpService {
  /**
   * Request & send OTP to email, phone, or both
   */
  public static async requestOtp(params: {
    email?: string;
    phone?: string;
    identifier?: string;
    name?: string;
  }): Promise<{ success: boolean; identifier: string; devOtp?: string }> {
    const rawTarget = params.email || params.phone || params.identifier || '';
    const identifier = rawTarget.trim().toLowerCase();

    if (!identifier) {
      throw new Error('Please provide an email address or phone number to receive an OTP.');
    }

    const otp = generateOTP(OTP_CONFIG.LENGTH);
    const ttlSeconds = OTP_CONFIG.EXPIRY_MINUTES * 60;
    const redisKey = `otp:${identifier}`;

    // Store in Redis or Memory
    await cacheSet(redisKey, otp, ttlSeconds);
    memoryOtpStore.set(identifier, {
      otp,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });

    const isEmail = identifier.includes('@');

    // 1. Send via Email if it is an email
    if (isEmail) {
      const sent = await mailService.sendOtpEmail(identifier, otp, params.name || 'Valued Customer');
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
   * Verify provided OTP against storage
   */
  public static async verifyOtp(rawIdentifier: string, candidateOtp: string): Promise<boolean> {
    const identifier = (rawIdentifier || '').trim().toLowerCase();
    const redisKey = `otp:${identifier}`;

    // 1. Check Redis first
    const cachedOtp = await cacheGet<string>(redisKey);
    if (cachedOtp) {
      if (cachedOtp === candidateOtp) {
        await cacheDel(redisKey);
        memoryOtpStore.delete(identifier);
        return true;
      }
      return false;
    }

    // 2. Check memory store
    const memEntry = memoryOtpStore.get(identifier);
    if (memEntry) {
      if (Date.now() > memEntry.expiresAt) {
        memoryOtpStore.delete(identifier);
        return false;
      }
      if (memEntry.otp === candidateOtp) {
        memoryOtpStore.delete(identifier);
        return true;
      }
    }

    return false;
  }
}

export default OtpService;
