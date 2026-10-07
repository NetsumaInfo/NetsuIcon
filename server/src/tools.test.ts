import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Store } from './store';
import { buildServer } from './tools';

interface Result {
  isError?: boolean;
  content: { type: string; text?: string; data?: string; mimeType?: string }[];
}

let dir: string;
let client: Client;

async function call(name: string, args: Record<string, unknown> = {}): Promise<Result> {
  return (await client.callTool({ name, arguments: args })) as Result;
}

beforeEach(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'netsuicon-'));
  const [near, far] = InMemoryTransport.createLinkedPair();
  await buildServer(new Store(dir)).connect(far);
  client = new Client({ name: 'test', version: '0' });
  await client.connect(near);
});

afterEach(async () => {
  await client.close();
  fs.rmSync(dir, { recursive: true, force: true });
});

describe('the MCP tools', () => {
  it('sends the guide as instructions and lists the tools', async () => {
    expect(client.getInstructions()).toContain('OPS (edit_icon)');
    const { tools } = await client.listTools();
    expect(tools.map((tool) => tool.name).sort()).toEqual([
      'create_icon',
      'create_pack',
      'edit_icon',
      'edit_pack',
      'export_icon',
      'export_pack',
      'get_icon',
      'get_pack',
      'guide',
      'list_icons',
      'look',
      'look_pack',
      'set_language',
    ]);
  });

  it('starts the app in English and lets the agent set its language', async () => {
    expect((await call('list_icons')).content[0]!.text).toContain('app language: en');
    expect((await call('set_language', { language: 'fr' })).content[0]!.text).toBe('The app is now in "fr".');
    expect(JSON.parse(fs.readFileSync(path.join(dir, 'settings.json'), 'utf8'))).toEqual({ language: 'fr' });
    expect((await call('list_icons')).content[0]!.text).toContain('app language: fr');
    expect((await call('set_language', { language: 'de' })).content[0]!.text).toContain('bad_language');
  });

  it('creates, edits, saves to disk and exports', async () => {
    await call('create_icon', { name: 'dot', mode: 'micro' });
    const edited = await call('edit_icon', {
      name: 'dot',
      ops: [
        { op: 'add_node', node: { type: 'circle', id: 'dot', cx: 12, cy: 12, r: 4 } },
        { op: 'set_clip', clip: { id: 'pulse', trigger: 'loop', duration: 900 } },
        { op: 'set_track', clip: 'pulse', node: 'dot', prop: 'scale', keys: [{ t: 0, v: 1 }, { t: 0.5, v: 1.3 }, { t: 1, v: 1 }] },
      ],
    });
    expect(edited.content[0]!.text).toContain('pulse (loop, 900 ms): dot');
    expect(fs.existsSync(path.join(dir, 'dot.nicon.json'))).toBe(true);
    const svg = await call('export_icon', { name: 'dot', format: 'svg' });
    expect(svg.content[0]!.text).toContain('@keyframes ni-dot-pulse-dot-scale');
    const react = await call('export_icon', { name: 'dot', format: 'react' });
    expect(react.content[0]!.text).toContain('repeat: Infinity');
  });

  it('returns an error the agent can fix, and saves nothing', async () => {
    await call('create_icon', { name: 'dot', mode: 'micro' });
    const result = await call('edit_icon', {
      name: 'dot',
      ops: [
        { op: 'add_node', node: { type: 'circle', id: 'dot', cx: 12, cy: 12, r: 4 } },
        { op: 'add_node', node: { type: 'circle', id: 'ring', cx: 12, cy: 12 } },
      ],
    });
    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toContain('op 1 (add_node)');
    expect((await call('get_icon', { name: 'dot' })).content[0]!.text).toContain('"nodes":[]');
    expect((await call('create_icon', { name: 'dot', mode: 'app' })).content[0]!.text).toContain('icon_exists');
  });

  it('shows the icon as a PNG, still or at a moment of a clip', async () => {
    await call('create_icon', { name: 'dot', mode: 'micro' });
    await call('edit_icon', { name: 'dot', ops: [{ op: 'add_node', node: { type: 'circle', id: 'dot', cx: 12, cy: 12, r: 4 } }] });
    const image = (await call('look', { name: 'dot', width: 64 })).content[0]!;
    expect(image.mimeType).toBe('image/png');
    expect(Buffer.from(image.data!, 'base64').subarray(1, 4).toString()).toBe('PNG');
    expect((await call('look', { name: 'dot', clip: 'nope' })).isError).toBe(true);
  });

  it('shows every clip of an icon in one picture, and writes the manner that is asked for', async () => {
    await call('create_icon', { name: 'dot', mode: 'micro' });
    const scale = (clip: string, top: number) => ({ op: 'set_track', clip, node: 'dot', prop: 'scale', keys: [{ t: 0, v: 1 }, { t: 0.5, v: top }, { t: 1, v: 1 }] });
    await call('edit_icon', {
      name: 'dot',
      ops: [
        { op: 'add_node', node: { type: 'circle', id: 'dot', cx: 12, cy: 12, r: 4 } },
        { op: 'set_clip', clip: { id: 'pulse', trigger: 'hover', duration: 400, manner: 'subtle' } },
        scale('pulse', 1.1),
        { op: 'set_clip', clip: { id: 'burst', trigger: 'hover', duration: 900, manner: 'expressive' } },
        scale('burst', 1.4),
      ],
    });
    const [image, said] = (await call('look', { name: 'dot', clip: '*' })).content;
    expect(image!.mimeType).toBe('image/png');
    expect(said!.text).toContain('row 1: pulse (hover, subtle) at t = 0, 0.5, 1');
    expect(said!.text).toContain('row 2: burst (hover, expressive) at t = 0, 0.5, 1');
    expect((await call('export_icon', { name: 'dot', format: 'svg' })).content[0]!.text).not.toContain('burst');
    expect((await call('export_icon', { name: 'dot', format: 'svg', manner: 'expressive' })).content[0]!.text).toContain('ni-dot-burst-dot-scale 900ms');
    expect((await call('list_icons')).content[0]!.text).toContain('burst (hover, expressive, 900 ms): dot');
    const ids = (await call('get_icon', { name: 'dot', clips: 'ids' })).content[0]!.text;
    expect(ids).toContain('"id":"burst"');
    expect(ids).not.toContain('"tracks"');
    expect((await call('get_icon', { name: 'dot', clips: 'subtle' })).content[0]!.text).not.toContain('burst');
  });

  it('shows a clip from start to end as one strip of frames', async () => {
    await call('create_icon', { name: 'dot', mode: 'micro' });
    await call('edit_icon', {
      name: 'dot',
      ops: [
        { op: 'add_node', node: { type: 'circle', id: 'dot', cx: 12, cy: 12, r: 4 } },
        { op: 'set_clip', clip: { id: 'pulse', trigger: 'hover', duration: 600 } },
        { op: 'set_track', clip: 'pulse', node: 'dot', prop: 'scale', keys: [{ t: 0, v: 1 }, { t: 0.5, v: 1.3 }, { t: 1, v: 1 }] },
      ],
    });
    const looked = await call('look', { name: 'dot', clip: 'pulse', frames: 4 });
    expect(looked.content[1]!.text).toContain('at t = 0, 0.333, 0.667, 1.');
    // At the keys: the start, the peak and the end, and nothing between.
    const atKeys = (await call('look', { name: 'dot', clip: 'pulse', frames: 'keys' })).content[1]!.text!;
    expect(atKeys).toContain('at t = 0, 0.5, 1.');
    expect(atKeys).not.toContain('not shown');
    const strip = Buffer.from(looked.content[0]!.data!, 'base64');
    // A PNG states its width and height at bytes 16 and 20: four cells and five gaps wide, one cell and two gaps high.
    expect(strip.readUInt32BE(16)).toBe(640);
    expect(strip.readUInt32BE(20)).toBe(Math.round((640 * 144) / 504));
  });
});

