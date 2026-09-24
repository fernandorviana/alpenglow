import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { theme } from '../tokens/theme';
import { spacing, radius, borderWidth, breakpoint, media } from '../tokens/scale';
import { textStyle } from '../tokens/typography';
import { elevation, shadowCss } from '../tokens/elevation';
import { motion } from '../tokens/motion';
import { alphaPrimitives } from '../tokens/primitives';
import { hexToRgb } from '../tokens/contrast';
import { density } from '../tokens/density';
import { layout } from '../tokens/layout';
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

describe('tokens.css carries density', () => {
  it('declares every density token at its comfortable value on :root', () => {
    const root = block(tokensCss, 'Layer 3 — density');
    for (const [name, v] of Object.entries(density)) {
      expect(root, name).toContain(`--ap-density-${name}: ${v.comfortable}px;`);
    }
  });

  it('declares compact on any element that asks for it, not only :root', () => {
    const compact = block(tokensCss, '[data-density="compact"] {');
    for (const [name, v] of Object.entries(density)) {
      expect(compact, name).toContain(`--ap-density-${name}: ${v.compact}px;`);
    }
    expect(tokensCss).not.toContain(':root[data-density="compact"]');
  });

  it('gives touch the comfortable values back', () => {
    const coarse = block(tokensCss, '@media (pointer: coarse)');
    expect(coarse).toContain('[data-density="compact"]');
    for (const [name, v] of Object.entries(density)) {
      expect(coarse, name).toContain(`--ap-density-${name}: ${v.comfortable}px;`);
    }
  });

  it('lets a region inside a compact one return to comfortable', () => {
    // Comfortable only on :root would leave data-density="comfortable" doing
    // nothing: below a compact ancestor, the compact values would inherit.
    const comfortable = block(tokensCss, ':root, [data-density="comfortable"] {');
    for (const [name, v] of Object.entries(density)) {
      expect(comfortable, name).toContain(`--ap-density-${name}: ${v.comfortable}px;`);
    }
  });
});

describe('the Tailwind theme carries density where it is used', () => {
  it('declares density in an inline theme block, under the spacing namespace', () => {
    // A plain @theme puts the variable on :root and the utility reads it, so
    // var(--ap-density-row) resolves once, on :root, to the comfortable value.
    // Inline writes var(--ap-density-row) into the utility itself.
    const inline = block(tailwindCss, '@theme inline {');
    for (const name of Object.keys(density)) {
      expect(inline, name).toContain(`--spacing-density-${name}: var(--ap-density-${name});`);
    }
    expect(block(tailwindCss, '@theme {')).not.toContain('density');
  });

  it('compiles h-density-row to a height that reads the token where it is used', async () => {
    // The compiler Tailwind itself runs, on the file a consumer imports. What
    // matters is the declaration in the utility, not the variable's name.
    const { compile } = await import('tailwindcss');
    const compiler = await compile(`@import "tailwindcss/theme.css";\n@import "tailwindcss/utilities.css";\n${tailwindCss}`, {
      base: process.cwd(),
      loadStylesheet: async (id: string) => {
        const path = `${process.cwd()}/node_modules/${id}`;
        return { path, base: process.cwd(), content: readFileSync(path, 'utf8') };
      },
    });
    const out = compiler.build(['h-density-row', 'min-h-density-control']);
    expect(block(out, '.h-density-row')).toContain('height: var(--ap-density-row);');
    expect(block(out, '.min-h-density-control')).toContain('min-height: var(--ap-density-control);');
    expect(out).not.toMatch(/--(spacing-)?density-row:\s*var\(--ap-density-row\)/);
  });
});

describe('tokens.css carries the breakpoints and the layout', () => {
  it('declares each breakpoint in rem, for JS and for reading', () => {
    const root = block(tokensCss, 'Layer 3 — breakpoints');
    for (const [name, px] of Object.entries(breakpoint)) {
      expect(root, name).toContain(`--ap-breakpoint-${name}: ${px / 16}rem;`);
    }
  });

  it('gives margin and gap their narrow values on :root and steps them at lg and xl', () => {
    const narrow = block(tokensCss, 'Layer 3 — layout');
    expect(narrow).toContain(`--ap-layout-margin: ${layout.margin.narrow}px;`);
    expect(narrow).toContain(`--ap-layout-gap: ${layout.gap.narrow}px;`);
    const medium = block(tokensCss, `@media ${media.up.lg}`);
    expect(medium).toContain(`--ap-layout-margin: ${layout.margin.medium}px;`);
    expect(medium).toContain(`--ap-layout-gap: ${layout.gap.medium}px;`);
    const wide = block(tokensCss, `@media ${media.up.xl}`);
    expect(wide).toContain(`--ap-layout-margin: ${layout.margin.wide}px;`);
    expect(wide).toContain(`--ap-layout-gap: ${layout.gap.wide}px;`);
    // Medium comes before wide, so at 1280 and up the wide block wins by order.
    expect(tokensCss.indexOf(`@media ${media.up.lg}`)).toBeLessThan(tokensCss.indexOf(`@media ${media.up.xl}`));
  });
});

describe('the Tailwind theme carries the breakpoints and the layout', () => {
  it('restates the six breakpoints and writes the layout spacing inline', () => {
    const theme = block(tailwindCss, '@theme {');
    for (const [name, px] of Object.entries(breakpoint)) {
      expect(theme, name).toContain(`--breakpoint-${name}: ${px / 16}rem;`);
    }
    const inline = block(tailwindCss, '@theme inline {');
    expect(inline).toContain('--spacing-layout-margin: var(--ap-layout-margin);');
    expect(inline).toContain('--spacing-layout-gap: var(--ap-layout-gap);');
  });

  it("compiles xs: at 30rem, keeps Tailwind's md: at 48rem, and reads the layout where it is used", async () => {
    const { compile } = await import('tailwindcss');
    const compiler = await compile(`@import "tailwindcss/theme.css";\n@import "tailwindcss/utilities.css";\n${tailwindCss}`, {
      base: process.cwd(),
      loadStylesheet: async (id: string) => {
        const path = `${process.cwd()}/node_modules/${id}`;
        return { path, base: process.cwd(), content: readFileSync(path, 'utf8') };
      },
    });
    const out = compiler.build(['xs:hidden', 'md:hidden', 'px-layout-margin', 'gap-layout-gap']);
    expect(out).toContain('@media (width >= 30rem)');
    expect(out).toContain('@media (width >= 48rem)');
    expect(block(out, '.px-layout-margin')).toContain('padding-inline: var(--ap-layout-margin);');
    expect(block(out, '.gap-layout-gap')).toContain('gap: var(--ap-layout-gap);');
  });
});
