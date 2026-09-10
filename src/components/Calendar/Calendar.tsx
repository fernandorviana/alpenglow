'use client';

import { useId, useMemo, useState } from 'react';
import {
  monthGrid,
  parts,
  startOfMonth,
  toISO,
  type CalendarCell,
  type ISODate,
} from './date';
import styles from './Calendar.module.css';

export type { ISODate } from './date';

export type CalendarMode = 'single' | 'range';
export type DateRange = { start: ISODate; end: ISODate | null };

export type CalendarProps = {
  /** Required. The grid's accessible name. */
  label: string;
  /** Defaults to 'single'. */
  mode?: CalendarMode;
  /** The visible month; the day is ignored. Uncontrolled if omitted. */
  month?: ISODate;
  defaultMonth?: ISODate;
  onMonthChange?: (next: ISODate) => void;
  /**
   * 0 = Sunday, as drawn. Deliberately NOT derived from `locale`:
   * `Intl.Locale#getWeekInfo` reports firstDay 7 for pt-PT, where the week
   * starts on Monday, so deriving it would be silently wrong for most of
   * Europe in a way that looks like a rendering bug.
   */
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /** Drives month and weekday names and every cell's accessible name. */
  locale?: string;
};

/** The seven column headers, in the order the grid draws them. */
function useWeekdayNames(locale: string, weekStartsOn: number) {
  return useMemo(() => {
    const narrow = new Intl.DateTimeFormat(locale, { weekday: 'narrow' });
    const long = new Intl.DateTimeFormat(locale, { weekday: 'long' });
    // 2023-01-01 was a Sunday, so index 0 of this week is weekday 0.
    return Array.from({ length: 7 }, (_, i) => {
      const day = Date.UTC(2023, 0, 1 + ((weekStartsOn + i) % 7));
      return { narrow: narrow.format(day), long: long.format(day) };
    });
  }, [locale, weekStartsOn]);
}

export function Calendar({
  label,
  mode = 'single',
  month,
  defaultMonth,
  onMonthChange,
  weekStartsOn = 0,
  locale = 'en-US',
}: CalendarProps) {
  const headingId = useId();

  // The visible month and the selection are two different pieces of state.
  // Conflating them is what makes a range across a month boundary hard to
  // reason about, so they are controlled separately.
  const [internalMonth, setInternalMonth] = useState(
    () => startOfMonth(defaultMonth ?? toISO(2026, 1, 1)),
  );
  const visibleMonth = startOfMonth(month ?? internalMonth);

  const weekdays = useWeekdayNames(locale, weekStartsOn);
  const grid = useMemo(() => monthGrid(visibleMonth, weekStartsOn), [visibleMonth, weekStartsOn]);

  const monthFormat = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: 'long' }),
    [locale],
  );
  const headingFormat = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }),
    [locale],
  );
  const cellFormat = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    [locale],
  );

  const { year: visibleYear, month: visibleMonthNumber } = parts(visibleMonth);
  const utc = (date: ISODate) => {
    const { year, month: m, day } = parts(date);
    return Date.UTC(year, m - 1, day);
  };

  // Called directly rather than declared as a component: a function declared
  // in the render body is a new component type on every render, so React
  // would unmount and remount all 42 cells each time. That destroys keyboard
  // focus, and Task 6 adds a hover handler that re-renders without restoring
  // it. Kept local because it closes over the formatters and props here, and
  // splitting it into its own file would separate the cell from the state
  // matrix that decides how it paints.
  function renderDay(cell: CalendarCell) {
    const classes = [styles.cell, cell.outside && styles.outside].filter(Boolean).join(' ');
    const name = cellFormat.format(utc(cell.date));

    if (cell.outside) {
      // Inert: no button, no tab stop, and the number hidden so a screen
      // reader in browse mode is not read a run of bare digits belonging to a
      // month it was not told about. The gridcell stays so the grid's geometry
      // is intact.
      return (
        <td key={cell.date} role="gridcell" className={classes}>
          <span className={styles.pill} aria-hidden="true">
            {parts(cell.date).day}
          </span>
        </td>
      );
    }

    return (
      <td key={cell.date} role="gridcell" className={classes}>
        <button type="button" className={styles.pill} aria-label={name}>
          <span aria-hidden="true">{parts(cell.date).day}</span>
        </button>
      </td>
    );
  }

  return (
    <div className={styles.calendar}>
      <div className={styles.header}>
        <h2 className={styles.heading} id={headingId} aria-live="polite">
          {/* One heading, two weights: the drawing sets the month Medium and
              the year Regular. Split into spans rather than two headings so
              it is still one string to a screen reader. */}
          <span className={styles.month}>{monthFormat.format(utc(visibleMonth))}</span>{' '}
          <span className={styles.year}>{visibleYear}</span>
        </h2>
      </div>

      <table
        role="grid"
        className={styles.grid}
        aria-label={`${label}, ${headingFormat.format(utc(visibleMonth))}`}
      >
        <thead>
          <tr>
            {weekdays.map((day) => (
              <th
                key={day.long}
                scope="col"
                className={styles.weekday}
                data-narrow={day.narrow}
              >
                {/* The visible glyph is drawn from `data-narrow` by the
                    stylesheet's `::before`, which is not a DOM text node — an
                    `aria-hidden` sibling span would still show up in
                    `.textContent`, concatenated with the name below it. This
                    way `.textContent` (and the accessible name) is exactly
                    the full weekday: the visible glyph is one letter and two
                    of the seven are S, so a screen reader must never rely on
                    it. */}
                <span className={styles.hidden}>{day.long}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grid.map((week) => (
            <tr key={week[0]!.date} className={styles.week}>
              {week.map((cell) => renderDay(cell))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
