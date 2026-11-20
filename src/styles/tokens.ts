/**
 * LocalFit design tokens — the single source of truth.
 *
 * Nothing in this file is component-specific. Every colour, radius, spacing
 * step, type size, font family, motion value and shadow in the app comes from
 * here. `npm run tokens` regenerates:
 *   - src/styles/tokens.css
 *   - figma/design-tokens.json
 *
 * Values follow docs/THEME.md. The reference picture wins if they disagree.
 */

export const colors = {
  /** Page background */
  bg: '#FFFFFF',
  /** Hero band */
  soft: '#F2F0F1',
  /** Product image tiles */
  tile: '#F0EEED',
  /** Search field, chips, quantity stepper, inputs */
  field: '#F0F0F0',
  /** Text, black pill buttons, announcement bar, brand strip, footer */
  ink: '#000000',
  /** Pill-button hover from docs/THEME.md motion section */
  inkHover: '#222222',
  /** Secondary text */
  muted: 'rgba(0, 0, 0, 0.6)',
  /** Dividers and card borders */
  line: 'rgba(0, 0, 0, 0.1)',
  /** Rating stars */
  star: '#FFC633',
  /** Discount pill, delete icon, discount line */
  sale: '#FF3333',
  /** Red text under 18px uses this for AA contrast */
  saleText: '#C62828',
  /** Destructive button hover: darker than saleText so white text stays AA */
  saleTextHover: '#A31F1F',
  /** Discount pill background: the sale red at 10% opacity */
  saleBg: 'rgba(255, 51, 51, 0.1)',
  /** Verified tick. Always paired with a text label. */
  ok: '#01AB31',
  /** Sheet and dialog scrim */
  overlay: 'rgba(0, 0, 0, 0.45)',

  /** Text and lines on the black announcement bar, footer and brand strip. */
  onInkHover: 'rgba(255, 255, 255, 0.14)',
  onInkLine: 'rgba(255, 255, 255, 0.2)',
  onInkMuted: 'rgba(255, 255, 255, 0.6)',
  onInkSoft: 'rgba(255, 255, 255, 0.7)',
  onInkStrong: 'rgba(255, 255, 255, 0.8)',

  /** Placeholder photo tones from the API `image.tone` field. */
  toneSand: '#EFE6D8',
  toneRose: '#F3E1E0',
  toneSage: '#E2E8DF',
  toneSky: '#DFE8EE',
  toneLilac: '#E8E2EE',

  /** Status backgrounds and AA-contrast text pairs. */
  okBg: 'rgba(1, 171, 49, 0.1)',
  okText: '#00661A',
  starBg: 'rgba(255, 198, 51, 0.24)',
  starText: '#6B4B00',
} as const;

export const radii = {
  /** Buttons, search field, chips, size pills, quantity stepper, inputs */
  pill: '62px',
  /** Image tiles, filter panel, order summary, cards with a 1px line border */
  card: '20px',
  /** Avatars, dots and swatches */
  circle: '50%',
  /** Small status dots and thin indicators */
  xs: '4px',
  /** Hairline progress and chart fills */
  hairline: '2px',
} as const;

export const space = {
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '24px',
  6: '32px',
  7: '48px',
  8: '64px',
} as const;

export const durations = {
  fast: '150ms',
  base: '250ms',
  slow: '300ms',
} as const;

export const fontFamilies = {
  /** Archivo 900, width 125, uppercase. Noto Sans Devanagari for Hindi. */
  heading: "'Archivo', 'Noto Sans Devanagari', sans-serif",
  /** Satoshi 400/500/700. Inter and Noto Sans Devanagari fallbacks. */
  body: "'Satoshi', 'Inter', 'Noto Sans Devanagari', sans-serif",
  /** Codes, audit values and other monospace data. */
  mono: "ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace",
} as const;

export const fontWeights = {
  body: '400',
  medium: '500',
  bold: '700',
  heading: '900',
} as const;

