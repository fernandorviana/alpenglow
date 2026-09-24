import { describe, it, expect } from 'vitest';
import { readCss } from '@/test/css';

/**
 * The site draws a ring on whatever has none of its own. The production build
 * puts `app/docs.css` after the components' CSS Modules, so a global rule
 * that carries any weight ties with a component's single class and wins on
 * order — a second ring inside the CommandPalette's field, a pill button
 * squared off while focused. At zero specificity every component rule beats it.
 */
describe('the site focus ring', () => {
  const css = readCss('app/docs.css');
  const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selectors, body]) => ({
    selectors: selectors!.split(',').map((s) => s.trim()),
    body: body!.replace(/\s+/g, ' ').trim(),
  }));

  // A selector anchored on nothing: no class, id, element or attribute of its
  // own, only pseudo-classes, possibly inside `:where()`.
  const global = (s: string) => s.startsWith(':') || s.startsWith('*');
  // What is left to count once `:where()` and `*` are gone; empty is (0,0,0).
  const weighed = (s: string) => s.replace(/:where\([^()]*\)/g, '').replace(/\*/g, '').trim();

  const ring = rules.filter((r) => r.selectors.some((s) => global(s) && s.includes(':focus-visible')));

  it('is one global rule, and it draws the ring', () => {
    expect(ring).toHaveLength(1);
    expect(ring[0]!.body).toMatch(/outline: var\(--ap-border-width-ring\) solid var\(--ap-color-border-focus\)/);
  });

  it('has zero specificity, so any component rule wins over it', () => {
    for (const s of ring[0]!.selectors) expect(weighed(s)).toBe('');
  });
});
