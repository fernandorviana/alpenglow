import { describe, it, expect } from 'vitest';
import { breakpoint, media, minViewport } from './scale';
import { layout, layoutModes, layoutModeStart } from './layout';

describe('the breakpoint scale', () => {
  it("is Tailwind's five and xs below them", () => {
    expect(breakpoint).toEqual({ xs: 480, sm: 640, md: 768, lg: 1024, xl: 1280, '2xl': 1536 });
    expect(minViewport).toBe(320);
  });

  it('writes each step as a range query in rem', () => {
    expect(media.up.md).toBe('(width >= 48rem)');
    expect(media.down.md).toBe('(width < 48rem)');
    expect(media.down.xs).toBe('(width < 30rem)');
    expect(media.up['2xl']).toBe('(width >= 96rem)');
    for (const [name, px] of Object.entries(breakpoint)) {
      expect(media.up[name as keyof typeof breakpoint]).toBe(`(width >= ${px / 16}rem)`);
      expect(media.down[name as keyof typeof breakpoint]).toBe(`(width < ${px / 16}rem)`);
    }
  });
});

describe('the layout tokens', () => {
  it('step margin and gap up at lg and xl', () => {
    expect(layoutModes).toEqual(['narrow', 'medium', 'wide']);
    expect(layoutModeStart).toEqual({ narrow: null, medium: 'lg', wide: 'xl' });
    expect(layout.margin).toMatchObject({ narrow: 16, medium: 24, wide: 40 });
    expect(layout.gap).toMatchObject({ narrow: 16, medium: 20, wide: 20 });
  });

  it('never narrows as the screen widens', () => {
    for (const token of [layout.margin, layout.gap]) {
      expect(token.narrow).toBeLessThanOrEqual(token.medium);
      expect(token.medium).toBeLessThanOrEqual(token.wide);
    }
  });
});
