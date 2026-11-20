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

- `public/fonts/` has only a README at this point in history; real WOFF2 files were added later (see the quality-pass section).
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

- Font note from this phase is stale: real self-hosted WOFF2 files are now in `public/fonts/`.
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

- Font note from this phase is stale: real self-hosted WOFF2 files are now in `public/fonts/`.
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

- Font note from this phase is stale: real self-hosted WOFF2 files are now in `public/fonts/`.
- SHOP-11/12/13 remain priority-S/L placeholders by design; no behaviour was faked.
- AUTH-04 has route coverage only (`router.test.tsx`), not a dedicated registration-form test.
- SHOP-05/08/09/10 are covered by route tests and shared component tests rather than one dedicated
  behaviour test per ID; the four required Phase 3 tests are in place.
- Rider and admin flows are still marked `(pending)` in `TRACEABILITY.md`.

## Next Steps (Phase 4)

- Rider console (accept task, navigation, OTP, photo proof, earnings, safety) and admin console
  (shop verification, disputes, refunds, config, staff roles).
- Add the remaining focused tests that are still `(pending)` in `TRACEABILITY.md`.
- Fonts are already self-hosted; switch `VITE_API_MODE=http` against a backend;
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

- Font note from this phase is stale: real self-hosted WOFF2 files are now in `public/fonts/`.
- RIDE-08 is a tested policy only; there is no device location upload worker in the mock build.
- RIDE-06/07 have route coverage rather than a dedicated interaction test per screen.
- Admin console (ADM-01–ADM-10) and its config screens remain priority-S/L placeholders or stubs.
- Photo, scan and SOS "camera/GPS" affordances are placeholders by design until real device APIs exist.

## Next Steps (Phase 5)

- Admin console: shop verification, order oversight, disputes/refunds, config and staff roles,
  including the second-super-admin approval rule.
- Add focused interaction tests for earnings, safety and the remaining `(pending)` traceability rows.
- Fonts are already self-hosted; exercise `VITE_API_MODE=http` against a backend.

## Plan (Phase 5 — admin console)

- **Requirement IDs**: AUTH-06, ADM-01–ADM-09 (ADM-10 stays a phase-2 placeholder), NFR-10, NFR-12;
  SPEC sections 4, 6.4, 7.4, 8.5–8.7 and 13. Desktop-first with a usable tablet layout; the existing
  `ConsoleLayout` sidebar is the desktop navigation.
- **Files**: rewrite `src/domain/permissions.ts`, add `src/domain/admin.ts`; extend `src/api/types.ts`
  and `mockStore.ts`; add `mockAdminSetup.ts`, `mockAdminOps.ts`, `mockAdminApi.ts`, `httpAdminApi.ts`
  and wire both adapters; add `src/components/admin/*` (table, states, reason dialog, actor, CSV),
  `src/routes/admin/admin.module.css` and rewrite the admin screens; add `admin.*` keys to both i18n files.
- **Tests**: every cell of the 5-role permission matrix; 24 h dispute escalation with a fake clock;
  reason required for reassign/cancel/refund; every action present in the audit log; finance cannot see
  dispute evidence; support agent denied config/staff routes and payout action; SSO + 2FA sign-in gating.
- **Design**: one sticky-header table component with keyboard row navigation, filters and loading/empty
  states reused by every queue. Every action goes through one guarded API helper that checks the matrix,
  requires a reason and writes an audit entry with before/after values.

## Done (Phase 5 — admin console, complete 2026-11-20)

- **Sign-in** (AUTH-06): `/admin/login` lists only active SSO accounts created by a super admin and
  requires a six-digit 2FA code (mock code `246810`). Exactly one placeholder bootstrap super admin
  (`Owner`, `+91 90000 00000`) is seeded; no other admin accounts exist. Super-admin creation and
  approval were removed in the single-admin follow-up below (deliberate deviation from ambiguity 13).
- **Screens**: `DashboardPage` (live orders, availability, late orders), `ShopsPage` (identity, GST,
  sample visit, authenticity flags), `OrdersPage` + `OrderDetailPage` (reassign, cancel, override),
  `DisputesPage` (SLA, evidence sheet, decisions), `RefundsPage`, `PayoutsPage` (run, hold,
  reconcile, CSV), `RidersPage` (verify, penalize, zones), `RiskPage` (scores, COD limits, blocks),
  `ConfigPage` (radius, fees, trial/COD terms with change history), `StaffPage` (other roles,
  revocation), `AuditPage` (reason/diff export). `CampaignsPage` is a "Coming in phase 2" placeholder.
