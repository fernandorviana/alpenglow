/**
 * WCAG 2.1 contrast maths, and resolution of theme tokens to concrete colour.
 *
 * This exists so the ratios documented across the system are *checked* rather
 * than trusted. Every threshold the design relies on is asserted in
 * contrast.test.ts, so changing a token without recomputing fails the build.
 */

import { primitives, alphaPrimitives } from './primitives';
import { theme, type ThemeTokenName, type Mode } from './theme';

export type Rgb = { r: number; g: number; b: number };

export function hexToRgb(hex: string): Rgb {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

export function rgbToHex({ r, g, b }: Rgb): string {
  const c = (v: number) => Math.round(v).toString(16).padStart(2, '0').toUpperCase();
  return `#${c(r)}${c(g)}${c(b)}`;
}

/** Flatten a semi-transparent colour over an opaque background. */
export function composite(fg: Rgb, bg: Rgb, alpha: number): Rgb {
  return {
    r: fg.r * alpha + bg.r * (1 - alpha),
    g: fg.g * alpha + bg.g * (1 - alpha),
    b: fg.b * alpha + bg.b * (1 - alpha),
  };
}

/** WCAG 2.1 relative luminance. */
export function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const lin = (v: number) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** WCAG 2.1 contrast ratio. Symmetric: order of arguments does not matter. */
export function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/**
 * OKLCH lightness, 0–1. The instrument for surface against surface.
 *
 * The WCAG ratio adds 0.05 to both luminances, which flattens the dark end:
 * two dark greys everyone can tell apart come back at 1.06–1.08:1, while a
 * step twice as large reads 1.19. Text on a surface and a boundary on a
 * surface stay on the ratio, which is what WCAG asks of them; a ladder step,
 * a well inside a card and a wash over a surface are measured here, with a
 * floor of ΔL .035 — just under the smallest step the reference systems ship.
 */
export function lightness(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const lin = (v: number) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const [lr, lg, lb] = [lin(r), lin(g), lin(b)];
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
}

/** The smallest lightness step between two surfaces that counts as a step. */
export const SURFACE_STEP = 0.035;

function isAlpha(name: string): name is keyof typeof alphaPrimitives {
  return name in alphaPrimitives;
}

/**
 * Resolve a theme token to an opaque hex value.
 *
 * Alpha tokens need a background to flatten against; passing one for an opaque
 * token is harmless and ignored.
 */
export function resolve(token: ThemeTokenName, mode: Mode, over?: string): string {
  const alias = theme[token][mode] as string;

  if (isAlpha(alias)) {
    const { hex, alpha } = alphaPrimitives[alias];
    if (!over) {
      throw new Error(`Token "${token}" resolves to the alpha primitive "${alias}" — pass a background to flatten it against.`);
    }
    return rgbToHex(composite(hexToRgb(hex), hexToRgb(over), alpha));
  }

  const value = primitives[alias as keyof typeof primitives];
  if (!value) throw new Error(`Token "${token}" aliases "${alias}", which is not a primitive.`);
  return value;
}

/**
 * Contrast between two theme tokens in the same mode.
 *
 * `b` is the ground. If it is an alpha token — a wash — it is flattened over
 * `ground` first, and it is an error to leave `ground` out. If `a` is an
 * alpha token — a wash or the subtle border — it is flattened over `b`. So
 * `tokenContrast('text/tertiary', 'interactive/wash-hover', mode, 'surface/raised')`
 * is helper text on a hovered row on a card, and
 * `tokenContrast('border/subtle', 'surface/sunken', mode)` is the divider on
 * a well.
 */
export function tokenContrast(a: ThemeTokenName, b: ThemeTokenName, mode: Mode, ground?: ThemeTokenName): number {
  const bg = resolve(b, mode, ground ? resolve(ground, mode) : undefined);
  return contrast(resolve(a, mode, bg), bg);
}

export const AA_NORMAL = 4.5;
export const AA_LARGE = 3.0;
/** WCAG 2.1 SC 1.4.11 — non-text contrast, for control boundaries. */
export const NON_TEXT = 3.0;
