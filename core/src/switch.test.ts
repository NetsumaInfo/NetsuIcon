import { describe, expect, it } from 'vitest';
import { applyOps, exportCss, exportPage, exportReact, IconError, isSwitch, newDoc, pressClip, reverseClip, sample, toSvg, withOff, type IconDoc, type Op } from './index';

const LOCK: Op[] = [
  { op: 'add_node', node: { type: 'rect', id: 'body', x: 5, y: 11, width: 14, height: 9, rx: 2 } },
  { op: 'add_node', node: { type: 'path', id: 'shackle', d: 'M8 11V8a4 4 0 0 1 8 0v3' } },
  { op: 'set_clip', clip: { id: 'lift', trigger: 'hover', duration: 300 } },
  { op: 'set_track', clip: 'lift', node: 'shackle', prop: 'translate', keys: [{ t: 0, v: [0, 0] }, { t: 0.4, v: [0, -1] }, { t: 1, v: [0, 0] }] },
  { op: 'set_clip', clip: { id: 'open', trigger: 'on', duration: 500 } },
  { op: 'set_track', clip: 'open', node: 'shackle', prop: 'translate', keys: [{ t: 0, v: [0, 0], ease: 'ease-out' }, { t: 1, v: [0, -2] }] },
];

function lock(): IconDoc {
  return applyOps(newDoc('lock', 'micro'), LOCK);
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

describe('a switch', () => {
  it('is an icon with a way on; what a press plays is that clip', () => {
    expect(isSwitch(lock())).toBe(true);
    expect(pressClip(lock())).toBe('open');
    expect(isSwitch(newDoc('dot', 'micro'))).toBe(false);
  });

  it('gets its way off from its way on, run backwards with its curves turned round', () => {
    const back = withOff(lock()).clips.find((clip) => clip.trigger === 'off')!;
    expect(back.id).toBe('open-back');
    expect(back.tracks[0]!.keys).toEqual([{ t: 0, v: [0, -2], ease: 'ease-in' }, { t: 1, v: [0, 0] }]);
    const swing = reverseClip({ id: 'a', trigger: 'on', duration: 400, tracks: [{ node: 'n', prop: 'rotate', keys: [{ t: 0, v: 0, ease: [0.2, 0, 0, 1] }, { t: 0.25, v: 14 }, { t: 1, v: 10 }] }] }, 'b', 'off');
    expect(swing.tracks[0]!.keys).toEqual([{ t: 0, v: 10 }, { t: 0.75, v: 14, ease: [1, 0, 0.8, 1] }, { t: 1, v: 0 }]);
  });

  it('keeps a way off that was written, and adds none to an icon that does not switch', () => {
    const own = applyOps(lock(), [
      { op: 'set_clip', clip: { id: 'shut', trigger: 'off', duration: 300 } },
      { op: 'set_track', clip: 'shut', node: 'shackle', prop: 'translate', keys: [{ t: 0, v: [0, -2] }, { t: 1, v: [0, 0] }] },
    ]);
    expect(withOff(own)).toBe(own);
    const still = newDoc('dot', 'micro');
    expect(withOff(still)).toBe(still);
  });

  it('is one thing or the other: an icon acts or switches, and a way off needs a way on', () => {
    expect(codeOf(() => applyOps(lock(), [{ op: 'set_clip', clip: { id: 'tap', trigger: 'click', duration: 300 } }]))).toBe('bad_clip');
    expect(codeOf(() => applyOps(newDoc('dot', 'micro'), [{ op: 'set_clip', clip: { id: 'shut', trigger: 'off', duration: 300 } }]))).toBe('bad_clip');
    expect(codeOf(() => applyOps(lock(), [{ op: 'set_clip', clip: { id: 'again', trigger: 'on', duration: 300 } }]))).toBe('bad_clip');
  });

  it('plays in CSS when the page sets its state, over the hover, and stays at its end', () => {
    const svg = exportCss(lock());
    expect(svg).toContain('class="ni-lock" data-switch="open"');
    expect(svg).toContain('.ni-lock[data-state="on"] .n-shackle{animation:ni-lock-open-shackle-translate 500ms linear 0ms 1 both}');
    expect(svg).toContain('.ni-lock[data-state="off"] .n-shackle{animation:ni-lock-open-back-shackle-translate 500ms linear 0ms 1 both}');
    expect(svg).toContain('@keyframes ni-lock-open-back-shackle-translate{0%{translate:0px -2px;animation-timing-function:ease-in}100%{translate:0px 0px}}');
    expect(svg.indexOf('.ni-lock:hover .n-shackle{')).toBeLessThan(svg.indexOf('.ni-lock[data-state="on"] .n-shackle{'));
  });

  it('is shown on by sampling the end of its way on', () => {
    expect(toSvg(sample(lock(), 'open', 1))).toContain('transform="translate(0 -2)"');
  });

  it('toggles in the React component: a press goes on, the next one plays the way off', () => {
    const code = exportReact(lock());
    expect(code).toContain('onHoverStart={() => setPlaying((now) => (now === "rest" ? "lift" : now))}');
    expect(code).toContain('onTap={() => setPlaying((now) => (now === "open" ? "open-back" : "open"))}');
    expect(code).toContain('onAnimationComplete={(done) => done === "open-back" && setPlaying("rest")}');
    expect(code).toContain('"open-back": { x: [0,0], y: [-2,0]');
  });

  it('is handled by the script of a page', () => {
    const page = exportPage('Mail', [{ title: 'mail', icons: [lock()] }]);
    expect(page).toContain('data-switch="open"');
    expect(page).toContain("svg.setAttribute('data-state',on?'off':'on')");
  });
});

describe('trim', () => {
  const GUST: Op[] = [
    { op: 'add_node', node: { type: 'line', id: 'gust', x1: 3, y1: 12, x2: 11, y2: 12 } },
    { op: 'set_clip', clip: { id: 'blow', trigger: 'hover', duration: 600 } },
    { op: 'set_track', clip: 'blow', node: 'gust', prop: 'trim', keys: [{ t: 0, v: [0, 1] }, { t: 1, v: [1, 1] }] },
  ];
  const wind = (): IconDoc => applyOps(newDoc('wind', 'micro'), GUST);

  it('draws a stretch of the stroke in a still, in real units', () => {
    expect(toSvg(sample(wind(), 'blow', 0.5))).toContain('stroke-dasharray="4 16" stroke-dashoffset="-4"');
    expect(toSvg(wind())).not.toContain('dasharray');
    const part = applyOps(newDoc('wind', 'micro'), [{ op: 'add_node', node: { type: 'line', id: 'gust', x1: 3, y1: 12, x2: 11, y2: 12, trim: [0.25, 0.75] } }]);
    expect(toSvg(part)).toContain('stroke-dasharray="4 16" stroke-dashoffset="-2"');
  });

  it('slides one dash along the path in CSS, and puts an empty dash off the path so that no dot is left', () => {
    const svg = exportCss(wind());
    expect(svg).toContain('pathLength="1" stroke-dasharray="1 2" stroke-dashoffset="0"');
    expect(svg).toContain('{0%{stroke-dasharray:1 2;stroke-dashoffset:0}100%{stroke-dasharray:0 2;stroke-dashoffset:-1.01}}');
  });

  it('is a length and a start for Motion', () => {
    const code = exportReact(wind());
    expect(code).toContain('pathLength: [1,0]');
    expect(code).toContain('pathOffset: [0,1]');
  });

  it('cannot be animated with draw on the same shape in one clip: they are the same dash', () => {
    const both: Op = { op: 'set_track', clip: 'blow', node: 'gust', prop: 'draw', keys: [{ t: 0, v: 1 }, { t: 1, v: 0 }] };
    expect(codeOf(() => applyOps(wind(), [both]))).toBe('bad_track');
    expect(codeOf(() => applyOps(wind(), [{ op: 'set_track', clip: 'blow', node: 'gust', prop: 'trim', keys: [{ t: 0, v: 1 }] }]))).toBe('bad_key');
  });

  it('stays, like draw, between nothing and the whole stroke', () => {
    const trim = (v: [number, number]): Op => ({ op: 'set_track', clip: 'blow', node: 'gust', prop: 'trim', keys: [{ t: 0, v }] });
    expect(codeOf(() => applyOps(wind(), [trim([0, 1.2])]))).toBe('bad_key');
    expect(codeOf(() => applyOps(wind(), [trim([0.8, 0.2])]))).toBe('bad_key');
    expect(codeOf(() => applyOps(wind(), [{ op: 'remove_track', clip: 'blow', node: 'gust', prop: 'trim' }, { op: 'set_track', clip: 'blow', node: 'gust', prop: 'draw', keys: [{ t: 0, v: 1.08 }] }]))).toBe('bad_key');
  });
});
