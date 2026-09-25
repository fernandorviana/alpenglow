'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { CSSProperties, KeyboardEvent, PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import { addDays, dateFormat, startOfWeek, today, utcTimestamp } from '../Calendar/date';
import type { ISODate } from '../Calendar/date';
import { MINUTES_IN_DAY, formatTime, formatTimeRange, hourLabels, minutesFrom, parseDateTime, toDateTime } from './time';
import type { Hours, ISODateTime } from './time';
import { lanes } from './layout';
import type { Span } from './layout';
import { moveSpan, resizeSpan, spanFromDrag, spanFromPress } from './interaction';
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

/** What a press, a drag, a paste or a duplicate proposes; `from` is the event it was copied from. */
export type SchedulerDraft = {
  start: ISODateTime;
  end: ISODateTime;
  resourceId?: string;
  title?: string;
  from?: SchedulerEvent;
};

/** Where an event is moved or resized to. */
export type SchedulerChange = { start: ISODateTime; end: ISODateTime; resourceId?: string };

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
  /**
   * The day in the middle when a week wider than the region opens: today's, or `date`'s when today is not in the
   * week; `date`'s when `date` changes. Off when left out. A new number does it again: a Today button pressed on
   * today.
   */
  scrollToDay?: boolean | number;
  /** Adds to the card, under the time. Seen, not read: the event's accessible name is its title, its time and its kind. */
  renderEvent?: (event: SchedulerEvent) => ReactNode;
  className?: string;

  /** The grid a gesture snaps to, in minutes: 15, the drawn quarter. */
  step?: number;
  /** A press with no drag proposes this many minutes: 30, as drawn. */
  defaultDuration?: number;
  /** Drawn dashed and pulsing while the caller's panel is open; the caller clears it. */
  draft?: SchedulerDraft | null;
  /** '(No title)'. */
  draftLabel?: string;
  /** The kind a press or a drag proposes and the draft is drawn in: `confirmed`, or `availability`. */
  createKind?: SchedulerKind;
  /** Arms a press and a drag on an empty slot, Enter on the region, paste and duplicate. */
  onCreate?: (draft: SchedulerDraft) => void;
  /** Arms dragging a card, and Shift with the arrows. `event` is the before. */
  onMove?: (event: SchedulerEvent, next: SchedulerChange) => void;
  /** Arms the handle at the foot of the selected card, and Alt+Shift with Up and Down. */
  onResize?: (event: SchedulerEvent, next: SchedulerChange) => void;
  /** Puts the drawn × on availability cards; Delete and Backspace on a hot event. */
  onRemove?: (event: SchedulerEvent) => void;
  /** 'Remove'. */
  removeLabel?: string;
};

const KIND_LABELS: Record<SchedulerKind, string> = {
  confirmed: 'Confirmed',
  pending: 'Pending approval',
  cancelled: 'Cancelled',
  blocker: 'Time blocker',
  external: 'External event',
  availability: 'Available',
};

/** The drawn quarter-hour card; an event shorter than a quarter still takes that. */
const MIN_MINUTES = 15;
/** A pointer that travels less than this has pressed, not dragged. */
const DRAG_SLOP = 4;
/** Within this of the region's edge a drag scrolls it, by this much a move. */
const EDGE = 24;
const EDGE_STEP = 8;

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

type Gesture = 'create' | 'move' | 'resize';

/** A drag under way, in the ref: what the pointer took hold of and where it is. */
type Drag = {
  gesture: Gesture;
  pointerId: number;
  touch: boolean;
  column: number;
  anchor: number;
  grip: number;
  event?: Placed;
  startX: number;
  startY: number;
  moved: boolean;
};

