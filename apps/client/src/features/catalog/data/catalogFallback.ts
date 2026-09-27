// apps/client/src/features/catalog/data/catalogFallback.ts

export interface FallbackBook {
  id?: string;
  slug: string;
  seriesLabel: string;
  bookType: string;
  title: string;
  displayName: string;
  tagline: string;
  subtitle: string;
  description: string;
  category: string;
  tags: string[];
  pageOptions?: number[];
  coverImage: string;
  coverColor: string;
  spineText: string;
  rating: number;
  reviewCount: number;
  fromPrice: number;
  pricing: { [key: string]: number };
  basePages: number;
  maxPhotos: number;
  badge?: string;
  featured?: boolean;
  priority?: number;
  templatePhotos: string[];
}

export const fallbackCatalog: FallbackBook[] = [
  {
    slug: 'travel-series-paris',
    seriesLabel: 'the travel series',
    bookType: 'custom photobook',
    title: 'custom photobook',
    displayName: 'Paris Journey Hardcover',
    tagline: 'your journeys, perfectly told',
    subtitle: 'Eiffel Tower & Parisian Cafes',
    description: 'Minimalist editorial layouts with bold typography and iconic architectural framing.',
    category: 'Travel',
    tags: ['paris', 'france', 'europe', 'city', 'architecture', 'eiffel', 'romantic'],
    pageOptions: [50, 100, 150, 200, 32, 60, 120],
    coverImage: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop',
    coverColor: '#F8BAC7',
    spineText: 'PARIS',
    rating: 5.0,
    reviewCount: 72,
    fromPrice: 1999,
    pricing: { '8.25': 1999, '10': 2499 },
    basePages: 50,
    maxPhotos: 120,
    badge: 'bestseller',
    featured: true,
    priority: 54,
    templatePhotos: [
      'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1520939817895-060bdef4ad1b?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=800&auto=format&fit=crop'
    ]
  },
  {
    slug: 'trek-series-nethravathi',
    seriesLabel: 'the trek series',
    bookType: 'custom photobook',
    title: 'custom photobook',
    displayName: 'Netravati Peak Cloud Trails',
    tagline: 'emerald valleys & western monsoon mist',
    subtitle: 'Chikmagalur Ghats Ridge Hike',
    description: 'Vibrant green ridge landscapes and dramatic monsoon fog captured on premium lay-flat spreads.',
    category: 'Trek',
    tags: ['trek', 'trekking', 'nethravathi', 'netravati', 'karnataka', 'western ghats', 'monsoon', 'clouds', 'hills', 'greenery'],
    pageOptions: [50, 100, 150, 200, 32, 60, 120],
    coverImage: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop',
    coverColor: '#4E7055',
    spineText: 'NETRAVATI',
    rating: 4.9,
    reviewCount: 88,
    fromPrice: 1999,
    pricing: { '8.25': 1999, '10': 2499 },
    basePages: 32,
    maxPhotos: 120,
    badge: 'trending',
    priority: 100,
    featured: true,
    templatePhotos: [
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1511497584788-87676104235f?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop'
    ]
  },
  {
    slug: 'travel-series-kerala',
    seriesLabel: 'the travel series',
    bookType: 'custom photobook',
    title: 'custom photobook',
    displayName: 'Kerala Gods Own Country',
    tagline: 'swaying palms, backwaters & spice trails',
    subtitle: 'Alleppey, Kumarakom & Kochi',
    description: 'Tranquil houseboat cruises, lush coconut groves, and heritage spice warehouses.',
    category: 'Travel',
    tags: ['kerala', 'alleppey', 'backwaters', 'houseboat', 'kumarakom', 'south india', 'palms', 'ayurveda', 'vacation'],
    pageOptions: [50, 100, 150, 200, 32, 60, 120],
    coverImage: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&auto=format&fit=crop',
    coverColor: '#3B7A57',
    spineText: 'KERALA',
    rating: 5.0,
    reviewCount: 145,
    fromPrice: 1999,
    pricing: { '8.25': 1999, '10': 2499 },
    basePages: 32,
    maxPhotos: 120,
    badge: 'bestseller',
    priority: 98,
    featured: true,
    templatePhotos: [
      'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop'
    ]
  },
  {
    slug: 'trek-series-himalaya',
    seriesLabel: 'the trek series',
    bookType: 'custom photobook',
    title: 'custom photobook',
    displayName: 'Himalayan Summit Chronicles',
    tagline: 'eternal snowfields & high prayer flags',
    subtitle: 'Great Himalayan Range Expeditions',
    description: 'Crisp mountaineering shots with generous margins, minimalist typography, and archival binding.',
    category: 'Trek',
    tags: ['trek', 'trekking', 'himalaya', 'himalayas', 'india', 'peaks', 'glacier', 'snow', 'camping', 'altitude'],
    pageOptions: [50, 100, 150, 200, 32, 60, 120],
    coverImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop',
    coverColor: '#415A77',
    spineText: 'HIMALAYAS',
    rating: 4.9,
    reviewCount: 94,
    fromPrice: 1999,
    pricing: { '8.25': 1999, '10': 2499 },
    basePages: 32,
    maxPhotos: 120,
    badge: 'popular',
    priority: 96,
    featured: true,
    templatePhotos: [
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop'
    ]
  },
  {
    slug: 'travel-series-varkala',
    seriesLabel: 'the travel series',
    bookType: 'custom photobook',
    title: 'custom photobook',
    displayName: 'Varkala Bohemian Cliffs',
    tagline: 'red laterite cliffs & arabian sea sunset',
    subtitle: 'North Cliff Surf & Beach Diaries',
    description: 'Dramatic red sandstone precipices dropping into the turquoise Arabian Sea with sunset bonfires.',
    category: 'Travel',
    tags: ['varkala', 'kerala', 'cliffs', 'beach', 'sunset', 'arabian sea', 'surf', 'bohemian'],
    pageOptions: [50, 100, 150, 200, 32, 60, 120],
    coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop',
    coverColor: '#D87040',
    spineText: 'VARKALA',
    rating: 4.9,
    reviewCount: 92,
    fromPrice: 1999,
    pricing: { '8.25': 1999, '10': 2499 },
    basePages: 32,
    maxPhotos: 120,
    badge: 'popular',
    priority: 94,
    featured: true,
    templatePhotos: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop'
    ]
  },
  {
    slug: 'trek-series-kudremukh',
    seriesLabel: 'the trek series',
    bookType: 'custom photobook',
    title: 'custom photobook',
    displayName: 'Kudremukh Rolling Meadows',
    tagline: 'shola forests & horse-face peak',
    subtitle: 'Kudremukh National Park Trail',
    description: 'Rolling grasslands of the Western Ghats under misty skies, punctuated by sparkling mountain streams.',
    category: 'Trek',
    tags: ['kudremukh', 'karnataka', 'trek', 'trekking', 'western ghats', 'shola', 'grassland', 'hills'],
    pageOptions: [50, 100, 150, 200, 32, 60, 120],
    coverImage: 'https://images.unsplash.com/photo-1511497584788-87676104235f?w=800&auto=format&fit=crop',
    coverColor: '#606C38',
    spineText: 'KUDREMUKH',
    rating: 4.8,
    reviewCount: 76,
    fromPrice: 1999,
    pricing: { '8.25': 1999, '10': 2499 },
    basePages: 32,
    maxPhotos: 120,
    badge: 'new',
    priority: 92,
    featured: true,
    templatePhotos: [
      'https://images.unsplash.com/photo-1511497584788-87676104235f?w=800&auto=format&fit=crop'
    ]
  },
  {
    slug: 'trek-series-annapurna',
    seriesLabel: 'the trek series',
    bookType: 'custom photobook',
    title: 'custom photobook',
    displayName: 'Annapurna Sanctuary Quest',
    tagline: 'amphitheatre of giants & rhododendron forests',
    subtitle: 'ABC 4130m Glacier Base Camp',
    description: 'Glacial cirques surrounded by Machapuchare and Annapurna South.',
    category: 'Trek',
    tags: ['annapurna', 'abc', 'nepal', 'himalayas', 'trek', 'trekking', 'base camp', 'mountains', 'altitude'],
    pageOptions: [50, 100, 150, 200, 32, 60, 120],
    coverImage: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop',
    coverColor: '#2B4162',
    spineText: 'ANNAPURNA',
    rating: 5.0,
    reviewCount: 110,
    fromPrice: 1999,
    pricing: { '8.25': 1999, '10': 2499 },
    basePages: 32,
    maxPhotos: 120,
    badge: 'bestseller',
    priority: 90,
    featured: true,
    templatePhotos: [
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop'
    ]
  },
  {
    slug: 'anniversary-series-first',
    seriesLabel: 'the anniversary series',
    bookType: 'custom photobook',
    title: 'custom photobook',
    displayName: 'First Anniversary Paper Edition',
    tagline: '365 days of laughter & forever to go',
    subtitle: 'Paper Milestone Celebration',
    description: 'A tribute to your first year of marriage, celebrating the paper anniversary with timeless portraits.',
    category: 'Anniversary',
    tags: ['anniversary', 'wedding', 'first anniversary', 'paper anniversary', 'love', 'couple', 'marriage'],
    pageOptions: [50, 100, 150, 200, 32, 60, 120],
    coverImage: 'https://images.unsplash.com/photo-1529636798458-92182e662485?w=800&auto=format&fit=crop',
    coverColor: '#DDA15E',
    spineText: 'YEAR ONE',
    rating: 5.0,
    reviewCount: 96,
    fromPrice: 1999,
    pricing: { '8.25': 1999, '10': 2499 },
    basePages: 32,
    maxPhotos: 120,
    badge: 'bestseller',
    priority: 56,
    featured: true,
    templatePhotos: [
      'https://images.unsplash.com/photo-1529636798458-92182e662485?w=800&auto=format&fit=crop'
    ]
  }
];

export function getFallbackProduct(slug: string): FallbackBook | undefined {
  const clean = slug.toLowerCase().replace(/_/g, '-');
  const bare = clean.replace(/-[0-9]+$/, '');

  return fallbackCatalog.find(b => 
    b.slug === slug || 
    b.slug === clean || 
    b.slug.includes(bare) || 
    bare.includes(b.slug) ||
    b.displayName.toLowerCase().includes(bare.replace(/-/g, ' '))
  );
}
