# LocalFit read-only audit findings

Date: 2026-11-20

## Scope and constraints

- Read-only audit. No source file, `package.json`, `docs/PROGRESS.md`, or `docs/TRACEABILITY.md` was edited. No commits were made.
- The only files created are this report and `docs/qa/theme-diff.md`.
- Reviewed: `docs/SPEC.md` section 7 and section 13, `docs/TRACEABILITY.md`, all CSS under `src` except generated `src/styles/tokens.css`, image/font/backend/dev-gating source, and computed styles/DOM from the local dev server as a theme proxy.
- `docs/reference/theme.png` could not be visually inspected under this audit's constraints. The theme comparison is against `docs/THEME.md` only; details are in `docs/qa/theme-diff.md`.

## Severity key

- **P1** — release blocker or direct contract/traceability violation.
- **P2** — should be fixed before sign-off; user-visible or maintainability risk.
- **P3** — cleanup or stale documentation; low runtime risk.

## Executive summary

- **P1:** Three priority M rows (`BUY-05`, `BUY-06`, `BUY-07`) are marked `(pending)` instead of naming a test file.
- **P1:** `SHOP-13` has no route/component or visible “Coming in phase 2” placeholder.
- **P2:** The counter-sale conflict scenario is only partially asserted; the conflict record is tested but the admin queue and buyer notification are not.
- **P2:** Design tokens are bypassed across UI primitives for colours, radii, font families, and font sizes.
- **P2:** `VITE_IMAGE_BASE` is documented but not consumed by the image pipeline.
- **P2:** Two raw `<img>` call sites bypass `Img`; one lacks lazy loading and intrinsic dimensions.
- **P2:** Material theme differences remain, especially hero CTA/stats/image ratio, section type scale, cart heading, and missing named motion.
- Backend swap, dev-only gating, API image shape, and real WOFF2 font assets are otherwise in good shape.

## 1. Spec traceability and coverage

### Verified

- Parsed 43 priority M IDs from `docs/SPEC.md` section 7:
  - `BUY-01`–`BUY-11`, `BUY-14`–`BUY-17` (15)
  - `SHOP-01`–`SHOP-10` (10)
  - `RIDE-01`–`RIDE-09` (9)
  - `ADM-01`–`ADM-09` (9)
- No priority M row in `docs/TRACEABILITY.md` has `—` for route/component, and no M item is missing a route/component entirely.
- S/L placeholder screens are present for `BUY-12`, `BUY-13`, `SHOP-11`, `SHOP-12`, and `ADM-10`.

### Findings

- **P1 — Pending tests for three priority M requirements.**
  - `docs/TRACEABILITY.md:14` — `BUY-05 | src/routes/buyer/ProductPage.tsx, src/components/buyer/SizeGuideSheet.tsx | (pending)`
  - `docs/TRACEABILITY.md:15` — `BUY-06 | src/routes/buyer/ProductPage.tsx, src/components/buyer/TryTermsSheet.tsx | (pending)`
  - `docs/TRACEABILITY.md:16` — `BUY-07 | src/routes/buyer/BagPage.tsx, src/components/buyer/EtaCountdown.tsx | (pending)`
  - `docs/TRACEABILITY.md:64` — `AMBIGUITY-10` is also `(pending)`, but it is not a section-7 M ID.
  - Action: add the tests, then replace `(pending)` with the real test paths. This audit did not edit the traceability file.

- **P1 — Missing placeholder for `SHOP-13`.**
  - `docs/TRACEABILITY.md:39` — `SHOP-13 | (phase 2 placeholder) | —`
  - No route or component was found that renders an i18n-backed “Coming in phase 2” placeholder for `SHOP-13`.
  - Action: add the smallest route/component placeholder and update the traceability row.

- **P2 — Counter-sale conflict scenario lacks explicit end-to-end assertions.**
  - `src/api/__tests__/SHOP-04-07.test.ts` covers creation of the conflict record.
  - No explicit assertion was found for the admin conflict queue entry plus buyer “item unavailable” notification required by the section-13 scenario.
  - Action: extend that test or add a dedicated section-13 test and cite it in `docs/TRACEABILITY.md`.

### Section 13 scenario test mapping

| SPEC section 13 scenario | Test found | Audit note |
| --- | --- | --- |
| Terms shown before Pay | `src/routes/buyer/__tests__/BUY-08.test.tsx` | Covered |
| Unmarked items go back with rider | `src/api/__tests__/TRIAL-02.test.ts` | Covered |
| Item sold in shop while in bag | `src/routes/shop/__tests__/SHOP-03.test.tsx` | Covered |
| Counter sale against committed unit | `src/api/__tests__/SHOP-04-07.test.ts` | Conflict record only; queue/notification not asserted |
| Three wrong buyer OTP attempts | `src/api/__tests__/SPEC-13.test.ts`, `src/api/__tests__/RIDE-03-otp.test.ts` | Covered |
| Waiting compensation after configured threshold | `src/api/__tests__/RIDE-05-compensation.test.ts` | Covered |
| Offline draft survives reload and publishes | `src/routes/shop/__tests__/SHOP-01.test.tsx` | Covered |
| 24-hour dispute escalation | `src/api/__tests__/ADM-03-escalation.test.ts` | Covered |

