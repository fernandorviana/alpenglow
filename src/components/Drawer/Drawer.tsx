'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent, PointerEvent, ReactNode, RefObject } from 'react';
import { Button } from '../Button/index';
import styles from './Drawer.module.css';

export const drawerModes = ['overlay', 'inline'] as const;
export type DrawerMode = (typeof drawerModes)[number];

export const drawerSides = ['end', 'start'] as const;
export type DrawerSide = (typeof drawerSides)[number];

export const drawerSizes = ['md', 'lg'] as const;
export type DrawerSize = (typeof drawerSizes)[number];

/** The drawn widths, which a resize starts from and a double click goes back to. */
export const DRAWER_WIDTH: Record<DrawerSize, number> = { md: 480, lg: 768 };

/** What a resize leaves the content beside the panel, and the least the panel is. */
const LEAST = 320;
const STEP = 16;

export type DrawerProps = {
  open: boolean;
  /**
   * Esc from inside the panel and the close button call it. The panel never
   * closes itself: the caller sets `open` to false, or asks first — a form
   * left half-way opens a Dialog that says so.
   */
  onClose: () => void;
  /** `overlay` grows over the content; `inline` is a sibling the content makes room for. */
  mode?: DrawerMode;
  side?: DrawerSide;
  /** 480 or 768 wide. */
  size?: DrawerSize;
  /** The panel's name, shown in its header. Without it, give `aria-label`. */
  title?: string;
  'aria-label'?: string;
  /** In the title's place: a record's state, a select. The panel then takes its name from `aria-label`. */
  header?: ReactNode;
  /** Beside the title, before expand and close: icon buttons, a menu. */
  headerActions?: ReactNode;
  /** The footer's buttons, in reading order. No footer without them. */
  actions?: ReactNode;
  children: ReactNode;
  /** Covers the page. The caller's, as `open` is. */
  expanded?: boolean;
  /** The expand button is there only with it. */
  onExpandedChange?: (expanded: boolean) => void;
  /** A handle on the inner edge: drag, the arrows, Home and End, a double click to go back. */
  resizable?: boolean;
  /** Controlled, in pixels. */
  width?: number;
  defaultWidth?: number;
  onWidthChange?: (width: number) => void;
  minWidth?: number;
  /** The most is also whatever leaves the content 320. */
  maxWidth?: number;
  /** Focused once open — the first field of a form. Without it, the panel itself. */
  initialFocus?: RefObject<HTMLElement | null>;
  closeLabel?: string;
  expandLabel?: string;
  collapseLabel?: string;
  resizeLabel?: string;
  className?: string;
};

