import { describe, it, expect } from 'vitest';
import * as root from './index';
import type { Density, LayoutMode } from './index';
import { density, densityModes } from './tokens/density';
import { breakpoint, media, minViewport } from './tokens/scale';
import { layout, layoutModes } from './tokens/layout';

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

  it('exports the breakpoints, the queries and the layout tokens', () => {
    expect(root.breakpoint).toBe(breakpoint);
    expect(root.media).toBe(media);
    expect(root.minViewport).toBe(minViewport);
    expect(root.layout).toBe(layout);
    expect(root.layoutModes).toBe(layoutModes);
    const mode: LayoutMode = 'wide';
    expect(root.layoutModes).toContain(mode);
  });

  it('exports the Table\'s thresholds for a caller who wants the numbers', () => {
    expect(root.columnThresholds).toBeTypeOf('function');
  });

  it('exports inlineButtonCount beside columnThresholds, for a caller with rowActions who calls the Table\'s own thresholds', () => {
    // columnThresholds needs the row's inline button count as its layout's
    // inlineButtons; without this export a caller with rowActions has no
    // way to produce that number themselves.
    expect(root.inlineButtonCount).toBeTypeOf('function');
  });
});
