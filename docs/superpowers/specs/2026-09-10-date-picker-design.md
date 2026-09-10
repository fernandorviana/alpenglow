# Date picker — design

**Date:** 2026-09-10
**Status:** approved, ready for an implementation plan
**Figma:** page `__ Date Picker` in the source design file (the file key is kept out of this repository)

---

## Why this component

`surface/overlay` — *"Modals, popovers, dropdowns"* — has never been used. It is
one of the four tokens still naming components that do not exist, and it is the
one that costs most, because nothing in the system currently proves that
Alpenglow has a second layer at all. Every component so far is flat against the
page.

The date picker is also the component the token skill already describes as
existing: `border/default` is documented as being used on *"text inputs,
textarea, select, combobox and date picker"*. The drawing has been there since
the beginning. Only the code is missing.

And it is the honest stress test for the system's own claims. Dense, data-heavy
interfaces are made of dates. A calendar grid is where a keyboard contract, a
roving `tabindex`, a live region and a nine-state cell all have to hold at once.

The design exists in Figma and is not being reinterpreted. Where this spec
departs from it, the departure is named and argued with the measurement that
forced it.

---

## What is in scope

Two exported components.

**`Calendar`** — the month grid, controlled, with no overlay of any kind. It
draws one month, carries the grid semantics, and reports intent.

**`DatePicker`** — the existing `Input` as its trigger, plus a dialog holding a
`Calendar`. It owns the open/closed state, the text field's parse and format,
and the focus contract.

Both support a single date and a day range. One month is visible at a time.

**Out of scope:** time of day, multiple months side by side, a month or year
dropdown, presets ("last 7 days"), week or month selection modes, non-Gregorian
calendars, and a general-purpose `Popover`. Each can be added later without
changing the API below.

The `Popover` is the one worth justifying, since it is the piece a library would
extract first. It is deliberately deferred: the overlay mechanics here are about
sixty lines, and a primitive with one consumer is a guess about the second. When
a modal or a dropdown arrives, the mechanics lift out of `DatePicker` unchanged.
Extracting it now would add a third component to the docs site that nobody can
see, against a priority list that asks for a small number of impeccable
components rather than broad coverage.

---

## API

```tsx
/** An ISO 8601 calendar date. No time, no zone. */
export type ISODate = string; // '2026-04-26'

export type DateRange = { start: ISODate; end: ISODate | null };

export type CalendarProps = {
  /** Defaults to 'single'. */
  mode?: 'single' | 'range';

  /** ISODate in single mode, DateRange in range mode. */
  value?: ISODate | DateRange | null;
  onSelect?: (next: ISODate | DateRange | null) => void;

  /** The visible month, as an ISODate whose day is ignored. Uncontrolled if omitted. */
  month?: ISODate;
  defaultMonth?: ISODate;
  onMonthChange?: (next: ISODate) => void;

  /** Inclusive bounds. Days outside them are disabled. */
  min?: ISODate;
  max?: ISODate;
  /** Per-day exclusion — closed days, booked days. Called only for days in the visible month. */
  isDateUnavailable?: (date: ISODate) => boolean;

  /** 0 = Sunday, as drawn. Not derived from the locale — see "the locale lies". */
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /** Drives month and weekday names and the accessible name of every cell. */
  locale?: string;

  /** Required. The grid's accessible name. */
  label: string;
};

export type DatePickerProps = CalendarProps & {
  /** Shares Button's height scale: 32, 40, 48. */
  size?: 'sm' | 'md' | 'lg';
  invalid?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  /** Fires when the text field produces a date the parser rejects. */
  onParseError?: (raw: string) => void;
};
```

`DatePicker` reads `FieldContext` for its id, `aria-describedby`, `required` and
`invalid`, exactly as `Input` and `Select` already do, and explicit props still
win over the wrapper.

### Four choices worth defending