- **Shared UI**: `AdminTable` (sticky header, filters, keyboard row activation), `AdminStates`
  (loading/empty/error/offline with last-updated), `ReasonDialog`, `useAdminActor`, CSV helpers.
- **Domain**: `permissions.ts` now holds the complete 5-role matrix, action map and route map;
  `admin.ts` holds SLA maths, reason validation, evidence redaction, risk bands and CSV export.
- **API**: an `AdminApi` contract in `types.ts` implemented by `mockAdmin{Core,Setup,Ops,Review,Api}.ts`
  plus `adminSeed.ts`, and by `httpAdminApi.ts`; both wired into `mock.ts`/`http.ts`. Every mutation
  goes through `runAdminAction()`: role assertion, non-blank reason, and an audit entry with actor,
  timestamp, reason and before/after values.
- **Disputes** (ADM-03): 24 h SLA escalation to "Senior admin" uses the injected clock, commits the
  escalated cases and writes a system audit entry. Finance may read case metadata but `adminGetDispute`
  strips photos, GPS, OTP log and history without `evidence:view` (NFR-10).
- **i18n**: every new `admin.*` and `role.*` string exists in both `en.ts` and `hi.ts`.
- **Tests**: 40 files, **784 tests passing** in the final run. New/updated: `permissions.test.ts`
  (every matrix cell), `ADM-03-escalation.test.ts` (fake clock + evidence redaction),
  `ADM-admin-actions.test.ts` (SSO/2FA, no extra super admins, required reasons, audit for every action),
  `router.test.tsx` (support agent denied config/staff/payouts), `seed.test.ts` (one placeholder super admin).
- **Verification**: `npm run build`, `npm run lint`, `npm test` and `npx tsc --noEmit` all pass.

## Decisions (Phase 5)

1. The Phase 3/4 adapter pattern was extended with `AdminApi`; screens import only `api` from
   `src/api/client`, so the HTTP backend needs no screen changes.
2. Finance holds `read:disputes` but not `evidence:view`. The disputes screen renders evidence only
   from the role-redacted `adminGetDispute`, showing a "restricted" note for finance.
3. `runAdminAction` writes only the audit log, so each caller persists its own state slice inside
   `change()`. `adminListDisputes` now commits its escalated list too; otherwise every later list
   call re-escalates the same open cases.
4. Shop and rider review APIs are keyed by `shopId`/`riderId` (what the UI passes), not the review
   record's own `id`.
5. SLA escalation is a system-actor mutation and is audited like a human action.
6. `ReasonDialog` mounts its form only while open, avoiding stale reasons and a setState-in-effect.
7. Config edits use minutes/rupees on screen and convert to ms/paise for the API; draft state is a
   patch derived from loaded config rather than copied into an effect.

## Known Bugs / Gaps (Phase 5)

- Font note from this phase is stale: real self-hosted WOFF2 files are now in `public/fonts/`.
- ADM-10 and the other priority-S/L items remain labelled placeholders by design; no behaviour was
  faked.
- `adminListDisputes()` does not take an actor, so its payload still contains evidence fields for
  any role with `read:disputes`. The UI never renders them; a real backend should redact the list
  response at the boundary as well.
- The permission matrix is static until a backend supplies permissions on the session user.

## Next Steps (Phase 6)

- Exercise `VITE_API_MODE=http` against a real backend; move dispute-list redaction and permission
  delivery server-side.
- Fonts are already self-hosted in `public/fonts/`.
- Add dedicated interaction tests for the remaining `(pending)` rows in `TRACEABILITY.md`.

## Single-admin follow-up (2026-11-20)

### Done

- Reduced `src/api/seed.ts` to one placeholder `super_admin`: `admin-owner` / `Owner` /
  `+91 90000 00000`. There are no seeded support, verifier, finance or dispute-lead accounts,
  and no second super admin.
- Removed super-admin creation end to end: no `super_admin` option on `StaffPage`, an API guard in
  `adminCreateStaff()`, and no `/admin/staff/:id/approve` endpoint or `staff.approve` action.
  `adminRevokeStaff()` also refuses to revoke the primary admin so the console cannot be locked out.
- Kept the five-role matrix (`ADMIN_PERMISSIONS`, route guards) and updated the affected tests in
  `permissions.test.ts`, `seed.test.ts`, `ADM-admin-actions.test.ts` and `ADM-03-escalation.test.ts`.

