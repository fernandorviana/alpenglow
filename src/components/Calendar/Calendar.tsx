'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import {
  addDays,
  addMonths,
  clamp,
  compare,
  dateFormat,
  daysInMonth,
  isWithin,
  monthGrid,
  orderRange,
  parts,
  startOfMonth,
  today,
  toISO,
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

/**
 * The chevrons as drawn: a 1.5px stroke on a 12 x 9.33 path inside a 40px box.
 * 1.5 is `border-width/control`, which is what the drawing bound here. Drawn
 * inline from the file's own geometry rather than pulled from Carbon — the
 * same choice `Select` made for its own chevron, and it keeps the library
 * from importing an icon package for two glyphs.
 */
function Chevron({ direction }: { direction: 'previous' | 'next' }) {
  const d =
    direction === 'previous'
      ? 'M21.6 24.6667L16.9333 20L21.6 15.3333'
      : 'M18.4 15.3333L23.0667 20L18.4 24.6667';
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <path
        d={d}
        stroke="currentColor"
        style={{ strokeWidth: 'var(--ap-border-width-control)' }}
        strokeLinejoin="round"
      />
    </svg>
  );
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
  // Intl.DateTimeFormat#formatRange rather than two formatted dates, so the
  // year is not repeated when both ends fall in it.
  const rangeFormat = useMemo(
    () => dateFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' }),
    [locale],
  );

  const { year: visibleYear, month: visibleMonthNumber } = parts(visibleMonth);

  // In single mode `value` is the date; in range mode it is the interval. Both
  // are read through one helper so the cell does not have to know the mode.
  const single = mode === 'single' && typeof value === 'string' ? value : null;
  const rangeValue =
    mode === 'range' && value !== null && typeof value === 'object' ? value : null;

  // The first click of a pair. Held here rather than pushed to the caller,
  // because a half-made range is not a value — it is an interaction in
  // progress, and a caller storing it would have to model that.
  const [pending, setPending] = useState<ISODate | null>(null);
  const [preview, setPreview] = useState<ISODate | null>(null);

  /** The interval to paint: the committed range, or the one being drawn. */
  const painted = (() => {
    if (pending) return preview ? orderRange(pending, preview) : { start: pending, end: pending };
    if (rangeValue?.end) return { start: rangeValue.start, end: rangeValue.end };
    if (rangeValue) return { start: rangeValue.start, end: rangeValue.start };
    return null;
  })();

  function selectRange(date: ISODate) {
    if (pending === null) {
      setPending(date);
      setPreview(null);
      onSelect?.({ start: date, end: null });
      return;
    }
    const ordered = orderRange(pending, date);
    setPending(null);
    setPreview(null);
    onSelect?.(ordered);
  }

  const unavailable = (date: ISODate) =>
    !isWithin(date, min, max) || (isDateUnavailable?.(date) ?? false);

  // The tab stop is derived every render rather than stored and corrected
  // after the fact: `focused` if it is drawn in the visible month, else the
  // selected day if that is drawn — the single value in single mode, or the
  // committed range's start in range mode — else today if that is drawn,
  // else the first of the visible month. The first of the month is NOT
  // clamped to min/max — unavailable days are still focusable buttons with
  // aria-disabled. Deriving it means a controlled `month` that refuses to
  // move, or an initial `focused` outside the drawn month, can never leave
  // the grid with zero tab stops.
  const drawn = (date: ISODate | null): date is ISODate =>
    date !== null && startOfMonth(date) === visibleMonth;
  const [focused, setFocused] = useState<ISODate | null>(null);
  const selectedDay = mode === 'range' ? (rangeValue?.start ?? null) : single;
  const tabStop = drawn(focused)
    ? focused
    : drawn(selectedDay)
      ? selectedDay
      : drawn(now)
        ? now
        : visibleMonth;

  // Focus follows the roving tabindex, but only after the user has moved it —
  // mounting the calendar must not steal focus from the page. No dependency
  // array: it must run after every render so DOM focus follows wherever the
  // derivation above put the tab stop, not just after `focused` changes.
  const shouldRestoreFocus = useRef(false);
  const gridRef = useRef<HTMLTableElement>(null);

  useEffect(() => {
    if (!shouldRestoreFocus.current) return;
    shouldRestoreFocus.current = false;
    gridRef.current?.querySelector<HTMLButtonElement>('button[tabindex="0"]')?.focus();
  });

  // The single place the month changes. Both the arrow-key paging in
  // `moveFocus` and the Previous/Next buttons below route through this, so
  // there is exactly one call to `setInternalMonth`/`onMonthChange` to reason
  // about.
  function goToMonth(target: ISODate) {
    const first = startOfMonth(target);
    if (month === undefined) setInternalMonth(first);
    onMonthChange?.(first);
  }

  function moveFocus(next: ISODate) {
    const target = clamp(next, min, max);
    shouldRestoreFocus.current = true;
    setFocused(target);

    // A move that leaves the visible month pages the grid. This is what makes
    // the spilled days unnecessary as controls.
    const targetMonth = startOfMonth(target);
    if (targetMonth !== visibleMonth) goToMonth(targetMonth);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTableElement>) {
    if (event.key === 'Escape' && pending !== null) {
      // Cancels the half-made range. The dialog's own Escape handler in
      // DatePicker checks the same state, so the first Escape drops the
      // pending start and only the second closes the panel.
      event.stopPropagation();
      setPending(null);
      setPreview(null);
      return;
    }

    const keys: Record<string, () => ISODate> = {
      ArrowLeft: () => addDays(tabStop, -1),
      ArrowRight: () => addDays(tabStop, 1),
      ArrowUp: () => addDays(tabStop, -7),
      ArrowDown: () => addDays(tabStop, 7),
      Home: () => addDays(tabStop, -((weekday(tabStop) - weekStartsOn + 7) % 7)),
      End: () => addDays(tabStop, 6 - ((weekday(tabStop) - weekStartsOn + 7) % 7)),
    };

    if (event.key === 'PageUp' || event.key === 'PageDown') {
      const step = event.key === 'PageDown' ? 1 : -1;
      event.preventDefault();
      moveFocus(addMonths(tabStop, event.shiftKey ? step * 12 : step));
      return;
    }

    const move = keys[event.key];
    if (!move) return;
    event.preventDefault();
    moveFocus(move());
  }

  // The band to paint on a given day: none, or the class set for whichever
  // part of the interval it falls on. Spilled days call this too — that is
  // the inert-but-painted rule — so it cannot assume it is only ever called
  // for an in-month cell.
  function rangeClasses(date: ISODate): string[] {
    if (!painted) return [];
    const isStart = date === painted.start;
    const isEnd = date === painted.end;
    const inside = compare(date, painted.start) > 0 && compare(date, painted.end) < 0;
    if (!isStart && !isEnd && !inside) return [];
    return [
      styles.inRange!,
      isStart && styles.rangeStart,
      isEnd && styles.rangeEnd,
      inside && styles.rangeMiddle,
    ].filter(Boolean) as string[];
  }

  // Called directly rather than declared as a component: a function declared
  // in the render body is a new component type on every render, so React
  // would unmount and remount all 42 cells each time. That destroys keyboard
  // focus, and Task 6 adds a hover handler that re-renders without restoring
  // it. Kept local because it closes over the formatters and props here, and
  // splitting it into its own file would separate the cell from the state
  // matrix that decides how it paints.
  function renderDay(cell: CalendarCell) {
    const classes = [styles.cell, cell.outside && styles.outside, ...rangeClasses(cell.date)]
      .filter(Boolean)
      .join(' ');
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

    // In range mode, only the committed selection is `aria-selected` and
    // `.selected` — while a start is pending, that is the pending day alone;
    // otherwise it is the committed interval. A preview under the pointer or
    // the keyboard is painted by `rangeClasses` but is not a selection: it is
    // not yet chosen, and marking it selected would tell a screen reader a
    // choice was made before the second click confirms one.
    const isSelected =
      mode === 'range'
        ? pending !== null
          ? cell.date === pending
          : rangeValue !== null &&
            compare(cell.date, rangeValue.start) >= 0 &&
            compare(cell.date, rangeValue.end ?? rangeValue.start) <= 0
        : single === cell.date;
    const isToday = cell.date === now;
    const isUnavailable = unavailable(cell.date);

    const dayClasses = [
      styles.cell,
      isToday && styles.today,
      isSelected && styles.selected,
      isUnavailable && styles.unavailable,
      ...rangeClasses(cell.date),
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
          tabIndex={tabStop === cell.date ? 0 : -1}
          onFocus={() => {
            // The single source of `focused` and of the keyboard preview: it
            // covers both a click (which focuses the button before its own
            // click handler runs) and the roving-tabindex effect restoring
            // focus after an arrow move, so neither path needs its own copy
            // of this update.
            setFocused(cell.date);
            if (pending !== null) setPreview(cell.date);
          }}
          onMouseEnter={() => {
            if (pending !== null) setPreview(cell.date);
          }}
          onClick={() => {
            // aria-disabled does not stop a click, which is the point: the day
            // is reachable. Refusing here is what makes it unpickable.
            if (isUnavailable) return;
            if (mode === 'range') selectRange(cell.date);
            else onSelect?.(cell.date);
          }}
        >
          <span aria-hidden="true">{parts(cell.date).day}</span>
          {isToday && <span className={styles.dot} aria-hidden="true" />}
        </button>
      </td>
    );
  }

  // A month is reachable if any day in it is: the two intervals — the
  // month's own [first, last] and the allowed [min, max] — overlap. Checking
  // only whether the month's own ends fall inside the bounds (or vice versa)
  // is wrong whenever one interval sits strictly inside the other, e.g. a
  // month that fully contains a narrow [min, max] window.
  const previousMonth = addMonths(visibleMonth, -1);
  const nextMonth = addMonths(visibleMonth, 1);
  const canGo = (target: ISODate) => {
    const { year, month: m } = parts(target);
    const last = toISO(year, m, daysInMonth(year, m));
    const notAfterMax = max === undefined || compare(target, max) <= 0;
    const notBeforeMin = min === undefined || compare(last, min) >= 0;
    return notAfterMax && notBeforeMin;
  };

  return (
    <div className={styles.calendar}>
      <div className={styles.header}>
        <button
          type="button"
          className={styles.page}
          aria-label="Previous month"
          disabled={!canGo(previousMonth)}
          onClick={() => goToMonth(previousMonth)}
        >
          <Chevron direction="previous" />
        </button>

        <h2 className={styles.heading} id={headingId} aria-live="polite">
          {/* One heading, two weights: the drawing sets the month Medium and
              the year Regular. Split into spans rather than two headings so
              it is still one string to a screen reader. */}
          <span className={styles.month}>{monthFormat.format(utcTimestamp(visibleMonth))}</span>{' '}
          <span className={styles.year}>{visibleYear}</span>
        </h2>

        <button
          type="button"
          className={styles.page}
          aria-label="Next month"
          disabled={!canGo(nextMonth)}
          onClick={() => goToMonth(nextMonth)}
        >
          <Chevron direction="next" />
        </button>
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

      {/* role="status" is an implicit aria-live="polite". Separate from the
          month heading so paging and selecting do not overwrite each other. */}
      <div role="status" className={styles.hidden}>
        {mode === 'range' && rangeValue?.end
          ? rangeFormat.formatRange(utcTimestamp(rangeValue.start), utcTimestamp(rangeValue.end))
          : mode === 'single' && single
            ? cellFormat.format(utcTimestamp(single))
            : ''}
      </div>
    </div>
  );
}
