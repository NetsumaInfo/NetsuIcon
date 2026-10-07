# Expressive: the same verb, played out

Load `verbs.md` first: the mover, the type and your eight lines do not change. This page says
what to add; what drives the thing and what it is made of still set every start and end. Tag
every clip `"manner": "expressive"`; a new clip takes a new id, a revised one keeps its own.
Leave the subtle clips and the pack's `manner` as they are. The pack's `expressive` limits apply. The user's request sets how
much happens; the pack's `feel` still sets how: no bounce for a pack that says so.

## 1. What makes it expressive

- **Three beats.** Wind-up, 15 to 20% of the clip: the thing gathers itself, the other way,
  and holds a frame; when what drives it allows no pull back (gravity, light, a motor), the
  wind-up belongs to what is attached (the cloud squeezes) or is a held stillness. The act, 40
  to 50%: fast, all the way. What it leaves behind, the rest: it lands and settles the way it
  is made, and what it touched answers.
- **Larger where there is room, more beats where there is none.** A part that stays in the icon
  (a lid, a bell) stays in the view box: on an icon that fills it, expressive means more swings,
  a wind-up and an aftermath, not a bigger angle.
- **A thing that leaves, leaves.** It crosses the edge and the view box cuts it; no fade. It
  comes back by the opposite side: its last key outside takes `"ease": "hold"`, so it jumps
  there without crossing the picture; check that key is clear of the box, no still shows the
  jump. A prop comes in from outside the same way: it starts outside, and its `opacity` is 0
  at `t` 0 with `hold`, 1 at the moment it starts. A hover whose limits do not reach the edge
  fades, as LEAVE does.
- **Curves.** A travel has three keys or more and bends; write `linear` between the keys of
  one travel, or the pack's curve stops at each. A thing turns into its way.
- **Everything attached answers**, the way it is made: the stiff body crouches before the lid
  flips; the soft cloud squeezes before the rain; the tray bounces under the letter. Smaller,
  later, twice.
- **Up to three props**, each a thing that would really be there (§2). No glow, no sparkle on
  a thing that does not spark, no plus sign where it reads as "add" or "zoom".
- **The hover is the whole verb once, small, ending at rest**: the subtle press of an action
  without the thing it throws or receives; for a switch, a start toward on and back. A trail
  or a speed line may stay. Durations: the guide's, cut by the pack.
- **A pivot of its own.** This manner needs another pivot than the subtle clips use: put the
  mover in a new group with that `origin` and animate the group. Never change the `origin` of
  a node another clip turns or scales.
- **A switch with props gets an `off`**: write it; run backwards, the burst would fly back in.
  The `off` starts on the on state: key those values at `t` 0.

## 2. Props that follow a movement

`x y` is where it starts, in a view box of 24. The prop's thinner stroke. Colour: one of the
palette when the prop is a thing apart (a letter, a spark); the colour of the icon's own line
when it is more of the same thing (a wisp of cloud, a snowflake, dust).

| Prop | Path | How it plays |
|---|---|---|
| Trail | one line along the way just travelled, 5 to 7 long, its first point where the mover started | `trim` [0,0] → [0,1] → [1,1], a beat behind the mover |
| Speed lines | two lines along that way, 4 and 3 long, 2.5 apart, each a node, drawn the same way round | `trim` the same way, once |
| Splash | `M x y m-0.8 0 l-1.4 -1.4 M x y m0.8 0 l1.4 -1.4` | `draw` 0 → 1 in a tenth of the clip (both arms together), then `opacity` 0 |
| Puff | `M x y a2 2 0 0 1 4 0 m1.5 1 a1.5 1.5 0 0 1 3 0` | `translate` up 2 with `scale` 1 → 1.3 and `opacity` 1 → 0 |
| Sound arcs | `M x y a4 4 0 0 1 0 5` and its mirror `a4 4 0 0 0 0 5` on the other side | `draw` 0 → 1, then `opacity` 0, one pair per swing |
| Burst | one node above the thing: `M x y v-2 M x y m-2.6 1.4 l-1.7 -1 M x y m2.6 1.4 l1.7 -1` | `translate` [0,−1.5] with `opacity` 1 → 0, at the peak; one prop |
| Leaf | `M x y q2.2 -2.2 4.4 0 q-2.2 2.2 -4.4 0 z` | carried along a line from outside to outside, turning half a turn |

## 3. By verb

Hover, then press. Angles and scales are still cut by reach.

