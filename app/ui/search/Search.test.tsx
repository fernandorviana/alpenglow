import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { installDialogStub } from '@/test/dialog';
import { axeViolations } from '@/test/axe';
import { PAGES, SUGGESTED } from '../contents';
import { RECENT_KEY } from './recent';
import type { Index } from './index';
import { Search } from './Search';

installDialogStub();

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }), usePathname: () => '/' }));

/** A small index with one of each kind, and a body-only hit. */
const fixture: Index = {
  entries: [
    { kind: 'page', href: '/button', title: 'Button', section: 'Components', page: 'Button', body: 'Three variants', order: 0 },
    { kind: 'section', href: '/button#states', title: 'States', section: 'Components', page: 'Button', body: 'hover, pressed, loading and disabled', order: 1 },
    { kind: 'prop', href: '/button#props', title: 'loading', section: 'Components', page: 'Button', body: 'boolean false', order: 2 },
    { kind: 'page', href: '/install', title: 'Install', section: 'Developers', page: 'Install', body: 'npm install alpenglow', order: 3 },
    { kind: 'token', href: '/colour#surface-raised', title: 'surface/raised', section: 'Foundations', page: 'Colour', body: 'Cards', order: 4 },
    { kind: 'section', href: '/develop#in-this-section', title: 'In this section', section: 'Developers', page: 'Developers', body: 'the pages', order: 5 },
  ],
};

let index: Promise<Index>;
vi.mock('./load', () => ({ loadIndex: () => index }));

beforeEach(() => {
  index = Promise.resolve(fixture);
  push.mockReset();
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
});
afterEach(() => {
  vi.restoreAllMocks();
  delete (navigator as { platform?: string }).platform;
});

const flush = () => act(() => new Promise((r) => setTimeout(r, 0)));

async function open() {
  const user = userEvent.setup();
  render(<Search />);
  await user.click(screen.getByRole('button', { name: /search/i }));
  await flush();
  return { user, field: screen.getByRole('combobox', { name: /search/i }) };
}

describe('the button', () => {
  it('opens the palette and focuses the field', async () => {
    const { field } = await open();
    expect(screen.getByRole('dialog', { name: 'Search' })).toBeInTheDocument();
    expect(field).toHaveFocus();
  });

  it('shows the shortcut hint only after hydration, for the platform', async () => {
    // The server HTML cannot know the platform; the hint appears on the client.
    Object.defineProperty(navigator, 'platform', { value: 'MacIntel', configurable: true });
    render(<Search />);
    const button = screen.getByRole('button', { name: 'Search' });
    expect(button).toHaveAttribute('title', 'Search — ⌘K');
    expect(button).toHaveAttribute('aria-keyshortcuts', 'Meta+K Control+K');
  });
});

