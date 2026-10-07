import clsx from 'clsx';
import { Play } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { exportCss, forManner, lint, reactionClip, REACTIONS, resolve, typeOf, type IconDoc, type Manner, type Pack, type Reaction } from '@netsuicon/core';
import { IconBox } from './IconBox';
import { MannerSwitch } from './MannerSwitch';
import { PAPERS, PaperSwitch, type Paper } from './PaperSwitch';
import { ToolButton } from './ToolButton';

/** One reaction played by every icon at once; a new `run` plays it again. */
interface Replay {
  reaction: Reaction;
  run: number;
}

interface PackSheetProps {
  pack: Pack;
  icons: IconDoc[];
  manner: Manner;
  onManner(manner: Manner): void;
  onOpen(icon: string): void;
}

/** Every icon of a pack side by side, alive: the place to judge whether they look and move alike. */
export function PackSheet({ pack, icons, manner, onManner, onOpen }: PackSheetProps) {
  const { t } = useTranslation();
  const [paper, setPaper] = useState<Paper>('dark');
  // Undefined: each icon answers the pointer and the click by itself.
  const [replay, setReplay] = useState<Replay>();

  const tiles = useMemo(
    () =>
      icons.map((icon) => {
        const drawn = forManner(resolve(icon, pack), manner);
        const svg = exportCss(drawn, { scope: pack.name, manner, play: replay && reactionClip(drawn, replay.reaction) });
        return { name: icon.name, svg, type: typeOf(drawn), findings: lint(icon, pack).length };
      }),
    [icons, pack, replay, manner],
  );

  return (
    <section className="flex min-w-0 flex-1 flex-col gap-2 rounded-panel bg-surface p-2">
      <div className="flex h-bar items-center gap-2 pl-1">
        <h2 className="text-base font-semibold">{pack.name}</h2>
        <span className="text-muted">{t('pack.count', { count: icons.length })}</span>
        <div className="flex-1" />
        <MannerSwitch manner={manner} onChange={onManner} />
        <PaperSwitch paper={paper} onChange={setPaper} />
      </div>

      <div className={clsx('min-h-0 flex-1 overflow-y-auto rounded-inner p-4', PAPERS[paper])}>
        {tiles.length === 0 && <p className="opacity-70">{t('pack.empty')}</p>}
        <div className={clsx('grid gap-2', pack.mode === 'micro' ? 'grid-cols-[repeat(auto-fill,minmax(8rem,1fr))]' : 'grid-cols-[repeat(auto-fill,minmax(10rem,1fr))]')}>
          {tiles.map((tile) => (
            <div key={tile.name} className="flex flex-col items-center gap-2 p-3">
              {/* The key replays a forced clip: a new element starts its animations again. */}
              <IconBox key={`${manner} ${replay?.run ?? 0}`} svg={tile.svg} label={tile.name} alive={replay === undefined} className={pack.mode === 'micro' ? 'size-14' : 'size-28'} />
              <button
                type="button"
                title={t('pack.open', { name: tile.name })}
                onClick={() => onOpen(tile.name)}
                className="flex flex-col items-center rounded-control px-2 py-1 hover:bg-border-strong/20"
              >
                <span className="flex items-center gap-1.5">
                  {tile.name}
                  {tile.findings > 0 && (
                    <span className="text-warn" title={t('pack.findings', { count: tile.findings })}>
                      {tile.findings}
                    </span>
                  )}
                </span>
                <span className="opacity-60">{t(`type.${tile.type}`)}</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex h-bar items-center gap-1">
        <ToolButton pressed={replay === undefined} onClick={() => setReplay(undefined)} title={t('stage.liveHint')}>
          {t('stage.live')}
        </ToolButton>
        {REACTIONS.map((reaction) => (
          <ToolButton key={reaction} pressed={replay?.reaction === reaction} onClick={() => setReplay((current) => ({ reaction, run: (current?.run ?? 0) + 1 }))}>
            <Play aria-hidden className="size-3" />
            {t(`pack.replay.${reaction}`)}
          </ToolButton>
        ))}
        <div className="flex-1" />
        {replay === undefined && <span className="px-2 text-muted">{t('stage.liveHint')}</span>}
      </div>
    </section>
  );
}
