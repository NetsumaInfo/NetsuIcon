import clsx from 'clsx';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { exportCss, type IconDoc, type Manner, type ModeEntry } from '@netsuicon/core';
import { IconBox } from './IconBox';

interface ModeStripProps {
  /** The modes of the button, each with its icon as it is drawn. */
  modes: { entry: ModeEntry; doc: IconDoc }[];
  current: string;
  manner: Manner;
  onPick(icon: string): void;
}

/** The modes of one button side by side: each one shows its hover under the pointer, and a press opens it on the stage. */
export function ModeStrip({ modes, current, manner, onPick }: ModeStripProps) {
  const { t } = useTranslation();
  const svgs = useMemo(() => modes.map(({ doc }) => exportCss(doc, { manner })), [modes, manner]);
  return (
    <div role="group" aria-label={t('stage.modes')} className="flex flex-wrap items-center gap-1">
      <span className="px-1 text-muted">{t('stage.modes')}</span>
      {modes.map(({ entry, doc }, index) => (
        <button
          key={entry.icon}
          type="button"
          aria-pressed={entry.icon === current}
          onClick={() => onPick(entry.icon)}
          title={t('stage.openMode')}
          className={clsx(
            'flex h-control items-center gap-1.5 rounded-control border px-2 font-mono',
            entry.icon === current ? 'border-primary bg-surface-2 text-fg' : 'border-border text-muted hover:text-fg',
          )}
        >
          <IconBox svg={svgs[index]!} label={doc.name} className="size-5 text-fg" />
          {entry.mode ?? t('stage.modeBase')}
        </button>
      ))}
    </div>
  );
}
