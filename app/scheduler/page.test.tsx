import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { installPopoverStub } from '@/test/popover';
import Page from './page';

vi.mock('next/navigation', () => ({
  usePathname: () => '/scheduler',
  useRouter: () => ({ push: () => {} }),
  useSearchParams: () => new URLSearchParams(),
}));

/** The window's width, which every `(width < …rem)` and `(width >= …rem)` query is answered from. */
let width = 1440;
window.matchMedia = (query: string) => {
  const range = /\(width (<|>=) ([\d.]+)rem\)/.exec(query);
  const px = range ? Number(range[2]) * 16 : 0;
  return {
    matches: range ? (range[1] === '<' ? width < px : width >= px) : false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  } as unknown as MediaQueryList;
};

installPopoverStub();

afterEach(() => {
  width = 1440;
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
