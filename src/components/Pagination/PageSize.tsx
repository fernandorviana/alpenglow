'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent } from 'react';
import { ChevronSmallDown } from '../../icons';
import floating from '../floating.module.css';
import styles from './Pagination.module.css';

export type PageSizeProps = {
  value: number;
  options: readonly number[];
  max: number;
  label: string;
  onChange: (size: number) => void;
};

/**
 * The page size, inside the sentence that reports it: a number that can be
 * typed or picked. The APG's editable combobox with `aria-autocomplete="none"`
 * — the list suggests, it does not filter, and a value outside it is allowed.
 *
 * Not `<datalist>`: its list takes no CSS, does not follow page zoom, and is
 * not announced by NVDA with Firefox. Not `type="number"`: spinners, a wheel
 * that changes the value, and "e", "+" and "-" accepted as digits.
 *
 * Private to the Pagination until the second wave's Combobox.
 */
export function PageSize({ value, options: offered, max, label, onChange }: PageSizeProps) {
  // Nothing above the ceiling is offered: picking it would commit the ceiling and say nothing.
  const options = offered.filter((option) => option >= 1 && option <= max);
  const uid = useId();
  const listId = `${uid}-sizes`;
  // useId's output is valid in an id and not in a CSS identifier.
  const anchor = `--page-size-${uid.replace(/[^a-zA-Z0-9]/g, '')}`;

  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLSpanElement>(null);
  const shown = useRef(false);

  // What is being typed, until it is committed. null: the field shows `value`.
  const [draft, setDraft] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const text = draft ?? String(value);

  // The platform holds the popover's state and throws when told what it
  // already knows, so what it was last told is kept beside it.
  useEffect(() => {
    if (!list.current || shown.current === open) return;
    shown.current = open;
    if (open) list.current.showPopover();
    else list.current.hidePopover();
  }, [open]);

  const close = () => {
    setOpen(false);
    setActive(-1);
  };

  const commit = (raw: string | number) => {
    const next = typeof raw === 'number' ? raw : Number.parseInt(raw, 10);
    setDraft(null);
    close();
    // Anything that is not a whole number of 1 or more puts the old value
    // back, with no error: there is nothing here the reader has to fix.
    if (!Number.isFinite(next) || next < 1) return;
    const size = Math.min(next, max);
    if (size !== value) onChange(size);
  };

  const move = (step: 1 | -1) => {
    // Nothing to suggest: the field still takes any number.
    if (!options.length) return;
    setOpen(true);
    setActive((at) => {
      // The first press lands on the size in use, when it is one of the options.
      if (at === -1) {
        const current = options.indexOf(value);
        return current === -1 ? (step === 1 ? 0 : options.length - 1) : current;
      }
      return (at + step + options.length) % options.length;
    });
  };

  const onKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp':
        event.preventDefault();
        // Alt and an arrow shows the list and leaves the choice where it is.
        if (event.altKey) setOpen(options.length > 0);
        else move(event.key === 'ArrowDown' ? 1 : -1);
        break;
      case 'Enter':
        event.preventDefault();
        commit(open && active >= 0 ? options[active]! : text);
        break;
      case 'Escape':
        // First the list, then the typing. An Esc that did either was for
        // this field, and must not go on to close a Dialog around it.
        if (open) {
          event.preventDefault();
          close();
        } else if (draft !== null) {
          event.preventDefault();
          setDraft(null);
        }
        break;
    }
  };

  return (
    <span
      className={styles.size}
      style={{ '--page-size-anchor': anchor, '--floating-anchor': anchor, '--page-size-digits': Math.max(1, text.length) } as CSSProperties}
    >
      <input
        ref={input}
        className={styles.sizeInput}
        role="combobox"
        aria-label={label}
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="none"
        aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
        inputMode="numeric"
        autoComplete="off"
        value={text}
        onChange={(event) => {
          setDraft(event.target.value.replace(/\D/g, '').slice(0, String(max).length));
          // What is typed is the choice now: Enter must not take an option
          // that was highlighted before the typing began.
          setActive(-1);
        }}
        onFocus={(event) => event.target.select()}
        onBlur={() => commit(text)}
        onKeyDown={onKeyDown}
      />
      {/* For the pointer only: the keyboard has the arrows. The press is
          cancelled so the field keeps the focus and does not commit on blur. */}
      {options.length > 0 && (
        <span
          className={styles.sizeChevron}
          aria-hidden="true"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            input.current?.focus();
            if (open) close();
            else setOpen(true);
          }}
        >
          <ChevronSmallDown size={16} />
        </span>
      )}
      {/* Spans all the way down, as in the Tooltip: the field lives in a
          sentence, a caller's sentence may be a `p`, and a `ul` inside a `p`
          is closed early by the parser, so the server's markup would not be
          the markup React hydrates. The roles make it a list. */}
      <span ref={list} id={listId} role="listbox" aria-label={label} popover="manual" className={`${floating.floating} ${styles.sizeList}`}>
        {options.map((option, index) => (
          <span
            key={option}
            id={`${listId}-${index}`}
            role="option"
            aria-selected={option === value}
            className={[styles.sizeOption, index === active && styles.sizeOptionActive].filter(Boolean).join(' ')}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => commit(option)}
          >
            {option}
            {/* Carbon's checkmark, on its 32 grid. Apache-2.0, © IBM. */}
            {option === value && (
              <svg viewBox="0 0 32 32" width="16" height="16" fill="currentColor" aria-hidden="true" focusable="false">
                <path d="M13 24 4 15 5.414 13.586 13 21.171 26.586 7.586 28 9 13 24z" />
              </svg>
            )}
          </span>
        ))}
      </span>
    </span>
  );
}
