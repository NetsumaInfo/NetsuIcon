import clsx from 'clsx';
import { ChevronRight, Plug } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Picked } from '../lib/picked';
import { chooseLanguage, LANGUAGES, type Language, type ServerStatus } from '../lib/useIcons';
import { CopyButton } from './CopyButton';
import { Segmented } from './Segmented';

// Commands are code, not prose: they are the same in every language.
const CONNECT = 'claude mcp add --transport http netsuicon http://127.0.0.1:6210/mcp';

const DOT: Record<ServerStatus, string> = {
  connecting: 'bg-warn',
  online: 'bg-ok',
  offline: 'bg-danger',
};

/** How to link the agent of a code editor to this server: the one thing to do before asking for an icon. */
export function ConnectHelp({ dir }: { dir: string }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted">{t('connect.body')}</p>
      <div className="flex items-center gap-1 rounded-inner bg-bg p-1 pl-3">
        <code className="min-w-0 flex-1 font-mono break-all select-all">{CONNECT}</code>
        <CopyButton text={CONNECT} bare />
      </div>
      <p className="text-muted">{t('connect.ask')}</p>
      {dir !== '' && <p className="text-muted">{t('connect.folder', { dir })}</p>}
    </div>
  );
}

function ConnectAgent({ dir }: { dir: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [open]);

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((was) => !was)}
        className={clsx('flex h-control items-center gap-1.5 rounded-control px-2', open ? 'bg-accent text-fg' : 'text-muted hover:bg-surface-2 hover:text-fg')}
      >
        <Plug aria-hidden className="size-3" />
        {t('connect.open')}
      </button>
      {open && (
        <>
          <button type="button" aria-label={t('connect.close')} onClick={() => setOpen(false)} className="fixed inset-0 z-10 cursor-default" />
          <div className="absolute top-full right-0 z-20 mt-2 w-[28rem] rounded-panel border border-border bg-surface p-4">
            <ConnectHelp dir={dir} />
          </div>
        </>
      )}
    </div>
  );
}

interface HeaderProps {
  status: ServerStatus;
  dir: string;
  language: Language;
  /** What is on screen. */
  current: Picked;
  onSelect(picked: Picked): void;
}

/** The name of the app, where the user is in the folder, how to link an agent, and whether the server answers. */
export function Header({ status, dir, language, current, onSelect }: HeaderProps) {
  const { t } = useTranslation();
  const { pack, icon } = current;
  return (
    <header className="flex h-bar shrink-0 items-center gap-1 px-2">
      <h1 className="pr-1 text-base font-semibold">{t('title')}</h1>
      {(pack !== undefined || icon !== undefined) && <ChevronRight aria-hidden className="size-3 text-muted" />}
      {pack !== undefined && (
        <button type="button" onClick={() => onSelect({ pack })} className={clsx('rounded-control px-1.5 py-0.5 hover:bg-surface-2', icon === undefined ? 'text-fg' : 'text-muted hover:text-fg')}>
          {pack}
        </button>
      )}
      {pack === undefined && icon !== undefined && <span className="px-1.5 text-muted">{t('list.loose')}</span>}
      {icon !== undefined && (
        <>
          <ChevronRight aria-hidden className="size-3 text-muted" />
          <span className="px-1.5">{icon}</span>
        </>
      )}
      <div className="flex-1" />
      <ConnectAgent dir={dir} />
      {/* The names of the languages are the same in every language. */}
      <Segmented<Language> label={t('language')} choices={LANGUAGES.map((value) => ({ value, label: value.toUpperCase() }))} value={language} onChange={(value) => void chooseLanguage(value)} />
      <span className={clsx('ml-2 size-2 rounded-control', DOT[status])} />
      <span className="text-muted">{t(`status.${status}`)}</span>
    </header>
  );
}
