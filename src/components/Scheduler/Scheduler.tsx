'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { CSSProperties, KeyboardEvent, ReactNode } from 'react';
import { addDays, dateFormat, startOfWeek, today, utcTimestamp } from '../Calendar/date';
import type { ISODate } from '../Calendar/date';
import { MINUTES_IN_DAY, formatTime, formatTimeRange, hourLabels, minutesFrom, parseDateTime, toDateTime } from './time';
import type { Hours, ISODateTime } from './time';
import { lanes } from './layout';
import hidden from '../visuallyHidden.module.css';
import styles from './Scheduler.module.css';

export type { ISODateTime } from './time';
export type SchedulerHours = Hours;

export const schedulerViews = ['day', 'week'] as const;
export type SchedulerView = (typeof schedulerViews)[number];

export const schedulerKinds = ['confirmed', 'pending', 'cancelled', 'blocker', 'external', 'availability'] as const;
export type SchedulerKind = (typeof schedulerKinds)[number];

/** `accent` is the theme's own; the six hues are the `category/*` tokens. */
export const schedulerTones = ['accent', 'glacier', 'moss', 'amber', 'ember', 'glow', 'flare'] as const;
export type SchedulerTone = (typeof schedulerTones)[number];

export type SchedulerEvent = {
  id: string;
  title: string;
  /** Wall clock, 'YYYY-MM-DDTHH:MM'. An event over midnight is clipped to each day it touches. */
  start: ISODateTime;
  end: ISODateTime;
  /** The column, in a day view with `resources`. Without one the event is shown in none of them. */
  resourceId?: string;
  /** `confirmed` by default. */
  kind?: SchedulerKind;
  /** Its resource's, or `accent`. */
  tone?: SchedulerTone;
  /** In the 24 circle, from an hour up. */
  icon?: ReactNode;
  /** In the All-day row, by its start's date. */
  allDay?: boolean;
};

export type SchedulerResource = {
  id: string;
  name: string;
  /** Beside the name in the column's header: an Avatar. */
  avatar?: ReactNode;
  /** Paints the resource's events unless an event names its own. */
  tone?: SchedulerTone;
  /** Paints the hours outside it as off hours, over the component's own. */
  workingHours?: Hours;
};

export type SchedulerProps = {
  /** Required. The region's accessible name. */
  label: string;
  /** 'week' by default. */
  view?: SchedulerView;
  /** The day, or the day the week is found from. */
  date: ISODate;
  /** 0 = Sunday, as the Calendar. */
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /** Columns in the week: 7, or 5 for a working week. Week view only. */
  days?: number;
  /** One column per person. Day view only; ignored in a week. */
  resources?: readonly SchedulerResource[];
  events: readonly SchedulerEvent[];
  selectedId?: string | null;
  onSelect?: (event: SchedulerEvent) => void;
  /** The hours the column shows, 0 to 24 by default. */
  hours?: Hours;
  /** Paints the hours outside it. */
  workingHours?: Hours;
  /** Draws the now line there; `null` draws none; left out, the clock after hydration. */
  now?: ISODateTime | null;
  locale?: string;
  /** In the corner over the hours: the zone, "WET". */
  zoneLabel?: ReactNode;
  /** 'All-day'. */
  allDayLabel?: string;
  /** The word in each event's accessible name, by kind. */
  kindLabels?: Partial<Record<SchedulerKind, string>>;
  /** A length; the region scrolls past it. */
  maxHeight?: number | string;
  /** The hour at the top when the region opens: `workingHours.start`, or the first event's, or `hours.start`. */
  scrollTo?: number;
  /** Adds to the card, under the time. Seen, not read: the event's accessible name is its title, its time and its kind. */
  renderEvent?: (event: SchedulerEvent) => ReactNode;
  className?: string;
};

const KIND_LABELS: Record<SchedulerKind, string> = {
  confirmed: 'Confirmed',
  pending: 'Pending approval',
  cancelled: 'Cancelled',
  blocker: 'Time blocker',
  external: 'External event',
  availability: 'Available',
};

/** The drawn quarter-hour card is 24 tall; an event shorter than a quarter still takes that. */
const MIN_MINUTES = 15;

type Column = {
  key: string;
  date: ISODate;
  resource?: SchedulerResource;
  workingHours?: Hours;
};

type Placed = {
  event: SchedulerEvent;
  /** Minutes from the column's first hour. */
  from: number;
  to: number;
  lane: number;
  lanes: number;
};

