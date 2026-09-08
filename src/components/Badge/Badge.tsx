import type { HTMLAttributes, ReactNode } from 'react';
import styles from './Badge.module.css';

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info';
export type BadgeSize = 'sm' | 'md';

export type BadgeProps = {
  tone?: BadgeTone;
  size?: BadgeSize;
  /** A small filled circle before the label, in the tone's own colour. */
  dot?: boolean;
  icon?: ReactNode;
  children: ReactNode;
} & Omit<HTMLAttributes<HTMLSpanElement>, 'children'>;

/**
 * Tones are named for meaning rather than hue. A badge that takes a colour
 * makes every caller decide what green means, and the answers drift.
 *
 * A badge is not interactive and carries no role: it is text with a background.
 * If the colour is the only thing saying what the state is, the label has to
 * say it too — which is why there is no icon-only badge here.
 */
export function Badge({
  tone = 'neutral',
  size = 'md',
  dot = false,
  icon,
  children,
  className,
  ...rest
}: BadgeProps) {
  const classes = [
    styles.badge,
    styles[size],
    styles[tone],
    (icon || dot) && styles.withIcon,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span {...rest} className={classes}>
      {dot && <span className={styles.dot} aria-hidden="true" />}
      {icon && !dot && (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      )}
      <span className={styles.label}>{children}</span>
    </span>
  );
}
