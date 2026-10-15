import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import type { Library, Logo } from './library';
import { dataUrl, pngOf } from './pictures';
import { text } from './reply';

const list = (what: string) => z.string().optional().describe(what);

export const SEARCH_SHAPE = {
  type: list('Type of mark: abstract, pictorial, letterform, lettermark, wordmark, combination, emblem, mascot.'),
  technique: list('A technique, e.g. negative-space, containment, line-monoline, modular-repetition, hidden-meaning, letter-substitution.'),
  geometry: list('A primitive, e.g. circle, square, rounded-square, triangle, hexagon, organic.'),
  subject: list('Words of what it shows, e.g. "bird", "leaf". Matched as written in the catalog, every word: try a synonym when nothing comes.'),
  industry: list('A field, e.g. developer-tools, payments-fintech, social-communication, media-entertainment, education.'),
  colour: list('A colour family: blue, red, green, orange, cyan, purple, yellow, pink, mono, multi.'),
  mood: list('A mood, e.g. playful, minimal, bold, friendly, technical.'),
  exemplary: z.boolean().optional().describe('Only the logos marked as well made.'),
  summary: z.boolean().optional().describe('Instead of the list: what the matches have in common, the conventions of a category.'),
  picture: z.boolean().optional().describe('Also the matches in one picture, in the order of the list.'),
  source: z.string().optional().describe('The SVG of one logo, by file name: to read how its geometry is built.'),
  limit: z.number().int().min(1).max(24).optional().describe('How many logos to list. Default 10.'),
};

interface Search {
  type?: string;
  technique?: string;
  geometry?: string;
  subject?: string;
  industry?: string;
  colour?: string;
  mood?: string;
  exemplary?: boolean;
  summary?: boolean;
  picture?: boolean;
  source?: string;
  limit?: number;
}

const has = (values: (string | null | undefined)[], wanted: string | undefined): boolean => wanted === undefined || values.some((value) => value?.toLowerCase() === wanted.toLowerCase());

function matches(logo: Logo, s: Search): boolean {
  const words = s.subject?.toLowerCase().split(/\s+/).filter(Boolean) ?? [];
  const about = `${logo.brand} ${logo.subject ?? ''} ${logo.note ?? ''}`.toLowerCase();
  return (
    has([logo.mark_type, logo.symbol_type], s.type) &&
    has(logo.techniques, s.technique) &&
    has(logo.geometry, s.geometry) &&
    has([logo.industry], s.industry) &&
    has([...logo.color_families, logo.primary_family], s.colour) &&
    has(logo.mood, s.mood) &&
    (!s.exemplary || logo.exemplary) &&
    words.every((word) => about.includes(word))
  );
}

/** The values a field takes among some logos, most frequent first, with their count. */
function counts(logos: Logo[], values: (logo: Logo) => (string | null)[], top: number): string {
  const tally = new Map<string, number>();
  for (const logo of logos) for (const value of values(logo)) if (value) tally.set(value, (tally.get(value) ?? 0) + 1);
  return [...tally].sort((a, b) => b[1] - a[1]).slice(0, top).map(([value, count]) => `${value} ${count}`).join(', ');
}

const FIELDS: [string, (logo: Logo) => (string | null)[], number][] = [
  ['type', (logo) => [logo.mark_type], 8],
  ['technique', (logo) => logo.techniques, 12],
  ['geometry', (logo) => logo.geometry, 10],
  ['colour', (logo) => [logo.primary_family], 10],
  ['mood', (logo) => logo.mood, 12],
];

function summary(found: Logo[]): string {
  const colours = found.map((logo) => logo.n_colors).sort((a, b) => a - b);
  const gradients = found.filter((logo) => logo.gradients > 0).length;
  return [
    ...FIELDS.map(([field, values, top]) => `${field}: ${counts(found, values, top)}`),
    `colours: median ${colours[Math.floor(colours.length / 2)] ?? 0}; gradients in ${Math.round((100 * gradients) / Math.max(1, found.length))}%`,
    `subjects: ${found.slice(0, 20).map((logo) => logo.subject).filter(Boolean).join('; ')}`,
  ].join('\n');
}

function line(logo: Logo): string {
  const how = [logo.mark_type, ...logo.techniques, ...logo.geometry].join(', ');
  return `${logo.exemplary ? '* ' : ''}${logo.file} — ${logo.subject ?? ''} (${how}; ${logo.industry ?? 'no field'})`;
}

function picture(library: Library, logos: Logo[]): string {
  const [cell, gap, columns] = [112, 12, 6];
  const rows = Math.ceil(logos.length / columns);
  const [width, height] = [columns * (cell + gap) + gap, rows * (cell + gap) + gap];
  const images = logos.map((logo, index) => {
    const [x, y] = [gap + (index % columns) * (cell + gap), gap + Math.floor(index / columns) * (cell + gap)];
    return `<image href="${dataUrl(pngOf(library.svg(logo.file), cell))}" x="${x}" y="${y}" width="${cell}" height="${cell}"/>`;
  });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${images.join('')}</svg>`;
  return pngOf(svg, width, '#ffffff').toString('base64');
}

export function searchLibrary(library: Library, s: Search): CallToolResult {
  if (s.source !== undefined) return text(library.svg(s.source).slice(0, 8000));
  const logos = library.catalog();
  const filtered = Object.entries(s).some(([key, value]) => value !== undefined && !['summary', 'picture', 'limit'].includes(key));
  if (!filtered) return text(`${logos.length} logos. Values, most frequent first:\n${FIELDS.map(([field, values]) => `${field}: ${counts(logos, values, 40)}`).join('\n')}\nindustry: ${counts(logos, (logo) => [logo.industry], 40)}`);
  const found = logos.filter((logo) => matches(logo, s));
  if (found.length === 0) return text('No logo matches. Fewer filters, or other words.');
  const head = `${found.length} of ${logos.length} logos match. * marks a well-made one. Trademarks: study, never copy.`;
  if (s.summary) return text(`${head}\n${summary(found)}`);
  const shown = [...found].sort((a, b) => Number(b.exemplary) - Number(a.exemplary)).slice(0, s.limit ?? 10);
  const said = text(`${head}\n${shown.map(line).join('\n')}`);
  if (!s.picture) return said;
  const order = text('The picture: left to right, then top to bottom, in the order of the list.');
  return { content: [{ type: 'image', data: picture(library, shown), mimeType: 'image/png' }, ...said.content, ...order.content] };
}
