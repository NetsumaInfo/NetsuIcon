# Contributing to NetsuIcon

Thanks for your interest in NetsuIcon.

Useful contributions include bug fixes, better example icons, work on the agent's guide and on the animation skill, exports, accessibility, translations and documentation.

## Before you start

- Search existing issues before opening a new one.
- For a significant feature, or any change to the icon format, the operations or the MCP tools, open an issue first so the direction can be agreed.
- Keep one pull request focused on one change; avoid unrelated edits.
- Read [`AGENTS.md`](AGENTS.md): it holds the structure and the rules of the code, for a person as for a coding agent. [`docs/STATUS.md`](docs/STATUS.md) holds the decisions already taken and why; a decision is not reopened without saying so.

## Language

- Code, identifiers, comments, error messages, documentation, commit messages, pull requests and issues: **English**.
- Text the user reads in the app is never hard-coded. Add the key to every locale under `app/src/locales/` (`fr` is the source for wording, then `en`) and run `pnpm check`.

## Local setup

Requirements: Node.js 22 (the version CI runs) and pnpm.

```bash
git clone https://github.com/NetsumaInfo/NetsuIcon.git
cd NetsuIcon
pnpm install
pnpm dev
```

`pnpm dev` starts the server on `127.0.0.1:6210` and the app on `http://localhost:1440`. There is no account, no backend and no secret to set up.

To drive it the way a user does, link a coding agent to `http://127.0.0.1:6210/mcp` (Claude Code reads the `.mcp.json` of this folder). Without one, every tool can be called from a terminal:

```bash
pnpm --filter @netsuicon/server mcp                      # lists the tools and their arguments
pnpm --filter @netsuicon/server mcp look_pack '{"pack":"meteo"}' out.png
```

## What goes where

| You want to change | Look in |
|---|---|
| The icon format, an operation, an export | `core/src/`, with a unit test next to it |
| What an MCP tool takes or answers | `server/src/tools.ts`, `packTools.ts`, `reply.ts` |
| What the agent is told | `server/src/guide.ts` |
| How an agent should animate | `skills/netsu-icon-motion/` |
| The app | `app/src/` |
| An example icon | through the tools, never by editing the JSON by hand |

Three rules that reviews hold to:

- **The guide is paid for by every agent that connects**, and a tool's answer at every call. Add a line only if it changes what an agent does, and do not repeat in the skill what the guide says.
- **A change to the format or to an operation updates `server/src/guide.ts` in the same pull request.** It is all the agent knows.
- **The server listens on `127.0.0.1` only and refuses a foreign `Host` or `Origin`.** A pull request that loosens this is not merged.

A change to the guide or to the skill is judged by a run: give an agent only the skill and the tools, ask it to animate icons it has not seen, and say in the pull request what it produced and where the text misled it.

## Pull requests

1. Branch from `main` with a clear name, e.g. `fix/trim-dash` or `feat/lottie-export`.
2. Follow the conventions in `AGENTS.md`: file and function sizes, no dead code, licences MIT, Apache, BSD or MPL only.
3. Do not add a dependency without a clear need.
4. Explain what changes, why, any trade-offs, and how you verified it.
5. List the checks you actually ran, and say clearly what you could not test.
6. Add a screenshot for a visual change. For an animation, say what you watched move and in which browser: still frames do not show rhythm.
7. Do not mix a broad refactor with a behaviour change in the same pull request.

## Checks

| Layer | Command |
|---|---|
| Types everywhere, and the same keys in every locale | `pnpm check` |
| Unit tests: the core and the MCP tools | `pnpm test` |
| The animated pictures of the README, after an example icon changed | `pnpm --filter @netsuicon/server readme` |

Pure logic gets a unit test next to it. Say what is measured or verified and what is not: that sentence is a rule of this project, in the code review as in the docs.

By contributing you agree that your contribution is distributed under the project's [MIT](LICENSE) licence, and you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).
