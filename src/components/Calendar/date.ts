/**
 * Civil dates — a calendar date with no time and no zone.
 *
 * Every value crossing a function boundary here is an ISO 8601 date string.
 * That is not a stylistic choice: a `Date` built at local midnight is the
 * previous day for anyone east of whoever wrote the code, and the bug does not
 * reproduce in the timezone it was written in. Strings compare
 * lexicographically, which for this format is also chronologically, and they
 * survive a round trip through JSON without a conversion.
 *
 * `Date` is still used inside this file, because it already knows how long
 * February is and reimplementing that would be a worse bet than using it. It
 * is used ONLY through `Date.UTC` and the `getUTC*` accessors, so no local
 * offset can move a calendar day. The single exception is `today`, which reads
 * the local date deliberately: today is a local question.
 */

/** An ISO 8601 calendar date, `YYYY-MM-DD`. */
export type ISODate = string;

/** One position in a month grid. `outside` days belong to the adjacent month. */
export type CalendarCell = { date: ISODate; outside: boolean };

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

const pad = (n: number, width = 2) => String(n).padStart(width, '0');

export function toISO(year: number, month: number, day: number): ISODate {
  return `${pad(year, 4)}-${pad(month)}-${pad(day)}`;
}

export function parts(date: ISODate): { year: number; month: number; day: number } {
  const match = ISO.exec(date);
  if (!match) throw new RangeError(`Not an ISO calendar date: ${date}`);
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

/**
 * `Date.UTC(year, month, 0)` is the last day of the preceding month, and the
 * month argument is zero-based — so passing the one-based month lands on the
 * last day of that month.
 */
export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Shape and range, both. The regex alone accepts 2026-02-30, which is the
 * failure a text field will actually produce.
 */
export function isValidISO(value: string): boolean {
  const match = ISO.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12) return false;
  return day >= 1 && day <= daysInMonth(year, month);
}

