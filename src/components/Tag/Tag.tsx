import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import styles from './Tag.module.css';

export const tagSizes = ['sm', 'md'] as const;
export type TagSize = (typeof tagSizes)[number];

export type TagProps = {
  /** The words. */
  children: ReactNode;
  /** Before the words: an Avatar, an icon. */
  start?: ReactNode;
  /** 32, as drawn, or 24, which is what a 40 field has room for. */
  size?: TagSize;
  /** Shows the button that takes it away. The caller removes it, as with the Alert. */
  onRemove?: () => void;
  /** The button's name. Left out, "Remove" and the words, when the words are a string. */
  removeLabel?: string;
  /**
   * For a field that holds tags: `tabIndex={-1}` where the keyboard has another
   * way to take a tag away, `onMouseDown` to keep the focus where it is.
   */
  removeProps?: Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'aria-label' | 'type' | 'className'>;
  disabled?: boolean;
} & Omit<HTMLAttributes<HTMLSpanElement>, 'children'>;

/** Carbon's close, on its 32 grid. Apache-2.0, © IBM. */
const CLOSE =
  'M17.4141 16 24 9.4141 22.5859 8 16 14.5859 9.4143 8 8 9.4141 14.5859 16 8 22.5859 9.4143 24 16 17.4141 22.5859 24 24 22.5859 17.4141 16z';

/**
 * Something the reader put there and can take away: a person on a team, a
 * filter on a list, a label on a record. A capsule, where the Badge is a
 * rectangle — the Badge says a state and is not touched; a Tag is an object.
 *
 * Neutral only, decided 2026-09-21: the theme's tones are meanings (success,
 * danger) and what is painted on a tag is a category, for which the theme has
 * no colours yet. Given green and red, tags would spend them.
 */
export function Tag({
  children,
  start,
  size = 'md',
  onRemove,
  removeLabel,
  removeProps,
  disabled = false,
  className,
  ...rest
}: TagProps) {
  const name = removeLabel ?? (typeof children === 'string' ? `Remove ${children}` : 'Remove');

  return (
    <span
      {...rest}
      className={[
        styles.tag,
        styles[size],
        start ? styles.withStart : undefined,
        disabled && styles.disabled,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {start && (
        <span className={styles.start} aria-hidden="true">
          {start}
        </span>
      )}
      <span className={styles.label}>{children}</span>
      {onRemove && !disabled && (
        <button
          {...removeProps}
          type="button"
          aria-label={name}
          className={[styles.remove, size === 'sm' && styles.removeSm].filter(Boolean).join(' ')}
          onClick={onRemove}
        >
          <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true" focusable="false">
            <path d={CLOSE} />
          </svg>
        </button>
      )}
    </span>
  );
}
