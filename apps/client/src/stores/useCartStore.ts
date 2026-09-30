// apps/client/src/stores/useCartStore.ts
import { create } from 'zustand';
import { api } from '@/lib/api';
import { trackMetaAddToCart } from '@/lib/metaPixel';

export interface CartItem {
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

export interface AppliedPromo {
  code: string;
  promoId?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxDiscountAmount?: number | null;
  discountAmount: number;
  minOrderAmount?: number;
  description?: string;
  message?: string;
}

export interface PackagingAccessories {
  keepsakeBox: boolean; // ₹499
  giftWrap: boolean; // ₹199
  uvGlaze: boolean; // ₹249
  miniPolaroids: boolean; // ₹149
}

export const ACCESSORY_PRICES: Record<keyof PackagingAccessories, number> = {
  keepsakeBox: 499,
  giftWrap: 199,
  uvGlaze: 249,
  miniPolaroids: 149,
};

export const ACCESSORY_DETAILS = {
  keepsakeBox: {
    id: 'keepsakeBox' as keyof PackagingAccessories,
    title: 'Keepsake Velvet Presentation Box',
    price: 499,
    badge: 'Bestseller',
    description: 'Custom-fitted rigid presentation box with gold foil insignia and magnetic ribbon closure.',
    icon: '🎁',
  },
  giftWrap: {
    id: 'giftWrap' as keyof PackagingAccessories,
    title: 'Artisan Ribbon Wrap & Calligraphy Card',
    price: 199,
    badge: 'Gift Ready',
    description: 'Emerald green satin ribbon wrap with personalized handwritten calligraphy message.',
    icon: '🎀',
  },
  uvGlaze: {
    id: 'uvGlaze' as keyof PackagingAccessories,
    title: 'Archival UV Anti-Scratch Page Glaze',
    price: 249,
    badge: 'Recommended',
    description: 'Diamond clear micro-coating protecting every page against fingerprints, spills, and UV fading.',
    icon: '🛡️',
  },
  miniPolaroids: {
    id: 'miniPolaroids' as keyof PackagingAccessories,
    title: '10 Mini Polaroid Keepsake Prints',
    price: 149,
    badge: 'Popular',
    description: 'Pack of 10 retro square 2×3" photo prints on archival 300 GSM fine-art cotton cardstock.',
    icon: '📷',
  },
};

interface CartState {
  items: CartItem[];
  promoCode: string | null;
  discount: number; // Decimal fraction for backward compatibility (e.g. 0.2 for 20%)
  discountAmount: number; // Absolute discount in ₹ (e.g. 500)
  appliedPromo: AppliedPromo | null;
  shipping: number;
  packagingAddon: boolean;
  isGift: boolean;
  accessories: PackagingAccessories;
  
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, updates: Partial<CartItem>) => void;
  clearCart: () => void;
  
  applyPromoCode: (
    code: string,
    customerEmail?: string,
    userId?: string
  ) => Promise<{ success: boolean; message: string; discountAmount?: number }>;
  removePromoCode: () => void;
  
  setPackagingAddon: (enabled: boolean) => void;
  setIsGift: (isGift: boolean) => void;
  toggleAccessory: (key: keyof PackagingAccessories) => void;
  setAccessory: (key: keyof PackagingAccessories, enabled: boolean) => void;
  getAccessoriesTotal: () => number;
  
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

const DEFAULT_ACCESSORIES: PackagingAccessories = {
  keepsakeBox: false,
  giftWrap: false,
  uvGlaze: false,
  miniPolaroids: false,
};

const getStoredAccessories = (): PackagingAccessories => {
  if (typeof window === 'undefined') return { ...DEFAULT_ACCESSORIES };
  try {
    const raw = localStorage.getItem('pp_cart_accessories');
    if (raw) return { ...DEFAULT_ACCESSORIES, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT_ACCESSORIES };
};

const saveAccessories = (acc: PackagingAccessories) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('pp_cart_accessories', JSON.stringify(acc));
    } catch {}
  }
};