/** The ghost a drag or the cursor draws, in the state; `eventId` is the card being moved or resized. */
type Ghost = { column: number; span: Span; gesture: Gesture | 'cursor'; eventId?: string };

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
  scrollToDay,
  renderEvent,
  className,
  step = 15,
  defaultDuration = 30,
  draft,
  draftLabel = '(No title)',
  createKind = 'confirmed',
  onCreate,
  onMove,
  onResize,
  onRemove,
  removeLabel = 'Remove',
}: SchedulerProps) {
  const uid = useId();
  const region = useRef<HTMLDivElement>(null);
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const layers = useRef(new Map<number, HTMLUListElement>());

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
  const total = last - first;

  /** Where an event lands in a column, in minutes from the first hour, or null when none of it does. */
  const clip = useCallback(
    (column: Column, start: ISODateTime, end: ISODateTime): Span | null => {
      const a = minutesFrom(column.date, start);
      const b = minutesFrom(column.date, end);
      if (a === null || b === null) return null;
      const from = Math.max(a, 0, first);
      const to = Math.min(Math.max(b, a + MIN_MINUTES), MINUTES_IN_DAY, last);
      if (to <= from) return null;
      return { start: from - first, end: to - first };
    },
    [first, last],
  );

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
          const span = clip(column, event.start, event.end);
          if (span) spans.push({ event, from: span.start, to: span.end });
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
    [columns, events, clip],
  );

  // Where the tab stop is: the selected event, or the first there is. Held
  // by id so that a re-render with new events keeps the reader's place.
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
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

  // ---- gestures ----------------------------------------------------------

  const drag = useRef<Drag | null>(null);
  const [ghost, setGhost] = useState<Ghost | null>(null);
  const [status, setStatus] = useState('');
  const clipboard = useRef<SchedulerEvent | null>(null);

  const longDay = useMemo(() => dateFormat(locale, { weekday: 'long', month: 'long', day: 'numeric' }), [locale]);
  const shortDay = useMemo(() => dateFormat(locale, { weekday: 'short' }), [locale]);
  const dayNumber = useMemo(() => dateFormat(locale, { day: 'numeric' }), [locale]);

  const columnName = (column: Column) =>
    column.resource ? column.resource.name : longDay.format(utcTimestamp(column.date));
  const say = (column: Column, span: Span) =>
    `${formatTimeRange(locale, first + span.start, first + span.end)}, ${columnName(column)}`;
  const changeFor = (column: Column, span: Span): SchedulerChange => ({
    start: toDateTime(column.date, first + span.start),
    end: toDateTime(column.date, first + span.end),
    ...(column.resource && { resourceId: column.resource.id }),
  });

  /** The layer's minute under a client y: its offset over its height, times the minutes shown. */
  const minuteAt = (column: number, clientY: number) => {
    const layer = layers.current.get(column);
    if (!layer) return 0;
    const rect = layer.getBoundingClientRect();
    if (rect.height === 0) return 0;
    return ((clientY - rect.top) / rect.height) * total;
  };

  /** The column under a client x, or the nearest one. */
  const columnAt = (clientX: number, fallback: number) => {
    let best = fallback;
    let distance = Infinity;
    for (const [index, layer] of layers.current) {
      const rect = layer.getBoundingClientRect();
      if (rect.width === 0) continue;
      if (clientX >= rect.left && clientX < rect.right) return index;
      const d = clientX < rect.left ? rect.left - clientX : clientX - rect.right;
      if (d < distance) {
        distance = d;
        best = index;
      }
    }
    return best;
  };

  const placedOf = (id: string): { column: number; placed: Placed } | null => {
    for (let c = 0; c < laid.length; c++) {
      const placed = laid[c]!.timed.find((p) => p.event.id === id);
      if (placed) return { column: c, placed };
    }
    return null;
  };

  const endDrag = () => {
    drag.current = null;
    setGhost(null);
  };

  const onColumnPointerDown = (e: ReactPointerEvent<HTMLElement>, column: number) => {
    if (e.button !== 0 || drag.current) return;
    const target = e.target as HTMLElement;
    const touch = e.pointerType === 'touch';
    const minute = minuteAt(column, e.clientY);
    const handle = target.closest<HTMLElement>(`.${styles.handle}`);
    const button = target.closest<HTMLElement>('button[data-event]');
    const base = { pointerId: e.pointerId, touch, column, anchor: minute, startX: e.clientX, startY: e.clientY, moved: false };
    if (handle) {
      if (!onResize || touch) return;
      const found = placedOf(handle.dataset.event!);
      if (!found) return;
      drag.current = { ...base, gesture: 'resize', grip: 0, event: found.placed };
      e.preventDefault();
    } else if (button) {
      if (!onMove || touch) return;
      const found = placedOf(button.dataset.event!);
      if (!found) return;
      drag.current = { ...base, gesture: 'move', grip: minute - found.placed.from, event: found.placed };
    } else {
      if (!onCreate) return;
      drag.current = { ...base, gesture: 'create', grip: 0 };
      if (!touch) e.preventDefault();
    }
  };

  const onColumnPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId || d.touch) return;
    if (!d.moved) {
      if (Math.abs(e.clientX - d.startX) < DRAG_SLOP && Math.abs(e.clientY - d.startY) < DRAG_SLOP) return;
      d.moved = true;
      // Captured only once a drag is real, so a press on a card is still its click.
      const el = e.currentTarget;
      if (typeof el.setPointerCapture === 'function') {
        try {
          el.setPointerCapture(e.pointerId);
        } catch {
          /* a pointer that is gone */
        }
      }
    }
    const column = d.gesture === 'resize' ? d.column : columnAt(e.clientX, d.column);
    const minute = minuteAt(column, e.clientY);
    const span =
      d.gesture === 'create'
        ? spanFromDrag(d.anchor, minute, step, total)
        : d.gesture === 'move'
          ? moveSpan({ start: d.event!.from, end: d.event!.to }, minute, d.grip, step, total)
          : resizeSpan({ start: d.event!.from, end: d.event!.to }, minute, step, total);
    setGhost({ column, span, gesture: d.gesture, eventId: d.event?.event.id });
    setStatus(say(columns[column]!, span));
    // Near the region's edge, the region follows the pointer.
    const el = region.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      if (e.clientY < rect.top + EDGE) el.scrollTop -= EDGE_STEP;
      else if (e.clientY > rect.bottom - EDGE) el.scrollTop += EDGE_STEP;
    }
  };

  const onColumnPointerUp = (e: ReactPointerEvent<HTMLElement>) => {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    const el = e.currentTarget;
    if (d.moved && typeof el.releasePointerCapture === 'function') {
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        /* never captured */
      }
    }
    if (d.gesture === 'create') {
      const column = d.moved ? columnAt(e.clientX, d.column) : d.column;
      const span = d.moved
        ? spanFromDrag(d.anchor, minuteAt(column, e.clientY), step, total)
        : spanFromPress(d.anchor, step, defaultDuration, total);
      onCreate?.({ ...changeFor(columns[column]!, span) });
      setStatus(say(columns[column]!, span));
    } else if (d.moved && d.event) {
      const column = d.gesture === 'resize' ? d.column : columnAt(e.clientX, d.column);
      const minute = minuteAt(column, e.clientY);
      const before = { start: d.event.from, end: d.event.to };
      const span =
        d.gesture === 'move' ? moveSpan(before, minute, d.grip, step, total) : resizeSpan(before, minute, step, total);
      const next = changeFor(columns[column]!, span);
      if (d.gesture === 'move') onMove?.(d.event.event, next);
      else onResize?.(d.event.event, next);
      setStatus(say(columns[column]!, span));
    }
    endDrag();
  };

  const onColumnPointerCancel = (e: ReactPointerEvent<HTMLElement>) => {
    if (drag.current && drag.current.pointerId === e.pointerId) endDrag();
  };

  // Escape lets go of a drag under way; the listener lives for the drag, not for each move.
  const dragging = ghost !== null && ghost.gesture !== 'cursor';
  useEffect(() => {
    if (!dragging) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') endDrag();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dragging]);

  // ---- the keyboard ------------------------------------------------------

  const propose = (column: Column, span: Span, from?: SchedulerEvent, title?: string) => {
    onCreate?.({ ...changeFor(column, span), ...(title !== undefined && { title }), ...(from && { from }) });
    setStatus(say(column, span));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const onRegion = target === region.current;
    const mod = e.metaKey || e.ctrlKey;
    const cursor = ghost?.gesture === 'cursor' ? ghost : null;

    // The cursor: the keyboard's own draft, on the region itself.
    if (cursor && onRegion) {
      const { column, span } = cursor;
      const place = (next: Ghost) => {
        setGhost(next);
        setStatus(say(columns[next.column]!, next.span));
      };
      const keys: Record<string, () => void> = {
        ArrowDown: () =>
          place({
            ...cursor,
            span: e.shiftKey ? resizeSpan(span, span.end + step, step, total) : moveSpan(span, span.start + step, 0, step, total),
          }),
        ArrowUp: () =>
          place({
            ...cursor,
            span: e.shiftKey ? resizeSpan(span, span.end - step, step, total) : moveSpan(span, span.start - step, 0, step, total),
          }),
        ArrowRight: () => place({ ...cursor, column: Math.min(column + 1, columns.length - 1) }),
        ArrowLeft: () => place({ ...cursor, column: Math.max(column - 1, 0) }),
        Enter: () => {
          propose(columns[column]!, span);
          setGhost(null);
        },
        Escape: () => setGhost(null),
      };
      const act = keys[e.key];
      if (act) {
        e.preventDefault();
        act();
        return;
      }
    }

    if (onRegion && e.key === 'Enter' && onCreate && !cursor) {
      // At the first hour in view, in today's column or the first.
      const el = region.current!;
      const layer = layers.current.get(0);
      const body = el.querySelector<HTMLElement>(`.${styles.body}`);
      const perMinute = layer && layer.offsetHeight > 0 ? layer.offsetHeight / total : 0;
      const top =
        perMinute > 0 ? Math.max(0, Math.round((el.scrollTop - (body?.offsetTop ?? 0) - layer!.offsetTop) / perMinute)) : 0;
      const column = Math.max(0, columns.findIndex((c) => c.date === todayDate));
      const span = spanFromPress(Math.min(top, Math.max(total - defaultDuration, 0)), step, defaultDuration, total);
      setGhost({ column, span, gesture: 'cursor' });
      setStatus(say(columns[column]!, span));
      e.preventDefault();
      return;
    }

    // The hot event: under the pointer if there is one and it is still here, else the one with focus.
    const hotId = (hoveredId && known.has(hoveredId) ? hoveredId : null) ?? target.dataset.event ?? null;
    if (!hotId) return;
    const col = order.findIndex((ids) => ids.includes(hotId));
    if (col === -1) return;
    const found = placedOf(hotId);
    const hot = found?.placed.event ?? laid[col]!.allDay.find((ev) => ev.id === hotId)!;

    if (mod && e.key.toLowerCase() === 'c') {
      clipboard.current = hot;
      setStatus(`${hot.title} copied`);
      return;
    }
    if (mod && e.key.toLowerCase() === 'v' && onCreate && clipboard.current) {
      e.preventDefault();
      const copy = clipboard.current;
      const day = parseDateTime(copy.start)?.date;
      const length = Math.max(step, day ? (minutesFrom(day, copy.end) ?? 0) - (minutesFrom(day, copy.start) ?? 0) : step);
      const at = cursor ? cursor : found ? { column: col, span: { start: found.placed.to, end: found.placed.to } } : null;
      if (!at) return;
      const start = Math.min(at.span.start, Math.max(total - length, 0));
      propose(columns[at.column]!, { start, end: Math.min(start + length, total) }, copy, copy.title);
      return;
    }
    if (mod && e.key.toLowerCase() === 'd' && onCreate && found) {
      e.preventDefault();
      const length = found.placed.to - found.placed.from;
      const start = Math.min(found.placed.to, Math.max(total - length, 0));
      propose(columns[col]!, { start, end: Math.min(start + length, total) }, hot, hot.title);
      return;
    }
    if ((e.key === 'Delete' || e.key === 'Backspace') && onRemove) {
      e.preventDefault();
      onRemove(hot);
      setStatus(`${hot.title} removed`);
      return;
    }
    if (e.shiftKey && found && (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      const before = { start: found.placed.from, end: found.placed.to };
      const delta = e.key === 'ArrowUp' ? -step : step;
      if (e.altKey && onResize && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault();
        const span = resizeSpan(before, before.end + delta, step, total);
        onResize(hot, changeFor(columns[col]!, span));
        setStatus(say(columns[col]!, span));
        return;
      }
      if (!onMove) return;
      e.preventDefault();
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        const span = moveSpan(before, before.start + delta, 0, step, total);
        onMove(hot, changeFor(columns[col]!, span));
        setStatus(say(columns[col]!, span));
      } else {
        const to = e.key === 'ArrowRight' ? col + 1 : col - 1;
        if (to < 0 || to >= columns.length) return;
        onMove(hot, changeFor(columns[to]!, before));
        setStatus(say(columns[to]!, before));
      }
      return;
    }

    // Navigation, on the focused event.
    const id = target.dataset.event;
    if (!id) return;
    const ids = order[col]!;
    const at = ids.indexOf(id);
    if (at === -1) return;
    const from = laid[col]!.timed.find((p) => p.event.id === id)?.from ?? -1;
    const sideways = (dir: number) => {
      for (let c = col + dir; c >= 0 && c < order.length; c += dir) {
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

  // With scrollToDay, a week wider than the region puts a day's column in
  // the middle of what the sticky hours leave, so the days either side show.
  // Today's when the region opens, the view changes, a new request comes or
  // the clock first arrives after hydration; `date`'s when only `date`
  // changes, so a day picked in the same week is the day shown. What was
  // asked last is kept to tell the two apart. A day of people has no day to
  // find and stays put. What the hours leave is measured from their width at
  // the start edge, the right one on a right-to-left page.
  const lastDay = useRef<{ view: SchedulerView; date: ISODate; today?: ISODate; request?: boolean | number } | null>(null);
  useEffect(() => {
    const was = lastDay.current;
    lastDay.current = { view, date, today: todayDate, request: scrollToDay };
    if (scrollToDay === undefined || scrollToDay === false) return;
    const toToday =
      !was || was.view !== view || was.request !== scrollToDay || (was.today === undefined && todayDate !== undefined);
    if (!toToday && was.date === date) return;
    const el = region.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;
    const today = toToday ? columns.findIndex((c) => !c.resource && c.date === todayDate) : -1;
    const target = today !== -1 ? today : columns.findIndex((c) => !c.resource && c.date === date);
    const column = el.querySelector<HTMLElement>(`section[data-column="${target}"]`);
    const hoursColumn = el.querySelector<HTMLElement>(`.${styles.hours}`);
    if (target === -1 || !column || !hoursColumn) return;
    const box = el.getBoundingClientRect();
    const start = box.left + el.clientLeft;
    const end = start + el.clientWidth;
    const hoursWidth = hoursColumn.getBoundingClientRect().width;
    const [from, to] = getComputedStyle(el).direction === 'rtl' ? [start, end - hoursWidth] : [start + hoursWidth, end];
    const c = column.getBoundingClientRect();
    el.scrollLeft += (c.left + c.right) / 2 - (from + to) / 2;
    // The columns follow from these; a new object for `workingHours` on each
    // render must not bring the reader back.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, date, todayDate, scrollToDay]);

  const labels = useMemo(() => hourLabels(locale, hours), [locale, hours.start, hours.end]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // The caller's draft, in the column its date and person name.
  const draftPlaced = useMemo(() => {
    if (!draft) return null;
    const at = parseDateTime(draft.start)?.date;
    const column = columns.findIndex(
      (c) => c.date === at && (!c.resource || c.resource.id === draft.resourceId),
    );
    if (column === -1) return null;
    const span = clip(columns[column]!, draft.start, draft.end);
    return span ? { column, span, title: draft.title } : null;
  }, [draft, columns, clip]);

  const slotStyle = (span: Span, lane = 0, count = 1) =>
    ({
      '--event-from': span.start,
      '--event-to': span.end,
      '--event-lane': lane,
      '--event-lanes': count,
    }) as CSSProperties;

  const ghostCard = (key: string, span: Span, column: Column, title: string | undefined, pulse: boolean) => (
    <li
      key={key}
      className={[styles.slot, styles.draft, styles[createKind], styles[column.resource?.tone ?? 'accent'], pulse && styles.pulse]
        .filter(Boolean)
        .join(' ')}
      style={slotStyle(span)}
      aria-hidden="true"
    >
      <span className={styles.title}>{title ?? draftLabel}</span>
      <span className={styles.time}>{formatTimeRange(locale, first + span.start, first + span.end)}</span>
    </li>
  );

  const card = (event: SchedulerEvent, column: Column, placed?: Placed) => {
    const kind = kindOf(event);
    const range = placed ? formatTimeRange(locale, first + placed.from, first + placed.to) : allDayLabel;
    const duration = placed ? placed.to - placed.from : 0;
    const past = isPast(event);
    const selected = selectedId === event.id;
    const dragging = ghost?.eventId === event.id;
    const removable = kind === 'availability' && onRemove;
    return (
      <li
        key={event.id}
        className={[placed ? styles.slot : styles.allDaySlot, dragging && styles.dragging].filter(Boolean).join(' ')}
        style={placed ? slotStyle({ start: placed.from, end: placed.to }, placed.lane, placed.lanes) : undefined}
      >
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
            placed && onMove && styles.movable,
          ]
            .filter(Boolean)
            .join(' ')}
          aria-current={selected ? 'true' : undefined}
          aria-label={`${event.title}, ${range}, ${kindLabels?.[kind] ?? KIND_LABELS[kind]}`}
          onClick={(e) => {
            setFocusedId(event.id);
            e.currentTarget.focus();
            onSelect?.(event);
          }}
          onFocus={() => setFocusedId(event.id)}
          onPointerEnter={() => setHoveredId(event.id)}
          onPointerLeave={() => setHoveredId((h) => (h === event.id ? null : h))}
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
        {removable && (
          <button
            type="button"
            className={styles.remove}
            aria-label={`${removeLabel} ${event.title}`}
            onClick={() => onRemove(event)}
          >
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        )}
        {placed && selected && onResize && <span className={styles.handle} data-event={event.id} aria-hidden="true" />}
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
      <span role="status" className={hidden.hidden}>
        {status}
      </span>
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
          <ul key={column.key} className={styles.allDayList} aria-label={`${allDayLabel}, ${columnName(column)}`}>
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
        {laid.map(({ column, timed }, index) => {
          const off = column.workingHours;
          return (
            <section
              key={column.key}
              data-column={index}
              className={[styles.column, onCreate && styles.creatable].filter(Boolean).join(' ')}
              aria-labelledby={`${uid}-${column.key}`}
              onPointerDown={(e) => onColumnPointerDown(e, index)}
              onPointerMove={onColumnPointerMove}
              onPointerUp={onColumnPointerUp}
              onPointerCancel={onColumnPointerCancel}
            >
              {off && off.start * 60 > first && (
                <span className={styles.off} style={{ '--off-from': 0, '--off-to': Math.min(off.start * 60, last) - first } as CSSProperties} />
              )}
              {off && off.end * 60 < last && (
                <span className={styles.off} style={{ '--off-from': Math.max(off.end * 60, first) - first, '--off-to': last - first } as CSSProperties} />
              )}
              <ul
                className={styles.events}
                ref={(el) => {
                  if (el) layers.current.set(index, el);
                  else layers.current.delete(index);
                }}
              >
                {timed.map((placed) => card(placed.event, column, placed))}
                {draftPlaced && draftPlaced.column === index && ghostCard('draft', draftPlaced.span, column, draftPlaced.title, true)}
                {ghost && ghost.column === index && ghostCard('ghost', ghost.span, column, undefined, ghost.gesture === 'cursor')}
              </ul>
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
