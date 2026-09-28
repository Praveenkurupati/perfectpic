import { create } from 'zustand';

interface CartItem {
  id: string;
  projectId: string;
  title: string;
  dimensions: string;
  pageCount: number;
  theme: string;
  basePrice: number;
  extraPagesPrice: number;
  thumbnail: string;
  quantity?: number;
}

interface CartState {
  items: CartItem[];
  promoCode: string | null;
  discount: number;
  shipping: number;
  packagingAddon: boolean;
  isGift: boolean;
  
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, updates: Partial<CartItem>) => void;
  clearCart: () => void;
  applyPromoCode: (code: string) => boolean;
  setPackagingAddon: (enabled: boolean) => void;
  setIsGift: (isGift: boolean) => void;
  
  getSubtotal: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [
    {
      id: 'item-1',
      projectId: 'proj-1',
      title: 'Our Wedding',
      dimensions: '10x10 Hardcover',
      pageCount: 32,
      theme: 'Classic Cream',
      basePrice: 2499,
      extraPagesPrice: 600, // 4 * 150
      thumbnail: 'https://images.unsplash.com/photo-1544928147-79a2dbc1f389?q=80&w=200&auto=format&fit=crop'
    }
  ],
  promoCode: null,
  discount: 0,
  shipping: 0,
  packagingAddon: false,
  isGift: false,

  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
  removeItem: (id) => set((state) => ({ items: state.items.filter(i => i.id !== id) })),
  updateItem: (id, updates) => set((state) => ({
    items: state.items.map(i => i.id === id ? { ...i, ...updates } : i)
  })),
  clearCart: () => set({ items: [] }),
  applyPromoCode: (code) => {
    if (code === 'WELCOME10') {
      set({ promoCode: code, discount: 0.1 }); // 10% off
      return true;
    }
    return false;
  },
  setPackagingAddon: (enabled) => set({ packagingAddon: enabled }),
  setIsGift: (isGift) => set({ isGift }),
  
  getSubtotal: () => {
    const state = get();
    return state.items.reduce((total, item) => total + item.basePrice + item.extraPagesPrice, 0) + (state.packagingAddon ? 499 : 0);
  },
  getTotal: () => {
    const state = get();
    const subtotal = state.getSubtotal();
    const discountAmount = subtotal * state.discount;
    return subtotal - discountAmount + state.shipping;
  }
}));
