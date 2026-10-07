import { forManner, withOff } from './clips';
import { bezierOf } from './ease';
import { paddedKeys } from './keys';
import { geometry, num, originOf, paint, slug, tagOf, transformAttr, type Attr } from './svg';
import { IconError, type Clip, type Ease, type IconDoc, type IconNode, type Manner, type Pair, type Track } from './types';

const CAMEL: Record<string, string> = {
  'stroke-width': 'strokeWidth',
  'stroke-linecap': 'strokeLinecap',
  'stroke-linejoin': 'strokeLinejoin',
};

const MOTION_EASE: Record<string, string> = {
  linear: 'linear',
  'ease-in': 'easeIn',
  'ease-out': 'easeOut',
  'ease-in-out': 'easeInOut',
};

function componentName(name: string): string {
  const pascal = slug(name)
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  return `${/^[A-Z]/.test(pascal) ? pascal : `Icon${pascal}`}Icon`;
}

function jsxAttrs(list: Attr[]): string {
  return list
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => {
      const name = CAMEL[key] ?? key;
      return typeof value === 'number' ? ` ${name}={${num(value)}}` : ` ${name}=${JSON.stringify(value)}`;
    })
    .join('');
}

function motionEase(ease: Ease | undefined): string {
  // Motion takes a function for an easing: this one stays at the start of the step until its end.
  if (ease === 'hold') return '(p) => (p < 1 ? 0 : 1)';
  if (typeof ease === 'string' && MOTION_EASE[ease]) return JSON.stringify(MOTION_EASE[ease]);
  return JSON.stringify(bezierOf(ease));
}

/** One Motion value per track, except the two that hold a pair: `translate` is `x` and `y`, `trim` a length and a start. */
function channels(track: Track): [string, (number | string)[]][] {
  const values = paddedKeys(track).map((key) => key.v);
  if (track.prop === 'translate') {
    return [
      ['x', values.map((v) => (v as Pair)[0])],
      ['y', values.map((v) => (v as Pair)[1])],
    ];
  }
  if (track.prop === 'trim') {
    return [
      ['pathLength', values.map((v) => Math.max(0, (v as Pair)[1] - (v as Pair)[0]))],
      ['pathOffset', values.map((v) => (v as Pair)[0])],
    ];
  }
  return [[track.prop === 'draw' ? 'pathLength' : track.prop, values as (number | string)[]]];
}

function transition(track: Track, clip: Clip): string {
  const keys = paddedKeys(track);
  const parts = [
    `duration: ${num(clip.duration / 1000)}`,
    `times: ${JSON.stringify(keys.map((key) => key.t))}`,
    `ease: [${keys.slice(0, -1).map((key) => motionEase(key.ease)).join(', ')}]`,
  ];
  if (clip.delay) parts.push(`delay: ${num(clip.delay / 1000)}`);
  if (clip.trigger === 'loop') parts.push('repeat: Infinity');
  return `{ ${parts.join(', ')} }`;
}

function rest(node: IconNode): Record<string, number | string> {
  const [x, y] = node.translate ?? [0, 0];
  return {
    x,
    y,
    rotate: node.rotate ?? 0,
    scale: node.scale ?? 1,
    opacity: node.opacity ?? 1,
    pathLength: node.trim ? node.trim[1] - node.trim[0] : (node.draw ?? 1),
    pathOffset: node.trim?.[0] ?? 0,
  };
}

/** The name of the state in which nothing plays. A clip may already be called "rest". */
function restName(clips: Clip[]): string {
  return clips.some((clip) => clip.id === 'rest') ? 'atRest' : 'rest';
}

/** A clip id as the key of an object: bare when it can be, quoted when it holds a dash. */
function key(id: string): string {
  return /^[a-z][a-z0-9]*$/i.test(id) ? id : JSON.stringify(id);
}

/**
 * One variant per clip, and one for rest. A clip that does not move this node still names it, at rest:
 * a click that interrupts a hover brings back what the hover had moved.
 */
function variants(node: IconNode, clips: Clip[]): string {
  const base = rest(node) as Record<string, number | string | undefined>;
  const still = new Map<string, string>();
  const plays = new Map<string, string>();
  for (const clip of clips) {
    const play: string[] = [];
    const timing: string[] = [];
    for (const track of clip.tracks.filter((candidate) => candidate.node === node.id)) {
      for (const [name, values] of channels(track)) {
        const fallback = (node as unknown as Record<string, number | string | undefined>)[track.prop];
        still.set(name, `${name}: ${JSON.stringify(base[name] ?? fallback ?? values[0])}`);
        play.push(`${name}: ${JSON.stringify(values)}`);
        timing.push(`${name}: ${transition(track, clip)}`);
      }
    }
    if (play.length > 0) plays.set(clip.id, `{ ${play.join(', ')}, transition: { ${timing.join(', ')} } }`);
  }
  const atRest = `{ ${[...still.values()].join(', ')} }`;
  const named = clips.map((clip) => `${key(clip.id)}: ${plays.get(clip.id) ?? atRest}`);
  return `{ ${restName(clips)}: ${atRest}, ${named.join(', ')} }`;
}

