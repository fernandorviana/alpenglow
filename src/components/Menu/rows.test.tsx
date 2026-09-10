import { describe, it, expect } from 'vitest';
import { flattenActions, actionText } from './rows';
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
