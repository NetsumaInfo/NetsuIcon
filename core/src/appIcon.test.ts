import { describe, expect, it } from 'vitest';
import { applyOps, appLint, markMeasures, exportReact, fingerprint, icns, ico, IconError, layers, likeness, newDoc, onPlatform, partsOf, PRINT, proof, toSvg, validate, type IconDoc, type Op } from './index';

/** A full-bleed tile with a ring and a dot in the middle: an application icon that every platform keeps whole. */
const GOOD: Op[] = [
  { op: 'add_node', node: { type: 'rect', id: 'plate', x: 0, y: 0, width: 1024, height: 1024, fill: '#1d4ed8' } },
  { op: 'add_node', node: { type: 'circle', id: 'ring', cx: 512, cy: 500, r: 220, fill: 'none', stroke: '#ffffff', strokeWidth: 64 } },
  { op: 'add_node', node: { type: 'circle', id: 'dot', cx: 512, cy: 500, r: 70, fill: '#fbbf24' } },
];

function app(ops: Op[] = GOOD): IconDoc {
  return applyOps(newDoc('tile', 'app'), ops);
}

const codes = (doc: IconDoc): string[] => appLint(doc).map((finding) => finding.code);

describe('partsOf', () => {
  it('places a shape through its own transform and every group around it', () => {
    const doc = applyOps(newDoc('moved', 'app'), [
      { op: 'add_node', node: { type: 'group', id: 'g', translate: [100, 0], children: [] } },
      { op: 'add_node', parent: 'g', node: { type: 'rect', id: 'r', x: 0, y: 0, width: 10, height: 10, fill: '#000', scale: 2, origin: [0, 0] } },
    ]);
    const [part] = partsOf(doc);
    expect(part!.box).toEqual({ x0: 100, y0: 0, x1: 120, y1: 20 });
  });

  it('follows the round corners of a rectangle', () => {
    const doc = applyOps(newDoc('frame', 'app'), [{ op: 'add_node', node: { type: 'rect', id: 'r', x: 0, y: 0, width: 100, height: 100, rx: 50, fill: '#000' } }]);
    const far = Math.max(...partsOf(doc)[0]!.points.map(([x, y]) => Math.hypot(x - 50, y - 50)));
    expect(far).toBeCloseTo(50);
  });

  it('tells the background, leaves out hidden shapes and props, and counts a stroke', () => {
    const doc = applyOps(app(), [{ op: 'add_node', node: { type: 'circle', id: 'prop', cx: 10, cy: 10, r: 5, fill: '#000', opacity: 0 } }]);
    const parts = partsOf(doc);
    expect(parts.map((part) => [part.id, part.background])).toEqual([['plate', true], ['ring', false], ['dot', false]]);
    expect(parts[1]!.paints).toEqual(['#ffffff']);
    expect(parts[1]!.box.x0).toBe(512 - 220 - 32);
  });
});

describe('appLint', () => {
  it('says nothing of an icon that every platform keeps whole', () => {
    expect(codes(app())).toEqual([]);
  });

  it('finds a missing background, a mark past the safe circle, thin and tiny parts', () => {
    const doc = applyOps(app(), [
      { op: 'remove_node', id: 'plate' },
      { op: 'add_node', node: { type: 'line', id: 'hair', x1: 312, y1: 900, x2: 712, y2: 900, stroke: '#fff', strokeWidth: 8 } },
      { op: 'add_node', node: { type: 'circle', id: 'speck', cx: 512, cy: 500, r: 6, fill: '#fff' } },
    ]);
    expect(codes(doc)).toEqual(expect.arrayContaining(['no_background', 'outside_safe', 'thin_stroke', 'tiny_part', 'off_centre']));
  });

  it('counts colours, and finds a small mark or one that sits low', () => {
    const many = applyOps(app(), [
      { op: 'add_node', node: { type: 'circle', id: 'a', cx: 480, cy: 500, r: 30, fill: '#ff0000' } },
      { op: 'add_node', node: { type: 'circle', id: 'b', cx: 540, cy: 500, r: 30, fill: '#00ff00' } },
    ]);
    expect(codes(many)).toContain('colours');
    const small = applyOps(app(), [{ op: 'remove_node', id: 'ring' }]);
    expect(codes(small)).toContain('small_mark');
    const low = applyOps(app(), [{ op: 'update_node', id: 'ring', set: { translate: [0, 60] } }, { op: 'update_node', id: 'dot', set: { translate: [0, 60] } }]);
    expect(codes(low)).toContain('off_centre');
  });

  it('is only for application icons, and says nothing of an empty one', () => {
    expect(appLint(newDoc('micro', 'micro'))).toEqual([]);
    expect(appLint(newDoc('empty', 'app'))).toEqual([]);
  });

  it('names the point that leaves the safe circle, and measures the mark', () => {
    const doc = applyOps(app(), [{ op: 'add_node', node: { type: 'circle', id: 'far', cx: 512, cy: 880, r: 20, fill: '#fff' } }]);
    expect(appLint(doc).find((finding) => finding.code === 'outside_safe')?.got).toBe('38% at [512,900]');
    expect(markMeasures(app())).toBe('mark: 504 × 504 (49% of the view box), box centre [512,500], farthest from the centre 264 (safe: 313)');
  });
});

