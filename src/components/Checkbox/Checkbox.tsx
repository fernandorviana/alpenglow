import { forwardRef, useEffect, useId, useRef } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import styles from '../choice.module.css';

export type CheckboxProps = {
  /**
   * Partially selected — a parent whose children are a mix. Rendered as a dash
   * and reported to assistive technology as "mixed".
   */
  indeterminate?: boolean;
  /** Secondary text under the label. */
  description?: ReactNode;
  children?: ReactNode;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size' | 'children'>;

/**
 * The input is wrapped in its label, so a checkbox cannot ship unlabelled by
 * forgetting to wire an id, and the text is part of the click target.
 *
 * The description is deliberately outside the label. Inside it, assistive
 * technology reads it as part of the control's name rather than as a
 * description, and the two run together into one long name.
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { indeterminate = false, description, children, className, 'aria-describedby': describedBy, ...rest },
  forwardedRef,
) {
  const innerRef = useRef<HTMLInputElement>(null);
  const descriptionId = useId();

  // `indeterminate` is a DOM property with no HTML attribute, so React cannot
  // set it declaratively — it has to be written to the node.
  useEffect(() => {
    if (innerRef.current) innerRef.current.indeterminate = indeterminate;
  }, [indeterminate]);

  const described = [describedBy, description ? descriptionId : null].filter(Boolean).join(' ');

  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')}>
      <label className={styles.main}>
        <input
          {...rest}
          type="checkbox"
          ref={(node) => {
            innerRef.current = node;
            if (typeof forwardedRef === 'function') forwardedRef(node);
            else if (forwardedRef) forwardedRef.current = node;
          }}
          className={`${styles.control} ${styles.checkbox}`}
          aria-checked={indeterminate ? 'mixed' : undefined}
          aria-describedby={described || undefined}
        />
        {children && <span className={styles.label}>{children}</span>}
      </label>
      {description && (
        <span className={styles.description} id={descriptionId}>
          {description}
        </span>
      )}
    </div>
  );
});
