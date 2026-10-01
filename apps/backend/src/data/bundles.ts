// apps/backend/src/data/bundles.ts

export interface BundleTierItem {
  id?: string;
  bundleId: string;
  minQuantity: number;
  name: string;
  discountAmount: number;
  freeShipping: boolean;
  badge?: string;
  description: string;
  isActive: boolean;
  displayOrder: number;
}

export const defaultBundleTiers: BundleTierItem[] = [
  {
    bundleId: 'bundle-3',
    minQuantity: 3,
    name: '3 Books Pack',
    discountAmount: 300,
    freeShipping: true,
    badge: 'Popular',
    description: 'Save ₹300 off + Free All-India Shipping. Perfect for gifting parents and in-laws.',
    isActive: true,
    displayOrder: 1,
  },
  {
    bundleId: 'bundle-6',
    minQuantity: 6,
    name: '6 Books Pack',
    discountAmount: 1800,
    freeShipping: true,
    badge: 'Extended Family',
    description: 'Save ₹1,800 off + Free All-India Shipping. Ideal for vacations, trips, and family reunions.',
    isActive: true,
    displayOrder: 2,
  },
  {
    bundleId: 'bundle-12',
    minQuantity: 12,
    name: '12 Books Master Pack',
    discountAmount: 4500,
    freeShipping: true,
    badge: "Collector's Master",
    description: 'Save ₹4,500 off + Free All-India Shipping. Comprehensive heirloom edition for milestone weddings and annual chronicles.',
    isActive: true,
    displayOrder: 3,
  },
];
