import { describe, it, expect } from 'vitest';
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
  toISO,
  weekday,
} from './date';

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
