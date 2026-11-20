# Theme diff — `docs/THEME.md` only

Date: 2026-11-20

## Constraint and method

- `docs/reference/theme.png` could not be visually inspected under this audit's constraints.
- **This is not a pixel comparison against the reference image. It is a comparison against `docs/THEME.md` only.**
- Evidence below comes from source CSS plus computed-style/DOM inspection on the local dev server at 1440×900 and 360×800 for:
  - `/`
  - `/search`
  - `/product/prod-kurta-set`
  - `/bag`
- Treat all observations as a computed-style proxy for visual fidelity, not a screenshot diff.

## Severity key

- **P1** — prominent above-the-fold or page-title mismatch.
- **P2** — visible component/affordance mismatch.
- **P3** — small detail or motion gap.

## Aligned with `docs/THEME.md`

- Page width/gutters match: desktop gutter `100px`, mobile gutter `16px`, max width `1240px`.
- White page, black Accent, grey tiles, gold stars, and red sale pills are broadly present.
- Body copy computes to Satoshi `16px`; H1 computes to Archivo `64px` desktop / `36px` mobile, uppercase; H2 computes to Archivo `48px` desktop / `32px` mobile.
- Controls use pill radii; cards/sheets use `20px` radii.
- Product detail shows 3 thumbnails with `20px` tile spacing, gold stars `rgb(255,198,51)` / `#FFC633`, old price struck through, and a red discount pill using `rgba(255,51,51,.1)` / `#C62828`.
- Price computes to Archivo `24px`, weight `900`.
- Cart summary card uses `20px` radius, `1px` `--line` border, and no card shadow, as required.
- Only the two allowed four-point sparkle stars were found in the hero; no gradients, glassmorphism, blurred blobs, parallax, or AI-style decoration found.
- Marquee duration computes to `30s`; reduced-motion is handled by dropping it to `0.001s` (see P3 note below).

## Deviations

| # | Severity | Area | `docs/THEME.md` expectation | Observed proxy | Location |
| --- | --- | --- | --- | --- | --- |
| T-01 | P1 | Home hero CTA | Solid black pill CTA, approximately `210×52` | White outlined CTA, `124×44` | `/` hero |
| T-02 | P1 | Home hero stats | `200+`, `2,000+`, `30,000+` stat labels | `5`, `8`, `12k` | `src/routes/buyer/HomePage.tsx` hero stats |
| T-03 | P1 | Home hero media | 4:5 image frame | 1:1 frame | `/` hero computed aspect ratio |
| T-04 | P1 | Home section headings | H2 scale `48px` desktop / `32px` mobile | `24px` / `20px` | `/` section titles |
| T-05 | P1 | Cart heading | `YOUR CART` uppercase Archivo | `Bag` | `/bag` H1 |
| T-06 | P2 | Product title | Heading-font treatment / H3 scale | Satoshi `20px` | `/product/prod-kurta-set` title |
| T-07 | P2 | Product card name | `20px` | `16px` | Home/search product cards |
| T-08 | P2 | Product tabs | Visible active underline | Not found; computed `border-bottom: 0px none` on active tab | `/product/prod-kurta-set` |
| T-09 | P2 | Product ratings block | Theme review/rating treatment with gold stars | Area shows “Coming in phase 2” placeholder | `/product/prod-kurta-set` |
| T-10 | P2 | Brand strip | Six shop names | Five shop names | `/` brand strip |
| T-11 | P2 | Header/search affordances | Search icon and Shop chevron; guest user icon | Search icon missing at 360px, Shop chevron missing, “Sign in” text replaces guest icon | Header at `/` and `/search` |
| T-12 | P2 | Cart discount row | Discount row shown when MRP is present | No Discount row despite MRP display | `/bag` summary |
| T-13 | P2 | Cart responsive layout | Summary aligns beside items at larger widths | Summary stacks on mobile; verify intended breakpoint against THEME.md layouts | `/bag` at 360px |
| T-14 | P3 | Home motion | Hero rise/stagger and count-up on stats | Not found in computed DOM/CSS inspection | `/` hero |
| T-15 | P3 | Product motion | Product row fade-up | Not found | Product grid/cards |
| T-16 | P3 | Route motion | Short route fade | Not found | Route transitions |
| T-17 | P3 | Announcement motion | Announcement collapse | Not found | Announcement bar |
| T-18 | P3 | Timeline motion | Timeline draw | Not found | Order timeline surfaces |
| T-19 | P3 | Reduced-motion marquee | Respect reduced motion without effectively removing content | Marquee drops to `0.001s`; acceptable only if reduced-motion spec intends a static strip | Marquee CSS |

## Notes on ambiguous items

- T-09 may be acceptable if ratings/reviews are explicitly phase-2 in the product spec, but it remains a visible difference from `docs/THEME.md`.
- T-13 was observed only at the 360px proxy width; THEME.md's cart layout intent should be rechecked before changing it.
- T-19 is a verification item rather than a confirmed defect: the implementation does respect reduced motion, but by collapsing duration instead of presenting a static marquee.

## Suggested fix order

1. Fix the hero CTA, stat values, and 4:5 media frame; these dominate the first viewport.
2. Apply the H2 scale to home section titles and change the cart H1 to `YOUR CART`.
3. Correct product title/card-name type, active tab underline, and header icons.
4. Add the Discount row and verify the cart breakpoint against THEME.md layouts.
5. Implement the named motion list with transform/opacity only, `150–300ms`, and proper reduced-motion fallbacks.
