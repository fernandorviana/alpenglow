'use client';

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Button } from '../Button/Button';
import { Checkbox } from '../Checkbox/Checkbox';
import { Popover } from '../Popover/Popover';
import type { PopoverTriggerProps } from '../Popover/Popover';
import { Tag } from '../Tag/Tag';
import { Tooltip } from '../Tooltip/Tooltip';
import styles from './Filters.module.css';

export type FilterOption = { value: string; label: string };
export type FilterField = { key: string; label: string; options: FilterOption[] };
/** One entry per field with something chosen. */
export type FilterValue = { key: string; values: string[] };

export type FiltersProps = {
  fields: FilterField[];
  value: FilterValue[];
  onChange: (next: FilterValue[]) => void;
  /** The bar's name and its first word. */
  label?: string;
  addLabel?: string;
  clearLabel?: string;
  /** The chip's words. Left out, "Field is A or B". */
  describe?: (field: FilterField, chosen: FilterOption[]) => ReactNode;
  className?: string;
};

/** Carbon's add, on its 32 grid. Apache-2.0, © IBM. */
const ADD = 'M17 15L17 8 15 8 15 15 8 15 8 17 15 17 15 24 17 24 17 17 24 17 24 15z';

/** The joiners are bare text in the button, where every name algorithm keeps their spaces. */
function join(items: ReactNode[], word: string) {
  return items.flatMap((item, i) => (i === 0 ? [item] : [` ${word} `, item]));
}

const describeDefault = (field: FilterField, chosen: FilterOption[]) => (
  <>
    <span className={styles.strong}>{field.label}</span>
    {' is '}
    {join(
      chosen.map((option) => (
        <span key={option.value} className={styles.strong}>
          {option.label}
        </span>
      )),
      'or',
    )}
  </>
);

/**
 * A chip's words: the button that opens its values, ended with an ellipsis
 * when the chip is wider than the bar. The system's Tooltip says them whole
 * on hover and on keyboard focus, while they are cut short — measured, as
 * the button's scroll width past its own. The Tooltip is always there, so
 * the button is never remounted under the focus; while the words are whole
 * the rules keep its panel from showing. It names the button with the same
 * words, so the name does not change.
 */
function ChipWords({ words, trigger }: { words: ReactNode; trigger: PopoverTriggerProps }) {
  const button = useRef<HTMLButtonElement>(null);
  const [cut, setCut] = useState(false);
  useLayoutEffect(() => {
    const element = button.current;
    if (!element) return;
    const read = () => setCut(element.scrollWidth > element.clientWidth);
    read();
    // Again as the bar narrows or widens. jsdom has none.
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(read);
    observer.observe(element);
    return () => observer.disconnect();
  });
  return (
    <Tooltip content={words} purpose="label" className={styles.tip}>
      <button ref={button} type="button" className={styles.words} data-truncated={cut || undefined} {...trigger}>
        {words}
      </button>
    </Tooltip>
  );
}

/**
 * The filters on a list, read as words: a chip for each field with something
 * chosen, its words a button that opens the field's values, a "+" that opens
 * the fields and then a field's values, and Clear. Controlled: `value` is the
 * caller's, and every check reports the next one at once.
 */
export function Filters({
  fields,
  value,
  onChange,
  label = 'Filters',
  addLabel = 'Add filter',
  clearLabel = 'Clear',
  describe = describeDefault,
  className,
}: FiltersProps) {
  // The field picked in the "+" panel. Reset when the panel closes.
  const [picked, setPicked] = useState<string | null>(null);

  const chips = value.flatMap((entry) => {
    const field = fields.find((f) => f.key === entry.key);
    if (!field) return [];
    const chosen = field.options.filter((option) => entry.values.includes(option.value));
    return chosen.length ? [{ field, chosen }] : [];
  });

  const valuesOf = (key: string) => value.find((entry) => entry.key === key)?.values ?? [];

  function toggle(field: FilterField, option: FilterOption, checked: boolean) {
    const current = valuesOf(field.key);
    // The field's own order, so "A or B" reads the same however it was chosen.
    // A value the caller holds that is not among the options is not the
    // reader's to lose: it is kept, after the known ones.
    const known = field.options.map((o) => o.value);
    const values = [
      ...known.filter((v) => (v === option.value ? checked : current.includes(v))),
      ...current.filter((v) => !known.includes(v)),
    ];
    const rest = value.filter((entry) => entry.key !== field.key);
    if (values.length === 0) {
      onChange(rest);
      return;
    }
    const at = value.findIndex((entry) => entry.key === field.key);
    const next = at === -1 ? [...value, { key: field.key, values }] : value.map((entry, i) => (i === at ? { key: field.key, values } : entry));
    onChange(next);
  }

  const options = (field: FilterField) => (
    <fieldset className={styles.options}>
      <legend className={styles.legend}>{field.label}</legend>
      {field.options.map((option) => (
        <Checkbox
          key={option.value}
          checked={valuesOf(field.key).includes(option.value)}
          onChange={(event) => toggle(field, option, event.currentTarget.checked)}
        >
          {option.label}
        </Checkbox>
      ))}
    </fieldset>
  );

  const pickedField = fields.find((f) => f.key === picked);

  return (
    <div role="group" aria-label={label} className={[styles.filters, className].filter(Boolean).join(' ')}>
      <span className={styles.label} aria-hidden="true">
        {label}
      </span>
      <div className={styles.chips}>
        {chips.map(({ field, chosen }) => (
          <Tag
            key={field.key}
            size="md"
            removeLabel={`Remove ${field.label} filter`}
            onRemove={() => onChange(value.filter((entry) => entry.key !== field.key))}
          >
            <Popover
              aria-label={field.label}
              trigger={(props) => <ChipWords words={describe(field, chosen)} trigger={props} />}
            >
              {options(field)}
            </Popover>
          </Tag>
        ))}
      </div>
      <div className={styles.controls}>
        <Popover
          aria-label={addLabel}
          onOpenChange={(open) => {
            if (!open) setPicked(null);
          }}
          trigger={(props) => (
            <Button
              variant="ghost"
              tone="neutral"
              size="sm"
              aria-label={addLabel}
              iconStart={
                <svg viewBox="0 0 32 32" width="16" height="16" fill="currentColor" aria-hidden="true" focusable="false">
                  <path d={ADD} />
                </svg>
              }
              {...props}
            />
          )}
        >
          <div className={styles.add}>
            <ul className={styles.fields}>
              {fields.map((field) => (
                <li key={field.key}>
                  <button
                    type="button"
                    className={styles.field}
                    aria-pressed={picked === field.key}
                    onClick={() => setPicked(field.key)}
                  >
                    {field.label}
                  </button>
                </li>
              ))}
            </ul>
            {pickedField && options(pickedField)}
          </div>
        </Popover>
        {chips.length > 0 && (
          <Button variant="ghost" tone="accent" size="sm" className={styles.clear} onClick={() => onChange([])}>
            {clearLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
