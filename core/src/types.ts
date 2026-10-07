/** The icon document: a tree of shapes, plus clips that animate them. Stored as `<name>.nicon.json`. */

export type Pair = [number, number];
export type Value = number | string | Pair;

export const ANIM_PROPS = ['translate', 'rotate', 'scale', 'opacity', 'draw', 'trim', 'fill', 'stroke', 'strokeWidth'] as const;
export type AnimProp = (typeof ANIM_PROPS)[number];

/** `hold` is no curve: the value stays on this key, then jumps to the next one. */
export const EASE_NAMES = ['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out', 'hold'] as const;
export type Bezier = [number, number, number, number];
export type Ease = (typeof EASE_NAMES)[number] | Bezier;

/** `t` is a fraction of the clip (0..1). `ease` shapes the way from this key to the next one. */
export interface Key {
  t: number;
  v: Value;
  ease?: Ease;
}

export interface Track {
  node: string;
  prop: AnimProp;
  keys: Key[];
}

/**
 * `hover`: the pointer is over the icon. `click`: a press, on an icon that acts and comes back to rest.
 * `on` and `off`: a press on an icon that switches, to its second rest and back. `loop`: for ever. `in`: once, on arriving.
 */
export const TRIGGERS = ['hover', 'click', 'on', 'off', 'loop', 'in'] as const;
export type Trigger = (typeof TRIGGERS)[number];

/** The two ways an icon answers a person: the pointer over it, and a press. */
export const REACTIONS = ['hover', 'click'] as const;
export type Reaction = (typeof REACTIONS)[number];

/**
 * The two manners an icon can be animated in. `subtle`: small and short, for an interface one works in.
 * `expressive`: the same idea played out, larger, longer, with more happening. An icon may carry both.
 */
export const MANNERS = ['subtle', 'expressive'] as const;
export type Manner = (typeof MANNERS)[number];

export interface Clip {
  id: string;
  trigger: Trigger;
  /** The manner this clip belongs to. Without one, it plays in both. */
  manner?: Manner;
  /** Milliseconds. */
  duration: number;
  delay?: number;
  tracks: Track[];
}

export interface Style {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  linecap?: 'butt' | 'round' | 'square';
  linejoin?: 'miter' | 'round' | 'bevel';
}

export interface NodeBase extends Style {
  id: string;
  name?: string;
  hidden?: boolean;
  opacity?: number;
  /** Part of the stroke that is drawn, 0..1, from its start. */
  draw?: number;
  /** The stretch of the stroke that is drawn, [from, to], each 0..1: a line that runs along its own path. */
  trim?: Pair;
  translate?: Pair;
  /** Degrees, around `origin`. */
  rotate?: number;
  scale?: number;
  /** Pivot of rotate and scale, in the units of the view box. Default: its centre. */
  origin?: Pair;
}

export interface PathNode extends NodeBase {
  type: 'path';
  d: string;
}
export interface RectNode extends NodeBase {
  type: 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
  rx?: number;
}
export interface CircleNode extends NodeBase {
  type: 'circle';
  cx: number;
  cy: number;
  r: number;
}
export interface EllipseNode extends NodeBase {
  type: 'ellipse';
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}
export interface LineNode extends NodeBase {
  type: 'line';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}
export interface GroupNode extends NodeBase {
  type: 'group';
  children: IconNode[];
}

export type IconNode = PathNode | RectNode | CircleNode | EllipseNode | LineNode | GroupNode;
export type NodeType = IconNode['type'];

export interface GradientStop {
  offset: number;
  color: string;
  opacity?: number;
}

/** Coordinates are fractions of the box of the shape that uses it. Used as `fill: "url(#id)"`. */
export interface Gradient {
  id: string;
  type: 'linear' | 'radial';
  from?: Pair;
  to?: Pair;
  center?: Pair;
  radius?: number;
  stops: GradientStop[];
}

export const MODES = ['micro', 'app'] as const;
export type Mode = (typeof MODES)[number];

export interface IconDoc {
  version: 1;
  name: string;
  /** `micro`: a small interface icon. `app`: an application icon. */
  mode: Mode;
  /** Side of the square view box. */
  size: number;
  /** Style every shape inherits unless it sets its own. */
  defaults?: Style;
  gradients?: Gradient[];
  nodes: IconNode[];
  clips: Clip[];
}

export class IconError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'IconError';
  }
}

export function newDoc(name: string, mode: Mode, size?: number): IconDoc {
  const doc: IconDoc = { version: 1, name, mode, size: size ?? (mode === 'micro' ? 24 : 1024), nodes: [], clips: [] };
  if (mode === 'micro') {
    doc.defaults = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, linecap: 'round', linejoin: 'round' };
  }
  return doc;
}
