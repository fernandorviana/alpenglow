/**
 * The date field's mask. Pure functions, no DOM.
 *
 * The field is rebuilt from its digits after every edit rather than by
 * intercepting keys: only that survives a paste, autofill, an IME composition
 * and Android keyboards, which report `keydown` as `Unidentified`. Everything
 * the field shows, and everything it reads back, goes through the one
 * `DateShape` a locale produces here, so the placeholder, the formatted value
 * and the reader can never disagree about the order.
 *
 * Digits are all the field keeps, but a separator the user types is still
 * read before it is dropped: after a lone day or month digit it completes that
 * part, so `1/15/2025` is January 15th and not `11/05/2025`. Every other
 * character is dropped without a trace.
 *
 * Copied, not invented: GOV.UK's numeric input and its error priority, React
 * Aria's prevention of impossible segment values, and Estelle Weyl's
 * accessible masking (a visible shell of the format still to type, deletion
 * never blocked, the pattern described in words).
 */
import {
  compare,
  dateFormat,
  isValidISO,
  orderRange,
  utcTimestamp,
  type ISODate,
} from '../Calendar/date';
import type { DateRange } from '../Calendar';

export type Segment = 'year' | 'month' | 'day';
export type DateShape = { order: Segment[]; separator: string };
export type MaskMode = 'single' | 'range';
export type DatePickerInvalidReason =
  | 'incomplete'
  | 'not-a-date'
  | 'before-min'
  | 'after-max'
  | 'unavailable';

/**
 * Between the two dates of a range. Fixed, and not `formatRange`'s: the
 * spacing that function puts around its dash depends on the ICU build, which
 * is how the calendar once shipped a hydration mismatch.
 */
export const RANGE_SEPARATOR = ' – ';

const WIDTH: Record<Segment, number> = { day: 2, month: 2, year: 4 };
const LETTERS: Record<Segment, string> = { day: 'DD', month: 'MM', year: 'YYYY' };
const DATE_DIGITS = 8;

export const digitsFor = (mode: MaskMode) => (mode === 'range' ? DATE_DIGITS * 2 : DATE_DIGITS);

/**
 * The order a locale writes a numeric date in, and the separator between its
 * parts. The calendar and the digits are pinned: fa-IR otherwise formats in
 * the Persian calendar and ar-EG in Arabic-Indic digits, and a separator must
 * not be read from either. Whitespace and bidi marks are dropped from the
 * literal (ko-KR writes ". ", ar-EG puts U+200F before its slash), and a
 * trailing literal — ko-KR's final "." — is not a separator at all.
 */
export function dateShape(locale: string): DateShape {
  const formatted = dateFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    calendar: 'gregory',
    numberingSystem: 'latn',
  }).formatToParts(utcTimestamp('2026-04-26'));

  const order: Segment[] = [];
  let separator = '';
  for (const part of formatted) {
    if (part.type === 'year' || part.type === 'month' || part.type === 'day') {
      order.push(part.type);
    } else if (part.type === 'literal' && order.length === 1) {
      separator = part.value.replace(/[\s‎‏؜]/g, '');
    }
  }
  return { order, separator: separator || '/' };
}

/** The zero of each digit block the field reads: ASCII, Arabic-Indic, Extended Arabic-Indic, fullwidth. */
const DIGIT_ZEROS = [0x30, 0x660, 0x6f0, 0xff10];

/**
 * The digits in `raw`, as ASCII. Fullwidth digits are what a Japanese IME
 * produces; everything that is not a digit is dropped.
 */
export function normaliseDigits(raw: string): string {
  let digits = '';
  for (const char of raw) {
    const code = char.codePointAt(0)!;
    const zero = DIGIT_ZEROS.find((start) => code >= start && code <= start + 9);
    if (zero !== undefined) digits += String(code - zero);
  }
  return digits;
}

const isDigit = (char: string) => normaliseDigits(char).length === 1;

/** What people type between the parts of a date, whatever their locale writes. */
const COMMON_SEPARATORS = /[\s/.,–-]/;

const isSeparator = (char: string, shape: DateShape) =>
  COMMON_SEPARATORS.test(char) || char === shape.separator;

