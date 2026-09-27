// apps/backend/src/data/templates.ts

export const categories = [
  { id: 'cat-all', name: 'All Books', slug: 'all', description: 'Browse our complete collection of handcrafted photo books.', emoji: '✨', count: 4 },
  { id: 'cat-1', name: 'Travel', slug: 'travel', description: 'Capture your wanderlust and epic adventures across the globe.', emoji: '✈️', count: 3 },
  { id: 'cat-2', name: 'Anniversary', slug: 'anniversary', description: 'Celebrate milestone anniversaries and love stories.', emoji: '🥂', count: 1 },
  { id: 'cat-3', name: 'Wedding', slug: 'wedding', description: 'Preserve the magic and vows of your big day.', emoji: '💍', count: 0 },
  { id: 'cat-4', name: 'Baby & Kids', slug: 'baby', description: 'Treasure baby’s first steps and growing milestones.', emoji: '👶', count: 0 }
];

export const productSizes = [
  { id: 'size-1', name: '8.25" × 8.25" Square', dimensions: '8.25x8.25', basePrice: 1999, description: 'Our most popular size, perfect for coffee tables and bookshelf display.' },
  { id: 'size-2', name: '10" × 10" Grand Square', dimensions: '10x10', basePrice: 2499, description: 'Expansive gallery scale for panoramic spreads and grand memories.' }
];

export const coverTypes = [
  { id: 'cov-1', name: 'Hardcover Laminar', priceAdjustment: 0, included: true, description: 'Silky matte anti-scratch lamination with rigid luxury board.' },
  { id: 'cov-2', name: 'Hardcover Vegan Leather', priceAdjustment: 500, included: false, description: 'Supple handcrafted Italian leatherette with foil debossing.' },
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

export const templates = [
  {
    id: 'tpl-1',
    slug: 'sri-lanka-travel',
    title: 'Sri Lanka Travel Diary',
    subtitle: 'A journey through the tear drop of India',
    description: 'Perfect for capturing the vibrant colors, ancient ruins, misty tea hills, and golden beaches of Sri Lanka.',
    category: 'Travel',
    coverImage: 'https://images.unsplash.com/photo-1588416936097-41850ab3d86d?w=800&auto=format&fit=crop',
    templatePhotos: [
      'https://images.unsplash.com/photo-1580974582391-a6649c82a85f?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1579564177579-22a49f50f2fb?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1620216664966-218eb8a40d51?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1533050487297-09b450131914?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1586526462747-d5d1ea857f13?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1625736173007-88fcf32d20d7?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1582496739818-d4cbf2826cce?w=800&auto=format&fit=crop'
    ],
    pricing: { '8.25': 1999, '10': 2499 },
    basePages: 40,
    maxPhotos: 100,
    defaultOptions: {
      size: '8.25x8.25',
      cover: 'cov-1',
      theme: 'theme-4',
      color: 'col-4',
      packaging: 'pack-1'
    },
    availableThemes: ['Wanderlust', 'Minimal Modern', 'Classic Cream'],
    availableCovers: ['Hardcover Laminar', 'Hardcover Leather', 'Softcover'],
    availableColors: ['Ocean Blue', 'Forest Green', 'Ivory White'],
    availablePackaging: ['Standard Eco Box', 'Luxury Keepsake Box'],
    featured: true,
    badge: 'Bestseller'
  },
  {
    id: 'tpl-2',
    slug: 'colombia-adventure',
    title: 'Colombia Adventure',
    subtitle: 'Vibrant colonial streets, coffee valleys & Andean peaks',
    description: 'Document your journey through the colorful balconies of Cartagena, the wax palms of Salento, and lush coffee fincas.',
    category: 'Travel',
    coverImage: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=800&auto=format&fit=crop',
    templatePhotos: [
      'https://images.unsplash.com/photo-1583321526487-75d8d067ed77?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1589133342379-450f28246bc5?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1538354670077-7422f0853515?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1601614917409-e137b75249f0?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1587399887756-3c072b220d53?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1588691880947-f376cc0954b8?w=800&auto=format&fit=crop'
    ],
    pricing: { '8.25': 1999, '10': 2499 },
    basePages: 40,
    maxPhotos: 80,
    defaultOptions: {
      size: '8.25x8.25',
      cover: 'cov-1',
      theme: 'theme-4',
      color: 'col-5',
      packaging: 'pack-1'
    },
    availableThemes: ['Wanderlust', 'Minimal Modern'],
    availableCovers: ['Hardcover Laminar', 'Hardcover Leather'],
    availableColors: ['Midnight Black', 'Forest Green', 'Ivory White'],
    availablePackaging: ['Standard Eco Box', 'Luxury Keepsake Box'],
    featured: true,
    badge: 'New'
  },
  {
    id: 'tpl-3',
    slug: 'annapurna-base-camp',
    title: 'Annapurna Base Camp',
    subtitle: 'Trekking into the sanctuary of the majestic Himalayas',
    description: 'A grand book for a grand adventure. Showcase the awe-inspiring peaks, prayer flags, sunrise summits, and the spirit of high-altitude trekking.',
    category: 'Travel',
    coverImage: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop',
    templatePhotos: [
      'https://images.unsplash.com/photo-1522204646733-5c7ffce4141d?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1541819612089-a2991e2b585d?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1544735716-f2868ff8373b?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1517408800924-42f885e72d24?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1548110594-e3c3b52d439b?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1629851722883-9bfa3d0d603a?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1551608674-f25bbfb8a4f6?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1510252879573-0ff7dc218412?w=800&auto=format&fit=crop'
    ],
    pricing: { '8.25': 2499, '10': 2999 },
    basePages: 48,
    maxPhotos: 120,
    defaultOptions: {
      size: '10x10',
      cover: 'cov-2',
      theme: 'theme-3',
      color: 'col-2',
      packaging: 'pack-2'
    },
    availableThemes: ['Wanderlust', 'Dark Luxe', 'Minimal Modern'],
    availableCovers: ['Hardcover Laminar', 'Hardcover Leather'],
    availableColors: ['Midnight Black', 'Ivory White', 'Ocean Blue'],
    availablePackaging: ['Standard Eco Box', 'Luxury Keepsake Box', 'Gilded Gift Packaging'],
    featured: true,
    badge: 'Popular Pick'
  },
  {
    id: 'tpl-4',
    slug: 'first-anniversary',
    title: 'Our 1st Anniversary',
    subtitle: 'Celebrating 365 days of love, laughter & new chapters',
    description: 'Relive the most romantic moments, candid smiles, and first-year milestones in a luxury lay-flat keepsake book.',
    category: 'Anniversary',
    coverImage: 'https://images.unsplash.com/photo-1529636798458-92182e662485?w=800&auto=format&fit=crop',
    templatePhotos: [
      'https://images.unsplash.com/photo-1518193026322-26162334f664?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1494955870715-979c4f10164f?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&auto=format&fit=crop'
    ],
    pricing: { '8.25': 1999, '10': 2499 },
    basePages: 36,
    maxPhotos: 75,
    defaultOptions: {
      size: '8.25x8.25',
      cover: 'cov-1',
      theme: 'theme-5',
      color: 'col-3',
      packaging: 'pack-2'
    },
    availableThemes: ['Romance', 'Classic Cream', 'Minimal Modern'],
    availableCovers: ['Hardcover Laminar', 'Hardcover Leather'],
    availableColors: ['Dusty Rose', 'Ivory White'],
    availablePackaging: ['Luxury Keepsake Box', 'Gilded Gift Packaging'],
    featured: true,
    badge: 'Milestone'
  }
];
