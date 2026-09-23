import type { ThemeTokenName, Mode } from '@/tokens/theme';

/**
 * What the Colour page and the Data visualisation page both know about the
 * chart palette, in one place so the two cannot disagree.
 */

export const SEQUENTIAL = [
  'chart/sequential-1',
  'chart/sequential-2',
  'chart/sequential-3',
  'chart/sequential-4',
  'chart/sequential-5',
] as const satisfies readonly ThemeTokenName[];

export const DIVERGING = [
  'chart/low-3',
  'chart/low-2',
  'chart/low-1',
  'chart/mid',
  'chart/high-1',
  'chart/high-2',
  'chart/high-3',
] as const satisfies readonly ThemeTokenName[];

export type ChartStep = (typeof SEQUENTIAL)[number] | (typeof DIVERGING)[number];

/** The custom property a token is read through. */
export const cssVar = (token: ThemeTokenName) => `var(--ap-color-${token.replace('/', '-')})`;

/**
 * The steps that sit near the canvas by design — a heatmap's low cells and
 * a diverging chart's centre are told apart by the legend and their
 * neighbours — so their figure against a ground is recorded, not graded.
 * The ±1 steps clear 3:1 in dark and not in light.
 */
export function recorded(token: ThemeTokenName, mode: Mode): boolean {
  if (token === 'chart/sequential-1' || token === 'chart/sequential-2' || token === 'chart/mid') return true;
  return mode === 'light' && (token === 'chart/low-1' || token === 'chart/high-1');
}
