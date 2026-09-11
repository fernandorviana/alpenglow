'use client';

import { useLayoutEffect, useSyncExternalStore } from 'react';
import { Asleep, Sun } from '@carbon/icons-react';

const KEY = 'alpenglow-theme';

type Choice = 'light' | 'dark';

const valid = (value: string | null): Choice | null =>
  value === 'light' || value === 'dark' ? value : null;

/**
 * The viewer's choice is not React state. It lives in storage, where the
 * layout's no-flash script reads it, and on the root, where the stylesheet
 * does. This component reads it from there on every render rather than copying
 * it in once on mount, so there is no second copy to fall out of step.
 *
 * Storage answers first. The root is the fallback because where storage
 * refuses the write — blocked site data throws on both calls — the root is the
 * only place the click was recorded. Anything else storage holds, including
 * the 'system' the three-button control used to write, means no choice.
 */
function readChoice(): Choice | null {
  try {
    const stored = valid(localStorage.getItem(KEY));
    if (stored) return stored;
  } catch {
    // Private windows and blocked site data both throw here. Fall through.
  }
  return valid(document.documentElement.getAttribute('data-theme'));
}

/** Writing storage raises `storage` in other tabs only, so this tab says so itself. */
const choiceListeners = new Set<() => void>();

function onChoice(notify: () => void) {
  choiceListeners.add(notify);
  // A choice made in another tab. Without this, the next render here would
  // read the new value while the root still held the old one.
  window.addEventListener('storage', notify);
  return () => {
    choiceListeners.delete(notify);
    window.removeEventListener('storage', notify);
  };
}

const SYSTEM_DARK = '(prefers-color-scheme: dark)';

function onSystem(notify: () => void) {
  const media = window.matchMedia(SYSTEM_DARK);
  media.addEventListener('change', notify);
  return () => media.removeEventListener('change', notify);
}

const ignoreSystem = () => () => {};

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
 * only writes that attribute and reports the state to a screen reader. The
 * server snapshots say "no choice, light system", because the static HTML
 * cannot know either; `aria-checked` corrects itself once hydrated, and the
 * knob, being CSS, was already right.
 *
 * `role="switch"` rather than a two-item radio group: the accessible name is
 * "Dark theme" and the answer is on or off, which is exactly what a switch
 * announces. The icons are decoration on top of that name, not labels.
 */
export function ThemeToggle() {
  const choice = useSyncExternalStore(onChoice, readChoice, () => null);

  // The system keeps speaking only until the viewer does. Swapping the
  // subscription out on `choice` rather than ignoring the event inside it is
  // what makes the first click final: the listener is gone by the time the
  // system next changes.
  const systemDark = useSyncExternalStore(
    choice ? ignoreSystem : onSystem,
    () => window.matchMedia(SYSTEM_DARK).matches,
    () => false,
  );

  const dark = choice ? choice === 'dark' : systemDark;

  // A stored choice is normally already on the root — the no-flash script put
  // it there before the first paint. It is written again because React takes
  // it away whenever it renders the root on the client rather than hydrating
  // it — after a hydration mismatch, for one — and the script does not run a
  // second time. A layout effect, so it is back before the next paint.
  useLayoutEffect(() => {
    if (choice) document.documentElement.setAttribute('data-theme', choice);
  }, [choice]);

  function choose() {
    const next: Choice = dark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // The preference simply will not persist. The root still holds it.
    }
    for (const notify of choiceListeners) notify();
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
