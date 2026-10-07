import clsx from 'clsx';

export interface Choice<T extends string> {
  value: T;
  label: string;
  /** A number shown after the label: how many things the choice holds. */
  count?: number;
}

interface SegmentedProps<T extends string> {
  /** What is being chosen, for a screen reader and as a tooltip. */
  label: string;
  choices: readonly Choice<T>[];
  value: T;
  onChange(value: T): void;
  /** Tabs fill the width of their panel; a switch in a toolbar takes the room of its words. */
  wide?: boolean;
}

/** A few choices side by side, one of them lit: a switch in a toolbar, or the tabs of a panel. */
export function Segmented<T extends string>({ label, choices, value, onChange, wide = false }: SegmentedProps<T>) {
  return (
    <div role="group" aria-label={label} title={label} className={clsx('flex h-control shrink-0 items-stretch gap-0.5 rounded-control bg-bg p-0.5', wide && 'w-full')}>
      {choices.map((choice) => (
        <button
          key={choice.value}
          type="button"
          aria-pressed={value === choice.value}
          onClick={() => onChange(choice.value)}
          className={clsx(
            'flex items-center justify-center gap-1.5 rounded-inner px-2',
            wide && 'flex-1',
            value === choice.value ? 'bg-surface-2 text-fg' : 'text-muted hover:text-fg',
          )}
        >
          {choice.label}
          {choice.count !== undefined && choice.count > 0 && <span className="text-muted">{choice.count}</span>}
        </button>
      ))}
    </div>
  );
}