### Decisions

- Deliberately overrides AGENTS.md resolved ambiguity 13 (second-super-admin approval). With one
  account there is no second approver; super admins can no longer be created at all.
- `createdBy: 'bootstrap'` on the seed account is only an AUTH-06 eligibility marker, not a real
  account; the staff table shows "None recorded" for it.
- The name and phone are placeholders chosen by the user. Replace them in `src/api/seed.ts` before
  launch; no personal details are stored in source.

### Known Bugs / Gaps

- The four non-super-admin roles exist only in the permission matrix and tests; no accounts are
  seeded for them.
- `adminListDisputes()` still has no actor parameter and can include evidence fields in its list
  payload (unchanged from Phase 5).

### Next Steps

- Replace the placeholder admin name/phone with the real owner credentials before deployment.
- Keep the HTTP backend aligned: no super-admin creation or approval endpoint, and one bootstrap
  admin seeded by the server.

## Plan (Quality pass — 2026-11-20)

- **Files**: add `README.md`, `scripts/check-i18n.ts`, `scripts/qa-ui.mjs`, `docs/qa/` evidence,
  `tests/keyboard-flow.spec.ts`; extend `package.json`, `docs/TRACEABILITY.md`, both i18n files and
  targeted tests. UI/CSS fixes stay inside existing components and token CSS.
- **Requirement IDs**: every M row in SPEC section 7 (BUY/SHOP/RIDE/ADM), all section 13
  acceptance scenarios, `NFR-03/04/05/06/07/10/12`, plus the dev-only bundle and backend-swap checks.
- **Tests**: full Playwright sweep at 360/768/1024/1440 with axe and overflow checks; DemoPanel
  state checks; keyboard try-at-door flow, focus trap and reduced-motion checks; i18n key parity
  and hard-coded-string guard in the build; new tests for M rows currently marked `(pending)`.
- **Approach**: build without waiting for approval; keep artifacts under `docs/qa/`, fix failures,
  then run `npm run i18n`, `npm run build`, `npm run lint`, `npm test` and the Playwright suites.

## Quality pass — results (2026-11-20)

### Done

- Added `README.md` (install, demo mode, logins, checks, backend swap) and `.env.example` corrected
  to `VITE_API_BASE`.
- Added `scripts/check-i18n.ts`, `scripts/check-css-tokens.ts` and wired both into `npm run build`.
  Added `playwright.config.ts` so `npm run test:e2e` no longer collects Vitest `*.test.ts` files.
- Added tests for `BUY-05`, `BUY-06`, `BUY-07`, `AMBIGUITY-10` and `SPEC-13`; replaced the pending
  rows in `docs/TRACEABILITY.md` and added the `SHOP-13` phase-2 placeholder. No priority M row is
  untraced and no row is pending.
- Wired `VITE_IMAGE_BASE` into `Img`, added intrinsic dimensions/lazy loading to the two raw
  `<img>` call sites, and tokenised all component CSS through `src/styles/tokens.ts`.
- Fixed QA harness persistence payloads, the duplicate/nested `<main>` landmarks, and
  `useOnScreen` so the observer survives React StrictMode's effect double-invoke; this unblocked the
  keyboard try-at-door flow.

### Verification

- `npm run i18n`: 1,260 English keys, all present in Hindi; no hard-coded UI copy.
- `npm run css:tokens`: all component colours, radii, font families and font sizes use tokens.
- `npm test`: **44 files / 794 tests passed** (Vitest no longer collects the Playwright spec).
- `npm run lint`, `npx tsc --noEmit`, `npm run build`: pass.
- Initial JS: **143.9 KiB gzip** (491.9 kB raw, one entry chunk), under the 200 KB budget;
  100 JS chunks in `dist/assets`, one per route or shared group.
- Production bundle grep: no `DemoPanel`, `/_style`, `dev*` order helpers or devtool strings.
- `npm run smoke`: 59 routes load without console errors. `npm run axe`: 5 core screens, zero
  violations. `npm run test:e2e`: 3 passed (keyboard try-at-door, focus trap/Escape, reduced motion).
- `npm run qa:ui`: 59 routes × 4 viewports = 236 screenshots, 0 load errors, 0 document overflow,
  0 clipped controls, 0 unscrollable tables, 0 axe violations across 118 scans. The 87 offscreen
  nodes are the intentionally clipped marquee. Full matrix: `docs/qa/ui-report.md`.

### Decisions and known gaps

