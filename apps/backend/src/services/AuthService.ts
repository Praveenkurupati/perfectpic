// apps/backend/src/services/AuthService.ts
import bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories/UserRepository';
import { signToken } from '../utils/jwt';
import { ApiError } from '../utils/apiError';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export class AuthService {
  public static async login(credentials: {
    email?: string;
    identifier?: string;
    phone?: string;
    password?: string;
  }) {
    const rawTarget = credentials.email || credentials.identifier || credentials.phone || '';
    const input = typeof rawTarget === 'string' ? rawTarget.trim() : '';
    const password = typeof credentials.password === 'string' ? credentials.password : '';

    if (!input) {
      throw ApiError.badRequest('Email, username, or phone number is required.');
    }
    if (!password) {
      throw ApiError.badRequest('Password is required.');
    }

    const user = await UserRepository.findByIdentifier(input);

    if (!user) {
      throw ApiError.unauthorized('Invalid credentials. Account not found.');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password.');
    }

    const token = signToken({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
      },
    };
  }

  public static async adminLogin(credentials: { email?: string; identifier?: string; password?: string }) {
    const rawTarget = credentials.email || credentials.identifier || '';
    const input = typeof rawTarget === 'string' ? rawTarget.trim().toLowerCase() : '';
    const password = typeof credentials.password === 'string' ? credentials.password : '';

    if (!input || !password) {
      throw ApiError.badRequest('Admin email and password are required.');
    }

    let user = await UserRepository.findByIdentifier(input);

    if (user) {
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        throw ApiError.unauthorized('Invalid email or password.');
      }
      if (user.role !== 'admin') {
        throw ApiError.forbidden('Access denied. Administrator privileges required.');
      }

      const token = signToken({
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: 'admin',
      });

      return {
        token,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: 'admin',
          mustChangePassword: Boolean(user.mustChangePassword),
        },
      };
    }

    // Bootstrap fallback when administrator account has not yet been provisioned in database
    const adminEmail = (env.ADMIN_EMAIL || 'admin@perfectpic.in').toLowerCase().trim();
    const isBootstrapMatch = (input === adminEmail || input === 'admin') && 
      Boolean(env.ADMIN_BOOTSTRAP_PASSWORD && password === env.ADMIN_BOOTSTRAP_PASSWORD);

    if (isBootstrapMatch) {
      try {
        const hashedPassword = await bcrypt.hash(password, 12);
        const created = await UserRepository.create({
          name: 'PerfectPic Administrator',
          email: adminEmail,
          phone: '+919999900000',
          password: hashedPassword,
          role: 'admin',
          mustChangePassword: true,
        });

        if (created && created._id) {
          const token = signToken({
            id: created._id.toString(),
            email: created.email,
            name: created.name,
            role: 'admin',
          });
          return {
            token,
            user: {
              id: created._id.toString(),
              name: created.name,
              email: created.email,
              role: 'admin',
              mustChangePassword: true,
            },
          };
        }
      } catch (_) {}

      const token = signToken({ id: 'admin_bootstrap', email: adminEmail, name: 'PerfectPic Administrator', role: 'admin' });
      return {
        token,
        user: { id: 'admin_bootstrap', name: 'PerfectPic Administrator', email: adminEmail, role: 'admin', mustChangePassword: true },
      };
    }

    throw ApiError.unauthorized('Invalid email or password.');
  }

  public static async changePassword(userId: string, currentPass: string, newPass: string) {
    if (!newPass || newPass.length < 8) {
      throw ApiError.badRequest('New password must be at least 8 characters long.');
    }
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound('User account not found.');
    }
    const isMatch = await user.comparePassword(currentPass);
    if (!isMatch) {
      throw ApiError.badRequest('Current password is incorrect.');
    }
    user.password = await bcrypt.hash(newPass, 12);
    user.mustChangePassword = false;
    await user.save();
    return { success: true, message: 'Password updated successfully.' };
  }

  public static async signup(data: { name: string; email: string; phone?: string; password?: string }) {
    const { name, email, phone, password } = data;

    if (!name || !email || !password) {
      throw ApiError.badRequest('Full name, email, and password are required.');
    }

    const existing = await UserRepository.findByEmail(email);
    if (existing) {
      throw ApiError.conflict('An account with this email address already exists.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await UserRepository.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone ? phone.trim() : '',
      password: hashedPassword,
      role: 'user',
    });

    const token = signToken({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: 'user',
    });

    return {
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: 'user',
      },
    };
  }

  public static async getMe(userId: string) {
    const user = await UserRepository.findById(userId);
    if (user) {
      return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
      };
    }
    throw ApiError.unauthorized('User session invalid or user not found.');
  }
}

export default AuthService;
