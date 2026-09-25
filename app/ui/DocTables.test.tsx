import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { ComponentType } from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { readCss, block } from '@/test/css';
import { layout } from '@/tokens/layout';
import { minViewport } from '@/tokens/scale';

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: () => {} }),
  useSearchParams: () => new URLSearchParams(),
}));

// jsdom has no matchMedia; a page's specimens may ask it (as pages.test.tsx stubs it).
window.matchMedia = (query: string) =>
  ({ matches: false, media: query, addEventListener: () => {}, removeEventListener: () => {} }) as unknown as MediaQueryList;

/**
 * The docs' own reference tables — tokens, ratios, keys, imports — were
 * plain `<table className="tokens">` in a `.tableScroll` box: at a phone's
 * width they scrolled sideways with no cue and showed a name and half a hex.
 * Each is now the package Table, whose columns leave by rank, the least
 * important first, as Asana's list does.
 */
const PAGES = [
  'accessibility',
  'badge',
  'colour',
  'dark-mode',
  'data-vis',
  'density',
  'dropdown-menu',
  'elevation',
  'icons',
  'install',
  'layout',
] as const;

/**
 * The Table's width on the narrowest screen: below `xs` a specimen bleeds
 * edge to edge and pads by the page's margin, so the Table has the viewport
 * less the narrow margin on each side.
 */
const NARROWEST = minViewport - 2 * layout.margin.narrow;