export const lineHeights = {
  heading: '0.98',
  body: '1.5',
  tight: '1.2',
} as const;

/** Desktop / mobile sizes from docs/THEME.md, fluid where both are given. */
export const fontSizes = {
  h1: 'clamp(36px, 5vw, 64px)',
  h2: 'clamp(32px, 4vw, 48px)',
  h3: 'clamp(20px, 2.5vw, 24px)',
  productTitle: '20px',
  body: '16px',
  small: '14px',
  price: '24px',
  stat: 'clamp(24px, 3vw, 40px)',
  xs: '12px',
  lg: '20px',
  xl: '24px',
  xxl: '28px',
} as const;

/**
 * Concrete ends of the clamp() sizes above. THEME.md gives desktop / mobile
 * pairs; Figma cannot import clamp(), so both ends are exported as dimensions.
 */
export const fontSizesDesktop = {
  h1: '64px',
  h2: '48px',
  h3: '24px',
  productTitle: '20px',
  body: '16px',
  small: '14px',
  price: '24px',
  stat: '40px',
  xs: '12px',
  lg: '20px',
  xl: '24px',
  xxl: '28px',
} as const;

export const fontSizesMobile = {
  h1: '36px',
  h2: '32px',
  h3: '20px',
  productTitle: '20px',
  body: '16px',
  small: '14px',
  price: '24px',
  stat: '24px',
  xs: '12px',
  lg: '20px',
  xl: '24px',
  xxl: '28px',
} as const;

/**
 * Tracking used in component CSS, converted from em to px at the 16px body
 * base so Tokens Studio receives absolute, portable values.
 */
export const letterSpacing = {
  normal: '0px',
  heading: '-0.32px',
  display: '-0.16px',
  eyebrow: '1.28px',
  label: '0.96px',
  wide: '1.92px',
  code: '4.8px',
} as const;

export const layout = {
  maxWidth: '1240px',
  gutterMobile: '16px',
  gutterTablet: '32px',
  gutterDesktop: '100px',
  /** Minimum touch target everywhere (accessibility). */
  tapMin: '44px',
  /** Primary actions in the shop console. */
  tapPrimary: '48px',
} as const;

export const motion = {
  easing: 'cubic-bezier(.2,.7,.2,1)',
  reducedMotion: 'reduce',
} as const;

export const shadows = {
  /** The only shadow in the system: sheets, drawers and dialogs. */
  sheet: '0 24px 64px rgba(0, 0, 0, 0.18)',
} as const;

