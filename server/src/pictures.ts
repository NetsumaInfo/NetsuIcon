import { Resvg } from '@resvg/resvg-js';
import { fingerprint, layers, toSvg, type IconDoc } from '@netsuicon/core';

/** Side at which a shape is drawn before its print is taken. */
const SIDE = 128;

interface Pixels {
  rgba: Uint8Array;
  width: number;
  height: number;
}

/** An SVG drawn so that its longer side has `side` pixels. */
function draw(svg: string, side: number, background?: string): Resvg {
  // No text is drawn: loading the system's fonts would cost a tenth of a second per picture.
  const probe = new Resvg(svg, { font: { loadSystemFonts: false } });
  const mode = probe.width >= probe.height ? 'width' : 'height';
  return new Resvg(svg, { fitTo: { mode, value: side }, background, font: { loadSystemFonts: false } });
}

function pixels(svg: string, side: number): Pixels {
  const image = draw(svg, side).render();
  return { rgba: new Uint8Array(image.pixels), width: image.width, height: image.height };
}

/** A PNG of any SVG, its longer side at `side` pixels. */
export function pngOf(svg: string, side: number, background?: string): Buffer {
  return Buffer.from(draw(svg, side, background).render().asPng());
}

export function dataUrl(png: Buffer): string {
  return `data:image/png;base64,${png.toString('base64')}`;
}

/** The ink of a logo: what is painted and not near white. A white part of a logo is a hole in it. */
export function logoPrint(svg: string): Uint8Array {
  const { rgba, width, height } = pixels(svg, SIDE);
  const ink = Array.from({ length: width * height }, (_, index) => {
    const [r, g, b, a] = [rgba[index * 4]!, rgba[index * 4 + 1]!, rgba[index * 4 + 2]!, rgba[index * 4 + 3]! / 255];
    const light = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    return light < 0.92 ? a : 0;
  });
  return fingerprint(ink, width, height);
}

/** Relative luminance of an sRGB colour, 0 to 1, as WCAG defines it. */
function luminance(r: number, g: number, b: number): number {
  const linear = (v: number): number => (v / 255 <= 0.04045 ? v / 255 / 12.92 : ((v / 255 + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

/** Pixels of the whole icon and of its background alone, and which ones the mark changes. */
function markPixels(doc: IconDoc): { whole: Pixels; behind: Pixels; ink: number[] } {
  const whole = pixels(toSvg(doc), SIDE);
  const behind = pixels(toSvg(layers(doc).background), SIDE);
  const ink = Array.from({ length: whole.width * whole.height }, (_, index) => {
    let gap = 0;
    for (let channel = 0; channel < 4; channel += 1) gap = Math.max(gap, Math.abs(whole.rgba[index * 4 + channel]! - behind.rgba[index * 4 + channel]!));
    return gap > 48 ? 1 : 0;
  });
  return { whole, behind, ink };
}

/** The contrast of the mark on its background, as WCAG measures text: mean luminance of each where the mark is. 1 when there is no mark. */
export function markContrast(doc: IconDoc): number {
  const { whole, behind, ink } = markPixels(doc);
  let [front, back, count] = [0, 0, 0];
  ink.forEach((on, index) => {
    if (!on) return;
    const at = index * 4;
    front += luminance(whole.rgba[at]!, whole.rgba[at + 1]!, whole.rgba[at + 2]!);
    back += luminance(behind.rgba[at]!, behind.rgba[at + 1]!, behind.rgba[at + 2]!);
    count += 1;
  });
  if (count === 0) return 1;
  const [a, b] = [front / count, back / count];
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/**
 * The ink of the mark of an application icon: where the whole icon differs from its background alone. A part
 * painted in the colour of the background, to cut the mark, is no ink.
 */
export function iconPrint(doc: IconDoc): Uint8Array {
  const { whole, ink } = markPixels(doc);
  return fingerprint(ink, whole.width, whole.height);
}
