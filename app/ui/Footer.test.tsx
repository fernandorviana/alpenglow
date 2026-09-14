import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { readCss } from '@/test/css';
import pkg from '../../package.json';
import { PAGES } from './contents';
import { FOOTER, Footer } from './Footer';

/**
 * The footer's job is to be right about where things are. Every off-site link
 * is derived from `package.json`, so the tests compare against the package
 * rather than against a copy of the URL; every on-site link has to be a page
 * the sidebar lists, because a footer link to a page that no longer exists is
 * worse than no footer at all.
 */

const link = (name: string | RegExp) => screen.getByRole('link', { name });

describe('Footer', () => {
  it('is the site’s contentinfo landmark', () => {
    render(<Footer />);
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('points at the repository, the issues and the licence the package names', () => {
    render(<Footer />);
    expect(link('Repository')).toHaveAttribute(
      'href',
      'https://github.com/fernandorviana/alpenglow',
    );
    expect(link('Issues')).toHaveAttribute('href', pkg.bugs);
    expect(link(`${pkg.license} licence`)).toHaveAttribute(
      'href',
      'https://github.com/fernandorviana/alpenglow/blob/main/LICENSE',
    );
  });

  it('points at the package under the name it is published as', () => {
    render(<Footer />);
    expect(link('npm')).toHaveAttribute('href', `https://www.npmjs.com/package/${pkg.name}`);
  });

  it('gives the version the package gives, so the foot and the Install page agree', () => {
    render(<Footer />);
    expect(screen.getByRole('contentinfo')).toHaveTextContent(pkg.version);
  });

  it('credits the icon set and the typeface the site uses', () => {
    render(<Footer />);
    expect(link('IBM Carbon')).toHaveAttribute('href', expect.stringContaining('carbondesignsystem.com'));
    expect(screen.getByRole('contentinfo')).toHaveTextContent('Apache 2.0');
    expect(link('Inter')).toHaveAttribute('href', expect.stringContaining('inter'));
  });

  it('links only to pages the sidebar lists', () => {
    const internal = FOOTER.flatMap((group) => group.links)
      .map((item) => item.href)
      .filter((href) => href.startsWith('/'));

    expect(internal.length).toBeGreaterThan(0);
    for (const href of internal) {
      expect(PAGES.map((page) => page.href)).toContain(href);
    }
  });

  it('leaves the site only over https', () => {
    render(<Footer />);
    const external = screen
      .getAllByRole('link')
      .map((anchor) => anchor.getAttribute('href') ?? '')
      .filter((href) => !href.startsWith('/'));

    expect(external.length).toBeGreaterThan(0);
    for (const href of external) expect(href).toMatch(/^https:\/\//);
  });

  it('groups the links under a title each', () => {
    render(<Footer />);
    for (const group of FOOTER) {
      expect(screen.getByText(group.title)).toBeInTheDocument();
      for (const item of group.links) expect(link(item.label)).toBeInTheDocument();
    }
  });
});

/**
 * Two stylesheet invariants jsdom cannot compute: the footer is a landmark of
 * the chrome, so it takes the navigation's surface rather than the page's, and it
 * keeps the page's own side padding at the narrow tier — the two are read
 * together, so the footer's first column lines up with the prose above it.
 */
describe('the stylesheet', () => {
  const css = readCss('app/docs.css');
  const rule = (selector: string) =>
    [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
      .filter(([, selectors]) => selectors!.trim() === selector)
      .map(([, , body]) => body!.replace(/\s+/g, ' ').trim());

  it('puts the footer on the raised surface the rail and the drawer use', () => {
    // The surface sits on the two bars, not on the nav that holds them.
    const bars = rule('.rail,\n.drawer')[0] ?? rule('.rail, .drawer')[0];
    expect(rule('.footer')[0]).toMatch(/background: var\(--ap-color-surface-raised\)/);
    expect(bars).toMatch(/background: var\(--ap-color-surface-raised\)/);
  });

  it('takes the page’s side padding at every tier', () => {
    /** The side of every `padding` shorthand the selector declares, in order. */
    const sides = (selector: string) =>
      rule(selector)
        .map((body) => body.match(/(?:^|[;\s])padding: ([^;]+)/))
        .filter((padding) => padding !== null)
        .map((padding) => padding[1]!.split(/\s+/)[1]);

    // Two tiers each: the wide default, and the narrow one that restates it.
    expect(sides('.footer')).toHaveLength(2);
    expect(sides('.footer')).toEqual(sides('.page'));
  });
});
