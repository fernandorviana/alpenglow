'use client';

import { useId, useState } from 'react';
import type { CSSProperties } from 'react';
import hidden from '../visuallyHidden.module.css';
import segmented from '../segmented.module.css';
import styles from './SegmentedControl.module.css';

export type SegmentedOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type SegmentedControlProps = {
  options: readonly SegmentedOption[];
  /** The group's name, read and not seen: "Period", "View". */
  label: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** What the value is submitted under. Made up unless told; give one in a form. */
  name?: string;
  /** The whole group, through the fieldset. An option has its own. */
  disabled?: boolean;
  /** The track fills its container instead of fitting its labels. */
  fullWidth?: boolean;
  className?: string;
};

/**
 * The Tabs' segmented track over a value: "Day / Week / Month" above a
 * calendar, where nothing is a panel and the choice is an answer. A radio
 * group on real radios, so arrows, Space, the skipping of a disabled option,
 * the submitted value and the announced state are the platform's; the
 * component writes no keyboard handling.
 *
 * Shares segmented.module.css with the Tabs, decided 2026-09-22
 * (docs/superpowers/specs/2026-09-22-segmented-control-design.md): one
 * drawing, two semantics. Views of one object with panels are a Tabs.
 */
export function SegmentedControl({
  options,
  label,
  value,
  defaultValue,
  onChange,
  name,
  disabled = false,
  fullWidth = false,
  className,
}: SegmentedControlProps) {
  const uid = useId();
  const [inner, setInner] = useState(defaultValue);

  // A value that names nothing, or a disabled option, checks nothing: a
  // radio group may have no answer yet. Not the Tabs' fallback to the
  // first — a form must not answer for the reader.
  const asked = value ?? inner;
  const selected = options.find((option) => option.value === asked && !option.disabled)?.value;
  const selectedIndex = options.findIndex((option) => option.value === selected);

  const choose = (option: SegmentedOption) => {
    // A disabled radio gets no change in a browser; jsdom dispatches one to
    // a disabled input all the same.
    if (disabled || option.disabled || option.value === selected) return;
    if (value === undefined) setInner(option.value);
    onChange?.(option.value);
  };

  // The thumb is one element moved by index over equal columns, so it
  // slides without anything being measured.
  const track = {
    '--segmented-index': String(Math.max(selectedIndex, 0)),
    '--segmented-count': String(options.length),
  } as CSSProperties;

  return (
    <fieldset
      role="radiogroup"
      disabled={disabled}
      className={[styles.root, segmented.track, fullWidth && segmented.fullWidth, className].filter(Boolean).join(' ')}
      style={track}
    >
      <legend className={hidden.hidden}>{label}</legend>
      {selectedIndex >= 0 && <span className={segmented.thumb} aria-hidden="true" />}
      {options.map((option) => {
        const isSelected = option.value === selected;
        return (
          <label
            key={option.value}
            className={[
              segmented.segment,
              isSelected && segmented.selected,
              (option.disabled || disabled) && segmented.disabled,
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <input
              type="radio"
              className={hidden.hidden}
              name={name ?? uid}
              value={option.value}
              checked={isSelected}
              // On the radio as well as on the fieldset, so the radio's own
              // state says what its segment shows.
              disabled={option.disabled || disabled}
              onChange={() => choose(option)}
            />
            <span className={segmented.ghost}>
              <span className={styles.label}>{option.label}</span>
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
