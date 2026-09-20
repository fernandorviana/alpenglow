# Pagination — design

The fifth component of wave 1 of the completeness roadmap
(`2026-09-18-completeness-roadmap.md`).

**It is drawn**, on the *Pagination* page of the Figma file: the published
`Pagination Item` (40 square; Selected with a 2px bar 16 wide under the
number, Hover a round fill, Focus a round ring, Active, Disabled),
`Navigation Button` (40, a 16 caret), and `Pagination` in four shapes —
`Overflow=False` (1 2 3), `Right` (1 2 3 4 5 … 24), `Left`
(1 … 20 21 22 23 24), `Middle` (1 … 7 8 9 … 24) — plus two unpublished
footer frames: "Show", a 40 Select holding 10, then "1-10 of 72 results",
with the pages at the far end. It is bound to old primitives
(`gray-dark/*`, `brand-alt/800`, `brand-1/500`).

## Decisions taken with Fernando, 2026-09-20

- **The page size is in the sentence, not a Select beside it.** His words:
  instead of a large select apart from the text, an inline solution — the
  sentence with the 10 carrying a chevron, a kind of select or input on
  hover, changed by hand or picked from some options. He asked for it to be
  investigated; what came back is below and he took the recommendations.
- **The sentence is "Showing [10] per page · 71–72 of 72".** "Showing 10 of
  72 results" is false on the last page, where 2 are showing; he agreed it
  is a problem. The control is the page size and the range says what is in
  view, which is what his first frame already drew ("1-10 of 72").
- **The control lives inside Pagination**, not exported on its own: with no
  `pageSize` the Pagination is the pages alone.

## What the investigation found

A number that can be typed or picked is the APG's **editable combobox with
`aria-autocomplete="none"`**: a text field with a list of suggestions that
does not filter by what is typed, and the pattern allows a value outside the
list.

| | | |
|---|---|---|
| `<input list>` and `<datalist>` | refused | The list takes no CSS, its text does not follow page zoom, and NVDA with Firefox does not announce it (MDN). It would be the one list in the system that looks like no other. |
| The system's Select, shrunk | not enough | It picks; it does not let a number be typed. |
| An `input` and a `listbox` in a popover | chosen | The DropdownMenu's surface and anchor positioning, the top layer, no JavaScript positioner. The first step of wave 2's Combobox. |

- **The chevron is always there.** A touch screen has no hover, and a number
  that only shows it can be edited under a pointer is never found. At rest:
  the number in `text/primary` Semibold and the chevron; the wash on hover;
  the ring on focus. 32 tall, so WCAG 2.5.8 holds.
- **`inputMode="numeric"`, not `type="number"`**: no spinners, no wheel
  changing the value, no "e", "+" or "-".
- **The width follows the digits**: a width in `ch` from the number of
  digits, over tabular figures, which is exact. `field-sizing: content`
  became Baseline only in June 2026 and is not needed.
- **Enter or leaving commits; Esc closes the list, and again puts the old
  value back.** A value that is not a whole number of 1 or more puts the old
  one back, with no error: there is nothing the reader has to fix. The
  ceiling is `maxPageSize`, 100.
- **Changing the size keeps the reader's place**: the new page is the one
  holding the first row that was in view.
- **The sentence is the caller's.** Word order differs by language, so
  `summary` is a function that is handed the control as a node; the default
  is the English sentence. The control's accessible name is apart: "Results
  per page".

## Decided by the repository's conventions, for Fernando to overturn

- **`nav` with a name, a list, a button per page.** `aria-current="page"` on
  the selected one; each named "Page 3"; Previous and Next named. The
  ellipsis is text, not a control.
- **Previous and Next are `aria-disabled` at the ends, never `disabled`.**
  Pressing Next onto the last page would otherwise disable the button under
  the focus, and the focus would fall to the body.
- **`hrefFor`** renders links instead of buttons, for paging that lives in
  the URL; `onPageChange` is still told.
- **Seven places at most, so the arrows never move**: one boundary page at
  each end, one sibling each side of the current, and an ellipsis where
  pages are skipped — never an ellipsis that hides a single page. The four
  drawn shapes are exactly this.
- **Unselected numbers are `text/secondary`**, as the drawn footer has them
  in grey, where the published item draws every number in primary: a 2px
  bar alone is a thin difference. The bar is `border/accent`.
- **Hover is the theme's wash, round; the ring is the system's, round.**
- **Carets flip under `dir="rtl"`.**

## Deviations from the drawing, with the reason

1. The Select becomes the inline combobox, and "Show" and the two frames'
   sentences become one (above).
2. Colours become theme tokens.
3. Unselected numbers are `text/secondary` (above).
4. The drawn Disabled item applies to Previous and Next only: a page number
   is never disabled.

## Found in the browser, 2026-09-20

