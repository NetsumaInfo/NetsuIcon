import type { Limits, Pack } from './pack';
import { num } from './svg';
import { walk } from './tree';
import { forManner, mannersOf } from './clips';
import type { Clip, IconDoc, Pair, Track } from './types';

export const FINDING_CODES = ['frame', 'own_style', 'off_palette', 'stroke_width', 'duration', 'translate', 'rotate', 'scale', 'no_hover', 'no_click'] as const;
export type FindingCode = (typeof FINDING_CODES)[number];

/** One way an icon departs from its pack. Advice, not an error: the icon is still valid. `got` and `want` hold no words, so the app can translate around them. */
export interface Finding {
  code: FindingCode;
  /** The part of the icon it is about: `icon`, `node "ray"`, `clip "spin"`. */
  where: string;
  got: string;
  want: string;
}

/** Paints that are not a colour of their own: nothing to compare with the palette. */
const FREE = /^(none|currentColor|transparent|inherit|\$.*|url\(.*\))$/i;

function offPalette(value: unknown, where: string, pack: Pack, out: Finding[]): void {
  if (typeof value !== 'string' || FREE.test(value)) return;
  const names = Object.keys(pack.palette);
  if (names.length === 0) return;
  const same = names.find((name) => pack.palette[name]!.toLowerCase() === value.toLowerCase());
  out.push({ code: 'off_palette', where, got: value, want: same ? `$${same}` : names.map((name) => `$${name}`).join(', ') });
}

function lintStyle(doc: IconDoc, pack: Pack, out: Finding[]): void {
  if (doc.mode !== pack.mode || doc.size !== pack.size) {
    out.push({ code: 'frame', where: 'icon', got: `${doc.mode} ${num(doc.size)}`, want: `${pack.mode} ${num(pack.size)}` });
  }
  const style = pack.style as Record<string, unknown>;
  for (const [key, value] of Object.entries(doc.defaults ?? {})) {
    if (style[key] !== undefined && style[key] !== value) {
      out.push({ code: 'own_style', where: `defaults.${key}`, got: String(value), want: String(style[key]) });
    }
  }
  offPalette(doc.defaults?.fill, 'defaults.fill', pack, out);
  offPalette(doc.defaults?.stroke, 'defaults.stroke', pack, out);
  walk(doc.nodes, (node) => {
    const where = `node "${node.id}"`;
    offPalette(node.fill, `${where} fill`, pack, out);
    offPalette(node.stroke, `${where} stroke`, pack, out);
    const width = pack.style.strokeWidth;
    // A node unseen at rest is a prop: it is drawn thinner on purpose, so that its inside stays open.
    const prop = node.opacity === 0;
    if (!prop && width !== undefined && node.strokeWidth !== undefined && node.strokeWidth !== width) {
      out.push({ code: 'stroke_width', where, got: num(node.strokeWidth), want: num(width) });
    }
  });
  for (const gradient of doc.gradients ?? []) {
    for (const stop of gradient.stops) offPalette(stop.color, `gradient "${gradient.id}"`, pack, out);
  }
}

/** How far a track goes from where it starts. */
function reach(track: Track): number {
  const first = track.keys[0]!.v;
  return Math.max(
    ...track.keys.map((key) => {
      if (track.prop === 'translate') return Math.hypot((key.v as Pair)[0] - (first as Pair)[0], (key.v as Pair)[1] - (first as Pair)[1]);
      return Math.abs((key.v as number) - (first as number));
    }),
  );
}

function lintLimits(track: Track, where: string, limits: Limits, out: Finding[]): void {
  const { maxTranslate, maxRotate, scale } = limits;
  if (track.prop === 'translate' && reach(track) > maxTranslate) {
    out.push({ code: 'translate', where, got: num(reach(track)), want: num(maxTranslate) });
  }
  if (track.prop === 'rotate' && reach(track) > maxRotate) {
    out.push({ code: 'rotate', where, got: num(reach(track)), want: num(maxRotate) });
  }
  if (track.prop === 'scale') {
    const values = track.keys.map((key) => key.v as number);
    const [low, high] = [Math.min(...values), Math.max(...values)];
    if (low < scale[0] || high > scale[1]) {
      out.push({ code: 'scale', where, got: `${num(low)}–${num(high)}`, want: `${num(scale[0])}–${num(scale[1])}` });
    }
  }
}

