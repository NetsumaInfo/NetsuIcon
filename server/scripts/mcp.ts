// Calls one tool of the running server from a shell: `pnpm --filter @netsuicon/server mcp <tool> '<json args>' [image.png]`.
// With no tool: lists the tools and the arguments each takes.
// For trying a tool by hand, and for an agent that has a shell but no MCP connection.
// The arguments may be `@file.json`. An image in the answer is saved to the file named last.
import fs from 'node:fs';
import process from 'node:process';
import { connect } from './agent';

const [tool, raw = '{}', image] = process.argv.slice(2);
const { call, tools, close } = await connect();
if (!tool) {
  console.log(["Usage: mcp <tool> '<json args>' [image.png]", ...(await tools())].join('\n'));
  await close();
  process.exit(0);
}

const args = JSON.parse(raw.startsWith('@') ? fs.readFileSync(raw.slice(1), 'utf8') : raw) as Record<string, unknown>;
const result = await call(tool, args);
const picture = result.content.find((part) => part.data !== undefined);
if (picture && image) {
  fs.writeFileSync(image, Buffer.from(picture.data!, 'base64'));
  console.log(`image saved to ${image}`);
}
await close();
process.exit(result.isError ? 1 : 0);
