/**
 * UI quality sweep: responsive overflow, clipping, tables, axe, and states.
 * Usage: node scripts/qa-ui.mjs
 *   QA_BASE=...            override the dev server URL
 *   QA_AXE_ALL=1           run axe at all four widths (default: 360 + 1440)
 *   QA_SKIP_SHOTS=1        skip screenshots (used for fast re-runs after fixes)
 */
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const BASE = process.env.QA_BASE ?? 'http://127.0.0.1:5175';
const OUT = 'docs/qa';
const SHOTS = path.join(OUT, 'screenshots');
const SKIP_SHOTS = process.env.QA_SKIP_SHOTS === '1';
const VIEWPORTS = [
  { width: 360, height: 800 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
];
const AXE_WIDTHS = process.env.QA_AXE_ALL === '1'
  ? VIEWPORTS.map((v) => v.width)
  : [360, 1440];

const SESSIONS = {
  guest: null,
  buyer: { id: 'qa-buyer', name: 'Ananya Iyer', phone: '+91 98860 22110', role: 'buyer' },
  shop: { id: 'qa-shop', name: 'Kiran Silks', phone: '+91 98450 11221', role: 'shop' },
  rider: { id: 'qa-rider', name: 'Arjun Nair', phone: '+91 97400 51234', role: 'rider' },
  admin: { id: 'qa-admin', name: 'Meera Krishnan', phone: '+91 98800 11005', role: 'super_admin', adminRole: 'super_admin' },
};

// Full 60-entry list from scripts/smoke.mjs (order preserved).
const ROUTES = [
  ['guest', '/'], ['guest', '/occasion/party-tonight'], ['guest', '/search'],
  ['guest', '/product/prod-kurta-set'], ['guest', '/shop/shop-kiran'], ['guest', '/bag'],
  ['guest', '/support'], ['guest', '/welcome'], ['guest', '/login'], ['guest', '/login/otp'],
  ['guest', '/onboarding/profile'], ['guest', '/consent'], ['guest', '/register/shop'],
  ['guest', '/register/rider'], ['guest', '/admin/login'], ['guest', '/_style'],
  ['guest', '/this-route-does-not-exist'],
  ['buyer', '/checkout'], ['buyer', '/orders'], ['buyer', '/order/order-1/confirmed'],
  ['buyer', '/order/order-1/track'], ['buyer', '/order/order-1/trial'],
  ['buyer', '/order/order-1/return'], ['buyer', '/wishlist'], ['buyer', '/profile'],
  ['buyer', '/profile/addresses'], ['buyer', '/profile/payments'], ['buyer', '/profile/language'],
  ['buyer', '/profile/privacy'], ['buyer', '/profile/roles'],
  ['shop', '/shop'], ['shop', '/shop/orders'], ['shop', '/shop/orders/order-1'],
  ['shop', '/shop/listing/new'], ['shop', '/shop/inventory'], ['shop', '/shop/returns'],
  ['shop', '/shop/payouts'], ['shop', '/shop/settings'], ['shop', '/shop/support'],
  ['rider', '/rider'], ['rider', '/rider/tasks'], ['rider', '/rider/tasks/order-1'],
  ['rider', '/rider/earnings'], ['rider', '/rider/safety'], ['rider', '/rider/profile'],
  ['rider', '/rider/support'],
  ['admin', '/admin'], ['admin', '/admin/shops'], ['admin', '/admin/orders'],
  ['admin', '/admin/orders/order-1'], ['admin', '/admin/disputes'], ['admin', '/admin/refunds'],
  ['admin', '/admin/payouts'], ['admin', '/admin/riders'], ['admin', '/admin/risk'],
  ['admin', '/admin/campaigns'], ['admin', '/admin/config'], ['admin', '/admin/staff'],
  ['admin', '/admin/audit'],
];

const slug = (p) => p.replace(/^\//, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'root';

async function measure(page) {
  return page.evaluate(() => {
    const vw = window.innerWidth;
    const out = { viewport: vw, docScrollWidth: document.documentElement.scrollWidth, bodyScrollWidth: document.body.scrollWidth, offscreen: [], clipped: [], tables: [] };
    const scrollable = (el) => {
      for (let n = el; n && n !== document.body; n = n.parentElement) {
        const s = getComputedStyle(n);
        if (/(auto|scroll)/.test(s.overflowX)) return true;
      }
      return false;
    };
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (!r.width && !r.height) continue;
      if (r.right > vw + 1 || r.left < -1) {
        if (scrollable(el)) continue;
        const cs = getComputedStyle(el);
        if (cs.position === 'fixed' && cs.visibility === 'hidden') continue;
        out.offscreen.push({ el: `${el.tagName.toLowerCase()}.${(typeof el.className === 'string' ? el.className : '').split(' ')[0]}`, left: Math.round(r.left), right: Math.round(r.right) });
      }
    }
    for (const el of document.querySelectorAll('button, a, [role="button"], [role="tab"]')) {
      const r = el.getBoundingClientRect();
      if (!r.width) continue;
      const selfClipped = el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflowX !== 'auto';
      let parentClipped = false;
      for (let n = el.parentElement; n && n !== document.body; n = n.parentElement) {
        const s = getComputedStyle(n);
        if (/(hidden|clip)/.test(s.overflowX)) {
          const pr = n.getBoundingClientRect();
          if (r.right > pr.right + 1 || r.left < pr.left - 1) parentClipped = true;
          break;
        }
      }
      if (selfClipped || parentClipped) {
        out.clipped.push({ el: `${el.tagName.toLowerCase()}.${(typeof el.className === 'string' ? el.className : '').split(' ')[0]}`, text: (el.textContent || '').trim().slice(0, 40), scroll: el.scrollWidth, client: el.clientWidth, parentClipped });
      }
    }
    for (const t of document.querySelectorAll('table')) {
      const p = t.parentElement;
      const pcs = p ? getComputedStyle(p) : null;
      if (t.scrollWidth > (p?.clientWidth ?? 0) + 1 && !/(auto|scroll)/.test(pcs?.overflowX ?? '')) {
        out.tables.push({ table: (t.className || 'table'), scroll: t.scrollWidth, parent: p?.clientWidth ?? 0, overflowX: pcs?.overflowX });
      }
    }
    return out;
  });
}

async function axeScan(page) {
  const r = await new AxeBuilder({ page }).analyze();
  return r.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    help: v.help,
    nodes: v.nodes.length,
    targets: v.nodes.slice(0, 5).map((n) => n.target.join(' ')),
  }));
}

