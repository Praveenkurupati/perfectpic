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
  
  // Mail / SMTP
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_FROM: process.env.SMTP_FROM || 'PerfectPic Security <no-reply@perfectpic.in>',
  
  // Razorpay
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || '',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',

  // AWS S3
  AWS_REGION: process.env.AWS_REGION || 'ap-south-1',
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
  S3_BUCKET: process.env.S3_BUCKET || 'perfectpic-assets-production',
  
  isDev: process.env.NODE_ENV !== 'production',
  isProd: process.env.NODE_ENV === 'production',
};

export default env;
