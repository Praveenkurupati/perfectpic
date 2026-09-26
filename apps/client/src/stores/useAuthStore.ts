import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

interface AuthState {
  user: User | null;
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
  
  login: (user: User) => void;
  logout: () => void;
  setGuestSession: (id: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  guestSessionId: null,
  
  identifier: '',
  otpSent: false,
  countdownTimer: 0,
  
  setIdentifier: (identifier) => set({ identifier }),
  setOtpSent: (otpSent) => set({ otpSent, countdownTimer: otpSent ? 30 : 0 }),
  setCountdownTimer: (countdownTimer) => set({ countdownTimer }),
  decrementTimer: () => set((state) => ({ countdownTimer: Math.max(0, state.countdownTimer - 1) })),
  
  login: (user) => set({ user, isAuthenticated: true, otpSent: false }),
  logout: () => set({ user: null, isAuthenticated: false, identifier: '', otpSent: false }),
  setGuestSession: (id) => set({ guestSessionId: id })
}));
