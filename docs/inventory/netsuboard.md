# NetsuBoard — action icons to redraw

Source: `S:\projet_app\NetsuBoard\src`. Lucide (about 466 sites). Plug-in points: `IconBtn` (`Toolbar.tsx:55`), `IconToggle` / `IconAction` (`inspectorControls.tsx`), registries `PINNED_BUTTONS`, `TOOL_ICON`, `ARRANGE`, `LINK_MODES`. Registries are typed `typeof LucideIcon`: loosen to `ComponentType<{ className?: string }>`.

Excluded: user emoji and callout emoji, brand glyphs (simple-icons, platform logos via `iconForLink`), host PNGs, flags, `HarmonyIcon` (already custom), file-kind badges, slash-menu kind icons, release-note categories, shadcn primitives.

Motion level: **L** long task = expressive, loops while busy, distinct done state. **A** instant = one short gesture. **T** toggle = two held states. **N** nav = subtle hover.

## Tier 1 — toolbar and long tasks

| id | today | what it does | kind | note |
|---|---|---|---|---|
| add-text | Type | Add text item at view centre | A | |
| add-block | TextQuote | Add Markdown block | A | |
| add-frame | Frame | Add group frame | A | |
| draw-toggle | Pencil | Enter / leave draw mode | T | |
| palette-studio | SwatchBook | Open palette generator | N | |
| extract-palette | Pipette / Palette | Extract colours from media into palette block | A | mismatch: two glyphs; pipette = eyedropper |
| tidy | Wand2 / LayoutGrid | Arrange selection | A | mismatch: Wand2 also upscale |
| snap | Magnet | Snap to grid | T | |
| zoom-in | ZoomIn | Zoom ×1.25 | A | |
| zoom-out | ZoomOut | Zoom ×0.8 | A | |
| fit-all | Maximize | Fit all items | A | |
| freeze | Pause / Play | Freeze / resume all animated items | T | mismatch: Snowflake used elsewhere |
| undo | Undo2 | Undo | A | |
| redo | Redo2 | Redo | A | |
| mouse-through | MousePointer2 / MousePointerBan | Click-through window | T | mismatch: Ban reads forbidden |
| save | Save | Save scene | A | |
| save-as | SaveAll | Save as | A | |
| open-scene | FolderOpen | Open scene / project | N | |
| new-scene | FilePlus2 | New empty scene | A | |
| share | Share2 | Share menu | N | |
| share-project | Package | Export .netsu project | L | mismatch |
| export-image | ImageDown | Render board to image | L | |
| collab | Users | Share board with friends | N | |
| home | Home | Back to home | N | |
| pin-window | Pin / PinOff | Always on top | T | |
| detach | PictureInPicture2 | Board in own window | A | |
| attach | Minimize2 | Back to main window | A | |
| redownload-all | RotateCw | Re-download missing online media | L | |
| upscale | Wand2 | Upscale media with a model | L | mismatch: shared with tidy |
| extract-frames | Film | Video to frame sequence | L | |
| export-loop | Repeat | Export loop as video / image | L | mismatch: repeat = loop mode too |
| extract-pages | Images | PDF pages to sequence | L | |
| download-media | Download | Keep local copy of online media | L | |
| reload-media | RefreshCw | Reload source | L | |
| relocate-missing | FolderSearch | Relocate missing media | L | |
| update-download | Download + ring | Download app update | L | |
| setup-install | RotateCw | Install dependencies | L | |
| storage-move | FolderInput | Move storage folder | L | |

## Tier 2 — item, draw, player, text

| id | today | what it does | kind | note |
|---|---|---|---|---|
| win-minimize / maximize / restore / close | Minus / Square / Copy / X | Window chrome | A | restore = Copy |
| duplicate | Copy | Duplicate item | A | |
| copy-clipboard | ClipboardCopy | Copy to clipboard | A | |
| paste | ClipboardPaste | Paste | A | |
| cut | Scissors | Cut | A | |
| delete | Trash2 | Delete | A | |
| flip-h / flip-v | FlipHorizontal / FlipVertical | Mirror | T | |
| crop | Crop | Crop overlay | N | |
| z-front / z-back | BringToFront / SendToBack | Z order | A | |
| reset | RotateCcw | Reset transform | A | |
| link-frame | Link2 / Unlink2 | Attach item to frame | T | mismatch: Link2 also URL |
| set-cover | ImageUp | Folder cover | A | |
| folder-mosaic | Grid2x2 | Folder cover mosaic | T | mismatch: also dot background |
| dot-bg | Grid2x2 / Square | Dotted background | T | mismatch |
| open-in-app | ExternalLink | Open in system app | A | |
| as-embed | AppWindow | Show as embed | T | |
| refresh-picture | ImageDown | Refresh live snapshot | L | mismatch: reads export |
| embed-quality | Package | Embed quality | N | mismatch |
| group-sequence | Film | Group images into sequence | A | |
| uniform-size | Ruler | Normalise sizes | A | |
| reverse-edge | ArrowRightLeft | Reverse arrow direction | A | |
| select-all | BoxSelect | Select all | A | |
| draw-pen / marker / line / arrow / rect / ellipse / diamond / eraser | Pen / Highlighter / Slash / MoveUpRight / Square / Circle / Diamond / Eraser | Draw tools | T | |
| draw-done | Check | Leave draw mode | A | |
| seq-play | Play / Pause | Play sequence | T | |
| seq-step | SkipBack / SkipForward | Step one frame | A | |
| seq-loop-mode | Repeat / Repeat2 / ArrowRightToLine | Loop, ping-pong, once | T | |
| seq-revert | Undo2 | Back to source video | A | mismatch: Undo2 shared |
| undo-upscale | Undo2 | Restore pre-upscale source | A | mismatch |
| block-convert | Repeat | Convert link / card type | A | mismatch |
| block-divider | Minus | Divider block | A | mismatch: shared with paragraph |
| studio-lock | Lock / LockOpen | Lock swatch | T | |
| studio-eyedropper | Pipette | Pick colour from screen | A | |
| studio-from-selection | Images | Palette from selected media | L | |
| card-favorite | Star | Favourite | T | |
| card-hide | EyeOff | Hide from home | A | |
| home-resume | History | Resume session | N | |
| settings | Settings2 | Settings | N | |
| ai-indexing-tab | Scissors | AI indexing settings | N | mismatch |
| sign-out | LogOut | Sign out | A | |
