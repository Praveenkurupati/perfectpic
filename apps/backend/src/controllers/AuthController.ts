// apps/backend/src/controllers/AuthController.ts
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { OtpService } from '../services/OtpService';
import { UserRepository } from '../repositories/UserRepository';
import { signToken } from '../utils/jwt';
import { ApiResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';

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
      const result = await AuthService.signup(req.body);
      return res.status(201).json({
        token: result.token,
        user: result.user,
        message: 'Registration successful',
      });
    } catch (err) {
      next(err);
    }
  }

  public static async sendOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { phone, email, identifier, name } = req.body;
      const target = email || phone || identifier;

      if (!target) {
        throw ApiError.badRequest('Please provide an email address or phone number.');
      }

      const result = await OtpService.requestOtp({ email, phone, identifier: target, name });
      return res.status(200).json({
        message: 'OTP sent successfully',
        identifier: result.identifier,
        devOtp: result.devOtp,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { phone, email, identifier, otp } = req.body;
      const target = (email || phone || identifier || '').trim();

      if (!target || !otp) {
        throw ApiError.badRequest('Identifier and verification OTP are required.');
      }

      const isValid = await OtpService.verifyOtp(target, otp.trim());
      if (!isValid) {
        throw ApiError.badRequest('Invalid or expired verification code.');
      }

      // Check if user exists in DB
      let user = await UserRepository.findByIdentifier(target);
      const isEmail = target.includes('@');

      if (!user) {
        // Auto-provision user account on successful first OTP verification
        user = await UserRepository.create({
          name: isEmail ? target.split('@')[0] : 'Customer',
          email: isEmail ? target : `${target}@perfectpic.in`,
          phone: !isEmail ? target : '',
          password: 'otp_authenticated_user',
          role: 'user',
        });
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

  public static async logout(req: Request, res: Response) {
    return res.status(200).json({ message: 'Logged out successfully' });
  }
}

export default AuthController;
