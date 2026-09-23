'use client';

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Dialog, type DialogSize } from '../Dialog/Dialog';
import { Input } from '../Input/Input';
import { first, fold, found, last, step } from '../listbox/options';
import styles from './CommandPalette.module.css';

export type CommandItem = {
  id: string;
  /** The row's name, and what the default filter reads. */
  label: string;
  /** At the end of the first line: where the command leads, "Foundations › Colour". */
  description?: string;
  /** A second line: an excerpt, what the command does. */
  detail?: string;
  /** Before the words. */
  icon?: ReactNode;
  /** Drawn as a key cap at the end. A string the caller writes; the palette installs no binding. */
  shortcut?: string;
  /** Searched by the default filter, never shown. */
  keywords?: readonly string[];
  /** Skipped by the arrows and refused by Enter. */
  disabled?: boolean;
  /** The label is code — a token, a path — and is set in monospace. */
  mono?: boolean;
};

export type CommandGroup = { label: string; items: readonly CommandItem[] };

export type CommandPaletteProps = {
  open: boolean;
  /** Esc and the close button. The palette never closes itself: the caller sets `open` to false. */
  onClose: () => void;
  /** The dialog's name, shown as its title. */
  label: string;
  placeholder?: string;
  /** At the start of the field. */
  icon?: ReactNode;
  items: readonly CommandGroup[];
  /** The chosen item. The caller closes, or opens what comes next. */
  onSelect: (item: CommandItem) => void;
  /**
   * Which items stay as the reader types. Left out, a label or a keyword that
   * holds what was typed anywhere in it, whatever the case or the accents.
   * `null` when the caller filters and hands back `items` already narrowed.
   */
  filter?: ((item: CommandItem, query: string) => boolean) | null;
  query?: string;
  defaultQuery?: string;
  onQueryChange?: (query: string) => void;
  /** Shows `loadingText` in place of the rows. */
  loading?: boolean;
  loadingText?: string;
  /** Shown when nothing is left. It is handed what was typed. */
  emptyText?: string | ((query: string) => string);
  /** A line under the field the caller writes — an index that did not load — in place of the palette's own. */
  status?: ReactNode;
  /** The Dialog's width. */
  size?: DialogSize;
  className?: string;
};

/** Whether the label or a keyword holds what was typed. */
export function matchesCommand(item: CommandItem, query: string): boolean {
  const needle = fold(query.trim());
  if (!needle) return true;
  return fold(item.label).includes(needle) || (item.keywords ?? []).some((word) => fold(word).includes(needle));
}

/** `text` with the first occurrence of what was typed in a mark, found with accents and case folded. */
function marked(text: string, query: string): ReactNode {
  const range = found(text, query);
  if (!range) return text;
  const [at, end] = range;
  const chars = Array.from(text);
  return (
    <>
      {chars.slice(0, at).join('')}
      <mark className={styles.mark}>{chars.slice(at, end).join('')}</mark>
      {chars.slice(end).join('')}
    </>
  );
}

/**
 * A dialog with a field and a list of commands: the site's ⌘K, graduated.
 * One combobox: the field keeps focus, the arrows move an active row, Enter
 * follows it. Suggestions only, no inline completion — editing the field's
 * value under the reader's fingers is the class of bug the date mask fought.
 */
