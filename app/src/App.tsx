import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { resolve, type Manner } from '@netsuicon/core';
import { ConnectHelp, Header } from './components/Header';
import { IconList } from './components/IconList';
import { IconPanel } from './components/IconPanel';
import { PackPanel } from './components/PackPanel';
import { PackSheet } from './components/PackSheet';
import { Stage } from './components/Stage';
import { shown, usePicked } from './lib/picked';
import { useIcons, type ServerStatus } from './lib/useIcons';

// A command is code, not prose: it is the same in every language.
const START = 'pnpm dev';

function Empty({ status, dir }: { status: ServerStatus; dir: string }) {
  const { t } = useTranslation();
  const offline = status === 'offline';
  return (
    <div className="flex flex-1 items-center justify-center rounded-panel bg-surface">
      <div className="flex max-w-lg flex-col gap-3 p-6">
        <h2 className="text-base font-semibold">{offline ? t('empty.offlineTitle') : t('empty.title')}</h2>
        {offline ? (
          <>
            <p className="text-muted">{t('empty.offlineBody')}</p>
            <code className="rounded-inner bg-bg p-3 font-mono select-all">{START}</code>
          </>
        ) : (
          <ConnectHelp dir={dir} />
        )}
      </div>
    </div>
  );
}

export function App() {
  const { status, dir, language, icons, packs } = useIcons();
  const [picked, pick] = usePicked();
  const { owner, doc } = shown(icons, packs, picked);
  const drawn = useMemo(() => doc && resolve(doc, owner?.pack), [doc, owner]);
  const current = { pack: owner?.pack.name, icon: doc?.name };

  // One manner for the whole window; opening a pack starts on the one its application uses.
  const [manner, setManner] = useState<Manner>('subtle');
  const inUse = owner?.pack.motion.manner ?? 'subtle';
  useEffect(() => setManner(inUse), [current.pack, inUse]);

  return (
    <div className="flex h-full flex-col gap-2 p-2">
      <Header status={status} dir={dir} language={language} current={current} onSelect={pick} />
      {owner === undefined && doc === undefined ? (
        <Empty status={status} dir={dir} />
      ) : (
        <main className="flex min-h-0 flex-1 gap-2">
          <IconList icons={icons} packs={packs} current={current} onSelect={pick} />
          {doc && drawn ? (
            <Stage doc={drawn} pack={current.pack} manner={manner} onManner={setManner} />
          ) : (
            owner && <PackSheet {...owner} manner={manner} onManner={setManner} onOpen={(icon) => pick({ pack: owner.pack.name, icon })} />
          )}
          <aside className="flex w-96 shrink-0 flex-col rounded-panel bg-surface">
            {doc && drawn ? <IconPanel doc={drawn} source={doc} manner={manner} /> : owner && <PackPanel {...owner} />}
          </aside>
        </main>
      )}
    </div>
  );
}
