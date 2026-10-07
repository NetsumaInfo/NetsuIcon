# Status — NetsuIcon

Decisions, what is verified, what remains. A decision is not reopened without saying so.

## 1. Idea

Make animated icons with an agent. Two references, both under the MIT license:

- `KobayashiRui/vibe-svg-editor`: an SVG editor for agents. The agent sends small changes through MCP instead of rewriting the file. No animation.
- `Avijit07x/animateicons`: 1,170 React icons animated with `motion/react`, on hover or click. A library, not an editor.

NetsuIcon brings the two together: an editor for agents, with animation. No file from these repositories is copied.

## 2. Decisions (2026-10-07)

| Topic | Decision |
|---|---|
| Folder | Its own repository. The name is provisional. |
| Modes | Two modes in the same application: `micro` (interface, view box 24, stroke) and `app` (application, view box 1024, fills and gradients). |
| Agent | One MCP server, two doors: the code editor's agent (done), a chat in the application (to do). |
| Wanted exports | Animated SVG in CSS, `motion` React component, Lottie, sets of application icons. |
| Document | One `<name>.nicon.json` file per icon: a tree of shapes and animations ("clips"), each with a trigger: hover, click, loop, arrival. |
| Changes | Always through a list of operations (`applyOps`). All pass or none passes. A saved document is always valid. |
| Pivot | `rotate` and `scale` turn around `origin`, in view box units. Default: the center of the view box. No bounding box calculation. |
| Move | `translate` is a single `[x, y]` value, to match the CSS property of the same name. |
| Rendering | SVG in the DOM. No WebGPU: an icon is a vector, and the preview is exactly the exported file. |
| First slice | Server in Node and web application. The Tauri shell comes after. |

### Packs (2026-10-07, same day)

The decision "one file per icon" holds. The open question "where do a project's icons live" gets a first answer: one **pack** per application.

| Topic | Decision |
|---|---|
| Pack | A sub-folder `icons/<pack>/` with a `pack.json` and the icons of the pack. Icons at the root stay "outside a pack". |
| Content | A frame (mode, view box), an inherited **style**, a **palette** of named colors, a **motion**: character in one sentence, hover and click durations, default easing, maximum amplitudes. |
| Inheritance | The icon copies nothing. It is dressed at drawing time (`resolve`): the pack's style under its own, `$name` replaced by the color, the pack's easing on the keys that have none. Changing the pack changes all its icons. |
| Two levels | What would prevent drawing is an **error**: a `$name` missing from the palette, and nothing is saved. What breaks harmony is **advice** (`lint`): a color outside the palette, a different stroke, a duration or amplitude out of limits. The agent may depart from it on purpose. |
| Motion limits | They apply to hover and click. Loops and arrivals are free: a loader turns a full turn. |
| Frozen frame | A pack's mode and view box do not change afterwards: the icons are drawn inside them. |
| Export | The pack's colors and style are written into the exported code. The code does not depend on the pack. |
| Animation method | It is not in the server. It is a skill, `netsu-icon-motion`, in the NetsuSkills repository: name the drawn object, its verb, its pivot, then write that motion. The server's guide gives the format; the skill gives the method. |

### Two reactions (2026-10-07, same day)

| Topic | Decision |
|---|---|
| Two reactions | An interface icon reacts twice, with two clips: `hover`, the intent (the lid lifts a little), and `click`, the whole action (the lid opens, a paper falls in, it closes again). |
| Link between the two | The click starts like the hover: same part, same pivot, same direction. It is not the hover made bigger: it holds, swings, leaves, or brings a prop. |
| Prop | A node visible only during the click, set with `opacity: 0`. Only one per icon. At rest the icon does not change. |
| Limits | The pack has two sets of limits, `motion.hover` and `motion.click`. This replaces the single limits decided above on the same day. A click is allowed more duration, distance and angle. |
| Missing reaction | In a pack, an icon that has one of the two reactions without the other is flagged (advice). A fixed icon is not flagged. |
| Whole click | In CSS, `:active` stops when the button comes up. The exported SVG carries the id of its click clip (`data-click`); the page plays it whole by setting `data-play`. The React component does it by itself. |
| No state | Replaced the same day by "Icon types", below. |
| No GIF | Tried, then removed on request: to show a pack, a live HTML page (`export_pack`), not an animated image. |

