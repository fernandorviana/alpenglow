# Date picker input mask Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the DatePicker's free-text field into a masked field.
- Digits are framed as they are typed, in the locale's order and with the locale's separator.
- Impossible digits are refused.
- Complete dates are checked, and the reason is reported through `onInvalid`.

**Architecture:**
- **`mask.ts` (new, pure).** A module in the DatePicker folder with no DOM. It holds everything about typed dates:
  - the locale's shape;
  - digit normalisation;
  - the mask;
  - caret mapping;
  - formatting;
  - reading a value with a reason.
- **`DatePicker.tsx` rebuilds from digits.** On every edit it rebuilds the field text from the digits and puts the caret back by digit count. It evaluates only in three cases:
  - when a complete date is in;
  - on blur;
  - on Enter.
- **A shell and a hint.** An `aria-hidden` shell draws the rest of the format behind the text. A screen-reader hint describes the mask in words.

**Tech Stack:**
- React 19, TypeScript (strict, lib ES2022 + DOM), CSS Modules.
- Tests: Vitest 5, jsdom, @testing-library/react, @testing-library/user-event 14.6.7.
- Docs page: Next.js 16 App Router.

**Spec:** `docs/superpowers/specs/2026-09-10-date-picker-input-mask-design.md` (commit `637e6c1`). It amends `docs/superpowers/specs/2026-09-10-date-picker-design.md`.

**Verified before writing:**
- `mask.ts` below was run against the real `date.ts` for every case the spec lists.
- A throwaway jsdom + user-event spike of the field logic in Task 3 passed 10/10, with `tsc` clean. It covered:
  - controlled reformatting;
  - caret placement in a microtask;
  - refusal keeping the caret;
  - whole-paste rejection;
  - ISO paste;
  - mid-string Backspace;
  - Backspace after `/` and after ` – `;
  - insertion into a full field;
  - IME composition.

## Global Constraints

- **Where to work.** Work only in `/Users/fernandoviana/DEV/alpenglow/.claude/worktrees/date-picker`, on branch `date-picker`.
  - Never `cd` to, run git in, or edit `/Users/fernandoviana/DEV/alpenglow`: another branch, another session.
  - Never use bare `git stash`.
