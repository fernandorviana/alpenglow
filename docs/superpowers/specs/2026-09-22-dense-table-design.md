# The dense Table, and Filters — design

2026-09-22. Last piece of the roadmap's second wave. Extends the Table
(`2026-09-09-table-design.md`; invariants 7 and 8 stand) and adds one
component, `Filters`.

## What is drawn

Two pages of the product, given by Fernando:

| Piece | Drawn |
|---|---|
| Filters, "future proof" | A white bar with `border/subtle` at radius 12 above the table: "Filters" in `text/secondary` Medium; chips 32 tall on `surface/sunken` at radius 8, "**Status** is **Active** and **Invite Pending** ×" with the field and the values Semibold and "is" and "and" Medium secondary; a "+" that opens a menu of fields and, for a field, a list of checkboxes with its values; a chip opens its values again; "Clear" at the end |
| Bulk actions | A bar floating at the foot, centred over the table: accent fill, radius 12, `elevation/md`; "2 SELECTED" in `caption/sm` uppercase; a divider; five icon actions of 20; a divider; a Switch "Show only selected"; "Clear Selection" as a capsule in a lighter accent. Selected rows carry a stripe of accent at their start |
| Footer | Under the frame, outside it: "Show [10 ⌄] · 1-10 of 72 results" and the pagination at the end |
| Toolbar | Above: search, a filter icon button, list or grid, a sort select. The caller's; the page composes it |

A sticky header is not drawn; the roadmap asks for it.

## Decisions

Fernando's, 2026-09-22: "faz e depois avaliamos" — build the recommended
split, and judge it in use.

1. **The split.** Into the Table: a sticky header within a bounded height,
   the selection bar, a `footer` slot and the drawn stripe. Beside it,
   `Filters`, a component of its own: the drawing has it as its own bar, and
   it serves a calendar or a list as well as a table. The toolbar is the
   caller's.
2. **The header sticks inside a region with a height.** The table scrolls
   horizontally inside its frame, and `position: sticky` is held by the
   nearest scrolling ancestor, so a header cannot stick to the page while
   the frame scrolls sideways. `maxHeight` makes the region scroll
   vertically too and `stickyHeader` pins the header inside it, as Carbon
   and Atlassian do. The header's line is a `box-shadow` and not a border,
   which `border-collapse` lets scroll away under a sticky header in
   Chromium.
3. **The selection bar is a floating neutral panel, not the drawn accent.**
   What the caller puts in it — icon Buttons, a Switch — reads the theme's
   text tokens, which on accent are illegible, and the theme has no tokens
   yet for controls on an inverse surface (the open "status-on-inverse"
   item). So it is the Popover's shell, `surface/overlay` on `elevation/lg`
   with the dark-mode hairline, where everything the system has works
   unchanged. The accent version waits for those tokens, or for an inverse
   scope, and is recorded. The bar is rendered by the Table when
   `bulkActions` is given and the selection is not empty: the count as a
   status, the caller's slot, and "Clear selection", which the bar owns
   since the Table owns the selection. It is `position: sticky` at the foot
   of the viewport inside the Table's root, outside the scrolling region,
   so it follows the page and never leaves the table.
4. **The stripe.** A selected row takes 3px of `interactive/accent` at its
   start, drawn with an inset shadow on the first cell; `:dir(rtl)` moves it.
5. **`footer`** is a slot under the frame; the page puts the Pagination there
   with `total`, `pageSize` and `onPageSizeChange`, which it already has.
6. **Filters is controlled.** `fields` describes what can be filtered:
   `{ key, label, options: { value, label }[] }`. `value` is
   `{ key, values }[]`, one entry per field with something chosen;
   `onChange` reports the next. A chip is a Tag with `onRemove`, whose words
   are a button that opens its values in a Popover of Checkboxes; "+" is a
   Popover with the fields not yet used, then the chosen field's values;
   "Clear" empties everything. Checking applies at once, as drawn. The chip
   reads "Field is A and B", the drawing's words; `describe` lets a caller
   say it otherwise.
7. The Filters bar's chips are the Tag at its drawn 32 and the frame is
   `surface/raised` with `border/subtle` at `radius/xl` (12).

## Shape

```
div.root[.comfortable|.compact][aria-busy] (className, rest)
  div.frame                            border, radius, surface/raised
    div.region[role=region][tabindex=0][.bounded]  overflow auto, max-block-size
      table  (unchanged; thead.sticky when stickyHeader)
  div.dock                             sticky bottom, height 0
    div.bar[aria-label]                surface/overlay, elevation/lg, one row
      span.count[role=status]          "2 selected"
      div.bulk.gathers[data-bulk=slot] a list: span[data-bulk=inline] and
                                       span[data-bulk=gathered] ("⋯")
      div.bulk.scrolls                 or the caller's nodes
      Button.clear                     span.clearIcon (✕ under 25rem),
                                       span.clearLabel "Clear selection"
  div.footer                           slot
```

