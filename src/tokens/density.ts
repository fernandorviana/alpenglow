/**
 * Alpenglow — density
 *
 * How much room a row, a control and an hour take. Two modes: comfortable,
 * which is what is drawn and the default, and compact, chosen with
 * `data-density="compact"` on any element — custom properties inherit, so a
 * part of a page can be compact while the rest is not.
 *
 * Five tokens, only the ones the dense screen proves (spec 2026-09-23,
 * decision 14). Adding one is a decision, not a tidy-up: the Loader once grew
 * sizes nobody drew, and invariant 7 records it.
 *
 * Compact does not apply to touch. Under `(pointer: coarse)` tokens.css gives
 * the comfortable values back: 32 passes WCAG 2.5.8's 24, but under a finger
 * it is small, and density is for the pointer and the keyboard.
 *
 * An explicit `size` on a control, and the Table's explicit `density`, win.
 */

export const densityModes = ['comfortable', 'compact'] as const;
export type Density = (typeof densityModes)[number];

type Entry = { comfortable: number; compact: number; use: string };

export const density = {
  control: { comfortable: 40, compact: 32, use: 'A control’s height when no size is passed: Button, Input, Select, NativeSelect, Combobox, DatePicker' },
  row: { comfortable: 72, compact: 48, use: 'A Table row' },
  'row-header': { comfortable: 44, compact: 36, use: 'A Table header row' },
  hour: { comfortable: 80, compact: 64, use: 'An hour in the Scheduler; a quarter of it is a card’s floor' },
  'nav-item': { comfortable: 40, compact: 32, use: 'An item in the SideNav and the SideNavSecondary' },
} as const satisfies Record<string, Entry>;

export type DensityTokenName = keyof typeof density;