function nodeJsx(doc: IconDoc, node: IconNode, clips: Clip[], prefix: string, depth: number): string {
  if (node.hidden) return '';
  const pad = '  '.repeat(depth);
  const moving = clips.some((clip) => clip.tracks.some((track) => track.node === node.id));
  const tag = moving ? `motion.${tagOf(node)}` : tagOf(node);
  let head = jsxAttrs([...geometry(node), ...paint(node, prefix), ['opacity', moving ? undefined : node.opacity]]);
  if (moving) {
    const [ox, oy] = originOf(doc, node);
    head += ` variants={${variants(node, clips)}}`;
    head += ` style={{ transformBox: 'view-box', transformOrigin: '${num(ox)}px ${num(oy)}px' }}`;
  } else {
    head += jsxAttrs([['transform', transformAttr(doc, node)]]);
  }
  if (node.type !== 'group') return `${pad}<${tag}${head} />\n`;
  const inner = node.children.map((child) => nodeJsx(doc, child, clips, prefix, depth + 1)).join('');
  return `${pad}<${tag}${head}>\n${inner}${pad}</${tag}>\n`;
}

/**
 * How the component goes from one clip to another. A loop or an entrance is what plays when nothing else
 * does. A hover plays while the pointer is there and nothing else is playing. A press plays whole, over
 * the hover: an action then gives way; a switch stays at the end of its way on until the next press, which
 * plays its way off.
 */
function wiring(clips: Clip[]): { state: string; props: string } {
  if (clips.length === 0) return { state: '', props: '' };
  const first = (trigger: Clip['trigger']): string | undefined => clips.find((clip) => clip.trigger === trigger)?.id;
  const quoted = (id: string | undefined): string => JSON.stringify(id);
  const [hover, click, on, off] = [first('hover'), first('click'), first('on'), first('off')];
  const idle = quoted(first('loop') ?? first('in') ?? restName(clips));
  const lines = [`initial=${quoted(restName(clips))}`];
  const pressed = on ?? click;
  if (hover === undefined && pressed === undefined) return { state: '', props: [...lines, `animate=${idle}`].map((line) => `\n      ${line}`).join('') };
  lines.push('animate={playing}');
  if (hover !== undefined) {
    const next = pressed === undefined ? quoted(hover) : `(now) => (now === ${idle} ? ${quoted(hover)} : now)`;
    lines.push(`onHoverStart={() => setPlaying(${next})}`);
    lines.push(`onHoverEnd={() => setPlaying((now) => (now === ${quoted(hover)} ? ${idle} : now))}`);
  }
  if (on !== undefined) {
    lines.push(`onTap={() => setPlaying((now) => (now === ${quoted(on)} ? ${quoted(off)} : ${quoted(on)}))}`);
    lines.push(`onAnimationComplete={(done) => done === ${quoted(off)} && setPlaying(${idle})}`);
  } else if (click !== undefined) {
    lines.push(`onTap={() => setPlaying(${quoted(click)})}`);
    lines.push(`onAnimationComplete={(done) => done === ${quoted(click)} && setPlaying(${idle})}`);
  }
  return { state: `  const [playing, setPlaying] = useState<string>(${idle});\n`, props: lines.map((line) => `\n      ${line}`).join('') };
}

/**
 * A React component built on `motion/react`, after animateicons. It carries every clip of the icon in one
 * manner, each on its trigger; with a clip named, that one alone.
 */
export function exportReact(source: IconDoc, clipId?: string, manner: Manner = 'subtle'): string {
  const doc = withOff(clipId === undefined ? forManner(source, manner) : source);
  const clips = clipId === undefined ? doc.clips : doc.clips.filter((clip) => clip.id === clipId);
  if (clipId !== undefined && clips.length === 0) throw new IconError('clip_not_found', `No clip with id "${clipId}".`);
  const name = componentName(doc.name);
  const prefix = `ni-${slug(doc.name)}-`;
  const { state, props } = wiring(clips);
  const stateful = state !== '';
  const body = doc.nodes.map((node) => nodeJsx(doc, node, clips, prefix, 2)).join('');
  const defaults = jsxAttrs(paint(doc.defaults ?? {}, prefix));
  return `'use client';

import { motion } from 'motion/react';
${stateful ? "import { useState } from 'react';\n" : ''}
export interface ${name}Props {
  size?: number;
  className?: string;
}

export function ${name}({ size = ${num(doc.mode === 'micro' ? doc.size : 64)}, className }: ${name}Props) {
${state}  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 ${num(doc.size)} ${num(doc.size)}"
      width={size}
      height={size}
      className={className}${defaults ? `\n     ${defaults}` : ''}${props}
    >
${body}    </motion.svg>
  );
}
`;
}
