'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent, ReactNode } from 'react';
import { nextTab } from './keys';
import styles from './Tabs.module.css';

/**
 * Three looks over one behaviour. `segmented` and `pill` are drawn; `underline`
 * was proposed and approved on 2026-09-18 because the file has none and a page
 * needs one. See docs/superpowers/specs/2026-09-18-tabs-design.md.
 */
export const tabsVariants = ['underline', 'segmented', 'pill'] as const;
export type TabsVariant = (typeof tabsVariants)[number];

export type TabItem = {
  id: string;
  label: string;
  /** What the tab shows when selected. */
  content: ReactNode;
  /** A number beside the label, read as part of the tab's name. */
  count?: number;
  disabled?: boolean;
};

export type TabsProps = {
  /**
   * Tab and panel arrive together, the way DropdownMenu takes `actions`: one
   * array cannot drift apart, and the ids that tie a tab to its panel are the
   * component's to make.
   */
  items: readonly TabItem[];
  /** Names the list for assistive technology. */
  label: string;
  variant?: TabsVariant;
  value?: string;
  defaultValue?: string;
  onChange?: (id: string) => void;
  /**
   * `automatic` selects as the arrows move focus — a panel here is already
   * rendered and costs nothing to show. `manual` moves focus only, for a
   * caller whose panel fetches; Enter and Space then select, as a click.
   */
  activation?: 'automatic' | 'manual';
  /** Renders every panel and hides the rest, for a half-filled form in another tab. */
  keepMounted?: boolean;
  /** Segmented: the track fills its container instead of fitting its labels. */
  fullWidth?: boolean;
  className?: string;
};

export function Tabs({
  items,
  label,
  variant = 'underline',
  value,
  defaultValue,
  onChange,
  activation = 'automatic',
  keepMounted = false,
  fullWidth = false,
  className,
}: TabsProps) {
  const uid = useId();
  const [inner, setInner] = useState(defaultValue);
  const listRef = useRef<HTMLDivElement>(null);

  // A value that names nothing, or a disabled tab, would show no panel at
  // all. The first tab that can be selected shows instead.
  const asked = value ?? inner;
  const selected = (
    items.find((item) => item.id === asked && !item.disabled) ?? items.find((item) => !item.disabled)
  )?.id;
  const selectedIndex = items.findIndex((item) => item.id === selected);

  const select = (item: TabItem) => {
    if (item.disabled || item.id === selected) return;
    if (value === undefined) setInner(item.id);
    onChange?.(item.id);
  };

  // Keeps the selected tab in view inside a list that scrolls. The list's own
  // scrollLeft, never scrollIntoView: that scrolls the page too, and a Tabs
  // below the fold would drag the reader down to it on mount. Run again when
  // the list is resized — a drawer opening beside it, a phone turning — or
  // the tab that was in view no longer is. jsdom has no ResizeObserver.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const keepInView = () => {
      const tab = list.querySelector<HTMLElement>('[aria-selected="true"]');
      if (!tab) return;
      const frame = list.getBoundingClientRect();
      const box = tab.getBoundingClientRect();
      if (box.left < frame.left) list.scrollLeft += box.left - frame.left;
      else if (box.right > frame.right) list.scrollLeft += box.right - frame.right;
    };
    keepInView();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(keepInView);
    observer.observe(list);
    return () => observer.disconnect();
  }, [selected, items.length]);

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const tabs = [...event.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]')];
    const at = tabs.indexOf(event.target as HTMLElement);
    if (at < 0) return;
    // With a modifier the key is the browser's or the system's: Alt+Left is
    // Back on Windows and Linux, Cmd+Arrow moves by line on a Mac.
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    // The attribute, not the computed direction: jsdom computes none.
    const rtl = event.currentTarget.closest('[dir]')?.getAttribute('dir') === 'rtl';
    const to = nextTab(event.key, at, items.map((item) => !item.disabled), rtl);
    if (to === null) return;
    event.preventDefault();
    tabs[to]?.focus();
    if (activation === 'automatic') select(items[to]!);
  };

  // By position, not by the caller's id: aria-controls and aria-labelledby
  // are space-separated lists, so an id of "past visits" would name two
  // elements that do not exist.
  const at = (id: string) => items.findIndex((item) => item.id === id);
  const tabId = (id: string) => `${uid}-tab-${at(id)}`;
  const panelId = (id: string) => `${uid}-panel-${at(id)}`;
  const mounted = (item: TabItem) => keepMounted || item.id === selected;

  const classes = [styles.root, styles[variant], fullWidth && styles.fullWidth, className]
    .filter(Boolean)
    .join(' ');

  // The segmented thumb is one element moved by index over equal columns, so
  // it slides without anything being measured.
  const track =
    variant === 'segmented'
      ? ({ '--tabs-index': String(Math.max(selectedIndex, 0)), '--tabs-count': String(items.length) } as CSSProperties)
      : undefined;

  return (
    <div className={classes}>
      <div className={`${styles.bar} ${styles[variant]}`}>
        <div
          ref={listRef}
          role="tablist"
          aria-label={label}
          className={[styles.list, styles[variant], fullWidth && styles.fullWidth].filter(Boolean).join(' ')}
          style={track}
          onKeyDown={onKeyDown}
        >
          {variant === 'segmented' && selectedIndex >= 0 && <span className={styles.thumb} aria-hidden="true" />}
          {items.map((item, index) => {
            const isSelected = item.id === selected;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                id={tabId(item.id)}
                className={`${styles.tab} ${styles[variant]}`}
                aria-selected={isSelected}
                aria-controls={mounted(item) ? panelId(item.id) : undefined}
                aria-disabled={item.disabled || undefined}
                // With nothing selectable the first tab still holds the stop,
                // so the list is not a hole in the tab order.
                tabIndex={isSelected || (selected === undefined && index === 0) ? 0 : -1}
                onClick={() => select(item)}
              >
                <span className={styles.ghost}>
                  <span className={styles.label}>{item.label}</span>
                  {/* A real space: two adjacent spans give the name
                      "Participants12", and a screen reader says it that way.
                      The flex row lays no whitespace out, so nothing moves. */}
                  {item.count !== undefined && ' '}
                  {item.count !== undefined && <span className={styles.count}>{item.count}</span>}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      {items.filter(mounted).map((item) => (
        <div
          key={item.id}
          role="tabpanel"
          id={panelId(item.id)}
          aria-labelledby={tabId(item.id)}
          className={styles.panel}
          hidden={item.id !== selected}
          tabIndex={0}
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}