- Theme comparison is against `docs/THEME.md` plus computed-style/DOM proxies at 360/1440; the
  reference PNG cannot be visually inspected in this environment, so no pixel diff is claimed.
  19 differences are listed in `docs/qa/theme-diff.md` (hero CTA/stats/media, section type scale,
  cart heading, product typography/tabs, header affordances, named motion).
- Offline checks confirm the banner and last-updated timestamp, not cached rows on every screen;
  `/shop/returns` does not expose a detectable `EmptyState` title.
- No application photos exist yet, so the WebP requirement is vacuous for API images.
- `httpApi: Api` type-checks; no production screen imports the mock directly. No live backend was
  available, so HTTP calls and realtime WebSocket/SSE were not exercised end to end.

## Verification follow-up (2026-11-20)

### Done

- Audited the whole repository: no empty files, no stray temp files, no TODO/FIXME/debug logs, no
  secrets, no emoji icons, generated tokens in sync, dependency tree consistent, and every test path
  named in `docs/TRACEABILITY.md` exists.
- Split the only two React component files over the AGENTS 250-line limit: `Icon.tsx` now imports
  geometry from `iconPaths.tsx`, and `DisputesPage.tsx` renders the extracted
  `DisputeEvidenceSheet.tsx`. Behaviour, copy and styles are unchanged.

### Verification

- `npm run i18n` (1,260 keys), `npm run css:tokens`, `npx tsc --noEmit`, `npm run lint`,
  `npm run build`, `npm test` (44 files / 794 tests), `npm run smoke` (59 routes), `npm run axe`
  (5/5 screens), `npm run test:e2e` (3/3) and `npm run qa:ui` were all re-run after the split and
  pass. Initial JS remains 143.9 KiB gzip with no dev-only strings in `dist/`.
- `router.tsx` is 263 lines but is route configuration, not a component. Six legacy raw pixel
  spacing values remain in CSS (`-1px` border offsets, `2px`/`6px` gaps, `56px` chrome padding);
  they were left alone because changing them would alter the agreed pixel layout, and the token
  guard already enforces colours, radii, fonts and font sizes.

## Figma package (2026-11-20)

### Done

- `npm run tokens` now emits Tokens Studio `figma/design-tokens.json` and 34 `figma/icons/*.svg` from
  `src/styles/tokens.ts` and `src/components/icons/iconPaths.tsx`. The CSS token output is unchanged.
- Added `figma/frames.json` (55 M-priority screens, widths 360/768/1440), `figma/screens/` (32 SVG
  reference frames at 360 and 1440 for the 10 requested screens plus six alternate states),
  `figma/components.md` (38 primitives and their variants/states) and `figma/README.md`.
- Added `scripts/figma-svg.ts` and generators under `scripts/figma-screens/` so frames are built from
  tokens and app copy, with kebab-case layer ids, ≥16 px text and ≥44 px hit areas. No `.fig` file,
  Figma API call, token, embedded image, gradient, filter or foreignObject was added.
- Added `npm run figma:screens`, `npm run check:figma` (wired into `npm run build`) and
  `src/test/figma.test.ts`. The guard fails on stale artefacts or SVG constraint violations.

### Verification

- `npm run i18n` (1,260 keys), `npm run css:tokens`, `npm run lint`, `npm run check:figma`,
  `npx tsc --noEmit`, `npm run build` and `npm test` (45 files / 798 tests) pass.
- All 32 generated SVGs are under 28 KB; every layer id is kebab-case and unique, every text layer
  has font-family/weight/size at ≥16 px, and no forbidden SVG feature is present.
- Initial JS is 147.6 KiB gzip (no Figma generator, dev tool or server-render code in `dist/`).

### Decisions, assumptions and known gaps

- Figma itself and html.to.design cannot run in this environment. The committed SVGs are token-accurate
  spec frames; `figma/README.md` documents the `npm run dev` + html.to.design route for fully editable
  layers and notes that plugin layer names need tidying afterwards.
- Token groups follow Tokens Studio canonical names. `clamp()` sizes are exported as fixed desktop and
  mobile px ends; `letter-spacing` is converted from em to px at 16 px; reduced motion and Archivo
  width 125 are behaviours, not token values. Integral CF Bold (paid) is represented by Archivo 900.
- `admin/disputes-detail` shares `/admin/disputes` because the evidence viewer is a sheet, not its own route.
- Follow-up fix: the shadow token's unitless CSS `0` offset is now normalised to `0px` so every
  exported dimension is valid DTCG/Tokens Studio input.

