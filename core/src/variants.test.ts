import { describe, expect, it } from 'vitest';
import { applyOps } from './ops';
import { newDoc } from './types';
import { modesOf } from './variants';

const icon = (name: string, of?: string, mode?: string) => {
  const doc = newDoc(name, 'micro');
  return of ? applyOps(doc, [{ op: 'set_meta', variant: { of, mode: mode! } }]) : doc;
};

describe('modesOf', () => {
  const icons = [icon('send'), icon('send-end', 'send', 'end'), icon('send-above', 'send', 'above'), icon('other')];

  it('lists the base, then its modes by name, from the base or from a mode', () => {
    const expected = [{ icon: 'send' }, { icon: 'send-above', mode: 'above' }, { icon: 'send-end', mode: 'end' }];
    expect(modesOf(icons, 'send')).toEqual(expected);
    expect(modesOf(icons, 'send-end')).toEqual(expected);
  });

  it('gives one entry for an icon without modes', () => {
    expect(modesOf(icons, 'other')).toEqual([{ icon: 'other' }]);
  });
});

describe('variant', () => {
  it('refuses an icon that is a mode of itself', () => {
    expect(() => icon('send', 'send', 'end')).toThrow(/itself/);
  });

  it('is taken away with null', () => {
    const doc = applyOps(icon('send-end', 'send', 'end'), [{ op: 'set_meta', variant: null }]);
    expect(doc.variant).toBeUndefined();
  });
});