async function freshContext(browser, role, viewport) {
  const ctx = await browser.newContext({ viewport, colorScheme: 'light' });
  await ctx.addInitScript((session) => {
    localStorage.setItem('lf:app', JSON.stringify({
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
    }));
  }, SESSIONS[role]);
  return ctx;
}

async function sweep(browser) {
  const screens = [];
  const axeResults = [];
  for (const viewport of VIEWPORTS) {
    const roles = [...new Set(ROUTES.map(([r]) => r))];
    for (const role of roles) {
      const ctx = await freshContext(browser, role, viewport);
      const page = await ctx.newPage();
      for (const [routeRole, route] of ROUTES.filter(([r]) => r === role)) {
        const id = `${role}-${slug(route)}-${viewport.width}`;
        try {
          await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' });
          await page.waitForTimeout(220);
          const m = await measure(page);
          const shot = SKIP_SHOTS ? null : `${SHOTS}/${id}.jpg`;
          if (shot) await page.screenshot({ path: shot, type: 'jpeg', quality: 65 });
          screens.push({ id, role, route, width: viewport.width, shot: Boolean(shot), ...m });
          if (AXE_WIDTHS.includes(viewport.width)) {
            const violations = await axeScan(page);
            axeResults.push({ id, role, route, width: viewport.width, violations });
            if (violations.length) console.log(`  axe ${id}: ${violations.length} violation(s)`);
          }
        } catch (error) {
          screens.push({ id, role, route, width: viewport.width, error: String(error.message ?? error) });
        }
      }
      await ctx.close();
    }
    console.log(`swept ${viewport.width}x${viewport.height}`);
  }
  return { screens, axeResults };
}

