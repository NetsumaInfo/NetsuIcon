<div align="center">
  <img src="docs/images/logo.svg" width="160" alt="The NetsuIcon icon: the mascot, a character with spiky cyan hair and a grey visor, in a neon icon tile with anchor points on its edge">
  <h1>NetsuIcon</h1>

[![CI](https://github.com/NetsumaInfo/NetsuIcon/actions/workflows/ci.yml/badge.svg)](https://github.com/NetsumaInfo/NetsuIcon/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/github/license/NetsumaInfo/NetsuIcon)](LICENSE)

</div>

NetsuIcon is an editor of animated SVG icons that an AI agent drives through MCP. You ask the agent of your code editor for an icon; it draws and animates it in small operations, you watch it change live in a web app, then you take the code: an SVG animated with CSS, or a React component.

<img src="docs/images/packs.svg" alt="Sixteen example icons, for a mail app and a weather app, each playing its click animation">

The sixteen example icons in `icons/` play their click on their own here. In a page, they answer the pointer.

> [!NOTE]
> First milestone, provisional name. There is no drawing by hand: everything goes through the agent.

## Quick start

You need Node and pnpm.

```bash
pnpm install
pnpm dev
```

The app opens on `http://localhost:1440`. The server listens on `127.0.0.1:6210` and refuses requests from any other origin. In this folder, Claude Code offers the server from `.mcp.json`; from another project:

```bash
claude mcp add --transport http netsuicon http://127.0.0.1:6210/mcp
```

Any agent that speaks MCP over HTTP connects the same way. Then ask, for instance:

- "make a bell icon that rings on hover";
- "make a pack for my weather app, calm, thin strokes, then the sun, rain and wind icons";
- "the `send` icon of the `courrier` pack: make the plane really take off on click";
- "design the application icon of my app and export it for iOS and Android".

## How it works

```mermaid
flowchart LR
  you([You]) -- "“animate the bin”" --> agent[Agent of your editor]
  agent -- "MCP: edit_icon, look…" --> server[NetsuIcon server]
  server -- writes --> files[(icons/*.nicon.json)]
  server -- tells --> app[Web app]
  app -- "shows it live" --> you
```

An icon is one file, `<name>.nicon.json`: a tree of shapes and animations called clips. The agent never rewrites it. It sends a list of operations (`add_node`, `set_clip`, `set_track`…) and either all of them pass or none does, so a saved icon can always be drawn and exported. To check its work, the agent asks for a picture: the icon at rest, or the key moments of every clip side by side.

## What an icon can do

### Hover and click

<img src="docs/images/reactions.svg" width="420" alt="The same bin twice: on hover its lid lifts a little, on click it opens and a sheet of paper falls in">

On hover the icon hints at what it does: the lid of the bin lifts a little. On click it does it: the lid opens, a sheet of paper falls in, the lid shuts. The sheet is a prop, unseen at rest and there only for the click.

### Five types

<img src="docs/images/types.svg" width="420" alt="An inbox that takes an envelope and comes back to rest; a padlock that opens and stays open; a heart that fills and stays full">

The app names the type of every icon. An **action** plays and comes back to rest (delete, send). A **switch** turns on, stays on, and turns off at the next click (a padlock, a heart). A **state** moves by itself as long as it lasts (a loader). An **arrival** plays once, when the icon appears. A **still** icon has no animation yet. Six triggers make them: hover, click, switching on, switching off, loop and arrival.

### Two manners

<img src="docs/images/manners.svg" width="420" alt="The send plane and the rain cloud, twice each: subtle, a small move; expressive, the plane leaves the frame and the rain falls all the way down">

**Subtle** is one small, short idea, for an interface people work in. **Expressive** plays the same idea as a scene: the wind-up, the act, what it leaves behind. An icon can carry both, the app switches between them, and an export writes one.

Before animating, the agent says how the real thing works: where the moving part is held, what drives it (a hand, gravity, a spring, a motor, wind), what it is made of. A plastic lid lifted by a hand does not move like a steel padlock let go by a spring.

### Packs

A pack holds the icons of one application, in `icons/<pack>/` with a `pack.json`. It sets their style (stroke width, ends), a palette of named colours that icons write as `$brand`, and their motion: its character in one sentence, the default easing, and how long and how far a hover or a click may go, in each manner. Icons copy none of it, so changing the pack changes every icon at once. An icon that departs from its pack is reported, as advice: it may do so on purpose.

### Application icons

Two modes share the app. **Interface** icons are strokes in a view box of 24. **Application** icons are fills and gradients in a view box of 1024, drawn full bleed: iOS, macOS and Android each cut their own shape from them. The agent tests one with `proof`, in one picture: on every platform, on a dark screen, without colour, blurred, at 64, 32 and 16 px, and next to the three logos it looks most like in a library of 1,432 real logos. `export_app` writes the files of iOS, macOS (PNG and `.icns`), Windows (`.ico`), Android (adaptive layers, round and monochrome) and the web (favicons, touch icon, `site.webmanifest`).

The library is the reference collection of [kaankiziltug/logo-design-skill](https://github.com/kaankiziltug/logo-design-skill). Its logos are trademarks of their owners: studied, never copied, and not in this repository. `pnpm --filter @netsuicon/server library` downloads them.

## The app

<img src="docs/images/app-pack.png" alt="The courrier pack open in the app: the list of icons on the left, its eight icons side by side in the middle with their type, the rules of the pack on the right">

The list on the left holds the packs, then the icons **Outside the packs**, each marked Interface or Application, with a **Filter by name** field. A pack opens on its sheet: every icon alive with its type, **Every hover** and **Every click** to replay them all, and on the right its **Rules** (palette, style, motion limits) and **Harmony** (the icons that depart from them).

<img src="docs/images/app-icon.png" alt="The trash icon open in the app, at rest, with its four animations listed on the right">

An icon opens on its stage. **Live**, it answers the pointer and the click as in a real page; otherwise one clip replays, and a scrubber moves through it by hand. The header switches between **Subtle** and **Expressive**, **Dark** and **Light**, and the icon is shown at its real sizes in the corner. On the right: **Animations**, **Shapes**, and **Code** (animated SVG, React, the document). A button copies the icon's reference to paste to the agent, and every icon has its own address, such as `#/courrier/trash`.

The app speaks English and French. **Link an agent** in the header gives the command to connect one, and the agent sets the app to the language you write in.

## Exports

From the app's **Code** tab or from the agent:

- **Animated SVG**: one file, CSS `@keyframes`, no script. The hover works on its own. For a click, the page sets `data-play` on the `<svg>` to play an action whole, or `data-state="on"` and `"off"` to hold a switch.
- **React**: a component on `motion/react` that handles hover, click and state itself.

From the agent only:

- **Still SVG**: the icon at rest.
- **Page of a pack**: one self-contained HTML file where every icon of a pack answers the pointer.
- **Application icon files**, with `export_app`.

The colours and style of the pack are written into the code, which no longer needs the pack. When the reader's system asks for reduced motion, the SVG stops moving and a switch still changes state.

## The agent's tools

The server has sixteen MCP tools. `guide` gives the format and the rules once; it is all the agent knows.

- Read: `list_icons`, `get_icon`, `get_pack`.
- See: `look` (an icon at rest, or moments of a clip), `look_pack` (a whole pack in one picture).
- Write: `create_icon`, `edit_icon`, `create_pack`, `edit_pack`.
- Application icons: `proof`, `search_library`.
- Export: `export_icon`, `export_pack`, `export_app`.
- App: `set_language`.

Without an MCP connection, the same tools run from a terminal:

```bash
pnpm --filter @netsuicon/server mcp look_pack '{"pack":"meteo"}' meteo.png
```

## The skills

The guide gives the format; the method lives in two skills, written for an agent that has only them and the tools. [`netsu-icon-motion`](skills/netsu-icon-motion) animates an interface icon after how the thing it draws works. [`netsu-app-icon`](skills/netsu-app-icon) designs an application icon: a brief, the clichés of its category found in the library and set aside, eight ideas, three built and proved, your choice, then the export. Give the folders to your agent like any skill; with Claude Code, copy them into `.claude/skills/`. Both are also published in [NetsuSkills](https://github.com/NetsumaInfo/NetsuSkills).

## What it does not do

- Drawing by hand, or talking to the agent inside the app: for now everything happens in your code editor.
- Lottie export, or morphing one path into another.
- GIF previews, on purpose. An icon is a vector, and the preview is the exported file itself.

The example icons were animated by agents, which judge movement on still frames: expect to retouch the rhythm by eye.

## Where the project stands

- [x] Interface icons: hover and click, five types, two manners. Sixteen examples, animated and reviewed by agents that had only the skill and the tools.
- [x] Packs, with their departures reported.
- [x] Exports. The React component is tested but has not been mounted in a real project.
- [x] Application icons: `proof`, the logo library, the files of five platforms, a skill. No exported file has been loaded into Xcode or Android Studio yet.
- [x] The icon of this app, from the Netsu mascot in [`mascot/`](mascot), drawn by hand in SVG. Weak at 16 px.
- [ ] Drawing by hand in the app, a chat inside the app, Lottie, path morphing.

What is verified and what is not: [`docs/STATUS.md`](docs/STATUS.md).

## Development

```bash
pnpm check   # types everywhere, and the same labels in every language
pnpm test    # vitest: the core and the MCP tools
pnpm --filter @netsuicon/server readme   # the pictures of this page, after an icon changed
```

Three packages: `core` (the document, the operations, the exports; plain TypeScript that runs in the browser and in the server), `server` (the MCP server and the folder of icons), `app` (the web app). The rules for working in the repository, for a person or an agent, are in [`AGENTS.md`](AGENTS.md).

Read [`CONTRIBUTING.md`](CONTRIBUTING.md) first; for a large change, open an issue before the pull request. Security reports go through [`SECURITY.md`](SECURITY.md), never a public issue.

[NetsuFont](https://github.com/NetsumaInfo/NetsuFont) makes fonts the same way.

## License

MIT. See [`LICENSE`](LICENSE).
