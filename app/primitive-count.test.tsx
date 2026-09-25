import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { ComponentType } from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { alphaPrimitives, primitives } from '@/tokens/primitives';

/**
 * Every page that states how many primitives there are states the same
 * figure, and it is the source's: the opaque and the alpha ones together.
 * The home page once counted the opaque alone, 113, beside Foundations' 134.
 * A page is picked up by its evidence line, "{n} primitives" or "{n} bedrock"
 * (/why's word for the same layer), so a new page that states one is covered.
 */

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: () => {} }),
  useSearchParams: () => new URLSearchParams(),
}));

window.matchMedia = (query: string) =>
  ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }) as unknown as MediaQueryList;

const SOURCE = Object.keys(primitives).length + Object.keys(alphaPrimitives).length;
const FIGURE = /^(\d+) (?:primitives|bedrock)$/;

const pages = readdirSync('app', { recursive: true, encoding: 'utf8' })
  .filter((file) => file === 'page.tsx' || file.endsWith('/page.tsx'))
  .map((file) => join('app', file))
  .filter((path) => /\} (?:primitives|bedrock)<\/p>/.test(readFileSync(path, 'utf8')))
  .sort();

describe('the primitive count', () => {
  it('is stated on the pages that state one', () => {
    expect(pages).toEqual(['app/colour/page.tsx', 'app/foundations/page.tsx', 'app/page.tsx', 'app/why/page.tsx']);
  });

  it.each(pages)('on %s is the source count, opaque and alpha together', async (path) => {
    const { default: Page }: { default: ComponentType } = await import(/* @vite-ignore */ resolve(path));
    const { container } = render(<Page />);
    const figures = [...container.querySelectorAll('p')]
      .map((p) => FIGURE.exec(p.textContent?.trim() ?? '')?.[1])
      .filter((n): n is string => n !== undefined)
      .map(Number);
    expect(figures).toEqual([SOURCE]);
  });
});
