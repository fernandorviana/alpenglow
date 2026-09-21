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
