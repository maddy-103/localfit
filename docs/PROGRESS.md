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

## Done (Phase 2 — auth, discovery and account surfaces, complete 2026-11-19)

- **Auth**: `WelcomePage` (language first, then Sign in or Browse with an approximate-location
  note, AUTH-02), `LoginPage` + `OtpPage` (`+91`, 6-digit code with autofill, resend after 30s,
  WhatsApp fallback after 60s, demo code `123456` only when `VITE_DEMO=true`, AUTH-01),
  `ConsentPage` (three independent data toggles plus a separate terms checkbox, AUTH-03/NFR-08),
  `OnboardingProfilePage` (name, serviceable city, language).
- **Discovery**: `HomePage` (live "Need it today" strip, occasion hubs, categories, search entry,
  nearby shops, announcement bar, two-sparkle hero with three stats, partner marquee, offline
  snapshot, BUY-01/BUY-15), `SearchPage` (text + Web Speech voice search behind feature
  detection, size/colour/price/distance/ETA/fit filters, mobile bottom sheet, `aria-live` result
  count, BUY-02), `OccasionPage` (ranking via `src/domain/ranking.ts`), `ShopProfilePage`.
- **Orders and account**: `OrdersPage` (status chips with icon + text + colour and filters),
  `OrderDetailPage` (details, timeline, Support, Return, disabled review block labelled
  "Coming in phase 2", invoice summary labelled placeholder), `WishlistPage` (saved items and
  sizes; back-in-stock and price-drop toggles disabled, BUY-12), `SupportPage` (chat, call,
  human fallback, order link, buyer language, NFR-14), `ProfilePage`, `AddressesPage` (add, edit,
  set default), `PaymentMethodsPage` (gateway tokens only, NFR-11), `LanguageSettingsPage`,
  `PrivacyPage` (consent, JSON download, two-step deletion, BUY-17), `ProfileRolesPage`
  (switch role without another OTP, AUTH-07).
- **Guests**: wishlist save and checkout send a guest to `/login` with a return path (BUY-16).
- **Routes**: canonical `/orders/:id` added beside the Phase 1 `/order/:id/*` aliases; lazy
  imports for every new screen.
- **Tests**: 24 files, **727 tests passing**. Requirement-named: `AUTH-01`, `AUTH-03`, `AUTH-07`,
  `BUY-15`, `BUY-16`, `NFR-07`, `NFR-08`; `router.test.tsx` now covers every new route.
- **Verification**: `npm run build`, `npm run lint`, `npm test` all pass; the production bundle has
  no dev-only strings (`DemoPanel`, `/_style`, dev order helpers).
- **TRACEABILITY.md**: Phase 2 IDs updated with routes/components and test paths.

## Decisions (Phase 2)

1. `src/domain/config.ts` holds static defaults a backend admin config replaces: cities, occasion
   slugs, resend/WhatsApp timers and the demo OTP.
2. OTP success derives the role by matching the phone against seeded shops and riders, defaulting
   to buyer; `availableRoles` lets the account switch without a second OTP.
3. Consent, onboarding and notification preferences persist with `settings`; wishlist and saved
   sizes stay session-only (never localStorage).
4. `src/lib/homeCache.ts` stores the last home snapshot in IndexedDB with an in-memory fallback so
   the offline banner and cached stock work even where IndexedDB is unavailable.
5. Guest redirects carry a `returnTo` path validated by `src/lib/returnTo.ts` (local paths only).
6. Occasion ranking is pure logic in `src/domain/ranking.ts`, ties broken by product `id`.
7. Search keeps the input in step with the URL via a render-time derived-state check rather than a
   `setState` effect, to satisfy the `react-hooks/set-state-in-effect` rule.

## Known Bugs / Gaps (Phase 2)

- `public/fonts/` still has no real woff2 files (Archivo, Satoshi, Noto Sans Devanagari).
- Payment "add new method" and wishlist alerts are deliberately disabled placeholders (phase 2
  behaviour is out of scope). `BUY-17` and `NFR-11` now have focused tests
  (`src/routes/buyer/__tests__/BUY-17.test.tsx`, `src/routes/buyer/__tests__/NFR-11.test.tsx`).
- Voice search depends on the browser Web Speech API; the button is hidden when it is absent.

## Done (Phase 3 — shop onboarding and console, complete 2026-11-20)

- **Registration** (AUTH-04): `/register/shop` collects shop details, optional GST, owner ID photo
  (JPG/PNG/PDF ≤ 5 MB) and a scheduled sample visit; `/register/shop/status` shows approval progress.
  An approval gate on every `/shop/*` route sends unapproved shops back to the status page. The demo
  shop is seeded `approved` so the console stays reachable.
