import { describe, it, expect } from 'vitest';
import { formatSlots, moveSpan, resizeSpan, snap, spanFromDrag, spanFromPress } from './interaction';

/** ICU's thin and narrow spaces, made plain; the newline between days stays. */
const plain = (s: string) => s.replace(/[ \u00a0\u2009\u202f]+/g, ' ');
const DAY = 24 * 60;

describe('the gestures, in minutes', () => {
  it('snaps to the step and stays inside the day', () => {
    expect(snap(7, 15, DAY)).toBe(0);
    expect(snap(8, 15, DAY)).toBe(15);
    expect(snap(-20, 15, DAY)).toBe(0);
    expect(snap(DAY + 40, 15, DAY)).toBe(DAY);
    expect(snap(50, 30, DAY)).toBe(60);
  });

  it('makes a press a span of the default duration from the step it fell in', () => {
    expect(spanFromPress(700, 15, 30, DAY)).toEqual({ start: 690, end: 720 });
    expect(spanFromPress(DAY - 10, 15, 30, DAY)).toEqual({ start: DAY - 30, end: DAY });
    expect(spanFromPress(5, 15, 30, 20)).toEqual({ start: 0, end: 20 });
  });

  it('makes a drag a span either way, at least a step long', () => {
    expect(spanFromDrag(600, 700, 15, DAY)).toEqual({ start: 600, end: 705 });
    expect(spanFromDrag(700, 600, 15, DAY)).toEqual({ start: 600, end: 705 });
    expect(spanFromDrag(600, 603, 15, DAY)).toEqual({ start: 600, end: 615 });
    expect(spanFromDrag(DAY, DAY - 2, 15, DAY)).toEqual({ start: DAY - 15, end: DAY });
  });

  it('moves a span by the pointer less its grip, keeping the duration and staying inside the day', () => {
    const span = { start: 600, end: 660 };
    expect(moveSpan(span, 640, 10, 15, DAY)).toEqual({ start: 630, end: 690 });
    expect(moveSpan(span, 2, 10, 15, DAY)).toEqual({ start: 0, end: 60 });
    expect(moveSpan(span, DAY, 0, 15, DAY)).toEqual({ start: DAY - 60, end: DAY });
  });

  it('resizes the end to the pointer, never under a step after the start', () => {
    const span = { start: 600, end: 660 };
    expect(resizeSpan(span, 700, 15, DAY)).toEqual({ start: 600, end: 705 });
    expect(resizeSpan(span, 590, 15, DAY)).toEqual({ start: 600, end: 615 });
    expect(resizeSpan({ start: DAY - 10, end: DAY }, 0, 15, DAY)).toEqual({ start: DAY - 10, end: DAY });
  });
});

describe('formatSlots', () => {
  it('writes one line per day, the slots in order, by the locale', () => {
    const text = formatSlots(
      [
        { start: '2023-04-23T11:30', end: '2023-04-23T13:00' },
        { start: '2023-04-22T17:00', end: '2023-04-22T18:00' },
        { start: '2023-04-22T15:00', end: '2023-04-22T16:00' },
        { start: 'junk', end: 'junk' },
      ],
      'en-US',
    );
    expect(plain(text)).toBe('Saturday, April 22: 3:00 – 4:00 PM, 5:00 – 6:00 PM\nSunday, April 23: 11:30 AM – 1:00 PM');
    expect(plain(formatSlots([{ start: '2023-04-22T15:00', end: '2023-04-22T16:00' }], 'pt-PT'))).toMatch(
      /^sábado, 22 de abril: 15:00 – 16:00$/,
    );
    expect(formatSlots([])).toBe('');
  });

  it('closes a slot that runs over midnight at the end of its day', () => {
    expect(plain(formatSlots([{ start: '2023-04-22T23:00', end: '2023-04-23T01:00' }]))).toBe(
      'Saturday, April 22: 11:00 PM – 12:00 AM',
    );
  });
});
