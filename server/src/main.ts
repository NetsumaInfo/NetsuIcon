import http, { type IncomingMessage, type ServerResponse } from 'node:http';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { IconError } from '@netsuicon/core';
import { Store } from './store';
import { buildServer } from './tools';

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = path.resolve(process.env.NETSUICON_DIR ?? path.join(here, '../../icons'));
const port = Number(process.env.NETSUICON_PORT ?? 6210);
const store = new Store(dir);

const LOCAL = /^(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/;

/** Only this machine may talk to the server: a web page elsewhere must not reach it through the browser. */
function isLocal(req: IncomingMessage): boolean {
  if (!LOCAL.test(req.headers.host ?? '')) return false;
  const origin = req.headers.origin;
  if (origin === undefined) return true;
  try {
    return LOCAL.test(new URL(origin).host);
  } catch {
    return false;
  }
}

function json(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
}

async function body(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw === '' ? undefined : JSON.parse(raw);
}

/** Stateless: each request gets its own server and transport, so there is no session to lose. */
async function mcp(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method !== 'POST') {
    json(res, 405, { jsonrpc: '2.0', error: { code: -32000, message: 'Method not allowed.' }, id: null });
    return;
  }
  const server = buildServer(store);
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  res.on('close', () => {
    void transport.close();
    void server.close();
  });
  await server.connect(transport);
  await transport.handleRequest(req, res, await body(req));
}

/** Tells the app, as server-sent events, that the folder changed, and every 5 s that the server is still there. */
function events(req: IncomingMessage, res: ServerResponse): void {
  res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache', connection: 'keep-alive' });
  res.write('data: ready\n\n');
  const stop = store.watch(() => res.write('data: changed\n\n'));
  // A proxy can keep a dead stream open: the app takes a long silence for a lost server and connects again.
  const beat = setInterval(() => res.write('event: alive\ndata:\n\n'), 5000);
  req.on('close', () => {
    stop();
    clearInterval(beat);
  });
}

/** What the app shows: the icons outside the packs, each pack with its own, and the language to say it in. */
function listing(): unknown {
  return { dir, language: store.language(), icons: store.all(), packs: store.shelves() };
}

/** The one thing the app writes: the language its user picked. */
async function language(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    json(res, 200, { language: store.setLanguage(((await body(req)) as { language?: unknown } | undefined)?.language) });
  } catch (error) {
    if (!(error instanceof IconError) && !(error instanceof SyntaxError)) throw error;
    json(res, 400, { error: 'bad_language' });
  }
}

async function route(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (!isLocal(req)) {
    json(res, 403, { error: 'forbidden' });
    return;
  }
  const url = (req.url ?? '/').split('?')[0];
  if (url === '/mcp') await mcp(req, res);
  else if (url === '/api/icons' && req.method === 'GET') json(res, 200, listing());
  else if (url === '/api/events' && req.method === 'GET') events(req, res);
  else if (url === '/api/language' && req.method === 'POST') await language(req, res);
  else json(res, 404, { error: 'not_found' });
}

http
  .createServer((req, res) => {
    route(req, res).catch((error: unknown) => {
      console.error(error);
      if (!res.headersSent) json(res, 500, { error: 'internal' });
      else res.end();
    });
  })
  .listen(port, '127.0.0.1', () => {
    console.log(`NetsuIcon server: http://127.0.0.1:${port}/mcp`);
    console.log(`Icons folder: ${dir}`);
  });
