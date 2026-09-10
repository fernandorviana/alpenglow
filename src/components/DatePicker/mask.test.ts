import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import {
  RANGE_SEPARATOR,
  applyMask,
  caretIndex,
  dateShape,
  digitsFor,
  formatValue,
  hintFor,
  insertedRange,
  normaliseDigits,
  placeholderFor,
  readValue,
  replaceWholeIso,
  type DateShape,
  type MaskMode,
} from './mask';

const pt = dateShape('pt-PT');
const us = dateShape('en-US');
const ja = dateShape('ja-JP');

/**
 * Types `keys` one digit at a time at the end of the field, as a keyboard
 * would, and returns the text after each key, or null where the key was refused.
 */
function typeDigits(keys: string, shape: DateShape, mode: MaskMode = 'single') {
  let digits = '';
  const seen: (string | null)[] = [];
  for (const key of keys) {
    const next = digits + key;
    const masked = applyMask(next, shape, mode, insertedRange(digits, next));
    if (masked) digits = masked.digits;
    seen.push(masked ? masked.text : null);
  }
  return seen;
}

describe('dateShape', () => {
  it.each<[string, string[], string]>([
    ['en-US', ['month', 'day', 'year'], '/'],
    ['pt-PT', ['day', 'month', 'year'], '/'],
    ['de-DE', ['day', 'month', 'year'], '.'],
    ['nl-NL', ['day', 'month', 'year'], '-'],
    ['ja-JP', ['year', 'month', 'day'], '/'],
  ])('reads %s in its own order, joined by its own separator', (locale, order, separator) => {
    expect(dateShape(locale)).toEqual({ order, separator });
  });

  it('trims the spaces and the trailing dot ko-KR writes around its separator', () => {
    // ko-KR formats "2026. 04. 26." — the literal between segments is ". ".
    expect(dateShape('ko-KR')).toEqual({ order: ['year', 'month', 'day'], separator: '.' });
  });

  it('drops the bidi mark ar-EG puts before its slash', () => {
    expect(dateShape('ar-EG')).toEqual({ order: ['day', 'month', 'year'], separator: '/' });
  });

  it('reads the Gregorian order even where the locale defaults to another calendar', () => {
    // fa-IR formats in the Persian calendar unless the calendar is pinned.
    expect(dateShape('fa-IR').order).toEqual(['year', 'month', 'day']);
  });
});

describe('applyMask while typing', () => {
  it('adds the separator as soon as a segment is complete', () => {
    expect(typeDigits('12022025', pt)).toEqual([
      '1',
      '12/',
      '12/0',
      '12/02/',
      '12/02/2',
      '12/02/20',
      '12/02/202',
      '12/02/2025',
    ]);
  });

  it('pads a first digit that cannot start its segment', () => {
    expect(typeDigits('45', pt)).toEqual(['04/', '04/05/']);
    expect(typeDigits('2', us)).toEqual(['02/']);
  });

  it('refuses a second digit that makes the segment impossible', () => {
    expect(typeDigits('13', us)).toEqual(['1', null]);
    expect(typeDigits('00', us)).toEqual(['0', null]);
    expect(typeDigits('32', pt)).toEqual(['3', null]);
    expect(typeDigits('00', pt)).toEqual(['0', null]);
  });

  it('accepts the highest day and month there are', () => {
    expect(typeDigits('3112', pt).at(-1)).toBe('31/12/');
    expect(typeDigits('1231', us).at(-1)).toBe('12/31/');
  });

  it('refuses a year that starts with 0, which the calendar arithmetic would read as the 1900s', () => {
    expect(typeDigits('12020', pt)).toEqual(['1', '12/', '12/0', '12/02/', null]);
  });

  it('writes the year first where the locale does', () => {
    expect(typeDigits('20260426', ja).at(-1)).toBe('2026/04/26');
    expect(typeDigits('202645', ja).at(-1)).toBe('2026/04/05');
  });

  it('stops at eight digits in single mode', () => {
    expect(typeDigits('120220251', pt).at(-1)).toBeNull();
  });

  it('joins a range with an en dash after the eighth digit, and stops at sixteen', () => {
    expect(RANGE_SEPARATOR).toBe(' – ');
    const seen = typeDigits('12022025200220251', pt, 'range');
    expect(seen[7]).toBe(`12/02/2025${RANGE_SEPARATOR}`);
    expect(seen[15]).toBe(`12/02/2025${RANGE_SEPARATOR}20/02/2025`);
    expect(seen[16]).toBeNull();
  });
});

describe('applyMask on a whole edit', () => {
  it('rejects a paste whole rather than shifting its digits into other segments', () => {
    expect(applyMask('13022025', us, 'single', insertedRange('', '13022025'))).toBeNull();
  });

  it('never refuses a deletion, and reflows what is left unchecked', () => {
    const masked = applyMask('1022025', pt, 'single', insertedRange('12022025', '1022025'));
    expect(masked?.text).toBe('10/22/025');
  });

  it('checks a digit that replaces a selection, padding it where it lands', () => {
    const masked = applyMask('4022025', pt, 'single', insertedRange('12022025', '4022025'));
    expect(masked?.text).toBe('04/02/2025');
  });

  it('maps each input digit to the accepted digits after it, counting padding', () => {
    expect(applyMask('4', pt, 'single', insertedRange('', '4'))?.acceptedAfter).toEqual([0, 2]);
  });
});

describe('insertedRange', () => {
  it('finds what an edit inserted between an unchanged prefix and suffix', () => {
    expect(insertedRange('1202', '12302')).toEqual({ start: 2, end: 3 });
  });

  it('is empty for a pure deletion', () => {
    const { start, end } = insertedRange('12022025', '1022025');
    expect(end - start).toBe(0);
  });
});

