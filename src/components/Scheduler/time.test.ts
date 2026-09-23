import { describe, it, expect } from 'vitest';
import {
  formatTime,
  formatTimeRange,
  hourLabels,
  minutesFrom,
  parseDateTime,
  toDateTime,
  usesTwelveHours,
} from './time';
import { lanes } from './layout';

/** ICU puts a narrow no-break space before AM; the tests read plain spaces. */
const plain = (s: string) => s.replace(/\s/g, ' ');

describe('wall-clock time', () => {
  it('splits a time into the date and the minutes, and refuses what is not one', () => {
    expect(parseDateTime('2023-04-20T11:30')).toEqual({ date: '2023-04-20', minutes: 690 });
    expect(parseDateTime('2023-04-20T00:00')).toEqual({ date: '2023-04-20', minutes: 0 });
    expect(parseDateTime('2023-04-20T24:00')).toBeNull();
    expect(parseDateTime('2023-04-20T11:60')).toBeNull();
    expect(parseDateTime('2023-02-30T11:00')).toBeNull();
    expect(parseDateTime('2023-04-20 11:00')).toBeNull();
    expect(parseDateTime('2023-04-20T11:00:00')).toBeNull();
  });

  it('joins a date and minutes, rolling past midnight into the next day', () => {
    expect(toDateTime('2023-04-20', 690)).toBe('2023-04-20T11:30');
    expect(toDateTime('2023-04-20', 0)).toBe('2023-04-20T00:00');
    expect(toDateTime('2023-04-20', 1440)).toBe('2023-04-21T00:00');
    expect(toDateTime('2023-04-30', 1500)).toBe('2023-05-01T01:00');
    expect(toDateTime('2023-04-20', -30)).toBe('2023-04-19T23:30');
  });

  it('counts minutes from a day, across days', () => {
    expect(minutesFrom('2023-04-20', '2023-04-20T09:15')).toBe(555);
    expect(minutesFrom('2023-04-20', '2023-04-21T01:00')).toBe(1500);
    expect(minutesFrom('2023-04-20', '2023-04-19T23:00')).toBe(-60);
    expect(minutesFrom('2023-04-20', 'nonsense')).toBeNull();
  });

  it('formats by the locale, twelve hours or twenty-four', () => {
    expect(usesTwelveHours('en-US')).toBe(true);
    expect(usesTwelveHours('pt-PT')).toBe(false);
    expect(plain(formatTime('en-US', 540))).toBe('9:00 AM');
    expect(plain(formatTime('en-US', 780))).toBe('1:00 PM');
    expect(formatTime('pt-PT', 540)).toBe('09:00');
    expect(plain(formatTimeRange('en-US', 660, 780))).toMatch(/^11:00 AM – 1:00 PM$/);
    expect(plain(formatTimeRange('pt-PT', 660, 780))).toMatch(/^11:00 – 13:00$/);
  });

  it('labels the hours as the drawings do, "9 AM" and "09:00"', () => {
    expect(hourLabels('en-US', { start: 9, end: 12 }).map(plain)).toEqual(['9 AM', '10 AM', '11 AM']);
    expect(hourLabels('pt-PT', { start: 9, end: 12 })).toEqual(['09:00', '10:00', '11:00']);
    expect(hourLabels('en-US', { start: 0, end: 24 })).toHaveLength(24);
    expect(hourLabels('en-US', { start: 12, end: 12 })).toEqual([]);
  });
});

describe('lanes', () => {
  it('gives a lone event the whole column', () => {
    expect(lanes([])).toEqual([]);
    expect(lanes([{ start: 60, end: 120 }])).toEqual([{ lane: 0, lanes: 1 }]);
  });

  it('puts two that overlap side by side, and two that touch one under the other', () => {
    expect(lanes([{ start: 60, end: 120 }, { start: 90, end: 150 }])).toEqual([
      { lane: 0, lanes: 2 },
      { lane: 1, lanes: 2 },
    ]);
    expect(lanes([{ start: 60, end: 120 }, { start: 120, end: 180 }])).toEqual([
      { lane: 0, lanes: 1 },
      { lane: 0, lanes: 1 },
    ]);
  });

  it('widens a chain to its widest point and reuses a freed lane', () => {
    // A overlaps B, B overlaps C, C does not overlap A: one cluster of two
    // lanes, C back in A's lane.
    expect(lanes([{ start: 0, end: 60 }, { start: 30, end: 90 }, { start: 60, end: 120 }])).toEqual([
      { lane: 0, lanes: 2 },
      { lane: 1, lanes: 2 },
      { lane: 0, lanes: 2 },
    ]);
    expect(lanes([{ start: 0, end: 60 }, { start: 10, end: 60 }, { start: 20, end: 60 }])).toEqual([
      { lane: 0, lanes: 3 },
      { lane: 1, lanes: 3 },
      { lane: 2, lanes: 3 },
    ]);
  });

  it('keeps clusters apart, in the items’ own order', () => {
    expect(
      lanes([{ start: 600, end: 660 }, { start: 0, end: 60 }, { start: 30, end: 90 }, { start: 630, end: 700 }]),
    ).toEqual([
      { lane: 0, lanes: 2 },
      { lane: 0, lanes: 2 },
      { lane: 1, lanes: 2 },
      { lane: 1, lanes: 2 },
    ]);
  });

  it('gives an event that ends before it starts a minute, so it still takes a lane', () => {
    expect(lanes([{ start: 60, end: 60 }, { start: 60, end: 60 }])).toEqual([
      { lane: 0, lanes: 2 },
      { lane: 1, lanes: 2 },
    ]);
  });
});
