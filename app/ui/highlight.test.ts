import { describe, it, expect } from 'vitest';
import { highlight, type Lang } from './highlight';

/**
 * The colour in a code block comes from a tokenizer of the site's own, not a
 * grammar engine: five kinds, each painted with a text token the contrast
 * suite already measures on the raised surface. What matters is that the code
 * survives it unchanged and that the few things it colours are the right ones.
 */
const flat = (code: string, lang: Lang) => highlight(code, lang).flat();
const of = (code: string, lang: Lang, kind: string) =>
  flat(code, lang)
    .filter((t) => t.kind === kind)
    .map((t) => t.text);

describe('highlight', () => {
  const samples: [Lang, string][] = [
    ['ts', "import { tokenContrast } from 'alpenglow';\n\ntokenContrast('a', 'b', 'dark'); // 7.11"],
    ['tsx', "'use client';\n\nexport function Row({ id }: { id: string }) {\n  return <Button variant=\"ghost\">{`/rows/${id}`}</Button>;\n}"],
    ['css', '/* app/globals.css */\n@import "tailwindcss";\n@import "alpenglow/styles.css" layer(components);'],
    ['html', '<script>\n  try { var t = localStorage.getItem(\'theme\'); } catch (e) {}\n</script>'],
    ['sh', 'npm install alpenglow\n\nnpm install @carbon/icons-react'],
  ];

  it.each(samples)('reproduces %s code exactly', (lang, code) => {
    expect(highlight(code, lang).map((line) => line.map((t) => t.text).join('')).join('\n')).toBe(code);
  });

  it('splits at the newline and keeps it out of every token', () => {
    const lines = highlight('a\n\nb', 'sh');
    expect(lines).toHaveLength(3);
    expect(lines.flat().some((t) => t.text.includes('\n'))).toBe(false);
  });

  it('marks a keyword, a string and the punctuation in TypeScript', () => {
    const code = "import { Button } from 'alpenglow';";
    expect(of(code, 'ts', 'keyword')).toEqual(['import', 'from']);
    expect(of(code, 'ts', 'string')).toEqual(["'alpenglow'"]);
    expect(of(code, 'ts', 'punctuation')).toEqual(['{', '}', ';']);
    expect(of(code, 'ts', 'plain')).toContain('Button');
  });

  it('leaves an identifier that starts with a keyword plain', () => {
    expect(of('const importer = returned;', 'ts', 'keyword')).toEqual(['const']);
  });

  it('runs a line comment to the end of its line and no further', () => {
    const [first, second] = highlight("// app/layout.tsx\nimport x from 'y';", 'ts');
    expect(first).toEqual([{ kind: 'comment', text: '// app/layout.tsx' }]);
    expect(second![0]).toEqual({ kind: 'keyword', text: 'import' });
  });

  it('carries a block comment across lines', () => {
    const lines = highlight('/* one\n   two */ x', 'ts');
    expect(lines[0]).toEqual([{ kind: 'comment', text: '/* one' }]);
    expect(lines[1]![0]).toEqual({ kind: 'comment', text: '   two */' });
    expect(lines[1]!.at(-1)).toEqual({ kind: 'plain', text: 'x' });
  });

  it('keeps a template string whole, interpolation included', () => {
    expect(of('router.push(`/rows/${id}`)', 'ts', 'string')).toEqual(['`/rows/${id}`']);
  });

  it('does not end a string at an escaped quote', () => {
    expect(of("'it\\'s'", 'ts', 'string')).toEqual(["'it\\'s'"]);
  });

  it('colours a JSX tag and its attribute like the rest of the code', () => {
    const code = '<Button variant="ghost">Actions</Button>';
    expect(of(code, 'tsx', 'string')).toEqual(['"ghost"']);
    expect(of(code, 'tsx', 'punctuation')).toEqual(['<', '=', '>', '</', '>']);
    expect(of(code, 'tsx', 'keyword')).toEqual([]);
  });

  it('marks a CSS at-rule as the keyword and its comment as a comment', () => {
    const code = '/* app/globals.css */\n@import "tailwindcss" layer(components);';
    expect(of(code, 'css', 'comment')).toEqual(['/* app/globals.css */']);
    expect(of(code, 'css', 'keyword')).toEqual(['@import']);
    expect(of(code, 'css', 'string')).toEqual(['"tailwindcss"']);
    expect(of(code, 'css', 'plain')).toContain('layer');
  });

  it('reads an HTML comment, and the script inside a script element as script', () => {
    const code = "<!-- head -->\n<html data-theme=\"dark\">\n<script>\n  var theme = localStorage.getItem('theme');\n</script>";
    expect(of(code, 'html', 'comment')).toEqual(['<!-- head -->']);
    expect(of(code, 'html', 'string')).toEqual(['"dark"', "'theme'"]);
    expect(of(code, 'html', 'keyword')).toEqual(['var']);
    expect(of(code, 'html', 'plain')).toContain('html');
  });

  it('in a shell, a hash opens a comment and a command stays plain', () => {
    const code = '# once\nnpm install alpenglow';
    expect(of(code, 'sh', 'comment')).toEqual(['# once']);
    expect(of(code, 'sh', 'keyword')).toEqual([]);
  });
});
