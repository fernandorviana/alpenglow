# Changelog

What changed for someone who installs `alpenglow`. Kept from the first wave of
the completeness roadmap (2026-09-18); `0.1.0` and `0.2.0` are summarised from
the record in `MEMORY.md`. While the version is `0.x`, a minor version may
break: a removed token or prop is named here under **Breaking**. A section
headed **The site** records changes to the documentation site, which reach
nothing in the package.

## Unreleased

Wave 4's first piece, the dense screen, its second, breakpoints and layout,
and its third, the Table's columns giving way, and what it could not be
finished without: density as a foundation, a current row on the Table, and
the Link saying a new tab for an internal link. Then the first part of the
fidelity audit of 2026-09-24, which compared the drawing with the
production build at 320, 375, 768, 1024 and 1440 in both modes: the bugs it
found, in the package and on the site (spec
`docs/superpowers/specs/2026-09-24-fidelity-audit.md`). Two props change
their type, under Breaking: the Table's `Column.width` and `bulkActions`.

### Breaking

- **Table** — `Column.width` is a number of px, no longer any CSS string:
  the Table adds widths up to decide which columns fit. `'8.5rem'` is
  `136`.
- **Table** — the action column is fixed at 72px, one 40 button plus its
  padding, for `rowActions` and for `rowAction`'s render prop alike. A
  `rowAction` that used to size to its content — a text button, two icons —
  now overflows that width instead of widening the column.
- **Table** — `bulkActions` takes (or returns) `DropdownMenuAction[] |
  ReactNode`, no longer `ReactNode` alone; the union is exported as the new
  `BulkActions` type. Code that passes the Table's props along keeps
  working, but a wrapper that reads `TableProps['bulkActions']` and renders
  it as a React node — or types its own prop as `ReactNode` and hands it
  on — no longer compiles: widen it to `BulkActions`, or narrow the list
  out before rendering.

### Added

- **Density** — a fourth token layer, `density/*`, in two modes:
  comfortable, the default (what is drawn for the rows and the button; the
  hour is 80 for the drawn 81, and the field and the navigation item are 40
  where 48 is drawn), and compact, chosen by
  `data-density="compact"` on **any element** (custom properties inherit,
  so one region of a page can be compact while the rest is not). Five
  tokens, only what the screen proves: `density/control` 40 / 32,
  `density/row` 72 / 48, `density/row-header` 44 / 36, `density/hour`
  80 / 64, `density/nav-item` 40 / 32 (`--ap-density-*`). **Compact does
  not apply to touch:** under `(pointer: coarse)` the compact block gives
  the comfortable values back. `data-density="comfortable"` gives a
  region inside a compact one the room back. In `tokens.css`, the
  Tailwind theme and the Figma export, as a fourth collection,
  `Alpenglow Density`, modes Comfortable and Compact. In Tailwind the
  tokens are spacing utilities written inline, so `h-density-row` or
  `min-h-density-control` reads the token where it is used and follows
  `data-density` there; a plain `var(--density-*)` would not, and is not
  declared. `density`, `densityModes` and the `Density` type are exported
  from the package root beside `spacing` and `motion`.
- **Controls and rows that follow density.** Button, Input, Select,
  NativeSelect, Combobox and DatePicker with no `size` take
  `density/control`; the Table with no `density` takes `density/row` and
  `density/row-header`, its inline padding following the row; the
  Scheduler's hour is `density/hour`; the SideNav's and SideNavSecondary's
  items are `density/nav-item`. An explicit `size` or `density` keeps its
  literal value and wins. **Two defaults are gone, and nothing you see
  changes:** `size` no longer defaults to `'md'` and the Table's `density`
  no longer defaults to `'comfortable'`; left out, they follow the
  attribute, and with no attribute anywhere they render at exactly the
  heights and paddings they did (40, 72, 44); for the controls the suite
  reads it from the stylesheets. Pass `size="md"` or
  `density="comfortable"` to keep a part comfortable inside a compact
  region, or put `data-density="comfortable"` on it.
- **Table** — `currentId` and `onCurrentChange`: the row being looked at,
  apart from the rows chosen by checkbox. With `onCurrentChange` the
  primary cell's content becomes a bare button, the cell's width, that
  reports its row, and the current row's button carries
  `aria-current="true"`; the row is drawn
  with the Scheduler's ring for its selected card, an inset `border/accent`
  outline, never the selection's fill, so a row can be both. Scrolling it
  into view is the caller's.
- **The Density page** under Foundations: the five tokens, the touch rule,
  and a Try it with the two modes side by side on a Button, an Input, a
  Select, a Table and a slice of the Scheduler.
- **The dense screen**, on the site at `/screen`: a physiotherapy clinic's
  day built only from the package — SideNav, TopBar, Filters, the
  Scheduler by practitioner and the Table on one state, the
  CommandPalette, a Drawer, the Dialog with its form, Toasts with Undo —
  in a frame whose width (1440, 1024, 768, 375), density and mode are
  switchable and linkable, with what it proves and what moved up the list
  under it. `/screen/full` is the screen alone.
