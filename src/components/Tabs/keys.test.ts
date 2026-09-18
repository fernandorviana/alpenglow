import { describe, it, expect } from 'vitest';
import { nextTab } from './keys';

const ALL = [true, true, true];

describe('nextTab', () => {
  it('moves one tab along, and wraps at both ends', () => {
    expect(nextTab('ArrowRight', 0, ALL, false)).toBe(1);
    expect(nextTab('ArrowRight', 2, ALL, false)).toBe(0);
    expect(nextTab('ArrowLeft', 0, ALL, false)).toBe(2);
  });

  it('skips a disabled tab, as the menu skips a disabled row', () => {
    expect(nextTab('ArrowRight', 0, [true, false, true], false)).toBe(2);
    expect(nextTab('ArrowLeft', 2, [true, false, true], false)).toBe(0);
  });

  it('goes to the first and the last tab that can be selected', () => {
    expect(nextTab('Home', 2, [false, true, true], false)).toBe(1);
    expect(nextTab('End', 0, [true, true, false], false)).toBe(1);
  });

  it('follows the reading direction: in rtl the next tab is to the left', () => {
    expect(nextTab('ArrowLeft', 0, ALL, true)).toBe(1);
    expect(nextTab('ArrowRight', 0, ALL, true)).toBe(2);
  });

  it('leaves every other key alone', () => {
    // ArrowDown included: the list is horizontal, and down is the page's.
    for (const key of ['ArrowDown', 'ArrowUp', 'Tab', 'a', 'Enter', ' ']) {
      expect(nextTab(key, 0, ALL, false)).toBeNull();
    }
  });

  it('has nowhere to go when nothing can be selected', () => {
    expect(nextTab('ArrowRight', 0, [false, false], false)).toBeNull();
    expect(nextTab('Home', 0, [false, false], false)).toBeNull();
  });

  it('stays put when the focused tab is the only one enabled', () => {
    expect(nextTab('ArrowRight', 1, [false, true, false], false)).toBe(1);
  });
});
