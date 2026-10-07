import { useCallback, useEffect, useState } from 'react';
import type { IconDoc } from '@netsuicon/core';
import type { PackListing } from './useIcons';

/** What the user chose to see: a pack, an icon of a pack, or an icon outside the packs. */
export interface Picked {
  pack?: string;
  icon?: string;
}

/** What is on screen: a pack alone is its sheet, an icon is its stage. */
export interface Shown {
  owner?: PackListing;
  doc?: IconDoc;
}

/** The choice, found in what the folder holds now. When it is gone: the first pack, or else the first icon. */
export function shown(icons: IconDoc[], packs: PackListing[], picked: Picked): Shown {
  const owner = packs.find((entry) => entry.pack.name === picked.pack);
  if (owner) return { owner, doc: owner.icons.find((icon) => icon.name === picked.icon) };
  const doc = picked.pack === undefined ? icons.find((icon) => icon.name === picked.icon) : undefined;
  if (doc) return { doc };
  return packs[0] ? { owner: packs[0] } : { doc: icons[0] };
}

/** Stands for "no pack" in the address: a pack cannot be named so. */
const LOOSE = '_';

/** The choice as the end of the address: `#/courrier`, `#/courrier/send`, `#/_/bell`. */
export function toHash({ pack, icon }: Picked): string {
  if (pack === undefined && icon === undefined) return '';
  return `#/${[pack ?? LOOSE, ...(icon === undefined ? [] : [icon])].map(encodeURIComponent).join('/')}`;
}

export function fromHash(hash: string): Picked {
  const [pack, icon] = hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  return { pack: pack === LOOSE ? undefined : pack, icon };
}

/** The choice, kept in the address: a reload stays on the same icon, and a link opens it. */
export function usePicked(): [Picked, (picked: Picked) => void] {
  const [picked, setPicked] = useState<Picked>(() => fromHash(window.location.hash));

  useEffect(() => {
    const read = (): void => setPicked(fromHash(window.location.hash));
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, []);

  const pick = useCallback((next: Picked): void => {
    window.location.hash = toHash(next);
  }, []);

  return [picked, pick];
}
