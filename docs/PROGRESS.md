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
  behaviour is out of scope); `BUY-17` and `NFR-11` have route coverage but no focused test yet.
- Voice search depends on the browser Web Speech API; the button is hidden when it is absent.

