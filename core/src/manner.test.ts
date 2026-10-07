import { describe, expect, it } from 'vitest';
import { applyOps, editPack, exportCss, exportReact, forManner, IconError, lint, mannersOf, newDoc, newDocIn, newPack, type IconDoc, type Op } from './index';

/** A plane with one pair of reactions in each manner: it edges forward and nudges, or it circles and flies off. */
const PLANE: Op[] = [
  { op: 'add_node', node: { type: 'path', id: 'plane', d: 'M21 3L3 10.5l7 3.5 3.5 7z' } },
  { op: 'set_clip', clip: { id: 'aim', trigger: 'hover', duration: 400, manner: 'subtle' } },
  { op: 'set_track', clip: 'aim', node: 'plane', prop: 'translate', keys: [{ t: 0, v: [0, 0] }, { t: 0.4, v: [1, -1] }, { t: 1, v: [0, 0] }] },
  { op: 'set_clip', clip: { id: 'fly', trigger: 'click', duration: 600, manner: 'subtle' } },
  { op: 'set_track', clip: 'fly', node: 'plane', prop: 'translate', keys: [{ t: 0, v: [0, 0] }, { t: 0.5, v: [3, -3] }, { t: 1, v: [0, 0] }] },
  { op: 'set_clip', clip: { id: 'circle', trigger: 'hover', duration: 800, manner: 'expressive' } },
  { op: 'set_track', clip: 'circle', node: 'plane', prop: 'rotate', keys: [{ t: 0, v: 0 }, { t: 0.5, v: -30 }, { t: 1, v: 0 }] },
  { op: 'set_clip', clip: { id: 'soar', trigger: 'click', duration: 1500, manner: 'expressive' } },
  { op: 'set_track', clip: 'soar', node: 'plane', prop: 'translate', keys: [{ t: 0, v: [0, 0] }, { t: 0.5, v: [14, -14] }, { t: 1, v: [0, 0] }] },
];

function plane(): IconDoc {
  return applyOps(newDoc('send', 'micro'), PLANE);
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

describe('the two manners', () => {
  it('are a tag on a clip, set and taken away by set_clip', () => {
    expect(plane().clips.map((clip) => clip.manner)).toEqual(['subtle', 'subtle', 'expressive', 'expressive']);
    const untagged = applyOps(plane(), [{ op: 'set_clip', clip: { id: 'aim', manner: null } }]);
    expect(untagged.clips[0]).not.toHaveProperty('manner');
    expect(codeOf(() => applyOps(plane(), [{ op: 'set_clip', clip: { id: 'aim', manner: 'loud' as never } }]))).toBe('bad_clip');
  });

  it('split an icon in two: each manner plays its own clips, and the ones that name none', () => {
    const doc = applyOps(plane(), [{ op: 'set_clip', clip: { id: 'hum', trigger: 'loop', duration: 900 } }]);
    expect(forManner(doc, 'subtle').clips.map((clip) => clip.id)).toEqual(['aim', 'fly', 'hum']);
    expect(forManner(doc, 'expressive').clips.map((clip) => clip.id)).toEqual(['circle', 'soar', 'hum']);
    expect(mannersOf(doc)).toEqual(['subtle', 'expressive']);
    expect(mannersOf(newDoc('dot', 'micro'))).toEqual(['subtle']);
  });

  it('are written one at a time: the subtle one unless the other is asked for', () => {
    const subtle = exportCss(plane());
    expect(subtle).toContain('data-click="fly"');
    expect(subtle).not.toContain('soar');
    const expressive = exportCss(plane(), { manner: 'expressive' });
    expect(expressive).toContain('data-click="soar"');
    expect(expressive).toContain('.ni-send:hover .n-plane{animation:ni-send-circle-plane-rotate 800ms');
    expect(expressive).not.toContain('ni-send-aim-');
    expect(exportReact(plane(), undefined, 'expressive')).toContain('onTap={() => setPlaying("soar")}');
    expect(exportReact(plane())).toContain('onTap={() => setPlaying("fly")}');
  });

  it('each hold the rule of the press: an action or a switch, counting the clips that play in both', () => {
    const switched: Op = { op: 'set_clip', clip: { id: 'soar', trigger: 'on' } };
    expect(codeOf(() => applyOps(plane(), [switched]))).toBe('no error');
    const both: Op = { op: 'set_clip', clip: { id: 'fly', manner: null } };
    expect(codeOf(() => applyOps(plane(), [both, switched]))).toBe('bad_clip');
  });

  it('each have their limits in a pack, and each must have its two reactions', () => {
    const pack = editPack(newPack('mail', 'micro'), { motion: { click: { maxTranslate: 6 }, expressive: { click: { maxTranslate: 24 } } } });
    const icon = applyOps(newDocIn(pack, 'send'), PLANE);
    expect(lint(icon, pack)).toEqual([]);
    const tooFar = applyOps(icon, [{ op: 'set_clip', clip: { id: 'soar', manner: 'subtle' } }, { op: 'remove_clip', id: 'fly' }]);
    expect(lint(tooFar, pack).map((finding) => `${finding.code} ${finding.where}`)).toEqual([
      'duration clip "soar" (click, subtle)',
      'translate clip "soar" plane.translate',
      'no_click icon (expressive)',
    ]);
  });
});
