import type { CSSProperties } from 'react';
import styles from './Skeleton.module.css';

export const skeletonVariants = ['text', 'circle', 'rect'] as const;
export type SkeletonVariant = (typeof skeletonVariants)[number];

type Length = number | string;

export type SkeletonProps = {
  /** `text` is the height of the line it stands in; `circle` an Avatar; `rect` media or a button. */
  variant?: SkeletonVariant;
  /** Text only. The last of several is shorter, unless `width` says otherwise. */
  lines?: number;
  width?: Length;
  height?: Length;
  /** Circle: both. */
  size?: Length;
  className?: string;
  style?: CSSProperties;
};

const css = (value: Length | undefined) => (typeof value === 'number' ? `${value}px` : value);

/**
 * The shape of what is on its way. It says nothing to a screen reader: the
 * region that is loading is the caller's, and says `aria-busy`.
 */
export function Skeleton({ variant = 'text', lines = 1, width, height, size, className, style }: SkeletonProps) {
  const sizes = {
    '--skeleton-width': css(variant === 'circle' ? (size ?? width) : width),
    '--skeleton-height': css(variant === 'circle' ? (size ?? height) : height),
  } as CSSProperties;
  const shape = [styles.skeleton, styles[variant]];

  if (variant !== 'text' || lines <= 1) {
    return (
      <span aria-hidden="true" className={[...shape, className].filter(Boolean).join(' ')} style={{ ...sizes, ...style }} />
    );
  }

  // Several lines are one thing to the caller: `className` and `style` are
  // the group's, and not given to every line in it.
  return (
    <span aria-hidden="true" className={[styles.lines, className].filter(Boolean).join(' ')} style={style}>
      {Array.from({ length: lines }, (_, i) => (
        <span
          key={i}
          className={[...shape, i === lines - 1 && width === undefined ? styles.last : undefined].filter(Boolean).join(' ')}
          style={sizes}
        />
      ))}
    </span>
  );
}
