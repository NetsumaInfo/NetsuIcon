# AGENTS.md — NetsuIcon (provisional name)

Instructions for any coding agent working on this repo. `CLAUDE.md` points here: **this file is the single source**.

An app to make animated icons with an AI agent: small interface icons (hover, click) and application icons. The agent edits the icon through MCP with small targeted operations; the user watches it change live.

## Status (2026-10-07, first slice, packs, reactions, switches, two manners, interface redone)

- `core/`: the icon document, the operations, sampling, and three outputs (still SVG, animated SVG with CSS keyframes, React component on `motion/react`). Packs: shared style, palette and motion, `resolve` (what an icon inherits), `lint` (where it departs), `sheet` (all icons in one picture), `exportPage` (a pack alive on one HTML page). An icon reacts to the pointer (a `hover` clip) and to a press: an action has a `click` clip and comes back to rest, a switch has an `on` clip, stays in its other state and goes back at the next press (`core/src/clips.ts`). A clip may belong to one of two manners, `subtle` or `expressive`; an icon can carry both and an export writes one. A pack limits hover and press separately, in each manner. Unit tested.
- `server/`: local HTTP server. `/mcp` is the MCP endpoint (stateless streamable HTTP) for the agent of an IDE; `/api/icons` and `/api/events` feed the app. Icons are files in `icons/`; a pack is a sub-folder with a `pack.json`.
- `app/`: web front (Vite, React, Tailwind v4). Read only. Three columns: the list (packs, icons, a filter by name), the middle (the sheet of a pack, or the stage of one icon: live, one clip replayed, a scrubber, two backgrounds, real sizes), the panel (for an icon, tabs: animations, shapes, code; for a pack: rules, harmony). The choice is in the address (`#/courrier/send`). One manner for the whole window. An icon answers the pointer and plays its click clip whole.
- The method for animating an icon after how the thing it draws works is a skill, `netsu-icon-motion`, in `skills/`. `server/src/guide.ts` holds the format; the skill holds the method. The NetsuSkills repository publishes a copy.
- `docs/images/`: the pictures of the README. The animated ones are written by `server/scripts/readme.ts` from the icons (`demo` in core makes an icon play by itself in a loop); the two screenshots are taken by hand.
- The app speaks English and French and starts in English. Its language is one setting kept by the server (`icons/settings.json`, git-ignored): the switch in the header and the `set_language` tool both write it, and the app follows at once.
- Application icons (mode `app`) work when asked for, and the icon of the project is one; neither the guide nor the skill has been tuned for them, and no blind run has tried them.
- Not yet: editing by hand in the app, chat inside the app, Tauri shell, Lottie, application icon sets (`.ico`, `.icns`, PNG), reference images, path morphing. See `docs/STATUS.md`.

## Read first

`docs/STATUS.md`: decisions, what is verified and what is not, what comes next. A decision is not reopened without saying so.

## Structure

```
core/src/      # pure TypeScript, no DOM, no Node: types, ops, validate, sample, clips, demo, svg, length, exportCss, exportReact, exportPage, pack, lint, sheet
server/src/    # store.ts (only code that touches the disk), tools.ts and packTools.ts (MCP tools), reply.ts (what a tool answers), guide.ts (what the agent is told), main.ts (HTTP)
server/scripts/  # seed.ts (two example icons), mcp.ts (one tool call from a shell), agent.ts (their client), readme.ts (the pictures of the README)
app/src/       # components/ (Header, IconList, Stage, PackSheet, IconPanel, PackPanel, and the small ones they share), lib/ (useIcons, events, picked, reactions), locales/ (fr is the source, en)
icons/         # <name>.nicon.json, one per icon; <pack>/pack.json and the icons of that pack. meteo and courrier are the examples; netsuicon is the icon of the project
skills/        # netsu-icon-motion: SKILL.md and references/. Written for an agent that has only this folder and the guide
docs/          # STATUS.md, images/
.github/       # issue and pull request templates, CI (types, locales, tests)
```

## Commands

```bash
pnpm install
pnpm dev        # server on 127.0.0.1:6210 and app on http://localhost:1440
pnpm check      # types everywhere + same locale keys
pnpm test       # vitest: core and the MCP tools
pnpm --filter @netsuicon/server seed        # example icons, needs the server running
pnpm --filter @netsuicon/server mcp look_pack '{"pack":"meteo"}' out.png   # any tool, from a shell
pnpm --filter @netsuicon/server readme      # the animated pictures of the README, after an icon changed
```

Ports: app **1440**, server **6210** (1420 and 1430 belong to other Netsu apps).

## Rules

- Everything written in the repository is in **English**, in simple sentences: code, comments, error messages, commits, `README.md`, `docs/`, the contribution files. Only the conversation with the maintainer may be in French.
- **Say what is measured or verified and what is not.**
- Licenses: MIT, Apache, BSD, MPL only.
- File ≤ 300 lines (ceiling 400), function ≤ 40, React component ≤ 200. No dead code.
- No hard-coded visible text: `app/src/locales/fr/` (the source for wording), then every other language, same change.
- Every change of an icon goes through `applyOps` (`core/src/ops.ts`): all or nothing, validated. A document that is saved can always be rendered and exported.
- An icon of a pack is drawn through `resolve(doc, pack)`, never straight from its file: the file holds `$names` and no style. `Store.write` and `Store.writePack` refuse what could not be drawn.
- What a pack asks beyond the format is advice (`lint`), never an error: an agent may depart from it on purpose.
- A press needs a page: an action plays whole through `data-play` on the `<svg>`, a switch holds its state through `data-state`; CSS `:active` alone stops with the button. The steps are written twice, on purpose: `REACT_SCRIPT` in `core/src/exportPage.ts` for a page outside the app, `app/src/lib/reactions.ts` for the app. Change both together.
- An MCP tool is a thin adapter over `core`. When the format or an op changes, update `server/src/guide.ts` in the same change: it is all the agent knows. Every agent that connects pays for each of its lines: add one only if it changes what an agent does, and do not repeat it in the skill.
- What a tool answers is paid for at every call. An answer says what the agent needs next and no more: the outline names the nodes a clip moves, not each property; `list_icons` takes a `pack`, `get_icon` can leave the tracks out.
- The skill in `skills/` changes with the guide: a rule lives in one of the two, never both. After a change, copy the folder to NetsuSkills, where its tests are recorded.
- The app shows the ids the agent uses (icon, pack, clip, node), in a monospace face, so that the user can name to the agent what they see.
- `core` stays free of DOM and Node APIs: it runs in the browser, in the server and in tests.
- The server listens on 127.0.0.1 only and refuses a foreign `Host` or `Origin`. Never loosen this.
- Pure logic gets a unit test next to it.

## Git

- Commit and push only when the user asks. Short conventional messages in English.
- Never a `Co-Authored-By` trailer. Never change `user.name` / `user.email`, never use `--author`.
