import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { lint, MANNERS, REACTIONS, type IconDoc, type Limits, type Pack } from '@netsuicon/core';
import { Segmented } from './Segmented';

const TABS = ['rules', 'harmony'] as const;
type Tab = (typeof TABS)[number];

function Part({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="pb-1 text-muted">{title}</h3>
      {children}
    </section>
  );
}

function Pairs({ rows }: { rows: [string, string, string?][] }) {
  return (
    <ul>
      {rows.map(([name, value, colour]) => (
        <li key={name} className="flex h-row items-center gap-2 font-mono">
          {colour && <span className="size-3 shrink-0 rounded-inner border border-border-strong" style={{ background: colour }} />}
          <span className="flex-1 truncate">{name}</span>
          <span className="text-muted">{value}</span>
        </li>
      ))}
    </ul>
  );
}

/** How far each reaction may go, in each manner: one line a reaction, the same columns for all. */
function LimitsTable({ pack }: { pack: Pack }) {
  const { t } = useTranslation();
  const sets: Record<(typeof MANNERS)[number], Record<(typeof REACTIONS)[number], Limits>> = { subtle: pack.motion, expressive: pack.motion.expressive };
  return (
    <table className="w-full text-left">
      <thead>
        <tr className="text-muted">
          <th className="h-row font-normal" />
          {(['duration', 'translate', 'rotate', 'scale'] as const).map((column) => (
            <th key={column} className="h-row font-normal">
              {t(`pack.limits.${column}`)}
            </th>
          ))}
        </tr>
      </thead>
      {MANNERS.map((manner) => (
        <tbody key={manner}>
          <tr>
            <th colSpan={5} className="h-row pt-1 font-normal text-muted">
              {t(`manner.${manner}`)}
              {(pack.motion.manner ?? 'subtle') === manner && ` · ${t('pack.inUse')}`}
            </th>
          </tr>
          {REACTIONS.map((reaction) => {
            const { duration, maxTranslate, maxRotate, scale } = sets[manner][reaction];
            return (
              <tr key={reaction} className="font-mono">
                <th className="h-row font-sans font-normal">{t(`reaction.${reaction}`)}</th>
                <td>{t('pack.limits.ms', { min: duration[0], max: duration[1] })}</td>
                <td>{t('pack.limits.units', { n: maxTranslate })}</td>
                <td>{t('pack.limits.degrees', { n: maxRotate })}</td>
                <td>{t('pack.limits.range', { low: scale[0], high: scale[1] })}</td>
              </tr>
            );
          })}
        </tbody>
      ))}
    </table>
  );
}

function Rules({ pack }: { pack: Pack }) {
  const { t } = useTranslation();
  const { feel, ease } = pack.motion;
  const palette = Object.entries(pack.palette);
  return (
    <>
      <Part title={t('pack.title', { name: pack.name })}>
        {pack.brief && <p className="pb-1">{pack.brief}</p>}
        <p className="text-muted">{t('pack.frame', { mode: t(`list.${pack.mode}`), size: pack.size })}</p>
      </Part>
      <Part title={t('pack.palette')}>
        {palette.length === 0 && <p className="text-muted">{t('pack.noPalette')}</p>}
        <Pairs rows={palette.map(([name, colour]) => [`$${name}`, colour, colour])} />
      </Part>
      <Part title={t('pack.style')}>
        <Pairs rows={Object.entries(pack.style).map(([key, value]) => [key, String(value)])} />
      </Part>
      <Part title={t('pack.motion')}>
        {feel && <p className="pb-1">{feel}</p>}
        <p className="pb-2 text-muted">{t('pack.ease', { ease: typeof ease === 'string' ? ease : ease.join(', ') })}</p>
        <LimitsTable pack={pack} />
      </Part>
    </>
  );
}

function Harmony({ departing }: { departing: { name: string; findings: ReturnType<typeof lint> }[] }) {
  const { t } = useTranslation();
  if (departing.length === 0) return <p className="text-ok">{t('pack.fits')}</p>;
  return (
    <>
      <p className="text-muted">{t('pack.advice')}</p>
      {departing.map((entry) => (
        <div key={entry.name}>
          <div className="flex h-row items-center font-semibold">{entry.name}</div>
          <ul className="flex flex-col gap-1 border-l border-border pl-3 text-muted">
            {entry.findings.map((finding) => (
              <li key={`${finding.code} ${finding.where}`}>
                {/* Every sentence takes the same two values; the ones about a missing reaction use neither. */}
                <span className="font-mono text-fg">{finding.where}</span> {t(`lint.${finding.code}` as 'lint.frame', { got: finding.got, want: finding.want })}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}

interface PackPanelProps {
  pack: Pack;
  icons: IconDoc[];
}

/** The rules of a pack, read only for now, and the icons that do not follow them. */
export function PackPanel({ pack, icons }: PackPanelProps) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('rules');
  const departing = icons.map((icon) => ({ name: icon.name, findings: lint(icon, pack) })).filter((entry) => entry.findings.length > 0);
  const choices = [
    { value: 'rules' as const, label: t('pack.rules') },
    { value: 'harmony' as const, label: t('pack.harmony'), count: departing.reduce((sum, entry) => sum + entry.findings.length, 0) },
  ];
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 p-2">
      <Segmented<Tab> wide label={t('pack.title', { name: pack.name })} choices={choices} value={tab} onChange={setTab} />
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-1">{tab === 'rules' ? <Rules pack={pack} /> : <Harmony departing={departing} />}</div>
    </div>
  );
}
