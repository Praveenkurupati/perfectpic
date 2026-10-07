// apps/backend/src/middlewares/csrf.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError';

/**
 * Enterprise CSRF & Cross-Site Request Defense Middleware (SEC-03)
 * 
 * PerfectPic utilizes JWT Bearer tokens for authenticated requests.
 * Modern browsers do not ambiently attach Authorization headers across origins.
 * To eliminate cross-site request forgery via form actions or malicious embedded links,
 * this middleware ensures all state-changing mutation requests (POST/PUT/PATCH/DELETE)
 * originate from authorized client environments or supply anti-CSRF custom headers.
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  // Safe read-only methods do not mutate state
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }

  // Exempt cryptographically signed webhooks (e.g. Razorpay webhook verified by HMAC)
  if (req.path.includes('/payments/webhook')) {
    return next();
  }

  // 1. Authorization header present (Bearer JWT) -> immune to ambient cookie CSRF
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return next();
  }

  // 2. Custom header verification (X-Requested-With, X-Correlation-ID, or application/json Content-Type)
  // Cross-origin HTML forms cannot send custom headers or application/json without triggering a CORS preflight
  const hasCustomHeader = Boolean(
    req.headers['x-requested-with'] ||
    req.headers['x-correlation-id'] ||
    req.headers['x-csrf-token']
  );

  const contentType = req.headers['content-type'] || '';
  const isJsonOrMultipart = contentType.includes('application/json') || contentType.includes('multipart/form-data');

  if (hasCustomHeader || isJsonOrMultipart) {
    return next();
  }

  // 3. Origin / Referer validation for standard browser requests
  const origin = req.headers.origin || req.headers.referer;
  if (origin) {
    const isAllowedHost =
      origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      origin.includes('perfectpic.in') ||
      origin.includes('vercel.app');

    if (isAllowedHost) {
      return next();
    }
  }

  // Block malicious cross-origin form submission
  return next(ApiError.forbidden('CSRF protection: Untrusted mutation request blocked.'));
}

export default csrfProtection;
