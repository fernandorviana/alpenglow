import type { Dispatch } from 'react';
import { toast } from '@/components/Toast';
import { formatTime, formatTimeRange, parseDateTime, toDateTime } from '@/components/Scheduler';
import type { ISODateTime } from '@/components/Scheduler';
import { dateFormat, utcTimestamp } from '@/components/Calendar/date';
import type { ISODate } from '@/components/Calendar/date';
import { appointmentTypes, DAY, NOW, practitioners } from '../data';
import type { Appointment, Status } from '../data';
import { invert } from '../state';
import type { Action, Patch, ScreenState } from '../state';

/**
 * What the zones share: the clock the practice reads (24 hours, en-GB), the
 * names behind the ids, and a change with its Undo. Times are read from the
 * wall-clock string's parts, never from a `Date` built out of it.
 */

export const LOCALE = 'en-GB';

const minutes = (value: ISODateTime) => parseDateTime(value)?.minutes ?? 0;

/** "Thursday 17 September": the formatter is the Calendar's, pinned to UTC. */
export const dayTitle = (date: ISODate) =>
  dateFormat(LOCALE, { weekday: 'long', day: 'numeric', month: 'long' }).format(utcTimestamp(date));

/** "Thu 17 Sept": the TopBar's heading beside the menu, where the long one has no room. */
export const shortDayTitle = (date: ISODate) =>
  dateFormat(LOCALE, { weekday: 'short', day: 'numeric', month: 'short' }).format(utcTimestamp(date));

export const clock = (value: ISODateTime) => formatTime(LOCALE, minutes(value));

/** "09:00 – 09:45". */
export const timeRange = (a: Pick<Appointment, 'start' | 'end'>) => formatTimeRange(LOCALE, minutes(a.start), minutes(a.end));

export const practitionerName = (id: string) => practitioners.find((p) => p.id === id)?.name ?? id;

export const typeOf = (id: string) => appointmentTypes.find((t) => t.id === id);

export const STATUS_LABEL: Record<Status, string> = { confirmed: 'Confirmed', pending: 'Pending', cancelled: 'Cancelled' };
export const STATUS_TONE = { confirmed: 'success', pending: 'warning', cancelled: 'neutral' } as const;

/** Applies a change and raises its Toast, whose Undo applies the inverse. */
export function commit(dispatch: Dispatch<Action>, patches: Patch[], message: string) {
  if (patches.length === 0) return;
  dispatch({ type: 'apply', patches });
  const back = invert(patches);
  toast(message, { action: { label: 'Undo', onClick: () => dispatch({ type: 'apply', patches: back }) } });
}

/** "2 appointments", "Maya Costa". */
export function whom(state: ScreenState, ids: string[]) {
  return ids.length === 1 ? state.byId[ids[0]!]!.client : `${ids.length} appointments`;
}

/**
 * The first practitioner's next free half hour: after now on the fixed day,
 * from the start of their hours on any other. A cancelled appointment frees
 * its slot.
 */
export function nextFreeHalfHour(state: ScreenState): NonNullable<ScreenState['dialog']> {
  const p = practitioners[0]!;
  const taken = Object.values(state.byId)
    .filter((a) => a.practitionerId === p.id && a.status !== 'cancelled')
    .map((a) => [minutes(a.start), minutes(a.end)] as const);
  const open = p.hours.start * 60;
  const from = state.date === DAY ? Math.max(open, Math.ceil(minutes(NOW) / 30) * 30) : open;
  let at = from;
  while (at + 30 <= p.hours.end * 60 && taken.some(([s, e]) => at < e && at + 30 > s)) at += 30;
  if (at + 30 > p.hours.end * 60) at = from;
  return { start: toDateTime(state.date, at), end: toDateTime(state.date, at + 30), practitionerId: p.id };
}

export { minutes };
