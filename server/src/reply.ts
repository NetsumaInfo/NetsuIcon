import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { Resvg } from '@resvg/resvg-js';
import { findingText, IconError, lint, REACTIONS, typeOf, type IconDoc, type IconNode, type Pack } from '@netsuicon/core';

export function text(value: string): CallToolResult {
  return { content: [{ type: 'text', text: value }] };
}

/** An `IconError` is the agent's to fix: it gets the sentence back. Anything else is ours and is thrown. */
export function guarded(run: () => CallToolResult): CallToolResult {
  try {
    return run();
  } catch (error) {
    if (error instanceof IconError) return { isError: true, content: [{ type: 'text', text: `${error.code}: ${error.message}` }] };
    throw error;
  }
}

function outlineNodes(nodes: IconNode[], depth: number): string[] {
  return nodes.flatMap((node) => {
    const line = `${'  '.repeat(depth)}${node.id} (${node.type})${node.hidden ? ' hidden' : ''}`;
    return node.type === 'group' ? [line, ...outlineNodes(node.children, depth + 1)] : [line];
  });
}

/** A short picture of the document: what an agent needs after an edit, without the path data. */
export function outline(doc: IconDoc): string {
  const clips = doc.clips.map((clip) => {
    // The nodes a clip moves, not each property: the whole of it is in get_icon.
    const moved = [...new Set(clip.tracks.map((track) => track.node))].join(', ') || 'no track';
    return `${clip.id} (${clip.trigger}${clip.manner ? `, ${clip.manner}` : ''}, ${clip.duration} ms): ${moved}`;
  });
  return [
    `${doc.name}: ${doc.mode}, view box ${doc.size}, ${typeOf(doc)}`,
    'nodes:',
    ...(doc.nodes.length > 0 ? outlineNodes(doc.nodes, 1) : ['  none']),
    'clips:',
    ...(clips.length > 0 ? clips.map((line) => `  ${line}`) : ['  none']),
  ].join('\n');
}

function pairs(record: object): string {
  return Object.entries(record).map(([key, value]) => `${key} ${JSON.stringify(value)}`).join(', ') || 'none';
}

/** The rules of a pack in a few lines: what an agent reads before drawing in it. */
export function packOutline(pack: Pack, icons: string[]): string {
  const { feel, ease } = pack.motion;
  const palette = Object.entries(pack.palette).map(([name, colour]) => `$${name} ${colour}`).join(', ') || 'none';
  return [
    `pack ${pack.name}: ${pack.mode}, view box ${pack.size}${pack.brief ? ` — ${pack.brief}` : ''}`,
    `  style: ${pairs(pack.style)}`,
    `  palette: ${palette}`,
    ...(feel ? [`  feel: ${feel}`] : []),
    `  ease: ${JSON.stringify(ease)}`,
    `  manner in use: ${pack.motion.manner ?? 'subtle'}`,
    ...([pack.motion, pack.motion.expressive] as const).flatMap((set, index) =>
      REACTIONS.map((reaction) => {
        const { duration, maxTranslate, maxRotate, scale } = set[reaction];
        const name = index === 0 ? reaction : `expressive ${reaction}`;
        return `  ${name}: ${duration[0]} to ${duration[1]} ms, at most ${maxTranslate} units and ${maxRotate} degrees, scale ${scale[0]} to ${scale[1]}`;
      }),
    ),
    `  icons: ${icons.join(', ') || 'none'}`,
  ].join('\n');
}

/** Where the icon departs from its pack, as advice an agent can act on. */
export function harmony(doc: IconDoc, pack: Pack): string {
  const findings = lint(doc, pack);
  if (findings.length === 0) return `${doc.name}: fits pack "${pack.name}".`;
  return [`${doc.name}: departs from pack "${pack.name}" (advice; the icon is saved):`, ...findings.map((finding) => `  ${findingText(finding)}`)].join('\n');
}

export function png(svg: string, width: number, background: string | undefined): Buffer {
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: width }, background });
  return Buffer.from(resvg.render().asPng());
}
