'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

/** Routes drawn without the site around them: the dense screen stands as a product would. */
export const BARE_ROUTES = ['/screen/full'];

/**
 * The site's rail, column and footer around a page, except on a bare route.
 * A client component only for the path; the rail and the footer stay server
 * components passed in. With `output: 'export'` the path is known at build,
 * so each route's HTML is written with or without the chrome.
 */
export function Chrome({
  skip,
  nav,
  footer,
  children,
}: {
  skip: ReactNode;
  nav: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}) {
  const path = (usePathname() ?? '/').replace(/\/$/, '');
  if (BARE_ROUTES.includes(path)) return <>{children}</>;
  return (
    <>
      {skip}
      <div className="shell">
        {nav}
        {/* The page and the footer share a column beside the sidebar, so the
            footer runs to the width of the page rather than under the
            sidebar, and the nav's narrow-screen overlay covers both: it makes
            every sibling of its own inert, and this column is the sibling.
            The footer is outside `main` because `contentinfo` is a landmark
            only there. */}
        <div className="column">
          <main className="main" id="content" tabIndex={-1}>
            {children}
          </main>
          {footer}
        </div>
      </div>
    </>
  );
}
