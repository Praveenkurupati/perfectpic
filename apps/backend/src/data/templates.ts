// apps/backend/src/data/templates.ts
import { defaultBooks } from './defaultBooks';

export interface TemplateProduct {
  id: string;
  slug: string;
  seriesLabel: string; // e.g. "travel series", "travel edit", "moments series"
  bookType: 'custom photobook' | 'custom magazine' | 'artisan layflat';
  title: string;
  displayName: string;
  tagline: string;
  subtitle: string;
  description: string;
  category: string;
  coverImage: string;
  mockupBg?: string; // background color for mockup container
  coverColor?: string; // e.g. #F8BAC7 for Paris pink, #70C5CB for Summer mint
  spineText?: string;
  rating: number;
  reviewCount: number;
  fromPrice: number;
  pricing: { [key: string]: number };
  basePages: number;
  maxPhotos: number;
  badge?: 'new' | 'bestseller' | 'popular' | 'trending' | string;
  featured: boolean;
  priority?: number;
  tags?: string[];
  pageOptions?: number[];
  defaultOptions: {
    size: string;
    cover: string;
    theme: string;
    color: string;
    packaging: string;
  };
  templatePhotos: string[];
}

export const categories = [
  { id: 'cat-all', name: 'All Series', slug: 'all', description: 'Browse our complete collection of custom photo books.', emoji: '✨', count: 35 },
  { id: 'cat-trek', name: 'Trek Series', slug: 'trek', description: 'Himalayan ridges, alpine trails, and Western Ghats sanctuaries.', emoji: '🏔️', count: 10 },
  { id: 'cat-1', name: 'Travel Series', slug: 'travel', description: 'Capture your wanderlust and epic adventures across India and the globe.', emoji: '✈️', count: 20 },
  { id: 'cat-2', name: 'Moments Series', slug: 'moments', description: 'Daily magic, summer highlights, and candid family memories.', emoji: '☀️', count: 3 },
  { id: 'cat-3', name: 'Anniversary Series', slug: 'anniversary', description: 'Celebrate milestone anniversaries and enduring love stories.', emoji: '🥂', count: 2 },
  { id: 'cat-4', name: 'Wedding Series', slug: 'wedding', description: 'Preserve the vows and portraits of your celebration.', emoji: '💍', count: 2 }
];

export interface PageOptionItem {
  id?: string;
  pageOptionId: string;
  count: number;
  name: string;
  photos: number;
  badge?: string;
  priceAdjustment: number;
  description: string;
  isDefault?: boolean;
  default?: boolean;
  isActive?: boolean;
  displayOrder: number;
}

export const pageCountOptions: PageOptionItem[] = [
  {
    pageOptionId: 'pages-32',
    count: 32,
    name: '32 Pages',
    photos: 32,
    badge: 'Popular',
    priceAdjustment: 0,
    isDefault: true,
    default: true,
    isActive: true,
    displayOrder: 1,
    description: '32 photo slots (1 photo per page). Our most popular standard edition.'
  },
  {
    pageOptionId: 'pages-50',
    count: 50,
    name: '50 Pages',
    photos: 50,
    badge: 'Extended',
    priceAdjustment: 600,
    isDefault: false,
    default: false,
    isActive: true,
    displayOrder: 2,
    description: '50 photo slots (1 photo per page). Extended journey with generous story room.'
  },
  {
    pageOptionId: 'pages-60',
    count: 60,
    name: '60 Pages',
    photos: 60,
    badge: "Collector's",
    priceAdjustment: 1000,
    isDefault: false,
    default: false,
    isActive: true,
    displayOrder: 3,
    description: '60 photo slots (1 photo per page). Curated heirloom album for unforgettable expeditions.'
  },
  {
    pageOptionId: 'pages-72',
    count: 72,
    name: '72 Pages',
    photos: 72,
    badge: "Collector's",
    priceAdjustment: 1400,
    isDefault: false,
    default: false,
    isActive: true,
    displayOrder: 4,
    description: '72 photo slots (1 photo per page). Deluxe milestone celebration chronicle.'
  },
  {
    pageOptionId: 'pages-12',
    count: 12,
    name: '12 Pages',
    photos: 12,
    badge: '',
    priceAdjustment: -700,
    isDefault: false,
    default: false,
    isActive: true,
    displayOrder: 5,
    description: '12 photo slots (1 photo per page). Compact pocket keepsake.'
  },
  {
    pageOptionId: 'pages-24',
    count: 24,
    name: '24 Pages',
    photos: 24,
    badge: '',
    priceAdjustment: -300,
    isDefault: false,
    default: false,
    isActive: true,
    displayOrder: 6,
    description: '24 photo slots (1 photo per page). Weekend getaway edition.'
  },
  {
    pageOptionId: 'pages-120',
    count: 120,
    name: '120 Pages',
    photos: 120,
    badge: "Collector's Master",
    priceAdjustment: 2800,
    isDefault: false,
    default: false,
    isActive: true,
    displayOrder: 7,
    description: '120 photo slots (1 photo per page). Comprehensive annual encyclopedia.'
  }
];

