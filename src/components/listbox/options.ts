import type { ReactNode } from 'react';

export type SelectOption = {
  value: string;
  /** Words: what typing finds, what a screen reader says, and what is shown unless `content` is given. */
  label: string;
  /** Before the words: an Avatar, an icon. Shown in the field too, when chosen. */
  start?: ReactNode;
  /** A second, quieter line in the list. Not shown in the field. */
  description?: string;
  /** Shown in place of `label`, in the list and in the field: a code in bold before a name. */
  content?: ReactNode;
  disabled?: boolean;
};

export type SelectGroup = { label: string; options: readonly SelectOption[] };
export type SelectEntry = SelectOption | SelectGroup;

export const isGroup = (entry: SelectEntry): entry is SelectGroup => 'options' in entry;

/** Every option in reading order, groups opened out. */
export const flatten = (entries: readonly SelectEntry[]): SelectOption[] =>
  entries.flatMap((entry) => (isGroup(entry) ? [...entry.options] : [entry]));

/** The next option that can be chosen, from `from` in the direction of `step`, stopping at the ends. */
export function step(options: readonly SelectOption[], from: number, by: 1 | -1): number {
  for (let at = from + by; at >= 0 && at < options.length; at += by) {
    if (!options[at]!.disabled) return at;
  }
  return from;
}

export const first = (options: readonly SelectOption[]) => step(options, -1, 1);
export const last = (options: readonly SelectOption[]) => step(options, options.length, -1);

/** The next option after `from` whose label starts with `char`, wrapping, skipping what cannot be chosen. */
export function match(options: readonly SelectOption[], from: number, char: string): number {
  const needle = char.toLowerCase();
  for (let n = 1; n <= options.length; n += 1) {
    const at = (from + n + options.length) % options.length;
    const option = options[at]!;
    if (!option.disabled && option.label.toLowerCase().startsWith(needle)) return at;
  }
  return -1;
}

/** Case and accents folded, one character for one, so an index in the folded text is an index in the text. */
export const fold = (text: string) =>
  // Character by character, and not the whole string lowercased first: 'İ'
  // lowercases to two code points, and every index after it would be one off.
  Array.from(text)
    .map((char) => Array.from(char.toLowerCase().normalize('NFD'))[0] ?? char)
    .join('');

/**
 * Where `text` holds what was typed, as a [start, end] in code points, or
 * null: found with accents and case folded, shown as typed. One place for
 * the mark the OptionList and the CommandPalette both draw.
 */
export function found(text: string, query: string): [number, number] | null {
  const needle = fold(query.trim());
  if (!needle) return null;
  const at = fold(text).indexOf(needle);
  return at < 0 ? null : [at, at + Array.from(needle).length];
}

/** Whether a label holds what was typed, anywhere in it, whatever the case or the accents. */
export const contains = (option: SelectOption, query: string) => fold(option.label).includes(fold(query.trim()));

/** The entries whose options pass, groups kept in place and dropped when empty. */
export function filterEntries(entries: readonly SelectEntry[], keep: (option: SelectOption) => boolean): SelectEntry[] {
  return entries.flatMap((entry): SelectEntry[] => {
    if (!isGroup(entry)) return keep(entry) ? [entry] : [];
    const options = entry.options.filter(keep);
    return options.length ? [{ ...entry, options }] : [];
  });
}