- **Shop console**: `DashboardPage` (accept/decline with a fixed reason, countdown, 5-minute release),
  `ListingNewPage` + `ListingForm` (Snap & List, offline IndexedDB drafts, reconnect publish),
  `InventoryPage` + `InventoryVariantRow` (stock by SKU/size/colour, hide, price, "Sold in shop"),
  `OrdersPage` + `OrderDetailPage` (accept, pack, ready, rider OTP + item scan + pickup photo),
  `ReturnsPage` (photo inspection, accept/dispute), `PayoutsPage` (settlement report + CSV),
  `SettingsPage` (radius, hours, staff, masked bank details), `SupportPage`.
- **Domain**: `sla.ts` (5-minute accept, 10-minute waiting compensation, 24-hour dispute),
  `settlements.ts` (integer-paise ledger), `stock.ts` (holds vs committed units), `shop.ts`
  (fixed choices, step constants), `orderMachine.ts` (shop actor for `RIDER_ASSIGNED -> PICKED_UP`,
  system actor for `PLACED -> CANCELLED`).
- **API**: `ShopApi` added to `src/api/types.ts`, implemented in `mockShopSetup.ts`, `mockShopOps.ts`,
  `mockShopReports.ts`, `mockShopApi.ts` and `httpShopApi.ts`, wired into `mock.ts`/`http.ts`.
  Mock state stays backward-compatible with old `{ bag, orders }` snapshots. Buyer Home/Search/Product
  pages subscribe to the `inventory` topic for sub-3-second stock propagation.
- **Placeholders**: `Phase2Card` labels SHOP-11 (insights/alerts) and SHOP-12 (bookkeeping export)
  as "Coming in phase 2" through `phase2.label`; no fake behaviour.
- **Step measurement**: `scripts/measure-listing-steps.ts` + `npm run measure:listing` report the
  Snap & List happy path at **6 steps / limit 8**.
- **Tests**: 30 files, **739 tests passing**. New requirement-named files: `SHOP-01.test.tsx`
  (offline draft publish on reconnect), `SHOP-01-steps.test.tsx`, `SHOP-03.test.tsx` (buyer sees
  stock-out within 3 s), `SHOP-04-07.test.ts` (committed-unit conflict, timeout with fake clock,
  OTP + scan + photo guard).
- **Verification**: `npm run build`, `npm run lint`, `npm test`, `npm run measure:listing` all pass.

## Decisions (Phase 3)

1. Commission rate defaults to zero until an admin config supplies it; deductions come from returns
   and held disputes.
2. A counter sale against a committed unit records a `ConflictRecord` and never decrements stock.
   Holds, by contrast, are released on a counter sale.
3. Pickup uses a new `Order.pickupOtp` (`MOCK_PICKUP_OTP = '1357'` in the mock). The scan value is a
   variant id/SKU and `photoId` is mandatory; `handoverOrder()` checks all three before writing
   `PICKED_UP` and `IN_TRANSIT`.
4. `readyOrder()` was added for `PACKED -> RIDER_ASSIGNED` rather than overloading `packOrder()`.
5. Returns inspection walks the required intermediate machine states with the correct actor instead
   of adding new transitions.
6. `Variant.visible?: boolean` was added to the API contract; hidden variants expose buyer quantity 0.
7. Listing steps are recorded through a `ListingForm` `onStep` callback so the browser-level happy
   path and the step-limit script share one source of truth.
8. `useAsync`'s `reload` is destructured directly (it is already a stable `useCallback`), which keeps
   `react-hooks/exhaustive-deps` clean; the reconnect sync is inlined with the same promise pattern
   as `DashboardPage` so no state is set synchronously inside an effect.

## Known Bugs / Gaps (Phase 3)

- `public/fonts/` still has no real woff2 files (Archivo, Satoshi, Noto Sans Devanagari).
- SHOP-11/12/13 remain priority-S/L placeholders by design; no behaviour was faked.
- AUTH-04 has route coverage only (`router.test.tsx`), not a dedicated registration-form test.
- SHOP-05/08/09/10 are covered by route tests and shared component tests rather than one dedicated
  behaviour test per ID; the four required Phase 3 tests are in place.
- Rider and admin flows are still marked `(pending)` in `TRACEABILITY.md`.

## Next Steps (Phase 4)

- Rider console (accept task, navigation, OTP, photo proof, earnings, safety) and admin console
  (shop verification, disputes, refunds, config, staff roles).
- Add the remaining focused tests that are still `(pending)` in `TRACEABILITY.md`.
- Drop real woff2 font files into `public/fonts/` and switch `VITE_API_MODE=http` against a backend;
  the HTTP shop adapter is already in place, so screens do not change.

## Plan (Phase 4 — rider console)

- **Requirement IDs**: AUTH-05, RIDE-01–RIDE-09, TRIAL-02, NFR-04, NFR-06, NFR-07,
  SPEC sections 6.3, 8.4, 7.3 and 13.
- **Files**: `src/domain/{rider,locationPolicy}.ts`, `src/api/{types,mockRiderSetup,mockRiderOps,mockRiderApi,httpRiderApi}.ts`
  wired into `mock.ts`/`http.ts`, `src/components/rider/*`, `src/routes/rider/*`,
  `src/routes/auth/{RegisterRiderPage,RegisterRiderStatusPage,OtpPage}.tsx`, router, `rider.module.css`.
