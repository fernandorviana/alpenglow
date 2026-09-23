/**
 * `next/navigation` for the renderer that builds the search index, which
 * runs outside Next: the page's Pager asks for the pathname, and the
 * extractor sets it before rendering each page; the Command palette page
 * asks for the router. Aliased in by
 * `scripts/build-search-index.ts`, mocked in by `extract.test.tsx`.
 */
let pathname = '/';

export const setPathname = (next: string) => {
  pathname = next;
};

export const usePathname = () => pathname;

/** A page that navigates on a command asks for the router; outside Next it goes nowhere. */
export const useRouter = () => ({ push: () => {} });
