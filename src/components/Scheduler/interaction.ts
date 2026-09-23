/**
 * The arithmetic of a gesture on the grid, in minutes from the first hour
 * shown, so it can be tested without a pointer. Wall-clock times come and
 * go through time.ts; the drawn quarter grid is `step` 15.
 */

import { dateFormat, utcTimestamp } from '../Calendar/date';
import { formatTimeRange, parseDateTime } from './time';
import type { Span } from './layout';

/** `minute` to the nearest step, inside [0, total]. */
export function snap(minute: number, step: number, total: number): number {
  const at = Math.round(minute / step) * step;
  return Math.min(Math.max(at, 0), total);
}

/** A press with no drag: a span of `duration` from the step the press fell in, held inside the day. */
export function spanFromPress(minute: number, step: number, duration: number, total: number): Span {
  const start = Math.min(Math.max(Math.floor(minute / step) * step, 0), Math.max(total - duration, 0));
  return { start, end: Math.min(start + duration, total) };
}

/** A drag from `anchor` to `current`, either way, at least a step long. */
export function spanFromDrag(anchor: number, current: number, step: number, total: number): Span {
  const a = snap(anchor, step, total);
  const b = snap(current, step, total);
  let start = Math.min(a, b);
  let end = Math.max(a, b);
  if (end - start < step) {
    if (start + step <= total) end = start + step;
    else start = Math.max(end - step, 0);
  }
  return { start, end };
}

/** The span moved so that its start lands on `minute` less the offset the pointer took hold at, its duration kept, inside the day. */
export function moveSpan(span: Span, minute: number, grip: number, step: number, total: number): Span {
  const duration = span.end - span.start;
  const start = Math.min(Math.max(snap(minute - grip, step, total), 0), Math.max(total - duration, 0));
  return { start, end: start + duration };
}

/** The span's end taken to `minute`, at least a step after its start. */
export function resizeSpan(span: Span, minute: number, step: number, total: number): Span {
  const end = Math.max(snap(minute, step, total), Math.min(span.start + step, total));
  return { start: span.start, end };
}

type Slot = { start: string; end: string };

/**
 * The drawn "Copy to clipboard" text, one line per day in the order the days
 * come, each day's slots in the order they start: "Thursday, April 22: 3:00 –
 * 4:00 PM, 5:00 – 6:00 PM". Anything that is not a wall-clock time is skipped.
 */
export function formatSlots(slots: readonly Slot[], locale = 'en-US'): string {
  const day = dateFormat(locale, { weekday: 'long', month: 'long', day: 'numeric' });
  const byDate = new Map<string, { from: number; to: number }[]>();
  for (const slot of slots) {
    const start = parseDateTime(slot.start);
    const end = parseDateTime(slot.end);
    if (!start || !end) continue;
    const to = end.date === start.date ? end.minutes : 24 * 60;
    const list = byDate.get(start.date) ?? [];
    list.push({ from: start.minutes, to });
    byDate.set(start.date, list);
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([date, list]) => {
      const times = list
        .sort((a, b) => a.from - b.from)
        .map(({ from, to }) => formatTimeRange(locale, from, to))
        .join(', ');
      return `${day.format(utcTimestamp(date))}: ${times}`;
    })
    .join('\n');
}
