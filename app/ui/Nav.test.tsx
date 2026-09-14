import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { block, readCss } from '@/test/css';
import { spacing } from '@/tokens/scale';
import { NAV } from './contents';
import { Nav, NARROW } from './Nav';

/**
 * On a narrow screen the menu is an overlay that takes the whole viewport.
 * The stylesheet does the covering; what the component owns is everything the
 * stylesheet cannot: the page behind must stop scrolling and stop taking
 * focus, Esc must close, and following a link must close. None of that shows
 * in a snapshot, so each is asserted here.
 */

let pathname = '/';

vi.mock('next/navigation', () => ({
  usePathname: () => pathname,
  // The search in the drawer follows a chosen row through the router.
  useRouter: () => ({ push: () => {} }),
}));

type Listener = (event: MediaQueryListEvent) => void;

/**
 * jsdom has no `matchMedia`. The component asks whether the viewport is
 * narrow, and has to hear when it stops being so. Only the narrow query's
 * listeners are counted: the theme toggle inside the nav asks about the
 * colour scheme through the same function, and its listener is its own.
 */
function stubViewport(narrow: boolean) {
  const listeners = new Set<Listener>();
  let matches = narrow;

  window.matchMedia = ((query: string) => ({
    media: query,
    get matches() {
      return query === NARROW && matches;
    },
    onchange: null,
    addEventListener: (_type: 'change', listener: Listener) => {
      if (query === NARROW) listeners.add(listener);
    },
    removeEventListener: (_type: 'change', listener: Listener) => void listeners.delete(listener),
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;

  return {
    widen() {
      matches = false;
      act(() => {
        for (const listener of [...listeners]) listener({ matches: false } as MediaQueryListEvent);
      });
    },
    get listening() {
      return listeners.size;
    },
  };
}

const realMatchMedia = window.matchMedia;

/** The shell: the nav and, beside it, the page it covers when open. */
function renderShell() {
  const view = render(
    <div>
      <Nav />
      <main>page</main>
    </div>,
  );
  return { ...view, page: screen.getByRole('main') };
}

const nav = () => screen.getByRole('navigation', { name: 'Documentation' });
const toggle = () => screen.getByRole('button', { expanded: false });

beforeEach(() => {
  pathname = '/';
  stubViewport(true);
});

afterEach(() => {
  window.matchMedia = realMatchMedia;
  document.documentElement.removeAttribute('data-nav-open');
});

describe('Nav', () => {
  it('starts closed, with the toggle naming the current page', () => {
    pathname = '/button';
    renderShell();
    expect(nav()).toHaveAttribute('data-open', 'false');
    expect(screen.getByRole('button', { name: 'Button' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens on the toggle, and the toggle becomes the way to close', async () => {
    renderShell();
    await userEvent.click(toggle());

    expect(nav()).toHaveAttribute('data-open', 'true');
    expect(screen.getByRole('button', { name: 'Close' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('locks the document while open, and unlocks it when closed', async () => {
    // The overlay is fixed, so without this the page underneath would keep
    // scrolling under a finger that meant to scroll the menu.
    renderShell();
    expect(document.documentElement).not.toHaveAttribute('data-nav-open');

    await userEvent.click(toggle());
    expect(document.documentElement).toHaveAttribute('data-nav-open');

    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(document.documentElement).not.toHaveAttribute('data-nav-open');
  });

  it('makes the page beside it inert while open', async () => {
    // Covered is not the same as gone: Tab would still walk into the page
    // under the overlay. `inert` is what keeps focus, and screen readers, on
    // the menu the viewer opened.
    const { page } = renderShell();
    expect(page).not.toHaveAttribute('inert');

    await userEvent.click(toggle());
    expect(page).toHaveAttribute('inert');
    expect(nav()).not.toHaveAttribute('inert');

    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(page).not.toHaveAttribute('inert');
  });

  it('closes on Escape', async () => {
    renderShell();
    await userEvent.click(toggle());
    expect(nav()).toHaveAttribute('data-open', 'true');

    await userEvent.keyboard('{Escape}');
    expect(nav()).toHaveAttribute('data-open', 'false');
    expect(document.documentElement).not.toHaveAttribute('data-nav-open');
  });

  it('closes when the route changes', async () => {
    // Following a link has to close the menu. Leaving it open would bury the
    // page the reader just asked for under the list they used to get there.
    const { rerender } = renderShell();
    await userEvent.click(toggle());
    expect(nav()).toHaveAttribute('data-open', 'true');

    pathname = '/colour';
    rerender(
      <div>
        <Nav />
        <main>page</main>
      </div>,
    );
    expect(nav()).toHaveAttribute('data-open', 'false');
    expect(document.documentElement).not.toHaveAttribute('data-nav-open');
  });

  it('stays closed when the reader comes back to the page it was opened on', async () => {
    // Follow a link out of the open menu, then press Back. Deriving `open`
    // from the page the menu was opened on closes it on the way out and opens
    // it again on the way back, over the page the reader returned to.
    const shell = () => (
      <div>
        <Nav />
        <main>page</main>
      </div>
    );
    const { rerender } = renderShell();
    await userEvent.click(toggle());

    pathname = '/colour';
    rerender(shell());
    pathname = '/';
    rerender(shell());

    expect(nav()).toHaveAttribute('data-open', 'false');
    expect(document.documentElement).not.toHaveAttribute('data-nav-open');
  });

  it('closes when the viewport widens past the breakpoint', async () => {
    // Wide screens show the sidebar whatever `open` says, so the lock and the
    // inert page would outlive the overlay they were there for. Closing is
    // what keeps the two in step; the listener exists only while open.
    const viewport = stubViewport(true);
    const { page } = renderShell();
    expect(viewport.listening).toBe(0);

    await userEvent.click(toggle());
    expect(viewport.listening).toBe(1);

    viewport.widen();
    expect(nav()).toHaveAttribute('data-open', 'false');
    expect(document.documentElement).not.toHaveAttribute('data-nav-open');
    expect(page).not.toHaveAttribute('inert');
    expect(viewport.listening).toBe(0);
  });

  it('releases the lock and the page when unmounted while open', async () => {
    const { page, unmount } = renderShell();
    await userEvent.click(toggle());

    unmount();
    expect(document.documentElement).not.toHaveAttribute('data-nav-open');
    expect(page).not.toHaveAttribute('inert');
  });
});

/**
 * On a wide screen the nav is two bars: the rail names the sections and
 * marks the one the reader is in, the drawer lists that section's pages with
 * the section's own page first. The narrow overlay lists everything.
 */
describe('the rail and the drawer', () => {
  const rail = () => within(screen.getByRole('list', { name: 'Sections' }));

  it('marks the section the page is in, in the rail', () => {
    pathname = '/button';
    renderShell();
    expect(rail().getByRole('link', { name: 'Components' })).toHaveAttribute('aria-current', 'location');
    expect(rail().getByRole('link', { name: 'Foundations' })).not.toHaveAttribute('aria-current');
  });

  it("marks a section's own page as the page", () => {
    pathname = '/components';
    renderShell();
    expect(rail().getByRole('link', { name: 'Components' })).toHaveAttribute('aria-current', 'page');
  });

  it('lists the pages of the current section in the drawer, its own page first', () => {
    pathname = '/colour';
    renderShell();
    const foundations = NAV.find((group) => group.title === 'Foundations')!;
    const drawer = within(screen.getByRole('list', { name: 'Foundations' }));
    expect(drawer.getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual([
      foundations.href,
      ...foundations.items.map((item) => item.href),
    ]);
    expect(drawer.getByRole('link', { name: 'Overview' })).not.toHaveAttribute('aria-current');
    expect(drawer.getByRole('link', { name: 'Colour' })).toHaveAttribute('aria-current', 'page');
  });

  it('draws the brand alone on a route no section lists', () => {
    // A wrong section beside a page is worse than no section.
    pathname = '/nowhere';
    const { container } = renderShell();
    expect(container.querySelector('.drawerNav')).toBeNull();
    expect(rail().queryAllByRole('link', { current: 'page' })).toEqual([]);
    expect(rail().queryAllByRole('link', { current: 'location' })).toEqual([]);
  });

  it('links every section and page from the open menu, the title being the section link', () => {
    pathname = '/colour';
    renderShell();
    const sections = within(document.getElementById('nav-sections')!);
    for (const group of NAV) {
      expect(sections.getByRole('link', { name: group.title })).toHaveAttribute('href', group.href);
      for (const item of group.items) {
        expect(sections.getByRole('link', { name: item.label })).toHaveAttribute('href', item.href);
      }
    }
    expect(sections.getByRole('link', { name: 'Foundations' })).toHaveAttribute('aria-current', 'location');
  });
});

/**
 * The covering itself lives in the stylesheet, under the narrow media query.
 * These read it the way `ThemeToggle.test.tsx` does.
 */
describe('the nav stylesheet', () => {
  const css = readCss('app/docs.css');

  const declarations = (text: string, selector: string) => {
    const match = text.match(new RegExp(`${selector.replace(/[.[\]()*+?]/g, '\\$&')}\\s*\\{([^}]*)\\}`));
    expect(match, selector).toBeTruthy();
    return match![1]!.replace(/\s+/g, ' ').trim();
  };

  // The component and the stylesheet must agree on where narrow begins.
  const narrow = block(css, `@media ${NARROW}`);

  it('fixes the open menu over the whole viewport', () => {
    const open = declarations(narrow, ".sidebar[data-open='true']");
    expect(open).toMatch(/position: fixed/);
    expect(open).toMatch(/inset: 0/);
    expect(open).toMatch(/overflow-y: auto/);
  });

  it('hides the sections only while closed', () => {
    expect(declarations(narrow, ".sidebar[data-open='false'] .navSections")).toMatch(/display: none/);
  });

  it('keeps the theme toggle inside the open menu, not in the bar', () => {
    // At 320px the bar holds the brand and the page's name and nothing else;
    // the toggle is one tap away, under the sections.
    expect(declarations(narrow, ".sidebar[data-open='false'] .sidebarTheme")).toMatch(/display: none/);
  });

  it('stops the document scrolling under the open menu', () => {
    expect(declarations(css, 'html[data-nav-open]')).toMatch(/overflow: hidden/);
  });

  it("gives the open menu's section links the page links' padding", () => {
    // A caption alone is a 16px target; padded like a page link it is 32.
    expect(rulesOf('.navTitleLink')).toMatch(/padding: var\(--ap-spacing-100\)/);
  });

  it('dissolves both bars into the narrow bar, keeping the brand and the toggle', () => {
    // `display: contents` hands the rail's and the drawer's children to the
    // bar's grid; their lists go, because the open menu lists everything.
    const shared = (a: string, b: string) =>
      narrow.match(new RegExp(`\\${a},\\s*\\${b}\\s*\\{([^}]*)\\}`))?.[1] ?? '';
    expect(shared('.rail', '.drawer')).toMatch(/display: contents/);
    expect(shared('.railList', '.drawerNav')).toMatch(/display: none/);
  });

  /** Every rule for `selector` alone, joined — a selector that shares a rule and has one of its own. */
  const rulesOf = (selector: string) =>
    [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
      .filter(([, selectors]) => selectors!.split(',').some((s) => s.trim() === selector))
      .map(([, , body]) => body!.replace(/\s+/g, ' ').trim())
      .join(' ');

  const px = (text: string, property: string) => Number(text.match(new RegExp(`${property}: (\\d+)px`))?.[1]);
  const step = (text: string) => spacing[Number(text.match(/--ap-spacing-(\d+)/)?.[1]) as keyof typeof spacing];

  it('puts the wide breakpoint where the prose still holds a Table specimen beside the list', () => {
    // The breakpoint is a literal because a media query cannot read a custom
    // property, so it is checked against the numbers it is made of: the two
    // bars, the page's padding, the list, the evidence, the three gaps and
    // the spacer's minimum leave the 704 a Table specimen needs — 654 of
    // table plus the specimen's padding and hairlines on both sides.
    const wide = Number(css.match(/@media \(min-width: (\d+)px\)/)?.[1]);
    const page = block(css, `@media (min-width: ${wide}px)`);
    const columns = page.match(/\.page\s*\{[^}]*grid-template-columns: ([^;]+);/)![1]!;
    const [list, , spacer, evidence] = columns.split(/\s+(?![^(]*\))/);
    const gap = step(page.match(/column-gap: ([^;]+);/)![1]!);
    const padding = step(rulesOf('.page').match(/padding: \S+ (\S+)/)![1]!);

    const chrome = px(rulesOf('.rail'), 'width') + px(rulesOf('.drawer'), 'width') + 2 * padding;
    const beside = Number(list!.replace('px', '')) + Number(evidence!.replace('px', '')) + 3 * gap + step(spacer!);
    expect(wide - chrome - beside).toBe(704);
  });
});

describe('search', () => {
  it('heads the rail, above the sections, as a rail item', () => {
    stubViewport(false);
    renderShell();
    const rail = document.querySelector('.rail') as HTMLElement;
    const button = within(rail).getByRole('button', { name: 'Search' });
    // Before the sections' list; the palette's dialog sits between the two.
    const list = within(rail).getByRole('list', { name: 'Sections' });
    expect(button.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(button).toHaveClass('railLink');
    expect(button.querySelector('.railPill')).not.toBeNull();
  });

  it('takes a row of the narrow bar and hides with the sections while the menu is closed', () => {
    // The rail is `display: contents` below the breakpoint, so the same
    // button is placed by the bar's grid. At 320px the bar holds the brand
    // and the page's name with 2px to spare (the theme toggle's comment), so
    // it is a row of the open menu, not an icon in the bar.
    const narrow = block(readCss('app/docs.css'), `@media ${NARROW}`);
    expect(narrow).toMatch(/grid-template-areas:[^;]*'search search'/);
    expect(narrow).toMatch(/\.railSearch\s*\{[^}]*grid-area: search/);
    expect(narrow).toMatch(/\.sidebar\[data-open='false'\]\s+\.railSearch\s*\{[^}]*display: none/);
  });
});