```
div.filters
  span.label "Filters"
  div.chips (display: contents)
    Tag(onRemove) > Popover(trigger: button.words) > Checkbox list
  div.controls                         wraps whole, takes the rest of its row
    Popover(trigger: Button "+" aria-label "Add filter") > fields, then values
    Button ghost "Clear"   (with a value; at the row's end)
```

2026-09-25, at a narrow width: the chips' box took `flex: 1 1 auto`, so it
filled its rows, leaving the label alone above it and Clear alone below it
(three rows at 375, four at 320). The chips are now the bar's own items, and
the "+" and Clear share a box that wraps whole: Clear never stands on a row
alone, and the "+" stays beside the last chip whenever the two fit there
(when only the "+" would, it goes down with Clear). The bar takes
`min-width: 0` and a chip's words end in an ellipsis, so two long chips in
the scheduling screen's day bar no longer push the page sideways at 320.

## API

Table: `stickyHeader?: boolean`, `maxHeight?: number | string`,
`bulkActions?: BulkActions | ((api: { selected, clear }) => BulkActions)`
where `BulkActions` is `DropdownMenuAction[] | ReactNode` (the list since
2026-09-25, with `bulkActionsInline`, 5, and `bulkActionsLabel`),
`bulkLabel?: (count) => string` ("N selected"), `clearSelectionLabel?`,
`footer?: ReactNode`.

Filters: `fields`, `value`, `onChange`, `label` ("Filters"), `addLabel`
("Add filter"), `clearLabel` ("Clear"), `describe?`, `className`.

## Contrast

The stripe against the selected row, 3:1; the count and the chip's words on
their surfaces, AA; the chip's secondary words on `surface/sunken`, AA.

## From the build and the review

- The dock stretched the bar to its zero height (18px, measured); it is
  `align-items: flex-start`. At a phone width the bar ran past the viewport;
  it wraps. (2026-09-25: it no longer wraps — see below.)
- The bar lay over the last rows with no way out from under it: while it is
  shown the root sets `--table-foot-room` and the region pads its foot by
  it, so the last row scrolls clear.
- Filters rebuilt a field's values from its options and dropped a value it
  did not know; it is kept, after the known ones.
- The docs' own "show only selected" survived Clear selection with its
  Switch gone; it follows the selection.
- Recorded, not solved: the count is a `role="status"` inserted with the
  bar, so the first selection is not announced; a reader hears the second.

## At a narrow width, 2026-09-25

Wrapped, the bar was four lines at 375 (311×147) over two and a half rows,
its dividers hanging. It keeps to one row now. `bulkActions` also takes a
menu's actions, drawn as the rows' are (b31c046): those with an icon as
`sm` buttons named by a tooltip, the rest in "⋯", and every one in one "⋯"
beside them, the rules showing one set. The rows gather by the Table's
width, since everything in a row is counted; the bar holds words, the count
and Clear, whose width nothing counts, so its actions gather by the width of
their slot: a container as wide as the buttons inline, the only item in the
bar that shrinks, holding one "⋯" when it is narrower. `data-bulk`, not the
rows' `data-actions`, so neither set of rules reaches the other. The count
and Clear always show; under 25rem of Table, where "Clear selection" in
words, the count and a "⋯" do not fit a phone (340 in 256), Clear is drawn
as a ✕ and keeps its name, and the gaps close to 8. The caller's own nodes
cannot gather and scroll inside their slot.

The drawn Switch, "Show only selected", has no place in a menu. The dense
demo makes it an action with no icon, so it sits in "⋯" and says what it
will do ("Show all staff" once on). Fernando's to overturn: the Switch back
in the bar needs a slot beside the actions that the bar gives up first on a
phone. The scheduling screen's bar takes Confirm and Cancel as actions, the
icons its rows use.

## Not here

Column filters in the header; a grid role; virtualisation; the toolbar; the
accent bar; "show only selected" (the caller filters the rows and puts the
Switch in the slot).

## Tests

Table: root keeps the density class and `aria-busy`, the region its role and
name; `stickyHeader` class on the head and `maxHeight` as a custom property;
the bar only with `bulkActions` and a selection, its count, its slot, Clear
emptying the set; `footer` rendered; stylesheet: sticky rule, the shadow in
place of a border, the dock, box-sizing. Filters: label, chips from `value`,
remove, Clear, adding a field through the "+" and checking a value reports
the next value, unchecking the last value drops the field; axe.
