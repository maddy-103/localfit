/** Shared checks for generated Figma artefacts and their committed copies. */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ICON_NAMES } from '../src/components/icons/Icon';
import { tokensToFigma } from '../src/styles/tokens';
import { figmaIcons } from './figma-icons';
import { figmaScreens } from './generate-figma-screens';

const here = dirname(fileURLToPath(import.meta.url));
export const ROOT = resolve(here, '..');

export interface FrameEntry {
  id: string;
  name: string;
  route: string;
  role: string;
  priority: string;
  widths: number[];
}

const FORBIDDEN = /<(foreignObject|filter|feGaussianBlur|linearGradient|radialGradient|image)\b/i;
const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function committed(path: string): string | null {
  const absolute = join(ROOT, path);
  return existsSync(absolute) ? readFileSync(absolute, 'utf8') : null;
}

function validSvg(svg: string, file: string, errors: string[]): void {
  if (!svg.startsWith('<svg ') || !svg.trimEnd().endsWith('</svg>')) errors.push(`${file}: not a standalone SVG`);
  if (Buffer.byteLength(svg, 'utf8') >= 60 * 1024) errors.push(`${file}: 60 KB limit exceeded`);
  if (FORBIDDEN.test(svg)) errors.push(`${file}: forbidden SVG feature`);

  const ids = new Set<string>();
  for (const match of svg.matchAll(/\sid="([^"]+)"/g)) {
    const id = match[1]!;
    if (ids.has(id)) errors.push(`${file}: duplicate layer id ${id}`);
    ids.add(id);
    if (!KEBAB.test(id)) errors.push(`${file}: layer id is not kebab-case: ${id}`);
  }
  for (const match of svg.matchAll(/<text\b[^>]*>/g)) {
    const tag = match[0];
    if (!/font-family="[^"]+"/.test(tag) || !/font-weight="\d+"/.test(tag) || !/font-size="([\d.]+)"/.test(tag)) {
      errors.push(`${file}: text layer missing font attributes`);
    }
    const size = tag.match(/font-size="([\d.]+)"/);
    if (size && Number(size[1]) < 16) errors.push(`${file}: body text below 16 px`);
  }
  for (const match of svg.matchAll(/<rect\b[^>]*id="([^"]+-button)"[^>]*height="([\d.]+)"/g)) {
    if (Number(match[2]) < 44) errors.push(`${file}: touch target below 44 px (${match[1]})`);
  }
  for (const match of svg.matchAll(/<rect\b[^>]*height="([\d.]+)"[^>]*id="([^"]+-hit-area)"/g)) {
    if (Number(match[1]) < 44) errors.push(`${file}: hit area below 44 px (${match[2]})`);
  }
  for (const match of svg.matchAll(/<rect\b[^>]*id="([^"]+)"[^>]*height="([\d.]+)"/g)) {
    if (match[1]!.includes('hit-area') && Number(match[2]) < 44) errors.push(`${file}: hit area below 44 px (${match[1]})`);
  }
  const dimensions = svg.match(/width="(\d+)" height="(\d+)"/);
  if (!dimensions) errors.push(`${file}: missing frame dimensions`);
  else {
    const frameWidth = Number(dimensions[1]);
    const frameHeight = Number(dimensions[2]);
    if (!file.includes(`-${frameWidth}.svg`)) errors.push(`${file}: frame width mismatch`);
    for (const match of svg.matchAll(/<rect id="([^"]+)" x="([-\d.]+)" y="([-\d.]+)" width="([\d.]+)" height="([\d.]+)"/g)) {
      const [, id, x, y, w, h] = match;
      if (Number(x) < 0 || Number(y) < 0 || Number(x) + Number(w) > frameWidth + 0.5 || Number(y) + Number(h) > frameHeight + 0.5) {
        errors.push(`${file}: layer ${id} is outside the frame`);
      }
    }
  }
}

