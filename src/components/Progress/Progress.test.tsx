import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Progress, progressSizes, progressTones } from './Progress';
import styles from './Progress.module.css';
import { readCss, block } from '../../test/css';
import { axeViolations } from '../../test/axe';

const css = readCss('src/components/Progress/Progress.module.css');

describe('Progress — the element', () => {
  it('is a native progress element named by its visible label', () => {
    render(<Progress label="Uploading" value={45} />);
    const bar = screen.getByRole('progressbar', { name: 'Uploading' });
    expect(bar.tagName).toBe('PROGRESS');
    expect(bar).toHaveAttribute('value', '45');
    expect(bar).toHaveAttribute('max', '100');
    expect(screen.getByText('Uploading')).toBeVisible();
  });

  it('keeps the name when the label is hidden, and renders no head', () => {
    const { container } = render(<Progress label="Uploading" value={45} hideLabel />);
    expect(screen.getByRole('progressbar', { name: 'Uploading' })).toBeInTheDocument();
    expect(screen.queryByText('Uploading')).not.toBeInTheDocument();
    expect(container.querySelector(`.${styles.head}`)).toBeNull();
  });

  it('sets the fill as a share of max', () => {
    const { rerender } = render(<Progress label="Steps" value={3} max={4} />);
    const bar = () => screen.getByRole('progressbar') as HTMLElement;
    expect(bar().style.getPropertyValue('--progress-value')).toBe('75%');
    rerender(<Progress label="Steps" value={0} max={4} />);
    expect(bar().style.getPropertyValue('--progress-value')).toBe('0%');
  });

  it('is indeterminate without a value', () => {
    const { container } = render(<Progress label="Working" />);
    const bar = screen.getByRole('progressbar') as HTMLProgressElement;
    expect(bar).not.toHaveAttribute('value');
    expect(bar.style.getPropertyValue('--progress-value')).toBe('');
    expect(container.querySelector(`.${styles.value}`)).toBeNull();
  });

  it('shows the value as a percentage, tabular, at the end of the label line', () => {
    render(<Progress label="Uploading" value={45} showValue />);
    const value = screen.getByText('45%');
    expect(value).toHaveClass(styles.value!);
    expect(screen.getByRole('progressbar')).not.toHaveAttribute('aria-valuetext');
  });

  it('floors the percentage, so it never says done before it is', () => {
    const { rerender } = render(<Progress label="Steps" value={1} max={3} showValue />);
    expect(screen.getByText('33%')).toBeInTheDocument();
    rerender(<Progress label="Steps" value={995} max={1000} showValue />);
    expect(screen.getByText('99%')).toBeInTheDocument();
  });

  it('holds the paint within the track, as the platform holds the value', () => {
    const bar = () => screen.getByRole('progressbar') as HTMLElement;
    const { rerender } = render(<Progress label="x" value={-5} showValue />);
    expect(bar().style.getPropertyValue('--progress-value')).toBe('0%');
    expect(screen.getByText('0%')).toBeInTheDocument();
    rerender(<Progress label="x" value={150} showValue />);
    expect(bar().style.getPropertyValue('--progress-value')).toBe('100%');
    expect(screen.getByText('100%')).toBeInTheDocument();
    rerender(<Progress label="x" value={0} max={0} showValue />);
    expect(bar().style.getPropertyValue('--progress-value')).toBe('0%');
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('says valueText instead, to the eye and to a reader', () => {
    render(<Progress label="Steps" value={3} max={5} showValue valueText="3 of 5" />);
    expect(screen.getByText('3 of 5')).toBeInTheDocument();
    expect(screen.queryByText('60%')).not.toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '3 of 5');
  });

  it('gives a reader valueText even when the value is not shown', () => {
    render(<Progress label="Steps" value={3} max={5} valueText="3 of 5" />);
    expect(screen.queryByText('3 of 5')).not.toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '3 of 5');
  });

  it('shows the value with a hidden label, alone on its line', () => {
    render(<Progress label="Uploading" value={45} hideLabel showValue />);
    expect(screen.getByText('45%')).toBeInTheDocument();
    expect(screen.queryByText('Uploading')).not.toBeInTheDocument();
  });

  it.each(progressSizes)('takes the %s size', (size) => {
    const { container } = render(<Progress label="x" size={size} className="mine" />);
    expect(container.firstElementChild).toHaveClass(styles.progress!, styles[size]!, 'mine');
  });

  it.each(progressTones)('takes the %s tone', (tone) => {
    const { container } = render(<Progress label="x" tone={tone} />);
    expect(container.firstElementChild).toHaveClass(styles[tone]!);
  });

  it('is sm and accent unless told', () => {
    const { container } = render(<Progress label="x" />);
    expect(container.firstElementChild).toHaveClass(styles.sm!, styles.accent!);
  });

  it('has no axe violations, visible or hidden, determinate or not', async () => {
    const { container } = render(
      <div>
        <Progress label="Uploading" value={45} showValue />
        <Progress label="Working" hideLabel />
        <Progress label="Steps" value={2} max={5} valueText="2 of 5" />
      </div>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe('Progress — stylesheet', () => {
  it('paints the track with the wash and the fill on the element itself', () => {
    const bar = block(css, '.bar {');
    expect(bar).toContain('appearance: none');
    expect(bar).toContain('var(--ap-color-interactive-wash-pressed)');
    expect(bar).toContain('var(--progress-value');
    expect(bar).toContain('var(--progress-fill');
    expect(bar).toContain('border-radius: var(--progress-radius, var(--ap-radius-full))');
    expect(css).not.toContain('--ap-color-surface-');
  });

  it('makes each family of pseudo-elements transparent in a rule of its own', () => {
    for (const pseudo of ['::-webkit-progress-bar', '::-webkit-progress-value', '::-moz-progress-bar']) {
      const rule = block(css, `.bar${pseudo} {`);
      expect(rule, pseudo).toContain('background: transparent');
    }
    expect(css).not.toMatch(/-webkit-progress-[a-z]+[^{]*,[^{]*::-moz-progress-bar/);
  });

  it('travels to a new value on the motion token, and not under reduced motion', () => {
    expect(block(css, '.bar {')).toContain('transition: background-size var(--ap-motion-duration-travel)');
    const reduced = block(css, '@media (prefers-reduced-motion: reduce) {');
    expect(reduced).toContain('transition: none');
  });

  it('runs an indeterminate band in its own loop, which reduced motion slows and holds in place', () => {
    expect(block(css, '.bar:indeterminate {')).toContain('animation: cross 1.5s ease-in-out infinite');
    const reduced = block(css, '@media (prefers-reduced-motion: reduce) {');
    expect(reduced).toContain('animation: breathe 3s ease-in-out infinite');
    expect(reduced).not.toMatch(/animation:\s*none/);
  });

  it('keeps a transparent border for forced colours to paint', () => {
    expect(block(css, '.bar {')).toContain('border: var(--ap-border-width-hairline) solid transparent');
  });

  it('sets the sizes on the scale', () => {
    expect(block(css, '\n.sm {')).toContain('--progress-height: var(--ap-spacing-050)');
    expect(block(css, '\n.md {')).toContain('--progress-height: var(--ap-spacing-100)');
  });
});
