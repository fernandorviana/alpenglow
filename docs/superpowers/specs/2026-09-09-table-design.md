# Table — design

**Date:** 2026-09-09
**Status:** approved, ready for an implementation plan
**Figma:** page `__ Table` in the source design file (the file key is kept out of this repository)

---

## Why this component

Eight theme tokens name components that do not exist. Five of them are this
one: `surface/raised` (table body), `interactive/neutral-hover` (row hover),
`interactive/selected` (selected row), `border/subtle` (row separators),
`surface/accent-subtle` (highlighted row).

A sixth, `surface/sunken`, says *"Wells, table headers, tracks"* — and this
component does **not** redeem it. See collision 1: the drawing is right not to
use it, and the `use` string is what needs correcting.

Alpenglow is sold in one sentence — *a design system for dense, data-heavy
interfaces*. The table is the component that sentence is about, and it is the
one missing. Everything else in the open-work list costs less than this.

The design already exists in Figma and is not being reinterpreted. Where this
spec departs from it, the departure is named and argued.

---

## What is in scope

Presentational, with **sorting and selection as controlled state**. The table
draws, carries correct semantics, and reports intent; it holds no state and
sorts no data.

This is the line because what is hard about a table is not sorting an array. It
is `aria-sort` on the right header and no others, `scope="col"`, the header
checkbox sitting in `indeterminate` when the selection is partial, a distinct
accessible name on every row checkbox, and a horizontally scrolling region a
keyboard can reach. All five fail silently. All five belong in one place that
can be tested once.

The precedent is already in the codebase, in `Field`'s own doc comment:

> Written by hand, this is four things to get right and three of them fail
> silently … Field makes those unwriteable rather than merely documented.

**Out of scope:** virtualisation, column resizing, sticky columns, pagination,
grouping, row expansion, drag reordering. Any of them can be added later
without changing the API below.

---

## API

```tsx
export type SortDirection = 'asc' | 'desc';
export type Sort = { key: string; direction: SortDirection };
export type ColumnAlign = 'start' | 'center' | 'end';

export type Column<Row> = {
  /** Stable identifier, and the value reported as the sort key. */
  key: string;
  header: ReactNode;
  /** Whatever should appear in the cell. */
  cell: (row: Row) => ReactNode;
  /** Defaults to 'start'. Use 'end' for numbers. */
  align?: ColumnAlign;
  sortable?: boolean;
  /** Any CSS width. Applied via <col>, so it does not fight the cells. */
  width?: string;
  /** Survives the collapse to a list. See "degrading when props disagree". */
  primary?: boolean;
};

export type TableProps<Row> = {
  /** Required. Rendered as a visually hidden <caption>. */
  caption: string;
  /** Show the caption above the table instead of hiding it. */
  captionVisible?: boolean;

  columns: Column<Row>[];
  rows: Row[];
  getRowId: (row: Row) => string;

  density?: 'comfortable' | 'compact';

  sort?: Sort | null;
  onSortChange?: (next: Sort | null) => void;

  selected?: ReadonlySet<string>;
  onSelectionChange?: (next: Set<string>) => void;
  /** Accessible name for a row's checkbox. Defaults to `Select row {n}`. */
  selectionLabel?: (row: Row) => string;

  /** The trailing action column from the drawing. */
  rowAction?: (row: Row) => ReactNode;

  /** Shown in place of rows when `rows` is empty. */
  empty?: ReactNode;
  loading?: boolean;
} & Omit<HTMLAttributes<HTMLDivElement>, 'children'>;
```

### Four choices worth defending

**`caption` is required.** A table with no accessible name is the most common
table defect there is. Because it is required in the type, it cannot be
forgotten — the same move `Field` makes with its label.

**Selection is a `Set` of row ids, controlled.** The header checkbox *derives*
`checked` and `indeterminate` from `selected.size` against `rows.length`. The
drawing shows the indeterminate state; deriving it is what stops it being
wrong.

**`selectionLabel` exists because ten checkboxes named "Select row" are
useless.** The default numbers them; a caller with a name should pass it.

**`rowAction` is a render prop, not a fixed component.** Same reasoning as the
cells below: the table owns the column, not its contents.

### Degrading when props disagree

Two combinations the type system cannot forbid, resolved here so they are not
resolved differently twice:

- **`sortable` without `onSortChange`.** The header renders as plain text, no
  button. A control that reports to nobody is worse than no control.
- **`primary` on zero or on several columns.** The first column in source order
  wins. Zero is the common case for a table nobody expects to collapse, so it
  is not an error; several is a caller mistake that still has to render.

### Cell content is not the table's business

