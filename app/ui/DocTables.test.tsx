import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { ComponentType } from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { readCss } from '@/test/css';
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
  'dropdown-menu',
  'elevation',
  'icons',
  'install',
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
