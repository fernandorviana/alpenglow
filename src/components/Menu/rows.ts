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
