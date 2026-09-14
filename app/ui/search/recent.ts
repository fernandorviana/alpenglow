/**
 * The last destinations chosen through the palette, shown when the field is
 * empty. Per browser, in localStorage, and optional: a storage that refuses
 * (private mode, a cleared site, a sandbox) leaves the list empty rather
 * than the palette broken.
 */
export type Recent = { href: string; title: string; crumb: string };

export const RECENT_KEY = 'alpenglow-search-recent';
export const RECENT_MAX = 5;

const isRecent = (v: unknown): v is Recent =>
  typeof v === 'object' &&
  v !== null &&
  typeof (v as Recent).href === 'string' &&
  typeof (v as Recent).title === 'string' &&
  typeof (v as Recent).crumb === 'string';

export function readRecent(): Recent[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const list: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter(isRecent).slice(0, RECENT_MAX) : [];
  } catch {
    return [];
  }
}

/** Puts `item` first, drops an earlier copy, keeps five; returns the list it tried to store. */
export function remember(item: Recent): Recent[] {
  const next = [item, ...readRecent().filter((r) => r.href !== item.href)].slice(0, RECENT_MAX);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // Nothing to do: the palette shows what it has.
  }
  return next;
}
