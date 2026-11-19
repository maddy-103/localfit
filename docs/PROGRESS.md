# Progress

## Done (Phase 0 — complete, committed b70662c, 2026-11-19)

- **Token system**: `src/styles/tokens.ts` → `npm run tokens` → `src/styles/tokens.css` + `figma/design-tokens.json`.
- **Icons**: 35 named inline SVGs in `src/components/icons/Icon.tsx`.
- **UI primitives**: 38 components in `src/components/ui/` — Button, IconButton, Input, Textarea, Select, Toggle, Checkbox, RadioPills, Chip, Card, Sheet, Dialog, ConfirmDialog, Tabs, StatusChip, Timer, Stepper, ProgressBar, Toast, Badge, Avatar, EmptyState, ErrorState, Skeleton, OfflineBanner, PhotoPlaceholder, MapPlaceholder, SkipLink, LanguageSwitch, Img, Rating, PriceTag, QuantityStepper, SwatchPicker, RangeSlider, AnnouncementBar, Breadcrumb, Marquee, DemoPanel.
- **App shell and routing**: 55 routes, lazy-loaded by role, RoleGuard working, 3 layouts.
- **Domain**: orderMachine (all states + ambiguities), payments, trial, sla, settlements, permissions, locationPolicy, ranking.
- **Clock**: `now()`, `isoNow()`, `createFakeClock`, `fastForward` (DEV only).
- **i18n**: en.ts + hi.ts (100+ keys). Falls back to English, warns in DEV on missing Hindi key.
- **Mock API**: 8 products (3 try-at-door), 5 shops, 3 riders, 2 buyers, 5 admin users. All Indian names, integer paise, `{ url: null }` images.
- **Tests**: 8 test files, **690 tests all passing** (orderMachine 590, router 62, RoleGuard 10, clock 3, permissions 4, mock 9, seed 7, i18n 5).
- **`/_style` route**: renders every primitive in every state.
- **Build, lint, test**: all pass clean (exit 0).
- **TRACEABILITY.md**: 54 requirement rows.

## Decisions

1. `useAsync.ts`: moved `loadRef.current = load` from render body into an effect (react-hooks/refs). Used microtask for setState-in-effect.
2. `eslint-disable-next-line react-refresh/only-export-components` on `useToast`, `createTranslator`, `useI18n`, `RouteFallback` — idiomatic hook+provider patterns.
3. Priority S and L routes render `ScreenStub` with `phase2.label` i18n key.
4. `/rider/tasks` route added alongside `/rider/tasks/:id`.

## Known Bugs

- `public/fonts/` has only a README — real woff2 files needed (Archivo, Satoshi, Noto Sans Devanagari).
- `npm run tokens` requires `tsx` installed (`npm install` first).

## Next Steps (Phase 1)

- Buyer home page (BUY-01): occasion hubs, "Need it today" strip, search, nearby shops, marquee.
- Product detail page (BUY-03–06): photos, shop card, stock badge, fit tags, ETA, try-at-door toggle.
- Bag page (BUY-07): grouped by shop, quantity, price summary, checkout.
- Checkout page (BUY-08): address, payment methods, COD eligibility, trial terms.
- Order tracking page (BUY-09): status timeline, map placeholder, ETA, rider contact.
- Trial window page (BUY-10): keep/return toggles, timer, confirm decisions.
- Do NOT rewrite existing domain or mock code — extend it.

## Done (Phase 1 — try-at-door buyer flow, complete 2026-11-19)

- **Buyer screens**: `ProductPage`, `BagPage`, `CheckoutPage`, `OrderConfirmedPage`,
  `OrderTrackPage`, `OrderTrialPage`, `OrderReturnPage` plus shared `src/components/buyer/` parts.
- **Routes**: `/product/:id`, `/bag`, `/checkout`, `/orders/:id/confirmed|track|trial|return` added as
  aliases beside the existing `/order/:id/*` routes so old deep links keep working.
- **Checkout**: exact SPEC 8.2 terms, on-screen + ticked Pay gate, address radius check, COD rules,
  one payment authorization split across shop orders, hold-vs-charge and refund timing.
- **Tracking/trial/return**: mock GPS + once-per-minute SR ETA announcement, 3-strike OTP support
  path, 15-minute timer from stored start, keep/return + size-swap records, default-return lock,
  reason/photo/pickup return request.
- **Dev panel**: existing DEV-only `DemoPanel` extended with order create/advance/run/OTP/reset;
  production `dist` has no dev helper strings.
- **Tests**: 16 files, **702 tests passing**. Requirement-named: `BUY-04`, `BUY-08`, `SPEC-13`,
  `TRIAL-02`, `TRIAL-03`, `sizeSwap`, `fullDemoPath`; checkout splitting lives in `checkoutSplit.test.ts`
  (SPEC BUY-04 is the product ETA requirement, so it has its own screen test).
- **Verification**: `npm run build`, `npm run lint`, `npm test` all pass; prod bundle dev-string grep clean.
- **TRACEABILITY.md**: updated with the implemented buyer-flow IDs, files and test paths.

## Decisions (Phase 1)

1. `/orders/:id/*` are aliases, not replacements, so no existing route/test changes were needed.
2. Checkout keeps `RoleGuard requiresAuth`; the in-page sign-in stub is defensive and guests still
   go to `/login`, per resolved ambiguity 15.
3. Pay is enabled only after the terms block is visibly on screen (`IntersectionObserver`, with a
   jsdom fallback) and its checkbox is ticked.
4. `orderMachine` now allows the buyer actor for `ARRIVED->OTP_VERIFIED` and the two
   `OTP_VERIFIED` follow-ups: the buyer enters the OTP and both events are written with that actor.
5. Payment is authorized once per checkout; each shop order stores the shared reference with a
   `:<shopId>` suffix and its own share/ETA/settlement.
6. `BUY-04.test.tsx` asserts the ETA appears before Add to bag. The former misnamed checkout test
   was renamed to `checkoutSplit.test.ts` (resolved ambiguity 9).

## Known Bugs / Gaps

- `public/fonts/` still has no real woff2 files (Archivo, Satoshi, Noto Sans Devanagari).
- No dedicated tests yet for the product size-guard announcement, COD gating, or bag grouping;
  these are marked `(pending)` in `TRACEABILITY.md`.
- Tracking uses seeded mock GPS; a real backend replaces it via `api` (no screen changes).

## Next Steps

- Phase 2: shop console, rider console and admin flows; buyer home page; live backend adapter.
- Add the pending focused tests above before touching checkout/payment rules again.
