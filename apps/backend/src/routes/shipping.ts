import { Router } from "express";
import { authenticate } from "../middleware/auth";

const router = Router();

router.post("/calculate", authenticate, async (req, res) => {
  res.json({ cost: 150, currency: "INR" });
});

router.post("/create-label", authenticate, async (req, res) => {
  // Add admin check here
  res.json({ labelUrl: "https://example.com/label.pdf", trackingId: "trk_456" });
});

router.get("/track/:trackingId", authenticate, async (req, res) => {
  res.json({ status: "Out for delivery", location: "Bangalore" });
});

router.post("/pincode-lookup", async (req, res) => {
  const { pincode } = req.body;
  res.json({ city: "Bangalore", state: "Karnataka", isServiceable: true });
});

export default router;
