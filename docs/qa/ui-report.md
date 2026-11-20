# UI quality report — LocalFit

Final run: 20 Nov 2026, against `http://127.0.0.1:5175` (Vite dev, system Chrome).
Raw evidence: `docs/qa/results.json`. Screenshots: `docs/qa/screenshots/<role>-<slug>-<width>.jpg` (JPEG, quality 65).
Commands: `npm run qa:ui`, `npm run axe`, `npm run smoke`, `npm run test:e2e`.

## 1. Coverage

| Item | Count |
| --- | --- |
| Routes in `scripts/smoke.mjs` | 59 |
| Viewports | 4 (360×800, 768×1024, 1024×768, 1440×900) |
| Route × viewport loads | 236 |
| JPEG screenshots | 236 |
| Axe scans (360 + 1440) | 118 |
| State checks | buyer, shop, rider, admin |

The brief’s “60-route list” is actually 59 entries in `scripts/smoke.mjs`. The sweep uses that list
verbatim, including `/_style` and `/this-route-does-not-exist`; no route was invented to reach 60.

## 2. Responsive / overflow results

| Metric | Before fixes | Final |
| --- | ---: | ---: |
| Screens with `documentElement.scrollWidth > viewport` | 10 | **0** |
| Offscreen element records | 90 | 87 |
| Clipped buttons/links | 0 | **0** |
| Wide tables without a scroll container | 0 | **0** |
| Page load errors | 0 | **0** |

- Fixed `/profile/roles` 3 px overflow at 360 px with `max-width: 100%; white-space: normal` on its
  role-card button.
- Fixed the nine error-boundary overflow records by completing the persisted settings object in the
  QA harness; those pages now render their real layouts.
- The remaining 87 offscreen records are marquee track/group/item nodes on `/` and `/_style`. The
  marquee is intentionally wider than the viewport and clipped by its band. Page `scrollWidth`
  equals the viewport on those screens; no control is clipped and no table overflows.

## 3. Axe violations

| Impact | Before fixes | Final |
| --- | ---: | ---: |
| Critical | 0 | **0** |
| Serious | 24 | **0** |
| Moderate | 128 | **0** |
| Total | 152 | **0** |

All 118 scans are clean. Fixes included: status/stock contrast tokens, product image link and
gallery thumbnail accessible names, one `<main>` per view across `RootLayout`, `AuthLayout`,
`ConsoleLayout`, the dev style page and the 404 page, unique accessible names on the two search
landmarks, and a level-one heading on the 404 page. `npm run axe` also passes its five core screens.

## 4. State coverage matrix

| State | Roles / routes checked | Result |
| --- | --- | --- |
| Error | buyer `/orders`, `/product/prod-kurta-set`; shop `/shop/orders`, `/shop/inventory`; rider `/rider/tasks`, `/rider/earnings`; admin `/admin/orders`, `/admin/shops` | **Pass** for all 8: `role="alert"` with the mock-failure message and a “Try again” action. |
| Offline | first data route per role | **Partial**: all 4 show the offline banner and last-updated time; `cachedRows` was 0, so cached rows themselves were not demonstrated. |
| Empty | buyer `/bag`, `/wishlist`, `/search?q=zzzznotathing`; shop `/shop/returns`; rider `/rider/earnings` | **Pass** for 4 true `EmptyState` titles; `/shop/returns` exposes only the page heading `RETURNS`, so its empty state is not verified. |
| Loading | buyer `/orders`, `/product/prod-kurta-set`; admin `/admin/shops` | **Pass**: skeleton or `aria-busy="true"` observed on all 3. |

Mock failures were toggled through the same `setMockFailures` flag the DemoPanel exposes; the
DemoPanel itself is DEV-gated and absent from the production bundle.

## 5. Keyboard, focus and motion

`tests/keyboard-flow.spec.ts` uses keyboard input only (`Tab`, `Shift+Tab`, `Enter`, `Space`); there
are no `locator.click()` calls. It runs on system Chrome through `playwright.config.ts`.

`npm run test:e2e`: **3 passed**.

- **Full try-at-door path**: header search → product tile → try-at-door Sheet → Add to bag → Bag →
  checkout → terms → OTP → trial → keep/return decisions confirmation, with visible focus rings at
  every recorded step. This was unblocked by recreating the `IntersectionObserver` in `useOnScreen`
  so React StrictMode’s effect double-invoke cannot leave a disconnected observer.
- **Dialog focus trap and Escape**: Sheet, Dialog and ConfirmDialog keep focus inside through 8 × Tab
  and 3 × Shift+Tab, close on Escape and restore focus to the trigger.
- **`prefers-reduced-motion: reduce`**: marquee transform does not move over 350 ms and sampled
  control transitions are 0 s.

## 6. Honest limitations

- Axe was run at 360 and 1440; 768 and 1024 were checked for overflow and screenshots but not axe.
- Offline checks confirm the banner and timestamp, not cached rows on every screen.
- `/shop/returns` did not produce a detectable `EmptyState` title.
- No application photos exist, so the WebP image rule is currently vacuous for API images.
- This report covers the mock API only; no live backend was available for HTTP/realtime checks.
