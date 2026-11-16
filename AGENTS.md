# LocalFit frontend: project rules

## Source of truth
- docs/SPEC.md is the product spec. Requirement IDs (BUY-06, SHOP-04, TRIAL-01, and so on) are binding.
- Implement every priority M requirement. Keep docs/TRACEABILITY.md current: columns ID | route or component | test file.
- Priority S and L items get only the placeholder screens that the sitemap lists, labelled "Coming in phase 2" through an i18n key. Do not add fake behaviour.
- Do not invent features outside the spec. If something is ambiguous, follow "Resolved ambiguities" below and list it in your final report.

## Resolved ambiguities (use these unless the spec changes)
1. Try-at-door order path: PLACED > SHOP_ACCEPTED > PACKED > RIDER_ASSIGNED > PICKED_UP > IN_TRANSIT > ARRIVED > OTP_VERIFIED > TRIAL_ACTIVE > DECISIONS_LOCKED > DELIVERED. Standard orders go OTP_VERIFIED > DELIVERED.
2. RETURN_IN_PROGRESS appears in SPEC section 10 but not in its transition table. Treat it as RETURN_PICKED for items the rider collects at the door. Document this in orderMachine.ts.
3. Shop accept timeout is not specified. Default: 5 minutes, configurable in admin config.
4. Fixed values from the spec: stock reservation 10 minutes (section 8.1), trial window 15 minutes (TRIAL-01), dispute SLA 24 hours (section 13).
5. Three wrong buyer OTP attempts open the support path and are logged (section 13).
6. Waiting compensation threshold: default 10 minutes, configurable.
7. SPEC section 10 has no row for OTP_VERIFIED. Use ARRIVED > OTP_VERIFIED, then OTP_VERIFIED > TRIAL_ACTIVE for try-at-door orders or OTP_VERIFIED > DELIVERED for standard orders. Entering the buyer OTP writes both events.
8. Exits the spec leaves out: REASSIGNED > RIDER_ASSIGNED; FAILED_DELIVERY > RETURN_PICKED (goods go back to the shop); REFUNDED > SETTLED; RESOLVED > SETTLED. SHOP_DECLINED, CANCELLED, CANCELLED_BY_SHOP, and RETURN_REJECTED are terminal. The buyer can cancel until SHOP_ACCEPTED, the shop until PACKED, and only an admin after PICKED_UP.
9. A bag with items from several shops creates one order per shop, linked by a checkoutId. One payment covers the checkout. Each order has its own ETA, trial window, and settlement.
10. COD (SPEC section 2): never for try-at-door orders. For standard orders, only for buyers with at least one completed prepaid order, and capped at 3,000 rupees per order until the buyer has three completed orders. Both numbers are configurable in admin config.
11. Stock holds: a bag hold lasts 10 minutes from Add to bag and ends on expiry, on removal, or on a counter sale (the buyer then sees the item as unavailable). Units on a placed order are committed. A counter sale against a committed unit creates a conflict record and never oversells.
12. Money is stored as integer paise and formatted with Intl.NumberFormat('en-IN'). Timestamps are ISO 8601 strings. IDs are strings.
13. SPEC section 4 says super admin needs "extra approval". Apply it to creating another super admin (a second super admin approves). Other staff are created by one super admin.
14. Late-night safe-zone guidance starts after 21:00 local time, configurable.
15. Shops and riders sign in through /login (phone OTP). The role check then opens /shop or /rider, or their registration status page if they are not approved. Admins sign in only at /admin/login.
16. The promised ETA window is computed in the mock API from shop prep time (default 15 minutes) plus distance at 20 km/h, shown as a 15-minute-wide range. A real backend replaces this.

## Stack (do not change without asking)
- React 18, Vite, TypeScript in strict mode
- React Router, with each role's routes lazy-loaded
- Zustand for client state. Use persist with localStorage only for session and settings.
- IndexedDB via idb-keyval for offline drafts, including photos
- CSS Modules, reading from design tokens in src/styles/tokens.css
- Vitest and @testing-library/react for unit and component tests
- Playwright and @axe-core/playwright for smoke and accessibility checks
- No Tailwind, Bootstrap, MUI, Chakra, Ant Design, or other UI kits. No emoji as icons.