- **Hangs** (bell). SETTLE at its reach. — Wind-up −3; four swings from its reach down, the
  clapper following; sound arcs on both sides for the first two swings.
- **Turns** (gear, sun). TURN, one arm, the hub swelling as it stops. — A gear: a held start,
  the turn nearest a whole one that lands on itself, `ease-in-out`, a clean stop; the hub
  `scale` .85, 1.15, 1. A dial turned by hand: wind-up −15, 8 past and back. A sun: rays and
  disc draw in and hold, one even turn, the rays reaching out as far as the box allows.
- **Opens**, action (bin). The lid PRESS to its reach, the body giving. — Body and lid crouch
  0.8; the lid flips to its reach; a sheet arcs in from outside the box, turning 200 degrees;
  the body bounces twice as it lands and a puff rises; the lid slams and settles.
- **Opens**, switch (lock). The shackle NUDGE 1.5 while the case leans. — `on`: the keyhole
  turns a quarter, then the case hops 1 and the shackle springs open with OVER; the case
  lands and settles. It stays open.
- **Goes somewhere** (plane, arrow). It banks −5 to −8 on its tail and edges forward; a trail
  runs behind it. — It pulls back 2 and tilts, holds; shoots along a curve out of the box,
  `scale` to .6, trail and speed lines behind it; a beat of nothing; a new one glides in from
  the opposite corner on a curve and settles with OVER.
- **Falls** (rain). Each drop LEAVE in turn, twice in the clip. — The cloud squeezes, `scale`
  .94 toward its base, and springs back; the drops fall from rest, with no rise, out the
  bottom of the box, .08 apart, each replaced under the cloud, twice; a splash on the bottom
  edge as each passes it.
- **Falls, lightly** (snow, leaves). Each flake swirls down 2 and back. — The cloud leans 0.5;
  the flakes fall out the bottom on S curves, many `linear` keys ±0.8 aside, slow, no bounce;
  new ones follow, and one or two smaller flakes fall between them.
- **Strikes** (lightning). The bolt withdraws, holds, strikes back; the cloud dims. — The cloud
  dims and shakes x ±0.8; the bolt withdraws, strikes in a twentieth of the clip, flashes
  twice; the cloud recoils.
- **Flows** (wind). Every line RUNs with a push of 1, staggered. — The lines pull back and
  hold; two gusts, every line RUNs twice with a push of 2; a leaf or two carried across.
- **Floats** (cloud, moon). SETTLE 1.5 with a bob. — A cloud sails out one side and comes in
  by the other, swaying twice as it stops, a wisp left behind. A moon rocks, SETTLE at its
  reach, and its star twinkles twice.
- **Shows a level** (thermometer). `draw` 1, .5, .5, 1. — It sinks low and holds, climbs with
  `ease-out`, slowing as it arrives; marks beside the tube are drawn one by one as the column
  passes them. The tube stays still.
- **Beats**, switch (heart). `scale` SETTLE 0.12. — `on`: it squeezes to .8 and holds, bursts
  as far as the box allows, bounces twice to 1; the filled twin with it; a burst around it. It
  stays full. `off`: it squeezes a little and empties.
- **Takes in** (inbox). The arrow DROP 1.5 twice. — The arrow lifts and dims; an envelope flies
  in from outside on a wide arc, turning once; the tray drops 1 and bounces twice.
- **Looks** (magnifier). `rotate` SETTLE −10 on its grip. — It tilts and holds, swings out, then
  circles once around what it searches, eight `linear` keys on a ring as wide as the box
  allows, and stops, the glass swelling once.
- **Sends out waves.** Every arc once. — Twice, outward, the source swelling on each.
- **Shakes.** `translate` x SETTLE 1.5. — a = 2.5 with `rotate` ±6, six swings.
- **Works** (tools). The tool lifts and strikes once. — It works three times, and what it
  makes appears: a line drawn, a chip flying, a bolt turned a quarter.
- **Anything else.** Its subtle press as the hover; for the press, add the wind-up and the
  aftermath of §1 and the one thing the action would leave behind.

## 4. Checks

The seven of the skill, with one change: a thing that leaves may cross the edge. And:

8. The three beats are there, and the wind-up holds for a frame.
9. Each prop is a thing with a name, and is gone at the end.
10. Next to the subtle clips: the same story, the same type, with more in it.

`look` with `clip: "*"` spreads a long clip evenly in time: it is enough, a second look at
the same clip shows the same moments.