**The value is an ISO string, not a `Date`.** A `Date` constructed at local
midnight moves to the previous day for anyone east of the caller, and the bug
does not reproduce in the timezone it was written in. ISO strings compare
lexicographically, serialise without loss, survive a round trip through JSON,
and are what a server wants anyway. The cost is that consumers convert at the
boundary; the benefit is that the component has no timezone at all. It also
means no date library: `@internationalized/date` is the correct dependency for a
product and the wrong one for a system that has so far shipped with zero runtime
dependencies of its own.

**The text field is free text, not a segmented field, and not `<input
type="date">`.** The convention in this repository is to prefer the native
element — `Select` wraps `<select>` rather than building a listbox — so the
native date input has to be argued away rather than ignored. It is rejected on
three counts: it cannot express a range at all, its picker cannot be themed to
match anything in this system, and its rendering differs enough between browsers
that a design system cannot promise what a user will see. A segmented field
(three focusable units, one per date part) is the stronger pattern and is what
React Aria settled on, because it removes format ambiguity entirely. It is not
what is drawn — the drawing shows one field with an `MM / DD / YYYY` placeholder
— and building it would replace `Input` rather than reuse it. Free text is the
choice, with the ambiguity it creates addressed directly below.

**The parse order follows the locale.** A single text field asking for a date is
ambiguous the moment it leaves one country: `04/05/2026` is two different days
either side of the Atlantic, and neither user is wrong. The field derives its
segment order from `Intl.DateTimeFormat(locale).formatToParts()`, so the
placeholder, the display and the parser all agree, and ISO input is accepted
unconditionally in every locale as an unambiguous escape hatch. Roughly
twenty-five lines, and it is the only honest answer to the problem the drawing's
placeholder creates.

**Selection is controlled, and the visible month is separately controlled.**
They are two different pieces of state and conflating them is what makes range
selection across a month boundary hard to reason about. `Calendar` holds
neither.

### The locale lies

`Intl.Locale#getWeekInfo` exists in the test environment and returns
`{ firstDay: 7 }` for `pt-PT`, where the week starts on Monday. A first day of
week derived from it would be silently wrong for most of Europe, in a way that
looks like a rendering bug rather than a data bug. `weekStartsOn` is therefore an
explicit prop, defaulting to `0` because that is what the drawing shows.

`Intl.DateTimeFormat` itself is used freely — month names, weekday names, the
accessible name of each cell, and `formatRange` for the range announcement, which
is available and produces *"April 26 – 30, 2026"* rather than repeating the year.

---

## What the drawing actually specifies

Read from the bound Figma variables rather than from the picture.

| | Drawn | In code |
|---|---|---|
| Panel width | 296px | unchanged |
| Panel padding | `spacing/100` (8) | unchanged |
| Panel gap | `spacing/050` (4) | unchanged |
| Panel radius | Figma `radius/lg` (12) | code `radius/xl` — names are offset by one step above `sm` |
| Panel shadow | `Drop Shadow/md/Light Mode` | `0 10px 32px -4px #18274B1A, 0 6px 14px -6px #18274B1F` |
| Panel fill | `surface/raised` | **`surface/overlay`** — collision 1 |
| Header height | 40px | unchanged |
| Month label | `paragraph/md/(500) Medium`, `text/primary` | unchanged |
| Year label | `paragraph/md/(400) Regular`, `text/primary` | unchanged |
| Weekday header | `caption/md/All Caps`, `gray-light/900` | `text/tertiary` — collision 4 |
| Day cell | 40 × 40, `caption/md/(500) Medium` | unchanged |
| Day pill | 32 × 32, inset 4px | unchanged, except the range band — see "the band is continuous" |
| Day, this month | `gray-dark/600` | `text/primary` — collision 4 |
| Day, weekend | `text/tertiary` | unchanged |
| Day, outside month | `gray-light/400` | unchanged — see "days outside the month" |
| Today | `brand-1/100` pill, `text/accent` label, 4px dot | `interactive/selected` pill — collision 4 |
| Selected | `interactive/accent` pill, `text/inverse` label | `interactive/on-accent` label — collision 4 |
| Hover | `surface/sunken` pill | **`interactive/neutral-hover`** — collision 2 |
| Focus | 2px `gray-dark/500` ring, inside | **`border/focus`, outside, at the system's 2px offset** — collision 3 |
| Disabled | pale grey label | `text/disabled` |
| Range start / middle / end | `interactive/accent` fill, `text/inverse` label, outer edges rounded | `interactive/on-accent` label |
| Month pagination | 32px circle `surface/base`, chevron `gray-dark/300` 1.5px | `interactive/neutral` fill, `interactive/on-neutral` chevron — collision 4 |
| Trigger, md | 48px tall | code `lg` |
| Trigger, sm | 40px tall | code `md` |
| Trigger fill | `surface/base` | `control.module.css` as it stands — not re-litigated here |

