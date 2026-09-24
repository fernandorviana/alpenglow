# Table responsive columns — design

2026-09-24. The third piece of the roadmap's fourth wave, moved up while
deciding breakpoints and layout: the Table's columns give way as the
Table's own width shrinks, whether the viewport or a side panel narrows it.
Decided with Fernando section by section. The model is Asana's list: a
column shrinks to its minimum, then leaves, the least important first, and
the row's actions stay at the end, gathering into a "⋯" menu when there is
no room for them side by side. Nothing hidden is moved elsewhere: a column
that leaves is gone until there is room for it again.

It replaces the Table's one responsive behaviour today, a container query
at 40rem that drops the header and every cell but the primary, selection
and action cells, turning the table into a list.

## Decisions

### Column rules

1. **Two kinds of column.** A column with a `width` is **fixed**: it keeps
   that width and leaves whole, never shrinking first. A column without one
   is **flexible**: it takes a share of what the fixed columns leave, in
   proportion to its minimum (decision 11).

2. **`width` becomes a number, in px** (was any CSS string, applied through
   a `<col>`). The arithmetic in decision 9 has to add it up, and a `rem` or
   a `%` cannot be added to a px before layout. Two callers pass one today:
   the screen (`'8.5rem'`, which becomes `136`) and one test.

3. **`minWidth?: number`**, in px, the column's border box — padding
   included, as every size in the Table already is. It defaults to 96
   (`spacing/1100`) and to 160 (`spacing/1300`) for the primary column. A
   fixed column's minimum is its `width`; `minWidth` on it is ignored.

4. **`priority?: number`**, 1 the most important. Left out, the order is the
   columns' source order, so with no priorities declared the last column
   leaves first. Ties keep source order. A column given a priority ranks
   among the others by it; one without ranks after every column with one.

5. **What never leaves:** the primary column, the selection column and the
   action column. The **sorted column** is raised to rank just after them
   for as long as it is sorted, so the column a reader chose to order by
   never disappears under them.

6. **A column appears only when it fits whole at its minimum.** It shrinks
   while it is shown; it does not come back half-wide.

7. **Wrapping by default, truncation by choice.** A cell's text wraps as it
   does today: at its minimum a flexible column wraps more and the row grows.
   `truncate?: boolean` on a column keeps its cells to one line with an
   ellipsis, for dense columns such as a name or a type. Truncation is not
   the default because the site's props tables have long descriptions that
   must read whole.

### Row actions

8. **`rowActions?: (row) => DropdownMenuAction[]`** — the same action shape
   the DropdownMenu takes (`id`, `label`, `icon`, `tone`, `disabled`,
   `onSelect`).
   - The first `rowActionsInline` actions **with an icon** (default 2) show
     as square icon-only Buttons, the label as `aria-label` and as a
     Tooltip. An action without an icon never shows inline.
   - The rest go into a "⋯" DropdownMenu at the end, named by
     `rowActionsLabel?: (row) => string` (default `"More actions"`). A row
     whose actions all fit inline has no "⋯".
   - **The actions gather before any column leaves.** Below their threshold
     (decision 9) every action of the row is in "⋯", which is then the only
     control in the cell. "⋯" itself never leaves.
   - The existing `rowAction` render prop stays, for an action the menu
     cannot express; it counts as one 40 button in the arithmetic. A Table
     takes `rowAction` or `rowActions`, not both.

   The square icon-only Button is new (decision 13).

### The arithmetic

9. **`columnThresholds(columns, extras)`**, a pure function, returns the
   container width below which each thing leaves:
   - **The extras** are the frame's border (2 × 1), the selection column
     (56) and the action column: cell padding at comfortable (2 × 16) plus
     40 a button and 4 (`spacing/050`) between buttons. Inline, the button
     count is the most any row shows plus "⋯" if any row overflows, read
     from `rows` at render, and at least one; gathered, it is one. Buttons
     count as 40 at both densities, so compact has a little room to spare.
   - **A set of shown columns fits** when the container holds the extras,
     the fixed columns' widths and the flexible columns' minimums. Each
     flexible column's share is in proportion to its minimum (decision 11),
     so the plain sum is enough: no column is pushed under its minimum
     while the set fits.
   - **Inline actions** leave first: their threshold is every column shown
     plus the inline action column.
   - **Columns** then leave in reverse rank. Column *k*'s threshold is the
     fit of the never-leaving columns and every column ranked up to *k*,
     with the actions gathered.
   - Below the last threshold only what never leaves is shown; if even that
     does not fit, the table keeps that width as its `min-width` and the
     region scrolls sideways, as it can today. The Table's container is not
     the viewport — it is narrower by the page's margins and whatever sits
     beside it — so a caller sets its own minimums to fit its own floor: the
     dense screen's is 258, which fits its 1280 zone and a 320 phone (288 of
     Table).

### The mechanism

10. **Generated container queries, per instance.** The root is already
    `container-type: inline-size`. Each Table gets a `useId`, set as
    `data-table` on the root, and renders a `<style>` as the root's first
    child whose rules read, for example:

    ```css
    @container (width < 432px) {
      [data-table="_r_0_"] [data-col="type"] { display: none; }
    }
    ```

    The attribute value is quoted and escaped, so any id React produces and
    any column key is a valid selector. The widths are px, the Table's own
    content arithmetic, not breakpoints; the scale test already leaves
    `@container` alone. The `<style>` is rendered in place, not hoisted
    with `href` and `precedence`: React never removes a hoisted sheet, so
    the rules written for an earlier sort would stay in the head and keep
    hiding. In place, it changes with the Table and leaves when it unmounts
    (tried in jsdom on 2026-09-24: updated on rerender, gone on unmount,
    no warning). With no JS the rules still arrive in the server's HTML:
    nothing waits for a measurement, and there is no `ResizeObserver`.