- **Breakpoints** — `xs` 480, `sm` 640, `md` 768, `lg` 1024, `xl` 1280,
  `2xl` 1536: Tailwind's five and one below them, in rem. `breakpoint`,
  `minViewport` (320, the floor the system is tested at) and `media` —
  `media.up.md` is `'(width >= 48rem)'`, `media.down.md` `'(width < 48rem)'`
  — are exported from the root. `--ap-breakpoint-*` in `tokens.css` are for
  JS and reading; a media query cannot read them. The Tailwind theme
  restates the five and adds `xs:`. In Figma, `breakpoint/*` in the Scale
  collection.
- **Layout margin and gap** — `layout/margin` 16 / 24 / 40 and `layout/gap`
  16 / 20 / 20, stepping up at `lg` and `xl` inside `tokens.css`, so
  `var(--ap-layout-margin)` needs no query of its own. `px-layout-margin`
  and `gap-layout-gap` in Tailwind. In Figma, a fifth collection,
  `Alpenglow Layout`, modes Narrow, Medium and Wide. `layout` and
  `layoutModes` are exported from the root.
- **A Breakpoints and layout page** under Foundations, and the decision to
  ship no z-index tokens on Decisions.
- **Table columns that give way** — `minWidth` (px; 96 unless told, 160
  for the primary), `priority` (1 the most important; left out, source
  order) and `truncate` on a column. As the Table's own width shrinks,
  whether from the window or a side panel, a column shrinks to its
  minimum, then leaves, the lowest priority first; the primary, selection
  and action columns never leave, and the sorted column is raised to stay.
  Each Table writes container queries for itself, so nothing is measured
  and the rules arrive in the server's HTML. `columnThresholds` is
  exported for a caller who wants the numbers.
