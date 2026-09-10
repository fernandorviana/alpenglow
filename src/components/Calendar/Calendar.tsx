'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import {
  addDays,
  addMonths,
  clamp,
  dateFormat,
  isWithin,
  monthGrid,
  parts,
  startOfMonth,
  today,
  utcTimestamp,
  weekday,
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
  /** `ISODate` in single mode, `DateRange` in range mode. */
  value?: ISODate | DateRange | null;
  onSelect?: (next: ISODate | DateRange | null) => void;
  /** Inclusive bounds. Days outside them are disabled. */
  min?: ISODate;
  max?: ISODate;
  /**
   * Per-day exclusion — closed days, booked days. Called only for days in the
   * visible month, because the spilled ones are inert and the answer would go
   * unread.
   */
  isDateUnavailable?: (date: ISODate) => boolean;
};

/** The seven column headers, in the order the grid draws them. */
function useWeekdayNames(locale: string, weekStartsOn: number) {
  return useMemo(() => {
    const narrow = dateFormat(locale, { weekday: 'narrow' });
    const long = dateFormat(locale, { weekday: 'long' });
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
  value,
  onSelect,
  min,
  max,
  isDateUnavailable,
}: CalendarProps) {
  const headingId = useId();

  const now = today();

  // The starting month, resolved once: an explicit `defaultMonth` wins, else
  // the month of a single-mode value, else the month of a range's start, else
  // today's month. A controlled `month` prop still wins for what is visible —
  // this only seeds the uncontrolled fallback and the initial focus below.
  const resolvedMonth = startOfMonth(
    defaultMonth ??
      (typeof value === 'string'
        ? value
        : value && typeof value === 'object' && 'start' in value
          ? value.start
          : now),
  );

  // The visible month and the selection are two different pieces of state.
  // Conflating them is what makes a range across a month boundary hard to
  // reason about, so they are controlled separately.
  const [internalMonth, setInternalMonth] = useState(() => resolvedMonth);
  const visibleMonth = startOfMonth(month ?? internalMonth);

  const weekdays = useWeekdayNames(locale, weekStartsOn);
  const grid = useMemo(() => monthGrid(visibleMonth, weekStartsOn), [visibleMonth, weekStartsOn]);

  const monthFormat = useMemo(
    () => dateFormat(locale, { month: 'long' }),
    [locale],
  );
  const headingFormat = useMemo(
    () => dateFormat(locale, { month: 'long', year: 'numeric' }),
    [locale],
  );
  const cellFormat = useMemo(
    () =>
      dateFormat(locale, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    [locale],
  );

  const { year: visibleYear, month: visibleMonthNumber } = parts(visibleMonth);

  // In single mode `value` is the date; in range mode it is the interval. Both
  // are read through one helper so the cell does not have to know the mode.
  const single = mode === 'single' && typeof value === 'string' ? value : null;

  const unavailable = (date: ISODate) =>
    !isWithin(date, min, max) || (isDateUnavailable?.(date) ?? false);

  // The one cell in the tab order. Initialised to the selection, else today if
  // today is in the visible month, else the first of it — the same order the
  // dialog uses to place focus when it opens.
  const [focused, setFocused] = useState<ISODate>(() => {
    if (typeof value === 'string') return value;
    if (
      parts(now).month === parts(resolvedMonth).month &&
      parts(now).year === parts(resolvedMonth).year
    ) {
      return now;
    }
    return resolvedMonth;
  });

  // Focus follows the roving tabindex, but only after the user has moved it —
  // mounting the calendar must not steal focus from the page.
  const shouldRestoreFocus = useRef(false);
  const gridRef = useRef<HTMLTableElement>(null);

  useEffect(() => {
    if (!shouldRestoreFocus.current) return;
    shouldRestoreFocus.current = false;
    gridRef.current
      ?.querySelector<HTMLButtonElement>(`button[data-date="${focused}"]`)
      ?.focus();
  }, [focused]);

  function moveFocus(next: ISODate) {
    const target = clamp(next, min, max);
    shouldRestoreFocus.current = true;
    setFocused(target);

    // A move that leaves the visible month pages the grid. This is what makes
    // the spilled days unnecessary as controls.
    const targetMonth = startOfMonth(target);
    if (targetMonth !== visibleMonth) {
      if (month === undefined) setInternalMonth(targetMonth);
      onMonthChange?.(targetMonth);
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLTableElement>) {
    const keys: Record<string, () => ISODate> = {
      ArrowLeft: () => addDays(focused, -1),
      ArrowRight: () => addDays(focused, 1),
      ArrowUp: () => addDays(focused, -7),
      ArrowDown: () => addDays(focused, 7),
      Home: () => addDays(focused, -((weekday(focused) - weekStartsOn + 7) % 7)),
      End: () => addDays(focused, 6 - ((weekday(focused) - weekStartsOn + 7) % 7)),
    };

    if (event.key === 'PageUp' || event.key === 'PageDown') {
      const step = event.key === 'PageDown' ? 1 : -1;
      event.preventDefault();
      moveFocus(addMonths(focused, event.shiftKey ? step * 12 : step));
      return;
    }

    const move = keys[event.key];
    if (!move) return;
    event.preventDefault();
    moveFocus(move());
  }

  // Keep `focused` inside the visible month when the month changes from
  // outside — paging via a future control, or a controlled `month` prop.
  useEffect(() => {
    if (startOfMonth(focused) !== visibleMonth) {
      setFocused(clamp(visibleMonth, min, max));
    }
    // `focused` is deliberately absent: this corrects focus when the MONTH
    // moves, and including it would fight moveFocus, which moves both.
  }, [visibleMonth, min, max]);

  // Called directly rather than declared as a component: a function declared
  // in the render body is a new component type on every render, so React
  // would unmount and remount all 42 cells each time. That destroys keyboard
  // focus, and Task 6 adds a hover handler that re-renders without restoring
  // it. Kept local because it closes over the formatters and props here, and
  // splitting it into its own file would separate the cell from the state
  // matrix that decides how it paints.
  function renderDay(cell: CalendarCell) {
    const classes = [styles.cell, cell.outside && styles.outside].filter(Boolean).join(' ');
    const name = cellFormat.format(utcTimestamp(cell.date));

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

    const isSelected = single === cell.date;
    const isToday = cell.date === now;
    const isUnavailable = unavailable(cell.date);

    const dayClasses = [
      styles.cell,
      isToday && styles.today,
      isSelected && styles.selected,
      isUnavailable && styles.unavailable,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <td
        key={cell.date}
        role="gridcell"
        className={dayClasses}
        aria-selected={isSelected || undefined}
      >
        <button
          type="button"
          className={styles.pill}
          aria-label={name}
          aria-disabled={isUnavailable || undefined}
          data-date={cell.date}
          tabIndex={focused === cell.date ? 0 : -1}
          onClick={() => {
            // aria-disabled does not stop a click, which is the point: the day
            // is reachable. Refusing here is what makes it unpickable.
            if (isUnavailable) return;
            onSelect?.(cell.date);
          }}
        >
          <span aria-hidden="true">{parts(cell.date).day}</span>
          {isToday && <span className={styles.dot} aria-hidden="true" />}
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
          <span className={styles.month}>{monthFormat.format(utcTimestamp(visibleMonth))}</span>{' '}
          <span className={styles.year}>{visibleYear}</span>
        </h2>
      </div>

      <table
        ref={gridRef}
        role="grid"
        className={styles.grid}
        aria-label={`${label}, ${headingFormat.format(utcTimestamp(visibleMonth))}`}
        onKeyDown={onKeyDown}
      >
        <thead>
          <tr>
            {weekdays.map((day) => (
              <th key={day.long} scope="col" className={styles.weekday}>
                {/* The visible glyph is one letter and two of the seven are S. The name a
                    screen reader gets is the whole weekday, so the letter is aria-hidden.
                    Not CSS generated content: ::before text is part of accessible-name
                    computation (accname 1.2, step 2F.ii) in every major browser, so it
                    would put the letter back into the name — and jsdom cannot see it, so
                    no render test would notice. */}
                <span aria-hidden="true">{day.narrow}</span>
                <span className={styles.hidden}>{day.long}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grid.map((week) => (
            <tr key={week[0]!.date}>
              {week.map((cell) => renderDay(cell))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
