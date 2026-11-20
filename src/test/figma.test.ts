import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ICON_NAMES } from '@/components/icons/Icon';
import { tokensToFigma } from '@/styles/tokens';
import { figmaIcons } from '../../scripts/figma-icons';
import { SCREEN_WIDTHS, figmaScreens } from '../../scripts/generate-figma-screens';
import { ROOT, validateFigma } from '../../scripts/figma-validate';

describe('Figma package', () => {
  it('exports every required token group from the token source', () => {
    const tokens = tokensToFigma() as Record<string, unknown>;
    expect(Object.keys(tokens)).toEqual([
      'color', 'spacing', 'borderRadius', 'boxShadow', 'fontFamilies',
      'fontSizes', 'lineHeights', 'letterSpacing', 'motion', 'sizing', 'typography',
    ]);
    expect(Object.keys(tokens.fontSizes as object)).toEqual(['desktop', 'mobile']);
    expect(Object.keys(tokens.typography as object)).toEqual(['desktop', 'mobile']);
  });

  it('generates one icon SVG per code icon', () => {
    const icons = figmaIcons();
    expect(Object.keys(icons).sort()).toEqual([...ICON_NAMES].sort());
    for (const name of ICON_NAMES) {
      expect(readFileSync(resolve(ROOT, 'figma/icons', `${name}.svg`), 'utf8')).toBe(icons[name]);
    }
  });

  it('generates frames at 360 and 1440 for every requested state', () => {
    const screens = figmaScreens();
    expect(SCREEN_WIDTHS).toEqual([360, 1440]);
    for (const width of SCREEN_WIDTHS) {
      for (const name of [
        'buyer-home', 'buyer-category', 'buyer-product', 'buyer-cart', 'buyer-checkout',
        'buyer-track', 'buyer-trial', 'rider-drop', 'shop-listing-new', 'admin-disputes-detail',
      ]) {
        expect(screens).toHaveProperty(`${name}-${width}.svg`);
      }
    }
    expect(screens['buyer-checkout-360.svg']).toContain('id="trial-terms-block"');
    expect(screens['buyer-checkout-360.svg']).toContain('id="pay-button-disabled"');
    expect(screens['buyer-checkout-pay-enabled-360.svg']).toContain('id="pay-button-enabled"');
  });

  it('has no stale artefacts or SVG constraint violations', () => {
    expect(validateFigma()).toEqual([]);
  });
});