/** Flat CSS custom-property map used by the generator. */
export const cssTokens: Record<string, string> = {
  '--bg': colors.bg,
  '--soft': colors.soft,
  '--tile': colors.tile,
  '--field': colors.field,
  '--ink': colors.ink,
  '--ink-hover': colors.inkHover,
  '--muted': colors.muted,
  '--line': colors.line,
  '--star': colors.star,
  '--sale': colors.sale,
  '--sale-text': colors.saleText,
  '--sale-text-hover': colors.saleTextHover,
  '--sale-bg': colors.saleBg,
  '--ok': colors.ok,
  '--overlay': colors.overlay,
  '--on-ink-hover': colors.onInkHover,
  '--on-ink-line': colors.onInkLine,
  '--on-ink-muted': colors.onInkMuted,
  '--on-ink-soft': colors.onInkSoft,
  '--on-ink-strong': colors.onInkStrong,
  '--tone-sand': colors.toneSand,
  '--tone-rose': colors.toneRose,
  '--tone-sage': colors.toneSage,
  '--tone-sky': colors.toneSky,
  '--tone-lilac': colors.toneLilac,
  '--ok-bg': colors.okBg,
  '--ok-text': colors.okText,
  '--star-bg': colors.starBg,
  '--star-text': colors.starText,

  '--radius-pill': radii.pill,
  '--radius-card': radii.card,
  '--radius-circle': radii.circle,
  '--radius-xs': radii.xs,
  '--radius-hairline': radii.hairline,

  '--space-1': space[1],
  '--space-2': space[2],
  '--space-3': space[3],
  '--space-4': space[4],
  '--space-5': space[5],
  '--space-6': space[6],
  '--space-7': space[7],
  '--space-8': space[8],

  '--font-heading': fontFamilies.heading,
  '--font-body': fontFamilies.body,
  '--font-mono': fontFamilies.mono,
  '--fw-body': fontWeights.body,
  '--fw-medium': fontWeights.medium,
  '--fw-bold': fontWeights.bold,
  '--fw-heading': fontWeights.heading,
  '--lh-heading': lineHeights.heading,
  '--lh-body': lineHeights.body,
  '--lh-tight': lineHeights.tight,

  '--fs-h1': fontSizes.h1,
  '--fs-h2': fontSizes.h2,
  '--fs-h3': fontSizes.h3,
  '--fs-product-title': fontSizes.productTitle,
  '--fs-body': fontSizes.body,
  '--fs-small': fontSizes.small,
  '--fs-price': fontSizes.price,
  '--fs-stat': fontSizes.stat,
  '--fs-xs': fontSizes.xs,
  '--fs-lg': fontSizes.lg,
  '--fs-xl': fontSizes.xl,
  '--fs-2xl': fontSizes.xxl,

  '--dur-fast': durations.fast,
  '--dur-base': durations.base,
  '--dur-slow': durations.slow,
  '--ease': motion.easing,

  '--shadow-sheet': shadows.sheet,

  '--max-width': layout.maxWidth,
  '--tap-min': layout.tapMin,
  '--tap-primary': layout.tapPrimary,
};

/** Produces the complete tokens.css file body. */
export function tokensToCss(): string {
  const body = Object.entries(cssTokens)
    .map(([name, value]) => `  ${name}: ${value};`)
    .join('\n');

  return `/* AUTO-GENERATED by scripts/generate-tokens.ts — do not edit by hand. */
/* Source: src/styles/tokens.ts. Regenerate with: npm run tokens */

:root {
${body}
  --gutter: ${layout.gutterMobile};
}

@media (min-width: 768px) {
  :root {
    --gutter: ${layout.gutterTablet};
  }
}

@media (min-width: 1024px) {
  :root {
    --gutter: ${layout.gutterDesktop};
  }
}
`;
}

type FigmaTokenType =
  | 'color'
  | 'dimension'
  | 'fontFamily'
  | 'fontWeight'
  | 'duration'
  | 'cubicBezier'
  | 'shadow'
  | 'number'
  | 'typography';

type FigmaValue = string | number | [number, number, number, number] | Record<string, string | number>;

type FigmaToken = {
  $type: FigmaTokenType;
  $value: FigmaValue;
  $description?: string;
};

type FigmaGroup = {
  [key: string]: FigmaToken | FigmaGroup;
};

function colorGroup(): FigmaGroup {
  return Object.fromEntries(
    Object.entries(colors).map(([key, value]) => [key, { $type: 'color', $value: value }]),
  );
}

function dimensionGroup(source: Record<string, string>): FigmaGroup {
  return Object.fromEntries(
    Object.entries(source).map(([key, value]) => [key, { $type: 'dimension', $value: value }]),
  );
}

function numberGroup(source: Record<string, string>): FigmaGroup {
  return Object.fromEntries(
    Object.entries(source).map(([key, value]) => [key, { $type: 'number', $value: Number(value) }]),
  );
}

function durationGroup(source: Record<string, string>): FigmaGroup {
  return Object.fromEntries(
    Object.entries(source).map(([key, value]) => [key, { $type: 'duration', $value: value }]),
  );
}

