// apps/backend/src/data/bundles.ts

export interface BundleTierItem {
  id?: string;
  bundleId: string;
  minQuantity: number;
  name: string;
  price: number;
  perBookPrice?: number;
  discountAmount: number;
  netPrice?: number;
  printCost?: number;
  shippingCost?: number;
  grossProfit?: number;
  marginPerBook?: number;
  marginPercentage?: number;
  freeShipping: boolean;
  badge?: string;
  description: string;
  isActive: boolean;
  displayOrder: number;
}

export const defaultBundleTiers: BundleTierItem[] = [
  {
    bundleId: 'bundle-1',
    minQuantity: 1,
    name: '1 Book (Single)',
    price: 1999,
    perBookPrice: 1999,
    discountAmount: 0,
    netPrice: 1738,
    printCost: 515,
    shippingCost: 110,
    grossProfit: 1113,
    marginPerBook: 1113,
    marginPercentage: 55.7,
    freeShipping: true,
    badge: 'Single',
    description: 'Our handcrafted archival single photobook, 8.25" × 8.25", 32 pages with archival lay-flat binding.',
    isActive: true,
    displayOrder: 1,
  },
  {
    bundleId: 'bundle-2',
    minQuantity: 2,
    name: '2 Books (Duo)',
    price: 3499,
    perBookPrice: 1750,
    discountAmount: 499,
    netPrice: 3042,
    printCost: 1030,
    shippingCost: 150,
    grossProfit: 1862,
    marginPerBook: 931,
    marginPercentage: 53.2,
    freeShipping: true,
    badge: 'Duo',
    description: 'Save ₹499 off + Free All-India Shipping. Perfect for gifting parents and in-laws or keeping a duplicate volume.',
    isActive: true,
    displayOrder: 2,
  },
  {
    bundleId: 'bundle-4',
    minQuantity: 4,
    name: '4 Books (Quartet)',
    price: 6399,
    perBookPrice: 1600,
    discountAmount: 1597,
    netPrice: 5563,
    printCost: 2060,
    shippingCost: 240,
    grossProfit: 3263,
    marginPerBook: 816,
    marginPercentage: 51.0,
    freeShipping: true,
    badge: 'Popular',
    description: 'Save ₹1,597 off + Free All-India Shipping. Ideal for family vacations, milestone gifts, and multi-home keepsakes.',
    isActive: true,
    displayOrder: 3,
  },
  {
    bundleId: 'bundle-6',
    minQuantity: 6,
    name: '6 Books (Collector)',
    price: 8999,
    perBookPrice: 1500,
    discountAmount: 2995,
    netPrice: 7823,
    printCost: 3090,
    shippingCost: 330,
    grossProfit: 4403,
    marginPerBook: 734,
    marginPercentage: 48.9,
    freeShipping: true,
    badge: 'Collector',
    description: 'Save ₹2,995 off + Free All-India Shipping. Our finest volume collection for large family gatherings, weddings, and annual archives.',
    isActive: true,
    displayOrder: 4,
  },
];
