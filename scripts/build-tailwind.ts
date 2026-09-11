/**
 * Generates src/styles/tailwind-theme.css — an Alpenglow theme for Tailwind v4.
 *
 * The point of this file is to prove the token layer is not tied to a styling
 * choice. The same source in src/tokens/*.ts feeds the plain CSS custom
 * properties, this Tailwind theme, and the contrast suite. A consumer using
 * Tailwind gets Alpenglow's vocabulary; a consumer who is not gets the
 * components and configures nothing.
 *
 * Colour utilities deliberately point at the existing --ap-color-* variables
 * rather than restating hex values. Those variables already switch between
 * light and dark, so `bg-surface-raised` themes itself and there is no second
 * copy of the palette to drift.
 */

import { writeFileSync } from 'node:fs';
import { theme } from '../src/tokens/theme.js';
import { spacing, radius, borderWidth } from '../src/tokens/scale.js';
import { fontFamily, fontWeight, textStyle } from '../src/tokens/typography.js';

const flat = (name: string) => name.replace(/\//g, '-');

const lines: string[] = [];

lines.push('/**');
lines.push(' * Alpenglow for Tailwind v4 — GENERATED FILE, DO NOT EDIT.');
lines.push(' * Source: src/tokens/*.ts · Regenerate with `npm run build:tailwind`');
lines.push(' *');
lines.push(' * Usage, after `npm install alpenglow`:');
lines.push(' *   @import "tailwindcss";');
lines.push(' *   @import "alpenglow/styles.css" layer(components);');
lines.push(' *   @import "alpenglow/tailwind-theme.css";');
lines.push(' */');
lines.push('');
lines.push('@theme {');

lines.push('  /* Colour — resolves through the theme layer, so these follow light and dark. */');
for (const name of Object.keys(theme)) {
  lines.push(`  --color-${flat(name)}: var(--ap-color-${flat(name)});`);
}

lines.push('');
lines.push('  /* Spacing */');
for (const [name, px] of Object.entries(spacing)) {
  lines.push(`  --spacing-${name}: ${px}px;`);
}

lines.push('');
lines.push('  /* Radius */');
for (const [name, px] of Object.entries(radius)) {
  lines.push(`  --radius-${name}: ${px}px;`);
}

lines.push('');
lines.push('  /* Stroke width */');
for (const [name, px] of Object.entries(borderWidth)) {
  lines.push(`  --border-width-${name}: ${px}px;`);
}

lines.push('');
lines.push('  /* Type */');
for (const [name, value] of Object.entries(fontFamily)) {
  lines.push(`  --font-${name}: ${value};`);
}
for (const [name, value] of Object.entries(fontWeight)) {
  lines.push(`  --font-weight-${name}: ${value};`);
}
for (const [name, style] of Object.entries(textStyle)) {
  lines.push(`  --text-${flat(name)}: ${style.size}px;`);
  lines.push(`  --text-${flat(name)}--line-height: ${style.lineHeight}px;`);
  lines.push(`  --text-${flat(name)}--letter-spacing: ${style.tracking}px;`);
}

lines.push('}');
lines.push('');

// The tokens' own rule, in the same selectors tokens.css writes: an explicit
// data-theme wins, otherwise the system preference. Tailwind's default `dark:`
// reads only the media query, so a viewer who chose light on a dark system
// would get dark utilities over light components.
lines.push('@custom-variant dark {');
lines.push('  &:where([data-theme="dark"], [data-theme="dark"] *) {');
lines.push('    @slot;');
lines.push('  }');
lines.push('  @media (prefers-color-scheme: dark) {');
lines.push('    &:where(:root:not([data-theme="light"]), :root:not([data-theme="light"]) *) {');
lines.push('      @slot;');
lines.push('    }');
lines.push('  }');
lines.push('}');
lines.push('');

writeFileSync(new URL('../src/styles/tailwind-theme.css', import.meta.url), lines.join('\n'));

console.log(
  `tailwind-theme.css written — ${Object.keys(theme).length} colours, ` +
    `${Object.keys(spacing).length} spacing, ${Object.keys(radius).length} radii, ` +
    `${Object.keys(textStyle).length} text styles`,
);
