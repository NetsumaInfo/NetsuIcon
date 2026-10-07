const timers = new WeakMap<SVGElement, number>();

/** When the last of the animations whose name starts this way ends, in milliseconds from now. */
function endOf(svg: SVGElement, mine: string): number {
  const ends = svg
    .getAnimations({ subtree: true })
    .filter((animation) => animation instanceof CSSAnimation && animation.animationName.startsWith(mine))
    .map((animation) => Number(animation.effect?.getComputedTiming().endTime ?? 0))
    .filter(Number.isFinite);
  return Math.max(0, ...ends);
}

/**
 * What a press does to the icon in this box, which CSS alone cannot. An action: its click clip is forced with
 * `data-play` and plays to the end, where `:active` would stop with the button. A switch: `data-state` goes
 * to "on" and stays; the next press sets "off", and the attribute goes once the way back has played.
 * Then `data-quiet` keeps the hover from starting again while the pointer is still there.
 * The same steps as `REACT_SCRIPT` in core, which a page outside the app uses.
 */
export function playClick(box: HTMLElement): void {
  const svg = box.querySelector('svg');
  if (!svg) return;
  const root = `${svg.classList[0]}-`;
  const settle = (attribute: string, after: number): void => {
    const over = window.setTimeout(() => {
      svg.setAttribute('data-quiet', '');
      svg.removeAttribute(attribute);
    }, after);
    timers.set(svg, over);
  };
  window.clearTimeout(timers.get(svg));
  svg.removeAttribute('data-quiet');
  if (svg.hasAttribute('data-switch')) {
    const on = svg.getAttribute('data-state') === 'on';
    svg.setAttribute('data-state', on ? 'off' : 'on');
    if (on) settle('data-state', endOf(svg, root));
    return;
  }
  const id = svg.getAttribute('data-click');
  if (!id) return;
  svg.removeAttribute('data-play');
  // Reading the layout between the two makes the browser see the clip as started anew.
  svg.getBoundingClientRect();
  svg.setAttribute('data-play', id);
  settle('data-play', endOf(svg, `${root}${id}-`));
}

/** The pointer left: the next time it comes, the hover may play again. */
export function pointerLeft(box: HTMLElement): void {
  box.querySelector('svg')?.removeAttribute('data-quiet');
}
