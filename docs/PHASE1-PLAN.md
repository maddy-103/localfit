# Phase 1 plan — try-at-door buyer flow

## Files to create / replace
- Replace stubs: `src/routes/buyer/ProductPage.tsx`, `BagPage.tsx`, `CheckoutPage.tsx`,
  `OrderConfirmedPage.tsx`, `OrderTrackPage.tsx`, `OrderTrialPage.tsx`, `OrderReturnPage.tsx`.
- New buyer components in `src/components/buyer/` (gallery, info, shop card, sheets, size picker,
  tabs, stock badge, bag group/line/summary/hold, sign-in stub, address, payment options,
  trial terms, timeline, ETA countdown, trial rows, locked summary, return form bits).
- New hooks in `src/lib/`: `useOnScreen.ts` (terms visibility gate). Extend `src/i18n/en.ts` + `hi.ts`
  with one ETA-announcement key. Extend `src/routes/router.tsx` with `/orders/:id/*` aliases.
- Extend `src/components/DemoPanel.tsx` with dev-only order-flow controls (already DEV-gated in
  `RootLayout.tsx`; will verify production `dist` contains none of its strings).
- Update `docs/TRACEABILITY.md`, `docs/PROGRESS.md`.

## Requirement IDs covered
BUY-03, BUY-04, BUY-05, BUY-06, BUY-07, BUY-08, BUY-09, BUY-10, BUY-11, BUY-14,
BUY-16, TRIAL-01, TRIAL-02, TRIAL-03, SPEC 8.2 (exact trial terms + payment rules),
SPEC 13 (timer default return + refund/hold release, three wrong OTPs log support),
RES-9 (one order per shop), RES-10 (COD rules), RIDE-04 (buyer-visible drop timer/OTP),
plus resolved ambiguities 1, 7, 8, 11, 12, 16.

## Tests to write (named with the requirement ID)
- `BUY-04`: product page shows the ETA window before the Add to bag control.
- `BUY-08`: Pay disabled until the trial terms are actually on screen and ticked.
- `SPEC 13`: timer expiry marks unmarked items Return and records release/refund.
- `TRIAL-02`: remounting the trial screen shows time computed from stored `trialEndsAt`.
- `TRIAL-03`: every keep/return decision writes its own timestamped event.
- Size swap creates a request without locking or changing decisions.
- Full demo path: place > accept > assign > arrive > OTP > trial > decisions > delivered,
  with every event present in the timeline.
- Plus product size-guard announcement, COD gating, bag grouping, and Dev-only build check.

## Verification
`npm run build`, `npm run lint`, `npm test`, production-bundle grep for dev-only strings,
then `git commit` (`phase 1: try-at-door buyer flow`) and a final `docs/PROGRESS.md` commit.
