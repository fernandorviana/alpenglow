'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { FocusEvent, KeyboardEvent } from 'react';
import { Calendar, type CalendarProps, type DateRange } from '../Calendar';
import { dateFormat, utcTimestamp } from '../Calendar/date';
import { useField } from '../Field/FieldContext';
import control from '../control.module.css';
import styles from './DatePicker.module.css';

/** The calendar glyph as drawn: a 24px box, 1.5px stroke. */
function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3.5 8.5h17M7.5 3.5v3m9-3v3M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v12A1.5 1.5 0 0 1 19 20.5H5A1.5 1.5 0 0 1 3.5 19V7A1.5 1.5 0 0 1 5 5.5Z"
        stroke="currentColor"
        style={{ strokeWidth: 'var(--ap-border-width-control)' }}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Shares Button's height scale: 32, 40, 48. */
export type DatePickerSize = 'sm' | 'md' | 'lg';

export type DatePickerProps = Omit<CalendarProps, 'autoFocusDay'> & {
  size?: DatePickerSize;
  invalid?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  id?: string;
  name?: string;
};

export function DatePicker({
  label,
  size = 'md',
  invalid,
  disabled,
  readOnly,
  id,
  name,
  mode = 'single',
  value,
  onSelect,
  locale = 'en-US',
  ...calendar
}: DatePickerProps) {
  const field = useField();
  const isInvalid = invalid ?? field?.invalid ?? false;
  const controlId = id ?? field?.controlId;
  const describedBy = field?.describedBy;
  const required = field?.required;

  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const dialogId = useId();

  // Flips the panel above the field when there is no room below. Measured
  // once on open, not on every render or scroll — a panel that renegotiates
  // its own position while the user is looking at it reads as unstable.
  // jsdom reports zero for both `getBoundingClientRect()` and
  // `window.innerHeight`, so `rect.bottom > window.innerHeight` is never true
  // under the suite; the branch is not asserted here, only in the browser.
  const [above, setAbove] = useState(false);
  useEffect(() => {
    if (!open) return;
    const rect = panelRef.current?.getBoundingClientRect();
    setAbove(Boolean(rect && rect.bottom > window.innerHeight));
  }, [open]);

  // The only place a formatter is built for this component: it goes through
  // `dateFormat`, which pins the zone to UTC, so the trigger's label and the
  // field's display text read the same calendar day the grid drew — not the
  // day before it for anyone west of UTC.
  const formatter = useMemo(
    () => dateFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' }),
    [locale],
  );

  const single = typeof value === 'string' ? value : null;
  const range = value !== null && typeof value === 'object' ? (value as DateRange) : null;

  const display = single
    ? formatter.format(utcTimestamp(single))
    : range?.end
      ? `${formatter.format(utcTimestamp(range.start))} – ${formatter.format(utcTimestamp(range.end))}`
      : range
        ? formatter.format(utcTimestamp(range.start))
        : '';

  function close({ restoreFocus = true } = {}) {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  }

  // Dismiss on a pointer press outside. `pointerdown` and not `click`, so a
  // press that starts outside and ends inside cannot resurrect the panel.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  // Dismiss when focus leaves the subtree entirely — a screen reader's
  // virtual cursor, or a Tab that escapes despite the trap below. A null
  // `relatedTarget` (a press on non-focusable panel text, or a pagination
  // button disabling itself under focus) must NOT close: outside pointer
  // presses are already covered by the listener above, and closing here too
  // would fight it. Focus is not restored to the trigger — wherever the user
  // or the assistive tech sent focus is where it should stay.
  function handleWrapperBlur(event: FocusEvent<HTMLDivElement>) {
    if (!open) return;
    const next = event.relatedTarget;
    if (next && !wrapperRef.current?.contains(next)) {
      setOpen(false);
    }
  }

  // Escape and Tab both need the panel element and the keyboard event, so one
  // handler covers both rather than two separate listeners.
  function handlePanelKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      // Calendar stops propagation when it has a pending range start, so the
      // first Escape drops that and only the second reaches here.
      event.stopPropagation();
      close();
      return;
    }

    if (event.key !== 'Tab') return;

    // The dialog's tabbables, in DOM order: enabled buttons that are not
    // roving-tabindex losers. In practice that is Previous, Next — both in
    // the header, outside the table — and the grid's one tab stop.
    const tabbables = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>('button'),
    ).filter((button) => !button.disabled && button.tabIndex !== -1);
    if (tabbables.length === 0) return;

    const first = tabbables[0]!;
    const last = tabbables[tabbables.length - 1]!;

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div className={styles.wrapper} ref={wrapperRef} onBlur={handleWrapperBlur}>
      <div
        className={[
          control.control,
          control[size],
          isInvalid && control.invalid,
          disabled && control.disabled,
          readOnly && control.readOnly,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <input
          id={controlId}
          name={name}
          className={control.field}
          value={display}
          placeholder="MM / DD / YYYY"
          disabled={disabled}
          readOnly
          required={required}
          aria-invalid={isInvalid || undefined}
          aria-describedby={describedBy}
          // Inside a Field the label element already names the input; adding
          // this too would give it a redundant accessible name. A bare
          // DatePicker has no such label, so it names itself.
          aria-label={field ? undefined : label}
        />
        <button
          type="button"
          ref={triggerRef}
          className={styles.trigger}
          // The name confirms the value, so a screen reader user does not have
          // to read the field to know what is in it.
          aria-label={display ? `Change date, ${display}` : 'Choose date'}
          aria-expanded={open}
          aria-controls={open ? dialogId : undefined}
          disabled={disabled || readOnly}
          onClick={() => setOpen((was) => !was)}
        >
          <CalendarIcon />
        </button>
      </div>

      {open && (
        <div
          id={dialogId}
          role="dialog"
          aria-modal="true"
          aria-label={label}
          ref={panelRef}
          className={[styles.panel, above && styles.above].filter(Boolean).join(' ')}
          onKeyDown={handlePanelKeyDown}
        >
          <Calendar
            {...calendar}
            label={label}
            mode={mode}
            value={value}
            locale={locale}
            autoFocusDay
            onSelect={(next) => {
              onSelect?.(next);
              // A single date is complete on the first click. A range is not:
              // closing on the first would make the second unreachable.
              const complete =
                mode === 'single' ||
                (next !== null && typeof next === 'object' && next.end !== null);
              if (complete) close();
            }}
          />
        </div>
      )}
    </div>
  );
}
