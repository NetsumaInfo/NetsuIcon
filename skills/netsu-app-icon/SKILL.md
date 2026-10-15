---
name: netsu-app-icon
description: Use when the user asks for an application icon, app icon, app logo, launcher icon, favicon or the icon of a project or product in NetsuIcon (the netsuicon MCP server) — to find ideas for it, design or redesign it, make it unique, refine it, test it at small sizes and on iOS, macOS and Android, or export its .ico, .icns, PNG and Android files. Do NOT use for interface icons (toolbar, buttons, 24 units), for animating an icon (netsu-icon-motion), or for wordmarks, letterheads and brand guidelines.
---

# NetsuAppIcon

Find one idea nobody in the category uses, build it in clean geometry, prove it survives
every platform and 16 pixels, and let the user choose before polishing.

## Requirements

- The `netsuicon` MCP server. Call `list_icons` first; if it fails, stop and say so (NetsuIcon
  starts with `pnpm dev` in its folder). With a shell and no MCP connection, the same tools:
  `pnpm -s --filter @netsuicon/server mcp <tool> '<json args>' [image.png]`, from that folder;
  long arguments in a file, `'@args.json'`.
- Its `guide` holds the format and the rules of an application icon (full bleed, safe circle).
  Read it once. This page does not repeat it.
- The logo library, for `search_library` and the likeness in `proof`. If a tool answers
  `no_library`, give the user its command, carry on, and say that distinction was not checked.

## Procedure

1. **Brief.** Name (exact spelling), what the app does, for whom, 3 to 5 adjectives, colours to
   keep or avoid. Missing: ask at most five questions in one message, or none and write your
   assumptions. Write the brief in six lines; the adjectives become visual cues
   (calm → slow curves, few parts; precise → straight cuts, a grid).

2. **See the category, then leave it.**
   - `search_library` with the closest `industry` (or `subject`) and `summary: true`, then the
     same with `picture: true`. With no filter it lists the values. The library leans to
     software: for another field, search by the things the field draws (`subject` matches the
     words as written: try two or three synonyms), and add the clichés you know of the field.
   - Write the **clichés**: what three or more of them share (a shape, a subject, a colour).
     They are off limits unless your concept gives them a form none of them has.

3. **Concepts.** Write eight, one sentence each, over at least three kinds of mark:
   the thing seen another way (pictorial), a form that carries the idea (abstract), the
   initial changed by the idea (letterform), a hole that draws a second meaning (negative
   space). Each has one twist a competitor's icon lacks; a sentence that could describe one of
   theirs is not a concept. Score each 1 to 3 on one idea, distinct, reads at 32 px, relevant
   but not literal; write the scores beside the sentences. Keep the three best that differ
   most. For each, `search_library` with its `subject` before building: taken, change it.

4. **Build the three**, each its own icon: `<app>-a`, `<app>-b`, `<app>-c`, mode `app`. First
   write the construction in words: primitives, grid unit, radii, angles. Then one `edit_icon`
   that starts with the background; keep its arguments in a file, step 7 reuses them:
   `{"name":"<app>-a","ops":[{"op":"add_node","node":{"type":"rect","id":"plate",...}}, ...]}`.
   Load `references/construction.md` before the first one; it holds the sizes, the recipes and
   the optical corrections. Cut a hole with `fillRule: "evenodd"`, never with a shape painted
   the background's colour: that shape counts as mark and shows on a gradient.

