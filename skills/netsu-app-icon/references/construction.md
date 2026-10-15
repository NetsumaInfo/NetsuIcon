# Building an application icon

All numbers are in the 1024 view box. Centre [512,512].

## 1. Canvas and sizes

| What | Value |
|---|---|
| Background | `rect` 0 0 1024 1024, no `rx`. Flat, or a linear gradient of two close tones |
| Safe circle | radius 313 from the centre: every visible part of the mark inside it |
| Mark | 400 to 620 wide or tall. A box of w × h fits the circle when √(w² + h²) ≤ 600: a square at most 424, 480 × 336 at most |
| Optical centre | centre of the mark's box at y 472 to 512 |
| Grid unit | 32; sizes and positions in multiples of 32, or of 16 for fine steps |
| Main stroke | 48 or more (1.5 px at 32 px). Nothing under 22. A stroke reaches half its width past its line, caps included |
| Gaps, holes | 40 or more, or they close at 32 px |
| Colours | background, mark, one accent at most: a hue that answers the background (warm on cool, or the reverse), on the one small part that carries the idea. Mark on background: contrast 3:1 or more |

## 2. Primitives first

Describe the construction in words before writing a path: *"a circle r 200 at [512,500];
a 90° wedge cut from its top right; a disc r 56 in the gap"*. Then use the simplest node:

- `circle`, `ellipse`, `rect` with `rx` for what they are.
- `path` with `A` for every circular curve: `A r r 0 large sweep x y`. Radii you can check.
- `C` only for organic curves: anchors at the extremes (top, bottom, left, right), handles
  horizontal or vertical there. A quarter circle as a cubic: handles 0.5523 × r long.
- Angles from 0, 15, 30, 45, 60, 90°. For 30° and 60° the offsets are 0.5 and 0.866 × length;
  for 45°, 0.7071 each. Never 44° or 2° off the vertical: it reads as a mistake.
- Few anchors. A curve that needs many points is two arcs.
- Reuse: keep a list of the radii and angles you used, and use them again.

## 3. Recipes

```jsonc
// Ring with an opening at the top right (stroke, round caps). An arc from the end of the gap to
// its start: large flag 1 when the arc is over 180°; sweep 0 goes counter-clockwise on screen
{"type":"path","id":"ring","fill":"none","stroke":"#fff","strokeWidth":64,"linecap":"round",
 "d":"M 653.4 370.6 A 200 200 0 1 0 712 512"}
// A hole: one path, two sub-paths, fillRule evenodd (a disc with a disc cut out)
{"type":"path","id":"disc","fill":"#fff","fillRule":"evenodd",
 "d":"M512 272A240 240 0 1 1 511.9 272Z M512 412A100 100 0 1 0 512.1 412Z"}
// Drop: two arcs and a point, symmetric on x 512
{"type":"path","id":"drop","fill":"#fff",
 "d":"M512 248 C 592 360 672 452 672 560 A 160 160 0 0 1 352 560 C 352 452 432 360 512 248 Z"}
// Speech bubble: a circle r 216 at [512,504] and a tail between 130° and 150°, one outline
{"type":"path","id":"bubble","fill":"#fff",
 "d":"M512 288 A 216 216 0 1 1 373.1 669.5 L 312 720 L 324.9 612 A 216 216 0 0 1 512 288 Z"}
// Disc r 192 cut by a wave into two pieces (four half circles r 48 from x 320 to 704); translate
// moves them 24 apart each way to open the cut
{"type":"path","id":"top","fill":"#fff","translate":[0,-24],
 "d":"M320 512 A48 48 0 0 0 416 512 A48 48 0 0 1 512 512 A48 48 0 0 0 608 512 A48 48 0 0 1 704 512 A192 192 0 0 0 320 512 Z"}
{"type":"path","id":"bottom","fill":"#ffc23d","translate":[0,24],
 "d":"M320 512 A48 48 0 0 0 416 512 A48 48 0 0 1 512 512 A48 48 0 0 0 608 512 A48 48 0 0 1 704 512 A192 192 0 0 1 320 512 Z"}
// Leaf: two arcs of one radius between two points
{"type":"path","id":"leaf","fill":"#fff","d":"M296 728 A 432 432 0 0 1 728 296 A 432 432 0 0 1 296 728 Z"}
// Letter from bars: an A with a flat apex, every slanted edge on one slope (144 across for 448 down),
// legs and bar 96 wide; the counter is a hole
{"type":"path","id":"a","fill":"#fff","fillRule":"evenodd",
 "d":"M464 288H560L704 736H608L577.1 640H446.9L416 736H320Z M477.7 544H546.3L512 437.3Z"}
```

Starting points. Change the proportions and add the twist of the concept.

## 4. Optical pass

Do it on the chosen icon, after the concept is settled.

- **Overshoot.** A round or pointed form looks smaller than a flat one of the same size: make
  it 2 to 3% larger (a circle beside a 400 square: r 206, not 200; an apex 12 above the line).
- **Optical centre.** Set the mark 10 to 30 units above the centre. A triangle or a drop,
  heavy at the bottom, higher still.
- **Thin horizontals.** Horizontal bars look heavier than vertical ones: 8 to 10% thinner.
- **Joins.** Look where strokes meet, at 2048 px if needed (`look` with `width`): no notch,
  no sliver, no lump. Two shapes of one colour that touch: one path.
- **Dark screen.** White on a dark tile looks heavier: if it does in row 1, thin the mark 3%.
- **Balance.** Mirror it in your head: a mark that leans by accident leans more when small.

## 5. Distinction

- `proof` row 4 shows the three logos of the library closest in shape. Change the silhouette
  until none is 0.6 or more. Below that, the same idea in the same shape is still too close.
- The familiarity test: if it looks like something you have seen and it is not yours, it is
  someone else's. Change it before the user sees it.
- The library cannot clear a trademark. Before launch, the user searches the trademark
  registers and does a reverse image search: say so when delivering.
