# Date picker — input mask design

**Date:** 2026-09-10
**Status:** design approved section by section; awaiting spec review
**Amends:** `2026-09-10-date-picker-design.md`:
- §"Four choices worth defending": the text field is free text
- §"A field whose text does not parse"
- the `onParseError` prop in §API
- the placeholder in §"What the drawing actually specifies"

**Supersedes:** the Task 9 ruling "range mode keeps the field read-only".

---

## Why

The DatePicker's text field accepts any characters. It parses them only on blur
or Enter, and all it can report is that the text did not parse.

The user asked for the field to constrain and frame what is typed. In
`DD/MM/YYYY`, typing `12022025` should produce `12/02/2025` as the digits
arrive, and errors should be checked — "copy the best practices".

## Decisions

All five were made by the user on 2026-09-10, choosing the recommended option
each time:

| | Decision |
|---|---|
| Shape | **One masked field**, not a segmented spinbutton field. It keeps `Input` and the drawn single field. |
| Format | **Compact, with the locale's own separator**: `12/02/2025` in pt-PT, `02/12/2025` in en-US, `12.02.2025` in de-DE. The placeholder follows. |
| Range | **Typeable**: up to 16 digits, with ` – ` inserted after the first date. A reversed pair swaps, as it does in the calendar. |
| Impossible digits | **Prevent and complete.** A first digit that cannot start its segment gains a leading zero. An impossible second digit is refused. A complete date that does not exist, or that the picker refuses, is flagged but never blocked. |
| Errors | **The component gives a reason, the Field shows the message.** `onInvalid(raw, reason)` replaces `onParseError`, and the caller writes the sentence into `Field`'s `error`. |

## What was copied, and from where

- **GOV.UK date input.**
  - `inputmode="numeric"`.
  - Error priority: missing, then impossible, then everything else.
  - Messages of the form *"… must be a real date"*.
  - Not copied: its three separate fields, which the drawing does not show.
  - Not copied: its acceptance of month names. See §Left for later.
- **React Aria `DateField`.**
  - Impossible segment values are prevented rather than reported.
  - Order and separator are driven by the locale.
  - Bounds and unavailable days make the field invalid rather than being silently clamped.
- **Estelle Weyl, accessible input masking.**
  - The value holds only what was typed, and separators are added by script.
  - A visible shell shows the format still to type.
  - Deletion and caret movement are never blocked.
  - The pattern is described to screen readers.
- **General mask practice.**
  - The formatted string is rebuilt from the digits on every input, rather than
    by intercepting keys. Only this survives paste, autofill, IME composition,
    and Android keyboards, where `keydown` arrives as `Unidentified`.

---

## The engine — `src/components/DatePicker/mask.ts`

Pure functions, no DOM, unit-tested the way `date.ts` is.

### `dateShape(locale)`

Returns `{ order: Segment[], separator: string }`. It is read from
`dateFormat(locale, { year: 'numeric', month: '2-digit', day: '2-digit',
calendar: 'gregory', numberingSystem: 'latn' }).formatToParts(…)`.

- **The literal is cleaned** of whitespace and of bidi controls (U+200E, U+200F,
  U+061C). Measured in Node's ICU:

  | Locale(s) | Separator |
  |---|---|
  | en-US, en-GB, pt-PT, fr-FR, ja-JP, zh-CN | `/` |
  | de-DE | `.` |
  | nl-NL | `-` |
  | ko-KR and hu-HU (literal `. `, which cleans to `.`) | `.` |
  | ar-EG (literal carries U+200F before `/`) | `/` |
  | anything that yields no literal at all | `/` |
- **A trailing literal is ignored.** For ko-KR and hu-HU the field formats
  `2026.04.26`, not `2026.04.26.`.
- **`calendar` and `numberingSystem` are pinned.** fa-IR otherwise formats in
  the Persian calendar (`1405/02/06`) and ar-EG in Arabic-Indic digits.
  Non-Gregorian calendars are out of scope for the component, and a separator
  must not be read from one.

`formatTyped` and `placeholderFor` in `date.ts` switch from `' / '` to this
separator. `parseTyped` is deleted; `readValue` below replaces it.

### Input digits

The mask reads ASCII `0–9`. Before masking, it also normalises three other
digit ranges to ASCII:

- fullwidth (U+FF10–FF19), which a Japanese IME produces;
- Arabic-Indic (U+0660–0669);
- Extended Arabic-Indic (U+06F0–06F9).

Everything else is dropped.

### `applyMask(digits, shape, mode)`

Returns `{ digits, text }`. `digits` is what was accepted, including any zeros
the mask added, and `text` is the formatted string.

Segments fill in `shape.order`: day and month take two digits, and the year
takes four. Each digit is checked against the segment it would land in:

