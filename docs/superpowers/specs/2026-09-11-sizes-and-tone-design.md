# Sizes and tone — design

Two prop vocabularies, settled before the package is first published, because
both break the public API and a `0.x` release should not start by breaking it.

## Why now

`MEMORY.md` listed both as open work. Reading the code changed what each
problem actually is.

**Sizes.** The open item said a large input cannot line up with its checkbox.
It can: a field's `size` changes the box's height and padding, never its text,
and the checkbox centres itself on the first line of text. The real defect is
that `'sm' | 'md' | 'lg'` is declared five times and means two different
things — control heights of 32, 40 and 48px in `Button`, `Input`, `Select` and
`DatePicker`, and diameters of 16, 24 and 32px in `Loader` — and that the
heights shared by `Button` and the control box are literals in two
stylesheets with nothing holding them together.

**Tone.** Four unions, with two names that mean something else: the menu's
`default` is everyone else's `neutral`, and the Loader's `onFill` is not a tone
at all but "take the colour of the text around you". The unions differ for good
reasons — which tokens exist, which pairs pass contrast — but nothing in the
types says which reasons, so nothing stops a union from promising a tone no
token can paint.

## Scope

**In.** A shared `ControlSize` type and a test that the heights agree. A shared
`Tone` vocabulary, two ceilings derived from `theme.ts`, an explicit list per
component checked against its ceiling by the compiler and against its
stylesheet by a test. Two renames. Correcting a reason that has gone stale in
three places.

**Out, deliberately.**

- **Sizes for `Checkbox`, `Radio`, `Switch`, `Textarea`, `Field`.** They are one
  size on purpose (`choice.module.css`: a box that changes size stops aligning
  in a dense table; `Textarea.tsx`: drawn with one). Decided 2026-09-11.
- **Unifying `LoaderSize`, `BadgeSize`, `AvatarSize`.** Each measures something
  different; one name for all of them is the confusion being removed.
- **Control heights as scale tokens.** They would need a Figma variable; a test
  gives the same guarantee without it.
- **Outline and ghost `success`.** Now possible (see §3), but never drawn. It
  stays excluded as a design decision until someone draws it.
- **A docs page for the vocabulary.** The types carry it; the Button page
  already explains the one exclusion a reader meets.

---

## 1. Sizes

### 1.1 `ControlSize`

```ts
// src/components/vocabulary.ts
/** The height of a control: 32, 40 or 48px. Shared by Button and the control box. */
export type ControlSize = 'sm' | 'md' | 'lg';
```

`Button`, `Input`, `Select` and `DatePicker` take `size?: ControlSize`.
`ButtonSize`, `InputSize`, `SelectSize` and `DatePickerSize` are removed, from
their components and from `src/index.ts`, which exports `ControlSize` instead.
Nothing outside the repository consumes them yet. `LoaderSize`, `BadgeSize`
and `AvatarSize` are unchanged.

### 1.2 The heights agree

`Button.module.css` sets `height` on `.sm`, `.md`, `.lg`; `control.module.css`
sets `min-height` on the same three classes. A test reads both stylesheets
(`readCss` and `block` from `src/test/css.ts`) and fails if the pixel values for
any size differ.

**The break it catches:** someone retunes one file's heights. A `lg` button
then stops lining up with a `lg` field beside it, which nothing else in the
suite would notice. Proven by changing one value and watching it fail.

---

## 2. Tone

### 2.1 The vocabulary

```ts
// src/components/vocabulary.ts
export type Tone = 'neutral' | 'accent' | 'tertiary' | 'success' | 'warning' | 'danger' | 'info';
```

Seven names, the union of what the components use today after the two
renames. No component accepts all seven.

### 2.2 Two ceilings, derived from `theme.ts`

A ceiling is the set of tones the tokens *can* paint in a given way. It is a
type computed from `ThemeTokenName`, so a token added to `theme.ts` raises it
without anyone editing it.

| Ceiling | A tone is in it when the theme has | Today |
|---|---|---|
| `FillTone` | `interactive/<t>`, `interactive/<t>-hover`, `interactive/<t>-pressed`, `interactive/on-<t>` | accent, neutral, tertiary, success, danger |
| `TintTone` | `surface/<t>-subtle` and `text/<t>` — plus `neutral`, which uses `surface/sunken` and `text/primary` | neutral, accent, success, warning, danger, info |

**Why a tone's text colour is read from its tinted pair, not from `text/<t>`
alone.** `text/primary`, `text/secondary` and `text/tertiary` are levels of the
text hierarchy. Derived from the name alone, the `tertiary` tone would appear
to have a text colour — and it would be a grey. The pair rules that collision
out: there is no `surface/tertiary-subtle`. A throwaway type probe confirmed
both ceilings resolve to the sets above, and that `'warning'` and `'info'` are
refused as `FillTone` and `'tertiary'` as `TintTone`.

### 2.3 Explicit lists within the ceilings

