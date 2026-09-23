import { describe, it, expect } from 'vitest';
import { density, densityModes } from './density';

describe('density', () => {
  it('holds the values the spec decided', () => {
    // Comfortable is what is drawn today; a change here moves every screen.
    expect(Object.fromEntries(Object.entries(density).map(([k, v]) => [k, [v.comfortable, v.compact]]))).toEqual({
      control: [40, 32],
      row: [72, 48],
      'row-header': [44, 36],
      hour: [80, 64],
      'nav-item': [40, 32],
    });
  });

  it('never makes compact larger than comfortable', () => {
    for (const [name, v] of Object.entries(density)) expect(v.compact, name).toBeLessThanOrEqual(v.comfortable);
  });

  it('keeps a compact control above WCAG 2.5.8’s 24', () => {
    expect(density.control.compact).toBeGreaterThanOrEqual(24);
    expect(density['nav-item'].compact).toBeGreaterThanOrEqual(24);
  });

  it('has two modes, comfortable first', () => {
    expect(densityModes).toEqual(['comfortable', 'compact']);
  });
});
