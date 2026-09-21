'use client';

import { useEffect, useId, useState } from 'react';
import type { CSSProperties, ReactNode, RefObject, ToggleEvent } from 'react';
import { useHydrated } from '../useHydrated';
import floating from '../floating.module.css';
import styles from './Popover.module.css';

export const popoverPlacements = ['bottom-start', 'bottom-end', 'top-start', 'top-end'] as const;
export type PopoverPlacement = (typeof popoverPlacements)[number];

/** Where the panel stands against its trigger. It flips on its own when it does not fit. */
const AREA: Record<PopoverPlacement, string> = {
  'bottom-start': 'block-end span-inline-end',
  'bottom-end': 'block-end span-inline-start',
  'top-start': 'block-start span-inline-end',
  'top-end': 'block-start span-inline-start',
};

/** Spread on the trigger, which has to be a `button`: `popovertarget` is a button's. */
export type PopoverTriggerProps = {
  id: string;
  /** Absent in server HTML and the hydration pass; see `useHydrated`. */
  popoverTarget?: string;
  'aria-haspopup': 'dialog';
  'aria-expanded': boolean;
  'aria-controls': string;
  style: CSSProperties;
};

export type PopoverApi = { close: () => void };
type Slot = ReactNode | ((api: PopoverApi) => ReactNode);

export type PopoverProps = {
  trigger: (props: PopoverTriggerProps) => ReactNode;
  /** The panel's name, shown in its header. Without it, give `aria-label`. */
  title?: string;
  'aria-label'?: string;
  /** Beside the title: icon buttons, a menu. */
  headerActions?: Slot;
  /** The footer's buttons, in reading order. No footer without them. */
  actions?: Slot;
  /** A function is handed `close`, for a Cancel or a Save that ends it. */
  children: Slot;
  placement?: PopoverPlacement;
  /** A CSS width. Left out, the content decides. */
  width?: number | string;
  /** Controlled, if given. The platform's own closes are told through `onOpenChange`. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Focused once open — the first field of a form. Without it, the panel itself. */
  initialFocus?: RefObject<HTMLElement | null>;
  className?: string;
};

const slot = (content: Slot, api: PopoverApi) => (typeof content === 'function' ? content(api) : content);

/**
 * A panel anchored to the control that opens it: a form too small for a
 * Dialog, a list of messages, a filter. Not modal — the page behind stays
 * live, and a click on it closes the panel.
 *
 * Native `popover="auto"`, so the top layer, light dismiss, Esc and the focus
 * going back to the trigger are the platform's; the placement is
 * ../floating.module.css. What is left to write is the name, the focus on the
 * way in, and `close` for the panel's own buttons.
 */
export function Popover({
  trigger,
  title,
  'aria-label': ariaLabel,
  headerActions,
  actions,
  children,
  placement = 'bottom-start',
  width,
  open,
  onOpenChange,
  initialFocus,
  className,
}: PopoverProps) {
  const hydrated = useHydrated();
  const base = useId();
  const triggerId = `${base}trigger`;
  const panelId = `${base}panel`;
  const titleId = `${base}title`;
  // useId's colons are not valid in a dashed ident.
  const anchor = `--popover-${base.replace(/[^a-zA-Z0-9]/g, '')}`;

  // The element as state, not a ref: `close` is handed to the caller's render
  // functions, and a ref may not be read on the way there.
  const [panel, setPanel] = useState<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);
  const api: PopoverApi = { close: () => panel?.hidePopover() };

  // Controlled: the prop is carried to the platform, which owns the state.
  useEffect(() => {
    if (open === undefined || !panel || open === shown) return;
    // Not show and hide, which throw on a popover already there: `shown` is a
    // task behind the platform, and the trigger may have opened it meanwhile.
    panel.togglePopover(open);
  }, [open, shown, panel]);

  return (
    <>
      {trigger({
        id: triggerId,
        popoverTarget: hydrated ? panelId : undefined,
        'aria-haspopup': 'dialog',
        'aria-expanded': shown,
        'aria-controls': panelId,
        style: { anchorName: anchor } as CSSProperties,
      })}

      <div
        ref={setPanel}
        id={panelId}
        popover="auto"
        role="dialog"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : ariaLabel}
        tabIndex={-1}
        className={[floating.floating, styles.popover, className].filter(Boolean).join(' ')}
        style={
          {
            '--floating-anchor': anchor,
            '--floating-area': AREA[placement],
            '--popover-width': typeof width === 'number' ? `${width}px` : width,
          } as CSSProperties
        }
        onToggle={(event: ToggleEvent) => {
          const isOpen = event.newState === 'open';
          setShown(isOpen);
          onOpenChange?.(isOpen);
          // The platform moves focus only to an `autofocus`, which React's
          // client renderer does not write.
          if (isOpen) (initialFocus?.current ?? panel)?.focus();
        }}
      >
        {(title || headerActions) && (
          <div className={styles.header}>
            {title && (
              <h2 id={titleId} className={styles.title}>
                {title}
              </h2>
            )}
            {headerActions && <div className={styles.headerActions}>{slot(headerActions, api)}</div>}
          </div>
        )}
        <div className={styles.body}>{slot(children, api)}</div>
        {actions && <div className={styles.footer}>{slot(actions, api)}</div>}
      </div>
    </>
  );
}
