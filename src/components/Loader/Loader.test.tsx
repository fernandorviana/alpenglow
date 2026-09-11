import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { block, readCss } from '@/test/css';
import { Loader } from './Loader';

describe('Loader', () => {
  it('announces what is being waited for when given a label', () => {
    render(<Loader label="Loading appointments" />);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Loading appointments');
    expect(status).toHaveAttribute('aria-live', 'polite');
  });

  it('is decoration without a label', () => {
    // Inside a button that already carries aria-busy, a second announcement
    // repeats what the button said.
    const { container } = render(<Loader />);
    const root = container.firstElementChild!;
    expect(root).toHaveAttribute('aria-hidden', 'true');
    expect(root).not.toHaveAttribute('role');
  });

  it('draws both arcs', () => {
    const { container } = render(<Loader />);
    expect(container.querySelectorAll('circle')).toHaveLength(2);
  });

  /**
   * Reduced motion slows the spinner and does not freeze it: a spinner that
   * stops reads as a hung page. What the preference drops is the length change.
   * jsdom runs no animations and matches no media query, so nothing else fails
   * if the rule is deleted or "simplified" to `animation: none`.
   */
  describe('under reduced motion', () => {
    const css = readCss('src/components/Loader/Loader.module.css');
    const reducedArc = () => block(block(css, '@media (prefers-reduced-motion: reduce)'), '.arc');

    it('keeps turning, more slowly', () => {
      const arc = reducedArc();
      expect(arc).toMatch(/animation:\s*spin\b[^;]*\binfinite\b/);
      expect(arc).not.toMatch(/paused/);
      // Two turns in the file: the default rule's, then this one.
      const [normal, slowed] = [...css.matchAll(/\bspin\s+([\d.]+)s\b/g)].map(([, s]) => Number(s));
      expect(slowed).toBeGreaterThan(normal!);
    });

    it('stops the arc growing and shrinking', () => {
      const arc = reducedArc();
      expect(arc).not.toMatch(/\bdash\b/);
      expect(arc).toMatch(/stroke-dasharray:/);
    });
  });
});