describe('the shortcut', () => {
  it('opens on ⌘K and on Ctrl+K, and does nothing while open', async () => {
    const user = userEvent.setup();
    render(<Search />);
    await user.keyboard('{Meta>}k{/Meta}');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.keyboard('{Control>}k{/Control}');
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.keyboard('{Control>}k{/Control}');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

describe('the combobox', () => {
  it('is wired to the listbox and lists the suggestions before anything is typed', async () => {
    const { field } = await open();
    expect(field).toHaveAttribute('aria-autocomplete', 'list');
    expect(field).toHaveAttribute('aria-expanded', 'true');
    const list = screen.getByRole('listbox', { name: 'Results' });
    expect(field.getAttribute('aria-controls')).toBe(list.id);
    const suggested = within(list).getByRole('group', { name: 'Suggested' });
    expect(within(suggested).getAllByRole('option')).toHaveLength(SUGGESTED.length);
    expect(screen.queryByRole('group', { name: 'Recent' })).not.toBeInTheDocument();
  });

  it('holds every suggested href to a page', () => {
    for (const href of SUGGESTED) expect(PAGES.map((p) => p.href)).toContain(href);
  });

  it('lists hits grouped by section, the prefix marked', async () => {
    const { user } = await open();
    await user.keyboard('butt');
    const list = screen.getByRole('listbox');
    const components = within(list).getByRole('group', { name: 'Components' });
    const options = within(components).getAllByRole('option');
    expect(options[0]).toHaveTextContent('Button');
    expect(options[0]?.querySelector('mark')).toHaveTextContent('Butt');
    expect(options[0]).toHaveTextContent('Components');
  });

  it('carries the breadcrumb and an excerpt for a body hit', async () => {
    const { user } = await open();
    await user.keyboard('pressed');
    const option = screen.getByRole('option', { name: /States/ });
    expect(option).toHaveTextContent('Components › Button');
    expect(option).toHaveTextContent(/hover, pressed/);
  });

  it('does not repeat a section page’s name in its own sections’ breadcrumb', async () => {
    const { user } = await open();
    await user.keyboard('in this section');
    const option = screen.getByRole('option', { name: /In this section/ });
    expect(option).toHaveTextContent('Developers');
    expect(option).not.toHaveTextContent('Developers › Developers');
  });

  it('moves with the arrows, wrapping, and with Home and End once a row is active', async () => {
    const { user, field } = await open();
    await user.keyboard('button');
    const options = screen.getAllByRole('option');
    expect(field).not.toHaveAttribute('aria-activedescendant');
    await user.keyboard('{ArrowDown}');
    expect(field).toHaveAttribute('aria-activedescendant', options[0]?.id);
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{ArrowUp}');
    expect(field).toHaveAttribute('aria-activedescendant', options[options.length - 1]?.id);
    await user.keyboard('{Home}');
    expect(field).toHaveAttribute('aria-activedescendant', options[0]?.id);
    await user.keyboard('{End}');
    expect(field).toHaveAttribute('aria-activedescendant', options[options.length - 1]?.id);
    expect(field).toHaveFocus();
  });

  it('starts a new query with no row active', async () => {
    const { user, field } = await open();
    await user.keyboard('button{ArrowDown}');
    expect(field).toHaveAttribute('aria-activedescendant');
    await user.keyboard('s');
    expect(field).not.toHaveAttribute('aria-activedescendant');
  });

  it('follows the active row on Enter, or the first when none is active, then closes and clears', async () => {
    const { user } = await open();
    await user.keyboard('button{Enter}');
    expect(push).toHaveBeenCalledWith('/button');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /search/i }));
    expect(screen.getByRole('combobox')).toHaveValue('');
    await user.keyboard('button{ArrowDown}{ArrowDown}{Enter}');
    expect(push).toHaveBeenLastCalledWith('/button#states');
    // The Dialog keeps its children mounted while closed; the closed dialog
    // is out of the accessibility tree, which is what the query asserts.
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('follows a row on click, and hover moves the active row', async () => {
    const { user, field } = await open();
    await user.keyboard('button');
    const [, second] = screen.getAllByRole('option');
    await user.hover(second!);
    expect(field).toHaveAttribute('aria-activedescendant', second?.id);
    await user.click(second!);
    expect(push).toHaveBeenCalledWith('/button#states');
  });

  it('keeps the query when closed with Esc', async () => {
    const { user } = await open();
    await user.keyboard('butt');
    act(() => void screen.getByRole('dialog').dispatchEvent(new Event('cancel', { cancelable: true })));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /search/i }));
    expect(screen.getByRole('combobox')).toHaveValue('butt');
  });

  it('says so when nothing matches, and offers the suggestions', async () => {
    const { user } = await open();
    await user.keyboard('zzzz');
    expect(screen.getByRole('status')).toHaveTextContent('Nothing mentions “zzzz”.');
    expect(screen.getByRole('group', { name: 'Suggested' })).toBeInTheDocument();
  });

  it('records what was chosen as recent, and shows it first next time', async () => {
    const { user } = await open();
    await user.keyboard('install{Enter}');
    expect(JSON.parse(localStorage.getItem(RECENT_KEY)!)).toEqual([{ href: '/install', title: 'Install', crumb: 'Developers' }]);
    await user.click(screen.getByRole('button', { name: /search/i }));
    const list = screen.getByRole('listbox');
    const groups = within(list).getAllByRole('group');
    expect(groups[0]).toHaveAccessibleName('Recent');
    expect(within(groups[0]!).getByRole('option')).toHaveTextContent('Install');
  });

  it('shows the loading state, then searches once the index arrives', async () => {
    let resolve!: (i: Index) => void;
    index = new Promise((r) => (resolve = r));
    const { user } = await open();
    await user.keyboard('butt');
    expect(screen.getByRole('status')).toHaveTextContent('Loading the index…');
    await act(async () => {
      resolve(fixture);
      await index;
    });
    // Every row of the fixture's Button page carries the label; the page itself is first.
    expect(screen.getAllByRole('option')[0]).toHaveTextContent('Button');
  });

  it('reports an index that did not load, and tries again on the next open', async () => {
    index = Promise.reject(new Error('offline'));
    index.catch(() => {});
    const { user } = await open();
    await user.keyboard('butt');
    expect(screen.getByRole('status')).toHaveTextContent('The index did not load.');
    await user.click(screen.getByRole('button', { name: 'Close' }));
    index = Promise.resolve(fixture);
    await user.click(screen.getByRole('button', { name: 'Search' }));
    await flush();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getAllByRole('option')[0]).toHaveTextContent('Button');
  });

  it('leaves the Enter of an IME composition alone', async () => {
    const { user, field } = await open();
    await user.keyboard('button');
    fireEvent.keyDown(field, { key: 'Enter', isComposing: true });
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('keeps Escape from the document, so the narrow-screen menu stays open', async () => {
    const { user, field } = await open();
    const seen = vi.fn();
    document.addEventListener('keydown', seen);
    await user.keyboard('{Escape}');
    document.removeEventListener('keydown', seen);
    expect(seen).not.toHaveBeenCalled();
    void field;
  });
});

describe('axe', () => {
  it('finds nothing in the open palette, empty and with results', async () => {
    const { user } = await open();
    expect(await axeViolations(document.body)).toEqual([]);
    await user.keyboard('button{ArrowDown}');
    expect(await axeViolations(document.body)).toEqual([]);
  });
});
