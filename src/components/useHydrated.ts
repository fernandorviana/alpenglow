'use client';

import { useSyncExternalStore } from 'react';

// No subscription and no effect: the store never changes, so the hook reads
// its server snapshot (`false`) for the render that produces static HTML and
// for the client's hydration pass, and its client snapshot (`true`) for every
// render after that — including the first one under a plain client
// `render()`, which never goes through hydration. Module scope, so it is one
// stable function rather than a fresh closure per render.
const subscribe = () => () => {};

/** `false` on the server and in the hydration pass; `true` from then on. */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
