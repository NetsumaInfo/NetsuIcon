import clsx from 'clsx';
import { Package, Search } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { lint, resolve, toSvg, type IconDoc, type Pack } from '@netsuicon/core';
import type { Picked } from '../lib/picked';
import type { PackListing } from '../lib/useIcons';
import { IconBox } from './IconBox';

const ROW = 'flex items-center gap-3 rounded-control px-2 py-1.5 text-left';

function rowTone(current: boolean): string {
  return current ? 'bg-accent text-fg' : 'text-muted hover:bg-surface-2 hover:text-fg';
}

interface IconRowProps {
  icon: IconDoc;
  pack?: Pack;
  current: boolean;
  onSelect(): void;
}

function IconRow({ icon, pack, current, onSelect }: IconRowProps) {
  const { t } = useTranslation();
  const findings = pack ? lint(icon, pack).length : 0;
  return (
    <button type="button" aria-current={current} onClick={onSelect} className={clsx(ROW, rowTone(current))}>
      <IconBox svg={toSvg(resolve(icon, pack))} className="size-5 shrink-0 text-fg" />
      <span className="min-w-0 flex-1 truncate">{icon.name}</span>
      {pack === undefined && <span className="shrink-0 text-muted">{t(`list.${icon.mode}`)}</span>}
      {findings > 0 && (
        <span className="shrink-0 text-warn" title={t('pack.findings', { count: findings })}>
          {findings}
        </span>
      )}
    </button>
  );
}

interface IconListProps {
  /** The icons outside the packs. */
  icons: IconDoc[];
  packs: PackListing[];
  /** What is on screen. */
  current: Picked;
  onSelect(picked: Picked): void;
}

/** Every pack and every icon of the folder, with a field that narrows them by name. */
export function IconList({ icons, packs, current, onSelect }: IconListProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const wanted = query.trim().toLowerCase();
  const fits = (icon: IconDoc): boolean => icon.name.includes(wanted);
  // A pack whose name fits shows all its icons; another shows the ones that fit, and goes when none does.
  const shelves = packs
    .map((entry) => ({ ...entry, icons: entry.pack.name.includes(wanted) ? entry.icons : entry.icons.filter(fits) }))
    .filter((entry) => wanted === '' || entry.icons.length > 0);
  const loose = icons.filter(fits);

  return (
    <nav aria-label={t('list.title')} className="flex w-56 shrink-0 flex-col gap-2 rounded-panel bg-surface p-2">
      <label className="flex h-control shrink-0 items-center gap-2 rounded-control bg-bg px-2 text-muted focus-within:text-fg">
        <Search aria-hidden className="size-3 shrink-0" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('list.filter')}
          aria-label={t('list.filter')}
          className="min-w-0 flex-1 bg-transparent text-fg outline-none placeholder:text-muted"
        />
      </label>
      <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
        {shelves.length === 0 && loose.length === 0 && <p className="px-2 py-1 text-muted">{t('list.none')}</p>}
        {shelves.map(({ pack, icons: inside }) => {
          const here = current.pack === pack.name && current.icon === undefined;
          return (
            <section key={pack.name} className="flex flex-col gap-0.5 pb-3">
              <button type="button" aria-current={here} onClick={() => onSelect({ pack: pack.name })} className={clsx(ROW, 'font-semibold', here ? 'bg-accent text-fg' : 'text-fg hover:bg-surface-2')}>
                <Package aria-hidden className="size-4 shrink-0 text-muted" />
                <span className="min-w-0 flex-1 truncate">{pack.name}</span>
                <span className="shrink-0 font-normal text-muted">{inside.length}</span>
              </button>
              {inside.map((icon) => (
                <IconRow
                  key={icon.name}
                  icon={icon}
                  pack={pack}
                  current={current.pack === pack.name && current.icon === icon.name}
                  onSelect={() => onSelect({ pack: pack.name, icon: icon.name })}
                />
              ))}
            </section>
          );
        })}
        {loose.length > 0 && packs.length > 0 && <h2 className="px-2 py-1 text-muted">{t('list.loose')}</h2>}
        {loose.map((icon) => (
          <IconRow key={icon.name} icon={icon} current={current.pack === undefined && current.icon === icon.name} onSelect={() => onSelect({ icon: icon.name })} />
        ))}
      </div>
    </nav>
  );
}
