'use client';

import { useEffect, useRef } from 'react';
import { useHydrated } from '../useHydrated';

/**
 * ⌘K, or whichever key, from anywhere: Meta or Ctrl with the key and no Alt,
 * both modifiers on every platform, since a Mac with a PC keyboard, or the
 * reverse, should not be stranded. Returns the hint for the button that opens
 * the palette, "⌘K" or "Ctrl K", and `undefined` before hydration because it
 * reads the platform. `aria-keyshortcuts` on that button is the caller's:
 * "Meta+K Control+K".
 */
export function useCommandPaletteShortcut(onOpen: () => void, key = 'k'): string | undefined {
  const hydrated = useHydrated();
  // The latest callback, kept in a ref written after each render, so the
  // listener is bound once and not on every render. Not useEffectEvent: the
  // package's peer range starts at React 19.0 and that hook arrived in 19.2.
  const latest = useRef(onOpen);
  useEffect(() => {
    latest.current = onOpen;
  });

  useEffect(() => {
    const wanted = key.toLowerCase();
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && !event.altKey && event.key.toLowerCase() === wanted) {
        event.preventDefault();
        latest.current();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [key]);

  if (!hydrated) return undefined;
  const mac = /Mac|iPhone|iPad/.test(navigator.platform);
  return mac ? `⌘${key.toUpperCase()}` : `Ctrl ${key.toUpperCase()}`;
}