- **Table row actions** — `rowActions` (the DropdownMenu's action shape),
  `rowActionsInline` (default 2) and `rowActionsLabel` (default "More
  actions"): the first actions with an icon are buttons, the rest in "⋯",
  and all of them gather into "⋯" before any column leaves.
- **Table** — `bulkActions` takes a menu's actions, `DropdownMenuAction[]`
  or a function of `{ selected, clear }` returning them, beside the nodes it
  took before. They are drawn as the rows' are: those with an icon as `sm`
  buttons named by a tooltip, the rest in "⋯", and all of them gathered
  into one "⋯" when the bar has no room for the buttons — by the width of
  their own slot, the only part of the bar that gives way, since the count
  and Clear are words nothing counts. `bulkActionsInline` (5, as drawn) and
  `bulkActionsLabel` ("More actions"), as for rows. The `BulkActions` type
  is exported. An action with `checked` is drawn as the Switch while the
  bar has room for it — its words measured in the page — and tucked into
  "⋯" as a checkbox row when it has not, the buttons staying.
- **DropdownMenu** — `checked` on an action makes its row a
  `menuitemcheckbox` with `aria-checked`, the Checkbox's box before the
  words (the Select's picture of it), filled with the check while checked.
  `onSelect` toggles it; Space changes it and leaves the menu open, Enter
  and a click change it and close, as the APG has it. Its label says what
  it is and stays the same. Left out, a row is what it was. A checkable
  action is never one of a Table's icon buttons: among a row's actions it
  is a row of the "⋯" menu; in the selection bar it is the Switch while
  the bar has room for it, and a row of "⋯" when it has not.
- **Button** — `icon`, an icon-only form: square, the icon alone, and
  `aria-label` required by the types.
- **Scheduler** — `scrollToDay`: a week wider than its region opens with a
  day's column in the middle of what the hours leave, today's, or `date`'s
  when today is not in the week, and goes to `date`'s when `date` changes,
  so a day picked in the same week is the day shown. Off unless given, so
  nothing moves for a Scheduler that does not ask; a new number does it
  again, for a Today button pressed on today. A day of people stays put.
- **Drawer** — `DRAWER_NARROW`, `media.down.md`, exported from the root:
  the query below which an inline Drawer opens over the content (Changed,
  below), for a caller laying out the row it sits in.

### Changed

- **The SideNav turns at 768**, `media.down.md`, not 760: from 761 to 767
  it is now the sheet. The query is in rem, so it follows the reader's
  default font size: at a 20px default, 768 becomes 960.
- **The Toast and the CommandPalette take their phone layout below 480**,
  not at 480 and below. The query is in rem too: at a 20px default, 480
  becomes 600.
- **The TopBar pads its sides by `layout/margin`**: 16 below 1024, 24 to
  1279, 40 from 1280, where it was 24 at every width.
- **The Scheduler, the Table and the Slider isolate** (`isolation:
  isolate`): their z-indexes stay inside them, so a product's sticky bar at
  `z-index: 1` sits over the Scheduler's head. Nothing else changes.
- **Filters keeps to fewer rows at a narrow width.** The chips are the
  bar's own items (their box is `display: contents`), so a chip sits beside
  the label when it fits, and the "+" and Clear share a box, `.controls`,
  that wraps whole: Clear never stands on a row alone, and keeps to its
  row's end. At 375 the drawn bar is two rows where it was three, at 320
  three where it was four. **The DOM changes:** Clear is no longer the
  bar's last child but the last child of that box, after the "+". The bar
  takes `min-width: 0`, and a chip's words end in an ellipsis when the chip
  is wider than the bar, where two long chips pushed a page sideways; while
  they are cut short, the system's Tooltip says them whole on hover and on
  keyboard focus, and the button's name is the same words. **The DOM
  changes again:** each chip's words button now sits in the Tooltip's
  wrapper `span`, beside a `span` with `role="tooltip"`, and takes
  `aria-labelledby` pointing at it. Its accessible name does not change,
  but a selector that reached the button by its place finds it one `span`
  deeper, and every chip carries a tooltip, shown only while its words are
  cut, so a test that counts `role="tooltip"` counts one more per chip.
- **The Table's selection bar keeps to one row.** It wrapped: at 375 the
  dense demo's bar was four lines, 311×147, with dividers left hanging. It
  does not wrap now. The actions give way first; then the count, to an
  ellipsis, its `title` saying it whole; Clear never. Under 25rem of Table
  Clear is a ✕ named by its Tooltip, and the gaps close to 8. **Content you
  put in the bar yourself** — nodes given to `bulkActions` rather than a
  list — cannot gather: at a narrow width it scrolls sideways inside its
  slot, with a thin scrollbar, instead of wrapping onto a second line.
  **The DOM changes:** Clear is drawn twice, in words and as the ✕, each in
  a span of the bar's, and the rules show one; a test that gets the one
  button named "Clear selection" finds two.
- **A disabled Slider keeps its filled part the stronger.** The line is
  `interactive/disabled` and the fill and the thumb's edge
  `interactive/on-disabled`; the fill was `interactive/disabled` on a
  `border/strong` line, paler than the line in both modes, and read
  reversed.
- **The Table no longer collapses to a list under a 40rem container.** Its
  columns leave one by one instead, right to left unless priorities say
  otherwise. It lays out fixed, and flexible columns share by their
  minimums where the browser sized them by content.
- **Below `md` an inline Drawer opens over the content**, as `overlay`
  does: on a phone there is no panel beside the content, the content is what
  shows, and drawers open as overlays (a rule of 2026-09-25). There it is a
  `popover="manual"` with `role="dialog"`; from 768 up it is in the flow
  with `role="region"`, as before. A caller who put an inline Drawer beside
  the content at a phone's width now gets the layer. The query is
  `DRAWER_NARROW`, in rem.
- **Below `md` every Drawer is modal.** There it is over the content, and
  at a phone's width it is the screen, yet Tab and a screen reader went on
  into the page it hid. Now the page outside the panel is `inert`, the panel
  is `aria-modal="true"`, Tab goes round inside it, and the focus goes back
  to what opened it on close. A `<dialog>` outside is left alive, so a
  Dialog opened from the panel still answers. From 768 up nothing changes:
  not modal, nothing inert. A caller who kept the page behind a phone's
  Drawer in use — a list pressed while the panel was open — no longer can;
  the panel closes first.
- **In dark the SegmentedControl's thumb takes a `border/strong`
  hairline**, and so does the Tabs' segmented variant, which shares its
  stylesheet: the thumb's `surface/overlay` fill was nearly invisible on
  its track. Light is unchanged.

### Fixed

- **Table** — the Table and its `footer` fit their container. Its one grid
  track was `auto`, as wide as the footer's least width, and a Pagination of
  eight places made it 320 in a phone's 288: the frame and the page went
  16px sideways. The track is `minmax(0, 1fr)` and the footer takes
  `min-width: 0`, so the Pagination's places give way toward 24 as it
  means them to, and the footer wraps under the summary.
- **Link** — a `target="_blank"` link now says it opens a new tab whether
  or not it is `external`; before, an internal link opened in a new tab was
  not announced. The icon is still drawn only with `external`. **The
  accessible name changes:** any `target="_blank"` link without `external`
  now ends with "(opens in a new tab)", or its `externalLabel`. A test that
  matches the exact name will need the words, and a link whose text
  already says them will say them twice.
- **Slider, Switch and Combobox** — in a build whose chunk order put the
  shared stylesheets after the component's, the Slider's field took the
  whole row and its track was 0 wide, so the page scrolled sideways; the
  Switch's description lost its 40 indent; and the Combobox's text input
  squeezed to 20px after the tags, where it should take a line of its own.
  The docs' production build was such a build; `next dev` is not. The
  component's value now reaches the shared rule as a custom property
  (`--alpenglow-control-width`, `--alpenglow-choice-indent`,
  `--alpenglow-field-min-width`) instead of competing with it, so no order
  undoes it. The width and the least width are set and read on one element
  and registered with `@property` not to inherit, so a page's own custom
  property of the name on an ancestor cannot reach a control; the indent
  inherits, from the Switch's root to its description, and the package's
  name keeps a page out of it. **`styles.css` now holds two `@property`
  rules**, for those two names. The Switch's root takes a class of its own.
- **Filters** — Esc on a chip whose words are whole reaches what is around
  the bar again: in a Drawer the first Esc closes it, in a Dialog it is the
  close request. The chip's Tooltip opened on every hover and keyboard focus
  and a rule hid it while the words were whole; hidden, it was still a shown
  popover, so the Drawer left the Esc to it and its own handler cancelled
  the Esc, and a hover on the chip closed a tooltip open elsewhere. It now
  opens only while the words are cut short.
- **Textarea** — draws its box again: the fill, the border, the padding,
  the focus border and the invalid state. The bare field class meant for
  Input's inner `input` sat on the textarea itself and, declared later,
  cancelled the box, in every release so far. In Safari a disabled
  textarea keeps `text/disabled`.
- **Dialog** — at `xs` the stacked footer buttons keep their 40, where
  `flex: 1 1 0` in the column shared the footer's height and left them 22
  each; below 480 the header's gap narrows to 8, so a title at 320 breaks
  between words, where its 112 column broke them ("Reschedul/e"); a word
  breaks only when nothing else will fit it, as an unbroken email.
- **Drawer** — the title breaks inside a word only when the word cannot fit
  a line of its own; `anywhere` had let a narrowed inline panel set its
  title a letter to a line.
- **Popover and the other floating panels keep 8px from the screen's
  edge.** A panel that would reach the viewport's edge tries the other
  placements, including both flips at once, and last stands 8 in from the
  inline end (`--floating-inside`); the Popover sets which side takes the 8
  through `--floating-edge`. At 320 and 375 the Popover's panels had
  touched an edge; at 768 and 1440 no panel on the floating surface moved.
- **Calendar** — the month arrows' chevrons are the drawn 4.67 × 9.33 in a
  16 frame. The arrow button kept the browser's padding, which shrank them
  to about 2.3 × 4.7, a dot.
- **SideNav** — collapsed, each item is a circle centred in the 80 rail, at
  the item's height (`density/nav-item`, 40 comfortable, where 48 is
  drawn), where the Tooltip's wrapper had held it to a
  24-wide sliver at the rail's edge. In the sheet the nav takes the height
  left under the close button and scrolls, where the last item fell off a
  375 × 812 screen. **The DOM changes:** each `li` takes a class.
- **Scheduler** — the heads stand over their columns: the head and the
  body were two grids each sized by its content, and a long name widened a
  head past its column (165 over 144 at 1440). The all-day chip fills the
  drawn 28 row with its words centred, where it was 20 and cut them. The
  hours column stays put when a wide week scrolls sideways; since 0.5.0 a
  `position: relative` after its sticky rule let it scroll away under the
  corner.

### The site

Nothing here reaches the package. Listed because the site is where the
system is read, and the audit found most of its faults there.

- **The prose rules weigh nothing.** Every `.prose` rule in `app/docs.css`
  is `:where(.prose) :where(…)`, and the 37.5rem measure names the text
  instead of every child, so a component on a docs page is the component:
  the Drawer fits a phone, the CommandPalette is 343 at 375, the SideNav's
  links rest in `text/primary`, card titles, ramp names and the pager's
  Next sit where their own classes say, and code blocks take the column.
  The docs cards set the drawn Card's title and description.
- **Every docs table is the package Table, ranked.** The sixteen token
  tables on nine pages were plain tables in a scroller; at a narrow width
  their columns now leave, least important first, and each keeps its name
  and at least one value at 320. /colour's tables fit their column, where
  one 110-character use line made them 1119 wide in 852.
- **Every code block has its header bar**, the language alone when there
  is no file name, so the copy button sits on the bar and never over the
  code.
- **In dark, the theme toggle's track and inline code take
  `surface/overlay`**, a surface step above the rail and the canvas they
  had matched.
- **/screen** — from 768 to 1023 the column fills the width when the
  navigation is a sheet, where it stopped at 754.
- **/scheduler** gives the week its room: the side column goes under the
  grid, and on a phone opens as an overlay Drawer from a toolbar button,
  which a new or pressed event opens too; the View select says the view
  shown.
- **At a phone's width**: /why's Layers figure is the six bands as an HTML
  stack below 30rem of its own width, not the drawing scaled to 0.4; card
  grids fill their rows; /button's dialog-footer example stacks its actions
  in reading order below `xs`, as the xs Dialog does; /navigation's Try it
  scrolls sideways with a fade instead of clipping the top bar; the
  /components Navigation card draws its side nav at every width; the
  /layout and /density table headers fit; the home Developers card shows
  `npm i alpenglow` alone.
- **The Foundations data-visualisation card shows its ramp**, a long icon
  name no longer shrinks its icon, and the Table page's row actions each
  do something: Edit, Delete and Archive answer with a toast, and Undo puts
  the row back.
- **Records.** Claims about the drawing that were false are corrected where
  they stood, dated 2026-09-24: /avatar's Loader, /navigation's phone bars,
  /scheduler's week with several people, its phone agenda and its
  quarter-hour card, /input and /decisions on the resting border, /density
  on which comfortable heights are drawn. The
  counts agree between pages: the home page and /colour count the alpha
  primitives, as /foundations and /why do (134, held by a test), and /space
  counts `spacing/0`, as /foundations and /tailwind do (22). /accessibility
  lists the two pairs that are below 4.5:1, not four.

## 0.5.0 — 2026-09-23

Wave 3 of the completeness roadmap: navigation, the remaining inputs, the
Scheduler, the CommandPalette, and two foundations, the category palette and
the chart palette. Nothing is removed; the one rename is under **Changed**.
The whole wave was reviewed over `v0.4.0..HEAD` before the tag: one export
missing from the root (`accepts`), one dead rule in the site's stylesheet.

### Added

- **SideNav** — the primary navigation, drawn 200 wide and 80 with icons
  only: `items` of `{ href, label, icon, current }`, a `footer` group,
  `renderLink` for a router, `collapsed` (every item keeps its name in a
  Tooltip), and below `narrow` (a media query, 760px unless told) a modal
  `dialog` from the start side with `open` and `onClose`. Exports `SideNav`,
  `SIDE_NAV_NARROW`, `SideNavProps`, `SideNavItem`.
- **SideNavSecondary** — the second level: `sections` of `{ label, items,
  defaultOpen }` under captions that fold on the platform's `details`; 240
  wide, or a 24 strip with the drawn collapse button (`collapsed`,
  `onCollapsedChange`). Exports `SideNavSecondary`, `SideNavSecondaryProps`,
  `SideNavSection`.
- **TopBar** — the bar along the top, 64 tall: the menu button (`onMenu`,
  `menuLabel`, `menuExpanded`) and `brand` at the start, `children` in the
  middle, `actions` at the end. Exports `TopBar`, `TopBarProps`.
- **SegmentedControl** — the Tabs' segmented track over a value: a radio
  group on real radios in a `fieldset`, so arrows, Space, a skipped disabled
  option, the submitted value and the announced state are the platform's.
  `options` of `{ value, label, disabled }`, `label` (read, not seen),
  `value` / `defaultValue` / `onChange`, `name` for a form, `disabled` for
  the group, `fullWidth`. A value that names nothing checks nothing. Exports
  `SegmentedControl`, `SegmentedControlProps`, `SegmentedOption`.
- **Slider** — a value along a line on the platform's `input type="range"`,
  painted by the component so every browser draws the same track; `range`
  for two thumbs with the fill between them, the two never crossing.
  `label`, `unit`, `info`, `caption`, `min` / `max` / `step`, `showValue`
  (the balloon) with `formatValue`, `ticks`, `start` and `end` for the
  ends, `showInput` for a field to type the value (a typed value outside
  the range is kept, marked and explained; inside, it moves the thumb),
  `disabled`, `name` (a range submits `name-min` and `name-max`). Exports
  `Slider`, `SliderProps`, `SliderPair`.
- **FileUpload** — a zone to choose or drop files on a real `input
  type="file"`, its label, and the list of what became of them: `files` of
  `{ id, name, size, type, status, progress, error, href }` with `ready`,
  `uploading` (the Progress under the name), `done` (Download) and `failed`
  (the error and Retry); `accept` and `maxSize` checked by the component,
  the accepted files to `onAdd`, the refused shown as failed cards with the
  reason and said to `onReject`; `onRemove`, `onRetry`; `variant` `zone`
  (drawn; alone, the upload inside the zone), `compact` and `tile`. Exports
  `FileUpload`, `fileUploadVariants`, `formatSize`, `accepts`, `FileUploadProps`,
  `FileUploadVariant`, `UploadFile`, `UploadStatus`, `UploadRejection`.
- **Scheduler** — the grid of hours with the appointments on it, phase 1 of
  two: `view` `week` (one column per day from `date`, `weekStartsOn`,
  `days`) or `day` (one column, or one per person with `resources` of
  `{ id, name, avatar, tone, workingHours }`); `events` of `{ id, title,
  start, end, resourceId, kind, tone, icon, allDay }` with wall-clock
  times, `'2023-04-20T11:00'`, no zone; `kind` `confirmed`, `pending`,
  `cancelled`, `blocker`, `external`, `availability`; overlaps in lanes;
  the All-day row; `hours`, `workingHours` (off hours banded), `now` (a
  time, `null`, or the clock after hydration; the past derived from it),
  `locale` (twelve or twenty-four hours from it), `zoneLabel`,
  `allDayLabel`, `kindLabels`, `maxHeight`, `scrollTo`, `renderEvent`;
  `selectedId` and `onSelect`, one tab stop with the arrows, Home and End.
  Each column a list of buttons under a heading, not a grid of cells.
  Exports `Scheduler`, `schedulerViews`, `schedulerKinds`,
  `schedulerTones`, `SchedulerProps`, `SchedulerEvent`,
  `SchedulerResource`, `SchedulerView`, `SchedulerKind`, `SchedulerTone`,
  `SchedulerHours`, `ISODateTime`. Phase 2, the gestures, each armed by its
  callback: `onCreate` (a press proposes `defaultDuration`, a drag the span,
  snapping to `step`; Enter on the region places a keyboard cursor; ⌘V
  pastes and ⌘D duplicates, with `from`), `onMove` (a card dragged along or
  across columns; Shift with the arrows), `onResize` (the handle at the foot
  of the selected card; Alt+Shift with Up and Down), `onRemove` (the × on
  availability cards; Delete); `draft`, drawn dashed and pulsing while the
  caller's panel is open; `createKind`; `draftLabel`, `removeLabel`; a
  status region says the time as it moves. On touch a tap proposes and
  nothing drags. Exports `formatSlots`, the "Copy to clipboard" text, one
  line per day; `SchedulerDraft`, `SchedulerChange`.
- **CommandPalette** — a dialog with a field and a list of commands, the
  site's ⌘K graduated: `open`, `onClose`, `label` (names the dialog, the
  field and the list), `placeholder`, `icon`, `items` of groups `{ label,
  items }` of `CommandItem { id, label, description, detail, icon,
  shortcut, keywords, disabled, mono }`, `onSelect(item)`; `filter` as the
  Combobox's, `null` when the caller narrows, `query` / `defaultQuery` /
  `onQueryChange`, `loading` / `loadingText`, `emptyText(query)`, `status`
  for a line the caller writes; `size`. The field keeps focus, the arrows
  move an active row over a disabled one, Home and End are the caret's
  until a row is active, Enter follows the active row or the first, the
  IME's Enter is left alone, Esc closes and stops at the palette; what was
  typed is marked in the label and the detail. The palette never closes
  itself and binds nothing. Exports `CommandPalette`, `matchesCommand`,
  `useCommandPaletteShortcut(onOpen, key = 'k')` — ⌘ or Ctrl with the key,
  returning "⌘K" / "Ctrl K" after hydration — `CommandPaletteProps`,
  `CommandItem`, `CommandGroup`.
- **Category palette** — twenty-four theme tokens, `category/<hue>`,
  `category/on-<hue>`, `category/<hue>-subtle` and `category/<hue>-text`
  for `glacier`, `moss`, `amber`, `ember`, `glow` and `flare`: colour by
  category rather than by meaning, a person's events on the Scheduler or a
  tag by topic, each hue the accent's own four stops and measured in the
  suite. In `tokens.css`, the Tailwind theme and the Figma export.
- **Chart palette** — twelve theme tokens: `chart/sequential-1` to
  `chart/sequential-5`, twilight in five steps numbered by distance from
  the canvas in both modes, and `chart/low-3` to `chart/high-3` through
  `chart/mid`, twilight against flare on a stone centre. The suite holds
  the lightness between neighbours (ΔL ≥ .09 sequential, .16 diverging),
  3:1 on both surfaces from the third sequential step and the outer two
  diverging steps a side, and the text a value inside a cell takes on each
  step; the near-canvas steps are recorded at their figure. No chart
  component: the palette is for whatever draws the chart, through the
  custom properties. In `tokens.css`, the Tailwind theme and the Figma
  export; a sixth table on the Colour page and a Data visualisation page
  with the rules for the six categories on a chart.

### Changed

- **Tabs** — the segmented variant's track, segment, ghost and thumb are now
  drawn by a stylesheet shared with SegmentedControl. Nothing drawn changes;
  the custom properties the list sets inline are `--segmented-index` and
  `--segmented-count`, no longer `--tabs-index` and `--tabs-count`.

## 0.4.0 — 2026-09-22

Waves 1 and 2 of the completeness roadmap together: `0.3.0`, which was to
carry wave 1 alone, was never cut.

### Breaking

- **`Select` is no longer the native `<select>`.** It is a button that opens
  the system's own list, the same in every browser, and takes `options` (an
  array) and `onChange(value)` in place of `<option>` children and a change
  event. The native one is unchanged and is now `NativeSelect`
  (`NativeSelectProps`): to keep today's behaviour, rename the import.
