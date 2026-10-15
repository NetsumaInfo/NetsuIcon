import { icns, ICNS_TYPES, ico, layers, onPlatform, silhouette, toSvg, type IconDoc, type Platform } from '@netsuicon/core';
import { pngOf } from './pictures';

/** The files of an application icon, by path inside its export folder. */
export type AppFiles = Map<string, Uint8Array | string>;

type Shape = Platform | 'round' | 'full';

function svgOf(doc: IconDoc, shape: Shape): string {
  return shape === 'full' ? toSvg(doc) : onPlatform(doc, shape);
}

function png(doc: IconDoc, shape: Shape, side: number): Buffer {
  // iOS and the stores refuse a transparent icon: the full square is laid on white, though it covers it.
  return pngOf(svgOf(doc, shape), side, shape === 'full' ? '#ffffff' : undefined);
}

function pngs(doc: IconDoc, shape: Shape, sides: number[]): { size: number; data: Uint8Array }[] {
  return sides.map((size) => ({ size, data: png(doc, shape, size) }));
}

const ADAPTIVE = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
  <background android:drawable="@mipmap/ic_launcher_background" />
  <foreground android:drawable="@mipmap/ic_launcher_foreground" />
  <monochrome android:drawable="@mipmap/ic_launcher_monochrome" />
</adaptive-icon>
`;

function apple(doc: IconDoc, files: AppFiles): void {
  files.set('ios/AppIcon-1024.png', png(doc, 'full', 1024));
  files.set('macos/AppIcon-1024.png', png(doc, 'macos', 1024));
  const sides = [...new Set(ICNS_TYPES.map(([, size]) => size))];
  files.set('macos/AppIcon.icns', icns(pngs(doc, 'macos', sides)));
}

function android(doc: IconDoc, files: AppFiles): void {
  const { background, mark } = layers(doc);
  // 432 pixels: the 108 units of an adaptive layer at xxxhdpi. The view box is those 108 units.
  files.set('android/mipmap-xxxhdpi/ic_launcher_background.png', pngOf(toSvg(background), 432));
  files.set('android/mipmap-xxxhdpi/ic_launcher_foreground.png', pngOf(toSvg(mark), 432));
  files.set('android/mipmap-xxxhdpi/ic_launcher_monochrome.png', pngOf(toSvg(silhouette(mark)), 432));
  files.set('android/mipmap-xxxhdpi/ic_launcher.png', png(doc, 'round', 192));
  files.set('android/mipmap-xxxhdpi/ic_launcher_round.png', png(doc, 'android', 192));
  files.set('android/mipmap-anydpi-v26/ic_launcher.xml', ADAPTIVE);
}

function web(doc: IconDoc, files: AppFiles, title: string): void {
  files.set('web/favicon.ico', ico(pngs(doc, 'round', [16, 32, 48])));
  files.set('web/favicon.svg', onPlatform(doc, 'round'));
  files.set('web/apple-touch-icon.png', png(doc, 'full', 180));
  files.set('web/icon-192.png', png(doc, 'round', 192));
  files.set('web/icon-512.png', png(doc, 'round', 512));
  files.set('web/maskable-512.png', png(doc, 'full', 512));
  const icons = [
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: '/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ];
  files.set('web/site.webmanifest', `${JSON.stringify({ name: title, short_name: title, icons }, null, 2)}\n`);
  files.set(
    'web/head.html',
    [
      '<link rel="icon" href="/favicon.ico" sizes="48x48">',
      '<link rel="icon" href="/favicon.svg" type="image/svg+xml">',
      '<link rel="apple-touch-icon" href="/apple-touch-icon.png">',
      '<link rel="manifest" href="/site.webmanifest">',
      '',
    ].join('\n'),
  );
}

/**
 * Every file an application needs for its icon on each platform, at rest: iOS, macOS (`.icns`), Windows (`.ico`),
 * Android (adaptive layers), the web (favicons, manifest). The animated icon is export_icon's.
 */
export function appFiles(doc: IconDoc): AppFiles {
  const files: AppFiles = new Map();
  apple(doc, files);
  files.set('windows/app.ico', ico(pngs(doc, 'round', [16, 24, 32, 48, 64, 128, 256])));
  android(doc, files);
  web(doc, files, doc.name);
  return files;
}
