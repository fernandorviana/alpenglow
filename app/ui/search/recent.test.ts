import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readRecent, remember, RECENT_KEY, RECENT_MAX } from './recent';

const item = (n: number) => ({ href: `/p${n}`, title: `Page ${n}`, crumb: 'Components' });

describe('recent', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('is empty at first', () => {
    expect(readRecent()).toEqual([]);
  });

  it('remembers newest first, capped at five', () => {
    expect(RECENT_MAX).toBe(5);
    for (let n = 1; n <= 7; n++) remember(item(n));
    expect(readRecent().map((r) => r.href)).toEqual(['/p7', '/p6', '/p5', '/p4', '/p3']);
  });

  it('moves a repeat to the front rather than listing it twice', () => {
    remember(item(1));
    remember(item(2));
    remember(item(1));
    expect(readRecent().map((r) => r.href)).toEqual(['/p1', '/p2']);
  });

  it('ignores storage it cannot read', () => {
    localStorage.setItem(RECENT_KEY, '{not json');
    expect(readRecent()).toEqual([]);
    localStorage.setItem(RECENT_KEY, JSON.stringify([{ href: 1 }, 'x', item(3)]));
    expect(readRecent()).toEqual([item(3)]);
  });

  it('survives a storage that throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied');
    });
    expect(readRecent()).toEqual([]);
    expect(remember(item(1))).toEqual([item(1)]);
  });
});
