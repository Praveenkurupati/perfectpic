// apps/backend/src/data/defaultBooks.ts

export interface DefaultBook {
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
  badge: string;
  featured: boolean;
  priority?: number;
  templatePhotos: string[];
}

export const defaultBooks: DefaultBook[] = [
  {
    "slug": "trek-series-nethravathi",
    "seriesLabel": "trek series",
    "bookType": "custom photobook",
    "title": "custom photobook",
    "displayName": "Netravati Peak Cloud Trails",
    "tagline": "emerald valleys & western monsoon mist",
    "subtitle": "Chikmagalur Ghats Ridge Hike",
    "description": "Vibrant green ridge landscapes and dramatic monsoon fog captured on premium lay-flat spreads.",
    "category": "Trek",
    "tags": [
      "trek",
      "trekking",
      "nethravathi",
      "netravati",
      "karnataka",
      "western ghats",
      "monsoon",
      "clouds",
      "hills",
      "greenery"
    ],
    "pageOptions": [
      12,
      24,
      32,
      60,
      120
    ],
    "coverImage": "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop",
    "coverColor": "#4E7055",
    "spineText": "NETRAVATI",
    "rating": 4.9,
    "reviewCount": 88,
    "fromPrice": 1999,
    "pricing": {
      "10": 2499,
      "8.25": 1999
    },
    "basePages": 32,
    "maxPhotos": 120,
    "badge": "trending",
    "priority": 100,
    "featured": true,
    "templatePhotos": [
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1511497584788-87676104235f?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&auto=format&fit=crop"
    ]
  },
  {
    "slug": "travel-series-kerala",
    "seriesLabel": "travel series",
    "bookType": "custom photobook",
    "title": "custom photobook",
    "displayName": "Kerala Gods Own Country",
    "tagline": "swaying palms, backwaters & spice trails",
    "subtitle": "Alleppey, Kumarakom & Kochi",
    "description": "Tranquil houseboat cruises, lush coconut groves, and heritage spice warehouses.",
    "category": "Travel",
    "tags": [
      "kerala",
      "alleppey",
      "backwaters",
      "houseboat",
      "kumarakom",
      "south india",
      "palms",
      "ayurveda",
      "vacation"
    ],
    "pageOptions": [
      12,
      24,
      32,
      60,
      120
    ],
    "coverImage": "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&auto=format&fit=crop",
    "coverColor": "#3B7A57",
    "spineText": "KERALA",
    "rating": 5,
    "reviewCount": 145,
    "fromPrice": 1999,
    "pricing": {
      "10": 2499,
      "8.25": 1999
    },
    "basePages": 32,
    "maxPhotos": 120,
    "badge": "bestseller",
    "priority": 98,
    "featured": true,
    "templatePhotos": [
      "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=800&auto=format&fit=crop"
    ]
  },
  {
    "slug": "trek-series-himalaya",
    "seriesLabel": "trek series",
    "bookType": "custom photobook",
    "title": "custom photobook",
    "displayName": "Himalayan Summit Chronicles",
    "tagline": "eternal snowfields & high prayer flags",
    "subtitle": "Great Himalayan Range Expeditions",
    "description": "Crisp mountaineering shots with generous margins, minimalist typography, and archival binding.",
    "category": "Trek",
    "tags": [
      "trek",
      "trekking",
      "himalaya",
      "himalayas",
      "india",
      "peaks",
      "glacier",
      "snow",
      "camping",
      "altitude"
    ],
    "pageOptions": [
      12,
      24,
      32,
      60,
      120
    ],
    "coverImage": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop",
    "coverColor": "#415A77",
    "spineText": "HIMALAYAS",
    "rating": 4.9,
    "reviewCount": 94,
    "fromPrice": 1999,
    "pricing": {
      "10": 2499,
      "8.25": 1999
    },
    "basePages": 32,
    "maxPhotos": 120,
    "badge": "popular",
    "priority": 96,
    "featured": true,
    "templatePhotos": [
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&auto=format&fit=crop"
    ]
  },
  {
    "slug": "travel-series-varkala",
    "seriesLabel": "travel series",
    "bookType": "custom photobook",
    "title": "custom photobook",
    "displayName": "Varkala Bohemian Cliffs",
    "tagline": "red laterite cliffs & arabian sea sunset",
    "subtitle": "North Cliff Surf & Beach Diaries",
    "description": "Dramatic cliffside vistas, golden beach breaks, and bohemian oceanview cafe memories.",
    "category": "Travel",
    "tags": [
      "varkala",
      "kerala",
      "cliff",
      "arabian sea",
      "beach",
      "sunset",
      "surf",
      "south india",
      "coastal"
    ],
    "pageOptions": [
      12,
      24,
      32,
      60,
      120
    ],
    "coverImage": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop",
    "coverColor": "#D87040",
    "spineText": "VARKALA",
    "rating": 4.9,
    "reviewCount": 92,
    "fromPrice": 1999,
    "pricing": {
      "10": 2499,
      "8.25": 1999
    },
    "basePages": 32,
    "maxPhotos": 120,
    "badge": "new",
    "priority": 94,
    "featured": true,
    "templatePhotos": [
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=800&auto=format&fit=crop"
    ]
  },
  {
    "slug": "trek-series-kudremukh",
    "seriesLabel": "trek series",
    "bookType": "custom photobook",
    "title": "custom photobook",
    "displayName": "Kudremukh Rolling Meadows",
    "tagline": "shola forests & horse-face peak",
    "subtitle": "Kudremukh National Park Trail",
    "description": "Rolling shola grasshills and cloud-draped mountain paths documented in pristine gallery quality.",
    "category": "Trek",
    "tags": [
      "trek",
      "trekking",
      "kudremukh",
      "chikmagalur",
      "karnataka",
      "greenery",
      "western ghats",
      "shola",
      "wildlife"
    ],
    "pageOptions": [
      12,
      24,
      32,
      60,
      120
    ],
    "coverImage": "https://images.unsplash.com/photo-1511497584788-87676104235f?w=800&auto=format&fit=crop",
    "coverColor": "#606C38",
    "spineText": "KUDREMUKH",
    "rating": 4.8,
    "reviewCount": 76,
    "fromPrice": 1999,
    "pricing": {
      "10": 2499,
      "8.25": 1999
    },
    "basePages": 32,
    "maxPhotos": 120,
    "badge": "",
    "priority": 92,
    "featured": true,
    "templatePhotos": [
      "https://images.unsplash.com/photo-1511497584788-87676104235f?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&auto=format&fit=crop"
    ]
  },
  {
    "slug": "trek-series-annapurna",
    "seriesLabel": "trek series",
    "bookType": "custom photobook",
    "title": "custom photobook",
    "displayName": "Annapurna Base Camp Sanctuary",
    "tagline": "snowbound amphitheaters & rhododendron ridge",
    "subtitle": "From Pokhara to 4,130m Machapuchare Base",
    "description": "High-altitude Himalayan trekking memories with wide panoramic spreads and rugged glacial photography.",
    "category": "Trek",
    "tags": [
      "trek",
      "trekking",
      "annapurna",
      "himalayas",
      "mountains",
      "nepal",
      "adventure",
      "snow",
      "glacier"
    ],
    "pageOptions": [
      12,
      24,
      32,
      60,
      120
    ],
    "coverImage": "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop",
    "coverColor": "#5B7B88",
    "spineText": "ANNAPURNA",
    "rating": 5,
    "reviewCount": 112,
    "fromPrice": 1999,
    "pricing": {
      "10": 2499,
      "8.25": 1999
    },
    "basePages": 32,
    "maxPhotos": 120,
    "badge": "bestseller",
    "priority": 90,
    "featured": true,
    "templatePhotos": [
      "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&auto=format&fit=crop"
    ]
  },
  {
    "slug": "travel-series-munnar",
    "seriesLabel": "travel series",
    "bookType": "custom photobook",
    "title": "custom photobook",
    "displayName": "Munnar Emerald Hills",
    "tagline": "rolling tea gardens & misty morning ridge",
    "subtitle": "Idukki Western Ghats Highlands",
    "description": "Immaculately contoured tea terraces, waterfall valleys, and mountain bungalow getaways.",
    "category": "Travel",
    "tags": [
      "munnar",
      "tea",
      "kerala",
      "hills",
      "western ghats",
      "anamudi",
      "mist",
      "greenery"
    ],
    "pageOptions": [
      12,
      24,
      32,
      60,
      120
    ],
    "coverImage": "https://images.unsplash.com/photo-1588416936097-41850ab3d86d?w=800&auto=format&fit=crop",
    "coverColor": "#52796F",
    "spineText": "MUNNAR",
    "rating": 4.8,
    "reviewCount": 79,
    "fromPrice": 1999,
    "pricing": {
      "10": 2499,
      "8.25": 1999
    },
    "basePages": 32,
    "maxPhotos": 120,
    "badge": "",
    "priority": 88,
    "featured": true,
    "templatePhotos": [
      "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1511497584788-87676104235f?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800&auto=format&fit=crop"
    ]
  },
  {
    "slug": "travel-series-ladakh",
    "seriesLabel": "travel series",
    "bookType": "custom photobook",
    "title": "custom photobook",
    "displayName": "Ladakh Moonland & Monasteries",
    "tagline": "pangong tso blue & khardung la pass",
    "subtitle": "The Great Himalayan Motorcycle Roadtrip",
    "description": "High altitude salt lakes, whitewashed gompas, and stark barren mountainscapes.",
    "category": "Travel",
    "tags": [
      "ladakh",
      "leh",
      "pangong",
      "nubra",
      "khardung la",
      "road trip",
      "monastery",
      "high altitude",
      "adventure"
    ],
    "pageOptions": [
      12,
      24,
      32,
      60,
      120
    ],
    "coverImage": "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800&auto=format&fit=crop",
    "coverColor": "#48639C",
    "spineText": "LADAKH",
    "rating": 5,
    "reviewCount": 160,
    "fromPrice": 1999,
    "pricing": {
      "10": 2499,
      "8.25": 1999
    },
    "basePages": 32,
    "maxPhotos": 120,
    "badge": "bestseller",
    "priority": 86,
    "featured": true,
    "templatePhotos": [
      "https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800&auto=format&fit=crop"
    ]
  },
  {
    "slug": "trek-series-kedarkantha",
    "seriesLabel": "trek series",
    "bookType": "custom photobook",
    "title": "custom photobook",
    "displayName": "Kedarkantha Winter Snow Trek",
    "tagline": "frozen alpine lakes & pine forest snow",
    "subtitle": "Garhwal Himalayas Winter Summit",
    "description": "Stunning white snowscapes, campfire night skies, and sunrise summit panoramas.",
    "category": "Trek",
    "tags": [
      "trek",
      "trekking",
      "kedarkantha",
      "uttarakhand",
      "snow",
      "winter trek",
      "sankri",
      "camping",
      "summit"
    ],
    "pageOptions": [
      12,
      24,
      32,
      60,
      120
    ],
    "coverImage": "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=800&auto=format&fit=crop",
    "coverColor": "#778DA9",
    "spineText": "KEDARKANTHA",
    "rating": 5,
    "reviewCount": 130,
    "fromPrice": 1999,
    "pricing": {
      "10": 2499,
      "8.25": 1999
    },
    "basePages": 32,
    "maxPhotos": 120,
    "badge": "bestseller",
    "priority": 84,
    "featured": true,
    "templatePhotos": [
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop"
    ]
  },
  {
    "slug": "travel-series-rajasthan",
    "seriesLabel": "travel series",
    "bookType": "custom photobook",
    "title": "custom photobook",
    "displayName": "Rajasthan Land of Kings",
    "tagline": "amber forts, blue cities & golden sand dunes",
    "subtitle": "Jaipur, Jodhpur, Udaipur & Jaisalmer",
    "description": "Intricate marble jali screens, grand palace courtyards, and vibrant desert sunsets.",
    "category": "Travel",
    "tags": [
      "rajasthan",
      "jaipur",
      "udaipur",
      "jodhpur",
      "jaisalmer",
      "forts",
      "palaces",
      "desert",
      "royalty",
      "heritage"
    ],
    "pageOptions": [
      12,
      24,
      32,
      60,
      120
    ],
    "coverImage": "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800&auto=format&fit=crop",
    "coverColor": "#C85A32",
    "spineText": "RAJASTHAN",
    "rating": 5,
    "reviewCount": 124,
    "fromPrice": 1999,
    "pricing": {
      "10": 2499,
      "8.25": 1999
    },
    "basePages": 32,
    "maxPhotos": 120,
    "badge": "popular",
    "priority": 82,
    "featured": true,
    "templatePhotos": [
      "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1477587458883-47145ed94245?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop"
    ]
  },
  {
    "slug": "trek-series-valley-of-flowers",
    "seriesLabel": "trek series",
    "bookType": "custom photobook",
    "title": "custom photobook",
    "displayName": "Valley of Flowers UNESCO Trek",
    "tagline": "hundreds of alpine blooms in monsoon mist",
    "subtitle": "Nanda Devi Biosphere Reserve",
    "description": "Macro floral shots and towering glacier backdrops presented in rich archival detail.",
    "category": "Trek",
    "tags": [
      "trek",
      "trekking",
      "valley of flowers",
      "chamoli",
      "uttarakhand",
      "hemkund",
      "flowers",
      "unesco",
      "nature"
    ],
    "pageOptions": [
      12,
      24,
      32,
      60,
      120
    ],
    "coverImage": "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800&auto=format&fit=crop",
    "coverColor": "#A37081",
    "spineText": "FLOWERS",
    "rating": 4.9,
    "reviewCount": 65,
    "fromPrice": 1999,
    "pricing": {
      "10": 2499,
      "8.25": 1999
    },
    "basePages": 32,
    "maxPhotos": 120,
    "badge": "",
    "priority": 80,
    "featured": false,
    "templatePhotos": [
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1511497584788-87676104235f?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&auto=format&fit=crop"
    ]
  },
  {
    "slug": "travel-series-goa",
    "seriesLabel": "travel series",
    "bookType": "custom photobook",
    "title": "custom photobook",
    "displayName": "Goa Golden Shores",
    "tagline": "sun-drenched beaches & portuguese tiles",
    "subtitle": "Coastal Sunshine & Susegad Lifestyle",
    "description": "Chilled oceanfront shacks, colonial villas, and pastel seaside horizons.",
    "category": "Travel",
    "tags": [
      "goa",
      "beach",
      "sunset",
      "palolem",
      "anjuna",
      "coastal",
      "cafes",
      "sea",
      "vacation"
    ],
    "pageOptions": [
      12,
      24,
      32,
      60,
      120
    ],
    "coverImage": "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&auto=format&fit=crop",
    "coverColor": "#F2BB05",
    "spineText": "GOA",
    "rating": 4.9,
    "reviewCount": 140,
    "fromPrice": 1999,
    "pricing": {
      "10": 2499,
      "8.25": 1999
    },
    "basePages": 32,
    "maxPhotos": 120,
    "badge": "bestseller",
    "priority": 78,
    "featured": true,
    "templatePhotos": [
      "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=800&auto=format&fit=crop"
    ]
  },
  {
    "slug": "travel-series-varanasi",
    "seriesLabel": "travel series",
    "bookType": "custom photobook",
    "title": "custom photobook",
    "displayName": "Varanasi Eternal Ganga",
    "tagline": "morning boat rides & evening maha aarti",
    "subtitle": "The Ancient City of Ghats",
    "description": "Timeless spiritual rituals, brass lamps reflecting off the sacred river, and labyrinth alleys.",
    "category": "Travel",
    "tags": [
      "varanasi",
      "banaras",
      "kashi",
      "ganga",
      "aarti",
      "ghats",
      "spiritual",
      "heritage",
      "india"
    ],
    "pageOptions": [
      12,
      24,
      32,
      60,
      120
    ],
    "coverImage": "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=800&auto=format&fit=crop",
    "coverColor": "#D48C46",
    "spineText": "VARANASI",
    "rating": 4.9,
    "reviewCount": 84,
    "fromPrice": 1999,
    "pricing": {
      "10": 2499,
      "8.25": 1999
    },
    "basePages": 32,
    "maxPhotos": 120,
    "badge": "",
    "priority": 76,
    "featured": false,
    "templatePhotos": [
      "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1477587458883-47145ed94245?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&auto=format&fit=crop"
    ]
  },
  {
    "slug": "trek-series-chadar",
    "seriesLabel": "trek series",
    "bookType": "custom photobook",
    "title": "custom photobook",
    "displayName": "Chadar Frozen Zanskar Trek",
    "tagline": "walking on sub-zero river ice & canyon walls",
    "subtitle": "Zanskar Gorge Winter Expedition",
    "description": "Dramatic ice blue formations, frozen waterfalls, and the sheer grit of Himalayan winter.",
    "category": "Trek",
    "tags": [
      "trek",
      "trekking",
      "chadar",
      "zanskar",
      "ladakh",
      "frozen river",
      "ice",
      "winter",
      "leh",
      "extreme"
    ],
    "pageOptions": [
      12,
      24,
      32,
      60,
      120
    ],
    "coverImage": "https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?w=800&auto=format&fit=crop",
    "coverColor": "#B8D0EB",
    "spineText": "CHADAR",
    "rating": 5,
    "reviewCount": 67,
    "fromPrice": 2499,
    "pricing": {
      "10": 2999,
      "8.25": 2499
    },
    "basePages": 32,
    "maxPhotos": 120,
    "badge": "new",
    "priority": 74,
    "featured": true,
    "templatePhotos": [
      "https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop"
    ]
  },
  {
    "slug": "trek-series-hampta-pass",
    "seriesLabel": "trek series",
    "bookType": "custom photobook",
    "title": "custom photobook",
    "displayName": "Hampta Pass Ridge Crossover",
    "tagline": "green kullu valleys into desert spiti mountains",
    "subtitle": "Manali to Chandra Taal Trail",
    "description": "Contrasting green and desert landscapes connected across a dramatic 14,000 ft pass.",
    "category": "Trek",
    "tags": [
      "trek",
      "trekking",
      "hampta pass",
      "manali",
      "spiti",
      "chhatru",
      "himachal",
      "pass",
      "adventure"
    ],
    "pageOptions": [
      12,
      24,
      32,
      60,
      120
    ],
    "coverImage": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop",
    "coverColor": "#8C6057",
    "spineText": "HAMPTA PASS",
    "rating": 4.9,
    "reviewCount": 82,
    "fromPrice": 1999,
    "pricing": {
      "10": 2499,
      "8.25": 1999
    },
    "basePages": 32,
    "maxPhotos": 120,
    "badge": "",
    "priority": 72,
    "featured": false,
    "templatePhotos": [
      "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&auto=format&fit=crop"
    ]
  },
  {
    "slug": "travel-series-rishikesh",
    "seriesLabel": "travel series",
    "bookType": "custom photobook",
    "title": "custom photobook",
    "displayName": "Rishikesh River Retreat",
    "tagline": "white water rapids & himalayan serenity",
    "subtitle": "Yoga Capital on the Holy River",
    "description": "Suspension bridge vistas, cliffside meditation retreats, and outdoor adventure moments.",
    "category": "Travel",
    "tags": [
      "rishikesh",
      "yoga",
      "rafting",
      "ganga",
      "uttarakhand",
      "himalayan foothills",
      "adventure",
      "spiritual"
    ],
    "pageOptions": [
      12,
      24,
      32,
      60,
      120
    ],
    "coverImage": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop",
    "coverColor": "#588157",
    "spineText": "RISHIKESH",
    "rating": 4.8,
    "reviewCount": 68,
    "fromPrice": 1999,
    "pricing": {
      "10": 2499,
      "8.25": 1999
    },
    "basePages": 32,
    "maxPhotos": 120,
    "badge": "",
    "priority": 70,
    "featured": false,
    "templatePhotos": [
      "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1511497584788-87676104235f?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800&auto=format&fit=crop"
    ]
  },
  {
    "slug": "travel-series-hampi",
    "seriesLabel": "travel series",
    "bookType": "custom photobook",
    "title": "custom photobook",
    "displayName": "Hampi Forgotten Empire",
    "tagline": "granite boulders & stone chariot legends",
    "subtitle": "Vijayanagara UNESCO World Heritage",
    "description": "Monumental rock temples, palm-lined rivers, and sunsets over ancient boulder hills.",
    "category": "Travel",
    "tags": [
      "hampi",
      "vijayanagara",
      "karnataka",
      "ruins",
      "unesco",
      "boulders",
      "stone chariot",
      "history",
      "architecture"
    ],
    "pageOptions": [
      12,
      24,
      32,
      60,
      120
    ],
    "coverImage": "https://images.unsplash.com/photo-1600100397608-f010f443900a?w=800&auto=format&fit=crop",
    "coverColor": "#C49265",
    "spineText": "HAMPI",
    "rating": 4.9,
    "reviewCount": 77,
    "fromPrice": 1999,
    "pricing": {
      "10": 2499,
      "8.25": 1999
    },
    "basePages": 32,
    "maxPhotos": 120,
    "badge": "",
    "priority": 68,
    "featured": false,
    "templatePhotos": [
      "https://images.unsplash.com/photo-1600100397608-f010f44383aa?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1477587458883-47145ed94245?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&auto=format&fit=crop"
    ]
  },
  {
    "slug": "trek-series-roopkund",
    "seriesLabel": "trek series",
    "bookType": "custom photobook",
    "title": "custom photobook",
    "displayName": "Roopkund Alpine Glacier",
    "tagline": "ali bedni bugyal & trishul mountain vistas",
    "subtitle": "Chamoli Garhwal Alpine Expedition",
    "description": "Endless high-altitude green meadows framed by snow-covered Himalayan giants.",
    "category": "Trek",
    "tags": [
      "trek",
      "trekking",
      "roopkund",
      "uttarakhand",
      "mystery lake",
      "glacier",
      "bugyal",
      "trishul"
    ],
    "pageOptions": [
      12,
      24,
      32,
      60,
      120
    ],
    "coverImage": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop",
    "coverColor": "#6C757D",
    "spineText": "ROOPKUND",
    "rating": 4.8,
    "reviewCount": 54,
    "fromPrice": 1999,
    "pricing": {
      "10": 2499,
      "8.25": 1999
    },
    "basePages": 32,
    "maxPhotos": 120,
    "badge": "",
    "priority": 66,
    "featured": false,
    "templatePhotos": [
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop"
    ]
  },
  {
    "slug": "travel-series-spiti",
    "seriesLabel": "travel series",
    "bookType": "custom photobook",
    "title": "custom photobook",
    "displayName": "Spiti Valley Stark Beauty",
    "tagline": "the middle land between earth & sky",
    "subtitle": "Key Monastery & Pin Valley Roadtrip",
    "description": "Ancient cliffhanging monasteries, dramatic geological folds, and milky way nightscapes.",
    "category": "Travel",
    "tags": [
      "spiti",
      "kaza",
      "key monastery",
      "himachal",
      "road trip",
      "cold desert",
      "himalayas",
      "adventure"
    ],
    "pageOptions": [
      12,
      24,
      32,
      60,
      120
    ],
    "coverImage": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop",
    "coverColor": "#6D6875",
    "spineText": "SPITI",
    "rating": 5,
    "reviewCount": 95,
    "fromPrice": 1999,
    "pricing": {
      "10": 2499,
      "8.25": 1999
    },
    "basePages": 32,
    "maxPhotos": 120,
    "badge": "popular",
    "priority": 64,
    "featured": true,
    "templatePhotos": [
      "https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop"
    ]
  },
  {
    "slug": "trek-series-sandakphu",
    "seriesLabel": "trek series",
    "bookType": "custom photobook",
    "title": "custom photobook",
    "displayName": "Sandakphu Sleeping Buddha",
    "tagline": "everest & kanchenjunga ridge trail",
    "subtitle": "Singalila National Park Trek",
    "description": "Unobstructed vistas of the world’s highest peaks towering over cloud inversions.",
    "category": "Trek",
    "tags": [
      "trek",
      "trekking",
      "sandakphu",
      "darjeeling",
      "kanchenjunga",
      "everest",
      "bengal",
      "ridge"
    ],
    "pageOptions": [
      12,
      24,
      32,
      60,
      120
    ],
    "coverImage": "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop",
    "coverColor": "#DDA15E",
    "spineText": "SANDAKPHU",
    "rating": 4.9,
    "reviewCount": 71,
    "fromPrice": 1999,
    "pricing": {
      "10": 2499,
      "8.25": 1999
    },
    "basePages": 32,
    "maxPhotos": 120,
    "badge": "",
    "priority": 62,
    "featured": false,
    "templatePhotos": [
      "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop"
    ]
  },
  {
    "slug": "travel-series-meghalaya",
    "seriesLabel": "travel series",
    "bookType": "custom photobook",
    "title": "custom photobook",
    "displayName": "Meghalaya Abode of Clouds",
    "tagline": "living root bridges & crystal rivers",
    "subtitle": "Cherrapunji & Dawki Border Expedition",
    "description": "Bio-engineering marvels, thundering limestone waterfalls, and emerald transparent boat rides.",
    "category": "Travel",
    "tags": [
      "meghalaya",
      "cherrapunji",
      "shillong",
      "living root bridge",
      "dawki",
      "waterfalls",
      "nature",
      "northeast"
    ],
    "pageOptions": [
      12,
      24,
      32,
      60,
      120
    ],
    "coverImage": "https://images.unsplash.com/photo-1511497584788-87676104235f?w=800&auto=format&fit=crop",
    "coverColor": "#2D5A46",
    "spineText": "MEGHALAYA",
    "rating": 4.9,
    "reviewCount": 62,
    "fromPrice": 1999,
    "pricing": {
      "10": 2499,
      "8.25": 1999
    },
    "basePages": 32,
    "maxPhotos": 120,
    "badge": "",
    "priority": 60,
    "featured": false,
    "templatePhotos": [
      "https://images.unsplash.com/photo-1511497584788-87676104235f?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=800&auto=format&fit=crop"
    ]
  },
  {
    "slug": "travel-series-andaman",
    "seriesLabel": "travel series",
    "bookType": "custom photobook",
    "title": "custom photobook",
    "displayName": "Andaman Turquoise Waters",
    "tagline": "swaraj dweep white sands & coral reefs",
    "subtitle": "Havelock & Neil Island Escapes",
    "description": "Crystal-clear tropical tides, bioluminescence night kayak memories, and powder white beaches.",
    "category": "Travel",
    "tags": [
      "andaman",
      "havelock",
      "radhanagar",
      "coral",
      "scuba",
      "islands",
      "indianocean",
      "beach",
      "honeymoon"
    ],
    "pageOptions": [
      12,
      24,
      32,
      60,
      120
    ],
    "coverImage": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop",
    "coverColor": "#2A9D8F",
    "spineText": "ANDAMAN",
    "rating": 5,
    "reviewCount": 110,
    "fromPrice": 1999,
    "pricing": {
      "10": 2499,
      "8.25": 1999
    },
    "basePages": 32,
    "maxPhotos": 120,
    "badge": "popular",
    "priority": 58,
    "featured": true,
    "templatePhotos": [
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&auto=format&fit=crop"
    ]
  },
  {
    "slug": "first-anniversary",
    "seriesLabel": "anniversary series",
    "bookType": "custom photobook",
    "title": "custom photobook",
    "displayName": "Our 1st Anniversary Keepsake",
    "tagline": "years of love, timelessly bound",
    "subtitle": "Celebrating 365 days of laughter and milestones",
    "description": "Romantic layout templates for couples with rose gold accents and intimate framing.",
    "category": "Anniversary",
    "tags": [
      "anniversary",
      "love",
      "couples",
      "wedding",
      "romance",
      "relationship",
      "celebration"
    ],
    "pageOptions": [
      12,
      24,
      32,
      60,
      120
    ],
    "coverImage": "https://images.unsplash.com/photo-1529636798458-92182e662485?w=800&auto=format&fit=crop",
    "coverColor": "#E8C5C8",
    "spineText": "CHAPTER ONE",
    "rating": 5,
    "reviewCount": 96,
    "fromPrice": 1999,
    "pricing": {
      "10": 2499,
      "8.25": 1999
    },
    "basePages": 32,
    "maxPhotos": 120,
    "badge": "new",
    "priority": 56,
    "featured": true,
    "templatePhotos": [
      "https://images.unsplash.com/photo-1529636798458-92182e662485?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?w=800&auto=format&fit=crop"
    ]
  },
  {
    "slug": "travel-series-paris",
    "seriesLabel": "travel series",
    "bookType": "custom photobook",
    "title": "custom photobook",
    "displayName": "Paris Journey Hardcover",
    "tagline": "your journeys, perfectly told",
    "subtitle": "Eiffel Tower & Parisian Cafes",
    "description": "Minimalist editorial layouts with bold typography and iconic architectural framing.",
    "category": "Travel",
    "tags": [
      "paris",
      "france",
      "europe",
      "city",
      "architecture",
      "eiffel",
      "romantic"
    ],
    "pageOptions": [
      12,
      24,
      32,
      60,
      120
    ],
    "coverImage": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop",
    "coverColor": "#F8BAC7",
    "spineText": "PARIS",
    "rating": 5,
    "reviewCount": 72,
    "fromPrice": 1999,
    "pricing": {
      "10": 2499,
      "8.25": 1999
    },
    "basePages": 32,
    "maxPhotos": 120,
    "badge": "bestseller",
    "priority": 54,
    "featured": true,
    "templatePhotos": [
      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1509299349698-dd22323b5963?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1471623432079-b009d30b6729?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1520939817895-060bdef4dc1b?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=800&auto=format&fit=crop"
    ]
  },
  {
    "slug": "travel-series-kyoto",
    "seriesLabel": "travel series",
    "bookType": "custom photobook",
    "title": "custom photobook",
    "displayName": "Kyoto Zen Temples",
    "tagline": "tranquil bamboo & torii shrine gates",
    "subtitle": "Autumn maples and temple corridors",
    "description": "Serene Japanese aesthetics with plenty of white space, bamboo textures, and balanced spreads.",
    "category": "Travel",
    "tags": [
      "kyoto",
      "japan",
      "zen",
      "temples",
      "shrines",
      "asia",
      "culture"
    ],
    "pageOptions": [
      12,
      24,
      32,
      60,
      120
    ],
    "coverImage": "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&auto=format&fit=crop",
    "coverColor": "#A8C3A0",
    "spineText": "KYOTO",
    "rating": 5,
    "reviewCount": 84,
    "fromPrice": 1999,
    "pricing": {
      "10": 2499,
      "8.25": 1999
    },
    "basePages": 32,
    "maxPhotos": 120,
    "badge": "popular",
    "priority": 52,
    "featured": true,
    "templatePhotos": [
      "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1528164344705-475426879c0d?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop"
    ]
  },
  {
    "slug": "travel-series-italy",
    "seriesLabel": "travel series",
    "bookType": "custom photobook",
    "title": "custom photobook",
    "displayName": "Italy Amalfi Coast & Tuscany",
    "tagline": "lemon groves, positano cliffs & vintage vespas",
    "subtitle": "La Dolce Vita Coastline Tour",
    "description": "Terracotta roofs, turquoise Mediterranean waters, and warm golden hour portraits.",
    "category": "Travel",
    "tags": [
      "italy",
      "amalfi",
      "positano",
      "tuscany",
      "rome",
      "florence",
      "mediterranean"
    ],
    "pageOptions": [
      12,
      24,
      32,
      60,
      120
    ],
    "coverImage": "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&auto=format&fit=crop",
    "coverColor": "#B8C1A0",
    "spineText": "ITALY",
    "rating": 5,
    "reviewCount": 104,
    "fromPrice": 1999,
    "pricing": {
      "10": 2499,
      "8.25": 1999
    },
    "basePages": 32,
    "maxPhotos": 120,
    "badge": "bestseller",
    "priority": 50,
    "featured": true,
    "templatePhotos": [
      "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1523906834658-6e2b32c840bf?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1529260830199-42c24126f198?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&auto=format&fit=crop"
    ]
  },
  {
    "slug": "travel-series-london",
    "seriesLabel": "travel series",
    "bookType": "custom photobook",
    "title": "custom photobook",
    "displayName": "London Big Ben & Thames",
    "tagline": "red double deckers, fog & royal parks",
    "subtitle": "Classic British Metropolis Stories",
    "description": "Heritage architectural photography, crisp black-and-white accents, and refined typography.",
    "category": "Travel",
    "tags": [
      "london",
      "uk",
      "thames",
      "bigben",
      "england",
      "city",
      "urban"
    ],
    "pageOptions": [
      12,
      24,
      32,
      60,
      120
    ],
    "coverImage": "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&auto=format&fit=crop",
    "coverColor": "#7E8B9B",
    "spineText": "LONDON",
    "rating": 4.8,
    "reviewCount": 47,
    "fromPrice": 1999,
    "pricing": {
      "10": 2499,
      "8.25": 1999
    },
    "basePages": 32,
    "maxPhotos": 120,
    "badge": "",
    "priority": 48,
    "featured": false,
    "templatePhotos": [
      "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1526129318478-62ed807ebdf9?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop"
    ]
  },
  {
    "slug": "travel-series-greece",
    "seriesLabel": "travel series",
    "bookType": "custom photobook",
    "title": "custom photobook",
    "displayName": "Greece Aegean Nazar",
    "tagline": "whitewashed domes, olive oils & nazar blue",
    "subtitle": "Santorini & Mykonos Cyclades Island Tour",
    "description": "Cobalt blue domes and blinding white cliffs offset by deep blue Aegean horizons.",
    "category": "Travel",
    "tags": [
      "greece",
      "santorini",
      "mykonos",
      "aegean",
      "islands",
      "cyclades",
      "white domes"
    ],
    "pageOptions": [
      12,
      24,
      32,
      60,
      120
    ],
    "coverImage": "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&auto=format&fit=crop",
    "coverColor": "#89A6B2",
    "spineText": "GREECE",
    "rating": 5,
    "reviewCount": 88,
    "fromPrice": 1999,
    "pricing": {
      "10": 2499,
      "8.25": 1999
    },
    "basePages": 32,
    "maxPhotos": 120,
    "badge": "popular",
    "priority": 46,
    "featured": true,
    "templatePhotos": [
      "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&auto=format&fit=crop"
    ]
  },
  {
    "slug": "travel-series-newyork",
    "seriesLabel": "travel series",
    "bookType": "custom photobook",
    "title": "custom photobook",
    "displayName": "New York Midnight Empire",
    "tagline": "broadway marquees & central park greens",
    "subtitle": "Manhattan Skyline & Brooklyn Bridges",
    "description": "Vertical skylines, yellow cabs, and dynamic street photography in editorial layouts.",
    "category": "Travel",
    "tags": [
      "newyork",
      "nyc",
      "manhattan",
      "brooklyn",
      "skyline",
      "usa",
      "city"
    ],
    "pageOptions": [
      12,
      24,
      32,
      60,
      120
    ],
    "coverImage": "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&auto=format&fit=crop",
    "coverColor": "#6D7993",
    "spineText": "NEW YORK",
    "rating": 4.9,
    "reviewCount": 66,
    "fromPrice": 1999,
    "pricing": {
      "10": 2499,
      "8.25": 1999
    },
    "basePages": 32,
    "maxPhotos": 120,
    "badge": "",
    "priority": 44,
    "featured": false,
    "templatePhotos": [
      "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&auto=format&fit=crop"
    ]
  },
  {
    "slug": "travel-series-bali",
    "seriesLabel": "travel series",
    "bookType": "custom photobook",
    "title": "custom photobook",
    "displayName": "Bali Tropical Escapes",
    "tagline": "jungle villas, rice terraces & temple gates",
    "subtitle": "Island of the Gods",
    "description": "Warm tropical hues, palm tree framing, and relaxing ocean spreads.",
    "category": "Travel",
    "tags": [
      "bali",
      "indonesia",
      "beach",
      "surf",
      "ubud",
      "tropical",
      "temples"
    ],
    "pageOptions": [
      12,
      24,
      32,
      60,
      120
    ],
    "coverImage": "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&auto=format&fit=crop",
    "coverColor": "#C47B5A",
    "spineText": "BALI",
    "rating": 4.9,
    "reviewCount": 68,
    "fromPrice": 1999,
    "pricing": {
      "10": 2499,
      "8.25": 1999
    },
    "basePages": 32,
    "maxPhotos": 120,
    "badge": "",
    "priority": 42,
    "featured": false,
    "templatePhotos": [
      "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&auto=format&fit=crop"
    ]
  },
  {
    "slug": "travel-series-japan",
    "seriesLabel": "travel series",
    "bookType": "custom photobook",
    "title": "custom photobook",
    "displayName": "Japan Cherry Blossoms",
    "tagline": "sakura springs, tokyo neon & bullet trains",
    "subtitle": "Tokyo to Mount Fuji Exploration",
    "description": "Delicate pink palettes, bold kanji-inspired spine designs, and crisp modern spreads.",
    "category": "Travel",
    "tags": [
      "japan",
      "tokyo",
      "sakura",
      "fuji",
      "blossoms",
      "neon",
      "asia"
    ],
    "pageOptions": [
      12,
      24,
      32,
      60,
      120
    ],
    "coverImage": "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop",
    "coverColor": "#F5C5C0",
    "spineText": "JAPAN",
    "rating": 5,
    "reviewCount": 96,
    "fromPrice": 1999,
    "pricing": {
      "10": 2499,
      "8.25": 1999
    },
    "basePages": 32,
    "maxPhotos": 120,
    "badge": "bestseller",
    "priority": 40,
    "featured": true,
    "templatePhotos": [
      "https://images.unsplash.com/photo-1528164344705-475426879c0d?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop"
    ]
  },
  {
    "slug": "travel-series-rome",
    "seriesLabel": "travel series",
    "bookType": "custom photobook",
    "title": "custom photobook",
    "displayName": "Rome Eternal City",
    "tagline": "colosseum arches & trevi fountain pennies",
    "subtitle": "Historic Vatican & Piazza Navona Walk",
    "description": "Warm travertine stone textures, espresso cafe moments, and ancient ruin spreads.",
    "category": "Travel",
    "tags": [
      "rome",
      "italy",
      "colosseum",
      "vatican",
      "trevi",
      "architecture",
      "ancient"
    ],
    "pageOptions": [
      12,
      24,
      32,
      60,
      120
    ],
    "coverImage": "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&auto=format&fit=crop",
    "coverColor": "#DDD3C1",
    "spineText": "ROME",
    "rating": 4.8,
    "reviewCount": 52,
    "fromPrice": 1999,
    "pricing": {
      "10": 2499,
      "8.25": 1999
    },
    "basePages": 32,
    "maxPhotos": 120,
    "badge": "",
    "priority": 38,
    "featured": false,
    "templatePhotos": [
      "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1523906834658-6e2b32c840bf?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1529260830199-42c24126f198?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop"
    ]
  },
  {
    "slug": "travel-series-europe",
    "seriesLabel": "travel series",
    "bookType": "custom photobook",
    "title": "custom photobook",
    "displayName": "Europe Grand Tour",
    "tagline": "wanderlust baggage & cobblestone rails",
    "subtitle": "Across the Old World continent",
    "description": "Multi-destination travel memories preserved in vintage luggage-inspired editorial spreads.",
    "category": "Travel",
    "tags": [
      "europe",
      "eurotrip",
      "train",
      "architecture",
      "alps",
      "continental"
    ],
    "pageOptions": [
      12,
      24,
      32,
      60,
      120
    ],
    "coverImage": "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=800&auto=format&fit=crop",
    "coverColor": "#C9935B",
    "spineText": "EUROPE",
    "rating": 4.9,
    "reviewCount": 58,
    "fromPrice": 1999,
    "pricing": {
      "10": 2499,
      "8.25": 1999
    },
    "basePages": 32,
    "maxPhotos": 120,
    "badge": "",
    "priority": 36,
    "featured": false,
    "templatePhotos": [
      "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&auto=format&fit=crop"
    ]
  },
  {
    "slug": "moments-series-summer",
    "seriesLabel": "moments series",
    "bookType": "custom photobook",
    "title": "custom photobook",
    "displayName": "Summer 2026 Coastal Moments",
    "tagline": "your moments, forever kept",
    "subtitle": "Sunkissed skin and golden hour waves",
    "description": "Light, airy spreads celebrating warm weather, coastal trips, and candid smiles.",
    "category": "Moments",
    "tags": [
      "summer",
      "coastal",
      "beach",
      "family",
      "moments",
      "candid",
      "sunshine"
    ],
    "pageOptions": [
      12,
      24,
      32,
      60,
      120
    ],
    "coverImage": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop",
    "coverColor": "#F2DFCE",
    "spineText": "SUMMER 2026",
    "rating": 4.9,
    "reviewCount": 45,
    "fromPrice": 1999,
    "pricing": {
      "10": 2499,
      "8.25": 1999
    },
    "basePages": 32,
    "maxPhotos": 120,
    "badge": "new",
    "priority": 34,
    "featured": true,
    "templatePhotos": [
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&auto=format&fit=crop"
    ]
  },
  {
    "slug": "travel-edit-paris",
    "seriesLabel": "travel edit",
    "bookType": "custom magazine",
    "title": "custom magazine",
    "displayName": "The Paris Chapter Edit",
    "tagline": "your travels, front-page featured",
    "subtitle": "Softcover magazine with high-fashion typography",
    "description": "Magazine-style editorial spreads, full-bleed images, and sleek mastheads.",
    "category": "Magazines",
    "tags": [
      "magazine",
      "paris",
      "fashion",
      "editorial",
      "softcover",
      "modern"
    ],
    "pageOptions": [
      12,
      24,
      32,
      60,
      120
    ],
    "coverImage": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop",
    "coverColor": "#FFFFFF",
    "spineText": "ISSUE 04",
    "rating": 5,
    "reviewCount": 89,
    "fromPrice": 1499,
    "pricing": {
      "10": 1899,
      "8.25": 1499
    },
    "basePages": 32,
    "maxPhotos": 120,
    "badge": "trending",
    "priority": 32,
    "featured": true,
    "templatePhotos": [
      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1509299349698-dd22323b5963?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1471623432079-b009d30b6729?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1520939817895-060bdef4dc1b?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=800&auto=format&fit=crop"
    ]
  }
];