11. **Fixed table layout.** `table-layout: fixed`, widths on the header
    cells, and no `<colgroup>`: with `display: none` on a column's cells a
    positional `<col>` would slide onto its neighbour. The selection cell
    keeps its 56, now said once. For each set of shown columns the
    generated rules give:
    - a fixed column its px;
    - the action column its px, inline or gathered;
    - each flexible column `calc((100cqi - F) * m / M)`, where `F` is the
      extras and the fixed widths shown, `m` its minimum and `M` the shown
      flexible minimums' sum — its share in proportion to its minimum, read
      from the Table's own container;
    - one flexible column no width — the primary, or else the most
      important flexible column shown — so it takes what is left, and a
      vertical scrollbar in a bounded region comes off it instead of
      pushing the table wider than its frame.

    Flexible columns share by their minimums where the auto layout sized
    them by content (Changed). With no flexible column, the browser shares
    the leftover among the fixed ones.

12. **Hidden means gone.** `display: none` on a column's `th` and every
    `td` takes it out of the accessibility tree with the pixels, so a
    screen reader reads the columns a sighted reader sees, and the header
    count matches. Nothing is announced when a column leaves: a width
    change is not an event in the content, and a live region firing on a
    window drag would be noise. `data-col` carries the column's `key` on
    its header and cells.

### The Button

13. **A square icon-only shape.** `Button` gains an icon-only form: the
    height of its size or density as its width too, the icon centred, no
    label drawn. Its accessible name is required — typed so that the
    icon-only form without `aria-label` does not compile, and tested. The
    dense screen recorded its absence as a gap; the row actions need it.

## Migrations

| Where | Today | Becomes |
|---|---|---|
| `Column.width` | any CSS string, on a `<col>` | px number, on the header cell |
| The 40rem container query | header and secondary cells hidden, rows padded as a list | removed; columns leave by rank instead |
| `<colgroup>` and the second 56 | the `<col>` and the `.selectCell` both declare 56 | the `.selectCell` only |
| The screen's Appointments Table | `width: '8.5rem'` on Time; the primary cell carries a `.meta` line (time, practitioner, status) for the collapsed list | Time `136`; priorities, minimums and `truncate` declared; the `.meta` line, its styles and the test helper that skips it go; `rowActions` (confirm, cancel, open) |
| `app/table/page.tsx` | a `.rowAction` button styled in `docs.css` | a `rowActions` example; the `.rowAction` style goes |
| The site's other Tables | unchanged in code | lose the list below 40rem and gain the leaving; checked in the browser |

## Deliverables

- `Table.tsx`: `minWidth`, `priority`, `truncate` on `Column`; `rowActions`,
  `rowActionsInline`, `rowActionsLabel`; `data-table`, `data-col`, the
  generated `<style>`, the raised sorted column; `width` as px on the header
  cell; no `<colgroup>`.
- `Table.module.css`: `table-layout: fixed`; the collapse block and its
  comment removed; the truncation class; the action cell's layout (inline
  buttons and "⋯", gap `spacing/050`).
- `columnThresholds` in its own module beside the Table, exported from the
  Table's entry for a caller who wants the numbers.
- `Button`: the icon-only form.
- Tests:
  - `columnThresholds`: defaults, source order, priorities with ties, a
    fixed column, the thresholds as plain sums of minimums, the sorted
    column raised, the actions gathering first, the extras with and without
    selection; the generated widths (each flexible share, the one left
    without a width, the table's `min-width`) and the escaping of keys.
  - The Table: `data-col` on the header and every cell of a column; the
    generated rules name the thresholds; the style changes when the sort
    does; the primary, selection and action cells are never in a rule;
    `rowActions` inline up to `rowActionsInline`, iconless actions only in
    "⋯", "⋯" absent when everything fits, its name from `rowActionsLabel`;
    `rowAction` and `rowActions` together rejected by the types.
  - The Button: the icon-only form is square at each size and density, and
    has its name.
  - The collapse tests (`describe('Table collapse')`) replaced by the ones
    above; the screen's test no longer steps over a hidden `.meta`.
- The Table page: the new props in its props table; a section on the rules
  (fixed and flexible, minimum, priority, what never leaves, actions
  first); a Try it whose frame steps through 800, 560, 400 and 320 with the
  system's own segmented control; the `rowActions` example.
- The screen: the Appointments Table as in Migrations.
- `CHANGELOG.md` under Unreleased — **Added**: `minWidth`, `priority`,
  `truncate`, `rowActions`, `rowActionsInline`, `rowActionsLabel`,
  `columnThresholds`, the icon-only Button. **Breaking**: `Column.width` is
  a px number, no longer a CSS string. **Changed**: columns leave by rank
  instead of the Table collapsing to a list under 40rem; fixed table
  layout, flexible columns sharing by their minimums.
- `MEMORY.md`: the claim; an invariant — a column leaves by rank; the
  primary, selection and action columns never do; the gaps "Table always
  collapses under 40rem" and "Button has no square icon-only shape"
  closed. The roadmap's wave 4 row. `/screen`'s "What moved up" list gains
  the two closed gaps.
- Seen in Chromium: the Table page's Try it at each frame width; the screen
  from 1440 down to 320, with the side panel open and closed, columns
  leaving in the declared order and "⋯" opening; a props table at 1280 and
  375; axe on every page with a Table.

## Not in this spec

- Columns a user resizes by dragging the header.
- A columns menu to hide and show columns by hand.
- A tooltip on truncated text.
- Columns pinned to the start while the region scrolls sideways.

Each is its own piece if a product needs it.
