import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { exportCss, exportReact, MANNERS, walk, type Clip, type IconDoc, type IconNode, type Manner } from '@netsuicon/core';
import { CopyButton } from './CopyButton';
import { Segmented } from './Segmented';

const TABS = ['clips', 'layers', 'code'] as const;
type Tab = (typeof TABS)[number];

const FORMATS = ['svg', 'react', 'json'] as const;
type Format = (typeof FORMATS)[number];

/** The properties a clip animates, gathered by node: a part and what it does. */
function byNode(clip: Clip): [string, string[]][] {
  const nodes = new Map<string, string[]>();
  for (const track of clip.tracks) nodes.set(track.node, [...(nodes.get(track.node) ?? []), track.prop]);
  return [...nodes];
}

function ClipRows({ clips }: { clips: Clip[] }) {
  const { t } = useTranslation();
  return (
    <>
      {clips.map((clip) => (
        <div key={clip.id} className="pb-3">
          <div className="flex h-row items-center gap-2">
            <span className="font-mono">{clip.id}</span>
            <span className="text-muted">{t(`trigger.${clip.trigger}`)}</span>
            <div className="flex-1" />
            <span className="text-muted">{t('outline.duration', { ms: clip.duration })}</span>
          </div>
          <ul className="border-l border-border pl-3">
            {byNode(clip).map(([node, props]) => (
              <li key={node} className="flex h-row items-center gap-2 font-mono">
                <span className="truncate">{node}</span>
                <span className="truncate text-muted">{props.join(' · ')}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}

/** The animations of an icon, the ones of each manner under its name. */
function Clips({ doc }: { doc: IconDoc }) {
  const { t } = useTranslation();
  if (doc.clips.length === 0) return <p className="text-muted">{t('outline.noClip')}</p>;
  const groups: { title: string; clips: Clip[] }[] = [
    ...MANNERS.map((manner) => ({ title: t(`manner.${manner}`), clips: doc.clips.filter((clip) => clip.manner === manner) })),
    { title: t('manner.both'), clips: doc.clips.filter((clip) => clip.manner === undefined) },
  ];
  return (
    <>
      {groups
        .filter((group) => group.clips.length > 0)
        .map((group) => (
          <section key={group.title}>
            <h3 className="pb-1 text-muted">{group.title}</h3>
            <ClipRows clips={group.clips} />
          </section>
        ))}
    </>
  );
}

function NodeRows({ nodes, depth }: { nodes: IconNode[]; depth: number }) {
  const { t } = useTranslation();
  return (
    <>
      {nodes.map((node) => (
        <li key={node.id}>
          <div className="flex h-row items-center gap-2" style={{ paddingLeft: depth * 12 }}>
            <span className={node.hidden ? 'truncate font-mono text-muted line-through' : 'truncate font-mono'}>{node.id}</span>
            <span className="text-muted">{node.type}</span>
            <div className="flex-1" />
            {/* Unseen at rest: a prop, or what a switch shows when it is on. */}
            {node.opacity === 0 && <span className="text-muted">{t('outline.unseen')}</span>}
          </div>
          {node.type === 'group' && (
            <ul>
              <NodeRows nodes={node.children} depth={depth + 1} />
            </ul>
          )}
        </li>
      ))}
    </>
  );
}

function Code({ doc, source, manner }: IconPanelProps) {
  const { t } = useTranslation();
  const [format, setFormat] = useState<Format>('svg');
  const code = useMemo(() => {
    if (format === 'svg') return exportCss(doc, { manner });
    return format === 'react' ? exportReact(doc, undefined, manner) : JSON.stringify(source, null, 2);
  }, [doc, source, manner, format]);
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex shrink-0 items-center gap-1">
        <Segmented<Format> label={t('code.title')} choices={FORMATS.map((value) => ({ value, label: t(`code.${value}`) }))} value={format} onChange={setFormat} />
        <div className="flex-1" />
        <CopyButton text={code} />
      </div>
      <pre className="min-h-0 flex-1 overflow-auto rounded-inner bg-bg p-3 font-mono break-all whitespace-pre-wrap">{code}</pre>
    </div>
  );
}

interface IconPanelProps {
  /** The icon as it is drawn: what the exports are made from. */
  doc: IconDoc;
  /** The icon as it is stored: in a pack, with the names of its colours. */
  source: IconDoc;
  /** The manner on screen: the one the code is written in. */
  manner: Manner;
}

/** What an icon is made of, read only: its animations, its shapes, and the code to take away. */
export function IconPanel(props: IconPanelProps) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('clips');
  const { source } = props;
  const shapes = useMemo(() => {
    let count = 0;
    walk(source.nodes, () => {
      count += 1;
    });
    return count;
  }, [source]);
  const choices = [
    { value: 'clips' as const, label: t('outline.clips'), count: source.clips.length },
    { value: 'layers' as const, label: t('outline.layers'), count: shapes },
    { value: 'code' as const, label: t('code.title') },
  ];
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 p-2">
      <Segmented<Tab> wide label={source.name} choices={choices} value={tab} onChange={setTab} />
      {tab === 'code' ? (
        <Code {...props} />
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto px-1">
          {tab === 'clips' && <Clips doc={source} />}
          {tab === 'layers' && (source.nodes.length === 0 ? <p className="text-muted">{t('outline.noLayer')}</p> : <ul><NodeRows nodes={source.nodes} depth={0} /></ul>)}
        </div>
      )}
    </div>
  );
}
