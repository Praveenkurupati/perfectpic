import { create } from 'zustand';

export interface User {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  role?: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  guestSessionId: string | null;
  
  // OTP flow
  identifier: string;
  otpSent: boolean;
  countdownTimer: number;
  
  setIdentifier: (id: string) => void;
  setOtpSent: (sent: boolean) => void;
  setCountdownTimer: (time: number) => void;
  decrementTimer: () => void;
  
  login: (user: User, token?: string) => void;
  logout: () => void;
  setGuestSession: (id: string) => void;
  initialize: () => void;
}

// Safe initial retrieval from localStorage
const getStoredAuth = () => {
  if (typeof window === 'undefined') return { user: null, token: null, isAuthenticated: false };
  try {
    const token = localStorage.getItem('pp_token');
    const userStr = localStorage.getItem('pp_user');
    const user = userStr ? JSON.parse(userStr) : null;
    return {
      token,
      user,
      isAuthenticated: !!(token && user)
    };
  } catch {
    return { user: null, token: null, isAuthenticated: false };
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  guestSessionId: null,
  
  identifier: '',
  otpSent: false,
  countdownTimer: 0,
  
  setIdentifier: (identifier) => set({ identifier }),
  setOtpSent: (otpSent) => set({ otpSent, countdownTimer: otpSent ? 30 : 0 }),
  setCountdownTimer: (countdownTimer) => set({ countdownTimer }),
  decrementTimer: () => set((state) => ({ countdownTimer: Math.max(0, state.countdownTimer - 1) })),
  
  login: (user, token) => {
    if (typeof window !== 'undefined') {
      if (token) localStorage.setItem('pp_token', token);
      localStorage.setItem('pp_user', JSON.stringify(user));
    }
    set({ user, token: token || null, isAuthenticated: true, otpSent: false });
  },
  
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('pp_token');
      localStorage.removeItem('pp_user');
    }
    set({ user: null, token: null, isAuthenticated: false, identifier: '', otpSent: false });
  },
  
  setGuestSession: (id) => set({ guestSessionId: id }),

  initialize: () => {
    const auth = getStoredAuth();
    set({
      user: auth.user,
      token: auth.token,
      isAuthenticated: auth.isAuthenticated
    });
  }
}));
