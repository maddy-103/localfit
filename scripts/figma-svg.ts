/** Tiny SVG frame builder for the generated Figma reference frames. */
import { createElement, Fragment } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  colors,
  fontFamilies,
  fontWeights,
  layout,
  radii,
} from '../src/styles/tokens';
import type { IconName } from '../src/components/icons/Icon';
import { PATHS } from '../src/components/icons/iconPaths';

export type Family = 'heading' | 'body' | 'mono';

export const FONTS: Record<Family, string> = {
  heading: fontFamilies.heading.split(',')[0]!.replace(/'/g, ''),
  body: fontFamilies.body.split(',')[0]!.replace(/'/g, ''),
  mono: 'ui-monospace, monospace',
};

const escapeXml = (value: string): string =>
  value.replace(/[&<>"']/g, (char) =>
    char === '&' ? '&amp;' : char === '<' ? '&lt;' : char === '>' ? '&gt;' : char === '"' ? '&quot;' : '&apos;',
  );

const round = (value: number): number => Math.round(value * 10) / 10;

function wrap(text: string, maxWidth: number, size: number, heading: boolean): string[] {
  const perLine = Math.max(8, Math.floor(maxWidth / (size * (heading ? 0.62 : 0.52))));
  const lines: string[] = [];
  let current = '';
  for (const word of text.split(/\s+/)) {
    const next = current ? `${current} ${word}` : word;
    if (current && next.length > perLine) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export interface TextOptions {
  size?: number;
  family?: Family;
  weight?: number;
  fill?: string;
  maxWidth?: number;
  lineHeight?: number;
  anchor?: 'start' | 'middle' | 'end';
  tracking?: string;
}

export interface RectOptions {
  radius?: number;
  stroke?: string;
  strokeWidth?: number;
}

export interface ButtonOptions {
  disabled?: boolean;
  outline?: boolean;
  labelSize?: number;
  icon?: IconName;
}

export class Frame {
  private readonly parts: string[] = [];

  constructor(
    readonly width: number,
    readonly height: number,
    readonly label: string,
  ) {
    this.rect('frame-background', 0, 0, width, height, colors.bg);
  }

  rect(id: string, x: number, y: number, w: number, h: number, fill: string, options: RectOptions = {}): void {
    const radius = options.radius === undefined ? '' : ` rx="${round(options.radius)}"`;
    const stroke = options.stroke ? ` stroke="${options.stroke}" stroke-width="${options.strokeWidth ?? 1}"` : '';
    this.parts.push(
      `<rect id="${id}" x="${round(x)}" y="${round(y)}" width="${round(w)}" height="${round(h)}" fill="${fill}"${radius}${stroke}/>`,
    );
  }

  line(id: string, x1: number, y1: number, x2: number, y2: number, stroke: string = colors.line, strokeWidth = 1): void {
    this.parts.push(
      `<path id="${id}" d="M${round(x1)} ${round(y1)}L${round(x2)} ${round(y2)}" stroke="${stroke}" stroke-width="${strokeWidth}" fill="none"/>`,
    );
  }

  icon(id: string, name: IconName, x: number, y: number, size = 24, fill: string = colors.ink): void {
    // Icon-only controls get an explicit 44px layer so the Figma frame records
    // the accessibility touch target even when the drawn glyph is smaller.
    const target = Math.max(TAP_MIN, size + 20);
    this.rect(`${id}-hit-area`, x + (size - target) / 2, y + (size - target) / 2, target, target, 'none');
    const geometry = renderToStaticMarkup(createElement(Fragment, null, PATHS[name]))
      .replaceAll('currentColor', fill)
      .replaceAll('var(--bg)', colors.bg);
    this.parts.push(
      `<g id="${id}" transform="translate(${round(x)} ${round(y)}) scale(${round(size / 24)})">${geometry}</g>`,
    );
  }

  /** Returns the bottom baseline + descent so callers can stack blocks. */
  text(id: string, x: number, baseline: number, value: string, options: TextOptions = {}): number {
    const size = options.size ?? 16;
    const family = options.family ?? 'body';
    const weight = options.weight ?? Number(fontWeights.body);
    const maxWidth = options.maxWidth ?? this.width - x - 16;
    const lineHeight = options.lineHeight ?? 1.35;
    const tracking = options.tracking ? ` letter-spacing="${options.tracking}"` : '';
    const anchor = options.anchor ? ` text-anchor="${options.anchor}"` : '';
    const lines = wrap(value, maxWidth, size, family === 'heading');
    lines.forEach((line, index) => {
      this.parts.push(
        `<text id="${id}-line-${index + 1}" x="${round(x)}" y="${round(baseline + index * size * lineHeight)}" font-family="${FONTS[family]}" font-weight="${weight}" font-size="${size}" fill="${options.fill ?? colors.ink}"${anchor}${tracking}>${escapeXml(line)}</text>`,
      );
    });
    return baseline + Math.max(0, lines.length - 1) * size * lineHeight + size * 0.35;
  }

  button(id: string, x: number, y: number, w: number, h: number, label: string, options: ButtonOptions = {}): void {
    const size = Math.max(44, h);
    const fill = options.disabled ? colors.field : options.outline ? colors.bg : colors.ink;
    const stroke = options.outline ? ` stroke="${colors.ink}" stroke-width="1.5"` : '';
    this.rect(id, x, y, w, size, fill, { radius: Number(radii.pill.replace('px', '')), ...(stroke ? { stroke: colors.ink, strokeWidth: 1.5 } : {}) });
    const textX = options.icon ? x + 44 : x + w / 2;
    this.text(`${id}-label`, options.icon ? textX : x + 8, y + size / 2 + 6, label, {
      size: options.labelSize ?? 16,
      weight: Number(fontWeights.bold),
      fill: options.disabled ? colors.muted : options.outline ? colors.ink : colors.bg,
      maxWidth: w - (options.icon ? 56 : 16),
      anchor: options.icon ? 'start' : 'middle',
    });
    if (options.icon) this.icon(`${id}-icon`, options.icon, x + 12, y + (size - 24) / 2, 24, options.disabled ? colors.muted : colors.ink);
  }

  photo(id: string, x: number, y: number, w: number, h: number, tone: keyof typeof colors = 'toneSand'): void {
    this.rect(id, x, y, w, h, colors[tone], { radius: Number(radii.card.replace('px', '')) });
  }

  build(): string {
    return [
      `<svg xmlns="http://www.w3.org/2000/svg" width="${this.width}" height="${this.height}" viewBox="0 0 ${this.width} ${this.height}" role="img" aria-label="${escapeXml(this.label)}">`,
      `  <title>${escapeXml(this.label)}</title>`,
      ...this.parts.map((part) => `  ${part}`),
      '</svg>',
      '',
    ].join('\n');
  }
}

/** Shared console chrome: a compact top bar at mobile, a sidebar at desktop. */
export function consoleChrome(frame: Frame, role: 'shop' | 'rider' | 'admin', title: string): number {
  const { width } = frame;
  if (width <= 360) {
    frame.rect('console-topbar', 0, 0, width, 64, colors.ink);
    frame.text('console-role', 16, 40, role.toUpperCase(), {
      family: 'heading',
      size: 20,
      weight: Number(fontWeights.heading),
      fill: colors.bg,
      tracking: '1.28px',
    });
    frame.rect('console-page-background', 0, 64, width, frame.height - 64, colors.soft);
    return 88;
  }
  frame.rect('console-sidebar', 0, 0, 240, frame.height, colors.ink);
  frame.text('console-sidebar-label', 24, 56, 'LOCALFIT', {
    family: 'heading',
    size: 24,
    weight: Number(fontWeights.heading),
    fill: colors.bg,
  });
  const items = ['Home', 'Orders', 'Inventory', 'Reports', 'Settings'];
  items.forEach((item, index) => {
    frame.text(`console-nav-${index}`, 24, 128 + index * 56, item, {
      size: 16,
      fill: index === 0 ? colors.bg : colors.onInkMuted,
    });
  });
  frame.rect('console-page-background', 240, 0, width - 240, frame.height, colors.soft);
  frame.text('console-page-title', 280, 64, title, {
    family: 'heading',
    size: 40,
    weight: Number(fontWeights.heading),
    maxWidth: width - 560,
  });
  frame.rect('console-content', 280, 96, width - 560, frame.height - 160, colors.bg, { radius: Number(radii.card.replace('px', '')) });
  return 128;
}

export const TAP_MIN = Number(layout.tapMin.replace('px', ''));
