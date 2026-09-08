import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import choice from '../choice.module.css';
import styles from './Switch.module.css';

export type SwitchProps = {
  description?: ReactNode;
  children?: ReactNode;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size' | 'children'>;

/**
 * A checkbox underneath, with `role="switch"`.
 *
 * The role is the whole difference: a screen reader says "on" and "off" rather
 * than "checked" and "not checked", which is what a switch means. Everything
 * else — space to toggle, form participation, the label — comes from the input
 * being real.
 *
 * A switch takes effect immediately. If the change only applies after a Save,
 * it is a checkbox, whatever it looks like.
 */
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  { description, children, className, 'aria-describedby': describedBy, ...rest },
  ref,
) {
  const descriptionId = useId();
  const described = [describedBy, description ? descriptionId : null].filter(Boolean).join(' ');

  return (
    <div className={[choice.root, className].filter(Boolean).join(' ')}>
      <label className={choice.main}>
        <input
          {...rest}
          type="checkbox"
          role="switch"
          ref={ref}
          className={styles.track}
          aria-describedby={described || undefined}
        />
        {children && <span className={choice.label}>{children}</span>}
      </label>
      {description && (
        <span className={`${choice.description} ${styles.description}`} id={descriptionId}>
          {description}
        </span>
      )}
    </div>
  );
});
