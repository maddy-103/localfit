# LocalFit

LocalFit is a React 18 + Vite + TypeScript storefront for clothes from nearby shops, with a
try-at-door flow. Buyers, shops, riders and admins each have their own console. The mock API is the
default so the whole app works without a backend.

## Requirements

- Node.js 20.19+ (Vite 7) and npm.
- Google Chrome for the Playwright checks (the project launches Chrome, not a downloaded Chromium).

## Install and run

```bash
npm install
npm run dev
```

The dev server listens on `http://localhost:5173`.

### Demo mode

```bash
cp .env.example .env.local
# set VITE_DEMO=true and keep VITE_API_MODE=mock
npm run dev
```

Demo mode shows the fixed buyer/shop/rider OTP **123456** and accepts it on `/login/otp`. In any
development build the **DemoPanel** launcher (bottom-right) can switch roles, change language, move
the clock, force API failures and drive orders through the try-at-door states. The dev-only design
gallery is at `/_style`. Neither is shipped in a production build.

### Demo logins (from `src/api/seed.ts`)

| Role | Route | Credential | Second factor | Seeded id |
| --- | --- | --- | --- | --- |
| Buyer | `/login` | `+91 98860 22110` (Ananya Iyer) | demo OTP `123456` | `buyer-ananya` |
| Shop | `/login` | `+91 98450 11221` (Kiran Silks) | demo OTP `123456` | `shop-kiran` |
| Rider | `/login` | `+91 97400 51234` (Arjun Nair) | demo OTP `123456` | `rider-arjun` |
| Admin | `/admin/login` | select **Owner · Super admin** (`+91 90000 00000`) | 2FA `246810` | `admin-owner` |

Shops and riders sign in through `/login`; the role check opens `/shop` or `/rider`, or their
registration status page if they are not approved. Admins sign in only at `/admin/login`. There is
exactly one seeded admin account; no other admin accounts, including support/finance/verifier
accounts, are seeded. Swap the placeholder owner name and phone in `src/api/seed.ts` before launch.

Other seeded identities (Rohan Mehta, Imran Sheikh, Priya Deshmukh and four more shops) are in
`src/api/seed.ts`.

## Tests and checks

```bash
npm run i18n        # Hindi key parity + hard-coded UI copy guard
npm run css:tokens  # component CSS uses generated colour/radius/font tokens
npm test            # Vitest unit/component/acceptance suite
npm run lint        # ESLint
npm run build       # i18n + CSS token guards, tsc --noEmit, vite build
npm run smoke       # Playwright: every route loads without console errors
npm run axe         # Playwright + axe on the core routes
npm run qa:ui       # full responsive/axe/overflow screenshot sweep
npm run test:e2e    # Playwright specs (keyboard flow, focus, reduced motion)
```

`npm run smoke` and `npm run axe` expect a dev server on `http://localhost:5173`; `npm run qa:ui`
and `npm run test:e2e` default to `http://127.0.0.1:5175`. Override with `SMOKE_BASE` and `QA_BASE`
respectively. QA screenshots and reports are written to `docs/qa/`.

## Production build

```bash
npm run build
npm run preview
```

`npm run build` fails if any English key is missing from `src/i18n/hi.ts`, if a component contains
untranslated visible copy, or if component CSS hard-codes a colour, radius, font family or font size
instead of a generated token. Dev-only code (`DemoPanel`, `/_style`) is behind `import.meta.env.DEV`
and is not present in `dist/`.

## Replacing the mock API with a real backend

1. Copy `.env.example` to `.env.local` and set:

   ```env
   VITE_API_MODE=http
   VITE_API_BASE=https://your-api.example/api
   ```

   `VITE_IMAGE_BASE` prefixes relative image URLs in `Img`; absolute and `data:` URLs are left
   alone. `VITE_WS_URL` and `VITE_MOCK_FAILURES` are reserved placeholders and are not read by the
   current adapters.

2. Implement the endpoints declared by the `Api` interface in `src/api/types.ts`. `src/api/client.ts`
   selects `mockApi` or `httpApi` from `VITE_API_MODE`; screens only import `api` from
   `src/api/client`.
3. Buyer endpoints live in `src/api/http.ts`; shop, rider and admin endpoints live in
   `src/api/httpShopApi.ts`, `src/api/httpRiderApi.ts` and `src/api/httpAdminApi.ts`. Keep the
   request/response shapes in `types.ts` unchanged and no screen needs to change.
4. Images must use `{ url, alt, tone, width, height }` (plus optional `srcSet`). Real photos should
   be WebP; the `Img` component keeps the aspect ratio and shows a tone placeholder when `url` is
   `null`.
5. `api.subscribe(topic, callback)` is currently backed by BroadcastChannel in the mock. Point the
   HTTP adapter at WebSocket or SSE for realtime updates; this is the one adapter seam that still
   needs backend work.
6. Money is integer paise, ids are strings and timestamps are ISO 8601 strings. Keep those contracts
   on the server.

## Project layout

- `src/api/` — shared types plus mock and HTTP adapters.
- `src/domain/` — pure order, payment, trial, settlement, SLA, ranking and permission logic.
- `src/components/ui/` — token-backed design-system primitives.
- `src/routes/` — one lazy-loaded folder per role.
- `src/i18n/` — `en.ts` and `hi.ts` with identical keys.
- `src/styles/tokens.css` — generated from `src/styles/tokens.ts` by `npm run tokens`.
- `docs/SPEC.md`, `docs/TRACEABILITY.md`, `docs/PROGRESS.md` — product spec, requirement map and
  phase history.
