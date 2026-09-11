import type { ReactNode } from 'react';
import type { TintTone } from '../vocabulary';

/** A neutral row is the row's own style; accent and danger rows each hover to their own subtle surface. */
export const menuItemTones = ['neutral', 'accent', 'danger'] as const satisfies readonly TintTone[];
export type DropdownMenuItemTone = (typeof menuItemTones)[number];

export type DropdownMenuAction = {
  /** Stable identity. React key, and the typeahead fallback. */
  id: string;
  label: ReactNode;
  /** 20px slot, leading. */
  icon?: ReactNode;
  /** 20px slot, trailing. The drawing's "Icon on the Right". */
  iconEnd?: ReactNode;
  tone?: DropdownMenuItemTone;
  disabled?: boolean;
  /** Typeahead reads this when `label` is not a plain string. */
  textValue?: string;
  onSelect?: () => void;
};

export type DropdownMenuGroup = { label: string; items: DropdownMenuAction[] };

/**
 * A separator is the string, not an object. It discriminates the union on
 * `typeof e === 'string'` and reads as what it is at the call site.
 */
export type DropdownMenuEntry = DropdownMenuAction | DropdownMenuGroup | 'separator';

export const isSeparator = (e: DropdownMenuEntry): e is 'separator' => typeof e === 'string';
export const isGroup = (e: DropdownMenuEntry): e is DropdownMenuGroup => !isSeparator(e) && 'items' in e;

/** The characters typeahead matches against. */
export function actionText(action: DropdownMenuAction): string {
  if (action.textValue !== undefined) return action.textValue;
  return typeof action.label === 'string' ? action.label : action.id;
}

/** Wrapping index step. Returns -1 when there is nothing to move to. */
export function nextIndex(current: number, delta: number, count: number): number {
  if (count === 0) return -1;
  return (current + delta + count) % count;
}

/**
 * The first entry starting with `char`, searching after `from` and wrapping.
 * Returns -1 rather than 0 on no match, so a stray key does not move focus.
 */
export function matchIndex(texts: string[], from: number, char: string): number {
  const needle = char.toLowerCase();
  for (let step = 1; step <= texts.length; step += 1) {
    const at = (from + step) % texts.length;
    if (texts[at]!.toLowerCase().startsWith(needle)) return at;
  }
  return -1;
}
