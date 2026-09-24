# Breakpoints and layout — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A named breakpoint scale (Tailwind's five and `xs`), layout margin and gap that step with it, every width literal in the package, the screen and the site moved onto it, no z-index outside an isolated component, and a Layout page that says all of it.

**Architecture:** `src/tokens/scale.ts` gains `breakpoint`, `minViewport` and `media` (range-syntax query strings in rem); `src/tokens/layout.ts` holds margin and gap by mode. The build writes the breakpoints and a layout block whose values change inside two `@media` rules into `tokens.css`, restates the breakpoints in the Tailwind theme with the layout spacing written inline, and adds `breakpoint/*` and an `Alpenglow Layout` collection to the Figma export. Media queries stay hand-written in rem; a test walks `src/` and `app/` and fails on any width outside the scale, another on any component z-index without `isolation: isolate`.

**Tech Stack:** React 19, Next 16 App Router with `output: 'export'`, CSS Modules, Vitest + Testing Library + axe, `tsx` build scripts, Tailwind v4 `compile()` in tests.

**Spec:** `docs/superpowers/specs/2026-09-24-breakpoints-and-layout-design.md`

## Global Constraints

- Breakpoints, exactly: `xs` 480 (30rem), `sm` 640 (40rem), `md` 768 (48rem), `lg` 1024 (64rem), `xl` 1280 (80rem), `2xl` 1536 (96rem). `minViewport` 320.
- Media queries in range syntax and rem: `(width < 48rem)`, `(width >= 48rem)`, `(48rem <= width < 96rem)`. Never `max-width: 767px`, never px in a media query.
- Layout, exactly: `layout/margin` 16 / 24 / 40, `layout/gap` 16 / 20 / 20 for Narrow (< `lg`) / Medium (`lg` to < `xl`) / Wide (≥ `xl`).
- Figma mode names: `Narrow`, `Medium`, `Wide` — never Compact or Expanded (Density owns Compact).
- A z-index in `src/components/` lives only in a module that declares `isolation: isolate`, and is never above 3.
- `@container` queries are not breakpoints and stay as they are (the Alert's 400px, the Table's 40rem).
- Every `--ap-` custom property read must exist in `tokens.css` (`src/components/custom-properties.test.ts` enforces it).
- Nothing from the original product's name, anywhere.
- Peer range starts at React 19.0: no `useEffectEvent`.
- Commit or push only when Fernando asks; when he does, stage by path, never `git add -A`. The "Commit" steps below are where a commit belongs, run only with his go-ahead.
- `npm run check` and `npm run build:docs` before any push.

## Review Focus

1. **Tailwind's own `md:` must still mean 48rem** after the theme restates the scale — a consumer's existing classes cannot move. Pinned in Task 1 by compiling `md:hidden` and `xs:hidden` with Tailwind's own compiler.
2. **Exactly at a breakpoint.** At 768 the SideNav is the rail, not the sheet (`width < 48rem` is false); at 768 the screen's navigation is the sheet (`width < 64rem`); at 1024 the margin is 24 and at 1280 it is 40. Pinned in Task 1 (the query strings and the two `@media` headers, byte for byte) and Task 2 (`SIDE_NAV_NARROW`).
3. **A product's sticky bar at `z-index: 1` over the Scheduler's head** while the page scrolls. Pinned in Task 2 by the layering test and seen in Task 7 in the browser.
4. **320 wide.** The narrow margin and the bleeding specimen must still hold a 280 Calendar with no sideways scroll. Pinned in Task 4 (`DocPage.test`) and seen in Task 7.
5. **768 on the screen.** The Scheduler's five columns need 722; with the narrow margin, 768 − 32 = 736. Pinned in Task 3 by a test that derives it from the tokens.

---

## File structure

| File | Responsibility |
|---|---|
| `src/tokens/scale.ts` | `breakpoint`, `minViewport`, `media`, `BreakpointName` beside the existing scale |
| `src/tokens/layout.ts` (new) | `layout` (margin and gap by mode), `layoutModes`, `layoutModeStart`, `LayoutMode` |
| `src/tokens/layout.test.ts` (new) | Values, the query strings, the modes' order |
| `scripts/build-css.ts` | The breakpoints block and the layout block with its two queries |
| `scripts/build-tailwind.ts` | `--breakpoint-*` in `@theme`, `--spacing-layout-*` in `@theme inline` |
| `scripts/export-figma.ts`, `docs/figma/apply-variables.md` | `breakpoint/*` in Scale; the fifth collection, Alpenglow Layout; the 12-column grid style |
| `src/styles/generated.test.ts` | The new blocks are in step; Tailwind compiles them |
| `src/index.ts`, `src/index.test.ts` | The root exports |
| `src/components/SideNav/SideNav.tsx`, `Toast`, `CommandPalette`, `TopBar` | On the scale and the margin |
| `src/components/Scheduler`, `Table`, `Slider` `.module.css` | `isolation: isolate` |
| `src/components/layering.test.ts` (new) | No z-index outside an isolate, none above 3 |
| `app/screen/*` | The screen on the scale and the layout tokens |
| `app/docs.css`, `app/ui/Nav.tsx`, `app/ui/Nav.test.tsx`, `app/ui/DocPage.test.tsx` | The site on the scale |
| `app/scheduler/page.tsx`, `app/navigation/page.tsx`, `app/decisions/page.tsx`, `app/space/page.tsx` | Literals and prose |
| `src/styles/breakpoints.test.ts` (new) | No width outside the scale, anywhere |
| `app/layout/page.tsx` (new) | The Layout page |
| `app/ui/contents.ts`, `app/foundations/page.tsx` | Nav entry and card |

---

### Task 1: The breakpoint and layout tokens

**Files:**
- Modify: `src/tokens/scale.ts`, `scripts/build-css.ts`, `scripts/build-tailwind.ts`, `scripts/export-figma.ts`, `docs/figma/apply-variables.md`, `src/styles/generated.test.ts`, `src/index.ts`, `src/index.test.ts`
- Create: `src/tokens/layout.ts`, `src/tokens/layout.test.ts`
- Regenerate: `src/styles/tokens.css`, `src/styles/tailwind-theme.css`, `docs/figma/alpenglow-variables.json`

**Interfaces:**
- Produces: `breakpoint: { xs: 480; sm: 640; md: 768; lg: 1024; xl: 1280; '2xl': 1536 }`, `type BreakpointName`, `minViewport = 320`, `media: { up: Record<BreakpointName, string>; down: Record<BreakpointName, string> }` with `media.up.md === '(width >= 48rem)'` and `media.down.md === '(width < 48rem)'`. `layout: { margin: { narrow: 16; medium: 24; wide: 40; use: string }; gap: { narrow: 16; medium: 20; wide: 20; use: string } }`, `layoutModes = ['narrow', 'medium', 'wide'] as const`, `type LayoutMode`, `layoutModeStart = { narrow: null, medium: 'lg', wide: 'xl' }`. CSS: `--ap-breakpoint-{xs…2xl}` (rem), `--ap-layout-margin`, `--ap-layout-gap` (px). Tailwind: `--breakpoint-{xs…2xl}`, `--spacing-layout-margin`, `--spacing-layout-gap`.

- [ ] **Step 1: Write the failing tests**

`src/tokens/layout.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { breakpoint, media, minViewport } from './scale';
import { layout, layoutModes, layoutModeStart } from './layout';

describe('the breakpoint scale', () => {
  it("is Tailwind's five and xs below them", () => {
    expect(breakpoint).toEqual({ xs: 480, sm: 640, md: 768, lg: 1024, xl: 1280, '2xl': 1536 });
    expect(minViewport).toBe(320);
  });

  it('writes each step as a range query in rem', () => {
    expect(media.up.md).toBe('(width >= 48rem)');
    expect(media.down.md).toBe('(width < 48rem)');
    expect(media.down.xs).toBe('(width < 30rem)');
    expect(media.up['2xl']).toBe('(width >= 96rem)');
    for (const [name, px] of Object.entries(breakpoint)) {
      expect(media.up[name as keyof typeof breakpoint]).toBe(`(width >= ${px / 16}rem)`);
      expect(media.down[name as keyof typeof breakpoint]).toBe(`(width < ${px / 16}rem)`);
    }
  });
});

describe('the layout tokens', () => {
  it('step margin and gap up at lg and xl', () => {
    expect(layoutModes).toEqual(['narrow', 'medium', 'wide']);
    expect(layoutModeStart).toEqual({ narrow: null, medium: 'lg', wide: 'xl' });
    expect(layout.margin).toMatchObject({ narrow: 16, medium: 24, wide: 40 });
    expect(layout.gap).toMatchObject({ narrow: 16, medium: 20, wide: 20 });
  });

  it('never narrows as the screen widens', () => {
    for (const token of [layout.margin, layout.gap]) {
      expect(token.narrow).toBeLessThanOrEqual(token.medium);
      expect(token.medium).toBeLessThanOrEqual(token.wide);
    }
  });
});
```