## 2. CSS design-token compliance

Generated `src/styles/tokens.css` was treated as the token source and excluded from violations. Available tokens include `--bg`, `--ink`, `--ink-hover`, `--sale-bg`, `--sale-text`, `--star`, `--radius-pill`, `--radius-card`, `--font-heading`, `--font-body`, `--fs-*`, and the spacing scale.

### Hard-coded colours

- **P2 — UI primitives hard-code colours that have tokens.**
  - `src/components/ui/Button.module.css:2` `#fff`, `:3` `#222`, `:5` `#fff`
  - `src/components/ui/chrome.module.css:48` `rgba(255,255,255,.14)`
  - `src/components/RootLayout.module.css:166,179,196,197` rgba white values
- **P2 — Tone and status colours are hard-coded instead of tokenised.**
  - `src/components/ui/surfaces.module.css:322` `#efe6d8`
  - `:326` `#f3e1e0`
  - `:330` `#e2e8df`
  - `:334` `#dfe8ee`
  - `:338` `#e8e2ee`
  - `:366` `rgba(1,171,49,.1)`
  - `:367` `#017a23`
  - `:371` `rgba(255,198,51,.24)`
  - `:372` `#6b4b00`
  - Action: replace with existing tokens where possible (`--bg`, `--ink`, `--ink-hover`, `--sale-bg`, `--sale-text`, `--star`, `--ok`) and add generated tokens for the missing tone/warning colours rather than leaving literals in components.

### Hard-coded radii

- **P2 — Radius literals bypass `--radius-pill` / `--radius-card`.**
  - `border-radius: 50%`: `src/components/buyer/flow.module.css:443,483`; `src/components/buyer/pages.module.css:79,87,99`; `src/components/ui/controls.module.css:83,271,440,485,492,558,569`; `src/components/ui/surfaces.module.css:191,225,456`; `src/routes/admin/admin.module.css:164`
  - Non-circle literals: `src/components/ui/controls.module.css:307` `4px`, `:530,539` `2px`
  - Some `50%` uses are likely intentional avatar/icon circles; even then they are not represented in the token scale. Action: use tokens for pill/card radii and add an explicit circle token if circles are intentional.

### Hard-coded font families and sizes

- **P2 — Font-family declarations bypass `--font-heading` / `--font-body`.**
  - `src/components/admin/admin.module.css:73`
  - `src/components/ScreenStub.module.css:35`
  - `src/routes/admin/admin.module.css:136,237,257`
- **P2 — Font-size literals bypass the `--fs-*` scale.**
  - `src/components/ui/surfaces.module.css:180` `12px`
  - `src/components/ConsoleLayout.module.css:24` `20px`
  - `src/components/RootLayout.module.css:29` `24px`, `:198` `12px`, `:239` `28px`
  - `src/routes/admin/admin.module.css:238` `12px`, `:267` `clamp(32px,3vw,48px)`
- `src/styles/global.css:9,18,26,34,42` are `@font-face` definitions and are not violations.

## 3. Images

### Verified

- `src/api/types.ts:10-18` defines the required image shape: `url: string | null`, `alt`, `tone`, `width`, `height`, plus optional `srcSet`.
- Seeds satisfy the shape: `src/api/seed.ts:12-13`, `src/api/mockShopSetup.ts:129-135`, `src/api/adminSeed.ts:91-97`.
- `src/components/ui/Img.tsx` correctly uses `loading={priority ? 'eager' : 'lazy'}`, `srcSet`, `sizes`, `alt`, `width`, `height`, `decoding`, and `fetchPriority`; it preserves aspect ratio and falls back to `PhotoPlaceholder` when `url` is null.
- No application photo files were found; only `docs/reference/theme.png` and `public/favicon.svg` exist. The WebP requirement is therefore vacuously satisfied for API images today.

### Findings

- **P2 — `VITE_IMAGE_BASE` is configured but never used.**
  - `.env.example:5` defines `VITE_IMAGE_BASE=`.
  - `README.md:87-88` says it is a reserved placeholder and not read by adapters.
  - No `VITE_IMAGE_BASE` reference exists anywhere under `src`; `src/components/ui/Img.tsx:28` renders `image.url` directly.
  - This conflicts with `AGENTS.md`, which says the image base URL comes from `VITE_IMAGE_BASE`.
  - Action: resolve relative API image URLs through the env value (in `Img` or the HTTP adapter) while leaving absolute URLs unchanged, then update the README statement.

- **P2 — Raw `<img>` outside `Img`.**
  - `src/components/ui/Avatar.tsx:15` — no `loading`, `width`, or `height`.
  - `src/components/shop/ListingForm.tsx:144` — local `dataURL` preview. This is lower risk because it is a transient local preview, but it still bypasses the shared component.
  - Action: use `Img` with a generated `Image` object, or at minimum add lazy/eager intent and intrinsic dimensions to `Avatar`.

## 4. Fonts

### Verified

