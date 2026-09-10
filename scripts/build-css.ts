/**
 * Generates src/styles/tokens.css from the TypeScript token source.
 *
 * TypeScript is the source of truth: it is what the contrast tests read, and
 * what `satisfies` type-checks so that no alias can point at a primitive that
 * does not exist. The CSS is a build artefact — never edit it by hand.
 *
 * The emitted CSS mirrors the three-layer structure: primitives, then the
 * theme aliasing them via var(), then the scale.
 */

import { writeFileSync } from 'node:fs';
import { primitives, alphaPrimitives } from '../src/tokens/primitives.js';
import { theme } from '../src/tokens/theme.js';
import { spacing, radius, borderWidth, focusRingOffset } from '../src/tokens/scale.js';
import { fontFamily, fontWeight, textStyle } from '../src/tokens/typography.js';
import { elevation, shadowCss } from '../src/tokens/elevation.js';

const PREFIX = 'ap';

const cssName = (name: string) => `--${PREFIX}-${name.replace(/\//g, '-')}`;

function primitiveBlock(): string {
  const lines = Object.entries(primitives).map(([k, v]) => `  ${cssName(k)}: ${v};`);
  const alpha = Object.entries(alphaPrimitives).map(([k, { hex, alpha }]) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `  ${cssName(k)}: rgb(${r} ${g} ${b} / ${alpha});`;
  });
  return [...lines, '', ...alpha].join('\n');
}

function themeBlock(mode: 'light' | 'dark', indent = '  '): string {
  return Object.entries(theme)
    .map(([name, entry]) => `${indent}${cssName(`color/${name}`)}: var(${cssName(entry[mode])});`)
    .join('\n');
}

function elevationBlock(mode: 'light' | 'dark', indent = '  '): string {
  return Object.entries(elevation)
    .map(([name, byMode]) => `${indent}${cssName(`elevation/${name}`)}: ${shadowCss(byMode[mode])};`)
    .join('\n');
}

function typographyBlock(): string {
  const lines: string[] = [
    ...Object.entries(fontFamily).map(([k, v]) => `  ${cssName(`font/${k}`)}: ${v};`),
    '',
    ...Object.entries(fontWeight).map(([k, v]) => `  ${cssName(`font-weight/${k}`)}: ${v};`),
    '',
  ];
  for (const [name, style] of Object.entries(textStyle)) {
    lines.push(`  /* ${style.use} */`);
    lines.push(`  ${cssName(`text/${name}/size`)}: ${style.size}px;`);
    lines.push(`  ${cssName(`text/${name}/line-height`)}: ${style.lineHeight}px;`);
    lines.push(`  ${cssName(`text/${name}/tracking`)}: ${style.tracking}px;`);
    if ('transform' in style) {
      lines.push(`  ${cssName(`text/${name}/transform`)}: ${style.transform};`);
    }
    lines.push('');
  }
  return lines.join('\n').trimEnd();
}

function scaleBlock(): string {
  return [
    ...Object.entries(spacing).map(([k, v]) => `  ${cssName(`spacing/${k}`)}: ${v}px;`),
    '',
    ...Object.entries(radius).map(([k, v]) => `  ${cssName(`radius/${k}`)}: ${v}px;`),
    '',
    ...Object.entries(borderWidth).map(([k, v]) => `  ${cssName(`border-width/${k}`)}: ${v}px;`),
    `  ${cssName('focus-ring-offset')}: ${focusRingOffset}px;`,
  ].join('\n');
}

const css = `/**
 * Alpenglow design tokens — GENERATED FILE, DO NOT EDIT.
 * Source: src/tokens/*.ts · Regenerate with \`npm run build:css\`
 *
 * Theme: Eleonora
 *
 * Dark mode is declared twice on purpose. The media query handles viewers who
 * have expressed no preference in the app, guarded by :not([data-theme="light"])
 * so an explicit light choice still wins. The attribute selector handles an
 * explicit dark choice. Without both, a toggle cannot override the system
 * preference in both directions.
 */

/* ---------------------------------------------------------------------------
   Layer 1 — primitives. Raw values with no meaning. Do not use these directly.
   --------------------------------------------------------------------------- */

:root {
${primitiveBlock()}
}

/* ---------------------------------------------------------------------------
   Layer 2 — theme: Eleonora, light. The only layer that varies by mode.
   --------------------------------------------------------------------------- */

:root {
  color-scheme: light dark;

${themeBlock('light')}

${elevationBlock('light')}
}

/* Dark, for viewers whose system asks for it and who have not chosen light. */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
${themeBlock('dark', '    ')}

${elevationBlock('dark', '    ')}
  }
}

/* Dark, chosen explicitly. */
:root[data-theme="dark"] {
${themeBlock('dark')}

${elevationBlock('dark')}
}

/* ---------------------------------------------------------------------------
   Layer 3 — scale. Dimension does not vary by theme.
   --------------------------------------------------------------------------- */

:root {
${scaleBlock()}
}

/* ---------------------------------------------------------------------------
   Layer 3 — typography. Style and weight are independent axes.
   --------------------------------------------------------------------------- */

:root {
${typographyBlock()}
}

/* ---------------------------------------------------------------------------
   Base
   --------------------------------------------------------------------------- */

/* Available to a screen reader, absent from the page. Used where a control is
   understood visually by shape or colour and needs a name in words too. */
.ap-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

body {
  background: var(${cssName('color/surface/base')});
  color: var(${cssName('color/text/primary')});
  font-family: var(${cssName('font/sans')});
  font-size: var(${cssName('text/body/md/size')});
  line-height: var(${cssName('text/body/md/line-height')});
  letter-spacing: var(${cssName('text/body/md/tracking')});
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
`;

writeFileSync(new URL('../src/styles/tokens.css', import.meta.url), css);
console.log(
  `tokens.css written — ${Object.keys(primitives).length + Object.keys(alphaPrimitives).length} primitives, ` +
    `${Object.keys(theme).length} theme tokens, ` +
    `${Object.keys(elevation).length} elevation steps, ` +
    `${Object.keys(spacing).length + Object.keys(radius).length + Object.keys(borderWidth).length} scale values, ` +
    `${Object.keys(textStyle).length} text styles`,
);
