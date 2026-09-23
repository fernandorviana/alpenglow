# The dense screen — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** System density as a token layer, a current row on the Table, the Link's new-tab announcement, and a scheduling-day screen built only from Alpenglow, shown on `/screen` in a switchable frame and alone on `/screen/full`.

**Architecture:** Density is a fourth token layer, `density/*`, generated into `tokens.css` with a compact block selected by `[data-density="compact"]` on any element and undone under `(pointer: coarse)`; each consumer reads its token only when the caller passed no explicit size. The screen is a client component under `app/screen/` driven by one reducer over pure, seeded data; `/screen/full` renders it without the site's chrome, and `/screen` frames that route in an iframe whose width, density and mode are switched from a bar of SegmentedControls, mode and density travelling by `postMessage`.

**Tech Stack:** React 19, Next 16 App Router with `output: 'export'`, CSS Modules, Vitest + Testing Library + axe, `tsx` build scripts.

**Spec:** `docs/superpowers/specs/2026-09-23-dense-screen-design.md`

## Global Constraints

- Nothing from the original product's name, anywhere: code, copy, data, comments. The practice is "Ridge Physio".
- Every `--ap-` custom property read must exist in `tokens.css` (`src/components/custom-properties.test.ts` enforces it).
- Density values, exactly: `density/control` 40 / 32, `density/row` 72 / 48, `density/row-header` 44 / 36, `density/hour` 80 / 64, `density/nav-item` 40 / 32 (comfortable / compact).
- Without a `data-density` attribute, every component renders exactly as today. An explicit `size` and the Table's explicit `density` prop win over the token.
- Under `@media (pointer: coarse)` the compact block restates the comfortable values.
- The fixed day: `2026-09-17`, now `2026-09-17T11:20`.
- `app/screen/screen.module.css` holds layout only; colour, type and spacing come from `var(--ap-…)`.
- Peer range starts at React 19.0: no `useEffectEvent`.
- Commit or push only when Fernando asks; when he does, stage by path, never `git add -A`. The "Commit" steps below are the points where a commit belongs, and are run only with his go-ahead.
- `npm run check` and `npm run build:docs` before any push.

## Review Focus

1. **A control given an explicit `size="md"` inside a compact region stays 40.** The easy mistake is to make `md` read the token. Pinned in Task 2.
2. **A postMessage from another origin, or with a value outside the enum, changes nothing.** Pinned in Task 7.
3. **A row whose primary cell already holds a link or button** (a caller's own interactive cell) must not get a button nested in a button: the Table wraps only when the column is `primary` and `onCurrentChange` is given, and the docs say the primary cell's content must then be plain. Pinned in Task 4 by a test that the wrapper is a `<button type="button">` holding the cell's text, and documented in the props table.
4. **Undo after a second change.** Undoing the first toast after a second move must restore the first move's `from`, not the latest state wholesale. Pinned in Task 9: inverses are per-appointment patches, not snapshots.
5. **A day with every appointment filtered out** shows the Table's `empty` and an empty Scheduler, not a crash or a stale `currentId`. Pinned in Task 9 (reducer clears `currentId` when its appointment is filtered away) and Task 10 (render with filters that match nothing, axe clean).

---

## File structure

| File | Responsibility |
|---|---|
| `src/tokens/density.ts` (new) | The five density tokens, both modes, with their `use` notes |
| `src/tokens/density.test.ts` (new) | Values and the compact ≤ comfortable rule |
| `scripts/build-css.ts` | Emits the density layer, the compact block, the coarse-pointer block |
| `scripts/build-tailwind.ts` | Density variables in the Tailwind theme |
| `scripts/export-figma.ts` | The fourth collection, Alpenglow Density |
| `src/styles/generated.test.ts` | The three density blocks are in step |
| `src/components/control.module.css`, Input, Select, NativeSelect, Combobox, DatePicker, Button | The `auto` size reading `density/control` |
| `src/components/Table/*` | Density from the token by default; `currentId` / `onCurrentChange` |
| `src/components/Scheduler/Scheduler.module.css` | `--scheduler-hour` from `density/hour` |
| `src/components/SideNav/*.css`, `SideNavSecondary/*.css` | Item height from `density/nav-item` |
| `src/components/Link/Link.tsx` | New-tab announcement follows `target` |
| `app/ui/Chrome.tsx` (new), `app/layout.tsx` | The site's chrome, left out on `/screen/full` |
| `app/screen/frame.ts` (new) | The query and message protocol, pure |
| `app/screen/data.ts` (new) | Practitioners, clients, `appointmentsFor(date)` |
| `app/screen/state.ts` (new) | The reducer and its inverses |
| `app/screen/Screen.tsx` (new) | The composition: SideNav, TopBar, day bar, body, Drawer, Dialog, palette |
| `app/screen/zones/*.tsx` (new) | One file per zone, so `Screen.tsx` stays the wiring |
| `app/screen/screen.module.css` (new) | Layout only |
| `app/screen/full/page.tsx` (new) | The screen alone |
| `app/screen/page.tsx`, `app/screen/Frame.tsx` (new) | The site page and its frame |
| `app/density/page.tsx` (new) | The Density foundation page |
| `app/ui/contents.ts` | Nav entries |

---

### Task 1: The density token layer

**Files:**
- Create: `src/tokens/density.ts`, `src/tokens/density.test.ts`
- Modify: `scripts/build-css.ts`, `scripts/build-tailwind.ts`, `scripts/export-figma.ts`, `src/styles/generated.test.ts`
- Regenerate: `src/styles/tokens.css`, `src/styles/tailwind-theme.css`, `docs/figma/alpenglow-variables.json`

**Interfaces:**
- Produces: `density: Record<DensityTokenName, { comfortable: number; compact: number; use: string }>`, `densityModes = ['comfortable', 'compact'] as const`, `type Density`. CSS: `--ap-density-control`, `--ap-density-row`, `--ap-density-row-header`, `--ap-density-hour`, `--ap-density-nav-item`, all in px.

- [ ] **Step 1: Write the failing tests**

`src/tokens/density.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { density, densityModes } from './density';

describe('density', () => {
  it('holds the values the spec decided', () => {
    // Comfortable is what is drawn today; a change here moves every screen.
    expect(Object.fromEntries(Object.entries(density).map(([k, v]) => [k, [v.comfortable, v.compact]]))).toEqual({
      control: [40, 32],
      row: [72, 48],
      'row-header': [44, 36],
      hour: [80, 64],
      'nav-item': [40, 32],
    });
  });

  it('never makes compact larger than comfortable', () => {
    for (const [name, v] of Object.entries(density)) expect(v.compact, name).toBeLessThanOrEqual(v.comfortable);
  });

  it('keeps a compact control above WCAG 2.5.8’s 24', () => {
    expect(density.control.compact).toBeGreaterThanOrEqual(24);
    expect(density['nav-item'].compact).toBeGreaterThanOrEqual(24);
  });

  it('has two modes, comfortable first', () => {
    expect(densityModes).toEqual(['comfortable', 'compact']);
  });
});
```

Append to `src/styles/generated.test.ts`, inside a new `describe`:

```ts
import { density } from '../tokens/density';

describe('tokens.css carries density', () => {
  it('declares every density token at its comfortable value on :root', () => {
    const root = block(tokensCss, 'Layer 3 — density');
    for (const [name, v] of Object.entries(density)) {
      expect(root, name).toContain(`--ap-density-${name}: ${v.comfortable}px;`);
    }
  });

  it('declares compact on any element that asks for it, not only :root', () => {
    const compact = block(tokensCss, '[data-density="compact"] {');
    for (const [name, v] of Object.entries(density)) {
      expect(compact, name).toContain(`--ap-density-${name}: ${v.compact}px;`);
    }
    expect(tokensCss).not.toContain(':root[data-density="compact"]');
  });

  it('gives touch the comfortable values back', () => {
    const coarse = block(tokensCss, '@media (pointer: coarse)');
    expect(coarse).toContain('[data-density="compact"]');
    for (const [name, v] of Object.entries(density)) {
      expect(coarse, name).toContain(`--ap-density-${name}: ${v.comfortable}px;`);
    }
  });

  it('is in the Tailwind theme', () => {
    for (const name of Object.keys(density)) {
      expect(tailwindCss, name).toContain(`--density-${name}: var(--ap-density-${name});`);
    }
  });
});
```

`block(tokensCss, 'Layer 3 — density')` finds the first `{` after the comment header, which is the `:root {` that follows it — keep the header text exact in Step 3.

- [ ] **Step 2: Run to see them fail**

Run: `npx vitest run src/tokens/density.test.ts src/styles/generated.test.ts`
Expected: FAIL — `Cannot find module './density'`.

- [ ] **Step 3: Implement**

`src/tokens/density.ts`:

```ts
/**
 * Alpenglow — density
 *
 * How much room a row, a control and an hour take. Two modes: comfortable,
 * which is what is drawn and the default, and compact, chosen with
 * `data-density="compact"` on any element — custom properties inherit, so a
 * part of a page can be compact while the rest is not.
 *
 * Five tokens, only the ones the dense screen proves (spec 2026-09-23,
 * decision 14). Adding one is a decision, not a tidy-up: the Loader once grew
 * sizes nobody drew, and invariant 7 records it.
 *
 * Compact does not apply to touch. Under `(pointer: coarse)` tokens.css gives
 * the comfortable values back: 32 passes WCAG 2.5.8's 24, but under a finger
 * it is small, and density is for the pointer and the keyboard.
 *
 * An explicit `size` on a control, and the Table's explicit `density`, win.
 */

export const densityModes = ['comfortable', 'compact'] as const;
export type Density = (typeof densityModes)[number];

type Entry = { comfortable: number; compact: number; use: string };

export const density = {
  control: { comfortable: 40, compact: 32, use: 'A control’s height when no size is passed: Button, Input, Select, NativeSelect, Combobox, DatePicker' },
  row: { comfortable: 72, compact: 48, use: 'A Table row' },
  'row-header': { comfortable: 44, compact: 36, use: 'A Table header row' },
  hour: { comfortable: 80, compact: 64, use: 'An hour in the Scheduler; a quarter of it is a card’s floor' },
  'nav-item': { comfortable: 40, compact: 32, use: 'An item in the SideNav and the SideNavSecondary' },
} as const satisfies Record<string, Entry>;

export type DensityTokenName = keyof typeof density;
```

In `scripts/build-css.ts`, import `density` from `'../src/tokens/density.js'`, add:

```ts
function densityBlock(mode: 'comfortable' | 'compact', indent = '  '): string {
  return Object.entries(density)
    .map(([k, v]) => `${indent}${cssName(`density/${k}`)}: ${v[mode]}px;`)
    .join('\n');
}
```

and, directly after the scale's `:root { … }` block in the template:

```ts
/* ---------------------------------------------------------------------------
   Layer 3 — density. Comfortable by default; compact on any element that
   asks, so a region can be dense while the page is not. Touch keeps
   comfortable: density is for the pointer and the keyboard.
   --------------------------------------------------------------------------- */

:root {
${densityBlock('comfortable')}
}

[data-density="compact"] {
${densityBlock('compact')}
}

@media (pointer: coarse) {
  [data-density="compact"] {
${densityBlock('comfortable', '    ')}
  }
}
```

and add `${Object.keys(density).length} density tokens` to the closing `console.log`.

The comment header must contain the literal `Layer 3 — density` and the `:root {` must be the next `{` after it, since the test finds the block that way.

In `scripts/build-tailwind.ts`, after the stroke-width loop:

```ts
lines.push('');
lines.push('  /* Density — resolves through tokens.css, so these follow data-density. */');
for (const name of Object.keys(density)) {
  lines.push(`  --density-${name}: var(--ap-density-${name});`);
}
```

with `import { density } from '../src/tokens/density.js';`.

In `scripts/export-figma.ts`: add `density: ['WIDTH_HEIGHT']` to `SCOPES`, change `$description` to say "Four collections: … Density (Comfortable then Compact)", and add a collection after `'Alpenglow Scale'`:

```ts
'Alpenglow Density': {
  modes: ['Comfortable', 'Compact'],
  hiddenFromPublishing: false,
  variables: Object.entries(density).map(([k, v]) => ({
    name: `density/${k}`,
    type: 'FLOAT',
    values: { Comfortable: v.comfortable, Compact: v.compact },
    scopes: SCOPES.density,
    description: v.use,
  })),
},
```

and add `${out.collections['Alpenglow Density'].variables.length} density tokens` to its `console.log`. Read `docs/figma/apply-variables.md` and add one paragraph telling the plugin prompt that the Density collection has two modes whose values are literal floats, `values` keyed by mode name.

- [ ] **Step 4: Regenerate and run**

Run: `npm run build:css && npx tsx scripts/export-figma.ts && npx vitest run src/tokens src/styles src/components/custom-properties.test.ts`
Expected: PASS. `tokens.css` log line includes "5 density tokens".

- [ ] **Step 5: Commit**

```bash
git add src/tokens/density.ts src/tokens/density.test.ts scripts/build-css.ts scripts/build-tailwind.ts scripts/export-figma.ts src/styles/generated.test.ts src/styles/tokens.css src/styles/tailwind-theme.css docs/figma/alpenglow-variables.json docs/figma/apply-variables.md
git commit -m "Add the density token layer: five tokens, compact on any element, comfortable again under touch"
```

---

### Task 2: Controls read `density/control` when no size is passed

**Files:**
- Modify: `src/components/control.module.css`, `src/components/Input/Input.tsx`, `src/components/Input/Input.module.css` (if it defines sizes), `src/components/Select/Select.tsx`, `src/components/NativeSelect/NativeSelect.tsx`, `src/components/Combobox/Combobox.tsx`, `src/components/DatePicker/DatePicker.tsx`, `src/components/Button/Button.tsx`, `src/components/Button/Button.module.css`
- Test: a new `src/components/density.test.tsx`

**Interfaces:**
- Consumes: `--ap-density-control` (Task 1).
- Produces: every one of the six controls renders the class `auto` (from `control.module.css`, or `Button.module.css` for the Button) when `size` is undefined, and `sm` / `md` / `lg` only when passed. `ControlSize` stays `'sm' | 'md' | 'lg'`; `auto` is internal and not exported.

The box of a control is its line, its padding and its border: `md` is 22 + 2 × 8 + 2 × 1 = 40, `sm` is 22 + 2 × 4 + 2 × 1 = 32. So the `auto` size's block padding is **derived** from the token, not a second token, and it gives exactly `md` at 40 and exactly `sm` at 32.

- [ ] **Step 1: Write the failing test**

`src/components/density.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { readCss, block } from '@/test/css';
import { Button } from './Button';
import { Input } from './Input';
import { NativeSelect } from './NativeSelect';
import { Select } from './Select';
import { Combobox } from './Combobox';
import { DatePicker } from './DatePicker';
import control from './control.module.css';
import button from './Button/Button.module.css';

/**
 * Density reaches a control only when the caller left the size to it. An
 * explicit size is a decision about that control and stays; `md` must not
 * read the token, or a compact region would shrink a control someone sized.
 */

const box = (el: HTMLElement) => el.closest(`.${control.control}`) as HTMLElement;

describe('a control with no size follows density', () => {
  it('Input', () => {
    render(<Input aria-label="Name" />);
    expect(box(screen.getByRole('textbox'))).toHaveClass(control.auto);
  });
  it('NativeSelect', () => {
    render(<NativeSelect aria-label="Kind"><option>A</option></NativeSelect>);
    expect(box(screen.getByRole('combobox'))).toHaveClass(control.auto);
  });
  it('Select', () => {
    render(<Select label="Kind" options={[{ value: 'a', label: 'A' }]} />);
    expect(screen.getByRole('combobox')).toHaveClass(control.auto);
  });
  it('Combobox', () => {
    render(<Combobox label="Client" options={[{ value: 'a', label: 'A' }]} />);
    expect(box(screen.getByRole('combobox'))).toHaveClass(control.auto);
  });
  it('DatePicker', () => {
    render(<DatePicker aria-label="Date" />);
    expect(box(screen.getByRole('textbox'))).toHaveClass(control.auto);
  });
  it('Button', () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' })).toHaveClass(button.auto);
  });
});

describe('an explicit size wins', () => {
  it.each(['sm', 'md', 'lg'] as const)('Input size=%s', (size) => {
    render(<Input aria-label="Name" size={size} />);
    const el = box(screen.getByRole('textbox'));
    expect(el).toHaveClass(control[size]);
    expect(el).not.toHaveClass(control.auto);
  });
  it.each(['sm', 'md', 'lg'] as const)('Button size=%s', (size) => {
    render(<Button size={size}>Save</Button>);
    const el = screen.getByRole('button', { name: 'Save' });
    expect(el).toHaveClass(button[size]);
    expect(el).not.toHaveClass(button.auto);
  });
});

describe('the stylesheets', () => {
  it('derives the auto control’s padding from the token, so 40 is md and 32 is sm', () => {
    const auto = block(readCss('src/components/control.module.css'), '.auto {');
    expect(auto).toContain('min-height: var(--ap-density-control);');
    expect(auto).toMatch(
      /padding-block:\s*calc\(\(var\(--ap-density-control\) - var\(--ap-text-body-md-line-height\) - 2 \* var\(--ap-border-width-hairline\)\) \/ 2\);/,
    );
  });

  it('keeps md a literal 40, so an explicit size never reads the token', () => {
    expect(block(readCss('src/components/control.module.css'), '.md {')).toContain('min-height: 40px;');
    expect(block(readCss('src/components/Button/Button.module.css'), '.md {')).toContain('height: 40px;');
  });

  it('gives the auto button the token’s height', () => {
    expect(block(readCss('src/components/Button/Button.module.css'), '.auto {')).toContain('height: var(--ap-density-control);');
  });
});
```

Before running, open each control's test file and use the same `render` props and role the existing tests use for that component (the `Select`'s trigger, the `Combobox`'s field and `DatePicker`'s field roles above are the ones the components' own tests use at the time of writing; if one differs, follow the component's own test).

