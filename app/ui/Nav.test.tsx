import { readFileSync } from 'node:fs';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
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
}));

type Listener = (event: MediaQueryListEvent) => void;

/**
 * jsdom has no `matchMedia`. The component asks whether the viewport is
 * narrow, and has to hear when it stops being so.
 */
function stubViewport(narrow: boolean) {
  const listeners = new Set<Listener>();
  let matches = narrow;

  window.matchMedia = ((query: string) => ({
    media: query,
    get matches() {
      return matches;
    },
    onchange: null,
    addEventListener: (_type: 'change', listener: Listener) => void listeners.add(listener),
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
 * The covering itself lives in the stylesheet, under the narrow media query.
 * These read it the way `ThemeToggle.test.tsx` does.
 */
describe('the nav stylesheet', () => {
  const css = readFileSync('app/docs.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

  function block(header: string) {
    const start = css.indexOf(header);
    expect(start, header).toBeGreaterThan(-1);
    const open = css.indexOf('{', start);
    let depth = 0;
    for (let i = open; i < css.length; i++) {
      if (css[i] === '{') depth++;
      else if (css[i] === '}' && --depth === 0) return css.slice(open + 1, i);
    }
    throw new Error(`unterminated block: ${header}`);
  }

  const declarations = (text: string, selector: string) => {
    const match = text.match(new RegExp(`${selector.replace(/[.[\]()*+?]/g, '\\$&')}\\s*\\{([^}]*)\\}`));
    expect(match, selector).toBeTruthy();
    return match![1]!.replace(/\s+/g, ' ').trim();
  };

  // The component and the stylesheet must agree on where narrow begins.
  const narrow = block(`@media ${NARROW}`);

  it('fixes the open menu over the whole viewport', () => {
    const open = declarations(narrow, ".sidebar[data-open='true']");
    expect(open).toMatch(/position: fixed/);
    expect(open).toMatch(/inset: 0/);
    expect(open).toMatch(/overflow-y: auto/);
  });

  it('hides the sections only while closed', () => {
    expect(declarations(narrow, ".sidebar[data-open='false'] .navSections")).toMatch(/display: none/);
  });

  it('stops the document scrolling under the open menu', () => {
    expect(declarations(css, 'html[data-nav-open]')).toMatch(/overflow: hidden/);
  });
});
