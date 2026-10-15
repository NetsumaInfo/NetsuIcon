import { partsOf, union, type Part } from './parts';
import { attrs, num, slug, toSvg } from './svg';
import { clone, walk } from './tree';
import type { IconDoc } from './types';

/**
 * An application icon is drawn full bleed: its background covers the whole view box, and each platform cuts its
 * own shape out of it. Android keeps whole a circle of 66 of its 108 units: the strictest, so the safe zone.
 */
export const SAFE_RADIUS = 33 / 108;

/**
 * How a platform shows the icon. `ios`: the whole square, cut to a squircle. `macos`: the same, smaller on its
 * canvas (824 of 1024), so that a margin is left. `android`: the 72 middle units of 108, cut to a circle, the
 * shape most launchers use. `round`: the squircle with nothing cut away, for favicons and Windows.
 */
export const PLATFORMS = ['ios', 'macos', 'android'] as const;
export type Platform = (typeof PLATFORMS)[number];

/** A superellipse of exponent 5: close to the continuous corners of Apple's icons. */
export function squircle(size: number, inset = 0): string {
  const centre = size / 2;
  const radius = size / 2 - inset;
  const steps = 96;
  const points = Array.from({ length: steps }, (_, step) => {
    const angle = (step / steps) * 2 * Math.PI;
    const [cos, sin] = [Math.cos(angle), Math.sin(angle)];
    const x = centre + radius * Math.sign(cos) * Math.abs(cos) ** 0.4;
    const y = centre + radius * Math.sign(sin) * Math.abs(sin) ** 0.4;
    return `${num(x)} ${num(y)}`;
  });
  return `M${points.join('L')}Z`;
}

function circle(size: number): string {
  const r = size / 2;
  return `M0 ${num(r)}A${num(r)} ${num(r)} 0 1 0 ${num(size)} ${num(r)}A${num(r)} ${num(r)} 0 1 0 0 ${num(r)}Z`;
}

/** The shape a platform cuts, and how it scales the picture inside it around the centre. */
function cutOf(platform: Platform | 'round', size: number): { shape: string; scale: number } {
  if (platform === 'macos') return { shape: squircle(size, (size * 100) / 1024), scale: 824 / 1024 };
  if (platform === 'android') return { shape: circle(size), scale: 108 / 72 };
  return { shape: squircle(size), scale: 1 };
}

/** The icon as a platform shows it, in an SVG of the same view box: at rest, or `inner`, an animated SVG of it. */
export function onPlatform(doc: IconDoc, platform: Platform | 'round', inner = toSvg(doc)): string {
  const { shape, scale } = cutOf(platform, doc.size);
  const id = `ni-cut-${platform}-${slug(doc.name)}`;
  const c = doc.size / 2;
  const move = scale === 1 ? '' : `translate(${num(c)} ${num(c)}) scale(${num(scale)}) translate(${num(-c)} ${num(-c)})`;
  const root = attrs([
    ['xmlns', 'http://www.w3.org/2000/svg'],
    ['viewBox', `0 0 ${num(doc.size)} ${num(doc.size)}`],
    ['width', doc.size],
    ['height', doc.size],
  ]);
  return `<svg${root}><defs><clipPath id="${id}"><path d="${shape}"/></clipPath></defs><g clip-path="url(#${id})"><g${attrs([['transform', move]])}>${inner}</g></g></svg>`;
}

/** The icon in two layers, as Android wants it: the background alone, and the mark alone. */
export function layers(doc: IconDoc): { background: IconDoc; mark: IconDoc } {
  const behind = new Set(partsOf(doc).filter((part) => part.background).map((part) => part.id));
  const keep = (wanted: boolean): IconDoc => {
    const copy = clone(doc);
    walk(copy.nodes, (node) => {
      if (node.type !== 'group' && behind.has(node.id) !== wanted) node.hidden = true;
    });
    return copy;
  };
  return { background: keep(true), mark: keep(false) };
}

/** The icon in one colour, white: what Android tints for a themed icon. A shape that shows nothing stays so. */
export function silhouette(doc: IconDoc): IconDoc {
  const copy = clone(doc);
  const white = (paint: string | undefined): string | undefined => (paint === undefined || paint === 'none' || paint === 'transparent' ? paint : '#ffffff');
  copy.defaults = { ...copy.defaults, fill: white(copy.defaults?.fill ?? 'black'), stroke: white(copy.defaults?.stroke) };
  walk(copy.nodes, (node) => Object.assign(node, { fill: white(node.fill), stroke: white(node.stroke) }));
  delete copy.gradients;
  return copy;
}

export const APP_FINDING_CODES = ['no_background', 'outside_safe', 'thin_stroke', 'tiny_part', 'colours', 'small_mark', 'off_centre'] as const;
export type AppFindingCode = (typeof APP_FINDING_CODES)[number];

/** A way an application icon may fail on a platform or at a small size. Advice: it is still valid. */
export interface AppFinding {
  code: AppFindingCode;
  where: string;
  got: string;
  want: string;
}

