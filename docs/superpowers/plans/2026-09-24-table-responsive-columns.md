# Table responsive columns Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The Table's columns shrink to a minimum and then leave by priority as the Table's own width shrinks, its row actions gathering into "⋯" first, in place of today's collapse to a list under 40rem.

**Architecture:** A pure module, `src/components/Table/columns.ts`, turns the columns' sizing (width, minimum, priority, the primary and sorted keys, the selection and action extras) into thresholds and then into a string of scoped CSS: a base for the widest state and one `@container (width < Npx)` block per step down. The Table renders that string in a `<style>` as the first child of its root (which is already `container-type: inline-size`), scoped by a `useId` on `data-table`. Nothing is measured; the rules arrive in the server's HTML. Row actions render twice, inline and gathered, and the rules show one of the two.

**Tech Stack:** React 19.2 (server-safe `useId`, an in-place `<style>`), CSS Modules, container queries and `cqi` units, Vitest + Testing Library under jsdom, Next 16 for the docs site.

**Spec:** `docs/superpowers/specs/2026-09-24-table-responsive-columns-design.md` — read it before any task. Decision numbers below are the spec's.

## Global Constraints

- The names of the original product and its Figma file never appear in code, file names, comments, the package or technical docs.
- Stage by path (`git add <paths>`), never `git add -A` or `git add .`: other sessions leave untracked files in the worktree.
- Commit subjects are one plain sentence saying what is now true (see `git log --oneline -10`), no `feat:` prefixes. Every commit message ends with a blank line and then `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Before editing anything under `app/`, read the relevant guide in `node_modules/next/dist/docs/` (this Next has breaking changes). The docs pages touched here are client components (`'use client'`).
- `src/components/Table/Table.tsx` stays without `'use client'`: it may import only React names the server build has (`useId` is one; `useState`, `useEffect`, `useRef` are not). `src/components/directives.test.ts` enforces this.
- The package does not depend on `@carbon/icons-react` at runtime: any glyph in `src/` is inlined (as `src/components/statusGlyphs.tsx` does). The site (`app/`) may import Carbon.
- Every px the arithmetic uses is named once, in `columns.ts`, with the token or drawing it comes from in its comment: 96 (`spacing/1100`), 160 (`spacing/1300`), 56 (the drawn selection column), 2 (the frame's hairline, both sides), 40 (a comfortable control), 4 (`spacing/050`), 32 (`spacing/200` × 2).
- No `@media` width outside the breakpoint scale (`src/styles/breakpoints.test.ts`). The generated `@container` px are content arithmetic and are allowed.
- `npm run check` (typecheck, lint, tests) passes at the end of every task. `npm run build:docs` passes before the last commit.
- Comments say why, in the house voice (plain sentences, British spelling as the surrounding code uses), at the surrounding density. No comment restates the code.

## Review Focus

1. **Two Tables on one page** — each Table's rules must name only its own `data-table`; a narrow sidebar Table must not hide columns of a wide one. Pinned in Task 3 ("scopes its rules to itself").
2. **The empty and loading states** — the spanning `td` carries no `data-col`, so no generated rule can hide the only content those states have. Pinned in Task 3.
3. **The server's HTML** — a Server Component page renders the Table; the `<style>` with its `@container` rules must be in `renderToString`'s output, since nothing runs after load to add it. Pinned in Task 3.
4. **A row with no actions, and a Table with no rows** — `rowActions` returning `[]` leaves the cell empty (no stray "⋯"), and an empty Table still gives the action column one button's width. Pinned in Task 4.
5. **The screen's bulk bar next to row buttons of the same name** — row-level "Confirm" and "Cancel" must not make the bar's buttons ambiguous to a user of a screen reader or to the tests; the screen's tests scope the bar's buttons to its group. Pinned in Task 5.

---

### Task 1: The arithmetic — `columns.ts`

**Files:**
- Create: `src/components/Table/columns.ts`
- Create: `src/components/Table/columns.test.ts`
- Modify: `src/components/Table/index.ts`, `src/index.ts`, `src/index.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces (exact names, used by Tasks 3 and 4):
  - `type ColumnSizing = { key: string; width?: number; minWidth?: number; priority?: number }`
  - `type ColumnLayout = { columns: readonly ColumnSizing[]; primaryKey?: string; sortKey?: string; selection: boolean; inlineButtons: number; gatheredButtons: number }`
  - `type Thresholds = { gather?: number; leave: { key: string; below: number }[]; floor: number }`
  - `minimumOf(column, primaryKey?): number`, `actionWidth(buttons): number`, `rankColumns(columns, primaryKey?, sortKey?): ColumnSizing[]`, `columnThresholds(layout): Thresholds`, `columnCss(scope: string, layout: ColumnLayout): string`
  - constants `DEFAULT_MIN_WIDTH`, `PRIMARY_MIN_WIDTH`, `SELECTION_WIDTH`, `FRAME_BORDER`, `ACTION_BUTTON`, `ACTION_GAP`, `ACTION_PADDING`
  - The attributes the CSS targets, which Task 3 and 4 must put in the DOM: `data-table` on the root; `data-col="<key>"` on a column's `th` and every `td`; `data-actions="column"` on the action `th`; `data-actions="inline"` and `data-actions="gathered"` on the two action groups in a cell.

- [ ] **Step 1: Write the failing tests**

`src/components/Table/columns.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  actionWidth,
  columnCss,
  columnThresholds,
  minimumOf,
  rankColumns,
} from './columns';
import type { ColumnLayout } from './columns';

/** The Table page's Try it, reduced: a primary, two flexible columns and a fixed one, selection, three buttons inline. */
const tryIt: ColumnLayout = {
  columns: [
    { key: 'name' },
    { key: 'status' },
    { key: 'visits', width: 80 },
    { key: 'seen' },
  ],
  primaryKey: 'name',
  selection: true,
  inlineButtons: 3,
  gatheredButtons: 1,
};

describe('minimumOf', () => {
  it('is 96 unless told, 160 for the primary, and a fixed column’s own width', () => {
    expect(minimumOf({ key: 'a' })).toBe(96);
    expect(minimumOf({ key: 'a' }, 'a')).toBe(160);
    expect(minimumOf({ key: 'a', minWidth: 120 })).toBe(120);
    // A fixed column does not shrink, so its minimum is its width and minWidth is ignored.
    expect(minimumOf({ key: 'a', width: 136, minWidth: 300 })).toBe(136);
  });
});

describe('actionWidth', () => {
  it('is the cell’s padding, 40 a button and 4 between, and nothing without buttons', () => {
    expect(actionWidth(0)).toBe(0);
    expect(actionWidth(1)).toBe(72);
    expect(actionWidth(3)).toBe(160);
  });
});

describe('rankColumns', () => {
  it('keeps source order when no priority is given, and never ranks the primary', () => {
    const ranked = rankColumns([{ key: 'a' }, { key: 'b' }, { key: 'c' }], 'a');
    expect(ranked.map((c) => c.key)).toEqual(['b', 'c']);
  });

  it('puts columns with a priority first, lowest number first, ties in source order', () => {
    const ranked = rankColumns(
      [{ key: 'a' }, { key: 'b', priority: 2 }, { key: 'c', priority: 1 }, { key: 'd' }, { key: 'e', priority: 2 }],
      'a',
    );
    expect(ranked.map((c) => c.key)).toEqual(['c', 'b', 'e', 'd']);
  });

  it('raises the sorted column above every priority', () => {
    const ranked = rankColumns([{ key: 'a' }, { key: 'b', priority: 1 }, { key: 'c' }], 'a', 'c');
    expect(ranked.map((c) => c.key)).toEqual(['c', 'b']);
  });

  it('ignores a priority on the primary: it never leaves', () => {
    const ranked = rankColumns([{ key: 'a', priority: 9 }, { key: 'b' }], 'a');
    expect(ranked.map((c) => c.key)).toEqual(['b']);
  });
});

describe('columnThresholds', () => {
  it('adds the minimums up, the least important column leaving first', () => {
    // floor: frame 2 + selection 56 + one gathered button 72 + primary 160 = 290.
    // status +96 = 386, visits +80 = 466, seen +96 = 562.
    expect(columnThresholds(tryIt)).toEqual({
      gather: 650, // 562 with the three inline buttons (160) in place of the one (72)
      leave: [
        { key: 'seen', below: 562 },
        { key: 'visits', below: 466 },
        { key: 'status', below: 386 },
      ],
      floor: 290,
    });
  });

  it('has nothing to gather when the inline actions are already one button', () => {
    expect(columnThresholds({ ...tryIt, inlineButtons: 1 }).gather).toBeUndefined();
  });

  it('counts no selection and no action column when there are none', () => {
    const t = columnThresholds({ ...tryIt, selection: false, inlineButtons: 0, gatheredButtons: 0 });
    expect(t.floor).toBe(162);
    expect(t.gather).toBeUndefined();
  });

  it('keeps the sorted column to the last', () => {
    const t = columnThresholds({ ...tryIt, sortKey: 'seen' });
    expect(t.leave.map((l) => l.key)).toEqual(['visits', 'status', 'seen']);
  });

  it('with no primary, everything can leave and the floor is the extras', () => {
    const t = columnThresholds({ ...tryIt, primaryKey: undefined });
    expect(t.floor).toBe(130);
    expect(t.leave.at(-1)).toEqual({ key: 'name', below: 226 });
  });
});

describe('columnCss', () => {
  const css = columnCss('t', tryIt);
  const root = '[data-table="t"]';

  it('keeps the table as wide as what never leaves, so below it the region scrolls', () => {
    expect(css).toContain(`${root} table { min-width: 288px; }`);
  });

  it('gives a fixed column its px once, and leaves the primary without a width so it takes the rest', () => {
    expect(css).toContain(`${root} th[data-col="visits"] { width: 80px; }`);
    expect(css).toContain(`${root} th[data-col="name"] { width: auto; }`);
    expect(css).not.toMatch(/th\[data-col="name"\] \{ width: calc/);
  });

  it('shares what is left among the flexible columns in proportion to their minimums', () => {
    // Inline: taken = 2 + 56 + 160 + 80 = 298; shares = 160 + 96 + 96 = 352.
    expect(css).toContain(`${root} th[data-col="status"] { width: calc((100cqi - 298px) * 96 / 352); }`);
    // Gathered: taken = 2 + 56 + 72 + 80 = 210.
    expect(css).toContain(`${root} th[data-col="status"] { width: calc((100cqi - 210px) * 96 / 352); }`);
  });

  it('sizes the action column inline, then gathered', () => {
    expect(css).toContain(`${root} th[data-actions="column"] { width: 160px; }`);
    expect(css).toContain(`${root} th[data-actions="column"] { width: 72px; }`);
  });

  it('shows the inline actions until they gather, then the one "⋯"', () => {
    expect(css).toContain(`${root} [data-actions="gathered"] { display: none; }`);
    const gather = css.slice(css.indexOf('@container (width < 650px)'));
    expect(gather).toContain(`${root} [data-actions="inline"] { display: none; }`);
    expect(gather).toContain(`${root} [data-actions="gathered"] { display: inline-flex; }`);
  });

  it('hides each column below its threshold, the widest step first so the narrower ones win', () => {
    const at = (n: number) => css.indexOf(`@container (width < ${n}px)`);
    expect(at(650)).toBeGreaterThan(-1);
    expect(at(650)).toBeLessThan(at(562));
    expect(at(562)).toBeLessThan(at(466));
    expect(at(466)).toBeLessThan(at(386));
    expect(css.slice(at(562), at(466))).toContain(`${root} [data-col="seen"] { display: none; }`);
    expect(css.slice(at(386))).toContain(`${root} [data-col="status"] { display: none; }`);
  });

  it('never hides the primary', () => {
    expect(css).not.toContain('[data-col="name"] { display: none; }');
  });

  it('writes no action column rule when there is none', () => {
    expect(columnCss('t', { ...tryIt, inlineButtons: 0, gatheredButtons: 0 })).not.toContain('data-actions');
  });

  it('escapes a quote or a backslash in a key or the scope, so the selector stays valid', () => {
    const odd = columnCss('a"b', { ...tryIt, columns: [{ key: 'name' }, { key: 'x"y\\z' }] });
    expect(odd).toContain('[data-table="a\\"b"]');
    expect(odd).toContain('[data-col="x\\"y\\\\z"]');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/components/Table/columns.test.ts`
