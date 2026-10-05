import { Router } from "express";
import bcrypt from "bcryptjs";
import { authenticate } from "../middleware/auth";
import { generateOTP } from "../lib/otp";
import { signToken } from "../lib/jwt";
import { User } from "../db/models/User";
import { isDbConnected } from "../db/connection";

import { OtpService } from "../services/OtpService";

const router = Router();

// POST /api/auth/login - Universal Login (Email, Username, or Phone + Password)
router.post("/login", async (req, res) => {
  const { email, identifier, phone, password } = req.body;
  const input = (email || identifier || phone || "").trim();

  if (!input) {
    return res.status(400).json({ error: "Email, username, or phone number is required" });
  }

  if (!password) {
    return res.status(400).json({ error: "Password is required" });
  }

  try {
    if (isDbConnected()) {
      // Build flexible search condition (exact email, user prefix like "user1", or phone)
      let queryConditions: any[] = [
        { email: input.toLowerCase() },
        { phone: input }
      ];

      // If user typed "user1" or "admin", map to default domain
      if (!input.includes("@")) {
        queryConditions.push({ email: `${input.toLowerCase()}@perfectpic.in` });
      } else {
        // Also support user1@example.com mapping to user1@perfectpic.in if needed
        const usernamePart = input.split("@")[0]?.toLowerCase();
        if (usernamePart) {
          queryConditions.push({ email: `${usernamePart}@perfectpic.in` });
        }
      }

      const user = await User.findOne({ $or: queryConditions });

      if (!user) {
        return res.status(401).json({ error: "Invalid credentials. User not found." });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ error: "Invalid email or password." });
      }

      const token = signToken({
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role
      });

      return res.json({
        token,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          avatar: user.avatar
        }
      });
    }
  } catch (error: any) {
    console.error("Login DB error:", error);
    return res.status(500).json({ error: "Internal authentication error" });
  }

  // Fallback if DB is disconnected (e.g. dev mock)
  const isMockAdmin = input.toLowerCase().includes("admin");
  const token = signToken({ id: "mock_user_1", email: input, role: isMockAdmin ? "admin" : "user" });
  res.json({
    token,
    user: {
      id: "mock_user_1",
      name: isMockAdmin ? "Admin PerfectPic" : "Test User",
      email: input,
      role: isMockAdmin ? "admin" : "user"
    }
  });
});

// POST /api/auth/admin/login - Dedicated Admin Portal Login
router.post("/admin/login", async (req, res) => {
  const { email, password } = req.body;
  const input = (email || "").trim().toLowerCase();

  if (!input || !password) {
    return res.status(400).json({ error: "Admin email and password are required" });
  }

  try {
    if (isDbConnected()) {
      const user = await User.findOne({
        $or: [
          { email: input },
          { email: `${input.replace(/@.*/, '')}@perfectpic.in` }
        ]
      });

      if (!user) {
        return res.status(401).json({ error: "Admin account not found." });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ error: "Invalid password." });
      }

      if (user.role !== "admin") {
        return res.status(403).json({ error: "Access denied. Admin credentials required." });
      }

      const token = signToken({
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: "admin"
      });

      return res.json({
        token,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: "admin"
        }
      });
    }
  } catch (error: any) {
    console.error("Admin login error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }

  // Mock fallback
  if (input.includes("admin") && password === "password123") {
    const token = signToken({ id: "admin_1", email: input, role: "admin" });
    return res.json({ token, user: { id: "admin_1", name: "Admin PerfectPic", email: input, role: "admin" } });
  }

  res.status(401).json({ error: "Invalid admin credentials" });
});

// POST /api/auth/signup - Customer Registration
router.post("/signup", async (req, res) => {
  const { name, email, phone, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email, and password are required" });
  }

  try {
    if (isDbConnected()) {
      const existing = await User.findOne({ email: email.toLowerCase().trim() });
      if (existing) {
        return res.status(409).json({ error: "An account with this email already exists." });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone ? phone.trim() : "",
        password: hashedPassword,
        role: "user"
      });

      const token = signToken({
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: "user"
      });

      return res.status(201).json({
        token,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: "user"
        }
      });
    }
  } catch (error: any) {
    console.error("Signup error:", error);
    return res.status(500).json({ error: "Could not create user account" });
  }

  // Mock fallback
  const mockId = "user_" + Date.now();
  const token = signToken({ id: mockId, email, name, role: "user" });
  res.status(201).json({ token, user: { id: mockId, name, email, role: "user" } });
});

// GET /api/auth/me - Current User Info
router.get("/me", authenticate, async (req, res) => {
  try {
    if (isDbConnected() && req.user?.id) {
      const user = await User.findById(req.user.id).select("-password");
      if (user) {
        return res.json({ user });
      }
    }
  } catch (err) {
    console.error("Get user error:", err);
  }

  res.json({
    user: {
      id: req.user?.id || "guest",
      email: (req.user as any)?.email || "customer@perfectpic.in",
      name: (req.user as any)?.name || "Customer",
      role: req.user?.role || "user"
    }
  });
});

// GET /api/auth/users - List Users (For Admin Panel or Dev Testing)
router.get("/users", async (req, res) => {
  try {
    if (isDbConnected()) {
      const users = await User.find({}).select("-password").sort({ createdAt: 1 }).limit(50);
      return res.json({ users, total: users.length });
    }
  } catch (err) {
    console.error("List users error:", err);
  }
  res.json({ users: [], total: 0 });
});

// OTP routes for backward compatibility
router.post("/send-otp", async (req, res) => {
  const { phone, email, identifier, name, purpose } = req.body;
  const target = email || phone || identifier;
  if (!target) {
    return res.status(400).json({ error: "Email or phone number is required" });
  }

  try {
    const result = await OtpService.requestOtp({
      email: target.includes("@") ? target : email,
      phone: !target.includes("@") ? target : phone,
      identifier: target,
      name,
      purpose: purpose || (target.includes("@") ? "login" : "verification"),
      ipAddress: req.ip || "",
      userAgent: req.get("user-agent") || "",
    });

    res.json({ message: "OTP sent successfully", identifier: result.identifier, devOtp: result.devOtp });
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to send OTP" });
  }
});

router.post("/verify-otp", async (req, res) => {
  const { phone, email, identifier, otp, purpose } = req.body;
  const target = (email || phone || identifier || "").trim();

  if (!target || !otp) {
    return res.status(400).json({ error: "Identifier and OTP are required" });
  }

  try {
    const isValid = await OtpService.verifyOtp(target, otp.trim(), purpose || "login");
    if (!isValid) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    let user: any = null;
    if (isDbConnected()) {
      user = await User.findOne({
        $or: [{ email: target.toLowerCase() }, { phone: target }],
      });
    }

    const userId = user ? user._id.toString() : "user_" + Math.random().toString(36).substring(7);
    const token = signToken({
      id: userId,
      email: user?.email || target,
      phone: user?.phone || (target.includes("@") ? "" : target),
      role: user?.role || "user",
    });

    res.json({
      token,
      user: {
        id: userId,
        phone: user?.phone || (target.includes("@") ? "" : target),
        name: user?.name || "Customer",
        email: user?.email || (target.includes("@") ? target : `${target}@perfectpic.in`),
        role: user?.role || "user",
      },
      message: "Verification successful",
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Invalid or expired verification code" });
  }
});

router.post("/logout", authenticate, async (req, res) => {
  res.json({ message: "Logged out successfully" });
});

export default router;