- **Tests**: location batching, three wrong OTPs, threshold-gated claim with evidence, shared trial
  timer, rider decision confirmation, and the pickup → try-at-door drop → closed-trip demo path;
  plus AUTH-05 registration, NFR-06 chip and route coverage.

## Done (Phase 4 — basic-Android rider console, complete 2026-11-20)

- **Registration and approval** (AUTH-05): `/register/rider` records document placeholders, runs a
  fixed mock selfie match and declares the vehicle; `/register/rider/status` shows approval progress.
  `RiderApprovalGate` locks every `/rider/*` route until approval, and `/login` sends unapproved riders
  to the status page. The demo rider is seeded approved so the console stays reachable.
- **Basic-Android layout**: one main task per screen, task text at 18 px and up, a fixed bottom action
  bar (`RiderActionBar`), 44 px touch targets and a single primary action.
- **Task flow** (RIDE-01–05, RIDE-09): `/rider/tasks` orders pickups before drops with maps links from
  coordinates. Pickup checks code + item scan + photo. Drop walks arrival, buyer OTP (three wrong codes
  log `otp_failed` and open support), handover photo, trial timer, decision status, phone fallback and
  trip close. Return pickups are a separate task type with their own scan and shop handover.
- **Waiting and earnings** (RIDE-05/06): arrival starts a single clock-backed timer; a claim is refused
  before the configurable 10-minute threshold and stores its evidence. Earnings show per-trip pay,
  each bonus line and the weekly payout date.
- **Safety and profile** (RIDE-07): press-and-hold SOS sends GPS coordinates and opens the support line;
  late-night guidance starts after the configurable hour. Profile shows document, vehicle and language
  status.
- **Location batching** (RIDE-08): `pingDecision()` sends no pings when idle, one per 60 s when assigned
  and one per 15 s in transit; order states map to those phases in `tripPhaseForOrderState()`.
- **Offline queueing** (NFR-04): failed pickup/drop actions are stored locally, marked "Pending sync" on
  the task and replayed on reconnect, keeping the same API contract.
- **API**: a `RiderApi` contract in `src/api/types.ts` implemented by `mockRiderApi.ts` and
  `httpRiderApi.ts`; `commitOrder()` publishes `rider-tasks` so cross-tab changes appear within 3 s.
  New order events (`handover_photo`, `return_scanned`, `rider_confirmed`) are written through the machine.
- **Tests**: 38 files, **752 tests passing** in the final run. New requirement-named files:
  `RIDE-01-demo-drop.test.ts`, `RIDE-03-otp.test.ts`, `RIDE-05-compensation.test.ts`,
  `TRIAL-02-rider-confirm.test.ts`, `TRIAL-02-timer.test.tsx`, `AUTH-05.test.tsx`,
  `NFR-06.test.tsx`, `locationPolicy.test.ts`.
- **Verification**: `npm run build`, `npm run lint` and `npm test` all pass.

## Decisions (Phase 4)

1. The Phase 3 adapter pattern was extended with `RiderApi`; screens import only `api` from
   `src/api/client`, so the HTTP backend needs no screen changes.
2. `RETURN_IN_PROGRESS` from SPEC section 10 stays normalised to `RETURN_PICKED`; an extra
   `RETURN_PICKED` task lets the rider scan and hand returns over at the shop (RIDE-09).
3. `RETURN_PICKED -> RETURN_RECEIVED` by a rider needs a scan note on the event; a shop actor does not.
4. `collectPickup()` commits `PICKED_UP` and `IN_TRANSIT` together, so the rider's next screen is the
   drop. Both events remain in the timeline.
5. Rider and buyer timers both read `order.trialEndsAt` through `src/lib/clock.ts`; the rider can lock
   with a photo and an explicit note when the buyer never answers, and the action is idempotent.
6. Compensation claims are idempotent per order; the stored evidence carries the elapsed/threshold
   times, GPS and OTP attempt count at claim time.
7. `pingDecision()` is a pure scheduler helper; no location upload worker exists until a real backend
   supplies one.

## Known Bugs / Gaps (Phase 4)

- `public/fonts/` still has no real woff2 files (Archivo, Satoshi, Noto Sans Devanagari).
- RIDE-08 is a tested policy only; there is no device location upload worker in the mock build.
- RIDE-06/07 have route coverage rather than a dedicated interaction test per screen.
- Admin console (ADM-01–ADM-10) and its config screens remain priority-S/L placeholders or stubs.
- Photo, scan and SOS "camera/GPS" affordances are placeholders by design until real device APIs exist.

## Next Steps (Phase 5)

- Admin console: shop verification, order oversight, disputes/refunds, config and staff roles,
  including the second-super-admin approval rule.
- Add focused interaction tests for earnings, safety and the remaining `(pending)` traceability rows.
- Drop real woff2 fonts into `public/fonts/` and exercise `VITE_API_MODE=http` against a backend.

