import { describe, expect, it } from 'vitest';
import { applyOps, exportCss, exportPage, exportReact, IconError, newDoc, sample, toSvg, validate, valueAt, type IconDoc, type Op } from './index';

const BELL: Op[] = [
  { op: 'add_node', node: { type: 'group', id: 'bell', origin: [12, 3], children: [] } },
  { op: 'add_node', parent: 'bell', node: { type: 'path', id: 'body', d: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9' } },
  { op: 'add_node', node: { type: 'path', id: 'clapper', d: 'M10.3 21a1.94 1.94 0 0 0 3.4 0' } },
  { op: 'set_clip', clip: { id: 'ring', trigger: 'hover', duration: 600 } },
  {
    op: 'set_track',
    clip: 'ring',
    node: 'bell',
    prop: 'rotate',
    keys: [
      { t: 0, v: 0, ease: 'ease-out' },
      { t: 0.25, v: 14 },
      { t: 0.75, v: -10 },
      { t: 1, v: 0 },
    ],
  },
  { op: 'set_track', clip: 'ring', node: 'clapper', prop: 'translate', keys: [{ t: 0, v: [0, 0] }, { t: 0.5, v: [2, 0] }, { t: 1, v: [0, 0] }] },
];

function bell(): IconDoc {
  return applyOps(newDoc('bell', 'micro'), BELL);
}

function codeOf(run: () => unknown): string {
  try {
    run();
  } catch (error) {
    if (error instanceof IconError) return error.code;
    throw error;
  }
  return 'no error';
}

describe('applyOps', () => {
  it('builds a tree and leaves the input alone', () => {
    const empty = newDoc('bell', 'micro');
    const doc = applyOps(empty, BELL);
    expect(empty.nodes).toHaveLength(0);
    expect(doc.nodes.map((n) => n.id)).toEqual(['bell', 'clapper']);
    expect(doc.clips[0]!.tracks).toHaveLength(2);
  });

  it('refuses a duplicate id, an unknown node and a wrong value, naming the op', () => {
    const doc = bell();
    expect(codeOf(() => applyOps(doc, [{ op: 'add_node', node: { type: 'circle', id: 'body', cx: 1, cy: 1, r: 1 } }]))).toBe('duplicate_id');
    expect(codeOf(() => applyOps(doc, [{ op: 'update_node', id: 'nope', set: {} }]))).toBe('node_not_found');
    expect(codeOf(() => applyOps(doc, [{ op: 'set_track', clip: 'ring', node: 'body', prop: 'rotate', keys: [{ t: 0, v: [1, 2] }] }]))).toBe('bad_key');
    expect(() => applyOps(doc, [{ op: 'remove_clip', id: 'ring' }, { op: 'remove_clip', id: 'ring' }])).toThrow(/op 1 \(remove_clip\)/);
  });

  it('updates fields, and null removes one', () => {
    const doc = applyOps(bell(), [{ op: 'update_node', id: 'body', set: { stroke: '#ff0000', name: 'Body' } }]);
    const again = applyOps(doc, [{ op: 'update_node', id: 'body', set: { stroke: null } }]);
    expect(toSvg(doc)).toContain('stroke="#ff0000"');
    expect(toSvg(again)).not.toContain('#ff0000');
    expect(codeOf(() => applyOps(doc, [{ op: 'update_node', id: 'body', set: { id: 'other' } }]))).toBe('locked_field');
  });

  it('removes the tracks of a removed node, children included', () => {
    const doc = applyOps(bell(), [{ op: 'remove_node', id: 'bell' }]);
    expect(doc.clips[0]!.tracks.map((t) => t.node)).toEqual(['clapper']);
    expect(() => validate(doc)).not.toThrow();
  });

  it('moves a node into a group, but not a group into itself', () => {
    const doc = applyOps(bell(), [{ op: 'move_node', id: 'clapper', parent: 'bell', index: 0 }]);
    expect(doc.nodes).toHaveLength(1);
    expect(codeOf(() => applyOps(doc, [{ op: 'move_node', id: 'bell', parent: 'bell' }]))).toBe('bad_move');
  });
});

describe('sample', () => {
  it('holds the ends, interpolates between keys and follows the easing', () => {
    const track = bell().clips[0]!.tracks[0]!;
    expect(valueAt(track, 0)).toBe(0);
    expect(valueAt(track, 0.5)).toBeCloseTo(2);
    expect(valueAt(track, 1)).toBe(0);
    // ease-out is ahead of linear at the middle of its segment.
    expect(valueAt(track, 0.125) as number).toBeGreaterThan(7);
  });

  it('holds a value to the next key when the step says so, in a sample and in CSS', () => {
    const track = { node: 'a', prop: 'translate' as const, keys: [{ t: 0, v: [20, 0] as [number, number], ease: 'hold' as const }, { t: 0.5, v: [-20, 0] as [number, number] }, { t: 1, v: [0, 0] as [number, number] }] };
    expect(valueAt(track, 0.49)).toEqual([20, 0]);
    expect(valueAt(track, 0.5)).toEqual([-20, 0]);
    const doc = applyOps(bell(), [{ op: 'set_track', clip: 'ring', node: 'clapper', prop: 'translate', keys: track.keys }]);
    expect(exportCss(doc)).toContain('0%{translate:20px 0px;animation-timing-function:steps(1,end)}50%{translate:-20px 0px}');
    expect(exportReact(doc)).toContain('ease: [(p) => (p < 1 ? 0 : 1), [0,0,1,1]]');
  });

  it('mixes pairs and hex colours', () => {
    expect(valueAt({ node: 'a', prop: 'translate', keys: [{ t: 0, v: [0, 0] }, { t: 1, v: [4, -2] }] }, 0.5)).toEqual([2, -1]);
    expect(valueAt({ node: 'a', prop: 'fill', keys: [{ t: 0, v: '#000000' }, { t: 1, v: '#ffffff' }] }, 0.5)).toBe('#808080');
  });

  it('writes the values of a clip into a still document', () => {
    const svg = toSvg(sample(bell(), 'ring', 0.25));
    expect(svg).toContain('transform="rotate(14 12 3)"');
    expect(svg).toContain('transform="translate(1 0)"');
  });
});

describe('exportCss', () => {
  it('writes keyframes per track, scoped to the trigger', () => {
    const svg = exportCss(bell());
    expect(svg).toContain('@keyframes ni-bell-ring-bell-rotate{0%{rotate:0deg;animation-timing-function:ease-out}25%{rotate:14deg}');
    expect(svg).toContain('.ni-bell:hover .n-bell{animation:ni-bell-ring-bell-rotate 600ms linear 0ms 1 both}');
    expect(svg).toContain('transform-origin:12px 3px');
    expect(svg).toContain('50%{translate:2px 0px}');
  });

  it('can force a clip to play, and loops a loop', () => {
    expect(exportCss(bell())).toContain('.ni-bell[data-play~="ring"] .n-bell{animation:ni-bell-ring-bell-rotate 600ms');
    expect(exportCss(bell())).not.toContain('data-play="ring"');
    expect(exportCss(bell(), { play: 'ring' })).toContain('class="ni-bell" data-play="ring"');
    const loop = applyOps(bell(), [{ op: 'set_clip', clip: { id: 'ring', trigger: 'loop' } }]);
    expect(exportCss(loop)).toContain('infinite both');
  });

  it('lets a click win over the hover it happens in, and names the click for a page to play it whole', () => {
    const doc = applyOps(bell(), [
      { op: 'set_clip', clip: { id: 'strike', trigger: 'click', duration: 400 } },
      { op: 'set_track', clip: 'strike', node: 'bell', prop: 'scale', keys: [{ t: 0, v: 1 }, { t: 0.5, v: 0.9 }, { t: 1, v: 1 }] },
    ]);
    const svg = exportCss(doc);
    expect(svg).toContain('class="ni-bell" data-click="strike"');
    const hover = svg.indexOf('.ni-bell:hover .n-bell{');
    const active = svg.indexOf('.ni-bell:active .n-bell{');
    const quiet = svg.indexOf('.ni-bell[data-quiet]:hover .n-bell{animation:none}');
    const forced = svg.indexOf('.ni-bell[data-play~="strike"] .n-bell{');
    expect(hover).toBeGreaterThan(-1);
    expect([hover, active, quiet, forced]).toEqual([hover, active, quiet, forced].sort((a, b) => a - b));
  });

  it('gives a drawn stroke a length of 1 and slides its dash', () => {
    const doc = applyOps(bell(), [{ op: 'set_track', clip: 'ring', node: 'body', prop: 'draw', keys: [{ t: 0.2, v: 0 }, { t: 1, v: 1 }] }]);
    const svg = exportCss(doc);
    expect(svg).toContain('pathLength="1" stroke-dasharray="1 2" stroke-dashoffset="0"');
    expect(svg).toContain('0%{stroke-dashoffset:1}20%{stroke-dashoffset:1}100%{stroke-dashoffset:0}');
  });

  it('prefixes gradient ids', () => {
    const doc = applyOps(newDoc('app', 'app'), [
      { op: 'set_gradient', gradient: { id: 'sky', type: 'linear', stops: [{ offset: 0, color: '#4f86f7' }, { offset: 1, color: '#1a2030' }] } },
      { op: 'add_node', node: { type: 'rect', id: 'plate', x: 0, y: 0, width: 1024, height: 1024, rx: 230, fill: 'url(#sky)' } },
    ]);
    expect(exportCss(doc)).toContain('<linearGradient id="ni-app-sky"');
    expect(exportCss(doc)).toContain('fill="url(#ni-app-sky)"');
  });
});

describe('exportPage', () => {
  it('puts the animated icons on one page, each in its own scope, with the script that plays a click whole', () => {
    const page = exportPage('Mail & co', [{ title: 'mail', icons: [bell()] }], { hint: 'Hover, then click.' });
    expect(page).toContain('<title>Mail &amp; co</title>');
    expect(page).toContain('<p>Hover, then click.</p>');
    expect(page).toContain('<button type="button" class="tile" data-ni><svg');
    expect(page).toContain('class="ni-mail-bell"');
    expect(page).toContain('@keyframes ni-mail-bell-ring-bell-rotate');
    expect(page).toContain("svg.setAttribute('data-play',id)");
  });
});

describe('exportReact', () => {
  it('writes a motion component with variants for the animated nodes only', () => {
    const code = exportReact(bell());
    expect(code).toContain('export function BellIcon(');
    expect(code).toContain('<motion.g variants={{ rest: { rotate: 0 }, ring: { rotate: [0,14,-10,0], transition: { rotate: { duration: 0.6, times: [0,0.25,0.75,1], ease: ["easeOut", [0,0,1,1], [0,0,1,1]] } } } }}');
    expect(code).toContain('x: [0,2,0]');
    expect(code).toContain('<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />');
    expect(code).toContain('onHoverStart');
    expect(code).toContain('strokeLinecap="round"');
    expect(code).toContain('onHoverStart={() => setPlaying("ring")}');
  });

  it('carries a hover and a click together: the click plays whole, over the hover', () => {
    const doc = applyOps(bell(), [
      { op: 'set_clip', clip: { id: 'strike-hard', trigger: 'click', duration: 400 } },
      { op: 'set_track', clip: 'strike-hard', node: 'clapper', prop: 'opacity', keys: [{ t: 0, v: 1 }, { t: 0.5, v: 0.2 }, { t: 1, v: 1 }] },
    ]);
    const code = exportReact(doc);
    expect(code).toContain('onHoverStart={() => setPlaying((now) => (now === "rest" ? "ring" : now))}');
    expect(code).toContain('onHoverEnd={() => setPlaying((now) => (now === "ring" ? "rest" : now))}');
    expect(code).toContain('onTap={() => setPlaying("strike-hard")}');
    expect(code).toContain('onAnimationComplete={(done) => done === "strike-hard" && setPlaying("rest")}');
    // The bell does not move in the click: its variant for it is its rest, so an interrupted swing comes back.
    expect(code).toContain('<motion.g variants={{ rest: { rotate: 0 }, ring: { rotate: [0,14,-10,0]');
    expect(code).toContain('"strike-hard": { rotate: 0 } }}');
    expect(code).toContain('"strike-hard": { opacity: [1,0.2,1]');
    expect(exportReact(doc, 'ring')).not.toContain('strike-hard');
  });
});