The trigger heights repeat a remapping the system has already made once: the
drawn `md` field is 48 and the drawn `md` button is 40, so the two never lined
up. `Input` resolved this by taking the two drawn heights as `md` and `lg` and
adding a compact `sm`. `DatePicker` inherits that decision by inheriting `Input`,
and does not restate it.

---

### Collision 1 — the panel is `surface/overlay`, not `surface/raised`

The drawing paints the panel `surface/raised`. In light both tokens resolve to
white, so the drawing cannot tell them apart and picking either looks identical.
In dark they diverge on purpose: `raised` is `gray-dark/700`, `overlay` is
`gray-dark/600`, because shadows stop reading as elevation and the overlay has to
carry its own step. A popover painted `raised` would sit at the same value as
the card it floats over.

What this does not fix, and what gets recorded rather than corrected: in light, a
panel over a card measures **1.00:1**, and over the app canvas **1.06:1**. Only
the shadow separates them. This is invariant 1 of the system working as
designed, not a defect — but a hairline does not rescue it either.
`border/subtle` against the panel is **1.16:1** and `border/default` against a
card is **1.40:1**. Neither is a boundary. The shadow is the boundary in light,
and the colour step is the boundary in dark.

### Collision 2 — one hover value in light, opposite directions in dark

The drawing paints the day hover `surface/sunken`. In light that is `#EBEEF1`,
byte-identical to `interactive/neutral-hover`, so again the drawing cannot
distinguish them. In dark they move opposite ways against the `#2F303D` panel:
`surface/sunken` resolves to `#10111A`, *darker* than the panel, while
`interactive/neutral-hover` resolves to `#414452`, *lighter*.

A hover that darkens a raised surface reads as a hole rather than a highlight.
`interactive/neutral-hover` is the correct token, it costs nothing in light, and
it is the token whose `use` string already says *"Secondary hover, row hover"*.

The same reasoning applies to the month pagination button, whose drawn fill
`surface/base` is byte-identical to `interactive/neutral` in light and moves the
wrong way in dark. It becomes a small neutral button:
`interactive/neutral` at rest, `interactive/neutral-hover` on hover,
`interactive/on-neutral` for the chevron.

### Collision 3 — the focus ring cannot be drawn inside the selected fill

The drawing gives the focused day a 2px `gray-dark/500` ring inside the cell.
That is a recoloured focus indicator, which the system forbids: `border/focus` is
the only focus token, and focus adds geometry rather than changing colour.

But the drawing has a reason. `border/focus` resolves to the same value as
`interactive/accent`, so an accent ring drawn *on* a selected day measures
**1.00:1** in light and **1.51:1** in dark — an invisible focus indicator on
exactly the cell most likely to be focused when the panel opens.

The system already has the answer and the drawing did not use it. `focusRingOffset`
is 2: the ring is drawn *outside* the control, where it sits on the panel rather
than on the fill. There it measures **5.59:1** in light and **4.72:1** in dark,
against a 3:1 requirement, and it stays `border/focus` in every state. In a 40px
cell around a 32px pill the ring lands at 36px and does not clip.