const pct = (value: number): string => `${Math.round(value * 100)}%`;

function partFindings(doc: IconDoc, mark: Part[]): AppFinding[] {
  const out: AppFinding[] = [];
  const c = doc.size / 2;
  // Below a 48th of the icon, a stroke or a part is under a pixel at 48 px: it fades out in a launcher.
  const least = doc.size / 48;
  for (const part of mark) {
    const where = `node "${part.id}"`;
    // A stroke reaches half its width past its outline, whatever its caps.
    const reach = (part.stroke ?? 0) / 2;
    const [fx, fy] = part.points.reduce((a, b) => (Math.hypot(b[0] - c, b[1] - c) > Math.hypot(a[0] - c, a[1] - c) ? b : a));
    const far = Math.hypot(fx - c, fy - c) + reach;
    if (far / doc.size > SAFE_RADIUS + 0.005) {
      out.push({ code: 'outside_safe', where, got: `${pct(far / doc.size)} at [${Math.round(fx)},${Math.round(fy)}]${reach > 0 ? ` plus half its stroke` : ''}`, want: pct(SAFE_RADIUS) });
    }
    if (part.stroke !== undefined && part.stroke < least) out.push({ code: 'thin_stroke', where, got: num(part.stroke), want: num(least) });
    const side = Math.max(part.box.x1 - part.box.x0, part.box.y1 - part.box.y0);
    if (side < least) out.push({ code: 'tiny_part', where, got: num(side), want: num(least) });
  }
  return out;
}

function wholeFindings(doc: IconDoc, parts: Part[], mark: Part[]): AppFinding[] {
  const out: AppFinding[] = [];
  if (!parts.some((part) => part.background)) out.push({ code: 'no_background', where: 'icon', got: 'none', want: 'a shape over the whole view box' });
  const colours = new Set(parts.flatMap((part) => part.paints.map((paint) => paint.toLowerCase())));
  if (colours.size > 3) out.push({ code: 'colours', where: 'icon', got: String(colours.size), want: '3' });
  const box = union(mark.map((part) => part.box));
  if (box === undefined) return out;
  const side = Math.max(box.x1 - box.x0, box.y1 - box.y0) / doc.size;
  if (side < 0.36) out.push({ code: 'small_mark', where: 'mark', got: pct(side), want: '36%' });
  const dx = (box.x0 + box.x1) / 2 / doc.size - 0.5;
  const dy = (box.y0 + box.y1) / 2 / doc.size - 0.5;
  // The eye puts the middle a little above the centre: a mark may sit up to 4% high, never low.
  if (Math.abs(dx) > 0.02 || dy > 0.01 || dy < -0.04) out.push({ code: 'off_centre', where: 'mark', got: `${pct(dx)}, ${pct(dy)}`, want: '0%, 0% to -4%' });
  return out;
}

/** Where an application icon may fail on a platform or at a small size. Only for mode `app`. */
export function appLint(doc: IconDoc): AppFinding[] {
  if (doc.mode !== 'app') return [];
  const parts = partsOf(doc);
  // Nothing drawn yet: nothing to advise.
  if (parts.length === 0) return [];
  const mark = parts.filter((part) => !part.background);
  return [...wholeFindings(doc, parts, mark), ...partFindings(doc, mark)];
}

/** Where the mark lies, in words an agent can act on: its box, its centre, its farthest reach from the centre. */
export function markMeasures(doc: IconDoc): string {
  const mark = partsOf(doc).filter((part) => !part.background);
  const box = union(mark.map((part) => part.box));
  if (box === undefined) return 'mark: none';
  const c = doc.size / 2;
  const far = Math.max(...mark.map((part) => Math.max(...part.points.map(([x, y]) => Math.hypot(x - c, y - c))) + (part.stroke ?? 0) / 2));
  const [w, h] = [box.x1 - box.x0, box.y1 - box.y0];
  return `mark: ${Math.round(w)} × ${Math.round(h)} (${pct(Math.max(w, h) / doc.size)} of the view box), box centre [${Math.round((box.x0 + box.x1) / 2)},${Math.round((box.y0 + box.y1) / 2)}], farthest from the centre ${Math.round(far)} (safe: ${Math.round(SAFE_RADIUS * doc.size)})`;
}

const SAID: Record<AppFindingCode, string> = {
  no_background: 'no background: corners stay empty, and each platform fills them its own way',
  outside_safe: 'reaches past the safe circle, from the centre: Android may cut it',
  thin_stroke: 'stroke under a pixel at 48 px',
  tiny_part: 'part under a pixel at 48 px',
  colours: 'colours',
  small_mark: 'mark small in the icon: it will read poorly at 32 px',
  off_centre: 'mark off centre, across and down (negative: up)',
};

export function appFindingText(finding: AppFinding): string {
  return `${finding.where}: ${SAID[finding.code]} (${finding.got}; aim: ${finding.want})`;
}
