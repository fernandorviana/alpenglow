import { Fragment } from 'react';

/**
 * Where a name may break: at each hump — `Dropdown|Menu`, `ISO|Date` —
 * after a dot, and after a slash — `alpenglow/|tokens.css`,
 * `interactive/|on-accent`. Zero-width, so splitting on it keeps every
 * character.
 */
const BREAK = /(?<=[a-z0-9])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])|(?<=\.)(?=[A-Za-z_])|(?<=\/)(?=[^\s/])/;

/**
 * What the text is, which decides how its parts hold together.
 *
 * - `type`, a TypeScript type as a Props table shows it: words in a line.
 *   Each word with a break is an inline block (`.typeName` in docs.css), so
 *   it moves to the next line whole, as any word does, and breaks at its
 *   humps only when it is wider than the column. Offered bare, a hump is a
 *   break like a space, and a line takes the last one that fits —
 *   "(props: DropdownMenuTrigger / Props)" at 1440.
 * - `path`, an import that is a cell's whole content, in a code pill: inline,
 *   so the pill wraps with it, and free to break at a hyphen too when a part
 *   is wider than the column — `tailwind-theme.css` is, at 320.
 * - `token`, a token's name: each part keeps to one line, so it breaks after
 *   its slash and never at a hyphen — `interactive/` over `on-accent`, never
 *   `interactive/on-` over `accent`.
 */
export type TypeTextKind = 'type' | 'path' | 'token';

/**
 * A name set in a narrow column: a Props table's type, an import, a token.
 * A Table cell breaks what it cannot hold anywhere, so in a phone's type
 * column `DatePickerInvalidReason` read "DatePickerIn / validReason". Each
 * name is offered a `<wbr>` where both halves are still words instead. The
 * search index joins across a `<wbr>`, so a name is still one word there.
 */
export function TypeText({ children, kind = 'type' }: { children: string; kind?: TypeTextKind }) {
  const set = (parts: string[]) =>
    parts.map((part, j) => (
      <Fragment key={j}>
        {j > 0 && <wbr />}
        {kind === 'token' ? <span className="unbroken">{part}</span> : part}
      </Fragment>
    ));

  if (kind !== 'type') return <>{set(children.split(BREAK))}</>;

  return (
    <>
      {children.split(/(\s+)/).map((word, i) => {
        const parts = word.split(BREAK);
        if (parts.length === 1) return word;
        return (
          <span key={i} className="typeName">
            {set(parts)}
          </span>
        );
      })}
    </>
  );
}
