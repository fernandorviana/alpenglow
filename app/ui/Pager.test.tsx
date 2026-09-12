import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NAV, PAGES, neighbours } from './sitemap';
import { Pager } from './Pager';

/**
 * The pager walks the sidebar's list flat, so the order the reader follows is
 * the order the sidebar shows, group boundaries included. Its two ends are
 * the site's two ends, and a page the sidebar does not list gets no pager at
 * all rather than a wrong one.
 */

let pathname = '/';

vi.mock('next/navigation', () => ({
  usePathname: () => pathname,
}));

const link = (name: RegExp) => screen.getByRole('link', { name });

describe('neighbours', () => {
  it('follows the sidebar order across group boundaries', () => {
    // The last page of one group leads to the first of the next.
    const lastOfFirst = NAV[0]!.items.at(-1)!;
    const firstOfSecond = NAV[1]!.items[0]!;
    expect(neighbours(lastOfFirst.href).next).toEqual(firstOfSecond);
    expect(neighbours(firstOfSecond.href).previous).toEqual(lastOfFirst);
  });

  it('has no previous on the first page and no next on the last', () => {
    expect(neighbours(PAGES[0]!.href).previous).toBeUndefined();
    expect(neighbours(PAGES.at(-1)!.href).next).toBeUndefined();
  });

  it('reads a trailing slash as the same page', () => {
    expect(neighbours('/button/')).toEqual(neighbours('/button'));
  });

  it('knows nothing about a page that is not listed', () => {
    expect(neighbours('/nowhere')).toEqual({});
  });
});

describe('Pager', () => {
  it('links to the page before and the page after', () => {
    pathname = '/button';
    render(<Pager />);
    expect(link(/Previous/)).toHaveAttribute('href', '/badge');
    // Two lines, one name, and a space where the line breaks.
    expect(link(/Previous/)).toHaveAccessibleName('Previous Badge');
    expect(link(/Next/)).toHaveAttribute('href', '/input');
    expect(link(/Next/)).toHaveTextContent('Input and Textarea');
  });

  it('offers only next on the first page', () => {
    pathname = '/';
    render(<Pager />);
    expect(screen.queryByRole('link', { name: /Previous/ })).toBeNull();
    expect(link(/Next/)).toHaveAttribute('href', '/why');
  });

  it('offers only previous on the last page', () => {
    pathname = '/table';
    render(<Pager />);
    expect(link(/Previous/)).toHaveAttribute('href', '/select');
    expect(screen.queryByRole('link', { name: /Next/ })).toBeNull();
  });

  it('renders nothing for a page the sidebar does not list', () => {
    pathname = '/nowhere';
    const { container } = render(<Pager />);
    expect(container).toBeEmptyDOMElement();
  });

  it('is a navigation landmark of its own', () => {
    pathname = '/button';
    render(<Pager />);
    expect(screen.getByRole('navigation', { name: 'Pages' })).toBeInTheDocument();
  });
});
