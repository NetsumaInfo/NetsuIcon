import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { applyOps, exportCss, exportReact, forManner, IconError, keyMoments, MANNERS, MODES, newDoc, newDocIn, OP_NAMES, sample, sheet, toSvg, type IconDoc, type Op } from '@netsuicon/core';
import { z } from 'zod';
import { GUIDE } from './guide';
import { registerPacks } from './packTools';
import { guarded, harmony, outline, packOutline, png, text } from './reply';
import { LANGUAGES, type Store } from './store';

const name = z.string().describe('Name of the icon: lowercase letters, digits and dashes.');
const pack = z.string().optional().describe('Name of the pack the icon is in. Leave out for an icon outside the packs.');

/** The outline of an icon and, in a pack, what it does that the pack does not. */
function after(store: Store, icon: string, owner: string | undefined): string {
  const doc = store.read(icon, owner);
  return owner === undefined ? outline(doc) : `${outline(doc)}\n${harmony(doc, store.readPack(owner))}`;
}

/** The most frames one strip holds. */
const STRIP = 12;
/** The edge of the view box, drawn on every frame of a strip: what crosses it has left the icon. */
const EDGE = '#c8ccd4';

function evenly(frames: number): number[] {
  return Array.from({ length: frames }, (_, index) => Math.round((index / (frames - 1)) * 1000) / 1000);
}

/**
 * The moments a strip of frames shows. At the keys when they fit in a strip; when a clip has more keys than
 * that, evenly in time instead, so that no stretch of the clip is skipped, and `tooMany` says so.
 */
function moments(doc: IconDoc, clip: string, frames: number | 'keys'): { shown: number[]; tooMany: boolean } {
  if (frames !== 'keys') return { shown: evenly(frames), tooMany: false };
  const all = keyMoments(doc, clip);
  return all.length <= STRIP ? { shown: all, tooMany: false } : { shown: evenly(STRIP), tooMany: true };
}

/** Every clip of the icon as a row of frames at its key moments, in one picture: one look instead of one per clip. */
function everyClip(doc: IconDoc): { svg: string; columns: number; said: string } {
  const rows = doc.clips.map((clip) => ({ clip, ...moments(doc, clip.id, 'keys') }));
  const columns = Math.max(1, ...rows.map((row) => row.shown.length));
  const blank: IconDoc = { ...doc, nodes: [], clips: [] };
  const cells = rows.flatMap(({ clip, shown }) => [...shown.map((moment) => sample(doc, clip.id, moment)), ...Array<IconDoc>(columns - shown.length).fill(blank)]);
  const lines = rows.map(({ clip, shown, tooMany }, index) => `row ${index + 1}: ${clip.id} (${clip.trigger}${clip.manner ? `, ${clip.manner}` : ''}) at t = ${shown.join(', ')}${tooMany ? ' (more keys than frames: spread evenly in time)' : ''}`);
  return { svg: sheet(cells, { columns, outline: EDGE }), columns, said: `${lines.join('\n')}\nThe grey square is the edge of the view box.` };
}

/** Every pack and every icon in short; with `only`, that pack and its icons alone. */
function listing(store: Store, only: string | undefined): string {
  if (only !== undefined) store.readPack(only);
  const shelves = store.shelves().filter(({ pack: owner }) => only === undefined || owner.name === only);
  const packs = shelves.map(({ pack: owner, icons }) => [packOutline(owner, icons.map((icon) => icon.name)), ...icons.map(outline)].join('\n\n'));
  const loose = only === undefined ? store.all().map(outline) : [];
  const said = [...packs, ...loose].join('\n\n') || 'No icon yet. Create one with create_icon, or a pack with create_pack.';
  return `app language: ${store.language()}\n\n${said}`;
}

/** What get_icon sends of the clips: all of them, those of one manner, or their ids without their tracks. */
const CLIPS = ['ids', ...MANNERS] as const;

function partOf(doc: IconDoc, clips: (typeof CLIPS)[number] | undefined): unknown {
  if (clips === undefined) return doc;
  if (clips !== 'ids') return forManner(doc, clips);
  return { ...doc, clips: doc.clips.map(({ id, trigger, manner, duration }) => ({ id, trigger, manner, duration })) };
}

