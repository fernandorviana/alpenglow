import { describe, it, expect } from 'vitest';
import { pageItems } from './pages';

const show = (page: number, count: number, siblings?: number, boundaries?: number) =>
  pageItems(page, count, siblings, boundaries)
    .map((item) => (typeof item === 'number' ? item : '…'))
    .join(' ');

describe('pageItems', () => {
  it('draws the four drawn shapes', () => {
    expect(show(1, 3)).toBe('1 2 3');
    expect(show(1, 24)).toBe('1 2 3 4 5 … 24');
    expect(show(24, 24)).toBe('1 … 20 21 22 23 24');
    expect(show(8, 24)).toBe('1 … 7 8 9 … 24');
  });

  it('keeps seven places on every page, so the arrows do not move', () => {
    for (let page = 1; page <= 24; page++) expect(pageItems(page, 24), `page ${page}`).toHaveLength(7);
  });

  it('never hides a single page behind a gap', () => {
    expect(show(4, 24)).toBe('1 2 3 4 5 … 24');
    expect(show(5, 24)).toBe('1 … 4 5 6 … 24');
    expect(show(21, 24)).toBe('1 … 20 21 22 23 24');
    expect(show(4, 7)).toBe('1 2 3 4 5 6 7');
    expect(show(4, 8)).toBe('1 2 3 4 5 … 8');
  });

  it('names its two gaps apart, for keys', () => {
    expect(pageItems(8, 24).filter((item) => typeof item === 'string')).toEqual(['gap-start', 'gap-end']);
  });

  it('shows one page, and nothing for none', () => {
    expect(show(1, 1)).toBe('1');
    expect(pageItems(1, 0)).toEqual([]);
  });

  it('clamps a page that is not there', () => {
    expect(show(99, 24)).toBe(show(24, 24));
    expect(show(0, 24)).toBe(show(1, 24));
  });

  it('widens with siblings and boundaries', () => {
    expect(show(10, 30, 2, 1)).toBe('1 … 8 9 10 11 12 … 30');
    expect(show(10, 30, 1, 2)).toBe('1 2 … 9 10 11 … 29 30');
  });
});
