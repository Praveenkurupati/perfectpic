// apps/backend/src/services/OAuthService.ts
import { env } from '../config/env';
import { UserRepository } from '../repositories/UserRepository';
import { signToken } from '../utils/jwt';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/apiError';

export interface OAuthUserData {
  provider: 'google' | 'apple';
  email: string;
  name?: string;
  avatar?: string;
  providerId?: string;
  idToken?: string;
}

export class OAuthService {
  /**
   * Generates official Google OAuth 2.0 consent URL
   */
  public static getGoogleAuthUrl(redirectPath: string = '/'): string {
    const clientId = env.GOOGLE_CLIENT_ID;
    const callbackUrl = env.GOOGLE_CALLBACK_URL;
    const state = encodeURIComponent(redirectPath);

    const isRealKey = clientId && !clientId.includes('your_google_client_id');
    if (!isRealKey) {
      // In dev mode when placeholder keys are present, provide a direct URL for frontend to open picker
      return `${env.FRONTEND_URL}/login?oauth_provider=google&redirect=${state}&mode=dev`;
    }

    const scope = encodeURIComponent('openid email profile');
    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&response_type=code&scope=${scope}&state=${state}&access_type=offline&prompt=consent`;
  }

  /**
   * Generates official Apple Sign-In authorization URL
   */
  public static getAppleAuthUrl(redirectPath: string = '/'): string {
    const clientId = env.APPLE_CLIENT_ID;
    const callbackUrl = env.APPLE_CALLBACK_URL;
    const state = encodeURIComponent(redirectPath);

    const isRealKey = clientId && !clientId.includes('com.perfectpic');
    if (!isRealKey) {
      return `${env.FRONTEND_URL}/login?oauth_provider=apple&redirect=${state}&mode=dev`;
    }

    const scope = encodeURIComponent('name email');
    return `https://appleid.apple.com/auth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&response_type=code%20id_token&scope=${scope}&state=${state}&response_mode=form_post`;
  }

  /**
   * Handles Google callback code exchange
   */
  public static async handleGoogleCallback(code: string, redirectUrl: string = '/'): Promise<{ token: string; user: any; redirectUrl: string }> {
    const clientId = env.GOOGLE_CLIENT_ID;
    const clientSecret = env.GOOGLE_CLIENT_SECRET;
    const callbackUrl = env.GOOGLE_CALLBACK_URL;

    if (!code) {
      throw ApiError.badRequest('Authorization code is missing from Google callback.');
    }

    let email = '';
    let name = '';
    let picture = '';
    let sub = '';

    // If real credentials are set, exchange code with Google OAuth token endpoint
    if (clientId && clientSecret && !clientId.includes('your_google_client_id')) {
      try {
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: callbackUrl,
            grant_type: 'authorization_code',
          }),
        });

        if (!tokenRes.ok) {
          const errData = await tokenRes.json().catch(() => ({}));
          throw new Error(errData.error_description || tokenRes.statusText);
        }

        const tokenData = await tokenRes.json();
        
        // Fetch user info with access token
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });

        if (!userInfoRes.ok) {
          throw new Error('Failed to retrieve Google user profile.');
        }

        const profile = await userInfoRes.json();
        email = profile.email;
        name = profile.name || profile.given_name;
        picture = profile.picture;
        sub = profile.id;
      } catch (err: any) {
        logger.error('Google token exchange error:', err.message);
        throw ApiError.badRequest(`Google authentication error: ${err.message}`);
      }
    } else {
      // Dev mode fallback
      email = 'dev.google.user@perfectpic.in';
      name = 'Google Explorer';
      picture = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop';
      sub = 'goog_dev_' + Date.now();
    }

    const authResult = await this.authenticateOAuthUser({
      provider: 'google',
      email,
      name,
      avatar: picture,
      providerId: sub,
    });

    return {
      token: authResult.token,
      user: authResult.user,
      redirectUrl,
    };
  }

  /**
   * Universal OAuth authentication and account provisioning
   */
  public static async authenticateOAuthUser(data: OAuthUserData): Promise<{ token: string; user: any; isNewUser: boolean }> {
    const email = (data.email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) {
      throw ApiError.badRequest('A valid email address is required for OAuth sign in.');
    }

    let user = await UserRepository.findByEmail(email);
    let isNewUser = false;

    if (!user) {
      // Auto-provision user account
      user = await UserRepository.create({
        name: data.name?.trim() || email.split('@')[0],
        email: email,
        phone: '',
        role: 'user',
        avatar: data.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`,
        provider: data.provider,
        providerId: data.providerId || '',
        password: `oauth_${data.provider}_${Date.now()}`,
      });
      isNewUser = true;
      logger.info(`✨ New OAuth user provisioned via ${data.provider}: ${email}`);
    } else {
      // Update avatar if missing
      if (!user.avatar && data.avatar) {
        user.avatar = data.avatar;
        await user.save();
      }
      logger.info(`🔑 OAuth user signed in via ${data.provider}: ${email}`);
    }

    const anyUser = user as any;
    const userId: string = anyUser._id ? anyUser._id.toString() : (anyUser.id || 'usr_oauth');
    const userRole: 'admin' | 'user' = anyUser.role === 'admin' ? 'admin' : 'user';

    const token = signToken({
      id: userId,
      email: anyUser.email,
      name: anyUser.name,
      role: userRole,
    });

    return {
      token,
      user: {
        id: userId,
        name: anyUser.name,
        email: anyUser.email,
        phone: anyUser.phone,
        role: userRole,
        avatar: anyUser.avatar,
        provider: data.provider,
      },
      isNewUser,
    };
  }

  /**
   * Returns OAuth provider status and public credentials
   */
  public static getOAuthConfig() {
    const isGoogleConfigured = Boolean(env.GOOGLE_CLIENT_ID && !env.GOOGLE_CLIENT_ID.includes('your_google_client_id'));
    const isAppleConfigured = Boolean(env.APPLE_CLIENT_ID && !env.APPLE_CLIENT_ID.includes('com.perfectpic'));

    return {
      google: {
        enabled: isGoogleConfigured,
        clientId: isGoogleConfigured ? env.GOOGLE_CLIENT_ID : null,
        callbackUrl: env.GOOGLE_CALLBACK_URL,
      },
      apple: {
        enabled: isAppleConfigured,
        clientId: isAppleConfigured ? env.APPLE_CLIENT_ID : null,
        callbackUrl: env.APPLE_CALLBACK_URL,
      },
    };
  }
}

export default OAuthService;
