import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { theme } from '../tokens/theme';
import { spacing, radius, borderWidth } from '../tokens/scale';
import { textStyle } from '../tokens/typography';

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

  it('declares dark twice — once for the system preference, once for an explicit choice', () => {
    // Only both together let a toggle override the system in either direction.
    expect(tokensCss).toContain('@media (prefers-color-scheme: dark)');
    expect(tokensCss).toContain(':root:not([data-theme="light"])');
    expect(tokensCss).toContain(':root[data-theme="dark"]');
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
