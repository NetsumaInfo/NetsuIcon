# One button, several modes

Load when one button does its action in a mode the user picks elsewhere: an insertion mode
(insert, overwrite, replace, above, at the end), an export target, a loop mode, an alignment.

## Find the modes

Read them from the application, not from the label: the type or the list of options, and what
each one really does to the content. Name each mode in one line before drawing:

```
end:      the shot is placed after the last clip of the track
insert:   the clips after the playhead slide right, the shot fills the gap
overwrite: the shot lands on the track and covers what was there
replace:  the shot takes the place of one clip, same length
above:    the shot lands on the track above, over the clips
fit:      the shot is stretched or squeezed to fill the gap
```

Two modes whose press would look the same are one icon: say so.

## One icon per mode

- Name: `<icon>-<mode>`, in the same pack. The application shows the icon of the mode in use.
- The rest picture is the same for every mode, so the button does not jump when the mode
  changes. A mode may add one small mark at rest (a slot at the end, a second track) only when
  the user must tell the modes apart without pressing.
- The hover is the same for every mode: it hints at the action, not at the mode.
- The press is what differs, and it shows that mode's result: where the thing lands, what
  makes room, what is covered, what is taken away. Same mover, same timing; only the place
  and the answer of the rest change.
- A loop for a long task follows the same rule.
- Draw the rest as the content really is: clips on a timeline touch, rows of a list are tight.
  A gap at rest is already a mode (insert) and makes the others lie.
- Only what the mode removes leaves. Content that stays stays in view, even when it moves: at
  the end, the first clip slides along, it does not fade out. A replacement takes the whole
  place of what it replaces, same size, nothing of the old one left.
- Act each mode on paper first: draw its last frame before writing a key. The application's
  code says what moves, what makes room, what is covered.

## Check

`look_pack` with `trigger: "click"` and `t` near the landing: the modes side by side must read
as different places and answers of one gesture. Someone who knows the modes can name each one.
