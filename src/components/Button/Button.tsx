import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';

export type ButtonSize = 'sm' | 'md' | 'lg';

type BaseProps = {
  size?: ButtonSize;
  /** Renders a spinner, hides the label without changing the button's width, and blocks activation. */
  loading?: boolean;
  iconStart?: ReactNode;
  iconEnd?: ReactNode;
  fullWidth?: boolean;
  children?: ReactNode;
};

/**
 * `tertiary` is solid-only on purpose.
 *
 * It resolves to brand-2, whose usable steps fail contrast as a foreground on
 * light surfaces — brand-2/500 is 1.45:1 on white. There is no compliant text
 * or border colour for it, so outline and ghost do not offer the tone rather
 * than offering one that cannot pass.
 */
type VariantProps =
  | { variant?: 'solid'; tone?: 'accent' | 'neutral' | 'tertiary' | 'danger' }
  | { variant: 'outline' | 'ghost'; tone?: 'accent' | 'neutral' | 'danger' };

export type ButtonProps = BaseProps &
  VariantProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color'>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'solid',
    tone = 'accent',
    size = 'md',
    loading = false,
    iconStart,
    iconEnd,
    fullWidth = false,
    disabled = false,
    children,
    className,
    type = 'button',
    ...rest
  },
  ref,
) {
  const classes = [
    styles.button,
    styles[variant],
    styles[tone],
    styles[size],
    fullWidth && styles.fullWidth,
    loading && styles.loading,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      {...rest}
      ref={ref}
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      <span className={styles.content}>
        {iconStart && (
          <span className={styles.icon} aria-hidden="true">
            {iconStart}
          </span>
        )}
        {children}
        {iconEnd && (
          <span className={styles.icon} aria-hidden="true">
            {iconEnd}
          </span>
        )}
      </span>
      {loading && <span className={styles.spinner} aria-hidden="true" />}
    </button>
  );
});
