'use client';

import { useState } from 'react';
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

/** The first code point, not the first UTF-16 unit: an emoji or a CJK Extension B ideograph is one character. */
const firstCharacter = (word: string) => Array.from(word)[0] ?? '';

/** First letter of the first and last words. Two letters, never three. */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  const first = firstCharacter(words[0]!);
  const last = words.length > 1 ? firstCharacter(words[words.length - 1]!) : '';
  return (first + last).toUpperCase();
}

/**
 * Falls back to initials when there is no image, or when the image fails to
 * load — an expired signed URL must not leave the browser's broken-image glyph
 * in the circle — and to nothing legible when there is no name either: an
 * avatar with no name is a bug upstream, not something to paper over with a
 * silhouette.
 *
 * The status dot carries a real label. Drawn, it was colour and nothing else,
 * so "available" and "busy" were the same to anyone who cannot separate green
 * from red, and to every screen reader.
 */
export function Avatar({ name, src, size = 'md', status, className, ...rest }: AvatarProps) {
  const classes = [styles.avatar, styles[size], className].filter(Boolean).join(' ');

  // Which src failed, rather than a bare flag: a new src gets a fresh try
  // without an effect to reset the flag, and a re-render with the same
  // failed src does not retry it.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const image = src && src !== failedSrc ? src : undefined;

  return (
    <span {...rest} className={classes}>
      {image ? (
        <img className={styles.image} src={image} alt={name} onError={() => setFailedSrc(image)} />
      ) : (
        <span aria-hidden="true">{initials(name)}</span>
      )}
      {!image && <span className="ap-sr-only">{name}</span>}
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
