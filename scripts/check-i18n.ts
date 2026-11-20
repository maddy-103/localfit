/**
 * Build guard for Hindi parity and untranslated UI strings.
 * Run with `npm run i18n`; `npm run build` calls it first.
 */
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');

/** Attributes and object properties that hold user-visible copy. */
const COPY_KEYS = new Set([
  'label',
  'placeholder',
  'title',
  'aria-label',
  'alt',
  'caption',
  'description',
  'subtitle',
  'eyebrow',
  'intro',
  'note',
  'text',
  'header',
  'emptyTitle',
  'emptyBody',
  'confirmLabel',
  'message',
  'hint',
]);

interface Finding {
  file: string;
  line: number;
  kind: string;
  value: string;
}

function dictionaryKeys(file: string, variable: string): string[] {
  const text = fs.readFileSync(file, 'utf8');
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const keys: string[] = [];

  function visit(node: ts.Node): void {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === variable &&
      node.initializer
    ) {
      // en.ts is "as const"; hi.ts is a plain object literal.
      const initializer = ts.isAsExpression(node.initializer)
        ? node.initializer.expression
        : node.initializer;
      if (!ts.isObjectLiteralExpression(initializer)) return;
      for (const property of initializer.properties) {
        if (!ts.isPropertyAssignment(property)) continue;
        const name = property.name;
        if (ts.isStringLiteral(name) || ts.isIdentifier(name)) keys.push(name.text);
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(source);
  return keys;
}

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    if (!entry.name.endsWith('.tsx')) return [];
    if (entry.name.includes('.test.') || full.includes(`${path.sep}test${path.sep}`)) return [];
    return [full];
  });
}

function lineOf(source: ts.SourceFile, node: ts.Node): number {
  return source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
}

function untranslatedCopy(knownKeys: Set<string>): Finding[] {
  const findings: Finding[] = [];
  const isCopy = (value: string): boolean =>
    Boolean(value.trim()) && /[\p{L}]/u.test(value) && !knownKeys.has(value);

  for (const file of sourceFiles(SRC)) {
    const text = fs.readFileSync(file, 'utf8');
    const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const relative = path.relative(ROOT, file).replace(/\\/g, '/');

    function visit(node: ts.Node): void {
      if (ts.isJsxText(node)) {
        const value = node.text.trim();
        if (isCopy(value)) {
          findings.push({ file: relative, line: lineOf(source, node), kind: 'JSX text', value });
        }
      }
      if (ts.isJsxAttribute(node) && node.initializer && ts.isStringLiteral(node.initializer)) {
        const name = node.name.getText(source);
        if (COPY_KEYS.has(name) && isCopy(node.initializer.text)) {
          findings.push({
            file: relative,
            line: lineOf(source, node),
            kind: `attribute ${name}`,
            value: node.initializer.text,
          });
        }
      }
      if (
        ts.isPropertyAssignment(node) &&
        ts.isIdentifier(node.name) &&
        COPY_KEYS.has(node.name.text) &&
        ts.isStringLiteral(node.initializer) &&
        isCopy(node.initializer.text)
      ) {
        findings.push({
          file: relative,
          line: lineOf(source, node),
          kind: `property ${node.name.text}`,
          value: node.initializer.text,
        });
      }
      ts.forEachChild(node, visit);
    }

    visit(source);
  }

  return findings;
}

const enKeys = dictionaryKeys(path.join(SRC, 'i18n/en.ts'), 'en');
const hiKeys = dictionaryKeys(path.join(SRC, 'i18n/hi.ts'), 'hi');
const missingHi = enKeys.filter((key) => !hiKeys.includes(key));
const extraHi = hiKeys.filter((key) => !enKeys.includes(key));
const untranslated = untranslatedCopy(new Set(enKeys));

if (!missingHi.length && !extraHi.length && !untranslated.length) {
  console.log(`i18n: ${enKeys.length} English keys, all present in Hindi; no untranslated UI copy.`);
  process.exit(0);
}

if (missingHi.length) {
  console.error(`i18n: ${missingHi.length} keys missing from hi.ts:`);
  for (const key of missingHi) console.error(`  ${key}`);
}
if (extraHi.length) {
  console.error(`i18n: ${extraHi.length} keys in hi.ts with no English source:`);
  for (const key of extraHi) console.error(`  ${key}`);
}
if (untranslated.length) {
  console.error(`i18n: ${untranslated.length} hard-coded UI strings:`);
  for (const item of untranslated) {
    console.error(`  ${item.file}:${item.line} (${item.kind}) "${item.value}"`);
  }
}
process.exit(1);
