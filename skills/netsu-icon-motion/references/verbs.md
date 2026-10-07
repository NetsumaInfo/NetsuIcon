# Verbs: the subtle hover and press of each thing

Numbers are for a view box of 24 and no pack; a pack's limits win, another view box scales the
moves. Press = a `click` for an action, an `on` for a switch. Each row is the usual build of
the thing; your eight lines say when this one is built another way.

## 0. Signs

- An echo hanging inside a swinging part goes the way its mouth goes and no further: negative
  x for a positive angle.
- A size for a `translate` is the length of the move, on a diagonal too.
- `draw` and `trim` count from the first point of the path. Wrong end: rewrite the path, the
  same picture from its other end; that is not a redraw. `draw` 0 shows nothing, not even a dot.
- `scale` is the same on both axes. `fill` and `stroke` keys blend between two hex colours
  only: from `none`, fade a filled twin in with `opacity`.

## 1. Key shapes

`a` is the size. Values at their `t`; easings one per step, the last repeating. OVER is
`[0.34,1.56,0.64,1]`.

| Shape | Values at t | Easing |
|---|---|---|
| NUDGE | 0, +a, 0 at 0, .4, 1 | `ease-out`, `ease-in-out` |
| PRESS | 0, −0.1a, +1.1a, +a, +a, 0 at 0, .1, .3, .4, .72, 1 | `ease-out`, `ease-out`, `ease-in-out`, `linear`, `ease-in-out` |
| STAY | 0, −0.1a, +1.1a, +a at 0, .15, .7, 1 | `ease-out`, `ease-out`, `ease-in-out` |
| SETTLE | 0, +a, −0.7a, +0.45a, 0 at 0, .2, .45, .7, 1 | `ease-out`, `ease-in-out` |
| DROP | 0, +a, 0 at 0, .3, 1 | `ease-in`, OVER |
| LEAVE | translate 0, −0.1d, +d, −0.6d, 0 at 0, .12, .45, .5, .85; opacity 1, 1, 0, 0, 1 at 0, .25, .45, .5, .85 | `ease-out`, `ease-in`, `hold`, OVER; opacity `linear` |
| THROWN | a prop: translate start, a point across, the end at .16, .4, .66; rotate −15 → 60; opacity 0, 1, 1, 0 at .08, .18, .58, .68 | `ease-out`, `ease-in`; the rest `linear` |
| TURN | 0, k × 360 / N at 0, 1; by hand (dial, knob, key): 0, −3, k × 360 / N + 4, k × 360 / N at 0, .1, .75, 1 | `ease-in-out`; by hand `ease-out`, `ease-in-out` |
| SPIN | 0, 360 at 0, 1, in a `loop` | `linear` |
| BEAT | scale 1, 1+a, 1, 1+0.6a, 1 at 0, .15, .3, .45, .6 | `ease-out`, `ease-in`, alternating |
| RUN | trim [0,1], [1,1], [0,0], [0,1] at 0, .4, .41, 1 | `ease-in`, `linear`, `ease-out` |
| TRACE | draw 1, .6, 1 at 0, .3, 1 | `ease-in-out`, `ease-out` |

- "From `t` x" squeezes a shape between x and 1. An echo starts at .05 to .15, at 40 to 60% of
  its mover when in the same unit.
- Stagger: parts start 0.1 apart, each the same length; shorten the shape so the last ends by 1.
- A shape is the fullest case. Drop the pull back, overshoot or settle that Driven and Made of
  rule out: a spring has no pull back (STAY starts 0, +1.1a), gravity none either, a motor no
  overshoot, light neither.
- PRESS is an action, STAY the way on of a switch. A hover is NUDGE, DROP, TRACE, or one RUN
  among lines that stay.
- LEAVE and RUN are back before `t` 1. A whole icon may be unseen for a blink, in a press only.
  LEAVE is unseen before its stroke reaches the edge: near the edge, fade it by .3. It comes
  back from as far as the gap allows, never through what it left from. The fade is for a move
  the limits keep inside the box; a thing that can reach the edge leaves by it, with no fade.
- TURN in a pack: the largest k that fits where it stops. Even one step does not fit, or the
  press turns no further than the hover: keep the turn.
- A shape on two tracks: anticipation on the first, overshoot and settle on the last.

## 2. Props

Path data for a view box of 24; `x y` is the top left corner. A colour of the palette, a stroke
a quarter thinner than the icon's, `origin` at its own centre, painted over the icon, starting
in the clear.