- [ ] **Step 2: Run to see it fail**

Run: `npx vitest run src/components/density.test.tsx`
Expected: FAIL — `control.auto` is undefined.

- [ ] **Step 3: Implement**

In `control.module.css`, add `.auto` to the `box-sizing` list and, before `.sm`:

```css
/* No size passed: the height is density's. The block padding is what is left
   of the token after the line and the border, so 40 is exactly md and 32 is
   exactly sm, and a third density would need no new rule. */
.auto {
  min-height: var(--ap-density-control);
  padding-block: calc((var(--ap-density-control) - var(--ap-text-body-md-line-height) - 2 * var(--ap-border-width-hairline)) / 2);
  padding-inline: var(--ap-spacing-150) var(--ap-spacing-200);
}
```

`md` and `sm` share the inline padding `spacing-150 spacing-150 … spacing-200` — check the existing `.md` rule's four values and copy its inline ones exactly.

In each of Input, Select, NativeSelect, Combobox, DatePicker: remove the `= 'md'` default from `size` in the destructuring, and where the class is picked write `control[size ?? 'auto']` (Input: `styles[size ?? 'auto']` if its classes come from `control.module.css` under another import name — use the same object the current line uses). Where a size is used for anything but the class, keep today's behaviour by resolving `const sized = size ?? 'md'` and using `sized` there:
- Combobox's `INSET[size]` becomes an `INSET` record with an `auto` key: `auto: 'calc((var(--ap-density-control) - var(--ap-text-body-md-line-height) - 2 * var(--ap-border-width-hairline)) / 2)'`, typed `Record<ControlSize | 'auto', string>`, and read as `INSET[size ?? 'auto']`.
- Button's Loader: `size === 'lg' ? 'md' : 'sm'` is unchanged; `undefined` gives `'sm'` as `md` did.

In `Button.module.css`, add before `.sm`:

```css
/* No size passed: density's height. The inline padding stays md's, 20; a
   compact button keeps its breadth and loses only height. */
.auto {
  height: var(--ap-density-control);
  padding-inline: var(--ap-spacing-250);
  font-size: var(--ap-text-button-md-size);
  line-height: var(--ap-text-button-md-line-height);
}
```

and in `Button.tsx` drop the `'md'` default and use `styles[size ?? 'auto']`. Grep `Button.module.css` for every other `.md` selector (e.g. `.md .icon`); give each an `.auto` twin in the same rule (`.md .icon, .auto .icon`).

- [ ] **Step 4: Run the whole suite**

Run: `npx vitest run src/components`
Expected: PASS. Existing tests that asserted `toHaveClass(styles.md)` on a control rendered without `size` now fail: change each to render with `size="md"` if it was testing md, or to `auto` if it was testing the default. Do not delete a test.

- [ ] **Step 5: Commit**

```bash
git add src/components/density.test.tsx src/components/control.module.css src/components/Button src/components/Input src/components/Select src/components/NativeSelect src/components/Combobox src/components/DatePicker
git commit -m "Controls with no size take density/control; an explicit size keeps its literal height"
```

---

### Task 3: Table, Scheduler and the side navigations read density

**Files:**
- Modify: `src/components/Table/Table.tsx`, `Table.module.css`, `Table.test.tsx`; `src/components/Scheduler/Scheduler.module.css`, `Scheduler.test.tsx`; `src/components/SideNav/SideNav.module.css`, `SideNav.test.tsx`; `src/components/SideNavSecondary/SideNavSecondary.module.css`, `SideNavSecondary.test.tsx`

**Interfaces:**
- Consumes: `--ap-density-row`, `--ap-density-row-header`, `--ap-density-hour`, `--ap-density-nav-item`.
- Produces: `TableProps.density` is now optional with no default; undefined renders the class `auto`.

- [ ] **Step 1: Write the failing tests**

