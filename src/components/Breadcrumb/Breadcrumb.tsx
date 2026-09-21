'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Anchor } from '../linkRender';
import type { LinkRender } from '../linkRender';
import styles from './Breadcrumb.module.css';

export type BreadcrumbItem = {
  label: string;
  /** Without it an ancestor is words. The last item is the page and is never a link. */
  href?: string;
};

export type BreadcrumbProps = {
  /** From the section down to the page, which is the last. */
  items: BreadcrumbItem[];
  /** The section's, before the first item. Only the first has one. */
  icon?: ReactNode;
  /** For a router's link: `renderLink={(props) => <NextLink {...props} />}`. */
  renderLink?: LinkRender;
  /** With more, the middle is folded into a button that unfolds it in place. */
  maxItems?: number;
  'aria-label'?: string;
  expandLabel?: string;
  className?: string;
};

/**
 * Where the page is, from its section down. The section is a capsule with its
 * icon, as drawn; every other link is one under the pointer; the page itself
 * is words.
 */
export function Breadcrumb({
  items,
  icon,
  renderLink,
  maxItems,
  'aria-label': ariaLabel = 'Breadcrumb',
  expandLabel = 'Show path',
  className,
}: BreadcrumbProps) {
  const [unfolded, setUnfolded] = useState(false);
  const list = useRef<HTMLOListElement>(null);

  const folds = !unfolded && maxItems !== undefined && maxItems >= 2 && items.length > maxItems;
  // The first stays, and the last `maxItems - 1`.
  const hiddenUntil = folds ? items.length - (maxItems - 1) : 1;

  // The button that had the focus is gone; the first link after the root
  // takes it, which is the first it revealed that is one. With no link at
  // all, the list does, so the next Tab goes on from here and not from the
  // top of the page.
  useEffect(() => {
    if (!unfolded || !list.current) return;
    const after = list.current.querySelector<HTMLElement>('li:not(:first-child) a');
    (after ?? list.current).focus();
  }, [unfolded]);

  return (
    <nav aria-label={ariaLabel} className={[styles.breadcrumb, className].filter(Boolean).join(' ')}>
      <ol ref={list} tabIndex={-1} className={styles.list}>
        {items.map((item, index) => {
          const first = index === 0;
          const last = index === items.length - 1;
          if (folds && index > 0 && index < hiddenUntil) {
            if (index > 1) return null;
            return (
              <li key="fold" className={styles.item}>
                <span aria-hidden="true" className={styles.slash}>
                  /
                </span>
                <button type="button" className={styles.fold} aria-label={expandLabel} onClick={() => setUnfolded(true)}>
                  <span aria-hidden="true">…</span>
                </button>
              </li>
            );
          }

          const words = (
            <>
              {first && icon && (
                <span aria-hidden="true" className={styles.icon}>
                  {icon}
                </span>
              )}
              <span className={styles.label}>{item.label}</span>
            </>
          );
          return (
            <li key={index} className={styles.item}>
              {!first && (
                <span aria-hidden="true" className={styles.slash}>
                  /
                </span>
              )}
              {last ? (
                <span aria-current="page" className={styles.page}>
                  {words}
                </span>
              ) : item.href ? (
                <Anchor
                  render={renderLink}
                  href={item.href}
                  className={[styles.link, first ? styles.root : undefined].filter(Boolean).join(' ')}
                >
                  {words}
                </Anchor>
              ) : (
                <span className={styles.words}>{words}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
