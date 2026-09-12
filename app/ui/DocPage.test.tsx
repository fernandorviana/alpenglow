import { render, screen, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { block, readCss } from '@/test/css';
import { borderWidth, spacing } from '@/tokens/scale';
import { DocPage } from './DocPage';

vi.mock('next/navigation', () => ({ usePathname: () => '/' }));

/**
 * The page and its specimens are plain global CSS, so these read the
 * stylesheet the way `ThemeToggle.test.tsx` does.
 *
 * The widest thing a specimen holds is the Calendar, 280px of drawn geometry.
 * On a narrow screen the page's padding, the specimen's padding and its
 * hairline leave less than that below 370px: a Calendar ran into its
 * specimen's padding from 369 down, through its border by 340, and below 325
 * pushed the Date picker page sideways.
 * Below 370 a specimen goes edge to edge. The breakpoint is a literal, because
 * a media query cannot read a custom property, so it is checked against the
 * numbers it was derived from.
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
  const narrow = block(css, '@media (max-width: 760px)');
  const pagePadding = token(declarations(narrow, '.page').match(/padding: \S+ (\S+)/)![1]!);
  const specimenPadding = token(declarations(css, '.specimen'));
  const hairline = declarations(css, '.specimen').includes('--ap-border-width-hairline')
    ? borderWidth.hairline
    : NaN;
  const calendar = Number(declarations(calendarCss, '.calendar').match(/width: (\d+)px/)?.[1]);

  const header = css.match(/@media \(width < (\d+)px\)/);
  const bleed = header ? block(css, header[0]) : '';

  it('starts where a bordered specimen stops holding a Calendar', () => {
    expect(pagePadding, 'the narrow page padding is a spacing token').toBeTypeOf('number');
    expect(specimenPadding, 'the specimen padding is a spacing token').toBeTypeOf('number');
    expect(calendar).toBe(280);
    expect(header, 'the edge-to-edge block exists').toBeTruthy();

    expect(Number(header![1])).toBe(calendar + 2 * (pagePadding + specimenPadding + hairline));
  });

  it('holds a Calendar at 320px once it runs edge to edge', () => {
    const rule = declarations(bleed, '.prose > .specimen');
    expect(rule).toMatch(/border-inline: none/);
    expect(rule).toMatch(/border-radius: 0/);
    // Out by the page's padding, and in by the same amount, so the specimen's
    // content lines up with the text around it.
    expect(token(rule.match(/margin-inline: calc\(-1 \* (var\([^)]+\))\)/)?.[1] ?? '')).toBe(pagePadding);
    expect(token(rule.match(/padding-inline: (var\([^)]+\))/)?.[1] ?? '')).toBe(pagePadding);

    expect(320 - 2 * pagePadding).toBeGreaterThanOrEqual(calendar);
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
