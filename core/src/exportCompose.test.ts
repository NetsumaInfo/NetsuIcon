import { describe, expect, it } from 'vitest';
import { exportCompose } from './exportCompose';
import { newDoc, type IconDoc, type IconNode } from './types';

function icon(name: string, nodes: IconNode[]): IconDoc {
  return { ...newDoc(name, 'micro'), nodes };
}

describe('exportCompose', () => {
  it('names a value after the icon and writes a stroked path', () => {
    const kotlin = exportCompose([icon('zoom-in', [{ type: 'path', id: 'a', d: 'M3 3h4' }])], 'test');
    expect(kotlin).toContain('val ZoomIn by lazy');
    expect(kotlin).toContain('stroke("M3 3h4")');
  });

  it('turns a circle, a rounded rectangle and a line into path data', () => {
    const kotlin = exportCompose(
      [
        icon('shapes', [
          { type: 'circle', id: 'c', cx: 12, cy: 12, r: 4 },
          { type: 'rect', id: 'r', x: 2, y: 2, width: 10, height: 6, rx: 2 },
          { type: 'line', id: 'l', x1: 1, y1: 2, x2: 3, y2: 4 },
        ]),
      ],
      'test',
    );
    expect(kotlin).toContain('stroke("M8 12a4 4 0 1 0 8 0a4 4 0 1 0 -8 0z")');
    expect(kotlin).toContain('stroke("M4 2h6a2 2 0 0 1 2 2v2a2 2 0 0 1 -2 2h-6a2 2 0 0 1 -2 -2v-2a2 2 0 0 1 2 -2z")');
    expect(kotlin).toContain('stroke("M1 2L3 4")');
  });

  it('fills a filled shape, with or without its stroke, and inherits from a group', () => {
    const kotlin = exportCompose(
      [
        icon('solid', [
          { type: 'path', id: 'a', d: 'M0 0h1', fill: '#fff', stroke: 'none' },
          { type: 'group', id: 'g', fill: '#fff', children: [{ type: 'path', id: 'b', d: 'M1 1h1', strokeWidth: 1.5 }] },
        ]),
      ],
      'test',
    );
    expect(kotlin).toContain('fill("M0 0h1")');
    expect(kotlin).toContain('fillStroke("M1 1h1", 1.5f)');
  });

  it('refuses an icon that moves or is not on a grid of 24', () => {
    expect(() => exportCompose([icon('moved', [{ type: 'path', id: 'a', d: 'M0 0h1', rotate: 10 }])], 'test')).toThrow(/still/);
    expect(() => exportCompose([{ ...newDoc('big', 'app'), nodes: [] }], 'test')).toThrow(/1024/);
  });
});
