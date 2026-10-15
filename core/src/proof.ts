import { onPlatform, type Platform } from './appIcon';
import { attrs, num } from './svg';
import type { IconDoc } from './types';

/** A picture made outside the core, as a URL an `<image>` can show: a PNG drawn at a few pixels, a logo of the library. */
export type Picture = string;

export interface ProofOptions {
  /** The icon drawn at 32 and at 16 pixels, shown with their pixels enlarged. */
  pixels?: [Picture, Picture];
  /** Logos to set beside the icon: those it looks most like. Three at most are shown. */
  neighbours?: Picture[];
}

const CELL = 128;
const GAP = 16;
const COLUMNS = 4;
const BACKDROP = '#e4e6eb';
const DARK = '#1c1c1e';

/** The filters, in the units of the icon: they act inside its scaled drawing. The blur is the squint of the eye. */
const filters = (size: number): string =>
  '<filter id="ni-grey" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="0"/></filter>' +
  `<filter id="ni-squint" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${num(size * 0.035)}"/></filter>` +
  '<filter id="ni-two" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="0"/><feComponentTransfer>' +
  ['R', 'G', 'B'].map((c) => `<feFunc${c} type="discrete" tableValues="0 1"/>`).join('') +
  '</feComponentTransfer></filter>';

function at(column: number, row: number): [number, number] {
  return [GAP + column * (CELL + GAP), GAP + row * (CELL + GAP)];
}

function icon(doc: IconDoc, platform: Platform, x: number, y: number, side: number, filter?: string): string {
  return `<g${attrs([['transform', `translate(${num(x)} ${num(y)}) scale(${num(side / doc.size)})`], ['filter', filter && `url(#${filter})`]])}>${onPlatform(doc, platform)}</g>`;
}

function back(x: number, y: number, colour: string): string {
  return `<rect${attrs([['x', x], ['y', y], ['width', CELL], ['height', CELL], ['fill', colour]])}/>`;
}

function picture(href: Picture, x: number, y: number, side: number): string {
  return `<image${attrs([['href', href], ['x', x], ['y', y], ['width', side], ['height', side], ['image-rendering', 'optimizeSpeed'], ['preserveAspectRatio', 'xMidYMid meet']])}/>`;
}

function rows(doc: IconDoc, options: ProofOptions): string[][] {
  const platforms = (['ios', 'macos', 'android'] as const).map((platform, column) => {
    const [x, y] = at(column, 0);
    return back(x, y, BACKDROP) + icon(doc, platform, x, y, CELL);
  });
  const [dx, dy] = at(3, 0);
  const treated = (['ni-grey', 'ni-squint', 'ni-two'] as const).map((filter, column) => {
    const [x, y] = at(column, 1);
    return back(x, y, BACKDROP) + icon(doc, 'ios', x + 8, y + 8, CELL - 16, filter);
  });
  // True sizes, drawn at 1:1 on the sheet: the picture must be made at the sheet's own width.
  const [sx, sy] = at(3, 1);
  const small = back(sx, sy, BACKDROP) + icon(doc, 'ios', sx + 8, sy + 8, 64) + icon(doc, 'ios', sx + 80, sy + 8, 32) + icon(doc, 'ios', sx + 80, sy + 48, 16);
  const third = (options.pixels ?? []).map((href, column) => {
    const [x, y] = at(column, 2);
    return back(x, y, BACKDROP) + picture(href, x, y, CELL);
  });
  const shelf = (options.neighbours ?? []).slice(0, 3).map((href, index) => {
    const [x, y] = at(index + 1, 3);
    return back(x, y, '#ffffff') + picture(href, x + 8, y + 8, CELL - 16);
  });
  const [ix, iy] = at(0, 3);
  const fourth = shelf.length === 0 ? [] : [back(ix, iy, '#ffffff') + icon(doc, 'ios', ix + 8, iy + 8, CELL - 16), ...shelf];
  return [[...platforms, back(dx, dy, DARK) + icon(doc, 'ios', dx + 8, dy + 8, CELL - 16)], [...treated, small], third, fourth].filter((row) => row.length > 0);
}

/**
 * One picture to judge an application icon by: as each platform cuts it, on a dark screen, without colour,
 * blurred, in two tones, at its true small sizes, its pixels enlarged, and beside the logos it looks most like.
 * `legend` says what each row holds. Render it at `width` pixels, so that the small sizes are true.
 */
export function proof(doc: IconDoc, options: ProofOptions = {}): { svg: string; width: number; legend: string } {
  const lines = rows(doc, options);
  const width = COLUMNS * (CELL + GAP) + GAP;
  const height = lines.length * (CELL + GAP) + GAP;
  const root = attrs([
    ['xmlns', 'http://www.w3.org/2000/svg'],
    ['viewBox', `0 0 ${width} ${height}`],
    ['width', width],
    ['height', height],
  ]);
  const legend = [
    'row 1: iOS (squircle), macOS (smaller, with a margin), Android (the middle 72 of 108 units, in a circle), iOS on a dark screen',
    'row 2: no colour, blurred (squint), two tones (cut at half grey: a cell all white or all black means mark and background are close in value), then 64, 32 and 16 px at their true size',
    ...(options.pixels ? ['row 3: 32 px, then 16 px, pixels enlarged'] : []),
    ...(options.neighbours?.length ? ['row 4: the icon, then the library logos it looks most like'] : []),
  ].join('\n');
  return { svg: `<svg${root}><defs>${filters(doc.size)}</defs><rect width="${width}" height="${height}" fill="#ffffff"/>${lines.flat().join('')}</svg>`, width, legend };
}
