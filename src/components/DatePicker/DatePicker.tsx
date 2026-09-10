'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { CSSProperties, FocusEvent, KeyboardEvent, ToggleEvent } from 'react';
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

export type DatePickerProps = CalendarProps & {
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
  // Remounts the Calendar on every open so a pending range start, or a page
  // to a different month, does not survive into the next open — the grid
  // should always resume from the resolved month, not wherever it was left.
  const [openCount, setOpenCount] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  // useId returns a value containing characters that are legal in an HTML id
  // and not in a CSS identifier, so the anchor name is sanitised separately.
  const anchor = `--picker-${panelId.replace(/[^a-zA-Z0-9]/g, '')}`;

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
    panelRef.current?.hidePopover();
    if (restoreFocus) triggerRef.current?.focus();
  }

  // Dismiss on a pointer press outside. `pointerdown` and not `click`, so a
  // press that starts outside and ends inside cannot resurrect the panel.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        close({ restoreFocus: false });
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
      close({ restoreFocus: false });
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
        style={{ anchorName: anchor }}
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
          // The panel is always in the DOM now, so this no longer depends on
          // `open` the way the id used to.
          aria-controls={panelId}
          disabled={disabled || readOnly}
          popoverTarget={panelId}
        >
          <CalendarIcon />
        </button>
      </div>

      {/*
       * `manual`, not `auto`: dismissal stays in this component's own tested
       * handlers (Esc — including the range-mode layering where the first
       * Esc only cancels a pending start — a pointer press outside, and focus
       * leaving the subtree). With `auto` the Esc layering would depend on
       * the platform's close request, which jsdom cannot run and which a
       * browser automation tool cannot send either.
       */}
      <div
        id={panelId}
        popover="manual"
        role="dialog"
        aria-modal="true"
        aria-label={label}
        ref={panelRef}
        className={styles.panel}
        style={{ '--picker-anchor': anchor } as CSSProperties}
        onKeyDown={handlePanelKeyDown}
        onToggle={(event: ToggleEvent) => {
          const isOpen = event.newState === 'open';
          setOpen(isOpen);
          if (isOpen) {
            // A popover moves focus only to an element carrying `autofocus`,
            // so a panel opened by a click has to place it itself: the day
            // grid's roving tab stop, the same target Calendar's own
            // mount-time focus used before it moved here.
            panelRef.current
              ?.querySelector<HTMLButtonElement>('[role="grid"] button[tabindex="0"]')
              ?.focus();
          } else {
            setOpenCount((count) => count + 1);
          }
        }}
      >
        <Calendar
          key={openCount}
          {...calendar}
          label={label}
          mode={mode}
          value={value}
          locale={locale}
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
    </div>
  );
}
