'use client';

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type {
  ChangeEvent,
  CompositionEvent,
  CSSProperties,
  FocusEvent,
  KeyboardEvent,
  ToggleEvent,
} from 'react';
import { Calendar, type CalendarProps, type DateRange } from '../Calendar';
import { dateFormat, utcTimestamp } from '../Calendar/date';
import { useField } from '../Field/FieldContext';
import { useHydrated } from '../useHydrated';
import control from '../control.module.css';
import {
  applyMask,
  caretIndex,
  dateShape,
  digitsFor,
  formatValue,
  hintFor,
  insertedRange,
  normaliseDigits,
  placeholderFor,
  readValue,
  replaceWholeIso,
  typedSeparators,
  RANGE_SEPARATOR,
  type DatePickerInvalidReason,
} from './mask';
import styles from './DatePicker.module.css';

export type { DatePickerInvalidReason } from './mask';

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

/**
 * What the browser says when a form is submitted over an invalid draft. Short
 * and generic: the caller's own message, with the field's name and its bounds
 * in it, is the one on screen — this is the native gate behind it.
 */
const VALIDITY_MESSAGE: Record<DatePickerInvalidReason, string> = {
  incomplete: 'Enter a complete date',
  'not-a-date': 'Enter a date that exists',
  'before-min': 'Enter a later date',
  'after-max': 'Enter an earlier date',
  unavailable: 'Enter an available date',
};

export type DatePickerProps = CalendarProps & {
  size?: DatePickerSize;
  invalid?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  id?: string;
  /**
   * Submitted through a hidden input, as ISO: the date in single mode, the
   * interval `start/end` in range mode, `''` with no value. Not the field's
   * display text, which follows the locale's digit order.
   */
  name?: string;
  required?: boolean;
  'aria-describedby'?: string;
  /**
   * Fires when an evaluation finds the typed text is not a date this picker
   * accepts. The field evaluates when the digits of a complete date (or
   * range) are in, on blur and on Enter — never on half a date, which is
   * unfinished rather than wrong. `raw` is the field's text; the caller turns
   * `reason` into the Field's `error`.
   */
  onInvalid?: (raw: string, reason: DatePickerInvalidReason) => void;
};

