import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { readCss } from '@/test/css';

/**
 * Every size in these stylesheets is measured border-box: a 40px field is 40px
 * with its padding and border. The docs site sets border-box on everything, and
 * so does Tailwind's preflight, but an app installing the package may have no
 * reset at all — there a field measured 58px and a badge 8px taller. So each
 * stylesheet declares border-box for its own boxes, and this test fails when a
 * rule sizes, pads or borders one that is not in that declaration.
 *
 * jsdom has no layout, so the test reads the rules instead of measuring.
 */

const stylesheets = readdirSync('src/components', { recursive: true, encoding: 'utf8' })
  .filter((file) => file.endsWith('.module.css'))
  .map((file) => join('src/components', file));

const SIZE = /(?:^|[\s;])(?:min-|max-)?(?:width|height|inline-size|block-size)\s*:/;
const PADDING = /(?:^|[\s;])padding(?:-[a-z-]+)?\s*:\s*(?!0(?:px)?\s*(?:;|$))/;
const BORDER =
  /(?:^|[\s;])border(?:-(?:top|right|bottom|left|block|inline)(?:-(?:start|end))?)?(?:-width)?\s*:\s*(?!none|0(?:px)?\s*(?:;|$))/;

/** Innermost rules, so those inside `@media` count too. Keyframe steps name no class and drop out below. */
const rules = (css: string) =>
  [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selector, body]) => ({
    selectors: selector!.split(',').map((s) => s.trim()),
    body: body!,
  }));

/**
 * What a selector sizes: its classes, or the whole selector when the element
 * it lands on has none (`.icon svg`). A pseudo-element is its own box, so it
 * keeps its `::before`. State — `:checked`, `[data-direction]` — is dropped:
 * it does not change which box it is.
 */
function boxes(selector: string): string[] {
  const subject = selector.split(/\s*[\s>+~]\s*/).pop()!;
  const pseudo = subject.match(/::[a-z-]+/)?.[0] ?? '';
  const plain = subject
    .replace(/::[a-z-]+/, '')
    .replace(/:[a-z-]+(\([^)]*\))?/g, '')
    .replace(/\[[^\]]*\]/g, '');
  const classes = plain.match(/\.[A-Za-z][\w-]*/g);
  if (!classes) return [selector];
  return classes.map((name) => name + pseudo);
}

describe('stylesheets do not depend on the host page for their box model', () => {
  it.each(stylesheets)('%s declares border-box for every box it sizes, pads or borders', (file) => {
    const all = rules(readCss(file));
    const declared = new Set(
      all.filter((rule) => /box-sizing:\s*border-box/.test(rule.body)).flatMap((rule) => rule.selectors),
    );

    const missing = new Set<string>();
    for (const rule of all) {
      if (!SIZE.test(rule.body) && !PADDING.test(rule.body) && !BORDER.test(rule.body)) continue;
      for (const selector of rule.selectors) {
        if (/^(from|to|\d+%)$/.test(selector)) continue;
        const candidates = boxes(selector);
        // `.withIcon.sm` is one element: either class declaring border-box covers it.
        if (!candidates.some((box) => declared.has(box))) missing.add(candidates.join(''));
      }
    }

    expect([...missing], 'not in a box-sizing: border-box rule').toEqual([]);
  });
});
