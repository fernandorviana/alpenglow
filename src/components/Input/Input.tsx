'use client';

import { forwardRef } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { useField } from '../Field/FieldContext';
import styles from '../control.module.css';

/** Shares Button's height scale: 32, 40, 48. */
export type InputSize = 'sm' | 'md' | 'lg';

export type InputProps = {
  /** Renamed from the HTML `size` attribute, which sets a character count. */
  size?: InputSize;
  /** Marks the field as failing validation. Sets `aria-invalid` for you. */
  invalid?: boolean;
  iconStart?: ReactNode;
  iconEnd?: ReactNode;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { size = 'md', invalid, iconStart, iconEnd, disabled, readOnly, className, ...rest },
  ref,
) {
  // A surrounding Field supplies the id and the wiring. Explicit props still
  // win: the caller is being more specific than the wrapper.
  const field = useField();
  const isInvalid = invalid ?? field?.invalid ?? false;
  const id = rest.id ?? field?.controlId;
  const describedBy = rest['aria-describedby'] ?? field?.describedBy;
  const required = rest.required ?? field?.required;
  const wrapper = [
    styles.control,
    styles[size],
    isInvalid && styles.invalid,
    disabled && styles.disabled,
    readOnly && styles.readOnly,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wrapper}>
      {iconStart && (
        <span className={styles.icon} aria-hidden="true">
          {iconStart}
        </span>
      )}
      <input
        {...rest}
        ref={ref}
        id={id}
        className={styles.field}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        aria-invalid={isInvalid || undefined}
        aria-describedby={describedBy}
      />
      {iconEnd && (
        <span className={styles.icon} aria-hidden="true">
          {iconEnd}
        </span>
      )}
    </div>
  );
});
