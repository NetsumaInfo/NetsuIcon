import { IconError, type IconNode } from './types';

export function walk(nodes: IconNode[], visit: (node: IconNode) => void): void {
  for (const node of nodes) {
    visit(node);
    if (node.type === 'group') walk(node.children, visit);
  }
}

export interface Place {
  list: IconNode[];
  index: number;
  node: IconNode;
}

export function locate(nodes: IconNode[], id: string): Place | undefined {
  for (const [index, node] of nodes.entries()) {
    if (node.id === id) return { list: nodes, index, node };
    if (node.type !== 'group') continue;
    const inside = locate(node.children, id);
    if (inside) return inside;
  }
  return undefined;
}

export function findNode(nodes: IconNode[], id: string): IconNode | undefined {
  return locate(nodes, id)?.node;
}

export function mustLocate(nodes: IconNode[], id: string): Place {
  const place = locate(nodes, id);
  if (!place) throw new IconError('node_not_found', `No node with id "${id}".`);
  return place;
}

/** The list a node is added to: the children of `parent`, or the root when there is none. */
export function childrenOf(nodes: IconNode[], parent: string | null | undefined): IconNode[] {
  if (parent === null || parent === undefined) return nodes;
  const { node } = mustLocate(nodes, parent);
  if (node.type !== 'group') throw new IconError('not_a_group', `Node "${parent}" is not a group.`);
  return node.children;
}

/** Documents are plain JSON: a copy through JSON is a full copy. */
export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}