// Draws two example icons through the running server, the way an agent would: `pnpm --filter @netsuicon/server seed`.
// It is also the end-to-end check of the HTTP endpoint.
import { connect } from './agent';

const { call, close } = await connect();

await call('create_icon', { name: 'bell', mode: 'micro' });
await call('edit_icon', {
  name: 'bell',
  ops: [
    { op: 'add_node', node: { type: 'group', id: 'bell', origin: [12, 3], children: [] } },
    { op: 'add_node', parent: 'bell', node: { type: 'path', id: 'body', d: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9' } },
    { op: 'add_node', node: { type: 'path', id: 'clapper', d: 'M10.3 21a1.94 1.94 0 0 0 3.4 0' } },
    { op: 'set_clip', clip: { id: 'ring', trigger: 'hover', duration: 700 } },
    {
      op: 'set_track',
      clip: 'ring',
      node: 'bell',
      prop: 'rotate',
      keys: [
        { t: 0, v: 0, ease: 'ease-out' },
        { t: 0.2, v: 16, ease: 'ease-in-out' },
        { t: 0.45, v: -12, ease: 'ease-in-out' },
        { t: 0.7, v: 7, ease: 'ease-in-out' },
        { t: 1, v: 0 },
      ],
    },
    {
      op: 'set_track',
      clip: 'ring',
      node: 'clapper',
      prop: 'translate',
      keys: [
        { t: 0, v: [0, 0], ease: 'ease-out' },
        { t: 0.25, v: [-2.5, 0], ease: 'ease-in-out' },
        { t: 0.5, v: [2, 0], ease: 'ease-in-out' },
        { t: 0.75, v: [-1, 0], ease: 'ease-in-out' },
        { t: 1, v: [0, 0] },
      ],
    },
  ],
});

await call('create_icon', { name: 'spark-app', mode: 'app' });
await call('edit_icon', {
  name: 'spark-app',
  ops: [
    { op: 'set_gradient', gradient: { id: 'sky', type: 'linear', from: [0, 0], to: [1, 1], stops: [{ offset: 0, color: '#6c9af9' }, { offset: 1, color: '#2a3f8f' }] } },
    { op: 'add_node', node: { type: 'rect', id: 'plate', x: 64, y: 64, width: 896, height: 896, rx: 200, fill: 'url(#sky)' } },
    {
      op: 'add_node',
      node: { type: 'path', id: 'spark', fill: '#ffffff', d: 'M512 232 L578 446 L792 512 L578 578 L512 792 L446 578 L232 512 L446 446 Z' },
    },
    { op: 'set_clip', clip: { id: 'breathe', trigger: 'loop', duration: 2400 } },
    {
      op: 'set_track',
      clip: 'breathe',
      node: 'spark',
      prop: 'scale',
      keys: [
        { t: 0, v: 1, ease: 'ease-in-out' },
        { t: 0.5, v: 1.12, ease: 'ease-in-out' },
        { t: 1, v: 1 },
      ],
    },
    {
      op: 'set_track',
      clip: 'breathe',
      node: 'spark',
      prop: 'rotate',
      keys: [
        { t: 0, v: 0, ease: 'ease-in-out' },
        { t: 1, v: 90 },
      ],
    },
  ],
});

await close();
