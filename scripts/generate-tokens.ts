/**
 * Generates committed design-token artefacts from src/styles/tokens.ts:
 *   - src/styles/tokens.css
 *   - figma/design-tokens.json
 *
 * Usage: npm run tokens
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tokensToCss, tokensToFigma } from '../src/styles/tokens';

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

console.log('Tokens generated.');