### Icon types, states and motion (2026-10-07, after seeing the result)

The result was looked at in the artifact. Three complaints: the small ball that falls into the trash can is not an object you recognize; the wind does not move like wind; a padlock or a heart must stay open or full, and close again at the next click.

| Topic | Decision |
|---|---|
| Type | What a press does gives the icon's type. **Action**: it is done and it is over (`hover` + `click`). **Switch**: a state that stays, undone by the next press (`hover` + `on`). **State**: nothing is pressed, something lasts (`loop`). |
| Switch | Two new triggers, `on` and `off`. The `on` clip goes from rest to the other state and **ends there**: its last values are the on state. Without an `off` clip, the way back is the `on` clip played in reverse, easings flipped. |
| One or the other | An icon has a `click` clip or an `on` clip, never both. This is an error, not advice. |
| In a page | The page sets `data-state="on"`, then `"off"` on the SVG. The React component keeps the state itself. |
| Less motion | With `prefers-reduced-motion`, animations last 1 ms instead of being cut: a switch still arrives in its state. |
| Running stroke | New property `trim`, `[start, end]`: the drawn piece of the stroke. A line can run along its path, entering and leaving. A shape takes `draw` or `trim` in a clip, not both. |
| Phases | A press is built in phases: anticipation, action, overshoot, rest. Written in the server's guide and in the skill. |
| Prop | An object you can name at a glance, drawn like the icon: a sheet of paper, an envelope, a coin. Never a dot or a ball. |
| Guide | `server/src/guide.ts` is the agent's system prompt. It now carries the types, hover and press, the phases and the props. The skill carries the method and the table of verbs. |

### Two manners and lightening (2026-10-07, after seeing the version with types)

Request: keep the subtle manner, and add one that really moves, pushed further. And lighten the skill to spend fewer tokens.

| Topic | Decision |
|---|---|
| Manner | A clip may state its manner: `subtle` or `expressive`. An icon carries both; a clip without a manner plays in both. The type (action, switch) holds in each manner. |
| Choice | The pack says which one the application uses (`motion.manner`, `subtle` by default). Exports write one manner at a time. The application and the page have a selector. |
| Limits | `motion.hover` and `motion.click` hold the subtle manner; `motion.expressive` holds the other, wider (a prop may cross the whole view box). |
| Expressive | The same idea played as a small scene in three beats: the run-up, the action, what it leaves behind. What leaves really goes out of the view box and comes back by the other side. Up to three real props (trail, splash, puff). More of the verb, never decoration. |
| Jump | New easing `hold`: the value stays, then jumps to the next key. For what leaves by one side and comes back by the other without crossing the image. |
| Props | A node invisible at rest is a prop: its thinner stroke is no longer flagged by the harmony check. |
| Guide | The guide is paid for by every agent that connects: a line that does not change what the agent does is removed. The skill no longer repeats the guide. |
| One look | `look` with `clip: "*"` shows all the clips of an icon in one image. The skill sets a budget: one `get_icon`, one `edit_icon`, one `look` per icon. |

### How the object works, shorter answers, interface (2026-10-07, evening)

Request: that the agent understand how the drawn object works and animate it from that; optimize the guide and the skill further; tidy the interface, for a person as for an agent; write the README with its images.

