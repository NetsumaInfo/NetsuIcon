// A client of the running server, for the scripts that draw through it the way an agent would.
import process from 'node:process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

interface Result {
  isError?: boolean;
  content: { type: string; text?: string; data?: string }[];
}

export interface Agent {
  /** Calls a tool, prints what it answers and returns it. */
  call(name: string, args: Record<string, unknown>): Promise<Result>;
  /** Every tool of the server with the arguments it takes, one line each. */
  tools(): Promise<string[]>;
  close(): Promise<void>;
}

export async function connect(): Promise<Agent> {
  const url = new URL(process.env.NETSUICON_URL ?? 'http://127.0.0.1:6210/mcp');
  const client = new Client({ name: 'seed', version: '0' });
  await client.connect(new StreamableHTTPClientTransport(url));
  return {
    async call(name, args) {
      const result = (await client.callTool({ name, arguments: args })) as Result;
      const said = result.content.map((part) => part.text ?? `<${part.type}>`).join('\n');
      console.log(`${result.isError ? 'ERROR' : 'ok'} ${name}\n${said}\n`);
      return result;
    },
    async tools() {
      const { tools } = await client.listTools();
      return tools.map((tool) => {
        const needed = new Set(tool.inputSchema.required ?? []);
        const args = Object.keys(tool.inputSchema.properties ?? {}).map((arg) => (needed.has(arg) ? arg : `${arg}?`));
        return `${tool.name} {${args.join(', ')}}`;
      });
    },
    close: () => client.close(),
  };
}
