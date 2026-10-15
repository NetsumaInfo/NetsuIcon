/** A PNG of a square icon, and its side in pixels. */
export interface Png {
  size: number;
  data: Uint8Array;
}

/** A Windows `.ico` holding PNGs, as Windows reads it since Vista: a header, a table, then the pictures. */
export function ico(pngs: Png[]): Uint8Array {
  const head = 6 + 16 * pngs.length;
  const out = new Uint8Array(head + pngs.reduce((total, png) => total + png.data.length, 0));
  const view = new DataView(out.buffer);
  view.setUint16(2, 1, true);
  view.setUint16(4, pngs.length, true);
  let offset = head;
  pngs.forEach((png, index) => {
    if (png.size > 256) throw new Error(`An .ico holds pictures of 256 pixels at most, not ${png.size}.`);
    const at = 6 + 16 * index;
    // 0 stands for 256: the field is one byte.
    out[at] = png.size % 256;
    out[at + 1] = png.size % 256;
    view.setUint16(at + 4, 1, true);
    view.setUint16(at + 6, 32, true);
    view.setUint32(at + 8, png.data.length, true);
    view.setUint32(at + 12, offset, true);
    out.set(png.data, offset);
    offset += png.data.length;
  });
  return out;
}

/** The entries of a macOS `.icns`, and the side of the PNG each holds. Retina entries share a side with plain ones. */
export const ICNS_TYPES: [string, number][] = [
  ['icp4', 16],
  ['ic11', 32],
  ['icp5', 32],
  ['ic12', 64],
  ['ic07', 128],
  ['ic13', 256],
  ['ic08', 256],
  ['ic14', 512],
  ['ic09', 512],
  ['ic10', 1024],
];

/** A macOS `.icns`: a header, then one entry per type, each a PNG. Needs a PNG of every side in ICNS_TYPES. */
export function icns(pngs: Png[]): Uint8Array {
  const entries = ICNS_TYPES.map(([type, size]) => {
    const png = pngs.find((one) => one.size === size);
    if (!png) throw new Error(`An .icns needs a PNG of ${size} pixels.`);
    return { type, data: png.data };
  });
  const total = 8 + entries.reduce((sum, entry) => sum + 8 + entry.data.length, 0);
  const out = new Uint8Array(total);
  const view = new DataView(out.buffer);
  const tag = (at: number, text: string): void => out.set([...text].map((c) => c.charCodeAt(0)), at);
  tag(0, 'icns');
  view.setUint32(4, total);
  let at = 8;
  for (const entry of entries) {
    tag(at, entry.type);
    view.setUint32(at + 4, 8 + entry.data.length);
    out.set(entry.data, at + 8);
    at += 8 + entry.data.length;
  }
  return out;
}
