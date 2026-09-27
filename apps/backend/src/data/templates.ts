// apps/backend/src/data/templates.ts

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
  badge?: 'new' | 'bestseller' | 'popular' | 'trending' | '';
  featured: boolean;
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

export const pageCountOptions = [
  { count: 12, name: '12 Pages', priceAdjustment: -700, photos: 12, description: '12 photo slots. Compact keepsake.' },
  { count: 24, name: '24 Pages', priceAdjustment: -300, photos: 24, description: '24 photo slots. Weekend getaway.' },
  { count: 32, name: '32 Pages', priceAdjustment: 0, photos: 32, default: true, description: '32 photo slots (Standard Edition). 1 photo per page.' },
  { count: 60, name: '60 Pages', priceAdjustment: 1000, photos: 60, description: '60 photo slots. Extended travel journey.' },
  { count: 120, name: '120 Pages', priceAdjustment: 2800, photos: 120, description: '120 photo slots. Collector\'s master volume.' }
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

export let templates: TemplateProduct[] = [
  {
    id: 'tpl-1',
    slug: 'travel-series-paris',
    seriesLabel: 'travel series',
    bookType: 'custom photobook',
    title: 'custom photobook',
    displayName: 'Paris Journey Hardcover',
    tagline: 'your journeys, perfectly told',
    subtitle: 'Timeless moments across the City of Light',
    description: 'Minimalist editorial layouts with bold typography and iconic architectural framing.',
    category: 'Travel',
    coverImage: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop',
    coverColor: '#F8BAC7', // pastel pink like in screenshot
    spineText: 'PARIS',
    rating: 5.0,
    reviewCount: 72,
    fromPrice: 1999,
    pricing: { '8.25': 1999, '10': 2499 },
    basePages: 40,
    maxPhotos: 100,
    badge: 'bestseller',
    featured: true,
    defaultOptions: {
      size: '8.25x8.25',
      cover: 'cov-1',
      theme: 'theme-4',
      color: 'col-3',
      packaging: 'pack-1'
    },
    templatePhotos: [
      'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1520939817895-060bdef4ad1b?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1471623432079-b009d30b6729?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1549144511-f099e773c147?w=800&auto=format&fit=crop'
    ]
  },
  {
    id: 'tpl-2',
    slug: 'travel-edit-paris',
    seriesLabel: 'travel edit',
    bookType: 'custom magazine',
    title: 'custom magazine',
    displayName: 'The Paris Chapter Edit',
    tagline: 'your travels, front-page featured',
    subtitle: 'Glossy editorial magazine with headline features',
    description: 'High-fashion spreads and editorial callouts making your personal vacation look straight from Vogue.',
    category: 'Travel',
    coverImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop',
    coverColor: '#F5C4CD',
    spineText: 'PARIS EDIT',
    rating: 5.0,
    reviewCount: 72,
    fromPrice: 2499,
    pricing: { '8.25': 2499, '10': 2999 },
    basePages: 44,
    maxPhotos: 85,
    badge: '',
    featured: true,
    defaultOptions: {
      size: '8.25x8.25',
      cover: 'cov-1',
      theme: 'theme-1',
      color: 'col-1',
      packaging: 'pack-2'
    },
    templatePhotos: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop'
    ]
  },
  {
    id: 'tpl-3',
    slug: 'moments-series-summer',
    seriesLabel: 'moments series',
    bookType: 'custom photobook',
    title: 'custom photobook',
    displayName: 'Summer 2026 Coastal Moments',
    tagline: 'your moments, forever kept',
    subtitle: 'Sun-drenched pool days and sunset beach dinners',
    description: 'Pastel coastal tones with centered picture-window frames that accentuate warm summer memories.',
    category: 'Moments',
    coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop',
    coverColor: '#72C2C6', // pastel mint/cyan like in screenshot
    spineText: 'SUMMER 2026',
    rating: 5.0,
    reviewCount: 72,
    fromPrice: 1999,
    pricing: { '8.25': 1999, '10': 2499 },
    basePages: 40,
    maxPhotos: 90,
    badge: 'new',
    featured: true,
    defaultOptions: {
      size: '8.25x8.25',
      cover: 'cov-1',
      theme: 'theme-1',
      color: 'col-4',
      packaging: 'pack-1'
    },
    templatePhotos: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop'
    ]
  },
  {
    id: 'tpl-4',
    slug: 'sri-lanka-travel',
    seriesLabel: 'travel series',
    bookType: 'custom photobook',
    title: 'custom photobook',
    displayName: 'Sri Lanka Tea Hills & Coasts',
    tagline: 'raw landscapes, forever captured',
    subtitle: 'From Sigiriya rock fortress to Ella misty peaks',
    description: 'Perfect for capturing the vibrant colors, ancient ruins, misty tea hills, and golden beaches.',
    category: 'Travel',
    coverImage: 'https://images.unsplash.com/photo-1588416936097-41850ab3d86d?w=800&auto=format&fit=crop',
    coverColor: '#2D4A3E',
    spineText: 'SRI LANKA',
    rating: 4.9,
    reviewCount: 114,
    fromPrice: 1999,
    pricing: { '8.25': 1999, '10': 2499 },
    basePages: 40,
    maxPhotos: 100,
    badge: 'popular',
    featured: true,
    defaultOptions: {
      size: '8.25x8.25',
      cover: 'cov-1',
      theme: 'theme-4',
      color: 'col-5',
      packaging: 'pack-1'
    },
    templatePhotos: [
      'https://images.unsplash.com/photo-1588416936097-41850ab3d86d?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1580974582391-a6649c82a85f?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1579564177579-22a49f50f2fb?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1620216664966-218eb8a40d51?w=800&auto=format&fit=crop'
    ]
  },
  {
    id: 'tpl-5',
    slug: 'first-anniversary',
    seriesLabel: 'anniversary series',
    bookType: 'custom photobook',
    title: 'custom photobook',
    displayName: 'Our 1st Anniversary Keepsake',
    tagline: 'years of love, timelessly bound',
    subtitle: 'Celebrating 365 days of laughter and milestones',
    description: 'Relive the most romantic moments, candid smiles, and first-year milestones in a luxury lay-flat keepsake book.',
    category: 'Anniversary',
    coverImage: 'https://images.unsplash.com/photo-1529636798458-92182e662485?w=800&auto=format&fit=crop',
    coverColor: '#E3C28C', // gold accent
    spineText: 'CHAPTER ONE',
    rating: 5.0,
    reviewCount: 96,
    fromPrice: 1999,
    pricing: { '8.25': 1999, '10': 2499 },
    basePages: 36,
    maxPhotos: 75,
    badge: 'new',
    featured: true,
    defaultOptions: {
      size: '8.25x8.25',
      cover: 'cov-1',
      theme: 'theme-5',
      color: 'col-3',
      packaging: 'pack-2'
    },
    templatePhotos: [
      'https://images.unsplash.com/photo-1529636798458-92182e662485?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1518193026322-26162334f664?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800&auto=format&fit=crop'
    ]
  }
];