| Segment | Position | Digits | Result |
|---|---|---|---|
| Day | 1st | `0`–`3` | accepted |
| Day | 1st | `4`–`9` | becomes `0` + digit, and the segment is complete |
| Day | 2nd | after `0`: `1`–`9`; after `1`/`2`: `0`–`9`; after `3`: `0`–`1` | accepted |
| Day | 2nd | anything else (`00`, `32`–`39`) | refused |
| Month | 1st | `0`–`1` | accepted |
| Month | 1st | `2`–`9` | becomes `0` + digit, and the segment is complete |
| Month | 2nd | after `0`: `1`–`9`; after `1`: `0`–`2` | accepted |
| Month | 2nd | anything else (`00`, `13`–`19`) | refused |
| Year | 1st | `0` | refused |
| Year | any other | any digit | accepted |

- **Why a year cannot start with `0`.** Years run 1000–9999. `Date.UTC`
  reads years 0–99 as 1900–1999, so `daysInMonth` would answer for the wrong
  century.
- **Why the day's limit is 31 in every month.** In day-first orders the month
  is not known yet. Whether that day exists in that month is decided at
  evaluation (`not-a-date`), not by the mask.
Insertions and deletions are treated differently. Without that, an edit in
the middle of a date could throw away the digits after it, or trap Backspace.

- **An insertion is checked.** An insertion is any event that adds digits:
  typing, pasting, or replacing a selection.
  - Only the inserted digits are checked, each against the segment it lands in
    once the digits re-flow.
  - Padding applies only to an inserted digit.
  - If any inserted digit is refused, or the event would exceed the digit
    limit, the whole event is rejected. The text and the caret stay as they
    were.
  - For example, a paste of `13022025` into an empty en-US field inserts
    nothing, rather than keeping `1` and shifting the rest into the wrong
    segments. Typing into a full field does nothing, as `maxLength` would.
- **A deletion is never refused.** A deletion is any event that only removes
  digits.
  - The remaining digits re-flow into the segments unchecked, with no padding.
  - Deleting the `2` of `12/02/2025` gives `10/22/025`. Nothing is silently
    lost, and evaluation reports what is wrong: `incomplete` on blur, or
    `not-a-date` once the digits are complete again.
- **Separators.** A separator is appended as soon as a segment completes and
  another follows (`12` → `12/`). In range mode, ` – ` (U+2013 between two
  U+0020) follows the eighth accepted digit. That string is fixed, not taken
  from `formatRange`, whose spacing depends on the ICU build (see invariant 17).
- **Digit limits.** Single mode accepts at most 8 digits; range mode at most 16.

### `caretIndex(text, n)`

Returns the index just after the n-th digit in `text`, or 0 when `n` is 0. If
a separator follows that digit, the caret goes after the separator, so typing
continues past it.

### ISO that arrives whole

Before digits are extracted, every `YYYY-MM-DD` match in the new raw value is
replaced with its digits in `shape.order`. This covers a paste, autofill and
drag-and-drop of `2025-02-12`, or of `2025-02-12/2025-02-20` in range mode.

**Recorded deviation.** The original spec accepted ISO "in every locale". It is
still accepted when it arrives whole. Typed key by key it is not: in a
day-first order the first two digits are already a day. Supporting both would
mean guessing intent from the first keystroke.

### `readValue(digits, shape, mode, { min, max, isDateUnavailable })`

Returns `{ value }` (an `ISODate`, or a complete `DateRange`) or `{ reason }`.
The first reason that applies wins:

1. `incomplete`: fewer than 8 digits (16 in range mode).
2. `not-a-date`: every digit is present, but the month is outside 01–12, the
   day is outside 01–31, or the day does not exist in that month. Examples:
   `31/02`, `29/02/2025`, and `10/22/2025` left by a deletion.
3. `before-min` / `after-max`.
4. `unavailable`: `isDateUnavailable` returns true.

In range mode the start is checked, then the end, and the first reason found is
returned. A pair whose end precedes its start is ordered with `orderRange`.
That is not an error.

---

## The field

It is still the `control.module.css` input, with these attributes:

- `type="text"` and `inputMode="numeric"`.
- `autoComplete="off"`: the browser's autofill does not know this mask.
- No `maxLength` and no `pattern`. The mask is the limit, and only it knows
  where padding and separators go.

### On every `onChange`

1. Count the digits before `selectionStart` in the new value.
2. Replace any whole ISO dates, then extract and normalise the digits.
3. Handle a deleted separator. If `nativeEvent.inputType` is
   `deleteContentBackward` and the digits are unchanged while the text got
   shorter, a separator was deleted. Remove the digit before it.
   `deleteContentForward` removes the digit after it. Without this rule the
   mask would put the separator straight back and the key would do nothing.