Append to `src/styles/generated.test.ts` (and add `import { breakpoint, media } from '../tokens/scale';` — extend the existing scale import — and `import { layout } from '../tokens/layout';`):

```ts
describe('tokens.css carries the breakpoints and the layout', () => {
  it('declares each breakpoint in rem, for JS and for reading', () => {
    const root = block(tokensCss, 'Layer 3 — breakpoints');
    for (const [name, px] of Object.entries(breakpoint)) {
      expect(root, name).toContain(`--ap-breakpoint-${name}: ${px / 16}rem;`);
    }
  });

  it('gives margin and gap their narrow values on :root and steps them at lg and xl', () => {
    const narrow = block(tokensCss, 'Layer 3 — layout');
    expect(narrow).toContain(`--ap-layout-margin: ${layout.margin.narrow}px;`);
    expect(narrow).toContain(`--ap-layout-gap: ${layout.gap.narrow}px;`);
    const medium = block(tokensCss, `@media ${media.up.lg}`);
    expect(medium).toContain(`--ap-layout-margin: ${layout.margin.medium}px;`);
    expect(medium).toContain(`--ap-layout-gap: ${layout.gap.medium}px;`);
    const wide = block(tokensCss, `@media ${media.up.xl}`);
    expect(wide).toContain(`--ap-layout-margin: ${layout.margin.wide}px;`);
    expect(wide).toContain(`--ap-layout-gap: ${layout.gap.wide}px;`);
    // Medium comes before wide, so at 1280 and up the wide block wins by order.
    expect(tokensCss.indexOf(`@media ${media.up.lg}`)).toBeLessThan(tokensCss.indexOf(`@media ${media.up.xl}`));
  });
});

describe('the Tailwind theme carries the breakpoints and the layout', () => {
  it('restates the six breakpoints and writes the layout spacing inline', () => {
    const theme = block(tailwindCss, '@theme {');
    for (const [name, px] of Object.entries(breakpoint)) {
      expect(theme, name).toContain(`--breakpoint-${name}: ${px / 16}rem;`);
    }
    const inline = block(tailwindCss, '@theme inline {');
    expect(inline).toContain('--spacing-layout-margin: var(--ap-layout-margin);');
    expect(inline).toContain('--spacing-layout-gap: var(--ap-layout-gap);');
  });

  it("compiles xs: at 30rem, keeps Tailwind's md: at 48rem, and reads the layout where it is used", async () => {
    const { compile } = await import('tailwindcss');
    const compiler = await compile(`@import "tailwindcss/theme.css";\n@import "tailwindcss/utilities.css";\n${tailwindCss}`, {
      base: process.cwd(),
      loadStylesheet: async (id: string) => {
        const path = `${process.cwd()}/node_modules/${id}`;
        return { path, base: process.cwd(), content: readFileSync(path, 'utf8') };
      },
    });
    const out = compiler.build(['xs:hidden', 'md:hidden', 'px-layout-margin', 'gap-layout-gap']);
    expect(out).toContain('@media (width >= 30rem)');
    expect(out).toContain('@media (width >= 48rem)');
    expect(block(out, '.px-layout-margin')).toContain('padding-inline: var(--ap-layout-margin);');
    expect(block(out, '.gap-layout-gap')).toContain('gap: var(--ap-layout-gap);');
  });
});
```

Add to `src/index.test.ts` (imports: `import { breakpoint, media, minViewport } from './tokens/scale';`, `import { layout, layoutModes } from './tokens/layout';`, and `LayoutMode` in the type import from `'./index'`):

```ts
  it('exports the breakpoints, the queries and the layout tokens', () => {
    expect(root.breakpoint).toBe(breakpoint);
    expect(root.media).toBe(media);
    expect(root.minViewport).toBe(minViewport);
    expect(root.layout).toBe(layout);
    expect(root.layoutModes).toBe(layoutModes);
    const mode: LayoutMode = 'wide';
    expect(root.layoutModes).toContain(mode);
  });
```

- [ ] **Step 2: Run the tests to see them fail**

Run: `npx vitest run src/tokens/layout.test.ts src/styles/generated.test.ts src/index.test.ts`
Expected: FAIL — `./layout` not found, `breakpoint` undefined, `no block: Layer 3 — breakpoints`.

- [ ] **Step 3: The source**

Append to `src/tokens/scale.ts`, before the type exports:

```ts
/**
 * Breakpoints. Tailwind's five, so `md:` means the same in a product and in
 * the package, and `xs` below them, where a phone's layout ends: every phone
 * width in use (360–440) is under 480, and the Toast and the CommandPalette
 * turn there. `sm` and `2xl` have no reader yet; they ship because the scale
 * is a known one.
 *
 * A media query cannot read a custom property. Write the query in rem and in
 * range syntax — `@media (width < 48rem)` — or take it from `media`; the rem
 * follows a reader's default font size. `src/styles/breakpoints.test.ts`
 * fails on any width outside this scale.
 */
export const breakpoint = {
  xs: 480,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

/** The narrowest width the system is built and tested at: WCAG 1.4.10's reflow. Not a breakpoint. */
export const minViewport = 320;

export type BreakpointName = keyof typeof breakpoint;

const queries = (op: '>=' | '<') =>
  Object.fromEntries(Object.entries(breakpoint).map(([name, px]) => [name, `(width ${op} ${px / 16}rem)`])) as Record<
    BreakpointName,
    string
  >;

/** `media.up.md` is `(width >= 48rem)`, `media.down.md` is `(width < 48rem)`: for `useMediaQuery` and `matchMedia`. */
export const media = { up: queries('>='), down: queries('<') } as const;
```

Create `src/tokens/layout.ts`:

```ts
/**
 * Alpenglow — layout
 *
 * The space around the content region and between its panes, stepping up with
 * the viewport. Measured from the original product's design file at 1440 —
 * 40 around the content, 20 between columns and cards — and stepped down for
 * narrower screens. The margin stays 16 below `lg` because the Scheduler's
 * five columns need 722, and 768 − 2 × 16 leaves 736.
 *
 * The navigation is outside it: the margin starts at the SideNav's edge, or
 * at the window's when the SideNav is a sheet.
 *
 * tokens.css writes the narrow values on :root and restates them inside
 * `@media (width >= 64rem)` and `@media (width >= 80rem)`, so a reader writes
 * `var(--ap-layout-margin)` and no media query of their own.
 */

import type { BreakpointName } from './scale';

export const layoutModes = ['narrow', 'medium', 'wide'] as const;
export type LayoutMode = (typeof layoutModes)[number];

/** The breakpoint each mode starts at; narrow starts at the floor. */
export const layoutModeStart = { narrow: null, medium: 'lg', wide: 'xl' } as const satisfies Record<
  LayoutMode,
  BreakpointName | null
>;

type Entry = Record<LayoutMode, number> & { use: string };

export const layout = {
  margin: {
    narrow: 16,
    medium: 24,
    wide: 40,
    use: 'Around the content region: from the navigation’s edge, the window’s edge and the TopBar',
  },
  gap: { narrow: 16, medium: 20, wide: 20, use: 'Between panes, and between the columns of a composition' },
} as const satisfies Record<string, Entry>;

export type LayoutTokenName = keyof typeof layout;
```

In `src/index.ts`, change the scale export line and add the layout exports after density:

```ts
export { spacing, radius, borderWidth, focusRingOffset, breakpoint, minViewport, media } from './tokens/scale';
export type { BreakpointName } from './tokens/scale';
```

```ts
export { layout, layoutModes } from './tokens/layout';
export type { LayoutMode } from './tokens/layout';
```

- [ ] **Step 4: The build scripts**

`scripts/build-css.ts`: extend the scale import to `import { spacing, radius, borderWidth, focusRingOffset, breakpoint, media } from '../src/tokens/scale.js';`, add `import { layout, layoutModeStart } from '../src/tokens/layout.js';`, and add:

