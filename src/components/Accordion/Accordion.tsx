'use client';

import { createContext, useContext, useEffect, useId, useRef, useState } from 'react';
import type { ReactNode, ToggleEvent } from 'react';
import styles from './Accordion.module.css';

export const accordionHeadingLevels = [2, 3, 4, 5, 6] as const;
export type AccordionHeadingLevel = (typeof accordionHeadingLevels)[number];

type Group = { name?: string; level: AccordionHeadingLevel };
const GroupContext = createContext<Group>({ level: 3 });

export type AccordionProps = {
  children: ReactNode;
  /** One open at a time. The items share a `name`, and closing the others is the platform's. */
  exclusive?: boolean;
  /** The level of every item's heading: one below the heading the accordion stands under. */
  headingLevel?: AccordionHeadingLevel;
  className?: string;
};

/**
 * Sections that open and close, on the native `details`: opening, the
 * keyboard, and the browser's find-in-page opening the section that holds the
 * match are the platform's. Several may be open, as drawn.
 */
export function Accordion({ children, exclusive = false, headingLevel = 3, className }: AccordionProps) {
  const name = useId();
  return (
    <GroupContext.Provider value={{ name: exclusive ? name : undefined, level: headingLevel }}>
      <div className={[styles.accordion, className].filter(Boolean).join(' ')}>{children}</div>
    </GroupContext.Provider>
  );
}

export type AccordionItemProps = {
  title: string;
  /** How many things the section holds, after the title. */
  count?: number;
  /** After the title in the count's place, or beside it: a Badge. */
  meta?: ReactNode;
  /**
   * At the row's end, outside the summary: an icon button that adds to the
   * section. The row keeps 64 clear for it; a wider one sets
   * `--accordion-action-room` through `className`.
   */
  action?: ReactNode;
  children: ReactNode;
  /** Controlled, if given. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
};

export function AccordionItem({
  title,
  count,
  meta,
  action,
  children,
  open,
  defaultOpen = false,
  onOpenChange,
  className,
}: AccordionItemProps) {
  const { name, level } = useContext(GroupContext);
  const ref = useRef<HTMLDetailsElement>(null);
  const Heading = `h${level}` as const;

  // What the caller was last told, or told us. `toggle` also fires for an
  // item that mounts open and for one the prop has just moved, and neither is
  // news.
  // `defaultOpen` is read once. Written to the attribute on every render, a
  // `defaultOpen={items.length > 0}` that flips would open or shut a section
  // the reader had set.
  const [initial] = useState(defaultOpen);
  const known = useRef(open ?? initial);

  // The platform toggles the element whatever the prop says: a controlled
  // item is put back to its prop after every render.
  useEffect(() => {
    if (open === undefined) return;
    known.current = open;
    if (ref.current && ref.current.open !== open) ref.current.open = open;
  });

  return (
    <div className={[styles.item, className].filter(Boolean).join(' ')}>
      <details
        ref={ref}
        name={name}
        open={open ?? initial}
        className={styles.details}
        onToggle={(event: ToggleEvent<HTMLDetailsElement>) => {
          const next = event.currentTarget.open;
          if (next === known.current) return;
          known.current = next;
          onOpenChange?.(next);
        }}
      >
        <summary className={[styles.summary, action ? styles.withAction : undefined].filter(Boolean).join(' ')}>
          <svg className={styles.chevron} width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M7.5 4.5L13 10l-5.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <Heading className={styles.title}>{title}</Heading>
          {count !== undefined && <span className={styles.count}>{count}</span>}
          {meta}
        </summary>
        <div className={styles.content}>{children}</div>
      </details>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
