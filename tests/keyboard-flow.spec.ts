import { test, expect, type Page } from '@playwright/test';

const BASE = process.env.QA_BASE ?? 'http://127.0.0.1:5175';
const BUYER = { id: 'kb-buyer', name: 'Ananya Iyer', phone: '+91 98860 22110', role: 'buyer' };

// This environment has system Chrome installed but not Playwright's browser download.
test.use({ channel: 'chrome' });

interface Focus {
  body: boolean;
  tag: string;
  name: string;
  role: string | null;
  focusVisible: boolean;
  inDialog: boolean;
}

const focusLog: Array<{ step: string; focus: Focus }> = [];

async function focusInfo(page: Page): Promise<Focus> {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || el === document.body || el === document.documentElement) {
      return { body: true, tag: 'body', name: '', role: null, focusVisible: false, inDialog: false };
    }
    const labelled = el.getAttribute('aria-labelledby');
    const labelledText = labelled
      ? labelled.split(/\s+/).map((id) => document.getElementById(id)?.textContent ?? '').join(' ').trim()
      : '';
    const name = (
      el.getAttribute('aria-label') ||
      labelledText ||
      (el as HTMLInputElement).placeholder ||
      el.labels?.[0]?.textContent ||
      el.textContent ||
      ''
    ).replace(/\s+/g, ' ').trim().slice(0, 140);
    const outlined = (node: Element | null) => {
      for (let n = node; n && n !== document.body; n = n.parentElement) {
        const cs = getComputedStyle(n);
        if (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) return true;
      }
      return false;
    };
    return {
      body: false,
      tag: el.tagName.toLowerCase(),
      name,
      role: el.getAttribute('role'),
      focusVisible: outlined(el),
      inDialog: Boolean(el.closest('[role="dialog"]')),
    };
  });
}

const byName = (text: string) => (f: Focus) => !f.body && f.name.toLowerCase().includes(text.toLowerCase());

async function tabTo(page: Page, match: (f: Focus) => boolean, desc: string): Promise<Focus> {
  for (let i = 0; i < 300; i += 1) {
    await page.keyboard.press('Tab');
    const info = await focusInfo(page);
    if (match(info)) return info;
  }
  throw new Error(`Keyboard focus never reached: ${desc}`);
}

async function activate(
  page: Page,
  match: (f: Focus) => boolean,
  desc: string,
  key = 'Enter',
): Promise<Focus> {
  const focus = await tabTo(page, match, desc);
  expect(focus.body, `focus lost to body before ${desc}`).toBe(false);
  expect(focus.focusVisible, `no visible focus ring on ${desc}`).toBe(true);
  focusLog.push({ step: desc, focus });
  await page.keyboard.press(key);
  return focus;
}

test.beforeEach(async ({ context }) => {
  focusLog.length = 0;
  await context.addInitScript((session) => {
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
  }, BUYER);
});

