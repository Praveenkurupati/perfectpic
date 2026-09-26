import { z } from "zod";

// ─── Book Product Configuration ─────────────────────────────────────────────

export const BookSizeEnum = z.enum([
  "8.25x8.25",
  "10x10",
  "A4",
  "A5",
]);
export type BookSize = z.infer<typeof BookSizeEnum>;

export const BookSizeDetails: Record<BookSize, { label: string; dimensions: string; widthInches: number; heightInches: number }> = {
  "8.25x8.25": { label: "Square Classic", dimensions: '8.25" × 8.25"', widthInches: 8.25, heightInches: 8.25 },
  "10x10": { label: "Square Grand", dimensions: '10" × 10"', widthInches: 10, heightInches: 10 },
  "A4": { label: "Portrait Grand", dimensions: "A4 (8.3\" × 11.7\")", widthInches: 8.3, heightInches: 11.7 },
  "A5": { label: "Portrait Classic", dimensions: "A5 (5.8\" × 8.3\")", widthInches: 5.8, heightInches: 8.3 },
};

export const CoverTypeEnum = z.enum(["hardcover-laminar", "softcover-layflat"]);
export type CoverType = z.infer<typeof CoverTypeEnum>;

export const ThemeEnum = z.enum([
  "minimal-scandinavian",
  "classic-travel",
  "editorial-magazine",
  "festive-baby",
  "festive-wedding",
  "festive-birthday",
  "festive-anniversary",
  "festive-mothers-day",
  "festive-fathers-day",
]);
export type Theme = z.infer<typeof ThemeEnum>;

export const CoverColorEnum = z.enum([
  "pastel-pink",
  "sage-green",
  "navy",
  "terracotta",
  "ivory",
  "charcoal",
  "dusty-rose",
  "midnight-blue",
]);
export type CoverColor = z.infer<typeof CoverColorEnum>;

export const PackagingEnum = z.enum(["standard", "keepsake-box"]);
export type Packaging = z.infer<typeof PackagingEnum>;

export const CategoryEnum = z.enum([
  "travel",
  "baby-first-year",
  "wedding",
  "birthday",
  "anniversary",
  "festivals",
  "pet-paws",
  "specials",
]);
export type Category = z.infer<typeof CategoryEnum>;

// ─── Pricing Constants ──────────────────────────────────────────────────────

export const PRICING = {
  BASE_PAGES: 20,
  MAX_PAGES: 75,
  MIN_PHOTOS: 20,
  MAX_PHOTOS_STANDARD: 80,
  MAX_PHOTOS_COLLAGE: 250,
  EXTRA_PAGE_COST: {
    "8.25x8.25": 75,
    "10x10": 150,
    A4: 150,
    A5: 75,
  } as Record<BookSize, number>,
  BASE_PRICE: {
    "8.25x8.25": 1499,
    "10x10": 2499,
    A4: 2499,
    A5: 1499,
  } as Record<BookSize, number>,
  KEEPSAKE_BOX: 499,
  FREE_MAGNET_THRESHOLD: 24,
  BUNDLE_DISCOUNTS: {
    2: 300,
    3: 700,
    6: 1800,
    12: 4500,
  } as Record<number, number>,
} as const;
