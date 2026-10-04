import { Router } from 'express';
import { AuthController } from '../../controllers/AuthController';
import { authenticate, adminOnly } from '../../middlewares/auth.middleware';

const router = Router();

// Universal login (Email, Username, or Phone + Password)
router.post('/login', AuthController.login);

// Dedicated Admin Portal Login
router.post('/admin/login', AuthController.adminLogin);

// Customer Registration
router.post('/signup', AuthController.signup);

// Send OTP (supports email, phone, or identifier)
router.post('/send-otp', AuthController.sendOtp);

// Verify OTP
router.post('/verify-otp', AuthController.verifyOtp);

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
