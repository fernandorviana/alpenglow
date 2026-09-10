/**
 * Alpenglow — elevation
 *
 * The fourth token file, and the only one besides the theme that varies by
 * mode. It cannot live in either existing layer: the theme is typed as colour
 * aliases and the contrast suite iterates its keys, while the scale must not
 * vary by mode — and this does.
 *
 * It is NOT a fourth Figma collection. Effects are styles there, not
 * variables, so the three-collection architecture is unchanged.
 *
 * One step, `md`. The drawing has `sm` and `lg` in Light Mode; they land when
 * a component asks for them.
 *
 * Dark was never drawn. The source library has Drop Shadow sm/md/lg for
 * Light Mode and only sm for Dark Mode, so the dark values here are a decision
 * rather than a reading — and they are modest on purpose. Measured against the
 * ground the shadow falls on: in light, black at 8% over white reaches 1.19:1;
 * in dark, black at 64% over surface/base reaches only 1.16:1. An 8% shadow in
 * light does more than a 64% shadow in dark. Pushing dark to 48/64% buys 0.07
 * of ratio and costs a smear, so in dark the shadow renders a soft contact and
 * the surface takes a 1px border instead — see Menu.module.css.
 */

import type { AlphaPrimitiveName } from './primitives';
import type { Mode } from './theme';

export type ShadowLayer = {
  y: number;
  blur: number;
  spread: number;
  colour: AlphaPrimitiveName;
};

export const elevation = {
  md: {
    light: [
      { y: 10, blur: 32, spread: -4, colour: 'alpha/ink-10' },
      { y: 6, blur: 14, spread: -6, colour: 'alpha/ink-12' },
    ],
    dark: [
      { y: 10, blur: 32, spread: -4, colour: 'alpha/black-32' },
      { y: 6, blur: 14, spread: -6, colour: 'alpha/black-48' },
    ],
  },
} as const satisfies Record<string, Record<Mode, readonly ShadowLayer[]>>;

export type ElevationName = keyof typeof elevation;

/**
 * Renders a `box-shadow` whose colours are read from the primitive layer, so
 * the shadow follows a primitive edit the same way every other token does.
 */
export function shadowCss(layers: readonly ShadowLayer[]): string {
  return layers
    .map(
      (l) =>
        `0 ${l.y}px ${l.blur}px ${l.spread}px var(--ap-${l.colour.replace(/\//g, '-')})`,
    )
    .join(', ');
}
