import { lengthOf } from './length';
import type { IconDoc, IconNode, NodeType, Pair, Style } from './types';

export type Attr = [string, string | number | undefined];

const GEOMETRY: Record<NodeType, string[]> = {
  path: ['d'],
  rect: ['x', 'y', 'width', 'height', 'rx'],
  circle: ['cx', 'cy', 'r'],
  ellipse: ['cx', 'cy', 'rx', 'ry'],
  line: ['x1', 'y1', 'x2', 'y2'],
  group: [],
};

export function esc(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function num(n: number): string {
  return String(Math.round(n * 1000) / 1000);
}

export function attrs(list: Attr[]): string {
  return list
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => ` ${key}="${esc(typeof value === 'number' ? num(value) : String(value))}"`)
    .join('');
}

export function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'icon';
}

export function tagOf(node: IconNode): string {
  return node.type === 'group' ? 'g' : node.type;
}

export function geometry(node: IconNode): Attr[] {
  const fields = node as unknown as Record<string, string | number | undefined>;
  return GEOMETRY[node.type].map((key) => [key, fields[key]]);
}

/** Gradient ids are prefixed on the way out, so two icons on one page never share one. */
function paintRef(value: string | undefined, prefix: string): string | undefined {
  return value?.replace(/^url\(#(.+)\)$/, `url(#${prefix}$1)`);
}

export function paint(style: Style, prefix: string): Attr[] {
  return [
    ['fill', paintRef(style.fill, prefix)],
    ['stroke', paintRef(style.stroke, prefix)],
    ['stroke-width', style.strokeWidth],
    ['stroke-linecap', style.linecap],
    ['stroke-linejoin', style.linejoin],
  ];
}

export function originOf(doc: IconDoc, node: IconNode): Pair {
  return node.origin ?? [doc.size / 2, doc.size / 2];
}

/** Translate, then rotate and scale around the origin: the order CSS gives `translate`, `rotate`, `scale`. */
export function transformAttr(doc: IconDoc, node: IconNode): string | undefined {
  const [tx, ty] = node.translate ?? [0, 0];
  const rotate = node.rotate ?? 0;
  const scale = node.scale ?? 1;
  const [ox, oy] = originOf(doc, node);
  const parts: string[] = [];
  if (tx !== 0 || ty !== 0) parts.push(`translate(${num(tx)} ${num(ty)})`);
  if (rotate !== 0) parts.push(`rotate(${num(rotate)} ${num(ox)} ${num(oy)})`);
  if (scale !== 1) parts.push(`translate(${num(ox)} ${num(oy)}) scale(${num(scale)}) translate(${num(-ox)} ${num(-oy)})`);
  return parts.length > 0 ? parts.join(' ') : undefined;
}

/** The dash and the offset that show a stroke between two fractions of its length. */
export function trimDash([from, to]: Pair): { dash: number; offset: number } {
  const dash = Math.max(0, to - from);
  // Nothing to show: the empty dash is put just off the path, or a round cap would make a dot of it.
  const start = dash > 0 ? from : from <= 0 ? -0.01 : from >= 1 ? 1.01 : from;
  return { dash, offset: -start };
}

/**
 * A stroke drawn in part, for an animation: the path is given a length of 1 and one dash is slid along it.
 * The gap is twice the dash: with a gap of one, the next dash would start at the very end of the path when
 * nothing is drawn, and a round cap would make a dot of it.
 * Browsers follow `pathLength`; a rasteriser may not, so a still uses `stillDash`.
 */
export function dashAttrs(node: IconNode, drawn: boolean, trimmed: boolean): Attr[] {
  if (trimmed || node.trim !== undefined) {
    const { dash, offset } = trimDash(node.trim ?? [0, 1]);
    return [
      ['pathLength', 1],
      ['stroke-dasharray', `${num(dash)} 2`],
      ['stroke-dashoffset', offset],
    ];
  }
  if (!drawn && (node.draw === undefined || node.draw >= 1)) return [];
  return [
    ['pathLength', 1],
    ['stroke-dasharray', '1 2'],
    ['stroke-dashoffset', 1 - (node.draw ?? 1)],
  ];
}

/** A stroke drawn in part, for a still: one dash as long as the outline, slid by the part that is not drawn. */
function stillDash(node: IconNode): Attr[] {
  const whole = node.trim === undefined || (node.trim[0] <= 0 && node.trim[1] >= 1);
  if (whole && (node.draw === undefined || node.draw >= 1)) return [];
  const length = lengthOf(node);
  if (length === 0) return [];
  if (!whole) {
    const { dash, offset } = trimDash(node.trim!);
    return [
      ['stroke-dasharray', `${num(dash * length)} ${num(2 * length)}`],
      ['stroke-dashoffset', offset * length],
    ];
  }
  if (node.draw === undefined) return [];
  return [
    ['stroke-dasharray', `${num(length)} ${num(2 * length)}`],
    ['stroke-dashoffset', (1 - Math.max(0, node.draw)) * length],
  ];
}

function gradients(doc: IconDoc, prefix: string): string {
  const list = doc.gradients ?? [];
  if (list.length === 0) return '';
  const body = list.map((g) => {
    const stops = g.stops
      .map((s) => `<stop${attrs([['offset', s.offset], ['stop-color', s.color], ['stop-opacity', s.opacity]])}/>`)
      .join('');
    if (g.type === 'radial') {
      const [cx, cy] = g.center ?? [0.5, 0.5];
      return `<radialGradient${attrs([['id', prefix + g.id], ['cx', cx], ['cy', cy], ['r', g.radius ?? 0.5]])}>${stops}</radialGradient>`;
    }
    const [x1, y1] = g.from ?? [0, 0];
    const [x2, y2] = g.to ?? [0, 1];
    return `<linearGradient${attrs([['id', prefix + g.id], ['x1', x1], ['y1', y1], ['x2', x2], ['y2', y2]])}>${stops}</linearGradient>`;
  });
  return `<defs>${body.join('')}</defs>`;
}

export interface RenderHooks {
  /** Prefix of gradient ids. */
  prefix: string;
  /** What this output adds to a node: its transform, its class, its dashes. */
  node(node: IconNode): Attr[];
  root?: Attr[];
  /** Markup placed first inside the `<svg>`, a `<style>` for instance. */
  head?: string;
}

export function render(doc: IconDoc, hooks: RenderHooks): string {
  const one = (node: IconNode): string => {
    if (node.hidden) return '';
    const head = attrs([...geometry(node), ...paint(node, hooks.prefix), ['opacity', node.opacity], ...hooks.node(node)]);
    if (node.type === 'group') return `<g${head}>${node.children.map(one).join('')}</g>`;
    return `<${tagOf(node)}${head}/>`;
  };
  const root = attrs([
    ['xmlns', 'http://www.w3.org/2000/svg'],
    ['viewBox', `0 0 ${num(doc.size)} ${num(doc.size)}`],
    ['width', doc.size],
    ['height', doc.size],
    ...paint(doc.defaults ?? {}, hooks.prefix),
    ...(hooks.root ?? []),
  ]);
  return `<svg${root}>${hooks.head ?? ''}${gradients(doc, hooks.prefix)}${doc.nodes.map(one).join('')}</svg>`;
}

/** A still SVG of the document as it is, with no animation: what a rasteriser or a thumbnail needs. */
export function toSvg(doc: IconDoc): string {
  const prefix = `ni-${slug(doc.name)}-`;
  return render(doc, {
    prefix,
    node: (node) => [['transform', transformAttr(doc, node)], ...stillDash(node)],
  });
}
