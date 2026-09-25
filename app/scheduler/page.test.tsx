import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { installPopoverStub } from '@/test/popover';
import Page from './page';

vi.mock('next/navigation', () => ({
  usePathname: () => '/scheduler',
  useRouter: () => ({ push: () => {} }),
  useSearchParams: () => new URLSearchParams(),
}));

/**
 * The window's width, which every `(width < …rem)` and `(width >= …rem)`
 * query is answered from; `resize` changes it and tells every listener, as a
 * rotated phone would.
 */
let width = 1440;
const listeners = new Set<() => void>();
window.matchMedia = (query: string) => {
  const range = /\(width (<|>=) ([\d.]+)rem\)/.exec(query);
  const px = range ? Number(range[2]) * 16 : 0;
  return {
    matches: range ? (range[1] === '<' ? width < px : width >= px) : false,
    media: query,
    addEventListener: (_: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
  } as unknown as MediaQueryList;
};
const resize = (next: number) =>
  act(() => {
    width = next;
    listeners.forEach((listener) => listener());
  });

installPopoverStub();

afterEach(() => {
  width = 1440;
  vi.restoreAllMocks();
});

const view = () => screen.getByRole('combobox', { name: 'View' });
const grid = () => screen.getByRole('region', { name: 'Appointments' });
const sideButton = () => screen.queryByRole('button', { name: 'Calendar and filters' });

describe('the Scheduler page’s Try it', () => {
  it('from md up, shows the week and keeps the calendar and the filters in the page', () => {
    width = 1024;
    render(<Page />);
    expect(view()).toHaveTextContent('Week');
    expect(grid().querySelectorAll('section')).toHaveLength(7);
    expect(screen.getByRole('group', { name: 'Event type' })).toBeInTheDocument();
    expect(screen.getByRole('grid', { name: /April 2023/ })).toBeInTheDocument();
    expect(sideButton()).toBeNull();
  });

  it('puts the side column under the grid until the week and the column fit beside each other', () => {
    const { container } = render(<Page />);
    const side = container.querySelector('.schedulerSide')!;
    expect(side.previousElementSibling).toBe(grid());
    const css = container.querySelector('style')!.textContent!.replace(/\s+/g, ' ');
    // One column by default; two from 1282 of the specimen: the hours and seven
    // 128 floors, 976, the region's two hairlines, the 24 gap and the 280.
    expect(css).toMatch(/\.schedulerScreen \{ display: grid; grid-template-columns: minmax\(0, 1fr\);/);
    expect(css).toContain('@container (width >= 1282px) { .schedulerScreen { grid-template-columns: minmax(0, 1fr) 280px; }');
    // Below md, before the page knows the width, the column under the grid is hidden already.
    expect(css).toContain('@media (width < 48rem) { .schedulerScreen > .schedulerSide { display: none; } }');
    expect(css).toContain('.schedulerFrame { container-type: inline-size; }');
    expect(side.closest('.specimen')).toHaveClass('schedulerFrame');
  });

  it('below md, says the day it shows, and opens the calendar and the filters over the grid from a button', async () => {
    width = 375;
    render(<Page />);
    expect(view(), 'the view shown, not the one asked for').toHaveTextContent('Day');
    expect(grid().querySelectorAll('section')).toHaveLength(1);
    expect(screen.queryByRole('group', { name: 'Event type' }), 'not beside or under the grid').toBeNull();

    await userEvent.click(sideButton()!);
    const drawer = screen.getByRole('dialog', { name: 'Calendar and filters' });
    expect(within(drawer).getByRole('group', { name: 'Event type' })).toBeInTheDocument();
    expect(within(drawer).getByRole('grid', { name: /April 2023/ })).toBeInTheDocument();

    await userEvent.click(within(drawer).getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog', { name: 'Calendar and filters' })).toBeNull();
  });

  it('below md, the side column’s Drawer is modal: the grid under it is inert until it closes, and the focus goes back to its button', async () => {
    width = 375;
    render(<Page />);
    await userEvent.click(sideButton()!);
    const drawer = screen.getByRole('dialog', { name: 'Calendar and filters' });
    expect(drawer).toHaveAttribute('aria-modal', 'true');
    expect(grid().closest('[inert]')).not.toBeNull();
    expect(sideButton()!.closest('[inert]')).not.toBeNull();
    expect(drawer.closest('[inert]')).toBeNull();
    await userEvent.click(within(drawer).getByRole('button', { name: 'Close' }));
    expect(grid().closest('[inert]')).toBeNull();
    await vi.waitFor(() => expect(sideButton()).toHaveFocus());
  });

  it('below md, offers the views a phone has', async () => {
    width = 375;
    render(<Page />);
    await userEvent.click(view());
    expect(screen.queryByRole('option', { name: 'Week' })).toBeNull();
    expect(screen.getByRole('option', { name: 'Day' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Day, by person' })).toBeInTheDocument();
  });

  it('below md, opens the panel on the event a reader presses, at the event', async () => {
    width = 375;
    render(<Page />);
    await userEvent.click(within(grid()).getAllByRole('button', { name: /Justin Anderson/ })[0]!);
    const drawer = screen.getByRole('dialog', { name: 'Calendar and filters' });
    const close = within(drawer).getByRole('button', { name: 'Close Justin Anderson' });
    await vi.waitFor(() => expect(close).toHaveFocus());
    await userEvent.click(close);
    expect(screen.queryByRole('dialog', { name: 'Calendar and filters' }), 'done with the event, done with the panel').toBeNull();
  });

  it('below md, opens the panel on a draft, at its title, and closes it when the draft is done', async () => {
    width = 375;
    render(<Page />);
    const column = grid().querySelector('section')!;
    fireEvent.pointerDown(column, { button: 0, pointerId: 1, clientX: 0, clientY: 0 });
    fireEvent.pointerUp(column, { button: 0, pointerId: 1, clientX: 0, clientY: 0 });
    const drawer = screen.getByRole('dialog', { name: 'Calendar and filters' });
    await vi.waitFor(() => expect(within(drawer).getByRole('textbox', { name: 'Title' })).toHaveFocus());
    await userEvent.click(within(drawer).getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog', { name: 'Calendar and filters' })).toBeNull();
  });

  it('crossing md with the panel open closes it, keeps the focus in the side column, and does not reopen it coming back', async () => {
    width = 375;
    render(<Page />);
    await userEvent.click(sideButton()!);
    const drawer = screen.getByRole('dialog', { name: 'Calendar and filters' });
    await vi.waitFor(() => expect(drawer).toContainElement(document.activeElement as HTMLElement));

    resize(1024);
    expect(screen.queryByRole('dialog', { name: 'Calendar and filters' })).toBeNull();
    const side = document.querySelector('.schedulerScreen > .schedulerSide')!;
    await vi.waitFor(() => expect(side).toContainElement(document.activeElement as HTMLElement));
    expect(screen.getByRole('switch', { name: /Availability/ })).toHaveFocus();

    resize(375);
    expect(screen.queryByRole('dialog', { name: 'Calendar and filters' }), 'turned back: still closed').toBeNull();
  });

  it('crossing below md from the side column puts the focus on the button that opens it', async () => {
    width = 1024;
    render(<Page />);
    screen.getByRole('switch', { name: /Availability/ }).focus();
    resize(375);
    await vi.waitFor(() => expect(sideButton()).toHaveFocus());
  });

  it('opts the grid in to opening at a day: a day picked in the week is the day shown, and Today brings today back', async () => {
    // The Appointments region, laid out: 400 wide, the hours 0 to 80, column n
    // from 80 + 128n less the scroll; a week starting Monday puts the 20th in column 3.
    const rect = (left: number, w: number) =>
      ({ x: left, y: 0, left, top: 0, right: left + w, bottom: 100, width: w, height: 100, toJSON: () => ({}) }) as DOMRect;
    const inGrid = (el: Element) => el.closest('[role=region][aria-label="Appointments"]') as HTMLElement | null;
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      const own = inGrid(this);
      if (!own) return rect(0, 0);
      if (this === own) return rect(0, 400);
      if (this.matches('section[data-column]')) return rect(80 + 128 * Number(this.dataset.column) - own.scrollLeft, 128);
      if (this.parentElement?.firstElementChild === this && this.parentElement.querySelector('section')) return rect(0, 80);
      return rect(0, 0);
    });
    vi.spyOn(Element.prototype, 'clientWidth', 'get').mockImplementation(function (this: Element) {
      return this.matches('[role=region][aria-label="Appointments"]') ? 400 : 0;
    });
    vi.spyOn(Element.prototype, 'scrollWidth', 'get').mockImplementation(function (this: Element) {
      return this.matches('[role=region][aria-label="Appointments"]') ? 80 + 128 * this.querySelectorAll('section').length : 0;
    });
    const centred = (n: number) => 80 + 128 * n + 64 - 240;

    width = 1024;
    render(<Page />);
    expect(grid().scrollLeft, 'today, Thursday').toBe(centred(3));
    await userEvent.click(screen.getByRole('button', { name: 'Tuesday, April 18, 2023' }));
    expect(grid().scrollLeft, 'the day picked, not today').toBe(centred(1));
    await userEvent.click(screen.getByRole('button', { name: 'Today' }));
    expect(grid().scrollLeft).toBe(centred(3));
    grid().scrollLeft = 0;
    await userEvent.click(screen.getByRole('button', { name: 'Today' }));
    expect(grid().scrollLeft, 'on today already, Today still brings it back').toBe(centred(3));
  });

  it('lists the prop that opens at a day', () => {
    render(<Page />);
    expect(screen.getByRole('table', { name: 'Scheduler props' })).toHaveTextContent('scrollToDay');
  });

  it('below md, closes the panel on the day a reader picks, and shows it', async () => {
    width = 375;
    render(<Page />);
    await userEvent.click(sideButton()!);
    const drawer = screen.getByRole('dialog', { name: 'Calendar and filters' });
    await userEvent.click(within(drawer).getByRole('button', { name: 'Friday, April 21, 2023' }));
    expect(screen.queryByRole('dialog', { name: 'Calendar and filters' })).toBeNull();
    expect(screen.getByRole('heading', { name: 'April 21, 2023' })).toBeInTheDocument();
  });
});
