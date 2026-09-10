import type { ReactNode } from 'react';

export type MenuItemTone = 'default' | 'accent' | 'danger';

export type MenuAction = {
  /** Stable identity. React key, and the typeahead fallback. */
  id: string;
  label: ReactNode;
  /** 20px slot, leading. */
  icon?: ReactNode;
  /** 20px slot, trailing. The drawing's "Icon on the Right". */
  iconEnd?: ReactNode;
  tone?: MenuItemTone;
  disabled?: boolean;
  /** Typeahead reads this when `label` is not a plain string. */
  textValue?: string;
  onSelect?: () => void;
};

export type MenuGroup = { label: string; items: MenuAction[] };

/**
 * A separator is the string, not an object. It discriminates the union on
 * `typeof e === 'string'` and reads as what it is at the call site.
 */
export type MenuEntry = MenuAction | MenuGroup | 'separator';

export const isSeparator = (e: MenuEntry): e is 'separator' => typeof e === 'string';
export const isGroup = (e: MenuEntry): e is MenuGroup => !isSeparator(e) && 'items' in e;

/** Every action in render order, groups flattened. Separators are not rows. */
export function flattenActions(items: MenuEntry[]): MenuAction[] {
  return items.flatMap((e) => (isSeparator(e) ? [] : isGroup(e) ? e.items : [e]));
}

/** The characters typeahead matches against. */
export function actionText(action: MenuAction): string {
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
