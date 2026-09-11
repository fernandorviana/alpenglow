import { readFileSync } from 'node:fs';

/**
 * For the tests that assert a stylesheet invariant, which jsdom cannot compute.
 *
 * Paths resolve from the repository root, because `import.meta.url` is not a
 * file URL under jsdom. Comments are stripped so that a rule quoted in a
 * comment can neither satisfy an assertion nor be found in place of the real
 * one.
 */
export function readCss(path: string) {
  return readFileSync(path, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
}

/** The contents of the first block after `header`, found by matching braces rather than counting. */
export function block(css: string, header: string) {
  const start = css.indexOf(header);
  if (start === -1) throw new Error(`no block: ${header}`);
  const open = css.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}' && --depth === 0) return css.slice(open + 1, i);
  }
  throw new Error(`unterminated block: ${header}`);
}