function registerRead(server: McpServer, store: Store): void {
  server.registerTool('guide', { description: 'The document format, the ops, the packs and advice for drawing and animating. Read it once before editing.' }, () => text(GUIDE));

  server.registerTool(
    'list_icons',
    {
      description: 'The packs with their rules, and every icon with its nodes and clips in short.',
      inputSchema: { pack: z.string().optional().describe('One pack alone: its rules and its icons.') },
    },
    (args) => guarded(() => text(listing(store, args.pack))),
  );

  server.registerTool(
    'get_icon',
    {
      description: 'The document of an icon, as JSON, as it is stored.',
      inputSchema: {
        name,
        pack,
        clips: z
          .enum(CLIPS)
          .optional()
          .describe('"ids": the clips without their tracks, enough to add clips to the nodes. "subtle" or "expressive": the clips of that manner alone. Default: everything.'),
      },
    },
    (args) => guarded(() => text(JSON.stringify(partOf(store.read(args.name, args.pack), args.clips)))),
  );

  server.registerTool(
    'look',
    {
      description: 'The icon as a PNG: at rest, at one moment of a clip, or at several side by side. currentColor is drawn black.',
      inputSchema: {
        name,
        pack,
        clip: z.string().optional().describe('Id of a clip to freeze. "*": every clip of the icon, one row each, at its key moments: the cheapest way to check an icon.'),
        t: z.number().min(0).max(1).optional().describe('Moment of the clip, 0 to 1. Default 0.5.'),
        frames: z
          .union([z.number().int().min(2).max(STRIP), z.literal('keys')])
          .optional()
          .describe(`Instead of "t": several moments of the clip in a row, ${STRIP} at most. A number spreads them evenly; "keys" takes the moments where a key sits, so no extreme is missed.`),
        width: z.number().int().min(16).max(2048).optional().describe('Width of the image in pixels. Default 256, or 160 per frame.'),
        background: z.string().optional().describe('CSS colour behind the icon. Default white. "none" for transparent.'),
      },
    },
    (args) =>
      guarded(() => {
        const doc = store.drawn(args.name, args.pack);
        const background = args.background === 'none' ? undefined : (args.background ?? '#ffffff');
        if (args.clip === '*') {
          if (doc.clips.length === 0) throw new IconError('clip_not_found', `"${args.name}" has no clip yet.`);
          const all = everyClip(doc);
          return { content: [{ type: 'image', data: png(all.svg, args.width ?? all.columns * 120, background).toString('base64'), mimeType: 'image/png' }, { type: 'text', text: all.said }] };
        }
        if (args.clip === undefined || args.frames === undefined) {
          // One moment of a clip is drawn with the edge of the view box, like a strip: what crosses it has left.
          const still = args.clip === undefined ? toSvg(doc) : sheet([sample(doc, args.clip, args.t ?? 0.5)], { columns: 1, outline: EDGE });
          return { content: [{ type: 'image', data: png(still, args.width ?? 256, background).toString('base64'), mimeType: 'image/png' }] };
        }
        const clip = args.clip;
        const { shown, tooMany } = moments(doc, clip, args.frames);
        const strip = sheet(shown.map((moment) => sample(doc, clip, moment)), { columns: shown.length, outline: EDGE });
        const missing = tooMany ? ' This clip has more keys than a strip holds: the frames are spread evenly in time instead.' : '';
        const said = `Frames, left to right, at t = ${shown.join(', ')}. The grey square is the edge of the view box.${missing}`;
        return { content: [{ type: 'image', data: png(strip, args.width ?? shown.length * 160, background).toString('base64'), mimeType: 'image/png' }, { type: 'text', text: said }] };
      }),
  );

  server.registerTool(
    'export_icon',
    {
      description:
        'The code of the icon, in one of its two manners. "svg": one animated SVG with CSS keyframes, no script, to inline in a page. "react": a component on motion/react. "still": a plain SVG without animation. In a pack, the style and the colours of the pack are written in.',
      inputSchema: {
        name,
        pack,
        format: z.enum(['svg', 'react', 'still']),
        manner: z.enum(MANNERS).optional().describe('Which manner to write. Default: the one the pack uses, or subtle.'),
        clip: z.string().optional().describe('For "react": one clip alone. Default: every clip of the manner.'),
      },
    },
    (args) =>
      guarded(() => {
        const doc = store.drawn(args.name, args.pack);
        const manner = args.manner ?? (args.pack === undefined ? undefined : store.readPack(args.pack).motion.manner) ?? 'subtle';
        if (args.format === 'react') return text(exportReact(doc, args.clip, manner));
        return text(args.format === 'svg' ? exportCss(doc, { manner }) : toSvg(doc));
      }),
  );
}

function registerWrite(server: McpServer, store: Store): void {
  server.registerTool(
    'create_icon',
    {
      description:
        'Creates an empty icon. In a pack it takes the mode, the view box and the style of the pack. Outside, "mode" is needed: "micro" is an interface icon, view box 24, stroked; "app" is an application icon, view box 1024.',
      inputSchema: {
        name,
        pack,
        mode: z.enum(MODES).optional(),
        size: z.number().positive().optional().describe('Side of the view box, if not the usual one. Not used in a pack.'),
      },
    },
    (args) =>
      guarded(() => {
        if (store.exists(args.name, args.pack)) throw new IconError('icon_exists', `An icon named "${args.name}" already exists.`);
        if (args.pack === undefined && args.mode === undefined) throw new IconError('bad_mode', `Outside a pack, create_icon needs "mode": ${MODES.join(' or ')}.`);
        const doc = args.pack === undefined ? newDoc(args.name, args.mode!, args.size) : newDocIn(store.readPack(args.pack), args.name);
        store.write(doc, args.pack);
        return text(after(store, args.name, args.pack));
      }),
  );

  server.registerTool(
    'edit_icon',
    {
      description: `Applies a list of ops to an icon, in order, all or nothing. Ops: ${OP_NAMES.join(', ')}. Their fields are in the guide. In a pack, the answer also says where the icon departs from the pack.`,
      inputSchema: {
        name,
        pack,
        ops: z.array(z.looseObject({ op: z.enum(OP_NAMES) })).min(1).describe('The edits, for instance [{"op":"update_node","id":"body","set":{"stroke":"#ff0000"}}].'),
      },
    },
    (args) =>
      guarded(() => {
        store.write(applyOps(store.read(args.name, args.pack), args.ops as unknown as Op[]), args.pack);
        return text(after(store, args.name, args.pack));
      }),
  );
}

function registerApp(server: McpServer, store: Store): void {
  server.registerTool(
    'set_language',
    {
      description: `The language of the app the user watches: ${LANGUAGES.join(' or ')}. It starts in English. Call it once, with the language the user writes to you in, when that is not the one it shows.`,
      inputSchema: { language: z.string().describe(`One of: ${LANGUAGES.join(', ')}.`) },
    },
    (args) => guarded(() => text(`The app is now in "${store.setLanguage(args.language)}".`)),
  );
}

export function buildServer(store: Store): McpServer {
  const server = new McpServer({ name: 'netsuicon', version: '0.0.1' }, { instructions: GUIDE });
  registerRead(server, store);
  registerWrite(server, store);
  registerPacks(server, store);
  registerApp(server, store);
  return server;
}
