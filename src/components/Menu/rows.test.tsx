import { describe, it, expect } from 'vitest';
import { flattenActions, actionText, nextIndex, matchIndex } from './rows';
import type { MenuEntry } from './rows';

const items: MenuEntry[] = [
  { id: 'edit', label: 'Edit' },
  'separator',
  { label: 'Danger zone', items: [{ id: 'delete', label: 'Delete', tone: 'danger' }] },
];

describe('flattenActions', () => {
  it('returns every action in the order it is rendered, groups included', () => {
    expect(flattenActions(items).map((a) => a.id)).toEqual(['edit', 'delete']);
  });

  it('drops separators rather than counting them as rows', () => {
    // A separator that occupies a keyboard position is a dead press.
    expect(flattenActions(['separator', 'separator'])).toEqual([]);
  });
});

describe('actionText', () => {
  it('reads a plain string label', () => {
    expect(actionText({ id: 'a', label: 'Archive' })).toBe('Archive');
  });

  it('prefers textValue when the label is not text', () => {
    // Typeahead needs characters. A ReactNode label has none to offer.
    expect(actionText({ id: 'a', label: <span>Archive</span>, textValue: 'Archive' })).toBe('Archive');
  });

  it('falls back to the id rather than to nothing', () => {
    expect(actionText({ id: 'archive', label: <span>x</span> })).toBe('archive');
  });
});

describe('nextIndex', () => {
  it('steps forward and wraps at the end', () => {
    expect(nextIndex(2, 1, 3)).toBe(0);
  });

  it('steps back and wraps at the start', () => {
    expect(nextIndex(0, -1, 3)).toBe(2);
  });

  it('reports no row when there are none', () => {
    // Every row disabled is a real state; -1 is what the caller checks.
    expect(nextIndex(0, 1, 0)).toBe(-1);
  });
});

describe('matchIndex', () => {
  const texts = ['Archive', 'ブロック', 'Copy', 'Archive again'];

  it('finds the next match after the current row', () => {
    expect(matchIndex(texts, 0, 'a')).toBe(3);
  });

  it('wraps past the end to find an earlier match', () => {
    expect(matchIndex(texts, 3, 'a')).toBe(0);
  });

  it('ignores case', () => {
    expect(matchIndex(texts, 0, 'C')).toBe(2);
  });

  it('reports no match rather than moving focus somewhere arbitrary', () => {
    expect(matchIndex(texts, 0, 'z')).toBe(-1);
  });
});
