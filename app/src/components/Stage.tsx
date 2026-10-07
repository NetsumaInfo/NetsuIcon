import clsx from 'clsx';
import { Play } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { exportCss, forManner, mannersOf, sample, toSvg, typeOf, type IconDoc, type Manner } from '@netsuicon/core';
import { CopyButton } from './CopyButton';
import { IconBox } from './IconBox';
import { MannerSwitch } from './MannerSwitch';
import { PAPERS, PaperSwitch, type Paper } from './PaperSwitch';
import { ToolButton } from './ToolButton';

/** What the stage shows: the icon as exported, one clip forced to play, or one clip frozen at a moment. */
type View = { kind: 'live' } | { kind: 'play'; clip: string; run: number } | { kind: 'scrub'; clip: string; t: number };

function markup(doc: IconDoc, view: View, manner: Manner): string {
  if (view.kind === 'scrub') return toSvg(sample(doc, view.clip, view.t));
  return exportCss(doc, { manner, play: view.kind === 'play' ? view.clip : undefined });
}

function realSizes(doc: IconDoc): number[] {
  return doc.mode === 'micro' ? [16, 24, 32] : [32, 64, 128];
}

/** How an agent is told which icon, and which clip, the user is looking at: the arguments of its tools. */
function reference(doc: IconDoc, pack: string | undefined, clip: string | undefined): string {
  return [`icon "${doc.name}"`, pack === undefined ? undefined : `in pack "${pack}"`, clip === undefined ? undefined : `clip "${clip}"`].filter(Boolean).join(', ');
}

interface StageProps {
  /** The icon as it is drawn: in a pack, already dressed by it. */
  doc: IconDoc;
  /** The pack it is in, if any. */
  pack?: string;
  manner: Manner;
  onManner(manner: Manner): void;
}

/** One icon, large: alive under the pointer, or one clip played, or stopped at a moment. */
export function Stage({ doc, pack, manner, onManner }: StageProps) {
  const { t } = useTranslation();
  const [paper, setPaper] = useState<Paper>('dark');
  const [view, setView] = useState<View>({ kind: 'live' });
  // An icon animated in one manner only is shown in that one, whatever the switch says.
  const manners = mannersOf(doc);
  const playing = manners.includes(manner) ? manner : manners[0]!;
  const clips = useMemo(() => forManner(doc, playing).clips, [doc, playing]);

  // Another icon, another manner, or a clip that is gone: back to the live view.
  useEffect(() => {
    setView((current) => (current.kind !== 'live' && !clips.some((clip) => clip.id === current.clip) ? { kind: 'live' } : current));
  }, [clips]);

  const svg = useMemo(() => markup(doc, view, playing), [doc, view, playing]);
  const live = useMemo(() => exportCss(doc, { manner: playing }), [doc, playing]);
  const active = clips.find((clip) => view.kind !== 'live' && clip.id === view.clip);
  const scrubbed = view.kind === 'scrub' ? view.t : 0;
  const type = typeOf(forManner(doc, playing));

  return (
    <section className="flex min-w-0 flex-1 flex-col gap-2 rounded-panel bg-surface p-2">
      <div className="flex h-bar items-center gap-2 pl-1">
        <h2 className="text-base font-semibold">{doc.name}</h2>
        <span className="rounded-control border border-border px-1.5 py-0.5 text-muted" title={t(`typeHint.${type}`)}>
          {t(`type.${type}`)}
        </span>
        <CopyButton text={reference(doc, pack, active?.id)} title={t('stage.copyRef')} bare />
        <div className="flex-1" />
        {manners.length > 1 && <MannerSwitch manner={playing} onChange={onManner} />}
        <PaperSwitch paper={paper} onChange={setPaper} />
      </div>

      <div className={clsx('relative flex min-h-0 flex-1 items-center justify-center rounded-inner', PAPERS[paper])}>
        {/* The key replays a forced clip: a new element starts its animations again. */}
        <IconBox key={`${playing} ${view.kind === 'play' ? view.run : 0}`} svg={svg} label={doc.name} alive={view.kind === 'live'} className="aspect-square h-3/5 max-h-80" />
        {view.kind === 'live' && clips.length > 0 && <p className="absolute bottom-3 opacity-60">{t(`typeHint.${type}`)}</p>}
        <div className="absolute right-3 bottom-3 flex items-end gap-3" title={t('stage.sizes')}>
          {realSizes(doc).map((size) => (
            <div key={size} style={{ width: size, height: size }}>
              <IconBox svg={live} className="size-full" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex h-bar items-center gap-1">
        <ToolButton pressed={view.kind === 'live'} onClick={() => setView({ kind: 'live' })} title={t('stage.liveHint')}>
          {t('stage.live')}
        </ToolButton>
        {clips.map((clip) => (
          <ToolButton
            key={clip.id}
            pressed={active?.id === clip.id}
            onClick={() => setView((current) => ({ kind: 'play', clip: clip.id, run: current.kind === 'play' ? current.run + 1 : 0 }))}
            title={t('stage.play')}
          >
            <Play aria-hidden className="size-3" />
            {t(`trigger.${clip.trigger}`)}
            <span className="font-mono text-muted">{clip.id}</span>
          </ToolButton>
        ))}
        {clips.length === 0 && <span className="px-2 text-muted">{t('stage.noClip')}</span>}
        <input
          type="range"
          min={0}
          max={1}
          step={0.005}
          value={scrubbed}
          disabled={clips.length === 0}
          aria-label={t('stage.scrub')}
          title={t('stage.scrub')}
          onChange={(event) => setView({ kind: 'scrub', clip: (active ?? clips[0]!).id, t: Number(event.target.value) })}
          className="ml-2 min-w-24 flex-1 accent-primary"
        />
        {active && <span className="w-28 shrink-0 text-right font-mono text-muted">{t('stage.time', { at: Math.round(scrubbed * active.duration), of: active.duration })}</span>}
      </div>
    </section>
  );
}
