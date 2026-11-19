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
