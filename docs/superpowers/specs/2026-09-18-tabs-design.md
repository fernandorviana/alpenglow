# Tabs — design

The first component of wave 1 of the completeness roadmap
(`2026-09-18-completeness-roadmap.md`). One component, three looks, one
behaviour: a list of tabs that shows one panel at a time. Two of the looks
are drawn in the Alpenglow Figma file (the *Tabs Pill* page: `Tabs`, `Tab
Pill`, `Tab Group`); the third was proposed and approved on 2026-09-18.

## Decisions taken with Fernando, 2026-09-18

- **Three variants: the two drawn and an underline.** Offered the choice of
  the drawn pair only, the pair plus an underline, or the segmented one
  alone, Fernando chose the pair plus an underline and asked for it to be
  proposed. Nearly every system read in the 2026-09-18 survey has an
  underline tab and an adopter will look for it for page-level sections.
  It is recorded as **not drawn**: the file has no underline tab.
- **The underline tab's hover is a rounded ghost inside the tab, not the
  tab's whole box.** Fernando's correction to the first cut. A 32px ghost,
  radius 8, centred in the 40px tab, so the wash never touches the list's
  rule or the active bar. The hit area stays the full 40.
- **The underline tab, as approved:** 40px high (the `md` of `ControlSize`),
  12 of inline padding on the ghost, 4 between tabs, the label at 14
  Semibold. At rest `text/secondary`; selected `text/primary` plus a 2px bar
  of `border/accent`. A rule of `border/subtle` runs under the whole list
  and the bar sits on it. An optional count in `text/tertiary`, no circle.
- **The selected label is `text/primary`, not the `text/accent` the
  segmented variant draws.** `text/accent`'s `use` is "Links", and an
  underline tab sits on a page beside real links. Inside the segmented
  track the purple label cannot be mistaken for one.

## Decided by the repository's conventions, for Fernando to overturn

- **One component, `variant` prop** — `underline` (default), `segmented`,
  `pill` — the way Button holds solid, outline and ghost. The behaviour and
  the ARIA are identical; only the stylesheet differs.
- **The WAI-ARIA tabs pattern, automatic activation by default.** Arrow keys
  move focus and select, because a panel here is already rendered and costs
  nothing to show. `activation="manual"` makes arrows move focus only and
  Enter or Space select, for a caller whose panel fetches. Home and End go
  to the ends; arrows wrap; a disabled tab is skipped, as a disabled menu
  row is. Arrow direction follows `dir`.
- **Roving tabindex: the selected tab is the one tab stop.** Tab leaves the
  list for the panel, which is `tabIndex={0}` so a panel of plain text is
  reachable.
- **Only the selected panel is mounted**, the DatePicker's rule (invariant
  16) for the same reasons. `keepMounted` renders every panel and hides the
  rest with `hidden`, for a caller with a half-filled form in another tab.
- **Data in, not compound children** — `items`, as DropdownMenu takes
  `actions` and Table takes `columns`. One array keeps tab and panel from
  drifting apart, and the ids that tie them are the component's to make.
- **One size per variant, as drawn**: segmented and pill 32, underline 40.
  A tab's size changes its box, never its text, and nothing drawn asks for
  a second one (invariant 7's lesson: do not add what was not drawn without
  saying so — the underline is said; sizes are not added).
- **The focus ring follows the ghost on the underline tab**: radius 8,
  the usual 2px ring at the usual offset, so it never crosses the bar. On
  the other two it follows the segment and the pill.

## Deviations from the drawing, with the reason

1. **The segmented track is `surface/sunken` with a `border/subtle`
   hairline, not the drawn `surface/base` with no edge.** `surface/base` is
   the canvas: on it the drawn track is invisible (it was drawn on a white
   artboard). In dark `sunken` *is* the canvas (invariant 4), so there the
   hairline alone carries the track — "when you run out, separate with a
   border".
2. **The track's radius is `radius/lg` (8) and the thumb's `radius/md`
   (6)**, not the drawn literal 10 and 8. With 2 of padding, 8 outside
   wants 6 inside; both are on the scale and the drawn 10 is not.