| Prop | For | Path |
|---|---|---|
| Sheet | bin, folder, printer, archive | `M x y h3.5 l2 2 v5 h-5.5 z m3.5 0 v2 h2` |
| Envelope | inbox, mailbox, send | `M x y h6 v4.2 h-6 z l3 2.3 l3 -2.3` |
| Box | cart, bag, download | `M x y h6 v5 h-6 z m0 1.8 h6` |
| Coin | wallet, payment | a circle r 2.75 with `M x y v2` inside, in a group |
| Drop | glass, fuel, ink | `M x y c-1.8 2.4 -2.5 3.6 -2.5 4.8 a2.5 2.5 0 0 0 5 0 c0 -1.2 -0.7 -2.4 -2.5 -4.8 z` |
| Spark | wand, idea, new | `M x y l0.8 1.7 l1.7 0.8 l-1.7 0.8 l-0.8 1.7 l-0.8 -1.7 l-1.7 -0.8 l1.7 -0.8 z`: a star, never a plus (it reads "add") |
| Check | save, done, copy | `M x y l2 2 l4 -4` |

None fits: draw the thing the action is about the same way.

## 3. Verbs

A thing under two verbs takes the row of what it means here. A thing made of two (a cloud and
its rain) takes the row of the part that acts.

**It hangs and swings** — bell, tag, key ring, pendulum, lantern, medal
- Mover: the hanging part, around the point it hangs from (its top when no hook is drawn).
- Hover: `rotate` NUDGE 5 to 8. Click: `rotate` SETTLE 10 to 18 after −2; echo, the loose part
  inside `translate` x SETTLE.

**It turns** — gear, fan, wheel, sun rays, dial, compass, refresh, sync, loader
- Mover: the wheel, around its axle; rim and hub stay.
- Hover: `rotate` 0 → 360 / N. Click: TURN, k = N / 2, or a whole turn for arrows around a
  circle; echo, the hub `scale` NUDGE 0.1 at the end. A needle: NUDGE 10, SETTLE 25.
- Sun rays stand for shining; nothing drives them: even turns, the disc `scale` NUDGE 0.1.
- As a state: SPIN, 900 to 1200 ms.

**It opens** — bin, box, gift, envelope, door, book, laptop, folder, mailbox; lock
- Mover: the lid, flap or shackle; the body stays.
- Hover: hinged, `rotate` NUDGE at half its reach; no hinge, `translate` up NUDGE 1.
- Action (bin, box, folder): `rotate` PRESS to its reach; a prop THROWN in during the hold;
  echo, the body gives [0, 0.6].
- Switch (lock, door, book): STAY. A lock: the keyhole turns a quarter first (the key lets
  the spring go), then the shackle up 1.5 to 2 and `rotate` 20 to 25 on one leg, no pull back.

**It goes somewhere** — arrow, chevron, send, share, external link, upload, rocket, undo
- Mover: the arrow or the craft, along the way it points; never its frame.
- Hover: `translate` NUDGE 1.5 to 2. Click: LEAVE 5 to 8; an icon that fills the box goes 2.5
  and shrinks to 0.7 toward its nose instead.
- A curved arrow: `rotate` around the centre of its curve, NUDGE 12, SETTLE 30. A chevron that
  opens a list is a switch: `rotate` STAY 90 or 180.

**It falls, or it rises** — rain, snow, drop, leaf, confetti; steam, bubble, flame; lightning
- Mover: each particle, staggered; what they fall from stays. Rising: the same, y negative.
- Hover: each DROP 1. Click: each LEAVE without the pull back. Heavy: straight, 1.5 to 2,
  landing with OVER. Light: 1.2 to 1.5 on a curve, a middle key 0.5 aside, no OVER. The new
  one appears at once (`hold`) where it falls from, behind that line.
- Lightning: `draw` from the top. Hover: `draw` 1, .6, .6, 1 at 0, .3, .46, .54: it withdraws,
  holds, strikes back at once. Click: `draw` 1, 0, 1, the strike in a tenth of the clip,
  `ease-in`, then one flash of `opacity`.

**It flows** — wind, water, wave, signal line, route, pulse line
- Mover: each line, with `trim`.
- Hover: the top line RUNs, the others stay. Click: every line RUNs, staggered 0.12, each with
  a `translate` of 1 along its way.
- As a state: RUN in a `loop`, 1400 ms.

**It is drawn** — check, signature, underline, chart line, graph
- Mover: the stroke, with `draw`.
- Hover: TRACE, staggered. Click: `draw` 1, 0, 1 at 0, .2, 1, strokes one after the other.
  Arriving: `draw` 0 → 1 once. A checkbox is a switch: `on` draws the check.

**It floats** — cloud, moon, balloon, boat, planet, kite
- Mover: the thing; a small part beside it echoes. A crescent or a boat rocks on its own centre.
- Hover: `translate` NUDGE 1, or `rotate` NUDGE 6. Click: `translate` SETTLE in the room it
  has, with a bob of 0.5 up; or `rotate` SETTLE 14.

