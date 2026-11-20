/**
 * Exports the exact icon geometry used by <Icon> as standalone SVGs.
 * It renders the imported React nodes, so the Figma icon set cannot drift
 * away from src/components/icons/iconPaths.tsx.
 */
import { createElement, Fragment } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ICON_NAMES } from '../src/components/icons/Icon';
import { PATHS } from '../src/components/icons/iconPaths';

export function figmaIcons(): Record<string, string> {
  return Object.fromEntries(
    ICON_NAMES.map((name) => {
      const geometry = renderToStaticMarkup(createElement(Fragment, null, PATHS[name]));
      const svg = [
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none">',
        `  <title>${name}</title>`,
        `  ${geometry}`,
        '</svg>',
        '',
      ].join('\n');
      return [name, svg];
    }),
  );
}
