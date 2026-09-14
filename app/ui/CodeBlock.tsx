import { CopyButton } from './CopyButton';
import { highlight, type Lang, type TokenKind } from './highlight';

const LANG_LABEL: Record<Lang, string> = { ts: 'TS', tsx: 'TSX', css: 'CSS', html: 'HTML', sh: 'Shell' };

const TOKEN_CLASS: Record<Exclude<TokenKind, 'plain'>, string> = {
  comment: 'tokComment',
  keyword: 'tokKeyword',
  string: 'tokString',
  punctuation: 'tokPunctuation',
};

/**
 * A code window: the code, coloured by the tokenizer and copied by the
 * button; over it, when the code is a file, the file's name and its
 * language, and then the lines are numbered — from CSS, so the numbers are
 * neither in the text nor in a selection. A snippet or a shell line has
 * neither. The text inside the pre is the code exactly; a plain token is a
 * text node, so the tree stays small.
 */
export function CodeBlock({ code, lang, title }: { code: string; lang: Lang; title?: string }) {
  const lines = highlight(code, lang);

  return (
    <figure className={title ? 'codeBlock codeNumbered' : 'codeBlock'}>
      {title && (
        <figcaption className="codeHeader">
          <span className="codeLang">{LANG_LABEL[lang]}</span>
          <span className="codeTitle">{title}</span>
        </figcaption>
      )}
      <CopyButton text={code} />
      <pre>
        <code>
          {lines.map((line, i) => (
            <span className="codeLine" key={i}>
              {line.map((token, j) =>
                token.kind === 'plain' ? (
                  token.text
                ) : (
                  <span key={j} className={TOKEN_CLASS[token.kind]}>
                    {token.text}
                  </span>
                ),
              )}
              {i < lines.length - 1 ? '\n' : ''}
            </span>
          ))}
        </code>
      </pre>
    </figure>
  );
}
