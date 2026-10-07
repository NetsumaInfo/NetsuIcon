import type { Key, Track } from './types';

/**
 * The keys of a track, stretched to cover the whole clip: the first value is held from 0 and the
 * last one up to 1. CSS and Motion would otherwise start from the resting value, not from the first key.
 */
export function paddedKeys(track: Track): Key[] {
  const keys = [...track.keys];
  const first = keys[0]!;
  const last = keys[keys.length - 1]!;
  if (first.t > 0) keys.unshift({ t: 0, v: first.v });
  if (last.t < 1) keys.push({ t: 1, v: last.v });
  return keys;
}

/** Ids of the nodes a track of the given property animates, in any clip. */
export function animatedNodes(clips: { tracks: Track[] }[], prop?: Track['prop']): Set<string> {
  const ids = new Set<string>();
  for (const clip of clips) {
    for (const track of clip.tracks) {
      if (prop === undefined || track.prop === prop) ids.add(track.node);
    }
  }
  return ids;
}