**It shows a level** — thermometer, battery, gauge, progress, signal bars
- Mover: the column or the bars; the case stays.
- A column: `draw` from its foot. Hover 1, .7, 1. Click 1, .25, .25, 1 at 0, .3, .45, 1, the
  climb `ease-out`: a liquid finds its level and never goes past it.
- Bars: `opacity` .3 → 1 from the lowest, staggered. Hover: the top one.

**It beats** — heart, record dot, badge, map pin
- Mover: the thing, `scale` around its own centre. Hover: NUDGE 0.08.
- A heart, a star, a pin is a switch: `on` is scale 1, .9, 1.2, 1 at 0, .15, .5, 1 while a
  filled twin, same `scale`, same `origin`, fades in and stays.
- As an action: BEAT 0.15. As a state: `opacity` 1, .35, 1 in a loop, 1400 ms.

**It sends out waves** — wifi, signal, speaker, volume, radar, contactless
- Mover: the arcs, nearest first; the source stays.
- Hover: the nearest arc, `opacity` 1, .3, 1. Click: every arc, staggered outward by .15.
- Sound on and off is a switch: `on` takes the arcs away and draws a bar across.

**It shakes** — alarm clock, ringing phone, warning, error, a refusal
- Mover: the whole thing, the one verb where everything moves.
- Hover: `translate` x 0, −0.7, +0.7, 0. Click: 0, −a, +a, −0.6a, +0.6a, 0 with a = 1.5.
- Alarm, phone: `rotate` around its base, NUDGE 5, SETTLE 10.

**It switches** — toggle, checkbox, bookmark, bulb, eye, play and pause, menu, pin
- Hover: a third of the way and back. `on`: STAY.
- Knob: `translate` along its track. Bookmark, bulb: a filled twin, `opacity` and `scale`
  .8 → 1 with OVER. Eye-off: a bar, `draw` 0 → 1.
- Play to pause: the triangle fades as two bars draw. Menu to close: the outer lines `rotate`
  ±45 on their centres and meet; the middle one fades.

**It looks** — magnifier, eye, cursor, pointing hand, telescope
- Magnifier: glass and handle as a group, around the grip. Hover: `rotate` NUDGE −6. Click:
  0, +2, −10, +8, −4, 0; echo, the glass `scale` NUDGE 0.08 on the last swing.
- Eye: the pupil `translate` x NUDGE 1; click, both ways, then `scale` to .7 and back.
- Cursor: `translate` 1 toward its tip; click, with `scale` .9.

**It works** — pencil, brush, eraser, hammer, wrench, scissors, key, wand
- Mover: the tool, around its tip or its screw. Hover: `rotate` NUDGE 6 away from the work.
- Click: pencil, `translate` 1.5 along its stroke, twice, a line drawing behind it. Hammer:
  back 25, down past rest by 3, 0. Scissors: each blade NUDGE 12, opposite, twice. Wrench,
  key: SETTLE 20. Wand: NUDGE −15 and a spark at its tip.

**It takes in** — inbox, tray, download, cart, bag, archive, save
- Hover: the arrow or the item `translate` DROP 1.
- Click: a prop the app is about is THROWN in from the upper left; an arrow, if drawn, dims to
  .25 and DROPs 1.5 as it lands; echo, the container gives [0, 0.6].
- Nothing with a name: the arrow alone, LEAVE 3 to 5 along gravity.

**It grows** — expand, fullscreen, zoom, resize, plus
- Corners: `translate` outward. Hover NUDGE 0.8, click SETTLE 1.5. Fullscreen is a switch.
- Plus: hover `rotate` NUDGE 15; click TURN N = 4. Plus to cross is a switch, STAY 45.
- Zoom: `scale` on the glass, NUDGE 0.06, then 0.14.

**It counts time** — clock, timer, hourglass, history, calendar
- Hands, around the dial's centre. Hover: the minute hand NUDGE 30. Click: minute hand 360,
  hour hand 30.
- Hourglass: NUDGE 12, TURN N = 2. Calendar: the top band up, NUDGE 0.6, then 1.5.

**It speaks** — chat bubble, microphone, megaphone, music note, phone
- Bubble: hover `scale` NUDGE 0.05 from its tail; click, its dots light one after the other.
- Note: `translate` y with `rotate` on its stem, NUDGE −1, SETTLE −2.
- Megaphone, phone: its marks send out waves. Microphone on and off is a switch.

**It is a person** — user, profile, waving hand, thumbs up
- Hand: `rotate` around the wrist, NUDGE 8, SETTLE 14. Thumbs up as a vote is a switch.
- A person: the head nods, `translate` y NUDGE 0.5; click, twice. Never turn a person.

**Nothing fits.** The verb of the action: delete goes away, add arrives, save takes in. Still
nothing: its parts lift 0.5 one after the other, then arrive in reading order. A scale of the
whole icon is the last resort: name it as a fallback.
