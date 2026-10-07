/**
 * What an agent must know to draw and animate an icon. Sent as the server's instructions and by the `guide`
 * tool: every agent that connects pays for each line, so a line that does not change what it does goes.
 */
export const GUIDE = `NetsuIcon: animated icons, edited by small targeted operations. The user watches the icon change live in the app.

WORKFLOW
1. list_icons ("pack": that pack alone), then get_icon or create_icon. get_icon with "clips":"ids" leaves the tracks
   out: enough to add clips. Several icons for one application: create_pack first (PACKS).
2. edit_icon with a list of ops. All or nothing: on an error nothing is saved and the error names the op.
3. look. "clip":"*": every clip in one image, a row each, a frame at each key (over 12 keys: spread evenly in time). The
   cheapest check. "clip" with "frames" (a number up to 12, or "keys"): one clip from start to end. "clip" with "t": one
   moment, larger. Frames show the edge of the view box.
4. export_icon for the code. export_pack: one HTML page with every icon of a pack alive.
Every icon tool takes an optional "pack".

DOCUMENT
- mode "micro": interface icon, view box 24; shapes inherit fill none, stroke currentColor, strokeWidth 2, round caps and joins. 1 unit of padding, strokes on whole or half units.
- mode "app": application icon, view box 1024, no inherited style: set fill on each shape. Gradients for depth.
- Nodes: path {d} | rect {x,y,width,height,rx?} | circle {cx,cy,r} | ellipse {cx,cy,rx,ry} | line {x1,y1,x2,y2} | group {children:[]}
- Every node: id (lowercase, digits, dashes; unique), name?, hidden?, fill?, stroke?, strokeWidth?, linecap?, linejoin?,
  opacity?, draw? (0..1: the part of the stroke drawn from its start), trim? ([from,to], each 0..1: the stretch drawn),
  translate? [x,y], rotate? (degrees), scale?, origin? [x,y].
- rotate and scale turn around "origin" (view box units; default: the centre of the view box). Set it to the pivot.
  translate then moves the turned, scaled part: its pivot travels with it. A group does the same to all it holds.
- y grows downward. rotate is clockwise when positive: a part left of its pivot rises, a part below it goes left.
- Later nodes are painted over earlier ones. Parts that move together: add an empty group, move_node each into it, animate the group.

OPS (edit_icon)
{op:"add_node", node:{...}, parent?:"group-id", index?:n}
{op:"update_node", id, set:{field:value, other:null}}   null removes a field; id, type, children cannot change
{op:"remove_node", id} (its tracks go too)   {op:"move_node", id, parent?:"group-id"|null, index?:n}
{op:"set_meta", mode?, size?, defaults?:{fill?,stroke?,strokeWidth?,linecap?,linejoin?}}
{op:"set_gradient", gradient:{id, type:"linear"|"radial", from?:[x,y], to?:[x,y], center?:[x,y], radius?, stops:[{offset,color,opacity?}]}}
   coordinates are fractions of the shape's box; use it with fill:"url(#id)"
{op:"remove_gradient", id}
{op:"set_clip", clip:{id, trigger:"hover"|"click"|"on"|"off"|"loop"|"in", duration:ms, delay?:ms, manner?:"subtle"|"expressive"|null}}
   on an id that exists: changes it and keeps its tracks
{op:"remove_clip", id}
{op:"set_track", clip, node, prop, keys:[{t, v, ease?}]}   replaces the track of that node and property
{op:"remove_track", clip, node, prop}

ANIMATION
- A track animates one property of one node: translate ([x,y]), rotate, scale, opacity, strokeWidth, draw (numbers),
  trim ([from,to]), fill, stroke (hex colours).
- Keys: t is a fraction of the clip, 0 to 1, rising. A track holds its first value before its first key and its last after
  its last. ease shapes the way to the next key: "linear" (default), "ease", "ease-in", "ease-out", "ease-in-out",
  [x1,y1,x2,y2], or "hold": the value stays, then jumps to the next key. [0.34,1.56,0.64,1] goes past its end and
  comes back; [0.36,0,0.66,-0.56] pulls back first.
- The view box cuts what crosses its edge. A thing that leaves by one side and comes back by the other: "hold" on its
  last key outside, so it does not cross the picture.
- draw and trim stay within 0..1. trim [0,1] is the whole stroke, [0,0] none at its start, [1,1] none at its end: a line
  that runs along its path and leaves is trim [0,0] → [0,1] → [1,1]. One shape takes draw or trim in a clip, not both.
  A path of several strokes runs them all at once, each from its own start: one node a stroke to run them in turn.

TYPE: WHAT A PRESS DOES. Decide it first, from what the icon stands for.
- ACTION: it is done and over (delete, send, search, add; also an icon that opens a page). Clips "hover" + "click"; the
  click ends at rest.
- SWITCH: a state that stays until the next press (lock, like, bookmark, mute, play, show). Clips "hover" + "on"; the on
  clip ENDS in the other state: its last values are the on state. The way back is the on clip run backwards, unless
  you write an "off" clip. Never a click and an on in one manner.
- STATE: nothing is pressed, something lasts (loading, recording). Clip "loop". Never a loop to make an icon look alive.
- ARRIVAL: it appears once. Clip "in".

HOVER AND PRESS
- hover: a hint of what the press does, small, back to rest: the lid of a bin lifts a little.
- The press (click or on) is the whole thing: the lid opens wide, a sheet of paper drops in, the lid shuts. Same part,
  same pivot, same direction as the hover, and more than the hover with larger numbers.
- A prop is a thing the action needs that the icon does not hold: what is thrown, sent, received. A node with
  "opacity":0, brought in by an opacity track that starts at 0, gone before the clip ends, painted over the icon. An object anyone names
  at a glance: a sheet with a folded corner, an envelope, a coin, a box. 2 to 4 strokes, 6 to 8 units wide, a stroke a
  quarter thinner than the icon's. Never a dot, a ball or a blob.

MOVEMENT THAT LOOKS REAL. First say how the real thing works; the movement follows from it.
- Which part moves, and where it is held: a hinge, a hook or an axle turns it around that point; a rail slides it; a
  thing held by nothing travels on a curve and turns as it goes. Never the whole icon, unless the whole thing moves.
- What drives it: a hand pulls back a little, moves fast and stops just past its end; gravity starts slow, speeds up
  and lands; a spring snaps past its end and stays; a motor ramps up and down with no bounce; wind comes in gusts;
  light is there at once.
- What it is made of: a heavy thing moves little and shakes what holds it; a light one swings past and back; a soft
  one squashes; light and signals have no weight, so no wind-up and no bounce.
- So a press has phases, each a key or two: anticipation, action, overshoot, settle. Keep the ones the thing would
  have. A part attached to the mover follows it, later and smaller.
- A line that flows (wind, water, a signal) runs along its own path with trim, one line after the other; never a fade.
- A hover or a click ends where it starts. A turn may end on the same picture (a gear with 8 teeth, 45 degrees).

MANNER: HOW MUCH HAPPENS. A clip may say which of two manners it belongs to; an icon can carry both, and the
application picks one. A clip that names none plays in both.
- "subtle": for an interface one works in. One idea, small and short: hover 250 to 500 ms, press 500 to 900 ms.
- "expressive": the same idea as a small scene in three beats, wind-up, the act, what it leaves behind: the plane pulls
  back, flies out of the box with a trail, and a new one glides in. Press 900 to 1800 ms, larger, more keys, up to
  three props (a trail, a splash, a puff). More of what the thing does, never decoration.
- Same type in both manners: the same story at two sizes.

IN A PAGE: hover is CSS :hover. A press needs the page: an action plays whole when the page sets data-play="<clip id>"
on the <svg> (the id is in its data-click); a switch (it carries data-switch) goes on with data-state="on" and back
with data-state="off". export_pack writes a page that does it; the React export does it by itself.

PACKS: the icons of one application, and what makes them look and move alike.
{name, brief?, mode, size, style:{fill?,stroke?,strokeWidth?,linecap?,linejoin?}, palette:{name:"#hex"},
 motion:{feel?, ease, manner?, hover:{duration:[min,max] ms, maxTranslate (units), maxRotate (degrees), scale:[min,max]},
         click:{the same}, expressive:{hover:{the same}, click:{the same}}}}
- create_pack: write the brief and motion.feel first; they say what to aim for.
- An icon of a pack inherits its mode, view box and style. Set no "defaults" on it, and strokeWidth on a node only for a reason.
- Colours: write "$name" (a name of the palette) wherever a colour goes. One the palette lacks is an error; a plain
  colour works but is reported.
- Easing: in a pack a key without "ease" takes motion.ease, not linear. Write "linear" when you want it.
- Limits: motion.hover and motion.click hold the subtle clips, motion.expressive the expressive ones; a press is a
  click, an on or an off. loop and in clips are free. motion.manner is the manner the application uses.
- edit_icon answers with the outline, then where the icon departs from its pack: advice, to fix or to keep on purpose.
- edit_pack merges key by key (null removes) and every icon follows at once. To restyle an application, change the
  pack, never the icons one by one.
- look_pack: all the icons side by side, at rest, or with "t" each at that moment of its hover ("trigger":"click": of its
  press; "manner": which manner). Check: same weight of line, same size in the box, same amount of colour, same kind
  of movement.`;