```ts
function breakpointBlock(): string {
  return Object.entries(breakpoint)
    .map(([k, px]) => `  ${cssName(`breakpoint/${k}`)}: ${px / 16}rem;`)
    .join('\n');
}

function layoutBlock(mode: 'narrow' | 'medium' | 'wide', indent = '  '): string {
  return Object.entries(layout)
    .map(([k, v]) => `${indent}${cssName(`layout/${k}`)}: ${v[mode]}px;`)
    .join('\n');
}
```

In the template, directly after the scale's `:root { ${scaleBlock()} }` block and before the density block:

```ts
/* ---------------------------------------------------------------------------
   Layer 3 — breakpoints. For JS and for reading: a media query cannot read a
   custom property, so write the query in rem — @media (width < 48rem) — or
   take it from \`media\` in the package.
   --------------------------------------------------------------------------- */

:root {
${breakpointBlock()}
}

/* ---------------------------------------------------------------------------
   Layer 3 — layout. Margin around the content region and gap between its
   panes, narrow on :root and stepped up at lg and xl. The navigation is
   outside it.
   --------------------------------------------------------------------------- */

:root {
${layoutBlock('narrow')}
}

@media ${media.up[layoutModeStart.medium]} {
  :root {
${layoutBlock('medium', '    ')}
  }
}

@media ${media.up[layoutModeStart.wide]} {
  :root {
${layoutBlock('wide', '    ')}
  }
}
```

Add `${Object.keys(breakpoint).length} breakpoints, ${Object.keys(layout).length} layout tokens` to the closing `console.log`.

`scripts/build-tailwind.ts`: extend the scale import with `breakpoint`, add `import { layout } from '../src/tokens/layout.js';`. Inside `@theme {`, after the stroke-width lines:

```ts
lines.push('');
lines.push("  /* Breakpoints — Tailwind's five restated, so they stay put if its defaults move, and xs. */");
for (const [name, px] of Object.entries(breakpoint)) {
  lines.push(`  --breakpoint-${name}: ${px / 16}rem;`);
}
```

Inside `@theme inline {`, after the density lines:

```ts
lines.push('  /* Layout — resolves through tokens.css, whose values step up at lg and xl. */');
for (const name of Object.keys(layout)) {
  lines.push(`  --spacing-layout-${name}: var(--ap-layout-${name});`);
}
```

`scripts/export-figma.ts`: extend the scale import with `breakpoint, minViewport`, add `import { layout, layoutModes } from '../src/tokens/layout.js';`; add `breakpoint: ['WIDTH_HEIGHT'], layout: ['GAP'],` to `SCOPES`; append to the `'Alpenglow Scale'` variables:

```ts
        ...Object.entries(breakpoint).map(([k, v]) => ({ name: `breakpoint/${k}`, type: 'FLOAT', value: v, scopes: SCOPES.breakpoint })),
        { name: 'breakpoint/min', type: 'FLOAT', value: minViewport, scopes: SCOPES.breakpoint },
```

add a fifth collection after `'Alpenglow Density'`:

```ts
    'Alpenglow Layout': {
      modes: ['Narrow', 'Medium', 'Wide'],
      hiddenFromPublishing: false,
      variables: Object.entries(layout).map(([k, v]) => ({
        name: `layout/${k}`,
        type: 'FLOAT',
        values: Object.fromEntries(layoutModes.map((m) => [m[0]!.toUpperCase() + m.slice(1), v[m]])),
        scopes: SCOPES.layout,
        description: v.use,
      })),
    },
```

change `$description` to "Five collections: Primitives (hidden, one mode), Theme (Light then Dark, aliases only), Scale (one mode), Density (Comfortable then Compact), Layout (Narrow, Medium, Wide). …", and add `, ${out.collections['Alpenglow Layout'].variables.length} layout tokens` to the log.

`docs/figma/apply-variables.md`: "four" → "five" in the opening and in A's prompt; add to A's list:

```md
> 5. **Alpenglow Layout** — modes `Narrow`, `Medium`, `Wide`, in that order.
>    One FLOAT variable per entry, each mode set from `values`. Set `scopes`
>    and `description` from the entry. Then one grid style, **Alpenglow / 12
>    columns**: a COLUMNS layout grid, `STRETCH`, count 12, with `gutterSize`
>    bound to `layout/gap` and `offset` bound to `layout/margin` through
>    `figma.variables.setBoundVariableForLayoutGrid`, so a frame's Layout mode
>    sets both. The grid is a designer's guide; the code ships no column grid.
```

In B's script, after `// 4 — density …` and before the retire step (renumber it `// 6`):

```js
// 5 — layout, three modes, and the 12-column grid style bound to it
const ly = await collection('Alpenglow Layout', ['Narrow', 'Medium', 'Wide']);
const lyVar = {};
for (const v of DATA.collections['Alpenglow Layout'].variables) {
  const it = ly.byName.get(v.name) ?? figma.variables.createVariable(v.name, ly.col, 'FLOAT');
  for (const mode of ['Narrow', 'Medium', 'Wide']) it.setValueForMode(ly.ids[mode], v.values[mode]);
  it.scopes = v.scopes;
  it.description = v.description;
  lyVar[v.name] = it;
}
const gridName = 'Alpenglow / 12 columns';
const grid = (await figma.getLocalGridStylesAsync()).find((s) => s.name === gridName) ?? figma.createGridStyle();
grid.name = gridName;
let columns = { pattern: 'COLUMNS', alignment: 'STRETCH', count: 12, gutterSize: 20, offset: 40, visible: true, color: { r: 0.9, g: 0.3, b: 0.3, a: 0.1 } };
columns = figma.variables.setBoundVariableForLayoutGrid(columns, 'gutterSize', lyVar['layout/gap']);
columns = figma.variables.setBoundVariableForLayoutGrid(columns, 'offset', lyVar['layout/margin']);
grid.layoutGrids = [columns];
```

- [ ] **Step 5: Regenerate and run the tests**

Run: `npm run build:css && npx tsx scripts/export-figma.ts && npx vitest run src/tokens src/styles src/index.test.ts src/components/custom-properties.test.ts`
Expected: PASS. `git diff --stat` shows `tokens.css`, `tailwind-theme.css` and `alpenglow-variables.json` changed, and nothing else regenerated.

- [ ] **Step 6: Commit**

```bash
git add src/tokens/scale.ts src/tokens/layout.ts src/tokens/layout.test.ts scripts/build-css.ts scripts/build-tailwind.ts scripts/export-figma.ts docs/figma/apply-variables.md src/styles/generated.test.ts src/styles/tokens.css src/styles/tailwind-theme.css docs/figma/alpenglow-variables.json src/index.ts src/index.test.ts
git commit -m "Breakpoints as tokens and layout margin and gap that step with them"
```

---

### Task 2: The package on the scale, and no z-index outside an isolate

**Files:**
- Modify: `src/components/SideNav/SideNav.tsx`, `src/components/SideNav/SideNav.test.tsx`, `src/components/Toast/Toast.module.css`, `src/components/CommandPalette/CommandPalette.module.css`, `src/components/CommandPalette/CommandPalette.test.tsx`, `src/components/TopBar/TopBar.module.css`, `src/components/TopBar/TopBar.test.tsx`, `src/components/Scheduler/Scheduler.module.css`, `src/components/Table/Table.module.css`, `src/components/Slider/Slider.module.css`
- Create: `src/components/layering.test.ts`

**Interfaces:**
- Consumes: `media` from `src/tokens/scale.ts` (Task 1); `--ap-layout-margin` (Task 1).
- Produces: `SIDE_NAV_NARROW === '(width < 48rem)'`.

- [ ] **Step 1: Write the failing tests**

`src/components/layering.test.ts`:

```ts
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { readCss } from '@/test/css';

/**
 * Alpenglow ships no z-index tokens. What floats goes to the top layer; what
 * stacks inside a component is shut in its own `isolation: isolate`, so the
 * page's stack belongs to the product and a sticky bar at z-index 1 sits over
 * everything the package draws. /decisions says why.
 */
const modules = readdirSync('src/components', { recursive: true, encoding: 'utf8' })
  .filter((file) => file.endsWith('.module.css'))
  .map((file) => join('src/components', file))
  .sort();

describe('layering', () => {
  it('finds the modules', () => {
    expect(modules).toContain('src/components/Scheduler/Scheduler.module.css');
  });

  for (const path of modules) {
    const css = readCss(path);
    const values = [...css.matchAll(/z-index:\s*(-?\d+)/g)].map(([, n]) => Number(n));
    if (values.length === 0) continue;

    it(`${path} isolates the z-index it uses, and keeps it at 3 or under`, () => {
      expect(css).toMatch(/isolation:\s*isolate/);
      expect(Math.max(...values)).toBeLessThanOrEqual(3);
    });
  }
});
```

