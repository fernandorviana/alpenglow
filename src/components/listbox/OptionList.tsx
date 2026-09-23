import type { ReactNode } from 'react';
import { flatten, found, isGroup } from './options';
import type { SelectEntry, SelectOption } from './options';
import styles from './OptionList.module.css';

/** Carbon's checkmark, on its 32 grid. Apache-2.0, © IBM. */
const CHECK = 'M13 24 4 15 5.414 13.586 13 21.171 26.586 7.586 28 9 13 24z';
const DASH = 'M8 15h16v2H8z';

export type OptionMark = boolean | 'mixed';

export type OptionListProps = {
  /** The listbox's id; an option's is `${listId}-${index}`, its index in reading order. */
  listId: string;
  entries: readonly SelectEntry[];
  active: number;
  /** Whether an option is chosen. `mixed` is for a row that stands for many. */
  marked: (option: SelectOption) => OptionMark;
  /** A check at the end of the chosen option, or a checkbox before every option. */
  marks: 'check' | 'checkbox';
  /** What was typed, shown in Semibold where a label holds it. */
  query?: string;
  onActive: (index: number) => void;
  onChoose: (index: number) => void;
  /** A line in place of the options: nothing found, or still loading. */
  status?: ReactNode;
};

/** The label, with what was typed in Semibold. Accents and case are folded to find it, not to show it. */
function Label({ label, query }: { label: string; query: string }) {
  const range = found(label, query);
  if (!range) return <>{label}</>;
  const [at, end] = range;
  const chars = Array.from(label);
  return (
    <>
      {chars.slice(0, at).join('')}
      <span className={styles.found}>{chars.slice(at, end).join('')}</span>
      {chars.slice(end).join('')}
    </>
  );
}

/**
 * The rows of a list of options, for the Select and the Combobox: one list in
 * the system, not one each. It renders options and groups and says which is
 * active and which are chosen; opening, the keyboard and the value are the
 * component's around it. Not exported from the package.
 */
export function OptionList({ listId, entries, active, marked, marks, query = '', onActive, onChoose, status }: OptionListProps) {
  const options = flatten(entries);

  const row = (option: SelectOption) => {
    const at = options.indexOf(option);
    const mark = marked(option);
    return (
      <div
        key={option.value}
        id={`${listId}-${at}`}
        role="option"
        aria-selected={mark === true}
        aria-checked={marks === 'checkbox' && mark === 'mixed' ? 'mixed' : undefined}
        aria-disabled={option.disabled || undefined}
        data-index={at}
        className={[styles.option, at === active && styles.active, option.disabled && styles.optionDisabled]
          .filter(Boolean)
          .join(' ')}
        onPointerMove={() => !option.disabled && onActive(at)}
        onClick={() => onChoose(at)}
      >
        {marks === 'checkbox' && (
          // The Checkbox's box as a picture, not the Checkbox: an input inside
          // an option is a control inside a control, and the option is what
          // is chosen and what is named.
          <span
            aria-hidden="true"
            className={[styles.box, mark !== false && styles.boxOn, option.disabled && styles.boxDisabled]
              .filter(Boolean)
              .join(' ')}
          >
            {mark !== false && (
              <svg viewBox="0 0 32 32" fill="currentColor" focusable="false">
                <path d={mark === 'mixed' ? DASH : CHECK} />
              </svg>
            )}
          </span>
        )}
        {option.start && (
          <span className={styles.start} aria-hidden="true">
            {option.start}
          </span>
        )}
        <span className={styles.words}>
          <span className={styles.label}>{option.content ?? <Label label={option.label} query={query} />}</span>
          {option.description && <span className={styles.description}>{option.description}</span>}
        </span>
        {marks === 'check' && mark === true && (
          <span className={styles.check}>
            <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true" focusable="false">
              <path d={CHECK} />
            </svg>
          </span>
        )}
      </div>
    );
  };

  if (status) {
    return (
      <div role="presentation" className={styles.status}>
        {status}
      </div>
    );
  }

  return (
    <>
      {entries.map((entry, i) =>
        isGroup(entry) ? (
          <div key={`group-${i}`} role="group" aria-labelledby={`${listId}-group-${i}`} className={styles.group}>
            <div id={`${listId}-group-${i}`} className={styles.groupLabel}>
              {entry.label}
            </div>
            {entry.options.map(row)}
          </div>
        ) : (
          row(entry)
        ),
      )}
    </>
  );
}
