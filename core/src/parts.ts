import { pathPoints } from './length';
import { originOf } from './svg';
import type { IconDoc, IconNode, Pair, Style } from './types';

/** A box in the units of the view box. */
export interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** A shape as it is seen at rest: where it lies, once every group around it has moved it, and what it paints. */
export interface Part {
  id: string;
  /** Points of its outline, in the view box. */
  points: Pair[];
  box: Box;
  /** Its colours: the fill and the stroke it shows, gradients as `url(#id)`. */
  paints: string[];
  /** The width of its stroke as seen, after every scale; none when it shows no stroke. */
  stroke?: number;
  /** It covers the whole view box: what the platforms cut their shape from. */
  background: boolean;
}

type Move = (point: Pair) => Pair;

const ROUND = 16;

function round(cx: number, cy: number, rx: number, ry: number): Pair[] {
  return Array.from({ length: ROUND }, (_, step): Pair => {
    const angle = (step / ROUND) * 2 * Math.PI;
    return [cx + rx * Math.cos(angle), cy + ry * Math.sin(angle)];
  });
}

/** A rectangle with round corners: a quarter of a circle at each corner, which a corner of the box would overstate. */
function rounded(x: number, y: number, width: number, height: number, rx: number): Pair[] {
  const r = Math.min(rx, width / 2, height / 2);
  const centres: Pair[] = [[x + width - r, y + r], [x + width - r, y + height - r], [x + r, y + height - r], [x + r, y + r]];
  return centres.flatMap(([cx, cy], corner) =>
    Array.from({ length: 5 }, (_, step): Pair => {
      const angle = ((corner - 1 + step / 4) * Math.PI) / 2;
      return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
    }),
  );
}

function outlineOf(node: IconNode): Pair[] {
  switch (node.type) {
    case 'path':
      return pathPoints(node.d);
    case 'rect':
      return rounded(node.x, node.y, node.width, node.height, node.rx ?? 0);
    case 'circle':
      return round(node.cx, node.cy, node.r, node.r);
    case 'ellipse':
      return round(node.cx, node.cy, node.rx, node.ry);
    case 'line':
      return [[node.x1, node.y1], [node.x2, node.y2]];
    default:
      return [];
  }
}

/** The way the node's own transform moves a point: scale and rotate around its origin, then translate. */
function moveOf(doc: IconDoc, node: IconNode): Move {
  const [ox, oy] = originOf(doc, node);
  const scale = node.scale ?? 1;
  const angle = ((node.rotate ?? 0) * Math.PI) / 180;
  const [tx, ty] = node.translate ?? [0, 0];
  const [cos, sin] = [Math.cos(angle), Math.sin(angle)];
  return ([x, y]) => {
    const [dx, dy] = [(x - ox) * scale, (y - oy) * scale];
    return [ox + dx * cos - dy * sin + tx, oy + dx * sin + dy * cos + ty];
  };
}

function boxOf(points: Pair[], grow: number): Box {
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  return { x0: Math.min(...xs) - grow, y0: Math.min(...ys) - grow, x1: Math.max(...xs) + grow, y1: Math.max(...ys) + grow };
}

function shows(paint: string | undefined): paint is string {
  return paint !== undefined && paint !== 'none' && paint !== 'transparent';
}

interface Around {
  moves: Move[];
  scale: number;
  style: Style;
}

function partOf(doc: IconDoc, node: IconNode, around: Around): Part | undefined {
  const points = outlineOf(node).map((point) => around.moves.reduceRight((at, move) => move(at), point));
  if (points.length === 0) return undefined;
  const { fill, stroke, strokeWidth } = around.style;
  // A stroke wider than nothing shows; SVG paints a shape black when no fill is set.
  const width = shows(stroke) && (strokeWidth ?? 1) > 0 ? (strokeWidth ?? 1) * around.scale : undefined;
  const paints = [...(shows(fill ?? 'black') ? [fill ?? 'black'] : []), ...(width === undefined ? [] : [stroke!])];
  if (paints.length === 0) return undefined;
  const box = boxOf(points, (width ?? 0) / 2);
  const edge = doc.size * 0.01;
  const background = shows(fill ?? 'black') && box.x0 <= edge && box.y0 <= edge && box.x1 >= doc.size - edge && box.y1 >= doc.size - edge;
  return { id: node.id, points, box, paints, stroke: width, background };
}

/**
 * Every shape that shows at rest. A hidden node and one at opacity 0 (a prop, brought in by a clip) are left out.
 * The style a shape inherits from the document and its groups is taken into account; animations are not.
 */
export function partsOf(doc: IconDoc): Part[] {
  const out: Part[] = [];
  const visit = (nodes: IconNode[], around: Around): void => {
    for (const node of nodes) {
      if (node.hidden || node.opacity === 0) continue;
      const style: Style = { ...around.style };
      for (const key of ['fill', 'stroke', 'strokeWidth'] as const) if (node[key] !== undefined) Object.assign(style, { [key]: node[key] });
      const inside: Around = { moves: [...around.moves, moveOf(doc, node)], scale: around.scale * (node.scale ?? 1), style };
      if (node.type === 'group') visit(node.children, inside);
      else {
        const part = partOf(doc, node, inside);
        if (part) out.push(part);
      }
    }
  };
  visit(doc.nodes, { moves: [], scale: 1, style: { ...doc.defaults } });
  return out;
}

/** The box around several boxes; undefined for none. */
export function union(boxes: Box[]): Box | undefined {
  if (boxes.length === 0) return undefined;
  return {
    x0: Math.min(...boxes.map((box) => box.x0)),
    y0: Math.min(...boxes.map((box) => box.y0)),
    x1: Math.max(...boxes.map((box) => box.x1)),
    y1: Math.max(...boxes.map((box) => box.y1)),
  };
}