describe('platforms and layers', () => {
  it('cuts each platform its own shape, scaling the picture for macOS and Android', () => {
    expect(onPlatform(app(), 'ios')).toMatch(/<clipPath id="ni-cut-ios-tile"><path d="M/);
    expect(onPlatform(app(), 'macos')).toContain('scale(0.805)');
    expect(onPlatform(app(), 'android')).toContain('scale(1.5)');
  });

  it('splits the background from the mark', () => {
    const { background, mark } = layers(app());
    expect(toSvg(background)).toContain('#1d4ed8');
    expect(toSvg(background)).not.toContain('#fbbf24');
    expect(toSvg(mark)).not.toContain('#1d4ed8');
    expect(toSvg(mark)).toContain('#fbbf24');
  });

  it('draws a proof with a row more for pixels and for neighbours', () => {
    expect(proof(app()).legend.split('\n')).toHaveLength(2);
    const full = proof(app(), { pixels: ['data:a', 'data:b'], neighbours: ['data:c'] });
    expect(full.legend.split('\n')).toHaveLength(4);
    expect(full.svg).toContain('href="data:c"');
    expect(full.width).toBe(4 * 128 + 5 * 16);
  });
});

describe('fillRule', () => {
  it('cuts a hole, in every output, and refuses another value', () => {
    const doc = applyOps(app(), [{ op: 'add_node', node: { type: 'path', id: 'hole', d: 'M0 0H10V10H0Z M2 2H8V8H2Z', fill: '#fff', fillRule: 'evenodd' } }]);
    expect(toSvg(doc)).toContain('fill-rule="evenodd"');
    expect(exportReact(doc)).toContain('fillRule="evenodd"');
    const bad = { ...doc, nodes: [{ type: 'path', id: 'p', d: 'M0 0H1', fillRule: 'odd' }] } as unknown as IconDoc;
    expect(() => validate(bad)).toThrow(IconError);
  });
});

describe('prints', () => {
  const square = (side: number, at: number, size: number): number[] =>
    Array.from({ length: size * size }, (_, index) => {
      const [x, y] = [index % size, Math.floor(index / size)];
      return x >= at && y >= at && x < at + side && y < at + side ? 1 : 0;
    });

  it('gives one shape the same print whatever its size and place', () => {
    const a = fingerprint(square(20, 5, 64), 64, 64);
    const b = fingerprint(square(48, 10, 64), 64, 64);
    expect(a).toHaveLength(PRINT * PRINT);
    expect(likeness(a, b)).toBeGreaterThan(0.9);
  });

  it('tells two shapes apart, and an empty picture has no likeness', () => {
    const ring = Array.from({ length: 64 * 64 }, (_, index) => {
      const d = Math.hypot((index % 64) - 32, Math.floor(index / 64) - 32);
      return d > 20 && d < 30 ? 1 : 0;
    });
    expect(likeness(fingerprint(ring, 64, 64), fingerprint(square(40, 12, 64), 64, 64))).toBeLessThan(0.6);
    expect(likeness(fingerprint([0, 0, 0, 0], 2, 2), fingerprint([0, 0, 0, 0], 2, 2))).toBe(0);
  });
});

describe('icon files', () => {
  const png = (size: number): { size: number; data: Uint8Array } => ({ size, data: new Uint8Array([size % 256, 1, 2]) });

  it('writes an .ico table that points at each picture', () => {
    const out = ico([png(16), png(256)]);
    const view = new DataView(out.buffer);
    expect(view.getUint16(4, true)).toBe(2);
    expect(out[6 + 16]).toBe(0);
    expect(view.getUint32(6 + 16 + 12, true)).toBe(6 + 32 + 3);
  });

  it('writes an .icns with its length, and needs every side', () => {
    const sizes = [16, 32, 64, 128, 256, 512, 1024];
    const out = icns(sizes.map(png));
    expect(String.fromCharCode(...out.slice(0, 4))).toBe('icns');
    expect(new DataView(out.buffer).getUint32(4)).toBe(out.length);
    expect(() => icns([png(16)])).toThrow();
  });
});
