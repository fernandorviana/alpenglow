'use client';

import { useId, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import { Input } from '../Input/Input';
import { Tooltip } from '../Tooltip/Tooltip';
import hidden from '../visuallyHidden.module.css';
import styles from './Slider.module.css';

export type SliderPair = [number, number];

type Base = {
  /** What the value is. The input's name; visible unless `hideLabel`. */
  label: string;
  hideLabel?: boolean;
  /** Drawn after the label in parentheses: "%", "kg". */
  unit?: string;
  /** An explanation behind the drawn info icon, in a Tooltip. */
  info?: string;
  /** Help text under the track, announced with the input. */
  caption?: ReactNode;
  min?: number;
  max?: number;
  step?: number;
  /** The balloon over the thumb with the value, as drawn: always shown. */
  showValue?: boolean;
  /** "75%", "$3,500", "Very bright". What is seen and what a reader is told. */
  formatValue?: (value: number) => string;
  /** A mark at every step, for a rating of ten. */
  ticks?: boolean;
  /** At the ends of the track: "0%" and "100%", a moon and a sun, − and +. */
  start?: ReactNode;
  end?: ReactNode;
  /** A field to type the value without the mouse, at the end; one at each end of a range. */
  showInput?: boolean;
  /** The field's name. "`label` value"; in a range, "`label` minimum" and "maximum". */
  inputLabel?: string;
  disabled?: boolean;
  /** Submitted under it; a range under `name-min` and `name-max`. */
  name?: string;
  className?: string;
};

type Single = {
  range?: false;
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
};

type Range = {
  /** Two thumbs, a low and a high, the fill between them. */
  range: true;
  value?: SliderPair;
  defaultValue?: SliderPair;
  onChange?: (value: SliderPair) => void;
  /** Read after the label for each thumb, and used to name the fields. */
  thumbLabels?: [string, string];
};

export type SliderProps = Base & (Single | Range);

/** Carbon's information, on its 16 grid. Apache-2.0, © IBM. */
const INFORMATION = [
  'M8.5 11 8.5 6.5 6.5 6.5 6.5 7.5 7.5 7.5 7.5 11 6 11 6 12 10 12 10 11z',
  'M8,3.5c-0.4,0-0.8,0.3-0.8,0.8S7.6,5,8,5c0.4,0,0.8-0.3,0.8-0.8S8.4,3.5,8,3.5z',
  'M8,15c-3.9,0-7-3.1-7-7s3.1-7,7-7s7,3.1,7,7S11.9,15,8,15z M8,2C4.7,2,2,4.7,2,8s2.7,6,6,6s6-2.7,6-6S11.3,2,8,2z',
];

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));

/** Decimal places a step needs, so 0.1 × 3 is 0.3 and not 0.30000000000000004. */
const decimals = (step: number) => (String(step).split('.')[1] ?? '').length;

/** The nearest value on the step grid from min, as the input itself snaps. */
const snap = (value: number, min: number, step: number) =>
  step > 0 ? Number((min + Math.round((value - min) / step) * step).toFixed(decimals(step))) : value;

/**
 * A value chosen along a line: brightness, a rating, a price band. The
 * platform's `input type="range"`, one for a value and two on one line for
 * a range, painted by the component so every browser draws the same track:
 * the input's own track is transparent and the line, the fill, the ticks
 * and the balloon are the component's, moved by the value's share. The
 * thumb stays the input's, styled in each browser family's own rule.
 *
 * Keyboard, `aria-valuenow`, the submitted value and the announced state
 * are the browser's. docs/superpowers/specs/2026-09-22-slider-design.md.
 */