### Collision 4 — seven drawn values are raw primitives

`gray-light/900`, `gray-dark/600`, `gray-light/400`, `brand-1/100`,
`gray-dark/500`, `gray-dark/300` and `text/inverse` appear bound directly, with
no semantic token between them and the component. This is the same gap the rest
of the file has: the source had Paint Styles and no semantic layer.

Three of the substitutions are not cosmetic — they change a failing measurement
into a passing one:

- The weekday header at `gray-light/900` measures **3.98:1**. `text/tertiary`
  measures **5.74 / 5.69**.
- Today's `brand-1/100` pill under an accent label measures **4.18:1**.
  `interactive/selected` measures **4.93 / 5.00**.
- `text/inverse` is *"Text on surface/inverse"* — a different token from
  *"Label on accent"*, which is `interactive/on-accent`. In light they are both
  white and it makes no difference. In dark, `text/inverse` is `gray-dark/900`
  and `interactive/on-accent` is `gray-dark/900` — they agree today, but they
  agree by coincidence, and only one of them is the token that means what this
  label means.

---

## Days outside the month

The days spilling in from the previous and next month are **inert**: rendered,
not focusable, not clickable, outside the roving `tabindex`, and their content is
`aria-hidden` so a screen reader in browse mode is not read a run of ambiguous
bare numbers belonging to a month it was not told about. The `<td
role="gridcell">` stays in place so the grid's geometry is intact.

This is what makes their contrast defensible. At `gray-light/400` they measure
**1.65:1**, which no text may do — but a thing that cannot be focused, clicked or
reached is decoration, and 1.4.3 exempts it. Making them interactive would
require `text/tertiary` at **5.74 / 5.69**, at which point they stop reading as
outside the month at all and the grid loses its boundary.

Nothing is lost by making them inert, because they are not how the keyboard or
the pointer crosses a month. `→` on the last day of the month moves to the first
of the next and re-renders the grid there, as the APG pattern specifies. The
authoritative, interactive copy of every spilled day is one month away.

### The band is continuous, including across the boundary

An inert day still takes the range fill when it falls inside the range. This is
the case the rule exists for: with May visible, the cells spilled in at the top
are 28, 29 and 30 April, and those days are inside a range that started in April.
If inert meant unpainted, the band would break at precisely the boundary the user
most needs to see whole. Painted, it measures **5.59 / 4.50** for the label on the
band — the contrast question disappears the moment the day is in the range.

The band is also continuous *within* a week. The drawing's range middle is a
32px square in a 40px cell, which would leave 8px of panel between consecutive
days and read as loose squares rather than a period. In code the range fill spans
the full 40px cell; the start's leading edge and the end's trailing edge keep the
drawn 16px radius, and the endpoints keep their 32px pill drawn on top. This is
the one purely visual departure from the drawing in this spec, and it was agreed
before it was written.

---

## Semantics

The APG *Date Picker Dialog* pattern, followed rather than approximated.

- The trigger is the `Input`, with a `button` carrying the calendar icon and an
  `aria-label` of *"Choose date"*, becoming *"Change date, {formatted}"* once a
  value exists.
- The panel is `role="dialog" aria-modal="true"` with an accessible name.
- The grid is a `<table role="grid">`, `aria-labelledby` the month heading.
- Exactly one `gridcell` is tabbable; the rest carry `tabindex="-1"`.
- The selected day carries `aria-selected="true"`. In range mode the start and
  end carry it; days between carry `aria-selected="true"` as well, since they are
  part of the selection. Spilled days do not, even when painted with the band —
  they announce nothing at all, and the range they belong to is announced by the
  live region and by their interactive copy in the adjacent month.
- Every day cell in the visible month has an accessible name that is the full
  localised date including the weekday, so a screen reader moving cell to cell
  never loses which day of the week it is on.
- The weekday header letters are `aria-hidden`. Two of the seven are `S` and two
  are `T`; they disambiguate nothing, and the weekday is already in each cell's
  name.