- **Table's root is a wrapper around the region.** The density class,
  `aria-busy`, `className` and the rest go to the root; the region keeps its
  role and its name. A selector that reached the region as the first element
  now finds the root.

### Added

- **Tabs** — `underline`, `segmented` and `pill` over one WAI-ARIA tabs
  pattern: roving focus, arrows that wrap and skip a disabled tab, Home and
  End, `dir="rtl"`, automatic or manual activation, an optional count in a
  tab's name, `keepMounted`, and a list that scrolls to keep the selected tab
  in view. Exports `Tabs`, `tabsVariants`, `TabsProps`, `TabItem`,
  `TabsVariant`.
- **Alert** — a tinted line that stays in the page: `info`, `success`,
  `warning` and `danger`, a message with an optional `title`, at most one
  `action`, and a close when `onClose` is given (the caller removes it).
  Not a live region unless `announce`. It measures its own container, so in
  a narrow column the action drops under the message. Exports `Alert`,
  `alertTones`, `ALERT_NARROW`, `AlertProps`, `AlertTone`, `AlertAction`.
- **`border/info-subtle`, `border/success-subtle`, `border/warning-subtle`,
  `border/danger-subtle`** (`--ap-color-border-*-subtle`) — the soft edge of
  a tinted status surface.
- **Card** — a filled surface a step under `surface/raised`, with no border,
  and five parts: `CardMedia` (a picture set into it, 16 / 9 unless told),
  `CardBody`, `CardTitle`, which with `href` makes the whole card its link
  while the link's name stays the title, and `CardActions`, which keeps
  controls pressable inside a linked card. Only a linked card answers the
  pointer: the theme's wash, and the picture rises a level. Exports `Card`,
  `CardMedia`, `CardBody`, `CardTitle`, `CardActions`, `cardElements`,
  `cardTitleElements` and their prop types.