In `src/components/SideNav/SideNav.test.tsx`, change the last assertion of "takes the query from the caller" to:

```ts
    expect(SIDE_NAV_NARROW).toBe('(width < 48rem)');
```

In `src/components/CommandPalette/CommandPalette.test.tsx`, change the phone assertion to:

```ts
    expect(css).toMatch(/@media \(width < 30rem\) \{\s*\.option \{ flex-wrap: wrap; \}/);
```

In `src/components/TopBar/TopBar.test.tsx`, add:

```ts
  it('pads its sides by the layout margin, so it lines up with the content under it', () => {
    expect(block(css, '.topbar {')).toMatch(/padding: var\(--ap-spacing-150\) var\(--ap-layout-margin\);/);
  });
```

- [ ] **Step 2: Run the tests to see them fail**

Run: `npx vitest run src/components/layering.test.ts src/components/SideNav src/components/CommandPalette src/components/TopBar`
Expected: FAIL — the Scheduler and the Slider modules have no `isolation: isolate` (the Table has one z-index and none either); `SIDE_NAV_NARROW` is `(max-width: 760px)`; the palette's query is `max-width: 480px`; the TopBar pads by `--ap-spacing-300`.

- [ ] **Step 3: Implement**

`SideNav.tsx`: add `import { media } from '../../tokens/scale';` and replace the constant:

```ts
/** Below `md` the side nav is a modal sheet: 768 keeps the rail. */
export const SIDE_NAV_NARROW = media.down.md;
```

`Toast.module.css` line 192: `@media (max-width: 480px) {` → `@media (width < 30rem) {`, and in the comment above it say "Below `xs` (480)".

`CommandPalette.module.css` line 138: `@media (max-width: 480px) {` → `@media (width < 30rem) {`; the comment's "480 is where…" becomes "Below `xs`, 480, is where…".

`TopBar.module.css`, in `.topbar`: `padding: var(--ap-spacing-150) var(--ap-spacing-300);` → `padding: var(--ap-spacing-150) var(--ap-layout-margin);` and add to the file's header comment: "Its sides are the layout margin, so the bar's start and end line up with the content under it at every width."

`Scheduler.module.css`, in `.root`, after `position: relative;`:

```css
  /* The sticky head (3) and hours (2) stack inside the Scheduler, never in
     the page's stack: a product's sticky bar at z-index 1 stays over them. */
  isolation: isolate;
```

`Table.module.css`, in `.root`:

```css
  /* The sticky header's z-index stays inside the Table. container-type holds
     it in today through layout containment; this says so, and keeps saying
     so if the container query goes. */
  isolation: isolate;
```

`Slider.module.css`, in `.slider`:

```css
  /* The upper input of a range (z-index 1) stacks inside the Slider. */
  isolation: isolate;
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run src/components`
Expected: PASS, the Scheduler, Table and Slider suites included (isolation changes no behaviour jsdom sees).

- [ ] **Step 5: Commit**

```bash
git add src/components/layering.test.ts src/components/SideNav/SideNav.tsx src/components/SideNav/SideNav.test.tsx src/components/Toast/Toast.module.css src/components/CommandPalette/CommandPalette.module.css src/components/CommandPalette/CommandPalette.test.tsx src/components/TopBar/TopBar.module.css src/components/TopBar/TopBar.test.tsx src/components/Scheduler/Scheduler.module.css src/components/Table/Table.module.css src/components/Slider/Slider.module.css
git commit -m "The SideNav turns at md, the phone layouts below xs, the TopBar pads by the margin, and every z-index stays in its component"
```

---

### Task 3: The screen on the scale

**Files:**
- Modify: `app/screen/Screen.tsx`, `app/screen/zones/Navigation.tsx`, `app/screen/zones/Day.tsx`, `app/screen/screen.module.css`, `app/screen/Screen.test.tsx`, `app/screen/local-values.test.ts`

**Interfaces:**
- Consumes: `media` (Task 1), `layout` (Task 1), `--ap-layout-margin`, `--ap-layout-gap`.
- Produces: `NAV_NARROW === media.down.lg`.

- [ ] **Step 1: Write the failing test**

Append to `app/screen/local-values.test.ts` (imports: `import { breakpoint, borderWidth, spacing } from '@/tokens/scale';`, `import { layout } from '@/tokens/layout';`):

```ts
  it('lays out by the layout tokens, with no gutter of its own', () => {
    const css = readCss('app/screen/screen.module.css');
    for (const selector of ['.dayBar {', '.body {', '.tabs {']) {
      expect(block(css, selector), selector).toMatch(/var\(--ap-layout-margin\)/);
    }
    expect(block(css, '.body {')).toMatch(/gap: var\(--ap-layout-gap\)/);
  });

  it('fits the Scheduler’s five columns at md with the narrow margin', () => {
    // 768 is the frame's tablet: the SideNav is a sheet, so the body has the
    // window less two narrow margins. The narrow mode runs up to lg.
    const floor = 5 * spacing[1200] + spacing[1000] + 2 * borderWidth.hairline;
    expect(breakpoint.md - 2 * layout.margin.narrow).toBeGreaterThanOrEqual(floor);
    expect(breakpoint.md).toBeLessThan(breakpoint.lg);
  });
```

Change the stub at the head of `app/screen/Screen.test.tsx` (import `media` from `'@/tokens/scale'`):

```ts
/**
 * The wide screen: the day and the table side by side, the SideNav expanded.
 * Only `media.up.xl` matches, so every narrower query is false. A test that
 * wants the phone sets `wide` to false, and then every `width <` query matches.
 */
let wide = true;
window.matchMedia = (query: string) =>
  ({
    matches: wide ? query === media.up.xl : query.startsWith('(width <'),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }) as unknown as MediaQueryList;
```

- [ ] **Step 2: Run the tests to see them fail**

Run: `npx vitest run app/screen`
Expected: FAIL — `.dayBar` pads by `--ap-spacing-300`; the Screen suite renders the narrow layout because `(min-width: 1280px)` is no longer what the stub matches.

- [ ] **Step 3: Implement**

`Navigation.tsx`: add `import { media } from '@/tokens/scale';`, replace the `NAV_NARROW` comment and constant:

```ts
/** The spec puts 768 in the sheet and 1024 on the rail: the sheet is below lg. */
export const NAV_NARROW = media.down.lg;
```

and in `Navigation`:

```ts
  // On the rail below xl, expanded from xl.
  const collapsed = useMediaQuery(media.down.xl);
```

`Screen.tsx`: add `import { media } from '@/tokens/scale';` and:

```ts
  const wide = useMediaQuery(media.up.xl);
  const narrow = useMediaQuery(NAV_NARROW);
  const phone = useMediaQuery(media.down.xs);
```

`Day.tsx`: add `import { media } from '@/tokens/scale';` and `const phone = useMediaQuery(media.down.xs);`.

`screen.module.css`:
- `.phoneDate`: `padding: var(--ap-spacing-150) var(--ap-layout-margin) 0;`
- `.dayBar`: `padding: var(--ap-spacing-200) var(--ap-layout-margin);`
- `.body`: `gap: var(--ap-layout-gap);` and `padding: 0 var(--ap-layout-margin) var(--ap-layout-margin);`
- `.tabs`: `padding: 0 var(--ap-layout-margin) var(--ap-layout-margin);`
- The three queries at the foot become:

```css
/* Below xl the search is its icon: the date keeps its words, and the
   shortcut stays on the button as aria-keyshortcuts. */
@media (width < 80rem) {
  .body { grid-template-columns: minmax(0, 1fr); }
  .searchWords { display: none; }
}

/* With the SideNav in its sheet, below lg, the brand is its mark. The
   margin narrows by itself: layout/margin is 16 below lg. */
@media (width < 64rem) {
  .brandName { display: none; }
}

/* At a phone's width: Filters and New appointment share the first row, the
   summary takes the second. */
@media (width < 30rem) {
  .form { grid-template-columns: minmax(0, 1fr); }
  .summary { order: 1; flex-basis: 100%; }
}
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run app/screen`
Expected: PASS, axe included.

- [ ] **Step 5: Commit**

```bash
git add app/screen/Screen.tsx app/screen/zones/Navigation.tsx app/screen/zones/Day.tsx app/screen/screen.module.css app/screen/Screen.test.tsx app/screen/local-values.test.ts
git commit -m "The screen turns at xs, lg and xl and takes its margins and gap from the layout tokens"
```

---

### Task 4: The site on the scale

