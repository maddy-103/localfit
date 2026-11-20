/**
 * Build guard: component CSS must use generated design tokens for colours,
 * radii, font families and font sizes. Run with `npm run css:tokens`.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');
const ALLOWED_KEYWORDS = new Set(['transparent', 'currentcolor', 'inherit', 'initial', 'unset', 'none']);
const COLOUR_FUNCTIONS = new Set(['rgb', 'rgba', 'hsl', 'hsla', 'var']);

interface Finding {
  file: string;
  line: number;
  kind: string;
  value: string;
}

function cssFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return cssFiles(full);
    if (!entry.name.endsWith('.css')) return [];
    return path.relative(ROOT, full).replace(/\\/g, '/') === 'src/styles/tokens.css' ? [] : [full];
  });
}

/** @font-face declares the fonts; it is not a component using a font family. */
function stripFontFaces(text: string): string {
  return text.replace(/@font-face\s*\{[^}]*\}/g, (block) => block.replace(/[^\n]/g, ' '));
}

function check(file: string): Finding[] {
  const relative = path.relative(ROOT, file).replace(/\\/g, '/');
  const text = stripFontFaces(fs.readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, ''));
  const findings: Finding[] = [];
  const lines = text.split(/\r?\n/);

  lines.forEach((line, index) => {
    const lineNo = index + 1;
    const colour = line.match(/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\([^)]*\)/g);
    if (colour) {
      for (const value of colour) {
        findings.push({ file: relative, line: lineNo, kind: 'colour', value });
      }
    }

    const named = line.match(/\b(?:color|background|background-color|border-color|fill|stroke)\s*:\s*([a-zA-Z]+)\b/g);
    if (named) {
      for (const declaration of named) {
        const value = declaration.split(':')[1]?.trim().toLowerCase() ?? '';
        if (
          value &&
          !ALLOWED_KEYWORDS.has(value) &&
          !COLOUR_FUNCTIONS.has(value) &&
          !value.startsWith('var(')
        ) {
          findings.push({ file: relative, line: lineNo, kind: 'named colour', value });
        }
      }
    }

    const radius = line.match(/border-radius\s*:\s*([^;]+)/g);
    if (radius) {
      for (const declaration of radius) {
        const value = declaration.split(':')[1]?.trim() ?? '';
        const parts = value.split(/\s+/);
        if (!parts.every((part) => part === '0' || part.startsWith('var(--radius-'))) {
          findings.push({ file: relative, line: lineNo, kind: 'radius', value });
        }
      }
    }

    const family = line.match(/font-family\s*:\s*([^;]+)/g);
    if (family) {
      for (const declaration of family) {
        const value = declaration.split(':')[1]?.trim() ?? '';
        if (!value.startsWith('var(--font-')) {
          findings.push({ file: relative, line: lineNo, kind: 'font family', value });
        }
      }
    }

    const size = line.match(/font-size\s*:\s*([^;]+)/g);
    if (size) {
      for (const declaration of size) {
        const value = declaration.split(':')[1]?.trim() ?? '';
        if (
          !value.startsWith('var(--fs-') &&
          !['inherit', 'initial', 'unset', '0'].includes(value)
        ) {
          findings.push({ file: relative, line: lineNo, kind: 'font size', value });
        }
      }
    }
  });

  return findings;
}

const findings = cssFiles(SRC).flatMap(check);

if (!findings.length) {
  console.log('css: all colours, radii, font families and font sizes use generated tokens.');
  process.exit(0);
}

console.error(`css: ${findings.length} token violations:`);
for (const item of findings) {
  console.error(`  ${item.file}:${item.line} (${item.kind}) ${item.value}`);
}
process.exit(1);