- `public/fonts/` contains real WOFF2 files with `wOF2` magic bytes:
  - `archivo-900-expanded.woff2`
  - `noto-sans-devanagari.woff2`
  - `satoshi-400.woff2`
  - `satoshi-500.woff2`
  - `satoshi-700.woff2`
- `index.html:9-10` preloads Archivo and Satoshi 400.
- `src/styles/global.css:8-49` defines self-hosted `@font-face` blocks with `font-display: swap`.
- No runtime Google Fonts link was found.

### Finding

- **P3 — Font status is stale in progress docs.**
  - `docs/PROGRESS.md:27,75,131,188,263,340` still say `public/fonts/` has only a README and real WOFF2 files are needed.
  - `docs/PROGRESS.md:200,274,352` also list dropping in fonts as a next step.
  - Action: update the progress document outside this audit, since it was explicitly read-only here.

## 5. Backend swap readiness

### Verified

- `src/api/client.ts:9-11` selects `api` from `import.meta.env.VITE_API_MODE`, defaulting to `mock`.
- `src/api/mock.ts` and `src/api/http.ts` both fulfil the same `Api` interface; `src/api/http.ts` exports `httpApi: Api`.
- `fetch` appears only under `src/api/` (`http.ts`, `httpShopApi.ts`, `httpRiderApi.ts`, `httpAdminApi.ts`), never in routes or components.
- No production screen imports mock data or dev helpers directly. Direct mock imports are limited to:
  - `src/components/DemoPanel.tsx:5` (DEV-gated)
  - `src/api/dev.ts:22` (DEV helper used by DemoPanel/tests)
  - test/fixture files
- No action required for the adapter boundary itself. The only related gap is the unused `VITE_IMAGE_BASE` noted above.

## 6. Dev-only tooling gating

### Verified

- `src/components/RootLayout.tsx:15` lazy-loads `DemoPanel`; `src/components/RootLayout.tsx:155-157` renders it only under `import.meta.env.DEV`.
- `src/routes/router.tsx:81` lazy-loads the style route; `src/routes/router.tsx:255-256` registers `/_style` only under `import.meta.env.DEV`.
- `src/api/dev.ts:1-4` documents that it exists only for the DEV-gated panel and never reaches production.
- No source-level leak found. Production bundle contents were not inspected because building would create files outside the two allowed report paths.

## 7. Theme compliance

- See `docs/qa/theme-diff.md` for the full THEME.md-only comparison.
- Highest-priority theme deviations observed via computed styles/DOM:
  - Hero CTA is a white outlined ~124×44 button instead of a black pill ~210×52.
  - Hero stats read `5`, `8`, `12k` instead of `200+`, `2,000+`, `30,000+`.
  - Hero media is 1:1 instead of 4:5.
  - Home section titles are 24/20px instead of the 48/32px H2 scale.
  - Cart H1 is `Bag` instead of `YOUR CART`.
  - Named motion from THEME.md (hero rise/stagger, count-up, product fade-up, route fade, announcement collapse, timeline draw) was not found.
  - Mobile header/search affordances differ: no search icon, no Shop chevron, and “Sign in” replaces the guest user icon.

## Recommended fix order

1. Replace the three `(pending)` M test entries with real tests and add the `SHOP-13` placeholder.
2. Extend the counter-sale conflict test to assert admin queue and buyer notification.
3. Move hard-coded colours, radii, font families, and font sizes onto generated tokens.
4. Wire `VITE_IMAGE_BASE` into image URL resolution and route raw `<img>` use through `Img`.
5. Update stale progress notes and close the theme gaps listed in `docs/qa/theme-diff.md`.

## Remediation status (quality pass, 2026-11-20)

- **Fixed (P1):** `BUY-05`, `BUY-06`, `BUY-07` and `AMBIGUITY-10` now have dedicated tests; `SHOP-13` has an i18n-backed “Coming in phase 2” placeholder; `SPEC-13.*` asserts the admin conflict queue and buyer unavailability notification.
- **Fixed (P2):** all component colours/radii/font families/font sizes now use generated tokens, enforced by `npm run css:tokens` in the build. Added `--radius-circle`, `--radius-xs`, `--radius-hairline`, tone and on-ink tokens to `src/styles/tokens.ts`.
- **Fixed (P2):** `Img` resolves relative API URLs through `VITE_IMAGE_BASE`; `Avatar` and the `ListingForm` preview now set lazy loading and intrinsic dimensions. No API photos exist yet, so the WebP rule remains vacuous.
- **Fixed (P3):** stale WOFF2 notes in `docs/PROGRESS.md` corrected.
- **Fixed during QA:** the QA harnesses now inject a complete persisted settings object; `RootLayout`, `AuthLayout` and `ConsoleLayout` provide one main landmark per view; `useOnScreen` recreates its observer under React StrictMode, unblocking the keyboard try-at-door path.
- **Not changed:** the THEME.md deviations in `docs/qa/theme-diff.md` are recorded as known gaps; the brief asked for a difference list, not a visual redesign. The HTTP adapter boundary was verified only by type-checking (`httpApi: Api`), not against a live backend.
