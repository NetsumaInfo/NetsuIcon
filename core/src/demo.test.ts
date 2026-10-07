import { describe, expect, it } from 'vitest';
import { applyOps, demo, exportCss, newDoc, typeOf, validate, type IconDoc, type Op } from './index';

const LID: Op = { op: 'add_node', node: { type: 'line', id: 'lid', x1: 4, y1: 6, x2: 20, y2: 6, origin: [20, 6] } };

function turn(clip: string, to: number): Op {
  return { op: 'set_track', clip, node: 'lid', prop: 'rotate', keys: [{ t: 0, v: 0, ease: 'ease-out' }, { t: 1, v: to }] };
}

function bin(): IconDoc {
  return applyOps(newDoc('bin', 'micro'), [
    LID,
    { op: 'set_clip', clip: { id: 'peek', trigger: 'hover', duration: 400 } },
    { op: 'set_track', clip: 'peek', node: 'lid', prop: 'rotate', keys: [{ t: 0, v: 0 }, { t: 0.5, v: 8 }, { t: 1, v: 0 }] },
    { op: 'set_clip', clip: { id: 'throw', trigger: 'click', duration: 800 } },
    { op: 'set_track', clip: 'throw', node: 'lid', prop: 'rotate', keys: [{ t: 0, v: 0 }, { t: 0.5, v: 16 }, { t: 1, v: 0 }] },
  ]);
}

function lock(): IconDoc {
  return applyOps(newDoc('lock', 'micro'), [LID, { op: 'set_clip', clip: { id: 'open', trigger: 'on', duration: 500 } }, turn('open', 20)]);
}

describe('the type of an icon', () => {
  it('comes from the clips it has', () => {
    expect(typeOf(bin())).toBe('action');
    expect(typeOf(lock())).toBe('switch');
    expect(typeOf(applyOps(newDoc('wait', 'micro'), [LID, { op: 'set_clip', clip: { id: 'spin', trigger: 'loop', duration: 900 } }]))).toBe('state');
    expect(typeOf(applyOps(newDoc('new', 'micro'), [LID, { op: 'set_clip', clip: { id: 'pop', trigger: 'in', duration: 300 } }]))).toBe('arrival');
    expect(typeOf(newDoc('flat', 'micro'))).toBe('still');
  });
});

describe('an icon that plays by itself', () => {
  it('plays the press of an action, then rests, in one loop', () => {
    const shown = demo(bin(), { start: 200 });
    expect(shown.clips).toHaveLength(1);
    const [clip] = shown.clips;
    expect(clip).toMatchObject({ id: 'demo', trigger: 'loop', duration: 1900 });
    // 800 ms of press from 200 ms on, in a loop of 1900 ms.
    expect(clip!.tracks[0]!.keys.map((key) => key.t)).toEqual([0.10526, 0.31579, 0.52632]);
    expect(() => validate(shown)).not.toThrow();
    expect(exportCss(shown)).toContain('1900ms linear 0ms infinite');
  });

  it('plays the hover when asked, in the length given', () => {
    const [clip] = demo(bin(), { reaction: 'hover', start: 0, length: 2000 }).clips;
    expect(clip!.duration).toBe(2000);
    expect(clip!.tracks[0]!.keys.map((key) => key.v)).toEqual([0, 8, 0]);
    expect(clip!.tracks[0]!.keys[2]!.t).toBe(0.2);
  });

  it('takes a switch on, holds it, and takes it back', () => {
    const [clip] = demo(lock(), { start: 0, held: 1000 }).clips;
    // On in 500 ms, held 1000 ms, back in 500 ms, then 900 ms of rest.
    expect(clip!.duration).toBe(2900);
    expect(clip!.tracks).toHaveLength(1);
    expect(clip!.tracks[0]!.keys.map((key) => key.v)).toEqual([0, 20, 20, 0]);
    expect(() => validate(demo(lock()))).not.toThrow();
  });

  it('grows a loop too short for the reaction, and leaves a still icon still', () => {
    expect(demo(bin(), { start: 0, length: 100 }).clips[0]!.duration).toBe(800);
    expect(demo(newDoc('flat', 'micro')).clips).toEqual([]);
  });
});
