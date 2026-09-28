// apps/backend/src/routes/v1/auth.routes.ts
import { Router } from 'express';
import { AuthController } from '../../controllers/AuthController';
import { authenticate } from '../../middlewares/auth.middleware';

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

// Current User Profile
router.get('/me', authenticate, AuthController.getMe);

// List Users
router.get('/users', AuthController.getUsers);

// Logout
router.post('/logout', authenticate, AuthController.logout);

export default router;
