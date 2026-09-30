import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { generatePresignedUrl, deleteFromS3 } from "../lib/s3";

const router = Router();

router.post("/presign", authenticate, async (req, res, next) => {
  try {
    const { filename, contentType } = req.body;
    if (!filename || !contentType) {
      res.status(400).json({ error: "Filename and contentType are required" });
      return;
    }
    
    // Generate unique key
    const key = `uploads/${req.user?.id || 'guest'}/${Date.now()}-${filename}`;
    const url = await generatePresignedUrl(key, contentType);
    
    res.json({ url, key });
  } catch (err) {
    next(err);
  }
});

router.post("/complete", authenticate, async (req, res) => {
  // Save photo metadata to DB
  res.json({ message: "Upload marked as complete", photoId: "photo_123" });
});

router.delete("/:photoId", authenticate, async (req, res) => {
  // Delete from S3
  const rawId = req.params.photoId;
  const photoId = Array.isArray(rawId) ? rawId[0] : rawId;
  if (photoId && typeof photoId === 'string') {
    await deleteFromS3(photoId);
  }
  res.json({ message: "Photo deleted successfully" });
});

export default router;
