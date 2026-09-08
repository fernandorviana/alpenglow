import type { HTMLAttributes, ReactNode } from 'react';
import styles from './Avatar.module.css';

export type AvatarSize = 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarStatus = 'available' | 'busy' | 'inMeeting' | 'idle' | 'away';

const STATUS_LABEL: Record<AvatarStatus, string> = {
  available: 'Available',
  busy: 'Busy',
  inMeeting: 'In an appointment',
  idle: 'Idle',
  away: 'Away',
};

export type AvatarProps = {
  /** The person, for the image's alt text and for deriving initials. */
  name: string;
  src?: string;
  size?: AvatarSize;
  status?: AvatarStatus;
} & Omit<HTMLAttributes<HTMLSpanElement>, 'children'>;

/** First letter of the first and last words. Two letters, never three. */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  const first = words[0]![0] ?? '';
  const last = words.length > 1 ? (words[words.length - 1]![0] ?? '') : '';
  return (first + last).toUpperCase();
}

/**
 * Falls back to initials when there is no image, and to nothing legible when
 * there is no name either — an avatar with no name is a bug upstream, not
 * something to paper over with a silhouette.
 *
 * The status dot carries a real label. Drawn, it was colour and nothing else,
 * so "available" and "busy" were the same to anyone who cannot separate green
 * from red, and to every screen reader.
 */
export function Avatar({ name, src, size = 'md', status, className, ...rest }: AvatarProps) {
  const classes = [styles.avatar, styles[size], className].filter(Boolean).join(' ');

  return (
    <span {...rest} className={classes}>
      {src ? <img className={styles.image} src={src} alt={name} /> : <span aria-hidden="true">{initials(name)}</span>}
      {!src && <span className="ap-sr-only">{name}</span>}
      {status && (
        <span className={`${styles.status} ${styles[status]}`} role="img" aria-label={STATUS_LABEL[status]} />
      )}
    </span>
  );
}

export type AvatarGroupProps = {
  /** Shown after the avatars as a count, e.g. 3 more. */
  overflow?: number;
  size?: AvatarSize;
  children: ReactNode;
} & Omit<HTMLAttributes<HTMLDivElement>, 'children'>;

export function AvatarGroup({ overflow, size = 'md', children, className, ...rest }: AvatarGroupProps) {
  return (
    <div {...rest} className={[styles.group, className].filter(Boolean).join(' ')}>
      {children}
      {overflow != null && overflow > 0 && (
        <span className={`${styles.avatar} ${styles[size]} ${styles.count}`}>
          <span aria-hidden="true">+{overflow}</span>
          <span className="ap-sr-only">and {overflow} more</span>
        </span>
      )}
    </div>
  );
}