The listbox was a `ul` inside the summary's `p`: the parser closes the `p`
early and React fails to hydrate. It is spans with roles, so the field can
stand in a caller's paragraph, and the summary is a `div`, which also keeps a
host page's rule for `p` off it. Nine places of 40 are 360 and a phone gives
280: a place gives way to 24 (WCAG 2.5.8), keeping its height. With
`flex-basis` in place of `width` every place collapsed to 24 at any width,
because the nav is sized by its content and a basis is not content.

## Found by the review, 2026-09-20

Typing clears the highlighted option: Down and then "17" and Enter took the
10 that was highlighted and threw the 17 away. A modified or middle click on
a page link opens a tab and does not page this list. Nothing above
`maxPageSize` is offered, since picking it would commit the ceiling and say
nothing; with no options the field is plain and has no chevron. A `page`
that is NaN is the first page. `announce={false}` silences the second of two
Paginations bound to one list. Recorded, not solved: the visually-hidden
rule is written out in three stylesheets now.

## Scope

**In.** `Pagination`, its types, `pageItems`; contrast cases; the
`/pagination` docs page, its `contents.ts` entry and section card;
`CHANGELOG.md`, README counts, `MEMORY.md`.

**Out, deliberately.** A compact size for the dense Table (wave 2, with the
Table's footer). "Go to page". First and Last buttons. Exporting the
combobox on its own, until wave 2's Combobox. Rebinding the Figma frames.

---

## 1. API

```tsx
<Pagination page={page} onPageChange={setPage} total={72}
            pageSize={size} onPageSizeChange={setSize} />

<Pagination page={page} onPageChange={setPage} pageCount={24} />
```

| Prop | Type | Default | |
|---|---|---|---|
| `page` | `number` | required | From 1. Clamped to the pages there are. |
| `onPageChange` | `(page: number) => void` | required | |
| `pageCount` | `number` | — | Or `total` and `pageSize`. |
| `total` | `number` | — | |
| `pageSize` | `number` | — | With `total`, shows the summary. |
| `onPageSizeChange` | `(size: number) => void` | — | With it the size is the combobox; without, plain text. It is followed by `onPageChange` when the page has to move. |
| `pageSizeOptions` | `readonly number[]` | `[10, 25, 50, 100]` | |
| `maxPageSize` | `number` | `100` | |
| `summary` | `(parts) => ReactNode` | the English sentence | `parts` is `{ size, from, to, total }`, `size` a node. |
| `hrefFor` | `(page: number) => string` | — | Links instead of buttons. |
| `siblings`, `boundaries` | `number` | `1`, `1` | |
| `label`, `previousLabel`, `nextLabel`, `pageSizeLabel` | `string` | `'Pagination'`, `'Previous page'`, `'Next page'`, `'Results per page'` | |
| `pageLabel` | `(page: number) => string` | `` `Page ${page}` `` | |
| `announce` | `boolean` | `true` | The page arrived at, said politely. |
| `className` | `string` | — | |

## 2. Structure

`div.root` > `div.summary`? (text, `span.size` > `input[role=combobox]`,
`span.chevron`, `span[role=listbox][popover=manual]` > `span[role=option]`),
`span[role=status]`, and
`nav[aria-label]` > `ul.list` > `li` > `button.item` | `a.item` |
`span.gap`.

## 3. Geometry and paint

| | |
|---|---|
| Item, arrow | 40 square, radius `full`, body/md Medium |
| Selected | `text/primary`; a bar 2 by 16, `border/accent`, at the foot |
| Unselected, ellipsis | `text/secondary` |
| Arrow at an end | `interactive/on-disabled`, no wash |
| Caret | 16 |
| Summary | body/md Medium, `text/secondary`; the numbers Semibold `text/primary` |
| Size control | 32 tall, radius `lg`, 8 and 4 inline, chevron 16 |
| List | the menu's: `surface/overlay`, `elevation/md`, radius `xl`, padding 8, rows 32, `border/default` in dark |
| Root | summary and pages at either end, wrapping, 16 between |

## 4. Contrast cases

- `text/secondary` and `text/primary` under both washes on base and raised —
  covered by the wash suite; named for the Pagination.
- `border/accent` on base and raised — 3:1, the selected bar.
- `interactive/on-disabled` recorded, exempt.

## 5. Tests

`pages.test.ts`: the four drawn shapes; no ellipsis for one hidden page;
count of 1 and 0; the current page clamped. `Pagination.test.tsx`: nav and
its name, `aria-current`, names, ends `aria-disabled` and inert, a press
tells `onPageChange`, `hrefFor` renders links, the summary's range on the
last page, plain text without `onPageSizeChange`, a custom `summary`; the
combobox — roles and states, the list opens by chevron and by arrow keys,
`aria-activedescendant`, Enter takes the option or the typed number, Esc
closes then reverts, blur commits, junk reverts, the ceiling, digits only,
the reader's place kept; the stylesheet; axe.

## 6. Checked by hand after the build

Both modes, in the Browser pane: the arrows do not move across the four
shapes; the bar; the round wash and ring; the control at rest, hovered,
focused, open; its list over the page; the footer wrapping at 320.
