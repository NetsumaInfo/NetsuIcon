# NetsuBoard icons not yet drawn by NetsuIcon (wave 3)

Source: `S:\projet_app\NetsuBoard\src`. Scope: every `lucide-react` import and value, inline `<svg>`, brand logos and simple-icons.
Excluded: `components/ui/netsu-icon.tsx`, `netsu-icons.generated.ts`, `components/reference/netsuIcons.tsx` (wrappers), `components/ui/window-glyphs.tsx`, `features/settings/nav.ts` (icons never rendered), emoji.
Included per the scope change: spinners (`Loader2`, `Spinner` in `components/ui/spinner.tsx`) and selection controls.

Existing ids are the 200+ names in `netsu-icons.generated.ts`. Line numbers come from a text scan, so a line may shift by a few lines if the file is edited.

## Section A: Existing id fits

| Glyph | Id | file:line |
|---|---|---|
| Check (CheckIcon, Check) | `check` | components/ui/checkbox.tsx:20, components/ui/context-menu.tsx:83, components/ui/dropdown-menu.tsx:129, components/ui/dropdown-menu.tsx:170, components/ui/select.tsx:100, components/ui/toast.tsx:30 (ok tone) |
| X (XIcon, X) | `close` | components/ui/dialog.tsx:73, components/ui/toast.tsx:84 |
| ChevronDown | `chevron-down` | components/ui/select.tsx:48 |
| ChevronRight / ChevronRightIcon | `chevron-toggle` (check rotation) | components/reference/FolderBreadcrumb.tsx:33, components/common/TextMenuSub.tsx:23, components/ui/context-menu.tsx:112 |
| Globe (generic link fallback, embed) | `web` | components/reference/BoardMenu.tsx:297, components/reference/brandIcons.tsx:141, :143, :148, :152, :162 (fallback), components/reference/EmbedItem.tsx:90, components/reference/LinkCard.tsx:65, :111, components/reference/note/blocks/BoardMention.tsx:22 |
| Folder | `folder` | components/reference/BoardItem.tsx:795 |
| Trash2 | `delete` | components/reference/ReferenceHome.tsx:124, :266 |
| Star (favourite) | `card-favorite` (verify it is a star) | components/reference/ReferenceHome.tsx:111, :164, :255, :286, components/reference/BoardSettings.tsx:447, :462, components/reference/inspectorControls.tsx:167 |
| Lock | `lock` | components/reference/PaletteStudio.tsx:578, :625 |
| Film (video kind, scene placeholder) | `video` | components/reference/SceneThumb.tsx:45, :97, components/reference/note/blocks/BoardMention.tsx:20, components/settings/console/AttachmentPicker.tsx:35 (audio branch, see note) |
| FileVideo | `video` | components/settings/console/AttachmentPicker.tsx:34 |
| ImageOff (broken media) | `media-missing` | components/reference/BoardItem.tsx:557, :567, components/reference/ReferenceBoard.tsx:944, components/reference/SequencePlayer.tsx:237 |
| FileQuestion (unknown file) | `file-missing` | components/reference/BoardItem.tsx:885 |
| Terminal | `console` | nav only (not a rendered icon, see Section B note) |
| Terminal | `console` | nav only, excluded |
| FlipHorizontal | `flip-h` | components/reference/BoardMenu.tsx:223 |
| Magnet | `snap` | components/reference/inspectorPanels.tsx:654 |
| Snowflake (freeze) | `freeze` | components/reference/EmbedItem.tsx:81 |
| HandHeart (support/donate) | `support` | components/HeaderLinks.tsx:43 |
| Users (collaborators count) | `collab` | components/reference/ReferenceHome.tsx:156 |
| RotateCcw (reset colours) | `reset` | components/settings/appearance/ThemeColorsCard.tsx:135 |
| ArrowUpRight (external link) | `open-external` | components/settings/AboutPanel.tsx:54 |
| HardDrive (storage tab) | `settings-storage` | components/settings/StoragePanel.tsx:33, :176 |
| TextSelect (select all) | `select-all` | components/common/TextContextMenu.tsx:161 |
| Sparkles (feature release note) | none close; see B `sparkles` | - |
| CircleAlert (error toast) | `warning` | components/ui/toast.tsx:30 (error tone) |
| Gallery/Rows (PDF view) | see B `layout-rows`, `layout-carousel` | - |
| Newspaper | see B `preview` | - |
| Youtube | brand, see Section C | - |

