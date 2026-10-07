import { clone, walk } from './tree';
import { EASE_NAMES, IconError, MANNERS, MODES, REACTIONS, type Ease, type IconDoc, type Manner, type Mode, type Pair, type Style } from './types';

/** How far one kind of reaction may go. */
export interface Limits {
  /** Shortest and longest clip, in milliseconds. */
  duration: Pair;
  /** Largest move, in view box units. */
  maxTranslate: number;
  /** Largest turn, in degrees. */
  maxRotate: number;
  /** Smallest and largest scale. */
  scale: Pair;
}

/**
 * How the icons of a pack move. An icon reacts twice: to the pointer over it, with a hint of what it does,
 * and to a click, with the action itself. Each reaction has its own limits; loops and entrances have none.
 */
export interface Motion {
  /** A few words on the character of the movement, for whoever animates. */
  feel?: string;
  /** Easing of a key that sets none. */
  ease: Ease;
  /** The pointer is over the icon: small and short. */
  hover: Limits;
  /** The icon is pressed: the whole action, or the way to its other state and back. Larger and longer. */
  click: Limits;
  /** The limits of the expressive manner, where the same reactions are played out. */
  expressive: { hover: Limits; click: Limits };
  /** The manner the application uses: what an export writes when none is asked for. Default: subtle. */
  manner?: Manner;
}


/**
 * The icons of one application, and what keeps them alike: a frame, a style, a palette and a way of moving.
 * Stored as `<pack>/pack.json`, next to its icons.
 */
export interface Pack {
  version: 1;
  name: string;
  /** The application and its tone, in a sentence or two. */
  brief?: string;
  mode: Mode;
  /** Side of the view box of every icon. */
  size: number;
  /** Style every icon inherits; an icon overrides it with its own `defaults`. */
  style: Style;
  /** Named colours. An icon writes `$name` where it wants one. */
  palette: Record<string, string>;
  motion: Motion;
}

/** What `edit_pack` may change. A section is merged key by key, `motion.hover` and `motion.click` too; null removes a key. */
export interface PackEdit {
  brief?: string | null;
  style?: Record<string, unknown>;
  palette?: Record<string, string | null>;
  motion?: Record<string, unknown>;
}

const NAME = /^[a-z0-9][a-z0-9-]*$/;
const TOKEN_NAME = /^[a-z][a-z0-9-]*$/;
const TOKEN = /^\$(.*)$/;
const SECTIONS = ['style', 'palette', 'motion'] as const;

