import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { readCss } from '@/test/css';
import { Button } from '@/components/Button';
import { Card, Cards } from './Card';

/**
 * The card is a link with a picture in it. Two things have to hold: the
 * link is named by the title alone, and the picture's controls are out of
 * reach — a button inside a link is a control inside a control.
 */
describe('Card', () => {
  it('is a list item whose link is named by the title', () => {
    render(
      <Cards>
        <Card href="/button" title="Button" description="Three variants, five tones." />
      </Cards>,
    );
    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(screen.getByRole('listitem')).toBeInTheDocument();
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/button');
    expect(link).toHaveAccessibleName('Button');
  });

  it('keeps the visual inert, so its controls are pictures', () => {
    const { container } = render(
      <Cards>
        <Card href="/button" title="Button" description="…" visual={<Button>Confirm</Button>} />
      </Cards>,
    );
    const visual = container.querySelector('.cardVisual');
    expect(visual).toHaveAttribute('inert');
    expect(visual).toContainElement(screen.getByRole('button'));
  });

  it('renders no visual box when there is no visual', () => {
    const { container } = render(
      <Cards>
        <Card href="/why" title="Why" description="…" />
      </Cards>,
    );
    expect(container.querySelector('.cardVisual')).toBeNull();
  });
});

describe('the card stylesheet', () => {
  const css = readCss('app/docs.css');
  const rule = (selector: string) =>
    [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
      .filter(([, selectors]) => selectors!.split(',').some((s) => s.trim() === selector))
      .map(([, , body]) => body!.replace(/\s+/g, ' ').trim())
      .join(' ');

  it('stretches the link over the whole card', () => {
    expect(rule('.cardLink::after')).toMatch(/position: absolute/);
    expect(rule('.cardLink::after')).toMatch(/inset: 0/);
    expect(rule('.card')).toMatch(/position: relative/);
  });

  it('moves the focus ring from the link to the card, and never loses it', () => {
    // The link's own ring would sit around the title while the hit area is
    // the card. The ring goes on the card instead; `outline: none` on the
    // link is only allowed because of that replacement.
    expect(rule('.cardLink:focus-visible')).toMatch(/outline: none/);
    expect(rule('.card:has(.cardLink:focus-visible)')).toMatch(
      /outline: var\(--ap-border-width-ring\)/,
    );
  });

  it('nests its radii concentrically', () => {
    // Outer radius = inner radius + padding: 2xl (16) = sm (4) + 12.
    expect(rule('.card')).toMatch(/border-radius: var\(--ap-radius-2xl\)/);
    expect(rule('.card')).toMatch(/padding: var\(--ap-spacing-150\)/);
    expect(rule('.cardVisual')).toMatch(/border-radius: var\(--ap-radius-sm\)/);
  });
});