The Figma file draws twelve `Table Cell` types: With Avatar, Text & Subtext,
Label, Right Aligned, Counter, Icon, Icon sm, Pictogram, Start-Selection,
Start, Hover Action, mobile.

Only some of those are structure. Alignment, the leading selection column, the
leading gutter and the trailing action column are the table's concern and
appear in the API. Avatar-plus-text, text-plus-subtext, a label, a counter, an
icon, a pictogram are *things put inside a cell* — they are what `cell` returns,
and they become documented composition examples on the docs page rather than
props.

A `type` prop per drawn variant would mean editing the library every time a
thirteenth kind of cell appears, and every variant would carry props that serve
only it.

---

## What the drawing actually specifies

Read from the Figma variables bound to `3002:2315` (`Table / Type=With
Selection`), not inferred.

| Part | Value | Alpenglow token |
|---|---|---|
| Table body | `#FFFFFF` | `surface/raised` |
| Header band | `#F6F8FA` | `surface/base` — see collision 1 |
| Row separator | `#EBEEF1` | `border/subtle` |
| Selected row | `#F2EFFE` | `surface/accent-subtle` — see collision 2 |
| Header text | `#545969` | `text/secondary` |
| Body text | `#383A47` | `text/primary` |
| Outer radius | `8` | `radius/lg` — see collision 3 |
| Checkbox radius | `4` | `radius/sm` |
| Spacings bound | `2` / `4` / `8` / `12` / `16` / `20` | `spacing/025`…`250` |
| Header type | Montserrat 11/14, +0.8, 600 | `caption/sm` + `semibold`, uppercased |
| Primary text | Inter 16/24, −0.1, 500 | `body/lg` + `medium` |
| Secondary text | Inter 14/22, 0, 500 | `body/md` + `medium` |
| Header height | 44px | — |
| Row height | 72px | — |
| Selection column | 56px wide | — |
| Leading gutter | 20px wide | — |

Type maps exactly; only the names differ (`paragraph/*` in Figma is `body/*` in
code). The header is uppercased by the component, because the bound style is
`caption/sm` at 11px rather than `caption/caps` at 10px.

### Collision 1 — the header band is not `surface/sunken`

`surface/sunken`'s own `use` string reads *"Wells, table headers, tracks"*, and
the drawing does not use it. It uses `surface/base`.

The drawing is right, for a reason the `use` string does not know: in light,
`surface/sunken` is `#EBEEF1` and `border/subtle` is **also** `#EBEEF1`. A
header band painted `surface/sunken` would swallow the separator beneath it.

Both clear AA for the header text, so this is not a contrast decision:

| Header band | Light | Dark |
|---|---|---|
| `surface/base` | 6.55 | 10.36 |
| `surface/sunken` | 5.99 | 11.39 |

**Decision:** follow the drawing — `surface/base`. Separately, correct
`surface/sunken`'s `use` string, which currently sends the next reader at a
collision.

### Collision 2 — two tokens, one value

`surface/accent-subtle` and `interactive/selected` are byte-identical in both
modes: `#F2EFFE` light, `#310D84` dark. The drawing binds
`surface/accent-subtle`; `interactive/selected`'s `use` string says *"Selected
row, tab, nav"*.

**Decision:** use `interactive/selected`, because a selected row is an
interactive state and that token's name says so. Record the redundancy as a
token-layer question for later — two names for one value will drift the first
time someone changes one.

### Collision 3 — radius names are offset by one above `sm`

| | Figma | Code |
|---|---|---|
| `radius/sm` | 4 | 4 ✓ |
| `radius/md` | **8** | 6 |
| `radius/lg` | — | **8** |

`scale.ts` documents why: 6 was reinstated as a deliberate step, which shifted
every name above it. So the drawing's `radius/md` is the code's `radius/lg`.
Anyone porting a Figma value by name will be one step out.

---

## Semantics

A real `<table>` with `<thead>`, `<tbody>`, `<th scope="col">`, and a `<col>`
per column carrying `width`.

- A sortable header is a `<button>` **inside** the `<th>`, never a handler on
  the `<th>`. Only the button is keyboard reachable.
- `aria-sort` appears on the sorted column only. Putting it on every header is
  the usual mistake and is worse than omitting it.
- A selected row does **not** get `aria-selected`. That attribute is only valid
  under `role="grid"`; on a plain table it is invalid ARIA that reads as
  correct. Selection state lives in the checkbox. Styling hangs off
  `data-selected`.
- The scroll container gets `tabindex="0"`, `role="region"` and an
  `aria-label` derived from `caption`. Without it a keyboard cannot scroll a
  wide table — WCAG 2.1.1, and routinely missed.
