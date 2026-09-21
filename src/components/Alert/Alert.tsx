import type { ReactNode } from 'react';
import type { TintTone } from '../vocabulary';
import { SPOKEN_TONE, StatusGlyph } from '../statusGlyphs';
import styles from './Alert.module.css';
import hidden from '../visuallyHidden.module.css';

// Held to the tones the theme can tint. The soft edge is a third token per
// tone, which the stylesheet's own test asks for by name.
export const alertTones = ['info', 'success', 'warning', 'danger'] as const satisfies readonly TintTone[];

/**
 * The alert's own width under which the action drops below the message. The
 * stylesheet's container query says the same number, and a test holds them
 * together.
 */
export const ALERT_NARROW = 400;
export type AlertTone = (typeof alertTones)[number];

export type AlertAction = { label: string; onClick: () => void };

export type AlertProps = {
  tone?: AlertTone;
  /** The message. A `strong` inside it is Semibold, as drawn. */
  children: ReactNode;
  /** Not drawn: a line that names the alert, above the one that explains it. */
  title?: string;
  /** One, at most. */
  action?: AlertAction;
  /**
   * Shows the close. The alert does not hide itself: the caller removes it,
   * as with the Dialog.
   */
  onClose?: () => void;
  closeLabel?: string;
  /**
   * For an alert inserted in answer to something: `role="alert"` for `danger`
   * and `warning`, `role="status"` for the others. Left out, it is not a live
   * region, because an alert that is in the page when it loads must not be
   * read out over the page.
   */
  announce?: boolean;
  className?: string;
};

export function Alert({
  tone = 'info',
  children,
  title,
  action,
  onClose,
  closeLabel = 'Dismiss',
  announce = false,
  className,
}: AlertProps) {
  const role = !announce ? undefined : tone === 'danger' || tone === 'warning' ? 'alert' : 'status';

  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')}>
      <div role={role} className={`${styles.alert} ${styles[tone]}`}>
        <span className={styles.icon}>
          <StatusGlyph name={tone} />
        </span>
        <div className={styles.content}>
          {/* The tone is a colour and a shape to the eye, so it is said in words. */}
          <span className={hidden.hidden}>{SPOKEN_TONE[tone]}: </span>
          {title && <div className={styles.title}>{title}</div>}
          <div className={styles.message}>{children}</div>
        </div>
        {action && (
          <button type="button" className={styles.action} onClick={action.onClick}>
            {action.label}
          </button>
        )}
        {onClose && (
          <button type="button" className={styles.close} aria-label={closeLabel} onClick={onClose}>
            <StatusGlyph name="close" />
          </button>
        )}
      </div>
    </div>
  );
}
