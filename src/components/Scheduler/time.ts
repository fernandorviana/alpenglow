/**
 * Wall-clock time for the Scheduler, on the Calendar's dates.
 *
 * An event's `start` and `end` are `ISODateTime` strings, 'YYYY-MM-DDTHH:MM',
 * with no zone: the time a receptionist reads off the wall, which is what a
 * booking is. Nothing here builds a `Date` for anything but formatting, and
 * the formatter is the Calendar's, pinned to UTC, so a runtime west of UTC
 * cannot move an event a day (date.ts records the failure that pin fixed).
 */

import { dateFormat, isValidISO, utcTimestamp } from '../Calendar/date';
import type { ISODate } from '../Calendar/date';

/** 'YYYY-MM-DDTHH:MM', wall clock, no zone. */
export type ISODateTime = string;

export type Hours = { start: number; end: number };

export const MINUTES_IN_DAY = 24 * 60;

const PATTERN = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})$/;

/** The date and the minutes since its midnight, or null for anything that is not a wall-clock time. */
export function parseDateTime(value: ISODateTime): { date: ISODate; minutes: number } | null {
  const match = PATTERN.exec(value);
  if (!match) return null;
  const [, date, hh, mm] = match as unknown as [string, string, string, string];
  const hours = Number(hh);
  const mins = Number(mm);
  if (!isValidISO(date) || hours > 23 || mins > 59) return null;
  return { date, minutes: hours * 60 + mins };
}

/** The wall-clock time `minutes` after the midnight of `date`; minutes past the day roll into the next. */
export function toDateTime(date: ISODate, minutes: number): ISODateTime {
  const days = Math.floor(minutes / MINUTES_IN_DAY);
  const rest = ((minutes % MINUTES_IN_DAY) + MINUTES_IN_DAY) % MINUTES_IN_DAY;
  const stamp = utcTimestamp(date) + days * 86_400_000;
  const day = new Date(stamp).toISOString().slice(0, 10);
  const hh = String(Math.floor(rest / 60)).padStart(2, '0');
  const mm = String(rest % 60).padStart(2, '0');
  return `${day}T${hh}:${mm}`;
}

/**
 * Minutes from the midnight of `date` to `value`: negative before it, past
 * 1440 after it, so an event that runs over midnight can be clipped to the
 * column it started in and to the one it ends in.
 */
export function minutesFrom(date: ISODate, value: ISODateTime): number | null {
  const parsed = parseDateTime(value);
  if (!parsed) return null;
  const days = Math.round((utcTimestamp(parsed.date) - utcTimestamp(date)) / 86_400_000);
  return days * MINUTES_IN_DAY + parsed.minutes;
}

/** Any date will do: only the time of day is read from it. */
const stampOf = (minutes: number) => Date.UTC(2023, 0, 1) + minutes * 60_000;

/** Whether the locale counts the hours to twelve. */
export function usesTwelveHours(locale: string): boolean {
  return dateFormat(locale, { hour: 'numeric' }).resolvedOptions().hour12 === true;
}

/** "9:00 AM" where the hours go to twelve, "09:00" where they go to twenty-four: a numeric hour pads only in the second. */
function clockFormat(locale: string): Intl.DateTimeFormat {
  return usesTwelveHours(locale)
    ? dateFormat(locale, { hour: 'numeric', minute: '2-digit' })
    : dateFormat(locale, { hour: '2-digit', minute: '2-digit' });
}

/**
 * ICU's spaces, made plain. Node's ICU puts a thin space (U+2009) around the
 * dash of a range and a narrow no-break space (U+202F) before "AM", and
 * Chrome's puts plain ones: the same call on the server and in the browser
 * gave two strings, and React refused to hydrate the page. Text that is
 * rendered on both sides goes through here.
 */
const plain = (text: string) => text.replace(/[\s\u00a0\u2009\u202f]+/g, ' ').trim();

/** "9:00 AM" or "09:00", by the locale. */
export function formatTime(locale: string, minutes: number): string {
  return plain(clockFormat(locale).format(stampOf(minutes)));
}

/**
 * "11:00 AM – 1:00 PM", "2:00 – 2:45 PM", "11:00 – 13:00". Composed from the
 * two times rather than `formatRange`, whose spacing and whose collapsing of
 * a shared "PM" differ between ICU builds; the collapse is done here, from
 * the parts, so the server and the browser agree.
 */
export function formatTimeRange(locale: string, from: number, to: number): string {
  const format = clockFormat(locale);
  const a = format.formatToParts(stampOf(from));
  const b = format.formatToParts(stampOf(to));
  const period = (parts: Intl.DateTimeFormatPart[]) => parts.find((p) => p.type === 'dayPeriod')?.value;
  const shared = period(a) !== undefined && period(a) === period(b);
  const text = (parts: Intl.DateTimeFormatPart[], dropPeriod: boolean) =>
    plain(parts.filter((p) => !(dropPeriod && p.type === 'dayPeriod')).map((p) => p.value).join(''));
  return `${text(a, shared)} – ${text(b, false)}`;
}

/**
 * The label at each hour line: "9 AM" where the locale counts to twelve,
 * "09:00" where it counts to twenty-four, which is the phone drawing. One
 * per hour from `start` to `end` exclusive.
 */
export function hourLabels(locale: string, hours: Hours): string[] {
  const twelve = usesTwelveHours(locale);
  const format = twelve
    ? dateFormat(locale, { hour: 'numeric' })
    : dateFormat(locale, { hour: '2-digit', minute: '2-digit' });
  const labels: string[] = [];
  for (let hour = hours.start; hour < hours.end; hour++) labels.push(plain(format.format(stampOf(hour * 60))));
  return labels;
}