**Files:**
- Modify: `app/docs.css`, `app/ui/Nav.tsx`, `app/ui/Nav.test.tsx`, `app/ui/DocPage.test.tsx`, `app/scheduler/page.tsx`, `app/navigation/page.tsx`, `app/decisions/page.tsx`

**Interfaces:**
- Consumes: `breakpoint`, `media`, `layout` (Task 1).
- Produces: `NARROW === media.down.md`.

- [ ] **Step 1: Write the failing tests**

`app/ui/Nav.test.tsx` — imports: add `import { breakpoint, media } from '@/tokens/scale';` and `import { layout } from '@/tokens/layout';`. Replace the laptop tier's header and floor:

```ts
  describe('the laptop tier, from md up to 2xl', () => {
    // The floor is the narrow tier's edge: below md both bars dissolve into
    // the narrow bar, and a drawer left absolute there would take the brand
    // and the toggle with it. The top is where the wide page begins.
    it('starts where the narrow bar ends', () => {
      expect(NARROW).toBe(media.down.md);
    });
    const laptop = block(css, `@media (${breakpoint.md / 16}rem <= width < ${breakpoint['2xl'] / 16}rem)`);
```

(the three `it`s inside stay as they are). Replace the wide-breakpoint test:

```ts
  it('puts the wide page at 2xl, where the prose still holds a Table specimen beside the list', () => {
    // Measure where the content breaks, then round to the safe step. At 2xl
    // the drawer is in the flow and the margin is wide; the two bars, the
    // margins, the list, the evidence, three gaps and the spacer's minimum
    // must leave the 704 a Table specimen needs — 654 of table plus the
    // specimen's padding and hairlines on both sides.
    const page = block(css, `@media ${media.up['2xl']}`);
    const columns = page.match(/\.page\s*\{[^}]*grid-template-columns: ([^;]+);/)![1]!;
    const [list, , spacer, evidence] = columns.split(/\s+(?![^(]*\))/);
    expect(page).toMatch(/column-gap: var\(--ap-layout-gap\)/);
    expect(rulesOf('.page')).toMatch(/padding: var\(--ap-layout-margin\) var\(--ap-layout-margin\)/);

    const chrome = px(rulesOf('.rail'), 'width') + px(rulesOf('.drawer'), 'width') + 2 * layout.margin.wide;
    const beside = Number(list!.replace('px', '')) + Number(evidence!.replace('px', '')) + 3 * layout.gap.wide + step(spacer!);
    expect(breakpoint['2xl'] - chrome - beside).toBeGreaterThanOrEqual(704);
  });

  it('drops the evidence column below xl, and not before it is squeezed', () => {
    // From xl to 2xl the drawer overlays, so the rail alone is the chrome;
    // the prose beside the evidence must still hold the Table specimen's 704.
    const below = block(css, `@media ${media.down.xl}`);
    expect(below).toMatch(/\.gutter\s*\{\s*display: none/);
    const evidence = Number(rulesOf('.page').match(/grid-template-columns: minmax\(0, 1fr\) (\d+)px/)![1]);
    const prose = breakpoint.xl - px(rulesOf('.rail'), 'width') - 2 * layout.margin.wide - evidence - layout.gap.wide;
    expect(prose).toBeGreaterThanOrEqual(704);
  });
```

`app/ui/DocPage.test.tsx` — imports: add `import { breakpoint, media, minViewport } from '@/tokens/scale';` and `import { layout } from '@/tokens/layout';`. Replace the head of `describe('the specimen on the narrowest screens', …)` and its first test:

```ts
describe('the specimen on the narrowest screens', () => {
  const pageRule = declarations(css, '.page');
  const pagePadding = layout.margin.narrow;
  const specimenPadding = token(declarations(css, '.specimen').match(/padding: (\S+)/)![1]!);
  const hairline = declarations(css, '.specimen').includes('--ap-border-width-hairline')
    ? borderWidth.hairline
    : NaN;
  const calendar = Number(declarations(calendarCss, '.calendar').match(/width: (\d+)px/)?.[1]);
  const bleed = block(css, `@media ${media.down.xs}`);

  it('bleeds on every phone, above where a bordered specimen stops holding a Calendar', () => {
    expect(pageRule).toMatch(/padding: var\(--ap-layout-margin\) var\(--ap-layout-margin\)/);
    expect(specimenPadding, 'the specimen padding is a spacing token').toBeTypeOf('number');
    expect(calendar).toBe(280);
    // Measured: the bordered specimen stops holding a Calendar at 362 with the
    // narrow margin. Rounded up to the safe step, xs.
    expect(breakpoint.xs).toBeGreaterThanOrEqual(calendar + 2 * (pagePadding + specimenPadding + hairline));
  });

  it('holds a Calendar at 320px once it runs edge to edge', () => {
    const rule = declarations(bleed, '.prose > .specimen');
    expect(rule).toMatch(/border-inline: none/);
    expect(rule).toMatch(/border-radius: 0/);
    // Out by the page's margin and in by the same, so the specimen's content
    // lines up with the text around it.
    expect(rule).toMatch(/margin-inline: calc\(-1 \* var\(--ap-layout-margin\)\)/);
    expect(rule).toMatch(/padding-inline: var\(--ap-layout-margin\)/);
    expect(minViewport - 2 * pagePadding).toBeGreaterThanOrEqual(calendar);
  });
});
```

Update the file's header comment: "Below `xs` a specimen goes edge to edge. The breakpoint is the scale's, checked against the numbers it was measured from."

- [ ] **Step 2: Run the tests to see them fail**

Run: `npx vitest run app/ui/Nav.test.tsx app/ui/DocPage.test.tsx`
Expected: FAIL — `no block: @media (48rem <= width < 96rem)`, `NARROW` is `(max-width: 760px)`, `no block: @media (width < 30rem)`.

- [ ] **Step 3: Implement**

`app/ui/Nav.tsx`: `import { media } from '@/tokens/scale';` and `export const NARROW = media.down.md;` (keep its comment, with "760px" read as "`md`, 768").

`app/docs.css`:
- `.page` (line ~286): `gap: var(--ap-layout-gap);` and `padding: var(--ap-layout-margin) var(--ap-layout-margin) var(--ap-spacing-1100);`
- `.footer` (line ~1337): its inline padding `var(--ap-spacing-400)` → `var(--ap-layout-margin)`, so the footer lines up with the page.
- The wide block: `@media (min-width: 1496px) {` → `@media (width >= 96rem) {`, its `column-gap: var(--ap-spacing-300);` → `column-gap: var(--ap-layout-gap);`, and its comment rewritten: "Wide, from `2xl`: the sections join on the left. Measured, the prose holds a Table specimen with the list beside it from 1108 of page — the 80 rail, the 232 drawer, two 40 margins, the list, the evidence, three 20 gaps and the spacer — and 2xl, 1536, is the safe step above it. `Nav.test.tsx` checks the inequality."
- The laptop tier: `@media (max-width: 1440px) and (min-width: 761px) {` → `@media (48rem <= width < 96rem) {`; its comment's "at 1440 and below" → "below `2xl`", "below 760" → "below `md`".
- `@media (max-width: 1160px) {` → `@media (width < 80rem) {`, comment: "Below `xl` the evidence column goes: from `xl` the prose beside it still holds a Table specimen (`Nav.test.tsx`)."
- Both `@media (max-width: 760px) {` → `@media (width < 48rem) {`. Inside the first, `.page { padding: var(--ap-spacing-400) var(--ap-spacing-250) var(--ap-spacing-600); }` → `.page { padding-block-end: var(--ap-spacing-600); }` and `.footer { padding: var(--ap-spacing-500) var(--ap-spacing-250) var(--ap-spacing-400); }` → `.footer { padding: var(--ap-spacing-500) var(--ap-layout-margin) var(--ap-spacing-400); }`.
- `@media (width < 370px) {` → `@media (width < 30rem) {`, its rule's `var(--ap-spacing-250)` twice → `var(--ap-layout-margin)`, and its comment's last lines: "Measured, a bordered specimen stops holding it at 362 with the narrow margin; `xs` is the safe step, so every phone gets the specimen edge to edge. `DocPage.test.tsx` checks it."

`app/scheduler/page.tsx`: `import { media } from '@/tokens/scale';`, line 289 `useMediaQuery(media.down.md)`, line 367 `@media (max-width: 1000px)` → `@media (width < 64rem)`, line 496's prose "Under 760px" → "Below `md`, 768,".