Expected: FAIL — `Failed to resolve import "./columns"`.

- [ ] **Step 3: Write the module**

`src/components/Table/columns.ts`:

```ts
/**
 * Which of the Table's columns are shown at which width of the Table itself,
 * and how wide each one is. Pure: the Table writes what `columnCss` returns
 * into a `<style>` of its own, so nothing is measured, nothing waits for
 * JavaScript, and the rules arrive in the server's HTML.
 *
 * A column shrinks to its minimum, then leaves whole, the least important
 * first; the row's actions gather into "⋯" before any column leaves; the
 * primary, selection and action columns never do. Spec:
 * docs/superpowers/specs/2026-09-24-table-responsive-columns-design.md.
 */

/** `spacing/1100`: a column's minimum when it declares none. */
export const DEFAULT_MIN_WIDTH = 96;
/** `spacing/1300`: the primary column's, which carries the row's name. */
export const PRIMARY_MIN_WIDTH = 160;
/** The selection column as drawn; `.selectCell` in Table.module.css says it too. */
export const SELECTION_WIDTH = 56;
/** The frame's hairline, once on each side: the root is the container, the table sits inside the frame. */
export const FRAME_BORDER = 2;
/** An action button, the comfortable control. Compact's 32 is counted as 40, so compact has room to spare. */
export const ACTION_BUTTON = 40;
/** `spacing/050` between action buttons. */
export const ACTION_GAP = 4;
/** The action cell's inline padding at comfortable, `spacing/200` on each side. */
export const ACTION_PADDING = 32;

export type ColumnSizing = {
  key: string;
  /** Fixed: keeps this width in px and leaves whole. */
  width?: number;
  /** A flexible column's border box at its narrowest, in px. */
  minWidth?: number;
  /** 1 is the most important. */
  priority?: number;
};

export type ColumnLayout = {
  columns: readonly ColumnSizing[];
  /** Never leaves. */
  primaryKey?: string;
  /** Raised above every priority while sorted, so the column a reader ordered by stays. */
  sortKey?: string;
  selection: boolean;
  /** Buttons in the action cell while the actions are inline; 0 with no action column. */
  inlineButtons: number;
  /** Buttons once the actions gather into "⋯": 1, or 0 with no action column. */
  gatheredButtons: number;
};

export type Thresholds = {
  /** Below this container width the inline actions gather. Absent when there is nothing to gather. */
  gather?: number;
  /** The columns that can leave, least important first, each with the width below which it is hidden. */
  leave: { key: string; below: number }[];
  /** What never leaves, with the actions gathered. Below it the region scrolls sideways. */
  floor: number;
};

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

export function minimumOf(column: ColumnSizing, primaryKey?: string): number {
  return column.width ?? column.minWidth ?? (column.key === primaryKey ? PRIMARY_MIN_WIDTH : DEFAULT_MIN_WIDTH);
}

export function actionWidth(buttons: number): number {
  return buttons > 0 ? ACTION_PADDING + buttons * ACTION_BUTTON + (buttons - 1) * ACTION_GAP : 0;
}

/**
 * The columns that can leave, most important first: the sorted one, then
 * those with a priority, lowest first, then those without, in source order.
 * Ties keep source order.
 */
export function rankColumns(columns: readonly ColumnSizing[], primaryKey?: string, sortKey?: string): ColumnSizing[] {
  const order = (column: ColumnSizing, index: number) =>
    [column.key === sortKey ? 0 : 1, column.priority ?? Number.POSITIVE_INFINITY, index] as const;
  return columns
    .map((column, index) => ({ column, order: order(column, index) }))
    .filter(({ column }) => column.key !== primaryKey)
    // Infinity minus Infinity is NaN, which is falsy: two columns with no
    // priority fall through to their source order.
    .sort((a, b) => a.order[0] - b.order[0] || a.order[1] - b.order[1] || a.order[2] - b.order[2])
    .map(({ column }) => column);
}

/** Everything around the columns: the frame, the selection column, the action column. */
function extras(layout: ColumnLayout, buttons: number): number {
  return FRAME_BORDER + (layout.selection ? SELECTION_WIDTH : 0) + actionWidth(buttons);
}

/**
 * A set of columns fits when the container holds the extras, the fixed
 * widths and the flexible minimums. Each flexible column's share is in
 * proportion to its minimum (see `columnCss`), so the plain sum is enough.
 */
export function columnThresholds(layout: ColumnLayout): Thresholds {
  const { columns, primaryKey, sortKey, inlineButtons, gatheredButtons } = layout;
  const stay = columns.filter((column) => column.key === primaryKey);
  const floor = extras(layout, gatheredButtons) + sum(stay.map((column) => minimumOf(column, primaryKey)));
  let need = floor;
  const leave = rankColumns(columns, primaryKey, sortKey).map((column) => {
    need += minimumOf(column, primaryKey);
    return { key: column.key, below: need };
  });
  const gather =
    inlineButtons > gatheredButtons ? need - actionWidth(gatheredButtons) + actionWidth(inlineButtons) : undefined;
  return { gather, leave: leave.reverse(), floor };
}

/** A quoted, escaped attribute value, so any key or id makes a valid selector. */
const quoted = (value: string) => `"${value.replace(/["\\]/g, '\\$&')}"`;

const query = (below: number, rules: string[]) => `@container (width < ${below}px) {\n${rules.join('\n')}\n}`;

/**
 * The rules for one Table, scoped to `[data-table=scope]`: a base for the
 * widest state, then a container query for each step down, widest first so
 * a narrower one, later in the sheet, wins. The container is the Table's
 * root, so `cqi` is a hundredth of the root's width.
 */
