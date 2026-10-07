import { walk } from './tree';
import {
  ANIM_PROPS,
  EASE_NAMES,
  IconError,
  MANNERS,
  MODES,
  TRIGGERS,
  type AnimProp,
  type Clip,
  type IconDoc,
  type IconNode,
  type Key,
  type NodeType,
  type Track,
} from './types';

const ID = /^[a-z][a-z0-9-]*$/;

const REQUIRED: Record<NodeType, string[]> = {
  path: [],
  rect: ['x', 'y', 'width', 'height'],
  circle: ['cx', 'cy', 'r'],
  ellipse: ['cx', 'cy', 'rx', 'ry'],
  line: ['x1', 'y1', 'x2', 'y2'],
  group: [],
};

const OPTIONAL_NUMBERS = ['opacity', 'draw', 'rotate', 'scale', 'strokeWidth', 'rx'];
const PAIRS = ['translate', 'origin', 'trim'];

function fail(code: string, message: string): never {
  throw new IconError(code, message);
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isPair(value: unknown): boolean {
  return Array.isArray(value) && value.length === 2 && value.every(isNumber);
}

export function checkId(id: unknown, what: string): void {
  if (typeof id !== 'string' || !ID.test(id)) {
    fail('bad_id', `${what} id must be lowercase letters, digits and dashes, starting with a letter; got ${JSON.stringify(id)}.`);
  }
}

function checkNode(node: IconNode): void {
  checkId(node.id, 'Node');
  const fields = node as unknown as Record<string, unknown>;
  const required = REQUIRED[node.type];
  if (!required) fail('bad_node', `Node "${node.id}" has an unknown type ${JSON.stringify(node.type)}.`);
  for (const key of required) {
    if (!isNumber(fields[key])) fail('bad_node', `Node "${node.id}" (${node.type}) needs a number for "${key}".`);
  }
  for (const key of OPTIONAL_NUMBERS) {
    if (fields[key] !== undefined && !isNumber(fields[key])) fail('bad_node', `"${key}" of node "${node.id}" must be a number.`);
  }
  for (const key of PAIRS) {
    if (fields[key] !== undefined && !isPair(fields[key])) fail('bad_node', `"${key}" of node "${node.id}" must be [x, y].`);
  }
  if (node.type === 'path' && (typeof node.d !== 'string' || node.d.trim() === '')) {
    fail('bad_node', `Path "${node.id}" needs path data in "d".`);
  }
  if (node.type === 'group' && !Array.isArray(node.children)) fail('bad_node', `Group "${node.id}" needs "children".`);
}

function isFraction(value: unknown): boolean {
  return isNumber(value) && value >= 0 && value <= 1;
}

function valueFits(prop: AnimProp, value: unknown): boolean {
  if (prop === 'trim') return isPair(value) && (value as number[]).every(isFraction) && (value as number[])[0]! <= (value as number[])[1]!;
  if (prop === 'draw') return isFraction(value);
  if (prop === 'translate') return isPair(value);
  if (prop === 'fill' || prop === 'stroke') return typeof value === 'string';
  return isNumber(value);
}

function checkKey(key: Key, track: Track, previous: number): void {
  const where = `Track ${track.node}.${track.prop}`;
  if (!isNumber(key.t) || key.t < 0 || key.t > 1) fail('bad_key', `${where}: "t" is a fraction of the clip, from 0 to 1.`);
  if (key.t <= previous) fail('bad_key', `${where}: keys must be in rising order of "t".`);
  if (!valueFits(track.prop, key.v)) {
    const want = track.prop === 'translate' ? '[x, y]' : track.prop === 'trim' ? '[from, to], each from 0 to 1, from not after to' : track.prop === 'draw' ? 'a number from 0 to 1: a stroke cannot be drawn further than whole' : track.prop === 'fill' || track.prop === 'stroke' ? 'a colour' : 'a number';
    fail('bad_key', `${where}: "v" must be ${want}.`);
  }
  const ease = key.ease;
  if (ease === undefined) return;
  const named = typeof ease === 'string' && (EASE_NAMES as readonly string[]).includes(ease);
  const curve = Array.isArray(ease) && ease.length === 4 && ease.every(isNumber);
  if (!named && !curve) fail('bad_key', `${where}: "ease" is one of ${EASE_NAMES.join(', ')} or [x1, y1, x2, y2].`);
}

function checkClip(clip: Clip, nodes: Set<string>): void {
  checkId(clip.id, 'Clip');
  if (!TRIGGERS.includes(clip.trigger)) fail('bad_clip', `Clip "${clip.id}": trigger is one of ${TRIGGERS.join(', ')}.`);
  if (!isNumber(clip.duration) || clip.duration <= 0) fail('bad_clip', `Clip "${clip.id}": duration is in milliseconds, above 0.`);
  if (clip.delay !== undefined && (!isNumber(clip.delay) || clip.delay < 0)) fail('bad_clip', `Clip "${clip.id}": delay cannot be negative.`);
  if (clip.manner !== undefined && !MANNERS.includes(clip.manner)) fail('bad_clip', `Clip "${clip.id}": manner is one of ${MANNERS.join(', ')}, or left out.`);
  const seen = new Set<string>();
  for (const track of clip.tracks) {
    if (!nodes.has(track.node)) fail('node_not_found', `Clip "${clip.id}" animates "${track.node}", which does not exist.`);
    if (!ANIM_PROPS.includes(track.prop)) fail('bad_track', `"${track.prop}" cannot be animated. Use one of ${ANIM_PROPS.join(', ')}.`);
    const slot = `${track.node}.${track.prop}`;
    if (seen.has(slot)) fail('bad_track', `Clip "${clip.id}" has two tracks for ${slot}.`);
    seen.add(slot);
    const other = track.prop === 'draw' ? 'trim' : track.prop === 'trim' ? 'draw' : undefined;
    if (other && seen.has(`${track.node}.${other}`)) fail('bad_track', `Clip "${clip.id}" animates both draw and trim of "${track.node}". They set the same dash: keep one.`);
    if (!Array.isArray(track.keys) || track.keys.length === 0) fail('bad_track', `Track ${slot} needs at least one key.`);
    let previous = -1;
    for (const key of track.keys) {
      checkKey(key, track, previous);
      previous = key.t;
    }
  }
}

/** Throws an `IconError` on the first thing that is wrong. A document that passes can be rendered and exported. */
export function validate(doc: IconDoc): void {
  if (typeof doc.name !== 'string' || !/^[a-z0-9][a-z0-9-]*$/.test(doc.name)) {
    fail('bad_name', 'The name of an icon is lowercase letters, digits and dashes.');
  }
  if (!MODES.includes(doc.mode)) fail('bad_mode', `mode is one of ${MODES.join(', ')}.`);
  if (!isNumber(doc.size) || doc.size <= 0) fail('bad_size', 'size is the side of the view box, above 0.');
  const ids = new Set<string>();
  walk(doc.nodes, (node) => {
    checkNode(node);
    if (ids.has(node.id)) fail('duplicate_id', `Two nodes share the id "${node.id}".`);
    ids.add(node.id);
  });
  const gradients = new Set<string>();
  for (const gradient of doc.gradients ?? []) {
    checkId(gradient.id, 'Gradient');
    if (gradients.has(gradient.id)) fail('duplicate_id', `Two gradients share the id "${gradient.id}".`);
    gradients.add(gradient.id);
    if (!Array.isArray(gradient.stops) || gradient.stops.length < 2) fail('bad_gradient', `Gradient "${gradient.id}" needs two stops or more.`);
  }
  const clips = new Set<string>();
  for (const clip of doc.clips) {
    checkClip(clip, ids);
    if (clips.has(clip.id)) fail('duplicate_id', `Two clips share the id "${clip.id}".`);
    clips.add(clip.id);
  }
  checkPress(doc);
}

/**
 * What a press does is one thing: an action that comes back to rest, or a switch between two rests.
 * It holds within each manner, counting the clips that play in both.
 */
function checkPress(doc: IconDoc): void {
  for (const manner of MANNERS) {
    const count = (trigger: Clip['trigger']): number => doc.clips.filter((clip) => clip.trigger === trigger && (clip.manner ?? manner) === manner).length;
    const where = `In the ${manner} manner`;
    if (count('on') > 1 || count('off') > 1) fail('bad_clip', `${where}, an icon has one "on" clip and one "off" clip at most.`);
    if (count('off') > 0 && count('on') === 0) fail('bad_clip', `${where}, an "off" clip undoes an "on" clip: add the "on" clip first.`);
    if (count('on') > 0 && count('click') > 0) {
      fail('bad_clip', `${where}, an icon acts (a "click" clip, back to rest) or switches (an "on" clip, to its other state), not both. Change the trigger of the clip, or remove one.`);
    }
  }
}
