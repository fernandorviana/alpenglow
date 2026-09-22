import { useId, type CSSProperties } from 'react';
import styles from './Progress.module.css';
import type { TintTone } from '../vocabulary';

export const progressSizes = ['sm', 'md'] as const;
export type ProgressSize = (typeof progressSizes)[number];

/** The Loader's tones: one vocabulary for what is working. */
export const progressTones = ['accent', 'neutral', 'success', 'danger'] as const satisfies readonly TintTone[];
export type ProgressTone = (typeof progressTones)[number];

export type ProgressProps = {
  /** What is being measured. The element's name, visible unless `hideLabel`. */
  label: string;
  hideLabel?: boolean;
  /** Without one the bar is indeterminate: something is working, how far is not known. */
  value?: number;
  max?: number;
  /** The value in words at the end of the label's line: a percentage, or `valueText`. */
  showValue?: boolean;
  /** "3 of 5". What is seen and what a reader is told. */
  valueText?: string;
  /** `sm` is 4, as drawn; `md` is 8, for a bar that is the page's subject. */
  size?: ProgressSize;
  /** `success` for done, `danger` for failed. */
  tone?: ProgressTone;
  className?: string;
  style?: CSSProperties;
};

/**
 * A native `progress`, painted on the element itself so every browser draws
 * the same bar. The fill's length is `--progress-value`; what fills it is the
 * tone's colour unless the caller sets `--progress-fill`, an image.
 */
export function Progress({
  label,
  hideLabel = false,
  value,
  max = 100,
  showValue = false,
  valueText,
  size = 'sm',
  tone = 'accent',
  className,
  style,
}: ProgressProps) {
  const id = useId();
  const determinate = value !== undefined;
  // The paint is the component's, so it clamps as the platform does: a max
  // of 0 or less is 1, and the value stays within 0 and max. A negative
  // background-size is invalid and would paint the whole bar. Floor, not
  // round, so it never says done before it is.
  const share = determinate ? Math.min(1, Math.max(0, value / (max > 0 ? max : 1))) * 100 : undefined;
  const text = valueText ?? (share === undefined ? undefined : `${Math.floor(share)}%`);
  const shown = showValue && text !== undefined;

  return (
    <div className={[styles.progress, styles[size], styles[tone], className].filter(Boolean).join(' ')} style={style}>
      {(!hideLabel || shown) && (
        <div className={styles.head}>
          {!hideLabel && (
            <span id={id} className={styles.label}>
              {label}
            </span>
          )}
          {shown && <span className={styles.value}>{text}</span>}
        </div>
      )}
      <progress
        className={styles.bar}
        value={determinate ? value : undefined}
        max={max}
        aria-labelledby={hideLabel ? undefined : id}
        aria-label={hideLabel ? label : undefined}
        aria-valuetext={valueText}
        style={share === undefined ? undefined : ({ '--progress-value': `${share}%` } as CSSProperties)}
      />
    </div>
  );
}
