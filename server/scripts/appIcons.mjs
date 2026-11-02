// Writes the application icons of NetsuRush and NetsuBoard: the mascot whole, the same head in both,
// one symbol behind it. Transparent. The format of .nicon.json cannot hold the mascot's blur, so these
// two icons live here and not in icons/.
// Usage: node server/scripts/appIcons.mjs   (from the repository root)
import fs from 'node:fs';

const K = '#03070c', YE = '#ffd23d', WH = '#f4f7fb', PINK = '#ff4f8b', CORAL = '#ff7a3d';
const src = fs.readFileSync('mascot/netsu-mascot.svg', 'utf8');
const mascot = `<symbol id="m" viewBox="0 0 256 256" overflow="visible">${src.slice(src.indexOf('>') + 1, src.lastIndexOf('</svg>'))}</symbol>`;

const SCALE = 3.4;
const head = `<use href="#m" xlink:href="#m" width="256" height="256" transform="translate(${512 - 124 * SCALE} ${930 - 215 * SCALE}) scale(${SCALE})"/>`;

function film(y, h, rot) {
  const holes = Array.from({ length: 9 }, (_, i) => [y + 22, y + h - 66].map(hy => `<rect x="${-20 + i * 122}" y="${hy}" width="70" height="44" rx="10" fill="${WH}"/>`).join('')).join('');
  const frames = [0, 1, 2].map(i => `<rect x="${-10 + i * 360}" y="${y + 90}" width="320" height="${h - 180}" rx="18" fill="${YE}"/>`).join('');
  return `<g transform="rotate(${rot} 512 ${y + h / 2})"><rect x="-80" y="${y}" width="1184" height="${h}" fill="${K}"/>${holes}${frames}</g>`;
}
const polaroid = (cx, cy, r, img) => `<g transform="rotate(${r} ${cx} ${cy})"><rect x="${cx - 230}" y="${cy - 230}" width="460" height="500" rx="26" fill="${WH}" stroke="${K}" stroke-width="18"/><rect x="${cx - 190}" y="${cy - 190}" width="380" height="330" rx="10" fill="${img}"/></g>`;
const thread = 'M215 70 Q512 230 810 70';

const icons = {
  netsurush: film(40, 420, -7),
  netsuboard: `<path d="${thread}" fill="none" stroke="${K}" stroke-width="56" stroke-linecap="round"/><path d="${thread}" fill="none" stroke="${YE}" stroke-width="34" stroke-linecap="round"/>`
    + polaroid(230, 300, -14, PINK) + polaroid(800, 300, 14, CORAL)
    + [215, 810].map(x => `<circle cx="${x}" cy="70" r="52" fill="${YE}" stroke="${K}" stroke-width="16"/>`).join(''),
};
for (const [name, symbol] of Object.entries(icons)) {
  fs.writeFileSync(`mascot/${name}-app-icon.svg`, `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1024 1024" width="1024" height="1024"><defs>${mascot}</defs>${symbol}${head}</svg>\n`);
}