5. **Prove each.** `proof`, then read it row by row:
   1. Row 1: whole on all three platforms; not lost on the dark screen.
   2. Row 2: the mark parts from the background without colour; the blur keeps one shape you
      could name; at 16 px it is still that shape. Contrast under 3:1 (the answer gives it,
      and the two-tone cell turns all one colour): darken the background or lighten the mark.
   3. Row 3: no detail melts into a grey pixel.
   4. Row 4 and the scores: 0.6 or more is that logo drawn again — change the silhouette, not
      the colour. The score sees shapes, not ideas: an R scores low against an R of another
      cut. Look at the row anyway; the same idea is too close at any score.
   5. Name what the blurred cell looks like at a glance, other than your idea: a target, an
      eye, an apple, a button. If anyone would say that first, change the shape.
   6. The app checks and the measures of the mark: fix each, or keep one on purpose and say
      why. A point past the safe circle is named; move it, or shorten the part.
   Fix in one `edit_icon`, prove again. Twice at most; a third failure means the concept, not
   the drawing: say so and replace it.

6. **Checkpoint.** The user watches the app: name the three icons to open, one line per idea,
   the risk of each, your pick. Then stop and wait for their choice. Go on without asking
   only when the user said not to check in.

7. **Refine the chosen one** under the app's own name: `create_icon` `<app>`, then one
   `edit_icon` with the ops file of the chosen build and the refinements. Then:
   - Colour: one colour carries the identity; a second, or a neutral, at most; a gradient
     only on the background, two close tones, lighter at the top.
   - The optical pass of `references/construction.md` §4.
   - `proof` once more. Show it, with what changed and why.

8. **Deliver.** `export_app`: give the folder and what is in it. Animated, on request or as an
   offer: `in` (the icon builds itself on opening) and `hover`, through netsu-icon-motion.

## Budget

Per concept: one `create_icon`, one `edit_icon`, one `proof`, plus one edit and one proof to
fix. Searches: two for the category (summary, picture), one per kept concept. The final:
one `create_icon`, one `edit_icon`, one `proof`, one `export_app`. About 25 calls in all; more
than 35, say why.

## Brief template

```
App:        Tallybook — a ledger for small shops
For:        shopkeepers, on a phone, between customers
Adjectives: calm, exact, warm, trustworthy
Platforms:  iOS, Android, web
Keep/avoid: avoid green money cues; keep the brown of the shop sign
Assumed:    no existing logo to keep
```

## Example

Brief: Driftwell, a sleep and wind-down app; calm, soft, private. The category (`subject:
"moon"`, `industry: health-fitness`) is crescent moons, stars and night blue: the clichés.

```text
a  pictorial   A pillow whose crease is the horizon line of a setting sun.
b  abstract    Three nested arcs, slowing outwards, like breathing seen from above.  ← kept
c  negative    A closed eyelid; the lashes cut out of a dusk-coloured disc.
construction b: plate gradient #2b2d6e → #1d1f4f; three arcs centred [512,440], r 96 / 176 /
  256, stroke 56, round caps, each 240° open at the top.
```

First `proof` of b (measured): the outer arc reaches 32% of the view box from the centre
(safe: 31%), and at 16 px the arcs, 24 apart, melt into one blob. Fix: stroke 48, r 64 / 160 /
256 (gaps 48), centre [512,456]. Second proof: no app check fails, closest library logo 0.15;
at 16 px the arcs still blur together, the fan shape reads — said to the user as the risk of b.

## Anti-patterns

| ❌ Default behaviour | ✅ What we want |
|---|---|
| The product drawn as it is: a tooth for a dentist, a cloud for a weather app | The idea of the brief, seen another way |
| The category's look, because the model knows it | Its clichés listed, then avoided |
| One concept, polished at once | Eight sentences, three built, the user chooses |
| A white symbol on a rounded tile with a margin | Full bleed; the platforms cut the shape |
| The initial in a default font | A letter changed by the idea, built from primitives |
| Details that only exist at 1024 px | Every part still there at 32 px in `proof` |
| A gradient, a glow or a shadow to save a weak form | A form that works flat and in two tones |
| Judging the icon alone on white | `proof`: platforms, dark, small, and its neighbours |
| Copying a library logo because it scored well | Library logos are studied, never traced |

## References

- `references/construction.md` — step 4, before the first build: canvas, sizes, recipes,
  optical corrections.
