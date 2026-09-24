/**
 * Alpenglow — layout
 *
 * The space around the content region and between its panes, stepping up with
 * the viewport. Measured from the original product's design file at 1440 —
 * 40 around the content, 20 between columns and cards — and stepped down for
 * narrower screens. The margin stays 16 below `lg` because the Scheduler's
 * five columns need 722, and 768 − 2 × 16 leaves 736 — a fit that holds when
 * the SideNav is a sheet below `lg`, as the dense screen passes it
 * (`narrow={media.down.lg}`). The package default keeps the rail there
 * instead: `SIDE_NAV_NARROW` is `media.down.md`, so a page that keeps that
 * default and needs the whole 736 should pass `narrow={media.down.lg}` too.
 *
 * The navigation is outside it: the margin starts at the SideNav's edge, or
 * at the window's when the SideNav is a sheet.
 *
 * tokens.css writes the narrow values on :root and restates them inside
 * `@media (width >= 64rem)` and `@media (width >= 80rem)`, so a reader writes
 * `var(--ap-layout-margin)` and no media query of their own.
 */

import type { BreakpointName } from './scale';

export const layoutModes = ['narrow', 'medium', 'wide'] as const;
export type LayoutMode = (typeof layoutModes)[number];

/** The breakpoint each mode starts at; narrow starts at the floor. */
export const layoutModeStart = { narrow: null, medium: 'lg', wide: 'xl' } as const satisfies Record<
  LayoutMode,
  BreakpointName | null
>;

type Entry = Record<LayoutMode, number> & { use: string };

export const layout = {
  margin: {
    narrow: 16,
    medium: 24,
    wide: 40,
    use: 'Around the content region: from the navigation’s edge, the window’s edge and the TopBar',
  },
  gap: { narrow: 16, medium: 20, wide: 20, use: 'Between panes, and between the columns of a composition' },
} as const satisfies Record<string, Entry>;

export type LayoutTokenName = keyof typeof layout;