- **Link** — the accent in Medium, with a line only under the pointer and
  the keyboard's focus: `inline` (the default, the size of its sentence) or
  `standalone` (24 tall, with `iconEnd`). `external` opens a new tab with
  `noreferrer` and says so to a screen reader; `render` hands the props to a
  router's link. Exports `Link`, `linkVariants`, `LinkProps`, `LinkVariant`,
  `LinkRender`, `LinkRenderProps`.
- `CardTitle` takes `render` and `Pagination` takes `renderLink`, the same
  hand-over to a router's link.
- **Button** takes `href` and is then an `a` with the same look, and
  `render` for a router's link. Disabled or loading, the link has no `href`
  and is `aria-disabled`. Exports `ButtonAsButtonProps`, `ButtonAsLinkProps`.
- **Table, dense** — `stickyHeader` pins the header inside a region bounded
  by `maxHeight`; `bulkActions` floats a bar over the selection with the
  count (`bulkLabel`), the caller's actions and "Clear selection"
  (`clearSelectionLabel`), which follows the page and never leaves the
  table; `footer` is a slot under the frame for the Pagination; a selected
  row takes the drawn stripe at its start. The root is now a wrapper around
  the region: the density class, `aria-busy`, `className` and the rest go
  to the root, and the region keeps its role and name. Exports
  `BulkActionsApi`.
