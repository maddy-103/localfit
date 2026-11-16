import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const BASE = process.env.SMOKE_BASE ?? 'http://localhost:5173';
const CASES = [
  ['guest', '/'],
  ['guest', '/_style'],
  ['guest', '/login'],
  ['buyer', '/orders'],
  ['admin', '/admin'],
];

const SESSIONS = {
  guest: null,
  buyer: {
    id: 'axe-buyer',
    name: 'Ananya Iyer',
    phone: '+91 98860 22110',
    role: 'buyer',
  },
  admin: {
    id: 'axe-admin',
    name: 'Meera Krishnan',
    phone: '+91 98800 11005',
    role: 'super_admin',
    adminRole: 'super_admin',
  },
};

const browser = await chromium.launch({ channel: 'chrome' });
const failures = [];

for (const [role, path] of CASES) {
  const context = await browser.newContext();
  await context.addInitScript((session) => {
    localStorage.setItem(
      'lf:app',
      JSON.stringify({ state: { session, settings: { lang: 'en' } }, version: 0 }),
    );
  }, SESSIONS[role]);
  const page = await context.newPage();
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(250);

  const results = await new AxeBuilder({ page }).analyze();
  if (results.violations.length) {
    failures.push({
      path,
      violations: results.violations.map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        nodes: violation.nodes.map((node) => node.target),
      })),
    });
  } else {
    console.log(`axe ok ${path}`);
  }
  await context.close();
}

await browser.close();

if (failures.length) {
  console.error(JSON.stringify(failures, null, 2));
  process.exit(1);
}
console.log(`axe: ${CASES.length} screens passed`);
