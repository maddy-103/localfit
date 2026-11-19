# Phase 2 plan — auth, discovery and account surfaces

## Files to create or replace
- Auth: replace stubs `WelcomePage.tsx`, `LoginPage.tsx`, `OtpPage.tsx`, `ConsentPage.tsx`,
  `OnboardingProfilePage.tsx`. Add `src/components/auth/` helpers for phone and OTP fields.
- Store: extend `src/store/appStore.ts` with persisted consent and onboarding flags, session-only
  wishlist sizes, and role switching.
- Discovery: replace `HomePage.tsx`, `SearchPage.tsx`, `OccasionPage.tsx`, `ShopProfilePage.tsx`.
  Add `src/components/buyer/ProductCard.tsx`, `SearchFilters.tsx`, `EtaCard.tsx`,
  `OccasionHub.tsx`, and `src/lib/homeCache.ts`. Add `src/domain/ranking.ts` + unit test.
- Orders/account: replace `OrdersPage.tsx`, add `OrderDetailPage.tsx`, replace `WishlistPage.tsx`,
  `SupportPage.tsx`, `ProfilePage.tsx`, `AddressesPage.tsx`, `PaymentMethodsPage.tsx`,
  `LanguageSettingsPage.tsx`, `PrivacyPage.tsx`, `ProfileRolesPage.tsx`. Add small shared
  components under `src/components/buyer/`.
- API: add address save and payment-method token methods to `types.ts`, `mock.ts`, `http.ts`.
- i18n: add every new user-facing string to `en.ts` and `hi.ts`.
- Router: add `/orders/:id` detail route; keep all phase-1 aliases. Add return-path handling in
  `RoleGuard`, `LoginPage`, `OtpPage`, and the ProductPage wishlist save.
- Tests: `BUY-16.test.tsx`, `AUTH-01.test.tsx`, `AUTH-03.test.ts`, `NFR-08.test.ts`,
  `AUTH-07.test.tsx`, `BUY-15.test.tsx`, `NFR-07.test.ts`, `ranking.test.ts`.
- Docs: update `docs/TRACEABILITY.md` and `docs/PROGRESS.md`.

## Requirement IDs covered
AUTH-01, AUTH-02, AUTH-03, AUTH-07, BUY-01, BUY-02, BUY-03, BUY-05, BUY-12, BUY-13,
BUY-14, BUY-15, BUY-16, BUY-17, NFR-07, NFR-08, NFR-11, NFR-14, plus section 6.1
screen map items (home, search, occasion, shop profile, orders, wishlist, support, profile).

## Tests to write
- BUY-16: guests browse buyer routes; checkout and wishlist save redirect to login with a return path.
- AUTH-01: OTP resend unlocks after 30 s and the WhatsApp option appears after a timeout.
- AUTH-03 + NFR-08: consent toggles are independent and survive remount/reload.
- AUTH-07: switching buyer/shop/rider never asks for OTP.
- BUY-15: home renders cached products when the mock API fails; offline banner shows last-updated time.
- NFR-07: every `t('key')` on the new screens exists in both languages.
- ranking: availability, fit and ETA each affect order deterministically.

## Verification
`npm run build`, `npm run lint`, `npm test`, production-bundle dev-string grep, then commit
`phase 2: auth, discovery and account surfaces`.
