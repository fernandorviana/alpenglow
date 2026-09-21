import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Skeleton, skeletonVariants } from './Skeleton';
import styles from './Skeleton.module.css';
import { readCss, block } from '../../test/css';
import { axeViolations } from '../../test/axe';

const css = readCss('src/components/Skeleton/Skeleton.module.css');

describe('Skeleton — structure', () => {
  it('is a span that says nothing, so it can stand in a paragraph or a heading', () => {
    const { container } = render(<Skeleton />);
    const el = container.firstElementChild!;
    expect(el.tagName).toBe('SPAN');
    expect(el).toHaveAttribute('aria-hidden', 'true');
    expect(el).toHaveClass(styles.skeleton!, styles.text!);
    expect(el).toBeEmptyDOMElement();
  });

  it.each(skeletonVariants)('takes the %s shape', (variant) => {
    const { container } = render(<Skeleton variant={variant} className="mine" />);
    expect(container.firstElementChild).toHaveClass(styles.skeleton!, styles[variant]!, 'mine');
  });

  it('renders as many lines as asked, the last shorter', () => {
    const { container } = render(<Skeleton lines={3} />);
    const wrap = container.firstElementChild!;
    expect(wrap).toHaveAttribute('aria-hidden', 'true');
    expect(wrap.children).toHaveLength(3);
    expect(wrap.children[1]).not.toHaveClass(styles.last!);
    expect(wrap.children[2]).toHaveClass(styles.last!);
  });

  it('gives className and style to the group of lines, once, and not to every line', () => {
    const { container } = render(<Skeleton lines={3} className="mine" style={{ maxWidth: 200 }} />);
    const wrap = container.firstElementChild as HTMLElement;
    expect(wrap).toHaveClass(styles.lines!, 'mine');
    expect(wrap.style.maxWidth).toBe('200px');
    expect(wrap.children[0]).not.toHaveClass('mine');
    expect((wrap.children[0] as HTMLElement).style.maxWidth).toBe('');
  });

  it('given a width, the last line keeps it', () => {
    const { container } = render(<Skeleton lines={2} width="40%" />);
    const last = container.firstElementChild!.children[1] as HTMLElement;
    expect(last).not.toHaveClass(styles.last!);
    expect(last.style.getPropertyValue('--skeleton-width')).toBe('40%');
  });

  it('only text has lines', () => {
    const { container } = render(<Skeleton variant="rect" lines={3} />);
    expect(container.firstElementChild).toHaveClass(styles.rect!);
  });

  it('passes sizes as custom properties, numbers as pixels, and a circle’s size as both', () => {
    const { container, rerender } = render(<Skeleton variant="rect" width={120} height="4rem" />);
    const el = () => container.firstElementChild as HTMLElement;
    expect(el().style.getPropertyValue('--skeleton-width')).toBe('120px');
    expect(el().style.getPropertyValue('--skeleton-height')).toBe('4rem');
    rerender(<Skeleton variant="circle" size={24} />);
    expect(el().style.getPropertyValue('--skeleton-width')).toBe('24px');
    expect(el().style.getPropertyValue('--skeleton-height')).toBe('24px');
  });

  it('has no axe violations inside a busy region', async () => {
    const { container } = render(
      <section aria-label="Patient" aria-busy="true">
        <Skeleton variant="circle" />
        <p>
          <Skeleton lines={2} />
        </p>
      </section>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe('Skeleton — stylesheet', () => {
  it('is filled with the wash, which works over any surface in both modes, and not with a surface', () => {
    const own = block(css, '.skeleton {');
    expect(own).toContain('background: var(--ap-color-interactive-wash-pressed)');
    expect(css).not.toContain('--ap-color-surface-');
  });

  it('keeps a transparent border for forced colours to paint', () => {
    expect(block(css, '.skeleton {')).toContain('border: var(--ap-border-width-hairline) solid transparent');
  });

  it('sweeps each shape in 1.8s, without end, and the other way in RTL', () => {
    expect(block(css, '.skeleton::after {')).toContain('animation: sweep 1.8s linear infinite');
    expect(block(css, '.skeleton:dir(rtl)::after {')).toContain('animation-direction: reverse');
    expect(block(css, '@keyframes sweep {')).toContain('translateX(-100%)');
  });

  it('under reduced motion drops the travel and does not freeze', () => {
    const reduced = block(css, '@media (prefers-reduced-motion: reduce) {');
    expect(reduced).toContain('animation: breathe 3.6s ease-in-out infinite');
    expect(reduced).not.toMatch(/animation:\s*none/);
    expect(block(css, '@keyframes breathe {')).not.toContain('transform');
  });

  it('stands a text shape in its line as an inline-block, with no margins to collapse out of it', () => {
    const text = block(css, '.text {');
    expect(text).toContain('display: inline-block');
    expect(text).toContain('vertical-align: middle');
    expect(text).not.toContain('margin');
  });
});
