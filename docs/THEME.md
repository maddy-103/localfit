# LocalFit theme (SHOP.CO template look)

Reference picture: docs/reference/theme.png. If this file and the picture disagree, the picture wins.

## Fonts
- Headings: Integral CF Bold (extended, heavy, uppercase), line-height 0.95 to 1.0. It is a paid font. Without a licence, use Archivo at width 125 and weight 900 (Google Fonts, variable width axis).
- Body: Satoshi 400, 500, 700 (free from Fontshare). Fallback: Inter.
- Hindi and other Indian scripts: Noto Sans Devanagari for headings and body. Uppercase does not apply.
- Check the exact font names in the Figma text panel and change them here if they differ.
- Self-host the fonts in public/fonts as woff2 with font-display: swap, and preload the two main files. Do not link to Google Fonts at runtime.
- Type scale, desktop / mobile: H1 64 / 36, H2 48 / 32, H3 24 / 20, product title 20, body 16, small 14, price 24, stat number 40 / 24.

## Colours (tokens in src/styles/tokens.css)
--bg #FFFFFF       page
--soft #F2F0F1     hero band
--tile #F0EEED     product image tiles
--field #F0F0F0    search field, chips, quantity stepper, inputs
--ink #000000      text, black pill buttons, announcement bar, brand strip, footer
--muted rgba(0,0,0,.6)   secondary text
--line rgba(0,0,0,.1)    dividers and card borders
--star #FFC633     rating stars
--sale #FF3333     discount pill, delete icon, discount line. Pill background is the same red at 10% opacity. Red text under 18 px uses #C62828 for AA contrast.
--ok #01AB31       verified tick. Always paired with a text label.

## Shape and spacing
- Pill radius (62 px): buttons, search field, chips, size pills, quantity stepper, inputs.
- 20 px radius: image tiles, filter panel, order summary, cards with a 1 px --line border.
- Spacing scale 4, 8, 12, 16, 24, 32, 48, 64. Desktop gutter 100 px at 1440 wide, mobile gutter 16 px. Maximum content width 1240 px.
- No shadows on cards. One shadow for sheets and the cart drawer.

## Components, as in the picture
- Announcement bar: black, white 14 px text, "Sign up and get 20% off your first order. Sign Up Now" with an underlined link, and a close X on the right.
- Header: logo wordmark at left in the heading font. Nav links, with a small chevron on Shop. A wide grey search pill with a magnifier and the placeholder "Search for products...". Cart and user-circle icons on the right. Mobile: hamburger at left, logo, then search, cart, and user icons.
- Hero: --soft band. Left: H1 "FIND CLOTHES THAT MATCH YOUR OCCASION", a muted 16 px paragraph, a black pill "Shop Now" button (about 210 x 52), then three stats separated by thin vertical lines: "200+ Partner shops", "2,000+ Items in stock", "30,000+ Happy buyers". Right: a model photo placeholder cropped to the bottom of the band, with two large black four-point sparkle stars (one top right, one middle left). The live stock card floats at the bottom left of the photo. These two stars are the only decoration in the app.
- Brand strip: full-width black band with six partner shop names in white, spaced evenly. Use real LocalFit shop names, never the template's fashion brand names or logos.
- Section title: centered H2 (for example "NEW ARRIVALS"), a row of four product cards, and an outlined black pill "View all" button below.
- Product card: --tile image at 20 px radius, then the product name in bold 20 px, gold stars with "4.5/5", the price in bold 24 px, the old price struck through in muted, and a red percent-off pill. LocalFit adds the shop, distance, ETA, stock left, and a small black "Try at door" pill at the top left of the tile.
- Occasion chips: grey pill with a black check-circle icon at the left. Selected chip is black with white text.
- Category and search page: breadcrumb "Home > Casual", H1 "CASUAL", "Showing 1-10 of 100 products", and a sort control. Left filter panel (bordered card with a sliders icon): rows with chevrons, a two-handle price slider with black handles, colour swatch circles with a check on the selected one, size pills, and a black "Apply filter" pill. On mobile the same filters open in a bottom sheet from a sliders icon.
- Product page: three vertical thumbnails at the left, a large --tile main image, then at the right the title in the heading font, stars, price with old price and red pill, a short muted paragraph, then "Select colour", "Choose size" (selected pill is black), and a grey quantity stepper beside a black "Add to bag" pill. Below: tabs "Product details", "Ratings and reviews", "FAQs" with an underline on the active tab. Review cards have a 1 px border, the reviewer name, a green verified tick with a text label, and a posted-on date.
- Cart: H1 "YOUR CART". Rows in a bordered 20 px card: 100 px thumbnail tile, bold name, muted "Size: Large" and "Colour: White", bold price, a red trash icon at the top right, and a quantity stepper pill at the bottom right. At the right, an Order Summary card: Subtotal, Discount (shown only when one applies, in red), Delivery fee, a divider, bold Total, and a black pill "Go to checkout" with an arrow. On mobile the summary stacks under the rows.
- Quantity stepper: grey pill with minus and plus buttons, each at least 44 px.
- Footer: black, like the brand strip.

## Icons
Custom inline SVG set, no icon package. 24 px grid, 1.5 px stroke, round caps and joins, black. Filled exceptions: star (gold), sparkle (black), check-circle (black with a white tick), verified tick (green). The delete icon is red.
Names: cart, user-circle, search, menu, close, chevron-down, chevron-right, arrow-right, trash, sliders, minus, plus, check-circle, verified, star, sparkle, heart, pin, clock, door, camera, phone, shield, alert, wallet, box, truck, bell, mic, wifi-off, sos, settings, chart, file.

## Motion
- Pill buttons: black to #222222 on hover. Outline buttons fill black on hover.
- Product tile image scales to 1.03 inside its clipped tile on hover, 250 ms. Cards do not move.
- Home hero: headline, paragraph, button, and stats rise 16 px and fade in over 300 ms with a 60 ms stagger. The stock card follows 300 ms later.
- Stats count up once, when 60% visible, over 1.2 s with ease-out.
- Announcement bar close: height collapses over 200 ms. The choice is remembered for the session.
- Brand strip: continuous marquee, 30 s per loop. It pauses on hover and focus.
- Product rows: tiles fade up 12 px when first scrolled into view, 60 ms stagger, at most 8 items, once only.
- Chips, size pills, swatches: colour change over 150 ms. The chip check icon fades in.
- Adding without a size: the size row shakes 4 px over 400 ms, with an aria-live message.
- Quantity stepper: the number bumps to 1.15 scale over 150 ms.
- Add to bag: the bag count pops over 300 ms and a toast slides up over 250 ms, shown for 2.4 s.
- Cart drawer and sheets: slide in over 300 ms. The overlay fades over 250 ms.
- Loading skeletons: opacity pulses between 100% and 55% over 1.2 s. No gradient shimmer.
- Order status timeline: a new step's dot fills and the line draws over 300 ms.
- Trial timer: updates each second with no animation. In the last 2 minutes the text turns red with an alert icon and is announced once per minute. No flashing.
- Route change: content fades over 150 ms.
- Only transform and opacity animate, except the announcement bar collapse.
- Reduced motion: remove all of the above except colour changes. The marquee stops and the stats show their final numbers.

## Images
All images go through the Img component with { url, alt, tone, width, height } from the API. While url is null, Img draws a placeholder in that tone at the right aspect ratio: hero 4:5, product tiles 1:1, thumbnails 1:1, cart thumbnails 1:1. When the backend supplies real WebP urls, they replace the placeholders with no code changes. Do not copy the template's photos.