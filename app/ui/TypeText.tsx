import { Fragment } from 'react';

/**
 * Where a name may break: at each hump — `Dropdown|Menu`, `ISO|Date` — and
 * after a dot. Zero-width, so splitting on it keeps every character.
 */
const BREAK = /(?<=[a-z0-9])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])|(?<=\.)(?=[A-Za-z_])/;

/**
 * A TypeScript type as a Props table shows it. A Table cell breaks what it
 * cannot hold anywhere, so in a phone's type column `DatePickerInvalidReason`
 * read "DatePickerIn / validReason". Each word with a hump is offered a
 * `<wbr>` at each one instead, where both halves are still words, and is an
 * inline block (`.typeName` in docs.css): it moves to the next line whole,
 * as any word does, and breaks at its humps only when it is wider than the
 * column. Offered bare, a hump is a break like a space, and a line takes the
 * last one that fits — "(props: DropdownMenuTrigger / Props)" at 1440. The
 * search index joins across a `<wbr>`, so a name is still one word there.
 */
export function TypeText({ children }: { children: string }) {
  return (
    <>
      {children.split(/(\s+)/).map((word, i) => {
        const parts = word.split(BREAK);
        if (parts.length === 1) return word;
        return (
          <span key={i} className="typeName">
            {parts.map((part, j) => (
              <Fragment key={j}>
                {j > 0 && <wbr />}
                {part}
              </Fragment>
            ))}
          </span>
        );
      })}
    </>
  );
}