/** Splits the single CSS shadow string into Tokens Studio's shadow object. */
function boxShadowToken(css: string): FigmaToken {
  const [rawX = '0', rawY = '0', rawBlur = '0', ...color] = css.split(' ');
  // CSS accepts a unitless 0; DTCG dimensions do not, so normalise it to px.
  const dimension = (value: string): string => (/^[\d.]+$/.test(value) ? `${value}px` : value);
  return {
    $type: 'shadow',
    $value: {
      color: color.join(' '),
      offsetX: dimension(rawX),
      offsetY: dimension(rawY),
      blur: dimension(rawBlur),
      spread: '0px',
    },
  };
}

type TypeKey = keyof typeof fontSizesDesktop;
const TYPE_STYLES: Record<
  TypeKey,
  { family: keyof typeof fontFamilies; weight: keyof typeof fontWeights; line: keyof typeof lineHeights; tracking: keyof typeof letterSpacing }
> = {
  h1: { family: 'heading', weight: 'heading', line: 'heading', tracking: 'heading' },
  h2: { family: 'heading', weight: 'heading', line: 'heading', tracking: 'heading' },
  h3: { family: 'heading', weight: 'heading', line: 'tight', tracking: 'heading' },
  productTitle: { family: 'body', weight: 'bold', line: 'tight', tracking: 'normal' },
  body: { family: 'body', weight: 'body', line: 'body', tracking: 'normal' },
  small: { family: 'body', weight: 'body', line: 'body', tracking: 'normal' },
  price: { family: 'body', weight: 'bold', line: 'tight', tracking: 'normal' },
  stat: { family: 'heading', weight: 'heading', line: 'heading', tracking: 'heading' },
  xs: { family: 'body', weight: 'body', line: 'body', tracking: 'normal' },
  lg: { family: 'body', weight: 'medium', line: 'tight', tracking: 'normal' },
  xl: { family: 'body', weight: 'medium', line: 'tight', tracking: 'normal' },
  xxl: { family: 'body', weight: 'medium', line: 'tight', tracking: 'normal' },
};

function typographyGroup(sizes: Record<TypeKey, string>): FigmaGroup {
  return Object.fromEntries(
    Object.entries(TYPE_STYLES).map(([key, style]) => [
      key,
      {
        $type: 'typography',
        $value: {
          fontFamily: fontFamilies[style.family],
          fontWeight: Number(fontWeights[style.weight]),
          fontSize: sizes[key as TypeKey],
          lineHeight: Number(lineHeights[style.line]),
          letterSpacing: letterSpacing[style.tracking],
        },
      },
    ]),
  );
}

/** Tokens Studio compatible W3C tokens generated from this file only. */
export function tokensToFigma(): FigmaGroup {
  return {
    color: colorGroup(),
    spacing: dimensionGroup(space),
    borderRadius: dimensionGroup(radii),
    boxShadow: { sheet: boxShadowToken(shadows.sheet) },
    fontFamilies: {
      heading: { $type: 'fontFamily', $value: fontFamilies.heading },
      body: { $type: 'fontFamily', $value: fontFamilies.body },
      mono: { $type: 'fontFamily', $value: fontFamilies.mono },
    },
    fontSizes: {
      desktop: dimensionGroup(fontSizesDesktop),
      mobile: dimensionGroup(fontSizesMobile),
    },
    lineHeights: numberGroup(lineHeights),
    letterSpacing: dimensionGroup(letterSpacing),
    motion: {
      duration: durationGroup(durations),
      easing: { standard: { $type: 'cubicBezier', $value: [0.2, 0.7, 0.2, 1] } },
    },
    sizing: {
      tapMin: { $type: 'dimension', $value: layout.tapMin },
      tapPrimary: { $type: 'dimension', $value: layout.tapPrimary },
      maxWidth: { $type: 'dimension', $value: layout.maxWidth },
      gutterMobile: { $type: 'dimension', $value: layout.gutterMobile },
      gutterTablet: { $type: 'dimension', $value: layout.gutterTablet },
      gutterDesktop: { $type: 'dimension', $value: layout.gutterDesktop },
    },
    typography: {
      desktop: typographyGroup(fontSizesDesktop),
      mobile: typographyGroup(fontSizesMobile),
    },
  };
}
