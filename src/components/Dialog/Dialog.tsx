'use client';

import { useEffect, useId, useRef, type ReactNode, type RefObject } from 'react';
import styles from './Dialog.module.css';

export type DialogSize = 'xs' | 'sm' | 'md' | 'lg';

export type DialogProps = {
  open: boolean;
  /**
   * Esc, the close button, and any close the platform performs on its own call
   * it. The dialog never closes itself: the caller sets `open` to false.
   */
  onClose: () => void;
  /** The dialog's accessible name, shown in the header. */
  title: string;
  /** 320, 480, 640 or 960px wide. */
  size?: DialogSize;
  /** Shows the back button. For flows of more than one step. */
  onBack?: () => void;
  /** The footer's buttons, in reading order. No footer without them. */
  actions?: ReactNode;
  /**
   * Focused once the dialog is open — the first field of a form. Without it
   * the platform focuses the first focusable element, the back or close
   * button. Not `autoFocus`: React's client renderer does not write the
   * attribute `showModal()` looks for.
   */
  initialFocus?: RefObject<HTMLElement | null>;
  children: ReactNode;
  className?: string;
};

/**
 * A modal dialog on the native element. The platform supplies the top layer,
 * the inert page behind, Esc and focus return; the same trade Select,
 * DropdownMenu and DatePicker make.
 *
 * A click on the backdrop does nothing, on purpose: a stray click beside a
 * form must not throw away what was typed.
 */
export function Dialog({
  open,
  onClose,
  title,
  size = 'md',
  onBack,
  actions,
  initialFocus,
  children,
  className,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      initialFocus?.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, initialFocus]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className={[styles.dialog, styles[size], className].filter(Boolean).join(' ')}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      // Also reached after the caller closed it, when `open` is already false:
      // only a close the caller did not ask for is reported.
      onClose={() => {
        if (open) onClose();
      }}
    >
      {/* Not <header> and <footer>: outside sectioning content they are the
          page's banner and contentinfo landmarks. */}
      <div className={styles.header}>
        {onBack && (
          <button
            type="button"
            className={`${styles.iconButton} ${styles.back}`}
            aria-label="Back"
            onClick={onBack}
          >
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M15 10H5M9.5 5.5L5 10l4.5 4.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        <button
          type="button"
          className={`${styles.iconButton} ${styles.close}`}
          aria-label="Close"
          onClick={onClose}
        >
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <div className={styles.body}>{children}</div>
      {actions && (
        <div className={styles.footer}>
          <div className={styles.actions}>{actions}</div>
        </div>
      )}
    </dialog>
  );
}
