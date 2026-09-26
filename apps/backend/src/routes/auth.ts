import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { generateOTP, verifyOTP } from "../lib/otp";
import { signToken } from "../lib/jwt";

const router = Router();

// Mock store for OTPs
const otpStore = new Map<string, string>();

router.post("/send-otp", async (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    res.status(400).json({ error: "Phone number is required" });
    return;
  }
  
  const otp = generateOTP();
  otpStore.set(phone, otp);
  
  // In production, send SMS via provider
  console.log(`[MOCK SMS] OTP for ${phone} is ${otp}`);
  
  res.json({ message: "OTP sent successfully" });
});

router.post("/verify-otp", async (req, res) => {
  const { phone, otp } = req.body;
  
  const storedOtp = otpStore.get(phone);
  if (!storedOtp || storedOtp !== otp) {
    res.status(400).json({ error: "Invalid or expired OTP" });
    return;
  }
  
  otpStore.delete(phone);
  
  // Mock user finding/creation
  const userId = "user_" + Math.random().toString(36).substring(7);
  const token = signToken({ id: userId });
  
  res.json({ token, user: { id: userId, phone } });
});

router.get("/me", authenticate, async (req, res) => {
  // Mock fetching user
  res.json({ user: { id: req.user?.id, name: "Test User" } });
});

router.post("/logout", authenticate, async (req, res) => {
  // Client handles token deletion
  res.json({ message: "Logged out successfully" });
});

export default router;
