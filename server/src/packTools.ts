import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { editPack, exportPage, forManner, IconError, MANNERS, MODES, newPack, reactionClip, REACTIONS, resolve, sample, sheet, type IconDoc, type Manner, type PackEdit, type Reaction } from '@netsuicon/core';
import { z } from 'zod';
import { guarded, harmony, packOutline, png, text } from './reply';
import type { Store } from './store';

const pack = z.string().describe('Name of the pack: lowercase letters, digits and dashes.');
const section = z.record(z.string(), z.unknown()).optional();

/** The pack in short, then what each of its icons does that the pack does not. */
function report(store: Store, name: string): string {
  const owner = store.readPack(name);
  const icons = store.all(name);
  return [packOutline(owner, icons.map((icon) => icon.name)), ...icons.map((icon) => harmony(icon, owner))].join('\n');
}

/** The icon at a moment of its clip for a reaction; as it is at rest when it has none. */
function at(doc: IconDoc, manner: Manner, reaction: Reaction, t: number | undefined): IconDoc {
  const clip = reactionClip(forManner(doc, manner), reaction);
  return t === undefined || clip === undefined ? doc : sample(doc, clip, t);
}

function registerWrite(server: McpServer, store: Store): void {
  server.registerTool(
    'create_pack',
    {
      description:
        'Creates a pack: the icons of one application, with the style, the palette and the motion they share. Only "name" and "mode" are needed; the rest starts from the usual values of the mode.',
      inputSchema: {
        name: pack,
        mode: z.enum(MODES),
        size: z.number().positive().optional().describe('Side of the view box of every icon, if not the usual one.'),
        brief: z.string().optional().describe('The application and its tone, in a sentence or two.'),
        style: section.describe('Inherited by every icon: {fill?, stroke?, strokeWidth?, linecap?, linejoin?}. A colour may be a "$name" of the palette.'),
        palette: z.record(z.string(), z.string()).optional().describe('Named colours, for instance {"ink":"#1b2a41","accent":"#f5a524"}.'),
        motion: section.describe('{feel?, ease?, manner?:"subtle"|"expressive", hover?:{duration?:[min,max] ms, maxTranslate?, maxRotate?, scale?:[min,max]}, click?:{the same}, expressive?:{hover?, click?}}.'),
      },
    },
    (args) =>
      guarded(() => {
        if (store.packExists(args.name)) throw new IconError('pack_exists', `A pack named "${args.name}" already exists.`);
        const { brief, style, palette, motion } = args;
        store.writePack(editPack(newPack(args.name, args.mode, args.size), { brief, style, palette, motion } as PackEdit));
        return text(report(store, args.name));
      }),
  );

  server.registerTool(
    'edit_pack',
    {
      description:
        'Changes the brief, the style, the palette or the motion of a pack. Every icon follows at once. Refused if an icon uses a colour that would be gone.',
      inputSchema: {
        pack,
        set: z.looseObject({}).describe('{brief?, style?:{...}, palette?:{...}, motion?:{...}}. A section is merged key by key, motion.hover and motion.click too; null removes a key.'),
      },
    },
    (args) =>
      guarded(() => {
        store.writePack(editPack(store.readPack(args.pack), args.set as PackEdit));
        return text(report(store, args.pack));
      }),
  );
}

function registerExport(server: McpServer, store: Store): void {
  server.registerTool(
    'export_pack',
    {
      description:
        'One self-contained HTML page with every icon of the pack alive: each reacts to the pointer over it and to a click. For showing the pack to someone, in a browser.',
      inputSchema: {
        pack,
        hint: z.string().optional().describe('A line under the title, in the language of the reader, for instance "Hover an icon, then click it".'),
        size: z.number().int().min(16).max(256).optional().describe('Side of an icon on the page in pixels. Default 72.'),
        manner: z.enum(MANNERS).optional().describe('Which manner the icons play in. Default: the one the pack uses.'),
      },
    },
    (args) =>
      guarded(() => {
        const owner = store.readPack(args.pack);
        const icons = store.all(args.pack).map((icon) => resolve(icon, owner));
        return text(exportPage(owner.name, [{ title: owner.name, icons }], { hint: args.hint, size: args.size, manner: args.manner ?? owner.motion.manner }));
      }),
  );
}

export function registerPacks(server: McpServer, store: Store): void {
  server.registerTool('get_pack', { description: 'The whole pack, as JSON, without its icons.', inputSchema: { pack } }, (args) =>
    guarded(() => text(JSON.stringify(store.readPack(args.pack)))),
  );

  server.registerTool(
    'look_pack',
    {
      description:
        'Every icon of the pack side by side in one PNG, in alphabetical order, then what each one does that the pack does not. Use it to judge whether the icons belong together. With "t", every icon is shown at that moment of its hover clip, or with "trigger": "click" of what a press plays (its click clip, or its way on if it switches; "t": 1 then shows every switch on), to compare how they move.',
      inputSchema: {
        pack,
        width: z.number().int().min(64).max(2048).optional().describe('Width of the image in pixels. Default 768.'),
        columns: z.number().int().min(1).max(12).optional().describe('Icons per row. Default: as square as it gets.'),
        t: z.number().min(0).max(1).optional().describe('Moment, 0 to 1, of one reaction of each icon. Left out: at rest.'),
        trigger: z.enum(REACTIONS).optional().describe('With "t": which reaction. Default hover.'),
        manner: z.enum(MANNERS).optional().describe('With "t": which manner. Default: the one the pack uses.'),
        background: z.string().optional().describe('CSS colour behind the icons. Default white. "none" for transparent.'),
        ink: z.string().optional().describe('CSS colour that currentColor is drawn with. Default black.'),
      },
    },
    (args) =>
      guarded(() => {
        const owner = store.readPack(args.pack);
        const manner = args.manner ?? owner.motion.manner ?? 'subtle';
        const icons = store.all(args.pack).map((icon) => at(resolve(icon, owner), manner, args.trigger ?? 'hover', args.t));
        if (icons.length === 0) throw new IconError('empty_pack', `Pack "${args.pack}" has no icon yet. Add one with create_icon.`);
        const background = args.background === 'none' ? undefined : (args.background ?? '#ffffff');
        const data = png(sheet(icons, { ink: args.ink, columns: args.columns }), args.width ?? 768, background).toString('base64');
        return { content: [{ type: 'image', data, mimeType: 'image/png' }, { type: 'text', text: report(store, args.pack) }] };
      }),
  );

  registerWrite(server, store);
  registerExport(server, store);
}