type Laid = {
  column: Column;
  allDay: SchedulerEvent[];
  timed: Placed[];
};

/** The local clock as a wall-clock string. */
function readClock(): ISODateTime {
  const now = new Date();
  return toDateTime(today(), now.getHours() * 60 + now.getMinutes());
}

/**
 * The clock to the minute, as an external store: `null` on the server and in
 * the hydration pass, so the server draws no now line and the client adds
 * it; then the minute, re-read at each change of minute.
 */
function useClock(enabled: boolean): ISODateTime | null {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!enabled) return () => {};
      let interval: ReturnType<typeof setInterval> | undefined;
      const timeout = setTimeout(() => {
        onChange();
        interval = setInterval(onChange, 60_000);
      }, 60_000 - (Date.now() % 60_000));
      return () => {
        clearTimeout(timeout);
        if (interval) clearInterval(interval);
      };
    },
    [enabled],
  );
  return useSyncExternalStore(
    subscribe,
    () => (enabled ? readClock() : null),
    () => null,
  );
}

export function Scheduler({
  label,
  view = 'week',
  date,
  weekStartsOn = 0,
  days = 7,
  resources,
  events,
  selectedId,
  onSelect,
  hours = { start: 0, end: 24 },
  workingHours,
  now,
  locale = 'en-US',
  zoneLabel,
  allDayLabel = 'All-day',
  kindLabels,
  maxHeight,
  scrollTo,
  renderEvent,
  className,
}: SchedulerProps) {
  const uid = useId();
  const region = useRef<HTMLDivElement>(null);
  const buttons = useRef(new Map<string, HTMLButtonElement>());

  // The clock is read only when no `now` is given.
  const clock = useClock(now === undefined);
  const current = now !== undefined ? now : clock;
  const todayDate = current ? parseDateTime(current)?.date : undefined;

  const columns = useMemo<Column[]>(() => {
    if (view === 'day' && resources && resources.length > 0) {
      return resources.map((resource) => ({
        key: resource.id,
        date,
        resource,
        workingHours: resource.workingHours ?? workingHours,
      }));
    }
    const count = view === 'day' ? 1 : Math.max(1, Math.floor(days));
    const first = view === 'day' ? date : startOfWeek(date, weekStartsOn);
    return Array.from({ length: count }, (_, i) => {
      const day = addDays(first, i);
      return { key: day, date: day, workingHours };
    });
  }, [view, resources, date, days, weekStartsOn, workingHours]);

  const first = hours.start * 60;
  const last = hours.end * 60;

  const laid = useMemo<Laid[]>(
    () =>
      columns.map((column) => {
        const own = column.resource
          ? events.filter((event) => event.resourceId === column.resource!.id)
          : events;
        const allDay: SchedulerEvent[] = [];
        const spans: { event: SchedulerEvent; from: number; to: number }[] = [];
        for (const event of own) {
          if (event.allDay) {
            if (parseDateTime(event.start)?.date === column.date) allDay.push(event);
            continue;
          }
          const start = minutesFrom(column.date, event.start);
          const end = minutesFrom(column.date, event.end);
          if (start === null || end === null) continue;
          // Clipped to the column's day and to its hours; shown only if any of it lands inside.
          const from = Math.max(start, 0, first);
          const to = Math.min(Math.max(end, start + MIN_MINUTES), MINUTES_IN_DAY, last);
          if (to <= from) continue;
          spans.push({ event, from: from - first, to: to - first });
        }
        const placed = lanes(spans.map((span) => ({ start: span.from, end: span.to })));
        return {
          column,
          allDay,
          timed: spans
            .map((span, i) => ({ ...span, ...placed[i]! }))
            .sort((a, b) => a.from - b.from || b.to - a.to),
        };
      }),
    [columns, events, first, last],
  );

  // Where the tab stop is: the selected event, or the first there is. Held
  // by id so that a re-render with new events keeps the reader's place.
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const order = useMemo(
    () => laid.map((l) => [...l.allDay.map((e) => e.id), ...l.timed.map((p) => p.event.id)]),
    [laid],
  );
  const known = useMemo(() => new Set(order.flat()), [order]);
  const tabStop =
    focusedId && known.has(focusedId)
      ? focusedId
      : selectedId && known.has(selectedId)
        ? selectedId
        : (order.find((ids) => ids.length > 0)?.[0] ?? null);

  const move = (to: string | null) => {
    if (!to) return;
    setFocusedId(to);
    buttons.current.get(to)?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const id = target.dataset.event;
    if (!id) return;
    const col = order.findIndex((ids) => ids.includes(id));
    if (col === -1) return;
    const ids = order[col]!;
    const at = ids.indexOf(id);
    const from = laid[col]!.timed.find((p) => p.event.id === id)?.from ?? -1;
    const sideways = (step: number) => {
      for (let c = col + step; c >= 0 && c < order.length; c += step) {
        const next = laid[c]!;
        if (order[c]!.length === 0) continue;
        if (from < 0) return order[c]![0]!;
        // The nearest by start in the column that has one; an all-day event if it has only those.
        let best: Placed | null = null;
        for (const p of next.timed) {
          if (!best || Math.abs(p.from - from) < Math.abs(best.from - from)) best = p;
        }
        return best ? best.event.id : order[c]![0]!;
      }
      return null;
    };
    const keys: Record<string, () => string | null> = {
      ArrowDown: () => ids[at + 1] ?? null,
      ArrowUp: () => ids[at - 1] ?? null,
      ArrowRight: () => sideways(1),
      ArrowLeft: () => sideways(-1),
      Home: () => ids[0]!,
      End: () => ids[ids.length - 1]!,
    };
    const next = keys[e.key];
    if (!next) return;
    e.preventDefault();
    move(next());
  };

  // Opens at the working day, as the drawing does, rather than at midnight.
  useEffect(() => {
    const el = region.current;
    if (!el) return;
    const firstEvent = laid.flatMap((l) => l.timed).reduce<number | null>((m, p) => (m === null || p.from < m ? p.from : m), null);
    const hour = scrollTo ?? workingHours?.start ?? (firstEvent === null ? hours.start : hours.start + Math.floor(firstEvent / 60));
    const body = el.querySelector<HTMLElement>(`.${styles.body}`);
    if (!body || body.offsetHeight === 0) return;
    const perHour = body.offsetHeight / (hours.end - hours.start);
    el.scrollTop = Math.max(0, (hour - hours.start) * perHour);
    // Runs when the view or the day changes, which is when the reader is
    // taken somewhere new; not on every event.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, date, resources?.length]);

  const labels = useMemo(() => hourLabels(locale, hours), [locale, hours.start, hours.end]); // eslint-disable-line react-hooks/exhaustive-deps
  const shortDay = useMemo(() => dateFormat(locale, { weekday: 'short' }), [locale]);
  const longDay = useMemo(() => dateFormat(locale, { weekday: 'long', month: 'long', day: 'numeric' }), [locale]);
  const dayNumber = useMemo(() => dateFormat(locale, { day: 'numeric' }), [locale]);

  // The dot sits at the start of the first column of today: one in a week,
  // and one rather than one per person in a day of resources.
  const dotKey = columns.find((c) => c.date === todayDate)?.key;
  const nowAt = (() => {
    if (!current) return null;
    const parsed = parseDateTime(current);
    if (!parsed) return null;
    if (!columns.some((c) => c.date === parsed.date)) return null;
    if (parsed.minutes < first || parsed.minutes > last) return null;
    return parsed.minutes - first;
  })();

  const rootStyle = {
    '--scheduler-columns': columns.length,
    '--scheduler-hours': hours.end - hours.start,
    ...(maxHeight !== undefined && { '--scheduler-max-height': typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight }),
  } as CSSProperties;

  const kindOf = (event: SchedulerEvent) => event.kind ?? 'confirmed';
  const toneOf = (event: SchedulerEvent, column: Column) => event.tone ?? column.resource?.tone ?? 'accent';
  // Wall-clock strings of one shape compare as text. An all-day event is
  // past once its day is, not at the midnight its `end` names.
  const isPast = (event: SchedulerEvent) =>
    event.allDay
      ? todayDate !== undefined && (parseDateTime(event.start)?.date ?? '') < todayDate
      : !!current && event.end <= current;

  const card = (event: SchedulerEvent, column: Column, placed?: Placed) => {
    const kind = kindOf(event);
    const range = placed ? formatTimeRange(locale, first + placed.from, first + placed.to) : allDayLabel;
    const duration = placed ? placed.to - placed.from : 0;
    const past = isPast(event);
    const selected = selectedId === event.id;
    const style = placed
      ? ({
          '--event-from': placed.from,
          '--event-to': placed.to,
          '--event-lane': placed.lane,
          '--event-lanes': placed.lanes,
        } as CSSProperties)
      : undefined;
    return (
      <li key={event.id} className={placed ? styles.slot : styles.allDaySlot} style={style}>
        <button
          type="button"
          ref={(el) => {
            if (el) buttons.current.set(event.id, el);
            else buttons.current.delete(event.id);
          }}
          data-event={event.id}
          tabIndex={tabStop === event.id ? 0 : -1}
          className={[
            styles.event,
            styles[kind],
            styles[toneOf(event, column)],
            placed && duration < 30 && styles.brief,
            placed && duration >= 30 && duration < 60 && styles.short,
            past && styles.past,
            selected && styles.selected,
          ]
            .filter(Boolean)
            .join(' ')}
          aria-current={selected ? 'true' : undefined}
          aria-label={`${event.title}, ${range}, ${kindLabels?.[kind] ?? KIND_LABELS[kind]}`}
          onClick={() => {
            setFocusedId(event.id);
            onSelect?.(event);
          }}
          onFocus={() => setFocusedId(event.id)}
        >
          <span className={styles.title}>{event.title}</span>
          {placed && <span className={[styles.time, duration < 30 && hidden.hidden].filter(Boolean).join(' ')}>{range}</span>}
          {placed && duration >= 60 && event.icon && (
            <span className={styles.icon} aria-hidden="true">
              {event.icon}
            </span>
          )}
          {renderEvent && <span className={styles.extra}>{renderEvent(event)}</span>}
        </button>
      </li>
    );
  };

  return (
    <div
      ref={region}
      role="region"
      aria-label={label}
      tabIndex={0}
      className={[styles.root, maxHeight !== undefined && styles.bounded, className].filter(Boolean).join(' ')}
      style={rootStyle}
      onKeyDown={onKeyDown}
    >
      <div className={styles.head}>
        <div className={styles.corner}>
          <span className={styles.zone}>{zoneLabel}</span>
        </div>
        {laid.map(({ column }) => {
          const isToday = column.date === todayDate;
          return column.resource ? (
            <div key={column.key} id={`${uid}-${column.key}`} className={`${styles.colHead} ${styles.person}`}>
              {column.resource.avatar}
              <span className={styles.name}>{column.resource.name}</span>
            </div>
          ) : (
            <div key={column.key} id={`${uid}-${column.key}`} className={[styles.colHead, isToday && styles.today].filter(Boolean).join(' ')}>
              <span className={hidden.hidden}>{longDay.format(utcTimestamp(column.date))}</span>
              <span className={styles.weekday} aria-hidden="true">
                {shortDay.format(utcTimestamp(column.date))}
              </span>
              <span className={styles.day} aria-hidden="true">
                {dayNumber.format(utcTimestamp(column.date))}
              </span>
            </div>
          );
        })}
        <div className={styles.allDayLabel}>{allDayLabel}</div>
        {laid.map(({ column, allDay }) => (
          <ul
            key={column.key}
            className={styles.allDayList}
            aria-label={`${allDayLabel}, ${column.resource ? column.resource.name : longDay.format(utcTimestamp(column.date))}`}
          >
            {allDay.map((event) => card(event, column))}
          </ul>
        ))}
      </div>

      <div className={styles.body}>
        <div className={styles.hours}>
          {labels.map((text, i) => (
            <span key={i} className={styles.hour} aria-hidden="true">
              {text}
            </span>
          ))}
          {nowAt !== null && (
            <span className={styles.nowTime} style={{ '--scheduler-now': nowAt } as CSSProperties} aria-hidden="true">
              {formatTime(locale, first + nowAt)}
            </span>
          )}
        </div>
        {laid.map(({ column, timed }) => {
          const off = column.workingHours;
          return (
            <section key={column.key} className={styles.column} aria-labelledby={`${uid}-${column.key}`}>
              {off && off.start * 60 > first && (
                <span className={styles.off} style={{ '--off-from': 0, '--off-to': Math.min(off.start * 60, last) - first } as CSSProperties} />
              )}
              {off && off.end * 60 < last && (
                <span className={styles.off} style={{ '--off-from': Math.max(off.end * 60, first) - first, '--off-to': last - first } as CSSProperties} />
              )}
              <ul className={styles.events}>{timed.map((placed) => card(placed.event, column, placed))}</ul>
              {nowAt !== null && column.key === dotKey && (
                <span className={styles.nowDot} style={{ '--scheduler-now': nowAt } as CSSProperties} aria-hidden="true" />
              )}
            </section>
          );
        })}
        {nowAt !== null && <span className={styles.now} style={{ '--scheduler-now': nowAt } as CSSProperties} aria-hidden="true" />}
      </div>
    </div>
  );
}
