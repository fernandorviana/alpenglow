import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, it, expect } from 'vitest';
import { Link, linkVariants } from './Link';
import styles from './Link.module.css';
import hidden from '../visuallyHidden.module.css';
import { readCss, block } from '../../test/css';
import { axeViolations } from '../../test/axe';

const css = readCss('src/components/Link/Link.module.css');

describe('Link — structure', () => {
  it('is an anchor, inline unless told, with a className beside its own', () => {
    render(
      <Link href="/toast" className="mine">
        toast
      </Link>,
    );
    const link = screen.getByRole('link', { name: 'toast' });
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '/toast');
    expect(link).toHaveClass(styles.link!, styles.inline!, 'mine');
  });

  it.each(linkVariants)('takes the %s variant', (variant) => {
    render(
      <Link href="/x" variant={variant}>
        Words
      </Link>,
    );
    expect(screen.getByRole('link')).toHaveClass(styles[variant]!);
  });

  it('passes anchor props and its ref', () => {
    const ref = createRef<HTMLAnchorElement>();
    render(
      <Link href="/x" ref={ref} download="report.pdf" aria-current="page">
        Report
      </Link>,
    );
    expect(ref.current).toBe(screen.getByRole('link'));
    expect(ref.current).toHaveAttribute('download', 'report.pdf');
    expect(ref.current).toHaveAttribute('aria-current', 'page');
  });

  it('keeps an icon out of the name', () => {
    render(
      <Link href="/x" variant="standalone" iconEnd={<svg data-testid="arrow" />}>
        All locations
      </Link>,
    );
    expect(screen.getByRole('link', { name: 'All locations' })).toBeInTheDocument();
    expect(screen.getByTestId('arrow').parentElement).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('Link — external', () => {
  it('says a new tab for an internal link too', () => {
    render(<Link href="/screen/full" target="_blank">Open full screen</Link>);
    expect(screen.getByRole('link', { name: /^Open full screen ?\(opens in a new tab\)$/ })).toBeInTheDocument();
  });

  it('opens a new tab, keeps the opener, and says so without showing it', () => {
    render(
      <Link href="https://example.com" external>
        The specification
      </Link>,
    );
    // The space is inside the hidden span, so a line under the pointer does not
    // run on past the words. jsdom's name trims it; a browser's does not.
    const link = screen.getByRole('link', { name: /^The specification ?\(opens in a new tab\)$/ });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noreferrer');
    expect(screen.getByText('(opens in a new tab)', { exact: false })).toHaveClass(hidden.hidden!);
  });

  it('says it in the caller’s words, and adds the caller’s rel to its own', () => {
    render(
      <Link href="https://example.com" external externalLabel="abre num separador novo" rel="nofollow noreferrer">
        A especificação
      </Link>,
    );
    const link = screen.getByRole('link', { name: /^A especificação ?\(abre num separador novo\)$/ });
    expect(link).toHaveAttribute('rel', 'noreferrer nofollow');
  });

  it('does not say a new tab when the caller sends it elsewhere', () => {
    render(
      <Link href="https://example.com" external target="_self">
        Here
      </Link>,
    );
    const link = screen.getByRole('link', { name: 'Here' });
    expect(link).toHaveAttribute('target', '_self');
    expect(link).toHaveAttribute('rel', 'noreferrer');
  });

  it('is neither unless asked', () => {
    render(<Link href="/x">Here</Link>);
    expect(screen.getByRole('link')).not.toHaveAttribute('target');
    expect(screen.getByRole('link')).not.toHaveAttribute('rel');
  });
});

describe('Link — a router’s link', () => {
  it('hands render everything the anchor would have had', () => {
    render(
      <Link href="/routed" external render={({ children, ...props }) => <a data-router="yes" {...props}>{children}</a>}>
        Routed
      </Link>,
    );
    const link = screen.getByRole('link', { name: /Routed/ });
    expect(link).toHaveAttribute('data-router', 'yes');
    expect(link).toHaveAttribute('href', '/routed');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveClass(styles.link!, styles.inline!);
  });
});

describe('Link — stylesheet', () => {
  it('is the accent in Medium with no line at rest', () => {
    const rest = block(css, '.link.link {');
    expect(rest).toContain('color: var(--ap-color-text-accent)');
    expect(rest).toContain('font-weight: var(--ap-font-weight-medium)');
    expect(rest).toContain('text-decoration-line: none');
  });

  it('takes a line under the pointer and under the keyboard’s focus', () => {
    expect(css).toContain('.link.link:hover,\n.link.link:focus-visible {');
    expect(block(css, '.link.link:hover')).toContain('text-decoration-line: underline');
  });

  it('has the system’s ring', () => {
    expect(block(css, '\n.link:focus-visible {')).toContain('var(--ap-color-border-focus)');
  });

  it('follows its sentence inline, and is a 24 target on its own', () => {
    expect(block(css, '.inline {')).toContain('font-size: inherit');
    expect(block(css, '.standalone {')).toContain('min-height: var(--ap-spacing-300)');
  });

  it('has no colour for a visited link', () => {
    expect(css).not.toContain(':visited');
  });
});

describe('Link — axe', () => {
  it('has no violations in a sentence or alone', async () => {
    const { container } = render(
      <main>
        <p>
          What just happened is a <Link href="/toast">toast</Link>, and{' '}
          <Link href="https://example.com" external>
            the specification
          </Link>{' '}
          says why.
        </p>
        <Link href="/locations" variant="standalone">
          All locations
        </Link>
      </main>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
