'use client';

import { forwardRef } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import { useField } from '../Field/FieldContext';
import control from '../control.module.css';
import styles from './Textarea.module.css';

export type TextareaProps = {
  /** Marks the field as failing validation. Sets `aria-invalid` for you. */
  invalid?: boolean;
} & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'>;

/**
 * The border sits on the textarea itself rather than a wrapper — there are no
 * icons to place inside it, and a wrapper would only get in the way of the
 * browser's native resize handle.
 *
 * One size, because the component is drawn with one. It starts at a fixed
 * height rather than a row count, so a field is the same size before anyone
 * types in it regardless of the font that ends up loading.
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { invalid, disabled, readOnly, className, ...rest },
  ref,
) {
  const field = useField();
  const isInvalid = invalid ?? field?.invalid ?? false;
  const id = rest.id ?? field?.controlId;
  const describedBy = rest['aria-describedby'] ?? field?.describedBy;
  const required = rest.required ?? field?.required;

  const classes = [
    control.control,
    control.field,
    styles.textarea,
    isInvalid && control.invalid,
    disabled && control.disabled,
    readOnly && control.readOnly,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <textarea
      {...rest}
      ref={ref}
      id={id}
      className={classes}
      disabled={disabled}
      readOnly={readOnly}
      required={required}
      aria-invalid={isInvalid || undefined}
      aria-describedby={describedBy}
    />
  );
});
