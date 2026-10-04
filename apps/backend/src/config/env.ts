// apps/backend/src/config/env.ts
import 'dotenv/config';

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '4000', 10),
  
  // Database & Cache
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/perfectpic',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'perfectpic_jwt_super_secret_production_key_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  
  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  
  // Mail / SMTP (Zoho SMTP default: smtppro.zoho.in:465)
  SMTP_HOST: process.env.SMTP_HOST || 'smtppro.zoho.in',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '465', 10),
  SMTP_USER: process.env.SMTP_USER || 'noreply@perfectpic.in',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_SECURE: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : true,
  SMTP_FROM: process.env.SMTP_FROM || (process.env.SMTP_USER ? `"PerfectPic Security" <${process.env.SMTP_USER}>` : 'PerfectPic Security <noreply@perfectpic.in>'),
  
  // Razorpay
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || '',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',

  // AWS S3
  AWS_REGION: process.env.AWS_REGION || 'ap-south-1',
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY || '',
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_KEY || '',
  S3_BUCKET: process.env.S3_BUCKET || process.env.AWS_BUCKET || 'perfectpic-assets-2026',

  // Frontend and Admin URLs
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  ADMIN_URL: process.env.ADMIN_URL || 'http://localhost:3001',

  // OAuth 2.0 (Google & Apple)
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:4000/api/v1/auth/google/callback',
  APPLE_CLIENT_ID: process.env.APPLE_CLIENT_ID || '',
  APPLE_TEAM_ID: process.env.APPLE_TEAM_ID || '',
  APPLE_KEY_ID: process.env.APPLE_KEY_ID || '',
  APPLE_PRIVATE_KEY: process.env.APPLE_PRIVATE_KEY || '',
  APPLE_CALLBACK_URL: process.env.APPLE_CALLBACK_URL || 'http://localhost:4000/api/v1/auth/apple/callback',
  
  isDev: process.env.NODE_ENV !== 'production',
  isProd: process.env.NODE_ENV === 'production',
};

export default env;
