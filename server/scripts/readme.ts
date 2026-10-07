// Writes the pictures of the README from the icons of the folder: `pnpm --filter @netsuicon/server readme`.
// Each one is an animated SVG where the icons play by themselves, for a page that shows it as an `<img>`.
// Run it again after an icon changed; it does not need the server.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { demo, exportCss, resolve, type DemoOptions, type IconDoc } from '@netsuicon/core';
import { Store } from '../src/store';

const here = path.dirname(fileURLToPath(import.meta.url));
const store = new Store(path.join(here, '../../icons'));
const out = path.join(here, '../../docs/images');

/** The colours of the app: its darkest background, its text, its quiet text. */
const PAPER = '#0a0b0e';
const INK = '#e3e4e8';
const QUIET = '#888d99';
const SIDE = 72;
const WIDE = 132;
const TALL = 124;
const EDGE = 20;
/** Each icon starts a little after the one before it. */
const STAGGER = 220;

interface Cell {
  pack: string;
  icon: string;
  /** Written under the icon. Default: its name. */
  caption?: string;
  show?: DemoOptions;
}

function drawn({ pack, icon }: Cell): IconDoc {
  const owner = store.readPack(pack);
  return resolve(store.read(icon, pack), owner);
}

/** The cells side by side, every icon playing in a loop of the same length so that the picture never drifts apart. */
function figure(cells: Cell[], columns: number): string {
  const starts = cells.map((_, index) => 500 + index * STAGGER);
  const length = Math.max(...cells.map((cell, index) => demo(drawn(cell), { ...cell.show, start: starts[index] }).clips[0]?.duration ?? 0));
  const rows = Math.ceil(cells.length / columns);
  const width = columns * WIDE + 2 * EDGE;
  const height = rows * TALL + 2 * EDGE;
  const tiles = cells.map((cell, index) => {
    const x = EDGE + (index % columns) * WIDE;
    const y = EDGE + Math.floor(index / columns) * TALL;
    const doc = demo(drawn(cell), { ...cell.show, start: starts[index], length });
    // Two cells may hold the same icon: the place in the picture keeps their keyframes apart.
    const icon = exportCss(doc, { scope: `f${index}` }).replace(/ width="[^"]*" height="[^"]*"/, ` x="${x + (WIDE - SIDE) / 2}" y="${y + 12}" width="${SIDE}" height="${SIDE}"`);
    const caption = `<text x="${x + WIDE / 2}" y="${y + SIDE + 36}" text-anchor="middle">${cell.caption ?? cell.icon}</text>`;
    return icon + caption;
  });
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" color="${INK}">`,
    `<rect width="${width}" height="${height}" rx="16" fill="${PAPER}"/>`,
    `<g font-family="system-ui,'Segoe UI',sans-serif" font-size="13" fill="${QUIET}" stroke="none">${tiles.join('')}</g>`,
    '</svg>',
  ].join('');
}

function names(pack: string): string[] {
  return store.all(pack).map((icon) => icon.name);
}

const FIGURES: Record<string, { cells: Cell[]; columns: number }> = {
  // Every example icon, pressed, in the expressive manner.
  packs: {
    columns: 8,
    cells: ['courrier', 'meteo'].flatMap((pack) => names(pack).map((icon) => ({ pack, icon, show: { manner: 'expressive' as const } }))),
  },
  // The two reactions of one icon.
  reactions: {
    columns: 2,
    cells: [
      { pack: 'courrier', icon: 'trash', caption: 'hover', show: { reaction: 'hover' } },
      { pack: 'courrier', icon: 'trash', caption: 'click' },
    ],
  },
  // An action comes back to rest; a switch stays, then goes back.
  types: {
    columns: 3,
    cells: [
      { pack: 'courrier', icon: 'inbox', caption: 'action' },
      { pack: 'courrier', icon: 'lock', caption: 'switch' },
      { pack: 'courrier', icon: 'heart', caption: 'switch' },
    ],
  },
  // The same press in the two manners.
  manners: {
    columns: 4,
    cells: [
      { pack: 'courrier', icon: 'send', caption: 'subtle' },
      { pack: 'courrier', icon: 'send', caption: 'expressive', show: { manner: 'expressive' } },
      { pack: 'meteo', icon: 'rain', caption: 'subtle' },
      { pack: 'meteo', icon: 'rain', caption: 'expressive', show: { manner: 'expressive' } },
    ],
  },
};

fs.mkdirSync(out, { recursive: true });
// The icon of the project, drawn with the project: as a file it plays its arrival once.
fs.writeFileSync(path.join(out, 'logo.svg'), exportCss(store.read('netsuicon')));
for (const [name, { cells, columns }] of Object.entries(FIGURES)) {
  const file = path.join(out, `${name}.svg`);
  fs.writeFileSync(file, figure(cells, columns));
  console.log(`${path.relative(process.cwd(), file)}: ${cells.length} icons, ${Math.round(fs.statSync(file).size / 1024)} KB`);
}