## Architecture
- src/api/: types.ts holds every request and response type. client.ts exports one `api` object chosen by VITE_API_MODE (mock or http). mock.ts and http.ts both implement the same interface, so screens never change when the backend arrives. The mock adds latency, can fail through a dev flag, persists to IndexedDB, and syncs open tabs through BroadcastChannel, so a shop tab and a buyer tab see each other's changes within 3 seconds. api.subscribe(topic, callback) is the realtime hook (mock: BroadcastChannel; later: WebSocket or SSE). Components never import mock data or call fetch directly.
- Images: every image in the API is { url: string | null, alt, tone, width, height }. The Img component renders the url (lazy, with srcset when sizes are given) and falls back to a generated placeholder in the given tone, with the aspect ratio kept so pages don't shift. When the backend returns real urls, no component changes. The image base url comes from VITE_IMAGE_BASE.
- src/domain/: pure logic with no React imports. Includes orderMachine.ts, trial.ts (keep/return, default to return), payments.ts (method rules), settlements.ts, sla.ts, ranking.ts, permissions.ts, locationPolicy.ts.
- src/lib/clock.ts: every business timer reads now() from this clock. Tests inject a fake clock. Components never call Date.now() or setTimeout for business timers.
- src/i18n/: en.ts and hi.ts with identical keys. Every user-facing string uses t('key'). Hindi is required.
- src/components/ui/: design-system primitives. Screens compose them and never restyle them.
- src/routes/: one folder per role (auth, buyer, shop, rider, admin).
- One component per file. Keep files under 250 lines.

## Order states
- Only orderMachine.transition() changes an order's state. Components call API actions, and those actions call the machine.
- Every transition writes an event: id, orderId, from, to, actor {id, role}, timestamp, and optional gps and photoIds.
- Invalid transitions throw. The UI shows them as an error state and never ignores them silently.

## Design rules (anti-AI look, mandatory)
- Theme: follow docs/THEME.md and the picture at docs/reference/theme.png (the SHOP.CO look: white page, black pill buttons, heavy uppercase headings, grey tiles, gold stars, red discount pills). Use the tokens; never hard-code values in components.
- One spacing scale (4, 8, 12, 16, 24, 32, 48, 64). Radii follow docs/THEME.md: pill for controls, 20 px for tiles and cards.
- One accent (black), one neutral scale, and status colours. Status always uses icon + text + colour.
- Follow the theme's layouts. Do not add generic filler sections (feature trios, testimonial carousels, newsletter blocks) that the theme and the spec do not have.
- Write real microcopy, for example "Arrives in 45–60 min" or "Unmarked items go back with the rider". Never lorem ipsum, "Discover the magic", "Seamless experience", or "Your one-stop shop".
- No gradients, glassmorphism, blurred blobs, decorative shapes, or AI motifs. The only decoration allowed is the two four-point sparkle stars in the home hero, as in the theme. No parallax. No layout-moving hover effects.
- Motion follows the list in docs/THEME.md (hero rise, count-up, marquee, hover and state changes). Only transform and opacity animate. Durations 150–300 ms. Respect prefers-reduced-motion.
- Shadows: none on cards, one level for sheets and drawers.

## Accessibility and responsive
- Design mobile first at 360 px. Test at 360, 768, 1024, and 1440 px.
- Touch targets at least 44 px (48 px for primary actions in the shop console). Body text at least 16 px. WCAG AA contrast.
- Visible focus rings. Labels on all inputs. Skip link. aria-live for timers and status changes. Focus trapped in sheets and dialogs, which close on Escape.

## Every data screen has
Loading (skeleton matched to the layout), empty, error (with a next action), and offline (cached data plus a banner showing the last-updated time). All strings exist in both languages.

## Process
- At the start of each phase, write a short plan: files to create, requirement IDs covered, and tests to write. Then build without waiting for approval.
- Before ending a phase, run `npm run build`, `npm run lint`, and `npm test`. Fix failures before moving on.
- Commit with git at the end of each phase: "phase N: name".
- Final report: what was built, requirement IDs done, assumptions, and known gaps. Keep it under 15 bullets.

## Do not
- Store real secrets or API keys. Use placeholders in .env.example.
- Save drafts with photos to localStorage.
- Add stock or template images. Use the Img component, which falls back to a placeholder.
- Ship dev-only tools (DemoPanel, /_style) in production builds.