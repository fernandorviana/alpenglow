import { describe, it, expect } from 'vitest';
import { appointmentsFor, practitioners, clients, DAY, NOW } from './data';

describe('the practice’s data', () => {
  it('is the same day every time', () => {
    expect(appointmentsFor(DAY)).toEqual(appointmentsFor(DAY));
  });

  it('differs from one day to the next', () => {
    expect(appointmentsFor('2026-09-18')).not.toEqual(appointmentsFor(DAY));
  });

  it('gives the fixed day a plausible load', () => {
    const day = appointmentsFor(DAY).filter((a) => a.kind === 'appointment');
    expect(day.length).toBeGreaterThanOrEqual(30);
    expect(day.length).toBeLessThanOrEqual(36);
    expect(new Set(day.map((a) => a.status))).toEqual(new Set(['confirmed', 'pending', 'cancelled']));
    expect(day.some((a) => a.end <= NOW)).toBe(true);
    expect(day.some((a) => a.start >= NOW)).toBe(true);
  });

  it('never double-books a practitioner', () => {
    for (const date of [DAY, '2026-09-18', '2026-09-21']) {
      for (const p of practitioners) {
        const own = appointmentsFor(date)
          .filter((a) => a.practitionerId === p.id && a.status !== 'cancelled')
          .sort((a, b) => a.start.localeCompare(b.start));
        own.slice(1).forEach((a, i) => expect(a.start >= own[i]!.end, `${date} ${p.name} ${a.start}`).toBe(true));
      }
    }
  });

  it('keeps each practitioner inside their hours, with lunch', () => {
    for (const p of practitioners) {
      const own = appointmentsFor(DAY).filter((a) => a.practitionerId === p.id);
      expect(own.filter((a) => a.kind === 'lunch')).toHaveLength(1);
      for (const a of own) {
        expect(Number(a.start.slice(11, 13))).toBeGreaterThanOrEqual(p.hours.start);
        expect(a.end.slice(11) <= `${String(p.hours.end).padStart(2, '0')}:00`).toBe(true);
      }
    }
  });

  it('has one external event and a weekend with nobody booked', () => {
    expect(appointmentsFor(DAY).filter((a) => a.kind === 'external')).toHaveLength(1);
    expect(appointmentsFor('2026-09-20').filter((a) => a.kind === 'appointment')).toEqual([]);
  });

  it('has five practitioners and sixty distinct clients', () => {
    expect(practitioners).toHaveLength(5);
    expect(new Set(clients).size).toBe(60);
  });
});