function fail(code: string, message: string): never {
  throw new IconError(code, message);
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isRange(value: unknown): boolean {
  if (!Array.isArray(value) || value.length !== 2) return false;
  const [low, high] = value as unknown[];
  return isNumber(low) && isNumber(high) && low <= high;
}

function isEase(value: unknown): boolean {
  if (typeof value === 'string') return (EASE_NAMES as readonly string[]).includes(value);
  return Array.isArray(value) && value.length === 4 && value.every(isNumber);
}

export function newPack(name: string, mode: Mode, size?: number): Pack {
  const side = size ?? (mode === 'micro' ? 24 : 1024);
  return {
    version: 1,
    name,
    mode,
    size: side,
    style: mode === 'micro' ? { fill: 'none', stroke: 'currentColor', strokeWidth: 2, linecap: 'round', linejoin: 'round' } : {},
    palette: {},
    motion: {
      ease: 'ease-in-out',
      hover: { duration: [250, 600], maxTranslate: side / 12, maxRotate: 20, scale: [0.9, 1.1] },
      click: { duration: [400, 900], maxTranslate: side / 4, maxRotate: 90, scale: [0.7, 1.25] },
      expressive: {
        hover: { duration: [400, 900], maxTranslate: side / 6, maxRotate: 45, scale: [0.8, 1.25] },
        click: { duration: [800, 1800], maxTranslate: side * 1.5, maxRotate: 360, scale: [0.4, 1.5] },
      },
    },
  };
}

/** An empty icon in the frame of the pack. It sets no style of its own: it inherits the pack's. */
export function newDocIn(pack: Pack, name: string): IconDoc {
  return { version: 1, name, mode: pack.mode, size: pack.size, nodes: [], clips: [] };
}

/** The colour a `$name` stands for; any other value is returned as it is. */
function colour(value: string, pack: Pack | undefined, where: string): string {
  const name = TOKEN.exec(value)?.[1];
  if (name === undefined) return value;
  if (!pack) fail('unknown_token', `${where}: "${value}" is a colour of a pack, and this icon is in no pack.`);
  const found = pack.palette[name];
  if (found === undefined) {
    const known = Object.keys(pack.palette).map((key) => `$${key}`).join(', ') || 'none';
    fail('unknown_token', `${where}: the palette of pack "${pack.name}" has no "${value}". It has: ${known}.`);
  }
  return found;
}

function paints(style: Style, pack: Pack | undefined, where: string): void {
  if (style.fill !== undefined) style.fill = colour(style.fill, pack, `${where}.fill`);
  if (style.stroke !== undefined) style.stroke = colour(style.stroke, pack, `${where}.stroke`);
}

/**
 * The icon as it is drawn: the style of the pack under its own, every `$name` replaced by its colour,
 * and the easing of the pack on the keys that set none. Throws on a `$name` the palette does not have.
 * Without a pack the icon is returned as it is, unless it uses a `$name`.
 */
export function resolve(doc: IconDoc, pack: Pack | undefined): IconDoc {
  const out = clone(doc);
  const defaults: Style = { ...pack?.style, ...out.defaults };
  paints(defaults, pack, 'defaults');
  if (Object.keys(defaults).length > 0) out.defaults = defaults;
  walk(out.nodes, (node) => paints(node, pack, `node "${node.id}"`));
  for (const gradient of out.gradients ?? []) {
    for (const stop of gradient.stops) stop.color = colour(stop.color, pack, `gradient "${gradient.id}"`);
  }
  for (const clip of out.clips) {
    for (const track of clip.tracks) {
      for (const key of track.keys) {
        if (typeof key.v === 'string') key.v = colour(key.v, pack, `track ${track.node}.${track.prop}`);
        if (pack && key.ease === undefined) key.ease = pack.motion.ease;
      }
    }
  }
  return out;
}

function checkLimits(limits: Limits, name: string): void {
  const at = `motion.${name}`;
  if (!limits || typeof limits !== 'object') fail('bad_pack', `A pack needs "${at}": {duration, maxTranslate, maxRotate, scale}.`);
  if (!isRange(limits.duration) || limits.duration[0] <= 0) fail('bad_pack', `${at}.duration is [shortest, longest] in milliseconds, above 0.`);
  if (!isNumber(limits.maxTranslate) || limits.maxTranslate < 0) fail('bad_pack', `${at}.maxTranslate is a distance in view box units, 0 or more.`);
  if (!isNumber(limits.maxRotate) || limits.maxRotate < 0) fail('bad_pack', `${at}.maxRotate is an angle in degrees, 0 or more.`);
  if (!isRange(limits.scale) || limits.scale[0] <= 0) fail('bad_pack', `${at}.scale is [smallest, largest], above 0.`);
}

function checkMotion(motion: Motion): void {
  if (!motion || typeof motion !== 'object') fail('bad_pack', 'A pack needs "motion".');
  if (!isEase(motion.ease)) fail('bad_pack', `motion.ease is one of ${EASE_NAMES.join(', ')} or [x1, y1, x2, y2].`);
  if (motion.feel !== undefined && typeof motion.feel !== 'string') fail('bad_pack', 'motion.feel is a sentence.');
  if (motion.manner !== undefined && !MANNERS.includes(motion.manner)) fail('bad_pack', `motion.manner is one of ${MANNERS.join(', ')}.`);
  if (!motion.expressive || typeof motion.expressive !== 'object') fail('bad_pack', 'A pack needs "motion.expressive": {hover, click}, the limits of its expressive manner.');
  for (const reaction of REACTIONS) {
    checkLimits(motion[reaction], reaction);
    checkLimits(motion.expressive[reaction], `expressive.${reaction}`);
  }
}

/** Throws an `IconError` on the first thing that is wrong with the pack itself. */
export function validatePack(pack: Pack): void {
  if (typeof pack.name !== 'string' || !NAME.test(pack.name)) fail('bad_name', 'The name of a pack is lowercase letters, digits and dashes.');
  if (!MODES.includes(pack.mode)) fail('bad_mode', `mode is one of ${MODES.join(', ')}.`);
  if (!isNumber(pack.size) || pack.size <= 0) fail('bad_size', 'size is the side of the view box, above 0.');
  if (pack.brief !== undefined && typeof pack.brief !== 'string') fail('bad_pack', 'brief is a sentence.');
  if (!pack.palette || typeof pack.palette !== 'object') fail('bad_pack', 'A pack needs a "palette", even an empty one.');
  for (const [name, value] of Object.entries(pack.palette)) {
    if (!TOKEN_NAME.test(name)) fail('bad_pack', `Palette name ${JSON.stringify(name)} must be lowercase letters, digits and dashes, starting with a letter.`);
    if (typeof value !== 'string' || value === '' || TOKEN.test(value)) fail('bad_pack', `Palette colour "${name}" must be a colour, not another name.`);
  }
  if (!pack.style || typeof pack.style !== 'object') fail('bad_pack', 'A pack needs a "style", even an empty one.');
  if (pack.style.strokeWidth !== undefined && !isNumber(pack.style.strokeWidth)) fail('bad_pack', 'style.strokeWidth must be a number.');
  paints({ ...pack.style }, pack, 'style');
  checkMotion(pack.motion);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Key by key: null removes, an object goes into the object already there, anything else replaces. */
function merge(into: Record<string, unknown>, from: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(from)) {
    const there = into[key];
    if (value === null) delete into[key];
    else if (isRecord(value) && isRecord(there)) merge(there, value);
    else if (value !== undefined) into[key] = value;
  }
}

/** The pack with the changes merged in, validated. The frame (name, mode, size) cannot change: the icons are drawn in it. */
export function editPack(pack: Pack, set: PackEdit): Pack {
  const next = clone(pack) as unknown as Record<string, unknown>;
  for (const [key, value] of Object.entries(set ?? {})) {
    if (value === undefined) continue;
    if (key === 'brief') {
      if (value === null) delete next.brief;
      else next.brief = value;
    } else if ((SECTIONS as readonly string[]).includes(key) && isRecord(value)) {
      merge(next[key] as Record<string, unknown>, value);
    } else {
      fail('locked_field', `"${key}" of a pack cannot be changed. Change brief, style, palette or motion.`);
    }
  }
  validatePack(next as unknown as Pack);
  return next as unknown as Pack;
}
