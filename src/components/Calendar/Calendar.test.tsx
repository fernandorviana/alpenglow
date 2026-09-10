import { readFileSync } from 'node:fs';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  addDays,
  addMonths,
  clamp,
  compare,
  daysInMonth,
  isValidISO,
  isWithin,
  monthGrid,
  orderRange,
  parts,
  startOfMonth,
  today,
  toISO,
  weekday,
} from './date';
import { Calendar } from './Calendar';
import styles from './Calendar.module.css';

describe('date', () => {
  it('round-trips an ISO date through its parts', () => {
    expect(parts('2026-04-26')).toEqual({ year: 2026, month: 4, day: 26 });
    expect(toISO(2026, 4, 26)).toBe('2026-04-26');
  });

  it('pads single-digit months and days', () => {
    expect(toISO(2026, 1, 5)).toBe('2026-01-05');
  });

  it('rejects a date whose day does not exist in its month', () => {
    // A regex alone accepts 2026-02-30. The parser has to know the month.
    expect(isValidISO('2026-02-30')).toBe(false);
    expect(isValidISO('2026-02-28')).toBe(true);
    expect(isValidISO('2024-02-29')).toBe(true);
    expect(isValidISO('2026-02-29')).toBe(false);
    expect(isValidISO('2026-13-01')).toBe(false);
    expect(isValidISO('26-04-01')).toBe(false);
  });

  it('counts the days in a month, including a leap February', () => {
    expect(daysInMonth(2026, 4)).toBe(30);
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2026, 12)).toBe(31);
  });

  it('reports the weekday with Sunday as zero', () => {
    // 2023-04-01 was a Saturday: the month the drawing shows.
    expect(weekday('2023-04-01')).toBe(6);
    expect(weekday('2023-04-02')).toBe(0);
  });

  it('adds days across a month and a year boundary', () => {
    expect(addDays('2026-04-30', 1)).toBe('2026-05-01');
    expect(addDays('2026-05-01', -1)).toBe('2026-04-30');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2027-01-01', -1)).toBe('2026-12-31');
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
  });

  it('clamps the day when adding months would overflow', () => {
    // 31 January plus a month is the end of February, not the 3rd of March.
    // Paging months must not silently walk the date forward.
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonths('2024-01-31', 1)).toBe('2024-02-29');
    expect(addMonths('2026-03-31', -1)).toBe('2026-02-28');
  });

  it('adds months across a year in both directions', () => {
    expect(addMonths('2026-12-15', 1)).toBe('2027-01-15');
    expect(addMonths('2026-01-15', -1)).toBe('2025-12-15');
    expect(addMonths('2026-06-15', -18)).toBe('2024-12-15');
  });

  it('takes the first of the month', () => {
    expect(startOfMonth('2026-04-26')).toBe('2026-04-01');
  });

  it('compares lexicographically, which is also chronologically', () => {
    expect(compare('2026-04-01', '2026-04-26')).toBe(-1);
    expect(compare('2026-04-26', '2026-04-01')).toBe(1);
    expect(compare('2026-04-26', '2026-04-26')).toBe(0);
  });

  it('bounds a date inclusively', () => {
    expect(isWithin('2026-04-26', '2026-04-01', '2026-04-30')).toBe(true);
    expect(isWithin('2026-04-01', '2026-04-01', '2026-04-30')).toBe(true);
    expect(isWithin('2026-04-30', '2026-04-01', '2026-04-30')).toBe(true);
    expect(isWithin('2026-03-31', '2026-04-01', '2026-04-30')).toBe(false);
    expect(isWithin('2026-05-01', '2026-04-01', '2026-04-30')).toBe(false);
    expect(isWithin('2026-05-01')).toBe(true);
  });

  it('clamps to whichever bound it crossed', () => {
    expect(clamp('2026-03-01', '2026-04-01', '2026-04-30')).toBe('2026-04-01');
    expect(clamp('2026-05-01', '2026-04-01', '2026-04-30')).toBe('2026-04-30');
    expect(clamp('2026-04-15', '2026-04-01', '2026-04-30')).toBe('2026-04-15');
  });

  it('orders a range whose end precedes its start', () => {
    // The user expressed an interval, not an order.
    expect(orderRange('2026-04-26', '2026-04-01')).toEqual({
      start: '2026-04-01',
      end: '2026-04-26',
    });
  });

  it('always builds six rows of seven', () => {
    // The drawn panel is 340px tall, which only closes at six rows:
    // 8 + 40 + 4 + 40 + (6 x 40) + 8. A grid that varies its row count
    // makes the panel jump height between months.
    for (const month of ['2026-02-01', '2026-04-01', '2026-08-01', '2027-01-01']) {
      const grid = monthGrid(month, 0);
      expect(grid).toHaveLength(6);
      for (const row of grid) expect(row).toHaveLength(7);
    }
  });

  it('leads the grid with the spill from the previous month', () => {
    // April 2023 is the month the drawing shows: the 1st is a Saturday, so a
    // Sunday-start grid opens on 26 March and closes on 6 May.
    const grid = monthGrid('2023-04-01', 0);
    expect(grid[0]![0]).toEqual({ date: '2023-03-26', outside: true });
    expect(grid[0]![6]).toEqual({ date: '2023-04-01', outside: false });
    expect(grid[5]![6]).toEqual({ date: '2023-05-06', outside: true });
  });

  it('shifts the whole grid when the week starts on Monday', () => {
    const grid = monthGrid('2023-04-01', 1);
    expect(grid[0]![0]).toEqual({ date: '2023-03-27', outside: true });
    expect(grid[0]![5]).toEqual({ date: '2023-04-01', outside: false });
  });

  it('has no leading spill when the month opens on the first weekday', () => {
    // 2023-10-01 was a Sunday. A Sunday-start grid must not lead with a
    // full week of September.
    const grid = monthGrid('2023-10-01', 0);
    expect(grid[0]![0]).toEqual({ date: '2023-10-01', outside: false });
  });

  it('builds a grid for a month starting on each of the seven weekdays', () => {
    // One of these is the off-by-one the modulo exists to prevent.
    const months = [
      '2023-10-01', // Sunday
      '2023-05-01', // Monday
      '2023-08-01', // Tuesday
      '2023-02-01', // Wednesday
      '2023-06-01', // Thursday
      '2023-09-01', // Friday
      '2023-04-01', // Saturday
    ];
    for (const month of months) {
      const grid = monthGrid(month, 0);
      const first = grid.flat().find((cell) => !cell.outside)!;
      expect(first.date).toBe(month);
      expect(weekday(grid[0]![0]!.date)).toBe(0);
    }
  });
});

