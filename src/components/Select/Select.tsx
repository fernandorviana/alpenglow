'use client';

import { forwardRef, useState } from 'react';
import type { ChangeEvent, ReactNode, SelectHTMLAttributes } from 'react';
import { useField } from '../Field/FieldContext';
import type { ControlSize } from '../vocabulary';
import control from '../control.module.css';
import styles from './Select.module.css';

/** The chevron as drawn: a 12.5 x 7.125 shape inside a 20px icon. */
function Chevron() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path
        transform="translate(3.75 6.875)"
        d="M 6.25 7.125 L 0 0.875 L 0.875 0 L 6.25 5.375 L 11.625 0 L 12.5 0.875 L 6.25 7.125 Z"
      />
    </svg>
  );
}

export type SelectProps = {
  size?: ControlSize;
  invalid?: boolean;
  /** Text shown while nothing is chosen. Renders a disabled empty option. */
  placeholder?: string;
  iconStart?: ReactNode;
  children?: ReactNode;
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size' | 'children' | 'placeholder'>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { size = 'md', invalid, placeholder, iconStart, children, disabled, className, onChange, ...rest },
  ref,
) {
  const field = useField();
  const isInvalid = invalid ?? field?.invalid ?? false;
  const id = rest.id ?? field?.controlId;
  const describedBy = rest['aria-describedby'] ?? field?.describedBy;
  const required = rest.required ?? field?.required;

  // Tracked so the placeholder can be greyed. Reads from props when controlled,
  // from its own state when not, so both styles of use behave the same.
  const [internal, setInternal] = useState(rest.defaultValue ?? '');
  const value = rest.value !== undefined ? rest.value : internal;
  const showingPlaceholder = placeholder !== undefined && (value === '' || value === undefined);

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    if (rest.value === undefined) setInternal(event.target.value);
    onChange?.(event);
  }

  const box = [
    control.control,
    control[size],
    isInvalid && control.invalid,
    disabled && control.disabled,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={box}>
      {iconStart && (
        <span className={control.icon} aria-hidden="true">
          {iconStart}
        </span>
      )}
      <select
        {...rest}
        ref={ref}
        id={id}
        className={[control.field, styles.select, showingPlaceholder && styles.placeholder]
          .filter(Boolean)
          .join(' ')}
        disabled={disabled}
        required={required}
        onChange={handleChange}
        aria-invalid={isInvalid || undefined}
        aria-describedby={describedBy}
      >
        {placeholder !== undefined && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {children}
      </select>
      <span className={styles.chevron} aria-hidden="true">
        <Chevron />
      </span>
    </div>
  );
});