- **No dev servers, no browser tools, no edits to `.claude/launch.json`.**
- **Generated styles.** Never hand-edit `src/styles/tokens.css` or `src/styles/tailwind-theme.css`. This plan adds no token.
- **No colour literals in component CSS.** Every colour is `var(--ap-*)`, and no primitives are used.
- **`Date` and `new Intl.` stay in `src/components/Calendar/date.ts`.** Nowhere else (except the docs page's `isWeekend`, which already exists). Formatters come from `dateFormat`. This also means that neither `DatePicker.tsx` nor `mask.ts` contains the text `Date.`, in code or in comments.
- **The original product's and design file's names never appear** anywhere in the repository.
- **Component strings are English.** That covers "Choose date", the segment letters `DD`/`MM`/`YYYY` and the hint. Order and separator come from the locale.
- **The range separator is exactly `' – '`**: U+0020, U+2013, U+0020. It is fixed, not taken from `formatRange`.
- **Test names are sentences that state the decision**, and comments say why.
- **TDD.** Write the test, run it and watch it fail, implement, then run it and watch it pass.
- **Gate.** Run `npm run check` (tsc, then the full suite) before every commit.
- **Commits.** Stage explicit paths only; never `.env.local`, `CLAUDE.md` or `AGENTS.md`.
  - The message is one imperative sentence saying what changed and why, with no prefix.
  - The message ends with this trailer:

```
Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
```

- **Next.js 16 has breaking changes.** Before changing anything in `app/` beyond JSX content and constants, read the relevant guide under `node_modules/next/dist/docs/`.

## Deviations from the spec (rulings, recorded in the SDD ledger)

1. **The typed-date helpers leave `date.ts` entirely.**
   - `Segment`, `dateShape`, `placeholderFor`, the formatting and the reading all live in `mask.ts`.
   - `segmentOrder`, `placeholderFor`, `formatTyped` and `parseTyped` are deleted from `date.ts`, which keeps civil arithmetic only.
   - The spec's file table left `formatTyped` and `placeholderFor` in `date.ts`. One module owning the shape is what keeps the placeholder, the display and the reader in step.
2. **`applyMask` takes a fourth argument and returns an extra field.**
   - The argument is `inserted`, the digit range this edit inserted, computed by `insertedRange`.
   - The extra return field is `acceptedAfter`, used for caret mapping.
   - The spec's three-argument signature cannot express the insertion/deletion asymmetry.
3. **In range mode, `readValue` runs the start through the whole priority list, then the end.**
4. **Task 1 carries the fix wave's residual Minors from its re-review:**
   - a pre-hydration trigger click;
   - a disabled picker submitting its value;
   - the stub comment's scope;
   - the latch idiom;
   - the MEMORY.md test count.

---

## File Structure

| File | Change | Responsibility |
|---|---|---|
| `src/components/useHydrated.ts` | Create (Task 1) | The hydration flag shared by Calendar and DatePicker. |
| `src/components/Calendar/Calendar.tsx` | Modify (Task 1) | Uses `useHydrated`; the status latch holds its mounted key in state. |
| `src/test/popover.ts` | Modify (Task 1) | Comment scoped truthfully per consumer. |
| `src/components/DatePicker/mask.ts` | Create (Task 2) | Everything about typed dates, pure. |
| `src/components/DatePicker/mask.test.ts` | Create (Task 2) | Table tests for the engine. |
| `src/components/Calendar/date.ts` | Modify (Task 3) | Loses `Segment`, `segmentOrder`, `placeholderFor`, `formatTyped`, `parseTyped`. |
| `src/components/Calendar/Calendar.test.tsx` | Modify (Task 3) | Loses the `typed dates` describe and its imports. |
| `src/components/DatePicker/DatePicker.tsx` | Modify (Tasks 1, 3, 4) | The masked field, evaluation, `onInvalid`, shell and hint. |
| `src/components/DatePicker/DatePicker.module.css` | Modify (Task 4) | `.entry`, `.shell`, `.typed`. |
| `src/components/DatePicker/DatePicker.test.tsx` | Modify (Tasks 1, 3, 4) | Typing, shell and hint tests. |
| `src/components/DatePicker/index.ts`, `src/index.ts` | Modify (Task 3) | Export `DatePickerInvalidReason`. |
| `app/date-picker/page.tsx` | Modify (Task 5) | "Typing a date" rewritten; props table; accessibility paragraph. |
| `docs/superpowers/specs/2026-09-10-date-picker-design.md` | Modify (Task 5) | Pointers to the mask design. |
| `MEMORY.md` | Modify (Tasks 1, 5) | Invariant 17 note, invariant 18, counts. |

---

### Task 1: Settle the fix wave's residual minors

**Files:**
- Create: `src/components/useHydrated.ts`
- Modify: `src/components/Calendar/Calendar.tsx` (the module-level `subscribe` and its comment; the `useSyncExternalStore(subscribe, …)` line; the `mountedSelection` latch)
- Modify: `src/components/DatePicker/DatePicker.tsx` (trigger `popoverTarget`; hidden input)
- Modify: `src/components/DatePicker/DatePicker.test.tsx` (two new tests in `describe('DatePicker')`)
- Modify: `src/test/popover.ts` (the sentence ending "have not yet been checked by hand.")
- Modify: `MEMORY.md` (invariant 17; the Verification test count)

**Interfaces:**
- Produces: `useHydrated(): boolean` from `src/components/useHydrated.ts`. It returns `false` on the server and in the hydration pass, and `true` after that. Task 3's `DatePicker.tsx` imports it.

- [ ] **Step 1: Write the failing tests** in `src/components/DatePicker/DatePicker.test.tsx`, inside `describe('DatePicker', …)`, just after the test `'submits an empty string under its name when there is no value'`:

```tsx
  it('leaves the trigger inert in server HTML, so a click before hydration cannot open an empty panel', () => {
    // Native popovertarget would open the panel before React listens: `open`
    // stays false, the Calendar stays unmounted, and the panel shows empty.
    const html = renderToString(<DatePicker label="Any day" />);
    expect(html).not.toContain('popovertarget');
  });

  it('submits nothing under its name when disabled', () => {
    const { container } = render(
      <form>
        <DatePicker label="Appointment" name="appointment" value="2023-04-26" disabled />
      </form>,
    );
    expect(new FormData(container.querySelector('form')!).has('appointment')).toBe(false);
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/components/DatePicker -t "inert in server HTML|submits nothing under its name"`
Expected: both FAIL. The first because the HTML contains `popovertarget=`, the second because `has('appointment')` is `true`.

- [ ] **Step 3: Create `src/components/useHydrated.ts`**

```ts
'use client';

import { useSyncExternalStore } from 'react';

// No subscription and no effect: the store never changes, so the hook reads
// its server snapshot (`false`) for the render that produces static HTML and
// for the client's hydration pass, and its client snapshot (`true`) for every
// render after that — including the first one under a plain client
// `render()`, which never goes through hydration. Module scope, so it is one
// stable function rather than a fresh closure per render.
const subscribe = () => () => {};

/** `false` on the server and in the hydration pass; `true` from then on. */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
```

- [ ] **Step 4: Use it in `Calendar.tsx`**
  - Delete the module-level `const subscribe = () => () => {};` and the comment block directly above it.
  - Replace `const hydrated = useSyncExternalStore(subscribe, () => true, () => false);` with `const hydrated = useHydrated();`.
    - Keep the long comment above that line: it explains what waits for the flag.
  - Add `import { useHydrated } from '../useHydrated';` after the `./date` import.
  - Remove `useSyncExternalStore` from the `react` import.

In the same file, replace the latch's ref with state. A ref read during render is the part React does not endorse. Change:

```tsx
  const mountedSelection = useRef(selectionKey);
  const [selectionChanged, setSelectionChanged] = useState(false);
  if (!selectionChanged && selectionKey !== mountedSelection.current) setSelectionChanged(true);
```

to:

```tsx
  const [mountedSelection] = useState(selectionKey);
  const [selectionChanged, setSelectionChanged] = useState(false);
  if (!selectionChanged && selectionKey !== mountedSelection) setSelectionChanged(true);
```

Keep `useRef` in the import only if something else still uses it (`gridRef` does).

- [ ] **Step 5: Use it in `DatePicker.tsx`**
  - Add `import { useHydrated } from '../useHydrated';` after the `useField` import.
  - Add `const hydrated = useHydrated();` directly above `const [open, setOpen] = useState(false);`.
  - On the trigger button, replace `popoverTarget={panelId}` with:

```tsx
          // Only once hydrated. Before that, a native popovertarget would open
          // the panel while React is not listening: `open` would stay false,
          // the Calendar unmounted, and the panel empty until two more clicks.
          popoverTarget={hydrated ? panelId : undefined}
```

On the hidden input (`type="hidden"`), add after `value={…}`:

```tsx
          // A disabled control submits nothing, as a disabled input would.
          disabled={disabled}
```

- [ ] **Step 6: Scope the stub's comment in `src/test/popover.ts`**

Replace:

```
 * through this stub. The top layer, anchor placement and real focus are not
 * covered by any suite, and have not yet been checked by hand.
```

with:

```
 * through this stub. The top layer, anchor placement and real focus are not
 * covered by any suite. DropdownMenu's docs page records its own by-hand
 * check; DatePicker's have not yet been checked by hand.
```

- [ ] **Step 7: Run the tests to verify they pass**

Run: `npx vitest run src/components/DatePicker src/components/Calendar`
Expected: PASS, including both new tests. The existing test `'puts the panel in the top layer as a manual popover anchored to the field'` still passes, because a client `render()` is hydrated from the first pass.

- [ ] **Step 8: Update `MEMORY.md`**
  - At the end of invariant 17, add: `The flag is \`useHydrated\` (\`src/components/useHydrated.ts\`), shared with DatePicker, whose trigger carries \`popovertarget\` only once hydrated so a click before hydration cannot open an empty panel.`
  - In the Verification block, set the test count to the number `npx vitest run` reports.

- [ ] **Step 9: Gate and commit**

Run: `npm run check`
Expected: 18 files, all tests passing, no warnings.

```bash
git add src/components/useHydrated.ts src/components/Calendar/Calendar.tsx src/components/DatePicker/DatePicker.tsx src/components/DatePicker/DatePicker.test.tsx src/test/popover.ts MEMORY.md
git commit -m "Keep the picker's trigger inert until hydration, and settle the fix wave's last minors

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: The mask engine

**Files:**
- Create: `src/components/DatePicker/mask.ts`
- Create: `src/components/DatePicker/mask.test.ts`

**Interfaces:**
- Consumes from `src/components/Calendar/date.ts`:
  - `compare(a, b): number`
  - `dateFormat(locale, options): Intl.DateTimeFormat`
  - `isValidISO(value): boolean`
  - `orderRange(a, b): { start; end }`
  - `utcTimestamp(date): number`
  - `type ISODate`

  From `src/components/Calendar`: `type DateRange` (`{ start: ISODate; end: ISODate }`).
- Produces (all exported from `mask.ts`; Task 3 and Task 4 use these exact names):
  - `type Segment = 'year' | 'month' | 'day'`
  - `type DateShape = { order: Segment[]; separator: string }`
  - `type MaskMode = 'single' | 'range'`
  - `type DatePickerInvalidReason = 'incomplete' | 'not-a-date' | 'before-min' | 'after-max' | 'unavailable'`
  - `const RANGE_SEPARATOR = ' – '`
  - `digitsFor(mode: MaskMode): number`, which returns 8 or 16
  - `dateShape(locale: string): DateShape`
  - `normaliseDigits(raw: string): string`
  - `replaceWholeIso(raw: string, shape: DateShape): string`
  - `type Inserted = { start: number; end: number }` and `insertedRange(previous: string, next: string): Inserted`
  - `type MaskResult = { digits: string; text: string; acceptedAfter: number[] }`
  - `applyMask(digits: string, shape: DateShape, mode: MaskMode, inserted: Inserted): MaskResult | null`
  - `formatDigits(digits: string, shape: DateShape, mode: MaskMode): string`
  - `formatValue(value: ISODate | DateRange | null | undefined, shape: DateShape): string`
  - `placeholderFor(shape: DateShape, mode: MaskMode): string`
  - `hintFor(shape: DateShape, mode: MaskMode): string`
  - `caretIndex(text: string, digitCount: number): number`
  - `type Bounds = { min?: ISODate; max?: ISODate; isDateUnavailable?: (date: ISODate) => boolean }`
  - `type ReadResult = { value: ISODate | DateRange } | { reason: DatePickerInvalidReason }`
  - `readValue(digits: string, shape: DateShape, mode: MaskMode, bounds?: Bounds): ReadResult`

- [ ] **Step 1: Write the failing test file** `src/components/DatePicker/mask.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import {
  RANGE_SEPARATOR,
  applyMask,
  caretIndex,
  dateShape,
  digitsFor,
  formatValue,
  hintFor,
  insertedRange,
  normaliseDigits,
  placeholderFor,
  readValue,
  replaceWholeIso,
  type DateShape,
  type MaskMode,
} from './mask';

const pt = dateShape('pt-PT');
const us = dateShape('en-US');
const ja = dateShape('ja-JP');

/**
 * Types `keys` one digit at a time at the end of the field, as a keyboard
 * would, and returns the text after each key, or null where the key was refused.
 */
function typeDigits(keys: string, shape: DateShape, mode: MaskMode = 'single') {
  let digits = '';
  const seen: (string | null)[] = [];
  for (const key of keys) {
    const next = digits + key;
    const masked = applyMask(next, shape, mode, insertedRange(digits, next));
    if (masked) digits = masked.digits;
    seen.push(masked ? masked.text : null);
  }
  return seen;
}

describe('dateShape', () => {
  it.each<[string, string[], string]>([
    ['en-US', ['month', 'day', 'year'], '/'],
    ['pt-PT', ['day', 'month', 'year'], '/'],
    ['de-DE', ['day', 'month', 'year'], '.'],
    ['nl-NL', ['day', 'month', 'year'], '-'],
    ['ja-JP', ['year', 'month', 'day'], '/'],
  ])('reads %s in its own order, joined by its own separator', (locale, order, separator) => {
    expect(dateShape(locale)).toEqual({ order, separator });
  });

  it('trims the spaces and the trailing dot ko-KR writes around its separator', () => {
    // ko-KR formats "2026. 04. 26." — the literal between segments is ". ".
    expect(dateShape('ko-KR')).toEqual({ order: ['year', 'month', 'day'], separator: '.' });
  });

  it('drops the bidi mark ar-EG puts before its slash', () => {
    expect(dateShape('ar-EG')).toEqual({ order: ['day', 'month', 'year'], separator: '/' });
  });

  it('reads the Gregorian order even where the locale defaults to another calendar', () => {
    // fa-IR formats in the Persian calendar unless the calendar is pinned.
    expect(dateShape('fa-IR').order).toEqual(['year', 'month', 'day']);
  });
});

describe('applyMask while typing', () => {
  it('adds the separator as soon as a segment is complete', () => {
    expect(typeDigits('12022025', pt)).toEqual([
      '1',
      '12/',
      '12/0',
      '12/02/',
      '12/02/2',
      '12/02/20',
      '12/02/202',
      '12/02/2025',
    ]);
  });

  it('pads a first digit that cannot start its segment', () => {
    expect(typeDigits('45', pt)).toEqual(['04/', '04/05/']);
    expect(typeDigits('2', us)).toEqual(['02/']);
  });

  it('refuses a second digit that makes the segment impossible', () => {
    expect(typeDigits('13', us)).toEqual(['1', null]);
    expect(typeDigits('00', us)).toEqual(['0', null]);
    expect(typeDigits('32', pt)).toEqual(['3', null]);
    expect(typeDigits('00', pt)).toEqual(['0', null]);
  });

  it('accepts the highest day and month there are', () => {
    expect(typeDigits('3112', pt).at(-1)).toBe('31/12/');
    expect(typeDigits('1231', us).at(-1)).toBe('12/31/');
  });

  it('refuses a year that starts with 0, which the calendar arithmetic would read as the 1900s', () => {
    expect(typeDigits('12020', pt)).toEqual(['1', '12/', '12/0', '12/02/', null]);
  });

  it('writes the year first where the locale does', () => {
    expect(typeDigits('20260426', ja).at(-1)).toBe('2026/04/26');
    expect(typeDigits('202645', ja).at(-1)).toBe('2026/04/05');
  });

  it('stops at eight digits in single mode', () => {
    expect(typeDigits('120220251', pt).at(-1)).toBeNull();
  });

  it('joins a range with an en dash after the eighth digit, and stops at sixteen', () => {
    expect(RANGE_SEPARATOR).toBe(' – ');
    const seen = typeDigits('12022025200220251', pt, 'range');
    expect(seen[7]).toBe(`12/02/2025${RANGE_SEPARATOR}`);
    expect(seen[15]).toBe(`12/02/2025${RANGE_SEPARATOR}20/02/2025`);
    expect(seen[16]).toBeNull();
  });
});

describe('applyMask on a whole edit', () => {
  it('rejects a paste whole rather than shifting its digits into other segments', () => {
    expect(applyMask('13022025', us, 'single', insertedRange('', '13022025'))).toBeNull();
  });

  it('never refuses a deletion, and reflows what is left unchecked', () => {
    const masked = applyMask('1022025', pt, 'single', insertedRange('12022025', '1022025'));
    expect(masked?.text).toBe('10/22/025');
  });

  it('checks a digit that replaces a selection, padding it where it lands', () => {
    const masked = applyMask('4022025', pt, 'single', insertedRange('12022025', '4022025'));
    expect(masked?.text).toBe('04/02/2025');
  });

  it('maps each input digit to the accepted digits after it, counting padding', () => {
    expect(applyMask('4', pt, 'single', insertedRange('', '4'))?.acceptedAfter).toEqual([0, 2]);
  });
});

describe('insertedRange', () => {
  it('finds what an edit inserted between an unchanged prefix and suffix', () => {
    expect(insertedRange('1202', '12302')).toEqual({ start: 2, end: 3 });
  });

  it('is empty for a pure deletion', () => {
    const { start, end } = insertedRange('12022025', '1022025');
    expect(end - start).toBe(0);
  });
});

describe('normaliseDigits and replaceWholeIso', () => {
  it('reads fullwidth and Arabic-Indic digits as ASCII, and drops everything else', () => {
    expect(normaliseDigits('１２/٠٢/۲۰۲۵ x')).toBe('12022025');
  });

  it('reorders ISO that arrives whole into the locale order', () => {
    expect(replaceWholeIso('2025-02-12', pt)).toBe('12022025');
    expect(replaceWholeIso('2025-02-12/2025-02-20', us)).toBe('02122025/02202025');
  });
});

describe('caretIndex', () => {
  it('puts the caret past a separator that follows the digit', () => {
    expect(caretIndex('12/', 2)).toBe(3);
    expect(caretIndex(`12/02/2025${RANGE_SEPARATOR}`, 8)).toBe(13);
  });

  it('leaves the caret beside a digit that follows the digit', () => {
    expect(caretIndex('10/22/025', 1)).toBe(1);
  });

  it('starts at 0 when no digit precedes it', () => {
    expect(caretIndex('12/', 0)).toBe(0);
  });
});

describe('readValue', () => {
  const weekend = (date: string) =>
    ['2023-04-01', '2023-04-02', '2023-04-08', '2023-04-09'].includes(date);
  const bounds = { min: '2023-04-03', max: '2023-04-24', isDateUnavailable: weekend };

  it('reads a complete date in the locale order', () => {
    expect(readValue('12022025', pt, 'single')).toEqual({ value: '2025-02-12' });
    expect(readValue('02122025', us, 'single')).toEqual({ value: '2025-02-12' });
  });

  it('reports incomplete before anything else', () => {
    expect(readValue('1202202', pt, 'single', bounds)).toEqual({ reason: 'incomplete' });
  });

  it('reports a date that does not exist, including one a deletion left behind', () => {
    expect(readValue('31022025', pt, 'single')).toEqual({ reason: 'not-a-date' });
    expect(readValue('29022025', pt, 'single')).toEqual({ reason: 'not-a-date' });
    expect(readValue('10222025', pt, 'single')).toEqual({ reason: 'not-a-date' });
    expect(readValue('01010999', pt, 'single')).toEqual({ reason: 'not-a-date' });
  });

  it('accepts 29 February in a leap year', () => {
    expect(readValue('29022024', pt, 'single')).toEqual({ value: '2024-02-29' });
  });

  it('reports the bounds, then unavailability', () => {
    expect(readValue('04012023', us, 'single', bounds)).toEqual({ reason: 'before-min' });
    expect(readValue('04302023', us, 'single', bounds)).toEqual({ reason: 'after-max' });
    expect(readValue('04082023', us, 'single', bounds)).toEqual({ reason: 'unavailable' });
    expect(readValue('04102023', us, 'single', bounds)).toEqual({ value: '2023-04-10' });
  });

  it('orders a reversed range rather than calling it an error', () => {
    expect(readValue('0410202304052023', us, 'range')).toEqual({
      value: { start: '2023-04-05', end: '2023-04-10' },
    });
  });

  it('checks the whole start of a range before its end', () => {
    // The start is before min and the end does not exist: the start's reason wins.
    expect(readValue('0401202302312023', us, 'range', bounds)).toEqual({ reason: 'before-min' });
    expect(readValue('0410202302312023', us, 'range', bounds)).toEqual({ reason: 'not-a-date' });
  });

  it('needs all sixteen digits for a range', () => {
    expect(readValue('04102023', us, 'range')).toEqual({ reason: 'incomplete' });
  });
});

describe('formatValue, placeholderFor and hintFor', () => {
  it('formats a value exactly as typing it would, so an emission does not move the caret', () => {
    expect(formatValue('2025-02-12', pt)).toBe(typeDigits('12022025', pt).at(-1));
    expect(formatValue({ start: '2023-04-05', end: '2023-04-10' }, us)).toBe(
      `04/05/2023${RANGE_SEPARATOR}04/10/2023`,
    );
    expect(formatValue(null, us)).toBe('');
  });

  it('writes the placeholder in the locale order and separator, in English letters', () => {
    expect(placeholderFor(pt, 'single')).toBe('DD/MM/YYYY');
    expect(placeholderFor(dateShape('de-DE'), 'single')).toBe('DD.MM.YYYY');
    expect(placeholderFor(us, 'range')).toBe(`MM/DD/YYYY${RANGE_SEPARATOR}MM/DD/YYYY`);
  });

  it('lines the placeholder up character for character with a typed value', () => {
    expect(placeholderFor(pt, 'range')).toHaveLength(
      formatValue({ start: '2025-02-12', end: '2025-02-20' }, pt).length,
    );
  });

  it('spells the order out in words for a screen reader', () => {
    expect(hintFor(pt, 'single')).toBe(
      'Type digits only, as day, month, year. Separators are added for you.',
    );
    expect(hintFor(us, 'range')).toBe(
      'Type digits only, as month, day, year. Separators are added for you. Then the end date the same way.',
    );
  });

  it('holds eight digits for a date and sixteen for a range', () => {
    expect(digitsFor('single')).toBe(8);
    expect(digitsFor('range')).toBe(16);
  });
});

describe('mask source', () => {
  it('reaches for neither Date nor a raw Intl formatter', () => {
    // `import.meta.url` is not a file URL under jsdom, so resolve from the root.
    const code = readFileSync('src/components/DatePicker/mask.ts', 'utf8');
    expect(code).not.toContain('Date.');
    expect(code).not.toContain('new Intl.');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/components/DatePicker/mask.test.ts`
Expected: FAIL, because `./mask` cannot be resolved.

- [ ] **Step 3: Create `src/components/DatePicker/mask.ts`**

```ts
/**
 * The date field's mask. Pure functions, no DOM.
 *
 * The field is rebuilt from its digits after every edit rather than by
 * intercepting keys: only that survives a paste, autofill, an IME composition
 * and Android keyboards, which report `keydown` as `Unidentified`. Everything
 * the field shows, and everything it reads back, goes through the one
 * `DateShape` a locale produces here, so the placeholder, the formatted value
 * and the reader can never disagree about the order.
 *
 * Copied, not invented: GOV.UK's numeric input and its error priority, React
 * Aria's prevention of impossible segment values, and Estelle Weyl's
 * accessible masking (a visible shell of the format still to type, deletion
 * never blocked, the pattern described in words).
 */
import {
  compare,
  dateFormat,
  isValidISO,
  orderRange,
  utcTimestamp,
  type ISODate,
} from '../Calendar/date';
import type { DateRange } from '../Calendar';

export type Segment = 'year' | 'month' | 'day';
export type DateShape = { order: Segment[]; separator: string };
export type MaskMode = 'single' | 'range';
export type DatePickerInvalidReason =
  | 'incomplete'
  | 'not-a-date'
  | 'before-min'
  | 'after-max'
  | 'unavailable';

/**
 * Between the two dates of a range. Fixed, and not `formatRange`'s: the
 * spacing that function puts around its dash depends on the ICU build, which
 * is how the calendar once shipped a hydration mismatch.
 */
export const RANGE_SEPARATOR = ' – ';

const WIDTH: Record<Segment, number> = { day: 2, month: 2, year: 4 };
const LETTERS: Record<Segment, string> = { day: 'DD', month: 'MM', year: 'YYYY' };
const DATE_DIGITS = 8;

export const digitsFor = (mode: MaskMode) => (mode === 'range' ? DATE_DIGITS * 2 : DATE_DIGITS);

/**
 * The order a locale writes a numeric date in, and the separator between its
 * parts. The calendar and the digits are pinned: fa-IR otherwise formats in
 * the Persian calendar and ar-EG in Arabic-Indic digits, and a separator must
 * not be read from either. Whitespace and bidi marks are dropped from the
 * literal (ko-KR writes ". ", ar-EG puts U+200F before its slash), and a
 * trailing literal — ko-KR's final "." — is not a separator at all.
 */
export function dateShape(locale: string): DateShape {
  const formatted = dateFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    calendar: 'gregory',
    numberingSystem: 'latn',
  }).formatToParts(utcTimestamp('2026-04-26'));

  const order: Segment[] = [];
  let separator = '';
  for (const part of formatted) {
    if (part.type === 'year' || part.type === 'month' || part.type === 'day') {
      order.push(part.type);
    } else if (part.type === 'literal' && order.length === 1) {
      separator = part.value.replace(/[\s‎‏؜]/g, '');
    }
  }
  return { order, separator: separator || '/' };
}

/** The zero of each digit block the field reads: ASCII, Arabic-Indic, Extended Arabic-Indic, fullwidth. */
const DIGIT_ZEROS = [0x30, 0x660, 0x6f0, 0xff10];

/**
 * The digits in `raw`, as ASCII. Fullwidth digits are what a Japanese IME
 * produces; everything that is not a digit is dropped.
 */
export function normaliseDigits(raw: string): string {
  let digits = '';
  for (const char of raw) {
    const code = char.codePointAt(0)!;
    const zero = DIGIT_ZEROS.find((start) => code >= start && code <= start + 9);
    if (zero !== undefined) digits += String(code - zero);
  }
  return digits;
}

const WHOLE_ISO = /(\d{4})-(\d{2})-(\d{2})/g;

/**
 * ISO that arrives whole — a paste, autofill, a drop — becomes its digits in
 * the locale's order before the mask sees it. Typed key by key it cannot be
 * told apart: in a day-first order its first two digits are already a day.
 */
export function replaceWholeIso(raw: string, shape: DateShape): string {
  return raw.replace(WHOLE_ISO, (_match, year: string, month: string, day: string) => {
    const segments: Record<Segment, string> = { year, month, day };
    return shape.order.map((segment) => segments[segment]).join('');
  });
}

/** Digit positions `[start, end)` in the new digits that an edit inserted. */
export type Inserted = { start: number; end: number };

/** What changed between two digit strings: everything between their common prefix and suffix. */
export function insertedRange(previous: string, next: string): Inserted {
  let start = 0;
  while (start < previous.length && start < next.length && previous[start] === next[start]) {
    start += 1;
  }
  let suffix = 0;
  while (
    suffix < previous.length - start &&
    suffix < next.length - start &&
    previous[previous.length - 1 - suffix] === next[next.length - 1 - suffix]
  ) {
    suffix += 1;
  }
  return { start, end: next.length - suffix };
}

function slotOf(index: number, shape: DateShape): { segment: Segment; position: number } {
  const within = index % DATE_DIGITS;
  let offset = 0;
  for (const segment of shape.order) {
    if (within < offset + WIDTH[segment]) return { segment, position: within - offset };
    offset += WIDTH[segment];
  }
  throw new RangeError(`No segment holds digit ${index}`);
}

type Verdict = 'accept' | 'pad' | 'refuse';

/**
 * One digit against the slot it lands in. A day may be 01–31 and a month
 * 01–12 in any month — whether that day exists in that month is not known
 * until both are in, so it is `readValue`'s question. A year may not start
 * with 0: the calendar's arithmetic would read years 0–99 as the 1900s.
 */
function check(segment: Segment, position: number, digit: number, first: number): Verdict {
  if (segment === 'year') return position === 0 && digit === 0 ? 'refuse' : 'accept';
  const highestFirst = segment === 'day' ? 3 : 1;
  if (position === 0) return digit <= highestFirst ? 'accept' : 'pad';
  if (first === 0) return digit >= 1 ? 'accept' : 'refuse';
  if (first < highestFirst) return 'accept';
  if (first === highestFirst) return digit <= (segment === 'day' ? 1 : 2) ? 'accept' : 'refuse';
  return 'refuse';
}

export type MaskResult = {
  /** The accepted digits, padding included. */
  digits: string;
  /** Those digits as the field shows them. */
  text: string;
  /** `acceptedAfter[i]` is how many accepted digits the first `i` input digits became. */
  acceptedAfter: number[];
};

/**
 * Frames `digits` into segments, or returns null when the edit is rejected.
 *
 * Insertions and deletions are treated differently, on purpose. Only the
 * digits this edit `inserted` are checked, each against the slot it lands in
 * once everything re-flows, and only they are padded. One refused digit, or
 * one digit past the limit, rejects the whole edit, so a paste never shifts
 * its digits into segments the user did not mean. A deletion inserts nothing
 * and is never refused: the digits after it re-flow unchecked, and
 * `readValue` says what is wrong. Checking deletions "for consistency" would
 * trap Backspace.
 */
export function applyMask(
  digits: string,
  shape: DateShape,
  mode: MaskMode,
  inserted: Inserted,
): MaskResult | null {
  const limit = digitsFor(mode);
  let accepted = '';
  const acceptedAfter = [0];

  for (let index = 0; index < digits.length; index += 1) {
    if (accepted.length >= limit) return null;
    const digit = Number(digits[index]);

    if (index >= inserted.start && index < inserted.end) {
      const { segment, position } = slotOf(accepted.length, shape);
      const verdict = check(segment, position, digit, Number(accepted[accepted.length - 1]));
      if (verdict === 'refuse') return null;
      if (verdict === 'pad') accepted += '0';
    }

    accepted += String(digit);
    acceptedAfter.push(accepted.length);
  }

  return { digits: accepted, text: formatDigits(accepted, shape, mode), acceptedAfter };
}

/** One date's digits, with the separator added as soon as a segment is complete. */
function formatDate(digits: string, shape: DateShape): string {
  let text = '';
  let offset = 0;
  shape.order.forEach((segment, index) => {
    const chunk = digits.slice(offset, offset + WIDTH[segment]);
    offset += WIDTH[segment];
    text += chunk;
    if (chunk.length === WIDTH[segment] && index < shape.order.length - 1) {
      text += shape.separator;
    }
  });
  return text;
}

export function formatDigits(digits: string, shape: DateShape, mode: MaskMode): string {
  const start = formatDate(digits.slice(0, DATE_DIGITS), shape);
  if (mode === 'single' || digits.length < DATE_DIGITS) return start;
  return `${start}${RANGE_SEPARATOR}${formatDate(digits.slice(DATE_DIGITS), shape)}`;
}

function dateDigits(date: ISODate, shape: DateShape): string {
  const [year, month, day] = date.split('-') as [string, string, string];
  const segments: Record<Segment, string> = { year, month, day };
  return shape.order.map((segment) => segments[segment]).join('');
}

/** A value as the field shows it — exactly the text typing its digits produces. */
export function formatValue(
  value: ISODate | DateRange | null | undefined,
  shape: DateShape,
): string {
  if (!value) return '';
  if (typeof value === 'string') return formatDigits(dateDigits(value, shape), shape, 'single');
  return formatDigits(dateDigits(value.start, shape) + dateDigits(value.end, shape), shape, 'range');
}

/**
 * The format as letters. English, like every other string in the component;
 * the order and the separator are the locale's. Character for character it
 * lines up with a formatted value, which is what lets the shell draw the rest
 * of it behind the text.
 */
export function placeholderFor(shape: DateShape, mode: MaskMode): string {
  const one = shape.order.map((segment) => LETTERS[segment]).join(shape.separator);
  return mode === 'range' ? `${one}${RANGE_SEPARATOR}${one}` : one;
}

/** The mask in words: a screen reader reads "DD/MM/YYYY" letter by letter. */
export function hintFor(shape: DateShape, mode: MaskMode): string {
  const hint = `Type digits only, as ${shape.order.join(', ')}. Separators are added for you.`;
  return mode === 'range' ? `${hint} Then the end date the same way.` : hint;
}

const isDigit = (char: string) => normaliseDigits(char).length === 1;

/** Just after the `digitCount`-th digit of `text`, and past any separator that follows it. */
export function caretIndex(text: string, digitCount: number): number {
  if (digitCount === 0) return 0;
  let index = 0;
  let seen = 0;
  while (index < text.length && seen < digitCount) {
    if (isDigit(text[index]!)) seen += 1;
    index += 1;
  }
  while (index < text.length && !isDigit(text[index]!)) index += 1;
  return index;
}

export type Bounds = {
  min?: ISODate;
  max?: ISODate;
  isDateUnavailable?: (date: ISODate) => boolean;
};

export type ReadResult = { value: ISODate | DateRange } | { reason: DatePickerInvalidReason };

function toDate(digits: string, shape: DateShape): string {
  const read: Record<Segment, string> = { year: '', month: '', day: '' };
  let offset = 0;
  for (const segment of shape.order) {
    read[segment] = digits.slice(offset, offset + WIDTH[segment]);
    offset += WIDTH[segment];
  }
  return `${read.year}-${read.month}-${read.day}`;
}

/** GOV.UK's priority for one date: not a real date, then the bounds, then unavailability. */
function refusal(date: string, bounds: Bounds): DatePickerInvalidReason | null {
  if (!isValidISO(date) || date < '1000') return 'not-a-date';
  if (bounds.min !== undefined && compare(date, bounds.min) < 0) return 'before-min';
  if (bounds.max !== undefined && compare(date, bounds.max) > 0) return 'after-max';
  if (bounds.isDateUnavailable?.(date)) return 'unavailable';
  return null;
}

/**
 * The value the digits hold, or the first reason they do not hold one.
 * `incomplete` comes before everything. In range mode the start goes through
 * the whole list before the end does, and a pair whose end precedes its start
 * is put in order — the user expressed an interval, not an order.
 */
export function readValue(
  digits: string,
  shape: DateShape,
  mode: MaskMode,
  bounds: Bounds = {},
): ReadResult {
  if (digits.length < digitsFor(mode)) return { reason: 'incomplete' };

  const start = toDate(digits.slice(0, DATE_DIGITS), shape);
  const startRefusal = refusal(start, bounds);
  if (startRefusal) return { reason: startRefusal };
  if (mode === 'single') return { value: start };

  const end = toDate(digits.slice(DATE_DIGITS, DATE_DIGITS * 2), shape);
  const endRefusal = refusal(end, bounds);
  if (endRefusal) return { reason: endRefusal };
  return { value: orderRange(start, end) };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/components/DatePicker/mask.test.ts && TZ=America/Los_Angeles npx vitest run src/components/DatePicker/mask.test.ts`
Expected: PASS in both runs.

- [ ] **Step 5: Gate and commit**

Run: `npm run check`
Expected: all green. `mask.ts` is not used by the component yet, and that is fine.

```bash
git add src/components/DatePicker/mask.ts src/components/DatePicker/mask.test.ts
git commit -m "Add the date field's mask as pure functions: shape, digits, framing, caret and reasons

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: Wire the mask into the field

**Files:**
- Modify: `src/components/DatePicker/DatePicker.tsx` (full replacement below)
- Modify: `src/components/DatePicker/DatePicker.test.tsx`:
  - the import of `DatePicker`;
  - the source tripwire test;
  - the whole `describe('DatePicker typing', …)` block.
- Modify: `src/components/Calendar/date.ts` (delete `Segment`, `segmentOrder`, `WIDTH`, `placeholderFor`, `formatTyped`, `parseTyped` and their doc comments)
- Modify: `src/components/Calendar/Calendar.test.tsx` (delete `describe('typed dates', …)`, and remove `formatTyped`, `parseTyped`, `placeholderFor` and `segmentOrder` from the `./date` import)
- Modify: `src/components/DatePicker/index.ts`, `src/index.ts`

**Interfaces:**
- Consumes:
  - from `mask.ts`: every export listed in Task 2;
  - `useHydrated` from Task 1.
- Produces:
  - `DatePickerProps.onInvalid?: (raw: string, reason: DatePickerInvalidReason) => void`, replacing `onParseError`;
  - `DatePickerInvalidReason`, re-exported from `./DatePicker`, `./index` and `src/index.ts`.

- [ ] **Step 1: Write the failing tests.** In `DatePicker.test.tsx`, first change the import `import { DatePicker } from './DatePicker';` to `import { DatePicker, type DatePickerProps } from './DatePicker';`.

In the test `'reaches for neither Date nor a raw Intl formatter'`, add as its last line:

```tsx
    // The free-text parse and its callback are gone; the mask reports reasons.
    expect(code).not.toContain('onParseError');
```

Replace the entire `describe('DatePicker typing', …)` block with:

```tsx
describe('DatePicker typing', () => {
  /** A picker holding its own value, as a page would. */
  function Typed({
    initial = null,
    onSelect,
    ...props
  }: Omit<DatePickerProps, 'label' | 'value'> & { initial?: DatePickerProps['value'] }) {
    const [value, setValue] = useState(initial);
    return (
      <DatePicker
        label="Appointment"
        {...props}
        value={value}
        onSelect={(next) => {
          setValue(next);
          onSelect?.(next);
        }}
      />
    );
  }

  it('frames digits as they are typed, in the locale order and with its separator', async () => {
    const onSelect = vi.fn();
    render(<Typed locale="pt-PT" onSelect={onSelect} />);
    const input = screen.getByRole('textbox');

    await userEvent.type(input, '12');
    expect(input).toHaveValue('12/');

    await userEvent.type(input, '022025');
    expect(input).toHaveValue('12/02/2025');
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('2025-02-12');
  });

  it('pads a first digit that cannot start its segment', async () => {
    render(<Typed locale="pt-PT" />);
    const input = screen.getByRole('textbox');
    await userEvent.type(input, '45');
    expect(input).toHaveValue('04/05/');
  });

  it('refuses a digit that would make the month impossible, and leaves the caret where it was', async () => {
    render(<Typed />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    await userEvent.type(input, '13');
    expect(input).toHaveValue('1');
    expect(input.selectionStart).toBe(1);
  });

  it('inserts nothing from a paste that would not fit, rather than shifting its digits', async () => {
    render(<Typed />);
    const input = screen.getByRole('textbox');
    await userEvent.click(input);
    await userEvent.paste('13022025');
    expect(input).toHaveValue('');
  });

  it('ignores a digit typed into a field that is already full', async () => {
    const onSelect = vi.fn();
    render(<Typed onSelect={onSelect} />);
    const input = screen.getByRole('textbox');
    await userEvent.type(input, '04262023');
    await userEvent.type(input, '1');
    expect(input).toHaveValue('04/26/2023');
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('never refuses a deletion, and lets the digits after it reflow', async () => {
    const onSelect = vi.fn();
    const onInvalid = vi.fn();
    render(
      <Typed locale="pt-PT" initial="2025-02-12" onSelect={onSelect} onInvalid={onInvalid} />,
    );
    const input = screen.getByRole('textbox') as HTMLInputElement;
    // The caret sits after "12": Backspace removes the 2 of the day.
    await userEvent.type(input, '{Backspace}', { initialSelectionStart: 2, initialSelectionEnd: 2 });
    expect(input).toHaveValue('10/22/025');
    expect(input.selectionStart).toBe(1);
    expect(onSelect).not.toHaveBeenCalled();
    expect(onInvalid).not.toHaveBeenCalled();
  });

  it('deletes the digit before a separator on Backspace, rather than putting the separator back', async () => {
    render(<Typed locale="pt-PT" />);
    const input = screen.getByRole('textbox');
    await userEvent.type(input, '12');
    await userEvent.keyboard('{Backspace}');
    expect(input).toHaveValue('1');
  });

  it('reports an incomplete date on blur, and never while it is being typed', async () => {
    const onInvalid = vi.fn();
    render(<Typed onInvalid={onInvalid} />);
    const input = screen.getByRole('textbox');

    await userEvent.type(input, '120');
    expect(input).toHaveValue('12/0');
    expect(onInvalid).not.toHaveBeenCalled();
    expect(input).not.toHaveAttribute('aria-invalid');

    await userEvent.tab();
    expect(onInvalid).toHaveBeenCalledWith('12/0', 'incomplete');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('evaluates on Enter without waiting for blur', async () => {
    const onInvalid = vi.fn();
    render(<Typed onInvalid={onInvalid} />);
    await userEvent.type(screen.getByRole('textbox'), '0426{Enter}');
    expect(onInvalid).toHaveBeenCalledWith('04/26/', 'incomplete');
  });

  it('flags a date that does not exist as soon as its last digit is in, and keeps the text', async () => {
    const onInvalid = vi.fn();
    const onSelect = vi.fn();
    render(<Typed onInvalid={onInvalid} onSelect={onSelect} />);
    const input = screen.getByRole('textbox');
    await userEvent.type(input, '02312025');
    expect(onInvalid).toHaveBeenCalledWith('02/31/2025', 'not-a-date');
    expect(onSelect).not.toHaveBeenCalled();
    expect(input).toHaveValue('02/31/2025');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('reports min, max and an unavailable day, in that order of priority', async () => {
    const onInvalid = vi.fn();
    const saturday = (date: string) => date === '2023-04-08';
    render(
      <Typed min="2023-04-03" max="2023-04-24" isDateUnavailable={saturday} onInvalid={onInvalid} />,
    );
    const input = screen.getByRole('textbox');

    await userEvent.type(input, '04012023');
    expect(onInvalid).toHaveBeenLastCalledWith('04/01/2023', 'before-min');

    await userEvent.clear(input);
    await userEvent.type(input, '04302023');
    expect(onInvalid).toHaveBeenLastCalledWith('04/30/2023', 'after-max');

    await userEvent.clear(input);
    await userEvent.type(input, '04082023');
    expect(onInvalid).toHaveBeenLastCalledWith('04/08/2023', 'unavailable');
  });

  it('emits null when the field is emptied and left', async () => {
    const onSelect = vi.fn();
    render(<Typed initial="2023-04-26" onSelect={onSelect} />);
    const input = screen.getByRole('textbox');
    await userEvent.clear(input);
    await userEvent.tab();
    expect(onSelect).toHaveBeenCalledWith(null);
    expect(input).toHaveValue('');
  });

  it('calls nothing when focus only passes through', async () => {
    const onSelect = vi.fn();
    const onInvalid = vi.fn();
    render(<Typed initial="2023-04-26" onSelect={onSelect} onInvalid={onInvalid} />);
    await userEvent.click(screen.getByRole('textbox'));
    await userEvent.tab();
    expect(onSelect).not.toHaveBeenCalled();
    expect(onInvalid).not.toHaveBeenCalled();
  });

  it('types a range, joining the two dates and ordering a reversed pair', async () => {
    const onSelect = vi.fn();
    render(<Typed mode="range" onSelect={onSelect} />);
    const input = screen.getByRole('textbox');

    await userEvent.type(input, '04102023');
    expect(input).toHaveValue('04/10/2023 – ');
    expect(onSelect).not.toHaveBeenCalled();

    await userEvent.type(input, '04052023');
    expect(onSelect).toHaveBeenCalledWith({ start: '2023-04-05', end: '2023-04-10' });
    expect(input).toHaveValue('04/05/2023 – 04/10/2023');
  });

  it('deletes the last digit of the start on Backspace after the range separator', async () => {
    render(<Typed mode="range" />);
    const input = screen.getByRole('textbox');
    await userEvent.type(input, '04102023');
    await userEvent.keyboard('{Backspace}');
    expect(input).toHaveValue('04/10/202');
  });

  it('reports a range with only its start as incomplete on blur', async () => {
    const onInvalid = vi.fn();
    render(<Typed mode="range" onInvalid={onInvalid} />);
    await userEvent.type(screen.getByRole('textbox'), '04102023');
    await userEvent.tab();
    expect(onInvalid).toHaveBeenCalledWith('04/10/2023 – ', 'incomplete');
  });

  it('reads ISO that arrives whole, in the locale order', async () => {
    const onSelect = vi.fn();
    render(<Typed locale="pt-PT" onSelect={onSelect} />);
    const input = screen.getByRole('textbox');
    await userEvent.click(input);
    await userEvent.paste('2025-02-12');
    expect(onSelect).toHaveBeenCalledWith('2025-02-12');
    expect(input).toHaveValue('12/02/2025');
  });

  it('drops a draft when the value changes from outside', async () => {
    const { rerender } = render(<DatePicker label="Appointment" value="2023-04-26" />);
    const input = screen.getByRole('textbox');
    await userEvent.type(input, '{Backspace}');
    expect(input).toHaveValue('04/26/202');

    rerender(<DatePicker label="Appointment" value="2023-06-15" />);
    expect(input).toHaveValue('06/15/2023');
  });

  it('leaves an IME composition alone until it ends', () => {
    render(<Typed locale="pt-PT" />);
    const input = screen.getByRole('textbox');
    input.focus();
    fireEvent.compositionStart(input);
    fireEvent.change(input, { target: { value: '１２' } });
    expect(input).toHaveValue('１２');
    fireEvent.compositionEnd(input);
    expect(input).toHaveValue('12/');
  });

  it('takes its placeholder from the locale, compact, with its separator', () => {
    render(<DatePicker label="Data" locale="de-DE" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', 'DD.MM.YYYY');
  });

  it('does not mask or accept typing when read-only', async () => {
    render(<DatePicker label="Appointment" value="2023-04-26" readOnly />);
    const input = screen.getByRole('textbox');
    await userEvent.type(input, '01012020');
    expect(input).toHaveValue('04/26/2023');
  });

  it('shows the field text in the locale order, and names the trigger with the long form', () => {
    render(<DatePicker label="Appointment" value="2023-04-26" />);
    expect(screen.getByRole('textbox')).toHaveValue('04/26/2023');
    expect(
      screen.getByRole('button', { name: 'Change date, April 26, 2023' }),
    ).toBeInTheDocument();
  });

  it('opens the numeric keypad and keeps autofill out of the field', () => {
    render(<DatePicker label="Appointment" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'text');
    expect(input).toHaveAttribute('inputmode', 'numeric');
    expect(input).toHaveAttribute('autocomplete', 'off');
  });

  it('clears the draft and the invalid state on a calendar pick', async () => {
    const onSelect = vi.fn();
    render(<Typed defaultMonth="2023-04-01" onSelect={onSelect} />);
    const input = screen.getByRole('textbox');

    await userEvent.type(input, '02312025');
    expect(input).toHaveAttribute('aria-invalid', 'true');

    await openPanel();
    await userEvent.click(screen.getByRole('button', { name: /april 26/i }));
    expect(onSelect).toHaveBeenCalledWith('2023-04-26');
    expect(input).toHaveValue('04/26/2023');
    expect(input).not.toHaveAttribute('aria-invalid');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/components/DatePicker/DatePicker.test.tsx`
Expected: FAIL.
- `tsc`-level: `onInvalid` does not exist on `DatePickerProps`; Vitest still runs.
- At runtime: `'12/'` versus the received `'12'`, `'04/26/2023'` versus `'04 / 26 / 2023'`, the missing `inputmode`, and the tripwire finding `onParseError`.

- [ ] **Step 3: Replace `src/components/DatePicker/DatePicker.tsx` in full** with:

```tsx
'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type {
  ChangeEvent,
  CompositionEvent,
  CSSProperties,
  FocusEvent,
  KeyboardEvent,
  ToggleEvent,
} from 'react';
import { Calendar, type CalendarProps, type DateRange } from '../Calendar';
import { dateFormat, utcTimestamp } from '../Calendar/date';
import { useField } from '../Field/FieldContext';
import { useHydrated } from '../useHydrated';
import control from '../control.module.css';
import {
  applyMask,
  caretIndex,
  dateShape,
  digitsFor,
  formatValue,
  insertedRange,
  normaliseDigits,
  placeholderFor,
  readValue,
  replaceWholeIso,
  type DatePickerInvalidReason,
} from './mask';
import styles from './DatePicker.module.css';

export type { DatePickerInvalidReason } from './mask';

/** The calendar glyph as drawn: a 24px box, 1.5px stroke. */
function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3.5 8.5h17M7.5 3.5v3m9-3v3M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v12A1.5 1.5 0 0 1 19 20.5H5A1.5 1.5 0 0 1 3.5 19V7A1.5 1.5 0 0 1 5 5.5Z"
        stroke="currentColor"
        style={{ strokeWidth: 'var(--ap-border-width-control)' }}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Shares Button's height scale: 32, 40, 48. */
export type DatePickerSize = 'sm' | 'md' | 'lg';

export type DatePickerProps = CalendarProps & {
  size?: DatePickerSize;
  invalid?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  id?: string;
  /**
   * Submitted through a hidden input, as ISO: the date in single mode, the
   * interval `start/end` in range mode, `''` with no value. Not the field's
   * display text, which follows the locale's digit order.
   */
  name?: string;
  required?: boolean;
  'aria-describedby'?: string;
  /**
   * Fires when an evaluation finds the typed text is not a date this picker
   * accepts. The field evaluates when the digits of a complete date (or
   * range) are in, on blur and on Enter — never on half a date, which is
   * unfinished rather than wrong. `raw` is the field's text; the caller turns
   * `reason` into the Field's `error`.
   */
  onInvalid?: (raw: string, reason: DatePickerInvalidReason) => void;
};

export function DatePicker({
  label,
  size = 'md',
  invalid,
  disabled,
  readOnly,
  id,
  name,
  required: requiredProp,
  'aria-describedby': describedByProp,
  mode = 'single',
  value,
  onSelect,
  onInvalid,
  locale = 'en-US',
  min,
  max,
  isDateUnavailable,
  ...calendar
}: DatePickerProps) {
  // A surrounding Field supplies the id and the wiring. Explicit props still
  // win, as they do in Input: the caller is being more specific than the wrapper.
  const field = useField();
  const isInvalid = invalid ?? field?.invalid ?? false;
  const controlId = id ?? field?.controlId;
  const describedBy = describedByProp ?? field?.describedBy;
  const required = requiredProp ?? field?.required;

  const hydrated = useHydrated();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const panelId = useId();
  // useId returns a value containing characters that are legal in an HTML id
  // and not in a CSS identifier, so the anchor name is sanitised separately.
  const anchor = `--picker-${panelId.replace(/[^a-zA-Z0-9]/g, '')}`;

  // The only place a formatter is built for this component: it goes through
  // `dateFormat`, which pins the zone to UTC, so the trigger's label reads the
  // same calendar day the grid drew — not the day before it for anyone west
  // of UTC.
  const formatter = useMemo(
    () => dateFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' }),
    [locale],
  );

  const single = typeof value === 'string' ? value : null;
  const range = value !== null && typeof value === 'object' ? (value as DateRange) : null;

  // Spoken form, for the trigger's accessible name: always the long form,
  // regardless of what the field itself is showing.
  const spokenText = single
    ? formatter.format(utcTimestamp(single))
    : range
      ? `${formatter.format(utcTimestamp(range.start))} – ${formatter.format(utcTimestamp(range.end))}`
      : '';

  // What a native form submits: ISO, never the display text, whose digit
  // order is the locale's and is the ambiguity this component exists to
  // avoid. A range is an ISO 8601 interval.
  const isoValue = single ?? (range ? `${range.start}/${range.end}` : '');

  // The locale's order and separator, read once per locale. The placeholder,
  // the formatted value and the mask all come from this one shape, so the
  // field can never show a date it would then read back differently.
  const shape = useMemo(() => dateShape(locale), [locale]);
  const fieldText = formatValue(value, shape);
  const placeholder = placeholderFor(shape, mode);

  // What the user is typing, as the mask has framed it. `null` means the field
  // shows the formatted value rather than a draft.
  const [draft, setDraft] = useState<string | null>(null);
  const [invalidReason, setInvalidReason] = useState<DatePickerInvalidReason | null>(null);
  const text = draft ?? fieldText;

  // A value that changes from outside — a calendar pick, or the parent —
  // replaces whatever was mid-typed. Adjusted during render, React's
  // documented pattern for state that follows a changed prop, so a stale
  // draft never paints.
  const [seenValue, setSeenValue] = useState(isoValue);
  if (isoValue !== seenValue) {
    setSeenValue(isoValue);
    setDraft(null);
    setInvalidReason(null);
  }

  // The field's text when an IME composition began, or null outside one. The
  // mask waits for the composition to end: rewriting the value mid-way would
  // fight the IME for the same characters.
  const composingFrom = useRef<string | null>(null);

  /**
   * Ends in exactly one call: `onSelect` with a value, `onSelect(null)` for an
   * emptied field, or `onInvalid` with a reason. A caller clears its message
   * in the first two and writes it in the third, and needs nothing else.
   */
  function evaluate(current: string) {
    const digits = normaliseDigits(current);
    if (digits === '') {
      setDraft(null);
      setInvalidReason(null);
      onSelect?.(null);
      return;
    }
    const result = readValue(digits, shape, mode, { min, max, isDateUnavailable });
    if ('reason' in result) {
      // The text stays as typed and the value stays as it was: the user knows
      // more about what they meant than the reader does.
      setInvalidReason(result.reason);
      onInvalid?.(current, result.reason);
      return;
    }
    setDraft(null);
    setInvalidReason(null);
    // Called even when the value is unchanged, so a caller's error message
    // clears when a mistyped date is corrected back to the one it held.
    onSelect?.(result.value);
  }

  /**
   * Rebuilds the field from its digits after any edit — typing, a paste, a
   * deletion, autofill, the end of a composition — instead of intercepting
   * keys, which Android keyboards report as `Unidentified`. See invariant 18.
   */
  function edit(input: HTMLInputElement, previous: string, inputType: string | undefined) {
    const raw = input.value;
    const selection = input.selectionStart ?? raw.length;
    const previousDigits = normaliseDigits(previous);
    let digits = normaliseDigits(replaceWholeIso(raw, shape));
    let before = normaliseDigits(raw.slice(0, selection)).length;

    // The edit removed a separator and no digit. Putting the separator back
    // would make the key do nothing, so the digit beside it goes instead.
    if (digits === previousDigits && raw.length < previous.length) {
      if (inputType === 'deleteContentBackward' && before > 0) {
        digits = digits.slice(0, before - 1) + digits.slice(before);
        before -= 1;
      } else if (inputType === 'deleteContentForward') {
        digits = digits.slice(0, before) + digits.slice(before + 1);
      }
    }

    const masked = applyMask(digits, shape, mode, insertedRange(previousDigits, digits));

    // A rejected edit leaves the text as it was, with the caret back where the
    // edit began. React restores a controlled input's value after this handler
    // returns, which would put the caret at the end, so it is placed in a
    // microtask, after that.
    const caret = masked
      ? caretIndex(masked.text, masked.acceptedAfter[Math.min(before, digits.length)]!)
      : Math.max(0, selection - (raw.length - previous.length));
    queueMicrotask(() => {
      if (document.activeElement === input) input.setSelectionRange(caret, caret);
    });

    if (!masked || masked.text === previous) return;
    setDraft(masked.text);
    if (masked.digits.length === digitsFor(mode)) evaluate(masked.text);
  }

  function close({ restoreFocus = true } = {}) {
    panelRef.current?.hidePopover();
    if (restoreFocus) triggerRef.current?.focus();
  }

  // Dismiss on a pointer press outside. `pointerdown` and not `click`, so a
  // press that starts outside and ends inside cannot resurrect the panel.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        close({ restoreFocus: false });
      }
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  // Dismiss when focus leaves the subtree entirely — a screen reader's
  // virtual cursor, or a Tab that escapes despite the trap below. A null
  // `relatedTarget` (a press on non-focusable panel text, or a pagination
  // button disabling itself under focus) must NOT close: outside pointer
  // presses are already covered by the listener above, and closing here too
  // would fight it. Focus is not restored to the trigger — wherever the user
  // or the assistive tech sent focus is where it should stay.
  function handleWrapperBlur(event: FocusEvent<HTMLDivElement>) {
    if (!open) return;
    const next = event.relatedTarget;
    if (next && !wrapperRef.current?.contains(next)) {
      close({ restoreFocus: false });
    }
  }

  // Escape and Tab both need the panel element and the keyboard event, so one
  // handler covers both rather than two separate listeners.
  function handlePanelKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      // Calendar stops propagation when it has a pending range start, so the
      // first Escape drops that and only the second reaches here.
      event.stopPropagation();
      close();
      return;
    }

    if (event.key !== 'Tab') return;

    // The dialog's tabbables, in DOM order: enabled buttons that are not
    // roving-tabindex losers. In practice that is Previous, Next — both in
    // the header, outside the table — and the grid's one tab stop.
    const tabbables = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>('button'),
    ).filter((button) => !button.disabled && button.tabIndex !== -1);
    if (tabbables.length === 0) return;

    const first = tabbables[0]!;
    const last = tabbables[tabbables.length - 1]!;

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div className={styles.wrapper} ref={wrapperRef} onBlur={handleWrapperBlur}>
      <div
        className={[
          control.control,
          control[size],
          isInvalid && control.invalid,
          disabled && control.disabled,
          readOnly && control.readOnly,
        ]
          .filter(Boolean)
          .join(' ')}
        style={{ anchorName: anchor }}
      >
        <input
          type="hidden"
          name={name}
          value={isoValue}
          // A disabled control submits nothing, as a disabled input would.
          disabled={disabled}
        />
        <input
          id={controlId}
          className={control.field}
          type="text"
          // A numeric keypad on a phone. Not type="number", which takes `e`
          // and `-`, steps with the arrow keys, and has no room for a separator.
          inputMode="numeric"
          // The browser's autofill knows nothing of this mask.
          autoComplete="off"
          value={text}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          aria-invalid={isInvalid || invalidReason !== null || undefined}
          aria-describedby={describedBy}
          // Inside a Field the label element already names the input; adding
          // this too would give it a redundant accessible name. A bare
          // DatePicker has no such label, so it names itself.
          aria-label={field ? undefined : label}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            if (composingFrom.current !== null) {
              setDraft(event.target.value);
              return;
            }
            edit(event.target, text, (event.nativeEvent as InputEvent).inputType);
          }}
          onCompositionStart={() => {
            composingFrom.current = text;
          }}
          onCompositionEnd={(event: CompositionEvent<HTMLInputElement>) => {
            const previous = composingFrom.current ?? text;
            composingFrom.current = null;
            edit(event.currentTarget, previous, 'insertCompositionText');
          }}
          onBlur={() => {
            if (draft !== null) evaluate(draft);
          }}
          onKeyDown={(event) => {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            if (draft !== null) evaluate(draft);
          }}
        />
        <button
          type="button"
          ref={triggerRef}
          className={styles.trigger}
          // The name confirms the value, so a screen reader user does not have
          // to read the field to know what is in it. Always the long form,
          // even while the field itself holds an uncommitted draft.
          aria-label={spokenText ? `Change date, ${spokenText}` : 'Choose date'}
          aria-expanded={open}
          // The panel is always in the DOM, so this does not depend on `open`.
          aria-controls={panelId}
          disabled={disabled || readOnly}
          // Only once hydrated. Before that, a native popovertarget would open
          // the panel while React is not listening: `open` would stay false,
          // the Calendar unmounted, and the panel empty until two more clicks.
          popoverTarget={hydrated ? panelId : undefined}
        >
          <CalendarIcon />
        </button>
      </div>

      {/*
       * `manual`, not `auto`: dismissal stays in this component's own tested
       * handlers (Esc — including the range-mode layering where the first
       * Esc only cancels a pending start — a pointer press outside, and focus
       * leaving the subtree). With `auto` the Esc layering would depend on
       * the platform's close request, which jsdom cannot run and which a
       * browser automation tool cannot send either.
       */}
      <div
        id={panelId}
        popover="manual"
        role="dialog"
        aria-modal="true"
        aria-label={label}
        ref={panelRef}
        className={styles.panel}
        style={{ '--picker-anchor': anchor } as CSSProperties}
        onKeyDown={handlePanelKeyDown}
        // `beforetoggle`, not `toggle`: the platform fires it synchronously,
        // before the panel shows. `toggle` is queued as a task, so the panel
        // could paint empty for a frame before the Calendar mounted.
        onBeforeToggle={(event: ToggleEvent) => setOpen(event.newState === 'open')}
        // A popover moves focus only to an element carrying `autofocus`, so a
        // panel opened by a click has to place it itself: the day grid's
        // roving tab stop. That has to wait for `toggle` rather than run from
        // the `beforetoggle` state update above — that update's effects can
        // commit, focusing a button, before the platform has shown the panel,
        // and focus() on a still-hidden element is a no-op.
        onToggle={(event: ToggleEvent) => {
          if (event.newState !== 'open') return;
          panelRef.current
            ?.querySelector<HTMLButtonElement>('[role="grid"] button[tabindex="0"]')
            ?.focus();
        }}
      >
        {/* Mounted only while open. Kept mounted in the hidden panel, the
            build month reached the server HTML of a picker with no value, a
            closed picker reopened on the month it was left on rather than
            its current value, and a hidden grid re-rendered on every
            keystroke. Unmounting on close is also what discards a pending
            range start. */}
        {open && (
          <Calendar
            {...calendar}
            label={label}
            mode={mode}
            value={value}
            locale={locale}
            min={min}
            max={max}
            isDateUnavailable={isDateUnavailable}
            onSelect={(next) => {
              // A calendar pick always wins over whatever was mid-typed: the
              // draft it replaces, and any invalid state attached to it.
              setDraft(null);
              setInvalidReason(null);
              onSelect?.(next);
              // Calendar reports only a finished choice — a single date, or a
              // range with both ends — so every report closes the panel.
              close();
            }}
          />
        )}
      </div>
    </div>
  );
}
```

Before replacing the file, compare its comments with the ones Task 1 and the fix wave left in the current `DatePicker.tsx`, around the panel, the trigger and the hidden input. Where the current wording differs only in phrasing, keep the current wording. The behaviour must match the code above exactly.

- [ ] **Step 4: Export the reason type**
  - In `src/components/DatePicker/index.ts`, change the type export to: `export type { DatePickerProps, DatePickerSize, DatePickerInvalidReason } from './DatePicker';`
  - In `src/index.ts`, change the DatePicker type export to: `export type { DatePickerProps, DatePickerSize, DatePickerInvalidReason } from './components/DatePicker/index';`

- [ ] **Step 5: Remove the free-text helpers**
  - **In `src/components/Calendar/date.ts`**, delete everything from `export type Segment = 'year' | 'month' | 'day';` down to the end of `parseTyped` (its closing `}`). That covers `segmentOrder`, `WIDTH`, `placeholderFor`, `formatTyped`, `parseTyped` and their doc comments. Keep `monthGrid` and everything else.
  - **In `src/components/Calendar/Calendar.test.tsx`**, delete the whole `describe('typed dates', …)` block. Remove `formatTyped,`, `parseTyped,`, `placeholderFor,` and `segmentOrder,` from the `./date` import.
  - **Then check nothing else uses them.** Run `grep -rn -E "segmentOrder|formatTyped|parseTyped|onParseError" src` and expect no output.

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx vitest run src/components/DatePicker src/components/Calendar && TZ=America/Los_Angeles npx vitest run src/components/DatePicker`
Expected: PASS. The existing DatePicker tests pass unchanged, apart from the ones Step 1 replaced.

- [ ] **Step 7: Gate and commit**

Run: `npm run check`
Expected: typecheck clean, all tests green. `app/date-picker/page.tsx` still lists `onParseError` as a string in a props table; that is data, not a type, and Task 5 replaces it.

```bash
git add src/components/DatePicker/DatePicker.tsx src/components/DatePicker/DatePicker.test.tsx src/components/DatePicker/index.ts src/index.ts src/components/Calendar/date.ts src/components/Calendar/Calendar.test.tsx
git commit -m "Mask the date field as it is typed, and report why a typed date is refused

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: Draw the rest of the format, and describe the mask in words

**Files:**
- Modify: `src/components/DatePicker/DatePicker.tsx`
- Modify: `src/components/DatePicker/DatePicker.module.css`
- Modify: `src/components/DatePicker/DatePicker.test.tsx`:
  - the test `'lets an explicit aria-describedby win over the Field'`;
  - the test `'takes its placeholder from the locale, compact, with its separator'`;
  - a new `describe`.

**Interfaces:**
- Consumes: `hintFor`, `placeholderFor` and `formatValue` from `mask.ts`, and the Task 3 `DatePicker.tsx`.
- Produces: the CSS Module classes `styles.entry`, `styles.shell` and `styles.typed`, and the global `ap-sr-only` class on the hint element.

- [ ] **Step 1: Write the failing tests.** In `DatePicker.test.tsx`, add `import styles from './DatePicker.module.css';` after the `calendarStyles` import.

In `'lets an explicit aria-describedby win over the Field'`, replace the assertion with:

```tsx
    expect(screen.getByRole('textbox')).toHaveAccessibleDescription(
      'From the caller. Type digits only, as month, day, year. Separators are added for you.',
    );
```

Replace the test `'takes its placeholder from the locale, compact, with its separator'` with:

```tsx
  it('takes its native placeholder from the locale when it cannot be typed into', () => {
    render(<DatePicker label="Data" locale="de-DE" readOnly />);
    expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', 'DD.MM.YYYY');
  });
```

Append this block at the end of the file:

```tsx
describe('DatePicker mask shell and hint', () => {
  const shellOf = (container: HTMLElement) =>
    container.querySelector<HTMLElement>(`.${styles.shell!}`);

  it('draws the rest of the format behind what has been typed', async () => {
    const { container } = render(<DatePicker label="Data" locale="pt-PT" />);
    await userEvent.type(screen.getByRole('textbox'), '120');
    const shell = shellOf(container)!;
    expect(shell).toHaveAttribute('aria-hidden', 'true');
    expect(shell).toHaveTextContent('12/0M/YYYY');
    expect(shell.lastChild?.textContent).toBe('M/YYYY');
  });

  it('shows the whole format in an empty field, instead of a native placeholder', () => {
    const { container } = render(<DatePicker label="Data" locale="de-DE" />);
    expect(shellOf(container)).toHaveTextContent('DD.MM.YYYY');
    expect(screen.getByRole('textbox')).not.toHaveAttribute('placeholder');
  });

  it('draws no shell once the format is complete', () => {
    const { container } = render(<DatePicker label="Data" value="2023-04-26" />);
    expect(shellOf(container)).toBeNull();
  });

  it('uses the native placeholder, with no shell and no hint, when read-only or disabled', () => {
    const { container, rerender } = render(<DatePicker label="Data" readOnly />);
    expect(shellOf(container)).toBeNull();
    expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', 'MM/DD/YYYY');
    expect(screen.getByRole('textbox')).not.toHaveAccessibleDescription();

    rerender(<DatePicker label="Data" disabled />);
    expect(shellOf(container)).toBeNull();
    expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', 'MM/DD/YYYY');
  });

  it("describes the mask in words, after the Field's own description", () => {
    render(
      <Field label="Data" description="From the Field.">
        <DatePicker label="Data" locale="pt-PT" />
      </Field>,
    );
    expect(screen.getByRole('textbox')).toHaveAccessibleDescription(
      'From the Field. Type digits only, as day, month, year. Separators are added for you.',
    );
  });

  it('tells a range how to type its end', () => {
    render(<DatePicker label="Stay" mode="range" />);
    expect(screen.getByRole('textbox')).toHaveAccessibleDescription(
      'Type digits only, as month, day, year. Separators are added for you. Then the end date the same way.',
    );
  });

  it('hides the shell while an IME composition is under way', () => {
    const { container } = render(<DatePicker label="Data" locale="pt-PT" />);
    const input = screen.getByRole('textbox');
    fireEvent.compositionStart(input);
    expect(shellOf(container)).toBeNull();
    fireEvent.compositionEnd(input);
    expect(shellOf(container)).not.toBeNull();
  });

  it('paints the shell from the placeholder token, out of the pointer’s way, with the typed part invisible', () => {
    const css = stylesheet();
    expect(css).toMatch(/\.shell\s*\{[^}]*color:\s*var\(--ap-color-text-placeholder\)/);
    expect(css).toMatch(/\.shell\s*\{[^}]*pointer-events:\s*none/);
    expect(css).toMatch(/\.shell\s*\{[^}]*white-space:\s*pre/);
    expect(css).toMatch(/\.typed\s*\{[^}]*visibility:\s*hidden/);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/components/DatePicker/DatePicker.test.tsx`
Expected: FAIL. There is no shell element, the placeholder attribute is still present on an editable field, the description lacks the hint, and the stylesheet has no `.shell`.

- [ ] **Step 3: Implement in `DatePicker.tsx`**
  - Change the React import to `import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';`.
  - Add `hintFor,` to the `./mask` import, in alphabetical order after `formatValue,`.
  - Directly after `const text = draft ?? fieldText;`, add:

```tsx
  const editable = !disabled && !readOnly;
  const hint = hintFor(shape, mode);
  const hintId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [composing, setComposing] = useState(false);

  // A field too narrow for its text scrolls it, and a shell drawn behind a
  // scrolled input would sit misaligned — so it is not drawn then. Measured
  // after every change of text.
  const [overflowing, setOverflowing] = useState(false);
  useLayoutEffect(() => {
    const input = inputRef.current;
    if (input) setOverflowing(input.scrollWidth > input.clientWidth);
  }, [text]);

  // The part of the format still to type. Every formatted character lines up
  // with one placeholder character, so what is left is the placeholder past
  // the text's length. Not drawn mid-composition, when the text is the IME's.
  const remainder =
    editable && !composing && !overflowing ? placeholder.slice(text.length) : '';
```

Wrap the visible text `<input>` in an entry span that holds the shell, and change its `ref`, `placeholder`, `aria-describedby` and composition handlers. The visible input block becomes:

```tsx
        <span className={styles.entry}>
          {remainder && (
            <span className={styles.shell} aria-hidden="true">
              <span className={styles.typed}>{text}</span>
              {remainder}
            </span>
          )}
          <input
            ref={inputRef}
            id={controlId}
            className={control.field}
            type="text"
            // A numeric keypad on a phone. Not type="number", which takes `e`
            // and `-`, steps with the arrow keys, and has no room for a separator.
            inputMode="numeric"
            // The browser's autofill knows nothing of this mask.
            autoComplete="off"
            value={text}
            // The shell draws the format while the field can be typed into;
            // the native placeholder is the fallback when it cannot.
            placeholder={editable ? undefined : placeholder}
            disabled={disabled}
            readOnly={readOnly}
            required={required}
            aria-invalid={isInvalid || invalidReason !== null || undefined}
            // The Field's description and error first, then how to type.
            aria-describedby={
              [describedBy, editable ? hintId : null].filter(Boolean).join(' ') || undefined
            }
            // Inside a Field the label element already names the input; adding
            // this too would give it a redundant accessible name. A bare
            // DatePicker has no such label, so it names itself.
            aria-label={field ? undefined : label}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              if (composingFrom.current !== null) {
                setDraft(event.target.value);
                return;
              }
              edit(event.target, text, (event.nativeEvent as InputEvent).inputType);
            }}
            onCompositionStart={() => {
              composingFrom.current = text;
              setComposing(true);
            }}
            onCompositionEnd={(event: CompositionEvent<HTMLInputElement>) => {
              const previous = composingFrom.current ?? text;
              composingFrom.current = null;
              setComposing(false);
              edit(event.currentTarget, previous, 'insertCompositionText');
            }}
            onBlur={() => {
              if (draft !== null) evaluate(draft);
            }}
            onKeyDown={(event) => {
              if (event.key !== 'Enter') return;
              event.preventDefault();
              if (draft !== null) evaluate(draft);
            }}
          />
        </span>
```

Directly after the closing `</div>` of the control box, before the `{/* manual, not auto … */}` comment, add:

```tsx
      {editable && (
        // In words, because a screen reader reads "DD/MM/YYYY" letter by
        // letter. A digit the mask refuses is silent — announcing each one
        // would talk over the reader's own echo of the key — so this states
        // the rule before anyone meets it.
        <span id={hintId} className="ap-sr-only">
          {hint}
        </span>
      )}
```

- [ ] **Step 4: Add the styles to `DatePicker.module.css`.** Insert them after the `.trigger:disabled` rule and before the `.panel` comment:

```css
/* --- the typed field ------------------------------------------------------ */

/* The input and the shell behind it share one box, so the shell's text starts
   exactly where the input's own does: both inherit the control's font, size
   and tracking, and neither has padding. */
.entry {
  position: relative;
  display: flex;
  flex: 1;
  min-width: 0;
}

/* Above the shell. The input's background is already none, so the shell
   shows through it. */
.entry input {
  position: relative;
}

/* The format still to type. text/placeholder, exactly as Input's placeholder,
   so it carries that token's measured values and adds no new obligation. It
   stands in for the native placeholder while the field is editable, and
   `pre` keeps the spaces of the range's " – ". */
.shell {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  overflow: hidden;
  white-space: pre;
  pointer-events: none;
  color: var(--ap-color-text-placeholder);
}

/* What has been typed, invisible: it only reserves the width the input's
   text takes, so the remainder lines up after it. */
.typed {
  visibility: hidden;
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run src/components/DatePicker && TZ=America/Los_Angeles npx vitest run src/components/DatePicker`
Expected: PASS. The existing stylesheet test `'carries no colour literal, no primitive token, …'` still passes.

- [ ] **Step 6: Gate and commit**

Run: `npm run check`
Expected: all green.

```bash
git add src/components/DatePicker/DatePicker.tsx src/components/DatePicker/DatePicker.module.css src/components/DatePicker/DatePicker.test.tsx
git commit -m "Draw the rest of the date format behind the typed text, and describe the mask in words

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5: Document the mask: docs page, spec pointers, MEMORY

**Files:**
- Modify: `app/date-picker/page.tsx`
- Modify: `docs/superpowers/specs/2026-09-10-date-picker-design.md`
- Modify: `MEMORY.md`

**Interfaces:**
- Consumes: `DatePickerInvalidReason` from `@/components/DatePicker`, plus the `onInvalid` prop and its behaviour from Tasks 3–4.
- Produces: documentation only.

- [ ] **Step 1: Write the failing check.** This task has no unit tests. Its gate is the build plus source checks. Run:

```bash
grep -n "onParseError\|04 / 26 / 2023\|read-only\. ISO" app/date-picker/page.tsx
```

Expected: matches on the props-table row, the alias paragraph and the range read-only paragraph. They are the stale text this task removes.

- [ ] **Step 2: Update imports, constants and state in `app/date-picker/page.tsx`**

After `import { DatePicker } from '@/components/DatePicker';`, add:

```tsx
import type { DatePickerInvalidReason } from '@/components/DatePicker';
```

In `DATE_PICKER_PROPS`, replace the `onParseError` row with:

```tsx
  {
    prop: 'onInvalid',
    type: '(raw: string, reason: DatePickerInvalidReason) => void',
    default: '— (reason: incomplete | not-a-date | before-min | after-max | unavailable)',
  },
```

After the `isWeekend` function, add:

```tsx
/** The messages the "Typing a date" specimen writes into its Field. The picker
    reports a reason; the words are the page's, because only the page knows
    what the field is called and why a day is unavailable. */
const TYPED_MESSAGES: Record<DatePickerInvalidReason, string> = {
  incomplete: 'Appointment date must include a day, month and year',
  'not-a-date': 'Appointment date must be a real date',
  'before-min': 'Appointment date must be on or after April 3, 2023',
  'after-max': 'Appointment date must be on or before April 24, 2023',
  unavailable: 'Appointment date must be a weekday',
};

type MessageRow = { reason: DatePickerInvalidReason; message: string };

const MESSAGE_ROWS: MessageRow[] = (Object.keys(TYPED_MESSAGES) as DatePickerInvalidReason[]).map(
  (reason) => ({ reason, message: TYPED_MESSAGES[reason] }),
);
```

Inside `Page()`, after `const [large, setLarge] = …;`, add:

```tsx
  const [typed, setTyped] = useState<ISODate | null>(null);
  const [typedError, setTypedError] = useState<string | null>(null);
  // One value across three locales, on purpose: typing in any of the fields
  // moves the other two, the quickest way to see the order and separator change.
  const [sample, setSample] = useState<ISODate | null>('2023-04-26');
```

- [ ] **Step 3: Update the prose and specimens in `page.tsx`**

In the paragraph under the Field specimen, change `<code>04 / 26 / 2023</code>` to `<code>04/26/2023</code>`.

Replace everything from `<h2>Typing a date</h2>` up to, but not including, `<h2>Accessibility</h2>` with:

```tsx
      <h2>Typing a date</h2>
      <p>
        The field is one masked input. Type digits only: the separator appears as each part is
        complete, a first digit that cannot start its part gains a leading zero (a month of{' '}
        <code>4</code> becomes <code>04</code>), and a digit that would make a part impossible (a
        month of <code>13</code>) is not taken. Pasting, autofill and deleting in the middle all go
        through the same rebuild from the digits, and a deletion is never refused. ISO (
        <code>2023-04-26</code>) is read when it arrives whole — pasted or autofilled — in any
        locale.
      </p>
      <div className="specimen">
        <div className="specimenRow">
          {(['en-US', 'pt-PT', 'de-DE'] as const).map((locale) => (
            <div key={locale} style={{ minWidth: 200 }}>
              <Field label={locale}>
                <DatePicker
                  label={locale}
                  locale={locale}
                  value={sample}
                  onSelect={(next) => setSample(next as ISODate | null)}
                />
              </Field>
            </div>
          ))}
        </div>
      </div>
      <p>
        The field checks a date when its last digit is in, on blur and on Enter — never half way,
        since half a date is unfinished rather than wrong. Each check ends in exactly one call:{' '}
        <code>onSelect</code> with the date (or <code>null</code> for an emptied field), or{' '}
        <code>onInvalid</code> with a reason. Refused text stays as typed and the previous value
        stays intact. The picker never writes the message: the caller does, into the{' '}
        <code>Field</code>&rsquo;s <code>error</code>, because only the caller knows what the
        field is called and why a day is unavailable.
      </p>
      <div className="specimen">
        <div style={{ maxWidth: 320 }}>
          <Field
            label="Appointment date"
            description="A weekday from April 3 to April 24, 2023."
            error={typedError ?? undefined}
          >
            <DatePicker
              label="Appointment date"
              defaultMonth="2023-04-01"
              min="2023-04-03"
              max="2023-04-24"
              isDateUnavailable={isWeekend}
              value={typed}
              onSelect={(next) => {
                setTyped(next as ISODate | null);
                setTypedError(null);
              }}
              onInvalid={(_raw, reason) => setTypedError(TYPED_MESSAGES[reason])}
            />
          </Field>
        </div>
      </div>
      <div className="tableScroll">
        <Table
          caption="Reasons, and the messages this page writes for them"
          density="compact"
          columns={[
            { key: 'reason', header: 'Reason', primary: true, cell: (r: MessageRow) => <code>{r.reason}</code> },
            { key: 'message', header: 'Message', cell: (r: MessageRow) => r.message },
          ]}
          rows={MESSAGE_ROWS}
          getRowId={(r) => r.reason}
        />
      </div>
      <p>
        In range mode the field takes both dates: sixteen digits, joined by an en dash after the
        first eight, and a pair typed in reverse is put in order, as the calendar would.
      </p>

```

In the Accessibility section, after the paragraph that starts `The trigger names itself`, add:

```tsx
      <p>
        The field describes its mask in words — <em>&ldquo;Type digits only, as month, day, year.
        Separators are added for you.&rdquo;</em> — through <code>aria-describedby</code>, after the{' '}
        <code>Field</code>&rsquo;s own description and error, because a screen reader reads{' '}
        <code>MM/DD/YYYY</code> letter by letter. A digit the mask refuses makes no sound:
        announcing each one would talk over the reader&rsquo;s own echo of the key, so the rule is
        stated before anyone meets it. The format still to type is drawn behind the text in{' '}
        <code>text/placeholder</code>, hidden from the accessibility tree.
      </p>
```

Nothing on the page may claim that a check was done by hand or in a real browser.

- [ ] **Step 4: Point the original spec at the mask design.** In `docs/superpowers/specs/2026-09-10-date-picker-design.md`, make three edits.

**(a)** In the `DatePickerProps` code block, replace:

```
  /** Fires when the text field produces a date the parser rejects. */
  onParseError?: (raw: string) => void;
```

with:

```
  /** See the input-mask design: fires when an evaluation finds the typed text is not a date this picker accepts. */
  onInvalid?: (raw: string, reason: DatePickerInvalidReason) => void;
```

**(b)** Directly before the paragraph that begins `**The text field is free text, not a segmented field,`, insert:

```
> **Amended 2026-09-10.** The field is now one masked input, not free text —
> see [`2026-09-10-date-picker-input-mask-design.md`](2026-09-10-date-picker-input-mask-design.md).
> The case below against `<input type="date">` and the segmented field still
> stands; the free-text parse does not, and ISO is read when it arrives whole
> rather than key by key.

```

**(c)** Replace the paragraph that begins `**A field whose text does not parse.**` (through `…about their intent than the parser does.`) with:

```
**A field whose text does not parse.** Superseded by the input-mask design,
§"When it evaluates, and what it emits": the field evaluates when a complete
date is typed, on blur and on Enter; refused text stays in the field with
`aria-invalid`, the previous value stays intact, and `onInvalid(raw, reason)`
reports why.
```

- [ ] **Step 5: Record the invariant in `MEMORY.md`**

After invariant 17, add:

```
18. **The date field's mask rebuilds from digits and never intercepts keys.**
    Every edit — typing, a paste, autofill, a deletion in the middle, the end
    of an IME composition — goes through `edit` in `DatePicker.tsx`, which
    extracts the digits, runs `applyMask` from `mask.ts`, and puts the caret
    back by digit count. Handling `keydown` looks like a simplification and
    breaks paste, autofill, IME and Android, whose keyboards report
    `Unidentified`. Two more rules only look inconsistent: an insertion is
    checked and rejected whole while a deletion is never refused (checking
    deletions "for consistency" traps Backspace), and a Backspace that only
    removed a separator removes the digit beside it instead.
```

In the Verification block, set the test count and file count to what `npx vitest run` reports.

- [ ] **Step 6: Verify**

Run:

```bash
npm run check
TZ=America/Los_Angeles npx vitest run src/components/Calendar src/components/DatePicker src/components/DropdownMenu
npm run build:docs
grep -c "September 2026" out/date-picker/index.html
grep -rn "onParseError" src app
grep -rniE "$ORIGINAL_NAMES" src app docs MEMORY.md README.md   # the names live outside the repository
git status --short src/styles
```

Expected:
- the check and the LA-timezone run are green;
- `build:docs` succeeds;
- the grep for "September 2026" prints `0`;
- both greps print nothing (`ORIGINAL_NAMES` holds the original product names, kept outside the repository);
- `src/styles` shows no changes.

- [ ] **Step 7: Commit**

```bash
git add app/date-picker/page.tsx docs/superpowers/specs/2026-09-10-date-picker-design.md MEMORY.md
git commit -m "Document the masked date field: typing, reasons and messages, and the invariant behind the rebuild

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```
