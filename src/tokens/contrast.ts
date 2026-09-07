/**
 * WCAG 2.1 contrast maths, and resolution of theme tokens to concrete colour.
 *
 * This exists so the ratios documented across the system are *checked* rather
 * than trusted. Every threshold the design relies on is asserted in
 * contrast.test.ts, so changing a token without recomputing fails the build.
 */

import { primitives, alphaPrimitives } from './primitives.js';
import { theme, type ThemeTokenName, type Mode } from './theme.js';

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

/** Contrast between two theme tokens in the same mode. */
export function tokenContrast(a: ThemeTokenName, b: ThemeTokenName, mode: Mode): number {
  return contrast(resolve(a, mode), resolve(b, mode));
}

export const AA_NORMAL = 4.5;
export const AA_LARGE = 3.0;
/** WCAG 2.1 SC 1.4.11 — non-text contrast, for control boundaries. */
export const NON_TEXT = 3.0;
