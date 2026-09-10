'use client';

import { useId, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEventHandler, ReactNode, ToggleEvent } from 'react';
import styles from './Menu.module.css';
import { actionText, flattenActions } from './rows';
import type { MenuAction, MenuEntry } from './rows';

export type MenuTriggerProps = {
  id: string;
  popoverTarget: string;
  'aria-haspopup': 'menu';
  'aria-expanded': boolean;
  onKeyDown: KeyboardEventHandler;
  style: CSSProperties;
};

export type MenuProps = {
  /** Receives everything the trigger needs. Spread it onto a button. */
  trigger: (props: MenuTriggerProps) => ReactNode;
  items: MenuEntry[];
};

function Row({ action, onClose }: { action: MenuAction; onClose: () => void }) {
  return (
    <button
      type="button"
      role="menuitem"
      tabIndex={-1}
      className={[styles.item, action.tone && styles[action.tone]].filter(Boolean).join(' ')}
      data-text={actionText(action)}
      onClick={() => {
        action.onSelect?.();
        onClose();
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

export function Menu({ trigger, items }: MenuProps) {
  const uid = useId();
  const menuId = `menu-${uid}`;
  const triggerId = `menu-trigger-${uid}`;
  // useId returns a value containing characters that are legal in an HTML id
  // and not in a CSS identifier, so the anchor name is sanitised separately.
  const anchor = `--menu-${uid.replace(/[^a-zA-Z0-9]/g, '')}`;

  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const close = () => menuRef.current?.hidePopover();

  const onKeyDown: KeyboardEventHandler = () => {
    // Opening with the arrow keys lands in Task 6.
  };

  return (
    <>
      {trigger({
        id: triggerId,
        popoverTarget: menuId,
        'aria-haspopup': 'menu',
        'aria-expanded': open,
        onKeyDown,
        style: { anchorName: anchor },
      })}

      <div
        ref={menuRef}
        id={menuId}
        popover="auto"
        role="menu"
        aria-labelledby={triggerId}
        className={styles.menu}
        style={{ '--menu-anchor': anchor } as CSSProperties}
        onToggle={(event: ToggleEvent) => setOpen(event.newState === 'open')}
      >
        {flattenActions(items).map((action) => (
          <Row key={action.id} action={action} onClose={close} />
        ))}
      </div>
    </>
  );
}
