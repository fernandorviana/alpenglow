'use client';

import { cloneElement, useEffect, useId, useLayoutEffect, useRef } from 'react';
import type { CSSProperties, FocusEvent, PointerEvent, ReactElement, ReactNode } from 'react';
import styles from './Tooltip.module.css';

/**
 * Hover waits, so a pointer crossing the page does not leave a trail of
 * tooltips; keyboard focus does not, because focus is already a decision.
 * The close delay is the time the pointer has to cross the 8px between the
 * trigger and the panel (WCAG 1.4.13, hoverable).
 *
 * Behaviour, not motion: these are not durations of anything that moves, so
 * they are not motion tokens.
 */
export const TOOLTIP_OPEN_DELAY = 400;
export const TOOLTIP_CLOSE_DELAY = 100;

export const tooltipSizes = ['sm', 'md'] as const;
export type TooltipSize = (typeof tooltipSizes)[number];

export const tooltipPlacements = ['top', 'bottom', 'start', 'end'] as const;
export type TooltipPlacement = (typeof tooltipPlacements)[number];

/**
 * The tooltip that is open, as the function that closes it. One at a time:
 * focus resting on one button and the pointer on its neighbour would
 * otherwise leave two panels overlapping. The last one asked for wins.
 */
let openTooltip: { owner: object; close: () => void } | undefined;

// Compared by owner, not by function: a component's `close` is a new function
// on every render, and the one stored here may be from an earlier one. Module
// functions, because a component may not reassign what is outside it.
function claim(owner: object, close: () => void) {
  if (openTooltip && openTooltip.owner !== owner) openTooltip.close();
  openTooltip = { owner, close };
}

function release(owner: object) {
  if (openTooltip?.owner === owner) openTooltip = undefined;
}

type TriggerProps = { 'aria-describedby'?: string; 'aria-labelledby'?: string };

export type TooltipProps = {
  /** What the tooltip says. Nothing in it may be clicked: that is a Popover. */
  content: ReactNode;
  /** The drawn paragraph under the content, a level quieter. */
  description?: string;
  /** A keyboard shortcut, set after the content. */
  shortcut?: string;
  /**
   * `md` is the drawn card, for an explanation; `sm` is for the word or two
   * on an icon button. Left out, a string is `sm` and anything richer `md`.
   */
  size?: TooltipSize;
  /** Where it opens. It flips to the other side when it does not fit. */
  placement?: TooltipPlacement;
  /**
   * `describe` adds to the trigger's name. `label` *is* the name, for a
   * button that shows only an icon.
   */
  purpose?: 'describe' | 'label';
  /** The trigger. One element, and one that can take keyboard focus. */
  children: ReactElement<TriggerProps>;
  className?: string;
};

/**
 * What only the system's own components pass. Not in `TooltipProps`, so not
 * part of what the package documents.
 */
type TooltipInternals = {
  /**
   * False, it opens on nothing: no hover, no focus. The panel stays in the
   * tree, so the trigger keeps its name and is never remounted under the
   * focus. Filters' chip words, whose Tooltip has something to say only while
   * they are cut short. A panel opened and hidden by a rule instead would
   * still be a shown popover: it would take the one-at-a-time slot, and the
   * Esc a Drawer or a Dialog around it was waiting for.
   */
  when?: boolean;
};