describe('the pack tools', () => {
  const METEO = {
    name: 'meteo',
    mode: 'micro',
    brief: 'A weather app, calm.',
    style: { stroke: '$ink', strokeWidth: 1.5 },
    palette: { ink: '#1b2a41', sun: '#f5a524' },
    motion: { feel: 'slow and soft', hover: { duration: [400, 900] } },
  };
  const DISC = { op: 'add_node', node: { type: 'circle', id: 'disc', cx: 12, cy: 12, r: 4, stroke: '$sun' } };

  it('creates a pack and an icon that takes its frame, its style and its colours', async () => {
    const made = await call('create_pack', METEO);
    expect(made.content[0]!.text).toContain('palette: $ink #1b2a41, $sun #f5a524');
    expect(made.content[0]!.text).toContain('feel: slow and soft\n  ease: "ease-in-out"\n  manner in use: subtle\n  hover: 400 to 900 ms, at most 2 units and 20 degrees, scale 0.9 to 1.1\n  click: 400 to 900 ms, at most 6 units');
    expect(made.content[0]!.text).toContain('expressive click: 800 to 1800 ms, at most 36 units and 360 degrees');
    await call('create_icon', { name: 'sun', pack: 'meteo' });
    const edited = await call('edit_icon', { name: 'sun', pack: 'meteo', ops: [DISC] });
    expect(edited.content[0]!.text).toContain('sun: fits pack "meteo".');
    expect(fs.existsSync(path.join(dir, 'meteo', 'sun.nicon.json'))).toBe(true);
    expect((await call('get_icon', { name: 'sun', pack: 'meteo' })).content[0]!.text).toContain('"stroke":"$sun"');
    const still = (await call('export_icon', { name: 'sun', pack: 'meteo', format: 'still' })).content[0]!.text;
    expect(still).toContain('stroke="#1b2a41" stroke-width="1.5"');
    expect(still).toContain('stroke="#f5a524"');
    expect((await call('list_icons')).content[0]!.text).toContain('pack meteo: micro, view box 24 — A weather app, calm.');
    await call('create_icon', { name: 'loose', mode: 'micro' });
    const one = (await call('list_icons', { pack: 'meteo' })).content[0]!.text;
    expect(one).toContain('sun: micro');
    expect(one).not.toContain('loose');
    expect((await call('list_icons', { pack: 'nope' })).content[0]!.text).toContain('pack_not_found');
  });

  it('keeps the icons of a pack apart from the others', async () => {
    await call('create_pack', METEO);
    await call('create_icon', { name: 'sun', pack: 'meteo' });
    expect((await call('get_icon', { name: 'sun' })).content[0]!.text).toContain('icon_not_found');
    expect((await call('create_icon', { name: 'sun' })).content[0]!.text).toContain('bad_mode');
    expect((await call('create_icon', { name: 'sun', pack: 'nope' })).content[0]!.text).toContain('pack_not_found');
    expect((await call('create_pack', METEO)).content[0]!.text).toContain('pack_exists');
  });

  it('tells where an icon departs from the pack, and refuses a colour the palette lacks', async () => {
    await call('create_pack', METEO);
    await call('create_icon', { name: 'sun', pack: 'meteo' });
    const loud = await call('edit_icon', { name: 'sun', pack: 'meteo', ops: [{ op: 'add_node', node: { ...DISC.node, stroke: '#ff00ff', strokeWidth: 3 } }] });
    expect(loud.isError).toBeUndefined();
    expect(loud.content[0]!.text).toContain('node "disc" stroke: #ff00ff is not a colour of the palette. Use $ink, $sun.');
    expect(loud.content[0]!.text).toContain('strokeWidth is 3; the pack draws with 1.5.');
    const lost = await call('edit_icon', { name: 'sun', pack: 'meteo', ops: [{ op: 'update_node', id: 'disc', set: { stroke: '$rain' } }] });
    expect(lost.isError).toBe(true);
    expect(lost.content[0]!.text).toContain('unknown_token');
  });

  it('restyles every icon when the pack changes, unless an icon would lose a colour', async () => {
    await call('create_pack', METEO);
    await call('create_icon', { name: 'sun', pack: 'meteo' });
    await call('edit_icon', { name: 'sun', pack: 'meteo', ops: [DISC] });
    await call('edit_pack', { pack: 'meteo', set: { palette: { sun: '#c4b5fd' }, style: { strokeWidth: 2 } } });
    const still = (await call('export_icon', { name: 'sun', pack: 'meteo', format: 'still' })).content[0]!.text;
    expect(still).toContain('stroke="#c4b5fd"');
    expect(still).toContain('stroke-width="2"');
    const gone = await call('edit_pack', { pack: 'meteo', set: { palette: { sun: null } } });
    expect(gone.content[0]!.text).toContain('unknown_token: icon "sun"');
    expect((await call('get_pack', { pack: 'meteo' })).content[0]!.text).toContain('"sun":"#c4b5fd"');
  });

  it('exports the pack as one page where every icon is alive', async () => {
    await call('create_pack', METEO);
    await call('create_icon', { name: 'sun', pack: 'meteo' });
    await call('edit_icon', {
      name: 'sun',
      pack: 'meteo',
      ops: [DISC, { op: 'set_clip', clip: { id: 'burst', trigger: 'click', duration: 500 } }, { op: 'set_track', clip: 'burst', node: 'disc', prop: 'scale', keys: [{ t: 0, v: 1 }, { t: 0.5, v: 1.2 }, { t: 1, v: 1 }] }],
    });
    const page = (await call('export_pack', { pack: 'meteo', hint: 'Survolez, puis cliquez.' })).content[0]!.text!;
    expect(page).toContain('<p>Survolez, puis cliquez.</p>');
    expect(page).toContain('class="ni-meteo-sun" data-click="burst"');
    expect(page).toContain('stroke="#f5a524"');
    expect(page).toContain('function niReact(svg)');
  });

  it('shows the whole pack as one PNG, with the advice', async () => {
    await call('create_pack', METEO);
    expect((await call('look_pack', { pack: 'meteo' })).content[0]!.text).toContain('empty_pack');
    for (const icon of ['sun', 'moon']) {
      await call('create_icon', { name: icon, pack: 'meteo' });
      await call('edit_icon', { name: icon, pack: 'meteo', ops: [DISC] });
    }
    const [image, advice] = (await call('look_pack', { pack: 'meteo', width: 256 })).content;
    expect(Buffer.from(image!.data!, 'base64').subarray(1, 4).toString()).toBe('PNG');
    expect(advice!.text).toContain('icons: moon, sun');
    // At a moment of each main clip: the icons without a clip stay as they are, and it is still one picture.
    const moving = (await call('look_pack', { pack: 'meteo', width: 256, t: 0.5, trigger: 'click' })).content[0]!;
    expect(moving.mimeType).toBe('image/png');
  });
});
