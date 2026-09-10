'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { CSSProperties, FocusEvent, KeyboardEvent, ToggleEvent } from 'react';
import { Calendar, type CalendarProps, type DateRange } from '../Calendar';
import {
  dateFormat,
  formatTyped,
  isWithin,
  parseTyped,
  placeholderFor,
  utcTimestamp,
} from '../Calendar/date';
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
  /**
   * Fires when the typed text is not a date, or is a date the calendar would
   * refuse — outside `min`/`max`, or excluded by `isDateUnavailable`.
   */
  onParseError?: (raw: string) => void;
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
  onParseError,
  locale = 'en-US',
  min,
  max,
  isDateUnavailable,
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

  // A popover moves focus only to an element carrying `autofocus`, so a panel
  // opened by a click has to place it itself: the day grid's roving tab stop.
  // An effect on `open`, because the grid only exists once `open` renders it.
  useEffect(() => {
    if (!open) return;
    panelRef.current
      ?.querySelector<HTMLButtonElement>('[role="grid"] button[tabindex="0"]')
      ?.focus();
  }, [open]);
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

  // Spoken form, for the trigger's accessible name: always the long form,
  // regardless of what the field itself is showing.
  const spokenText = single
    ? formatter.format(utcTimestamp(single))
    : range
      ? `${formatter.format(utcTimestamp(range.start))} – ${formatter.format(utcTimestamp(range.end))}`
      : '';

  // Field form: the locale's own digit order, so the placeholder, the field
  // and `parseTyped` all agree on what a typed date looks like.
  const fieldText = single
    ? formatTyped(single, locale)
    : range
      ? `${formatTyped(range.start, locale)} – ${formatTyped(range.end, locale)}`
      : '';

  // What the user has typed but not yet committed. `null` means the field is
  // showing the formatted value rather than a draft.
  const [draft, setDraft] = useState<string | null>(null);
  const [parseFailed, setParseFailed] = useState(false);

  function commit() {
    if (draft === null) return;
    if (draft.trim() === '') {
      setDraft(null);
      setParseFailed(false);
      onSelect?.(null);
      return;
    }
    const parsed = parseTyped(draft, locale);
    // A date the calendar would refuse — outside min/max, or excluded by
    // isDateUnavailable — is rejected exactly like one that does not parse:
    // both are "not a date this picker will accept".
    const refused =
      parsed === null || !isWithin(parsed, min, max) || Boolean(isDateUnavailable?.(parsed));
    if (refused) {
      setParseFailed(true);
      onParseError?.(draft);
      return;
    }
    setDraft(null);
    setParseFailed(false);
    onSelect?.(parsed);
  }

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
          value={draft ?? fieldText}
          placeholder={placeholderFor(locale)}
          disabled={disabled}
          // A range needs two locale-ordered dates in one free-text field, and
          // `-` is both a date separator and a range separator — so a typed
          // range would be ambiguous in exactly the locales that use it as
          // either. The calendar stays the only way to set one.
          readOnly={readOnly || mode === 'range'}
          required={required}
          aria-invalid={isInvalid || parseFailed || undefined}
          aria-describedby={describedBy}
          // Inside a Field the label element already names the input; adding
          // this too would give it a redundant accessible name. A bare
          // DatePicker has no such label, so it names itself.
          aria-label={field ? undefined : label}
          onChange={(event) => {
            setDraft(event.target.value);
            // Not validated per keystroke: half a date is unfinished, not
            // wrong, and marking it invalid mid-word is noise.
            setParseFailed(false);
          }}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              commit();
            }
          }}
        />
        <button
          type="button"
          ref={triggerRef}
          className={styles.trigger}
          // The name confirms the value, so a screen reader user does not have
          // to read the field to know what is in it. Always the long form,
          // even while the field itself holds an uncommitted draft.
          aria-label={spokenText ? `Change date, ${spokenText}` : 'Choose date'}
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
        // `beforetoggle`, not `toggle`: the platform fires it synchronously,
        // before the panel shows. `toggle` is queued as a task, so the panel
        // could paint empty for a frame before the Calendar mounted.
        onBeforeToggle={(event: ToggleEvent) => setOpen(event.newState === 'open')}
      >
        {/* Mounted only while open. Kept mounted in the hidden panel, the
            build month reached the server HTML of a picker with no value, a
            closed picker reopened on the month it was left on rather than
            its current value, and a hidden grid re-rendered on every
            keystroke. Unmounting on close is also what discards a pending
            range start. */}
        {open && (
          <Calendar
            {...calendar}
            label={label}
            mode={mode}
            value={value}
            locale={locale}
            min={min}
            max={max}
            isDateUnavailable={isDateUnavailable}
            onSelect={(next) => {
              // A calendar pick always wins over whatever was mid-typed: the
              // draft it is replacing, and any parse failure attached to it.
              setDraft(null);
              setParseFailed(false);
              onSelect?.(next);
              // Calendar reports only a finished choice — a single date, or a
              // range with both ends — so every report closes the panel.
              close();
            }}
          />
        )}
      </div>
    </div>
  );
}
