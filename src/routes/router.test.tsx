import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, useRoutes } from 'react-router-dom';
import { I18nProvider } from '@/i18n';
import { ToastProvider } from '@/components/ui/Toast';
import { useAppStore, type SessionUser } from '@/store/appStore';
import { routes } from './router';
import { en } from '@/i18n/en';

const guest: SessionUser | null = null;

const buyer: SessionUser = {
  id: 'test-buyer',
  name: 'Ananya Iyer',
  phone: '+91 98860 22110',
  role: 'buyer',
};

const shop: SessionUser = {
  id: 'test-shop',
  name: 'Kiran Silks',
  phone: '+91 98450 11221',
  role: 'shop',
};

const rider: SessionUser = {
  id: 'test-rider',
  name: 'Arjun Nair',
  phone: '+91 97400 51234',
  role: 'rider',
};

const admin: SessionUser = {
  id: 'test-super',
  name: 'Meera Krishnan',
  phone: '+91 98800 11005',
  role: 'super_admin',
  adminRole: 'super_admin',
};

const supportAdmin: SessionUser = {
  id: 'test-support',
  name: 'Neha Kulkarni',
  phone: '+91 98800 11001',
  role: 'admin',
  adminRole: 'support_agent',
};

function RouteTree() {
  return useRoutes(routes);
}

function renderPath(path: string, session: SessionUser | null) {
  useAppStore.setState({ session });
  return render(
    <MemoryRouter initialEntries={[path]}>
      <I18nProvider>
        <ToastProvider>
          <RouteTree />
        </ToastProvider>
      </I18nProvider>
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  useAppStore.setState({ session: null });
});

const PUBLIC_ROUTES = [
  '/',
  '/occasion/party-tonight',
  '/search',
  '/product/prod-kurta-set',
  '/shop/shop-kiran',
  '/bag',
  '/support',
  '/welcome',
  '/login',
  '/login/otp',
  '/onboarding/profile',
  '/consent',
  '/register/shop',
  '/register/rider',
  '/register/rider/status',
  '/admin/login',
  '/_style',
];

const BUYER_ROUTES = [
  '/checkout',
  '/orders',
  '/order/order-1/confirmed',
  '/order/order-1/track',
  '/order/order-1/trial',
  '/order/order-1/return',
  '/wishlist',
  '/profile',
  '/profile/addresses',
  '/profile/payments',
  '/profile/language',
  '/profile/privacy',
  '/profile/roles',
];

const SHOP_ROUTES = [
  '/shop',
  '/shop/orders',
  '/shop/orders/order-1',
  '/shop/listing/new',
  '/shop/inventory',
  '/shop/returns',
  '/shop/payouts',
  '/shop/settings',
  '/shop/support',
];

const RIDER_ROUTES = [
  '/rider',
  '/rider/tasks',
  '/rider/tasks/order-1',
  '/rider/earnings',
  '/rider/safety',
  '/rider/profile',
  '/rider/support',
];

const ADMIN_ROUTES = [
  '/admin',
  '/admin/shops',
  '/admin/orders',
  '/admin/orders/order-1',
  '/admin/disputes',
  '/admin/refunds',
  '/admin/payouts',
  '/admin/riders',
  '/admin/risk',
  '/admin/campaigns',
  '/admin/config',
  '/admin/staff',
  '/admin/audit',
];

describe('router', () => {
  it.each(PUBLIC_ROUTES)('loads public route %s', async (path) => {
    renderPath(path, guest);
    expect(await screen.findByRole('heading', { level: 1 }, { timeout: 5000 })).toBeVisible();
  });

  it.each(BUYER_ROUTES)('loads signed-in buyer route %s', async (path) => {
    renderPath(path, buyer);
    expect(await screen.findByRole('heading', { level: 1 }, { timeout: 5000 })).toBeVisible();
  });

  it.each(SHOP_ROUTES)('loads shop route %s', async (path) => {
    renderPath(path, shop);
    expect(await screen.findByRole('heading', { level: 1 }, { timeout: 5000 })).toBeVisible();
  });

  it.each(RIDER_ROUTES)('loads rider route %s', async (path) => {
    renderPath(path, rider);
    expect(await screen.findByRole('heading', { level: 1 }, { timeout: 5000 })).toBeVisible();
  });

  it.each(ADMIN_ROUTES)('loads admin route %s for a super admin', async (path) => {
    renderPath(path, admin);
    expect(await screen.findByRole('heading', { level: 1 }, { timeout: 5000 })).toBeVisible();
  });

  it('redirects a guest from checkout to the login screen', async () => {
    renderPath('/checkout', guest);
    expect(
      await screen.findByRole('heading', { name: en['route.login'] }, { timeout: 5000 }),
    ).toBeVisible();
  });

  it('sends a buyer away from the shop console', async () => {
    renderPath('/shop', buyer);
    expect(await screen.findByText(en['common.forbidden'], {}, { timeout: 5000 })).toBeVisible();
  });

  it('sends a support admin away from payouts without the permission', async () => {
    renderPath('/admin/payouts', supportAdmin);
    expect(await screen.findByText(en['common.forbidden'], {}, { timeout: 5000 })).toBeVisible();
  });

  it('renders a not-found screen for an unknown route', async () => {
    renderPath('/this-route-does-not-exist', guest);
    expect(await screen.findByText(en['common.notFound'], {}, { timeout: 5000 })).toBeVisible();
  });
});
