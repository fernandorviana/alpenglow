'use client';

import { useEffect, useId, useState } from 'react';
import type { CSSProperties, KeyboardEvent, ReactNode, ToggleEvent } from 'react';
import { useField } from '../Field/FieldContext';
import { useHydrated } from '../useHydrated';
import type { ControlSize } from '../vocabulary';
import control from '../control.module.css';
import floating from '../floating.module.css';
import { OptionList } from '../listbox/OptionList';
import { first, flatten, last, match, step } from '../listbox/options';
import type { SelectEntry } from '../listbox/options';
import styles from './Select.module.css';

export type SelectProps = {
  options: readonly SelectEntry[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Shown while nothing is chosen. */
  placeholder?: string;
  size?: ControlSize;
  invalid?: boolean;
  disabled?: boolean;
  required?: boolean;
  /** Submits the value with a form, through a hidden input. */
  name?: string;
  id?: string;
  /** Before the value, unless the chosen option brings its own `start`. */
  iconStart?: ReactNode;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  className?: string;
};

/** Carbon's chevron, on its 32 grid. Apache-2.0, © IBM. */
const CHEVRON = 'M16 22 6 12 7.4 10.6 16 19.2 24.6 10.6 26 12z';
const Glyph = ({ d }: { d: string }) => (
  <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true" focusable="false">
    <path d={d} />
  </svg>
);

/**
 * A button that shows a choice and opens a list to change it: the APG's
 * select-only combobox, on the floating surface the menu stands on. The
 * keyboard's focus stays on the button and the list's active option is named
 * to it, so there is one tab stop and nothing to give the focus back to.
 *
 * It is the system's own list and not the platform's, decided 2026-09-21
 * (docs/superpowers/specs/2026-09-21-select-design.md): an option can hold an
 * Avatar or a code in bold, and the list is the same in every browser. The
 * platform's is `NativeSelect`.
 */
export function Select({
  options: entries,
  value: controlled,
  defaultValue = '',
  onChange,
  placeholder,
  size = 'md',
  invalid,
  disabled = false,
  required,
  name,
  id: ownId,
  iconStart,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  className,
}: SelectProps) {
  const field = useField();
  const hydrated = useHydrated();
  const base = useId();
  const id = ownId ?? field?.controlId ?? `${base}select`;
  const listId = `${base}list`;
  // useId's colons are not valid in a dashed ident.
  const anchor = `--select-${base.replace(/[^a-zA-Z0-9]/g, '')}`;

  const options = flatten(entries);
  const [internal, setInternal] = useState(defaultValue);
  const value = controlled !== undefined ? controlled : internal;
  const chosen = options.findIndex((option) => option.value === value);
  const selected = chosen === -1 ? undefined : options[chosen];

  // The element as state, not a ref: its handlers are the button's, and a ref
  // read on the way to a handler is one the Compiler lint refuses.
  const [list, setList] = useState<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  // Whether the list follows the active option. The keyboard's moves do; the
  // pointer's do not, or an option half in view would be scrolled under the
  // pointer, make the next one active, and run the list to its end.
  const [follow, setFollow] = useState(false);
  const [hidden, setHidden] = useState<HTMLInputElement | null>(null);

  const go = (at: number | ((was: number) => number)) => {
    setFollow(true);
    setActive(at);
  };
  // Not show and hide, which throw on a popover already there or already gone:
  // `open` is a task behind the platform.
  const show = (at: number) => {
    go(at);
    list?.togglePopover(true);
  };
  const hide = () => list?.togglePopover(false);
  const choose = (at: number) => {
    const option = options[at];
    hide();
    if (!option || option.disabled || option.value === value) return;
    if (controlled === undefined) setInternal(option.value);
    onChange?.(option.value);
  };

  // Keeps the active option in view in a list long enough to scroll.
  useEffect(() => {
    if (!open || !follow || active < 0) return;
    list?.querySelector(`[data-index="${active}"]`)?.scrollIntoView?.({ block: 'nearest' });
  }, [open, follow, active, list]);

  // A form's reset puts native fields back; the hidden input is React's, so an
  // uncontrolled Select goes back to its default here.
  const form = hidden?.form;
  useEffect(() => {
    if (!form || controlled !== undefined) return;
    const reset = () => setInternal(defaultValue);
    form.addEventListener('reset', reset);
    return () => form.removeEventListener('reset', reset);
  }, [form, controlled, defaultValue]);

  const resting = () => (chosen !== -1 && !options[chosen]!.disabled ? chosen : first(options));

  const onKeyDown = (event: KeyboardEvent) => {
    const { key } = event;
    if (!open) {
      if (key === 'ArrowDown' || key === 'ArrowUp' || key === 'Enter' || key === ' ') {
        event.preventDefault();
        show(resting());
      } else if (key === 'Home' || key === 'End') {
        event.preventDefault();
        show(key === 'Home' ? first(options) : last(options));
      } else if (key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
        const found = match(options, chosen, key);
        if (found >= 0) show(found);
      }
      return;
    }
    switch (key) {
      case 'ArrowDown':
      case 'ArrowUp':
        event.preventDefault();
        // Alt and Up is the APG's "choose and close".
        if (event.altKey && key === 'ArrowUp') choose(active);
        else go((at) => step(options, at, key === 'ArrowDown' ? 1 : -1));
        return;
      case 'Home':
      case 'End':
        event.preventDefault();
        go(key === 'Home' ? first(options) : last(options));
        return;
      case 'Enter':
      case ' ':
        event.preventDefault();
        choose(active);
        return;
      case 'Tab':
        // Chooses and moves on: the default is left alone.
        choose(active);
        return;
      case 'Escape':
        // This Esc was for the list, and must not go on to a Dialog around it.
        event.preventDefault();
        event.stopPropagation();
        hide();
        return;
    }
    if (key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
      const found = match(options, active, key);
      if (found >= 0) go(found);
    }
  };

  const isInvalid = invalid ?? field?.invalid ?? false;
  const start = selected?.start ?? iconStart;

  return (
    <>
      <button
        type="button"
        id={id}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy ?? field?.describedBy}
        aria-invalid={isInvalid || undefined}
        aria-required={(required ?? field?.required) || undefined}
        disabled={disabled}
        // Only once hydrated, for the menu's reason: a native open before React
        // listens would leave `aria-expanded` denying a list on screen.
        popoverTarget={hydrated ? listId : undefined}
        className={[control.control, control[size], isInvalid && control.invalid, disabled && control.disabled, styles.trigger, className]
          .filter(Boolean)
          .join(' ')}
        style={{ anchorName: anchor } as CSSProperties}
        onKeyDown={onKeyDown}
      >
        {start && (
          <span className={styles.start} aria-hidden="true">
            {start}
          </span>
        )}
        <span className={[styles.value, !selected && styles.placeholder].filter(Boolean).join(' ')}>
          {selected ? (selected.content ?? selected.label) : placeholder}
        </span>
        <span className={styles.chevron}>
          <Glyph d={CHEVRON} />
        </span>
      </button>

      {name !== undefined && <input ref={setHidden} type="hidden" name={name} value={value} disabled={disabled} />}

      <div
        ref={setList}
        id={listId}
        popover="auto"
        role="listbox"
        aria-labelledby={ariaLabelledBy ?? id}
        tabIndex={-1}
        className={`${floating.floating} ${styles.list}`}
        style={{ '--floating-anchor': anchor } as CSSProperties}
        // The focus stays on the button: a press in the list must not take it.
        onMouseDown={(event) => event.preventDefault()}
        onToggle={(event: ToggleEvent) => {
          const isOpen = event.newState === 'open';
          setOpen(isOpen);
          // Opened by the pointer, nothing was made active on the way.
          if (isOpen) go((at) => (at >= 0 ? at : resting()));
          else setActive(-1);
        }}
      >
        <OptionList
          listId={listId}
          entries={entries}
          active={active}
          marks="check"
          marked={(option) => option.value === value}
          onActive={(at) => {
            setFollow(false);
            setActive(at);
          }}
          onChoose={choose}
        />
      </div>
    </>
  );
}
