import { forwardRef } from 'react';
import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { Anchor } from '../linkRender';
import type { LinkRender } from '../linkRender';
import hidden from '../visuallyHidden.module.css';
import styles from './Link.module.css';

export const linkVariants = ['inline', 'standalone'] as const;
export type LinkVariant = (typeof linkVariants)[number];

export type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  href: string;
  /**
   * `inline` sits in a sentence and takes its size from it. `standalone` is a
   * line of its own — "All locations" under a list — at `body/md`, with a
   * least height of 24.
   */
  variant?: LinkVariant;
  /** After the words, and not part of the name. */
  iconEnd?: ReactNode;
  /** Opens in a new tab, without handing the opener over, and says so. */
  external?: boolean;
  /** Said, not shown, after the words of an `external` link. */
  externalLabel?: string;
  render?: LinkRender;
};

/**
 * The accent and Medium weight at rest, a line under the pointer and the
 * keyboard's focus. No line at rest is a decision with its numbers in
 * docs/superpowers/specs/2026-09-21-link-design.md: the weight is the cue that
 * is not colour.
 */
export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  {
    href,
    variant = 'inline',
    iconEnd,
    external = false,
    externalLabel = 'opens in a new tab',
    render,
    className,
    children,
    target = external ? '_blank' : undefined,
    rel,
    ...rest
  },
  ref,
) {
  // The caller's `rel` joins `noreferrer` and does not replace it, and the new
  // tab is said only if that is where the link still goes.
  const newTab = external && target === '_blank';
  const props = {
    ...rest,
    target,
    rel: external ? [...new Set(['noreferrer', ...(rel?.split(/\s+/).filter(Boolean) ?? [])])].join(' ') : rel,
    ref,
    href,
    className: [styles.link, styles[variant], className].filter(Boolean).join(' '),
    children: (
      <>
        {children}
        {newTab && <span className={hidden.hidden}>{` (${externalLabel})`}</span>}
        {iconEnd && (
          <span className={styles.icon} aria-hidden="true">
            {iconEnd}
          </span>
        )}
      </>
    ),
  };

  return <Anchor render={render} {...props} />;
});
