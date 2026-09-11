import { forwardRef, useEffect, useId, useRef } from 'react';
import type { ChangeEvent, InputHTMLAttributes, ReactNode } from 'react';
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
  {
    indeterminate = false,
    description,
    children,
    className,
    'aria-describedby': describedBy,
    onChange,
    ...rest
  },
  forwardedRef,
) {
  const innerRef = useRef<HTMLInputElement>(null);
  const descriptionId = useId();

  // `indeterminate` is a DOM property with no HTML attribute, so React cannot
  // set it declaratively — it has to be written to the node. The browser
  // exposes the property as aria-checked="mixed" on its own (HTML-AAM); a
  // literal attribute would outrank that, and go on saying mixed after a
  // click had made the box checked.
  useEffect(() => {
    if (innerRef.current) innerRef.current.indeterminate = indeterminate;
  }, [indeterminate]);

  // Activation clears the property before React hears about it. The prop is
  // the caller's statement of the state, so it is written back here: a caller
  // that re-renders with a new value has the effect above, and one that does
  // not re-render at all is not left with a box that drifted from its prop.
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange?.(event);
    event.currentTarget.indeterminate = indeterminate;
  }

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
          onChange={handleChange}
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