- **Filters** — the filters on a list, read as words: a Tag for each field
  with a value, its words a button that opens the field's values as
  checkboxes, a "+" that opens the fields and then a field's values, and
  Clear. Controlled: `fields`, `value`, `onChange`; `label`, `addLabel`,
  `clearLabel`, `describe`. Exports `Filters`, `FiltersProps`,
  `FilterField`, `FilterOption`, `FilterValue`.
- **Progress** — a native `progress` painted on the element itself, so every
  browser draws the same bar: `label` (required, visible unless `hideLabel`),
  `value` and `max`, `showValue` with a floored percentage or `valueText`
  ("3 of 5", also what a reader is told), `size` `sm` (4) or `md` (8), and
  the Loader's tones, `success` for done and `danger` for failed. No `value`
  is a band that crosses; reduced motion holds it in place and lets it
  breathe. A change of value travels on the motion token. `--progress-fill`
  (an image) and `--progress-radius` for a bar along the page's edge.
  Exports `Progress`, `progressSizes`, `progressTones`, `ProgressProps`,
  `ProgressSize`, `ProgressTone`.
- **EmptyState** — what stands where content would be when there is none:
  a `title` that is a heading, a `description`, an `icon` in a circle or
  `media` in its place, an `action` and, only beside it, a `secondaryAction`.
  `size` `lg` centred for a table or a page, `sm` at the start for a card or
  a section; `variant="dashed"` for first use. Exports `EmptyState`,
  `emptyStateSizes`, `emptyStateVariants`, `EmptyStateProps`,
  `EmptyStateSize`, `EmptyStateVariant`.
