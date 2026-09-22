'use client';

import { useState } from 'react';
import { Anchor, type LinkRender } from '../linkRender';
import type { SideNavItem } from '../SideNav/SideNav';
import styles from './SideNavSecondary.module.css';

export type SideNavSection = {
  label: string;
  items: SideNavItem[];
  /** Folded from the start when false. */
  defaultOpen?: boolean;
};

export type SideNavSecondaryProps = {
  sections: SideNavSection[];
  renderLink?: LinkRender;
  'aria-label'?: string;
  /** 24 wide, the strip with the button; the caller holds it. */
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  collapseLabel?: string;
  expandLabel?: string;
  className?: string;
};

/** Carbon's chevrons, on their 32 grid. Apache-2.0, © IBM. */
const CHEVRON_DOWN = 'M16 22L6 12l1.4-1.4 8.6 8.6 8.6-8.6L26 12z';
const CHEVRON_LEFT = 'M10 16L20 6l1.4 1.4-8.6 8.6 8.6 8.6L20 26z';

/**
 * The second level: the pages of the section the reader is in, grouped
 * under captions that fold, on the platform's `details`. 240 wide, or a 24
 * strip holding the drawn collapse button.
 */
export function SideNavSecondary({
  sections,
  renderLink,
  'aria-label': ariaLabel = 'Section',
  collapsed = false,
  onCollapsedChange,
  collapseLabel = 'Collapse navigation',
  expandLabel = 'Expand navigation',
  className,
}: SideNavSecondaryProps) {
  return (
    <nav
      aria-label={ariaLabel}
      className={[styles.secondary, collapsed && styles.collapsed, className].filter(Boolean).join(' ')}
    >
      {onCollapsedChange && (
        <button
          type="button"
          className={styles.fold}
          aria-expanded={!collapsed}
          aria-label={collapsed ? expandLabel : collapseLabel}
          onClick={() => onCollapsedChange(!collapsed)}
        >
          <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true" focusable="false">
            <path d={CHEVRON_LEFT} />
          </svg>
        </button>
      )}
      {sections.map((section, index) => (
        <Section key={`${index}:${section.label}`} section={section} renderLink={renderLink} />
      ))}
    </nav>
  );
}

/**
 * A section of its own, so the drawn fold is read once: `open` written on
 * every render would unfold a section the reader folded at the next
 * re-render, the Accordion's own lesson. React only touches the attribute
 * when the value changes, and this one never does.
 */
function Section({ section, renderLink }: { section: SideNavSection; renderLink?: LinkRender }) {
  const [initiallyOpen] = useState(section.defaultOpen !== false);
  return (
    <details className={styles.section} open={initiallyOpen}>
      <summary className={styles.caption}>
        <svg className={styles.chevron} viewBox="0 0 32 32" fill="currentColor" aria-hidden="true" focusable="false">
          <path d={CHEVRON_DOWN} />
        </svg>
        <span>{section.label}</span>
      </summary>
      <ul className={styles.list}>
        {section.items.map((item) => (
          <li key={item.href}>
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
          </li>
        ))}
      </ul>
    </details>
  );
}
