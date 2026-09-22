'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { Anchor, type LinkRender } from '../linkRender';
import { Tooltip } from '../Tooltip/Tooltip';
import { useMediaQuery } from '../useMediaQuery';
import styles from './SideNav.module.css';

export type SideNavItem = {
  href: string;
  label: string;
  /** 24, as drawn. */
  icon: ReactNode;
  /** Where the reader is: `aria-current="page"`. */
  current?: boolean;
};

export const SIDE_NAV_NARROW = '(max-width: 760px)';

export type SideNavProps = {
  items: SideNavItem[];
  /** The group at the foot: Settings, as drawn. */
  footer?: SideNavItem[];
  /** For a router's link: `(props) => <NextLink {...props} />`. */
  renderLink?: LinkRender;
  'aria-label'?: string;
  /** 80 wide, icons only, each named by a tooltip. The TopBar's menu button is the control. */
  collapsed?: boolean;
  /** On a narrow screen: shown as a modal drawer from the start side while true. */
  open?: boolean;
  /**
   * Esc, the close button and a close the platform performs call it. A press
   * on a link does not: the caller closes on navigation, as the page's own
   * router tells it.
   */
  onClose?: () => void;
  /** The media query below which it is the drawer. */
  narrow?: string;
  closeLabel?: string;
  className?: string;
};

/**
 * The primary navigation: a column of links with an icon each, 200 wide, or
 * 80 with the labels in tooltips. On a narrow screen it is a modal dialog
 * the TopBar's menu button opens, with the Dialog's mechanics from the
 * platform: the top layer, the scrim, the inert page, Esc and focus return.
 */
export function SideNav({
  items,
  footer,
  renderLink,
  'aria-label': ariaLabel = 'Main',
  collapsed = false,
  open = false,
  onClose,
  narrow = SIDE_NAV_NARROW,
  closeLabel = 'Close',
  className,
}: SideNavProps) {
  const isNarrow = useMediaQuery(narrow);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    else if (!open && el.open) el.close();
  }, [open, isNarrow]);

  const compact = collapsed && !isNarrow;

  const list = (group: SideNavItem[], foot = false) => (
    <ul className={[styles.list, foot && styles.foot].filter(Boolean).join(' ')}>
      {group.map((item) => {
        const link = (
          <Anchor
            href={item.href}
            render={renderLink}
            className={styles.item}
            aria-current={item.current ? 'page' : undefined}
          >
            <span className={styles.icon} aria-hidden="true">
              {item.icon}
            </span>
            <span className={styles.label}>{item.label}</span>
          </Anchor>
        );
        return (
          <li key={item.href}>
            {compact ? (
              <Tooltip content={item.label} purpose="label" placement="end">
                {link}
              </Tooltip>
            ) : (
              link
            )}
          </li>
        );
      })}
    </ul>
  );

  const nav = (
    <nav
      aria-label={ariaLabel}
      className={[styles.sidenav, compact && styles.collapsed, isNarrow && styles.inSheet, className]
        .filter(Boolean)
        .join(' ')}
    >
      {list(items)}
      {footer && footer.length > 0 && list(footer, true)}
    </nav>
  );

  if (!isNarrow) return nav;

  return (
    <dialog
      ref={dialog}
      className={styles.sheet}
      aria-label={ariaLabel}
      onCancel={(event) => {
        event.preventDefault();
        onClose?.();
      }}
      onClose={() => {
        if (open) onClose?.();
      }}
    >
      <button type="button" className={styles.close} aria-label={closeLabel} onClick={onClose}>
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
      {nav}
    </dialog>
  );
}
