'use client';

import { useId, useState } from 'react';
import type { CSSProperties, KeyboardEventHandler, ReactNode, ToggleEvent } from 'react';
import styles from './Menu.module.css';

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
};

export function Menu({ trigger }: MenuProps) {
  const uid = useId();
  const menuId = `menu-${uid}`;
  const triggerId = `menu-trigger-${uid}`;
  // useId returns a value containing characters that are legal in an HTML id
  // and not in a CSS identifier, so the anchor name is sanitised separately.
  const anchor = `--menu-${uid.replace(/[^a-zA-Z0-9]/g, '')}`;

  const [open, setOpen] = useState(false);

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
        id={menuId}
        popover="auto"
        role="menu"
        aria-labelledby={triggerId}
        className={styles.menu}
        style={{ '--menu-anchor': anchor } as CSSProperties}
        onToggle={(event: ToggleEvent) => setOpen(event.newState === 'open')}
      />
    </>
  );
}