export const productSizes = [
  { id: 'size-1', name: '8.25" × 8.25" Square', dimensions: '8.25x8.25', basePrice: 1999, description: 'Our most popular size, perfect for coffee tables and bookshelf display.' },
  { id: 'size-2', name: '10" × 10" Grand Square', dimensions: '10x10', basePrice: 2499, description: 'Expansive gallery scale for panoramic spreads and grand memories.' }
];

export const coverTypes = [
  { id: 'cov-1', name: 'Hardcover Laminar', priceAdjustment: 0, included: true, description: 'Silky matte anti-scratch lamination with rigid luxury board.' },
  { id: 'cov-2', name: 'Hardcover Vegan Leather', priceAdjustment: 500, included: false, description: 'Supple premium Italian leatherette with foil debossing.' },
  { id: 'cov-3', name: 'Softcover Artisan', priceAdjustment: -300, included: false, description: 'Lightweight flexible softcover with velvety touch.' }
];

export const bookThemes = [
  { id: 'theme-1', name: 'Minimal Modern', desc: 'Sleek layouts, ample breathing room, editorial typography.' },
  { id: 'theme-2', name: 'Classic Cream', desc: 'Timeless borders, warm ivory tones, serif accents.' },
  { id: 'theme-3', name: 'Dark Luxe', desc: 'Dramatic obsidian pages with vivid color contrast.' },
  { id: 'theme-4', name: 'Wanderlust', desc: 'Story-driven spreads with GPS stamps and journey maps.' },
  { id: 'theme-5', name: 'Romance', desc: 'Delicate floral embellishments and soft pastel hues.' }
];

export const bookColors = [
  { id: 'col-1', name: 'Ivory White', hex: '#FAF8F5' },
  { id: 'col-2', name: 'Midnight Black', hex: '#0A0A0A' },
  { id: 'col-3', name: 'Dusty Rose', hex: '#D8A47F' },
  { id: 'col-4', name: 'Ocean Blue', hex: '#3B606E' },
  { id: 'col-5', name: 'Forest Green', hex: '#2D4A3E' }
];

export const packagingOptions = [
  { id: 'pack-1', name: 'Standard Eco Box', priceAdjustment: 0, description: 'Recyclable protective rigid packaging with dust pouch.' },
  { id: 'pack-2', name: 'Luxury Keepsake Box', priceAdjustment: 499, description: 'Cloth-bound magnetic clamshell box with ribbon pull.' },
  { id: 'pack-3', name: 'Gilded Gift Packaging', priceAdjustment: 199, description: 'Hand-wrapped in bespoke parchment paper with wax seal.' }
];

// Single source of truth mapped from defaultBooks (Indian books prioritized at the top)
export let templates: TemplateProduct[] = defaultBooks.map((b, idx) => ({
  id: `tpl-${idx + 1}`,
  slug: b.slug,
  seriesLabel: b.seriesLabel,
  bookType: (b.bookType as any) || 'custom photobook',
  title: b.title,
  displayName: b.displayName,
  tagline: b.tagline,
  subtitle: b.subtitle,
  description: b.description,
  category: b.category,
  coverImage: b.coverImage,
  coverColor: b.coverColor,
  spineText: b.spineText,
  rating: b.rating,
  reviewCount: b.reviewCount,
  fromPrice: b.fromPrice,
  pricing: b.pricing,
  basePages: b.basePages,
  maxPhotos: b.maxPhotos,
  badge: (b.badge as any) || '',
  featured: b.featured,
  priority: b.priority ?? (100 - idx * 2),
  tags: b.tags,
  pageOptions: b.pageOptions,
  defaultOptions: {
    size: '8.25x8.25',
    cover: 'cov-1',
    theme: 'theme-4',
    color: 'col-1',
    packaging: 'pack-1'
  },
  templatePhotos: b.templatePhotos
}));
