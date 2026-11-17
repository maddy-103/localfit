import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Lang } from '@/i18n/types';

export type UserRole = 'buyer' | 'shop' | 'rider' | 'admin' | 'super_admin';

export interface SessionUser {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  /** Only for admin accounts: support, verifier, finance, dispute lead, super admin. */
  adminRole?: string;
}

interface Settings {
  lang: Lang;
}

interface AppState {
  session: SessionUser | null;
  settings: Settings;
  bagCount: number;
  /** Session-only: not persisted to localStorage. */
  wishlist: string[];
  setSession: (user: SessionUser | null) => void;
  setLang: (lang: Lang) => void;
  setBagCount: (count: number) => void;
  toggleWishlist: (productId: string) => void;
  resetApp: () => void;
}

const initialSettings: Settings = { lang: 'en' };

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      session: null,
      settings: initialSettings,
      bagCount: 0,
      wishlist: [],
      setSession: (session) => set({ session }),
      setLang: (lang) => set((state) => ({ settings: { ...state.settings, lang } })),
      setBagCount: (bagCount) => set({ bagCount }),
      toggleWishlist: (productId) =>
        set((state) => ({
          wishlist: state.wishlist.includes(productId)
            ? state.wishlist.filter((id) => id !== productId)
            : [...state.wishlist, productId],
        })),
      resetApp: () =>
        set({ session: null, settings: initialSettings, bagCount: 0, wishlist: [] }),
    }),
    {
      name: 'lf:app',
      partialize: (state) => ({ session: state.session, settings: state.settings }),
    },
  ),
);