`app/navigation/page.tsx`: the props table default → `"media.down.md — '(width < 48rem)'"`; line 272 `'(min-width: 0px)'` → `'all'` (a query that always matches, for the demo's forced sheet); line 317's prose "a media query of 760px unless told" → "`media.down.md`, below 768, unless told".

`app/decisions/page.tsx`: replace the two site entries.

```tsx
      <h2>The section list joins the prose at 2xl, and not before</h2>
      <Decided on="2026-09-12, moved on 2026-09-14 and 2026-09-24" />
      <p>
        The site&rsquo;s page has three columns on a wide screen — the sections, the prose,
        the measurements — and a Table specimen needs 704px of prose to keep its header: 654
        for the table and a specimen&rsquo;s padding and hairline on both sides. Measured, the
        chrome and the columns leave that from 1108: the 80px rail, the 232px drawer, two 40px
        margins, the 152px list, the 168px measurements, three 20px gaps and a 24px spacer.
        It was a breakpoint of its own, 1496, until the breakpoints became a scale; now it is
        the scale&rsquo;s step on the safe side of the measure, <code>2xl</code>, 1536, and the
        test holds the inequality rather than the number.
      </p>

      <h2>Below 2xl the drawer waits under the rail</h2>
      <Decided on="2026-09-15, moved on 2026-09-24" />
      <p>
        From <code>2xl</code> down to the narrow bar at <code>md</code>, the drawer is out of the
        flow: the rail alone is the sidebar, the page gains the drawer&rsquo;s 232, and the drawer
        slides out over the page — 140ms, the travel duration — while the pointer or the focus is
        in the sidebar, and back under the rail when they leave. Focus opens it because a keyboard
        reaches the drawer&rsquo;s links through the rail&rsquo;s; the search&rsquo;s own dialog
        does not, since its field is focus inside the sidebar and the drawer would slide out
        behind the scrim. Hidden as well as moved, so its links are out of the tab order while it
        is under the rail. The reader without a pointer, on a tablet in this range, has the
        section&rsquo;s page one tap away on the rail, and it lists the same pages as cards. The
        brand goes with the drawer on this tier; the rail is 80 wide and the name does not fit it.
        It started at 1440; one edge at <code>2xl</code> now serves this tier and the wide page.
      </p>
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run app`
Expected: PASS, `pages.test.tsx`'s axe run included.

- [ ] **Step 5: Commit**

```bash
git add app/docs.css app/ui/Nav.tsx app/ui/Nav.test.tsx app/ui/DocPage.test.tsx app/scheduler/page.tsx app/navigation/page.tsx app/decisions/page.tsx
git commit -m "The site on the scale: its measured breakpoints rounded to the safe step, its margins and gaps the layout tokens"
```

---

### Task 5: No width outside the scale

**Files:**
- Create: `src/styles/breakpoints.test.ts`

**Interfaces:**
- Consumes: `breakpoint` (Task 1). Relies on Tasks 2–4 having moved every literal.

- [ ] **Step 1: Write the test**

```ts
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { breakpoint } from '@/tokens/scale';

/**
 * Every width a media query names is one of the scale's six, in rem. A media
 * query cannot read a custom property, so the scale is held here instead.
 * `@container` queries are not breakpoints — a component answering its own
 * space — and are left alone; so are `prefers-*`, `pointer`, `hover` and
 * `forced-colors`, which name no width.
 */
const allowed = new Set(Object.values(breakpoint).map((px) => `${px / 16}rem`));

/** The lengths named by media queries in `text`: `@media` preludes, and query strings in code. */
export function mediaWidths(text: string): string[] {
  const queries = [
    ...[...text.matchAll(/@media([^{]+)\{/g)].map(([, prelude]) => prelude!),
    ...[...text.matchAll(/(['"`])(\((?:min-|max-)?width[^'"`]*|\([\d.]+(?:px|rem|em)\s*<=?\s*width[^'"`]*)\1/g)].map(([, , q]) => q!),
  ];
  return queries.flatMap((q) => [...q.matchAll(/(\d+(?:\.\d+)?)(px|rem|em)/g)].map(([length]) => length));
}

const files = ['src', 'app']
  .flatMap((dir) => readdirSync(dir, { recursive: true, encoding: 'utf8' }).map((file) => join(dir, file)))
  .filter((file) => /\.(css|ts|tsx)$/.test(file) && !/\.test\.tsx?$/.test(file))
  .sort();

describe('the breakpoint scale holds', () => {
  it('finds a width when there is one, and only in a media query', () => {
    expect(mediaWidths('@media (max-width: 760px) { .a { max-width: 480px; } }')).toEqual(['760px']);
    expect(mediaWidths('@media (48rem <= width < 96rem) {')).toEqual(['48rem', '96rem']);
    expect(mediaWidths('@container (max-width: 40rem) { .a { color: red; } }')).toEqual([]);
    expect(mediaWidths("useMediaQuery('(max-width: 480px)')")).toEqual(['480px']);
    expect(mediaWidths("useMediaQuery('(width < 30rem)')")).toEqual(['30rem']);
    expect(mediaWidths('@media (prefers-reduced-motion: reduce) {')).toEqual([]);
    expect(mediaWidths('grid-template-columns: minmax(0, 480px);')).toEqual([]);
  });

  it('walks the package and the site', () => {
    expect(files).toContain('src/styles/tokens.css');
    expect(files).toContain('app/docs.css');
    expect(files).toContain('app/screen/Screen.tsx');
  });

  it('names no width outside the scale, anywhere', () => {
    const offenders = files.flatMap((file) =>
      mediaWidths(readFileSync(file, 'utf8')).filter((w) => !allowed.has(w)).map((w) => `${file}: ${w}`),
    );
    expect(offenders).toEqual([]);
  });
});
```

- [ ] **Step 2: Run it**

Run: `npx vitest run src/styles/breakpoints.test.ts`
Expected: PASS. The scan reads files whole, comments included, so a comment quoting an old query (`(max-width: 760px)`) counts: reword it with the scale's name. If "names no width outside the scale" lists offenders, each is a literal Tasks 2–4 missed: move it to the step the spec's decision 7 rule gives (measure, round to the safe step) and run again. Do not widen `allowed`.

- [ ] **Step 3: Commit**

```bash
git add src/styles/breakpoints.test.ts
git commit -m "A test holds every media query to the breakpoint scale"
```

---

### Task 6: The Layout page, the z-index decision and the nav

**Files:**
- Create: `app/layout/page.tsx`, `app/layout/page.test.tsx`
- Modify: `app/decisions/page.tsx`, `app/ui/contents.ts`, `app/foundations/page.tsx`, `app/space/page.tsx`, `app/docs.css` (the page's small drawing)

**Interfaces:**
- Consumes: `breakpoint`, `media`, `minViewport`, `layout`, `layoutModes`, `layoutModeStart`.

- [ ] **Step 1: Write the failing test**

`app/layout/page.test.tsx`:

```tsx
import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { breakpoint, minViewport } from '@/tokens/scale';
import { layout } from '@/tokens/layout';
import Page from './page';

describe('the Layout page', () => {
  it('has one row per breakpoint, from the scale', () => {
    render(<Page />);
    const table = screen.getByRole('table', { name: 'Breakpoints' });
    for (const [name, px] of Object.entries(breakpoint)) {
      const row = within(table).getByRole('row', { name: new RegExp(`^${name} `) });
      expect(row).toHaveTextContent(`${px / 16}rem`);
      expect(row).toHaveTextContent(`${px}px`);
    }
    expect(screen.getByText(new RegExp(`${minViewport}px`))).toBeInTheDocument();
  });

  it('has the margin and gap in their three modes', () => {
    render(<Page />);
    const table = screen.getByRole('table', { name: 'Layout tokens' });
    const margin = within(table).getByRole('row', { name: /layout\/margin/ });
    expect(margin).toHaveTextContent(`${layout.margin.narrow}px`);
    expect(margin).toHaveTextContent(`${layout.margin.medium}px`);
    expect(margin).toHaveTextContent(`${layout.margin.wide}px`);
  });

  it('links the layering rule to its decision', () => {
    render(<Page />);
    expect(screen.getByRole('link', { name: /no z-index tokens/i })).toHaveAttribute('href', '/decisions#no-z-index-tokens');
  });

});
```

Axe runs on every page in `app/pages.test.tsx`, which finds the new page by itself. Each Table's accessible name is its `caption` (required, visually hidden). A row's name starts with its primary cell, hence the `^${name} ` anchor with its trailing space.

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run app/layout`
Expected: FAIL — `./page` not found.

- [ ] **Step 3: The page**

`app/layout/page.tsx`, in the Density page's shape (`DocPage`, `CodeBlock`, a generated `Table`):

```tsx
import { DocPage } from '@ui/DocPage';
import { CodeBlock } from '@ui/CodeBlock';
import { Table } from '@/components/Table';
import type { Column } from '@/components/Table';
import { breakpoint, minViewport } from '@/tokens/scale';
import type { BreakpointName } from '@/tokens/scale';
import { layout, layoutModes, layoutModeStart } from '@/tokens/layout';
import type { LayoutTokenName } from '@/tokens/layout';

/**
 * The Layout page: the breakpoint scale and who reads each step, how to use
 * it where a media query cannot read a variable, the rule for a layout of
 * one's own, the viewport and the container, margin and gap with the pane
 * model, and a paragraph on layering.
 */

const READERS: Record<BreakpointName, string> = {
  xs: 'Below it, a phone: the Toast full width, the CommandPalette full screen, the site’s specimens edge to edge',
  sm: 'No reader yet — Tailwind’s step, kept so sm: means the same everywhere',
  md: 'Below it, the SideNav is a sheet and the site’s bar is narrow; the Tailwind default, 768',
  lg: 'Margin 24 and gap 20 from here; the screen’s navigation leaves its sheet',
  xl: 'Margin 40 from here; two panes side by side; the site’s evidence column',
  '2xl': 'No component reader; the site’s wide page, with the section list beside the prose',
};

type BreakpointRow = { name: BreakpointName; px: number };
const BREAKPOINT_ROWS: BreakpointRow[] = (Object.entries(breakpoint) as [BreakpointName, number][]).map(([name, px]) => ({ name, px }));
const BREAKPOINT_COLUMNS: Column<BreakpointRow>[] = [
  { key: 'name', header: 'Name', primary: true, cell: (r) => <span className="tokenName">{r.name}</span> },
  { key: 'rem', header: 'rem', align: 'end', cell: (r) => `${r.px / 16}rem` },
  { key: 'px', header: 'px', align: 'end', cell: (r) => `${r.px}px` },
  { key: 'reads', header: 'What turns there', cell: (r) => READERS[r.name] },
];

const MODE_LABEL = { narrow: 'Narrow', medium: 'Medium', wide: 'Wide' } as const;
const since = (m: (typeof layoutModes)[number]) => {
  const start = layoutModeStart[m];
  return start ? `from ${start}, ${breakpoint[start]}` : `below ${layoutModeStart.medium}`;
};

type LayoutRow = { name: LayoutTokenName };
const LAYOUT_ROWS: LayoutRow[] = (Object.keys(layout) as LayoutTokenName[]).map((name) => ({ name }));
const LAYOUT_COLUMNS: Column<LayoutRow>[] = [
  { key: 'token', header: 'Token', primary: true, cell: (r) => <span className="tokenName">layout/{r.name}</span> },
  ...layoutModes.map(
    (m): Column<LayoutRow> => ({ key: m, header: `${MODE_LABEL[m]} (${since(m)})`, align: 'end', cell: (r) => `${layout[r.name][m]}px` }),
  ),
  { key: 'use', header: 'Where', cell: (r) => layout[r.name].use },
];

export default function LayoutPage() {
  return (
    <DocPage>
      <h1>Breakpoints and layout</h1>
      <p className="lead">
        Six breakpoints — Tailwind&rsquo;s five and one below them — and two layout tokens that step with them. The
        navigation is outside the layout; the content beside it is not.
      </p>

      <h2>The scale</h2>
      <Table caption="Breakpoints" columns={BREAKPOINT_COLUMNS} rows={BREAKPOINT_ROWS} getRowId={(r) => r.name} />
      <p>
        {minViewport}px is the floor, not a breakpoint: the narrowest width the system is built and tested at, WCAG
        1.4.10&rsquo;s reflow. Every step is in rem, so a reader who sets a larger default font size gets the narrower
        layout sooner.
      </p>

      <h2>Using it</h2>
      <p>
        A media query cannot read a custom property, so the tokens reach each place in its own form. In CSS, write the
        query in rem and range syntax; in React, take it from <code>media</code>; in Tailwind, <code>xs:</code> exists and
        the other five are Tailwind&rsquo;s own.
      </p>
      <CodeBlock lang="css" code={`@media (width < 48rem) { … }   /* below md */\n@media (width >= 80rem) { … }  /* xl and up */`} />
      <CodeBlock lang="tsx" code={`import { media } from 'alpenglow';\nconst narrow = useMediaQuery(media.down.md); // '(width < 48rem)'`} />
      <p>
        <code>--ap-breakpoint-*</code> in <code>tokens.css</code> are for JavaScript and for reading. A test fails on any
        width in a media query outside the scale.
      </p>

      <h2>A layout of your own</h2>
      <p>
        Measure where the content breaks, then round to the safe step. This site&rsquo;s wide page needs 1108 to hold a
        Table specimen beside the section list, so it starts at <code>2xl</code>, 1536; its evidence column needs the
        prose beside it to keep 704, which it does from <code>xl</code>. The tests hold the inequality, not the number.
      </p>

      <h2>The viewport and the container</h2>
      <p>
        The viewport decides the chrome and the page&rsquo;s composition: where the SideNav becomes a sheet, when two
        panes sit side by side. A component that answers its own space answers its container — the Alert stacks its
        actions under 400px of its own width in any screen — and a container query is not a breakpoint.
      </p>

      <h2>Margin and gap</h2>
      <Table caption="Layout tokens" columns={LAYOUT_COLUMNS} rows={LAYOUT_ROWS} getRowId={(r) => r.name} />
      <p>
        The margin is the space around the content region, from the navigation&rsquo;s edge, the window&rsquo;s and the
        TopBar alike; the TopBar pads its sides by it, so its start and end line up with the content. The gap is between
        panes and between the columns of a composition. Below <code>xl</code> the content is one pane, two behind Tabs;
        from <code>xl</code> two sit side by side. There is no 12-column grid in code: the Scheduler and the Table size
        themselves. In Figma the <code>Alpenglow Layout</code> collection has the three modes, and a 12-column grid style
        is bound to it as a guide.
      </p>
      <figure className="layoutModes" aria-label="The pane model in its three modes">
        {layoutModes.map((m) => (
          <div key={m} className="layoutMode" data-mode={m}>
            <span className="layoutNav" aria-hidden="true" />
            <span className="layoutContent" aria-hidden="true">
              <span className="layoutPane" />
              {m === 'wide' && <span className="layoutPane" />}
            </span>
            <span className="layoutCaption">
              {MODE_LABEL[m]} — margin {layout.margin[m]}, gap {layout.gap[m]}
            </span>
          </div>
        ))}
      </figure>

      <h2>Layering</h2>
      <p>
        Alpenglow ships <a href="/decisions#no-z-index-tokens">no z-index tokens</a>. What floats goes to the top
        layer; what stacks inside a component stays in its own <code>isolation: isolate</code>, at 3 or under. The
        page&rsquo;s stack is the product&rsquo;s: a sticky bar at <code>z-index: 1</code> sits over everything the
        package draws.
      </p>

      <h2>Not checked</h2>
      <p>Safari, Firefox, a real touch device, and text zoom beyond the browser&rsquo;s default font size.</p>
    </DocPage>
  );
}
```

In `app/docs.css`, after the density section, the drawing (tokens only; the nav column drawn at 16 in narrow as the sheet's edge):

```css
/* --- layout: the pane model in its three modes --------------------------- */

