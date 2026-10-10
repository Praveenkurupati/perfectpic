// apps/backend/src/controllers/AuthController.ts
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { AuthService } from '../services/AuthService';
import { OtpService } from '../services/OtpService';
import { OAuthService } from '../services/OAuthService';
import { UserRepository } from '../repositories/UserRepository';
import { env } from '../config/env';
import { signToken } from '../utils/jwt';
import { ApiResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';
import { logger } from '../utils/logger';

export class AuthController {
  public static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.login(req.body);
      // Support both backward-compatible and standard response
      return res.status(200).json({
        token: result.token,
        user: result.user,
        message: 'Login successful',
      });
    } catch (err) {
      next(err);
    }
  }

  public static async adminLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.adminLogin(req.body);
      return res.status(200).json({
        token: result.token,
        user: result.user,
        message: 'Admin authentication successful',
      });
    } catch (err) {
      next(err);
    }
  }

  public static async signup(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, phone, password, otp } = req.body;
      const normalizedEmail = (email || '').trim().toLowerCase();

      if (!name || !normalizedEmail) {
        throw ApiError.badRequest('Full name and email address are required.');
      }

      // Check if user already exists
      const existing = await UserRepository.findByEmail(normalizedEmail);
      if (existing) {
        throw ApiError.conflict('An account with this email address already exists. Please sign in instead.');
      }

      // 1. If OTP is provided, verify against 'signup' purpose and complete registration
      if (otp) {
        const isValid = await OtpService.verifyOtp(normalizedEmail, otp.trim(), 'signup');
        if (!isValid) {
          throw ApiError.badRequest('Invalid or expired verification code.');
        }

        const result = await AuthService.signup({
          name: name.trim(),
          email: normalizedEmail,
          phone: phone ? phone.trim() : '',
          password: password ? password.trim() : 'otp_verified_user',
        });

        return res.status(201).json({
          token: result.token,
          user: result.user,
          message: 'Account verified and created successfully!',
        });
      }

      // 2. If OTP is not provided, send OTP to email to verify before account creation
      const result = await OtpService.requestOtp({
        email: normalizedEmail,
        identifier: normalizedEmail,
        name: name.trim(),
        purpose: 'signup',
        ipAddress: req.ip || '',
        userAgent: req.get('user-agent') || '',
        metadata: {
          phone: phone || '',
        },
      });

      return res.status(200).json({
        otpRequired: true,
        message: `A verification code has been sent to ${normalizedEmail}. Please enter the OTP to complete registration.`,
        identifier: normalizedEmail,
        devOtp: result.devOtp,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async sendOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { phone, email, identifier, name, purpose, channel } = req.body;
      const rawTarget = email || phone || identifier;
      const target = (rawTarget || '').trim().toLowerCase();

      if (!target) {
        throw ApiError.badRequest('Please provide an email address or phone number.');
      }

      // If purpose is signup, verify the email is not already registered
      if (purpose === 'signup' && target.includes('@')) {
        const existing = await UserRepository.findByEmail(target);
        if (existing) {
          throw ApiError.conflict('An account with this email address already exists. Please log in instead.');
        }
      }

      const otpPurpose = purpose || (target.includes('@') ? 'login' : 'verification');

      const result = await OtpService.requestOtp({
        email: target.includes('@') ? target : email,
        phone: !target.includes('@') ? target : phone,
        identifier: target,
        name,
        channel,
        purpose: otpPurpose,
        ipAddress: req.ip || '',
        userAgent: req.get('user-agent') || '',
      });

      return res.status(200).json({
        success: true,
        message: `A verification code has been sent to ${target}. Please check your inbox.`,
        identifier: result.identifier,
        purpose: result.purpose,
        devOtp: result.devOtp,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { phone, email, identifier, otp, name, password, purpose } = req.body;
      const target = (email || phone || identifier || '').trim().toLowerCase();

      if (!target || !otp) {
        throw ApiError.badRequest('Identifier and verification OTP are required.');
      }

      const otpPurpose = purpose || 'login';
      let isValid = await OtpService.verifyOtp(target, otp.trim(), otpPurpose);

      // Fallback: If verifying without purpose specified, check signup purpose as well
      if (!isValid && !purpose) {
        isValid = await OtpService.verifyOtp(target, otp.trim(), 'signup');
      }

      if (!isValid) {
        throw ApiError.badRequest('Invalid or expired verification code.');
      }

      // Check if user exists in DB
      let user = await UserRepository.findByIdentifier(target);
      const isEmail = target.includes('@');

      if (!user) {
        // Auto-provision user account on successful first OTP verification
        const displayName = name ? name.trim() : (isEmail ? target.split('@')[0] : 'Customer');
        user = await UserRepository.create({
          name: displayName,
          email: isEmail ? target : `${target}@perfectpic.in`,
          phone: !isEmail ? target : (phone ? phone.trim() : ''),
          password: password ? await bcrypt.hash(password, 10) : 'otp_authenticated_user',
          role: 'user',
        });
      } else if (name && (!user.name || user.name === 'Customer')) {
        user.name = name.trim();
        await user.save().catch(() => {});
      }

      if (!user) {
        throw ApiError.internal('Unable to provision user account.');
      }

      const anyUser = user as any;
      const userId: string = anyUser._id ? anyUser._id.toString() : (anyUser.id || 'usr_generated');
      const userRole: 'admin' | 'user' = anyUser.role === 'admin' ? 'admin' : 'user';

      const token = signToken({
        id: userId,
        email: anyUser.email || target,
        phone: anyUser.phone || '',
        name: anyUser.name || 'Customer',
        role: userRole,
      });

      return res.status(200).json({
        token,
        user: {
          id: userId,
          name: anyUser.name,
          email: anyUser.email,
          phone: anyUser.phone,
          role: userRole,
        },
        message: 'Verification successful',
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'guest';
      const user = await AuthService.getMe(userId);
      return res.status(200).json({ user });
    } catch (err) {
      next(err);
    }
  }

  public static async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const { users, total } = await UserRepository.findAll(50, 0);
      return res.status(200).json({ users, total });
    } catch (err) {
      next(err);
    }
  }

  public static async getOAuthConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const config = OAuthService.getOAuthConfig();
      return res.status(200).json(config);
    } catch (err) {
      next(err);
    }
  }

  private static getCallbackUrl(req: Request, provider: 'google' | 'apple'): string {
    const envCallback = provider === 'google' ? env.GOOGLE_CALLBACK_URL : env.APPLE_CALLBACK_URL;
    // When defined in environment (.env), ALWAYS use the authoritative configured callback URL
    if (envCallback && envCallback.trim().length > 0) {
      return envCallback.trim();
    }

    const rawHost = req.get('x-forwarded-host') || req.get('host') || '';
    const rawProto = req.get('x-forwarded-proto') || (req.secure ? 'https' : 'http');
    const host = (rawHost.split(',')[0] || '').trim();
    const proto = (rawProto.split(',')[0] || 'http').trim();
    if (host) {
      return `${proto}://${host}/api/v1/auth/${provider}/callback`;
    }

    return `http://localhost:4000/api/v1/auth/${provider}/callback`;
  }

  public static async googleInit(req: Request, res: Response, next: NextFunction) {
    try {
      const redirect = (req.query.redirect as string) || '/';
      const callbackUrl = AuthController.getCallbackUrl(req, 'google');
      logger.info(`[OAuth] Initiating Google login. Client ID: ${env.GOOGLE_CLIENT_ID?.slice(0, 16)}..., Callback: ${callbackUrl}`);
      const authUrl = OAuthService.getGoogleAuthUrl(redirect, callbackUrl);
      return res.redirect(authUrl);
    } catch (err) {
      next(err);
    }
  }

  private static getFrontendUrl(req: Request): string {
    if (env.FRONTEND_URL && env.FRONTEND_URL.trim().length > 0) {
      return env.FRONTEND_URL.trim().replace(/\/+$/, '');
    }
    const rawHost = req.get('x-forwarded-host') || req.get('host') || '';
    const rawProto = req.get('x-forwarded-proto') || (req.secure ? 'https' : 'http');
    const host = (rawHost.split(',')[0] || '').trim();
    const proto = (rawProto.split(',')[0] || 'http').trim();
    if (host) {
      const hostname = host.split(':')[0] || host;
      const port = host.includes(':') ? host.split(':')[1] : '';
      if (port === '4000') {
        return `${proto}://${hostname}:3000`;
      }
      return `${proto}://${host}`;
    }
    return 'http://localhost:3000';
  }

  private static sanitizeRedirectUrl(rawUrl: string): string {
    if (!rawUrl || typeof rawUrl !== 'string') return '/';
    const trimmed = rawUrl.trim();
    // Allow relative internal paths only (prevent //evil.com or javascript: URIs)
    if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.includes('\\')) {
      return trimmed;
    }
    return '/';
  }

  public static async googleCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const code = (req.query.code as string) || '';
      const state = (req.query.state as string) || '/';
      const redirectUrl = AuthController.sanitizeRedirectUrl(decodeURIComponent(state));
      const callbackUrl = AuthController.getCallbackUrl(req, 'google');

      const result = await OAuthService.handleGoogleCallback(code, redirectUrl, callbackUrl);
      const frontendUrl = AuthController.getFrontendUrl(req);
      const frontendRedirect = `${frontendUrl}/login?oauth_token=${encodeURIComponent(result.token)}&redirect=${encodeURIComponent(redirectUrl)}`;
      return res.redirect(frontendRedirect);
    } catch (err) {
      next(err);
    }
  }

  public static async appleInit(req: Request, res: Response, next: NextFunction) {
    try {
      const rawRedirect = (req.query.redirect as string) || '/';
      const redirect = AuthController.sanitizeRedirectUrl(rawRedirect);
      const callbackUrl = AuthController.getCallbackUrl(req, 'apple');
      const authUrl = OAuthService.getAppleAuthUrl(redirect, callbackUrl);
      return res.redirect(authUrl);
    } catch (err) {
      next(err);
    }
  }

  public static async appleCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const state = (req.body.state as string) || '/';
      const redirectUrl = AuthController.sanitizeRedirectUrl(decodeURIComponent(state));
      const email = req.body.email || 'apple.user@perfectpic.in';
      const name = req.body.user ? `${req.body.user.name?.firstName || ''} ${req.body.user.name?.lastName || ''}`.trim() : 'Apple Customer';

      const result = await OAuthService.authenticateOAuthUser({
        provider: 'apple',
        email,
        name: name || 'Apple Customer',
        providerId: req.body.sub || 'apple_' + Date.now(),
      });

      const frontendUrl = AuthController.getFrontendUrl(req);
      const frontendRedirect = `${frontendUrl}/login?oauth_token=${encodeURIComponent(result.token)}&redirect=${encodeURIComponent(redirectUrl)}`;
      return res.redirect(frontendRedirect);
    } catch (err) {
      next(err);
    }
  }

  public static async oauthLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const { provider, email, name, avatar, providerId, idToken } = req.body;
      if (!provider || !['google', 'apple'].includes(provider)) {
        throw ApiError.badRequest('Supported OAuth providers are "google" and "apple".');
      }

      const result = await OAuthService.authenticateOAuthUser({
        provider,
        email,
        name,
        avatar,
        providerId,
        idToken,
      });

      return res.status(200).json({
        token: result.token,
        user: result.user,
        isNewUser: result.isNewUser,
        message: `${provider === 'google' ? 'Google' : 'Apple'} authentication successful`,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async logout(req: Request, res: Response) {
    return res.status(200).json({ message: 'Logged out successfully' });
  }
}

export default AuthController;
