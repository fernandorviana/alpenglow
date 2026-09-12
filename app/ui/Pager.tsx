'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight } from '@carbon/icons-react';
import { neighbours } from './contents';

/**
 * The page before and the page after, at the foot of the prose, in the
 * sidebar's reading order. The direction and the name are two lines of one
 * link, so a space is written between them: without it, an accessible name
 * computed from text alone reads "NextInput and Textarea". Each end of the site has one link; a page the
 * sidebar does not list has none, because a wrong neighbour is worse than
 * no neighbour.
 */
export function Pager() {
  const { previous, next } = neighbours(usePathname() ?? '');
  if (!previous && !next) return null;

  return (
    <nav className="pager" aria-label="Pages">
      {previous && (
        <Link href={previous.href} className="pagerLink pagerPrevious" rel="prev">
          <ChevronLeft size={16} aria-hidden="true" />
          <span className="pagerText">
            <span className="pagerDirection">Previous</span>{' '}
            <span className="pagerLabel">{previous.label}</span>
          </span>
        </Link>
      )}
      {next && (
        <Link href={next.href} className="pagerLink pagerNext" rel="next">
          <span className="pagerText">
            <span className="pagerDirection">Next</span>{' '}
            <span className="pagerLabel">{next.label}</span>
          </span>
          <ChevronRight size={16} aria-hidden="true" />
        </Link>
      )}
    </nav>
  );
}
