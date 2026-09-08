import type { HTMLAttributes } from 'react';
import styles from './Loader.module.css';

export type LoaderSize = 'sm' | 'md' | 'lg';
export type LoaderTone = 'accent' | 'neutral' | 'success' | 'danger' | 'onFill';

export type LoaderProps = {
  size?: LoaderSize;
  tone?: LoaderTone;
  /** What is being waited for. Announced politely; omit inside an aria-busy control. */
  label?: string;
} & Omit<HTMLAttributes<HTMLSpanElement>, 'children'>;

/**
 * Two arcs turning in opposite directions, at 24px as drawn and scaled from
 * there.
 *
 * With a `label` it is a live region, so a screen reader hears that something
 * started. Without one it is decoration — which is right inside a button that
 * already carries `aria-busy`, where a second announcement would just repeat
 * what the button said.
 */
export function Loader({ size = 'md', tone = 'accent', label, className, ...rest }: LoaderProps) {
  const classes = [styles.loader, styles[size], styles[tone], className].filter(Boolean).join(' ');

  return (
    <span
      {...rest}
      className={classes}
      role={label ? 'status' : undefined}
      aria-live={label ? 'polite' : undefined}
      aria-hidden={label ? undefined : true}
    >
      <svg className={styles.svg} viewBox="0 0 24 24" fill="none">
        {/* 18px across, so r=9 on a 24 box. Three quarters drawn, one open. */}
        <circle
          className={styles.outer}
          cx="12"
          cy="12"
          r="9"
          strokeWidth="2"
          strokeDasharray="42 15"
        />
        {/* 9px across: r=4.5. */}
        <circle
          className={styles.inner}
          cx="12"
          cy="12"
          r="4.5"
          strokeWidth="2"
          strokeDasharray="21 7"
        />
      </svg>
      {label && <span className="ap-sr-only">{label}</span>}
    </span>
  );
}