export function columnCss(scope: string, layout: ColumnLayout): string {
  const { columns, primaryKey, sortKey, inlineButtons, gatheredButtons } = layout;
  const root = `[data-table=${quoted(scope)}]`;
  const cells = (key: string) => `${root} [data-col=${quoted(key)}]`;
  const head = (key: string) => `${root} th[data-col=${quoted(key)}]`;
  const stay = columns.filter((column) => column.key === primaryKey);
  const ranked = rankColumns(columns, primaryKey, sortKey);
  const { gather, leave, floor } = columnThresholds(layout);

  /**
   * The widths while `shown` are shown, most important first, and the action
   * cell holds `buttons`. The first flexible column — the primary, or else
   * the most important — has no width and takes what is left, so a bounded
   * region's scrollbar comes off it instead of pushing the table past its
   * frame. The others share in proportion to their minimums.
   */
  const widths = (shown: ColumnSizing[], buttons: number) => {
    const fixed = shown.filter((column) => column.width !== undefined);
    const flexible = shown.filter((column) => column.width === undefined);
    const taken = extras(layout, buttons) + sum(fixed.map((column) => column.width!));
    const shares = sum(flexible.map((column) => minimumOf(column, primaryKey)));
    const rules = flexible.map((column, index) =>
      index === 0
        ? `${head(column.key)} { width: auto; }`
        : `${head(column.key)} { width: calc((100cqi - ${taken}px) * ${minimumOf(column, primaryKey)} / ${shares}); }`,
    );
    if (buttons > 0) rules.push(`${root} th[data-actions="column"] { width: ${actionWidth(buttons)}px; }`);
    return rules;
  };

  const all = [...stay, ...ranked];
  const rules = [
    `${root} table { min-width: ${floor - FRAME_BORDER}px; }`,
    ...all.filter((column) => column.width !== undefined).map((column) => `${head(column.key)} { width: ${column.width}px; }`),
    ...widths(all, gather !== undefined ? inlineButtons : gatheredButtons),
  ];
  if (gather !== undefined) {
    rules.push(
      `${root} [data-actions="gathered"] { display: none; }`,
      query(gather, [
        `${root} [data-actions="inline"] { display: none; }`,
        `${root} [data-actions="gathered"] { display: inline-flex; }`,
        ...widths(all, gatheredButtons),
      ]),
    );
  }
  leave.forEach(({ key, below }, index) => {
    const shown = [...stay, ...ranked.slice(0, ranked.length - index - 1)];
    rules.push(query(below, [`${cells(key)} { display: none; }`, ...widths(shown, gatheredButtons)]));
  });
  return rules.join('\n');
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/components/Table/columns.test.ts`
Expected: PASS, every test. If `columnThresholds(tryIt)` differs, recompute by hand from the comments in the test before touching the code: the test's arithmetic is the spec's.

- [ ] **Step 5: Export it**

`src/components/Table/index.ts` — add after the existing exports:

```ts
export { columnThresholds } from './columns';
export type { ColumnSizing, ColumnLayout, Thresholds } from './columns';
```

`src/index.ts` — change the Table block to:

```ts
export { Table, columnThresholds } from './components/Table/index';
export type {
  TableProps,
  BulkActionsApi,
  Column,
  ColumnAlign,
  TableDensity,
  Sort,
  SortDirection,
  ColumnSizing,
  ColumnLayout,
  Thresholds,
} from './components/Table/index';
```

`src/index.test.ts` — add inside `describe('the package root', …)`:

```ts
  it('exports the Table’s thresholds for a caller who wants the numbers', () => {
    expect(root.columnThresholds).toBeTypeOf('function');
  });
```

- [ ] **Step 6: Run the whole check**

Run: `npm run check`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/Table/columns.ts src/components/Table/columns.test.ts src/components/Table/index.ts src/index.ts src/index.test.ts
git commit -F - <<'EOF'
The Table's column arithmetic is a pure module: thresholds from minimums and ranks, and the rules they become

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 2: The Button's icon-only form

**Files:**
- Modify: `src/components/Button/Button.tsx`
- Modify: `src/components/Button/Button.module.css`
- Test: `src/components/Button/Button.test.tsx`
- Modify: `app/button/page.tsx` (props row; the Labels section's icon-only example)

**Interfaces:**
- Consumes: nothing.
- Produces: `<Button icon={node} aria-label="…" />` — `icon` and `aria-label` required together; with `icon`, `iconStart`, `iconEnd` and `children` are not allowed. Class `styles.iconOnly` on the element. Task 4 uses it for the inline actions and the "⋯".

- [ ] **Step 1: Write the failing tests**

In `src/components/Button/Button.test.tsx`, add `within` to the `@testing-library/react` import, add `import { block, readCss } from '@/test/css';`, and append:

```tsx
describe('Button — icon only', () => {
  it('draws the icon alone, hidden, and takes its name from aria-label', () => {
    render(<Button icon={<svg data-testid="glyph" />} aria-label="Confirm" />);
    const button = screen.getByRole('button', { name: 'Confirm' });
    expect(button).toHaveClass(styles.iconOnly!);
    expect(within(button).getByTestId('glyph').parentElement).toHaveAttribute('aria-hidden', 'true');
  });

  it('keeps its name as a link too', () => {
    render(<Button href="/next" icon={<svg />} aria-label="Next page" />);
    expect(screen.getByRole('link', { name: 'Next page' })).toHaveClass(styles.iconOnly!);
  });

  it('does not compile without a name, or with a label beside the icon', () => {
    // @ts-expect-error — an icon says nothing to a screen reader
    render(<Button icon={<svg />} />);
    // @ts-expect-error — an icon-only button draws no label
    render(<Button icon={<svg />} aria-label="Add">Add</Button>);
  });

  it('is square at every size and density: no padding, one to one, after the sizes it overrides', () => {
    // jsdom has no layout, so the rule is read: the height is the size's or
    // the density's, and aspect-ratio makes the width follow it.
    const css = readCss('src/components/Button/Button.module.css');
    const rule = block(css, '.iconOnly {');
    expect(rule).toMatch(/aspect-ratio:\s*1\b/);
    expect(rule).toMatch(/padding-inline:\s*0\b/);
    expect(css.indexOf('.iconOnly {')).toBeGreaterThan(css.indexOf('.lg {'));
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/components/Button/Button.test.tsx`
Expected: FAIL — no `iconOnly` class, and `no block: .iconOnly {`. (`npm run typecheck` would also report the two `@ts-expect-error` lines as unused.)

- [ ] **Step 3: Implement**

In `Button.tsx`, replace `type BaseProps = { … }` with:

```ts
/**
 * A label, with an icon on either side, or an icon alone. Alone, the button
 * is square and its name is required: the icon says nothing to a screen
 * reader. The dense screen recorded its absence; the Table's row actions
 * need it.
 */
type ContentProps =
  | { icon?: undefined; iconStart?: ReactNode; iconEnd?: ReactNode; children?: ReactNode }
  | {
      icon: ReactNode;
      'aria-label': string;
      iconStart?: undefined;
      iconEnd?: undefined;
      children?: undefined;
    };

type BaseProps = {
  size?: ControlSize;
  /** Renders a spinner, hides the label without changing the button's width, and blocks activation. */
  loading?: boolean;
  fullWidth?: boolean;
} & ContentProps;
```

Replace `type LooseProps = BaseProps & { … }` with (the implementation's own, loose shape — the union is for callers):

```ts
type LooseProps = {
  size?: ControlSize;
  loading?: boolean;
  icon?: ReactNode;
  iconStart?: ReactNode;
  iconEnd?: ReactNode;
  fullWidth?: boolean;
  children?: ReactNode;
  variant?: 'solid' | 'outline' | 'ghost';
  tone?: (typeof buttonFillTones)[number];
  href?: string;
  render?: LinkRender;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
};
```

In `ButtonImpl`, destructure `icon` beside `iconStart`, add `icon !== undefined && styles.iconOnly,` to `classes` after `fullWidth && styles.fullWidth,`, and make the content span:

```tsx
      <span className={styles.content}>
        {icon !== undefined ? (
          <span className={styles.icon} aria-hidden="true">
            {icon}
          </span>
        ) : (
          <>
            {iconStart && (
              <span className={styles.icon} aria-hidden="true">
                {iconStart}
              </span>
            )}
            {children}
            {iconEnd && (
              <span className={styles.icon} aria-hidden="true">
                {iconEnd}
              </span>
            )}
          </>
        )}
      </span>
```

In `Button.module.css`, directly after the `.lg { … }` block:

```css
/* Icon only. As wide as it is tall — the size's height, or the density's —
   with no padding, so the capsule's radius draws it round. After the sizes,
   which set padding at the same specificity. */
.iconOnly {
  aspect-ratio: 1;
  padding-inline: 0;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/components/Button/Button.test.tsx && npm run typecheck`
Expected: PASS, and typecheck clean (the two `@ts-expect-error` lines are used).

- [ ] **Step 5: The Button page**

In `app/button/page.tsx`: add a props row after `iconEnd`:

```ts
  { prop: 'icon', type: 'ReactNode — alone, square; aria-label required', default: '—' },
```

In the Labels section, change the icon-only example (today `<Button variant="outline" tone="neutral" aria-label="Add attachment" iconStart={<Add size={16} />} />`) to:

```tsx
          <Button variant="outline" tone="neutral" aria-label="Add attachment" icon={<Add size={16} />} />
```

and add one sentence to that section's prose, in its voice: an icon alone takes `icon` rather than `iconStart`, which makes the button square and does not compile without `aria-label`.

- [ ] **Step 6: Run the whole check, then commit**

Run: `npm run check`
Expected: PASS.

```bash
git add src/components/Button/Button.tsx src/components/Button/Button.module.css src/components/Button/Button.test.tsx app/button/page.tsx
git commit -F - <<'EOF'
The Button has an icon-only form: square, the icon alone, and a name it cannot compile without

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 3: The Table gives way — columns, rules and fixed layout

**Files:**
- Modify: `src/components/Table/Table.tsx`
- Modify: `src/components/Table/Table.module.css`
- Test: `src/components/Table/Table.test.tsx`

**Interfaces:**
- Consumes: `columnCss`, `ColumnLayout` from Task 1.
- Produces: `Column<Row>` with `width?: number`, `minWidth?: number`, `priority?: number`, `truncate?: boolean`; the root's `data-table`, its first child `<style>`; `data-col` on every `th` and column `td`; `data-actions="column"` on the action `th`; class `styles.truncate`; `styles.table` with `table-layout: fixed`. Task 4 extends the action column; Task 5 and 6 use the new Column fields.

- [ ] **Step 1: Write the failing tests**

In `src/components/Table/Table.test.tsx`:

Add `import { renderToString } from 'react-dom/server';` to the imports.

Replace the test `'renders one col per column so widths do not fight the cells'` with:

```tsx
  it('puts a fixed width on the header cell, in px, and draws no colgroup', () => {
    // A positional <col> would slide onto its neighbour once a column's cells
    // are display: none, so the width is the header cell's, from the rules.
    const { container } = render(<Table {...base} columns={[{ ...columns[0]!, width: 320 }, columns[1]!]} />);
    expect(container.querySelector('colgroup')).toBeNull();
    expect(container.querySelector('style')!.textContent).toContain('th[data-col="name"] { width: 320px; }');
  });
```

Replace the whole `describe('Table collapse', …)` block with:

```tsx
describe('Table columns giving way', () => {
  const rules = (container: HTMLElement) => container.querySelector('style')!.textContent!;

  it('marks the primary column, and only the first one', () => {
    // Several primaries is a caller mistake that still has to render.
    const many: Column<Row>[] = [
      { key: 'name', header: 'Name', cell: (r) => r.name, primary: true },
      { key: 'seen', header: 'Last seen', cell: (r) => r.seen, primary: true },
    ];
    const { container } = render(<Table {...base} columns={many} />);
    expect(container.querySelectorAll('td[data-primary="true"]')).toHaveLength(2);
    expect(container.querySelectorAll('th[data-primary="true"]')).toHaveLength(1);
  });

  it('marks no column primary when none is declared', () => {
    const { container } = render(
      <Table {...base} columns={[{ key: 'seen', header: 'Last seen', cell: (r) => r.seen }]} />,
    );
    expect(container.querySelectorAll('[data-primary="true"]')).toHaveLength(0);
  });

  it('names a column’s header and every one of its cells with its key', () => {
    const { container } = render(<Table {...base} />);
    expect(container.querySelectorAll('[data-col="seen"]')).toHaveLength(3); // header + 2
    expect(container.querySelector('th[data-col="seen"]')).toHaveTextContent('Last seen');
  });

  it('writes its rules in place, as the root’s first child, for its own container', () => {
    const { container } = render(<Table {...base} />);
    const root = container.firstElementChild!;
    expect(root.firstElementChild!.tagName).toBe('STYLE');
    const scope = root.getAttribute('data-table')!;
    expect(scope).not.toBe('');
    expect(rules(container)).toContain(`[data-table="${scope}"] [data-col="seen"] { display: none; }`);
  });

  it('scopes its rules to itself, so two Tables do not touch each other', () => {
    const { container } = render(
      <>
        <Table {...base} caption="One" />
        <Table {...base} caption="Two" />
      </>,
    );
    const [one, two] = [...container.querySelectorAll('[data-table]')];
    const [a, b] = [one!.getAttribute('data-table'), two!.getAttribute('data-table')];
    expect(a).not.toBe(b);
    expect(one!.querySelector('style')!.textContent).not.toContain(`"${b}"`);
  });

  it('raises the sorted column: its rules change with the sort', () => {
    const three: Column<Row>[] = [
      { key: 'name', header: 'Name', cell: (r) => r.name, primary: true },
      { key: 'seen', header: 'Last seen', cell: (r) => r.seen },
      { key: 'id', header: 'Id', cell: (r) => r.id },
    ];
    const { container, rerender } = render(<Table {...base} columns={three} />);
    const unsorted = rules(container);
    rerender(<Table {...base} columns={three} sort={{ key: 'id', direction: 'asc' }} onSortChange={() => {}} />);
    const sorted = rules(container);
    // Unsorted, id leaves first (the widest step); sorted by id, seen does.
    expect(unsorted.indexOf('[data-col="id"] { display: none; }')).toBeLessThan(unsorted.indexOf('[data-col="seen"] { display: none; }'));
    expect(sorted.indexOf('[data-col="seen"] { display: none; }')).toBeLessThan(sorted.indexOf('[data-col="id"] { display: none; }'));
  });

  it('never hides the primary, and gives the selection, empty and loading cells no data-col, so no rule can reach them', () => {
    const { container } = render(<Table {...base} onSelectionChange={() => {}} />);
    expect(container.querySelector('td[data-primary="true"]')).toHaveAttribute('data-col', 'name');
    expect(rules(container)).not.toContain('[data-col="name"] { display: none; }');
    expect(container.querySelector(`td.${styles.selectCell}`)).not.toHaveAttribute('data-col');

    const empty = render(<Table {...base} rows={[]} />);
    expect(empty.container.querySelector(`td.${styles.empty}`)).not.toHaveAttribute('data-col');
    const loading = render(<Table {...base} loading />);
    expect(loading.container.querySelector(`td.${styles.loadingCell}`)).not.toHaveAttribute('data-col');
  });

  it('arrives in the server’s HTML: nothing runs after load to add it', () => {
    const html = renderToString(<Table {...base} />);
    // React writes a style's text raw, unescaped (checked 2026-09-24), so the CSS is as generated.
    expect(html).toMatch(/<style>[^<]*@container \(width < \d+px\)/);
    expect(html).toContain('data-table=');
  });

  it('lays the table out fixed, and no longer collapses it to a list', () => {
    const css = readCss('src/components/Table/Table.module.css');
    expect(block(css, '.table {')).toMatch(/table-layout:\s*fixed/);
    expect(css).not.toMatch(/@container/);
    expect(css).not.toContain('40rem');
  });

  it('wraps a cell’s text by default and truncates a column that asks', () => {
    const { container } = render(
      <Table {...base} columns={[columns[0]!, { ...columns[1]!, truncate: true }]} />,
    );
    expect(container.querySelector('td[data-col="seen"]')).toHaveClass(styles.truncate!);
    expect(container.querySelector('td[data-col="name"]')).not.toHaveClass(styles.truncate!);
    const css = readCss('src/components/Table/Table.module.css');
    expect(block(css, '.truncate {')).toMatch(/text-overflow:\s*ellipsis/);
    expect(block(css, '.td {')).toMatch(/overflow-wrap:\s*anywhere/);
  });
});
```

Also in this file: the test titled `'draws the ring on the row, not a per-cell first/last-child shadow, so RTL and the collapse cannot lose a side'` — drop `and the collapse` from its title and the clause about the collapse from its comment; its assertions stay.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/components/Table/Table.test.tsx`
Expected: FAIL — `width: 320` is a type error at typecheck and at runtime there is still a `colgroup`, no `style`, no `data-col`.

- [ ] **Step 3: Implement in `Table.tsx`**

Imports — add:

```ts
import { useId } from 'react';
import { columnCss } from './columns';
```

Replace the `Column` type's `width` and `primary` members, and add three:

```ts
  /**
   * Fixed, in px: the column keeps this width and leaves whole. Left out, the
   * column is flexible and shares what the fixed ones leave, in proportion
   * to its minimum.
   */
  width?: number;
  /** A flexible column's narrowest, padding included, before it leaves. Defaults to 96; 160 for the primary. */
  minWidth?: number;
  /** 1 is the most important. Left out, source order: the last column leaves first. */
  priority?: number;
  /** One line with an ellipsis instead of wrapping, for a dense column of names or types. */
  truncate?: boolean;
  /** Never leaves, and names the row. First one in source order wins. */
  primary?: boolean;
```

After `const primaryKey = …`, add:

```ts
  // One scope per Table, so its rules touch no other Table on the page.
  const scope = useId();
  const css = columnCss(scope, {
    columns,
    primaryKey,
    sortKey: sort?.key,
    selection: onSelect !== undefined,
    inlineButtons: action ? 1 : 0,
    gatheredButtons: action ? 1 : 0,
  });
```

On the root `div`, add `data-table={scope}` after `aria-busy`, and make `<style>{css}</style>` its first child, before `<div className={styles.frame}>`, with this comment above it:

```tsx
      {/* In place, not hoisted with href and precedence: React never removes
          a hoisted sheet, so an earlier sort's rules would stay and keep
          hiding. Here it changes with the Table and leaves with it. */}
```

Delete the whole `<colgroup>…</colgroup>` block.

On each column `th`, add `data-col={column.key}`. On the action `th`, add `data-actions="column"`. On each column `td`, add `data-col={column.key}` and make its class `[styles.td, column.truncate && styles.truncate].filter(Boolean).join(' ')`.

- [ ] **Step 4: Implement in `Table.module.css`**

- The file's header comment: replace the two sentences "The action column has no width: it is the trailing column, so caller-supplied Column.width values do not slide, and its content is a render prop so can be any width." with: "Column widths are not here: each Table writes rules for its own container (columns.ts), and the columns that do not fit leave by rank."
- `.root`'s comment: "is the container the collapse query measures" becomes "is the container its column rules measure". In the isolation comment, "and keeps saying so if the container query goes" becomes "and keeps saying so".
- `.table`: add `table-layout: fixed;` as its first declaration, with the comment `/* Fixed: the widths are the header cells', from the rules, and content does not push a column wider than its share. */`.
- `.td`: add `overflow-wrap: anywhere;` with the comment `/* In a fixed layout a long word would spill into the next cell; it breaks instead, and the row grows. */`.
- After the `.td[data-align='end']` rule, add:

```css
/* A column that asks keeps to one line. Text and inline content only: a
   block inside the cell is the caller's to truncate. */
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

- The `.selectCell` comment: replace from "The 56px appears here AND on the column's <col>" to the end of the comment with: "The 56 is the drawing's, and columns.ts counts it as SELECTION_WIDTH; if one changes, change both. The class also keeps the cell out of the column rules: it carries no data-col."
- Delete the whole `/* --- collapse --- … */` comment and its `@container (max-width: 40rem) { … }` block.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run src/components/Table && npm run typecheck`
Expected: PASS. Typecheck may now fail in callers passing a string `width` — only `app/screen/zones/Appointments.tsx` does (`'8.5rem'`); change it to `width: 136` here so the check passes (Task 5 does the rest of the screen).

- [ ] **Step 6: Run the whole check, then commit**

Run: `npm run check`
Expected: PASS.

```bash
git add src/components/Table/Table.tsx src/components/Table/Table.module.css src/components/Table/Table.test.tsx app/screen/zones/Appointments.tsx
git commit -F - <<'EOF'
The Table's columns leave by rank, from rules it writes for its own container, and it no longer collapses to a list

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 4: Row actions that gather into "⋯"

**Files:**
- Create: `src/components/Table/RowActions.tsx`
- Modify: `src/components/Table/Table.tsx`, `src/components/Table/Table.module.css`
- Test: `src/components/Table/Table.test.tsx`

**Interfaces:**
- Consumes: `columnCss` (Task 1); `Button`'s `icon` form (Task 2); `DropdownMenu`, `DropdownMenuAction`, `actionText` from `src/components/DropdownMenu`; `Tooltip` with `purpose="label"`.
- Produces: `TableProps` gains `rowActions?: (row: Row) => DropdownMenuAction[]`, `rowActionsInline?: number` (default 2), `rowActionsLabel?: (row: Row) => string` (default `'More actions'`), exclusive with `rowAction`. `splitActions`, `inlineButtonCount`, `RowActions` in `RowActions.tsx`. Task 5 and 6 use the props.

- [ ] **Step 1: Write the failing tests**

Append to `src/components/Table/Table.test.tsx`:

```tsx
describe('Table row actions', () => {
  const Pencil = () => <svg data-testid="edit-glyph" />;
  const Bin = () => <svg />;
  const edit = vi.fn();
  const actions = (r: Row) => [
    { id: 'edit', label: 'Edit', icon: <Pencil />, onSelect: () => edit(r.id) },
    { id: 'delete', label: 'Delete', icon: <Bin />, tone: 'danger' as const },
    { id: 'archive', label: 'Archive' },
  ];
  const inline = (row: number) => document.querySelectorAll('tbody tr')[row]!.querySelector('[data-actions="inline"]') as HTMLElement;
  const rules = () => document.querySelector('[data-table] > style')!.textContent!;

  it('shows the first two with an icon as buttons named by their label, and the rest in "⋯"', () => {
    render(<Table {...base} rowActions={actions} rowActionsLabel={(r) => `More actions for ${r.name}`} />);
    expect(within(inline(0)).getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(within(inline(0)).getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(within(inline(0)).getByRole('button', { name: 'More actions for Lisa Roberts' })).toHaveAttribute('aria-haspopup', 'menu');
    expect(within(inline(0)).queryByRole('button', { name: 'Archive' })).toBeNull();
  });

  it('keeps an action without an icon out of the row however many are inline', () => {
    render(<Table {...base} rowActions={actions} rowActionsInline={3} />);
    expect(within(inline(0)).getAllByRole('button')).toHaveLength(3); // Edit, Delete, "⋯"
  });

  it('calls the action from its button', async () => {
    render(<Table {...base} rowActions={actions} />);
    await userEvent.click(within(inline(1)).getByRole('button', { name: 'Edit' }));
    expect(edit).toHaveBeenCalledWith('b');
  });

  it('draws no "⋯" when every action fits inline, and names it "More actions" when not told', () => {
    render(<Table {...base} rowActions={(r) => actions(r).slice(0, 2)} />);
    expect(within(inline(0)).queryByRole('button', { name: 'More actions' })).toBeNull();
    const gathered = document.querySelector('tbody tr [data-actions="gathered"]') as HTMLElement;
    expect(within(gathered).getByRole('button', { name: 'More actions', hidden: true })).toBeInTheDocument();
  });

  it('gathers every action into one "⋯", hidden until the Table is narrow', () => {
    render(<Table {...base} rowActions={actions} />);
    expect(document.querySelectorAll('tbody [data-actions="gathered"]')).toHaveLength(2);
    expect(rules()).toMatch(/\[data-actions="gathered"\] \{ display: none; \}/);
    expect(rules()).toMatch(/@container \(width < \d+px\) \{\n[^}]*\[data-actions="inline"\] \{ display: none; \}/);
  });

  it('counts the most buttons any row shows for the column’s width, and at least one', () => {
    render(<Table {...base} rowActions={actions} />);
    expect(rules()).toContain('th[data-actions="column"] { width: 160px; }'); // Edit, Delete, "⋯"
  });

  it('gives an empty Table’s action column one button, and leaves a row with no actions empty', () => {
    const { container, rerender } = render(<Table {...base} rows={[]} rowActions={actions} />);
    expect(container.querySelector('style')!.textContent).toContain('th[data-actions="column"] { width: 72px; }');
    rerender(<Table {...base} rowActions={() => []} />);
    const cell = container.querySelector('tbody tr')!.lastElementChild!;
    expect(cell).toBeEmptyDOMElement();
  });

  it('takes rowAction or rowActions, not both', () => {
    // @ts-expect-error — one action column, filled one way
    render(<Table {...base} rowAction={() => null} rowActions={() => []} />);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/components/Table/Table.test.tsx -t "row actions"`
Expected: FAIL — `rowActions` is not a prop; no `[data-actions="inline"]`.

- [ ] **Step 3: Write `RowActions.tsx`**

```tsx
import { Button } from '../Button/Button';
import { DropdownMenu } from '../DropdownMenu/DropdownMenu';
import { actionText } from '../DropdownMenu/rows';
import type { DropdownMenuAction } from '../DropdownMenu/rows';
import { Tooltip } from '../Tooltip/Tooltip';
import styles from './Table.module.css';

/** The first `inline` actions with an icon, and the rest in their order. An action without an icon is never a button. */
export function splitActions(actions: readonly DropdownMenuAction[], inline: number) {
  const shown = actions.filter((action) => action.icon != null).slice(0, Math.max(0, inline));
  return { shown, rest: actions.filter((action) => !shown.includes(action)) };
}

/** The buttons a row shows while its actions are inline: its own, and "⋯" if any are left over. */
export function inlineButtonCount(actions: readonly DropdownMenuAction[], inline: number): number {
  const { shown, rest } = splitActions(actions, inline);
  return shown.length + (rest.length > 0 ? 1 : 0);
}

/**
 * Carbon's overflow-menu--horizontal, on its 32 grid. Inlined because the
 * package does not depend on @carbon/icons-react at runtime. Apache-2.0,
 * © IBM.
 */
function More() {
  return (
    <svg viewBox="0 0 32 32" width="16" height="16" fill="currentColor" aria-hidden="true" focusable="false">
      <circle cx="8" cy="16" r="2" />
      <circle cx="16" cy="16" r="2" />
      <circle cx="24" cy="16" r="2" />
    </svg>
  );
}

function Menu({ items, label }: { items: DropdownMenuAction[]; label: string }) {
  return (
    <DropdownMenu
      items={items}
      trigger={(props) => <Button variant="ghost" tone="neutral" icon={<More />} aria-label={label} {...props} />}
    />
  );
}

/**
 * A row's actions, twice: inline, and gathered into one "⋯". The Table's
 * rules show one or the other by its width. The hidden one is display: none,
 * so it is out of the tab order and the accessibility tree.
 *
 * An inline button is named by its Tooltip (`purpose="label"`), the words a
 * pointer sees; `aria-label` is the same words, for the moment before the
 * Tooltip's panel exists.
 */
export function RowActions({
  actions,
  inline,
  label,
  gather,
}: {
  actions: readonly DropdownMenuAction[];
  inline: number;
  label: string;
  gather: boolean;
}) {
  if (actions.length === 0) return null;
  const { shown, rest } = splitActions(actions, inline);
  return (
    <>
      <span className={styles.actions} data-actions="inline">
        {shown.map((action) => (
          <Tooltip key={action.id} content={action.label} purpose="label">
            <Button
              variant="ghost"
              tone={action.tone ?? 'neutral'}
              icon={action.icon}
              aria-label={actionText(action)}
              disabled={action.disabled}
              onClick={action.onSelect}
            />
          </Tooltip>
        ))}
        {rest.length > 0 && <Menu items={rest} label={label} />}
      </span>
      {gather && (
        <span className={styles.actions} data-actions="gathered">
          <Menu items={[...actions]} label={label} />
        </span>
      )}
    </>
  );
}
```

- [ ] **Step 4: Wire it into `Table.tsx`**

Imports — add:

```ts
import type { DropdownMenuAction } from '../DropdownMenu/rows';
import { RowActions, inlineButtonCount } from './RowActions';
```

Remove `rowAction?: (row: Row) => ReactNode;` (and its comment) from `TableProps`, rename the remaining object type `TableBaseProps<Row>`, and define:

```ts
/** One action column, filled one way: actions for a menu, or a render prop for what a menu cannot hold. */
type RowActionProps<Row> =
  | {
      /** The trailing action column as a render prop: counted as one 40 button wide. */
      rowAction?: (row: Row) => ReactNode;
      rowActions?: never;
      rowActionsInline?: never;
      rowActionsLabel?: never;
    }
  | {
      rowAction?: never;
      /** The row's actions: the first `rowActionsInline` with an icon as buttons, the rest in "⋯". */
      rowActions?: (row: Row) => DropdownMenuAction[];
      /** How many actions with an icon show as buttons while there is room. Defaults to 2. */
      rowActionsInline?: number;
      /** The "⋯" button's name. Defaults to "More actions". */
      rowActionsLabel?: (row: Row) => string;
    };

export type TableProps<Row> = TableBaseProps<Row> & RowActionProps<Row> & Omit<HTMLAttributes<HTMLDivElement>, 'children'>;
```

(Move the `& Omit<HTMLAttributes…>` that `TableBaseProps` ended with into `TableProps` as shown.)

Destructure `rowActions`, `rowActionsInline = 2` and `rowActionsLabel` beside `rowAction`. Replace the lines from `const action = rowAction;` through the `columnCount` line with:

```ts
  const action = rowAction;
  const selectedIds = selected ?? new Set<string>();
  const ids = rows.map(getRowId);
  const head = headerSelectionState(
    ids.filter((id) => selectedIds.has(id)).length,
    ids.length,
  );
  // Asked for once a render: the buttons the rows show set the action
  // column's width, and the cells draw the same lists.
  const actionsOf = rowActions ? rows.map(rowActions) : undefined;
  const hasActions = action !== undefined || actionsOf !== undefined;
  const inlineButtons = actionsOf
    ? Math.max(1, ...actionsOf.map((list) => inlineButtonCount(list, rowActionsInline)))
    : action ? 1 : 0;
  const gatheredButtons = hasActions ? 1 : 0;
  const columnCount = columns.length + (onSelect ? 1 : 0) + (hasActions ? 1 : 0);
```

In the `columnCss` call from Task 3, pass `inlineButtons` and `gatheredButtons` (the consts above) instead of `action ? 1 : 0`.

Replace `{action && (` on the action `th` with `{hasActions && (`, and the action `td` with:

```tsx
                  {hasActions && (
                    <td className={`${styles.td} ${styles.actionCell}`}>
                      {actionsOf ? (
                        <RowActions
                          actions={actionsOf[index]!}
                          inline={rowActionsInline}
                          label={rowActionsLabel?.(row) ?? 'More actions'}
                          gather={inlineButtons > gatheredButtons}
                        />
                      ) : (
                        action?.(row)
                      )}
                    </td>
                  )}
```

- [ ] **Step 5: The actions' layout in `Table.module.css`**

After `.actionCell { … }`:

```css
/* The row's actions: icon buttons 4 apart, "⋯" last. Inline-flex, so the
   cell's text-align puts them at its end. */
.actions {
  display: inline-flex;
  align-items: center;
  gap: var(--ap-spacing-050);
  vertical-align: middle;
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx vitest run src/components/Table && npm run typecheck`
Expected: PASS, including the existing `describe('Table row action', …)` tests for the render prop.

- [ ] **Step 7: Run the whole check, then commit**

Run: `npm run check`
Expected: PASS.

```bash
git add src/components/Table/RowActions.tsx src/components/Table/Table.tsx src/components/Table/Table.module.css src/components/Table/Table.test.tsx
git commit -F - <<'EOF'
The Table takes row actions as a menu's: icon buttons while there is room, gathered into "⋯" before any column leaves

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 5: The screen declares its columns and its row actions

**Files:**
- Modify: `app/screen/zones/Appointments.tsx`
- Modify: `app/screen/zones/glyphs.tsx`
- Modify: `app/screen/screen.module.css`
- Test: `app/screen/Screen.test.tsx`

**Interfaces:**
- Consumes: `Column` fields `width`, `minWidth`, `priority`, `truncate`, `primary` (Task 3); `rowActions`, `rowActionsLabel` (Task 4); `spacing` from `@/tokens/scale`; `changeStatus` (already in `Appointments.tsx`).
- Produces: glyphs `Check`, `Cross`, `OpenPanel`.

- [ ] **Step 1: Write the failing test, and fix the tests the change will break**

In `app/screen/Screen.test.tsx`:

- Replace the `clientOf` helper and its comment with:

```tsx
/** The client's name in a row's primary cell: the cell holds only the name. */
const clientOf = (button: HTMLElement) => button.textContent!;
```

- Row buttons are now more than the primary cell's. Where the test finds `rowButton` with `within(table()).getAllByRole('button').find((b) => !b.hasAttribute('aria-current'))`, restrict it to primary cells:

```tsx
    const rowButton = within(table())
      .getAllByRole('button')
      .filter((b) => b.closest('td[data-primary="true"]'))
      .find((b) => !b.hasAttribute('aria-current'))!;
```

- Every row now has a "Confirm" and a "Cancel" button, so the bulk bar's are found in its group. Add the helper:

```tsx
/** The selection bar: a group named by its count. Its Confirm and Cancel share their names with every row's. */
const bar = () => screen.getByRole('group', { name: /selected/ });
```

and change each `screen.getByRole('button', { name: 'Confirm' })` and `screen.getByRole('button', { name: 'Cancel' })` that follows a checkbox selection to `within(bar()).getByRole('button', { name: … })`. Search the file for both names. Any other query that now finds several buttons ("Found multiple elements") is scoped to the container it means — the bar, the details drawer, or a dialog (`within(dialog)` ones already are).

- The meta line goes, so the booked row is found by its cells: in `booked`, replace `within(r).queryAllByText(/14:00 – 14:30 · Ana Ferreira/).length > 0` with `within(r).queryAllByText('14:00 – 14:30').length > 0 && within(r).queryAllByText('Ana Ferreira').length > 0`. Delete the comment "The status reads twice in a row, in its column and in the collapsed list's line: neither may say the old one." and keep its assertions.

- Add this test inside `describe('the dense screen', …)`:

```tsx
  it('confirms one appointment from its row, and names the rest of its actions by the row', async () => {
    render(
      <>
        <Screen />
        <Toaster />
      </>,
    );
    const row = within(table()).getAllByRole('row').find((r) => within(r).queryAllByText('Pending').length > 0)!;
    const client = row.querySelector('td[data-primary="true"] button') as HTMLElement;
    const inline = row.querySelector('[data-actions="inline"]') as HTMLElement;
    expect(within(inline).getByRole('button', { name: new RegExp(`More actions for ${clientOf(client)}`) })).toBeInTheDocument();
    await userEvent.click(within(inline).getByRole('button', { name: 'Confirm' }));
    expect(within(row).queryAllByText('Pending')).toHaveLength(0);
    expect(within(row).getAllByText('Confirmed')).not.toHaveLength(0);
  });
```

- [ ] **Step 2: Run the tests to verify the new one fails**

Run: `npx vitest run app/screen`
Expected: the new test FAILS (no `[data-actions="inline"]`); the others pass or fail only on `clientOf` reading the meta line — that one passes after Step 3.

- [ ] **Step 3: Implement**

`app/screen/zones/glyphs.tsx` — add, in the file's style:

```tsx
export const Check = () => (
  <Glyph>
    <path d="M3.5 8.5 6.5 11.5 12.5 4.5" />
  </Glyph>
);

export const Cross = () => (
  <Glyph>
    <path d="M4.5 4.5 11.5 11.5M11.5 4.5 4.5 11.5" />
  </Glyph>
);

/** The details drawer: a panel opening at the side. */
export const OpenPanel = () => (
  <Glyph>
    <rect x="2" y="3" width="12" height="10" rx="1.5" />
    <path d="M9.5 3v10" />
  </Glyph>
);
```

`app/screen/zones/Appointments.tsx`:

- Imports: add `import { spacing } from '@/tokens/scale';` and `import { Check, Cross, OpenPanel } from './glyphs';`.
- Replace `COLUMNS` with:

```tsx
/**
 * Which columns stay as the Table narrows — beside the Scheduler, under a
 * side panel, on a phone. The status first: it is what the day is worked
 * by. Then the time, which the Scheduler beside it also shows; the type
 * leaves first. Names and types truncate: one line a row is the density.
 */
const COLUMNS: Column<Appointment>[] = [
  // 8.5rem before, as px: the arithmetic adds it up. "09:00 – 09:45" and padding.
  { key: 'time', header: 'Time', cell: (a) => timeRange(a), width: 136, priority: 2 },
  { key: 'client', header: 'Client', primary: true, truncate: true, cell: (a) => a.client },
  {
    key: 'practitioner',
    header: 'Practitioner',
    priority: 3,
    truncate: true,
    cell: (a) => practitionerName(a.practitionerId),
  },
  { key: 'type', header: 'Type', priority: 4, truncate: true, cell: (a) => typeOf(a.typeId)?.label ?? a.typeId },
  {
    key: 'status',
    header: 'Status',
    priority: 1,
    // A badge does not wrap; the widest, "Cancelled", needs more than 96.
    minWidth: spacing[1200],
    cell: (a) => <Badge tone={STATUS_TONE[a.status]}>{STATUS_LABEL[a.status]}</Badge>,
  },
];
```

- On the `<Table>`, after `selectionLabel`, add:

```tsx
        rowActions={(a) => [
          {
            id: 'confirm',
            label: 'Confirm',
            icon: <Check />,
            disabled: a.status === 'confirmed',
            onSelect: () => changeStatus(state, dispatch, [a.id], 'confirmed'),
          },
          {
            id: 'cancel',
            label: 'Cancel',
            icon: <Cross />,
            tone: 'danger',
            disabled: a.status === 'cancelled',
            onSelect: () => changeStatus(state, dispatch, [a.id], 'cancelled'),
          },
          {
            id: 'open',
            label: 'Open details',
            icon: <OpenPanel />,
            onSelect: () => {
              dispatch({ type: 'current', id: a.id });
              dispatch({ type: 'drawer', open: true });
            },
          },
        ]}
        rowActionsLabel={(a) => `More actions for ${a.client} at ${timeRange(a)}`}
```

- Remove the now-unused imports if any (`styles.who`/`styles.meta` are no longer read).

`app/screen/screen.module.css` — delete the `.who` and `.meta` rules, their comment ("The client, and under it what the collapsed list would otherwise lose…"), and the `@container (max-width: 40rem) { .meta … }` block.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run app/screen`
Expected: PASS, including `local-values.test.ts` (no literals were added to the stylesheet) and the composition test.

- [ ] **Step 5: Run the whole check, then commit**

Run: `npm run check`
Expected: PASS.

```bash
git add app/screen/zones/Appointments.tsx app/screen/zones/glyphs.tsx app/screen/screen.module.css app/screen/Screen.test.tsx
git commit -F - <<'EOF'
The screen says which of its columns stay, confirms from the row, and drops the meta line the list collapse needed

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 6: The Table page

**Files:**
- Modify: `app/table/page.tsx`
- Modify: `app/docs.css` (remove `.rowAction`)

**Interfaces:**
- Consumes: the Table's new props (Tasks 3–4); `SegmentedControl` (`options: { value, label }[]`, `label`, `value`, `onChange`); Carbon's `Edit`, `TrashCan` from `@carbon/icons-react`.
- Produces: the page copy. Nothing downstream.

- [ ] **Step 1: Read the Next guide for client pages** in `node_modules/next/dist/docs/` (the page is `'use client'`; nothing about routing changes).

- [ ] **Step 2: Props tables**

In `PROPS`, replace the `rowAction` row with:

```ts
  { prop: 'rowAction', type: '(row: Row) => ReactNode — one 40 button wide', default: '—' },
  { prop: 'rowActions', type: '(row: Row) => DropdownMenuAction[]', default: '—' },
  { prop: 'rowActionsInline', type: 'number', default: '2' },
  { prop: 'rowActionsLabel', type: '(row: Row) => string', default: "'More actions'" },
```

In `COLUMN_PROPS`, replace the `width` and `primary` rows with:

```ts
  { prop: 'width', type: 'number (px) — fixed, leaves whole', default: 'flexible' },
  { prop: 'minWidth', type: 'number (px), padding included', default: '96; 160 primary' },
  { prop: 'priority', type: 'number, 1 the most important', default: 'source order' },
  { prop: 'truncate', type: 'boolean', default: 'false' },
  { prop: 'primary', type: 'boolean — never leaves', default: 'false' },
```

Delete the `COLLAPSE` constant and the half of the comment above `ROW` that names it.

- [ ] **Step 3: Try it at four widths**

Imports: add `import { Edit, TrashCan } from '@carbon/icons-react';`, `import { SegmentedControl } from '@/components/SegmentedControl';` and `import type { DropdownMenuAction } from '@/components/DropdownMenu';`.

Above `Page`:

```tsx
/** The Try it's frame: every column, then the actions gathered and Last seen gone, then Visits too, then the client alone. */
const FRAMES = [
  { value: '800', label: '800' },
  { value: '560', label: '560' },
  { value: '400', label: '400' },
  { value: '320', label: '320' },
];

const clientActions = (c: Client): DropdownMenuAction[] => [
  { id: 'edit', label: 'Edit', icon: <Edit size={16} /> },
  { id: 'delete', label: 'Delete', icon: <TrashCan size={16} />, tone: 'danger' },
  { id: 'archive', label: `Archive ${c.name}`, textValue: 'Archive' },
];
```

In `Page`, add `const [frame, setFrame] = useState('800');`. In `columns`, give `status` `priority: 1`, `visits` `width: 96, priority: 2` and `seen` `priority: 3`.

Replace the Try it specimen with:

```tsx
      <h2>Try it</h2>
      <SegmentedControl label="Table width" options={FRAMES} value={frame} onChange={setFrame} />
      <div className="specimen">
        <div style={{ inlineSize: `${frame}px`, maxInlineSize: '100%' }}>
          <Table
            caption="Clients"
            columns={columns}
            rows={rows}
            getRowId={(c) => c.id}
            sort={sort}
            onSortChange={setSort}
            selected={selected}
            onSelectionChange={setSelected}
            selectionLabel={(c) => `Select ${c.name}`}
            rowActions={clientActions}
            rowActionsLabel={(c) => `More actions for ${c.name}`}
          />
        </div>
      </div>
      <p className="alias">
        At 800 everything fits. At 560 the actions have gathered into &ldquo;&#8943;&rdquo; and Last seen has
        left; at 400 Visits has too, unless it is the column sorted by; at 320 the client and the actions stay.
      </p>
```

(Keep the existing "Sort by Client or Visits…" line after it.) Verify the four claims against the thresholds: floor 2 + 56 + 72 + 160 = 290; Status 386; Visits 482; Last seen 578; gather 578 − 72 + 160 = 666.

- [ ] **Step 4: The rules, in the page's voice**

After "Choosing a table", add:

```tsx
      <h2>Columns that give way</h2>
      <p>
        A table measures its own width, not the screen&rsquo;s, so a side panel narrows it the way a phone does.
        A column with a <code>width</code> keeps it and leaves whole. One without shares what the fixed columns
        leave, in proportion to its <code>minWidth</code> — 96 unless told, 160 for the primary — and shrinks to it.
        Past that it leaves, the lowest <code>priority</code> first; left out, the last column in the source
        leaves first. It comes back only when it fits whole.
      </p>
      <p>
        The primary column, the selection and the actions never leave, and the column the reader sorted by is
        raised to stay. Before any column goes, the row&rsquo;s actions gather into one &ldquo;&#8943;&rdquo;:
        the first two with an icon are buttons while there is room, and an action without an icon is always in
        the menu. Nothing that leaves is moved elsewhere: it is gone until there is room, so the columns nobody
        compares on belong on the row&rsquo;s own page.
      </p>
      <p>
        Text wraps and the row grows; <code>truncate</code> keeps a column to one line with an ellipsis, for a
        dense column of names. A header does not wrap: give a long one a larger <code>minWidth</code>. The
        rules are written into the page with the table, so they hold before any script runs.{' '}
        <code>rowActions</code> hands the menu functions, so the table that uses it is rendered by a client
        component.
      </p>
```

In "Choosing a table", replace "The trailing action is for the things done to one row, in a <a href="/dropdown-menu">dropdown menu</a>, so a list of records is not a list of buttons. A table that would need to scroll sideways on a laptop has too many columns: the ones nobody compares on belong in the row&rsquo;s own page." with: "The trailing actions are the things done to one row: two at most as buttons, the rest in a <a href="/dropdown-menu">dropdown menu</a>, so a list of records is not a list of buttons."

In "Anatomy and density", delete the sentence "Below {COLLAPSE} of container width … collapses on a wide screen too."

In "Accessibility", replace the paragraph beginning "The table sits in a focusable, labelled region" with:

```tsx
      <p>
        The table sits in a focusable, labelled region, so a keyboard can scroll it sideways when even the columns
        that never leave do not fit. A column that leaves is <code>display: none</code>, header and cells, so a
        screen reader is told the columns a sighted reader sees, and nothing is announced: a width changing is not
        an event in the content. An inline action is an icon button named by its tooltip; the &ldquo;&#8943;&rdquo;
        is named per row by <code>rowActionsLabel</code>.
      </p>
```

- [ ] **Step 5: Remove the old demo's style**

In `app/docs.css`, delete the `.rowAction { … }` and `.rowAction:hover { … }` rules (around line 1310) and any comment that introduces only them. Confirm nothing else uses it: `grep -rn "rowAction\"" app` returns nothing.

- [ ] **Step 6: Run the whole check and build the docs, then commit**

Run: `npm run check && npm run build:docs`
Expected: PASS; the build lists the `/table` route.

```bash
git add app/table/page.tsx app/docs.css
git commit -F - <<'EOF'
The Table page shows its columns giving way at four widths, and the rules they follow

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 7: Records, and seeing it

**Files:**
- Modify: `CHANGELOG.md`, `MEMORY.md`, `docs/superpowers/specs/2026-09-18-completeness-roadmap.md`, `app/screen/page.tsx`

**Interfaces:**
- Consumes: the commits of Tasks 1–6: `git log --format='%h %s' main..HEAD`.
- Produces: nothing downstream.

- [ ] **Step 1: `CHANGELOG.md`, under Unreleased**

In the Unreleased intro, replace "Nothing is removed and nothing is renamed." with "One prop changes its type: the Table's `Column.width`, under Breaking." and add "and its third, the Table's columns giving way" to the list of pieces in its first sentence.

Add, before `### Added`:

```markdown
### Breaking

- **Table** — `Column.width` is a number of px, no longer any CSS string:
  the Table adds widths up to decide which columns fit. `'8.5rem'` is
  `136`.
```

Under `### Added`:

```markdown
- **Table columns that give way** — `minWidth` (px; 96 unless told, 160
  for the primary), `priority` (1 the most important; left out, source
  order) and `truncate` on a column. As the Table's own width shrinks,
  whether from the window or a side panel, a column shrinks to its
  minimum, then leaves, the lowest priority first; the primary, selection
  and action columns never leave, and the sorted column is raised to stay.
  Each Table writes container queries for itself, so nothing is measured
  and the rules arrive in the server's HTML. `columnThresholds` is
  exported for a caller who wants the numbers.
- **Table row actions** — `rowActions` (the DropdownMenu's action shape),
  `rowActionsInline` (default 2) and `rowActionsLabel` (default "More
  actions"): the first actions with an icon are buttons, the rest in "⋯",
  and all of them gather into "⋯" before any column leaves.
- **Button** — `icon`, an icon-only form: square, the icon alone, and
  `aria-label` required by the types.
```

Under `### Changed`:

```markdown
- **The Table no longer collapses to a list under a 40rem container.** Its
  columns leave one by one instead, right to left unless priorities say
  otherwise. It lays out fixed, and flexible columns share by their
  minimums where the browser sized them by content.
```

- [ ] **Step 2: `MEMORY.md`**

- Replace invariant 8 with:

```markdown
8. **A Table's columns leave by rank; the primary, selection and action
   columns never do.** From 2026-09-24 (spec
   `docs/superpowers/specs/2026-09-24-table-responsive-columns-design.md`)
   the Table no longer collapses to a list under 40rem. Each Table writes
   container queries for its own root (`columns.ts`): a column shrinks to
   its minimum (96; 160 for the primary; a fixed column's `width`), then
   leaves, the lowest priority first; the sorted column is raised so it
   stays; the row's inline actions gather into "⋯" before any column
   leaves. Hidden is `display: none`, header and cells, so the
   accessibility tree matches the screen. The `<style>` is rendered in
   place in the root, not hoisted with `href` and `precedence`: React
   never removes a hoisted sheet, and an earlier sort's rules would keep
   hiding. Do not "fix" it into the head.
```

- In the dense screen's list of gaps found and not fixed (search for "the Table always collapses under a 40rem container"), strike the two that are closed, in the file's style: `~~the Table always collapses under a 40rem container (a meta line in the collapsed list), and a collapsed row stays 77 tall in both densities~~ (closed 2026-09-24: columns leave by rank)` and `~~the Button has no square icon-only shape~~ (closed 2026-09-24: \`icon\`)`.
- Under "Claimed components", after the Breakpoints and layout entry, add an entry in its shape: "**Table responsive columns** (wave 4, third piece) — built 2026-09-24 on branch `table-responsive-columns` (`<spec>^..<task 6>`, N commits, the first three the spec, its amendment and the plan), not on main. Spec `docs/superpowers/specs/2026-09-24-table-responsive-columns-design.md`, plan `docs/superpowers/plans/2026-09-24-table-responsive-columns.md`." and then two sentences of what it is, from the CHANGELOG entries. `<spec>` is the first commit and `<task 6>` the last in `git log --oneline main..HEAD` before this task commits; N counts them. The range does not include this records commit, so no SHA has to name itself.

- [ ] **Step 3: The roadmap**

In `docs/superpowers/specs/2026-09-18-completeness-roadmap.md`, after the "Breakpoints and layout" row: change that row's "**What moved up:** the Table's columns giving way as its space shrinks, next." to "… shrinks, built (the next row)." and add:

```markdown
| **Table responsive columns** — built 2026-09-24 on branch `table-responsive-columns`, unreleased | Table, Button | Columns shrink to a minimum and leave by priority as the Table's own width shrinks, whether the window or a side panel narrows it; the row's actions gather into "⋯" first; the primary, selection and actions never leave. Replaces the 40rem collapse to a list. **What moved up:** the Button's icon-only form. Spec `2026-09-24-table-responsive-columns-design.md`. |
```

- [ ] **Step 4: `/screen`'s lists**

In `app/screen/page.tsx`, under "Found, and not fixed in the package", delete the items "The Table always collapses to a list under a 40rem container; the screen adds a meta line when it does." and "The Button has no square, icon-only shape." Under "What moved up the list", add, with the SHAs of Task 3, Task 4, Task 5 and Task 2's commits:

```tsx
        <li>
          <strong>The Table&rsquo;s columns give way.</strong> It no longer becomes a list under 40rem: a column
          shrinks to its minimum and then leaves, the lowest priority first ({commit('<task 3>')}); the row&rsquo;s
          actions gather into &ldquo;&#8943;&rdquo; before any column does ({commit('<task 4>')}). The screen says which
          of its columns stay, confirms from the row, and drops the meta line it had added ({commit('<task 5>')}).
        </li>
        <li>
          <strong>The Button&rsquo;s icon-only form.</strong> Square, the icon alone, its name required (
          {commit('<task 2>')}).
        </li>
```

- [ ] **Step 5: Check, build, commit**

Run: `npm run check && npm run build:docs`
Expected: PASS.

```bash
git add CHANGELOG.md MEMORY.md docs/superpowers/specs/2026-09-18-completeness-roadmap.md app/screen/page.tsx
git commit -F - <<'EOF'
The records say the Table's columns give way: CHANGELOG, MEMORY.md's invariant and gaps, the roadmap and /screen

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

- [ ] **Step 6: Seen in Chromium (the controller, with the browser pane)**

Start the docs dev server from `.claude/launch.json`. For each check, read the DOM with `javascript_tool` rather than trusting a screenshot, and reload after every `resize_window` (the pane fires no `matchMedia` change on resize; container queries do update, but reload anyway for a clean first paint).

1. `/table`, Try it: at each of 800, 560, 400, 320, count the visible headers — `[...document.querySelectorAll('[data-table] th')].filter(th => getComputedStyle(th).display !== 'none').map(th => th.textContent)` — and whether `[data-actions="inline"]` or `[data-actions="gathered"]` is shown. Expected as the page's line under Try it says. Sort by Visits and set 400: Visits stays, Status leaves.
2. `/screen` at 1440, 1280, 1024, 768, 375 and 320, with the details drawer open and closed: which columns show; no horizontal scroll on the page (`document.documentElement.scrollWidth <= innerWidth`); a pending row's Confirm works; "⋯" opens its menu.
3. A props table (`/button`) at 1280 and 375: its thresholds are 258 (Type) and 354 (Default), so at 375 — about 343 of Table — Default has left, the prop and type stay, and the type's text wraps.
4. Dark mode on `/table`: the inline buttons and "⋯" visible on the raised rows.
5. Axe runs in the suite already; also run the pane's console for errors on `/table` and `/screen`.

Record what was seen in the final report to Fernando, with the numbers read.
