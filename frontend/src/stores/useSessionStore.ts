import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface User {
  id: string;
  username: string;
  email?: string;
  phone?: string;
  avatar?: string;
  vipLevel: number;
  createdAt: string;
}

export type AuthModalTab = 'login' | 'register' | 'forgot';
export type PaymentModalTab = 'deposit' | 'withdraw';

interface SessionState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  balance: number;

  isAuthModalOpen: boolean;
  authModalTab: AuthModalTab;

  isPaymentModalOpen: boolean;
  paymentModalTab: PaymentModalTab;

  isMobileDrawerOpen: boolean;
  isSearchOpen: boolean;

  openAuthModal: (tab?: AuthModalTab) => void;
  closeAuthModal: () => void;
  openPaymentModal: (tab?: PaymentModalTab) => void;
  closePaymentModal: () => void;
  openMobileDrawer: () => void;
  closeMobileDrawer: () => void;
  openSearch: () => void;
  closeSearch: () => void;

  setUser: (user: User | null) => void;
  setTokens: (token: string | null, refreshToken: string | null) => void;
  setBalance: (balance: number) => void;
  logout: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      balance: 0,

      isAuthModalOpen: false,
      authModalTab: 'login',
      isPaymentModalOpen: false,
      paymentModalTab: 'deposit',
      isMobileDrawerOpen: false,
      isSearchOpen: false,

      openAuthModal: (tab = 'login') =>
        set({ isAuthModalOpen: true, authModalTab: tab }),
      closeAuthModal: () => set({ isAuthModalOpen: false }),
      openPaymentModal: (tab = 'deposit') =>
        set({ isPaymentModalOpen: true, paymentModalTab: tab }),
      closePaymentModal: () => set({ isPaymentModalOpen: false }),
      openMobileDrawer: () => set({ isMobileDrawerOpen: true }),
      closeMobileDrawer: () => set({ isMobileDrawerOpen: false }),
      openSearch: () => set({ isSearchOpen: true }),
      closeSearch: () => set({ isSearchOpen: false }),

      setUser: (user) => set({ user }),
      setTokens: (token, refreshToken) => set({ token, refreshToken }),
      setBalance: (balance) => set({ balance }),
      logout: () =>
        set({ user: null, token: null, refreshToken: null, balance: 0 }),
    }),
    {
      name: 'tk88-session',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        user: s.user,
        token: s.token,
        refreshToken: s.refreshToken,
        balance: s.balance,
      }),
    },
  ),
);

export const formatVND = (amount: number): string =>
  new Intl.NumberFormat('vi-VN').format(Math.floor(amount)) + ' ₫';
