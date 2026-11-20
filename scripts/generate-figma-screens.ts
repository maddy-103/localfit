/**
 * Generates the committed Figma reference frames from tokens and app copy.
 * The fully editable route is html.to.design (see figma/README.md); these SVGs
 * are deterministic, token-accurate spec frames with named layers.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Frame } from './figma-svg';
import { cartFrame, checkoutFrame, trackFrame, trialFrame } from './figma-screens/buyer-flow';
import { categoryFrame, homeFrame, productFrame } from './figma-screens/buyer-discovery';
import { disputesDetailFrame, riderDropFrame, shopListingFrame } from './figma-screens/consoles';

type Builder = (width: number) => Frame;

interface FrameSpec {
  state?: string;
  build: Builder;
}

interface ScreenSpec {
  name: string;
  frames: FrameSpec[];
}

const SCREENS: ScreenSpec[] = [
  { name: 'buyer-home', frames: [{ build: homeFrame }] },
  { name: 'buyer-category', frames: [{ build: categoryFrame }] },
  { name: 'buyer-product', frames: [{ build: productFrame }] },
  {
    name: 'buyer-cart',
    frames: [
      { build: (width) => cartFrame(width) },
      { state: 'empty', build: (width) => cartFrame(width, true) },
    ],
  },
  {
    name: 'buyer-checkout',
    frames: [
      { build: (width) => checkoutFrame(width, false) },
      { state: 'pay-enabled', build: (width) => checkoutFrame(width, true) },
    ],
  },
  { name: 'buyer-track', frames: [{ build: trackFrame }] },
  {
    name: 'buyer-trial',
    frames: [
      { build: (width) => trialFrame(width, false) },
      { state: 'timer-ending', build: (width) => trialFrame(width, true) },
    ],
  },
  {
    name: 'rider-drop',
    frames: [
      { build: (width) => riderDropFrame(width, false) },
      { state: 'trial-active', build: (width) => riderDropFrame(width, true) },
    ],
  },
  {
    name: 'shop-listing-new',
    frames: [
      { build: (width) => shopListingFrame(width, false) },
      { state: 'draft-offline', build: (width) => shopListingFrame(width, true) },
    ],
  },
  {
    name: 'admin-disputes-detail',
    frames: [
      { build: (width) => disputesDetailFrame(width, false) },
      { state: 'evidence-restricted', build: (width) => disputesDetailFrame(width, true) },
    ],
  },
];

export const SCREEN_WIDTHS = [360, 1440] as const;

export function figmaScreens(): Record<string, string> {
  const files: Record<string, string> = {};
  for (const screen of SCREENS) {
    for (const frameSpec of screen.frames) {
      for (const width of SCREEN_WIDTHS) {
        const suffix = frameSpec.state ? `-${frameSpec.state}` : '';
        files[`${screen.name}${suffix}-${width}.svg`] = frameSpec.build(width).build();
      }
    }
  }
  return files;
}

const here = dirname(fileURLToPath(import.meta.url));
if (process.argv[1] && resolve(process.argv[1]) === resolve(here, 'generate-figma-screens.ts')) {
  const root = resolve(here, '..');
  for (const [name, svg] of Object.entries(figmaScreens())) {
    const path = resolve(root, 'figma/screens', name);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, svg, 'utf8');
  }
  console.log(`screens: generated ${Object.keys(figmaScreens()).length} frames`);
}