- `loading` sets `aria-busy` on the container.

### Sort cycle

Not specified in the drawing. **asc → desc → none**, reported as
`onSortChange(null)` on the third activation. Returning to the natural order is
useful and cheap; a two-state cycle strands the caller with no way back.

---

## Density

| | Row | Header | Horizontal padding |
|---|---|---|---|
| `comfortable` (default) | 72px | 44px | `spacing/200` |
| `compact` | 48px | 36px | `spacing/150` |

**Height is set on the row, not derived from padding.** The arithmetic does not
close the other way round: the drawn primary cell stacks `body/lg` on `body/md`
for 46px of content, and no symmetric value from the spacing scale takes that
to 72 while also taking a single 22px line to 72. So the row carries a
`min-height` and centres its content vertically, and padding is horizontal
only. An implementation that pads vertically instead produces 62px rows that
look nearly right, which is the worst kind of wrong.

`comfortable` is the drawing, unchanged, and the default. `compact` is an
addition: the drawn `Size` axis holds only `lg` and `mobile`, and 72px rows are
comfortable rather than dense — which leaves the component that should prove
the system's one-sentence pitch as the one that proves it least.

It costs two blocks of CSS, no new structure. **The deviation is recorded in
`Table.module.css` and in `MEMORY.md`**, with this reasoning. The `Loader`
departed from its drawing silently and that is logged as a defect; this is the
correction of that habit.

---

## Responsive

The drawing's `mobile` variant does not scroll — it **collapses to a list**:
header gone, non-primary columns gone, primary cell and row action only.

Implemented with a **container query**, not a media query. A table in a narrow
sidebar should collapse on a wide screen, and it is the container's width that
decides. The collapse threshold is `40rem` of container width.

Between collapsed and full, the table scrolls horizontally inside its own
container — the behaviour `docs.css` already implements by hand as
`.tableScroll`.

---

## Three states the drawing does not cover

Named as additions, not as readings.

**Empty.** One cell spanning every column, containing `empty`, at row height.
Default text: `No rows`.

**Loading.** The header stays; the body is replaced by a single spanning cell
holding a centred `Loader` with a label. Keeping the header stops the layout
collapsing and reflowing when rows arrive.

**Loading over existing rows** is not supported. `loading` replaces the body.
A table that dims stale rows while fetching is a different component with a
different contract.

---

## Contrast obligations

Two assertions added to `src/tokens/contrast.test.ts`, both modes:

- Header text on the header band clears AA — measured 6.55 / 10.36.
- Body text on a selected row clears AA — measured 9.95 / 12.97.

Row separators are decorative: they group rows that are already separated by
position, so they are exempt from the 3:1 of WCAG 1.4.11. This is written down
rather than assumed.

Selection is never colour-only — the checkbox carries it.

---

## Testing

**Structure.** `<caption>` present; `scope="col"` on every header;
`aria-sort` on the sorted column and no other; `<col>` count matches columns.

**Selection.** Header checkbox is unchecked at zero, `indeterminate` at
partial, checked at full; row checkbox calls `onSelectionChange` with the right
set; select-all and clear-all; every checkbox has a distinct accessible name.

**Sorting.** Activating a sortable header cycles asc → desc → null; a
non-sortable header renders no button.

**States.** Empty renders the fallback and no rows; `loading` sets `aria-busy`
and renders the loader.

**Stylesheet**, in the mould of `Button.test.tsx`: both density blocks exist,
the container query exists, the scroll container is focusable.

---

## Files

```
src/components/Table/Table.tsx
src/components/Table/Table.module.css
src/components/Table/Table.test.tsx
src/components/Table/index.ts
src/index.ts                    ← export
src/tokens/contrast.test.ts     ← two assertions
src/tokens/theme.ts             ← correct surface/sunken's `use` string
app/table/page.tsx              ← docs page
app/ui/Nav.tsx                  ← nav entry
MEMORY.md                       ← record the density deviation
```

## Packaging

Nothing here needs new machinery. Components ship their own compiled CSS, so a
`<Table/>` behaves the same in a Tailwind project and in one with no framework.
Tailwind consumers additionally import `tailwind-theme.css` and get the token
vocabulary for their own utilities, which match because both read the same
custom properties. The build-tailwind generator already states this intent.

So the Table is authored as a hand-written CSS Module exactly like every other
component.

## Dogfooding

Out of scope here, deliberately: `docs.css` has five hand-rolled tables. Migrate
**one** — the Button props table, already an array with `.map()` — as proof the
API serves a real case. The other four are a follow-up.