/** Returns every drift or spec violation found in the committed artefacts. */
export function validateFigma(): string[] {
  const errors: string[] = [];

  const tokens = committed('figma/design-tokens.json');
  if (tokens === null) errors.push('figma/design-tokens.json: missing');
  else if (tokens !== `${JSON.stringify(tokensToFigma(), null, 2)}\n`) errors.push('figma/design-tokens.json: regenerate with npm run tokens');
  const expectedGroups = [
    'color', 'spacing', 'borderRadius', 'boxShadow', 'fontFamilies', 'fontSizes',
    'lineHeights', 'letterSpacing', 'motion', 'sizing', 'typography',
  ];
  const parsed = tokens ? (JSON.parse(tokens) as Record<string, unknown>) : {};
  for (const group of expectedGroups) if (!(group in parsed)) errors.push(`design-tokens.json: missing group ${group}`);

  const icons = figmaIcons();
  for (const name of ICON_NAMES) {
    if (!(name in icons)) errors.push(`icons: missing export for ${name}`);
    const svg = committed(`figma/icons/${name}.svg`);
    if (svg === null) errors.push(`figma/icons/${name}.svg: missing`);
    else if (svg !== icons[name]) errors.push(`figma/icons/${name}.svg: regenerate with npm run tokens`);
  }
  const iconDir = join(ROOT, 'figma/icons');
  for (const file of readdirSync(iconDir)) {
    if (!ICON_NAMES.includes(file.replace(/\.svg$/, '') as (typeof ICON_NAMES)[number])) errors.push(`figma/icons/${file}: unexpected icon`);
  }

  const framesPath = join(ROOT, 'figma/frames.json');
  const frames: FrameEntry[] = existsSync(framesPath) ? JSON.parse(readFileSync(framesPath, 'utf8')) as FrameEntry[] : [];
  if (!frames.length) errors.push('figma/frames.json: missing or empty');
  const ids = new Set<string>();
  for (const frame of frames) {
    if (ids.has(frame.id)) errors.push(`frames.json: duplicate id ${frame.id}`);
    ids.add(frame.id);
    if (frame.priority !== 'M') errors.push(`frames.json: ${frame.id} is not priority M`);
    if (frame.name !== frame.id.replace(/\./g, '/')) errors.push(`frames.json: ${frame.id} has mismatched name`);
    if (!['buyer', 'shop', 'rider', 'admin'].includes(frame.role)) errors.push(`frames.json: ${frame.id} has invalid role`);
    if (!frame.route.startsWith('/')) errors.push(`frames.json: ${frame.id} has invalid route`);
    if (JSON.stringify(frame.widths) !== JSON.stringify([360, 768, 1440])) errors.push(`frames.json: ${frame.id} has invalid widths`);
  }

  const screens = figmaScreens();
  const screenDir = join(ROOT, 'figma/screens');
  for (const [file, svg] of Object.entries(screens)) {
    validSvg(svg, file, errors);
    const svgFile = committed(`figma/screens/${file}`);
    if (svgFile === null) errors.push(`figma/screens/${file}: missing`);
    else if (svgFile !== svg) errors.push(`figma/screens/${file}: regenerate with npm run figma:screens`);
  }
  for (const file of readdirSync(screenDir)) {
    if (!(file in screens)) errors.push(`figma/screens/${file}: unexpected frame`);
  }
  const home = screens['buyer-home-1440.svg'] ?? '';
  for (const id of ['hero-title', 'need-today-title', 'occasion-title']) {
    if (!home.includes(`id="${id}`)) errors.push(`buyer-home-1440.svg: missing ${id} layer`);
  }
  const hasLayer = (svg: string, id: string): boolean => svg.includes(`id="${id}"`) || svg.includes(`id="${id}-`);
  const checkout = screens['buyer-checkout-360.svg'] ?? '';
  if (!checkout.includes('id="trial-terms-block"')) errors.push('buyer-checkout-360.svg: missing trial terms block');
  if (!checkout.includes('id="pay-button-disabled"')) errors.push('buyer-checkout-360.svg: missing disabled pay button');
  if (!(screens['buyer-checkout-pay-enabled-360.svg'] ?? '').includes('id="pay-button-enabled"')) errors.push('buyer-checkout-pay-enabled-360.svg: missing enabled pay button');
  if (!hasLayer(screens['buyer-trial-360.svg'] ?? '', 'timer-remaining')) errors.push('buyer-trial-360.svg: missing timer layer');
  if (!hasLayer(screens['buyer-trial-timer-ending-360.svg'] ?? '', 'timer-remaining')) errors.push('buyer-trial-timer-ending-360.svg: missing timer layer');

  return errors;
}