export const useCartStore = create<CartState>((set, get) => {
  const initialAccessories = getStoredAccessories();
  return {
    items: getStoredCart(),
    promoCode: null,
    discount: 0,
    discountAmount: 0,
    appliedPromo: null,
    shipping: 0,
    packagingAddon: initialAccessories.keepsakeBox,
    isGift: false,
    accessories: initialAccessories,

  addItem: (item) => {
    // Dispatch Meta AddToCart tracking
    try {
      trackMetaAddToCart({
        id: item.id || item.projectId,
        title: item.title,
        price: (item.basePrice || 1999) + (item.extraPagesPrice || 0),
        quantity: item.quantity || 1,
      });
    } catch {
      // ignore
    }

    set((state) => {
      const existingIndex = state.items.findIndex((i) => i.id === item.id);
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
    });
  },

  removeItem: (id) => set((state) => {
    const newItems = state.items.filter((i) => i.id !== id);
    saveCart(newItems);
    return { items: newItems };
  }),

  updateItem: (id, updates) => set((state) => {
    const newItems = state.items.map((i) => (i.id === id ? { ...i, ...updates } : i));
    saveCart(newItems);
    return { items: newItems };
  }),

  clearCart: () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('pp_cart_items');
      } catch {}
    }
    saveAccessories(DEFAULT_ACCESSORIES);
    set({
      items: [],
      packagingAddon: false,
      accessories: { ...DEFAULT_ACCESSORIES },
      promoCode: null,
      discount: 0,
      discountAmount: 0,
      appliedPromo: null,
    });
  },

  applyPromoCode: async (code: string, customerEmail?: string, userId?: string) => {
    const cleanCode = (code || '').trim().toUpperCase();
    if (!cleanCode) {
      return { success: false, message: 'Please enter a coupon code.' };
    }

    const subtotal = get().getSubtotal();
    if (subtotal <= 0) {
      return { success: false, message: 'Your cart is empty. Add a photobook before applying a coupon.' };
    }

    try {
      const res = await api.validatePromoCode({
        code: cleanCode,
        subtotal,
        customerEmail,
        userId,
      });

      if (res && res.valid) {
        set({
          promoCode: res.code,
          discount: res.discountType === 'percentage' ? res.discountValue / 100 : 0,
          discountAmount: res.discountAmount,
          appliedPromo: res,
        });

        return {
          success: true,
          message: res.message,
          discountAmount: res.discountAmount,
        };
      } else {
        return {
          success: false,
          message: res.message || 'Invalid promo code.',
        };
      }
    } catch (err: any) {
      // Local fallback for offline/development resilience
      if (cleanCode === 'LAUNCH20') {
        const calculatedDiscount = Math.min(Math.round(subtotal * 0.2), 600);
        const fallbackObj: AppliedPromo = {
          code: 'LAUNCH20',
          discountType: 'percentage',
          discountValue: 20,
          maxDiscountAmount: 600,
          discountAmount: calculatedDiscount,
          description: 'Launch 20% off',
          message: `Coupon 'LAUNCH20' applied! Saved ₹${calculatedDiscount}`,
        };
        set({
          promoCode: 'LAUNCH20',
          discount: 0.2,
          discountAmount: calculatedDiscount,
          appliedPromo: fallbackObj,
        });
        return { success: true, message: fallbackObj.message!, discountAmount: calculatedDiscount };
      }

      if (cleanCode === 'FESTIVAL500') {
        if (subtotal < 3000) {
          return { success: false, message: 'Minimum order amount of ₹3,000 required for FESTIVAL500.' };
        }
        const fallbackObj: AppliedPromo = {
          code: 'FESTIVAL500',
          discountType: 'fixed',
          discountValue: 500,
          discountAmount: 500,
          minOrderAmount: 3000,
          description: 'Festival ₹500 off',
          message: `Coupon 'FESTIVAL500' applied! Saved ₹500`,
        };
        set({
          promoCode: 'FESTIVAL500',
          discount: 0,
          discountAmount: 500,
          appliedPromo: fallbackObj,
        });
        return { success: true, message: fallbackObj.message!, discountAmount: 500 };
      }

      if (cleanCode === 'FIRSTPIC') {
        const fallbackObj: AppliedPromo = {
          code: 'FIRSTPIC',
          discountType: 'fixed',
          discountValue: 300,
          discountAmount: 300,
          minOrderAmount: 1999,
          description: 'First order ₹300 off',
          message: `Coupon 'FIRSTPIC' applied! Saved ₹300`,
        };
        set({
          promoCode: 'FIRSTPIC',
          discount: 0,
          discountAmount: 300,
          appliedPromo: fallbackObj,
        });
        return { success: true, message: fallbackObj.message!, discountAmount: 300 };
      }

      return {
        success: false,
        message: err.message || 'Failed to validate coupon code.',
      };
    }
  },

  removePromoCode: () => {
    set({
      promoCode: null,
      discount: 0,
      discountAmount: 0,
      appliedPromo: null,
    });
  },

  setPackagingAddon: (enabled) => {
    set((state) => {
      const updated = { ...state.accessories, keepsakeBox: enabled };
      saveAccessories(updated);
      return { packagingAddon: enabled, accessories: updated };
    });
  },
  
  setIsGift: (isGift) => set({ isGift }),

  toggleAccessory: (key) => {
    set((state) => {
      const updated = { ...state.accessories, [key]: !state.accessories[key] };
      saveAccessories(updated);
      return {
        accessories: updated,
        packagingAddon: updated.keepsakeBox,
      };
    });
  },

  setAccessory: (key, enabled) => {
    set((state) => {
      const updated = { ...state.accessories, [key]: enabled };
      saveAccessories(updated);
      return {
        accessories: updated,
        packagingAddon: updated.keepsakeBox,
      };
    });
  },

  getAccessoriesTotal: () => {
    const { accessories } = get();
    let total = 0;
    if (accessories?.keepsakeBox) total += ACCESSORY_PRICES.keepsakeBox;
    if (accessories?.giftWrap) total += ACCESSORY_PRICES.giftWrap;
    if (accessories?.uvGlaze) total += ACCESSORY_PRICES.uvGlaze;
    if (accessories?.miniPolaroids) total += ACCESSORY_PRICES.miniPolaroids;
    return total;
  },
  
  getSubtotal: () => {
    const state = get();
    const itemsTotal = state.items.reduce((total, item) => 
      total + (item.basePrice + (item.extraPagesPrice || 0)) * (item.quantity || 1), 0
    );
    return itemsTotal + state.getAccessoriesTotal();
  },

  getTotal: () => {
    const state = get();
    const subtotal = state.getSubtotal();
    const calculatedDiscount = state.discountAmount > 0 
      ? state.discountAmount 
      : subtotal * (state.discount || 0);

    return Math.max(0, subtotal - calculatedDiscount + state.shipping);
  },
};
});