const WHOLE_ISO = /(\d{4})-(\d{2})-(\d{2})/g;

/**
 * ISO that arrives whole — a paste, autofill, a drop — becomes its digits in
 * the locale's order before the mask sees it. Typed key by key it cannot be
 * told apart: in a day-first order its first two digits are already a day.
 */
export function replaceWholeIso(raw: string, shape: DateShape): string {
  return raw.replace(WHOLE_ISO, (_match, year: string, month: string, day: string) => {
    const segments: Record<Segment, string> = { year, month, day };
    return shape.order.map((segment) => segments[segment]).join('');
  });
}

/** Digit positions `[start, end)` in the new digits that an edit inserted. */
export type Inserted = {
  start: number;
  end: number;
  /**
   * Gaps where the edit typed a separator, counted in digits: gap `g` sits
   * between digit `g - 1` and digit `g`. From `typedSeparators`.
   */
  separators?: number[];
};

/**
 * The span `[start, end)` of `next` an edit wrote. When the caret is known the
 * span ends there, since an insertion leaves the caret just after itself, and
 * starts where `next` stops matching what `previous` held before the part the
 * edit left alone. Prefix and suffix alone cannot place an insertion inside a
 * run of the same character: typing 4 between the 0 and 4 of "04" gives "044",
 * and they would pick the last 4. Without a caret, or when the text after the
 * caret changed too, the span is everything between the common prefix and
 * suffix.
 */
function changedSpan(previous: string, next: string, caret?: number): Inserted {
  if (caret !== undefined && caret <= next.length) {
    const head = previous.length - (next.length - caret);
    if (head >= 0 && previous.slice(head) === next.slice(caret)) {
      let start = 0;
      while (start < head && start < caret && previous[start] === next[start]) start += 1;
      return { start, end: caret };
    }
  }
  let start = 0;
  while (start < previous.length && start < next.length && previous[start] === next[start]) {
    start += 1;
  }
  let suffix = 0;
  while (
    suffix < previous.length - start &&
    suffix < next.length - start &&
    previous[previous.length - 1 - suffix] === next[next.length - 1 - suffix]
  ) {
    suffix += 1;
  }
  return { start, end: next.length - suffix };
}

/**
 * The digits an edit inserted, given the digits before and after it and, when
 * known, how many digits sit before the caret.
 */
export function insertedRange(previous: string, next: string, caret?: number): Inserted {
  return changedSpan(previous, next, caret);
}

/**
 * Where the text an edit inserted holds a separator: whitespace, `/`, `.`,
 * `-`, `–`, `,` or the locale's own. Each is returned as the gap, counted in
 * the digits of `raw`, that it follows; a run of them counts once. ISO that
 * arrives whole is read as digits first, so its hyphens are not separators.
 * `previous` is the field's text before the edit and `caret` its selection
 * start after it.
 */
export function typedSeparators(
  previous: string,
  raw: string,
  caret: number,
  shape: DateShape,
): number[] {
  const { start, end } = changedSpan(previous, raw, caret);
  let gap = normaliseDigits(raw.slice(0, start)).length;
  const gaps: number[] = [];
  for (const char of replaceWholeIso(raw.slice(start, end), shape)) {
    if (isDigit(char)) gap += 1;
    else if (isSeparator(char, shape) && gaps[gaps.length - 1] !== gap) gaps.push(gap);
  }
  return gaps;
}

function slotOf(index: number, shape: DateShape): { segment: Segment; position: number } {
  const within = index % DATE_DIGITS;
  let offset = 0;
  for (const segment of shape.order) {
    if (within < offset + WIDTH[segment]) return { segment, position: within - offset };
    offset += WIDTH[segment];
  }
  throw new RangeError(`No segment holds digit ${index}`);
}

type Verdict = 'accept' | 'pad' | 'refuse';

/**
 * One digit against the slot it lands in. A day may be 01–31 and a month
 * 01–12 in any month — whether that day exists in that month is not known
 * until both are in, so it is `readValue`'s question. A year may not start
 * with 0: the calendar's arithmetic would read years 0–99 as the 1900s.
 */
