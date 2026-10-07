import { exportCss } from './exportCss';
import { esc } from './svg';
import type { IconDoc, Manner } from './types';

/**
 * What a page adds to an animated SVG so that a press does its work, which CSS alone cannot.
 * An action (`data-click`): its clip is forced with `data-play` and plays to the end, where `:active` would
 * stop with the button. A switch (`data-switch`): `data-state` goes to "on" and stays; the next press sets
 * "off", and the attribute is taken away once the way back has played. In both cases `data-quiet` then keeps
 * the hover from starting again until the pointer has left. Plain JavaScript, no dependency.
 */
export const REACT_SCRIPT = `function niEnd(svg,mine){
  var end=0;
  svg.getAnimations({subtree:true}).forEach(function(a){
    var t=Number(a.effect.getComputedTiming().endTime);
    if(isFinite(t)&&String(a.animationName).indexOf(mine)===0)end=Math.max(end,t);
  });
  return end;
}
function niReact(svg){
  var root=svg.classList[0]+'-',id=svg.getAttribute('data-click');
  clearTimeout(svg.niTimer);svg.removeAttribute('data-quiet');
  if(svg.hasAttribute('data-switch')){
    var on=svg.getAttribute('data-state')==='on';
    svg.setAttribute('data-state',on?'off':'on');
    if(on)svg.niTimer=setTimeout(function(){svg.setAttribute('data-quiet','');svg.removeAttribute('data-state');},niEnd(svg,root));
    return;
  }
  if(!id)return;
  svg.removeAttribute('data-play');svg.getBoundingClientRect();svg.setAttribute('data-play',id);
  svg.niTimer=setTimeout(function(){svg.setAttribute('data-quiet','');svg.removeAttribute('data-play');},niEnd(svg,root+id+'-'));
}
document.addEventListener('click',function(e){var b=e.target.closest('[data-ni]');if(b)niReact(b.querySelector('svg'));});
document.addEventListener('pointerout',function(e){
  var b=e.target.closest('[data-ni]');
  if(b&&!b.contains(e.relatedTarget))b.querySelector('svg').removeAttribute('data-quiet');
});`;

export interface PageGroup {
  title: string;
  /** Icons as they are drawn: in a pack, already resolved. */
  icons: IconDoc[];
}

export interface PageOptions {
  /** A line under the title: how to try the icons, in the reader's language. */
  hint?: string;
  /** Side of an icon on the page, in pixels. Default 72. */
  size?: number;
  /** Which of the two manners the icons play in. Default: subtle. */
  manner?: Manner;
}

const STYLE = `:root{color-scheme:light dark;--bg:#f4f5f7;--fg:#16181d;--tile:#ffffff;--muted:#5c6170}
@media (prefers-color-scheme:dark){:root{--bg:#0a0b0e;--fg:#e3e4e8;--tile:#111319;--muted:#888d99}}
body{margin:0;padding:24px 16px;background:var(--bg);color:var(--fg);font:14px/1.4 system-ui,sans-serif}
h1{font-size:18px;margin:0 0 4px}h2{font-size:14px;font-weight:600;margin:28px 0 12px}p{margin:0;color:var(--muted)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:12px}
.tile{display:flex;flex-direction:column;align-items:center;gap:12px;padding:20px 8px 12px;border:0;border-radius:12px;
background:var(--tile);color:inherit;font:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}
.tile svg{display:block;width:var(--side);height:var(--side)}.tile span{color:var(--muted);font-size:12px}`;

/**
 * One self-contained page that shows icons alive: each reacts to the pointer over it and to a click.
 * For showing a pack to someone; the icons in it are the animated SVG of `exportCss`, untouched.
 */
export function exportPage(title: string, groups: PageGroup[], options: PageOptions = {}): string {
  const sections = groups.map((group) => {
    const tiles = group.icons.map((icon) => `<button type="button" class="tile" data-ni>${exportCss(icon, { scope: group.title, manner: options.manner })}<span>${esc(icon.name)}</span></button>`);
    return `<h2>${esc(group.title)}</h2><div class="grid">${tiles.join('')}</div>`;
  });
  const hint = options.hint === undefined ? '' : `<p>${esc(options.hint)}</p>`;
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><style>${STYLE}</style></head>
<body style="--side:${Math.round(options.size ?? 72)}px"><h1>${esc(title)}</h1>${hint}${sections.join('')}
<script>${REACT_SCRIPT}</script></body></html>
`;
}
