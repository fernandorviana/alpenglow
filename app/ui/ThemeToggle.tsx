'use client';

import { useEffect, useLayoutEffect, useState } from 'react';
import { Asleep, Sun } from '@carbon/icons-react';

const KEY = 'alpenglow-theme';

/**
 * The two-position toggle from the design file, laid out horizontally.
 *
 * It replaces a three-button group — System / Light / Dark — and that trade is
 * the one thing worth reading before changing this file. The old control could
 * express "follow the system", which is the state most viewers are actually in;
 * a two-position knob cannot. What survives is the half that matters: a viewer
 * who has never touched the control is still following the system, and the knob
 * mirrors `prefers-color-scheme` live, storing nothing. What is gone is the way
 * *back* — once you choose, the choice is yours to keep.
 *
 * Nothing here paints. The knob's position and the accent on its icon are read
 * from `data-theme` in CSS, so they are right on the first frame; this file
 * only writes that attribute and reports the state to a screen reader.
 *
 * `role="switch"` rather than a two-item radio group: the accessible name is
 * "Dark theme" and the answer is on or off, which is exactly what a switch
 * announces. The icons are decoration on top of that name, not labels.
 */
export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [chosen, setChosen] = useState(false);

  // A layout effect, so whatever it puts back is there before the next paint.
  useLayoutEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(KEY);
    } catch {
      // Private windows and blocked site data both throw here. Fall through.
    }

    // A stored choice is normally already on the root — the layout's no-flash
    // script put it there before the first paint. It is written again because
    // React takes it away whenever it renders the root on the client rather
    // than hydrating it — after a hydration mismatch, for one — and the script
    // does not run a second time. Anything else, including the 'system' the
    // three-button control used to write, means the same as nothing at all.
    const isChosen = stored === 'light' || stored === 'dark';
    if (isChosen) document.documentElement.setAttribute('data-theme', stored!);
    setChosen(isChosen);
    setDark(
      isChosen
        ? stored === 'dark'
        : window.matchMedia('(prefers-color-scheme: dark)').matches,
    );
  }, []);

  // The system keeps speaking only until the viewer does. Gating on `chosen`
  // rather than unsubscribing inside the handler is what makes the first click
  // final: the listener is gone by the time the system next changes.
  useEffect(() => {
    if (chosen) return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const follow = (event: MediaQueryListEvent) => setDark(event.matches);
    media.addEventListener('change', follow);
    return () => media.removeEventListener('change', follow);
  }, [chosen]);

  function choose() {
    const next = !dark;
    setDark(next);
    setChosen(true);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
    try {
      localStorage.setItem(KEY, next ? 'dark' : 'light');
    } catch {
      // The preference simply will not persist. The page still works.
    }
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label="Dark theme"
      className="themeToggle"
      onClick={choose}
    >
      <span className="themeToggleKnob" aria-hidden="true" />
      <span className="themeToggleIcon themeToggleSun" aria-hidden="true">
        <Sun size={24} />
      </span>
      <span className="themeToggleIcon themeToggleMoon" aria-hidden="true">
        <Asleep size={24} />
      </span>
    </button>
  );
}
