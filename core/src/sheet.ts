import { attrs, num, toSvg } from './svg';
import type { IconDoc } from './types';

export interface SheetOptions {
  /** Icons per row. Default: as square as it gets. */
  columns?: number;
  /** Side of one icon, in pixels. Default 96. */
  cell?: number;
  /** Colour behind the icons. None when left out. */
  background?: string;
  /** What `currentColor` is drawn with. Default: black. */
  ink?: string;
  /** A colour to draw the edge of every view box with: shows what leaves it. None when left out. */
  outline?: string;
}

/** Every icon side by side in one still SVG, in the order given: what it takes to judge whether they belong together. */
export function sheet(docs: IconDoc[], options: SheetOptions = {}): string {
  const cell = options.cell ?? 96;
  const gap = cell / 4;
  const columns = Math.max(1, options.columns ?? Math.ceil(Math.sqrt(docs.length)));
  const rows = Math.max(1, Math.ceil(docs.length / columns));
  const width = columns * (cell + gap) + gap;
  const height = rows * (cell + gap) + gap;
  const tiles = docs.map((doc, index) => {
    const x = gap + (index % columns) * (cell + gap);
    const y = gap + Math.floor(index / columns) * (cell + gap);
    const edge = options.outline === undefined ? '' : `<rect${attrs([['x', x], ['y', y], ['width', cell], ['height', cell], ['fill', 'none'], ['stroke', options.outline]])}/>`;
    return `${edge}<g transform="translate(${num(x)} ${num(y)}) scale(${num(cell / doc.size)})">${toSvg(doc)}</g>`;
  });
  const root = attrs([
    ['xmlns', 'http://www.w3.org/2000/svg'],
    ['viewBox', `0 0 ${num(width)} ${num(height)}`],
    ['width', width],
    ['height', height],
    ['color', options.ink],
  ]);
  const back = options.background === undefined ? '' : `<rect${attrs([['width', width], ['height', height], ['fill', options.background]])}/>`;
  return `<svg${root}>${back}${tiles.join('')}</svg>`;
}
