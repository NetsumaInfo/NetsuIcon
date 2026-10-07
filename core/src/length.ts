import type { IconNode, Pair } from './types';

/** How many straight pieces stand for one curve. Enough for a dash to land within a hundredth of a unit on an icon. */
const STEPS = 24;
const ARGS: Record<string, number> = { m: 2, l: 2, h: 1, v: 1, c: 6, s: 4, q: 4, t: 2, a: 7, z: 0 };
const NUMBER = /[\s,]*([-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?)/iy;
const FLAG = /[\s,]*([01])/y;
const COMMAND = /[\s,]*([mlhvcsqtaz])/iy;

interface Segment {
  command: string;
  args: number[];
}

/** Path data as commands with their numbers. An arc's two flags may be written with no space after them. */
function segments(d: string): Segment[] {
  const out: Segment[] = [];
  let at = 0;
  const read = (pattern: RegExp): string | undefined => {
    pattern.lastIndex = at;
    const found = pattern.exec(d);
    if (found) at = pattern.lastIndex;
    return found?.[1];
  };
  for (let command = read(COMMAND); command !== undefined; command = read(COMMAND)) {
    const count = ARGS[command.toLowerCase()]!;
    // Numbers after the first set repeat the command; after a move they are lines.
    for (let first = true; ; first = false) {
      const args: number[] = [];
      for (let index = 0; index < count; index += 1) {
        const text = read(command.toLowerCase() === 'a' && (index === 3 || index === 4) ? FLAG : NUMBER);
        if (text === undefined) break;
        args.push(Number(text));
      }
      if (args.length < count || (count === 0 && !first)) break;
      const repeated = command === 'm' ? 'l' : command === 'M' ? 'L' : command;
      out.push({ command: first ? command : repeated, args });
      if (count === 0) break;
    }
  }
  return out;
}

function bezier(points: Pair[], t: number): Pair {
  if (points.length === 1) return points[0]!;
  const next = points.slice(1).map((point, index): Pair => {
    const before = points[index]!;
    return [before[0] + (point[0] - before[0]) * t, before[1] + (point[1] - before[1]) * t];
  });
  return bezier(next, t);
}

/** The points of an elliptical arc, from the way SVG writes it (two ends, radii, two flags) to its centre and angles. */
function arc(from: Pair, [rx0, ry0, turn, large, sweep, x, y]: number[], t: number): Pair {
  const phi = (turn! * Math.PI) / 180;
  const [cos, sin] = [Math.cos(phi), Math.sin(phi)];
  const [dx, dy] = [(from[0] - x!) / 2, (from[1] - y!) / 2];
  const [px, py] = [cos * dx + sin * dy, -sin * dx + cos * dy];
  // Radii too small to join the two ends are grown until they do.
  const grow = Math.max(1, Math.sqrt((px * px) / (rx0! * rx0!) + (py * py) / (ry0! * ry0!)));
  const [rx, ry] = [Math.abs(rx0!) * grow, Math.abs(ry0!) * grow];
  const top = rx * rx * ry * ry - rx * rx * py * py - ry * ry * px * px;
  const k = (large === sweep ? -1 : 1) * Math.sqrt(Math.max(0, top) / (rx * rx * py * py + ry * ry * px * px));
  const [cx, cy] = [(k * rx * py) / ry, (-k * ry * px) / rx];
  const start = Math.atan2((py - cy) / ry, (px - cx) / rx);
  let sweepAngle = Math.atan2((-py - cy) / ry, (-px - cx) / rx) - start;
  if (sweep && sweepAngle < 0) sweepAngle += 2 * Math.PI;
  if (!sweep && sweepAngle > 0) sweepAngle -= 2 * Math.PI;
  const angle = start + sweepAngle * t;
  const [ex, ey] = [rx * Math.cos(angle) + cx, ry * Math.sin(angle) + cy];
  return [cos * ex - sin * ey + (from[0] + x!) / 2, sin * ex + cos * ey + (from[1] + y!) / 2];
}

function curveLength(point: (t: number) => Pair): number {
  let total = 0;
  let before = point(0);
  for (let step = 1; step <= STEPS; step += 1) {
    const here = point(step / STEPS);
    total += Math.hypot(here[0] - before[0], here[1] - before[1]);
    before = here;
  }
  return total;
}

/** The control points of a curve command, the pen first. Undefined for a command that is not a Bézier. */
function controls(kind: string, here: Pair, mirror: Pair, at: (index: number) => Pair): Pair[] | undefined {
  if (kind === 'c') return [here, at(0), at(2), at(4)];
  if (kind === 's') return [here, mirror, at(0), at(2)];
  if (kind === 'q') return [here, at(0), at(2)];
  if (kind === 't') return [here, mirror, at(0)];
  return undefined;
}

/** Where a straight command ends. `origin` is the pen for a relative command, zero for an absolute one. */
function lineEnd(kind: string, args: number[], here: Pair, start: Pair, origin: Pair): Pair {
  if (kind === 'h') return [args[0]! + origin[0], here[1]];
  if (kind === 'v') return [here[0], args[0]! + origin[1]];
  if (kind === 'z') return start;
  return [args[0]! + origin[0], args[1]! + origin[1]];
}

/** The length of a path, every sub-path added up. */
export function pathLength(d: string): number {
  let total = 0;
  let here: Pair = [0, 0];
  let start: Pair = [0, 0];
  // The last control point, which a smooth curve (S, T) mirrors. Forgotten after any other command.
  let control: Pair | undefined;
  for (const { command, args } of segments(d)) {
    const kind = command.toLowerCase();
    const origin: Pair = command === kind ? here : [0, 0];
    const at = (index: number): Pair => [args[index]! + origin[0], args[index + 1]! + origin[1]];
    const from = here;
    const curve = controls(kind, here, control ? [2 * here[0] - control[0], 2 * here[1] - control[1]] : here, at);
    here = curve ? curve[curve.length - 1]! : kind === 'a' ? at(5) : lineEnd(kind, args, here, start, origin);
    const chord = Math.hypot(here[0] - from[0], here[1] - from[1]);
    if (curve) {
      total += curveLength((t) => bezier(curve, t));
    } else if (kind === 'a' && args[0] !== 0 && args[1] !== 0 && chord > 0) {
      const ends = [...args.slice(0, 5), ...here];
      total += curveLength((t) => arc(from, ends, t));
    } else if (kind !== 'm') {
      total += chord;
    }
    control = curve?.[curve.length - 2];
    if (kind === 'm') start = here;
  }
  return total;
}

/** The length of the outline of a shape: what a stroke drawn in part is a fraction of. A group has none. */
export function lengthOf(node: IconNode): number {
  switch (node.type) {
    case 'path':
      return pathLength(node.d);
    case 'line':
      return Math.hypot(node.x2 - node.x1, node.y2 - node.y1);
    case 'circle':
      return 2 * Math.PI * node.r;
    case 'ellipse':
      return curveLength((t) => [node.rx * Math.cos(2 * Math.PI * t), node.ry * Math.sin(2 * Math.PI * t)]);
    case 'rect': {
      const corner = Math.min(node.rx ?? 0, node.width / 2, node.height / 2);
      return 2 * (node.width + node.height) - 8 * corner + 2 * Math.PI * corner;
    }
    default:
      return 0;
  }
}
