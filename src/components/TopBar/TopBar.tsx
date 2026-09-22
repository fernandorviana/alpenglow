import type { ReactNode } from 'react';
import styles from './TopBar.module.css';

export type TopBarProps = {
  /** The logo or the name, after the menu button. */
  brand?: ReactNode;
  /** Draws the menu button, which collapses the SideNav on a wide screen and opens it on a narrow one. */
  onMenu?: () => void;
  menuLabel?: string;
  /** What the menu button controls is open: `aria-expanded`. */
  menuExpanded?: boolean;
  /** The middle: a search, a title. */
  children?: ReactNode;
  /** The end: Create, icon buttons, the Avatar. */
  actions?: ReactNode;
  className?: string;
};

/** Carbon's menu, on its 32 grid. Apache-2.0, © IBM. */
const MENU = 'M4 6h24v2H4zm0 6h24v2H4zm0 6h24v2H4zm0 6h24v2H4z';

/**
 * The bar along the top of the page, 64 tall: the menu button and the brand
 * at the start, room in the middle, the actions at the end. It owns nothing
 * else; what stands in it is the system's, put there by the caller.
 */
export function TopBar({ brand, onMenu, menuLabel = 'Menu', menuExpanded, children, actions, className }: TopBarProps) {
  return (
    <header className={[styles.topbar, className].filter(Boolean).join(' ')}>
      <div className={styles.start}>
        {onMenu && (
          <button
            type="button"
            className={styles.menu}
            aria-label={menuLabel}
            aria-expanded={menuExpanded}
            onClick={onMenu}
          >
            <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true" focusable="false">
              <path d={MENU} />
            </svg>
          </button>
        )}
        {brand && <div className={styles.brand}>{brand}</div>}
      </div>
      <div className={styles.middle}>{children}</div>
      {actions && <div className={styles.end}>{actions}</div>}
    </header>
  );
}
