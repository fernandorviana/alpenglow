import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { axeViolations } from '@/test/axe';
import { block, readCss } from '@/test/css';
import { installDialogStub } from '@/test/dialog';
import { installPopoverStub } from '@/test/popover';
import { Toaster, toast } from '@/components/Toast';
import { media } from '@/tokens/scale';
import { Screen } from './Screen';
import { initialState, reducer } from './state';
import styles from './screen.module.css';

vi.mock('next/navigation', () => ({ usePathname: () => '/screen/full', useRouter: () => ({ push: () => {} }) }));

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

installDialogStub();
installPopoverStub();

afterEach(() => {
  act(() => toast.dismiss());
  wide = true;
});

const scheduler = () => screen.getByRole('region', { name: 'Day schedule' });
const table = () => screen.getByRole('table', { name: /Appointments on/ });
/** The client's name in a row's primary cell: the cell holds only the name. */
const clientOf = (button: HTMLElement) => button.textContent!;

/** The selection bar: a group named by its count. Its Confirm and Cancel share their names with every row's. */
const bar = () => screen.getByRole('group', { name: /selected/ });

// The whole screen mounted, and axe over all of it: ~1.3s a test here, 4–6s on
// the CI runner, past the 5s default. The limit is raised for this block only.
describe('the dense screen', { timeout: 20_000 }, () => {
  it('opens on Thursday 17 September with the day and the table side by side', async () => {
    render(<Screen />);
    expect(screen.getByRole('heading', { name: /Thursday 17 September/ })).toBeInTheDocument();
    expect(screen.getByRole('table', { name: /Appointments on Thursday 17 September/ })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Day schedule' })).toBeInTheDocument();
  });

  it('marks the row when a card is chosen, and the card when a row is', async () => {
    render(<Screen />);
    const [card] = within(scheduler()).getAllByRole('button', { name: /Confirmed|Pending/ });
    await userEvent.click(card!);
    expect(within(table()).getByRole('button', { current: true })).toBeInTheDocument();
    const rowButton = within(table())
      .getAllByRole('button')
      .filter((b) => b.closest('td[data-primary="true"]'))
      .find((b) => !b.hasAttribute('aria-current'))!;
    await userEvent.click(rowButton);
    expect(within(scheduler()).getByRole('button', { current: true })).toHaveAccessibleName(new RegExp(clientOf(rowButton)));
  });

  it('confirms the pending in bulk and undoes it', async () => {
    render(
      <>
        <Screen />
        <Toaster />
      </>,
    );
    const pending = within(table()).getAllByRole('row').filter((r) => within(r).queryAllByText('Pending').length > 0).slice(0, 2);
    for (const r of pending) await userEvent.click(within(r).getByRole('checkbox'));
    await userEvent.click(within(bar()).getByRole('button', { name: 'Confirm' }));
    for (const r of pending) {
      expect(within(r).getAllByText('Confirmed')).not.toHaveLength(0);
      expect(within(r).queryAllByText('Pending')).toHaveLength(0);
    }
    await userEvent.click(await screen.findByRole('button', { name: 'Undo' }));
    for (const r of pending) {
      expect(within(r).getAllByText('Pending')).not.toHaveLength(0);
      expect(within(r).queryAllByText('Confirmed')).toHaveLength(0);
    }
  });

  it.each([
    ['at rest', async () => {}],
    // R3: the primary cell's button, the first in the body, not a sort or bulk control in the head.
    ['with the drawer open', async () => { await userEvent.click(table().querySelector('tbody button')!); }],
    ['with the dialog open', async () => { await userEvent.click(screen.getByRole('button', { name: 'New appointment' })); }],
    ['on an empty section', async () => { await userEvent.click(screen.getByRole('link', { name: 'Clients' })); }],
  ])('passes axe %s', async (_, act) => {
    const { container } = render(<Screen />);
    await act();
    expect(await axeViolations(container)).toEqual([]);
  });

  it('shows the empty table and an empty day when the filters match nothing', async () => {
    const initial = reducer(initialState(), { type: 'filter', filters: [{ key: 'practitioner', values: ['nobody'] }] });
    const { container } = render(<Screen initial={initial} />);
    expect(within(table()).getByText('No appointments match these filters.')).toBeInTheDocument();
    expect(await axeViolations(container)).toEqual([]);
  });

  it('books on another day by going there first, and undoes it there', async () => {
    // The dialog's path through `go` and then `apply`: the reducer keeps only
    // the day it shows, so a booking for Friday must land on Friday's record,
    // and its Undo must find it there.
    render(
      <>
        <Screen />
        <Toaster />
      </>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'New appointment' }));
    const dialog = screen.getByRole('dialog', { name: 'New appointment' });
    await userEvent.type(within(dialog).getByRole('combobox', { name: /Client/ }), 'Rui Kow');
    await userEvent.click(screen.getByRole('option', { name: 'Rui Kowalski', hidden: true }));
    const date = within(dialog).getByRole('textbox', { name: /Date/ });
    await userEvent.clear(date);
    await userEvent.type(date, '18092026');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Book' }));

    const booked = () =>
      within(table())
        .queryAllByRole('row')
        .filter(
          (r) =>
            within(r).queryAllByText('Rui Kowalski').length > 0 &&
            within(r).queryAllByText('14:00 – 14:30').length > 0 &&
            within(r).queryAllByText('Ana Ferreira').length > 0,
        );
    expect(screen.getByRole('heading', { name: /Friday 18 September/ })).toBeInTheDocument();
    expect(booked()).toHaveLength(1);
    expect(within(booked()[0]!).getAllByText('Pending')).not.toHaveLength(0);

    await userEvent.click(await screen.findByRole('button', { name: 'Undo' }));
    expect(screen.getByRole('heading', { name: /Friday 18 September/ })).toBeInTheDocument();
    expect(booked()).toHaveLength(0);
  });

  it('names the columns by first name and keeps the full name in the Avatar', () => {
    render(<Screen />);
    // At the 128 floor a head leaves a name 79: four of the five full names
    // would end in an ellipsis at 1280 and 1440.
    for (const first of ['Ana', 'Kwame', 'Lin', 'Sofia', 'Omar']) expect(within(scheduler()).getByText(first)).toBeInTheDocument();
    expect(within(scheduler()).getByText('Sofia Marques')).toHaveClass('ap-sr-only');
  });

  it('proposes the first free half hour after now, and says when each start would end', async () => {
    render(<Screen />);
    await userEvent.click(screen.getByRole('button', { name: 'New appointment' }));
    const dialog = screen.getByRole('dialog', { name: 'New appointment' });
    // Ana is busy until 12:45 and at lunch from 13:00: 14:00 is her first free half hour after 11:20.
    expect(within(dialog).getByRole('combobox', { name: /Start/ })).toHaveTextContent('14:00 – 14:30');
    expect(within(dialog).getByRole('combobox', { name: /Type/ })).toHaveTextContent('Follow-up');
  });

  it('opens the palette empty each time', async () => {
    render(<Screen />);
    await userEvent.keyboard('{Meta>}k{/Meta}');
    const palette = screen.getByRole('dialog', { name: 'Search Ridge Physio' });
    await userEvent.type(within(palette).getByRole('combobox'), 'tomorrow');
    await userEvent.click(within(palette).getByRole('button', { name: 'Close' }));
    await userEvent.keyboard('{Meta>}k{/Meta}');
    expect(within(screen.getByRole('dialog', { name: 'Search Ridge Physio' })).getByRole('combobox')).toHaveValue('');
  });

  it('at a phone’s width, leads the main with the date and shows one practitioner', () => {
    wide = false;
    render(<Screen />);
    const heading = screen.getByRole('heading', { name: 'Thu 17 Sept' });
    expect(screen.getByRole('main')).toContainElement(heading);
    expect(screen.getByRole('banner')).not.toContainElement(heading);
    expect(screen.queryByRole('button', { name: 'Notifications' })).not.toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Practitioner' })).toHaveTextContent('Ana Ferreira');
    expect(within(scheduler()).getByText('Ana')).toBeInTheDocument();
    expect(within(scheduler()).queryByText('Kwame')).not.toBeInTheDocument();
  });

  it('keeps a change through Today, and through a day away and back', async () => {
    render(<Screen />);
    const row = () => within(table()).getAllByRole('row').find((r) => within(r).queryAllByText('Leila Okafor').length > 0 && within(r).queryAllByText(/09:00 – 09:45/).length > 0)!;
    expect(within(row()).queryAllByText('Pending')).not.toHaveLength(0);
    await userEvent.click(within(row()).getByRole('checkbox'));
    await userEvent.click(within(bar()).getByRole('button', { name: 'Confirm' }));
    expect(within(row()).queryAllByText('Pending')).toHaveLength(0);

    await userEvent.click(screen.getByRole('button', { name: 'Today' }));
    expect(within(row()).queryAllByText('Pending')).toHaveLength(0);

    await userEvent.click(screen.getByRole('button', { name: 'Previous day' }));
    await userEvent.click(screen.getByRole('button', { name: 'Next day' }));
    expect(screen.getByRole('heading', { name: /Thursday 17 September/ })).toBeInTheDocument();
    expect(within(row()).getAllByText('Confirmed')).not.toHaveLength(0);
    expect(within(row()).queryAllByText('Pending')).toHaveLength(0);
  });

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
});

describe('the shell', () => {
  it('puts the column in the last track, whether or not the navigation stands in the first', () => {
    // Below lg the SideNav is a closed sheet, not a grid item. Auto-placed,
    // the column fell into the `auto` track, which sized to its content — 754
    // at 900 and at 1023 — and the `1fr` track beside it stayed empty.
    const css = readCss('app/screen/screen.module.css');
    expect(block(css, '.screen {')).toContain('grid-template-columns: auto minmax(0, 1fr);');
    expect(block(css, '.column {')).toContain('grid-column: -2 / -1;');
  });

  it('below lg, holds the navigation in a sheet, so the column is the only thing in the grid', () => {
    wide = false;
    const { container } = render(<Screen />);
    const shell = container.querySelector(`.${styles.screen}`)!;
    const column = container.querySelector(`.${styles.column}`)!;
    expect(column.parentElement).toBe(shell);
    const dialog = within(shell as HTMLElement).getByRole('navigation', { name: 'Main', hidden: true }).closest('dialog');
    expect(dialog).not.toBeNull();
    expect(dialog).not.toHaveAttribute('open');
  });
});
