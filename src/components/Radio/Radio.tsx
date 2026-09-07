import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import styles from '../choice.module.css';

export type RadioProps = {
  description?: ReactNode;
  children?: ReactNode;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size' | 'children'>;

/**
 * A radio on its own means nothing — its state only exists relative to the
 * other options sharing its `name`. Group them in a fieldset with a legend so
 * the question is announced along with the answers.
 *
 * As with Checkbox, the description sits outside the label so it is read as a
 * description rather than swallowed into the control's name.
 */
export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  { description, children, className, 'aria-describedby': describedBy, ...rest },
  ref,
) {
  const descriptionId = useId();
  const described = [describedBy, description ? descriptionId : null].filter(Boolean).join(' ');

  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')}>
      <label className={styles.main}>
        <input
          {...rest}
          type="radio"
          ref={ref}
          className={`${styles.control} ${styles.radio}`}
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
