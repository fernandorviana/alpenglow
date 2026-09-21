'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { CSSProperties, FocusEvent, KeyboardEvent, ReactNode } from 'react';
import { useField } from '../Field/FieldContext';
import type { ControlSize } from '../vocabulary';
import control from '../control.module.css';
import floating from '../floating.module.css';
import hiddenStyles from '../visuallyHidden.module.css';
import { OptionList } from '../listbox/OptionList';
import { Tag } from '../Tag/Tag';
import { contains, filterEntries, first, flatten, last, step } from '../listbox/options';
import type { SelectEntry, SelectOption } from '../listbox/options';
import styles from './Combobox.module.css';

type Shared = {
  options: readonly SelectEntry[];
  placeholder?: string;
  size?: ControlSize;
  invalid?: boolean;
  disabled?: boolean;
  required?: boolean;
  /** Submits with a form through hidden inputs: one, or one for each value. */
  name?: string;
  id?: string;
  iconStart?: ReactNode;
  /**
   * Which options stay as the reader types. Left out, a label that holds what
   * was typed anywhere in it, whatever the case or the accents. `null` when the
   * caller filters — a server does — and hands back `options` already narrowed.
   */
  filter?: ((option: SelectOption, query: string) => boolean) | null;
  /** What is being typed, for a caller that fetches. */
  onInputChange?: (query: string) => void;
  /** Shows `loadingText` in place of the options. */
  loading?: boolean;
  loadingText?: string;
  /** Shown when nothing is left. It is handed what was typed. */
  emptyText?: string | ((query: string) => string);
  /** A button that takes the choice away. On unless told, where many can be chosen. */
  clearable?: boolean;
  clearLabel?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  className?: string;
};

export type ComboboxSingleProps = Shared & {
  multiple?: false;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
};

export type ComboboxMultipleProps = Shared & {
  multiple: true;
  value?: readonly string[];
  defaultValue?: readonly string[];
  onChange?: (value: string[]) => void;
  /** Adds a first row that chooses every option, or none: the drawn "All". */
  selectAllLabel?: string;
  /** Names a tag's button: "Remove Anthony Jackson". */
  removeLabel?: (label: string) => string;
  /** Said when the choice changes: "3 selected". */
  countLabel?: (count: number) => string;
};

export type ComboboxProps = ComboboxSingleProps | ComboboxMultipleProps;

/** Carbon's chevron and close, on their 32 grid. Apache-2.0, © IBM. */
const CHEVRON = 'M16 22 6 12 7.4 10.6 16 19.2 24.6 10.6 26 12z';
const CLOSE =
  'M17.4141 16 24 9.4141 22.5859 8 16 14.5859 9.4143 8 8 9.4141 14.5859 16 8 22.5859 9.4143 24 16 17.4141 22.5859 24 24 22.5859 17.4141 16z';
const Glyph = ({ d }: { d: string }) => (
  <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true" focusable="false">
    <path d={d} />
  </svg>
);

/** The control box's block padding at each size, where the pinned buttons of a box with tags start. */
const INSET: Record<ControlSize, string> = {
  sm: 'var(--ap-spacing-050)',
  md: 'var(--ap-spacing-100)',
  lg: 'var(--ap-spacing-150)',
};

/** The value of the row that stands for every option. Not one a caller's option can have by accident. */
const ALL = '__alpenglow-combobox-all__';

/**
 * A field that is typed in to narrow a list, and a choice made from the list:
 * the Select for a list nobody wants to scroll. One value, or, with
 * `multiple`, the drawn one — tags in the field, a checkbox before every
 * option, a first row for all of them.
 *
 * The value is always from the list: what is typed is a way to it, and is put
 * back when the field is left. It suggests and never completes, the site
 * search's rule (invariant 22), and the Enter that commits an IME composition
 * is the composition's.
 */
