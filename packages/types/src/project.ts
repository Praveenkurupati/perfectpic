import { z } from "zod";
import { BookSizeEnum, CoverTypeEnum, ThemeEnum, CoverColorEnum, PackagingEnum } from "./product";

// ─── Photo Schema ───────────────────────────────────────────────────────────

export const PhotoSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  originalUrl: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  compressedUrl: z.string().url().optional(),
  filename: z.string(),
  mimeType: z.enum(["image/jpeg", "image/png", "image/heic", "image/webp"]),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  fileSize: z.number().int().positive(),
  dpi: z.number().optional(),
  isBlurry: z.boolean().default(false),
  isLowRes: z.boolean().default(false),
  isDuplicate: z.boolean().default(false),
  exifData: z.object({
    capturedAt: z.string().datetime().optional(),
    orientation: z.number().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    camera: z.string().optional(),
  }).optional(),
  usageCount: z.number().int().default(0),
  sortOrder: z.number().int().default(0),
  createdAt: z.string().datetime(),
});
export type Photo = z.infer<typeof PhotoSchema>;

// ─── Photo Well (image slot on a page) ──────────────────────────────────────

export const PhotoWellSchema = z.object({
  id: z.string().uuid(),
  photoId: z.string().uuid().nullable(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  rotation: z.number().default(0),
  cropX: z.number().default(0),
  cropY: z.number().default(0),
  cropZoom: z.number().default(1),
  filter: z.enum(["original", "bw", "warm", "vivid", "sepia"]).default("original"),
  borderRadius: z.number().default(0),
});
export type PhotoWell = z.infer<typeof PhotoWellSchema>;

// ─── Text Element on a page ─────────────────────────────────────────────────

export const TextElementSchema = z.object({
  id: z.string().uuid(),
  content: z.string(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  fontFamily: z.enum(["serif", "sans", "display"]).default("sans"),
  fontSize: z.number().default(14),
  fontWeight: z.enum(["300", "400", "500", "600"]).default("400"),
  color: z.string().default("#141413"),
  alignment: z.enum(["left", "center", "right"]).default("center"),
  rotation: z.number().default(0),
});
export type TextElement = z.infer<typeof TextElementSchema>;

// ─── Page Layout ────────────────────────────────────────────────────────────

export const LayoutTypeEnum = z.enum([
  "full-bleed",
  "2-photo-split",
  "3-photo-hero",
  "4-photo-grid",
  "6-photo-collage",
  "text-only",
  "cover-front",
  "cover-back",
  "spine",
]);
export type LayoutType = z.infer<typeof LayoutTypeEnum>;

export const PageSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  pageNumber: z.number().int().min(0),
  layoutType: LayoutTypeEnum,
  photoWells: z.array(PhotoWellSchema),
  textElements: z.array(TextElementSchema),
  backgroundColor: z.string().default("#FFFFFF"),
  canvasJson: z.string().optional(), // Fabric.js serialized JSON
});
export type Page = z.infer<typeof PageSchema>;

// ─── Book Project ───────────────────────────────────────────────────────────

export const ProjectStatusEnum = z.enum([
  "draft",
  "processing",
  "editing",
  "preview",
  "approved",
  "ordered",
]);
export type ProjectStatus = z.infer<typeof ProjectStatusEnum>;

export const ProjectSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid().nullable(),
  guestSessionId: z.string().optional(),
  title: z.string().default("My Photobook"),
  subtitle: z.string().optional(),
  spineText: z.string().optional(),
  category: z.string().optional(),
  bookSize: BookSizeEnum,
  coverType: CoverTypeEnum,
  theme: ThemeEnum,
  coverColor: CoverColorEnum,
  packaging: PackagingEnum.default("standard"),
  pageCount: z.number().int().min(20).max(75).default(20),
  status: ProjectStatusEnum.default("draft"),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Project = z.infer<typeof ProjectSchema>;

// ─── Create & Update Project Schemas ─────────────────────────────────────────

export const CreateProjectSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title is too long").default("My Photobook"),
  template: z.string().optional(),
  category: z.string().optional(),
  bookSize: z.string().optional().default("8.25x8.25"),
  coverType: z.string().optional().default("cov-1"),
  theme: z.string().optional().default("theme-1"),
  color: z.string().optional(),
  coverColor: z.string().optional().default("col-1"),
  packaging: z.string().optional().default("pack-1"),
  pageCount: z.number().int().min(12).max(120).optional().default(32),
  coverImage: z.string().optional(),
  coverUrl: z.string().optional(),
  photos: z.array(z.any()).optional().default([]),
  pages: z.array(z.any()).optional().default([]),
  guestSessionId: z.string().optional(),
});
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;

export const UpdateProjectSchema = CreateProjectSchema.partial();
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;

