/**
 * `next/navigation` for the renderer that builds the search index, which
 * runs outside Next: the page's Pager asks for the pathname, and the
 * extractor sets it before rendering each page. Aliased in by
 * `scripts/build-search-index.ts`, mocked in by `extract.test.tsx`.
 */
let pathname = '/';

export const setPathname = (next: string) => {
  pathname = next;
};

export const usePathname = () => pathname;