function check(segment: Segment, position: number, digit: number, first: number): Verdict {
  if (segment === 'year') return position === 0 && digit === 0 ? 'refuse' : 'accept';
  const highestFirst = segment === 'day' ? 3 : 1;
  if (position === 0) return digit <= highestFirst ? 'accept' : 'pad';
  if (first === 0) return digit >= 1 ? 'accept' : 'refuse';
  if (first < highestFirst) return 'accept';
  if (first === highestFirst) return digit <= (segment === 'day' ? 1 : 2) ? 'accept' : 'refuse';
  return 'refuse';
}

export type MaskResult = {
  /** The accepted digits, padding included. */
  digits: string;
  /** Those digits as the field shows them. */
  text: string;
  /** `acceptedAfter[i]` is how many accepted digits the first `i` input digits became. */
  acceptedAfter: number[];
};

/**
 * Frames `digits` into segments, or returns null when the edit is rejected.
 *
 * Insertions and deletions are treated differently, on purpose. Only the
 * digits this edit `inserted` are checked, each against the slot it lands in
 * once everything re-flows, and only they are padded. One refused digit, or
 * one digit past the limit, rejects the whole edit, so a paste never shifts
 * its digits into segments the user did not mean. A deletion inserts nothing
 * and is never refused: the digits after it re-flow unchecked, and
 * `readValue` says what is wrong. Checking deletions "for consistency" would
 * trap Backspace.
 *
 * A separator the edit typed (`inserted.separators`) completes a day or month
 * holding a single digit just before it: that digit gains a leading zero, so
 * `1/` becomes `01/`. The zero is checked like any inserted digit — `0/` would
 * make `00`, and rejects the edit — and counts in `acceptedAfter`. The
 * separator does nothing after a year digit, after a complete part, with no
 * digit before it, or between two digits the edit did not insert, which it
 * would otherwise split. A deletion types no separator, so it is never padded.
 */
export function applyMask(
  digits: string,
  shape: DateShape,
  mode: MaskMode,
  inserted: Inserted,
): MaskResult | null {
  const limit = digitsFor(mode);
  const separators = new Set(inserted.separators);
  const isInserted = (index: number) => index >= inserted.start && index < inserted.end;
  let accepted = '';
  const acceptedAfter = [0];

  for (let index = 0; index < digits.length; index += 1) {
    if (accepted.length >= limit) return null;
    const digit = Number(digits[index]);

    if (isInserted(index)) {
      const { segment, position } = slotOf(accepted.length, shape);
      const verdict = check(segment, position, digit, Number(accepted[accepted.length - 1]));
      if (verdict === 'refuse') return null;
      if (verdict === 'pad') accepted += '0';
    }

    accepted += String(digit);

    // A separator right after this digit. The digit, or what follows the
    // separator, has to be this edit's: a lone typed "/" after the field's
    // last digit counts, a "/" typed between two digits already there does not.
    const gap = index + 1;
    if (separators.has(gap) && (isInserted(index) || gap === digits.length || isInserted(gap))) {
      const { segment, position } = slotOf(accepted.length - 1, shape);
      if (segment !== 'year' && position === 0) {
        if (check(segment, 1, digit, 0) === 'refuse') return null;
        accepted = `${accepted.slice(0, -1)}0${digit}`;
      }
    }

    acceptedAfter.push(accepted.length);
  }

  return { digits: accepted, text: formatDigits(accepted, shape, mode), acceptedAfter };
}

/** One date's digits, with the separator added as soon as a segment is complete. */
function formatDate(digits: string, shape: DateShape): string {
  let text = '';
  let offset = 0;
  shape.order.forEach((segment, index) => {
    const chunk = digits.slice(offset, offset + WIDTH[segment]);
    offset += WIDTH[segment];
    text += chunk;
    if (chunk.length === WIDTH[segment] && index < shape.order.length - 1) {
      text += shape.separator;
    }
  });
  return text;
}

export function formatDigits(digits: string, shape: DateShape, mode: MaskMode): string {
  const start = formatDate(digits.slice(0, DATE_DIGITS), shape);
  if (mode === 'single' || digits.length < DATE_DIGITS) return start;
  return `${start}${RANGE_SEPARATOR}${formatDate(digits.slice(DATE_DIGITS), shape)}`;
}

