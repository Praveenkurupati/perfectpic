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
  pdfUrl?: string;
  projectSnapshot?: any;
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

const getStoredCart = (): CartItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('pp_cart_items');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Discard legacy mock item if present
      return parsed.filter((item: any) => item && item.id !== 'item-1' && item.id !== 'item-default');
    }
    return [];
  } catch {
    return [];
  }
};

const saveCart = (items: CartItem[]) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('pp_cart_items', JSON.stringify(items));
    } catch {}
  }
};

export const useCartStore = create<CartState>((set, get) => ({
  items: getStoredCart(),
  promoCode: null,
  discount: 0,
  shipping: 0,
  packagingAddon: false,
  isGift: false,

  addItem: (item) => set((state) => {
    const existingIndex = state.items.findIndex(i => i.id === item.id);
    let newItems: CartItem[];
    if (existingIndex > -1) {
      newItems = state.items.map((it, idx) => 
        idx === existingIndex ? { ...it, quantity: (it.quantity || 1) + (item.quantity || 1) } : it
      );
    } else {
      newItems = [...state.items, { ...item, quantity: item.quantity || 1 }];
    }
    saveCart(newItems);
    return { items: newItems };
  }),

  removeItem: (id) => set((state) => {
    const newItems = state.items.filter(i => i.id !== id);
    saveCart(newItems);
    return { items: newItems };
  }),

  updateItem: (id, updates) => set((state) => {
    const newItems = state.items.map(i => i.id === id ? { ...i, ...updates } : i);
    saveCart(newItems);
    return { items: newItems };
  }),

  clearCart: () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('pp_cart_items');
      } catch {}
    }
    set({ items: [], packagingAddon: false, promoCode: null, discount: 0 });
  },

  applyPromoCode: (code) => {
    if (code && code.trim().toUpperCase() === 'WELCOME10') {
      set({ promoCode: 'WELCOME10', discount: 0.1 }); // 10% off
      return true;
    }
    return false;
  },

  setPackagingAddon: (enabled) => set({ packagingAddon: enabled }),
  setIsGift: (isGift) => set({ isGift }),
  
  getSubtotal: () => {
    const state = get();
    return state.items.reduce((total, item) => 
      total + (item.basePrice + (item.extraPagesPrice || 0)) * (item.quantity || 1), 0
    ) + (state.packagingAddon ? 499 : 0);
  },

  getTotal: () => {
    const state = get();
    const subtotal = state.getSubtotal();
    const discountAmount = subtotal * state.discount;
    return Math.max(0, subtotal - discountAmount + state.shipping);
  }
}));
