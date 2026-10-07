import { useEffect, useState } from 'react';
import type { IconDoc, Pack } from '@netsuicon/core';
import i18n from '../i18n';
import { watchFolder } from './events';

/** The languages the app speaks; the server keeps which one is chosen. */
export const LANGUAGES = ['en', 'fr'] as const;
export type Language = (typeof LANGUAGES)[number];

/** Asks the server for another language. The app follows when the server says the folder changed. */
export async function chooseLanguage(language: Language): Promise<void> {
  await fetch('/api/language', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ language }) });
}

export type ServerStatus = 'connecting' | 'online' | 'offline';

/** A pack and the icons drawn in it. */
export interface PackListing {
  pack: Pack;
  icons: IconDoc[];
}

interface Listing {
  dir: string;
  /** The language chosen for the app, by its user or by the agent. */
  language: Language;
  /** The icons outside the packs. */
  icons: IconDoc[];
  packs: PackListing[];
}

export interface Icons extends Listing {
  status: ServerStatus;
}

/** The icons and the packs of the folder, kept up to date: the server says when a file changed, the list is read again. */
export function useIcons(): Icons {
  const [state, setState] = useState<Icons>({ status: 'connecting', dir: '', language: 'en', icons: [], packs: [] });

  useEffect(() => {
    void i18n.changeLanguage(state.language);
    document.documentElement.lang = state.language;
  }, [state.language]);

  useEffect(() => {
    let alive = true;
    const load = async (): Promise<void> => {
      try {
        const response = await fetch('/api/icons');
        if (!response.ok) throw new Error(String(response.status));
        const listing = (await response.json()) as Listing;
        if (alive) setState({ status: 'online', ...listing });
      } catch {
        if (alive) setState((previous) => ({ ...previous, status: 'offline' }));
      }
    };
    const stop = watchFolder(
      () => void load(),
      () => setState((previous) => ({ ...previous, status: 'offline' })),
    );
    return () => {
      alive = false;
      stop();
    };
  }, []);

  return state;
}
