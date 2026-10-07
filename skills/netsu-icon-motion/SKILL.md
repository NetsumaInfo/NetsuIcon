---
name: netsu-icon-motion
description: Use when the user asks to animate an icon, add a hover, click, on/off, loading or entrance animation to an icon, make an icon move, react, switch on and off or come alive, make an animation subtler or more expressive, redo, fix or retime an icon's animation, or animate every icon of a pack, in NetsuIcon (the netsuicon MCP server). Do NOT use for drawing, redrawing or recolouring an icon or a pack, for motion of interface parts such as menus, buttons, spinners, dialogs and page transitions (netsu-peccable), or for Lottie, After Effects and video.
---

# NetsuIconMotion

Work out how the thing an icon draws really works, then make the icon move that way: a hover
that hints, a press that does.

## Requirements

- The `netsuicon` MCP server. Call `list_icons` first; if it fails, stop and say so (NetsuIcon
  starts with `pnpm dev` in its folder). With a shell and no MCP connection, the same tools:
  `pnpm --filter @netsuicon/server mcp <tool> '<json args>' [image.png]`, from that folder.
  Alone, `mcp` lists the tools and their arguments; long arguments go in a file: `'@args.json'`.
- Its `guide` tool holds the format and defines type, hover, press, prop, phase and manner. Read
  it once. This page does not repeat it: it says how to choose and how to check.

## Procedure

1. **Read.** `list_icons` with the `pack`: its `feel`, limits and manner in use win over every
   number here. Then `get_icon`; with `"clips":"ids"` when you only add clips. Clips already
   there: `look` with `clip: "*"` before editing, and judge each against your eight lines, not
   against its row. A clip fits when its frames show what drives the thing; keep it, with its
   id. Rewrite the others.

2. **Say how the thing works, before the first edit.** Eight lines, from the nodes and the
   picture, not from the name:

   ```
   Thing:   a padlock
   Parts:   case, fixed · shackle, moves · keyhole, rides on the case
   Held:    the shackle in the case by its right leg [16,11]: it slides up, then turns on that leg
   Driven:  a spring, let go by the key: sudden, past its end, one settle
   Made of: steel: heavy, stiff; small moves, the case takes the kick
   Means:   a private conversation → switch
   Hover:   the shackle rises a notch, and drops
   Press:   it lifts, swings open, stays open; the case hops
   ```

   **Held** says what the mover can do, and its pivot.

   | Held by | It can only | `origin` |
   |---|---|---|
   | A hinge, hook, axle, wrist, screw, grip | turn | that point |
   | A rail, slot, stem, track | slide along it | none |
   | Nothing: thrown, falling, flying, floating | travel on a curve, turning as it goes | its own centre |
   | It is a stroke: a line, a wave, a check | run or be drawn (`trim`, `draw`) | none |
   | It is one soft thing: heart, cloud, bubble | swell and squeeze | its centre, or its base |

   **Driven** gives the timing; **Made of** gives the size and the end.

   | Driven by | Start | End |
   |---|---|---|
   | A hand: lid, tool, lever, page | a small pull back, then fast, `ease-out` | just past, one settle |
   | Gravity: it falls, pours, hangs | slow then fast, `ease-in`; no pull back | lands (OVER when hard); a hanging thing swings and dies out |
   | A spring or latch: lock, toggle, clip | sudden | past its end (OVER), then stays |
   | A motor or clockwork: gear, fan, hands | ramps up, `ease-in-out` | ramps down, no bounce |
   | Wind or water: flag, leaf, wave, smoke | in gusts, never a full stop | drifts on, curves |
   | A living thing: heart, eye, hand | a squeeze first | two soft beats |
   | Light or current: bulb, bolt, signal | at once, no easing | flickers, or holds |
   | A slow change: heat, a liquid, growth | quick, then slowing, `ease-out` | at its level, never past |
   | Nothing: it shines or sits (sun, moon) | even, `ease-in-out` | even, no bounce |

   | Made of | So |
   |---|---|
   | Heavy and stiff: metal, stone, glass | small moves, a short settle; what holds it shakes |
   | Light and stiff: paper, plastic, a lid | swings past, one or two swings back |
   | Soft: cloth, a drop, flesh, a cloud | squashes with `scale`, no sharp stop |
   | No weight: light, sound, a signal | no pull back, no bounce: it runs, blinks or fades |

   - A sign, not a thing (arrow, plus, check, chevron): it has no works. It does what it
     says: points further, is drawn, turns into its other sign.
   - Type: would the user press again to undo it? Switch. Otherwise action; a pictogram that
     controls nothing (weather) is an action whose press plays the thing it names.
   - Means not written anywhere: take the usual one and say you assumed it. Ask only when the
     Thing itself cannot be told.

3. **Take the numbers from the verb.** Load `references/verbs.md`; find the row and take its
   sizes and shapes. Your eight lines win over the row: Held says which movement (a lid that
   lifts off does not turn), Driven and Made of say which of a shape's pull back, overshoot
   and settle stay. No row: write the keys from the tables above. Never a `scale` of the whole
   icon, unless the thing itself swells.

4. **Free the mover.** Drawn in one path with what stays: split it into two nodes that look the
   same. Parts moving together: a group. `origin` from the Held table.