/** Which columns a Table shows at `width`, read from the rules it writes for its own container. */
function shownAt(table: Element, width: number) {
  const css = table.querySelector('style')?.textContent ?? '';
  const hidden = new Set(
    [...css.matchAll(/@container \(width < (\d+)px\) \{([^]*?)\n\}/g)]
      .filter(([, below]) => width < Number(below))
      .flatMap(([, , rules]) => [...rules!.matchAll(/\[data-col="([^"]+)"\] \{ display: none; \}/g)].map((m) => m[1]!)),
  );
  const keys = [...table.querySelectorAll('th[data-col]')].map((th) => th.getAttribute('data-col')!);
  const floor = Number(css.match(/table \{ min-width: (\d+)px; \}/)?.[1]);
  return { shown: keys.filter((key) => !hidden.has(key)), keys, floor };
}

describe.each(PAGES)('the tables on /%s', (page) => {
  const load = async () => {
    const { default: Page }: { default: ComponentType } = await import(/* @vite-ignore */ resolve(`app/${page}/page.tsx`));
    return render(<Page />).container;
  };

  it('are every one the package Table, with nothing left of the old token table', async () => {
    const container = await load();
    expect(container.querySelectorAll('table.tokens')).toHaveLength(0);
    expect(container.querySelectorAll('.tableScroll')).toHaveLength(0);
    const tables = [...container.querySelectorAll('table')];
    expect(tables.length).toBeGreaterThan(0);
    for (const table of tables) expect(table.closest('[data-table]'), table.textContent ?? '').not.toBeNull();
  });

  it('keep their primary column and at least one value column on the narrowest screen, without scrolling', async () => {
    const container = await load();
    for (const table of container.querySelectorAll('[data-table]')) {
      const name = table.querySelector('caption')?.textContent;
      const primary = table.querySelector('th[data-primary]')?.getAttribute('data-col');
      expect(primary, `${name} names its row`).toBeTruthy();
      const { shown, floor } = shownAt(table, NARROWEST);
      expect(shown, `${name} keeps its primary`).toContain(primary);
      expect(shown.length, `${name} keeps a value beside it`).toBeGreaterThan(1);
      // The floor is what never leaves; past it the region would scroll.
      expect(floor + 2, `${name} fits`).toBeLessThanOrEqual(NARROWEST);
    }
  });
});

/**
 * A header keeps to one line and truncates (the Table's own rule), so its
 * column's minimum has to hold it: while a flexible column shows, its share
 * never falls below its minimum. /layout's "Narrow (below lg, 1024)" sat in
 * a 96 column and read "NARROW (BEL…" at every width. The widths are measured
 * in Chrome on the built site, each line as the header cell sets it —
 * caption/sm, semibold, uppercase — because jsdom lays nothing out. A header
 * line missing from the list fails, so a new or renamed one is measured
 * before it ships.
 */
const HEADER_WIDTH: Record<string, number> = {
  // /layout
  Name: 36.4,
  rem: 26.4,
  px: 16.6,
  'What turns there': 126.1,
  Token: 42.1,
  Narrow: 55.0,
  '(below lg, 1024)': 109.3,
  Medium: 50.8,
  '(from lg, 1024)': 101.5,
  Wide: 32.1,
  '(from xl, 1280)': 101.3,
  Where: 43.9,
  // /density
  Comfortable: 92.0,
  Compact: 61.5,
  'Read by': 53.3,
  Client: 44.5,
  Appointment: 90.5,
};

/** Each column's minimum, read back from the rules the Table writes: the primary's is the table's own floor. */
function minimums(table: Element) {
  const base = (table.querySelector('style')?.textContent ?? '').split('@container')[0]!;
  const out = new Map<string, number>();
  const primary = table.querySelector('th[data-primary]')?.getAttribute('data-col');
  if (primary) out.set(primary, Number(base.match(/table \{ min-width: (\d+)px; \}/)?.[1]));
  for (const [, key, min] of base.matchAll(/th\[data-col="([^"]+)"\] \{ width: calc\(\(100cqi - \d+px\) \* (\d+) \/ \d+\); \}/g)) {
    out.set(key!, Number(min));
  }
  for (const [, key, width] of base.matchAll(/th\[data-col="([^"]+)"\] \{ width: (\d+)px; \}/g)) out.set(key!, Number(width));
  return out;
}

describe.each(['layout', 'density'] as const)('the headers on /%s', (page) => {
  it('each fit their column’s minimum, line by line, with the cell’s padding', async () => {
    const { default: Page }: { default: ComponentType } = await import(/* @vite-ignore */ resolve(`app/${page}/page.tsx`));
    const { container } = render(<Page />);
    const tables = [...container.querySelectorAll('[data-table]')];
    expect(tables.length).toBeGreaterThan(0);
    for (const table of tables) {
      const name = table.querySelector('caption')?.textContent;
      // Compact pads a cell 12 a side; comfortable, and a table that follows
      // data-density, up to 16.
      const padding = /compact/.test(table.className) ? 24 : 32;
      const min = minimums(table);
      for (const th of table.querySelectorAll('th[data-col]')) {
        const key = th.getAttribute('data-col')!;
        const lines = th.innerHTML
          .split(/<br\s*\/?>/)
          .map((line) => line.replace(/<[^>]+>/g, '').trim())
          .filter(Boolean);
        for (const line of lines) {
          expect(HEADER_WIDTH[line], `${name}: "${line}" is measured`).toBeDefined();
          expect(min.get(key), `${name}: ${key} holds "${line}"`).toBeGreaterThanOrEqual(Math.ceil(HEADER_WIDTH[line]!) + padding);
        }
      }
    }
  });
});

/**
 * A Table cell breaks a word it cannot hold anywhere (`overflow-wrap:
 * anywhere`), so on a phone a Props table's type column read
 * "DropdownMenuTrigge/rProps" and "DatePickerIn/validReason". The type is
 * offered a break at each hump of its names instead, where the halves are
 * still words — `Dropdown<wbr>Menu<wbr>Trigger<wbr>Props` — and each half
 * fits the column at 320. The search joins across a `<wbr>`, so a name is
 * still one word to it.
 *
 * Offered as they are, humps are breaks like any other, and a line takes the
 * last one that fits: at 1440 the name that used to move whole to its own
 * line split as "(props: DropdownMenuTrigger / Props)". So each word with a
 * hump is an inline block: it moves to the next line whole, as a word does,
 * and breaks at its humps only when it is wider than the column.
 */
describe.each(['dropdown-menu', 'date-picker'] as const)('the Props tables on /%s', (page) => {
  it('offer a type a break at every hump of its names, and at nothing else', async () => {
    const { default: Page }: { default: ComponentType } = await import(/* @vite-ignore */ resolve(`app/${page}/page.tsx`));
    const { container } = render(<Page />);
    const cells = [...container.querySelectorAll('[data-table]')]
      .filter((table) => /props$/i.test(table.querySelector('caption')?.textContent ?? ''))
      .flatMap((table) => [...table.querySelectorAll('td[data-col="type"]')]);
    expect(cells.length).toBeGreaterThan(0);
    let offered = 0;
    for (const cell of cells) {
      const html = cell.innerHTML.replace(/<(?!wbr)[^>]*>/g, '');
      // A lower-case letter or digit then a capital, or a capital run then a
      // word, with no break between them, is a hump left closed.
      expect(html, cell.textContent ?? '').not.toMatch(/[a-z0-9][A-Z]|[A-Z][A-Z][a-z]/);
      // A break sits only at a hump or after a dot.
      for (const [, before, after] of html.matchAll(/(.)<wbr>(.)/g)) {
        expect(`${before}|${after}`).toMatch(/^([a-z0-9]\|[A-Z]|[A-Z]\|[A-Z]|\.\|[A-Za-z_])$/);
        offered++;
      }
      // Every break is inside a word's own block, and a block is one word.
      for (const wbr of cell.querySelectorAll('wbr')) expect(wbr.parentElement).toHaveClass('typeName');
      for (const word of cell.querySelectorAll('.typeName')) expect(word.textContent).not.toMatch(/\s/);
    }
    expect(offered).toBeGreaterThan(0);
    expect(block(readCss('app/docs.css'), '.typeName {')).toMatch(/display: inline-block/);
  });
});

describe('the docs stylesheet', () => {
  const css = readCss('app/docs.css');

  it('has no sideways box for a table, and no rules for the old token table', () => {
    expect(css).not.toMatch(/\.tableScroll\b/);
    expect(css).not.toMatch(/\.tokens\b/);
    // Nor a page that still asks for the box: the class would name nothing.
    const pages = readdirSync('app', { recursive: true, encoding: 'utf8' }).filter((f) => f.endsWith('.tsx') && !f.endsWith('.test.tsx'));
    expect(pages.filter((f) => /\btableScroll\b/.test(readFileSync(join('app', f), 'utf8')))).toEqual([]);
  });

  it('lets a token’s use line wrap: only the name stays on one line', () => {
    // A 110-character use line held to one line made /colour's tables 1119
    // wide in an 852 column. The line is an `.alias`; nothing holds it.
    const aliasRules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(([, selectors]) =>
      selectors!.split(',').some((s) => /\.alias\b/.test(s)),
    );
    expect(aliasRules.length).toBeGreaterThan(0);
    for (const [, selectors, body] of aliasRules) expect(body, selectors!.trim()).not.toMatch(/nowrap/);
  });
});
