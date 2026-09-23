import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NAV, PAGES, neighbours, sectionOf, sectionPage } from './contents';
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
  it('follows the sidebar order across section boundaries, through the section page', () => {
    // The last page of one section leads to the next section's own page,
    // and that page to the first inside it.
    const lastOfFirst = NAV[0]!.items.at(-1)!;
    const second = sectionPage(NAV[1]!);
    const firstOfSecond = NAV[1]!.items[0]!;
    expect(neighbours(lastOfFirst.href).next).toEqual(second);
    expect(neighbours(second.href)).toEqual({ previous: lastOfFirst, next: firstOfSecond });
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

describe('sectionOf', () => {
  it('finds a section from its own route or any page inside it', () => {
    expect(sectionOf('/foundations')?.title).toBe('Foundations');
    expect(sectionOf('/colour')?.title).toBe('Foundations');
    expect(sectionOf('/')?.title).toBe('Start here');
    expect(sectionOf('/why/')?.title).toBe('Start here');
  });

  it('finds nothing for a page no section lists', () => {
    expect(sectionOf('/nowhere')).toBeUndefined();
  });
});

describe('Pager', () => {
  it('links to the page before and the page after', () => {
    pathname = '/button';
    render(<Pager />);
    expect(link(/Previous/)).toHaveAttribute('href', '/breadcrumb');
    // Two lines, one name, and a space where the line breaks.
    expect(link(/Previous/)).toHaveAccessibleName('Previous Breadcrumb');
    expect(link(/Next/)).toHaveAttribute('href', '/card');
    expect(link(/Next/)).toHaveTextContent('Card');
  });

  it('offers only next on the first page', () => {
    pathname = '/';
    render(<Pager />);
    expect(screen.queryByRole('link', { name: /Previous/ })).toBeNull();
    expect(link(/Next/)).toHaveAttribute('href', '/screen');
  });

  it('offers only previous on the last page', () => {
    // Read from the list, not written: the last page changes every time a
    // component is added, and this failed the day Tabs followed Table.
    pathname = PAGES.at(-1)!.href;
    render(<Pager />);
    expect(link(/Previous/)).toHaveAttribute('href', PAGES.at(-2)!.href);
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