A ceiling says what is possible; each component decides what it offers. Deriving
the lists as well was considered and rejected: today it would silently give the
Loader `warning` and `info`, and menu rows `success`, `warning` and `info` — the
unrequested growth invariant 7 warns about — and a tone the type accepts is
still unstyled until its stylesheet paints it.

Each list is a runtime array, so a test can read it, checked at compile time
against its ceiling:

```ts
export const badgeTones = ['neutral', 'accent', 'success', 'warning', 'danger', 'info'] as const satisfies readonly TintTone[];
export type BadgeTone = (typeof badgeTones)[number];
```

| Component | List | Ceiling |
|---|---|---|
| `Button`, `variant="solid"` | accent, neutral, tertiary, success, danger | `FillTone` |
| `Button`, `variant="outline" \| "ghost"` | accent, neutral, danger | `TintTone` |
| `Badge` | neutral, accent, success, warning, danger, info | `TintTone` |
| `Loader` | accent, neutral, success, danger — and `currentColor` | `TintTone` |
| `DropdownMenu` row | neutral, accent, danger | `TintTone` |

`currentColor` sits outside the ceiling on purpose: it is not a tone but the
absence of one, used by `Button` for its spinner. The Loader's type is its list
plus that literal.

The Button's variant union keeps its current shape — outline and ghost do not
accept `tertiary`, and that still fails to compile — but its members now come
from the two lists.

### 2.4 Renames

| Where | Before | After |
|---|---|---|
| `DropdownMenuAction.tone` | `'default'` | `'neutral'` |
| `Loader` `tone` | `'onFill'` | `'currentColor'` |

The CSS classes follow (`.onFill` becomes `.currentColor`; the menu's neutral
row keeps the base `.item` style and has no tone class). `Button.tsx` passes
`tone="currentColor"` to its spinner.

### 2.5 Every listed tone is painted

A test reads each component's stylesheet and fails if a tone in its list has no
rule: `.solid.<t>` for solid Button tones, `.outline.<t>` and `.ghost.<t>` for
the others, `.<t>` for Badge and Loader, `.<t>` for menu rows except `neutral`,
which is the row's base style.

**The break it catches:** a tone added to a list — the step a new token
invites — without its CSS. The component would render that tone unstyled and
every other test would pass.

---

## 3. A stale reason, corrected

Invariant 3 says `tertiary` and `success` are solid-only because "there is no
compliant text or border colour for either". That is still true of `tertiary`.
It is no longer true of `success`: `text/success` and `border/success` were
added for field validation, and measure, in light:

| | on `surface/base` | on `surface/raised` | needs |
|---|---|---|---|
| `text/success` | 5.80:1 | 6.18:1 | 4.5:1 |
| `border/success` | 3.08:1 | 3.28:1 | 3:1 |

So outline and ghost `success` are now possible, and excluded only because
they were never drawn. The reason is corrected, the exclusion kept, in three
places that state it:

- `src/components/Button/Button.tsx` — the comment above `VariantProps`.
- `app/button/page.tsx` — the "solid-only" note on the public Button page.
- `MEMORY.md` — invariant 3.

---

## 4. `MEMORY.md`

- Open work §2 (sizing) and §3 (tone) are removed. Their outcome moves to
  Conventions as two entries: control sizes share `ControlSize` and the height
  test; tones are chosen within token-derived ceilings, including the
  `text/tertiary` collision.
- Invariant 3 is reworded as in §3.
- The test count in Verification is updated.

## 5. Files

| File | Change |
|---|---|
| `src/components/vocabulary.ts` | new: `ControlSize`, `Tone`, `FillTone`, `TintTone` |
| `src/components/vocabulary.test.ts` | new: heights agree; every listed tone is painted |
| `src/components/{Button,Input,Select,DatePicker}/*.tsx`, their `index.ts` | `ControlSize` |
| `src/components/Button/Button.tsx` | tone lists; corrected comment; `tone="currentColor"` |
| `src/components/Badge/Badge.tsx` | `badgeTones` |
| `src/components/Loader/Loader.tsx`, `Loader.module.css` | list, `currentColor` |
| `src/components/DropdownMenu/rows.ts` | list, `neutral` |
| `src/index.ts` | export `ControlSize`, `Tone`; drop the four size aliases |
| `app/button/page.tsx` | corrected reason |
| `MEMORY.md` | §4 |

The per-component lists are exported from their own modules for the test, not
from `src/index.ts`; the public surface gains only `ControlSize` and `Tone`.

## 6. Verification

`npm run check` (types, hooks lint, suite). Each new test is watched failing
before the change it guards: a mismatched height, a listed tone with its rule
removed.

One compile-time guard, in `vocabulary.test.ts`: an `@ts-expect-error` line
assigning `'tertiary'` to `TintTone`. It catches the §2.2 collision — a
"simplified" derivation that reads `text/<t>` alone would admit `tertiary`,
the directive would go unused, and `tsc` would fail. No such line guards
`FillTone` against `warning`: that would fail only when someone deliberately
adds the token, which is a decision, not a bug.

No visual change is expected; the Button, Badge, Loader and DropdownMenu docs
pages are checked in a browser in light and dark to confirm it.
