import { forManner, reactionClip, withOff } from './clips';
import type { Clip, IconDoc, Key, Manner, Reaction, Track } from './types';

export interface DemoOptions {
  /** Which manner of the icon to show. Default: subtle. */
  manner?: Manner;
  /** Which of its two reactions. Default: the press. */
  reaction?: Reaction;
  /** When the reaction starts in the loop, in ms. Default 400. */
  start?: number;
  /** How long a switch stays on before it goes back, in ms. Default 900. */
  held?: number;
  /** The length of the loop, in ms; made longer when the reaction does not fit. Default: the reaction and 900 ms of rest. */
  length?: number;
}

/** A clip set down at a moment of the loop. */
interface Placed {
  clip: Clip;
  at: number;
}

function endOf({ clip, at }: Placed): number {
  return at + (clip.delay ?? 0) + clip.duration;
}

function moved(track: Track, { clip, at }: Placed, length: number): Key[] {
  const from = at + (clip.delay ?? 0);
  return track.keys.map((key) => ({ ...key, t: Math.round(((from + key.t * clip.duration) / length) * 100000) / 100000 }));
}

/**
 * The icon playing one reaction by itself, over and over: for a place where nothing can hover or press it,
 * an `<img>`, a README, a slide. An action plays and rests; a switch goes on, stays, and goes back.
 * The answer has one `loop` clip; an icon without that reaction is returned still.
 */
export function demo(source: IconDoc, options: DemoOptions = {}): IconDoc {
  const doc = withOff(forManner(source, options.manner ?? 'subtle'));
  const first = doc.clips.find((clip) => clip.id === reactionClip(doc, options.reaction ?? 'click'));
  if (!first) return { ...doc, clips: [] };
  const played: Placed[] = [{ clip: first, at: options.start ?? 400 }];
  const back = first.trigger === 'on' ? doc.clips.find((clip) => clip.trigger === 'off') : undefined;
  if (back) played.push({ clip: back, at: endOf(played[0]!) + (options.held ?? 900) });
  const end = endOf(played[played.length - 1]!);
  const length = Math.max(options.length ?? end + 900, end);

  // The way on, then the way back, on one track: a track holds its last value between the two.
  const tracks = new Map<string, Track>();
  for (const part of played) {
    for (const track of part.clip.tracks) {
      const id = `${track.node}.${track.prop}`;
      const keys = moved(track, part, length);
      const before = tracks.get(id);
      tracks.set(id, before ? { ...before, keys: [...before.keys, ...keys] } : { ...track, keys });
    }
  }
  return { ...doc, clips: [{ id: 'demo', trigger: 'loop', duration: length, tracks: [...tracks.values()] }] };
}