5. **Write the clips**, all in one `edit_icon`.

   | Type | Clips | The press |
   |---|---|---|
   | Action | `hover` + `click` | Ends at rest |
   | Switch | `hover` + `on` | Ends in the other state; an `off` only when undoing is not the reverse |
   | State | `loop` | Lasts as long as the state |

   - **Manner.** `subtle` unless the user or the pack asks for `expressive`. Asked for both, or
     for "more": tag the clips, and for `expressive` load `references/expressive.md`.
   - **Size the press first**: the row's range, cut by Made of, by the pack's limits, then by
     reach (the far end of a turning part travels about angle × distance from the pivot / 57
     units and stays in the view box, stroke included; a slide has the room in front of it).
   - **The subtle hover is the first step of the press**: a third to a half of the press you
     sized, one push and back, no pull back. Under 1 unit or 4 degrees it cannot be seen: that
     floor wins, even over the half.
   - **Phases** come from Driven: keep the pull back, the overshoot and the settle the thing
     would have, drop the others. A pull back is at least 0.3 unit or 2 degrees.
   - **Cause first.** What lets the mover go moves before it: the key turns, then the shackle
     springs; the cloud squeezes, then the rain falls.
   - **What is attached answers**: later, smaller, the way Made of says (a heavy case hops, a
     soft cloud squeezes).
   - **Easing in a pack**: leave `ease` out where a shape says `ease-out` then `ease-in-out`;
     write every other easing it names.
   - **A prop** comes from `verbs.md` §2, and moves by the same tables: a sheet is light, a
     coin is heavy.

6. **Look once.** `look` with `clip: "*"`: every clip, a row each. For a switch the last frame
   of `on` is the icon on. Check:
   1. Hover: every frame reads as the icon. On: its last frame alone says "on".
   2. The mover stays attached: a pivot does not travel, a slide keeps its contact.
   3. Nothing that can be seen crosses the edge of the view box.
   4. Hover and click end on the first frame; no prop is left.
   5. After its pull back the press goes the hover's way, further, with a phase it lacks.
   6. One frame of the prop is enough to name it.
   7. The frames show your eight lines: someone who sees them could say what drives the thing.

   Fix in one `edit_icon`, look again. A turn or a long travel: `frames: 10` on that clip.

7. **In a pack**, once at the end: `look_pack` with `trigger: "click"`, the `manner` you wrote
   and `t: 0.4`. Same verb, same movement as its neighbours; vary the size, not the idea. (A
   turning icon may sit on its rest picture at that moment.)
   Bring the clips inside the advice; keep a departure only when the thing needs it. The `feel`
   wins over this page's habits (no bounce: `ease-out` instead of an overshoot); the works of
   the thing win over the feel for its own icon.

8. **Report**, six lines an icon at most: Driven and Made of in a few words, the type and what
   you assumed, the clips, departures kept. Frames are not motion: the user watches it move.

## Budget

An icon costs one `get_icon`, one `edit_icon`, one `look`. A second edit and look to fix. More
than that, say why. No `look` before editing an icon without clips when the nodes say what is
drawn; one, with `clip: "*"`, when you review clips. For a pack: one `look_pack` at rest first
replaces a look at each icon.

## Rules

- **The swap test.** The clips would fit another icon just as well: generic. Back to step 2.
- Only the mover moves; the rest stays, or answers.
- At rest the icon is unchanged. Nodes you may add: props, what a switch shows when on, and a
  group around a mover that needs a pivot. Never change the `origin` of a node a clip already
  turns or scales.
- No morph, no stretch on one axis, no mask: separate nodes and the properties the guide lists.

## Example

A bin. Lid: on a hinge at [20,6], 16 long, light plastic, lifted by a hand. Body: fixed, stiff.
So the lid pulls back, flips fast, swings past and back once; the pack's click allows 12.

```jsonc
// hover: the lid lifts 8 degrees (reach allows 16) and shuts
{"op":"set_clip","clip":{"id":"peek","trigger":"hover","duration":400,"manner":"subtle"}}
{"op":"set_track","clip":"peek","node":"lid","prop":"rotate","keys":[{"t":0,"v":0},{"t":0.4,"v":8},{"t":1,"v":0}]}
// click: pull back −2, open past 16, settle, hold while a sheet falls in, shut
{"op":"set_clip","clip":{"id":"throw","trigger":"click","duration":900,"manner":"subtle"}}
{"op":"set_track","clip":"throw","node":"lid","prop":"rotate","keys":[{"t":0,"v":0},{"t":0.08,"v":-2},
  {"t":0.26,"v":18},{"t":0.34,"v":16,"ease":"linear"},{"t":0.74,"v":16},{"t":1,"v":0}]}
// the sheet (verbs.md §2, THROWN): light, held by nothing: a curve, slow then fast, turning
{"op":"set_track","clip":"throw","node":"sheet","prop":"translate","keys":[{"t":0.16,"v":[0,0],"ease":"ease-out"},
  {"t":0.4,"v":[3.2,0.4],"ease":"ease-in"},{"t":0.66,"v":[7.6,8.6]}]}
// the body is stiff: it gives 0.6 as the sheet lands, and comes back
```

## Anti-patterns

| ❌ Default behaviour | ✅ What we want |
|---|---|
| Scale 1 → 1.1 → 1 on the whole icon | What the thing drawn does, the way it is built |
| Every icon eased the same way | A hand, gravity, a spring, a motor: each has its own start and end |
| A steel lock that wobbles like paper | Made of decides the size and the settle |
| A lock or a heart that springs back after the press | A switch: `on` ends in the other state |
| A dot or a ball as the thing that goes in | A sheet, an envelope: an object with a name |
| Lines of wind that fade in and out | Lines that run along their path with `trim` |
| A press that is the hover with larger numbers | Another shape: phases, an answer, a prop |
| Expressive made of decoration: sparkles, a glow | More of what the thing does |
| A `look` per clip, before and after every edit | One `look` with `clip: "*"` per icon |

## References

- `references/verbs.md` — step 3, always: key shapes, props, and each verb's mover, hover, press.
- `references/expressive.md` — step 5, only for the expressive manner.
