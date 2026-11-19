import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Lang } from '@/i18n/types';

export type UserRole = 'buyer' | 'shop' | 'rider' | 'admin' | 'super_admin';

export interface SessionUser {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  /** Roles this account can switch to without another OTP (AUTH-07). */
  availableRoles?: UserRole[];
  /** Only for admin accounts: support, verifier, finance, dispute lead, super admin. */
  adminRole?: string;
}

export interface Consent {
  location: boolean;
  marketing: boolean;
  personalisation: boolean;
  termsAccepted: boolean;
}

export interface NotificationSettings {
  orders: boolean;
  offers: boolean;
}

interface Settings {
  lang: Lang;
  consent: Consent;
  /** Set after the first-run profile step so returning users skip onboarding. */
  onboarded: boolean;
  notifications: NotificationSettings;
}

interface AppState {
  session: SessionUser | null;
  settings: Settings;
  bagCount: number;
  /** Session-only: not persisted to localStorage. */
  wishlist: string[];
  /** Saved size for each wishlisted product, also session-only. */
  wishlistSizes: Record<string, string>;
  setSession: (user: SessionUser | null) => void;
  switchRole: (role: UserRole) => void;
  setLang: (lang: Lang) => void;
  setConsent: (patch: Partial<Consent>) => void;
  setNotification: (key: keyof NotificationSettings, value: boolean) => void;
  completeOnboarding: () => void;
  setBagCount: (count: number) => void;
  toggleWishlist: (productId: string, size?: string) => void;
  resetApp: () => void;
}

const initialSettings: Settings = {
  lang: 'en',
  consent: { location: false, marketing: false, personalisation: false, termsAccepted: false },
  onboarded: false,
  notifications: { orders: true, offers: false },
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      session: null,
      settings: initialSettings,
      bagCount: 0,
      wishlist: [],
      wishlistSizes: {},
      setSession: (session) => set({ session }),
      switchRole: (role) =>
        set((state) =>
          state.session
            ? { session: { ...state.session, role } }
            : { session: null },
        ),
      setLang: (lang) => set((state) => ({ settings: { ...state.settings, lang } })),
      setConsent: (patch) =>
        set((state) => ({
          settings: { ...state.settings, consent: { ...state.settings.consent, ...patch } },
        })),
      setNotification: (key, value) =>
        set((state) => ({
          settings: {
            ...state.settings,
            notifications: { ...state.settings.notifications, [key]: value },
          },
        })),
      completeOnboarding: () =>
        set((state) => ({ settings: { ...state.settings, onboarded: true } })),
      setBagCount: (bagCount) => set({ bagCount }),
      toggleWishlist: (productId, size) =>
        set((state) => {
          const saved = state.wishlist.includes(productId);
          const sizes = { ...state.wishlistSizes };
          if (saved) delete sizes[productId];
          else if (size) sizes[productId] = size;
          return {
            wishlist: saved
              ? state.wishlist.filter((id) => id !== productId)
              : [...state.wishlist, productId],
            wishlistSizes: sizes,
          };
        }),
      resetApp: () =>
        set({
          session: null,
          settings: initialSettings,
          bagCount: 0,
          wishlist: [],
          wishlistSizes: {},
        }),
    }),
    {
      name: 'lf:app',
      partialize: (state) => ({ session: state.session, settings: state.settings }),
    },
  ),
);
