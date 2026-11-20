/**
 * Generates committed design artefacts from the same source as tokens.css:
 *   - src/styles/tokens.css
 *   - figma/design-tokens.json  (Tokens Studio)
 *   - figma/icons/*.svg         (the code's <Icon> geometry)
 *
 * Usage: npm run tokens
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tokensToCss, tokensToFigma } from '../src/styles/tokens';
import { figmaIcons } from './figma-icons';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

function write(relativePath: string, contents: string): void {
  const absolute = resolve(root, relativePath);
  mkdirSync(dirname(absolute), { recursive: true });
  writeFileSync(absolute, contents, 'utf8');
  console.log(`  generated ${relativePath}`);
}

write('src/styles/tokens.css', tokensToCss());
write('figma/design-tokens.json', `${JSON.stringify(tokensToFigma(), null, 2)}\n`);
for (const [name, svg] of Object.entries(figmaIcons())) {
  write(`figma/icons/${name}.svg`, svg);
}

console.log('Tokens generated.');