.layoutModes {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: var(--ap-spacing-200);
  margin: 0;
}

.layoutMode {
  display: grid;
  grid-template-columns: var(--ap-spacing-300) minmax(0, 1fr);
  grid-template-rows: var(--ap-spacing-1300) auto;
  border: var(--ap-border-width-hairline) solid var(--ap-color-border-subtle);
  border-radius: var(--ap-radius-lg);
  overflow: hidden;
}

.layoutNav { background: var(--ap-color-surface-sunken); }
.layoutMode[data-mode='narrow'] .layoutNav { background: none; }

.layoutContent {
  display: flex;
  gap: var(--ap-spacing-100);
  padding: var(--ap-spacing-100);
}
.layoutMode[data-mode='medium'] .layoutContent { padding: var(--ap-spacing-150); }
.layoutMode[data-mode='wide'] .layoutContent { padding: var(--ap-spacing-250); }

.layoutPane {
  flex: 1;
  border-radius: var(--ap-radius-sm);
  background: var(--ap-color-interactive-wash-hover);
}

.layoutCaption {
  grid-column: 1 / -1;
  padding: var(--ap-spacing-100) var(--ap-spacing-150);
  border-block-start: var(--ap-border-width-hairline) solid var(--ap-color-border-subtle);
  color: var(--ap-color-text-secondary);
  font-size: var(--ap-text-caption-md-size);
  line-height: var(--ap-text-caption-md-line-height);
}
```

Both colours exist in `tokens.css` today (`--ap-color-surface-sunken`, `--ap-color-interactive-wash-hover`); `custom-properties.test.ts` fails on any that does not.

`app/decisions/page.tsx`, after "The menu takes the top layer…":

```tsx
      <h2 id="no-z-index-tokens">No z-index tokens</h2>
      <Decided on="2026-09-24" />
      <p>
        A z-index scale orders layers that compete on one stack, and nothing here competes. What floats goes to the top
        layer — the Dialog, Drawer, Popover, Tooltip, Select, Combobox, DatePicker, DropdownMenu, PageSize, Toast, the
        SideNav&rsquo;s sheet and, through the Dialog, the CommandPalette: twelve components, no z-index, stacked in the
        order they opened. What stacks inside a component is shut in its own <code>isolation: isolate</code>: the
        Scheduler&rsquo;s sticky head at 3, the Table&rsquo;s header at 1, the thumbs of the SegmentedControl and Tabs.
        A z-index lives only inside a component that isolates, never above 3, and a test holds both. So the page&rsquo;s
        stack is the product&rsquo;s: a sticky bar at <code>z-index: 1</code> sits over everything Alpenglow draws. The
        Scheduler and the Slider did not isolate until this was written, and a product&rsquo;s sticky bar at 1 or 2
        would have had the Scheduler&rsquo;s head scroll over it. A third-party overlay with a high z-index still sits
        under an open <code>&lt;dialog&gt;</code>, which is the behaviour wanted.
      </p>
