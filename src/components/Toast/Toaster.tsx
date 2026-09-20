'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { FocusEvent, KeyboardEvent } from 'react';
import { serverSnapshot, snapshot, subscribe, toast } from './store';
import type { ToastRecord } from './store';
import { SPOKEN_TONE, StatusGlyph } from '../statusGlyphs';
import styles from './Toast.module.css';

export const toasterPlacements = [
  'top-start',
  'top-center',
  'top-end',
  'bottom-start',
  'bottom-center',
  'bottom-end',
] as const;
export type ToasterPlacement = (typeof toasterPlacements)[number];

/** Three at once. The rest wait their turn rather than pile over the page. */
export const TOAST_LIMIT = 3;

const subscribeHidden = (listener: () => void) => {
  document.addEventListener('visibilitychange', listener);
  return () => document.removeEventListener('visibilitychange', listener);
};

function Toast({
  item,
  held,
  fromTop,
  closeLabel,
  onLeave,
}: {
  item: ToastRecord;
  held: boolean;
  fromTop: boolean;
  closeLabel: string;
  onLeave: () => void;
}) {
  const { id, duration, revision } = item;

  // Its own clock, so a toast arriving does not restart the ones showing.
  // Held, it stops; let go, it starts again from the whole duration, which
  // errs on the side of the reader.
  useEffect(() => {
    if (held || !Number.isFinite(duration)) return;
    const timer = setTimeout(() => toast.dismiss(id), duration);
    return () => clearTimeout(timer);
  }, [held, id, duration, revision]);

  const leave = () => {
    onLeave();
    toast.dismiss(id);
  };

  return (
    <div
      // Errors interrupt; the rest wait for the reader to finish, through the list's aria-live.
      role={item.tone === 'danger' ? 'alert' : undefined}
      tabIndex={-1}
      data-toast={id}
      className={`${styles.toast} ${fromTop ? styles.fromTop : styles.fromBottom}`}
    >
      {item.tone !== 'neutral' && (
        <span className={styles.icon}>
          <StatusGlyph name={item.tone} />
        </span>
      )}
      <span className={styles.message}>
        {item.tone !== 'neutral' && <span className={styles.spoken}>{SPOKEN_TONE[item.tone]}: </span>}
        {item.message}
      </span>
      {item.action && (
        <button
          type="button"
          className={styles.action}
          onClick={() => {
            // Gone first: a handler that throws must not leave it showing.
            const { onClick } = item.action!;
            leave();
            onClick();
          }}
        >
          {item.action.label}
        </button>
      )}
      <button type="button" className={styles.close} aria-label={closeLabel} onClick={leave}>
        <StatusGlyph name="close" />
      </button>
    </div>
  );
}

export type ToasterProps = {
  /** The corner, or the middle of the top or bottom edge. */
  placement?: ToasterPlacement;
  /** The region's name, a landmark a screen reader can jump to. */
  label?: string;
  /** The name of every toast's close. */
  closeLabel?: string;
  className?: string;
};

/**
 * Where toasts show. Rendered once, near the root. The region is always in
 * the document, empty, so that a screen reader is already listening to it
 * when the first toast is put there.
 */
export function Toaster({
  placement = 'bottom-end',
  label = 'Notifications',
  closeLabel = 'Dismiss',
  className,
}: ToasterProps) {
  const toasts = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const hidden = useSyncExternalStore(
    subscribeHidden,
    () => document.hidden,
    () => false,
  );
  const visible = toasts.slice(0, TOAST_LIMIT);

  const region = useRef<HTMLElement>(null);
  const shown = useRef(false);
  // Where focus was before it came into the region, to be given back.
  const returnTo = useRef<HTMLElement | null>(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  const open = visible.length > 0;
  // A region hidden under the pointer never hears it leave, and the next
  // toast would arrive already held. Adjusted while rendering, not in an effect.
  if (!open && (hovered || focused)) {
    setHovered(false);
    setFocused(false);
  }
  // The top layer: above the page with no z-index. It is open from the
  // start and stays open while empty, because a closed popover is
  // display: none and a live region that is not rendered is not listening
  // when the first toast arrives. When toasts begin again it is closed and
  // opened in one task, which moves it above whatever has entered the top
  // layer since: a menu, or a Dialog and its backdrop.
  //
  // Every arrival raises it, not only the first: an error toast may have
  // been up since before the Dialog that now covers it. Not while focus is
  // inside, which closing the popover would throw out. Nothing is painted
  // between the two calls, so the toasts showing do not fade in again.
  const newest = visible.at(-1)?.id;
  useEffect(() => {
    const element = region.current;
    if (!element) return;
    if (shown.current) {
      if (!newest || element.contains(document.activeElement)) return;
      element.hidePopover();
    }
    element.showPopover();
    shown.current = true;
  }, [newest]);

  // F6, the key that moves between panes, brings focus to the newest toast.
  // Without it a keyboard user would have ten seconds to Tab across the page.
  // Pressed again from inside, it is the browser's: an error toast stays for
  // as long as it likes, and must not keep the key for as long.
  useEffect(() => {
    if (!newest) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'F6' || event.altKey || event.ctrlKey || event.metaKey) return;
      if (region.current?.contains(document.activeElement)) return;
      const target = region.current?.querySelector<HTMLElement>(`[data-toast="${CSS.escape(newest)}"]`);
      if (!target) return;
      event.preventDefault();
      target.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [newest]);

  const giveFocusBack = () => {
    const target = returnTo.current;
    returnTo.current = null;
    if (!region.current?.contains(document.activeElement)) return;
    if (target?.isConnected) target.focus();
    // Nowhere to send it: the toast is about to be removed with the focus in
    // it, and a removed element fires no blur. Let go by hand, or the toasts
    // that remain stay held.
    else setFocused(false);
  };

  const onFocus = (event: FocusEvent) => {
    const from = event.relatedTarget as HTMLElement | null;
    if (!region.current?.contains(from)) returnTo.current = from;
    setFocused(true);
  };

  const onBlur = (event: FocusEvent) => {
    if (!region.current?.contains(event.relatedTarget as Node | null)) setFocused(false);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') return;
    const id = (event.target as Element).closest<HTMLElement>('[data-toast]')?.dataset.toast;
    if (!id) return;
    // This Esc was for the toast: it must not go on to close a Dialog behind it.
    event.preventDefault();
    giveFocusBack();
    toast.dismiss(id);
  };

  return (
    <section
      ref={region}
      role="region"
      aria-label={label}
      popover="manual"
      className={[styles.region, styles[placement], className].filter(Boolean).join(' ')}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={onFocus}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
    >
      <div className={`${styles.list} ${styles[placement]}`} aria-live="polite">
        {visible.map((item) => (
          <Toast
            key={item.id}
            item={item}
            held={hovered || focused || hidden}
            fromTop={placement.startsWith('top')}
            closeLabel={closeLabel}
            onLeave={giveFocusBack}
          />
        ))}
      </div>
    </section>
  );
}
