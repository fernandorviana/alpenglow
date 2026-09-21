import type { ReactNode } from 'react';
import styles from './EmptyState.module.css';

export const emptyStateSizes = ['sm', 'lg'] as const;
export type EmptyStateSize = (typeof emptyStateSizes)[number];

export const emptyStateVariants = ['plain', 'dashed'] as const;
export type EmptyStateVariant = (typeof emptyStateVariants)[number];

/** The one thing to do next, or none when empty is good news; and another way, an import or something to read, only beside it. */
type Actions =
  | { action?: ReactNode; secondaryAction?: never }
  | { action: ReactNode; secondaryAction?: ReactNode };

export type EmptyStateProps = Actions & {
  /** What is not here: "No locations yet", "No clients match “zzz”". */
  title: string;
  /** Why, or what happens next. */
  description?: ReactNode;
  /** In a circle over the title, or beside it when small. */
  icon?: ReactNode;
  /** In the icon's place: a product's own illustration. The system ships none. */
  media?: ReactNode;
  /** `lg` is centred, for a table or a page; `sm` is at the start, for a card or a section. */
  size?: EmptyStateSize;
  /** `dashed` is a frame that says something goes here: for first use, not for a search with no results. */
  variant?: EmptyStateVariant;
  /** One below the heading it stands under. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  className?: string;
};

/**
 * What stands where content would be when there is none: what this is, why it
 * is empty, and what to do next.
 */
export function EmptyState({
  title,
  description,
  icon,
  media,
  action,
  secondaryAction,
  size = 'lg',
  variant = 'plain',
  headingLevel = 3,
  className,
}: EmptyStateProps) {
  const Heading = `h${headingLevel}` as const;
  const mark = media ? (
    <div className={styles.media}>{media}</div>
  ) : icon ? (
    <span aria-hidden="true" className={styles.icon}>
      {icon}
    </span>
  ) : null;

  return (
    <div
      className={[styles.empty, styles[size], !mark && styles.bare, variant === 'dashed' && styles.dashed, className]
        .filter(Boolean)
        .join(' ')}
    >
      {mark}
      <div className={styles.words}>
        <Heading className={styles.title}>{title}</Heading>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {(action || secondaryAction) && (
        <div className={styles.actions}>
          {secondaryAction}
          {action}
        </div>
      )}
    </div>
  );
}