| Topic | Decision |
|---|---|
| How it works | Before any change, the agent writes eight lines: the object, its parts, how the moving part is held, what pushes it, what it is made of, what it means, the hover, the click. Three tables derive the motion from them: held (hinge: it turns; rail: it slides; nothing: it flies in a curve), driver (hand, gravity, spring, motor, wind, living, light, slow change, nothing), material (heavy, light, soft, weightless). |
| What wins | The eight lines come before the verb line. The verb gives the sizes and the shape; the driver and the material say what is kept of the pull-back, the overshoot and the bounce. A gear does not overshoot its stop, a liquid does not overshoot its level, a lightning bolt has no run-up. |
| Cause first | What frees the part moves before it: the key turns, then the shackle jumps; the cloud tightens, then the rain falls. |
| Guide | The same rule, in six lines. Three format facts added: the order of transformations (the pivot travels with the part), a path with several strokes plays them all at the same time, `remove_node` takes its tracks with it. |
| Tool answers | What a tool answers is paid for at every call. An icon's summary names the parts a clip moves, plus each property, and states its type. `list_icons` takes a `pack`. `get_icon` takes `clips`: `"ids"` (without the tracks), or a manner. |
| One instant | `look` on a single instant of a clip now draws the edge of the view box, like a strip of frames. |
| Terminal | `mcp` without a tool lists the tools and their arguments. |
| Type | `typeOf` in `core`: action, switch, state, arrival, still. Shown in the application and in the summary given to the agent. |
| Interface | Three columns kept. The address carries the selection (`#/courrier/send`). Header: breadcrumb, "Connect an agent", server status. List: filter by name. Middle: the name, the type, the manner and the background at the top; the icon; at the bottom "Live", the clips of the displayed manner, the scrubber. Panel: tabs (animations, shapes, code; rules, harmony). One manner for the whole window: the copied code is that of the displayed manner. |
| Same words | The application shows the identifiers the agent uses (icon, pack, clip, part). A button copies the reference of the open icon, to paste to the agent. |
| Skill in the repository | The skill now lives here, in `skills/netsu-icon-motion`. NetsuSkills publishes a copy and keeps the log of its trials. This answers the open question "where does the skill live". |
| README images | Animated SVGs written by `server/scripts/readme.ts` from the icons. `demo` in `core` plays a reaction in a loop, alone, for an `<img>` tag: an action plays and rests, a switch turns on, holds, goes back. |
| Logo | The project's icon is a NetsuIcon icon in app mode (`icons/netsuicon.nicon.json`): an icon frame and a play triangle. |

### One language setting, English docs, contribution files (2026-10-07, night)

Asked: the app in English by default, easy to change, and set by the agent; every document in English; the same contribution files as the other Netsu repositories; a GitHub repository.

