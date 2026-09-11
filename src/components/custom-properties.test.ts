import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { readCss } from '@/test/css';

/**
 * A `var()` that names a token nobody declares is not an error anywhere. The
 * declaration becomes invalid at computed-value time and the property falls
 * back to its initial value: a transition vanishes, a border goes transparent,
 * and nothing reaches the console. So every `--ap-` custom property a
 * stylesheet or a page reads must be one tokens.css declares.
 */

const declared = new Set(
  [...readCss('src/styles/tokens.css').matchAll(/(--ap-[\w-]+)\s*:/g)].map(([, name]) => name!),
);

const sources = ['src/components', 'app'].flatMap((root) =>
  readdirSync(root, { recursive: true, encoding: 'utf8' })
    .filter((file) => /\.(css|tsx?)$/.test(file) && !/\.test\.tsx?$/.test(file))
    .map((file) => join(root, file)),
);

/** Names read through `var()`. A name built at runtime (`--ap-color-${…}`) or elided (`--ap-color-*`) is not a name. */
function read(source: string) {
  return [...source.matchAll(/var\(\s*(--ap-[\w-]+)(\$\{)?/g)]
    .filter(([, name, template]) => !template && !name!.endsWith('-'))
    .map(([, name]) => name!);
}

describe('every token a stylesheet or page reads exists', () => {
  it('reads tokens.css', () => {
    expect(declared.has('--ap-color-surface-base')).toBe(true);
    expect(read('a { color: var(--ap-color-text-primary); b: var(--ap-color-${name}); c: var(--ap-color-*) }')).toEqual([
      '--ap-color-text-primary',
    ]);
  });

  it.each(sources)('%s', (file) => {
    const undeclared = read(readFileSync(file, 'utf8')).filter((name) => !declared.has(name));
    expect(undeclared, 'read through var() but not declared in tokens.css').toEqual([]);
  });
});
