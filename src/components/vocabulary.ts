import type { ThemeTokenName } from '../tokens/theme';

/**
 * A control's height: 32, 40 or 48px. Button and the control box — Input,
 * Select, DatePicker — share it, and vocabulary.test.ts holds their two
 * stylesheets to the same values. Other components measure other things
 * (a Loader's diameter, an Avatar's width) and keep size names of their own.
 */
export type ControlSize = 'sm' | 'md' | 'lg';

/**
 * Tones are named for meaning, not hue. No component offers all seven: each
 * lists what it offers, and the list has to fit inside a ceiling the tokens set.
 * The lists are not derived from the ceilings. Derived, the Loader would gain
 * `warning` and `info` and menu rows `success` the day those tokens existed,
 * without anyone deciding it — and a tone the type accepts is still unstyled
 * until its stylesheet paints it.
 */
export type Tone = 'neutral' | 'accent' | 'tertiary' | 'success' | 'warning' | 'danger' | 'info';

type Has<Name extends string> = Name extends ThemeTokenName ? true : false;
type All<Checks extends readonly boolean[]> = Checks[number] extends true ? true : false;

/**
 * Tones the theme can fill: a rest fill and a label colour for it. A tone
 * either owns a hover and pressed ladder (`accent`, `danger`, `success`,
 * `tertiary`) or takes the wash over its fill (`neutral`); the stylesheet
 * says which, and the ceiling does not ask.
 */
export type FillTone = {
  [T in Tone]: All<[Has<`interactive/${T}`>, Has<`interactive/on-${T}`>]> extends true ? T : never;
}[Tone];

/**
 * Tones the theme can tint: a subtle surface and a text colour of the same
 * tone. Read from the pair, not from `text/<t>` alone, because `text/tertiary`
 * is a level of the text hierarchy — alone, it would hand the tertiary tone a
 * grey. Neutral tints with `surface/sunken` and `text/primary`.
 */
export type TintTone =
  | 'neutral'
  | {
      [T in Tone]: All<[Has<`surface/${T}-subtle`>, Has<`text/${T}`>]> extends true ? T : never;
    }[Tone];
