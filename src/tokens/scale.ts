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

export const radius = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
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

export type SpacingName = keyof typeof spacing;
export type RadiusName = keyof typeof radius;
export type BorderWidthName = keyof typeof borderWidth;