Notes on Section A:
- Choosing an existing id is a judgement. Verify the glyph meaning before swapping, especially `card-favorite`, `chevron-toggle`, `video` (the `AttachmentPicker` audio branch returns `Film` for `audio/*`: this is probably a bug, the audio kind should get its own id).
- `Terminal` appears only in `features/settings/nav.ts` and is not rendered, so it is not listed.

## Section B: Needs a new icon

One row per distinct meaning. "Screen" is the place where the user sees it.

| Proposed id | Lucide glyph | What it does | Kind | file:line | Screen |
|---|---|---|---|---|---|
| `loading` | Loader2 (spin) and the shared `Spinner` | busy indicator while loading or working | status | components/reference/BoardItem.tsx:942, :1036; components/settings/StoragePanel.tsx:136, :189; components/settings/UpdateSettings.tsx:82; components/updates/UpdateButton.tsx:90, :110; components/ui/spinner.tsx:8. `Spinner` is rendered by 15 files: App.tsx, components/auth/LoginGate.tsx, components/reference/AddLinkDialog.tsx, CollaborationDialog.tsx, ExportDialog.tsx, ExportImageDialog.tsx, ExportLoopDialog.tsx, NoteOverlay.tsx, SceneDialog.tsx, UpscaleItemDialog.tsx, components/settings/AccountPanel.tsx, AppSettings.tsx, CollabSection.tsx, components/setup/SetupGate.tsx, components/upscale/UpscaleCompare.tsx | Board item loading, storage, updates, dialogs, setup |
| `refresh` | RefreshCw | no rendered lucide use (only in nav.ts); the app already uses the `refresh` id via NetsuIcon. Spinning state is `busy` on `refresh`. | action | components/reference/CollabStatus.tsx:161, :166 already NetsuIcon refresh; no lucide to replace | Updates, live site, collab status |
| `file-text` | FileText | open a PDF or document; kind of text, PDF, doc | action | components/reference/BoardMenu.tsx:268; components/reference/note/blocks/fileKinds.ts:22, :23, :30; components/settings/console/AttachmentPicker.tsx:36 | Board menu, note file blocks, attachments |
| `file-kind-sheet` | FileSpreadsheet | file kind: spreadsheet | illustration | components/reference/note/blocks/fileKinds.ts:24 | Note file blocks |
| `file-kind-slide` | Presentation | file kind: slides | illustration | components/reference/note/blocks/fileKinds.ts:25 | Note file blocks |
| `file-kind-archive` | FileArchive | file kind: archive | illustration | components/reference/note/blocks/fileKinds.ts:26 | Note file blocks |
| `file-kind-audio` | FileAudio | file kind: audio | illustration | components/reference/note/blocks/fileKinds.ts:27 | Note file blocks |
| `file-kind-image` | FileImage | file kind: image | illustration | components/reference/note/blocks/fileKinds.ts:29 | Note file blocks |
| `file-kind-code` | FileCode | file kind: code | illustration | components/reference/note/blocks/fileKinds.ts:31 | Note file blocks |
| `file-kind-other` | File | file kind: any other file | illustration | components/reference/note/blocks/fileKinds.ts:32 | Note file blocks |
| `image` | Image | board kind: image (mention) | illustration | components/reference/note/blocks/BoardMention.tsx:19 | Note mentions |
| `note` | StickyNote | board kind: text note (mention), fallback | illustration | components/reference/note/blocks/BoardMention.tsx:23, :30 | Note mentions |
| `note-pen` | NotebookPen | note card badge | illustration | components/reference/NoteCard.tsx:54 | Board list |
| `palette` | Palette | board kind: palette (mention); colour picker trigger in a callout | illustration | components/reference/note/blocks/BoardMention.tsx:26; components/reference/note/blocks/CalloutBlock.tsx:63 | Note mentions, callout |
| `frame` | Frame | board kind: frame; folder marker in board menu | illustration | components/reference/BoardMenu.tsx:203; components/reference/note/blocks/BoardMention.tsx:24 | Board menu, mentions |
| `layers` | Layers | board kind: sequence | illustration | components/reference/note/blocks/BoardMention.tsx:25 | Note mentions |
| `monitor-play` | MonitorPlay | embedded video link (kind label) | illustration | components/reference/LinkCard.tsx:121 | Link card |
| `sparkles` | Sparkles | AI indexing, storage tab; feature release notes | illustration | components/settings/StoragePanel.tsx:170; components/updates/ReleaseNotes.tsx:15, :16 | Storage, updates |
| `wrench` | Wrench | release note: improvement | status | components/updates/ReleaseNotes.tsx:17 | Updates |
| `speed` | Gauge | release note: performance; audio playback speed cycle | action | components/updates/ReleaseNotes.tsx:18; components/reference/note/blocks/AudioBlock.tsx:129 (toggle) | Updates, note audio |
| `bug` | Bug | release note: fix | status | components/updates/ReleaseNotes.tsx:19 | Updates |
| `info` | Info | info toast | status | components/ui/toast.tsx:30 (info tone) | Toasts |
| `device` | Laptop | this device (collab) | illustration | components/settings/CollabSection.tsx:343, :356 | Settings, collab |
| `add-friend` | UserPlus | add a friend | action | components/settings/CollabSection.tsx:420 | Settings, collab |
| `blocks` | Blocks | block menu entry | action | components/reference/note/NoteTextMenu.tsx:180 | Note text menu |
| `workflow` | Workflow | organise links | action | components/reference/links/LinkMenuItems.tsx:32 | Link menu |
| `git-fork` | GitFork | link menu entry | action | components/reference/links/LinkMenuItems.tsx:61 | Link menu |
| `preview` | Newspaper | link display mode: preview | toggle | components/reference/inspectorPanels.tsx:380 | Link card inspector |
| `arrow-right` | ArrowRight | direction arrow in inspector | illustration | components/reference/inspectorPanels.tsx:181 | Inspector |
| `hash` | Hash | number or hash marker | illustration | components/reference/Inspector.tsx:179 | Inspector |
| `layout-columns` | Columns3 | palette layout: row | toggle | components/reference/Inspector.tsx:40 | Inspector, palette |
| `layout-rows` | Rows3 | palette layout: column; PDF pages view | toggle | components/reference/Inspector.tsx:41; components/reference/PdfViewer.tsx:247 | Inspector, PDF viewer |
| `layout-grid` | LayoutGrid | arrange grid; grid view in palette; gallery grid | toggle | components/reference/inspectorPanels.tsx:589; components/reference/PaletteStudio.tsx:816; components/reference/note/blocks/GalleryBlock.tsx:154 | Arrange, palette, note gallery |
| `layout-2x2` | Grid2x2 | palette layout: grid | toggle | components/reference/Inspector.tsx:42 | Inspector |
| `layout-carousel` | GalleryHorizontal | gallery carousel; PDF gallery view | toggle | components/reference/note/blocks/GalleryBlock.tsx:150; components/reference/PdfViewer.tsx:247 | Note gallery, PDF viewer |
| `layout-row` | GalleryHorizontalEnd | gallery row | toggle | components/reference/note/blocks/GalleryBlock.tsx:146 | Note gallery |
| `solid` | Square | background mode: solid colour; text mode: solid accent | toggle | components/reference/BoardSettings.tsx:325; components/reference/TextModeControls.tsx:158 | Board settings, text mode |
| `ban` | Ban | accent: none | toggle | components/reference/TextModeControls.tsx:135 | Text mode |
| `paste-plain` | ClipboardType | paste as plain text | action | components/common/TextContextMenu.tsx:161 | Text context menu |
| `dash` | Minus | line style: dash | action | components/reference/BoardMenu.tsx:370 | Board menu |
| `compare` | MoveHorizontal | compare slider (before/after) | action | components/upscale/UpscaleCompare.tsx:184, :194, :286 | Upscale compare |
| `shield-on` | ShieldCheck | live site protection on | status | components/reference/LiveSiteLayer.tsx:309 | Live site |
| `shield-off` | ShieldOff | live site protection off | status | components/reference/LiveSiteLayer.tsx:309 | Live site |
| `file-unknown` | FileQuestion | see `file-missing` (Section A) | - | - | - |
| `sliders` | SlidersHorizontal | divider settings | action | components/reference/note/blocks/DividerBlock.tsx:29 | Note divider |
| `open-doc` | FileText (duplicate meaning) | merged into `file-text` above | - | - | - |
| `checkbox-off` | (none, selection) | no lucide selection tray: selection uses shadcn `check` (Section A) and inline glyph toggles (Section C) | - | - | - |

