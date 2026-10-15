import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { appFindingText, appLint, IconError, likeness, markMeasures, onPlatform, proof, type IconDoc } from '@netsuicon/core';
import { z } from 'zod';
import { appFiles } from './appExport';
import { MISSING, type Library } from './library';
import { searchLibrary, SEARCH_SHAPE } from './librarySearch';
import { dataUrl, iconPrint, markContrast, pngOf } from './pictures';
import { guarded, text } from './reply';
import type { Store } from './store';

const name = z.string().describe('Name of the icon: lowercase letters, digits and dashes.');
const pack = z.string().optional().describe('Name of the pack the icon is in. Leave out for an icon outside the packs.');

/** How many logos of the library a proof names. */
const NEIGHBOURS = 3;

function appDoc(store: Store, icon: string, owner: string | undefined): IconDoc {
  const doc = store.drawn(icon, owner);
  if (doc.mode !== 'app') throw new IconError('not_app', `"${icon}" is an interface icon (mode ${doc.mode}): this tool is for application icons.`);
  return doc;
}

/** The checks of an application icon in a few lines: what edit_icon adds to its answer. */
export function appAdvice(doc: IconDoc): string {
  const findings = appLint(doc);
  if (doc.mode !== 'app' || doc.nodes.length === 0) return '';
  if (findings.length === 0) return 'app checks: none failed.';
  return ['app checks (advice; the icon is saved):', ...findings.map((finding) => `  ${appFindingText(finding)}`)].join('\n');
}

/** The logos of the library whose shape is closest to the mark, most alike first. */
function closest(library: Library, doc: IconDoc): { file: string; score: number }[] {
  const mine = iconPrint(doc);
  return [...library.prints()]
    .map(([file, print]) => ({ file, score: likeness(mine, print) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, NEIGHBOURS);
}

function runProof(store: Store, library: Library, icon: string, owner: string | undefined) {
  const doc = appDoc(store, icon, owner);
  const near = library.ready() ? closest(library, doc) : [];
  const pixels: [string, string] = [dataUrl(pngOf(onPlatform(doc, 'ios'), 32)), dataUrl(pngOf(onPlatform(doc, 'ios'), 16))];
  const neighbours = near.map(({ file }) => dataUrl(pngOf(library.svg(file), 128, '#ffffff')));
  const sheet = proof(doc, { pixels, neighbours });
  const alike = near.map(({ file, score }) => `${file} ${score.toFixed(2)}`).join(', ');
  const said = [
    sheet.legend,
    markMeasures(doc),
    `contrast of the mark on its background: ${markContrast(doc).toFixed(1)}:1 (under 3:1 it fades without colour and on small screens)`,
    appAdvice(doc),
    library.ready() ? `library, most alike in shape (0 to 1; 0.6 or more is as close as that logo drawn again: change the silhouette): ${alike}` : `library: ${MISSING}`,
  ].join('\n');
  return { content: [{ type: 'image' as const, data: pngOf(sheet.svg, sheet.width, '#ffffff').toString('base64'), mimeType: 'image/png' }, { type: 'text' as const, text: said }] };
}

export function registerApp(server: McpServer, store: Store, library: Library): void {
  server.registerTool(
    'proof',
    {
      description:
        'An application icon put to the test, in one picture: as iOS, macOS and Android cut it, on a dark screen, without colour, blurred, in two tones, at 64, 32 and 16 px, and beside the three logos of the library it looks most like. Then the checks that failed, and how alike those logos are.',
      inputSchema: { name, pack },
    },
    (args) => guarded(() => runProof(store, library, args.name, args.pack)),
  );

  server.registerTool(
    'search_library',
    {
      description:
        'Searches 1,432 real logos, classified by type, technique, subject, industry, colour and mood: to see what a category looks like and avoid it, to study how a technique is built, and to make sure an idea is not taken. Trademarks of their owners: study them, never copy them. Filters combine; with none, the values each filter takes.',
      inputSchema: SEARCH_SHAPE,
    },
    (args) => guarded(() => searchLibrary(library, args)),
  );

  server.registerTool(
    'export_app',
    {
      description:
        'Writes every file an application needs for this icon, at rest: iOS (1024 px), macOS (.icns), Windows (.ico), Android (adaptive layers and themed), the web (favicons, manifest). Answers the folder and the files.',
      inputSchema: { name, pack },
    },
    (args) =>
      guarded(() => {
        const doc = appDoc(store, args.name, args.pack);
        const files = appFiles(doc);
        const folder = store.writeExport(doc.name, files);
        return text([`Written in ${folder} (git-ignored):`, ...[...files.keys()].map((file) => `  ${file}`)].join('\n'));
      }),
  );
}