4. `applyMask`. Set the text, and restore the caret with `caretIndex` in a
   layout effect.

During IME composition (`compositionstart` to `compositionend`) the value is
not rewritten. The mask runs once, on `compositionend`.

### The shell

An `aria-hidden` layer sits behind the text, with the same font, size, tracking
and padding as the field. It holds two parts:

- **the typed text**, in a transparent span that only reserves width, so the
  rest starts exactly where the input's text ends;
- **the remainder of the format**, in `text/placeholder`.

Examples:

| Typed | The shell reads |
|---|---|
| `12/0` | `12/0M/YYYY` |
| (nothing) | the whole format |

- **It replaces the native `placeholder`** while the field is editable.
- **It is not rendered when the input is scrolled** (`scrollWidth >
  clientWidth`), so it can never sit misaligned.
- **Contrast.** It uses `text/placeholder` exactly as `Input`'s placeholder
  does, so it inherits the measured values that `contrast.test.ts` already
  records for that token. There is no new obligation.
- **`readOnly` and `disabled`.** The mask does not run and the shell is not
  rendered. The field shows the formatted value, or the native placeholder when
  there is no value.

**The letters** are English: `DD`, `MM`, `YYYY`, in the locale's order, with
the locale's separator. The component's other strings ("Choose date") are
English too. Making all of them translatable is one follow-up, not this one.

### The screen-reader hint

A visually hidden element is added to `aria-describedby`, after the Field's own
ids or the explicit `aria-describedby` prop. It names the parts in words,
because a screen reader reads `DD/MM/YYYY` letter by letter:

> Type digits only, as day, month, year. Separators are added for you.

- The three words follow `shape.order`.
- Range mode appends: *"Then the end date the same way."*
- **A refused digit is silent**, as in React Aria. Announcing each refusal
  would talk over the screen reader's own echo of the key. The hint states the
  rule up front instead.

---

## When it evaluates, and what it emits

The field evaluates at only three moments:

- a change that leaves the full digit count (8, or 16 in range mode), whether
  from the last keystroke, a paste, or a mid-string edit;
- blur;
- Enter.

Between those moments nothing is evaluated. Half a date is unfinished, not
wrong.

**Evaluation runs only when a draft exists**, meaning the text differs from the
formatted current value. Tabbing through a field without typing calls nothing.

**Each evaluation ends in exactly one call:**

| Outcome | Call |
|---|---|
| A valid date or range | `onSelect(value)`, immediately, without waiting for blur. It is called even when the value equals the current one, so a caller's error message clears. |
| The text is empty, on blur or Enter | `onSelect(null)` |
| Anything else | `onInvalid(raw, reason)`, with `aria-invalid="true"` held until the next evaluation |

A caller therefore clears its message in `onSelect` and writes it in
`onInvalid`, and needs nothing else.

`incomplete` is only ever reported on blur or Enter. A change that reaches the
full digit count is complete by definition.

**Refused text is not cleared.** The field keeps what was typed, and the
previous value stays intact.

**A value change from outside discards the draft.** That covers a calendar
pick and a parent updating `value`, and it closes deferred minor 224. When the
change came from this field's own emission, the formatted text equals what was
typed, so the caret does not move.

## Range mode

- **Typing.** Up to 16 digits, with ` – ` inserted after the eighth.
- **Deleting.** A Backspace just after ` – ` removes the eighth digit, as with
  any separator.
- **Evaluation.** Nothing is evaluated at 8 digits. A start with no end
  reports `incomplete` on blur.
- **Clearing.** An empty field on blur emits `onSelect(null)`. The read-only
  range field is gone, and with it the review's three minors: a range could not
  be cleared, the `readOnly` class was missing, and `required` was ignored.

## API

```tsx
export type DatePickerInvalidReason =
  | 'incomplete'
  | 'not-a-date'
  | 'before-min'
  | 'after-max'
  | 'unavailable';

export type DatePickerProps = CalendarProps & {
  size?: 'sm' | 'md' | 'lg';
  invalid?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  id?: string;
  /** Submitted through a hidden input as ISO: a date, or `start/end` in range mode. */
  name?: string;
  required?: boolean;
  /** Wins over Field's; the mask hint's id is appended after it. */
  'aria-describedby'?: string;
  /** Fires when an evaluation finds the typed text is not a date this picker accepts. */
  onInvalid?: (raw: string, reason: DatePickerInvalidReason) => void;
};
```

- `onParseError` is removed. The branch is unreleased, so nothing depends on it.
- `DatePickerInvalidReason` is exported from `src/index.ts`.

---

## Docs page

"Typing a date" is rewritten around three things.