const ICON = { width: 20, height: 20, viewBox: '0 0 20 20', fill: 'none', 'aria-hidden': true } as const;
const STROKE = { stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

/** The widest the panel may be: the caller's most, and what leaves the content beside it 320. */
function limit(panel: HTMLElement, mode: DrawerMode, minWidth: number, maxWidth: number | undefined) {
  const room = (mode === 'inline' ? (panel.parentElement?.clientWidth ?? 0) : window.innerWidth) - LEAST;
  return Math.max(minWidth, Math.min(maxWidth ?? Infinity, room));
}

/** Something inside with a popover open — a Select, a DatePicker — owns the Esc. */
function hasOpenPopover(panel: HTMLElement) {
  try {
    return panel.querySelector(':popover-open') !== null;
  } catch {
    // A selector engine without :popover-open has no popovers to find.
    return false;
  }
}

/**
 * A panel at the side of the page for a record's detail, a form, filters. Not
 * modal: the page beside it stays live, and a press there does nothing to it.
 *
 * Over the content it is `popover="manual"`, which is the top layer with no
 * light dismiss and no inert page; in the flow it is an element like any
 * other. It is rendered only while open.
 */
export function Drawer({
  open,
  onClose,
  mode = 'overlay',
  side = 'end',
  size = 'md',
  title,
  'aria-label': ariaLabel,
  header,
  headerActions,
  actions,
  children,
  expanded = false,
  onExpandedChange,
  resizable = false,
  width,
  defaultWidth,
  onWidthChange,
  minWidth = LEAST,
  maxWidth,
  initialFocus,
  closeLabel = 'Close',
  expandLabel = 'Expand',
  collapseLabel = 'Collapse',
  resizeLabel = 'Resize',
  className,
}: DrawerProps) {
  const base = useId();
  const panelId = `${base}panel`;
  const titleId = `${base}title`;

  // The element as state, not a ref: effects wait for it, since it is only
  // there while open.
  const [panel, setPanel] = useState<HTMLDivElement | null>(null);
  const [own, setOwn] = useState(defaultWidth);
  const [most, setMost] = useState(maxWidth ?? DRAWER_WIDTH.lg);
  const before = useRef<Element | null>(null);
  const drag = useRef<{ x: number; width: number } | null>(null);

  const layered = mode === 'overlay' || expanded;
  const current = width ?? own;
  const start = defaultWidth ?? DRAWER_WIDTH[size];

  // The top layer. Not showPopover, which throws on a popover already shown.
  useEffect(() => {
    if (panel && layered) panel.togglePopover(true);
  }, [panel, layered]);

  // The focus, in and back. What had it is read before the panel is there.
  useEffect(() => {
    if (open) before.current = document.activeElement;
  }, [open]);

  useEffect(() => {
    if (!panel) return;
    (initialFocus?.current ?? panel).focus();
    return () => {
      const back = before.current;
      // A task later, when the focus has settled. The Dialog that asked "leave
      // without saving?" closes in the same commit and hands the focus back to
      // the field it came from, which is gone with the panel; and the reader
      // who pressed another appointment has the focus there, where it stays.
      setTimeout(() => {
        const active = document.activeElement;
        // A button in a dialog that has just closed is still the active
        // element until the next frame, and is not rendered.
        const hidden = active instanceof HTMLElement && active.checkVisibility?.() === false;
        const lost = !active || active === document.body || hidden;
        if (lost && back instanceof HTMLElement && back.isConnected) back.focus();
      }, 0);
    };
    // Once per opening: a new `initialFocus` must not take the focus again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panel]);

  // What a resize may reach: what leaves the content its 320. Kept as state
  // for the handle's aria-valuemax, and read again at every resize, since the
  // room beside an inline panel is its parent's and changes with no event.
  useEffect(() => {
    if (!panel || !resizable) return;
    const measure = () => setMost(limit(panel, mode, minWidth, maxWidth));
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [panel, resizable, mode, minWidth, maxWidth]);

  if (!open) return null;

  const resize = (next: number) => {
    const ceiling = panel ? limit(panel, mode, minWidth, maxWidth) : most;
    if (ceiling !== most) setMost(ceiling);
    const clamped = Math.round(Math.max(minWidth, Math.min(ceiling, next)));
    if (clamped === current) return;
    setOwn(clamped);
    onWidthChange?.(clamped);
  };

  /** +1 when a move to the right widens the panel: its inner edge is its right one. */
  const towards = () => {
    const rtl = panel ? getComputedStyle(panel).direction === 'rtl' : false;
    return (side === 'start') !== rtl ? 1 : -1;
  };

  const measured = () => current ?? panel?.getBoundingClientRect().width ?? start;

  const onHandleKey = (event: KeyboardEvent) => {
    const from = measured();
    if (event.key === 'ArrowRight') resize(from + STEP * towards());
    else if (event.key === 'ArrowLeft') resize(from - STEP * towards());
    else if (event.key === 'Home') resize(minWidth);
    else if (event.key === 'End') resize(most);
    else return;
    event.preventDefault();
  };

  const onHandleDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    // Keeps the drag from selecting the page's text.
    event.preventDefault();
    event.currentTarget.focus();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    drag.current = { x: event.clientX, width: measured() };
  };

  const onHandleMove = (event: PointerEvent) => {
    if (drag.current) resize(drag.current.width + (event.clientX - drag.current.x) * towards());
  };

  const endDrag = () => {
    drag.current = null;
  };

  const classes = [
    styles.drawer,
    layered ? styles.layered : styles.flow,
    side === 'start' ? styles.start : styles.end,
    expanded && styles.expanded,
    styles[size],
    className,
  ];

  return (
    <div
      ref={setPanel}
      id={panelId}
      popover={layered ? 'manual' : undefined}
      role={layered ? 'dialog' : 'region'}
      aria-labelledby={title && !header ? titleId : undefined}
      aria-label={title && !header ? undefined : (ariaLabel ?? title)}
      tabIndex={-1}
      className={classes.filter(Boolean).join(' ')}
      style={current === undefined ? undefined : ({ '--drawer-width': `${current}px` } as CSSProperties)}
      onKeyDown={(event) => {
        if (event.key !== 'Escape' || event.defaultPrevented || hasOpenPopover(event.currentTarget)) return;
        event.preventDefault();
        onClose();
      }}
    >
      {/* No handle where there is nothing to give: a phone, where the panel is the screen. */}
      {resizable && !expanded && most > minWidth && (
        <div
          role="separator"
          tabIndex={0}
          aria-orientation="vertical"
          aria-label={resizeLabel}
          aria-controls={panelId}
          aria-valuenow={Math.min(most, Math.max(minWidth, Math.round(current ?? start)))}
          aria-valuemin={minWidth}
          aria-valuemax={most}
          className={styles.handle}
          onKeyDown={onHandleKey}
          onPointerDown={onHandleDown}
          onPointerMove={onHandleMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onDoubleClick={() => resize(start)}
        />
      )}

      {/* Not <header> and <footer>, as in the Dialog. */}
      <div className={styles.header}>
        {header ? (
          <div className={styles.lead}>{header}</div>
        ) : (
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
        )}
        <div className={styles.headerActions}>
          {headerActions}
          {onExpandedChange && (
            <Button
              variant="ghost"
              tone="neutral"
              size="sm"
              aria-label={expanded ? collapseLabel : expandLabel}
              onClick={() => onExpandedChange(!expanded)}
              iconStart={
                <svg {...ICON}>
                  {expanded ? (
                    <path d="M8 3v5H3M12 17v-5h5M8 8L3.5 3.5M12 12l4.5 4.5" {...STROKE} />
                  ) : (
                    <path d="M12 3h5v5M8 17H3v-5M17 3l-5.5 5.5M3 17l5.5-5.5" {...STROKE} />
                  )}
                </svg>
              }
            />
          )}
          <Button
            variant="ghost"
            tone="neutral"
            size="sm"
            aria-label={closeLabel}
            onClick={onClose}
            iconStart={
              <svg {...ICON}>
                <path d="M5 5l10 10M15 5L5 15" {...STROKE} />
              </svg>
            }
          />
        </div>
      </div>
      <div className={styles.body}>{children}</div>
      {actions && <div className={styles.footer}>{actions}</div>}
    </div>
  );
}
