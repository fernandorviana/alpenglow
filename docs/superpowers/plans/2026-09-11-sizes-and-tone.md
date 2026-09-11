# Sizes and Tone Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One `ControlSize` type for the controls that share 32/40/48px heights, and a `Tone` vocabulary where each component's list is checked against a ceiling computed from `theme.ts`.

**Architecture:** A new `src/components/vocabulary.ts` holds `ControlSize`, `Tone` and two type-level ceilings (`FillTone`, `TintTone`) derived from `ThemeTokenName`. Each component declares its tones as a runtime `as const` array that `satisfies` its ceiling, so the compiler refuses a tone the tokens cannot paint. `src/components/vocabulary.test.ts` reads stylesheets to prove the heights agree and every listed tone has a rule.

**Tech Stack:** React 19, TypeScript 5.7 (strict, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`), CSS Modules, Vitest 5 + jsdom 30 + Testing Library, ESLint with `eslint-plugin-react-hooks`.

**Spec:** `docs/superpowers/specs/2026-09-11-sizes-and-tone-design.md`

## Global Constraints

- No visual change. Every class name a component emits today, except `.onFill` → `.currentColor`, stays the same.
- Outline and ghost `success` stay excluded (decided 2026-09-11: possible now, never drawn).
- `Checkbox`, `Radio`, `Switch`, `Textarea`, `Field` get no `size`. `LoaderSize`, `BadgeSize`, `AvatarSize` keep their names and values.
- The per-component tone arrays are exported from their own modules only; `src/index.ts` gains `ControlSize` and `Tone`, nothing else.
- No colour literals in component files; comments record decisions, not mechanism.
- Never hand-edit `src/styles/tokens.css` or `src/styles/tailwind-theme.css`.
- `npm run check` (typecheck, hooks lint, full suite) passes at the end of every task.
- Work on branch `feat/sizes-and-tone`; integrate by fast-forwarding local `main`. Do not push without the user's say-so.
- Every commit message ends with `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.

---

## File map

| File | Responsibility |
|---|---|
| `src/components/vocabulary.ts` (new) | `ControlSize`, `Tone`, `FillTone`, `TintTone` — types only |
| `src/components/vocabulary.test.ts` (new) | heights agree across two stylesheets; every listed tone has a rule; the `text/tertiary` collision stays ruled out |
| `src/components/Button/Button.tsx` | `ControlSize`; `buttonFillTones`, `buttonTextTones`; corrected comment; spinner `tone="currentColor"` |
| `src/components/{Input,Select,DatePicker}/*.tsx` | `ControlSize` |
| `src/components/Badge/Badge.tsx` | `badgeTones` |
| `src/components/Loader/Loader.tsx`, `Loader.module.css`, `Loader.test.tsx` | `loaderTones`; `onFill` → `currentColor` |
| `src/components/DropdownMenu/rows.ts` | `menuItemTones`; `default` → `neutral` |
| `src/components/{Button,Input,Select,DatePicker}/index.ts`, `src/index.ts` | exports |
| `app/button/page.tsx` | the corrected solid-only reason, with live ratios |
| `MEMORY.md` | invariant 3, open work, two conventions, test count |

---

### Task 1: `ControlSize`

**Files:**
- Create: `src/components/vocabulary.ts`
- Create: `src/components/vocabulary.test.ts`
- Modify: `src/components/Button/Button.tsx:1-9`, `src/components/Button/index.ts`
- Modify: `src/components/Input/Input.tsx:8-13`, `src/components/Input/index.ts`
- Modify: `src/components/Select/Select.tsx:21-25`, `src/components/Select/index.ts`
- Modify: `src/components/DatePicker/DatePicker.tsx:52-70`, `src/components/DatePicker/index.ts`
- Modify: `src/index.ts`

**Interfaces:**
- Consumes: `readCss(path: string): string` and `block(css: string, header: string): string` from `src/test/css.ts` (existing).
- Produces: `export type ControlSize = 'sm' | 'md' | 'lg'` in `src/components/vocabulary.ts`. `ButtonSize`, `InputSize`, `SelectSize`, `DatePickerSize` no longer exist.

- [ ] **Step 1: Create the branch**

```bash
git switch -c feat/sizes-and-tone
```

- [ ] **Step 2: Write the height test**

Create `src/components/vocabulary.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { block, readCss } from '@/test/css';

/** The pixel value of `property` in the rule that starts a line with `selector {`. */
function px(css: string, selector: string, property: string) {
  const rule = block(css, `\n${selector} {`);
  return Number(rule.match(new RegExp(`(?:^|[\\s;])${property}:\\s*(\\d+)px`))?.[1]);
}

describe('ControlSize', () => {
  it('gives a button and a field of the same size the same height', () => {
    // Button.module.css sets `height` and control.module.css `min-height`,
    // separately. Retune one and a lg button stops lining up with the lg field
    // beside it, which nothing else in the suite would notice.
    const button = readCss('src/components/Button/Button.module.css');
    const control = readCss('src/components/control.module.css');

    for (const size of ['sm', 'md', 'lg'] as const) {
      const buttonHeight = px(button, `.${size}`, 'height');
      expect(buttonHeight, size).toBeGreaterThan(0);
      expect(buttonHeight, size).toBe(px(control, `.${size}`, 'min-height'));
    }
  });
});
```

The `> 0` assertion is there because `toBe` treats two unparsed `NaN`s as equal.

- [ ] **Step 3: Run it — it guards an existing invariant, so it passes**

Run: `npx vitest run src/components/vocabulary.test.ts`
Expected: PASS, 1 test.

- [ ] **Step 4: Prove it can fail**

In `src/components/Button/Button.module.css`, inside `.lg {`, change `height: 48px;` to `height: 50px;`.

Run: `npx vitest run src/components/vocabulary.test.ts`
Expected: FAIL — `lg: expected 50 to be 48`.

Restore: `git checkout -- src/components/Button/Button.module.css`

- [ ] **Step 5: Add the type**

Create `src/components/vocabulary.ts`:

```ts
/**
 * A control's height: 32, 40 or 48px. Button and the control box — Input,
 * Select, DatePicker — share it, and vocabulary.test.ts holds their two
 * stylesheets to the same values. Other components measure other things
 * (a Loader's diameter, an Avatar's width) and keep size names of their own.
 */
export type ControlSize = 'sm' | 'md' | 'lg';
```

- [ ] **Step 6: Use it in the four components**

`src/components/Button/Button.tsx` — replace lines 1–9:

```ts
import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader } from '../Loader/Loader';
import type { ControlSize } from '../vocabulary';
import styles from './Button.module.css';

type BaseProps = {
  size?: ControlSize;
```

`src/components/Button/index.ts`:

```ts
export { Button } from './Button';
export type { ButtonProps } from './Button';
```

`src/components/Input/Input.tsx` — replace lines 8–13 (the `InputSize` declaration and the `size` prop):

```ts
export type InputProps = {
  /** Renamed from the HTML `size` attribute, which sets a character count. */
  size?: ControlSize;
```

and add `import type { ControlSize } from '../vocabulary';` after the `useField` import.

`src/components/Input/index.ts`:

```ts
export { Input } from './Input';
export type { InputProps } from './Input';
```

`src/components/Select/Select.tsx` — replace

```ts
export type SelectSize = 'sm' | 'md' | 'lg';

export type SelectProps = {
  /** Shares Button's height scale: 32, 40, 48. */
  size?: SelectSize;
```

with

```ts
export type SelectProps = {
  size?: ControlSize;
```

and add `import type { ControlSize } from '../vocabulary';` after the `useField` import.

`src/components/Select/index.ts`:

```ts
export { Select } from './Select';
export type { SelectProps } from './Select';
```

`src/components/DatePicker/DatePicker.tsx` — delete the two lines

```ts
/** Shares Button's height scale: 32, 40, 48. */
export type DatePickerSize = 'sm' | 'md' | 'lg';
```

(and the blank line after them), change `size?: DatePickerSize;` to `size?: ControlSize;`, and add `import type { ControlSize } from '../vocabulary';` after the `useHydrated` import.

`src/components/DatePicker/index.ts` — the type line becomes:

```ts
export type { DatePickerProps, DatePickerInvalidReason } from './DatePicker';
```

`src/index.ts` — four lines change:

```ts
export type { ButtonProps } from './components/Button/index';
export type { InputProps } from './components/Input/index';
export type { SelectProps } from './components/Select/index';
export type { DatePickerProps, DatePickerInvalidReason } from './components/DatePicker/index';
```

and one is added directly after the Button type line:

```ts
export type { ControlSize } from './components/vocabulary';
```

- [ ] **Step 7: Confirm nothing else named the removed types**

Run: `grep -rnE "ButtonSize|InputSize|SelectSize|DatePickerSize" src app`
Expected: no output.

- [ ] **Step 8: Run the checks**

Run: `npm run check`
Expected: typecheck clean, lint clean, all tests pass.

- [ ] **Step 9: Commit**

```bash
git add src/components/vocabulary.ts src/components/vocabulary.test.ts src/components/Button src/components/Input src/components/Select src/components/DatePicker src/index.ts
git commit -m "Give Button, Input, Select and DatePicker one ControlSize, and fail when the button and control stylesheets disagree on a height

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: The tone vocabulary

**Files:**
- Modify: `src/components/vocabulary.ts`
- Modify: `src/components/vocabulary.test.ts`
- Modify: `src/components/Button/Button.tsx:17-28` (after Task 1), and the spinner line
- Modify: `src/components/Badge/Badge.tsx:1-4`
- Modify: `src/components/Loader/Loader.tsx:1-5`, `src/components/Loader/Loader.module.css:118-121`, `src/components/Loader/Loader.test.tsx`
- Modify: `src/components/DropdownMenu/rows.ts:1-3`
- Modify: `src/index.ts`

**Interfaces:**
- Consumes: `ThemeTokenName` from `src/tokens/theme.ts` (`keyof typeof theme`); `ControlSize` from Task 1.
- Produces, in `src/components/vocabulary.ts`:
  - `export type Tone = 'neutral' | 'accent' | 'tertiary' | 'success' | 'warning' | 'danger' | 'info'`
  - `export type FillTone` — resolves today to `'accent' | 'neutral' | 'tertiary' | 'success' | 'danger'`
  - `export type TintTone` — resolves today to `'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info'`
- Produces, runtime arrays:
  - `buttonFillTones`, `buttonTextTones` from `src/components/Button/Button.tsx`
  - `badgeTones` from `src/components/Badge/Badge.tsx`
  - `loaderTones` from `src/components/Loader/Loader.tsx`
  - `menuItemTones` from `src/components/DropdownMenu/rows.ts`
- Renames: `Loader` `tone="onFill"` → `tone="currentColor"` (class `.currentColor`); `DropdownMenuAction.tone` `'default'` → `'neutral'`.

- [ ] **Step 1: Write the failing tests**

Append to `src/components/vocabulary.test.ts` (the existing imports stay; add these):

```ts
import type { TintTone } from './vocabulary';
import { buttonFillTones, buttonTextTones } from './Button/Button';
import { badgeTones } from './Badge/Badge';
import { loaderTones } from './Loader/Loader';
import { menuItemTones } from './DropdownMenu/rows';

/** Whether the stylesheet has a rule that starts a line with exactly this selector. */
function hasRule(css: string, selector: string) {
  return new RegExp(`(?:^|\\n)${selector.replace(/\./g, '\\.')}\\s*\\{`).test(css);
}

describe('every tone a component lists is painted', () => {
  // A tone added to a list — the step a new token invites — without its CSS
  // renders unstyled, and every other test passes.
  const cases: [string, string, string[]][] = [
    ['Button, solid', 'src/components/Button/Button.module.css', buttonFillTones.map((t) => `.solid.${t}`)],
    ['Button, outline', 'src/components/Button/Button.module.css', buttonTextTones.map((t) => `.outline.${t}`)],
    ['Button, ghost', 'src/components/Button/Button.module.css', buttonTextTones.map((t) => `.ghost.${t}`)],
    ['Badge', 'src/components/Badge/Badge.module.css', badgeTones.map((t) => `.${t}`)],
    ['Loader', 'src/components/Loader/Loader.module.css', loaderTones.map((t) => `.${t}`)],
    // A neutral row is the row's own style and carries no tone class.
    [
      'DropdownMenu row',
      'src/components/DropdownMenu/DropdownMenu.module.css',
      menuItemTones.filter((t) => t !== 'neutral').map((t) => `.${t}`),
    ],
  ];

  for (const [name, path, selectors] of cases) {
    it(name, () => {
      const css = readCss(path);
      expect(selectors.filter((selector) => !hasRule(css, selector))).toEqual([]);
    });
  }
});

describe('TintTone', () => {
  it('does not mistake the tertiary text level for the tertiary tone', () => {
    // Checked by `tsc`, not at runtime. `text/tertiary` is a level of the text
    // hierarchy. A ceiling read from `text/<t>` alone would admit 'tertiary',
    // this directive would go unused, and `npm run typecheck` would fail.
    // @ts-expect-error the tertiary tone has no tinted pair
    const tertiary: TintTone = 'tertiary';
    expect(tertiary).toBe('tertiary');
  });
});
```

Append to `src/components/Loader/Loader.test.tsx`, inside `describe('Loader', …)` before `describe('under reduced motion', …)`, and add `import styles from './Loader.module.css';` to its imports:

```ts
  it('takes the colour of the text around it with tone="currentColor"', () => {
    // A spinner on a filled button has no tone of its own: it is the label's
    // colour, whichever fill the button has.
    const { container } = render(<Loader tone="currentColor" />);
    expect(styles.currentColor).toBeDefined();
    expect(container.firstElementChild).toHaveClass(styles.currentColor!);
  });
```

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run src/components/vocabulary.test.ts src/components/Loader/Loader.test.tsx`
Expected: FAIL — `vocabulary.test.ts` fails while collecting (`Cannot read properties of undefined (reading 'map')`: `buttonFillTones` is not exported yet), and the Loader case fails on `expected undefined to be defined`.

- [ ] **Step 3: Add the vocabulary and the ceilings**

Append to `src/components/vocabulary.ts`, and add `import type { ThemeTokenName } from '../tokens/theme';` as its first line:

```ts
/**
 * Tones are named for meaning, not hue. No component offers all seven: each
 * lists what it offers, and the list has to fit inside a ceiling the tokens set.
 * The lists are not derived from the ceilings. Derived, the Loader would gain
 * `warning` and `info` and menu rows `success` the day those tokens existed,
 * without anyone deciding it — and a tone the type accepts is still unstyled
 * until its stylesheet paints it.
 */
export type Tone = 'neutral' | 'accent' | 'tertiary' | 'success' | 'warning' | 'danger' | 'info';

type Has<Name extends string> = Name extends ThemeTokenName ? true : false;
type All<Checks extends readonly boolean[]> = Checks[number] extends true ? true : false;

/** Tones the theme can fill: a rest, hover and pressed fill, and a label colour for them. */
export type FillTone = {
  [T in Tone]: All<
    [
      Has<`interactive/${T}`>,
      Has<`interactive/${T}-hover`>,
      Has<`interactive/${T}-pressed`>,
      Has<`interactive/on-${T}`>,
    ]
  > extends true
    ? T
    : never;
}[Tone];

/**
 * Tones the theme can tint: a subtle surface and a text colour of the same
 * tone. Read from the pair, not from `text/<t>` alone, because `text/tertiary`
 * is a level of the text hierarchy — alone, it would hand the tertiary tone a
 * grey. Neutral tints with `surface/sunken` and `text/primary`.
 */
export type TintTone =
  | 'neutral'
  | {
      [T in Tone]: All<[Has<`surface/${T}-subtle`>, Has<`text/${T}`>]> extends true ? T : never;
    }[Tone];
```

- [ ] **Step 4: Give each component its list**

`src/components/Button/Button.tsx` — replace the comment and `VariantProps` (the block starting `/**\n * \`tertiary\` and \`success\` are solid-only on purpose.` through `| { variant: 'outline' | 'ghost'; tone?: 'accent' | 'neutral' | 'danger' };`) with:

```ts
/** Every tone the theme can fill. */
export const buttonFillTones = ['accent', 'neutral', 'tertiary', 'success', 'danger'] as const satisfies readonly FillTone[];

/**
 * Outline and ghost paint the tone as text, outline as a border too.
 *
 * `tertiary` cannot be painted that way: brand-2/500 is 1.45:1 on white and
 * the theme has no tertiary text colour, so `variant="outline"
 * tone="tertiary"` does not compile. `success` could — `text/success` and
 * `border/success`, added for field validation, clear 4.5:1 and 3:1 on the
 * canvas — but an outline success button was never drawn, so it is not
 * offered. Decided 2026-09-11.
 */
export const buttonTextTones = ['accent', 'neutral', 'danger'] as const satisfies readonly TintTone[];

type VariantProps =
  | { variant?: 'solid'; tone?: (typeof buttonFillTones)[number] }
  | { variant: 'outline' | 'ghost'; tone?: (typeof buttonTextTones)[number] };
```

Change its vocabulary import to `import type { ControlSize, FillTone, TintTone } from '../vocabulary';`, and the spinner line to:

```tsx
          <Loader tone="currentColor" size={size === 'lg' ? 'md' : 'sm'} />
```

`src/components/Badge/Badge.tsx` — replace line 4 (`export type BadgeTone = …`) with:

```ts
export const badgeTones = ['neutral', 'accent', 'success', 'warning', 'danger', 'info'] as const satisfies readonly TintTone[];
export type BadgeTone = (typeof badgeTones)[number];
```

and add `import type { TintTone } from '../vocabulary';` after the `styles` import.

`src/components/Loader/Loader.tsx` — replace line 5 (`export type LoaderTone = …`) with:

```ts
export const loaderTones = ['accent', 'neutral', 'success', 'danger'] as const satisfies readonly TintTone[];

/**
 * One of `loaderTones`, or `currentColor`: no tone of its own, the colour of
 * the text around it. A spinner on a filled button takes the button's label.
 */
export type LoaderTone = (typeof loaderTones)[number] | 'currentColor';
```

and add `import type { TintTone } from '../vocabulary';` after the `styles` import.

`src/components/Loader/Loader.module.css` — change the last line from `.onFill { color: currentColor; }` to:

```css
.currentColor { color: currentColor; }
```

(the comment above it stays).

`src/components/DropdownMenu/rows.ts` — replace line 3 (`export type DropdownMenuItemTone = …`) with:

```ts
/** A neutral row is the row's own style; accent and danger rows each hover to their own subtle surface. */
export const menuItemTones = ['neutral', 'accent', 'danger'] as const satisfies readonly TintTone[];
export type DropdownMenuItemTone = (typeof menuItemTones)[number];
```

and add `import type { TintTone } from '../vocabulary';` after the `ReactNode` import.

`src/index.ts` — make the vocabulary line:

```ts
export type { ControlSize, Tone } from './components/vocabulary';
```

- [ ] **Step 5: Run the tests**

Run: `npx vitest run src/components/vocabulary.test.ts src/components/Loader src/components/Button src/components/Badge src/components/DropdownMenu`
Expected: PASS.

- [ ] **Step 6: Prove the painted test can fail**

In `src/components/Button/Button.module.css`, delete the line `.ghost.danger  { color: var(--ap-color-text-danger); }`.

Run: `npx vitest run src/components/vocabulary.test.ts`
Expected: FAIL in `Button, ghost` — received `[".ghost.danger"]`.

Restore: `git checkout -- src/components/Button/Button.module.css`

- [ ] **Step 7: Prove the tertiary guard can fail**

In `src/components/vocabulary.ts`, temporarily make `TintTone` read text alone, replacing

```ts
      [T in Tone]: All<[Has<`surface/${T}-subtle`>, Has<`text/${T}`>]> extends true ? T : never;
```

with

```ts
      [T in Tone]: All<[Has<`text/${T}`>]> extends true ? T : never;
```

Run: `npm run typecheck`
Expected: FAIL — `src/components/vocabulary.test.ts: error TS2578: Unused '@ts-expect-error' directive.`

Undo that edit (restore the pair exactly as in Step 3) and rerun `npm run typecheck`: clean.

- [ ] **Step 8: Prove a list outside its ceiling does not compile**

In `src/components/Badge/Badge.tsx`, temporarily add `'tertiary'` to `badgeTones`.

Run: `npm run typecheck`
Expected: FAIL — a `satisfies` error on `badgeTones` naming `"tertiary"`.

Remove `'tertiary'` again.

- [ ] **Step 9: Confirm the old names are gone**

Run: `grep -rnE "onFill|'default'" src app`
Expected: no output.

- [ ] **Step 10: Run the checks**

Run: `npm run check`
Expected: typecheck clean, lint clean, all tests pass.

- [ ] **Step 11: Commit**

```bash
git add src/components/vocabulary.ts src/components/vocabulary.test.ts src/components/Button/Button.tsx src/components/Badge/Badge.tsx src/components/Loader src/components/DropdownMenu/rows.ts src/index.ts
git commit -m "Give every tone-taking component a list inside a ceiling computed from the theme, rename the menu's default to neutral and the Loader's onFill to currentColor

The ceilings are types over ThemeTokenName: a fill needs rest, hover, pressed
and on- tokens; a tint needs a subtle surface and a text colour of the same
tone, which keeps text/tertiary — a hierarchy level — from passing for the
tertiary tone. Each list satisfies its ceiling, and a test fails when a listed
tone has no rule in its stylesheet. The Button's comment now gives the true
reason outline success is absent: never drawn, not impossible.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: The corrected reason on the site, and `MEMORY.md`

**Files:**
- Modify: `app/button/page.tsx` (the `<div className="rejected">` block, currently lines 93–104)
- Modify: `MEMORY.md` (invariant 3; Conventions; Open work §2–§5; Verification)

**Interfaces:**
- Consumes: `Ratio` (`@ui/Ratio`, props `fg`, `bg`, `threshold?`) and `resolve(token, mode)` (`@/tokens/contrast`), both already imported by the page; the lists and ceilings from Task 2, by name only.
- Produces: nothing code depends on.

- [ ] **Step 1: Replace the solid-only note on the Button page**

In `app/button/page.tsx`, replace the whole `<div className="rejected">…</div>` block with:

```tsx
      <div className="rejected">
        <p>
          <strong>Tertiary and success are solid-only, and the type signature enforces it.</strong>
        </p>
        <p>
          Outline and ghost paint the tone as text, and outline as a border too. Tertiary
          cannot be painted that way: brand-2/500 is 1.45:1 on white, and the theme has no
          tertiary text colour — <code>text/tertiary</code> is a level of the text
          hierarchy, not this tone. So{' '}
          <code>variant=&quot;outline&quot; tone=&quot;tertiary&quot;</code> does not compile
          rather than producing a button nobody should ship.
        </p>
        <p>
          Success was left out for the same reason, until field validation added{' '}
          <code>text/success</code>, at{' '}
          <Ratio fg={resolve('text/success', 'light')} bg={resolve('surface/base', 'light')} />{' '}
          on the canvas, and <code>border/success</code>, at{' '}
          <Ratio
            fg={resolve('border/success', 'light')}
            bg={resolve('surface/base', 'light')}
            threshold={3}
          />
          . An outline success button could pass now. It stays out because it was never drawn.
        </p>
      </div>
```

- [ ] **Step 2: Run the site's tests**

Run: `npx vitest run app`
Expected: PASS, including `app/ui/Ratio.test.tsx` (no `.ratio` inside a `.ratio`).

- [ ] **Step 3: Reword invariant 3 in `MEMORY.md`**

Replace the invariant that begins `3. **\`tertiary\` and \`success\` are solid-only, enforced by the type union.**` (four lines) with:

```markdown
3. **`tertiary` is solid-only because it has to be; `success` because it was
   never drawn.** Both are enforced by the type union. `brand-2/500` is 1.45:1
   on white and the theme has no tertiary text colour, so
   `variant="outline" tone="tertiary"` does not compile. `success` was once
   excluded for the same reason, but field validation added `text/success`
   and `border/success`, which clear 4.5:1 and 3:1 on the canvas: an outline
   success is possible, and stays out until someone draws it (decided
   2026-09-11). The Button page renders both ratios live.
```

- [ ] **Step 4: Record the two conventions**

In `MEMORY.md` → Conventions, after the bullet that begins `- **\`src/\` and \`app/\` pass the React hooks lint`, add:

```markdown
- **Control heights share one type and are held to it.** `ControlSize`
  (`sm | md | lg`, 32/40/48px) belongs to Button, Input, Select and
  DatePicker; `vocabulary.test.ts` fails when `Button.module.css` and
  `control.module.css` stop agreeing. `LoaderSize`, `BadgeSize` and
  `AvatarSize` measure other things and keep their own names. Checkbox, Radio,
  Switch and Textarea are one size on purpose: a field's size changes its box,
  never its text, and the checkbox aligns to the first line of text.
- **A component's tones are a list inside a ceiling the tokens set.** `Tone`
  names seven. `FillTone` and `TintTone` in `src/components/vocabulary.ts` are
  computed from `theme.ts`; each component's array `satisfies` its ceiling, and
  `vocabulary.test.ts` fails when a listed tone has no rule. The lists are not
  derived — derived, the Loader would gain `warning` the day the token existed.
  The tint ceiling reads the `surface/<t>-subtle` + `text/<t>` pair because
  `text/tertiary` is a hierarchy level, not the tertiary tone.
```

- [ ] **Step 5: Close the two open items**

In `MEMORY.md` → Open work, delete `### 2. Sizing does not compose` and `### 3. No shared tone vocabulary` with their paragraphs. Renumber `### 4. Packaging — npm first, once sizes and tone settle` to `### 2. Packaging — npm next`, and `### 5. No structural accessibility assertions` to `### 3. No structural accessibility assertions`. Replace the packaging section's first paragraph

```markdown
The order, decided 2026-09-11 after two throwaway spikes: **sizes and tone**
first, because they break the API and should do it before anything is
published; then **an npm package, `0.x`**; then **a shadcn registry, only if
someone asks for one**.
```

with

```markdown
The order, decided 2026-09-11 after two throwaway spikes: **sizes and tone**
first, because they break the API and should do it before anything is
published — done the same day, see
`docs/superpowers/specs/2026-09-11-sizes-and-tone-design.md`; then **an npm
package, `0.x`**; then **a shadcn registry, only if someone asks for one**.
```

- [ ] **Step 6: Update the test count**

Run: `npm test 2>&1 | grep -E "Test Files|Tests "`

In `MEMORY.md` → Verification, set the `npm test` line's comment to the two numbers that run reports: `# <tests> tests across <files> files`.

- [ ] **Step 7: Run the checks**

Run: `npm run check`
Expected: typecheck clean, lint clean, all tests pass.

- [ ] **Step 8: Check the page in a browser**

Run: `npm run build:docs`
Expected: the static export completes and lists `/button`.

Port 3000 may belong to another session's dev server. Serve the export on its own port with a temporary entry in `.claude/launch.json` — `{"name": "docs-static-check", "runtimeExecutable": "python3", "runtimeArgs": ["-m", "http.server", "3200", "--directory", "out"], "port": 3200}` — start it with `preview_start`, and open `http://localhost:3200/button/`. Confirm, in light and in dark:
- the rejected note has three paragraphs and two ratio readings, both graded as passing;
- the solid, outline and ghost button rows look as they did before (no tone lost its colour).

Open `/dropdown-menu/` and `/avatar/` (the Loader lives there) and confirm the accent and danger rows and the spinners are painted. Then stop the server and `git checkout -- .claude/launch.json`.

- [ ] **Step 9: Commit**

```bash
git add app/button/page.tsx MEMORY.md
git commit -m "Give the true reason outline success is absent on the Button page and in invariant 3, and record the size and tone conventions

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

- [ ] **Step 10: Integrate**

```bash
git switch main
git merge --ff-only feat/sizes-and-tone
git branch -d feat/sizes-and-tone
```

If `main` moved meanwhile (other sessions work in this checkout), rebase first: `git switch feat/sizes-and-tone && git rebase main`, rerun `npm run check`, then fast-forward. Do not push; report to the user and ask.
