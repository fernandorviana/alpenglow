import { readFileSync } from 'node:fs';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import userEvent from '@testing-library/user-event';
import {
  addDays,
  addMonths,
  clamp,
  compare,
  dateFormat,
  daysInMonth,
  formatTyped,
  isValidISO,
  isWithin,
  monthGrid,
  orderRange,
  parseTyped,
  parts,
  placeholderFor,
  segmentOrder,
  startOfMonth,
  today,
  toISO,
  utcTimestamp,
  weekday,
} from './date';
import { Calendar } from './Calendar';
import styles from './Calendar.module.css';

// `import.meta.url` is not a file URL under the jsdom environment these
// component tests run in, so resolve from the repository root instead.
// Comments are prose and measurements, not paint — stripped here so a test
// counting literals or token names does not also count what a comment cites.
const stylesheet = () =>
  readFileSync('src/components/Calendar/Calendar.module.css', 'utf8').replace(
    /\/\*[\s\S]*?\*\//g,
    '',
  );

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

  it('formats a UTC-midnight date as that date in every timezone', () => {
    // A formatter on the runtime zone reads UTC midnight as local time, which
    // west of UTC is the previous afternoon. Node applies a runtime TZ change
    // to Intl, so this discriminates inside an ordinary run.
    const original = process.env.TZ;
    try {
      for (const zone of ['America/Los_Angeles', 'Pacific/Kiritimati', 'UTC']) {
        process.env.TZ = zone;
        const name = dateFormat('en-US', { month: 'long', day: 'numeric' }).format(
          utcTimestamp('2023-04-01'),
        );
        expect(name, zone).toBe('April 1');
      }
    } finally {
      if (original === undefined) delete process.env.TZ;
      else process.env.TZ = original;
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
    const css = stylesheet();
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
    // April has 30 days, so exactly 30 day buttons: no spilled day is one.
    // Scoped to the grid so the pagination buttons flanking the heading,
    // which are real buttons too, don't get counted here.
    expect(within(screen.getByRole('grid')).getAllByRole('button')).toHaveLength(30);
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

  it('never lets the pointer repaint a pill that already has a fill', () => {
    // jsdom renders no :hover, so no render test can see this. Hovering a
    // selected day would paint it grey under its on-accent label, because the
    // hover rule outranks the state fills. The stylesheet is the only place
    // the guard can be asserted.
    const css = stylesheet();
    const painters = [...css.matchAll(/([^{}]*\.pill:hover[^{]*)\{([^}]*)\}/g)].filter(
      ([, , body]) => /background\s*:/.test(body!) && !/background\s*:\s*none/.test(body!),
    );
    expect(painters.length).toBeGreaterThan(0);
    for (const [, selector] of painters) {
      expect(selector).toContain(':not(.selected)');
      expect(selector).toContain(':not(.today)');
      expect(selector).toContain(':not(.inRange)');
    }
  });
});

describe('Calendar initial month', () => {
  it('opens on the month of its value when no month is given', () => {
    // A calendar holding 26 April 2023 shows April 2023. A hardcoded starting
    // month is wrong under any reading, and it is what a date picker passing
    // only a value would otherwise open on.
    render(<Calendar label="Date" value="2023-04-26" />);
    expect(screen.getByRole('grid', { name: /april 2023/i })).toBeInTheDocument();
  });

  it('opens on the month of a range start when no month is given', () => {
    render(
      <Calendar label="Stay" mode="range" value={{ start: '2023-04-10', end: '2023-04-14' }} />,
    );
    expect(screen.getByRole('grid', { name: /april 2023/i })).toBeInTheDocument();
  });

  it('opens on the current month when it has neither a month nor a value', () => {
    const expected = dateFormat('en-US', { month: 'long', year: 'numeric' }).format(
      utcTimestamp(startOfMonth(today())),
    );
    render(<Calendar label="Date" />);
    expect(screen.getByRole('grid', { name: new RegExp(expected, 'i') })).toBeInTheDocument();
  });
});

describe('Calendar keyboard', () => {
  // Scoped to the grid, not the whole document: the pagination buttons
  // flanking the heading are also real buttons and are tabbable in their own
  // right, but they are not part of the day grid's roving tab stop.
  it('puts exactly one day in the tab order', () => {
    render(<Calendar label="Date" defaultMonth="2023-04-01" value="2023-04-26" />);
    const tabbable = within(screen.getByRole('grid'))
      .getAllByRole('button')
      .filter((b) => b.tabIndex === 0);
    expect(tabbable).toHaveLength(1);
    expect(tabbable[0]).toHaveAccessibleName(/april 26/i);
  });

  it('does not steal focus from the page on a bare mount', () => {
    render(<Calendar label="Date" value="2023-04-26" />);
    expect(document.activeElement).toBe(document.body);
  });

  it('starts on today when nothing is selected', () => {
    const now = today();
    render(<Calendar label="Date" defaultMonth={now} />);
    const tabbable = within(screen.getByRole('grid'))
      .getAllByRole('button')
      .filter((b) => b.tabIndex === 0);
    expect(tabbable).toHaveLength(1);
    expect(tabbable[0]!.closest('td')!.className).toContain(styles.today!);
  });

  it('starts on the first of the month when neither today nor a value is in it', () => {
    render(<Calendar label="Date" defaultMonth="2023-04-01" />);
    const tabbable = within(screen.getByRole('grid'))
      .getAllByRole('button')
      .filter((b) => b.tabIndex === 0);
    expect(tabbable[0]).toHaveAccessibleName(/april 1,/i);
  });

  it('moves a day with the arrow keys', async () => {
    render(<Calendar label="Date" defaultMonth="2023-04-01" value="2023-04-12" />);
    const start = screen.getByRole('button', { name: /april 12/i });
    start.focus();

    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: /april 13/i })).toHaveFocus();

    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('button', { name: /april 20/i })).toHaveFocus();

    await userEvent.keyboard('{ArrowLeft}');
    expect(screen.getByRole('button', { name: /april 19/i })).toHaveFocus();

    await userEvent.keyboard('{ArrowUp}');
    expect(screen.getByRole('button', { name: /april 12/i })).toHaveFocus();
  });

  it('moves to the ends of the focused week', async () => {
    render(<Calendar label="Date" defaultMonth="2023-04-01" value="2023-04-12" />);
    screen.getByRole('button', { name: /april 12/i }).focus();

    await userEvent.keyboard('{Home}');
    expect(screen.getByRole('button', { name: /april 9/i })).toHaveFocus();

    await userEvent.keyboard('{End}');
    expect(screen.getByRole('button', { name: /april 15/i })).toHaveFocus();
  });

  it('rolls into the next month rather than stopping at its edge', async () => {
    // This is why the spilled days do not need to be interactive: the keyboard
    // never has to land on one to cross a month.
    const onMonthChange = vi.fn();
    render(
      <Calendar
        label="Date"
        defaultMonth="2023-04-01"
        value="2023-04-30"
        onMonthChange={onMonthChange}
      />,
    );
    screen.getByRole('button', { name: /april 30/i }).focus();

    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('grid', { name: /may 2023/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /may 1,/i })).toHaveFocus();
    expect(onMonthChange).toHaveBeenCalledWith('2023-05-01');
  });

  it('rolls backwards across a year boundary', async () => {
    render(<Calendar label="Date" defaultMonth="2023-01-01" value="2023-01-01" />);
    screen.getByRole('button', { name: /january 1, 2023/i }).focus();

    await userEvent.keyboard('{ArrowLeft}');
    expect(screen.getByRole('grid', { name: /december 2022/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /december 31, 2022/i })).toHaveFocus();
  });

  it('pages a month with PageUp and PageDown', async () => {
    render(<Calendar label="Date" defaultMonth="2023-04-01" value="2023-04-12" />);
    screen.getByRole('button', { name: /april 12/i }).focus();

    await userEvent.keyboard('{PageDown}');
    expect(screen.getByRole('grid', { name: /may 2023/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /may 12/i })).toHaveFocus();

    await userEvent.keyboard('{PageUp}');
    expect(screen.getByRole('grid', { name: /april 2023/i })).toBeInTheDocument();
  });

  it('pages a year with Shift held', async () => {
    render(<Calendar label="Date" defaultMonth="2023-04-01" value="2023-04-12" />);
    screen.getByRole('button', { name: /april 12/i }).focus();

    await userEvent.keyboard('{Shift>}{PageDown}{/Shift}');
    expect(screen.getByRole('grid', { name: /april 2024/i })).toBeInTheDocument();
  });

  it('clamps a keyboard move to min and max rather than leaving the range', async () => {
    render(
      <Calendar label="Date" defaultMonth="2023-04-01" value="2023-04-10" min="2023-04-10" />,
    );
    screen.getByRole('button', { name: /april 10/i }).focus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(screen.getByRole('button', { name: /april 10/i })).toHaveFocus();
  });

  it('selects the focused day with Enter and with Space', async () => {
    const onSelect = vi.fn();
    render(
      <Calendar label="Date" defaultMonth="2023-04-01" value="2023-04-12" onSelect={onSelect} />,
    );
    screen.getByRole('button', { name: /april 12/i }).focus();

    await userEvent.keyboard('{Enter}');
    expect(onSelect).toHaveBeenLastCalledWith('2023-04-12');

    await userEvent.keyboard(' ');
    expect(onSelect).toHaveBeenLastCalledWith('2023-04-12');
  });

  it('keeps exactly one tab stop when a controlled month refuses to move', async () => {
    // `month` is controlled here and nothing updates it in response to
    // onMonthChange, so ArrowRight past April's last day cannot page the
    // grid. The tab stop still has to land somewhere drawn.
    render(<Calendar label="Date" month="2023-04-01" value="2023-04-30" />);
    screen.getByRole('button', { name: /april 30/i }).focus();

    await userEvent.keyboard('{ArrowRight}');

    const tabbable = within(screen.getByRole('grid'))
      .getAllByRole('button')
      .filter((b) => b.tabIndex === 0);
    expect(tabbable).toHaveLength(1);
    expect(tabbable[0]).toHaveFocus();
    expect(screen.getByRole('grid', { name: /april 2023/i })).toBeInTheDocument();
  });

  it('puts the tab stop on today when the value is in another month', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    try {
      vi.setSystemTime(new Date(2023, 3, 12, 12));
      render(<Calendar label="Date" defaultMonth="2023-04-01" value="2023-02-10" />);
      const tabbable = within(screen.getByRole('grid'))
        .getAllByRole('button')
        .filter((b) => b.tabIndex === 0);
      expect(tabbable).toHaveLength(1);
      expect(tabbable[0]).toHaveAccessibleName(/april 12,/i);
    } finally {
      vi.useRealTimers();
    }
  });

  it('moves the arrow keys from a clicked day, not the derived tab stop', async () => {
    // With no controlled value, a click has to set `focused` itself — nothing
    // else would move the derived tab stop off "first of the month" and onto
    // the day the pointer just landed on.
    render(<Calendar label="Date" defaultMonth="2023-04-01" />);
    await userEvent.click(screen.getByRole('button', { name: /april 10,/i }));

    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /april 11,/i }));
  });
});

