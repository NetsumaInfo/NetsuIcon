// Writes every icon of a pack into one TypeScript module, for an application that shows them without NetsuIcon:
// `pnpm --filter @netsuicon/server bundle <pack> <out.ts> [subtle|expressive]`. It does not need the server.
// Each icon is CSS-animated SVG markup: `rest` (hover and press, no loop) and, for a long task, `busy` (its loop
// playing). The application sets `data-hover`, `data-play`, `data-quiet` and `data-state` on the `<svg>`.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exportCss, forManner, isSwitch, MANNERS, pressClip, resolve, type IconDoc, type Manner } from '@netsuicon/core';
import { Store } from '../src/store';

const here = path.dirname(fileURLToPath(import.meta.url));
const store = new Store(path.join(here, '../../icons'));

interface Entry {
  rest: string;
  busy?: string;
  /** The id of its press clip, for `data-play`; none for a switch. */
  click?: string;
  switch?: true;
  /** This icon is one mode of another: the base icon and the mode. */
  of?: string;
  mode?: string;
}

/**
 * The markup scales with its box, and its hover follows `data-hover`, which the application sets while the
 * pointer is over the whole control. With CSS `:hover` a part that moves out from under the pointer ends the
 * hover and starts it again: the icon shakes.
 */
function fit(svg: string, root: string): string {
  return svg
    .replace(/ width="[\d.]+" height="[\d.]+"/, ' width="100%" height="100%"')
    .replaceAll(`.${root}[data-quiet]:hover `, `.${root}[data-quiet][data-hover] `)
    .replaceAll(`.${root}:hover `, `.${root}[data-hover] `);
}

function entry(doc: IconDoc, manner: Manner): Entry {
  const played = forManner(doc, manner);
  const loops = played.clips.filter((clip) => clip.trigger === 'loop');
  const still: IconDoc = { ...played, clips: played.clips.filter((clip) => clip.trigger !== 'loop') };
  const root = `ni-${doc.name}`;
  const out: Entry = { rest: fit(exportCss(still, { manner }), root) };
  if (loops.length > 0) out.busy = fit(exportCss({ ...played, clips: loops }, { manner }), root);
  if (isSwitch(still)) out.switch = true;
  else if (pressClip(still)) out.click = pressClip(still);
  if (doc.variant) Object.assign(out, { of: doc.variant.of, mode: doc.variant.mode });
  return out;
}

const [pack, target, manner = 'expressive'] = process.argv.slice(2);
if (!pack || !target || !MANNERS.includes(manner as Manner)) {
  console.error('Usage: bundle <pack> <out.ts> [subtle|expressive]');
  process.exit(1);
}
const owner = store.readPack(pack);
const icons = Object.fromEntries(store.all(pack).map((doc) => [doc.name, entry(resolve(doc, owner), manner as Manner)]));
const body = [
  `// Written by NetsuIcon (pack "${pack}", ${manner} manner). Do not edit: change the icon in NetsuIcon and run its bundle script again.`,
  'export interface NetsuIconEntry { rest: string; busy?: string; click?: string; switch?: true; of?: string; mode?: string }',
  `export const NETSU_ICONS: Record<string, NetsuIconEntry> = ${JSON.stringify(icons, null, 1)};`,
  '',
].join('\n');
fs.writeFileSync(path.resolve(target), body);
console.log(`${Object.keys(icons).length} icons → ${target}`);
