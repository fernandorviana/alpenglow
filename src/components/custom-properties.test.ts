import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { readCss, block } from '@/test/css';

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

/**
 * A component hands a value to a shared stylesheet through a custom property
 * the shared rule reads, rather than overriding the shared rule and winning
 * only by load order (the Slider's field, the Switch's description, the
 * Combobox's input, 2026-09-24). A custom property inherits, so one a page
 * sets on an ancestor for its own reasons — `--control-width` is a name any
 * app might use — would reach every control inside it. So the bridges are
 * namespaced, and the two that are set and read on one element are
 * registered not to inherit: nothing from above can reach them. The indent
 * has to inherit, from the Switch's root to its description; the name alone
 * keeps a page out of it.
 */
describe('the bridges between a shared stylesheet and a component', () => {
  const control = readCss('src/components/control.module.css');
  const bridges = ['--alpenglow-control-width', '--alpenglow-field-min-width', '--alpenglow-choice-indent'];

  it.each(['--alpenglow-control-width', '--alpenglow-field-min-width'])('registers %s not to inherit', (name) => {
    const rule = block(control, `@property ${name} {`);
    expect(rule).toMatch(/inherits:\s*false/);
    expect(rule).toMatch(/syntax:\s*['"]\*['"]/);
  });

  it('leaves no bridge under a name a page might use', () => {
    const stylesheets = readdirSync('src', { recursive: true, encoding: 'utf8' })
      .filter((file) => file.endsWith('.css'))
      .map((file) => [file, readCss(join('src', file))] as const);
    for (const [file, css] of stylesheets) {
      expect(css, file).not.toMatch(/--(control-width|field-min-width|choice-indent)\b/);
    }
    const all = stylesheets.map(([, css]) => css).join('\n');
    for (const name of bridges) expect(all, name).toContain(`var(${name},`);
  });
});
