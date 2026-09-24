import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { breakpoint } from '@/tokens/scale';

/**
 * Every width a media query names is one of the scale's six, in rem. A media
 * query cannot read a custom property, so the scale is held here instead.
 * `@container` queries are not breakpoints — a component answering its own
 * space — and are left alone; so are `prefers-*`, `pointer`, `hover` and
 * `forced-colors`, which name no width.
 */
const allowed = new Set(Object.values(breakpoint).map((px) => `${px / 16}rem`));

/** The lengths named by media queries in `text`: from `@media` preludes and query strings in code, extracting only from parenthesized features that mention `width`. */
export function mediaWidths(text: string): string[] {
  const queries = [
    ...[...text.matchAll(/@media([^{]+)\{/g)].map(([, prelude]) => prelude!),
    ...[...text.matchAll(/(['"`])(\((?:min-|max-)?width[^'"`]*|\([\d.]+(?:px|rem|em)\s*<=?\s*width[^'"`]*)\1/g)].map(([, , q]) => q!),
  ];
  return queries.flatMap((q) =>
    [...q.matchAll(/\(([^()]*\bwidth\b[^()]*)\)/g)]
      .flatMap(([, group]) => [...group!.matchAll(/(\d+(?:\.\d+)?)(px|rem|em)/g)])
      .map(([length]) => length),
  );
}

const files = ['src', 'app']
  .flatMap((dir) => readdirSync(dir, { recursive: true, encoding: 'utf8' }).map((file) => join(dir, file)))
  .filter((file) => /\.(css|ts|tsx)$/.test(file) && !/\.test\.tsx?$/.test(file))
  .sort();

describe('the breakpoint scale holds', () => {
  it('finds a width when there is one, and only in a media query', () => {
    expect(mediaWidths('@media (max-width: 760px) { .a { max-width: 480px; } }')).toEqual(['760px']);
    expect(mediaWidths('@media (48rem <= width < 96rem) {')).toEqual(['48rem', '96rem']);
    expect(mediaWidths('@container (max-width: 40rem) { .a { color: red; } }')).toEqual([]);
    expect(mediaWidths("useMediaQuery('(max-width: 480px)')")).toEqual(['480px']);
    expect(mediaWidths("useMediaQuery('(width < 30rem)')")).toEqual(['30rem']);
    expect(mediaWidths('@media (prefers-reduced-motion: reduce) {')).toEqual([]);
    expect(mediaWidths('grid-template-columns: minmax(0, 480px);')).toEqual([]);
    expect(mediaWidths('<code>@media (pointer: coarse)</code> keeps 40px and 72px, {')).toEqual([]);
  });

  it('walks the package and the site', () => {
    expect(files).toContain('src/styles/tokens.css');
    expect(files).toContain('app/docs.css');
    expect(files).toContain('app/screen/Screen.tsx');
  });

  it('names no width outside the scale, anywhere', () => {
    const offenders = files.flatMap((file) =>
      mediaWidths(readFileSync(file, 'utf8')).filter((w) => !allowed.has(w)).map((w) => `${file}: ${w}`),
    );
    expect(offenders).toEqual([]);
  });
});
