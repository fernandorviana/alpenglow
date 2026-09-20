/**
 * The toasts that are waiting or showing, outside React.
 *
 * A toast is raised from wherever the thing happened — a mutation's callback,
 * a fetch wrapper — and that is often not a component. So `toast()` is a
 * plain function over a module list, and the Toaster reads the list through
 * `useSyncExternalStore`. No provider, no context.
 *
 * The list is replaced, never mutated: the snapshot's identity is how React
 * knows it changed.
 */

export const toastTones = ['neutral', 'success', 'danger', 'warning', 'info'] as const;
export type ToastTone = (typeof toastTones)[number];

export type ToastAction = { label: string; onClick: () => void };

export type ToastOptions = {
  /** Read from the icon's shape. `neutral` has no icon. */
  tone?: ToastTone;
  /** One, at most. Pressing it dismisses the toast. */
  action?: ToastAction;
  /** Milliseconds, or `Infinity` to stay until dismissed. */
  duration?: number;
  /** An id already showing updates that toast and restarts its clock. */
  id?: string;
};

export type ToastRecord = {
  id: string;
  message: string;
  tone: ToastTone;
  action?: ToastAction;
  duration: number;
  /** Counts the updates, so the Toaster can tell an updated toast from the same one. */
  revision: number;
};

/**
 * Time to read a line; twice that when there is something to decide; and an
 * error stays, because what went wrong should not leave on its own (WCAG
 * 2.2.1). Behaviour, not motion, so not motion tokens.
 */
export const TOAST_DURATION = 5000;
export const TOAST_DURATION_WITH_ACTION = 10000;

const EMPTY: readonly ToastRecord[] = [];

let list: readonly ToastRecord[] = EMPTY;
let created = 0;
const listeners = new Set<() => void>();

function publish(next: readonly ToastRecord[]) {
  list = next;
  for (const listener of listeners) listener();
}

function show(message: string, options: ToastOptions = {}): string {
  const { tone = 'neutral', action } = options;
  const id = options.id ?? `toast-${++created}`;
  const duration =
    options.duration ?? (tone === 'danger' ? Infinity : action ? TOAST_DURATION_WITH_ACTION : TOAST_DURATION);

  // On the server the list belongs to every request and nothing there ever
  // dismisses from it. A toast answers something that happened in a browser.
  if (typeof document === 'undefined') return id;

  const earlier = list.find((item) => item.id === id);
  const record: ToastRecord = { id, message, tone, action, duration, revision: (earlier?.revision ?? -1) + 1 };

  // Updated in place: a toast that is showing does not go to the back of the queue.
  publish(earlier ? list.map((item) => (item === earlier ? record : item)) : [...list, record]);
  return id;
}

/** One toast, or with no id all of them. */
function dismiss(id?: string) {
  if (id === undefined) {
    if (list.length) publish(EMPTY);
    return;
  }
  if (list.some((item) => item.id === id)) publish(list.filter((item) => item.id !== id));
}

export const toast = Object.assign(show, { dismiss });

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

export const snapshot = () => list;

/** Nothing on the server: a toast answers something that happened in the browser. */
export const serverSnapshot = () => EMPTY;