function dateDigits(date: ISODate, shape: DateShape): string {
  const [year, month, day] = date.split('-') as [string, string, string];
  const segments: Record<Segment, string> = { year, month, day };
  return shape.order.map((segment) => segments[segment]).join('');
}

/** A value as the field shows it — exactly the text typing its digits produces. */
export function formatValue(
  value: ISODate | DateRange | null | undefined,
  shape: DateShape,
): string {
  if (!value) return '';
  if (typeof value === 'string') return formatDigits(dateDigits(value, shape), shape, 'single');
  return formatDigits(dateDigits(value.start, shape) + dateDigits(value.end, shape), shape, 'range');
}

/**
 * The format as letters. English, like every other string in the component;
 * the order and the separator are the locale's. Character for character it
 * lines up with a formatted value, which is what lets the shell draw the rest
 * of it behind the text.
 */
export function placeholderFor(shape: DateShape, mode: MaskMode): string {
  const one = shape.order.map((segment) => LETTERS[segment]).join(shape.separator);
  return mode === 'range' ? `${one}${RANGE_SEPARATOR}${one}` : one;
}

/** The mask in words: a screen reader reads "DD/MM/YYYY" letter by letter. */
export function hintFor(shape: DateShape, mode: MaskMode): string {
  const hint = `Type digits only, as ${shape.order.join(', ')}. Separators are added for you.`;
  return mode === 'range' ? `${hint} Then the end date the same way.` : hint;
}

/** Just after the `digitCount`-th digit of `text`, and past any separator that follows it. */
export function caretIndex(text: string, digitCount: number): number {
  if (digitCount === 0) return 0;
  let index = 0;
  let seen = 0;
  while (index < text.length && seen < digitCount) {
    if (isDigit(text[index]!)) seen += 1;
    index += 1;
  }
  while (index < text.length && !isDigit(text[index]!)) index += 1;
  return index;
}

export type Bounds = {
  min?: ISODate;
  max?: ISODate;
  isDateUnavailable?: (date: ISODate) => boolean;
};

export type ReadResult = { value: ISODate | DateRange } | { reason: DatePickerInvalidReason };

function toDate(digits: string, shape: DateShape): string {
  const read: Record<Segment, string> = { year: '', month: '', day: '' };
  let offset = 0;
  for (const segment of shape.order) {
    read[segment] = digits.slice(offset, offset + WIDTH[segment]);
    offset += WIDTH[segment];
  }
  return `${read.year}-${read.month}-${read.day}`;
}

/** GOV.UK's priority for one date: not a real date, then the bounds, then unavailability. */
function refusal(date: string, bounds: Bounds): DatePickerInvalidReason | null {
  if (!isValidISO(date) || date < '1000') return 'not-a-date';
  if (bounds.min !== undefined && compare(date, bounds.min) < 0) return 'before-min';
  if (bounds.max !== undefined && compare(date, bounds.max) > 0) return 'after-max';
  if (bounds.isDateUnavailable?.(date)) return 'unavailable';
  return null;
}

/**
 * The value the digits hold, or the first reason they do not hold one.
 * `incomplete` comes before everything. In range mode the start goes through
 * the whole list before the end does, and a pair whose end precedes its start
 * is put in order — the user expressed an interval, not an order.
 */
export function readValue(
  digits: string,
  shape: DateShape,
  mode: MaskMode,
  bounds: Bounds = {},
): ReadResult {
  if (digits.length < digitsFor(mode)) return { reason: 'incomplete' };

  const start = toDate(digits.slice(0, DATE_DIGITS), shape);
  const startRefusal = refusal(start, bounds);
  if (startRefusal) return { reason: startRefusal };
  if (mode === 'single') return { value: start };

  const end = toDate(digits.slice(DATE_DIGITS, DATE_DIGITS * 2), shape);
  const endRefusal = refusal(end, bounds);
  if (endRefusal) return { reason: endRefusal };
  return { value: orderRange(start, end) };
}