describe('Calendar structure', () => {
  it('names the grid and labels it with the visible month', () => {
    render(<Calendar label="Appointment date" defaultMonth="2023-04-01" />);
    const grid = screen.getByRole('grid', { name: /april 2023/i });
    expect(grid).toBeInTheDocument();
  });

  it('names the seven column headers with full weekday names', () => {
    // Asserted on the accessible name, not textContent: textContent includes
    // aria-hidden text, so it reads "SSunday" for markup that is correct. The
    // visible glyph is one letter and two of the seven are S — it
    // disambiguates nothing, so it is hidden and the name is the whole day.
    render(<Calendar label="Date" defaultMonth="2023-04-01" />);
    const headers = screen.getAllByRole('columnheader');
    const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    expect(headers).toHaveLength(7);
    headers.forEach((header, i) => expect(header).toHaveAccessibleName(names[i]));
  });

  it('never draws the weekday letter with CSS generated content', () => {
    // The render test above cannot catch this: jsdom does not compute ::before.
    // Browsers do, and fold it into the accessible name, which would put the
    // letter back into "S Sunday".
    const css = readFileSync('src/components/Calendar/Calendar.module.css', 'utf8');
    expect(css).not.toMatch(/\.weekday[^{]*::?(before|after)/);
  });

  it('renders six rows of days whatever the month', () => {
    render(<Calendar label="Date" defaultMonth="2026-02-01" />);
    // Six day rows plus the header row.
    expect(screen.getAllByRole('row')).toHaveLength(7);
  });

  it('gives each day in the month a full localised accessible name', () => {
    // A screen reader moving cell to cell must never have to remember which
    // column it is in to know the weekday.
    render(<Calendar label="Date" defaultMonth="2023-04-01" />);
    expect(
      screen.getByRole('button', { name: 'Wednesday, April 26, 2023' }),
    ).toBeInTheDocument();
  });

  it('renders the spilled days but keeps them out of reach', () => {
    // Inert, not absent: they show where the month begins and ends. They are
    // not how the pointer or the keyboard crosses a month, so they are not
    // controls, and being decoration is what makes their 1.65:1 defensible.
    render(<Calendar label="Date" defaultMonth="2023-04-01" />);
    // April has 30 days, so exactly 30 buttons: no spilled day is one.
    expect(screen.getAllByRole('button')).toHaveLength(30);
    // 26 March opens the grid and has no button; 26 April has one.
    expect(screen.queryByRole('button', { name: /march 26/i })).toBeNull();
    expect(screen.getByRole('button', { name: /april 26/i })).toBeInTheDocument();
  });

  it('marks the spilled cells so the stylesheet can grey them', () => {
    render(<Calendar label="Date" defaultMonth="2023-04-01" />);
    const cells = screen.getAllByRole('gridcell');
    expect(cells).toHaveLength(42);
    const outside = cells.filter((c) => c.className.includes(styles.outside!));
    expect(outside).toHaveLength(12); // 6 leading in March, 6 trailing in May
  });

  it('renders the month name and the year as separate weights', () => {
    // The drawing sets the month Medium and the year Regular. One <h2> with
    // two spans, so the heading is still one string to a screen reader.
    render(<Calendar label="Date" defaultMonth="2023-04-01" />);
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('April 2023');
  });

  it('follows the locale for month and weekday names', () => {
    render(<Calendar label="Data" defaultMonth="2023-04-01" locale="pt-PT" />);
    expect(screen.getByRole('grid', { name: /abril de 2023/i })).toBeInTheDocument();
  });

  it('starts the week where it is told, not where the locale claims', () => {
    // Intl.Locale#getWeekInfo reports firstDay 7 for pt-PT, which is wrong.
    // The prop is the only source of truth.
    render(<Calendar label="Date" defaultMonth="2023-04-01" weekStartsOn={1} />);
    const headers = screen.getAllByRole('columnheader');
    expect(headers[0]).toHaveTextContent('Monday');
  });
});

describe('Calendar single selection', () => {
  it('marks the selected day on its cell, not its button', () => {
    // aria-selected belongs on the gridcell. Putting it on the button would
    // put a state on an element whose role does not support it.
    render(<Calendar label="Date" defaultMonth="2023-04-01" value="2023-04-26" />);
    const button = screen.getByRole('button', { name: /april 26/i });
    expect(button.closest('td')).toHaveAttribute('aria-selected', 'true');
  });

  it('marks exactly one day selected', () => {
    render(<Calendar label="Date" defaultMonth="2023-04-01" value="2023-04-26" />);
    const selected = screen
      .getAllByRole('gridcell')
      .filter((c) => c.getAttribute('aria-selected') === 'true');
    expect(selected).toHaveLength(1);
  });

  it('reports the day that was clicked', async () => {
    const onSelect = vi.fn();
    render(<Calendar label="Date" defaultMonth="2023-04-01" onSelect={onSelect} />);
    await userEvent.click(screen.getByRole('button', { name: /april 26/i }));
    expect(onSelect).toHaveBeenCalledWith('2023-04-26');
  });

  it('marks today, and keeps marking it when it is also selected', async () => {
    // The today marker is a dot below the number. On a selected day the pill
    // is already accent, so an accent dot measures 1.00:1 against it and
    // vanishes — the dot has to switch to the on-accent label colour. The
    // class is what the stylesheet hangs that switch on.
    const now = today();
    const todayCell = () =>
      screen.getAllByRole('gridcell').find((c) => c.className.includes(styles.today!));

    const { rerender } = render(<Calendar label="Date" defaultMonth={now} />);
    expect(todayCell()).toBeDefined();
    expect(todayCell()).not.toHaveAttribute('aria-selected');

    rerender(<Calendar label="Date" defaultMonth={now} value={now} />);
    expect(todayCell()).toHaveAttribute('aria-selected', 'true');
    expect(todayCell()!.className).toContain(styles.selected!);
  });

  it('disables days outside min and max and does not report them', async () => {
    const onSelect = vi.fn();
    render(
      <Calendar
        label="Date"
        defaultMonth="2023-04-01"
        min="2023-04-10"
        max="2023-04-20"
        onSelect={onSelect}
      />,
    );
    const early = screen.getByRole('button', { name: /april 5/i });
    expect(early).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(early);
    expect(onSelect).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: /april 15/i }));
    expect(onSelect).toHaveBeenCalledWith('2023-04-15');
  });

  it('keeps an unavailable day focusable rather than skipping it silently', () => {
    // aria-disabled and not the disabled attribute: a keyboard user has to be
    // able to land on the day to discover that it cannot be picked. A day that
    // is simply not there is indistinguishable from a rendering bug.
    render(
      <Calendar
        label="Date"
        defaultMonth="2023-04-01"
        isDateUnavailable={(d) => d === '2023-04-15'}
      />,
    );
    const day = screen.getByRole('button', { name: /april 15/i });
    expect(day).toHaveAttribute('aria-disabled', 'true');
    expect(day).not.toBeDisabled();
  });

  it('never asks isDateUnavailable about a spilled day', () => {
    // They are inert, so the answer would go unread, and a caller doing
    // anything expensive there would pay for twelve of them per month.
    // Asserted on the arguments rather than the call count, which a second
    // render would change without anything being wrong.
    const isDateUnavailable = vi.fn((_date: string) => false);
    render(
      <Calendar label="Date" defaultMonth="2023-04-01" isDateUnavailable={isDateUnavailable} />,
    );
    const asked = isDateUnavailable.mock.calls.map(([date]) => date);
    expect(asked.length).toBeGreaterThan(0);
    expect(asked.every((date) => date.startsWith('2023-04-'))).toBe(true);
  });
});
