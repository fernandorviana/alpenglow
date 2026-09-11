import { readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { ComponentType } from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { readCss } from '@/test/css';
import { Ratio } from './Ratio';

/**
 * A ratio and its grade are one reading, "11.26 AAA", so `.ratio` does not
 * wrap: split across two lines, the grade reads as the start of whatever
 * follows. That is right for one reading and wrong for a sentence of them.
 * The home page and the Decisions page once put `.ratio` on a paragraph of
 * readings, for its monospace, and on a 375px phone each paragraph ran on in
 * one line — the home page was 527px wide and Decisions 588px. jsdom cannot
 * measure a page, so these guard the cause instead.
 */

const css = readCss('app/docs.css');

/** The declarations of every rule whose selector list names `selector`. */
const rules = (selector: string) =>
  [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter(([, selectors]) => selectors!.split(',').some((s) => s.trim() === selector))
    .map(([, , body]) => body!.replace(/\s+/g, ' ').trim())
    .join(' ');

describe('Ratio', () => {
  it('keeps a value and its grade on one line', () => {
    const { container } = render(<Ratio fg="#000000" bg="#ffffff" />);
    const reading = container.querySelector('.ratio');
    expect(reading).toHaveTextContent('21.00AAA');
    expect(reading?.querySelector('.grade')).toBeTruthy();
    expect(rules('.ratio')).toMatch(/white-space: nowrap/);
  });

  it('leaves a sentence of readings free to wrap', () => {
    expect(rules('.ratioLine')).toMatch(/font-family/);
    expect(rules('.ratioLine')).not.toMatch(/white-space/);
  });
});

/**
 * A reading is a value, a value and its grade, or a single figure in a table
 * cell, and the pages put `.ratio` on all three. What makes one a sentence is
 * holding another reading, so every page is rendered and checked for that.
 */
describe('every docs page', () => {
  const pages = readdirSync('app', { recursive: true, encoding: 'utf8' })
    .filter((file) => file === 'page.tsx' || file.endsWith('/page.tsx'))
    .map((file) => join('app', file))
    .sort();

  it('is found', () => {
    expect(pages).toContain('app/page.tsx');
    expect(pages).toContain('app/decisions/page.tsx');
  });

  it.each(pages)('%s puts no reading inside a reading', async (path) => {
    const { default: Page }: { default: ComponentType } = await import(
      /* @vite-ignore */ resolve(path)
    );
    const { container } = render(<Page />);
    expect(container.querySelectorAll('.ratio .ratio')).toHaveLength(0);
  });
});
