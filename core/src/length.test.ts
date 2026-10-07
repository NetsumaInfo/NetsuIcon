import { describe, expect, it } from 'vitest';
import { applyOps, lengthOf, newDoc, pathLength, sample, toSvg } from './index';

describe('pathLength', () => {
  it('adds up straight commands, absolute and relative, and every sub-path', () => {
    expect(pathLength('M0 0L3 4')).toBe(5);
    expect(pathLength('M1 1h4v3H1z')).toBe(14);
    expect(pathLength('M0 0l3 4 3-4')).toBe(10);
    expect(pathLength('M12 2.5v2M12 19.5v2M2.5 12h2')).toBe(6);
  });

  it('measures arcs, with flags written apart or stuck to the next number', () => {
    const circle = 2 * Math.PI * 5;
    expect(pathLength('M0 5a5 5 0 1 0 10 0a5 5 0 1 0 -10 0')).toBeCloseTo(circle, 1);
    expect(pathLength('M0 5a5 5 0 1010 0 5 5 0 10-10 0')).toBeCloseTo(circle, 1);
    expect(pathLength('M0 0A5 5 0 0 1 5 5')).toBeCloseTo(circle / 4, 2);
    // Radii too small for the chord are grown to a half circle on it.
    expect(pathLength('M0 0A1 1 0 0 1 10 0')).toBeCloseTo(circle / 2, 1);
  });

  it('measures Béziers, smooth ones included', () => {
    expect(pathLength('M0 0C0 0 10 0 10 0')).toBeCloseTo(10);
    expect(pathLength('M0 0Q5 5 10 0')).toBeCloseTo(11.48, 1);
    expect(pathLength('M0 0q5 5 10 0t10 0')).toBeCloseTo(22.96, 1);
    expect(pathLength('M0 0c0 5 10 5 10 0s10-5 10 0')).toBeCloseTo(2 * pathLength('M0 0c0 5 10 5 10 0'), 5);
  });
});

describe('lengthOf', () => {
  it('knows the outline of each shape', () => {
    expect(lengthOf({ type: 'line', id: 'a', x1: 0, y1: 0, x2: 0, y2: 7 })).toBe(7);
    expect(lengthOf({ type: 'circle', id: 'a', cx: 0, cy: 0, r: 2 })).toBeCloseTo(12.566, 2);
    expect(lengthOf({ type: 'ellipse', id: 'a', cx: 0, cy: 0, rx: 2, ry: 2 })).toBeCloseTo(12.566, 1);
    expect(lengthOf({ type: 'rect', id: 'a', x: 0, y: 0, width: 10, height: 6 })).toBe(32);
    expect(lengthOf({ type: 'rect', id: 'a', x: 0, y: 0, width: 10, height: 6, rx: 3 })).toBeCloseTo(8 + 6 * Math.PI);
    expect(lengthOf({ type: 'group', id: 'a', children: [] })).toBe(0);
  });
});

describe('a still of a stroke drawn in part', () => {
  it('dashes in real units, so a rasteriser without pathLength draws the same thing', () => {
    const doc = applyOps(newDoc('wind', 'micro'), [
      { op: 'add_node', node: { type: 'path', id: 'gust', d: 'M3 17h8' } },
      { op: 'set_clip', clip: { id: 'blow', trigger: 'hover', duration: 600 } },
      { op: 'set_track', clip: 'blow', node: 'gust', prop: 'draw', keys: [{ t: 0, v: 1 }, { t: 0.5, v: 0.25 }, { t: 1, v: 1 }] },
    ]);
    expect(toSvg(sample(doc, 'blow', 0.5))).toContain('stroke-dasharray="8 16" stroke-dashoffset="6"');
    expect(toSvg(sample(doc, 'blow', 0.5))).not.toContain('pathLength');
    expect(toSvg(doc)).not.toContain('dasharray');
  });
});