| Subject | Decision |
|---|---|
| Language of the app | English and French. It starts in English. One setting, kept by the server in `icons/settings.json` (git-ignored). A switch in the header and the `set_language` tool both write it; the app follows at once through the event stream. Before this it followed the language of the browser. |
| Who sets it | The agent, once, with the language the user writes to it in. `list_icons` starts with the language the app shows. The user can change it in the header at any time. |
| One write from the app | `POST /api/language` is the only thing the app writes. It goes through the same local-only check as everything else. |
| Language of the repository | Everything written in the repository is in English: README, this file (it was `SUIVI.md`, in French), the contribution files. Only the conversation with the maintainer is in French. |
| Contribution files | `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `.github/` (funding, issue templates, pull request template, CI: types, locales, tests), `.gitattributes`. Modelled on NetsuRush. |

## 3. Done and verified (2026-10-07)

- `core`: 57 tests pass (operations, errors, sampling, CSS export, React export, page, packs, harmony, sheet, path length, switches, `trim`, manners, `hold`, icon type, self-playing icon).
- `server`: 12 tests pass, with a real in-memory MCP client (icons, packs, strip of frames, a pack's page, all clips in one image, a single pack, an icon without its tracks).
- The HTTP entry point was tried with the official MCP client (`seed.ts`): creation and modification of two icons.
- A request with a foreign origin gets 403.
- In the built-in browser (Chromium), on `localhost:1440`: the list, the preview, "replay" (the animation runs, pivot at `12px 3px`, back to 0 at the end), the gradient of the application icon, and the live update after a change sent through MCP.

### Packs and animation (2026-10-07)

- Two packs drawn through the HTTP entry point: `meteo` (8 icons, script `seed:pack`) and `courrier` (8 icons).
- Changing the palette and the stroke of `meteo` with a single `edit_pack`: the 8 icons follow. Seen on the PNG sheet.
- A change outside the pack (color, stroke, duration, angle) comes back with 4 pieces of advice and stays saved. A `$name` missing from the palette is refused and nothing is written.
- In Chromium, on `localhost:1440`: the list by pack, a pack's sheet, the rules panel, a pack icon dressed (the pack's stroke, colors and easing in the exported SVG).
- **First trial with a real agent.** An agent that had only the `netsu-icon-motion` skill and the tools (through the terminal, not through an MCP connection) animated the 8 icons of `courrier`. Each icon got the motion of its object: the bell swings, the trash can's lid lifts on its hinge, the plane leaves. Judged on 6-frame strips, not on the motion.
- This trial found 18 flaws in the skill and the guide. All fixed. The `send` icon was redone by hand after the fix.
- "Replay all" on the `courrier` sheet: 13 CSS animations run at the same time (counted in the page).
- After two server restarts, a color added to a pack through MCP shows up in the application without reloading the page.
- Skill routing on 21 sentences, descriptions only: 10 triggers out of 10, 11 non-triggers out of 11.

### Two reactions (2026-10-07)

- The 16 icons of the two packs have a hover and a click. Written by two agents run blind, one per pack, which had only the skill; `trash`, `heart` and `send` redone by hand afterwards. Judged on strips.
- The harmony check now flags only one departure, kept on purpose: `settings` turns by 45° on hover to land back on its 8 teeth (the pack asks for 30° at most).
- In Chromium, in the application: a click on `send` sets `data-play="fly"`, the two animations of the clip run, then the clip hands control back without replaying the hover.
- A pack's page, served locally: the click on the trash can plays `throw` whole; "play all clicks" launches the 8 clips of a pack; no horizontal scroll; no error in the console.
- This page is published as an artifact to show it.
- This second blind run again found 24 flaws in the skill and the tools. Fixed.

### Types, states and motion: trials (2026-10-07)

- In Chromium, in the application, on a test icon: a click sets `data-state="on"`, the shackle reaches 25° and −2 units and **stays there** (read again 1.5 s later); the second click replays the way back, then the attribute is removed and the icon is at rest. The stroke animated by `trim` does change length and start during the clip, with no stray dot.
- Third blind run, final guide and skill, one agent per pack. `courrier`: 6 actions, 2 switches (`lock` stays open, `heart` stays full), a sheet of paper in the trash can. `meteo`: the wind runs along its curls with `trim`, the cloud floats, the bolt pulls back, then strikes. Judged on strips.
- Hand touch-ups afterwards: a bigger sheet in `trash`, an envelope that falls in `inbox`.
- The artifact page, served locally: the 18 icons are there, `heart` and `lock` carry `data-switch`. "Play all clicks" turns on the two switches and lets the actions come back; a second press turns them off. With the animations' time advanced by hand: padlock on at 20° and −1.5, return from those values to rest; trash can at 450 ms, lid at 16° and sheet visible in flight; the three wind lines at staggered lengths.
- This trial found 24 more flaws (12 per pack) in the skill, the guide and the tools. Fixed: `draw` and `trim` refused outside 0 to 1, strips of up to 12 frames that say what they leave out, the skill's example redone on the real trash can.

### Two manners: trials (2026-10-07)

- Fourth blind run, one agent per pack: each icon now has its subtle clips (unchanged) and its expressive clips. `courrier`: the plane pulls back, takes off out of the view box with a trail, a new one lands; the trash can crouches, the lid tips over, the sheet arrives from outside, a puff rises. `meteo`: the rain falls all the way down with splashes, the wind blows two gusts and carries off leaves, the cloud leaves by one side and comes back by the other. Judged on 12-frame strips.
- Measured cost: 33 and 34 tool calls for 8 icons, against 39 to 76 in the earlier trials.
- Skill loaded each time: 31,300 characters before, 19,800 after (procedure and verbs); the expressive part, 7,700, only on request.
- The artifact page, served locally: 36 icons in the page, 18 visible per manner; the selector switches; in expressive the plane plays `takeoff` (8 animations), in subtle `fly`; "play all clicks" turns on the padlock and the heart.
- Hand touch-up: the "+" in the magnifier removed (it read as "zoom").
- This trial found 20 more flaws. Fixed: the `hold` easing, long strips spread over time, props no longer flagged for their stroke, and the skill's expressive file rewritten.

Four flaws found along the way, fixed:

- A path drawn at 0 left a dot at the end, with round caps (known limit of the first slice). The gap between two dashes is now double: no more dot, in a still image as in CSS.

- `look` drew a partial path (`draw`) wrongly: the PNG engine ignores `pathLength`. A still image now uses the real length of the path (`core/src/length.ts`).
- The application stayed frozen after a server restart: the event stream died without an error behind Vite's proxy. The server sends a heartbeat every 5 s, the application reopens a silent stream.
- `look` showed only one instant. With `frames`, it shows the clip from start to end in one image.

### How it works, answers, interface: trials (2026-10-07, evening)

- Fifth blind run, one agent per pack, with the skill and the terminal only: re-read the 16 icons against "how the object works" and rewrite only what does not follow it.
  - `courrier`: 4 icons kept (the trash can among them, as is), 4 touched up. The keyhole now turns before the shackle jumps; the plane leaves by one edge and comes back by the other with `hold`, with no fade; the "+" sparks of the heart become three strokes; the gear slows down before its stop.
  - `meteo`: 1 icon kept, 7 touched up. Sun with no run-up and no bounce; thermometer column that rises while slowing down, without overshooting, with tick marks drawn as it passes; bolt that pulls back, holds, strikes all at once; drops and flakes that fall without first rising and come back with `hold`; wind leaves that enter by one edge.
  - Seven rewritten clips followed their verb line to the letter: it was the lines that were wrong. They are fixed.
- Measured cost: 26 and 32 tool calls for 8 icons (33 and 34 in the previous trial). Agent tokens: 163,000 and 184,000, no fewer than before; this trial re-read 33 clips per pack.
- Measured sizes. Guide: 9,155 characters before, 9,396 after (+3%, the how-it-works rule and three format facts). Skill loaded each time: 19,797 before, 23,424 after (+18%, the three tables and the corrections). Answers: `list_icons` 9,785, a single pack 3,486; `get_icon` of `rain` 8,765, without its tracks 1,168.
- The two trials reported 46 flaws in the skill and the guide. Fixed in the text; three remain to do (below). Hand touch-ups afterwards: the "+" sparks of the storm removed, the gear without overshoot.
- Interface, seen on screenshots from headless Chrome at 1440 × 900: a pack's sheet, an icon's stage, an expressive clip running with the Code tab in the right manner, the "Connect an agent" window, the address `#/courrier/trash` opening the right icon.
- README images: the four animated SVGs shown as `<img>` in Chrome at two instants; the icons move in them (plane out of the frame, lid lifted, padlock open, heart full).

