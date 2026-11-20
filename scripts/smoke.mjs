import { chromium } from 'playwright';

const BASE = process.env.SMOKE_BASE ?? 'http://localhost:5173';

const SESSIONS = {
  guest: null,
  buyer: {
    id: 'smoke-buyer',
    name: 'Ananya Iyer',
    phone: '+91 98860 22110',
    role: 'buyer',
  },
  shop: {
    id: 'smoke-shop',
    name: 'Kiran Silks',
    phone: '+91 98450 11221',
    role: 'shop',
  },
  rider: {
    id: 'smoke-rider',
    name: 'Arjun Nair',
    phone: '+91 97400 51234',
    role: 'rider',
  },
  admin: {
    id: 'smoke-admin',
    name: 'Meera Krishnan',
    phone: '+91 98800 11005',
    role: 'super_admin',
    adminRole: 'super_admin',
  },
};

const ROUTES = [
  ['guest', '/'],
  ['guest', '/occasion/party-tonight'],
  ['guest', '/search'],
  ['guest', '/product/prod-kurta-set'],
  ['guest', '/shop/shop-kiran'],
  ['guest', '/bag'],
  ['guest', '/support'],
  ['guest', '/welcome'],
  ['guest', '/login'],
  ['guest', '/login/otp'],
  ['guest', '/onboarding/profile'],
  ['guest', '/consent'],
  ['guest', '/register/shop'],
  ['guest', '/register/rider'],
  ['guest', '/admin/login'],
  ['guest', '/_style'],
  ['guest', '/this-route-does-not-exist'],
  ['buyer', '/checkout'],
  ['buyer', '/orders'],
  ['buyer', '/order/order-1/confirmed'],
  ['buyer', '/order/order-1/track'],
  ['buyer', '/order/order-1/trial'],
  ['buyer', '/order/order-1/return'],
  ['buyer', '/wishlist'],
  ['buyer', '/profile'],
  ['buyer', '/profile/addresses'],
  ['buyer', '/profile/payments'],
  ['buyer', '/profile/language'],
  ['buyer', '/profile/privacy'],
  ['buyer', '/profile/roles'],
  ['shop', '/shop'],
  ['shop', '/shop/orders'],
  ['shop', '/shop/orders/order-1'],
  ['shop', '/shop/listing/new'],
  ['shop', '/shop/inventory'],
  ['shop', '/shop/returns'],
  ['shop', '/shop/payouts'],
  ['shop', '/shop/settings'],
  ['shop', '/shop/support'],
  ['rider', '/rider'],
  ['rider', '/rider/tasks'],
  ['rider', '/rider/tasks/order-1'],
  ['rider', '/rider/earnings'],
  ['rider', '/rider/safety'],
  ['rider', '/rider/profile'],
  ['rider', '/rider/support'],
  ['admin', '/admin'],
  ['admin', '/admin/shops'],
  ['admin', '/admin/orders'],
  ['admin', '/admin/orders/order-1'],
  ['admin', '/admin/disputes'],
  ['admin', '/admin/refunds'],
  ['admin', '/admin/payouts'],
  ['admin', '/admin/riders'],
  ['admin', '/admin/risk'],
  ['admin', '/admin/campaigns'],
  ['admin', '/admin/config'],
  ['admin', '/admin/staff'],
  ['admin', '/admin/audit'],
];

const browser = await chromium.launch({ channel: 'chrome' });
const failures = [];

for (const [role, path] of ROUTES) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.addInitScript((session) => {
    localStorage.setItem(
      'lf:app',
      JSON.stringify({
        state: {
          session,
          settings: {
            lang: 'en',
            consent: { location: false, marketing: false, personalisation: false, termsAccepted: true },
            onboarded: true,
            notifications: { orders: true, offers: false },
          },
        },
        version: 0,
      }),
    );
  }, SESSIONS[role]);
  const page = await context.newPage();
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  page.on('pageerror', (error) => errors.push(`page: ${error.message}`));

  try {
    const response = await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
    if (!response || !response.ok()) errors.push(`status: ${response?.status()}`);
    await page.waitForTimeout(250);
    const heading = await page.locator('h1, [class*="stateTitle"]').first().count();
    if (!heading) errors.push('no h1 or empty-state title rendered');
  } catch (error) {
    errors.push(`navigation: ${error.message}`);
  }

  if (errors.length) failures.push({ role, path, errors });
  else console.log(`ok ${role.padEnd(6)} ${path}`);
  await context.close();
}

await browser.close();

if (failures.length) {
  console.error(JSON.stringify(failures, null, 2));
  process.exit(1);
}
console.log(`smoke: ${ROUTES.length} routes loaded without console errors`);
