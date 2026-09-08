'use client';

import { forwardRef } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import { useField } from '../Field/FieldContext';
import styles from '../control.module.css';

/** Shares Button's height scale: 32, 40, 48. */
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
  { size = 'md', invalid, rows = 4, disabled, readOnly, className, style, ...rest },
  ref,
) {
  const field = useField();
  const isInvalid = invalid ?? field?.invalid ?? false;
  const id = rest.id ?? field?.controlId;
  const describedBy = rest['aria-describedby'] ?? field?.describedBy;
  const required = rest.required ?? field?.required;
  const classes = [
    styles.control,
    styles.field,
    styles[size],
    isInvalid && styles.invalid,
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
      id={id}
      className={classes}
      disabled={disabled}
      readOnly={readOnly}
      required={required}
      aria-invalid={isInvalid || undefined}
      aria-describedby={describedBy}
      style={{ resize: 'vertical', ...style }}
    />
  );
});
