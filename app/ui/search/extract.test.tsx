import { resolve } from 'node:path';
import type { ComponentType } from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, beforeAll, vi } from 'vitest';
import { theme } from '@/tokens/theme';
import { NAV, PAGES, neighbours } from '../contents';
import { buildIndex, pageFile, type Loader } from './extract';
import { tokenId } from '../slug';
import type { Index } from './index';

// The renderer sets the route before each page, and the page's Pager reads it
// back through this stub. The mock hands `next/navigation` the very same
// module, so both sides see one `pathname`.
vi.mock('next/navigation', async () => await import('./navigation-stub'));

// jsdom has no matchMedia; a page's specimens may ask it (as pages.test.tsx stubs it).
window.matchMedia = (query: string) =>
  ({ matches: false, media: query, addEventListener: () => {}, removeEventListener: () => {} }) as unknown as MediaQueryList;

const load: Loader = (file) => import(/* @vite-ignore */ resolve(file));

let index: Index;
beforeAll(async () => {
  index = await buildIndex(load);
});

describe('buildIndex', () => {
  it('names the page files by route', () => {
    expect(pageFile('/')).toBe('app/page.tsx');
    expect(pageFile('/button')).toBe('app/button/page.tsx');
  });

  it('yields one page entry per page, titled by its nav label', () => {
    const pages = index.entries.filter((e) => e.kind === 'page');
    expect(pages.map((e) => [e.href, e.title])).toEqual(PAGES.map((p) => [p.href, p.label]));
  });

  it('yields a section entry for every h2 the page anchors, with the same id', async () => {
    for (const page of PAGES) {
      const { default: Page }: { default: ComponentType } = await load(pageFile(page.href));
      const { container, unmount } = render(<Page />);
      const ids = [...container.querySelectorAll('article > h2[id]')].map((h) => h.id);
      const sections = index.entries.filter((e) => e.kind === 'section' && e.href.startsWith(`${page.href}#`));
      expect(sections.map((e) => e.href.split('#')[1]), page.href).toEqual(ids);
      unmount();
    }
  });

  it('puts the section and the page label on every entry', () => {
    for (const e of index.entries) {
      expect(NAV.map((g) => g.title), e.href).toContain(e.section);
      expect(PAGES.map((p) => p.label), e.href).toContain(e.page);
    }
  });

  it('indexes the body of a section, and the intro of a page', () => {
    const install = index.entries.find((e) => e.kind === 'section' && e.href === '/install#install-the-package');
    expect(install?.body).toMatch(/npm/);
    const button = index.entries.find((e) => e.kind === 'page' && e.href === '/button');
    expect(button?.body).toMatch(/Three variants, five tones, three sizes/);
  });

  it('keeps a space between neighbouring elements', () => {
    // textContent would give "DevelopersThe package": the home's section
    // cards are a title and a blurb in separate elements.
    const home = index.entries.find((e) => e.kind === 'section' && e.href === '/#the-sections');
    expect(home?.body).toContain('Developers The package');
    expect(home?.body).not.toMatch(/DevelopersThe/);
  });

  it('leaves the pager out', () => {
    // The pager reads "Previous <label>" and "Next <label>" at the foot of the
    // article; a Calendar's "Previous month" button in a specimen is the
    // page's own text and stays.
    for (const page of PAGES) {
      const { previous, next } = neighbours(page.href);
      const bodies = index.entries.filter((e) => e.page === page.label).map((e) => e.body);
      for (const body of bodies) {
        if (previous) expect(body, page.href).not.toContain(`Previous ${previous.label}`);
        if (next) expect(body, page.href).not.toContain(`Next ${next.label}`);
      }
    }
  });

  it('yields every theme token, landing on its row on the Colour page', async () => {
    const tokens = index.entries.filter((e) => e.kind === 'token');
    expect(tokens.map((e) => e.title)).toEqual(Object.keys(theme));
    const { default: Colour }: { default: ComponentType } = await load(pageFile('/colour'));
    const { container } = render(<Colour />);
    for (const t of tokens) {
      expect(t.href.startsWith('/colour#')).toBe(true);
      expect(container.querySelector(`#${t.href.split('#')[1]}`), t.title).not.toBeNull();
      expect(t.href).toBe(`/colour#${tokenId(t.title)}`);
      expect(t.body).toBe(theme[t.title as keyof typeof theme].use);
      expect(t.page).toBe('Colour');
    }
  });

  it('yields a prop entry per row of a Props table', () => {
    const props = index.entries.filter((e) => e.kind === 'prop' && e.page === 'Button');
    expect(props.map((e) => e.title)).toEqual(['variant', 'tone', 'size', 'loading', 'iconStart', 'iconEnd', 'fullWidth', 'href', 'render']);
    expect(props[0]?.href).toBe('/button#props');
    expect(props[0]?.body).toContain("'solid' | 'outline' | 'ghost'");
    // Pages with no Props heading yield none — Avatar and Badge today.
    expect(index.entries.filter((e) => e.kind === 'prop' && e.page === 'Badge')).toEqual([]);
  });

  it('numbers the entries in reading order, and names every one', () => {
    index.entries.forEach((e, i) => {
      expect(e.order, e.href).toBe(i);
      expect(e.title.trim(), e.href).not.toBe('');
    });
    const pages = index.entries.filter((e) => e.kind === 'page').map((e) => e.order);
    expect(pages).toEqual([...pages].sort((a, b) => a - b));
  });

  it('keeps every page under 25 KB, so a specimen that starts dumping data is noticed', () => {
    // Per page, not in total: the total was capped at 200 KB and the fourteenth
    // component crossed it with a page of 5.6 KB. The roadmap adds a page per
    // component, so a total only says the site grew. The largest page today
    // is /colour, at 21 KB.
    const bytes = new Map<string, number>();
    for (const entry of index.entries) {
      const page = entry.href.split('#')[0]!;
      bytes.set(page, (bytes.get(page) ?? 0) + JSON.stringify(entry).length);
    }
    expect([...bytes].filter(([, size]) => size >= 25_000)).toEqual([]);
  });

  it('and the whole index under 400 KB, which is what the browser fetches', () => {
    // 206 KB at fourteen components. Raised on purpose when it is reached,
    // with the new figure written here, or the index is split by section.
    expect(JSON.stringify(index).length).toBeLessThan(400_000);
  });
});
