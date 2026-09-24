/**
 * Alpenglow — scale
 *
 * Dimension tokens. These do not vary by theme, which is why they live apart
 * from the theme layer: inside a moded collection every value would be
 * duplicated across modes and free to drift, and a mis-set theme would change
 * layout rather than only colour.
 *
 * Spacing follows the Atlassian convention where `100` = 8px.
 */

export const spacing = {
  0: 0,
  '025': 2,
  '050': 4,
  '075': 6,
  100: 8,
  150: 12,
  200: 16,
  250: 20,
  300: 24,
  400: 32,
  500: 40,
  600: 48,
  700: 56,
  800: 64,
  900: 72,
  1000: 80,
  1100: 96,
  1200: 128,
  1300: 160,
  1400: 192,
  1500: 240,
  1600: 320,
} as const;

/**
 * `full` is the button radius. Alpenglow's buttons are capsules — it is the
 * most recognisable thing about the system's shape language, so it is called
 * out here rather than left for a component to decide.
 *
 * 6 was originally dropped as drift and the scale jumped 4 to 8. It is not
 * drift: it is the medium badge, drawn deliberately. It appeared as often in
 * the source as 2, which was kept — so one was discarded and the other kept on
 * the same evidence. Adding it shifts every name above it by one step.
 */
export const radius = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  '2xl': 16,
  '3xl': 20,
  '4xl': 24,
  full: 9999,
} as const;

export const borderWidth = {
  /** Dividers, card outlines. Never changes on focus or error. */
  hairline: 1,
  /** Form controls: input, textarea, select, checkbox, radio. */
  control: 1.5,
  /** The focus ring itself, drawn outside the control at a 2px offset. */
  ring: 2,
} as const;

/** The focus ring sits this far outside the control. */
export const focusRingOffset = 2;

/**
 * Breakpoints. Tailwind's five, so `md:` means the same in a product and in
 * the package, and `xs` below them, where a phone's layout ends: every phone
 * width in use (360–440) is under 480, and the Toast and the CommandPalette
 * turn there. `sm` and `2xl` have no reader yet; they ship because the scale
 * is a known one.
 *
 * A media query cannot read a custom property. Write the query in rem and in
 * range syntax — `@media (width < 48rem)` — or take it from `media`; the rem
 * follows a reader's default font size. `src/styles/breakpoints.test.ts`
 * fails on any width outside this scale.
 */
export const breakpoint = {
  xs: 480,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

/** The narrowest width the system is built and tested at: WCAG 1.4.10's reflow. Not a breakpoint. */
export const minViewport = 320;

export type BreakpointName = keyof typeof breakpoint;

const queries = (op: '>=' | '<') =>
  Object.fromEntries(Object.entries(breakpoint).map(([name, px]) => [name, `(width ${op} ${px / 16}rem)`])) as Record<
    BreakpointName,
    string
  >;

/** `media.up.md` is `(width >= 48rem)`, `media.down.md` is `(width < 48rem)`: for `useMediaQuery` and `matchMedia`. */
export const media = { up: queries('>='), down: queries('<') } as const;

export type SpacingName = keyof typeof spacing;
export type RadiusName = keyof typeof radius;
export type BorderWidthName = keyof typeof borderWidth;