```

The DocPage keeps an explicit `id` on an `h2` and slugs the rest (`app/ui/DocPage.tsx:41`), so the anchor is `no-z-index-tokens` either way; the explicit one says it is linked to.

`app/ui/contents.ts`: after `{ href: '/density', label: 'Density' },` add `{ href: '/layout', label: 'Breakpoints and layout' },`.

`app/foundations/page.tsx`: after the Density `Card`, a Card in the same shape:

```tsx
        <Card
          href="/layout"
          title="Breakpoints and layout"
          description="Tailwind's five and xs, and a margin and gap that step up at lg and xl."
          visual={
            <div className="miniDensity">
              <span className="miniDensityBar" style={{ height: 24 }} />
              <span className="miniDensityBar" style={{ height: 40 }} />
              <span className="miniDensityBar" style={{ height: 56 }} />
            </div>
          }
        />
```

`app/space/page.tsx`, lines 83–87: replace the sentence that starts "Breakpoints come from content, not devices" with:

```tsx
        against the edge. Breakpoints are a scale of six, and a layout of its own measures
        where its content breaks and rounds to the safe step — see{' '}
        <a href="/layout">Breakpoints and layout</a>.
```

(the site's pages link to each other with a plain `<a href>`, as `app/space/page.tsx:182` does).

- [ ] **Step 4: Run the tests**

Run: `npx vitest run app`
Expected: PASS, `pages.test.tsx` included (it finds `app/layout/page.tsx` by itself).

- [ ] **Step 5: Commit**

```bash
git add app/layout/page.tsx app/layout/page.test.tsx app/decisions/page.tsx app/ui/contents.ts app/foundations/page.tsx app/space/page.tsx app/docs.css
git commit -m "A Breakpoints and layout page under Foundations, and the z-index decision"
```

---

### Task 7: Records, gates and the browser

**Files:**
- Modify: `CHANGELOG.md`, `MEMORY.md`, `docs/superpowers/specs/2026-09-18-completeness-roadmap.md`

- [ ] **Step 1: CHANGELOG**

Under `## Unreleased`, extend the opening paragraph with "and its second, breakpoints and layout", and add:

Under **Added**:

```md
- **Breakpoints** — `xs` 480, `sm` 640, `md` 768, `lg` 1024, `xl` 1280,
  `2xl` 1536: Tailwind's five and one below them, in rem. `breakpoint`,
  `minViewport` (320, the floor the system is tested at) and `media` —
  `media.up.md` is `'(width >= 48rem)'`, `media.down.md` `'(width < 48rem)'`
  — are exported from the root. `--ap-breakpoint-*` in `tokens.css` are for
  JS and reading; a media query cannot read them. The Tailwind theme
  restates the five and adds `xs:`. In Figma, `breakpoint/*` in the Scale
  collection.
- **Layout margin and gap** — `layout/margin` 16 / 24 / 40 and `layout/gap`
  16 / 20 / 20, stepping up at `lg` and `xl` inside `tokens.css`, so
  `var(--ap-layout-margin)` needs no query of its own. `px-layout-margin`
  and `gap-layout-gap` in Tailwind. In Figma, a fifth collection,
  `Alpenglow Layout`, modes Narrow, Medium and Wide. `layout` and
  `layoutModes` are exported from the root.
- **A Breakpoints and layout page** under Foundations, and the decision to
  ship no z-index tokens on Decisions.
```

Under **Changed** (create the heading after Added if Unreleased has none):

```md
- **The SideNav turns at 768**, `media.down.md`, not 760: from 761 to 767
  it is now the sheet.
- **The Toast and the CommandPalette take their phone layout below 480**,
  not at 480 and below.
- **The TopBar pads its sides by `layout/margin`**: 16 below 1024, 24 to
  1279, 40 from 1280, where it was 24 at every width.
- **The Scheduler, the Table and the Slider isolate** (`isolation:
  isolate`): their z-indexes stay inside them, so a product's sticky bar at
  `z-index: 1` sits over the Scheduler's head. Nothing else changes.
```

- [ ] **Step 2: MEMORY.md and the roadmap**

`MEMORY.md`: claim the piece where the dense screen's claim is (built 2026-09-24 on `breakpoints-and-layout`, not yet on main); add two invariants after the last numbered one — "No width in a media query outside the breakpoint scale (`src/styles/breakpoints.test.ts`)" and "No z-index in `src/components/` outside a module that isolates, none above 3 (`src/components/layering.test.ts`)"; in the Architecture table, a breakpoints and layout row; in the Figma to-apply list, `breakpoint/*` in Scale, the `Alpenglow Layout` collection and the `Alpenglow / 12 columns` grid style; replace the "760px until breakpoints" mentions (lines near 364, 653, 940, 1668, 1732 — search for `760`, `1496`, `1440`, `1160`) with the scale's names, keeping the history they record. Add under the package gaps: "The Table's columns giving way as its space shrinks — its own spec, next; at `xl` with the SideNav expanded the screen's Table has about 260."

Roadmap, wave 4's **Breakpoints and layout** row: "built 2026-09-24 on `breakpoints-and-layout`, unreleased", with what moved up: the Table's responsive columns, next.

- [ ] **Step 3: The gates**

Run: `npm run check`
Expected: typecheck, lint and every test pass.

Run: `npm run build:docs`
Expected: the static export builds, `/layout/` included.

- [ ] **Step 4: The browser**

Start the site with `preview_start` (the `.claude/launch.json` entry the dense screen used) and check, reporting each with a screenshot or a measured value:

- The site at 375, 768, 1024, 1280, 1440 and 1536: the narrow bar below 768 and the rail at 768; the drawer overlaying at 1440 and 1500 and in the flow at 1536; the evidence column absent at 1279 and present at 1280; the page margin 16 / 24 / 40 (`getComputedStyle(document.querySelector('.page')).paddingLeft`).
- 320: `document.documentElement.scrollWidth === 320` on `/date-picker` and `/layout`.
- `/screen` at each frame width: the SideNav a sheet at 375 and 768, the rail at 1024, expanded at 1440; margins and the TopBar's padding equal; no sideways scroll in the Scheduler at 768.
- The layering: on `/scheduler`, inject `document.body.insertAdjacentHTML('afterbegin', '<div style="position:sticky;top:0;z-index:1;height:40px;background:red"></div>')` and scroll the week: the Scheduler's head passes under the bar.
- The `/layout` page in light and dark.

- [ ] **Step 5: Commit**

```bash
git add CHANGELOG.md MEMORY.md docs/superpowers/specs/2026-09-18-completeness-roadmap.md
git commit -m "Breakpoints and layout: the changelog, MEMORY.md and the roadmap"
```
