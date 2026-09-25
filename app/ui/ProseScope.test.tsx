import { readdirSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { readCss, block } from '@/test/css';

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
  return [...out, list.slice(start)].map((s) => s.trim());
};

/** A stylesheet's rules, each as its selectors and a one-line body; a media query's rules are listed without it. */
const rulesOf = (css: string) =>
  [...css.matchAll(/([^{}@]+)\{([^{}]*)\}/g)].map(([, selectors, body]) => ({
    selectors: selectorsOf(selectors!),
    body: body!.replace(/\s+/g, ' ').trim(),
  }));

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
describe('the prose rules', () => {
  const rules = rulesOf(readCss('app/docs.css'));
  // Any selector that names the prose, except the prose's own layout rules,
  // `.prose { … }`, which reach nothing inside it. By name rather than by
  // combinator, so `.prose:not(.x) h2` and `:is(.prose) h2` are caught too.
  const reachesIn = (s: string) => s !== '.prose' && /\.prose\b/.test(s);
  const selectors = rules.flatMap((r) => r.selectors.filter(reachesIn));
  const weighed = (s: string) => s.replace(/:where\((?:[^()]|\([^()]*\))*\)/g, '').replace(/[\s>~+*]/g, '');

  it('finds them', () => expect(selectors.length).toBeGreaterThan(10));

  it('reach inside with zero specificity, so any component rule wins', () => {
    for (const s of selectors) expect([s, weighed(s)]).toEqual([s, '']);
  });

  it('are all in app/docs.css: no module reaches into the prose through `:global`', () => {
    const modules = ['app', 'src'].flatMap((dir) =>
      readdirSync(dir, { recursive: true, encoding: 'utf8' })
        .filter((f) => f.endsWith('.module.css'))
        .map((f) => `${dir}/${f}`),
    );
    expect(modules.length).toBeGreaterThan(10);
    expect(modules.filter((f) => /:global\(\s*\.prose\b/.test(readCss(f)))).toEqual([]);
  });

  it('give the measure to text only', () => {
    const measure = rules.filter(
      (r) => /max-width: 37\.5rem/.test(r.body) && r.selectors.some((s) => s.startsWith(':where(.prose) >')),
    );
    expect(measure).toHaveLength(1);
    const named = measure[0]!.selectors.join(', ');
    // Text by name: the paragraph and the headings a page is written in…
    for (const tag of ['p', 'h2', 'h3']) expect(named).toMatch(new RegExp(`[(,\\s]${tag}[,)\\s]`));
    // …and not every child with exceptions, which missed the Drawer.
    expect(named).not.toContain('*');
    // Nothing else that names the prose sets a width limit, the bare
    // `.prose` included: the content column itself is never capped here.
    const others = rules.filter(
      (r) => r !== measure[0] && r.selectors.some((s) => /\.prose\b/.test(s)) && /max-width/.test(r.body),
    );
    expect(others.map((r) => r.selectors.join(', '))).toEqual([]);
  });
});

/**
 * `surface/sunken` is `surface/base` in dark (invariant 4) — the inline
 * code pill painted the canvas colour and vanished on it (fidelity audit,
 * 2026-09-24). Dark takes `surface/overlay` instead; the override has to
 * stay zero-specificity like every other prose rule above, so it wins on
 * source order alone and a code block's own `.codeBlock code` (a real
 * class, `background: none`) still overrides it there regardless of order.
 */
describe('inline code’s pill in dark', () => {
  const css = readCss('app/docs.css');
  const restIndex = css.indexOf(':where(.prose) :where(code) {');
  const after = css.slice(restIndex + 1);

  it('is surface/sunken at rest', () => {
    expect(restIndex).toBeGreaterThan(-1);
    expect(block(css, ':where(.prose) :where(code) {')).toContain('--ap-color-surface-sunken');
  });

  it('takes surface/overlay in dark, written twice, once for the system and once for the choice', () => {
    const media = block(after, '@media (prefers-color-scheme: dark)');
    expect(block(media, ':where(.prose) :where(code)')).toContain('--ap-color-surface-overlay');
    expect(block(after, ":where(:root[data-theme='dark']) :where(.prose) :where(code)")).toContain(
      '--ap-color-surface-overlay',
    );
  });

  it('never reaches into a code block: `.codeBlock code` keeps a real class, ahead of any zero-specificity dark rule', () => {
    expect(block(css, '.codeBlock code {')).toContain('background: none');
  });
});