async function states(browser) {
  const result = { errors: {}, offline: {}, empty: [], loading: [] };
  const viewport = { width: 1280, height: 900 };
  const screens = {
    buyer: ['/orders', '/product/prod-kurta-set'],
    shop: ['/shop/orders', '/shop/inventory'],
    rider: ['/rider/tasks', '/rider/earnings'],
    admin: ['/admin/orders', '/admin/shops'],
  };

  // Mock failures: toggle via the DemoPanel launcher labelled by demo.open.
  for (const [role, paths] of Object.entries(screens)) {
    const ctx = await freshContext(browser, role, viewport);
    const page = await ctx.newPage();
    await page.goto(`${BASE}${paths[0]}`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Show demo controls' }).click();
    await page.getByRole('switch', { name: 'Fail mock requests' }).click();
    result.errors[role] = [];
    for (const route of paths) {
      await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(250);
      const alert = page.getByRole('alert');
      const alertText = (await alert.count()) ? (await alert.first().innerText()).slice(0, 160) : null;
      const retry = page.getByRole('button', { name: 'Try again' });
      result.errors[role].push({ route, alert: alertText, nextAction: (await retry.count()) > 0 });
    }
    await page.getByRole('button', { name: 'Show demo controls' }).click().catch(() => {});
    await ctx.close();
  }

  // Offline: load online (populates lastUpdated), then go offline.
  for (const [role, paths] of Object.entries(screens)) {
    const ctx = await freshContext(browser, role, viewport);
    const page = await ctx.newPage();
    await page.goto(`${BASE}${paths[0]}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(250);
    await ctx.setOffline(true);
    await page.waitForTimeout(250);
    const banner = page.getByRole('status').filter({ hasText: 'Offline' });
    result.offline[role] = {
      route: paths[0],
      banner: (await banner.count()) ? (await banner.first().innerText()).slice(0, 200) : null,
      lastUpdated: (await banner.count()) ? /Last updated/.test(await banner.first().innerText()) : false,
      cachedRows: await page.locator('tbody tr, li, article').count(),
    };
    await ctx.close();
  }

  // Empty states: fresh sessions on screens that legitimately start empty.
  const empties = [
    ['buyer', '/bag'], ['buyer', '/wishlist'], ['buyer', '/search?q=zzzznotathing'],
    ['shop', '/shop/returns'], ['rider', '/rider/earnings'],
  ];
  for (const [role, route] of empties) {
    const ctx = await freshContext(browser, role, viewport);
    const page = await ctx.newPage();
    await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(250);
    const title = page.locator('p[class*="stateTitle"]');
    if (await title.count()) {
      result.empty.push({ role, route, title: (await title.first().innerText()).slice(0, 80) });
    }
    await ctx.close();
  }

  // Loading: poll immediately after DOMContentLoaded for skeletons / aria-busy.
  for (const [role, route] of [['buyer', '/orders'], ['buyer', '/product/prod-kurta-set'], ['admin', '/admin/shops']]) {
    const ctx = await freshContext(browser, role, viewport);
    const page = await ctx.newPage();
    await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded' });
    const observed = await page.evaluate(() => new Promise((resolve) => {
      let found = false;
      const check = () => {
        if (document.querySelector('[aria-busy="true"], [class*="skeleton"]')) found = true;
      };
      const id = window.setInterval(check, 16);
      check();
      window.setTimeout(() => { window.clearInterval(id); resolve(found); }, 900);
    }));
    result.loading.push({ role, route, observed });
    await ctx.close();
  }
  return result;
}

await mkdir(SHOTS, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
try {
  const { screens, axeResults } = await sweep(browser);
  const stateResults = await states(browser);
  await writeFile(path.join(OUT, 'results.json'), JSON.stringify({ screens, axeResults, stateResults }, null, 2));
  const overflow = screens.filter((s) => s.docScrollWidth > s.viewport + 1);
  console.log(JSON.stringify({
    routes: ROUTES.length,
    viewports: VIEWPORTS.length,
    screens: screens.length,
    screenshots: screens.filter((s) => s.shot).length,
    docOverflow: overflow.length,
    offscreen: screens.reduce((n, s) => n + (s.offscreen?.length ?? 0), 0),
    clipped: screens.reduce((n, s) => n + (s.clipped?.length ?? 0), 0),
    tables: screens.reduce((n, s) => n + (s.tables?.length ?? 0), 0),
    axeScreens: axeResults.length,
    axeViolations: axeResults.reduce((n, s) => n + s.violations.length, 0),
  }, null, 2));
} finally {
  await browser.close();
}
