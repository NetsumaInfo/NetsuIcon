import type { Bezier, Ease } from './types';

const NAMED: Record<string, Bezier> = {
  linear: [0, 0, 1, 1],
  ease: [0.25, 0.1, 0.25, 1],
  'ease-in': [0.42, 0, 1, 1],
  'ease-out': [0, 0, 0.58, 1],
  'ease-in-out': [0.42, 0, 0.58, 1],
};

export function bezierOf(ease: Ease | undefined): Bezier {
  if (ease === undefined || ease === 'hold') return NAMED.linear!;
  return typeof ease === 'string' ? NAMED[ease]! : ease;
}

function coordinate(t: number, p1: number, p2: number): number {
  const u = 1 - t;
  return 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t;
}

/** Progress (0..1) of a cubic-bezier easing at the fraction `x` of its time, as CSS defines it. */
export function easeAt(ease: Ease | undefined, x: number): number {
  const [x1, y1, x2, y2] = bezierOf(ease);
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  if (ease === 'hold') return 0;
  if (x1 === y1 && x2 === y2) return x;
  let low = 0;
  let high = 1;
  for (let i = 0; i < 32; i += 1) {
    const mid = (low + high) / 2;
    if (coordinate(mid, x1, x2) < x) low = mid;
    else high = mid;
  }
  return coordinate((low + high) / 2, y1, y2);
}

export function cssEase(ease: Ease | undefined): string {
  if (ease === undefined) return 'linear';
  if (ease === 'hold') return 'steps(1,end)';
  return typeof ease === 'string' ? ease : `cubic-bezier(${ease.join(',')})`;
}