export function Slider(props: SliderProps) {
  const {
    label,
    hideLabel = false,
    unit,
    info,
    caption,
    min = 0,
    max = 100,
    step = 1,
    showValue = false,
    formatValue = (value: number) => String(value),
    ticks = false,
    start,
    end,
    showInput = false,
    inputLabel,
    disabled = false,
    name,
    className,
  } = props;
  const isRange = props.range === true;
  const thumbLabels = isRange ? (props.thumbLabels ?? ['Minimum', 'Maximum']) : undefined;

  const uid = useId();
  const labelId = `${uid}-label`;
  const captionId = `${uid}-caption`;
  const errorId = `${uid}-error`;
  const inputId = (i: number) => `${uid}-input-${i}`;

  // One shape inside: a pair, the high one unused for a single value.
  const asPair = (v: number | SliderPair | undefined): SliderPair =>
    v === undefined ? [min, max] : typeof v === 'number' ? [v, max] : v;
  const [inner, setInner] = useState<SliderPair>(() => asPair(props.defaultValue));
  const pair = props.value === undefined ? inner : asPair(props.value);
  const low = clamp(pair[0], min, max);
  const high = clamp(pair[1], min, max);

  // What is typed in a field stays as typed while it is wrong or being
  // edited; null shows the value.
  const [typed, setTyped] = useState<[string | null, string | null]>([null, null]);
  const parse = (text: string | null) => {
    if (text === null || text.trim() === '') return null;
    const parsed = Number(text);
    return Number.isNaN(parsed) ? null : parsed;
  };

  // Which thumb a typed or pointed value moves. The two never cross.
  const commit = (index: 0 | 1, next: number) => {
    // On the step grid, as the input holds it: a typed 7.5 with a step of 1
    // would sit in the state while the input showed 8.
    const value = clamp(snap(next, min, step), min, max);
    let pairNext: SliderPair = !isRange
      ? [value, max]
      : index === 0
        ? [Math.min(value, high), high]
        : [low, Math.max(value, low)];
    // A number refused in the other field for crossing this thumb may fit
    // now that the thumb has moved: it is applied, or the field would show
    // no error and the slider a value the field does not say.
    if (isRange) {
      const other: 0 | 1 = index === 0 ? 1 : 0;
      const pending = parse(typed[other]);
      if (pending !== null) {
        const held = clamp(snap(pending, min, step), min, max);
        if (other === 0 && held <= pairNext[1]) pairNext = [held, pairNext[1]];
        if (other === 1 && held >= pairNext[0]) pairNext = [pairNext[0], held];
      }
    }
    if (pairNext[0] === low && pairNext[1] === high) return;
    if (props.value === undefined) setInner(pairNext);
    if (isRange) props.onChange?.(pairNext);
    else props.onChange?.(pairNext[0]);
  };

  // The share of the line, from thumb centre to thumb centre.
  const share = (value: number) => (max > min ? ((clamp(value, min, max) - min) / (max - min)) * 100 : 0);
  const bounds = (index: 0 | 1): [number, number] => (!isRange ? [min, max] : index === 0 ? [min, high] : [low, max]);
  const fault = (index: 0 | 1): string | null => {
    if (typed[index] === null) return null;
    const parsed = parse(typed[index]);
    if (parsed === null) return `Enter a number between ${formatValue(min)} and ${formatValue(max)}`;
    const [lo, hi] = bounds(index);
    if (parsed > hi) return `Value can't be more than ${formatValue(hi)}`;
    if (parsed < lo) return `Value can't be less than ${formatValue(lo)}`;
    return null;
  };
  const errors = [fault(0), isRange ? fault(1) : null] as const;
  // Each field is described by its own message: with both wrong, the high
  // field must not be told the low field's bound.
  const described = (index: 0 | 1) =>
    [caption ? captionId : null, errors[index] ? `${errorId}-${index}` : null].filter(Boolean).join(' ') || undefined;

  const onType = (index: 0 | 1, text: string) => {
    setTyped((t) => (index === 0 ? [text, t[1]] : [t[0], text]));
    const parsed = parse(text);
    if (parsed === null) return;
    const [lo, hi] = bounds(index);
    if (parsed >= lo && parsed <= hi) commit(index, parsed);
  };
  const onLeave = (index: 0 | 1) => {
    if (fault(index) === null) setTyped((t) => (index === 0 ? [null, t[1]] : [t[0], null]));
  };

  // Two inputs overlap. Neither takes the pointer; their thumbs do, so
  // either thumb is grabbed where it is, with a mouse or a finger. A press
  // on the line itself reaches the track, and moves the nearer thumb there,
  // which is what a single input does on its own. When the two thumbs
  // stand on the same spot, the one that can still move is on top.
  const top: 0 | 1 = low === high && low === max ? 0 : 1;
  const lineRef = useRef<HTMLSpanElement>(null);
  const onTrackDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isRange || disabled || event.target instanceof HTMLInputElement || event.button !== 0) return;
    // The line runs from thumb centre to thumb centre, so its own box is the
    // thumb's travel and needs no arithmetic with the thumb's size.
    const box = lineRef.current?.getBoundingClientRect();
    if (!box || box.width <= 0 || max <= min) return;
    const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
    const along = rtl ? box.right - event.clientX : event.clientX - box.left;
    const raw = min + clamp(along / box.width, 0, 1) * (max - min);
    const value = clamp(min + Math.round((raw - min) / step) * step, min, max);
    const nearer: 0 | 1 = Math.abs(value - low) <= Math.abs(value - high) ? 0 : 1;
    commit(nearer, value);
  };

  // Marks are spread evenly, which is only true when the step divides the
  // range; and more than a hundred would crowd any line.
  const count = Math.round((max - min) / step);
  const divides = step > 0 && Math.abs((max - min) / step - count) < 1e-9;
  const drawTicks = ticks && divides && count >= 1 && count <= 100;

  const track = {
    '--slider-from': `${isRange ? share(low) : 0}%`,
    '--slider-to': `${isRange ? share(high) : share(low)}%`,
  } as CSSProperties;

  const thumbs: Array<0 | 1> = isRange ? [0, 1] : [0];
  const valueOf = (index: 0 | 1) => (index === 0 ? low : high);
  const fieldName = (index: 0 | 1) =>
    inputLabel ?? (isRange ? `${label} ${thumbLabels![index].toLowerCase()}` : `${label} value`);

  const field = (index: 0 | 1) => (
    <Input
      size="sm"
      className={styles.field}
      inputMode="decimal"
      aria-label={fieldName(index)}
      aria-describedby={described(index)}
      value={typed[index] ?? String(valueOf(index))}
      invalid={errors[index] !== null}
      disabled={disabled}
      onChange={(event) => onType(index, event.target.value)}
      onBlur={() => onLeave(index)}
    />
  );

  return (
    <div
      className={[
        styles.slider,
        isRange && styles.range,
        showValue && styles.withValue,
        disabled && styles.disabled,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={hideLabel && !info ? hidden.hidden : styles.head}>
        <label id={labelId} htmlFor={inputId(0)} className={hideLabel ? hidden.hidden : styles.label}>
          {label}
          {/* A real space: the name is "Percentage (%)", not "Percentage(%)". */}
          {unit && !hideLabel && ' '}
          {unit && !hideLabel && <span className={styles.unit}>({unit})</span>}
        </label>
        {info && (
          <Tooltip content={info} purpose="label">
            <button type="button" className={styles.info} disabled={disabled}>
              <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" focusable="false">
                {INFORMATION.map((d) => (
                  <path key={d} d={d} />
                ))}
              </svg>
            </button>
          </Tooltip>
        )}
      </div>
      <div className={styles.row}>
        {start !== undefined && <span className={styles.edge}>{start}</span>}
        {isRange && showInput && field(0)}
        <div className={styles.track} style={track} onPointerDown={onTrackDown}>
          <span ref={lineRef} className={styles.line} aria-hidden="true">
            <span className={styles.fill} />
            {drawTicks && (
              <span className={styles.ticks}>
                {Array.from({ length: count + 1 }, (_, i) => (
                  <span key={i} className={styles.tick} />
                ))}
              </span>
            )}
          </span>
          {showValue &&
            thumbs.map((index) => (
              <output
                key={index}
                aria-hidden="true"
                className={styles.balloon}
                style={{ '--slider-at': `${share(valueOf(index))}%` } as CSSProperties}
              >
                {formatValue(valueOf(index))}
              </output>
            ))}
          {thumbs.map((index) => (
            <input
              key={index}
              type="range"
              id={inputId(index)}
              className={[styles.input, isRange && top === index && styles.top].filter(Boolean).join(' ')}
              name={name ? (isRange ? `${name}-${index === 0 ? 'min' : 'max'}` : name) : undefined}
              min={min}
              max={max}
              step={step}
              value={valueOf(index)}
              disabled={disabled}
              aria-labelledby={isRange ? `${labelId} ${uid}-thumb-${index}` : labelId}
              aria-describedby={described(index)}
              aria-valuetext={formatValue(valueOf(index))}
              onChange={(event) => commit(index, Number(event.target.value))}
            />
          ))}
          {isRange &&
            thumbs.map((index) => (
              <span key={index} id={`${uid}-thumb-${index}`} className={hidden.hidden}>
                {thumbLabels![index]}
              </span>
            ))}
        </div>
        {end !== undefined && <span className={styles.edge}>{end}</span>}
        {showInput && field(isRange ? 1 : 0)}
      </div>
      {caption && (
        <p id={captionId} className={styles.caption}>
          {caption}
        </p>
      )}
      {thumbs.map(
        (index) =>
          errors[index] && (
            <p key={index} id={`${errorId}-${index}`} className={styles.error}>
              {errors[index]}
            </p>
          ),
      )}
    </div>
  );
}
