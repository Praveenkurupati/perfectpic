// apps/backend/src/utils/otp.ts
import crypto from 'crypto';
import { OTP_CONFIG } from '../config/constants';

export function generateOTP(length: number = OTP_CONFIG.LENGTH): string {
  // Cryptographically secure random 6-digit number between 100000 and 999999
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  const num = crypto.randomInt(min, max + 1);
  return num.toString();
}
