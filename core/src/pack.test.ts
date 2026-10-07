import { describe, expect, it } from 'vitest';
import {
  applyOps,
  editPack,
  exportCss,
  findingText,
  IconError,
  lint,
  newDoc,
  newDocIn,
  newPack,
  resolve,
  sheet,
  toSvg,
  validatePack,
  type IconDoc,
  type Pack,
} from './index';

function meteo(): Pack {
  return editPack(newPack('meteo', 'micro'), {
    style: { stroke: '$ink', strokeWidth: 1.5 },
    palette: { ink: '#1b2a41', sun: '#f5a524' },
    motion: { ease: [0.3, 0, 0.2, 1], hover: { duration: [400, 900], maxRotate: 30 } },
  });
}

function sun(pack: Pack): IconDoc {
  return applyOps(newDocIn(pack, 'sun'), [
    { op: 'add_node', node: { type: 'circle', id: 'disc', cx: 12, cy: 12, r: 4, stroke: '$sun' } },
    { op: 'add_node', node: { type: 'line', id: 'ray', x1: 12, y1: 2, x2: 12, y2: 4 } },
    { op: 'set_clip', clip: { id: 'turn', trigger: 'hover', duration: 600 } },
    { op: 'set_track', clip: 'turn', node: 'ray', prop: 'rotate', keys: [{ t: 0, v: 0 }, { t: 0.5, v: 25, ease: 'linear' }, { t: 1, v: 0 }] },
    { op: 'set_track', clip: 'turn', node: 'disc', prop: 'stroke', keys: [{ t: 0, v: '$sun' }, { t: 0.5, v: '$ink' }, { t: 1, v: '$sun' }] },
    { op: 'set_clip', clip: { id: 'burst', trigger: 'click', duration: 600 } },
    { op: 'set_track', clip: 'burst', node: 'disc', prop: 'scale', keys: [{ t: 0, v: 1 }, { t: 0.5, v: 1.2 }, { t: 1, v: 1 }] },
  ]);
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

describe('a pack', () => {
  it('starts with the usual frame and style of its mode', () => {
    expect(newPack('ui', 'micro')).toMatchObject({ size: 24, style: { strokeWidth: 2 }, motion: { hover: { maxTranslate: 2 }, click: { maxTranslate: 6 } } });
    expect(newPack('store', 'app')).toMatchObject({ size: 1024, style: {}, motion: { click: { maxTranslate: 256 } } });
    expect(newDocIn(meteo(), 'sun').defaults).toBeUndefined();
  });

  it('merges an edit key by key, the limits of one reaction too, removes with null, and keeps its frame', () => {
    const pack = editPack(meteo(), { brief: 'Weather', palette: { sun: null, rain: '#3b82f6' }, motion: { feel: 'calm', click: { maxRotate: 180 } } });
    expect(pack.palette).toEqual({ ink: '#1b2a41', rain: '#3b82f6' });
    expect(pack.motion).toMatchObject({ feel: 'calm', hover: { maxRotate: 30, duration: [400, 900], maxTranslate: 2 }, click: { maxRotate: 180, maxTranslate: 6 } });
    expect(pack.style.linecap).toBe('round');
    expect(codeOf(() => editPack(pack, { size: 32 } as never))).toBe('locked_field');
  });

  it('refuses a palette or a motion that makes no sense', () => {
    expect(codeOf(() => editPack(meteo(), { palette: { Sun: '#fff' } }))).toBe('bad_pack');
    expect(codeOf(() => editPack(meteo(), { palette: { sun: '$ink' } }))).toBe('bad_pack');
    expect(codeOf(() => editPack(meteo(), { motion: { hover: { duration: [900, 400] } } }))).toBe('bad_pack');
    expect(codeOf(() => editPack(meteo(), { motion: { click: null } }))).toBe('bad_pack');
    expect(codeOf(() => editPack(meteo(), { style: { stroke: '$nope' } }))).toBe('unknown_token');
    expect(() => validatePack(meteo())).not.toThrow();
  });
});

describe('resolve', () => {
  it('puts the style of the pack under the icon and replaces every $name', () => {
    const pack = meteo();
    const svg = toSvg(resolve(sun(pack), pack));
    expect(svg).toContain('stroke="#1b2a41" stroke-width="1.5" stroke-linecap="round"');
    expect(svg).toContain('r="4" stroke="#f5a524"');
    expect(svg).not.toContain('$');
  });

  it('gives the easing of the pack to the keys that set none, and resolves animated colours', () => {
    const pack = meteo();
    const css = exportCss(resolve(sun(pack), pack));
    expect(css).toContain('0%{rotate:0deg;animation-timing-function:cubic-bezier(0.3,0,0.2,1)}50%{rotate:25deg;animation-timing-function:linear}');
    expect(css).toContain('50%{stroke:#1b2a41');
  });

  it('follows the pack: a new colour reaches the icon without touching it', () => {
    const pack = meteo();
    const icon = sun(pack);
    const night = editPack(pack, { palette: { sun: '#c4b5fd' }, style: { strokeWidth: 2 } });
    expect(toSvg(resolve(icon, night))).toContain('stroke="#c4b5fd"');
    expect(toSvg(resolve(icon, night))).toContain('stroke-width="2"');
  });

  it('refuses a $name the palette does not have, or an icon with a $name and no pack', () => {
    const pack = meteo();
    expect(codeOf(() => resolve(sun(pack), editPack(pack, { palette: { sun: null } })))).toBe('unknown_token');
    expect(codeOf(() => resolve(sun(pack), undefined))).toBe('unknown_token');
    const loose = newDoc('bell', 'micro');
    expect(resolve(loose, undefined)).toEqual(loose);
  });
});

describe('lint', () => {
  it('finds nothing in an icon that fits', () => {
    const pack = meteo();
    expect(lint(sun(pack), pack)).toEqual([]);
  });

  it('names what departs from the style and the palette', () => {
    const pack = meteo();
    const icon = applyOps(sun(pack), [
      { op: 'set_meta', size: 32, defaults: { strokeWidth: 2, linecap: 'round' } },
      { op: 'update_node', id: 'disc', set: { stroke: '#F5A524', strokeWidth: 3 } },
      { op: 'update_node', id: 'ray', set: { stroke: '#ff00ff' } },
      // A prop, unseen at rest, may be thinner than the pack: it is not reported.
      { op: 'add_node', node: { type: 'line', id: 'trail', x1: 2, y1: 2, x2: 6, y2: 2, strokeWidth: 1, opacity: 0 } },
    ]);
    expect(lint(icon, pack).map(findingText)).toEqual([
      'icon: is micro 32; the pack is micro 24.',
      'defaults.strokeWidth: is 2; the pack sets 1.5. Remove it to inherit.',
      'node "disc" stroke: #F5A524 is not a colour of the palette. Use $sun.',
      'node "disc": strokeWidth is 3; the pack draws with 1.5.',
      'node "ray" stroke: #ff00ff is not a colour of the palette. Use $ink, $sun.',
    ]);
  });

  it('holds a hover and a click each to its own limits, and leaves loops free', () => {
    const pack = meteo();
    const wild = applyOps(sun(pack), [
      { op: 'set_clip', clip: { id: 'turn', duration: 1500 } },
      { op: 'set_track', clip: 'turn', node: 'ray', prop: 'rotate', keys: [{ t: 0, v: 0 }, { t: 1, v: 90 }] },
      { op: 'set_track', clip: 'turn', node: 'ray', prop: 'translate', keys: [{ t: 0, v: [0, 0] }, { t: 1, v: [3, 4] }] },
      { op: 'set_track', clip: 'turn', node: 'disc', prop: 'scale', keys: [{ t: 0, v: 1 }, { t: 1, v: 1.5 }] },
      { op: 'set_track', clip: 'turn', node: 'disc', prop: 'stroke', keys: [{ t: 0, v: '$sun' }, { t: 1, v: '#000000' }] },
    ]);
    expect(lint(wild, pack).map((finding) => `${finding.code} ${finding.got}`)).toEqual([
      'duration 1500',
      'rotate 90',
      'off_palette #000000',
      'translate 5',
      'scale 1–1.5',
    ]);
    // The same clip as a click: a larger turn and a longer move are allowed, the duration and the scale still are not.
    const click = applyOps(wild, [{ op: 'set_clip', clip: { id: 'turn', trigger: 'click' } }]);
    expect(lint(click, pack).map((finding) => finding.code)).toEqual(['duration', 'off_palette', 'scale', 'no_hover']);
    const loop = applyOps(wild, [{ op: 'set_clip', clip: { id: 'turn', trigger: 'loop' } }]);
    expect(lint(loop, pack).map((finding) => finding.code)).toEqual(['off_palette', 'no_hover']);
  });

  it('asks for the second reaction of an icon that has one, and nothing of a still icon', () => {
    const pack = meteo();
    const hoverOnly = applyOps(sun(pack), [{ op: 'remove_clip', id: 'burst' }]);
    expect(lint(hoverOnly, pack).map(findingText)).toEqual(['icon (subtle): reacts to the pointer but not to a press. Add a click clip (it acts) or an on clip (it switches).']);
    const still = applyOps(hoverOnly, [{ op: 'remove_clip', id: 'turn' }]);
    expect(lint(still, pack)).toEqual([]);
  });
});

describe('sheet', () => {
  it('lays the icons on a grid, each scaled to its cell', () => {
    const pack = meteo();
    const icons = [sun(pack), { ...sun(pack), name: 'moon' }, { ...sun(pack), name: 'rain' }].map((icon) => resolve(icon, pack));
    const svg = sheet(icons, { cell: 48, background: '#ffffff', ink: '#111111' });
    expect(svg).toContain('viewBox="0 0 132 132" width="132" height="132" color="#111111"');
    expect(svg).toContain('<rect width="132" height="132" fill="#ffffff"/>');
    expect(svg).toContain('<g transform="translate(72 12) scale(2)"><svg');
    expect(svg).toContain('<g transform="translate(12 72) scale(2)"><svg');
  });
});
