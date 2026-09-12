import { readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { ComponentType } from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { axeViolations } from '@/test/axe';
import { Nav } from '@ui/Nav';

/**
 * Every docs page, run through axe. The pages draw each component in its
 * variants, sizes and states, so a role, name or state regression in any of
 * them fails here without a case written for it, and a new component is
 * covered the day it has a page. States a page cannot show — an open menu, an
 * open date picker — are checked beside those components.
 */

vi.mock('next/navigation', () => ({ usePathname: () => '/' }));

// jsdom has no matchMedia; the navigation and the theme toggle ask it.
window.matchMedia = (query: string) =>
  ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }) as unknown as MediaQueryList;

const pages = readdirSync('app', { recursive: true, encoding: 'utf8' })
  .filter((file) => file === 'page.tsx' || file.endsWith('/page.tsx'))
  .map((file) => join('app', file))
  .sort();

describe('axe finds no WCAG A or AA violation', () => {
  it('in the site navigation, theme toggle included', async () => {
    const { container } = render(<Nav />);
    expect(await axeViolations(container)).toEqual([]);
  });

  it.each(pages)('on %s', async (path) => {
    const { default: Page }: { default: ComponentType } = await import(/* @vite-ignore */ resolve(path));
    const { container } = render(<Page />);
    expect(await axeViolations(container)).toEqual([]);
  });
});
