import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { readCss } from '@/test/css';
import { SkipLink } from './SkipLink';

/**
 * Hidden until it has focus, and never `display: none`, which would take it
 * out of the tab order it exists for.
 */
describe('SkipLink', () => {
  const css = readCss('app/docs.css');
  const rule = (selector: string) =>
    [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
      .filter(([, selectors]) => selectors!.trim() === selector)
      .map(([, , body]) => body!.replace(/\s+/g, ' ').trim())
      .join(' ');

  it('points at the page content', () => {
    render(<SkipLink />);
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute('href', '#content');
  });

  it('is off screen until focused, and in the tab order throughout', () => {
    expect(rule('.skipLink')).toMatch(/position: absolute/);
    expect(rule('.skipLink')).not.toMatch(/display: none/);
    expect(rule('.skipLink')).not.toMatch(/visibility: hidden/);
    expect(rule('.skipLink:focus-visible')).toBeTruthy();
  });
});
