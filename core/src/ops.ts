import { childrenOf, clone, mustLocate, walk } from './tree';
import {
  IconError,
  type AnimProp,
  type Clip,
  type Gradient,
  type IconDoc,
  type IconNode,
  type Key,
  type Manner,
  type Mode,
  type Style,
  type Trigger,
} from './types';
import { validate } from './validate';

/** One targeted edit. An agent sends a list of these instead of rewriting the whole icon. */
export type Op =
  | { op: 'set_meta'; mode?: Mode; size?: number; defaults?: Style | null }
  | { op: 'add_node'; node: IconNode; parent?: string | null; index?: number }
  | { op: 'update_node'; id: string; set: Record<string, unknown> }
  | { op: 'remove_node'; id: string }
  | { op: 'move_node'; id: string; parent?: string | null; index?: number }
  | { op: 'set_gradient'; gradient: Gradient }
  | { op: 'remove_gradient'; id: string }
  | { op: 'set_clip'; clip: ClipEdit }
  | { op: 'remove_clip'; id: string }
  | { op: 'set_track'; clip: string; node: string; prop: AnimProp; keys: Key[] }
  | { op: 'remove_track'; clip: string; node: string; prop: AnimProp };

export const OP_NAMES = [
  'set_meta',
  'add_node',
  'update_node',
  'remove_node',
  'move_node',
  'set_gradient',
  'remove_gradient',
  'set_clip',
  'remove_clip',
  'set_track',
  'remove_track',
] as const satisfies readonly Op['op'][];

/** What `set_clip` takes: the id, and what to set. A null manner takes it away: the clip then plays in both. */
interface ClipEdit {
  id: string;
  trigger?: Trigger;
  duration?: number;
  delay?: number;
  manner?: Manner | null;
}

const LOCKED = ['id', 'type', 'children'];

function insert<T>(list: T[], item: T, index: number | undefined): void {
  const at = index === undefined ? list.length : Math.max(0, Math.min(index, list.length));
  list.splice(at, 0, item);
}

function mustClip(doc: IconDoc, id: string): Clip {
  const clip = doc.clips.find((c) => c.id === id);
  if (!clip) throw new IconError('clip_not_found', `No clip with id "${id}". Create it first with set_clip.`);
  return clip;
}

function updateNode(doc: IconDoc, id: string, set: Record<string, unknown>): void {
  const node = mustLocate(doc.nodes, id).node as unknown as Record<string, unknown>;
  for (const [key, value] of Object.entries(set ?? {})) {
    if (LOCKED.includes(key)) throw new IconError('locked_field', `"${key}" of a node cannot be changed. Remove the node and add another.`);
    if (value === null) delete node[key];
    else node[key] = value;
  }
}

function removeNode(doc: IconDoc, id: string): void {
  const { list, index, node } = mustLocate(doc.nodes, id);
  const gone = new Set<string>();
  walk([node], (n) => gone.add(n.id));
  list.splice(index, 1);
  for (const clip of doc.clips) clip.tracks = clip.tracks.filter((track) => !gone.has(track.node));
}

function moveNode(doc: IconDoc, id: string, parent: string | null | undefined, index: number | undefined): void {
  const { list, index: from, node } = mustLocate(doc.nodes, id);
  const inside = new Set<string>();
  walk([node], (n) => inside.add(n.id));
  if (parent && inside.has(parent)) throw new IconError('bad_move', 'A group cannot be moved into itself.');
  const target = parent === undefined ? list : childrenOf(doc.nodes, parent);
  list.splice(from, 1);
  insert(target, node, index);
}

function setClip(doc: IconDoc, next: ClipEdit): void {
  const { manner, ...rest } = next ?? ({} as ClipEdit);
  let clip = doc.clips.find((c) => c.id === rest.id);
  if (clip) Object.assign(clip, rest);
  else doc.clips.push((clip = { trigger: 'hover', duration: 600, ...rest, tracks: [] }));
  if (manner === null) delete clip.manner;
  else if (manner !== undefined) clip.manner = manner;
}

function setTrack(doc: IconDoc, op: Extract<Op, { op: 'set_track' }>): void {
  const clip = mustClip(doc, op.clip);
  const track = { node: op.node, prop: op.prop, keys: op.keys };
  const at = clip.tracks.findIndex((t) => t.node === op.node && t.prop === op.prop);
  if (at >= 0) clip.tracks[at] = track;
  else clip.tracks.push(track);
}

function applyOne(doc: IconDoc, op: Op): void {
  switch (op.op) {
    case 'set_meta':
      if (op.mode !== undefined) doc.mode = op.mode;
      if (op.size !== undefined) doc.size = op.size;
      if (op.defaults === null) delete doc.defaults;
      else if (op.defaults !== undefined) doc.defaults = op.defaults;
      return;
    case 'add_node':
      if (!op.node || typeof op.node !== 'object') throw new IconError('bad_node', 'add_node needs a "node".');
      insert(childrenOf(doc.nodes, op.parent), op.node, op.index);
      return;
    case 'update_node':
      updateNode(doc, op.id, op.set);
      return;
    case 'remove_node':
      removeNode(doc, op.id);
      return;
    case 'move_node':
      moveNode(doc, op.id, op.parent, op.index);
      return;
    case 'set_gradient':
      doc.gradients = [...(doc.gradients ?? []).filter((g) => g.id !== op.gradient?.id), op.gradient];
      return;
    case 'remove_gradient':
      doc.gradients = (doc.gradients ?? []).filter((g) => g.id !== op.id);
      return;
    case 'set_clip':
      setClip(doc, op.clip);
      return;
    case 'remove_clip':
      mustClip(doc, op.id);
      doc.clips = doc.clips.filter((c) => c.id !== op.id);
      return;
    case 'set_track':
      setTrack(doc, op);
      return;
    case 'remove_track': {
      const clip = mustClip(doc, op.clip);
      clip.tracks = clip.tracks.filter((t) => !(t.node === op.node && t.prop === op.prop));
      return;
    }
    default:
      throw new IconError('unknown_op', `Unknown op ${JSON.stringify((op as { op?: unknown }).op)}. Use one of ${OP_NAMES.join(', ')}.`);
  }
}

/**
 * Applies the edits in order and returns a new document. All or nothing: if one edit fails or leaves
 * the document invalid, an `IconError` naming that edit is thrown and the input is left as it was.
 */
export function applyOps(doc: IconDoc, ops: Op[]): IconDoc {
  const next = clone(doc);
  for (const [index, op] of ops.entries()) {
    try {
      // Copied first: the document must never share an object with the caller's edit.
      applyOne(next, clone(op));
      validate(next);
    } catch (error) {
      if (error instanceof IconError) throw new IconError(error.code, `op ${index} (${String(op?.op)}): ${error.message}`);
      throw error;
    }
  }
  return next;
}
