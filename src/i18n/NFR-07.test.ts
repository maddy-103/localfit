import { describe, expect, it } from 'vitest';
import { en } from '@/i18n/en';
import { hi } from '@/i18n/hi';

describe('NFR-07 local language coverage', () => {
  it('has a non-empty Hindi string for every English key', () => {
    const missing: string[] = [];
    for (const key of Object.keys(en) as Array<keyof typeof en>) {
      const value = hi[key];
      if (typeof value !== 'string' || value.trim().length === 0) missing.push(key);
    }
    expect(missing).toEqual([]);
  });

  it('translates the strings the main screens and messages need', () => {
    const keys = [
      'nav.home',
      'nav.search',
      'nav.orders',
      'route.login',
      'route.home',
      'route.consent',
      'route.privacy',
      'welcome.heading',
      'consent.title',
      'privacy.title',
      'support.title',
      'orders.title',
      'search.title',
      'roles.title',
      'profile.title',
      'auth.otpTitle',
      'offline.banner',
    ] as const;

    for (const key of keys) {
      expect(hi[key], key).not.toBe(en[key]);
      expect(hi[key].length).toBeGreaterThan(0);
    }
  });
});
