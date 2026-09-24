import { describe, it, expect } from 'vitest';
import { readCss } from '@/test/css';

/**
 * Specimens, dialogs and drawers render inside `article.prose`, and the
 * production build puts `app/docs.css` after the components' CSS Modules. A
 * prose rule with any weight of its own — `.prose a`, `.prose h3`,
 * `.prose > *` — outranked or tied a component's single class and won on
 * order: every SideNav link in the accent, a Drawer 480 wide on a 375 screen,
 * a card's title 32px down. Under `:where()` a prose rule weighs nothing, so
 * any component or docs class beats it wherever the bundler puts the sheets,
 * and plain prose — which has no class of its own — still gets it.
 */
/** A selector list's selectors: split at its own commas, not at those inside `:where(p, h1)`. */
const selectorsOf = (list: string) => {
  const out: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < list.length; i++) {
    if (list[i] === '(') depth++;
    else if (list[i] === ')') depth--;
    else if (list[i] === ',' && depth === 0) {
      out.push(list.slice(start, i));
      start = i + 1;
    }
  }
  return [...out, list.slice(start)];
};

describe('the prose rules', () => {
  const css = readCss('app/docs.css');
  const selectors = [...css.matchAll(/([^{}@]+)\{[^{}]*\}/g)]
    .flatMap(([, s]) => selectorsOf(s!))
    .map((s) => s.trim())
    .filter((s) => /\.prose[\s>~+]/.test(s) || /:where\([^)]*\.prose/.test(s));
  const weighed = (s: string) => s.replace(/:where\((?:[^()]|\([^()]*\))*\)/g, '').replace(/[\s>~+*]/g, '');

  it('finds them', () => expect(selectors.length).toBeGreaterThan(10));

  it('reach inside with zero specificity, so any component rule wins', () => {
    for (const s of selectors) expect([s, weighed(s)]).toEqual([s, '']);
  });

  it('give the measure to text only', () => {
    expect(css).not.toMatch(/\.prose\)?\s*>\s*\*\s*\{[^}]*max-width/);
  });
});