export function Combobox(props: ComboboxProps) {
  const {
    options: entries,
    placeholder,
    size = 'md',
    invalid,
    disabled = false,
    required,
    name,
    id: ownId,
    iconStart,
    filter = contains,
    onInputChange,
    loading = false,
    loadingText = 'Loading…',
    emptyText = 'No results',
    clearLabel = 'Clear',
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    'aria-describedby': ariaDescribedBy,
    className,
  } = props;
  const multiple = props.multiple === true;
  const clearable = props.clearable ?? multiple;
  const selectAllLabel = props.multiple ? props.selectAllLabel : undefined;
  const removeLabel = (props.multiple && props.removeLabel) || ((label: string) => `Remove ${label}`);
  const countLabel = (props.multiple && props.countLabel) || ((count: number) => `${count} selected`);

  const field = useField();
  const base = useId();
  const id = ownId ?? field?.controlId ?? `${base}combobox`;
  const listId = `${base}list`;
  // useId's colons are not valid in a dashed ident.
  const anchor = `--combobox-${base.replace(/[^a-zA-Z0-9]/g, '')}`;

  const all = flatten(entries);
  const [internal, setInternal] = useState<readonly string[]>(() =>
    props.multiple ? (props.defaultValue ?? []) : props.defaultValue ? [props.defaultValue] : [],
  );
  const controlled =
    props.value === undefined ? undefined : props.multiple ? props.value : props.value ? [props.value] : [];
  const isControlled = controlled !== undefined;
  const values = controlled ?? internal;
  const chosen = all.filter((option) => values.includes(option.value));
  const single = multiple ? undefined : chosen[0];

  // What is being typed, until a choice is made. null: the field shows the choice.
  const [draft, setDraft] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  // The option the arrows or the pointer made active, by its value and not its
  // place: the rows change under it as the reader types or a caller's fetch
  // comes back, and a place would then be another option. While `best`, it is
  // instead the first that can be chosen, so Enter takes the best match of
  // what was just typed — which cannot be known until the list is filtered.
  const [moved, setMoved] = useState<string | null>(null);
  const [best, setBest] = useState(false);
  // The list follows the keyboard into view and not the pointer (the Select's review).
  const [follow, setFollow] = useState(false);
  const query = draft ?? '';
  const text = draft ?? single?.label ?? '';

  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const shown = useRef(false);

  // What the list holds now: what passes the filter, under a row for all of
  // them while nothing is typed.
  const kept = filter && query.trim() ? filterEntries(entries, (option) => filter(option, query)) : entries;
  const everyone = all.filter((option) => !option.disabled);
  const withAll: readonly SelectEntry[] =
    selectAllLabel && !query.trim() && everyone.length ? [{ value: ALL, label: selectAllLabel }, ...kept] : kept;
  const rows = flatten(withAll);
  const active = best ? first(rows) : moved === null ? -1 : rows.findIndex((option) => option.value === moved);
  const status = loading
    ? loadingText
    : rows.length
      ? undefined
      : typeof emptyText === 'function'
        ? emptyText(query)
        : emptyText;

  // The platform holds the popover's state and throws when told what it
  // already knows, so what it was last told is kept beside it.
  useEffect(() => {
    if (!list.current || shown.current === open) return;
    shown.current = open;
    list.current.togglePopover(open);
  }, [open]);

  useEffect(() => {
    if (!open || !follow || active < 0) return;
    list.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView?.({ block: 'nearest' });
  }, [open, follow, active]);

  const commit = (next: readonly string[]) => {
    if (controlled === undefined) setInternal(next);
    if (props.multiple) props.onChange?.([...next]);
    else props.onChange?.(next[0] ?? '');
  };

  const close = () => {
    setOpen(false);
    setMoved(null);
    setBest(false);
  };

  const type = (next: string | null) => {
    setDraft(next);
    onInputChange?.(next ?? '');
  };

  const go = (at: number) => {
    setFollow(true);
    setBest(false);
    setMoved(rows[at]?.value ?? null);
  };

  const choose = (at: number) => {
    const option = rows[at];
    if (!option || option.disabled) return;
    if (!multiple) {
      type(null);
      close();
      if (option.value !== values[0]) commit([option.value]);
      return;
    }
    // Many: the list stays open, and what was typed has done its work.
    if (option.value === ALL) {
      const full = everyone.every((o) => values.includes(o.value));
      const others = values.filter((v) => !everyone.some((o) => o.value === v));
      commit(full ? others : [...others, ...everyone.map((o) => o.value)]);
    } else {
      commit(values.includes(option.value) ? values.filter((v) => v !== option.value) : [...values, option.value]);
    }
    if (draft) {
      type('');
      go(-1);
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    // The Enter that commits an IME composition is the composition's.
    if (event.nativeEvent.isComposing) return;
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        event.preventDefault();
        const by = event.key === 'ArrowDown' ? 1 : -1;
        const end = by === 1 ? first(rows) : last(rows);
        if (!open) {
          setOpen(true);
          // Alt and an arrow shows the list and makes nothing active.
          if (!event.altKey) go(end);
        } else {
          go(active < 0 ? end : step(rows, active, by));
        }
        return;
      }
      // Home and End are the caret's until an option is active; then the list's.
      case 'Home':
      case 'End':
        if (open && active >= 0) {
          event.preventDefault();
          go(event.key === 'Home' ? first(rows) : last(rows));
        }
        return;
      case 'Enter':
        if (open && active >= 0) {
          event.preventDefault();
          choose(active);
        }
        return;
      case 'Escape':
        // First the list, then what was typed. An Esc that did either was for
        // this field, and must not go on to a Dialog around it.
        if (open) {
          event.preventDefault();
          event.stopPropagation();
          close();
        } else if (draft !== null) {
          event.preventDefault();
          event.stopPropagation();
          type(null);
        }
        return;
      case 'Backspace':
        if (multiple && !text && values.length) commit(values.slice(0, -1));
        return;
    }
  };

  // Left for somewhere that is not the field or its list: what was typed and
  // chose nothing is put back.
  const onBlur = (event: FocusEvent) => {
    const to = event.relatedTarget as Node | null;
    if (to && (event.currentTarget.contains(to) || list.current?.contains(to))) return;
    close();
    if (draft === null) return;
    // Emptied, and one value: that is the reader taking the choice away.
    // Anything else typed that chose nothing is put back.
    if (!multiple && !draft.trim() && values.length) commit([]);
    type(null);
  };

  // A form's reset puts native fields back; the hidden inputs are React's, so
  // an uncontrolled Combobox goes back to its default here (the Select's review).
  const initial = useRef(internal);
  useEffect(() => {
    const form = input.current?.form;
    if (!form || isControlled) return;
    const reset = () => setInternal(initial.current);
    form.addEventListener('reset', reset);
    return () => form.removeEventListener('reset', reset);
  }, [isControlled]);

  const isInvalid = invalid ?? field?.invalid ?? false;
  const start = single?.start ?? iconStart;
  const mark = (option: SelectOption) => {
    if (option.value !== ALL) return values.includes(option.value);
    const count = everyone.filter((o) => values.includes(o.value)).length;
    return count === 0 ? false : count === everyone.length ? true : 'mixed';
  };

  return (
    <div
      className={[
        control.control,
        control[size],
        isInvalid && control.invalid,
        disabled && control.disabled,
        styles.box,
        multiple && styles.many,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ anchorName: anchor, '--floating-anchor': anchor, '--combobox-inset': INSET[size] } as CSSProperties}
      onBlur={onBlur}
      onMouseDown={(event) => {
        // A press on the box that is on none of its controls is a press on the field.
        if (event.target === event.currentTarget) {
          event.preventDefault();
          input.current?.focus();
        }
      }}
    >
      {start && (
        <span className={styles.start} aria-hidden="true">
          {start}
        </span>
      )}

      {multiple &&
        chosen.map((option) => (
          // Its button is out of the tab order: Backspace takes the last away and
          // the list unchecks any of them. As tab stops, six tags would be six
          // stops before the field. The press does not take the focus from it.
          <Tag
            key={option.value}
            size="sm"
            start={option.start}
            disabled={disabled}
            className={styles.tag}
            onRemove={() => commit(values.filter((v) => v !== option.value))}
            removeLabel={removeLabel(option.label)}
            removeProps={{ tabIndex: -1, onMouseDown: (event) => event.preventDefault() }}
          >
            {option.label}
          </Tag>
        ))}

      <input
        ref={input}
        id={id}
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy ?? field?.describedBy}
        aria-invalid={isInvalid || undefined}
        aria-required={(required ?? field?.required) || undefined}
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        disabled={disabled}
        placeholder={multiple && chosen.length ? undefined : placeholder}
        value={text}
        className={`${control.field} ${styles.input}`}
        onChange={(event) => {
          type(event.target.value);
          setOpen(true);
          setFollow(true);
          setBest(true);
        }}
        onFocus={(event) => {
          if (!multiple) event.target.select();
        }}
        onClick={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />

      {clearable && chosen.length > 0 && !disabled && (
        <button
          type="button"
          aria-label={clearLabel}
          className={[styles.clear, multiple && styles.pinned].filter(Boolean).join(' ')}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            commit([]);
            type(null);
            input.current?.focus();
          }}
        >
          <Glyph d={CLOSE} />
        </button>
      )}

      <span
        className={[styles.chevron, multiple && styles.pinned].filter(Boolean).join(' ')}
        aria-hidden="true"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => {
          if (disabled) return;
          input.current?.focus();
          setOpen(!open);
        }}
      >
        <Glyph d={CHEVRON} />
      </span>

      {name !== undefined &&
        (multiple ? values : [values[0] ?? '']).map((v) => (
          <input key={v} type="hidden" name={name} value={v} disabled={disabled} />
        ))}

      {multiple && (
        <span role="status" className={hiddenStyles.hidden}>
          {countLabel(chosen.length)}
        </span>
      )}

      <div
        ref={list}
        id={listId}
        popover="manual"
        role="listbox"
        aria-multiselectable={multiple || undefined}
        // Named by the field, which is named by its label.
        aria-labelledby={ariaLabelledBy ?? id}
        tabIndex={-1}
        className={`${floating.floating} ${styles.list}`}
        // The focus stays in the field: a press in the list must not take it.
        onMouseDown={(event) => event.preventDefault()}
      >
        <OptionList
          listId={listId}
          entries={withAll}
          active={active}
          marks={multiple ? 'checkbox' : 'check'}
          marked={mark}
          query={query}
          status={status}
          onActive={(at) => {
            setFollow(false);
            setBest(false);
            setMoved(rows[at]?.value ?? null);
          }}
          onChoose={choose}
        />
      </div>
    </div>
  );
}
