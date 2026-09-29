import { create } from 'zustand';
import { api } from '@/lib/api';

export interface UserAddress {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  type: 'home' | 'office' | 'studio' | 'other';
  isDefault: boolean;
  createdAt?: string;
}

const DEFAULT_ADDRESSES: UserAddress[] = [
  {
    id: 'addr-default-1',
    fullName: 'Praveen Kumar',
    phone: '+91 98765 43210',
    addressLine1: 'Indiranagar 100ft Road, 4th Cross',
    addressLine2: 'Suite 204, Archival Heights',
    landmark: 'Near Metro Station',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560038',
    type: 'home',
    isDefault: true,
    createdAt: '2026-09-20T10:00:00.000Z'
  },
  {
    id: 'addr-default-2',
    fullName: 'Praveen Kumar (Creative Studio)',
    phone: '+91 98765 43210',
    addressLine1: 'Bandra West, Hill Road',
    addressLine2: 'Floor 3, Creative Studios',
    landmark: 'Opposite Mehboob Studio',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400050',
    type: 'studio',
    isDefault: false,
    createdAt: '2026-09-24T14:30:00.000Z'
  }
];

interface AddressState {
  addresses: UserAddress[];
  loading: boolean;
  error: string | null;
  selectedAddressId: string | null;

  loadAddresses: () => Promise<void>;
  addAddress: (addr: Omit<UserAddress, 'id' | 'createdAt'>) => Promise<UserAddress>;
  updateAddress: (id: string, addr: Partial<UserAddress>) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;
  setDefaultAddress: (id: string) => Promise<void>;
  selectAddress: (id: string | null) => void;
  getDefaultAddress: () => UserAddress | undefined;
}

const getStoredAddresses = (): UserAddress[] => {
  if (typeof window === 'undefined') return DEFAULT_ADDRESSES;
  try {
    const raw = localStorage.getItem('pp_user_addresses');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Failed to parse cached addresses:', e);
  }
  return DEFAULT_ADDRESSES;
};

const saveStoredAddresses = (list: UserAddress[]) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('pp_user_addresses', JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to save addresses to storage:', e);
    }
  }
};

export const useAddressStore = create<AddressState>((set, get) => ({
  addresses: getStoredAddresses(),
  loading: false,
  error: null,
  selectedAddressId: getStoredAddresses().find(a => a.isDefault)?.id || getStoredAddresses()[0]?.id || null,

  loadAddresses: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.getAddresses();
      if (res && res.addresses && res.addresses.length > 0) {
        saveStoredAddresses(res.addresses);
        set({
          addresses: res.addresses,
          selectedAddressId: res.addresses.find((a: any) => a.isDefault)?.id || res.addresses[0]?.id || null,
          loading: false
        });
        return;
      }
    } catch (err: any) {
      console.warn('API getAddresses fallback to local state:', err.message);
    }

    const current = getStoredAddresses();
    set({ addresses: current, loading: false });
  },

  addAddress: async (addr) => {
    set({ loading: true, error: null });
    let created: UserAddress | null = null;

    try {
      const res = await api.createAddress(addr);
      if (res && res.address) {
        created = res.address;
      }
    } catch (err: any) {
      console.warn('Failed to save address to server, saving locally:', err.message);
    }

    if (!created) {
      created = {
        ...addr,
        id: `addr-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
    }

    const currentList = get().addresses;
    let updatedList: UserAddress[];

    if (addr.isDefault || currentList.length === 0) {
      updatedList = [
        { ...created, isDefault: true },
        ...currentList.map(a => ({ ...a, isDefault: false }))
      ];
    } else {
      updatedList = [created, ...currentList];
    }

    saveStoredAddresses(updatedList);
    set({
      addresses: updatedList,
      selectedAddressId: created.id,
      loading: false
    });

    return created;
  },

  updateAddress: async (id, updatedFields) => {
    set({ loading: true, error: null });
    try {
      await api.updateAddress(id, updatedFields);
    } catch (err: any) {
      console.warn('Failed to update address on server, saving locally:', err.message);
    }

    const currentList = get().addresses;
    let updatedList = currentList.map(a => {
      if (a.id === id) {
        return { ...a, ...updatedFields };
      }
      if (updatedFields.isDefault) {
        return { ...a, isDefault: false };
      }
      return a;
    });

    saveStoredAddresses(updatedList);
    set({ addresses: updatedList, loading: false });
  },

  deleteAddress: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.deleteAddress(id);
    } catch (err: any) {
      console.warn('Failed to delete address on server, removing locally:', err.message);
    }

    const remaining = get().addresses.filter(a => a.id !== id);
    if (remaining.length > 0 && !remaining.some(a => a.isDefault)) {
      remaining[0]!.isDefault = true;
    }

    saveStoredAddresses(remaining);
    set({
      addresses: remaining,
      selectedAddressId: get().selectedAddressId === id ? (remaining[0]?.id || null) : get().selectedAddressId,
      loading: false
    });
  },

  setDefaultAddress: async (id) => {
    try {
      await api.setDefaultAddress(id);
    } catch (err: any) {
      console.warn('Failed to set default address on server, setting locally:', err.message);
    }

    const updated = get().addresses.map(a => ({
      ...a,
      isDefault: a.id === id
    }));

    saveStoredAddresses(updated);
    set({ addresses: updated, selectedAddressId: id });
  },

  selectAddress: (id) => set({ selectedAddressId: id }),

  getDefaultAddress: () => {
    const list = get().addresses;
    return list.find(a => a.isDefault) || list[0];
  }
}));