test('full try-at-door path with keyboard only', async ({ page }) => {
  test.setTimeout(120_000);

  // Discovery: header search -> results -> product tile.
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  const search = await tabTo(page, (f) => f.tag === 'input' && f.name.toLowerCase().includes('search'), 'header search');
  expect(search.focusVisible).toBe(true);
  focusLog.push({ step: 'header search', focus: search });
  await page.keyboard.type('Handblock');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('link', { name: 'Handblock cotton kurta set' }).first()).toBeVisible();

  await activate(page, byName('Handblock cotton kurta set'), 'product tile');
  await expect(page.getByRole('heading', { name: 'Handblock cotton kurta set' })).toBeVisible();

  // Product: try-at-door switch opens a Sheet whose focus must be trapped.
  await activate(page, (f) => f.role === 'switch' && byName('Try at door')(f), 'try-at-door switch', 'Space');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  const firstFocus = await focusInfo(page);
  expect(firstFocus.inDialog, 'sheet did not move focus inside').toBe(true);
  for (let i = 0; i < 10; i += 1) {
    await page.keyboard.press('Tab');
    expect((await focusInfo(page)).inDialog, 'Tab escaped the sheet').toBe(true);
  }
  for (let i = 0; i < 4; i += 1) {
    await page.keyboard.press('Shift+Tab');
    expect((await focusInfo(page)).inDialog, 'Shift+Tab escaped the sheet').toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  expect(byName('Try at door')(await focusInfo(page)), 'focus not restored to switch').toBe(true);

  await activate(page, byName('Add to bag'), 'add to bag');
  await expect(page.getByText('Added to bag. Stock is held for 10 minutes.')).toBeVisible();

  // Bag -> checkout -> pay.
  await activate(page, (f) => f.tag === 'a' && /^Bag/.test(f.name), 'bag link');
  await expect(page.getByRole('heading', { name: 'Bag' })).toBeVisible();
  await activate(page, byName('Go to checkout'), 'checkout button');
  await expect(page.getByRole('heading', { name: 'Deliver to' })).toBeVisible();

  const terms = await tabTo(page, byName('I have read these terms'), 'trial terms checkbox');
  expect(terms.focusVisible).toBe(true);
  focusLog.push({ step: 'trial terms checkbox', focus: terms });
  // BUY-08 keeps Pay disabled until the terms have been on screen. Focus moves
  // the terms into view; this assertion also guards the dev-only StrictMode bug
  // where useOnScreen's observer is disconnected and never reattached.
  await expect(page.getByTestId('trial-terms')).toHaveAttribute('data-terms-visible', 'true');
  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: /^Pay / })).toBeEnabled();

  await activate(page, (f) => f.tag === 'button' && /^Pay /.test(f.name), 'pay button');
  await expect(page).toHaveURL(/\/orders\/[^/]+\/confirmed/);
  const orderId = page.url().match(/\/orders\/([^/]+)\/confirmed/)?.[1] ?? '';
  expect(orderId).not.toBe('');

  // Tracking: advance the buyer's own order to ARRIVED via the shared dev module.
  await activate(page, byName('Track this order'), 'track order link');
  let state = '';
  for (let i = 0; i < 8 && state !== 'ARRIVED'; i += 1) {
    state = await page.evaluate(
      async (id) => (await import('/src/api/dev.ts')).devAdvanceOrder(id).state,
      orderId,
    );
  }
  expect(state).toBe('ARRIVED');
  await expect(page.getByLabel('Code entered at the door')).toBeVisible();

  const otp = (await page.locator('p[class*="otp"]').first().innerText()).replace(/\D/g, '').slice(0, 4);
  expect(otp).toHaveLength(4);
  const otpField = await tabTo(page, (f) => f.tag === 'input' && byName('Code entered at the door')(f), 'OTP field');
  expect(otpField.focusVisible).toBe(true);
  focusLog.push({ step: 'OTP field', focus: otpField });
  await page.keyboard.type(otp);
  await activate(page, byName('Verify code'), 'verify code button');

  // Trial: choose Keep and confirm the decisions.
  await activate(page, byName('Try everything on'), 'trial window link');
  await expect(page.getByRole('heading', { name: /Try everything on/ })).toBeVisible();
  await activate(page, byName('Keep'), 'keep decision');
  await activate(page, byName('Confirm decisions'), 'confirm decisions');
  await expect(page.getByRole('heading', { name: 'Decisions confirmed', level: 1 })).toBeVisible();

  for (const { step, focus } of focusLog) {
    expect(focus.body, `focus lost to body at ${step}`).toBe(false);
    expect(focus.focusVisible, `focus not visible at ${step}`).toBe(true);
  }
});

test('Dialog focus trap and Escape', async ({ page }) => {
  await page.goto(`${BASE}/_style`, { waitUntil: 'networkidle' });
  for (const label of ['Open sheet', 'Open dialog', 'Open confirm dialog']) {
    await activate(page, byName(label), label);
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    expect((await focusInfo(page)).inDialog).toBe(true);
    for (let i = 0; i < 8; i += 1) {
      await page.keyboard.press('Tab');
      expect((await focusInfo(page)).inDialog, `Tab escaped ${label}`).toBe(true);
    }
    for (let i = 0; i < 3; i += 1) {
      await page.keyboard.press('Shift+Tab');
      expect((await focusInfo(page)).inDialog, `Shift+Tab escaped ${label}`).toBe(true);
    }
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
  }
});

test.describe('prefers-reduced-motion: reduce', () => {
  test.use({ reducedMotion: 'reduce' });

  test('animations stop and the marquee does not move', async ({ page }) => {
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
    const track = page.locator('[class*="marqueeTrack"]').first();
    await expect(track).toBeVisible();
    const styles = await track.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { duration: cs.animationDuration, iterations: cs.animationIterationCount, name: cs.animationName };
    });
    expect(parseFloat(styles.duration)).toBeLessThanOrEqual(0.001);
    expect(styles.iterations).toBe('1');
    const before = await track.evaluate((el) => getComputedStyle(el).transform);
    await page.waitForTimeout(350);
    const after = await track.evaluate((el) => getComputedStyle(el).transform);
    expect(after).toBe(before);
    const transitions = await page.evaluate(() =>
      Array.from(document.querySelectorAll('button, a'))
        .slice(0, 40)
        .map((el) => getComputedStyle(el).transitionDuration)
        .filter((value) => value !== '0s')
        .every((value) => value.split(',').every((part) => parseFloat(part) <= 0.001)),
    );
    expect(transitions).toBe(true);
  });
});