- **Breadcrumb** — a `nav` with an ordered list: the section as a capsule
  with its `icon`, slashes, and the page in words with `aria-current`, never a
  link. Every link is a capsule under the pointer; only the first has an
  icon. `items` of `label` and `href`, `renderLink` for a router, `maxItems`
  to fold the middle into a button that unfolds it in place, a long name cut
  with an ellipsis. Exports `Breadcrumb`, `BreadcrumbProps`,
  `BreadcrumbItem`.
- **Skeleton** — the shape of what is on its way: `text` (the height of the
  line it stands in, `lines`, the last one shorter), `circle` and `rect`, with
  `width`, `height` and `size`. `aria-hidden` spans, so one can stand inside
  the heading or paragraph it replaces; the region that is loading says
  `aria-busy`. A sweep for each shape, 1.8s; reduced motion drops the travel
  and keeps a slow breath. Filled with the pressed wash, so one shape is right
  on the page, on a card and in a panel, in both modes. Exports `Skeleton`,
  `skeletonVariants`, `SkeletonProps`, `SkeletonVariant`.
- **Accordion** — sections that open and close on the native `details`, so
  the browser's find-in-page opens the section that holds the match: a row of
  64 with the chevron at the start, a `title` that is a heading
  (`headingLevel`), a `count` or a `meta` Badge after it, and an `action` at
  the row's end, outside the summary and always shown. Several open at once,
  or `exclusive` for one. `open`, `defaultOpen`, `onOpenChange`. Exports
  `Accordion`, `AccordionItem`, `accordionHeadingLevels`, `AccordionProps`,
  `AccordionItemProps`, `AccordionHeadingLevel`.
- **Drawer** — a panel at the side of the page, not modal: `overlay` grows
  over the content in the top layer, `inline` is a sibling the content makes
  room for. 480 or 768 wide, the Popover's header, body and footer at the
  height of the page; `expanded` with `onExpandedChange` covers the page;
  `resizable` adds a separator on the inner edge that is dragged or moved with
  the arrows, Home and End, with `width`, `defaultWidth`, `onWidthChange`,
  `minWidth` and `maxWidth`. It never closes itself: Esc from inside and the
  close button call `onClose`, so a page can ask before a form is lost.
  Exports `Drawer`, `drawerModes`, `drawerSides`, `drawerSizes`,
  `DRAWER_WIDTH`, `DrawerProps`, `DrawerMode`, `DrawerSide`, `DrawerSize`.
