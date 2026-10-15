import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Library } from './library';
import { Store } from './store';
import { buildServer } from './tools';

interface Result {
  isError?: boolean;
  content: { type: string; text?: string; data?: string }[];
}

let dir: string;
let client: Client;
let library: Library;

async function call(name: string, args: Record<string, unknown> = {}): Promise<Result> {
  return (await client.callTool({ name, arguments: args })) as Result;
}

const said = (result: Result): string => result.content.find((part) => part.text !== undefined)?.text ?? '';

const LOGO = (subject: string, extra: object) => ({
  brand: subject, variant: 'main', aspect_class: 'square', n_colors: 1, color_families: ['blue'], primary_family: 'blue', gradients: 0,
  mark_type: 'pictorial', symbol_type: null, subject, geometry: ['circle'], techniques: ['negative-space'], mood: ['calm'],
  industry: 'weather', exemplary: false, note: null, ...extra,
});

/** A library of two logos: a disc and a square, enough to search and to compare. */
function fakeLibrary(at: string): void {
  fs.mkdirSync(path.join(at, 'svg'), { recursive: true });
  const disc = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="#1d4ed8"/></svg>';
  const square = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="10" y="10" width="80" height="80" fill="#000"/></svg>';
  fs.writeFileSync(path.join(at, 'svg', 'disc.svg'), disc);
  fs.writeFileSync(path.join(at, 'svg', 'block.svg'), square);
  const catalog = [{ file: 'disc.svg', ...LOGO('blue disc sun', { exemplary: true }) }, { file: 'block.svg', ...LOGO('black block', { mark_type: 'abstract', geometry: ['square'] }) }];
  fs.writeFileSync(path.join(at, 'catalog.json'), JSON.stringify(catalog));
}

const TILE = [
  { op: 'add_node', node: { type: 'rect', id: 'plate', x: 0, y: 0, width: 1024, height: 1024, fill: '#f59e0b' } },
  { op: 'add_node', node: { type: 'circle', id: 'sun', cx: 512, cy: 500, r: 240, fill: '#ffffff' } },
];

beforeEach(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'netsuicon-app-'));
  library = new Library(path.join(dir, 'library'));
  const [near, far] = InMemoryTransport.createLinkedPair();
  await buildServer(new Store(path.join(dir, 'icons')), library).connect(far);
  client = new Client({ name: 'test', version: '0' });
  await client.connect(near);
  await call('create_icon', { name: 'sun', mode: 'app' });
});

afterEach(async () => {
  await client.close();
  fs.rmSync(dir, { recursive: true, force: true });
});

describe('application icons', () => {
  it('adds the app checks to what edit_icon answers', async () => {
    expect(said(await call('create_icon', { name: 'blank', mode: 'app' }))).not.toContain('app checks');
    expect(said(await call('edit_icon', { name: 'sun', ops: [TILE[1]] }))).toContain('no background');
    expect(said(await call('edit_icon', { name: 'sun', ops: [{ ...TILE[0], index: 0 }] }))).toContain('app checks: none failed.');
  });

  it('proves an icon in one picture, and says the library is missing', async () => {
    await call('edit_icon', { name: 'sun', ops: TILE });
    const result = await call('proof', { name: 'sun' });
    expect(result.content[0]!.type).toBe('image');
    expect(said(result)).toContain('row 3: 32 px');
    expect(said(result)).toMatch(/mark: 480 × 480 .*\ncontrast of the mark on its background: 2\.1:1/);
    expect(said(result)).toContain('pnpm --filter @netsuicon/server library');
    await call('create_icon', { name: 'bell', mode: 'micro' });
    expect(said(await call('proof', { name: 'bell' }))).toMatch(/^not_app/);
  });

  it('names the logo of the library that a mark looks like', async () => {
    fakeLibrary(library.dir);
    const { logoPrint } = await import('./pictures');
    library.writePrints(new Map(['disc.svg', 'block.svg'].map((file) => [file, logoPrint(library.svg(file))])));
    await call('edit_icon', { name: 'sun', ops: TILE });
    const text = said(await call('proof', { name: 'sun' }));
    expect(text).toMatch(/disc\.svg 0\.[89]\d, block\.svg 0\.[0-5]\d/);
  });

  it('writes the files of every platform', async () => {
    await call('edit_icon', { name: 'sun', ops: TILE });
    const text = said(await call('export_app', { name: 'sun' }));
    const folder = path.join(dir, 'icons', 'exports', 'sun');
    expect(text).toContain('macos/AppIcon.icns');
    expect(fs.readFileSync(path.join(folder, 'macos', 'AppIcon.icns')).subarray(0, 4).toString()).toBe('icns');
    expect(fs.readFileSync(path.join(folder, 'windows', 'app.ico')).readUInt16LE(4)).toBe(7);
    expect(fs.existsSync(path.join(folder, 'android', 'mipmap-xxxhdpi', 'ic_launcher_monochrome.png'))).toBe(true);
    expect(JSON.parse(fs.readFileSync(path.join(folder, 'web', 'site.webmanifest'), 'utf8')).icons).toHaveLength(3);
  });
});

describe('the logo library', () => {
  it('says how to get it when it is missing', async () => {
    expect(said(await call('search_library', { subject: 'sun' }))).toMatch(/^no_library/);
  });

  it('searches, sums up, shows and reads logos', async () => {
    fakeLibrary(library.dir);
    expect(said(await call('search_library', {}))).toContain('type: pictorial 1, abstract 1');
    const found = said(await call('search_library', { subject: 'sun', colour: 'blue' }));
    expect(found).toContain('1 of 2 logos match');
    expect(found).toContain('* disc.svg — blue disc sun');
    expect(said(await call('search_library', { geometry: 'circle', summary: true }))).toContain('technique: negative-space 1');
    const shown = await call('search_library', { geometry: 'square', picture: true });
    expect(shown.content[0]!.type).toBe('image');
    expect(said(await call('search_library', { source: 'disc.svg' }))).toContain('<circle');
    expect(said(await call('search_library', { source: '../catalog.json' }))).toMatch(/^logo_not_found/);
  });
});
