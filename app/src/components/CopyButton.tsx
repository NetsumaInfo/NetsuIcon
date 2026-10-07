import { Check, Copy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface CopyButtonProps {
  /** What goes to the clipboard. */
  text: string;
  /** Said instead of "Copy": what is copied, when the button stands alone. */
  title?: string;
  /** Without its word: the pictogram alone, for a tight place. */
  bare?: boolean;
}

/** Copies a text and says so for a moment. */
export function CopyButton({ text, title, bare = false }: CopyButtonProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = async (): Promise<void> => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
  };

  return (
    <button
      type="button"
      title={title}
      aria-label={bare ? (title ?? t('code.copy')) : undefined}
      onClick={() => void copy()}
      className="flex h-control shrink-0 items-center gap-1.5 rounded-control px-2 text-muted hover:bg-surface-2 hover:text-fg"
    >
      {copied ? <Check aria-hidden className="size-3 text-ok" /> : <Copy aria-hidden className="size-3" />}
      {!bare && (copied ? t('code.copied') : t('code.copy'))}
    </button>
  );
}
