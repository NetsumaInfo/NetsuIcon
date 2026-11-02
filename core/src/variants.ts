import type { IconDoc } from './types';

/** One mode of a button: the icon that shows it, and its name (none for the icon the others are modes of). */
export interface ModeEntry {
  icon: string;
  mode?: string;
}

/** The modes of the button an icon belongs to: the base icon first, then its modes in name order. One entry: no modes. */
export function modesOf(icons: IconDoc[], name: string): ModeEntry[] {
  const doc = icons.find((icon) => icon.name === name);
  if (!doc) return [];
  const base = doc.variant?.of ?? doc.name;
  const modes = icons
    .filter((icon) => icon.variant?.of === base)
    .map((icon) => ({ icon: icon.name, mode: icon.variant!.mode }))
    .sort((a, b) => a.mode.localeCompare(b.mode));
  const head = icons.some((icon) => icon.name === base) ? [{ icon: base }] : [];
  return [...head, ...modes];
}