/** The limits a clip is held to: a hover to the pack's hover, anything a press plays to its click. Loops and entrances are free. */
function limitsOf(clip: Clip, pack: Pack): Limits | undefined {
  const set = clip.manner === 'expressive' ? pack.motion.expressive : pack.motion;
  if (clip.trigger === 'hover') return set.hover;
  if (clip.trigger === 'click' || clip.trigger === 'on' || clip.trigger === 'off') return set.click;
  return undefined;
}

function lintMotion(doc: IconDoc, pack: Pack, out: Finding[]): void {
  for (const clip of doc.clips) {
    const limits = limitsOf(clip, pack);
    if (limits && (clip.duration < limits.duration[0] || clip.duration > limits.duration[1])) {
      const want = `${num(limits.duration[0])}–${num(limits.duration[1])}`;
      out.push({ code: 'duration', where: `clip "${clip.id}" (${clip.trigger}${clip.manner ? `, ${clip.manner}` : ''})`, got: num(clip.duration), want });
    }
    for (const track of clip.tracks) {
      const where = `clip "${clip.id}" ${track.node}.${track.prop}`;
      // One finding per track is enough: its first colour that is not of the palette.
      offPalette(track.keys.map((key) => key.v).find((v) => typeof v === 'string' && !FREE.test(v)), where, pack, out);
      if (limits) lintLimits(track, where, limits, out);
    }
  }
}

/** An icon that reacts to the pointer reacts to a press too, and the other way round. A still icon is left alone. */
function lintReactions(doc: IconDoc, out: Finding[]): void {
  for (const manner of mannersOf(doc)) {
    const clips = forManner(doc, manner).clips;
    const hover = clips.some((clip) => clip.trigger === 'hover');
    const press = clips.some((clip) => clip.trigger === 'click' || clip.trigger === 'on');
    const where = `icon (${manner})`;
    if (hover && !press) out.push({ code: 'no_click', where, got: '', want: '' });
    if (press && !hover) out.push({ code: 'no_hover', where, got: '', want: '' });
  }
}

/** Where an icon departs from its pack: frame, style, palette, the limits of each reaction, a reaction missing. Empty when it fits. */
export function lint(doc: IconDoc, pack: Pack): Finding[] {
  const out: Finding[] = [];
  lintStyle(doc, pack, out);
  lintMotion(doc, pack, out);
  lintReactions(doc, out);
  return out;
}

const ADVICE: Record<FindingCode, (finding: Finding) => string> = {
  frame: (f) => `is ${f.got}; the pack is ${f.want}`,
  own_style: (f) => `is ${f.got}; the pack sets ${f.want}. Remove it to inherit`,
  off_palette: (f) => `${f.got} is not a colour of the palette. Use ${f.want}`,
  stroke_width: (f) => `strokeWidth is ${f.got}; the pack draws with ${f.want}`,
  duration: (f) => `lasts ${f.got} ms; the pack keeps this reaction between ${f.want} ms`,
  translate: (f) => `moves ${f.got} units; for this reaction the pack moves ${f.want} at most`,
  rotate: (f) => `turns ${f.got} degrees; for this reaction the pack turns ${f.want} at most`,
  scale: (f) => `scales over ${f.got}; for this reaction the pack stays within ${f.want}`,
  no_hover: () => 'reacts to a press but not to the pointer over it. Add a hover clip: a hint of what the press does',
  no_click: () => 'reacts to the pointer but not to a press. Add a click clip (it acts) or an on clip (it switches)',
};

/** A finding as a sentence, for an agent. */
export function findingText(finding: Finding): string {
  return `${finding.where}: ${ADVICE[finding.code](finding)}.`;
}