### Language and contribution files: trials (2026-10-07, night)

- `server`: 13 tests pass; the new one covers `set_language` (English by default, the file written, a language the app does not speak refused).
- On screenshots: the app opens in English; after `set_language` with `fr` it is in French; a click on EN in the header puts it back in English. A request to `/api/language` from a foreign origin gets 403, an unknown language 400.
- The README pictures and the two screenshots were made again with the app in English.

## 4. Written but not verified

- **Nobody has yet watched the redone icons move.** They are judged on still images, by the agents, then by me on a few strips. The rhythm, the `hold` jumps, the key before the shackle: to be said by watching the application.
- **The application icons (`app` mode).** They work if asked: the project's logo is made that way, with the tools. But the guide gives them two lines, the skill does not mention them, no blind run has touched them, and the harmony check was only designed for the stroke.
- The skill and the guide corrected after the fifth run were not replayed. The skill's description is still not re-routed.
- Interface: not clicked by hand. The filter, the button that copies the reference, the Escape key on "Connect an agent", the scrubber: written and typed, not tried. Not seen in English, nor on a narrow screen.
- README images: seen in Chrome locally, not on GitHub.
- The manner selector: clicked by script in the stage (the clips and the code follow); not on the sheet.
- On the artifact page, the animations did not advance in real time during the check (the browser pane was not displayed): their time was advanced by hand. The application itself was seen in real time.
- The skill and the guide were corrected after this third run. This last version was not replayed, and the skill's description was not re-routed.
- A hand-written `off` clip: tested as text, used by no icon.
- On hover, an icon that is on does not replay its hover on the parts its state holds: intended, not verified.

