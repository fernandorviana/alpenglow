import { describe, it, expect } from 'vitest';
import { elevation, shadowCss } from './elevation';
import type { ShadowLayer } from './elevation';
import { alphaPrimitives } from './primitives';

describe('elevation', () => {
  it('points only at alpha primitives that exist', () => {
    for (const [name, byMode] of Object.entries(elevation)) {
      for (const mode of ['light', 'dark'] as const) {
        for (const layer of byMode[mode]) {
          expect(alphaPrimitives, `${name}/${mode}`).toHaveProperty(layer.colour);
        }
      }
    }
  });

  it('keeps the same geometry in both modes — only the ink changes', () => {
    // A shadow that moves when the theme changes is a layout shift, not a
    // theme. Light and dark differ in ink because the room differs.
    const shape = (ls: readonly ShadowLayer[]) =>
      ls.map((l) => `${l.y}/${l.blur}/${l.spread}`).join(' ');
    for (const [name, byMode] of Object.entries(elevation)) {
      expect(shape(byMode.dark), name).toBe(shape(byMode.light));
    }
  });

  it('renders a box-shadow that reads its colour from the primitive layer', () => {
    expect(shadowCss(elevation.md.light)).toBe(
      '0 10px 32px -4px var(--ap-alpha-ink-10), 0 6px 14px -6px var(--ap-alpha-ink-12)',
    );
  });

  it('renders lg as drawn: two layers of the shadow ink at 12%', () => {
    // The drawing's Drop Shadow/lg is #18274B at 12% on both layers; ink-12
    // is the system's rendering of that navy, measured for md.
    expect(shadowCss(elevation.lg.light)).toBe(
      '0 14px 64px -4px var(--ap-alpha-ink-12), 0 8px 22px -6px var(--ap-alpha-ink-12)',
    );
  });

  it('does not use the tinted ink in dark', () => {
    // The tint exists to match a measured drawing that only exists in light.
    // Over a near-black ground it is below threshold, so dark uses the ramp.
    for (const [name, byMode] of Object.entries(elevation)) {
      for (const layer of byMode.dark) {
        expect(layer.colour, name).toMatch(/^alpha\/black-/);
      }
    }
  });
});