describe('normaliseDigits and replaceWholeIso', () => {
  it('reads fullwidth and Arabic-Indic digits as ASCII, and drops everything else', () => {
    expect(normaliseDigits('１２/٠٢/۲۰۲۵ x')).toBe('12022025');
  });

  it('reorders ISO that arrives whole into the locale order', () => {
    expect(replaceWholeIso('2025-02-12', pt)).toBe('12022025');
    expect(replaceWholeIso('2025-02-12/2025-02-20', us)).toBe('02122025/02202025');
  });
});

describe('caretIndex', () => {
  it('puts the caret past a separator that follows the digit', () => {
    expect(caretIndex('12/', 2)).toBe(3);
    expect(caretIndex(`12/02/2025${RANGE_SEPARATOR}`, 8)).toBe(13);
  });

  it('leaves the caret beside a digit that follows the digit', () => {
    expect(caretIndex('10/22/025', 1)).toBe(1);
  });

  it('starts at 0 when no digit precedes it', () => {
    expect(caretIndex('12/', 0)).toBe(0);
  });
});

describe('readValue', () => {
  const weekend = (date: string) =>
    ['2023-04-01', '2023-04-02', '2023-04-08', '2023-04-09'].includes(date);
  const bounds = { min: '2023-04-03', max: '2023-04-24', isDateUnavailable: weekend };

  it('reads a complete date in the locale order', () => {
    expect(readValue('12022025', pt, 'single')).toEqual({ value: '2025-02-12' });
    expect(readValue('02122025', us, 'single')).toEqual({ value: '2025-02-12' });
  });

  it('reports incomplete before anything else', () => {
    expect(readValue('1202202', pt, 'single', bounds)).toEqual({ reason: 'incomplete' });
  });

  it('reports a date that does not exist, including one a deletion left behind', () => {
    expect(readValue('31022025', pt, 'single')).toEqual({ reason: 'not-a-date' });
    expect(readValue('29022025', pt, 'single')).toEqual({ reason: 'not-a-date' });
    expect(readValue('10222025', pt, 'single')).toEqual({ reason: 'not-a-date' });
    expect(readValue('01010999', pt, 'single')).toEqual({ reason: 'not-a-date' });
  });

  it('accepts 29 February in a leap year', () => {
    expect(readValue('29022024', pt, 'single')).toEqual({ value: '2024-02-29' });
  });

  it('reports the bounds, then unavailability', () => {
    expect(readValue('04012023', us, 'single', bounds)).toEqual({ reason: 'before-min' });
    expect(readValue('04302023', us, 'single', bounds)).toEqual({ reason: 'after-max' });
    expect(readValue('04082023', us, 'single', bounds)).toEqual({ reason: 'unavailable' });
    expect(readValue('04102023', us, 'single', bounds)).toEqual({ value: '2023-04-10' });
  });

  it('orders a reversed range rather than calling it an error', () => {
    expect(readValue('0410202304052023', us, 'range')).toEqual({
      value: { start: '2023-04-05', end: '2023-04-10' },
    });
  });

  it('checks the whole start of a range before its end', () => {
    // The start is before min and the end does not exist: the start's reason wins.
    expect(readValue('0401202302312023', us, 'range', bounds)).toEqual({ reason: 'before-min' });
    expect(readValue('0410202302312023', us, 'range', bounds)).toEqual({ reason: 'not-a-date' });
  });

  it('needs all sixteen digits for a range', () => {
    expect(readValue('04102023', us, 'range')).toEqual({ reason: 'incomplete' });
  });
});

describe('formatValue, placeholderFor and hintFor', () => {
  it('formats a value exactly as typing it would, so an emission does not move the caret', () => {
    expect(formatValue('2025-02-12', pt)).toBe(typeDigits('12022025', pt).at(-1));
    expect(formatValue({ start: '2023-04-05', end: '2023-04-10' }, us)).toBe(
      `04/05/2023${RANGE_SEPARATOR}04/10/2023`,
    );
    expect(formatValue(null, us)).toBe('');
  });

  it('writes the placeholder in the locale order and separator, in English letters', () => {
    expect(placeholderFor(pt, 'single')).toBe('DD/MM/YYYY');
    expect(placeholderFor(dateShape('de-DE'), 'single')).toBe('DD.MM.YYYY');
    expect(placeholderFor(us, 'range')).toBe(`MM/DD/YYYY${RANGE_SEPARATOR}MM/DD/YYYY`);
  });

  it('lines the placeholder up character for character with a typed value', () => {
    expect(placeholderFor(pt, 'range')).toHaveLength(
      formatValue({ start: '2025-02-12', end: '2025-02-20' }, pt).length,
    );
  });

  it('spells the order out in words for a screen reader', () => {
    expect(hintFor(pt, 'single')).toBe(
      'Type digits only, as day, month, year. Separators are added for you.',
    );
    expect(hintFor(us, 'range')).toBe(
      'Type digits only, as month, day, year. Separators are added for you. Then the end date the same way.',
    );
  });

  it('holds eight digits for a date and sixteen for a range', () => {
    expect(digitsFor('single')).toBe(8);
    expect(digitsFor('range')).toBe(16);
  });
});

describe('mask source', () => {
  it('reaches for neither Date nor a raw Intl formatter', () => {
    // `import.meta.url` is not a file URL under jsdom, so resolve from the root.
    const code = readFileSync('src/components/DatePicker/mask.ts', 'utf8');
    expect(code).not.toContain('Date.');
    expect(code).not.toContain('new Intl.');
  });
});
