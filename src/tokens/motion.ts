/**
 * Alpenglow — motion
 *
 * Part of the outcrop, with the scale and type: how long a change takes does
 * not depend on the light, so these are used directly and have no modes.
 *
 * Two durations, and the rule between them:
 *
 * - `fade` — a change in place. A colour answering hover, focus or a checked
 *   state; a panel appearing.
 * - `travel` — something crossing a distance, and whatever changes with it.
 *   The Switch's knob crosses 20px and the site's theme toggle 36px; the
 *   track's colour changes in step with the knob, so it shares the knob's time.
 *
 * Both were in the stylesheets before they were tokens — 120ms eleven times,
 * 140ms five — and moving them here changed nothing on screen.
 *
 * Two curves: `standard` for a change of state, `enter` for something
 * arriving, which starts quickly and settles.
 *
 * Not here, on purpose:
 *
 * - Loops. The Loader's 1.5s cycle and its two curves were measured for that
 *   arc (Loader.module.css). A loop's pace belongs to its drawing.
 * - Reduced motion. Each component decides what to drop, because what must
 *   survive differs: the Switch keeps the knob's position, the Loader keeps
 *   turning. A token cannot make that call.
 * - Figma. Its variables cannot drive a transition outside a prototype.
 */

export const motion = {
  duration: {
    fade: 120,
    travel: 140,
  },
  easing: {
    standard: 'ease',
    enter: 'ease-out',
  },
} as const;