- The exported React component was not mounted in a real React project. The produced text is tested, not its behavior. Point to look at: the pivot (`transformBox: 'view-box'`) with Motion.
- The animated SVG was seen only in Chromium. It uses the CSS properties `translate`, `rotate`, `scale`: to try in Firefox and Safari.
- The animations of the two packs were judged on still images. Nobody has yet watched them move and said whether the rhythm is right.
- The skill was replayed blind once (two reactions), then corrected again. This last version was not replayed. The description was not re-routed.
- The two-reaction React component is tested as text. It was not mounted in a project.
- A pack's page was seen only in Chromium, with a pointer. Not with a finger on a phone, not in Firefox or Safari.
- The dot at the end of a path at 0: fixed from reasoning and seen to disappear in PNG; not looked at in the browser.
- No agent has yet gone through a real MCP connection: the trial used `scripts/mcp.ts`, the same tools through the terminal.
- The application's English texts for packs were not displayed.
- The CI workflow has not run yet: it is written, and `pnpm install --frozen-lockfile`, `pnpm check` and `pnpm test` pass on this machine.
- The issue templates and the pull request template have not been seen rendered on GitHub.
- This file was translated from French by an agent and read through quickly, not line by line against the original.

## 5. Known limits

- Hover and click only work if the SVG is in the page. In an `<img>` tag, only loop and arrival animations play.
- In pure CSS, without the page, "on click" is rendered by `:active`: the animation lasts as long as the button is held down. With `data-play` set by the page, or with the React component, it plays whole.
- If the pointer leaves the icon in the middle of a hover, the hover stops dead.
- An icon that is on cannot appear already on: the page plays the `on` clip on arrival.
- No hover of its own for the on state.
- A `trim` that closes in the middle of a path (start = end, neither 0 nor 1) leaves a dot with round caps.
- Animated colors blend only in hexadecimal. Otherwise they change all at once.
- The exported code contains the pack's colors hard-coded. Changing the theme requires exporting again. No CSS variables.
- Two icons with the same name in two packs, on the same page: their keyframes have the same name and trample each other.
- The harmony check does not see geometry: a part that leaves the view box during its motion is not flagged. It does not judge easings either, nor the return to rest. The two agents of the fifth run did this trigonometry by hand.
- `look_pack` at a given instant may land on the rest frame of an icon that spins.
- The skill grew with every trial. The two agents read its two references in full for five useful lines each.
- A pack's limits get in the way of two legitimate motions: a turn that must land back on itself, a part that must really leave. The agent keeps the departure and says why.
- In the PNG sheet, a part that leaves its cell is cut off, as in the browser.

## 6. To do

1. Watch the 16 redone icons move, in the application, and say what is wrong; fix the guide and the skill from those remarks. Then replay the skill blind, this time through a real MCP connection.
1 bis. **Application icons**: say what is expected of them (volume, light, animation on opening?), write their part of the guide and the skill, make a test pack, run a blind run. Then the `.ico`, `.icns` and PNG sets (item 5).
1 ter. Skill: split it so that an agent reads only the family of its object. Harmony check: flag a visible part outside the view box. Skill: say what to do with a drop that must reappear in the middle of the image.
2. Edit by hand in the application: selection, inspector, timeline with keys, undo. For a pack: palette, stroke and motion.
2 bis. Packs: export a whole pack at once (folder of components, SVG sprite sheet), export with CSS variables for the theme, rename and delete a pack or an icon.
3. Reference image: import it, show it under the icon, give it to the agent.
4. Lottie export.
5. Sets of application icons: `.ico`, `.icns`, PNG, adaptive Android. Per-platform masks in the preview.
6. Tauri shell and chat in the application (reuse `nf-agent` and `nf-mcp` from NetsuFlow).
7. Path morphing, masks, cutouts.
8. Choose the name.

## 7. Open questions

- The name.
- Where does the packs folder live: a global folder, or an `icons/` folder in each of the user's code projects? Today: a single folder, set by `NETSUICON_DIR`, with one sub-folder per pack.
- The guide now carries the essence of the method in six lines, for an agent that does not have the skill. Is that enough, or is a `method` tool needed that gives the whole skill?
- Should a pack's motion limits know how to recognize a full turn and a departure, instead of flagging them?
