import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { theme } from '../tokens/theme';
import { spacing, radius, borderWidth } from '../tokens/scale';
import { textStyle } from '../tokens/typography';
import { elevation, shadowCss } from '../tokens/elevation';
import { motion } from '../tokens/motion';
import { alphaPrimitives } from '../tokens/primitives';
import { hexToRgb } from '../tokens/contrast';
import { block } from '@/test/css';

/**
 * The generated stylesheets are build artefacts, and build artefacts drift the
 * moment nobody is checking. These tests fail if someone edits a token without
 * regenerating, or edits a generated file by hand.
 *
 * Without them, "one source of truth" is a claim rather than a property.
 */

const read = (file: string) => readFileSync(new URL(file, import.meta.url), 'utf8');

const tokensCss = read('./tokens.css');
const tailwindCss = read('./tailwind-theme.css');

const flat = (name: string) => name.replace(/\//g, '-');

describe('tokens.css is in step with the token source', () => {
  it('declares every theme token', () => {
    for (const name of Object.keys(theme)) {
      expect(tokensCss, name).toContain(`--ap-color-${flat(name)}:`);
    }
  });

  it('declares every scale value with its current number', () => {
    for (const [name, px] of Object.entries(spacing)) {
      expect(tokensCss, `spacing/${name}`).toContain(`--ap-spacing-${name}: ${px}px;`);
    }
    for (const [name, px] of Object.entries(radius)) {
      expect(tokensCss, `radius/${name}`).toContain(`--ap-radius-${name}: ${px}px;`);
    }
    for (const [name, px] of Object.entries(borderWidth)) {
      expect(tokensCss, `border-width/${name}`).toContain(`--ap-border-width-${name}: ${px}px;`);
    }
  });

  it('declares every motion token with its current value', () => {
    for (const [name, ms] of Object.entries(motion.duration)) {
      expect(tokensCss, `motion/duration/${name}`).toContain(`--ap-motion-duration-${name}: ${ms}ms;`);
    }
    for (const [name, curve] of Object.entries(motion.easing)) {
      expect(tokensCss, `motion/easing/${name}`).toContain(`--ap-motion-easing-${name}: ${curve};`);
    }
  });

  it('declares dark twice — once for the system preference, once for an explicit choice', () => {
    // Only both together let a toggle override the system in either direction.
    expect(tokensCss).toContain('@media (prefers-color-scheme: dark)');
    expect(tokensCss).toContain(':root:not([data-theme="light"])');
    expect(tokensCss).toContain(':root[data-theme="dark"]');
  });

  it('narrows color-scheme to the theme the viewer chose', () => {
    // `light dark` on :root lets the UA follow the OS, which is right only
    // while nobody has chosen. Once data-theme is set, scrollbars, the native
    // <select> picker and autofill must follow the choice, not the OS.
    expect(tokensCss).toMatch(/:root\[data-theme="light"\]\s*\{[^}]*color-scheme: light;/);
    expect(tokensCss).toMatch(/:root\[data-theme="dark"\]\s*\{[^}]*color-scheme: dark;/);
  });

  it('flattens every alpha primitive to the same channels the contrast maths reads', () => {
    for (const [name, { hex, alpha }] of Object.entries(alphaPrimitives)) {
      const { r, g, b } = hexToRgb(hex);
      expect(tokensCss, name).toContain(`--ap-${flat(name)}: rgb(${r} ${g} ${b} / ${alpha});`);
    }
  });

  it('declares every elevation step in both modes', () => {
    // The shadow is what separates raised from overlay in light — the claim
    // theme.ts makes and, until the DropdownMenu, nothing drew.
    for (const [name, byMode] of Object.entries(elevation)) {
      expect(tokensCss, name).toContain(`--ap-elevation-${name}: ${shadowCss(byMode.light)};`);
      expect(tokensCss, name).toContain(`--ap-elevation-${name}: ${shadowCss(byMode.dark)};`);
    }
  });

  it('declares every elevation step in all three theme blocks, not just :root', () => {
    // Dark is written twice — once for the system preference, once for an
    // explicit choice. A shadow declared in only one of them is wrong for half
    // the readers, and renders fine.
    for (const name of Object.keys(elevation)) {
      const occurrences = tokensCss.split(`--ap-elevation-${name}:`).length - 1;
      expect(occurrences, name).toBe(3);
    }
  });
});

describe('the scale keeps the steps components actually need', () => {
  // 6 was dropped as drift once and the scale jumped 4 to 8, which quietly
  // rounded the medium badge up by two pixels. Naming the steps a component
  // depends on stops that happening again without a failure.
  it('has the badge radius', () => {
    // Both badge sizes share it: rounding differently at 24px and 30px reads as
    // two shapes rather than one component at two sizes.
    expect(radius.md, 'badge').toBe(6);
  });

  it('has the checkbox radius', () => {
    expect(radius.sm, 'checkbox').toBe(4);
  });

  it('has the field radius', () => {
    expect(radius.xl, 'input, textarea, select').toBe(12);
  });

  it('rises without gaps through the small end, where controls live', () => {
    expect([radius.xs, radius.sm, radius.md, radius.lg, radius.xl]).toEqual([2, 4, 6, 8, 12]);
  });
});

describe('the Tailwind theme is in step with the token source', () => {
  it('exposes every theme token as a colour utility', () => {
    for (const name of Object.keys(theme)) {
      expect(tailwindCss, name).toContain(`--color-${flat(name)}:`);
    }
  });

  it('points colours at the theme layer rather than restating hex values', () => {
    // A second copy of the palette would drift, and would not follow the theme.
    expect(tailwindCss).not.toMatch(/--color-[a-z-]+:\s*#/);
    for (const name of Object.keys(theme)) {
      expect(tailwindCss, name).toContain(`--color-${flat(name)}: var(--ap-color-${flat(name)});`);
    }
  });

  it('carries the same scale numbers as the tokens', () => {
    for (const [name, px] of Object.entries(spacing)) {
      expect(tailwindCss, `spacing/${name}`).toContain(`--spacing-${name}: ${px}px;`);
    }
    for (const [name, px] of Object.entries(radius)) {
      expect(tailwindCss, `radius/${name}`).toContain(`--radius-${name}: ${px}px;`);
    }
  });

  it('carries every text style with its size, leading and tracking', () => {
    for (const [name, style] of Object.entries(textStyle)) {
      const key = `--text-${flat(name)}`;
      expect(tailwindCss, name).toContain(`${key}: ${style.size}px;`);
      expect(tailwindCss, name).toContain(`${key}--line-height: ${style.lineHeight}px;`);
      expect(tailwindCss, name).toContain(`${key}--letter-spacing: ${style.tracking}px;`);
    }
  });
});

describe('tailwind-theme.css follows the tokens into dark', () => {
  it("gives Tailwind's dark: the rule the components follow", () => {
    // An explicit data-theme wins, otherwise the system preference. If the
    // variant and tokens.css disagree, a page shows `dark:` utilities in one
    // theme and the components in the other.
    const variant = block(tailwindCss, '@custom-variant dark');
    const system = block(variant, '@media (prefers-color-scheme: dark)');

    expect(tokensCss).toContain(':root[data-theme="dark"]');
    expect(variant).toContain('[data-theme="dark"]');
    expect(tokensCss).toContain(':root:not([data-theme="light"])');
    expect(system).toContain(':root:not([data-theme="light"])');
  });
});
