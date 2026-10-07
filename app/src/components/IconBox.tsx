import clsx from 'clsx';
import { playClick, pointerLeft } from '../lib/reactions';

interface IconBoxProps {
  /** SVG markup made by `@netsuicon/core` from a document of the local folder. */
  svg: string;
  className?: string;
  label?: string;
  /** The icon answers a press: an action plays to its end, a switch goes on and off. Its hover needs nothing: it is CSS. */
  alive?: boolean;
}

/** Shows an icon from its markup. The SVG fills the box; its colour is the text colour of the box. */
export function IconBox({ svg, className, label, alive = false }: IconBoxProps) {
  return (
    <div
      role="img"
      aria-label={label}
      className={clsx('icon-box', alive && 'cursor-pointer', className)}
      onClick={alive ? (event) => playClick(event.currentTarget) : undefined}
      onPointerLeave={alive ? (event) => pointerLeft(event.currentTarget) : undefined}
      // The markup is ours: core escapes every attribute it writes.
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
