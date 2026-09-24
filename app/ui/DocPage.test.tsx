import { render, screen, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { block, readCss } from '@/test/css';
import { borderWidth, breakpoint, media, minViewport, spacing } from '@/tokens/scale';
import { layout } from '@/tokens/layout';
import { DocPage } from './DocPage';

vi.mock('next/navigation', () => ({ usePathname: () => '/' }));

/**
 * The page and its specimens are plain global CSS, so these read the
 * stylesheet the way `ThemeToggle.test.tsx` does.
 *
 * The widest thing a specimen holds is the Calendar, 280px of drawn geometry.
 * On a narrow screen the page's margin, the specimen's padding and its
 * hairline leave less than that below 280 + 2 × (16 margin + 24 specimen + 1
 * hairline) = 362, with the narrow layout margin, 16. (Measured on the Date
 * picker page before the layout tokens, with the old 20px page padding: a
 * Calendar ran into its specimen's padding from 369 down, through its border
 * by 340, and below 325 pushed the page sideways.)
 * Below `xs`, 480, the safe step above 362, a specimen goes edge to edge. The
 * breakpoint is the scale's, checked against the numbers it was measured from.
 */

const css = readCss('app/docs.css');
const calendarCss = readCss('src/components/Calendar/Calendar.module.css');

/** The declarations of the first rule for `selector` in `text`, one string. */
const declarations = (text: string, selector: string) => {
  const match = [...text.matchAll(/([^{}]+)\{([^{}]*)\}/g)].find(
    ([, selectors]) => selectors!.trim().replace(/\s+/g, ' ') === selector,
  );
  expect(match, selector).toBeTruthy();
  return match![2]!.replace(/\s+/g, ' ').trim();
};

/** A spacing token named in a declaration, resolved to px. */
const token = (text: string) => {
  const name = text.match(/--ap-spacing-(\w+)\)/)?.[1];
  return spacing[name as unknown as keyof typeof spacing];
};

describe('the specimen on the narrowest screens', () => {
  const pageRule = declarations(css, '.page');
  const pagePadding = layout.margin.narrow;
  const specimenPadding = token(declarations(css, '.specimen').match(/padding: (\S+)/)![1]!);
  const hairline = declarations(css, '.specimen').includes('--ap-border-width-hairline')
    ? borderWidth.hairline
    : NaN;
  const calendar = Number(declarations(calendarCss, '.calendar').match(/width: (\d+)px/)?.[1]);
  const bleed = block(css, `@media ${media.down.xs}`);

  it('bleeds on every phone, above where a bordered specimen stops holding a Calendar', () => {
    expect(pageRule).toMatch(/padding: var\(--ap-layout-margin\) var\(--ap-layout-margin\)/);
    expect(specimenPadding, 'the specimen padding is a spacing token').toBeTypeOf('number');
    expect(calendar).toBe(280);
    // Measured: the bordered specimen stops holding a Calendar at 362 with the
    // narrow margin. Rounded up to the safe step, xs.
    expect(breakpoint.xs).toBeGreaterThanOrEqual(calendar + 2 * (pagePadding + specimenPadding + hairline));
  });

  it('holds a Calendar at 320px once it runs edge to edge', () => {
    // Two classes, so it beats the specimen's own padding and border by
    // weight rather than by where it sits in the file.
    const rule = declarations(bleed, '.specimen.specimen');
    expect(rule).toMatch(/border-inline: none/);
    expect(rule).toMatch(/border-radius: 0/);
    // Out by the page's margin and in by the same, so the specimen's content
    // lines up with the text around it.
    expect(rule).toMatch(/margin-inline: calc\(-1 \* var\(--ap-layout-margin\)\)/);
    expect(rule).toMatch(/padding-inline: var\(--ap-layout-margin\)/);
    expect(minViewport - 2 * pagePadding).toBeGreaterThanOrEqual(calendar);
  });
});

/**
 * Anchors. Every page's sections are its `h2`s, written as plain children of
 * `DocPage`; the page gives each an id from its text, so the static HTML
 * carries the anchor and a link into a section works before React has run,
 * and lists them beside the prose.
 */
describe('the page anchors', () => {
  it('gives every section heading an id from its text', () => {
    render(
      <DocPage>
        <h1>Button</h1>
        <h2>Try it</h2>
        <h2>Variants and tones</h2>
        <h2>
          The <code>on-*</code> labels
        </h2>
      </DocPage>,
    );
    expect(screen.getByRole('heading', { name: 'Try it' })).toHaveAttribute('id', 'try-it');
    expect(screen.getByRole('heading', { name: 'Variants and tones' })).toHaveAttribute('id', 'variants-and-tones');
    expect(screen.getByRole('heading', { name: 'The on-* labels' })).toHaveAttribute('id', 'the-on-labels');
    // The title is the page's own anchor; it gets nothing.
    expect(screen.getByRole('heading', { name: 'Button' })).not.toHaveAttribute('id');
  });

  it('lists the sections beside the prose, in order', () => {
    render(
      <DocPage>
        <h2>Try it</h2>
        <h2>Sizes</h2>
      </DocPage>,
    );
    const list = within(screen.getByRole('navigation', { name: 'On this page' }));
    expect(list.getAllByRole('link').map((a) => a.getAttribute('href'))).toEqual(['#try-it', '#sizes']);
  });

  it('keeps two sections with one name apart', () => {
    render(
      <DocPage>
        <h2>Sizes</h2>
        <h2>Sizes</h2>
      </DocPage>,
    );
    const ids = screen.getAllByRole('heading').map((h) => h.id);
    expect(new Set(ids).size).toBe(2);
  });

  it('keeps an id a page wrote itself', () => {
    render(
      <DocPage>
        <h2 id="kept">Something</h2>
      </DocPage>,
    );
    expect(screen.getByRole('heading')).toHaveAttribute('id', 'kept');
  });

  it('lists nothing for a page with no sections', () => {
    render(
      <DocPage>
        <h1>Only a title</h1>
      </DocPage>,
    );
    expect(screen.queryByRole('navigation', { name: 'On this page' })).toBeNull();
  });
});