**A specimen in a `Field`** whose `error` is set from `onInvalid` and cleared in
`onSelect`. It has `min`, `max` and a weekday rule, so every reason can be
reached.

**A table from reason to example message**, GOV.UK style. The caller knows the
field's name and why a day is unavailable:

| Reason | Message |
|---|---|
| `incomplete` | Appointment date must include a day, month and year |
| `not-a-date` | Appointment date must be a real date |
| `before-min` | Appointment date must be on or after April 3, 2023 |
| `after-max` | Appointment date must be on or before April 24, 2023 |
| `unavailable` | Appointment date must be a weekday |

**Three fields side by side**, in en-US, pt-PT and de-DE, showing the order and
separator change.

Also:
- The props table gains `onInvalid` and the reason union, and loses
  `onParseError`.
- The range read-only paragraph goes.
- Nothing on the page claims a by-hand check.

## Testing

**`mask.ts`, as tables:**
- `dateShape` for en-US, pt-PT, de-DE, nl-NL, ko-KR, ja-JP and ar-EG;
- every row of the digit table;
- the year starting with `0`;
- normalising fullwidth and Arabic-Indic digits;
- 16-digit range mode and the ` – `;
- `caretIndex` around separators;
- ISO arriving whole, in both modes;
- `readValue` reason priority, with 29 February in 2024 and 2025, and a
  reversed range.

**DatePicker, with user-event:**
- in pt-PT, `12022025` gives `12/02/2025` and exactly one `onSelect('2025-02-12')`;
- `4` gives `04/`, and a month of `13` is refused while the caret stays;
- a paste of `13022025` into an empty en-US field inserts nothing, and typing
  into a full field does nothing;
- deleting the `2` of `12/02/2025` gives `10/22/025` and is never refused;
- a mid-string edit via `setSelectionRange`;
- Backspace just after `/` and just after ` – `;
- blur at `12/0` gives `onInvalid('12/0', 'incomplete')`;
- a typed reversed range emits the ordered range;
- `31/02/2025` gives `not-a-date` immediately at the eighth digit;
- a parent value change discards the draft;
- tabbing through without typing calls nothing;
- the hint's id is in `aria-describedby` alongside Field's ids;
- the shell is `aria-hidden` and absent under `readOnly`;
- `readOnly` does not mask;
- no `onParseError` remains anywhere in the source.

**Stylesheet source:** the shell uses `--ap-color-text-placeholder` and no
primitives.

**The existing tests.** The "typed dates" tests in `Calendar.test.tsx` that
cover `parseTyped` move into the `mask.ts` tests, rewritten against
`readValue`. `formatTyped` and `placeholderFor` are asserted with the compact
locale separator.

## Files

| File | Change |
|---|---|
| `src/components/DatePicker/mask.ts` | New: `dateShape`, `applyMask`, `caretIndex`, `readValue`, digit normalisation, ISO replacement. |
| `src/components/DatePicker/mask.test.ts` | New. |
| `src/components/Calendar/date.ts` | `formatTyped` / `placeholderFor` use the locale separator; `parseTyped` deleted. |
| `src/components/DatePicker/DatePicker.tsx` | The masked field, caret, composition, evaluation, `onInvalid`, the shell, the hint. |
| `src/components/DatePicker/DatePicker.module.css` | The shell. |
| `src/components/DatePicker/DatePicker.test.tsx` | The tests above; `onParseError` tests rewritten. |
| `src/components/Calendar/Calendar.test.tsx` | The typed-date tests move out. |
| `src/index.ts` | Export `DatePickerInvalidReason`. |
| `app/date-picker/page.tsx` | "Typing a date" rewritten; props table. |
| `docs/superpowers/specs/2026-09-10-date-picker-design.md` | Pointers from the amended sections to this document. |
| `MEMORY.md` | The invariant below, and the counts. |

## Invariant to record

**The mask rebuilds from digits and never intercepts keys.** Handling
`keydown` looks like a simplification and would break paste, autofill, IME and
Android input. Three rules make the rebuild behave like typing:

- the deleted-separator rule;
- the caret-by-digit-count rule;
- the asymmetry: an insertion is checked and rejected whole, a deletion is
  never refused.

Making deletions checked "for consistency" traps Backspace.

## Deviations recorded

- **Placeholder.** Drawn `MM / DD / YYYY`; in code `DD/MM/YYYY` or
  `MM/DD/YYYY`, compact, in the locale's order and with its separator.
- **ISO.** Accepted when it arrives whole, not key by key.

## Left for later

- **Translatable strings:** segment letters, the hint, "Choose date".
- **Month names typed as words** ("12 Feb 2025"), which GOV.UK accepts. A
  numeric mask cannot hold them.
- **Two-digit years.** Still rejected, consistent with reject-don't-roll-over
  (deferred 225).
