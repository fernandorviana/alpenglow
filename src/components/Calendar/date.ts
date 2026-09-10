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

/** Two ends in the order the calendar reads them, whichever order they arrived in. */
export function orderRange(a: ISODate, b: ISODate): { start: ISODate; end: ISODate } {
  return compare(a, b) <= 0 ? { start: a, end: b } : { start: b, end: a };
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