export function CommandPalette({
  open,
  onClose,
  label,
  placeholder,
  icon,
  items,
  onSelect,
  filter,
  query: controlledQuery,
  defaultQuery = '',
  onQueryChange,
  loading = false,
  loadingText = 'Loading…',
  emptyText,
  status: callerStatus,
  size = 'md',
  className,
}: CommandPaletteProps) {
  const id = useId();
  const listId = `${id}-list`;
  const field = useRef<HTMLInputElement>(null);

  const [ownQuery, setOwnQuery] = useState(defaultQuery);
  const query = controlledQuery ?? ownQuery;
  const setQuery = (next: string) => {
    if (controlledQuery === undefined) setOwnQuery(next);
    onQueryChange?.(next);
  };

  // A new query starts with no row active. Derived in the render that sees
  // the change, not in an effect after it.
  const [active, setActive] = useState(-1);
  const [seen, setSeen] = useState(query);
  if (seen !== query) {
    setSeen(query);
    setActive(-1);
  }

  const keep = filter === null ? () => true : (item: CommandItem) => (filter ?? matchesCommand)(item, query);
  const groups = items.flatMap((group) => {
    const kept = group.items.filter(keep);
    return kept.length ? [{ label: group.label, items: kept }] : [];
  });
  // Each row's place in reading order, counted once here rather than while
  // the rows are drawn.
  let n = 0;
  const placed = groups.map((group) => ({ label: group.label, rows: group.items.map((item) => ({ item, at: n++ })) }));
  const flat = groups.flatMap((group) => group.items);
  // The listbox helpers read `label` and `disabled`; `value` is theirs alone.
  const options = flat.map((item) => ({ value: item.id, label: item.label, disabled: item.disabled }));
  const rowId = (index: number) => `${listId}-${index}`;
  const activeItem = active >= 0 ? flat[active] : undefined;

  const q = query.trim();
  let status: ReactNode = null;
  if (callerStatus !== undefined) status = callerStatus;
  else if (loading) status = loadingText;
  else if (q && flat.length === 0) {
    status = typeof emptyText === 'function' ? emptyText(q) : (emptyText ?? `Nothing matches “${q}”.`);
  }

  const choose = (item: CommandItem | undefined) => {
    if (!item || item.disabled) return;
    onSelect(item);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    // The Enter that commits an IME composition is the composition's, not
    // the list's; taken as "follow the first row" it acts mid-word.
    if (event.nativeEvent.isComposing) return;
    // Esc closes the dialog through its own `cancel`. It must not also reach
    // a document listener elsewhere — the site's narrow-screen menu.
    if (event.key === 'Escape') {
      event.stopPropagation();
      return;
    }
    if (options.length === 0) return;
    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault();
        const next = step(options, active, 1);
        setActive(next === active ? first(options) : next);
        break;
      }
      case 'ArrowUp': {
        event.preventDefault();
        const next = active < 0 ? last(options) : step(options, active, -1);
        setActive(next === active ? last(options) : next);
        break;
      }
      // Home and End are the caret's until a row is active; then the list's.
      case 'Home':
        if (active >= 0) {
          event.preventDefault();
          setActive(first(options));
        }
        break;
      case 'End':
        if (active >= 0) {
          event.preventDefault();
          setActive(last(options));
        }
        break;
      case 'Enter':
        event.preventDefault();
        choose(activeItem ?? flat[first(options)]);
        break;
    }
  };

  // Keep the active row in view as the arrows move it. jsdom has no layout
  // and no scrollIntoView, hence the guard.
  const activeId = active >= 0 ? rowId(active) : undefined;
  useEffect(() => {
    if (activeId) document.getElementById(activeId)?.scrollIntoView?.({ block: 'nearest' });
  }, [activeId]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={label}
      size={size}
      initialFocus={field}
      className={[styles.dialog, className].filter(Boolean).join(' ')}
    >
      <Input
        ref={field}
        size="lg"
        iconStart={icon}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={onKeyDown}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={flat.length > 0}
        aria-controls={listId}
        aria-activedescendant={activeId}
        aria-label={label}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
      />
      {status && (
        <p className={styles.status} role="status">
          {status}
        </p>
      )}
      <div role="listbox" id={listId} aria-label={label} className={styles.list}>
        {placed.map((group) => (
          <div key={group.label} role="group" aria-label={group.label} className={styles.group}>
            <div className={styles.groupLabel} aria-hidden="true">
              {group.label}
            </div>
            {group.rows.map(({ item, at }) => {
              return (
                <div
                  key={item.id}
                  id={rowId(at)}
                  role="option"
                  aria-selected={at === active}
                  aria-disabled={item.disabled || undefined}
                  className={[
                    styles.option,
                    at === active && styles.active,
                    item.disabled && styles.optionDisabled,
                    item.mono && styles.mono,
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onMouseMove={() => {
                    if (!item.disabled && active !== at) setActive(at);
                  }}
                  // The field keeps focus; a press on a row must not take it.
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(item)}
                >
                  {item.icon && (
                    <span className={styles.start} aria-hidden="true">
                      {item.icon}
                    </span>
                  )}
                  <span className={styles.words}>
                    <span className={styles.label}>{marked(item.label, query)}</span>
                    {item.detail && <span className={styles.detail}>{marked(item.detail, query)}</span>}
                  </span>
                  {item.description && <span className={styles.description}>{item.description}</span>}
                  {item.shortcut && <kbd className={styles.kbd}>{item.shortcut}</kbd>}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </Dialog>
  );
}
