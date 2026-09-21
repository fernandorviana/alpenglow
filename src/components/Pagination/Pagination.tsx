'use client';

import type { MouseEvent, ReactNode } from 'react';
import { pageItems } from './pages';
import { PageSize } from './PageSize';
import styles from './Pagination.module.css';
import hidden from '../visuallyHidden.module.css';

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

export type PaginationSummaryParts = {
  /** The page size: the combobox when it can be changed, text when it cannot. */
  size: ReactNode;
  /** The first and last rows in view, from 1; both 0 when there are none. */
  from: number;
  to: number;
  total: number;
};

export type PaginationProps = {
  /** From 1. Clamped to the pages there are. */
  page: number;
  onPageChange: (page: number) => void;
  /** How many pages. Or give `total` and `pageSize` and it is worked out. */
  pageCount?: number;
  total?: number;
  /** With `total`, shows the summary. */
  pageSize?: number;
  /**
   * With it the size can be typed or picked; without it the size is text.
   * It is followed by `onPageChange` when the page has to move to keep the
   * first row that was in view.
   */
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: readonly number[];
  maxPageSize?: number;
  /** The sentence. Word order is a language's, so it is the caller's. */
  summary?: (parts: PaginationSummaryParts) => ReactNode;
  /** Links instead of buttons, for paging that lives in the URL. */
  hrefFor?: (page: number) => string;
  siblings?: number;
  boundaries?: number;
  label?: string;
  previousLabel?: string;
  nextLabel?: string;
  pageSizeLabel?: string;
  pageLabel?: (page: number) => string;
  /**
   * Says the page arrived at, politely. Turn it off on the second of two
   * Paginations bound to one list, or every page is said twice.
   */
  announce?: boolean;
  className?: string;
};

/** Carbon's caret, on its 32 grid. Apache-2.0, © IBM. Turned over for Next, and both again under rtl. */
function Caret() {
  return (
    <svg viewBox="0 0 32 32" width="16" height="16" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M20 24 10 16 20 8z" />
    </svg>
  );
}

function defaultSummary({ size, from, to, total }: PaginationSummaryParts) {
  return (
    <>
      Showing {size} per page · <strong>{from === to ? from : `${from}–${to}`}</strong> of <strong>{total}</strong>
    </>
  );
}

export function Pagination({
  page,
  onPageChange,
  pageCount,
  total,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
  maxPageSize = 100,
  summary = defaultSummary,
  hrefFor,
  siblings = 1,
  boundaries = 1,
  label = 'Pagination',
  previousLabel = 'Previous page',
  nextLabel = 'Next page',
  pageSizeLabel = 'Results per page',
  pageLabel = (n) => `Page ${n}`,
  announce = true,
  className,
}: PaginationProps) {
  const sized = total !== undefined && pageSize !== undefined && pageSize > 0;
  const count = Math.max(1, Math.floor(pageCount ?? (sized ? Math.ceil(total / pageSize) : 1)));
  // `Number(searchParams.get('page'))` with no such parameter is NaN, and NaN passes through min and max.
  const current = Math.min(Math.max(1, Math.floor(page) || 1), count);

  const go = (to: number) => {
    if (to >= 1 && to <= count && to !== current) onPageChange(to);
  };

  const resize = (size: number) => {
    if (!sized || !onPageSizeChange) return;
    onPageSizeChange(size);
    // The reader keeps their place: the page that holds the first row that
    // was in view.
    const first = (current - 1) * pageSize;
    const next = Math.floor(first / size) + 1;
    if (next !== current) onPageChange(next);
  };

  /** A page, or an arrow. At an end an arrow stays in the tab order and says it is disabled. */
  const control = (to: number, content: ReactNode, name: string, extra: string, isCurrent = false) => {
    const inert = to < 1 || to > count;
    const classes = [styles.item, extra, isCurrent && styles.current, inert && styles.inert].filter(Boolean).join(' ');
    const shared = {
      className: classes,
      'aria-label': name,
      'aria-current': isCurrent ? ('page' as const) : undefined,
      'aria-disabled': inert || undefined,
    };
    if (hrefFor && !inert) {
      // The link navigates on its own; the caller is told as well.
      return (
        <a
          {...shared}
          href={hrefFor(to)}
          onClick={(event: MouseEvent) => {
            // A new tab or window is not this list turning its page.
            if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) go(to);
          }}
        >
          {content}
        </a>
      );
    }
    return (
      // Never `disabled`: pressing Next onto the last page would disable the
      // button under the focus, and the focus would fall to the body.
      <button {...shared} type="button" onClick={(event: MouseEvent) => (inert ? event.preventDefault() : go(to))}>
        {content}
      </button>
    );
  };

  const from = sized && total > 0 ? (current - 1) * pageSize + 1 : 0;
  const to = sized ? Math.min(total, current * pageSize) : 0;

  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')}>
      {sized && (
        // A div: a host page's rule for `p` would give it a margin (the Alert's lesson).
        <div className={styles.summary}>
          {summary({
            size: onPageSizeChange ? (
              <PageSize
                value={pageSize}
                options={pageSizeOptions}
                max={maxPageSize}
                label={pageSizeLabel}
                onChange={resize}
              />
            ) : (
              <strong>{pageSize}</strong>
            ),
            from,
            to,
            total,
          })}
        </div>
      )}
      {/* A press on Next is answered: the page now in view, said politely. Apart
          from the summary, which holds a field and is the caller's sentence. */}
      {announce && (
        <span role="status" className={hidden.hidden}>
          {pageLabel(current)}
        </span>
      )}
      <nav aria-label={label} className={styles.nav}>
        <ul className={styles.list}>
          <li className={styles.place}>{control(current - 1, <Caret />, previousLabel, styles.previous!)}</li>
          {pageItems(current, count, siblings, boundaries).map((item) => (
            <li key={item} className={styles.place}>
              {typeof item === 'number' ? (
                control(item, item, pageLabel(item), styles.page!, item === current)
              ) : (
                <span className={styles.gap}>…</span>
              )}
            </li>
          ))}
          <li className={styles.place}>{control(current + 1, <Caret />, nextLabel, styles.next!)}</li>
        </ul>
      </nav>
    </div>
  );
}