export function Tooltip({
  content,
  description,
  shortcut,
  size = typeof content === 'string' ? 'sm' : 'md',
  placement = 'top',
  purpose = 'describe',
  children,
  className,
  when = true,
}: TooltipProps & TooltipInternals) {
  const uid = useId();
  const id = `${uid}-tooltip`;
  // useId's output is valid in an id and not in a CSS identifier.
  const anchor = `--tooltip-${uid.replace(/[^a-zA-Z0-9]/g, '')}`;

  const panel = useRef<HTMLSpanElement>(null);
  // The platform is the state: showPopover on an open popover throws, and so
  // does hidePopover on a closed one, so what it was last told is kept here.
  const shown = useRef(false);
  const owner = useRef({});
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const onEscape = useRef((event: KeyboardEvent) => {
    // Dismissible without moving the pointer or the focus (1.4.13). On the
    // document, because a tooltip opened by hover has no focus inside it.
    if (event.key !== 'Escape') return;
    // This Esc was for the tooltip. Cancelled, it does not go on to become a
    // close request: inside a Dialog, the keypress that dismisses a tooltip
    // must not also discard the form behind it.
    event.preventDefault();
    close();
  });

  // Read when the open is asked for, not when it was scheduled: a hover's
  // open runs a delay after the render that set it up.
  const allowed = useRef(when);

  function open() {
    clearTimeout(timer.current);
    if (shown.current || !panel.current || !allowed.current) return;
    claim(owner.current, close);
    shown.current = true;
    panel.current.showPopover();
    document.addEventListener('keydown', onEscape.current);
  }

  function close() {
    clearTimeout(timer.current);
    if (!shown.current || !panel.current) return;
    release(owner.current);
    shown.current = false;
    panel.current.hidePopover();
    document.removeEventListener('keydown', onEscape.current);
  }

  // Before the browser paints, so a panel that has nothing more to say is
  // never seen for a frame.
  useLayoutEffect(() => {
    allowed.current = when;
    if (!when) close();
  }, [when]);

  useEffect(() => {
    const onKey = onEscape.current;
    return () => {
      clearTimeout(timer.current);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const onPointerEnter = (event: PointerEvent) => {
    // No hover on a phone: a touch would open it under the finger and leave
    // it there. Which is why a tooltip never holds what cannot be done without.
    if (event.pointerType === 'touch') return;
    clearTimeout(timer.current);
    if (!shown.current) timer.current = setTimeout(open, TOOLTIP_OPEN_DELAY);
  };

  const onPointerLeave = () => {
    clearTimeout(timer.current);
    if (shown.current) timer.current = setTimeout(close, TOOLTIP_CLOSE_DELAY);
  };

  const onFocus = (event: FocusEvent) => {
    // Keyboard focus only. A click focuses the button too, and a tooltip
    // opening under the pointer that just pressed is in the way.
    let visible = true;
    try {
      visible = (event.target as Element).matches(':focus-visible');
    } catch {
      // An engine without the selector: treat every focus as the keyboard's.
    }
    if (visible) open();
  };

  // Appended, never replaced: the trigger may already be described by a
  // field's helper text.
  const attribute = purpose === 'label' ? 'aria-labelledby' : 'aria-describedby';
  const trigger = cloneElement(children, {
    [attribute]: [children.props[attribute], id].filter(Boolean).join(' '),
  });

  return (
    <span
      className={[styles.wrapper, className].filter(Boolean).join(' ')}
      style={{ '--tooltip-anchor': anchor } as CSSProperties}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onPointerDown={(event) => {
        // A press on the trigger, not on the panel. The panel is a DOM child
        // of the wrapper, and a reader may press on it to select its text.
        if (!panel.current?.contains(event.target as Node)) close();
      }}
      onFocus={onFocus}
      onBlur={close}
    >
      {trigger}
      {/* Spans all the way down. A tooltip's trigger is often a word inside
          a paragraph, and a div or a p inside a p is closed early by the HTML
          parser: the server's markup and React's would disagree. */}
      <span
        ref={panel}
        id={id}
        role="tooltip"
        popover="manual"
        className={`${styles.tooltip} ${styles[size]} ${styles[placement]}`}
      >
        <span className={styles.body}>
          <span className={styles.content}>{content}</span>
          {/* A real space, or the trigger's description reads "Search⌘K". */}
          {shortcut && ' '}
          {shortcut && <kbd className={styles.shortcut}>{shortcut}</kbd>}
        </span>
        {description && <span className={styles.description}>{description}</span>}
      </span>
    </span>
  );
}