3. **The thumb's shadow becomes `elevation/sm`.** Drawn as a literal,
   `0 2px 4px rgba(192,200,210,.5)`. `elevation.ts` has waited for this:
   "the drawing also has `sm` in Light Mode; it lands when a component asks
   for it". Light is `y 2, blur 4, alpha/ink-12` — over white the drawn
   grey at 50% and ink at 12% land within two units of each other. Dark is
   `alpha/black-32` at the same geometry, modest on purpose (invariant 10),
   and the thumb is `surface/overlay`: in light it is the same white as
   `raised`; in dark a segmented control usually sits on a card, where a
   `raised` thumb is the card's own colour. `overlay` is one step above the
   card and two above the track (seen in the browser, 2026-09-18).
4. **The selected pill's counter is `text/accent` on
   `interactive/selected`.** Drawn as `text/inverse` on
   `interactive/selected` — white on `twilight/050`, which does not read;
   the file's own render shows an empty circle. The fill is kept and the
   text corrected; the pair is measured in both modes.
5. **The pill is a capsule, `radius/full`**, not the drawn 20 on a 32px
   box. It is the same shape, and the capsule is the system's trait.
6. **An unselected pill takes a `border/default` hairline in dark**, the
   Badge's treatment: its `surface/sunken` fill is the canvas there.
7. **The counter is set in Inter.** The drawn counter is Montserrat, a
   leftover; `brand-alt/800`, bound on the pill and painting nothing, is
   another. Both are reported for the Figma file, not reproduced.

## Scope

**In.** `Tabs`, `TabsProps`, `TabItem`, `TabsVariant`; `elevation/sm`;
contrast cases for the pairs named below; the `/tabs` docs page and its
`contents.ts` entry; README counts, `MEMORY.md`, and the first
`CHANGELOG.md` entry (the roadmap starts the changelog with wave 1).

**Out, deliberately.**

- **Tabs that are links to routes.** A different pattern — `nav`, anchors,
  `aria-current="page"`, no `role="tab"`. It reuses this stylesheet and is
  specified with the navigation components.
- **SegmentedControl** (a radio group that holds a value). Wave 3; it will
  share the segmented rules here the way Input, Textarea and Select share
  `control.module.css`.
- Vertical orientation; closable or addable tabs; icons inside a tab;
  overflow arrows or a "more" menu; a sliding underline (tabs are unequal
  widths and it would need measuring in script).
- Writing the deviations back to the Figma file. It is Fernando's file and
  is asked for separately once the code lands.

---

## 1. API

```tsx
<Tabs
  label="Appointment"
  variant="underline"
  items={[
    { id: 'details', label: 'Details', content: <Details /> },
    { id: 'people', label: 'Participants', count: 12, content: <People /> },
    { id: 'chat', label: 'Chat', disabled: true, content: <Chat /> },
  ]}
  defaultValue="details"
  onChange={(id) => …}
/>
```

| Prop | Type | Default | |
|---|---|---|---|
| `items` | `readonly TabItem[]` | required | `{ id, label, content, count?, disabled? }` |
| `label` | `string` | required | The tablist's `aria-label`. |
| `variant` | `'underline' \| 'segmented' \| 'pill'` | `'underline'` | |
| `value` / `defaultValue` | `string` | first enabled item | Controlled or not, never both. |
| `onChange` | `(id: string) => void` | — | |
| `activation` | `'automatic' \| 'manual'` | `'automatic'` | |
| `keepMounted` | `boolean` | `false` | |
| `fullWidth` | `boolean` | `false` | Segmented: the track fills its container. |

A `value` that names no item, or a disabled one, falls back to the first
enabled item rather than showing nothing. `className` lands on the root;
the root is a `div` holding the list and the panel.

## 2. Structure and ARIA

`div.root` > `div[role=tablist][aria-label]` > `button[role=tab]` ×n, then
`div[role=tabpanel]`. Each tab: `id`, `aria-selected`, `aria-controls`,
`tabIndex` 0 or −1, `aria-disabled` when disabled (not `disabled`, so the
label keeps its contrast obligations visible and the tab stays in the
accessibility tree). Each panel: `id`, `aria-labelledby`, `tabIndex={0}`.
Ids come from `useId`. The count is a `span` after the label inside the
button, so the accessible name reads "Participants 12".

## 3. Geometry and paint

