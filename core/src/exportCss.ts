import { cssEase } from './ease';
import { animatedNodes, paddedKeys } from './keys';
import { forManner, withOff } from './clips';
import { dashAttrs, num, originOf, render, slug, trimDash, type Attr } from './svg';
import { mainClip } from './sample';
import type { AnimProp, Clip, IconDoc, IconNode, Manner, Pair, Track, Trigger, Value } from './types';

export interface CssOptions {
  /** A clip to run at once whatever its trigger: what a preview needs to replay a hover. */
  play?: string;
  /** Goes into the class and the names of the keyframes: two icons of the same name on one page need it. */
  scope?: string;
  /** Which of the two manners of the icon to write. Default: subtle. */
  manner?: Manner;
}

/** Later rules win over earlier ones of the same weight: a press must win over the hover it happens in. */
const RANK: Record<Trigger, number> = { loop: 0, in: 0, hover: 1, click: 2, on: 3, off: 3 };

function declaration(prop: AnimProp, value: Value): string {
  switch (prop) {
    case 'translate': {
      const [x, y] = value as Pair;
      return `translate:${num(x)}px ${num(y)}px`;
    }
    case 'rotate':
      return `rotate:${num(value as number)}deg`;
    case 'scale':
      return `scale:${num(value as number)}`;
    case 'opacity':
      return `opacity:${num(value as number)}`;
    case 'draw':
      return `stroke-dashoffset:${num(1 - (value as number))}`;
    case 'trim': {
      const { dash, offset } = trimDash(value as Pair);
      return `stroke-dasharray:${num(dash)} 2;stroke-dashoffset:${num(offset)}`;
    }
    case 'strokeWidth':
      return `stroke-width:${num(value as number)}`;
    default:
      return `${prop}:${String(value)}`;
  }
}

function keyframes(name: string, track: Track): string {
  const steps = paddedKeys(track).map((key) => {
    const ease = key.ease === undefined ? '' : `;animation-timing-function:${cssEase(key.ease)}`;
    return `${num(key.t * 100)}%{${declaration(track.prop, key.v)}${ease}}`;
  });
  return `@keyframes ${name}{${steps.join('')}}`;
}

/**
 * Where a clip plays. Hover and click need a pointer over the `<svg>` itself: they do nothing in an `<img>`.
 * `:active` lasts only while the button is down, so a page plays a whole click by setting `data-play` to the
 * id of the clip; the same rule lets a preview force any clip. A switch has no CSS of its own to hold a
 * state: the page sets `data-state` to "on", then to "off", and the clip plays and stays at its end.
 */
function scopes(root: string, clip: Clip): string[] {
  if (clip.trigger === 'hover') return [`.${root}:hover`];
  if (clip.trigger === 'click') return [`.${root}:active`];
  if (clip.trigger === 'on' || clip.trigger === 'off') return [`.${root}[data-state="${clip.trigger}"]`];
  return [`.${root}`];
}

function clipRules(root: string, clip: Clip): { frames: string[]; byTrigger: string[]; forced: string[]; quiet: string[] } {
  const frames: string[] = [];
  const perNode = new Map<string, string[]>();
  const repeat = clip.trigger === 'loop' ? 'infinite' : '1';
  for (const track of clip.tracks) {
    const name = `${root}-${clip.id}-${track.node}-${track.prop}`;
    frames.push(keyframes(name, track));
    const list = perNode.get(track.node) ?? [];
    list.push(`${name} ${num(clip.duration)}ms linear ${num(clip.delay ?? 0)}ms ${repeat} both`);
    perNode.set(track.node, list);
  }
  const nodes = [...perNode];
  const reaction = clip.trigger !== 'loop' && clip.trigger !== 'in';
  return {
    frames,
    byTrigger: nodes.flatMap(([node, list]) => scopes(root, clip).map((scope) => `${scope} .n-${node}{animation:${list.join(',')}}`)),
    forced: reaction ? nodes.map(([node, list]) => `.${root}[data-play~="${clip.id}"] .n-${node}{animation:${list.join(',')}}`) : [],
    // After a click played to its end the pointer is still there: the hover must not start again by itself.
    quiet: clip.trigger === 'hover' ? nodes.map(([node]) => `.${root}[data-quiet]:hover .n-${node}{animation:none}`) : [],
  };
}

function staticStyle(doc: IconDoc, node: IconNode, animated: boolean): string | undefined {
  const parts: string[] = [];
  if (node.translate) parts.push(declaration('translate', node.translate));
  if (node.rotate) parts.push(declaration('rotate', node.rotate));
  if (node.scale !== undefined && node.scale !== 1) parts.push(declaration('scale', node.scale));
  if (parts.length === 0 && !animated) return undefined;
  const [ox, oy] = originOf(doc, node);
  parts.push('transform-box:view-box', `transform-origin:${num(ox)}px ${num(oy)}px`);
  return parts.join(';');
}

/**
 * One self-contained animated SVG: the shapes, and a `<style>` of CSS keyframes. No script.
 * Meant to be inlined in a page; as a file it plays its `loop` and `in` clips only.
 * The root says what a press does, for the page that handles it: `data-click` names the clip of an action,
 * `data-switch` the way on of a switch.
 */
export function exportCss(source: IconDoc, options: CssOptions = {}): string {
  const doc = withOff(forManner(source, options.manner ?? 'subtle'));
  const root = options.scope === undefined ? `ni-${slug(doc.name)}` : `ni-${slug(options.scope)}-${slug(doc.name)}`;
  const animated = animatedNodes(doc.clips);
  const drawn = animatedNodes(doc.clips, 'draw');
  const trimmed = animatedNodes(doc.clips, 'trim');
  const ordered = [...doc.clips].sort((a, b) => RANK[a.trigger] - RANK[b.trigger]).map((clip) => clipRules(root, clip));
  const rules = [
    ...ordered.flatMap((clip) => clip.frames),
    ...ordered.flatMap((clip) => clip.byTrigger),
    ...ordered.flatMap((clip) => clip.quiet),
    ...ordered.flatMap((clip) => clip.forced),
    // Less motion asked for: nothing travels, and a switch still lands in its state.
    `@media (prefers-reduced-motion:reduce){.${root} *{animation-duration:1ms!important;animation-delay:0ms!important;animation-iteration-count:1!important}}`,
  ];
  return render(doc, {
    prefix: `${root}-`,
    root: [
      ['class', root],
      ['data-click', mainClip(doc, 'click')],
      ['data-switch', mainClip(doc, 'on')],
      ['data-play', options.play],
    ],
    head: doc.clips.length > 0 ? `<style>${rules.join('')}</style>` : '',
    node: (node): Attr[] => [
      ['class', animated.has(node.id) ? `n-${node.id}` : undefined],
      ['style', staticStyle(doc, node, animated.has(node.id))],
      ...dashAttrs(node, drawn.has(node.id), trimmed.has(node.id)),
    ],
  });
}
