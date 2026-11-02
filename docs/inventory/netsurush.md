# NetsuRush — action icons to redraw

Source: `S:\projet_app\NetsuRush\src`. Lucide everywhere, no central wrapper. Existing animated pattern: `components/ui/animated-icons.tsx` (framer-motion, `SvgBase`, props `size`, `className`; never on video card grids).

Excluded: user-chosen emoji, collection glyph presets (`collectionGlyph.tsx`), export profile presets (`exportIcons.tsx` ICON_MAP), host app PNGs, brand logos (Discord, GitHub, BMC, Adobe), flags, file-kind badges, decorative categories (release notes, notification categories), shadcn primitives.

Motion level: **L** long task = expressive, loops while busy, distinct done state. **A** instant action = one short gesture. **T** toggle = switch with two held states. **N** nav = subtle hover.

## Tier 1 — modules and long tasks (expressive)

| id | today | what it does | kind | note |
|---|---|---|---|---|
| nav-netsucut | Scissors | NetsuCut module (shot detection, derush) | N | |
| nav-netsusearch | Search | NetsuSearch (search in rushes, faces) | N | |
| nav-netsubook | NotebookPen | NetsuBook notebook | N | |
| nav-netsulab | Wand2 | NetsuLab: upscale and roto | N | mismatch: wand = magic, not upscale |
| nav-netsupilot | MessageSquare | AI chat agent | N | |
| nav-netsuboost | Gauge | Resolve optimisation, cache, processes | N | |
| nav-netsubridge | ArrowLeftRight | Transfer timeline Resolve ↔ Adobe | N | |
| cut-detect | Scissors | Batch shot detection on rushes | L | |
| cut-import | HardDriveDownload | Import / copy media from disk | L | |
| cut-send-timeline | Clapperboard | Send shots to Resolve timeline | L | mismatch: slate = scene |
| cut-export-shot | Download | Export a shot (spinner while busy) | L | |
| search-run | SearchIcon animated | Run search, loops while loading | L | |
| search-face | ScanFace | Face filter / index faces | T/L | |
| search-index | Database | Index rushes (long) | L | |
| lab-upscale | Wand2 / ImagePlay | Run upscale or processing chain | L | |
| lab-export | ArrowDownToLine | Export rendered result | L | |
| book-export-pack | Package | Package a notebook | L | |
| boost-rescan | RefreshCw / Loader2 | Rescan processes, cache | L | |
| boost-purge | Eraser | Purge cache, temp files | L | |
| bridge-send | Send | Send timeline to host app | L | |
| bridge-doctor | Stethoscope | Diagnose the bridge | L | |
| update-download | Download | Download app update with progress | L | |
| storage-compact | Minimize2 | Compact storage | L | |
| chat-send | Send | Send message to agent | A | |
| chat-stop | Square | Stop generation | A | |

## Tier 2 — frequent actions and toggles

| id | today | what it does | kind | note |
|---|---|---|---|---|
| sidebar-settings | Settings | Open settings | N | |
| sidebar-refresh | RefreshIcon animated | Refresh host status | A | |
| host-status | MonitorPlay / MonitorX | Host connected / disconnected | S | |
| error-badge | AlertTriangle / Terminal | Error count, opens console | S | Terminal ambiguous |
| window-minimize | Minus | Minimise | A | |
| window-maximize | Square | Maximise | A | |
| window-restore | Copy flipped | Restore window | A | mismatch: copy = duplicate |
| window-pin | Pin / PinOff | Always on top | T | |
| window-close | X | Close | A | |
| boost-restart | Power | Restart | A | mismatch: power = shut down |
| boost-kill | Skull | Kill process | A | also used for safe stop |
| boost-watchdog | ShieldCheck | Watchdog on/off | T | |
| cut-merge | Combine | Merge adjacent cuts | A | |
| cut-delete | Trash2 | Delete shot / folder / cut | A | shared everywhere |
| cut-undo | Undo2 | Undo | A | |
| cut-favorite | Star | Favourite | T | |
| cut-play | Play / Pause | Play shot | T | |
| cut-loop | Repeat | Loop | T | |
| cut-select | CheckSquare / Square | Select mode | T | |
| cut-folder-new | FolderPlus | New folder | A | |
| cut-move-to-folder | FolderInput | Move clip to folder | A | |
| cut-unlink | Unlink | Detach clip from folder | A | |
| search-exclude | Ban | Exclude term | T | |
| search-add-ref | ImagePlus | Add reference image | A | |
| search-stop-index | Square | Stop indexing | A | |
| search-merge-person | Merge | Merge two persons | A | |
| chat-attach | Paperclip | Attach file | A | |
| chat-new | Plus | New conversation | A | |
| chat-approve | ShieldQuestion | Approve agent action | A | |
| copy | Copy → Check | Copy (message, logs, timecode) | A | shared |
| book-convert | Repeat | Convert block type | A | mismatch: repeat = loop |
| book-save-all | SaveAll | Save all pages | A | |
| book-float | PictureInPicture2 | Notebook as floating window | T | |
| book-divider-style | SlidersHorizontal | Divider style | N | mismatch |
| auth-logout | LogOut | Sign out | A | |
| error-report | LifeBuoy | Send error report | A | |
| reset-default | RotateCcw | Reset to default | A | |