Add to `Table.test.tsx` (use the file's existing minimal `columns`/`rows` fixtures):

```tsx
describe('density', () => {
  it('follows the token when no density is passed', () => {
    const { container } = render(<Table caption="People" columns={columns} rows={rows} getRowId={(r) => r.id} />);
    expect(container.firstElementChild).toHaveClass(styles.auto);
  });

  it('keeps an explicit density', () => {
    const { container } = render(<Table caption="People" columns={columns} rows={rows} getRowId={(r) => r.id} density="comfortable" />);
    expect(container.firstElementChild).toHaveClass(styles.comfortable);
    expect(container.firstElementChild).not.toHaveClass(styles.auto);
  });

  it('reads the row tokens, with the inline padding following the row', () => {
    const css = readCss('src/components/Table/Table.module.css');
    expect(block(css, '.auto .th {')).toContain('height: var(--ap-density-row-header);');
    expect(block(css, '.auto .td {')).toContain('height: var(--ap-density-row);');
  });
});
```

Add to `Scheduler.test.tsx`:

```ts
it('takes its hour from density', () => {
  expect(block(readCss('src/components/Scheduler/Scheduler.module.css'), '.root {')).toContain('--scheduler-hour: var(--ap-density-hour);');
});
```

Add to both `SideNav.test.tsx` and `SideNavSecondary.test.tsx` (path adjusted):

```ts
it('takes its item height from density, the padding what is left of it', () => {
  const item = block(readCss('src/components/SideNav/SideNav.module.css'), '.item {');
  expect(item).toContain('min-block-size: var(--ap-density-nav-item);');
  expect(item).toContain('padding-block: calc((var(--ap-density-nav-item) - var(--ap-text-body-md-line-height)) / 2);');
});
```

Import `readCss` and `block` from `@/test/css` where the file does not already.

- [ ] **Step 2: Run to see them fail**

Run: `npx vitest run src/components/Table src/components/Scheduler src/components/SideNav src/components/SideNavSecondary`
Expected: FAIL on the new cases.

- [ ] **Step 3: Implement**

`Table.tsx`: `density?: TableDensity;` with no default in the destructuring; the root class becomes `styles[density ?? 'auto']`. Update the prop's JSDoc: "Left out, the row follows `data-density`; `comfortable` or `compact` fixes it."

`Table.module.css`, beside the two density blocks:

```css
/* No density passed: the rows follow data-density. The inline padding is
   comfortable's 16 at 72 and compact's 12 at 48, a sixth of the row plus 4,
   so the two drawn pairs are kept without a sixth token. */
.auto .caption {
  padding-inline: calc(var(--ap-density-row) / 6 + var(--ap-spacing-050));
}

.auto .th {
  height: var(--ap-density-row-header);
  padding-inline: calc(var(--ap-density-row) / 6 + var(--ap-spacing-050));
}

.auto .td {
  height: var(--ap-density-row);
  padding-inline: calc(var(--ap-density-row) / 6 + var(--ap-spacing-050));
  vertical-align: middle;
}
```

Then grep the stylesheet for every other `.comfortable` / `.compact` selector (the collapse under `@container (max-width: 40rem)` sets `height: auto` on them) and give `.auto` the same treatment in each.

`Scheduler.module.css`: `--scheduler-hour: var(--ap-density-hour);` with the comment changed to "80 for the drawn 81 at comfortable, 64 at compact; the whole grid is placed from it." Placement is measured from the events layer's rect (Scheduler phase 2), so nothing in the TSX reads the number — confirm with `grep -n "scheduler-hour" src/components/Scheduler/Scheduler.tsx` that no code parses it.

`SideNav.module.css` and `SideNavSecondary.module.css`, `.item`: replace `min-block-size: var(--ap-spacing-500);` with `min-block-size: var(--ap-density-nav-item);` and the block padding with `padding-block: calc((var(--ap-density-nav-item) - var(--ap-text-body-md-line-height)) / 2);` (SideNavSecondary writes its padding as a shorthand; split it into `padding-block` and `padding-inline: var(--ap-spacing-200);`). At comfortable that is 9 + 22 + 9 = 40, the height the rule already produced through its minimum.

- [ ] **Step 4: Run**

Run: `npx vitest run src/components`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/Table src/components/Scheduler/Scheduler.module.css src/components/Scheduler/Scheduler.test.tsx src/components/SideNav src/components/SideNavSecondary
git commit -m "Table rows, the Scheduler's hour and the side navigations' items follow density"
```

---

### Task 4: The Table's current row

**Files:**
- Modify: `src/components/Table/Table.tsx`, `Table.module.css`, `Table.test.tsx`, `app/table/page.tsx` (props table and states)

**Interfaces:**
- Produces: `TableProps.currentId?: string | null`, `TableProps.onCurrentChange?: (id: string) => void`. The current row's `<tr>` has `data-current="true"`; its primary cell's button has `aria-current="true"`.

- [ ] **Step 1: Write the failing tests**

```tsx
describe('current row', () => {
  const props = { caption: 'People', columns, rows, getRowId: (r: (typeof rows)[number]) => r.id };

  it('draws no button without onCurrentChange', () => {
    render(<Table {...props} />);
    expect(within(screen.getAllByRole('row')[1]!).queryByRole('button')).toBeNull();
  });

  it('wraps the primary cell in a plain button that reports the row', async () => {
    const onCurrentChange = vi.fn();
    render(<Table {...props} onCurrentChange={onCurrentChange} />);
    const button = screen.getByRole('button', { name: rows[1]!.name });
    expect(button).toHaveAttribute('type', 'button');
    await userEvent.click(button);
    expect(onCurrentChange).toHaveBeenCalledWith(rows[1]!.id);
  });

  it('marks the current row for the eye and for a screen reader', () => {
    render(<Table {...props} onCurrentChange={() => {}} currentId={rows[0]!.id} />);
    expect(screen.getByRole('button', { name: rows[0]!.name })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('button', { name: rows[1]!.name })).not.toHaveAttribute('aria-current');
    expect(screen.getAllByRole('row')[1]).toHaveAttribute('data-current', 'true');
  });

  it('keeps the checkbox its own press', async () => {
    const onCurrentChange = vi.fn();
    render(<Table {...props} onCurrentChange={onCurrentChange} selected={new Set()} onSelectionChange={() => {}} />);
    await userEvent.click(screen.getAllByRole('checkbox')[1]!);
    expect(onCurrentChange).not.toHaveBeenCalled();
  });

  it('draws current as a ring, not the selection fill, so a row can be both', () => {
    const css = readCss('src/components/Table/Table.module.css');
    const rule = block(css, ".tr[data-current='true'] .td {");
    expect(rule).toContain('var(--ap-color-border-accent)');
    expect(rule).not.toContain('interactive-selected');
  });

  it('passes axe with a current and a selected row', async () => {
    const { container } = render(
      <Table {...props} onCurrentChange={() => {}} currentId={rows[0]!.id} selected={new Set([rows[0]!.id])} onSelectionChange={() => {}} />,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
```

The fixtures need a column with `primary: true` whose cell renders `r.name`; if the file's fixture has none, add `primary: true` to its name column. Import `within`, `userEvent`, `vi`, `axeViolations` as the file's other tests do.

- [ ] **Step 2: Run to see them fail**

Run: `npx vitest run src/components/Table`
Expected: FAIL on the new cases.

- [ ] **Step 3: Implement**

In `Table.tsx`, add the two props with JSDoc:

```ts
  /**
   * The row being looked at, as opposed to the rows chosen by checkbox. Its
   * primary cell's button carries `aria-current`; the row is drawn with the
   * Scheduler's ring for its selected card.
   */
  currentId?: string | null;
  /**
   * Makes the primary cell a button that reports its row. The primary cell's
   * content must then be plain — text, an Avatar — and hold nothing
   * interactive of its own, or a button would sit inside a button.
   */
  onCurrentChange?: (id: string) => void;
```

In the body row map, compute `const isCurrent = currentId === id;`, add `data-current={isCurrent ? 'true' : undefined}` to the `<tr>`, and render the primary cell's content as:

```tsx
{column.key === primaryKey && onCurrentChange ? (
  <button
    type="button"
    className={styles.current}
    aria-current={isCurrent ? 'true' : undefined}
    onClick={() => onCurrentChange(id)}
  >
    {column.cell(row)}
  </button>
) : (
  column.cell(row)
)}
```

In `Table.module.css`:

```css
/* --- the current row -------------------------------------------------------
 *
 * The one being looked at, not the ones chosen: those are the fill and the
 * start stripe above, and a row can be both. The ring is the Scheduler's for
 * its selected card, inset so it adds no width. */
.tr[data-current='true'] .td {
  box-shadow:
    inset 0 var(--ap-border-width-ring) 0 var(--ap-color-border-accent),
    inset 0 calc(-1 * var(--ap-border-width-ring)) 0 var(--ap-color-border-accent);
}

.tr[data-current='true'] .td:first-child {
  box-shadow:
    inset var(--ap-border-width-ring) 0 0 var(--ap-color-border-accent),
    inset 0 var(--ap-border-width-ring) 0 var(--ap-color-border-accent),
    inset 0 calc(-1 * var(--ap-border-width-ring)) 0 var(--ap-color-border-accent);
}

.tr[data-current='true'] .td:last-child {
  box-shadow:
    inset calc(-1 * var(--ap-border-width-ring)) 0 0 var(--ap-color-border-accent),
    inset 0 var(--ap-border-width-ring) 0 var(--ap-color-border-accent),
    inset 0 calc(-1 * var(--ap-border-width-ring)) 0 var(--ap-color-border-accent);
}

/* The primary cell as a button: the cell's own words, nothing drawn. */
.current {
  all: unset;
  cursor: pointer;
  border-radius: var(--ap-radius-sm);
}

.current:focus-visible {
  outline: var(--ap-border-width-ring) solid var(--ap-color-border-focus);
  outline-offset: var(--ap-focus-ring-offset);
}
```

If a selected row is also current, the selected rule's `box-shadow` on `:first-child` (the stripe) and the current rule collide; put the current rules **after** the selected ones and add the stripe to the `:first-child` current rule as its first shadow, `inset 3px 0 0 var(--ap-color-interactive-accent),`, only under `.tr[data-selected='true'][data-current='true'] .td:first-child`. Check every token named here exists (`--ap-border-width-ring`, `--ap-color-border-focus`, `--ap-radius-sm`); if one does not, use the one the Scheduler's `.event:focus-visible` uses.

In `app/table/page.tsx`, add `currentId` and `onCurrentChange` to the props table with the JSDoc's words, and a line under the states: "Current: the row being looked at, drawn with a ring, told by `aria-current`; a row can be current and selected."

- [ ] **Step 4: Run**

Run: `npx vitest run src/components/Table app/pages.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/Table app/table/page.tsx
git commit -m "Add the Table's current row: currentId and onCurrentChange, a ring and aria-current, apart from selection"
```

---

### Task 5: The Link says a new tab whenever it opens one

**Files:**
- Modify: `src/components/Link/Link.tsx`, `src/components/Link/Link.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
it('says a new tab for an internal link too', () => {
  render(<Link href="/screen/full" target="_blank">Open full screen</Link>);
  expect(screen.getByRole('link')).toHaveAccessibleName('Open full screen (opens in a new tab)');
});

it('shows the external icon only for an external link', () => {
  const { container } = render(<Link href="/screen/full" target="_blank">Open</Link>);
  expect(container.querySelector('svg')).toBeNull();
});
```

Check the second case against how the file draws the external icon today; if `external` draws no icon either, drop that case.

- [ ] **Step 2: Run to see it fail**

Run: `npx vitest run src/components/Link`
Expected: FAIL — name is "Open full screen".

- [ ] **Step 3: Implement**

`const newTab = target === '_blank';` and change the comment above it to: "The caller's `rel` joins `noreferrer` and does not replace it. A new tab is said whenever the link opens one, internal or not."

- [ ] **Step 4: Run** — `npx vitest run src/components/Link` → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/Link
git commit -m "The Link says it opens a new tab for an internal link too"
```

---

### Task 6: The site's chrome, left out on `/screen/full`

**Files:**
- Create: `app/ui/Chrome.tsx`, `app/ui/Chrome.test.tsx`
- Modify: `app/layout.tsx`

**Interfaces:**
- Produces: `Chrome({ skip, nav, footer, children }: { skip: ReactNode; nav: ReactNode; footer: ReactNode; children: ReactNode })`, a client component; `BARE_ROUTES = ['/screen/full']`.

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

const path = vi.hoisted(() => ({ current: '/' }));
vi.mock('next/navigation', () => ({ usePathname: () => path.current }));

import { Chrome } from './Chrome';

const draw = () =>
  render(
    <Chrome skip={<a href="#content">Skip</a>} nav={<nav aria-label="Site" />} footer={<footer />}>
      <p>Page</p>
    </Chrome>,
  );

describe('Chrome', () => {
  it('draws the rail, the column and main around a page', () => {
    path.current = '/button/';
    draw();
    expect(screen.getByRole('navigation', { name: 'Site' })).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveTextContent('Page');
  });

  it('draws the page alone on the full screen, trailing slash or not', () => {
    for (const p of ['/screen/full', '/screen/full/']) {
      path.current = p;
      const { unmount } = draw();
      expect(screen.queryByRole('navigation', { name: 'Site' })).toBeNull();
      expect(screen.getByText('Page')).toBeInTheDocument();
      unmount();
    }
  });
});
```

- [ ] **Step 2: Run** — `npx vitest run app/ui/Chrome.test.tsx` → FAIL (no module).

- [ ] **Step 3: Implement**

`app/ui/Chrome.tsx`:

```tsx
'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

/** Routes drawn without the site around them: the dense screen stands as a product would. */
export const BARE_ROUTES = ['/screen/full'];

/**
 * The site's rail, column and footer around a page, except on a bare route.
 * A client component only for the path; the rail and the footer stay server
 * components passed in. With `output: 'export'` the path is known at build,
 * so each route's HTML is written with or without the chrome.
 */
export function Chrome({ skip, nav, footer, children }: { skip: ReactNode; nav: ReactNode; footer: ReactNode; children: ReactNode }) {
  const path = (usePathname() ?? '/').replace(/\/$/, '');
  if (BARE_ROUTES.includes(path)) return <>{children}</>;
  return (
    <>
      {skip}
      <div className="shell">
        {nav}
        <div className="column">
          <main className="main" id="content" tabIndex={-1}>
            {children}
          </main>
          {footer}
        </div>
      </div>
    </>
  );
}
```

In `app/layout.tsx` replace the `<SkipLink />` and the `shell` div with `<Chrome skip={<SkipLink />} nav={<Nav />} footer={<Footer />}>{children}</Chrome>`, moving the existing comment about the column onto `Chrome`'s JSX. Keep `<Toaster />` and `<Analytics />` in `body`.

- [ ] **Step 4: Run** — `npx vitest run app` → PASS. `app/pages.test.tsx` mocks `usePathname` to `'/'`, so it is unaffected.

- [ ] **Step 5: Commit**

```bash
git add app/ui/Chrome.tsx app/ui/Chrome.test.tsx app/layout.tsx
git commit -m "Leave the site's chrome out on /screen/full"
```

---

### Task 7: The frame protocol

**Files:**
- Create: `app/screen/frame.ts`, `app/screen/frame.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export const widths = [1440, 1024, 768, 375] as const; export type FrameWidth = (typeof widths)[number];
  export type FrameMode = 'light' | 'dark';
  export type FrameState = { width: FrameWidth; density: Density; theme: FrameMode };
  export const DEFAULT_FRAME: FrameState; // { width: 1440, density: 'comfortable', theme: 'light' }
  export function parseFrame(search: string): FrameState;
  export function frameQuery(state: FrameState): string; // '?width=1024&density=compact&theme=dark', defaults omitted, '' for all defaults
  export type FrameMessage = { type: 'alpenglow:frame'; density: Density; theme: FrameMode };
  export function readMessage(event: { origin: string; data: unknown }, origin: string): FrameMessage | null;
  export function applyFrame(root: HTMLElement, state: Pick<FrameState, 'density' | 'theme'>): void;
  export const FRAME_SCRIPT: string; // inline, pre-paint: reads location.search and sets the two attributes
  ```

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { parseFrame, frameQuery, readMessage, applyFrame, DEFAULT_FRAME, FRAME_SCRIPT } from './frame';

describe('the frame’s query', () => {
  it('reads what it knows and ignores the rest', () => {
    expect(parseFrame('?width=768&density=compact&theme=dark')).toEqual({ width: 768, density: 'compact', theme: 'dark' });
    expect(parseFrame('?width=900&density=cosy&theme=sepia&x=1')).toEqual(DEFAULT_FRAME);
    expect(parseFrame('')).toEqual(DEFAULT_FRAME);
  });

  it('writes only what differs from the default, and round-trips', () => {
    expect(frameQuery(DEFAULT_FRAME)).toBe('');
    const s = { width: 375, density: 'compact', theme: 'dark' } as const;
    expect(parseFrame(frameQuery(s))).toEqual(s);
  });
});

describe('the frame’s messages', () => {
  const origin = 'https://alpenglow.example';
  const ok = { type: 'alpenglow:frame', density: 'compact', theme: 'dark' };

  it('accepts its own message from its own origin', () => {
    expect(readMessage({ origin, data: ok }, origin)).toEqual(ok);
  });

  it('refuses another origin', () => {
    expect(readMessage({ origin: 'https://evil.example', data: ok }, origin)).toBeNull();
  });

  it('refuses a value outside the enum, or another shape', () => {
    expect(readMessage({ origin, data: { ...ok, theme: 'sepia' } }, origin)).toBeNull();
    expect(readMessage({ origin, data: { ...ok, density: 'cosy' } }, origin)).toBeNull();
    expect(readMessage({ origin, data: 'alpenglow:frame' }, origin)).toBeNull();
    expect(readMessage({ origin, data: null }, origin)).toBeNull();
  });
});

describe('applying it', () => {
  it('sets both attributes, and removes density at comfortable', () => {
    const root = document.createElement('html');
    applyFrame(root, { density: 'compact', theme: 'dark' });
    expect(root.dataset).toMatchObject({ density: 'compact', theme: 'dark' });
    applyFrame(root, { density: 'comfortable', theme: 'light' });
    expect(root.hasAttribute('data-density')).toBe(false);
    expect(root.dataset.theme).toBe('light');
  });

  it('ships a pre-paint script that never touches the site’s stored theme', () => {
    expect(FRAME_SCRIPT).not.toContain('localStorage');
    expect(FRAME_SCRIPT).toContain('data-density');
  });
});
```

- [ ] **Step 2: Run** — `npx vitest run app/screen/frame.test.ts` → FAIL.

- [ ] **Step 3: Implement**

```ts
import { densityModes } from '@/tokens/density';
import type { Density } from '@/tokens/density';

/**
 * How /screen talks to /screen/full: the query carries a combination so it
 * can be linked and opened in a tab, and a message changes mode and density
 * in place so the frame does not reload. Width is never sent: it is the
 * iframe's own size, a real viewport.
 */

export const widths = [1440, 1024, 768, 375] as const;
export type FrameWidth = (typeof widths)[number];
export type FrameMode = 'light' | 'dark';
export type FrameState = { width: FrameWidth; density: Density; theme: FrameMode };
export type FrameMessage = { type: 'alpenglow:frame'; density: Density; theme: FrameMode };

export const DEFAULT_FRAME: FrameState = { width: 1440, density: 'comfortable', theme: 'light' };

const isDensity = (v: unknown): v is Density => (densityModes as readonly unknown[]).includes(v);
const isMode = (v: unknown): v is FrameMode => v === 'light' || v === 'dark';
const isWidth = (v: number): v is FrameWidth => (widths as readonly number[]).includes(v);

export function parseFrame(search: string): FrameState {
  const q = new URLSearchParams(search);
  const width = Number(q.get('width'));
  const density = q.get('density');
  const theme = q.get('theme');
  return {
    width: isWidth(width) ? width : DEFAULT_FRAME.width,
    density: isDensity(density) ? density : DEFAULT_FRAME.density,
    theme: isMode(theme) ? theme : DEFAULT_FRAME.theme,
  };
}

export function frameQuery(state: FrameState): string {
  const q = new URLSearchParams();
  if (state.width !== DEFAULT_FRAME.width) q.set('width', String(state.width));
  if (state.density !== DEFAULT_FRAME.density) q.set('density', state.density);
  if (state.theme !== DEFAULT_FRAME.theme) q.set('theme', state.theme);
  const s = q.toString();
  return s ? `?${s}` : '';
}

/** Only this site's own page may drive the frame, and only with values it knows. */
export function readMessage(event: { origin: string; data: unknown }, origin: string): FrameMessage | null {
  if (event.origin !== origin) return null;
  const d = event.data as Partial<FrameMessage> | null;
  if (!d || typeof d !== 'object' || d.type !== 'alpenglow:frame') return null;
  if (!isDensity(d.density) || !isMode(d.theme)) return null;
  return { type: 'alpenglow:frame', density: d.density, theme: d.theme };
}

export function applyFrame(root: HTMLElement, { density, theme }: Pick<FrameState, 'density' | 'theme'>) {
  root.setAttribute('data-theme', theme);
  if (density === 'comfortable') root.removeAttribute('data-density');
  else root.setAttribute('data-density', density);
}

/**
 * Before paint, from the query, so the frame never shows a light flash
 * before turning dark. The site's stored theme is not read: the screen's
 * mode is the frame's, and choosing it must not change the site's.
 */
export const FRAME_SCRIPT = `
try {
  var q = new URLSearchParams(location.search), r = document.documentElement;
  var t = q.get('theme'); r.setAttribute('data-theme', t === 'dark' ? 'dark' : 'light');
  if (q.get('density') === 'compact') r.setAttribute('data-density', 'compact'); else r.removeAttribute('data-density');
} catch (e) {}
`;
```

- [ ] **Step 4: Run** — PASS.

- [ ] **Step 5: Commit**

```bash
git add app/screen/frame.ts app/screen/frame.test.ts
git commit -m "Add the dense screen's frame protocol: query, messages checked by origin and value, a pre-paint script"
```

---

### Task 8: The practice's data

**Files:**
- Create: `app/screen/data.ts`, `app/screen/data.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export const DAY: ISODate = '2026-09-17';
  export const NOW: ISODateTime = '2026-09-17T11:20';
  export type Practitioner = { id: string; name: string; role: string; tone: SchedulerTone; hours: { start: number; end: number } };
  export const practitioners: readonly Practitioner[]; // five
  export const clients: readonly string[]; // sixty distinct names
  export const appointmentTypes: readonly { id: string; label: string; minutes: number; video?: boolean }[];
  export type Status = 'confirmed' | 'pending' | 'cancelled';
  export type Appointment = {
    id: string; client: string; practitionerId: string; typeId: string;
    start: ISODateTime; end: ISODateTime; status: Status;
    kind: 'appointment' | 'lunch' | 'external';
  };
  export function appointmentsFor(date: ISODate): Appointment[];
  ```

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { appointmentsFor, practitioners, clients, DAY, NOW } from './data';

describe('the practice’s data', () => {
  it('is the same day every time', () => {
    expect(appointmentsFor(DAY)).toEqual(appointmentsFor(DAY));
  });

  it('differs from one day to the next', () => {
    expect(appointmentsFor('2026-09-18')).not.toEqual(appointmentsFor(DAY));
  });

  it('gives the fixed day a plausible load', () => {
    const day = appointmentsFor(DAY).filter((a) => a.kind === 'appointment');
    expect(day.length).toBeGreaterThanOrEqual(30);
    expect(day.length).toBeLessThanOrEqual(36);
    expect(new Set(day.map((a) => a.status))).toEqual(new Set(['confirmed', 'pending', 'cancelled']));
    expect(day.some((a) => a.end <= NOW)).toBe(true);
    expect(day.some((a) => a.start >= NOW)).toBe(true);
  });

  it('never double-books a practitioner', () => {
    for (const date of [DAY, '2026-09-18', '2026-09-21']) {
      for (const p of practitioners) {
        const own = appointmentsFor(date)
          .filter((a) => a.practitionerId === p.id && a.status !== 'cancelled')
          .sort((a, b) => a.start.localeCompare(b.start));
        own.slice(1).forEach((a, i) => expect(a.start >= own[i]!.end, `${date} ${p.name} ${a.start}`).toBe(true));
      }
    }
  });

  it('keeps each practitioner inside their hours, with lunch', () => {
    for (const p of practitioners) {
      const own = appointmentsFor(DAY).filter((a) => a.practitionerId === p.id);
      expect(own.filter((a) => a.kind === 'lunch')).toHaveLength(1);
      for (const a of own) {
        expect(Number(a.start.slice(11, 13))).toBeGreaterThanOrEqual(p.hours.start);
        expect(a.end.slice(11) <= `${String(p.hours.end).padStart(2, '0')}:00`).toBe(true);
      }
    }
  });

  it('has one external event and a weekend with nobody booked', () => {
    expect(appointmentsFor(DAY).filter((a) => a.kind === 'external')).toHaveLength(1);
    expect(appointmentsFor('2026-09-20').filter((a) => a.kind === 'appointment')).toEqual([]);
  });

  it('has five practitioners and sixty distinct clients', () => {
    expect(practitioners).toHaveLength(5);
    expect(new Set(clients).size).toBe(60);
  });
});
```

- [ ] **Step 2: Run** — FAIL (no module).

- [ ] **Step 3: Implement**

```ts
import type { ISODate } from '@/components/Calendar/date';
import type { ISODateTime, SchedulerTone } from '@/components/Scheduler';

/**
 * Ridge Physio, a fictional practice. Every day is built from a seed taken
 * from its date, so it is plausible, never the same as the next, and always
 * the same as itself — screenshots, tests and axe see one screen.
 */

export const DAY: ISODate = '2026-09-17';
export const NOW: ISODateTime = '2026-09-17T11:20';

export type Practitioner = { id: string; name: string; role: string; tone: SchedulerTone; hours: { start: number; end: number } };

/** Ember is left out: against glow it is 1.01:1, the closest pair of the six. */
export const practitioners: readonly Practitioner[] = [
  { id: 'ana', name: 'Ana Ferreira', role: 'Physiotherapist', tone: 'glacier', hours: { start: 8, end: 17 } },
  { id: 'kwame', name: 'Kwame Mensah', role: 'Sports physio', tone: 'moss', hours: { start: 9, end: 18 } },
  { id: 'lin', name: 'Lin Zhao', role: 'Hydrotherapist', tone: 'amber', hours: { start: 8, end: 16 } },
  { id: 'sofia', name: 'Sofia Marques', role: 'Physiotherapist', tone: 'flare', hours: { start: 10, end: 19 } },
  { id: 'omar', name: 'Omar Haddad', role: 'Massage therapist', tone: 'glow', hours: { start: 9, end: 17 } },
];

const FIRST = ['Maya', 'Joaquim', 'Aisha', 'Tomás', 'Priya', 'Lucas', 'Ingrid', 'Mateo', 'Yuki', 'Daniel', 'Leila', 'Rui'];
const LAST = ['Costa', 'Okafor', 'Nguyen', 'Silva', 'Kowalski'];
/** Twelve first names by five last names: sixty, distinct, varied. */
export const clients: readonly string[] = FIRST.flatMap((f) => LAST.map((l) => `${f} ${l}`));

export const appointmentTypes = [
  { id: 'assessment', label: 'Assessment', minutes: 60 },
  { id: 'follow-up', label: 'Follow-up', minutes: 30 },
  { id: 'sports', label: 'Sports massage', minutes: 45 },
  { id: 'hydro', label: 'Hydrotherapy', minutes: 45 },
  { id: 'video', label: 'Video consult', minutes: 30, video: true },
] as const;

export type Status = 'confirmed' | 'pending' | 'cancelled';
export type Appointment = {
  id: string;
  client: string;
  practitionerId: string;
  typeId: string;
  start: ISODateTime;
  end: ISODateTime;
  status: Status;
  kind: 'appointment' | 'lunch' | 'external';
};

/** mulberry32: small, fast, and the same numbers on every machine. */
function random(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const seedOf = (date: ISODate) => [...date].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7);
const at = (date: ISODate, minutes: number): ISODateTime =>
  `${date}T${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

export function appointmentsFor(date: ISODate): Appointment[] {
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
  if (weekday === 0 || weekday === 6) return [];
  const rand = random(seedOf(date));
  const pick = <T,>(list: readonly T[]) => list[Math.floor(rand() * list.length)]!;
  const out: Appointment[] = [];
  let n = 0;

  for (const p of practitioners) {
    const lunch = (12 + (rand() < 0.5 ? 0 : 1)) * 60;
    out.push({ id: `${date}-${p.id}-lunch`, client: 'Lunch', practitionerId: p.id, typeId: 'lunch', start: at(date, lunch), end: at(date, lunch + 60), status: 'confirmed', kind: 'lunch' });

    let t = p.hours.start * 60;
    while (t < p.hours.end * 60) {
      if (t === lunch) { t += 60; continue; }
      const type = pick(appointmentTypes);
      const end = t + type.minutes;
      if (end > p.hours.end * 60 || (t < lunch && end > lunch)) { t += 15; continue; }
      // About one slot in four stays free, so the day has gaps to drag into.
      if (rand() < 0.25) { t += 30; continue; }
      const r = rand();
      const status: Status = r < 0.8 ? 'confirmed' : r < 0.93 ? 'pending' : 'cancelled';
      out.push({ id: `${date}-${++n}`, client: pick(clients), practitionerId: p.id, typeId: type.id, start: at(date, t), end: at(date, end), status, kind: 'appointment' });
      t = end;
    }
  }

  const host = pick(practitioners);
  const ext = out.find((a) => a.practitionerId === host.id && a.kind === 'appointment' && a.start >= at(date, 15 * 60));
  if (ext) Object.assign(ext, { client: 'Team meeting', typeId: 'external', kind: 'external', status: 'confirmed' });

  return out;
}
```

If the fixed day's count falls outside 30–36, tune the free-slot probability (0.25) until `2026-09-17` lands inside it and the test passes; the other days need only be plausible. If the three statuses do not all occur on the fixed day, tune the status thresholds the same way. Note the chosen numbers in the comment.

- [ ] **Step 4: Run** — PASS.

- [ ] **Step 5: Commit**

```bash
git add app/screen/data.ts app/screen/data.test.ts
git commit -m "Add Ridge Physio's seeded days for the dense screen"
```

---

### Task 9: The screen's state

**Files:**
- Create: `app/screen/state.ts`, `app/screen/state.test.ts`

**Interfaces:**
- Consumes: `Appointment`, `Status`, `appointmentsFor`, `DAY` (Task 8); `FilterValue` from `@/components/Filters`.
- Produces:
  ```ts
  export type Patch = { id: string; before: Partial<Appointment> | null; after: Partial<Appointment> | null };
  // before null = the appointment did not exist (create); after null = removed
  export type ScreenState = {
    date: ISODate; byId: Record<string, Appointment>; order: string[];
    filters: FilterValue[]; currentId: string | null; selected: Set<string>;
    drawerOpen: boolean; dialog: { start: ISODateTime; end: ISODateTime; practitionerId: string } | null;
  };
  export type Action =
    | { type: 'go'; date: ISODate }
    | { type: 'filter'; filters: FilterValue[] }
    | { type: 'current'; id: string | null }
    | { type: 'select'; ids: Set<string> }
    | { type: 'drawer'; open: boolean }
    | { type: 'dialog'; draft: ScreenState['dialog'] }
    | { type: 'apply'; patches: Patch[] };
  export function initialState(date?: ISODate): ScreenState;
  export function reducer(state: ScreenState, action: Action): ScreenState;
  export function visible(state: ScreenState): Appointment[];   // filtered, in start order
  export function move(state: ScreenState, id: string, next: { start: ISODateTime; end: ISODateTime; practitionerId?: string }): Patch[];
  export function setStatus(state: ScreenState, ids: Iterable<string>, status: Status): Patch[];
  export function create(state: ScreenState, a: Omit<Appointment, 'id'>): Patch[];
  export function invert(patches: Patch[]): Patch[];
  ```
  The component dispatches `{ type: 'apply', patches }` and keeps `invert(patches)` for the Toast's Undo.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { initialState, reducer, visible, move, setStatus, create, invert } from './state';
import { DAY } from './data';

const s0 = initialState();
const first = () => visible(s0).find((a) => a.kind === 'appointment')!;

describe('the screen’s state', () => {
  it('opens on the fixed day with nothing current', () => {
    expect(s0.date).toBe(DAY);
    expect(s0.currentId).toBeNull();
    expect(s0.selected.size).toBe(0);
  });

  it('filters by practitioner, type and status, all at once', () => {
    const a = first();
    const s = reducer(s0, { type: 'filter', filters: [{ key: 'practitioner', values: [a.practitionerId] }, { key: 'status', values: [a.status] }] });
    expect(visible(s).every((x) => x.practitionerId === a.practitionerId && x.status === a.status)).toBe(true);
  });

  it('clears current when its appointment is filtered away, and the selection with it', () => {
    const a = first();
    let s = reducer(s0, { type: 'current', id: a.id });
    s = reducer(s, { type: 'select', ids: new Set([a.id]) });
    s = reducer(s, { type: 'filter', filters: [{ key: 'practitioner', values: ['nobody'] }] });
    expect(visible(s)).toEqual([]);
    expect(s.currentId).toBeNull();
    expect(s.selected.size).toBe(0);
  });

  it('moves and undoes', () => {
    const a = first();
    const patches = move(s0, a.id, { start: `${DAY}T16:00`, end: `${DAY}T16:30` });
    const moved = reducer(s0, { type: 'apply', patches });
    expect(moved.byId[a.id]).toMatchObject({ start: `${DAY}T16:00`, end: `${DAY}T16:30` });
    expect(reducer(moved, { type: 'apply', patches: invert(patches) }).byId[a.id]).toEqual(a);
  });

  it('undoes the first change after a second one without losing the second', () => {
    const [a, b] = visible(s0).filter((x) => x.kind === 'appointment');
    const p1 = move(s0, a!.id, { start: `${DAY}T16:00`, end: `${DAY}T16:30` });
    const s1 = reducer(s0, { type: 'apply', patches: p1 });
    const p2 = setStatus(s1, [b!.id], 'cancelled');
    const s2 = reducer(s1, { type: 'apply', patches: p2 });
    const s3 = reducer(s2, { type: 'apply', patches: invert(p1) });
    expect(s3.byId[a!.id]).toEqual(a);
    expect(s3.byId[b!.id]!.status).toBe('cancelled');
  });

  it('confirms in bulk and undoes in one step', () => {
    const pending = visible(s0).filter((x) => x.status === 'pending');
    const patches = setStatus(s0, pending.map((x) => x.id), 'confirmed');
    const s = reducer(s0, { type: 'apply', patches });
    expect(pending.every((x) => s.byId[x.id]!.status === 'confirmed')).toBe(true);
    const back = reducer(s, { type: 'apply', patches: invert(patches) });
    expect(pending.every((x) => back.byId[x.id]!.status === 'pending')).toBe(true);
  });

  it('creates, undoes the creation, and closes the dialog', () => {
    let s = reducer(s0, { type: 'dialog', draft: { start: `${DAY}T17:00`, end: `${DAY}T17:30`, practitionerId: 'ana' } });
    const patches = create(s, { client: 'Maya Costa', practitionerId: 'ana', typeId: 'follow-up', start: `${DAY}T17:00`, end: `${DAY}T17:30`, status: 'pending', kind: 'appointment' });
    s = reducer(s, { type: 'apply', patches });
    expect(s.dialog).toBeNull();
    const id = patches[0]!.id;
    expect(s.byId[id]).toBeDefined();
    const back = reducer(s, { type: 'apply', patches: invert(patches) });
    expect(back.byId[id]).toBeUndefined();
    expect(back.order).not.toContain(id);
  });

  it('goes to another day, keeping filters and dropping current and selection', () => {
    const f = [{ key: 'status', values: ['pending'] }];
    let s = reducer(s0, { type: 'filter', filters: f });
    s = reducer(s, { type: 'current', id: first().id });
    s = reducer(s, { type: 'go', date: '2026-09-18' });
    expect(s.date).toBe('2026-09-18');
    expect(s.filters).toEqual(f);
    expect(s.currentId).toBeNull();
  });
});
```

- [ ] **Step 2: Run** — FAIL.

- [ ] **Step 3: Implement**

```ts
import type { ISODate } from '@/components/Calendar/date';
import type { ISODateTime } from '@/components/Scheduler';
import type { FilterValue } from '@/components/Filters';
import { appointmentsFor, DAY } from './data';
import type { Appointment, Status } from './data';

/**
 * One state behind both views. Every change is a list of patches, each an
 * appointment's fields before and after, so an Undo is the inverse list —
 * per appointment, never a snapshot of the day, so undoing an older change
 * keeps what came after it.
 */

export type Patch = { id: string; before: Partial<Appointment> | null; after: Partial<Appointment> | null };

export type ScreenState = {
  date: ISODate;
  byId: Record<string, Appointment>;
  order: string[];
  filters: FilterValue[];
  currentId: string | null;
  selected: Set<string>;
  drawerOpen: boolean;
  dialog: { start: ISODateTime; end: ISODateTime; practitionerId: string } | null;
};

export type Action =
  | { type: 'go'; date: ISODate }
  | { type: 'filter'; filters: FilterValue[] }
  | { type: 'current'; id: string | null }
  | { type: 'select'; ids: Set<string> }
  | { type: 'drawer'; open: boolean }
  | { type: 'dialog'; draft: ScreenState['dialog'] }
  | { type: 'apply'; patches: Patch[] };

function load(date: ISODate) {
  const list = appointmentsFor(date);
  return { byId: Object.fromEntries(list.map((a) => [a.id, a])), order: list.map((a) => a.id) };
}

export function initialState(date: ISODate = DAY): ScreenState {
  return { date, ...load(date), filters: [], currentId: null, selected: new Set(), drawerOpen: false, dialog: null };
}

const FIELD: Record<string, (a: Appointment) => string> = {
  practitioner: (a) => a.practitionerId,
  type: (a) => a.typeId,
  status: (a) => a.status,
};

function matches(a: Appointment, filters: FilterValue[]) {
  return filters.every((f) => f.values.length === 0 || !FIELD[f.key] || f.values.includes(FIELD[f.key]!(a)));
}

export function visible(state: ScreenState): Appointment[] {
  return state.order
    .map((id) => state.byId[id]!)
    .filter((a) => matches(a, state.filters))
    .sort((a, b) => a.start.localeCompare(b.start) || a.practitionerId.localeCompare(b.practitionerId));
}

/** What is out of view cannot be current or chosen. */
function prune(state: ScreenState): ScreenState {
  const shown = new Set(visible(state).map((a) => a.id));
  const currentId = state.currentId && shown.has(state.currentId) ? state.currentId : null;
  const selected = new Set([...state.selected].filter((id) => shown.has(id)));
  return { ...state, currentId, selected, drawerOpen: state.drawerOpen && currentId !== null };
}

export function reducer(state: ScreenState, action: Action): ScreenState {
  switch (action.type) {
    case 'go':
      return { ...state, date: action.date, ...load(action.date), currentId: null, selected: new Set(), drawerOpen: false, dialog: null };
    case 'filter':
      return prune({ ...state, filters: action.filters });
    case 'current':
      return { ...state, currentId: action.id, drawerOpen: action.id !== null && state.drawerOpen };
    case 'select':
      return { ...state, selected: new Set(action.ids) };
    case 'drawer':
      return { ...state, drawerOpen: action.open && state.currentId !== null };
    case 'dialog':
      return { ...state, dialog: action.draft };
    case 'apply': {
      const byId = { ...state.byId };
      let order = state.order;
      let created = false;
      for (const p of action.patches) {
        if (p.after === null) {
          delete byId[p.id];
          order = order.filter((id) => id !== p.id);
        } else if (p.before === null) {
          byId[p.id] = p.after as Appointment;
          if (!order.includes(p.id)) order = [...order, p.id];
          created = true;
        } else {
          byId[p.id] = { ...byId[p.id]!, ...p.after };
        }
      }
      return prune({ ...state, byId, order, dialog: created ? null : state.dialog });
    }
  }
}

function pick(a: Appointment, keys: (keyof Appointment)[]): Partial<Appointment> {
  return Object.fromEntries(keys.map((k) => [k, a[k]]));
}

export function move(state: ScreenState, id: string, next: { start: ISODateTime; end: ISODateTime; practitionerId?: string }): Patch[] {
  const a = state.byId[id]!;
  const after: Partial<Appointment> = { start: next.start, end: next.end, practitionerId: next.practitionerId ?? a.practitionerId };
  return [{ id, before: pick(a, ['start', 'end', 'practitionerId']), after }];
}

export function setStatus(state: ScreenState, ids: Iterable<string>, status: Status): Patch[] {
  return [...ids].map((id) => ({ id, before: { status: state.byId[id]!.status }, after: { status } }));
}

let made = 0;
export function create(state: ScreenState, a: Omit<Appointment, 'id'>): Patch[] {
  const id = `${state.date}-new-${++made}`;
  return [{ id, before: null, after: { ...a, id } }];
}

export function invert(patches: Patch[]): Patch[] {
  return patches.map((p) => ({ id: p.id, before: p.after, after: p.before })).reverse();
}
```

Note in `invert`, a created appointment inverts to `after: null` (a removal) and a removal inverts to `before: null` with the full appointment (a re-creation); `apply` handles both.

- [ ] **Step 4: Run** — PASS.

- [ ] **Step 5: Commit**

```bash
git add app/screen/state.ts app/screen/state.test.ts
git commit -m "Add the dense screen's state: one reducer, filters that prune, per-appointment patches for Undo"
```

---

### Task 10: The screen

**Files:**
- Create: `app/screen/Screen.tsx`, `app/screen/zones/Navigation.tsx`, `app/screen/zones/DayBar.tsx`, `app/screen/zones/Day.tsx`, `app/screen/zones/Appointments.tsx`, `app/screen/zones/Details.tsx`, `app/screen/zones/NewAppointment.tsx`, `app/screen/zones/Commands.tsx`, `app/screen/zones/glyphs.tsx`, `app/screen/screen.module.css`, `app/screen/Screen.test.tsx`, `app/screen/local-values.test.ts`, `app/screen/full/page.tsx`

**Interfaces:**
- Consumes: Tasks 3–9. `applyFrame`, `readMessage`, `FRAME_SCRIPT` from `./frame`; `InlineScript` from `@ui/InlineScript`.
- Produces: `Screen({ onTheme, initial }: { onTheme?: (theme: FrameMode) => void; initial?: ScreenState })` — the whole screen, client; `initial` exists for tests and defaults to `initialState()`; `componentsUsed(): string[]` exported from `app/screen/composition.ts` (below) for the page's count.

Each zone is a component receiving `state` and `dispatch` (or narrower props) from `Screen.tsx`, which holds `useReducer(reducer, initial ?? null, (i) => i ?? initialState())` and nothing else of its own but the palette's open state, the tab and the SideNav's sheet. The zones:

- **`Navigation.tsx`** — the `SideNav` with items Today (current), Calendar, Clients, Messages, Reports and footer Settings; each `href` is `#today`, `#calendar`, … and a click on any but Today sets a `section` state in `Screen` that swaps the body for an `EmptyState` titled after the section ("Clients", description "Nothing here yet — the screen draws one day.", size `lg`). Pass `narrow="(max-width: 800px)"` so 768 gets the sheet, with a comment: "The spec's table puts 768 in the sheet; SIDE_NAV_NARROW is 760. Waiting on the breakpoints piece of wave 4." `collapsed` is `useMediaQuery('(max-width: 1279px)')`, same comment.
- **`DayBar.tsx`** — the TopBar is in `Screen`; this zone is the row under it: `Filters` with fields practitioner (the five names), type (the five types), status (the three), then three `Badge`s counting the *visible* appointments by status (`tone` success for confirmed, warning for pending, neutral for cancelled, words "34 booked", "5 pending", "2 cancelled"), then `Button` **New appointment** dispatching `dialog` with the next free half hour of the first practitioner after `NOW`.
- **`Day.tsx`** — the `Scheduler` with `label="Day schedule"`, in `view="day"`, `date={state.date}`, `now={NOW}` when `state.date === DAY` else `null`, `resources` from `practitioners` (with `Avatar` and `tone`, `workingHours`), `events` from `visible(state)` mapped to `SchedulerEvent`: `title` = client, `resourceId` = practitionerId, `kind` = `status` for appointments (`confirmed` / `pending` / `cancelled`), `'blocker'` for lunch, `'external'` for the external, `icon` = the video glyph for `video` types. `selectedId={state.currentId}`, `onSelect={(e) => dispatch({ type: 'current', id: e.id })}` then open the drawer; `onMove` and `onResize` dispatch `apply` with `move(...)` and raise `toast('Moved Maya Costa to 16:00', { action: { label: 'Undo', onClick: () => dispatch({ type: 'apply', patches: invert(p) }) } })`; `onCreate` dispatches `dialog` with the draft. At 375 (`useMediaQuery('(max-width: 480px)')`), `resources` is the one chosen in a `Select` above the Scheduler labelled "Practitioner".
- **`Appointments.tsx`** — the `Table`, caption "Appointments on Thursday 17 September", columns Time (`start`–`end` formatted with the Scheduler's time helpers or `Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' })` on the wall-clock parts — never a `Date` built from a string with a zone), Client (`primary: true`, plain text), Practitioner, Type, Status (`Badge`). `currentId` / `onCurrentChange` from the state; `selected` / `onSelectionChange` dispatch `select`; `bulkActions` renders **Confirm** and **Cancel** buttons dispatching `setStatus` with a Toast and Undo, then `clear()`; `empty` is "No appointments match these filters." When `currentId` changes, an effect scrolls `document.querySelector(\`[data-current="true"]\`)` into view with `block: 'nearest'`. Only appointments (not lunch, not the external) are rows.
- **`Details.tsx`** — the `Drawer`, `open={state.drawerOpen}`, `title` = the client, body: practitioner, type, time, status `Badge`, and actions **Confirm** (if pending), **Cancel appointment** (unless cancelled), each through `setStatus` with a Toast and Undo; its foot says "Changes reset on reload." in `text/tertiary` via a `caption` text style.
- **`NewAppointment.tsx`** — the `Dialog`, `open={state.dialog !== null}`, `title="New appointment"`, a form of `Field`s: Client (`Combobox` over `clients`), Practitioner (`Select`), Type (`Select`, which sets the end from its minutes), Date (`DatePicker`), Start (`Select` of quarter hours inside the practitioner's hours). Actions **Cancel** and **Book**; Book dispatches `apply` with `create(...)` as `pending` and raises a Toast with Undo. Required fields show the Field's `error` on submit when empty. Read `CalendarProps` in `src/components/Calendar/Calendar.tsx` for the DatePicker's value and change prop names before wiring it.
- **`Commands.tsx`** — the `CommandPalette` bound with `useCommandPaletteShortcut(() => setOpen(true), 'k')`; groups **Clients** (every client with an appointment that day; choosing one makes their first appointment current and opens the drawer) and **Commands**: "Go to today", "Go to tomorrow", "Go to yesterday", "New appointment", "Switch to dark" / "Switch to light" (calls `onTheme`), each with its `shortcut` text where one exists. The TopBar's search button opens the same palette and shows the hook's hint.
- **`glyphs.tsx`** — the few 16px glyphs the screen needs (today, calendar, clients, messages, reports, settings, bell, video, search), drawn as the Scheduler page's `Video` and `Person` are: `viewBox="0 0 16 16"`, `stroke="currentColor"`, `strokeWidth="1.5"`, `aria-hidden`.

**`Screen.tsx`** lays out: `SideNav` | column of `TopBar` (brand: a 20px mountain glyph and "Ridge Physio"; start: ‹ `Button` › `Button`, a heading with the date `Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })` of the wall-clock date, **Today** `Button`; actions: search `Button` with the palette hint, bell `Button` `aria-label="Notifications"`, `Avatar` "Rita Alves"), `DayBar`, body. Body at ≥1280 (`useMediaQuery('(min-width: 1280px)')`): `Day` and `Appointments` side by side; below it, `Tabs` with items **Schedule** and **Appointments** (`keepMounted`). `Details`, `NewAppointment` and `Commands` are siblings at the end. The screen is one `<div className={styles.screen}>` whose landmarks are the SideNav's `nav`, a `header` from the TopBar, and a `main` around the day bar and body.

**`screen.module.css`** — layout only:

```css
/*
 * The dense screen's layout: grid, areas, widths. Nothing else — every
 * colour, size of type and space here is a token, and local-values.test.ts
 * fails on anything that is not. The breakpoints are literals waiting on
 * the breakpoints piece of wave 4.
 */
.screen {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  block-size: 100dvh;
  background: var(--ap-color-surface-base);
}

.column {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  min-inline-size: 0;
}

.dayBar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ap-spacing-150);
  padding: var(--ap-spacing-200) var(--ap-spacing-300);
}

.newAppointment { margin-inline-start: auto; }

.body {
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
  gap: var(--ap-spacing-300);
  padding: 0 var(--ap-spacing-300) var(--ap-spacing-300);
  min-block-size: 0;
}

@media (max-width: 1279px) {
  .body { grid-template-columns: minmax(0, 1fr); }
}

@media (max-width: 480px) {
  .dayBar, .body { padding-inline: var(--ap-spacing-200); }
}
```

**`full/page.tsx`**:

```tsx
'use client';

import { useEffect } from 'react';
import { InlineScript } from '@ui/InlineScript';
import { Screen } from '../Screen';
import { FRAME_SCRIPT, applyFrame, readMessage } from '../frame';
import type { FrameMode } from '../frame';

/** The screen alone, as a product would stand. Framed by /screen, or opened in a tab from it. */
export default function FullScreen() {
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const m = readMessage(event, window.location.origin);
      if (m) applyFrame(document.documentElement, m);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const onTheme = (theme: FrameMode) => {
    const root = document.documentElement;
    applyFrame(root, { theme, density: root.dataset.density === 'compact' ? 'compact' : 'comfortable' });
    if (window.parent !== window) window.parent.postMessage({ type: 'alpenglow:frame-theme', theme }, window.location.origin);
  };

  return (
    <>
      <InlineScript html={FRAME_SCRIPT} />
      <Screen onTheme={onTheme} />
    </>
  );
}
```

and a sibling `app/screen/full/layout.tsx` exporting `metadata = { title: 'A scheduling day — Alpenglow', robots: { index: false } }` and returning `children` (the page is a client component and cannot export metadata).

`app/screen/composition.ts`:

```ts
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/** The distinct package components the screen imports: the count on /screen. */
export function componentsUsed(root = 'app/screen'): string[] {
  const files = readdirSync(root, { recursive: true, encoding: 'utf8' })
    .filter((f) => /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f) && f !== 'composition.ts' && !f.startsWith('Frame') && f !== 'page.tsx');
  const names = files.flatMap((f) => [...readFileSync(join(root, f), 'utf8').matchAll(/from '@\/components\/([A-Z]\w+)'/g)].map((m) => m[1]!));
  return [...new Set(names)].sort();
}
```

- [ ] **Step 1: Write the failing tests**

`app/screen/local-values.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { readCss } from '@/test/css';
import { componentsUsed } from './composition';

/**
 * "Built only from Alpenglow": the screen's one stylesheet lays things out
 * and takes every colour, size of type and space from a token.
 */
const PAINT = /^(color|background(-color)?|border(-\w+)?-color|font(-\w+)?|line-height|letter-spacing|padding(-\w+)*|margin(-\w+)*|gap|row-gap|column-gap|box-shadow|border-radius|outline(-\w+)?)$/;

function offenders(css: string) {
  return [...css.matchAll(/([\w-]+)\s*:\s*([^;{}]+);/g)]
    .filter(([, prop]) => PAINT.test(prop!))
    .filter(([, , value]) => {
      const bare = value!.replace(/var\(--ap-[\w-]+\)/g, '').replace(/\b0\b/g, '').replace(/\b(auto|inherit|none|transparent|currentColor)\b/g, '');
      return /[\d#]|rgb|hsl|oklch/.test(bare);
    })
    .map(([decl]) => decl);
}

describe('the dense screen', () => {
  it('finds a literal when there is one', () => {
    expect(offenders('.a { color: #fff; padding: 8px var(--ap-spacing-100); gap: var(--ap-spacing-100); margin: 0 auto; }')).toEqual([
      'color: #fff;',
      'padding: 8px var(--ap-spacing-100);',
    ]);
  });

  it('holds no local colour, type or space', () => {
    expect(offenders(readCss('app/screen/screen.module.css'))).toEqual([]);
  });

  it('is built from the package’s components', () => {
    const used = componentsUsed();
    for (const c of ['Scheduler', 'Table', 'SideNav', 'TopBar', 'Filters', 'CommandPalette', 'Toast', 'Drawer', 'Dialog', 'Tabs', 'EmptyState']) {
      expect(used, c).toContain(c);
    }
  });
});
```

`app/screen/Screen.test.tsx` — mock `next/navigation` and `window.matchMedia` exactly as `app/pages.test.tsx` does, set `matches` from a `wide` flag so `(min-width: 1280px)` is true, and mock the Scheduler's layer rects as `src/components/Scheduler/Scheduler.test.tsx` does if a gesture is driven. Cases:

```tsx
it('opens on Thursday 17 September with the day and the table side by side', async () => {
  render(<Screen />);
  expect(screen.getByRole('heading', { name: /Thursday 17 September/ })).toBeInTheDocument();
  expect(screen.getByRole('table', { name: /Appointments on Thursday 17 September/ })).toBeInTheDocument();
  expect(screen.getByRole('region', { name: 'Day schedule' })).toBeInTheDocument();
});

it('marks the row when a card is chosen, and the card when a row is', async () => {
  render(<Screen />);
  const [card] = within(scheduler()).getAllByRole('button', { name: /Confirmed|Pending/ });
  await userEvent.click(card!);
  expect(within(table()).getByRole('button', { current: true })).toBeInTheDocument();
  const rowButton = within(table()).getAllByRole('button').find((b) => !b.hasAttribute('aria-current'))!;
  await userEvent.click(rowButton);
  expect(within(scheduler()).getByRole('button', { current: true })).toHaveAccessibleName(new RegExp(rowButton.textContent!));
});

it('confirms the pending in bulk and undoes it', async () => {
  render(<><Screen /><Toaster /></>);
  const pending = within(table()).getAllByRole('row').filter((r) => within(r).queryByText('Pending')).slice(0, 2);
  for (const r of pending) await userEvent.click(within(r).getByRole('checkbox'));
  await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
  for (const r of pending) expect(within(r).getByText('Confirmed')).toBeInTheDocument();
  await userEvent.click(await screen.findByRole('button', { name: 'Undo' }));
  for (const r of pending) expect(within(r).getByText('Pending')).toBeInTheDocument();
});

it.each([
  ['at rest', async () => {}],
  ['with the drawer open', async () => { await userEvent.click(within(table()).getAllByRole('button')[0]!); }],
  ['with the dialog open', async () => { await userEvent.click(screen.getByRole('button', { name: 'New appointment' })); }],
  ['on an empty section', async () => { await userEvent.click(screen.getByRole('link', { name: 'Clients' })); }],
])('passes axe %s', async (_, act) => {
  const { container } = render(<Screen />);
  await act();
  expect(await axeViolations(container)).toEqual([]);
});

it('shows the empty table and an empty day when the filters match nothing', async () => {
  const initial = reducer(initialState(), { type: 'filter', filters: [{ key: 'practitioner', values: ['nobody'] }] });
  const { container } = render(<Screen initial={initial} />);
  expect(within(table()).getByText('No appointments match these filters.')).toBeInTheDocument();
  expect(await axeViolations(container)).toEqual([]);
});
```

`scheduler()` and `table()` are small helpers: `screen.getByRole('region', { name: 'Day schedule' })` and `screen.getByRole('table', { name: /Appointments on/ })`. `Toaster` comes from `@/components/Toast`. The Appointments zone passes `selectionLabel={(a) => \`Select ${a.client} at ${time(a)}\`}`; if the bulk bar's Confirm button name differs, follow `Table.test.tsx`'s bulk-action tests.

- [ ] **Step 2: Run** — `npx vitest run app/screen` → FAIL.

- [ ] **Step 3: Implement** the files above.

- [ ] **Step 4: Run** — `npx vitest run app` → PASS, `app/pages.test.tsx` included (it renders `full/page.tsx` too).

- [ ] **Step 5: Look at it.** Start the dev server with `preview_start` (`.claude/launch.json`), open `/screen/full/`, `/screen/full/?density=compact`, `/screen/full/?theme=dark`, and at `resize_window` 1440, 1024, 768, 375: the SideNav expanded / rail / sheet / sheet, the tabs below 1280, one practitioner at 375, no horizontal overflow (`document.documentElement.scrollWidth <= innerWidth`), the focus ring on a card, a row, the palette. Drag a card and press Undo. Fix what is wrong before committing, each fix with a test where one can hold it.

- [ ] **Step 6: Commit**

```bash
git add app/screen/Screen.tsx app/screen/zones app/screen/screen.module.css app/screen/composition.ts app/screen/Screen.test.tsx app/screen/local-values.test.ts app/screen/full
git commit -m "Add the dense screen: Ridge Physio's day, the Scheduler and the Table on one state, at /screen/full"
```

---

### Task 11: The `/screen` page and its frame

**Files:**
- Create: `app/screen/page.tsx`, `app/screen/Frame.tsx`, `app/screen/Frame.test.tsx`
- Modify: `app/ui/contents.ts`

**Interfaces:**
- Consumes: `widths`, `parseFrame`, `frameQuery`, `DEFAULT_FRAME`, `FrameState` (Task 7); `componentsUsed()` (Task 10).
- Produces: `Frame({ count }: { count: number })`, client.

`page.tsx` is a server component: `const used = componentsUsed();` and a `DocPage` holding, in order:
1. `<h1>A scheduling day</h1>` and the line "Built only from Alpenglow, nothing drawn beside it."
2. `<Frame count={used.length} />`.
3. `## What it proves` — a list: the Scheduler and the Table on one state (current row both ways, filters, bulk, drag with Undo); the form in a dialog; the empty first-run state; density on every control, row, hour and nav item; both modes, with a `Ratio` for each of these pairs in light and dark, as `app/scheduler/page.tsx` draws its `PAIRS`: `text/primary` on `surface/base`, `text/secondary` on `surface/raised`, `border/accent` on `surface/raised` at 3:1 (the current row's ring), `interactive/on-accent` on `interactive/accent`; and the targets in compact: controls 32, nav items 32, rows 48, all over WCAG 2.5.8's 24, and comfortable again under touch.
4. `## What moved up the list` — three items, each with a sentence and a link to its commit on GitHub (fill the hash from `git log --format=%h -1 -- <path>` after Tasks 1–5 are committed): the density layer; the Table's current row; the Link's new-tab announcement for an internal link. And one open line: "The SideNav's narrow query and the screen's own breakpoints are literals, waiting on breakpoints as tokens."
5. `## Composition` — a `Table` of zones: SideNav, TopBar, Filters and Badges, Scheduler, Table, Tabs (below 1280), Drawer, Dialog (Field, Combobox, Select, DatePicker), CommandPalette, Toast, EmptyState; and a line listing `used.join(', ')`.
6. "Not checked: Safari, Firefox, a real touch device, a screen reader."

`Frame.tsx`:

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Link } from '@/components/Link';
import { DEFAULT_FRAME, frameQuery, parseFrame, widths } from './frame';
import type { FrameState, FrameWidth } from './frame';
import styles from './frame.module.css';

const HEIGHT = 900;

export function Frame({ count }: { count: number }) {
  const [state, setState] = useState<FrameState>(DEFAULT_FRAME);
  // The combination the iframe was loaded with. Its src is built from this
  // alone, so a change of mode or density travels by message and never reloads
  // it; the width is the iframe's own size and is not in its src at all.
  const [first, setFirst] = useState<FrameState | null>(null);
  const [room, setRoom] = useState<number | null>(null);
  const well = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);

  // The combination is in the page's query, so it can be linked.
  useEffect(() => {
    const s = parseFrame(window.location.search);
    setState(s);
    setFirst(s);
  }, []);
  useEffect(() => {
    const url = `${window.location.pathname}${frameQuery(state)}`;
    window.history.replaceState(null, '', url);
    frame.current?.contentWindow?.postMessage({ type: 'alpenglow:frame', density: state.density, theme: state.theme }, window.location.origin);
  }, [state]);

  // The screen's own "Switch to dark" tells the page, so the bar says what is shown.
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== frame.current?.contentWindow) return;
      const t = (e.data as { type?: string; theme?: string } | null)?.theme;
      if ((e.data as { type?: string })?.type === 'alpenglow:frame-theme' && (t === 'light' || t === 'dark')) setState((s) => ({ ...s, theme: t }));
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  useEffect(() => {
    const el = well.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setRoom(entry!.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scale = room === null ? 1 : Math.min(1, room / state.width);
  const open = `/screen/full/${frameQuery(state)}`;
  const src = first && `/screen/full/${frameQuery({ ...first, width: DEFAULT_FRAME.width })}`;

  return (
    <section aria-label="The screen" className={styles.frame}>
      <div className={styles.actions}>
        <Link href={open} target="_blank" variant="standalone">Open full screen</Link>
        <Link href="https://github.com/fernandorviana/alpenglow/tree/main/app/screen" external variant="standalone">Source</Link>
        <span className={styles.count}>{count} components, 0 local values</span>
      </div>
      <div className={styles.bar}>
        <SegmentedControl label="Width" options={widths.map((w) => ({ value: String(w), label: String(w) }))} value={String(state.width)} onChange={(v) => setState((s) => ({ ...s, width: Number(v) as FrameWidth }))} />
        <SegmentedControl label="Density" options={[{ value: 'comfortable', label: 'Comfortable' }, { value: 'compact', label: 'Compact' }]} value={state.density} onChange={(v) => setState((s) => ({ ...s, density: v as FrameState['density'] }))} />
        <SegmentedControl label="Mode" options={[{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]} value={state.theme} onChange={(v) => setState((s) => ({ ...s, theme: v as FrameState['theme'] }))} />
      </div>
      <div ref={well} className={styles.well} style={{ blockSize: HEIGHT * scale }}>
        {src && <iframe
          ref={frame}
          title="Ridge Physio, a scheduling day built from Alpenglow"
          src={src}
          width={state.width}
          height={HEIGHT}
          className={styles.screen}
          style={{ transform: `scale(${scale})` }}
          onLoad={() => frame.current?.contentWindow?.postMessage({ type: 'alpenglow:frame', density: state.density, theme: state.theme }, window.location.origin)}
        />}
      </div>
      {scale < 1 && <p className={styles.caption}>Shown at {Math.round(scale * 100)}%</p>}
    </section>
  );
}
```

Resolve the site's base path the way other pages build internal hrefs (grep `DOCS_BASE` / `basePath` usage under `app/`); if none does, the `Link` and `iframe` hrefs are root-relative as written.

`app/screen/frame.module.css` (site stylesheet, not the screen's, so the local-values test does not read it): `.well { overflow: hidden; border: var(--ap-border-width-hairline) solid var(--ap-color-border-subtle); border-radius: var(--ap-radius-xl); }`, `.screen { border: 0; transform-origin: 0 0; display: block; }`, `.bar { display: flex; flex-wrap: wrap; gap: var(--ap-spacing-200); }`, `.actions { display: flex; flex-wrap: wrap; align-items: center; gap: var(--ap-spacing-300); }`, `.count` and `.caption` in `caption/md` and `text/secondary`, `.frame { display: grid; gap: var(--ap-spacing-200); }`.

In `contents.ts`, add `{ href: '/screen', label: 'A scheduling day' }` as the first item of **Start here**.

- [ ] **Step 1: Write the failing test** — `app/screen/Frame.test.tsx`:

```tsx
it('draws the three switches and an iframe at the chosen width', () => {
  render(<Frame count={11} />);
  expect(screen.getByRole('radiogroup', { name: 'Width' })).toBeInTheDocument();
  expect(screen.getByTitle(/Ridge Physio/)).toHaveAttribute('width', '1440');
});

it('says the full screen opens in a new tab and carries the combination', async () => {
  render(<Frame count={11} />);
  await userEvent.click(screen.getByRole('radio', { name: 'Compact' }));
  const link = screen.getByRole('link', { name: /Open full screen \(opens in a new tab\)/ });
  expect(link.getAttribute('href')).toContain('density=compact');
});

it('sends mode and density to the frame, to its own origin only', async () => {
  render(<Frame count={11} />);
  const iframe = screen.getByTitle(/Ridge Physio/) as HTMLIFrameElement;
  const post = vi.spyOn(iframe.contentWindow!, 'postMessage');
  await userEvent.click(screen.getByRole('radio', { name: 'Dark' }));
  expect(post).toHaveBeenLastCalledWith({ type: 'alpenglow:frame', density: 'comfortable', theme: 'dark' }, window.location.origin);
});

it('ignores a theme message from anything but its own frame', () => {
  render(<Frame count={11} />);
  window.dispatchEvent(new MessageEvent('message', { origin: window.location.origin, data: { type: 'alpenglow:frame-theme', theme: 'dark' } }));
  expect(screen.getByRole('radio', { name: 'Light' })).toBeChecked();
});
```

Use the SegmentedControl's actual roles from its own test file if they differ from `radiogroup` / `radio`. jsdom lacks `ResizeObserver`: stub it at the top of the file as the other tests that need it do (grep `ResizeObserver` under `src`).

- [ ] **Step 2: Run** — FAIL.
- [ ] **Step 3: Implement** the files above.
- [ ] **Step 4: Run** — `npx vitest run app` → PASS.
- [ ] **Step 5: Look at it** in the dev server: `/screen/` switches width (scaled caption at 1440 in the doc column), density and mode without a reload (the network panel shows one document request for the iframe), the "Switch to dark" command in the framed palette flips the bar, Open full screen opens the same combination. Light and dark of the *site* unchanged throughout.
- [ ] **Step 6: Commit**

```bash
git add app/screen/page.tsx app/screen/Frame.tsx app/screen/Frame.test.tsx app/screen/frame.module.css app/ui/contents.ts
git commit -m "Add /screen: the dense screen in a frame with width, density and mode, what it proves and what moved up the list"
```

---

### Task 12: The Density page under Foundations

**Files:**
- Create: `app/density/page.tsx`
- Modify: `app/ui/contents.ts`, `app/foundations/page.tsx` (its section card for the new page, following how `data-vis` was added)

**Interfaces:**
- Consumes: `density` (Task 1).

The page, in the DocPage shape: an intro ("How much room a row, a control and an hour take. Comfortable is what is drawn; compact is chosen on any element."); a `Table` generated from `density` with columns Token (mono), Comfortable, Compact, Read by (`use`); **Choosing** — compact where a person scans many rows with a pointer, comfortable elsewhere, and a sentence on explicit sizes winning; **Touch** — the rule and why, with the 24 / 32 figures; **Try it** — two `div`s side by side, the second with `data-density="compact"`, each holding a Button, an Input, a Select (all without `size`), a three-row `Table` without `density`, and a two-hour `Scheduler` slice (`hours={{ start: 9, end: 11 }}`, three events), each captioned with its mode; **In code** — a `CodeBlock` with `<div data-density="compact">…</div>` and the Tailwind `h-(--density-row)` line; **In Figma** — the Alpenglow Density collection and its two modes.

Add `{ href: '/density', label: 'Density' }` after Space and shape in Foundations.

- [ ] **Step 1: Write the failing test** — append to `app/pages.test.tsx`'s neighbour, a new `app/density/page.test.tsx`:

```tsx
it('lists every density token with both values', () => {
  render(<DensityPage />);
  for (const [name, v] of Object.entries(density)) {
    const row = screen.getByRole('row', { name: new RegExp(`density/${name}`) });
    expect(row).toHaveTextContent(String(v.comfortable));
    expect(row).toHaveTextContent(String(v.compact));
  }
});

it('draws the compact specimen inside data-density', () => {
  const { container } = render(<DensityPage />);
  expect(container.querySelector('[data-density="compact"] table')).not.toBeNull();
});
```

(The page is covered by `app/pages.test.tsx`'s axe run automatically.)

- [ ] **Step 2: Run** — FAIL. **Step 3: Implement.** **Step 4: Run** `npx vitest run app` — PASS; `npm run build:search` to index it.
- [ ] **Step 5: Commit**

```bash
git add app/density app/ui/contents.ts app/foundations/page.tsx
git commit -m "Add the Density page under Foundations"
```

---

### Task 13: Records, gates and the browser

**Files:**
- Modify: `CHANGELOG.md`, `MEMORY.md`, `README.md` (counts, if it lists token layers or pages), `docs/superpowers/specs/2026-09-18-completeness-roadmap.md`

- [ ] **Step 1: Changelog, under Unreleased.** Added: the density layer (five tokens, compact on any element, comfortable under touch; the `auto` size and `density` default); Table `currentId` / `onCurrentChange`; the Density page; the dense screen at `/screen`. Changed: none. Fixed: the Link announces a new tab for an internal `target="_blank"`.

- [ ] **Step 2: `MEMORY.md`.** Under the roadmap entry's claimed list, the dense screen's line: built, the spec and plan paths, the decisions that look like mistakes (iframe over scoped container; Table current as a ring not a fill; `.auto` padding derived from the token; the Table's inline padding `row / 6 + 4`; narrow query 800 on the screen). A new invariant: **compact does not apply to touch**, with the reason and the test that holds it (`generated.test.ts`). In "Needs the account owner" or the Figma list: the Alpenglow Density collection to apply, beside the 36 `category/*` and `chart/*`. Update the Theme / Scale rows of the Architecture table with the Density layer.

- [ ] **Step 3: Roadmap.** In wave 4's table, mark **The dense screen** done with the date and the commits, and note in its row that density became a foundation and the Table's current row and the Link's announcement moved up.

- [ ] **Step 4: Gates.**

Run: `npm run check && npm run build:lib && npm run check:package && npm run build:docs`
Expected: all pass. `build:docs` writes `out/screen/full/index.html` without the rail (`grep -c 'class="shell"' out/screen/full/index.html` → 0) and `out/screen/index.html` with it.

- [ ] **Step 5: The browser matrix.** On `/screen/`: four widths × two modes × two densities, each seen; the focus ring by eye on a card, a row's button, the frame's switches; 375 with no horizontal overflow inside the frame; ⌘K inside the frame (click into it first — the site's own ⌘K answers outside it); a drag with Undo; the Dialog and the Drawer. Record what the Browser pane cannot show (touch's comfortable fallback; Esc into the dialog, as on 2026-09-23) in the page's "Not checked" and in `MEMORY.md`.

- [ ] **Step 6: Review.** Run the code-review phase Fernando asks for over the branch (`superpowers:requesting-code-review`), fix what it finds with a test each, record what is not fixed.

- [ ] **Step 7: Commit** (on Fernando's go-ahead)

```bash
git add CHANGELOG.md MEMORY.md README.md docs/superpowers/specs/2026-09-18-completeness-roadmap.md docs/superpowers/specs/2026-09-23-dense-screen-design.md docs/superpowers/plans/2026-09-23-dense-screen.md
git commit -m "Record the dense screen: changelog, MEMORY.md, the roadmap's wave 4 row"
```
