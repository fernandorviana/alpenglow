import { forwardRef } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import styles from '../control.module.css';

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
  { size = 'md', invalid = false, iconStart, iconEnd, disabled, readOnly, className, ...rest },
  ref,
) {
  const wrapper = [
    styles.control,
    styles[size],
    invalid && styles.invalid,
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
        className={styles.field}
        disabled={disabled}
        readOnly={readOnly}
        aria-invalid={invalid || undefined}
      />
      {iconEnd && (
        <span className={styles.icon} aria-hidden="true">
          {iconEnd}
        </span>
      )}
    </div>
  );
});
