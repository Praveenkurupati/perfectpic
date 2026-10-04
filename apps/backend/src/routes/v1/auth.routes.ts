import { Router } from 'express';
import { AuthController } from '../../controllers/AuthController';
import { authenticate, adminOnly } from '../../middlewares/auth.middleware';
import { authRateLimiter } from '../../middlewares/rateLimiter';

const router = Router();

// Universal login (Email, Username, or Phone + Password) with brute-force rate limiter
router.post('/login', authRateLimiter, AuthController.login);

// Dedicated Admin Portal Login with brute-force rate limiter
router.post('/admin/login', authRateLimiter, AuthController.adminLogin);

// Customer Registration
router.post('/signup', authRateLimiter, AuthController.signup);

// Send OTP (supports email, phone, or identifier)
router.post('/send-otp', authRateLimiter, AuthController.sendOtp);

// Verify OTP
router.post('/verify-otp', authRateLimiter, AuthController.verifyOtp);

// OAuth 2.0 (Google & Apple)
router.get('/oauth/config', AuthController.getOAuthConfig);
router.get('/google', AuthController.googleInit);
router.get('/google/callback', AuthController.googleCallback);
router.get('/apple', AuthController.appleInit);
router.post('/apple/callback', AuthController.appleCallback);
router.post('/oauth/login', AuthController.oauthLogin);

// Current User Profile
router.get('/me', authenticate, AuthController.getMe);

// List Users (Admin only)
router.get('/users', authenticate, adminOnly, AuthController.getUsers);

// Logout
router.post('/logout', authenticate, AuthController.logout);

export default router;
