import { Router } from "express";
import { authenticate } from "../middleware/auth";

const router = Router();

router.post("/", authenticate, async (req, res) => {
  res.status(201).json({ id: "proj_123", status: "draft" });
});

router.get("/", authenticate, async (req, res) => {
  res.json({ projects: [] });
});

router.get("/:id", authenticate, async (req, res) => {
  res.json({ id: req.params.id, pages: [] });
});

router.put("/:id", authenticate, async (req, res) => {
  res.json({ message: "Project updated" });
});

router.put("/:id/pages", authenticate, async (req, res) => {
  res.json({ message: "Pages saved" });
});

router.delete("/:id", authenticate, async (req, res) => {
  res.json({ message: "Project deleted" });
});

export default router;
