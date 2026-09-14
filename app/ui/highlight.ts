/**
 * The colour in a code window. Not a grammar engine: five kinds of token,
 * found by a handful of patterns, each painted with a text token of the
 * theme that the contrast suite measures on the raised surface. The site
 * shows a few dozen fixed lines of five languages, and a keyword, a string
 * and a comment are what a reader's eye uses to find its way through them.
 * Anything the patterns do not know is plain, in the primary text colour,
 * and the code comes out letter for letter.
 */
export type Lang = 'ts' | 'tsx' | 'css' | 'html' | 'sh';
export type TokenKind = 'comment' | 'keyword' | 'string' | 'punctuation' | 'plain';
export type Token = { kind: TokenKind; text: string };

const JS_KEYWORDS = new Set([
  'import', 'from', 'export', 'default', 'function', 'return', 'const', 'let', 'var',
  'if', 'else', 'try', 'catch', 'finally', 'throw', 'new', 'typeof', 'async', 'await',
  'type', 'interface', 'class', 'extends', 'for', 'while', 'of', 'in', 'as',
  'null', 'undefined', 'true', 'false',
]);

type Pattern = { kind: TokenKind | ((match: string) => TokenKind); re: RegExp };

const blockComment: Pattern = { kind: 'comment', re: /\/\*[\s\S]*?\*\// };
const lineComment: Pattern = { kind: 'comment', re: /\/\/[^\n]*/ };
const hashComment: Pattern = { kind: 'comment', re: /#[^\n]*/ };
const htmlComment: Pattern = { kind: 'comment', re: /<!--[\s\S]*?-->/ };
/** A quoted string, a backslash escaping the next character; the template holds its `${}`. */
const string: Pattern = { kind: 'string', re: /'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`/ };
const jsWord: Pattern = { kind: (w) => (JS_KEYWORDS.has(w) ? 'keyword' : 'plain'), re: /[A-Za-z_$][\w$]*/ };
/** A CSS at-rule is the keyword; `layer(components)` and a property are plain. */
const cssWord: Pattern = { kind: (w) => (w.startsWith('@') ? 'keyword' : 'plain'), re: /@?[A-Za-z_-][\w-]*/ };
const word: Pattern = { kind: 'plain', re: /[A-Za-z_$@][\w$@./-]*/ };
const punctuation: Pattern = { kind: 'punctuation', re: /<\/|[{}()[\];,.<>=/:+*!&|?%]/ };

// The site's HTML is a root element with one attribute and a script element,
// so the script's keywords are read throughout; no tag name is one of them.
const PATTERNS: Record<Lang, Pattern[]> = {
  ts: [blockComment, lineComment, string, jsWord, punctuation],
  tsx: [blockComment, lineComment, string, jsWord, punctuation],
  css: [blockComment, string, cssWord, punctuation],
  html: [htmlComment, blockComment, lineComment, string, jsWord, punctuation],
  sh: [hashComment, string, word, punctuation],
};

function tokenize(code: string, lang: Lang): Token[] {
  const patterns = PATTERNS[lang].map((p) => ({ ...p, re: new RegExp(p.re.source, 'y') }));
  const tokens: Token[] = [];
  const push = (kind: TokenKind, text: string) => tokens.push({ kind, text });

  let i = 0;
  scan: while (i < code.length) {
    for (const p of patterns) {
      p.re.lastIndex = i;
      const m = p.re.exec(code);
      if (!m) continue;
      push(typeof p.kind === 'function' ? p.kind(m[0]) : p.kind, m[0]);
      i += m[0].length;
      continue scan;
    }
    push('plain', code[i]!);
    i++;
  }
  return tokens;
}

/** The code as lines of tokens; the newline itself is in none of them. */
export function highlight(code: string, lang: Lang): Token[][] {
  const lines: Token[][] = [[]];
  for (const token of tokenize(code, lang)) {
    const pieces = token.text.split('\n');
    pieces.forEach((text, n) => {
      if (n > 0) lines.push([]);
      if (text) lines.at(-1)!.push({ kind: token.kind, text });
    });
  }
  return lines;
}
