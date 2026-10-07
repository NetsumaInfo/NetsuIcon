import { easeAt } from './ease';
import { clone, findNode } from './tree';
import { IconError, type IconDoc, type Track, type Trigger, type Value } from './types';

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

function rgb(color: string): [number, number, number] | undefined {
  if (!HEX.test(color)) return undefined;
  const hex = color.length === 4 ? [...color.slice(1)].map((c) => c + c).join('') : color.slice(1);
  return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
}

function lerp(a: number, b: number, p: number): number {
  return a + (b - a) * p;
}

function mixColor(a: string, b: string, p: number): string {
  const from = rgb(a);
  const to = rgb(b);
  if (!from || !to) return p < 1 ? a : b;
  const channels = from.map((c, i) => Math.round(lerp(c, to[i]!, p)));
  return `#${channels.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

export function mix(a: Value, b: Value, p: number): Value {
  if (typeof a === 'number' && typeof b === 'number') return lerp(a, b, p);
  if (Array.isArray(a) && Array.isArray(b)) return [lerp(a[0], b[0], p), lerp(a[1], b[1], p)];
  if (typeof a === 'string' && typeof b === 'string') return mixColor(a, b, p);
  return p < 1 ? a : b;
}

/** The value of a track at the fraction `t` (0..1) of its clip. */
export function valueAt(track: Track, t: number): Value {
  const keys = track.keys;
  const first = keys[0]!;
  const last = keys[keys.length - 1]!;
  if (t <= first.t) return first.v;
  if (t >= last.t) return last.v;
  const next = keys.findIndex((key) => key.t > t);
  const a = keys[next - 1]!;
  const b = keys[next]!;
  return mix(a.v, b.v, easeAt(a.ease, (t - a.t) / (b.t - a.t)));
}

/**
 * The clip of an icon for a trigger: the first one that has it. With no trigger, the clip that shows the icon
 * best when only one can play: its first hover or click, or else its first clip.
 */
export function mainClip(doc: IconDoc, trigger?: Trigger): string | undefined {
  if (trigger !== undefined) return doc.clips.find((clip) => clip.trigger === trigger)?.id;
  return (doc.clips.find((clip) => clip.trigger === 'hover' || clip.trigger === 'click') ?? doc.clips[0])?.id;
}

/** The moments of a clip worth a look: its start, its end and every moment a key sits at, in order. */
export function keyMoments(doc: IconDoc, clipId: string): number[] {
  const clip = doc.clips.find((c) => c.id === clipId);
  if (!clip) throw new IconError('clip_not_found', `No clip with id "${clipId}".`);
  return [...new Set([0, 1, ...clip.tracks.flatMap((track) => track.keys.map((key) => Math.round(key.t * 1000) / 1000))])].sort((a, b) => a - b);
}


/** The document as it stands at the fraction `t` of a clip: animated values written into the nodes. */
export function sample(doc: IconDoc, clipId: string, t: number): IconDoc {
  const frozen = clone(doc);
  const clip = frozen.clips.find((c) => c.id === clipId);
  if (!clip) throw new IconError('clip_not_found', `No clip with id "${clipId}".`);
  for (const track of clip.tracks) {
    const node = findNode(frozen.nodes, track.node);
    if (node) (node as unknown as Record<string, Value>)[track.prop] = valueAt(track, t);
  }
  return frozen;
}