describe('Calendar west of UTC', () => {
  // Every date in the grid is a UTC-midnight timestamp. Formatted on a
  // negative-offset zone without pinning UTC, the heading and every cell's name
  // land a day early, and the day a click reports disagrees with the name of
  // the button clicked.
  let original: string | undefined;
  beforeAll(() => {
    original = process.env.TZ;
    process.env.TZ = 'America/Los_Angeles';
  });
  afterAll(() => {
    if (original === undefined) delete process.env.TZ;
    else process.env.TZ = original;
  });

  it('names the month and the days as the dates they are', () => {
    render(<Calendar label="Date" defaultMonth="2023-04-01" />);
    expect(screen.getByRole('grid', { name: /april 2023/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Saturday, April 1, 2023' })).toBeInTheDocument();
  });

  it('reports the day whose name was clicked', async () => {
    const onSelect = vi.fn();
    render(<Calendar label="Date" defaultMonth="2023-04-01" onSelect={onSelect} />);
    await userEvent.click(screen.getByRole('button', { name: 'Wednesday, April 26, 2023' }));
    expect(onSelect).toHaveBeenCalledWith('2023-04-26');
  });

  it('builds every date formatter through dateFormat', () => {
    // The zone is pinned in one place. A formatter constructed anywhere else
    // is one that can forget it.
    const source = readFileSync('src/components/Calendar/Calendar.tsx', 'utf8');
    expect(source).not.toMatch(/new Intl\.DateTimeFormat/);
  });
});

describe('Calendar pagination', () => {
  it('pages the month with the two buttons', async () => {
    const onMonthChange = vi.fn();
    render(
      <Calendar label="Date" defaultMonth="2023-04-01" onMonthChange={onMonthChange} />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Next month' }));
    expect(screen.getByRole('grid', { name: /may 2023/i })).toBeInTheDocument();
    expect(onMonthChange).toHaveBeenLastCalledWith('2023-05-01');

    await userEvent.click(screen.getByRole('button', { name: 'Previous month' }));
    expect(screen.getByRole('grid', { name: /april 2023/i })).toBeInTheDocument();
    expect(onMonthChange).toHaveBeenLastCalledWith('2023-04-01');
  });

  it('keeps the pagination buttons out of the grid', () => {
    // They are not gridcells and must not be reachable by the arrow keys that
    // move between days.
    render(<Calendar label="Date" defaultMonth="2023-04-01" />);
    const next = screen.getByRole('button', { name: 'Next month' });
    expect(next.closest('table')).toBeNull();
  });

  it('disables the button that would leave the allowed months', async () => {
    render(
      <Calendar label="Date" defaultMonth="2023-04-01" min="2023-04-01" max="2023-04-30" />,
    );
    expect(screen.getByRole('button', { name: 'Previous month' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next month' })).toBeDisabled();
  });

  it('enables a month that only overlaps the bounds, not just contains them', () => {
    // min/max (04-10..04-20) is a narrow window that sits entirely inside
    // April, with neither April's first day (04-01) nor its last (04-30)
    // falling inside it. A formula that checks only the target month's own
    // ends against the bounds sees that and wrongly disables April — but
    // April plainly has reachable days in it. Overlap is the right test:
    // March has none (its last day, 03-31, is before min), so "Previous
    // month" stays disabled, while April overlaps, so "Next month" —
    // starting from March — must stay enabled.
    render(
      <Calendar
        label="Date"
        defaultMonth="2023-03-01"
        min="2023-04-10"
        max="2023-04-20"
      />,
    );
    expect(screen.getByRole('button', { name: 'Next month' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Previous month' })).toBeDisabled();
  });

  it('announces the month politely when it changes', () => {
    // The heading is the live region, so paging reports itself without a
    // second element saying the same thing.
    render(<Calendar label="Date" defaultMonth="2023-04-01" />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveAttribute('aria-live', 'polite');
  });
});

describe('Calendar range mode', () => {
  const range = (start: string, end: string) => ({ start, end });

  it('marks the ends selected and paints the days between', () => {
    render(
      <Calendar
        label="Stay"
        mode="range"
        defaultMonth="2023-04-01"
        value={range('2023-04-10', '2023-04-14')}
      />,
    );
    const cellFor = (name: RegExp) =>
      screen.getByRole('button', { name }).closest('td')!;

    expect(cellFor(/april 10/i).className).toContain(styles.rangeStart!);
    expect(cellFor(/april 14/i).className).toContain(styles.rangeEnd!);
    expect(cellFor(/april 12/i).className).toContain(styles.rangeMiddle!);
    expect(cellFor(/april 9/i).className).not.toContain(styles.rangeMiddle!);
  });

  it('reports nothing on the first click and the whole range on the second', async () => {
    // A half-made range is an interaction in progress, not a value: the caller
    // is only ever handed both ends.
    const onSelect = vi.fn();
    render(
      <Calendar label="Stay" mode="range" defaultMonth="2023-04-01" onSelect={onSelect} />,
    );

    await userEvent.click(screen.getByRole('button', { name: /april 10/i }));
    expect(onSelect).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: /april 14/i }));
    expect(onSelect).toHaveBeenCalledOnce();
    expect(onSelect).toHaveBeenCalledWith({ start: '2023-04-10', end: '2023-04-14' });
  });

  it('swaps the ends when the second click precedes the first', async () => {
    // The user expressed an interval, not an order.
    const onSelect = vi.fn();
    render(
      <Calendar label="Stay" mode="range" defaultMonth="2023-04-01" onSelect={onSelect} />,
    );
    await userEvent.click(screen.getByRole('button', { name: /april 14/i }));
    await userEvent.click(screen.getByRole('button', { name: /april 10/i }));
    expect(onSelect).toHaveBeenLastCalledWith({ start: '2023-04-10', end: '2023-04-14' });
  });

  it('previews the range under the pointer while an end is pending', async () => {
    render(<Calendar label="Stay" mode="range" defaultMonth="2023-04-01" />);
    await userEvent.click(screen.getByRole('button', { name: /april 10/i }));
    await userEvent.hover(screen.getByRole('button', { name: /april 14/i }));

    const middle = screen.getByRole('button', { name: /april 12/i }).closest('td')!;
    expect(middle.className).toContain(styles.rangeMiddle!);
  });

  it('drops the pending start on Escape without closing anything', async () => {
    render(<Calendar label="Stay" mode="range" defaultMonth="2023-04-01" />);
    await userEvent.click(screen.getByRole('button', { name: /april 10/i }));
    await userEvent.keyboard('{Escape}');
    await userEvent.hover(screen.getByRole('button', { name: /april 14/i }));

    const middle = screen.getByRole('button', { name: /april 12/i }).closest('td')!;
    expect(middle.className).not.toContain(styles.rangeMiddle!);
  });

  it('drops the pending start on Escape even when focus is off the grid', async () => {
    // Paging to the next month is the natural move for a range that crosses
    // one, and it leaves focus on the pagination button, outside the table.
    const onSelect = vi.fn();
    render(
      <Calendar label="Stay" mode="range" defaultMonth="2023-04-01" onSelect={onSelect} />,
    );
    await userEvent.click(screen.getByRole('button', { name: /april 10/i }));
    await userEvent.click(screen.getByRole('button', { name: 'Next month' }));
    expect(screen.getByRole('button', { name: 'Next month' })).toHaveFocus();

    await userEvent.keyboard('{Escape}');
    await userEvent.click(screen.getByRole('button', { name: /may 3,/i }));

    // Had the start survived, this would be { 2023-04-10, 2023-05-03 }.
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('paints the spilled days that fall inside the range', async () => {
    // The whole reason spilled days are inert AND painted. March 2023 opens on
    // a Wednesday, so a Sunday-start grid leads with 26, 27 and 28 February —
    // and a range that started before February ended has to keep painting
    // through them. Unpainted, the band would break at exactly the boundary
    // the range crosses.
    render(
      <Calendar
        label="Stay"
        mode="range"
        defaultMonth="2023-03-01"
        value={range('2023-02-20', '2023-03-03')}
      />,
    );
    const outside = screen
      .getAllByRole('gridcell')
      .filter((c) => c.className.includes(styles.outside!));

    const painted = outside.filter((c) => c.className.includes(styles.rangeMiddle!));
    // 26, 27 and 28 February are inside the range and drawn in this grid.
    expect(painted).toHaveLength(3);
  });

  it('leaves a painted spilled day out of the tab order and the selection', () => {
    // Painted is a visual continuation, not a control and not a state. The
    // interactive copy of the day lives in the adjacent month.
    render(
      <Calendar
        label="Stay"
        mode="range"
        defaultMonth="2023-03-01"
        value={range('2023-02-20', '2023-03-03')}
      />,
    );
    const painted = screen
      .getAllByRole('gridcell')
      .filter(
        (c) => c.className.includes(styles.outside!) && c.className.includes(styles.rangeMiddle!),
      );
    for (const cell of painted) {
      expect(cell.querySelector('button')).toBeNull();
      expect(cell).not.toHaveAttribute('aria-selected');
    }
  });

  it('announces the range once both ends exist', async () => {
    // Intl.DateTimeFormat#formatRange rather than two formatted dates, so the
    // year is not repeated.
    render(
      <Calendar
        label="Stay"
        mode="range"
        defaultMonth="2023-04-01"
        value={range('2023-04-10', '2023-04-14')}
      />,
    );
    const live = screen.getByRole('status');
    expect(live.textContent).toMatch(/april 10\s*–\s*14, 2023/i);
  });

  it('paints the band as the keyboard extends it, one key at a time', async () => {
    // The preview must be driven by focus, not by re-reading the pre-move
    // state after moveFocus — otherwise it lags a key behind, and PageUp /
    // PageDown (which return early) would never update it at all.
    render(<Calendar label="Stay" mode="range" defaultMonth="2023-04-01" />);
    await userEvent.click(screen.getByRole('button', { name: /april 10/i }));
    await userEvent.keyboard('{ArrowRight}{ArrowRight}');

    const end = screen.getByRole('button', { name: /april 12/i }).closest('td')!;
    const middle = screen.getByRole('button', { name: /april 11/i }).closest('td')!;
    expect(end.className).toContain(styles.rangeEnd!);
    expect(middle.className).toContain(styles.rangeMiddle!);
  });

  it('marks only the committed selection, never the preview, as selected', async () => {
    render(<Calendar label="Stay" mode="range" defaultMonth="2023-04-01" />);
    await userEvent.click(screen.getByRole('button', { name: /april 10/i }));
    await userEvent.hover(screen.getByRole('button', { name: /april 14/i }));

    const middle = screen.getByRole('button', { name: /april 12/i }).closest('td')!;
    expect(middle.className).toContain(styles.rangeMiddle!);
    expect(middle).not.toHaveAttribute('aria-selected');

    const start = screen.getByRole('button', { name: /april 10/i }).closest('td')!;
    expect(start).toHaveAttribute('aria-selected', 'true');
  });

  it('repaints the focus ring gap with the panel inside the band, and never recolours the ring', () => {
    // border/focus resolves to the same colour as interactive/accent, so a
    // ring measured against the panel goes invisible against the band it
    // sits on here. The fix repaints the offset gap between the ring and the
    // pill with the panel colour, rather than recolouring the ring itself.
    const css = stylesheet();
    const rules = [...css.matchAll(/([^{}]*)\{([^}]*)\}/g)];

    const gapFill = rules.filter(
      ([, selector, body]) =>
        selector!.includes('.inRange') &&
        selector!.includes(':focus-visible') &&
        /box-shadow\s*:/.test(body!) &&
        /surface-overlay/.test(body!),
    );
    expect(gapFill.length).toBeGreaterThan(0);

    const recolouredRing = rules.filter(
      ([, selector, body]) =>
        selector!.includes('.inRange') &&
        (/outline-color\s*:/.test(body!) ||
          (/outline\s*:/.test(body!) && !/outline\s*:\s*none/.test(body!))),
    );
    expect(recolouredRing).toHaveLength(0);
  });

  it('gives today a dot the band cannot swallow', () => {
    // .today .dot is accent-on-accent when today falls inside the band, and a
    // preview day carries no .selected to fall back on — the band needs its
    // own rule.
    const css = stylesheet();
    expect(css).toMatch(/\.inRange\s+\.dot\s*\{[^}]*interactive-on-accent/);
  });
});

describe('Calendar stylesheet source', () => {
  const css = stylesheet();

  // Escapes every regex metacharacter in the selector (not just the first, as
  // a naive `.pill` -> `\.pill` would) and anchors the match at a rule
  // boundary — the start of the stripped text, or right after a `}` — so
  // `.inRange .pill` cannot match inside `.outside.inRange .pill`, and
  // `.pill:focus-visible` cannot match inside `.inRange .pill:focus-visible`.
  const block = (selector: string) => {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = new RegExp(`(?:^|\\})\\s*${escaped}\\s*\\{([^}]*)\\}`).exec(css);
    expect(match, `no rule for ${selector}`).not.toBeNull();
    return match![1]!;
  };

  it('paints the range band on the cell and not on the pill', () => {
    // The band spans the full 40px cell. Moving it to .pill would restore the
    // drawing's 32px squares with 8px of panel between them, and nothing else
    // in the suite would notice.
    expect(block('.inRange')).toMatch(/background:\s*var\(--ap-color-interactive-accent\)/);
    expect(block('.inRange .pill')).toMatch(/background:\s*none/);
  });

  it('draws the focus ring outside the pill, at the system offset', () => {
    // Inside, an accent ring on a selected day measures 1.00:1. The offset is
    // what makes it 5.59:1 — it puts the ring on the panel instead of on the
    // fill.
    const focus = block('.pill:focus-visible');
    expect(focus).toMatch(/outline:.*var\(--ap-color-border-focus\)/);
    expect(focus).toMatch(/outline-offset:\s*var\(--ap-focus-ring-offset\)/);
    expect(focus).not.toMatch(/border-color/);
  });

  it('never paints a day hover with surface/sunken', () => {
    // In light the two tokens are byte-identical, so this cannot be caught by
    // looking at the result. In dark, sunken is darker than the panel and the
    // hover reads as a hole.
    expect(css).not.toMatch(/--ap-color-surface-sunken/);
  });

  it('carries no colour literal and references no primitive', () => {
    // The spilled days were the one exception, on gray-light/400, until it
    // measured 7.90:1 on the dark panel. They take text/inert now, which
    // switches with the theme. Any primitive here is drift.
    const literals = css.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
    expect(literals).toEqual([]);
    // rgb()/rgba()/hsl()/hsla() are colour literals by another name.
    expect(css).not.toMatch(/\b(?:rgb|rgba|hsl|hsla)\(/);
    const primitives = css.match(/--ap-(gray|brand|red|green|yellow|blue|alpha|white|black)-[\w-]+/g) ?? [];
    expect(primitives).toEqual([]);
  });
});

describe('Calendar on the server', () => {
  const parseHTML = (html: string) => {
    const parser = new DOMParser();
    return parser.parseFromString(html, 'text/html');
  };

  it('leaves the selection announcement out of the server HTML', () => {
    const html = renderToString(
      <Calendar
        label="Stay"
        mode="range"
        defaultMonth="2023-03-01"
        value={{ start: '2023-02-20', end: '2023-03-03' }}
      />,
    );
    const doc = parseHTML(html);
    const status = doc.querySelector('[role="status"]');
    expect(status).not.toBeNull();
    expect(status!.textContent).toBe('');
  });

  it('leaves today out of the server HTML', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    try {
      vi.setSystemTime(new Date(2023, 3, 12, 12));
      const html = renderToString(<Calendar label="Date" defaultMonth="2023-04-01" />);
      const doc = parseHTML(html);

      const todayCells = [...doc.querySelectorAll('td')].filter((cell) =>
        cell.className.includes(styles.today!),
      );
      expect(todayCells).toHaveLength(0);

      const tabbable = [...doc.querySelectorAll('button[tabindex="0"]')];
      expect(tabbable).toHaveLength(1);
      expect(tabbable[0]!.getAttribute('aria-label')).toMatch(/april 1,/i);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('typed dates', () => {
  it('reads the segment order from the locale', () => {
    expect(segmentOrder('en-US')).toEqual(['month', 'day', 'year']);
    expect(segmentOrder('pt-PT')).toEqual(['day', 'month', 'year']);
  });

  it('builds the placeholder from that order', () => {
    expect(placeholderFor('en-US')).toBe('MM / DD / YYYY');
    expect(placeholderFor('pt-PT')).toBe('DD / MM / YYYY');
  });

  it('parses the locale order', () => {
    // 04/05/2026 is two different days either side of the Atlantic, and
    // neither user is wrong. This is why the order is not hardcoded.
    expect(parseTyped('04/05/2026', 'en-US')).toBe('2026-04-05');
    expect(parseTyped('04/05/2026', 'pt-PT')).toBe('2026-05-04');
  });

  it('accepts ISO in every locale, as the unambiguous escape hatch', () => {
    expect(parseTyped('2026-04-26', 'en-US')).toBe('2026-04-26');
    expect(parseTyped('2026-04-26', 'pt-PT')).toBe('2026-04-26');
  });

  it('is forgiving about separators and padding', () => {
    expect(parseTyped('4-5-2026', 'en-US')).toBe('2026-04-05');
    expect(parseTyped('4 / 5 / 2026', 'en-US')).toBe('2026-04-05');
    expect(parseTyped('04.05.2026', 'en-US')).toBe('2026-04-05');
  });

  it('rejects a date that does not exist rather than rolling it over', () => {
    // 31 February must not silently become 3 March.
    expect(parseTyped('02/31/2026', 'en-US')).toBeNull();
    expect(parseTyped('13/01/2026', 'en-US')).toBeNull();
    expect(parseTyped('not a date', 'en-US')).toBeNull();
    expect(parseTyped('04/05', 'en-US')).toBeNull();
  });

  it('formats a date in the order the locale writes it', () => {
    expect(formatTyped('2026-04-05', 'en-US')).toBe('04 / 05 / 2026');
    expect(formatTyped('2026-04-05', 'pt-PT')).toBe('05 / 04 / 2026');
  });

  it('round-trips formatTyped through parseTyped, in either locale', () => {
    for (const locale of ['en-US', 'pt-PT']) {
      expect(parseTyped(formatTyped('2026-04-05', locale), locale)).toBe('2026-04-05');
    }
  });
});
