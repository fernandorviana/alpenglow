'use client';

import { useId } from 'react';
import type { ReactNode } from 'react';
import { FieldContext } from './FieldContext';
import styles from './Field.module.css';

export type FieldProps = {
  label: ReactNode;
  /** Help text, shown under the label and announced with the control. */
  description?: ReactNode;
  /** Anything truthy marks the field invalid and is shown as the message. */
  error?: ReactNode;
  required?: boolean;
  children: ReactNode;
  className?: string;
};

/**
 * Wraps a text control with its label, help text and error, and wires the
 * relationships between them.
 *
 * Written by hand, this is four things to get right and three of them fail
 * silently: a mismatched id leaves the label unattached, a missing
 * aria-describedby leaves the error unannounced, and a forgotten invalid flag
 * leaves the field red to sighted users and fine to everyone else. Field makes
 * those unwriteable rather than merely documented.
 *
 * Not for Checkbox and Radio. Their label belongs beside the control rather
 * than above it, and they already carry it themselves.
 */
export function Field({
  label,
  description,
  error,
  required = false,
  children,
  className,
}: FieldProps) {
  const base = useId();
  const controlId = `${base}-control`;
  const descriptionId = `${base}-description`;
  const errorId = `${base}-error`;

  const invalid = Boolean(error);

  // Both are announced when both exist: the help text still applies when the
  // value is wrong, and often explains why.
  const describedBy =
    [description ? descriptionId : null, invalid ? errorId : null].filter(Boolean).join(' ') ||
    undefined;

  return (
    <FieldContext.Provider value={{ controlId, describedBy, invalid, required }}>
      <div className={[styles.field, className].filter(Boolean).join(' ')}>
        <label className={styles.label} htmlFor={controlId}>
          {label}
          {required && (
            <span className={styles.required} aria-hidden="true">
              *
            </span>
          )}
        </label>

        {description && (
          <span className={styles.description} id={descriptionId}>
            {description}
          </span>
        )}

        {children}

        {invalid && (
          <span className={styles.error} id={errorId}>
            {error}
          </span>
        )}
      </div>
    </FieldContext.Provider>
  );
}