- **Tag** — a capsule for something the reader added and can take away: the
  words, `start` for an Avatar or an icon, `md` (32) or `sm` (24), and
  `onRemove` for a button named after the words. Neutral only. A field that
  holds tags hands them `--tag-fill` and, through `removeProps`, takes the
  button out of the tab order. Exports `Tag`, `tagSizes`, `TagProps`,
  `TagSize`.
- **Combobox** — a field that is typed in to narrow a list, the value always
  from the list: the Select's `options`, the part that matched shown by
  weight, the best match taken by Enter, `filter` (or `null` with
  `onInputChange` and `loading` for a caller that fetches), `emptyText`,
  `clearable`. With `multiple`, the drawn one: tags in a field that grows, a
  checkbox before every option, `selectAllLabel` for a first row that is
  mixed, Backspace for the last tag, a count said on change, one hidden input
  for each value. Exports `Combobox`, `ComboboxProps`, `ComboboxSingleProps`,
  `ComboboxMultipleProps`.
- **Select** — one value from a list, in Input's box: options with an
  Avatar or an icon before them, a second line, or content in place of the
  label; groups; a check in the accent on the choice; the whole keyboard of a
  select, with letters; a hidden input for forms, and a Field's label,
  description and error. Exports `Select`, `SelectProps`, `SelectOption`,
  `SelectGroup`, `SelectEntry`.
- **Popover** — a panel anchored to the button that opens it, not modal: a
  `title` (or `aria-label`), `headerActions`, a body and `actions` at the
  end, any of which may be a function handed `close`; four placements that
  take the roomier side, `width`, `open` and `onOpenChange`, `initialFocus`.
  The platform's `popover`, so Esc, a press outside and the focus going back
  are the browser's. Exports `Popover`, `popoverPlacements`, `PopoverProps`,
  `PopoverPlacement`, `PopoverTriggerProps`, `PopoverApi`.
- **Pagination** — a named `nav` of pages in seven places that never move
  the arrows, with `aria-current`, arrows that are `aria-disabled` at the
  ends, `hrefFor` for links, and the page arrived at announced. With `total`
  and `pageSize` it adds a summary, "Showing 10 per page · 1–10 of 72",
  whose page size is an editable combobox inside the sentence when
  `onPageSizeChange` is given: typed or picked, and the reader's place is
  kept. `summary` and every label are props, for other languages. Exports
  `Pagination`, `pageItems`, `PAGE_SIZE_OPTIONS`, `PaginationProps`,
  `PaginationSummaryParts`, `PageItem`.
- **Toast** — `toast(message, options)` and one `<Toaster />`: a line on the
  inverse surface in a corner, with a tone read from its icon (`neutral`,
  `success`, `danger`, `warning`, `info`), at most one action and a close.
  5s, 10s with an action, an error stays (WCAG 2.2.1); the clock stops under
  the pointer, with focus inside and in a background tab. A named live
  region in the top layer, F6 to reach the newest and Esc to dismiss it;
  six placements; `closeLabel`; an `id` updates a toast in place. Exports `Toaster`,
  `toast`, `toastTones`, `toasterPlacements`, `ToasterProps`,
  `ToasterPlacement`, `ToastOptions`, `ToastAction`, `ToastTone`.
- **Tooltip** — the overlay card (`md`) and a compact size (`sm`), opened by
  hover after 400ms and by keyboard focus at once, hoverable, dismissed by
  Esc without moving focus, persistent (WCAG 1.4.13). Describes its trigger
  or, with `purpose="label"`, names it; an optional `description` and
  `shortcut`; four placements that flip. Exports `Tooltip`, `tooltipSizes`,
  `tooltipPlacements`, `TooltipProps`, `TooltipSize`, `TooltipPlacement`.
- **`elevation/sm`** (`--ap-elevation-sm`) — one short layer, for a part that
  lifts inside its own control.

### Changed

- DropdownMenu, DatePicker and the Pagination's page size stand on one
  floating surface, `floating.module.css`, where each had its own copy. Their
  gap from the trigger is now kept on either side, whichever way they open.

- Button gives way by 4% when pressed (colour alone under reduced motion).
- Dialog's title wraps; the header gap is 24.
- Table's end-aligned cells use tabular figures.

## 0.2.0 — 2026-09-12

### Breaking

- `interactive/neutral-hover` and `interactive/neutral-pressed` are gone.
  Hover and pressed are a wash, `interactive/wash-hover` and
  `interactive/wash-pressed`, laid over whatever is beneath.

### Added

- The surface step `925` in `stone` and `night`; the dark ladder is
  `950 / 925 / 900`.
- `border/subtle` is an alpha and reads on all four surfaces.

## 0.1.0 — 2026-09-11

First release: Avatar, Badge, Button, Calendar, Checkbox, DatePicker, Dialog,
DropdownMenu, Field, Input, Loader, Radio, Select, Switch, Table, Textarea;
the token layers, the Tailwind theme and the contrast instrument.