- The month and year heading is `aria-live="polite"`, so paging announces itself.
- A separate `polite` region announces the selection, built with
  `Intl.DateTimeFormat#formatRange` in range mode.
- Unavailable days carry `aria-disabled="true"` and stay focusable, so a keyboard
  user can discover why they cannot be picked rather than having them silently
  skipped.

Focus goes to the selected day on open, or to today, or to the first day of the
visible month, in that order. `Esc` closes and returns focus to the field.

---

## Keyboard

| Key | Result |
|---|---|
| `←` `→` `↑` `↓` | Move one day or one week, rolling into the adjacent month |
| `Home` / `End` | First / last day of the focused week |
| `Page Up` / `Page Down` | Previous / next month |
| `Shift + Page Up` / `Page Down` | Previous / next year |
| `Enter` / `Space` | Select the focused day |
| `Esc` | Close, return focus to the field. In range mode with a pending start, cancel the pending start first |
| `Tab` | Cycles within the dialog and wraps |

In range mode the second click, or the second `Enter`, closes the panel. The
first does not. If the end lands before the start they swap, silently — the user
has expressed an interval, not an order.

---

## The popover, and why not the native API

The panel is `position: absolute` inside a `position: relative` wrapper, flipping
above the field when the viewport has no room below, measured once on open. It
dismisses on `Esc`, on a pointer press outside, and on focus leaving the
subtree.

The native `popover` attribute is the better mechanism on paper — it puts the
panel in the top layer, which solves clipping and stacking without a line of JS.
It is rejected on a measurement rather than a preference: the test environment
(jsdom 30) implements neither `popover`, nor `showPopover`, nor `inert`. Building
on it would put the entire open, close, dismiss and focus-return contract outside
the reach of the suite, in a repository whose Button tests read the stylesheet
source to prove an invariant. A component that cannot be tested is not this
system's idea of a finished component.

The known cost is written down rather than hidden: an ancestor with
`overflow: hidden` will clip the panel. When a `Popover` primitive is eventually
extracted, moving to the top layer is the first thing it should do.

---

## Contrast obligations

Every pair below is asserted in `contrast.test.ts`, in both modes, against the
threshold named.

| Pair | Light | Dark | Needs |
|---|---|---|---|
| Day label on the panel | 11.26 | 12.24 | 4.5 |
| Weekend label on the panel | 5.74 | 5.69 | 4.5 |
| Weekday header on the panel | 5.74 | 5.69 | 4.5 |
| Today's label on today's pill | 4.93 | 5.00 | 4.5 |
| Selected label on the accent pill | 5.59 | 4.50 | 4.5 |
| Range label on the band | 5.59 | 4.50 | 4.5 |
| The band against the panel | 5.59 | 3.12 | 3.0 |
| Focus ring against the panel | 5.59 | 4.72 | 3.0 |
| Today's dot against the panel | 5.59 | 3.12 | 3.0 |
| Pagination chevron on its resting fill | 10.58 | 10.58 | 4.5 |
| Pagination chevron on its hover fill | 9.67 | 9.08 | 4.5 |

Two are recorded as measured and *not* asserted, because they are exempt rather
than passing:

- Disabled and unavailable day labels, `text/disabled`, **2.77 / 2.66**. WCAG
  exempts inactive controls, and the system already carries this token with that
  note attached.
- Days outside the month, **1.65:1** in light. Exempt because inert — see above.

And one is recorded as a known gap, matching how the input's resting border is
already recorded: the panel's edge against a card in light is **1.00:1**, carried
by the shadow alone.

---

## Three states the drawing does not cover

**Today, when today is also selected.** The drawn today marker is an accent dot
below the number. On a selected day the pill is already accent, so an accent dot
measures 1.00:1 against it and vanishes. The dot switches to
`interactive/on-accent` whenever its day is selected or inside the range.

