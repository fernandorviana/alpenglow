'use client';

import { useId, useState } from 'react';
import type {
  CSSProperties,
  KeyboardEvent as ReactKeyboardEvent,
  KeyboardEventHandler,
  ReactNode,
  ToggleEvent,
} from 'react';
import { useHydrated } from '../useHydrated';
import styles from './DropdownMenu.module.css';
import { actionText, isGroup, isSeparator, matchIndex, nextIndex } from './rows';
import type { DropdownMenuAction, DropdownMenuEntry } from './rows';

export type DropdownMenuTriggerProps = {
  id: string;
  /** Absent in server HTML and the hydration pass; see `useHydrated`. */
  popoverTarget?: string;
  'aria-haspopup': 'menu';
  'aria-expanded': boolean;
  onKeyDown: KeyboardEventHandler;
  style: CSSProperties;
};

export type DropdownMenuProps = {
  /** Receives everything the trigger needs. Spread it onto a button. */
  trigger: (props: DropdownMenuTriggerProps) => ReactNode;
  items: DropdownMenuEntry[];
};

function Row({ action, onClose }: { action: DropdownMenuAction; onClose: () => void }) {
  return (
    <button
      type="button"
      role="menuitem"
      // Disabled rows take no tabindex and no focus at all — not even the APG's
      // focusable-but-inert. See the disabled block in the stylesheet.
      aria-disabled={action.disabled || undefined}
      tabIndex={action.disabled ? undefined : -1}
      className={[styles.item, action.tone && styles[action.tone]].filter(Boolean).join(' ')}
      data-text={actionText(action)}
      onClick={() => {
        if (action.disabled) return;
        action.onSelect?.();
        onClose();
      }}
      // The pointer moves focus, so the highlight has one owner. See the
      // :focus rule in DropdownMenu.module.css.
      onMouseEnter={(event) => {
        if (action.disabled) return;
        event.currentTarget.focus();
      }}
    >
      {action.icon && (
        <span className={`${styles.icon} ${styles.iconStart}`} aria-hidden="true">
          {action.icon}
        </span>
      )}
      <span className={styles.label}>{action.label}</span>
      {action.iconEnd && (
        <span className={styles.icon} aria-hidden="true">
          {action.iconEnd}
        </span>
      )}
    </button>
  );
}

export function DropdownMenu({ trigger, items }: DropdownMenuProps) {
  const uid = useId();
  const menuId = `menu-${uid}`;
  const triggerId = `menu-trigger-${uid}`;
  // useId returns a value containing characters that are legal in an HTML id
  // and not in a CSS identifier, so the anchor name is sanitised separately.
  const anchor = `--menu-${uid.replace(/[^a-zA-Z0-9]/g, '')}`;

  const hydrated = useHydrated();
  const [open, setOpen] = useState(false);
  // The menu element is state, not a ref. Its handlers are handed to `trigger()`
  // during render, and a handler closing over a ref reads to the React Compiler
  // as a ref read during render: it skips the component, and the hooks lint of
  // any project this is copied into fails on it.
  const [menu, setMenu] = useState<HTMLDivElement | null>(null);
  const close = () => menu?.hidePopover();

  /**
   * Navigation reads the live DOM rather than mirroring the row list in state.
   * There is then only one source of truth for what is focusable, and the
   * disabled filter lives in one selector instead of in both the markup and a
   * parallel array that can fall out of step with it.
   */
  const focusables = (): HTMLElement[] => {
    if (!menu) return [];
    return [...menu.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])')];
  };

  const focusAt = (index: number) => {
    const rows = focusables();
    if (index < 0 || rows.length === 0) {
      // Every row disabled: park focus on the surface so the popover is not a
      // focus black hole.
      menu?.focus();
      return;
    }
    rows[index]?.focus();
  };

  const onTriggerKeyDown = (event: ReactKeyboardEvent) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    menu?.showPopover();
    focusAt(event.key === 'ArrowDown' ? 0 : focusables().length - 1);
  };

  const onMenuKeyDown = (event: ReactKeyboardEvent) => {
    const rows = focusables();
    const at = rows.indexOf(document.activeElement as HTMLElement);

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        focusAt(nextIndex(at, 1, rows.length));
        return;
      case 'ArrowUp':
        event.preventDefault();
        // From the surface itself (at === -1) a wrapping step back would land
        // on the second-to-last row, not the last.
        focusAt(at < 0 ? rows.length - 1 : nextIndex(at, -1, rows.length));
        return;
      case 'Home':
        event.preventDefault();
        focusAt(0);
        return;
      case 'End':
        event.preventDefault();
        focusAt(rows.length - 1);
        return;
      case 'Tab':
        // popover="auto" does not close on Tab; the APG pattern asks for it.
        // The default is not prevented, so tabbing continues past the trigger.
        close();
        return;
    }

    // Typeahead. Single printable characters only — a modifier means a
    // shortcut, and a longer key name is a key, not a character.
    if (event.key.length !== 1 || event.metaKey || event.ctrlKey || event.altKey) return;
    const texts = rows.map((row) => row.dataset.text ?? '');
    const found = matchIndex(texts, at, event.key);
    if (found >= 0) {
      event.preventDefault();
      focusAt(found);
    }
  };

  return (
    <>
      {trigger({
        id: triggerId,
        // Only once hydrated. Before that, a native popovertarget would open
        // the menu while React is not listening: `open` would stay false, so
        // aria-expanded would deny a menu on screen, and the first row would
        // never take focus.
        popoverTarget: hydrated ? menuId : undefined,
        'aria-haspopup': 'menu',
        'aria-expanded': open,
        onKeyDown: onTriggerKeyDown,
        style: { anchorName: anchor },
      })}

      <div
        ref={setMenu}
        id={menuId}
        popover="auto"
        role="menu"
        aria-labelledby={triggerId}
        tabIndex={-1}
        className={styles.menu}
        style={{ '--menu-anchor': anchor } as CSSProperties}
        onKeyDown={onMenuKeyDown}
        onToggle={(event: ToggleEvent) => {
          const isOpen = event.newState === 'open';
          setOpen(isOpen);
          // popover moves focus only for an element with `autofocus`, so a
          // menu opened by a click has to land on its first row. The toggle
          // event is queued and arrives after onTriggerKeyDown has placed
          // focus — ArrowUp's last row must not be overwritten.
          if (isOpen && !menu?.contains(document.activeElement)) focusAt(0);
        }}
      >
        {items.map((entry, i) => {
          if (isSeparator(entry)) {
            // The index is the key because a separator has no identity of its
            // own and never reorders relative to its neighbours.
            return <div key={`sep-${i}`} role="separator" className={styles.separator} />;
          }
          if (isGroup(entry)) {
            const labelId = `${menuId}-group-${i}`;
            return (
              <div key={`group-${i}`} role="group" aria-labelledby={labelId} className={styles.group}>
                <p id={labelId} className={styles.groupLabel}>{entry.label}</p>
                {entry.items.map((action) => (
                  <Row key={action.id} action={action} onClose={close} />
                ))}
              </div>
            );
          }
          return <Row key={entry.id} action={entry} onClose={close} />;
        })}
      </div>
    </>
  );
}
