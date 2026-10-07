// Locale parity: every key of the source language (fr) exists in the other languages, with the
// same {{values}}, and no language has a key the source lacks.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SOURCE = 'fr';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/locales');

function flatten(value, prefix = '', out = new Map()) {
  for (const [key, child] of Object.entries(value)) {
    const full = prefix ? `${prefix}.${key}` : key;
    if (child && typeof child === 'object') flatten(child, full, out);
    else out.set(full, String(child));
  }
  return out;
}

function load(language) {
  const dir = path.join(root, language);
  const keys = new Map();
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    const ns = file.replace(/\.json$/, '');
    for (const [key, text] of flatten(JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8')))) {
      keys.set(`${ns}:${key}`, text);
    }
  }
  return keys;
}

const values = (text) => [...text.matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map((m) => m[1]).sort().join(',');

const source = load(SOURCE);
const problems = [];
for (const language of fs.readdirSync(root).filter((l) => l !== SOURCE)) {
  const other = load(language);
  for (const [key, text] of source) {
    if (!other.has(key)) problems.push(`${language}: missing ${key}`);
    else if (values(text) !== values(other.get(key))) problems.push(`${language}: different {{values}} in ${key}`);
    else if (!other.get(key).trim()) problems.push(`${language}: empty ${key}`);
  }
  for (const key of other.keys()) {
    if (!source.has(key)) problems.push(`${language}: ${key} is not in ${SOURCE}`);
  }
}

if (problems.length > 0) {
  console.error(problems.join('\n'));
  console.error(`\n${problems.length} locale problem(s).`);
  process.exit(1);
}
console.log(`Locales in sync: ${source.size} keys.`);