Notes on Section B:
- Selection controls: all lucide selection marks are the `check` id (Section A). The item selection trays (`ToggleGroup`) use inline SVG glyphs, listed in Section C, not lucide.
- Duplicate meanings were merged: `open-doc` and `file-unknown` rows are redundant and point to the rows above.
- Excluded spinner-like `Loader2` appears only in the `loading` row.

## Section C: Brands and inline SVG

| file:line | What it is |
|---|---|
| components/DiscordIcon.tsx:1-6 | Discord logo (simple-icons `siDiscord`) |
| components/auth/LoginScreen.tsx:44-46 | Discord logo on sign-in button |
| components/settings/AccountPanel.tsx:100-102 | Discord logo on account button |
| components/SponsorIcons.tsx:8-10 | GitHub logo (`siGithub`), used by GithubIcon |
| components/SponsorIcons.tsx:16-18 | Buy Me a Coffee logo (`siBuymeacoffee`) |
| components/HeaderLinks.tsx:12 | Imports GithubIcon (header link) |
| components/HostIcon.tsx:16-19 | Adobe Premiere Pro and After Effects app icons (PNG images, not SVG) |
| components/HostIcon.tsx:21-28 | Adobe logo (SVG path) for the settings entry |
| components/language/FlagIcon.tsx:62-64 | Six language flags drawn in SVG (fr, en, es, and three more) |
| components/reference/brandIcons.tsx:22-40 | Glyph factory from simple-icons; LinkedIn and Streamable hand-made |
| components/reference/brandIcons.tsx:41-135 | About 45 platform logos (YouTube, X, Instagram, Facebook, TikTok, Reddit, Vimeo, Twitch, Spotify, GitHub, Discord, etc.) |
| components/reference/brandIcons.tsx:136-162 | `iconForLink` and provider lookup; Globe as fallback (Section A) |
| components/reference/brandIcons.tsx:5 (import) | Lucide Globe fallback (Section A) |
| components/reference/harmonyIcons.tsx:52-57 | HarmonyIcon: six colour-harmony diagrams (split, triadic, square, compound, shades, monochromatic) |
| components/reference/DrawStyleControls.tsx:26, :60-75 | Line glyphs: width, dash (solid, dashed, dotted), route (straight, curved, elbow) |
| components/reference/DrawHeadPicker.tsx:20-34 | Arrow head glyphs (none, dot, bar, triangle, open) |
| components/reference/links/linkToolbarParts.tsx:10-14 | LineIcon: line width and dash preview |
| components/reference/note/blocks/ResizableMediaFrame.tsx:91-95 | Resize grip (diagonal lines) |
| components/reference/note/noteSchema.ts:89 | Lucide Youtube icon (YouTube, brand) |
| components/reference/note/blocks/YoutubeBlock.tsx:26 | Lucide Youtube (brand) |
| components/reference/note/blocks/BoardMention.tsx:21 | Lucide Youtube kind icon (brand) |
| components/auth/LoginGate.tsx | uses `Spinner` (Section B `loading`) |

Not icons, excluded: components/ui/tooltip.tsx:110 (tooltip arrow shape), components/reference/ShapeView.tsx, components/reference/DrawLayer.tsx, components/reference/links/LinkLayer.tsx (board drawing layers), components/reference/boardRender.ts:683 (export svg string), components/reference/YoutubeItem.tsx (embed player, not an icon).

## Section D: Counts

- Lucide usage sites rendered (excluding nav.ts, window-glyphs, netsuIcons wrappers, brandIcons): 124 usage lines (text scan).
- Distinct lucide glyphs in rendered code: about 80.
- Section A: 26 rows (existing ids to swap). Section B: 52 rows (distinct meanings, merged duplicates removed in notes).
- Section C: 27 brand or inline SVG rows (file:line), plus 2 excluded non-icon SVGs.
- Spinner users: 15 files (`Spinner`); Loader2 direct sites: 7.
