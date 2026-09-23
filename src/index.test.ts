import { describe, it, expect } from 'vitest';
import * as root from './index';
import type { Density } from './index';
import { density, densityModes } from './tokens/density';

/**
 * The package root is the interface a consumer reads the token layers from.
 * A layer that is in tokens.css and in the Figma export but not here is one a
 * TypeScript consumer has to restate by hand.
 */
describe('the package root', () => {
  it('exports density beside the other token layers', () => {
    expect(root.density).toBe(density);
    expect(root.densityModes).toBe(densityModes);
    expect(root.spacing).toBeDefined();
    expect(root.motion).toBeDefined();
  });

  it('exports the Density mode type', () => {
    const mode: Density = 'compact';
    expect(root.densityModes).toContain(mode);
  });
});
