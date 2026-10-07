import { bezierOf } from './ease';
import { clone } from './tree';
import type { Clip, Ease, IconDoc, Key, Manner, Reaction } from './types';

/** The same curve, run from its end to its start. */
function reverseEase(ease: Ease | undefined): Ease | undefined {
  // A step run backwards jumps at the other end of its segment; it is used while a part is unseen, where it does not show.
  if (ease === undefined || ease === 'linear' || ease === 'ease-in-out' || ease === 'hold') return ease;
  if (ease === 'ease-in') return 'ease-out';
  if (ease === 'ease-out') return 'ease-in';
  const [x1, y1, x2, y2] = bezierOf(ease);
  return [1 - x2, 1 - y2, 1 - x1, 1 - y1].map((n) => Math.round(n * 1000) / 1000) as Ease;
}

/** A clip run backwards: the same keys from the last to the first, each step with its curve turned round. */
export function reverseClip(clip: Clip, id: string, trigger: Clip['trigger']): Clip {
  const tracks = clip.tracks.map((track) => {
    const from = [...track.keys].reverse();
    const keys = from.map((key, index): Key => {
      // The step that starts here was, forwards, the step that ended here: its curve sat on the key before.
      const ease = reverseEase(from[index + 1]?.ease);
      const turned: Key = { t: Math.round((1 - key.t) * 10000) / 10000, v: key.v };
      return ease === undefined || index === from.length - 1 ? turned : { ...turned, ease };
    });
    return { ...track, keys };
  });
  return { ...clone(clip), id, trigger, tracks };
}

/** The icon as it plays in one manner: with the clips of that manner and the ones that belong to both. */
export function forManner(doc: IconDoc, manner: Manner): IconDoc {
  const clips = doc.clips.filter((clip) => clip.manner === undefined || clip.manner === manner);
  return clips.length === doc.clips.length ? doc : { ...doc, clips };
}

/** The manners an icon has clips for; an icon whose clips name none is animated in the subtle one. */
export function mannersOf(doc: IconDoc): Manner[] {
  const named = new Set(doc.clips.flatMap((clip) => (clip.manner ? [clip.manner] : [])));
  if (doc.clips.some((clip) => clip.manner === undefined) || named.size === 0) named.add('subtle');
  return (['subtle', 'expressive'] as const).filter((manner) => named.has(manner));
}

/** The clip a press plays from rest: the action of an icon that acts, the way on of an icon that switches. */
export function pressClip(doc: IconDoc): string | undefined {
  return doc.clips.find((clip) => clip.trigger === 'click' || clip.trigger === 'on')?.id;
}

/** The clip of an icon for one of its two reactions. */
export function reactionClip(doc: IconDoc, reaction: Reaction): string | undefined {
  return reaction === 'click' ? pressClip(doc) : doc.clips.find((clip) => clip.trigger === 'hover')?.id;
}

/** An icon that switches has two rests, off and on, and a press takes it from one to the other. */
export function isSwitch(doc: IconDoc): boolean {
  return doc.clips.some((clip) => clip.trigger === 'on');
}

/** What a press does to an icon, read from the clips it has. */
export const ICON_TYPES = ['action', 'switch', 'state', 'arrival', 'still'] as const;
export type IconType = (typeof ICON_TYPES)[number];

/** A switch stays in its other state; an action is done and over; a state lasts by itself; an arrival plays once. */
export function typeOf(doc: IconDoc): IconType {
  const has = (...triggers: Clip['trigger'][]): boolean => doc.clips.some((clip) => triggers.includes(clip.trigger));
  if (has('on')) return 'switch';
  if (has('click', 'hover')) return 'action';
  if (has('loop')) return 'state';
  return has('in') ? 'arrival' : 'still';
}

/**
 * The document with the clip that takes a switch back to off: the one it has, or else its way on run
 * backwards. An icon that does not switch is returned as it is.
 */
export function withOff(doc: IconDoc): IconDoc {
  const on = doc.clips.find((clip) => clip.trigger === 'on');
  if (!on || doc.clips.some((clip) => clip.trigger === 'off')) return doc;
  const taken = new Set(doc.clips.map((clip) => clip.id));
  let id = `${on.id}-back`;
  while (taken.has(id)) id += '-x';
  return { ...doc, clips: [...doc.clips, reverseClip(on, id, 'off')] };
}
