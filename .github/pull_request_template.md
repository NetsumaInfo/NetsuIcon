## What changes

<!-- The problem, then the solution. If an issue exists: "Fixes #123". -->

## Why

<!-- What led to this choice, and the trade-offs if any. -->

## Checks actually run

<!-- Tick what you REALLY ran. A box ticked wrongly costs more than an empty one:
     it makes the layer look covered. -->

- [ ] `pnpm check` (types everywhere, same keys in every locale)
- [ ] `pnpm test` (core and MCP tools)
- [ ] Tried in the running app (`pnpm dev`)
- [ ] For a change to the guide or the skill: run by an agent that had only the skill and the tools

## What could not be tested

<!-- Be explicit. An animation judged on still frames has not been watched;
     an export never mounted in a real project has not been tried. Say so. -->

## Screenshots

<!-- Required for any visual change. For an animation: what you watched move, and in which browser. -->

---

- [ ] Code, comments, docs, commits and pull request title in English
- [ ] One change per pull request (refactor and behaviour change apart)
- [ ] A change to the format or to an operation updates `server/src/guide.ts` in this pull request
- [ ] No visible text hard-coded: keys added to every locale under `app/src/locales/`
- [ ] Example icons changed through the tools, and the README pictures written again if they did
