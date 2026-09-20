'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { FocusEvent, KeyboardEvent } from 'react';
import { serverSnapshot, snapshot, subscribe, toast } from './store';
import type { ToastRecord, ToastTone } from './store';
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

/**
 * Carbon's own vectors, the ones drawn in the design file's notifications
 * (checkmark--outline, error, warning, information, close), on their 32
 * grid. Inlined because the package does not depend on @carbon/icons-react
 * at runtime. Apache-2.0, © IBM.
 */
const ICONS: Record<Exclude<ToastTone, 'neutral'> | 'close', readonly string[]> = {
  success: [
    'M14 21.414 9 16.413 10.413 15 14 18.586 21.585 11 23 12.415 14 21.414z',
    'M16,2A14,14,0,1,0,30,16,14,14,0,0,0,16,2Zm0,26A12,12,0,1,1,28,16,12,12,0,0,1,16,28Z',
  ],
  danger: [
    'M2,16H2A14,14,0,1,0,16,2,14,14,0,0,0,2,16Zm23.15,7.75L8.25,6.85a12,12,0,0,1,16.9,16.9ZM8.24,25.16A12,12,0,0,1,6.84,8.27L23.73,25.16a12,12,0,0,1-15.49,0Z',
  ],
  warning: [
    'M16,2A14,14,0,1,0,30,16,14,14,0,0,0,16,2Zm0,26A12,12,0,1,1,28,16,12,12,0,0,1,16,28Z',
    'M15 8H17V19H15z',
    'M16,22a1.5,1.5,0,1,0,1.5,1.5A1.5,1.5,0,0,0,16,22Z',
  ],
  info: [
    'M17 22 17 14 13 14 13 16 15 16 15 22 12 22 12 24 20 24 20 22 17 22z',
    'M16,8a1.5,1.5,0,1,0,1.5,1.5A1.5,1.5,0,0,0,16,8Z',
    'M16,30A14,14,0,1,1,30,16,14,14,0,0,1,16,30ZM16,4A12,12,0,1,0,28,16,12,12,0,0,0,16,4Z',
  ],
  close: [
    'M17.4141 16 24 9.4141 22.5859 8 16 14.5859 9.4143 8 8 9.4141 14.5859 16 8 22.5859 9.4143 24 16 17.4141 22.5859 24 24 22.5859 17.4141 16z',
  ],
};

function Glyph({ name }: { name: keyof typeof ICONS }) {
  return (
    <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true" focusable="false">
      {ICONS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

// The tone is read from the icon's shape alone, so a screen reader is told it in words.
const SPOKEN: Record<ToastTone, string | undefined> = {
  neutral: undefined,
  success: 'Success',
  danger: 'Error',
  warning: 'Warning',
  info: 'Information',
};

const subscribeHidden = (listener: () => void) => {
  document.addEventListener('visibilitychange', listener);
  return () => document.removeEventListener('visibilitychange', listener);
};

function Toast({ item, held, fromTop, onLeave }: { item: ToastRecord; held: boolean; fromTop: boolean; onLeave: () => void }) {
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
          <Glyph name={item.tone} />
        </span>
      )}
      <span className={styles.message}>
        {SPOKEN[item.tone] && <span className={styles.spoken}>{SPOKEN[item.tone]}: </span>}
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
      <button type="button" className={styles.close} aria-label="Dismiss" onClick={leave}>
        <Glyph name="close" />
      </button>
    </div>
  );
}

export type ToasterProps = {
  /** The corner, or the middle of the top or bottom edge. */
  placement?: ToasterPlacement;
  /** The region's name, a landmark a screen reader can jump to. */
  label?: string;
  className?: string;
};

/**
 * Where toasts show. Rendered once, near the root. The region is always in
 * the document, empty, so that a screen reader is already listening to it
 * when the first toast is put there.
 */
export function Toaster({ placement = 'bottom-end', label = 'Notifications', className }: ToasterProps) {
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
            onLeave={giveFocusBack}
          />
        ))}
      </div>
    </section>
  );
}
