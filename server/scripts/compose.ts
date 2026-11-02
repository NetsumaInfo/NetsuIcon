// Writes a pack as a Kotlin file for Jetpack Compose (`object Icons`, one ImageVector per icon):
// `pnpm --filter @netsuicon/server compose <pack> <out.kt>`. It does not need the server.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exportCompose, resolve } from '@netsuicon/core';
import { Store } from '../src/store';

const here = path.dirname(fileURLToPath(import.meta.url));
const store = new Store(path.join(here, '../../icons'));

const [pack, target] = process.argv.slice(2);
if (!pack || !target) {
  console.error('Usage: compose <pack> <out.kt>');
  process.exit(1);
}
const owner = store.readPack(pack);
const docs = store.all(pack).map((doc) => resolve(doc, owner));
fs.writeFileSync(path.resolve(target), exportCompose(docs, `pack "${pack}"`));
console.log(`${docs.length} icons → ${target}`);
