# Font files for LocalFit

Place the following woff2 font files in this directory before running the app.
They are referenced by `src/styles/global.css` with `font-display: swap`, so
the system font stack renders immediately while they load.

## Required files

| File | Font | Variant |
|------|------|---------|
| `Archivo-VariableFont_wdth,wght.woff2` | Archivo | Variable (normal, wght 100–900, wdth) |
| `Archivo-Italic-VariableFont_wdth,wght.woff2` | Archivo | Variable (italic, wght 100–900) |
| `Satoshi-Regular.woff2` | Satoshi | Weight 400 |
| `Satoshi-Medium.woff2` | Satoshi | Weight 500 |
| `Satoshi-Bold.woff2` | Satoshi | Weight 700 |
| `NotoSansDevanagari-Regular.woff2` | Noto Sans Devanagari | Weight 400 |
| `NotoSansDevanagari-Bold.woff2` | Noto Sans Devanagari | Weight 700 |

## Where to get them

- **Archivo** – Google Fonts (OFL licence):
  <https://fonts.google.com/specimen/Archivo>
  Download the variable font family, pick the woff2 from the zip.

- **Satoshi** – Fontshare (free for personal & commercial use):
  <https://www.fontshare.com/fonts/satoshi>
  Download the woff2 static files for Regular, Medium, and Bold.

- **Noto Sans Devanagari** – Google Fonts (OFL licence):
  <https://fonts.google.com/noto/specimen/Noto+Sans+Devanagari>

## Note on placeholder files

During CI and design reviews the app renders with system font fallbacks
(Inter → system-ui) because the actual woff2 files are not committed to the
repository. Add them to `.gitignore` or use a private asset CDN for
production builds.