| | Underline | Segmented | Pill |
|---|---|---|---|
| Height | 40 (ghost 32) | 32 (segment 28, padding 2, gap 2) | 32 |
| Inline padding | 12, on the ghost | — equal columns | 16; 16 / 4 with a count |
| Gap between tabs | 4 | 2 | 8 |
| Radius | ghost `lg` 8 | track `lg` 8, thumb `md` 6 | `full` |
| Label | 14 / 18 Semibold (`button/md`) | 12 / 16 Semibold (`caption/md`) | 14 / 22 Semibold (`body/md`) |
| Rest | `text/secondary` | `text/secondary` | `surface/sunken`, `text/primary` |
| Selected | `text/primary` + 2px `border/accent` bar | thumb `surface/overlay` + `elevation/sm`, `text/accent` | `surface/inverse`, `text/inverse` |
| Hover, pressed | the washes, on the ghost | the washes, on the segment | the washes over the fill |
| Count | `text/tertiary`, 12 / 16 | — | 24 circle: `surface/base` + `text/secondary`; selected `interactive/selected` + `text/accent` |
| Disabled | `text/disabled`, no wash, `cursor: not-allowed` | same | `interactive/disabled` + `interactive/on-disabled` |

The segmented thumb is one element that **slides**: the columns are equal,
so its place is `translateX(index × (100% + gap))` from a custom property
the component sets — no measuring. It takes `duration/travel` and
`easing/standard`; under reduced motion it jumps. The underline bar and
the pill's fill change in `duration/fade`. A selected pill under the wash
uses the `background-image` gradient the neutral button uses (invariant
21), and so changes instantly where the others fade — accepted there,
accepted here.

The underline and pill lists scroll horizontally when they do not fit
(`overflow-x: auto`, the selected tab scrolled into view on change); the
segmented labels truncate with an ellipsis, and the page says five is the
ceiling.

## 4. Tokens

New: **`elevation/sm`** (light `y 2 · blur 4 · alpha/ink-12`; dark the same
geometry in `alpha/black-32`). No theme token is added. Consumers gained:
`interactive/selected` — whose `use` has said "tab" since it was written —
`surface/inverse` and `text/inverse`, `border/accent`.

Contrast cases added to `contrast.test.ts`, both modes:

- `text/accent` on `interactive/selected` — the selected pill's count.
- `text/inverse` on `surface/inverse` under both washes — the selected
  pill's label while hovered and pressed.
- `text/secondary` on `surface/sunken` under both washes — a segment's
  label; tertiary is already recorded as failing there, which is why the
  segment's label is secondary.
- `border/accent` against `surface/base` and `surface/raised` at 3:1 — the
  bar is the underline tab's non-text indicator (1.4.11).
- `border/default` against `surface/base` in dark at 3:1 — the unselected
  pill's only boundary there.

## 5. Tests

Beside the component, `Tabs.test.tsx`:

- roles, names, `aria-selected`, `aria-controls` ↔ `aria-labelledby`, one
  tab stop; the fallback when `value` names nothing or a disabled item;
- arrows, Home, End, wrapping, skipping disabled, `dir="rtl"` reversing
  the arrows; automatic selects on focus, manual only on Enter and Space;
- controlled and uncontrolled; `onChange` once per change, never for the
  tab already selected;
- only the selected panel mounted; `keepMounted` mounts all, hides the rest;
- the stylesheet, read with `readCss`/`block`: the underline hover paints
  the ghost and not the tab; the ring is on the ghost; the thumb's
  transition is `travel` and is removed under reduced motion; the dark pill
  border is written in both halves (the media query and `data-theme`);
- axe on each variant, and on the docs page through `pages.test.tsx`.

The existing suites then hold it without being asked: no colour literals,
motion tokens only, `box-sizing` declared, every `var(--ap-…)` real,
`'use client'` present.

## 6. The docs page

`/tabs`, in the one-page shape: **Try it** (the three variants over the
same three panels, with the keys to press); **Choosing a variant** —
underline for the sections of a page, segmented for two to five views of
one object inside a card, pill for filtered views of a list where a count
matters — and **tabs or something else** (a Select for more than five, a
link list for routes, a radio group when it holds a value and shows no
panel); **Anatomy** with the drawn numbers and the deviations above;
**States**; **Accessibility** with the key table and the two activation
modes; **Props**. The evidence column carries the measured pairs.
Search aliases ("segmented control", "tab bar") are **not built**: the index has
no alias field yet (the 2026-09-18 survey's item 10). The page says
"segmented" and "pills" in its prose, which the index does read.

## 7. Checked by hand after the build

Both modes, 800 and 320 wide, in the Browser pane: the ghost clears the
bar; the ring clears the bar; the thumb slides and lands square; the
dark track reads by its hairline; a long list scrolls and keeps the
selected tab in view; the count reads on a selected pill.