/** 0 = Sunday. */
export function weekday(date: ISODate): number {
  const { year, month, day } = parts(date);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function addDays(date: ISODate, days: number): ISODate {
  const { year, month, day } = parts(date);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return toISO(shifted.getUTCFullYear(), shifted.getUTCMonth() + 1, shifted.getUTCDate());
}

/**
 * The day is clamped to the target month rather than allowed to overflow, so
 * 31 January plus a month is the end of February and not the 3rd of March.
 * Overflowing would let a user paging through months walk their own date
 * forward without touching it.
 */
export function addMonths(date: ISODate, months: number): ISODate {
  const { year, month, day } = parts(date);
  const target = month - 1 + months;
  const targetYear = year + Math.floor(target / 12);
  const targetMonth = (((target % 12) + 12) % 12) + 1;
  return toISO(targetYear, targetMonth, Math.min(day, daysInMonth(targetYear, targetMonth)));
}

export function startOfMonth(date: ISODate): ISODate {
  const { year, month } = parts(date);
  return toISO(year, month, 1);
}

export function compare(a: ISODate, b: ISODate): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

/** Inclusive on both bounds. An absent bound does not exclude anything. */
export function isWithin(date: ISODate, min?: ISODate, max?: ISODate): boolean {
  if (min !== undefined && compare(date, min) < 0) return false;
  if (max !== undefined && compare(date, max) > 0) return false;
  return true;
}

export function clamp(date: ISODate, min?: ISODate, max?: ISODate): ISODate {
  if (min !== undefined && compare(date, min) < 0) return min;
  if (max !== undefined && compare(date, max) > 0) return max;
  return date;
}

/** The local calendar date. Today is a local question, so this reads local. */
export function today(): ISODate {
  const now = new Date();
  return toISO(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

/**
 * The instant an ISO date begins, in UTC, as a number — for handing to a
 * formatter built by `dateFormat`, and nothing else. It is a number rather than
 * a Date so that no Date leaves this file.
 */
export function utcTimestamp(date: ISODate): number {
  const { year, month, day } = parts(date);
  return Date.UTC(year, month - 1, day);
}

/**
 * The only place a date formatter is built, and it pins the zone to UTC.
 *
 * Every timestamp in the calendar is UTC midnight. A formatter left on the
 * runtime's zone reads that instant as local time, and anywhere west of UTC
 * 2023-04-01T00:00Z is the afternoon of 31 March — so the heading, the weekday
 * headers and every cell's name land a day early. Measured before this
 * existed: under TZ=America/Los_Angeles, 9 of 36 tests in Calendar.test.tsx
 * failed; the test that clicked the button named "April 26" got onSelect
 * called with '2023-04-27' instead of '2023-04-26'.
 */
export function dateFormat(
  locale: string,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' });
}

/** Two ends in the order the calendar reads them, whichever order they arrived in. */
export function orderRange(a: ISODate, b: ISODate): { start: ISODate; end: ISODate } {
  return compare(a, b) <= 0 ? { start: a, end: b } : { start: b, end: a };
}

export type Segment = 'year' | 'month' | 'day';

/**
 * The order a locale writes a numeric date in.
 *
 * `04/05/2026` is the 5th of April in the United States and the 4th of May in
 * Portugal, and neither reading is wrong. A single text field cannot be
 * unambiguous, so it can at least agree with the person typing into it.
 */
export function segmentOrder(locale: string): Segment[] {
  const segments = dateFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(utcTimestamp('2026-04-26'));

  return segments
    .map((segment) => segment.type)
    .filter((type): type is Segment => type === 'year' || type === 'month' || type === 'day');
}

const WIDTH: Record<Segment, string> = { year: 'YYYY', month: 'MM', day: 'DD' };

export function placeholderFor(locale: string): string {
  return segmentOrder(locale)
    .map((segment) => WIDTH[segment])
    .join(' / ');
}

/**
 * Render a date the way this locale would type it: zero-padded, in
 * `segmentOrder`, joined the same way `placeholderFor` joins its widths. The
 * placeholder, the display and `parseTyped` all have to agree on this order —
 * otherwise a field could show a date it would then refuse to read back.
 */
export function formatTyped(date: ISODate, locale: string): string {
  const { year, month, day } = parts(date);
  const value: Record<Segment, string> = {
    year: pad(year, 4),
    month: pad(month),
    day: pad(day),
  };
  return segmentOrder(locale)
    .map((segment) => value[segment])
    .join(' / ');
}

/**
 * Parse what a person typed.
 *
 * ISO is accepted in every locale, unconditionally: it is the one form nobody
 * can misread, and a user who knows it should not be made to guess the local
 * order. Otherwise the digits are read in the locale's own order.
 *
 * Rejects rather than rolls over: 31 February is not the 3rd of March, and a
 * component that quietly corrects a date the user did not mean is worse than
 * one that says it did not understand.
 */
export function parseTyped(raw: string, locale: string): ISODate | null {
  const trimmed = raw.trim();
  if (isValidISO(trimmed)) return trimmed;

  const digits = trimmed.split(/[^\d]+/).filter(Boolean);
  if (digits.length !== 3) return null;

  const order = segmentOrder(locale);
  const read: Partial<Record<Segment, number>> = {};
  order.forEach((segment, index) => {
    read[segment] = Number(digits[index]);
  });

  const { year, month, day } = read as Record<Segment, number>;
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
  if (String(year).length !== 4) return null;

  const candidate = toISO(year, month, day);
  return isValidISO(candidate) ? candidate : null;
}

/**
 * Six rows of seven, always. The drawn panel is 340px tall, which closes
 * exactly at six rows — a grid that shrinks to five for a short February
 * would make the panel jump height as the user pages through the year.
 */
export function monthGrid(month: ISODate, weekStartsOn: number): CalendarCell[][] {
  const first = startOfMonth(month);
  const { month: inMonth } = parts(first);
  const lead = (weekday(first) - weekStartsOn + 7) % 7;
  const origin = addDays(first, -lead);

  const rows: CalendarCell[][] = [];
  for (let row = 0; row < 6; row += 1) {
    const week: CalendarCell[] = [];
    for (let column = 0; column < 7; column += 1) {
      const date = addDays(origin, row * 7 + column);
      week.push({ date, outside: parts(date).month !== inMonth });
    }
    rows.push(week);
  }
  return rows;
}