export function DatePicker({
  label,
  size = 'md',
  invalid,
  disabled,
  readOnly,
  id,
  name,
  required: requiredProp,
  'aria-describedby': describedByProp,
  mode = 'single',
  value,
  onSelect,
  onInvalid,
  locale = 'en-US',
  min,
  max,
  isDateUnavailable,
  ...calendar
}: DatePickerProps) {
  // A surrounding Field supplies the id and the wiring. Explicit props still
  // win, as they do in Input: the caller is being more specific than the wrapper.
  const field = useField();
  const isInvalid = invalid ?? field?.invalid ?? false;
  const controlId = id ?? field?.controlId;
  const describedBy = describedByProp ?? field?.describedBy;
  const required = requiredProp ?? field?.required;

  const hydrated = useHydrated();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const panelId = useId();
  // useId returns a value containing characters that are legal in an HTML id
  // and not in a CSS identifier, so the anchor name is sanitised separately.
  const anchor = `--picker-${panelId.replace(/[^a-zA-Z0-9]/g, '')}`;

  // The only place a formatter is built for this component: it goes through
  // `dateFormat`, which pins the zone to UTC, so the trigger's label reads the
  // same calendar day the grid drew — not the day before it for anyone west
  // of UTC.
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
      ? `${formatter.format(utcTimestamp(range.start))}${RANGE_SEPARATOR}${formatter.format(utcTimestamp(range.end))}`
      : '';

  // What a native form submits: ISO, never the display text, whose digit
  // order is the locale's and is the ambiguity this component exists to
  // avoid. A range is an ISO 8601 interval.
  const isoValue = single ?? (range ? `${range.start}/${range.end}` : '');

  // The locale's order and separator, read once per locale. The placeholder,
  // the formatted value and the mask all come from this one shape, so the
  // field can never show a date it would then read back differently.
  const shape = useMemo(() => dateShape(locale), [locale]);
  const fieldText = formatValue(value, shape);
  const placeholder = placeholderFor(shape, mode);

  // What the user is typing, as the mask has framed it. `null` means the field
  // shows the formatted value rather than a draft.
  const [draft, setDraft] = useState<string | null>(null);
  const [invalidReason, setInvalidReason] = useState<DatePickerInvalidReason | null>(null);
  const text = draft ?? fieldText;

  const editable = !disabled && !readOnly;
  const hint = hintFor(shape, mode);
  const hintId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [composing, setComposing] = useState(false);

  // A field too narrow for its text scrolls it, and a shell drawn behind a
  // scrolled input would sit misaligned — so it is not drawn then. Measured
  // after every change of text.
  const [overflowing, setOverflowing] = useState(false);
  useLayoutEffect(() => {
    const input = inputRef.current;
    if (input) setOverflowing(input.scrollWidth > input.clientWidth);
  }, [text]);

  // The part of the format still to type. Every formatted character lines up
  // with one placeholder character, so what is left is the placeholder past
  // the text's length. Not drawn mid-composition, when the text is the IME's.
  const remainder =
    editable && !composing && !overflowing ? placeholder.slice(text.length) : '';

  // The value stays as it was while the text is wrong — but a plain <form>
  // must not post that value under a field showing a date the user cannot
  // see. Native validity is the gate a form reads before it submits, so the
  // draft's reason is written there too, and cleared with it. A form with
  // `novalidate` has opted out of that gate and has `onInvalid` instead.
  useEffect(() => {
    inputRef.current?.setCustomValidity(invalidReason ? VALIDITY_MESSAGE[invalidReason] : '');
  }, [invalidReason]);

  // A value that changes from outside — a calendar pick, or the parent —
  // replaces whatever was mid-typed. Adjusted during render, React's
  // documented pattern for state that follows a changed prop, so a stale
  // draft never paints.
  const [seenValue, setSeenValue] = useState(isoValue);
  if (isoValue !== seenValue) {
    setSeenValue(isoValue);
    setDraft(null);
    setInvalidReason(null);
  }

  // The field's text when an IME composition began, or null outside one. The
  // mask waits for the composition to end: rewriting the value mid-way would
  // fight the IME for the same characters.
  const composingFrom = useRef<string | null>(null);
  // The draft when that composition began. Restored before `edit` runs, so a
  // composition the mask refuses — or one that nets out to no change — never
  // leaves raw, IME-authored characters sitting in the field. When `edit`
  // accepts the composition, its own `setDraft` runs afterward in the same
  // handler and wins.
  const composingDraft = useRef<string | null>(null);

  /**
   * Ends in exactly one call: `onSelect` with a value, `onSelect(null)` for an
   * emptied field, or `onInvalid` with a reason. A caller clears its message
   * in the first two and writes it in the third, and needs nothing else.
   */
  function evaluate(current: string) {
    const digits = normaliseDigits(current);
    if (digits === '') {
      setDraft(null);
      setInvalidReason(null);
      onSelect?.(null);
      return;
    }
    const result = readValue(digits, shape, mode, { min, max, isDateUnavailable });
    if ('reason' in result) {
      // The text stays as typed and the value stays as it was: the user knows
      // more about what they meant than the reader does.
      setInvalidReason(result.reason);
      onInvalid?.(current, result.reason);
      return;
    }
    setDraft(null);
    setInvalidReason(null);
    // Called even when the value is unchanged, so a caller's error message
    // clears when a mistyped date is corrected back to the one it held.
    onSelect?.(result.value);
  }

  /**
   * Rebuilds the field from its digits after any edit — typing, a paste, a
   * deletion, autofill, the end of a composition — instead of intercepting
   * keys, which Android keyboards report as `Unidentified`. See invariant 18.
   */
  function edit(input: HTMLInputElement, previous: string, inputType: string | undefined) {
    const raw = input.value;
    const selection = input.selectionStart ?? raw.length;
    const previousDigits = normaliseDigits(previous);
    let digits = normaliseDigits(replaceWholeIso(raw, shape));
    let before = normaliseDigits(raw.slice(0, selection)).length;

    // The edit removed a separator and no digit. Putting the separator back
    // would make the key do nothing, so the digit beside it goes instead.
    if (digits === previousDigits && raw.length < previous.length) {
      if (inputType === 'deleteContentBackward' && before > 0) {
        digits = digits.slice(0, before - 1) + digits.slice(before);
        before -= 1;
      } else if (inputType === 'deleteContentForward') {
        digits = digits.slice(0, before) + digits.slice(before + 1);
      }
    }

    // What the edit inserted: its digits, anchored at the caret, and any
    // separator it typed, which completes a lone day or month digit.
    const masked = applyMask(digits, shape, mode, {
      ...insertedRange(previousDigits, digits, before),
      separators: typedSeparators(previous, raw, selection, shape),
    });

    // A rejected edit leaves the text as it was, with the caret back where the
    // edit began. React restores a controlled input's value after this handler
    // returns, which would put the caret at the end, so it is placed in a
    // microtask, after that.
    const caret = masked
      ? caretIndex(masked.text, masked.acceptedAfter[Math.min(before, digits.length)]!)
      : Math.max(0, selection - (raw.length - previous.length));
    queueMicrotask(() => {
      if (document.activeElement === input) input.setSelectionRange(caret, caret);
    });

    if (!masked || masked.text === previous) return;
    setDraft(masked.text);
    if (masked.digits.length === digitsFor(mode)) evaluate(masked.text);
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
          type="hidden"
          name={name}
          value={isoValue}
          // A disabled control submits nothing, as a disabled input would.
          disabled={disabled}
        />
        <span className={styles.entry}>
          {remainder && (
            <span className={styles.shell} aria-hidden="true">
              <span className={styles.typed}>{text}</span>
              {remainder}
            </span>
          )}
          <input
            ref={inputRef}
            id={controlId}
            className={control.field}
            type="text"
            // A numeric keypad on a phone. Not type="number", which takes `e`
            // and `-`, steps with the arrow keys, and has no room for a separator.
            inputMode="numeric"
            // The browser's autofill knows nothing of this mask.
            autoComplete="off"
            value={text}
            // The shell draws the format while the field can be typed into;
            // the native placeholder is the fallback when it cannot.
            placeholder={editable ? undefined : placeholder}
            disabled={disabled}
            readOnly={readOnly}
            required={required}
            aria-invalid={isInvalid || invalidReason !== null || undefined}
            // The Field's description and error first, then how to type.
            aria-describedby={
              [describedBy, editable ? hintId : null].filter(Boolean).join(' ') || undefined
            }
            // Inside a Field the label element already names the input; adding
            // this too would give it a redundant accessible name. A bare
            // DatePicker has no such label, so it names itself.
            aria-label={field ? undefined : label}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              if (composingFrom.current !== null) {
                setDraft(event.target.value);
                return;
              }
              edit(event.target, text, (event.nativeEvent as InputEvent).inputType);
            }}
            onCompositionStart={() => {
              composingFrom.current = text;
              composingDraft.current = draft;
              setComposing(true);
            }}
            onCompositionEnd={(event: CompositionEvent<HTMLInputElement>) => {
              const previous = composingFrom.current ?? text;
              composingFrom.current = null;
              setComposing(false);
              // Restore the pre-composition draft first: a composition `edit`
              // refuses, or that nets out unchanged, returns before touching
              // `draft`, so without this the raw composed text — even a bare
              // non-digit — would stay in the field. An accepted edit's own
              // `setDraft` below still wins; both run in this one handler.
              setDraft(composingDraft.current);
              edit(event.currentTarget, previous, 'insertCompositionText');
            }}
            onBlur={() => {
              // A blur mid-composition (rare, but IMEs can commit on blur)
              // must not evaluate the still-uncommitted composition text.
              if (composingFrom.current !== null) return;
              if (draft !== null) evaluate(draft);
            }}
            onKeyDown={(event) => {
              if (
                event.key !== 'Enter' ||
                event.nativeEvent.isComposing ||
                // Safari sends the Enter that commits a composition afterward,
                // with keyCode 229 and isComposing already false, so that flag
                // alone would miss it.
                event.keyCode === 229 ||
                composingFrom.current !== null
              ) {
                return;
              }
              event.preventDefault();
              if (draft !== null) evaluate(draft);
            }}
          />
        </span>
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
          // Only once hydrated. Before that, a native popovertarget would open
          // the panel while React is not listening: `open` would stay false,
          // the Calendar unmounted, and the panel empty until two more clicks.
          popoverTarget={hydrated ? panelId : undefined}
        >
          <CalendarIcon />
        </button>
      </div>

      {editable && (
        // In words, because a screen reader reads "DD/MM/YYYY" letter by
        // letter. A digit the mask refuses is silent — announcing each one
        // would talk over the reader's own echo of the key — so this states
        // the rule before anyone meets it.
        <span id={hintId} className="ap-sr-only">
          {hint}
        </span>
      )}

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
        // A popover moves focus only to an element carrying `autofocus`, so a
        // panel opened by a click has to place it itself: the day grid's
        // roving tab stop. That has to wait for `toggle` rather than run from
        // the `beforetoggle` state update above — that update's effects can
        // commit, focusing a button, before the platform has shown the panel,
        // and focus() on a still-hidden element is a no-op.
        onToggle={(event: ToggleEvent) => {
          if (event.newState !== 'open') return;
          panelRef.current
            ?.querySelector<HTMLButtonElement>('[role="grid"] button[tabindex="0"]')
            ?.focus();
        }}
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
              // draft it replaces, and any invalid state attached to it.
              setDraft(null);
              setInvalidReason(null);
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
