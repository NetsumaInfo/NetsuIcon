import clsx from 'clsx';

interface ToolButtonProps {
  pressed: boolean;
  onClick(): void;
  title?: string;
  children: React.ReactNode;
}

/** A button of a toolbar that stays lit while its choice is the current one. */
export function ToolButton({ pressed, onClick, title, children }: ToolButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      title={title}
      onClick={onClick}
      className={clsx(
        'flex h-control items-center gap-1.5 rounded-control px-2',
        pressed ? 'bg-accent text-fg' : 'text-muted hover:bg-surface-2 hover:text-fg',
      )}
    >
      {children}
    </button>
  );
}
