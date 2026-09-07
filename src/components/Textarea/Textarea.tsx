import { forwardRef } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import styles from '../control.module.css';

export type TextareaSize = 'sm' | 'md' | 'lg';

export type TextareaProps = {
  size?: TextareaSize;
  /** Marks the field as failing validation. Sets `aria-invalid` for you. */
  invalid?: boolean;
} & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'>;

/**
 * The border sits on the textarea itself rather than a wrapper — there are no
 * icons to place inside it, and a wrapper would only get in the way of the
 * browser's native resize handle.
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { size = 'md', invalid = false, rows = 4, disabled, readOnly, className, style, ...rest },
  ref,
) {
  const classes = [
    styles.control,
    styles.field,
    styles[size],
    invalid && styles.invalid,
    disabled && styles.disabled,
    readOnly && styles.readOnly,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <textarea
      {...rest}
      ref={ref}
      rows={rows}
      className={classes}
      disabled={disabled}
      readOnly={readOnly}
      aria-invalid={invalid || undefined}
      style={{ paddingBlock: 'var(--ap-spacing-100)', resize: 'vertical', ...style }}
    />
  );
});
