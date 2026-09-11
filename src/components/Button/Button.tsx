import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader } from '../Loader/Loader';
import type { ControlSize, FillTone, TintTone } from '../vocabulary';
import styles from './Button.module.css';

type BaseProps = {
  size?: ControlSize;
  /** Renders a spinner, hides the label without changing the button's width, and blocks activation. */
  loading?: boolean;
  iconStart?: ReactNode;
  iconEnd?: ReactNode;
  fullWidth?: boolean;
  children?: ReactNode;
};

/** Every tone the theme can fill. */
export const buttonFillTones = ['accent', 'neutral', 'tertiary', 'success', 'danger'] as const satisfies readonly FillTone[];

/**
 * Outline and ghost paint the tone as text, outline as a border too.
 *
 * `tertiary` cannot be painted that way: its fill is flare/400, 2.53:1 on
 * white, and the theme has no tertiary text colour (flare/700 would clear
 * 7.84:1, but nobody has drawn the button that needs it), so
 * `variant="outline" tone="tertiary"` does not compile. `success` could — `text/success` and
 * `border/success`, added for field validation, clear 4.5:1 and 3:1 on the
 * canvas — but an outline success button was never drawn, so it is not
 * offered. Decided 2026-09-11.
 */
export const buttonTextTones = ['accent', 'neutral', 'danger'] as const satisfies readonly TintTone[];

type VariantProps =
  | { variant?: 'solid'; tone?: (typeof buttonFillTones)[number] }
  | { variant: 'outline' | 'ghost'; tone?: (typeof buttonTextTones)[number] };

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
      {loading && (
        <span className={styles.spinner}>
          {/* No label: the button already carries aria-busy, and a second
              announcement would repeat what it said. */}
          <Loader tone="currentColor" size={size === 'lg' ? 'md' : 'sm'} />
        </span>
      )}
    </button>
  );
});
