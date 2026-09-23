import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { axeViolations } from '@/test/axe';
import { installDialogStub } from '@/test/dialog';
import { installPopoverStub } from '@/test/popover';
import { Toaster, toast } from '@/components/Toast';
import { Screen } from './Screen';
import { initialState, reducer } from './state';

vi.mock('next/navigation', () => ({ usePathname: () => '/screen/full', useRouter: () => ({ push: () => {} }) }));

/**
 * The wide screen: the day and the table side by side, the SideNav expanded.
 * Only `(min-width: 1280px)` matches, so every narrower query is false. A
 * test that wants the phone sets `wide` to false, and then every max-width
 * query matches.
 */
let wide = true;
window.matchMedia = (query: string) =>
  ({
    matches: wide ? query === '(min-width: 1280px)' : query.startsWith('(max-width'),
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
/**
 * The client's name in a row's primary cell. The cell also holds the line
 * the collapsed list shows (time, practitioner, status), hidden by a
 * container query jsdom does not apply, so the button's whole text is more
 * than the name.
 */
const clientOf = (button: HTMLElement) => button.firstElementChild!.firstElementChild!.textContent!;

describe('the dense screen', () => {
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
    const rowButton = within(table()).getAllByRole('button').find((b) => !b.hasAttribute('aria-current'))!;
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
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    // The status reads twice in a row, in its column and in the collapsed list's line: neither may say the old one.
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

  it('names the columns by first name and keeps the full name in the Avatar', () => {
    render(<Screen />);
    // The Scheduler lays its head out at max-content: a full name wider than
    // the 128 floor widened the head and not the body at 1440.
    for (const first of ['Ana', 'Kwame', 'Lin', 'Sofia', 'Omar']) expect(within(scheduler()).getByText(first)).toBeInTheDocument();
    expect(within(scheduler()).getByText('Sofia Marques')).toHaveClass('ap-sr-only');
  });

  it('carries the time, the practitioner and the status in the primary cell, for the collapsed list', () => {
    render(<Screen />);
    const first = table().querySelector('tbody button')!;
    expect(first).toHaveTextContent(/^Mateo Silva08:30 – 09:15 · Ana FerreiraConfirmed$/);
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
});
