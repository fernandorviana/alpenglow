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
 * An arc turning on a faint track, growing and shrinking as it goes. 24px as
 * drawn and scaled from there.
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
        {/* 18px across, so r=9 on a 24 box, 2px stroke — the ring as drawn. */}
        <circle className={styles.track} cx="12" cy="12" r="9" strokeWidth="2" />
        {/* Same circle, but `pathLength` restates its circumference as 100 so
            the dash animation can be written in percentages. */}
        <circle
          className={styles.arc}
          cx="12"
          cy="12"
          r="9"
          strokeWidth="2"
          pathLength={100}
        />
      </svg>
      {label && <span className="ap-sr-only">{label}</span>}
    </span>
  );
}
