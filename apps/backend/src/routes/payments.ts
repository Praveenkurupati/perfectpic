import { Router } from "express";
import { authenticate } from "../middleware/auth";
import razorpay from "../lib/razorpay";
import crypto from "crypto";

const router = Router();

router.post("/create-order", authenticate, async (req, res, next) => {
  try {
    const { amount } = req.body;
    const options = {
      amount: amount * 100, // amount in smallest currency unit (paise)
      currency: "INR",
      receipt: "rcpt_" + Date.now()
    };
    
    if (process.env.RAZORPAY_KEY_ID) {
      const order = await razorpay.orders.create(options);
      res.json(order);
    } else {
      res.json({ id: "mock_order_id", amount: options.amount, currency: "INR" });
    }
  } catch (err) {
    next(err);
  }
});

router.post("/verify", authenticate, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  
  if (process.env.RAZORPAY_KEY_SECRET) {
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      res.json({ success: true, message: "Payment verified successfully" });
    } else {
      res.status(400).json({ success: false, message: "Invalid signature" });
    }
  } else {
    // Mock success
    res.json({ success: true, message: "Mock verification successful" });
  }
});

router.post("/webhook", async (req, res) => {
  // Handle webhook logic
  res.status(200).send("OK");
});

router.post("/apply-promo", authenticate, async (req, res) => {
  res.json({ discount: 0, finalAmount: req.body.amount });
});

export default router;