**Reduced motion.** The panel's open transition is dropped entirely under
`prefers-reduced-motion: reduce`. Unlike the Loader, there is nothing here that
reads as a hung page when it stops — a panel either is or is not on screen. The
Loader's rule (slow it, do not freeze it) does not generalise, and the difference
is worth a comment in the stylesheet so the next reader does not "fix" one to
match the other.

**A field whose text does not parse.** Typing is not validated on every
keystroke; the parse runs on blur and on `Enter`. A string the parser rejects
leaves the previous value intact, sets `aria-invalid`, and calls `onParseError`.
It does not clear the field — a user who typed something has more information
about their intent than the parser does.

---

## Testing

Following the pattern `Button.test.tsx` established: assert the invariant, not
the appearance, and read the stylesheet source where the invariant lives in CSS.

- **`date.ts` unit tests, no DOM.** The pure helpers are where the real bugs
  live: the grid for a month starting on each of the seven weekdays, February in
  a leap year, rolling `→` off 31 December, a range whose end precedes its start,
  clamping to `min` and `max`.
- **Grid semantics.** One tabbable cell and only one; `aria-selected` on the
  right cells and no others; each cell's accessible name carrying the weekday;
  spilled days absent from the tab order.
- **Keyboard.** Every row of the table above, including the two that cross a
  month boundary and re-render the grid.
- **Range across the boundary.** Start in April, page to May, end on the 3rd, and
  assert that the spilled April days in May's grid carry the band class. This is
  the behaviour the whole "inert but painted" rule exists for, so it gets a test
  of its own.
- **Stylesheet source.** Assert that the range band spans the full cell and not
  the 32px pill, and that the focus ring is drawn at an offset rather than inset.
  Both are one careless edit away from silently reverting to the drawing.
- **Focus contract.** Focus on open lands on selected, else today, else the first
  of the month; `Esc` returns it to the field.
- **`contrast.test.ts`.** The eleven asserted pairs above.

---

## Files

| File | Responsibility |
|---|---|
| `src/components/Calendar/date.ts` | Pure civil-date helpers. No `Date` in the exported surface. |
| `src/components/Calendar/Calendar.tsx` | The grid, its semantics and its keyboard. |
| `src/components/Calendar/Calendar.module.css` | Cell states, the range band, the focus ring. |
| `src/components/Calendar/Calendar.test.tsx` | Helper unit tests, grid semantics, keyboard, stylesheet source. |
| `src/components/Calendar/index.ts` | Public surface of the folder. |
| `src/components/DatePicker/DatePicker.tsx` | Trigger, dialog, parse and format. |
| `src/components/DatePicker/DatePicker.module.css` | The panel and its placement. |
| `src/components/DatePicker/DatePicker.test.tsx` | Open/close, focus contract, parse, Field wiring. |
| `src/components/DatePicker/index.ts` | Public surface of the folder. |
| `src/index.ts` | Library exports. |
| `src/tokens/theme.ts` | Nothing to change — `surface/overlay`'s `use` string is already correct, and this component is what makes it true. |
| `src/tokens/contrast.test.ts` | The eleven pairs. |
| `app/date-picker/page.tsx` | Docs page. |
| `app/ui/Nav.tsx` | Nav entry. |
| `MEMORY.md` | Remove `surface/overlay` from the unclaimed list; record the inert-but-painted rule and the continuous band as named deviations. |

---

## What this leaves for later

The two things a reader might expect and will not find, so that neither reads as
an oversight:

**A `Popover` primitive**, for the reason argued in scope. When it arrives it
takes the top layer with it and this component loses its clipping caveat.

**Sizing that composes.** `DatePicker` takes `sm | md | lg` because `Input`
does; `Calendar` takes no size at all, and its cells are fixed at 40px. That is
consistent with the existing split — `Checkbox`, `Radio` and `Switch` take no
size either — and inconsistent with where the system should end up. It belongs
to the open item that names all of them at once, not to this component alone.
