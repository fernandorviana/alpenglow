'use client';

import { useSyncExternalStore } from 'react';

/**
 * Whether `query` matches, kept in step with the window. False on the server
 * and where `matchMedia` is missing, so the first render is the wide one and
 * the narrow shape arrives with hydration, as the site's own nav does.
 */
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {};
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    () => (typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia(query).matches : false),
    () => false,
  );
}
