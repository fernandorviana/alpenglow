# Slider — design

2026-09-22. Third piece of the roadmap's third wave. Drawn as the `Slider`
set in the Alpenglow file (node 1127:19816), a documentation page with the
usages explained; the file's metadata could not be read through the MCP (the
response breaks mid-way), so the measures come from the scale and the
drawing is read from the render.

## What is drawn, and what each becomes

| Drawn | Here |
|---|---|
| A thin track, grey where empty and accent where filled; a round white thumb with an accent edge | `input type="range"`, painted by the component: the line and the fill are the component's, the thumb is the input's pseudo-element in each browser family |
| "Percentage (%)" with an info icon, a caption under | `label` (required), `unit`, `info` (an icon button whose Tooltip is the text), `caption` |
| "0%" and "100%" at the ends; a moon and a sun; − and +; two faces; a star | `start` and `end`: text or an icon |
| A balloon with the value over the thumb, "always visible" | `showValue`: an `output` over the thumb, moved by the same share as the fill; `formatValue` for "75%", "$3,500", "Very bright" |
| A field beside to type the value without the mouse; "101%" with "Value can't be more than 100%" | `showInput`: the Input, `sm`, at the end; a typed value outside the range is kept in the field, the field is invalid and the message says the bound; the slider itself never leaves the range |
| A price range with two thumbs and two balloons; "Range with inputs for both min and max" | `range`: two inputs on one line, the fill between them, a field at each end with `showInput`; the two cannot cross |
| Rating 0–10 with a mark at each step | `ticks`: a mark at every `step`, drawn by the component so every browser shows the same |
| "Simple slider, just the slider" | `hideLabel` and nothing else |
| The "tag-like balloon" alternative | Not built; the filled balloon is the primary drawing |

Fernando, 2026-09-22: "Faz o que conseguires e depois partimos para a
criação de mais. De qualquer das formas sugere tu as melhores práticas e
alternativas." Everything drawn is built in one component; the page says
where the practice differs and what the alternatives are.

## Decisions

1. **One component, `Slider`, with `range`.** `value` is a number, or a
   pair with `range`. The anatomy is the same, the second thumb is one more
   input on the same line, and a designer looks for one thing called
   Slider.
2. **The platform's input, painted by the component.** Keyboard (arrows,
   Home, End, Page Up and Down), the value, `aria-valuenow`, `min`, `max`,
   `step`, the submitted value and the announced state are the browser's.
   The input's own track is transparent; the line, the fill, the ticks and
   the balloon are the component's, so a value's change moves them by one
   custom property. The thumb stays the input's pseudo-element, styled in
   each family's rule on its own (a rule that names a pseudo-element the
   browser does not know is dropped whole, the Progress' lesson).
3. **The line runs from thumb-centre to thumb-centre.** The input's thumb
   travels `width − thumb`, so a fill in percent of the whole width would
   miss the thumb by up to half a thumb at the ends. The line, the fill,
   the ticks and the balloons are inset by half a thumb and share the
   input's own geometry exactly.
4. **Colours are measured, the Switch's precedent.** The drawn grey track
   is `border/default`-like and fails 3:1. The empty line is
   `border/strong`, the fill `interactive/accent`, the thumb
   `surface/raised` with an `interactive/accent` edge of 2, the balloon
   `interactive/accent` with `interactive/on-accent` text. Disabled takes
   `interactive/disabled` for the line and `interactive/on-disabled` for the
   fill and the thumb's edge, so the filled part stays the more of the two
   (2026-09-25: the fill had been `interactive/disabled` on a `border/strong`
   line, paler than the line in both modes, and read reversed; against a
   card now 1.36 and 2.39 in light, 1.47 and 3.36 in dark).
5. **Range: the nearer thumb is on top.** Two inputs overlap, and only the
   top one takes the pointer. As the pointer moves over the track the
   input whose thumb is nearer is raised, so either thumb can be dragged
   and a click on the line moves the nearer one, which is what a native
   input does alone. The two never cross: the low thumb is held at or
   below the high one and the high at or above the low. Two balloons meet
   when the values do, and overlap; recorded.
6. **The field is the Input, and the error is the Input's.** Typing "101"
   in a 0–100 field keeps "101" in the field, marks it invalid and shows
   "Value can't be more than 100%" under the caption, as drawn; the
   slider stays at its last value. A value inside the range moves the
   slider as it is typed. In a range, the low field's ceiling is the high
   value and the high field's floor the low value.
7. **Names.** The input is named by the visible label (`aria-labelledby`),
   with "Minimum" and "Maximum" added off screen for the two of a range
   (`thumbLabels`); the field is named "`label` value", or "`label`
   minimum" and "maximum". `aria-valuetext` is `formatValue` of the value,
   so what is seen is what is said; the balloon is `aria-hidden`, since
   the input already says it.

## Shape

```
div.slider[.disabled][.range][.withValue]
  div.head > label.label[for=input]  (span.unit)  (button.info > Information, in a Tooltip)
  div.row
    (span.start)  (Input, low, range only with showInput)
    div.track[style --slider-from --slider-to --slider-ticks]
      span.line > span.fill  (span.ticks > span.tick × n)
      output.balloon[aria-hidden] × 1|2
      input.input[type=range][aria-labelledby][aria-valuetext] × 1|2
    (span.end)  (Input, high or single, with showInput)
  p.caption#captionId | p.error#errorId
```

## API

```ts
type Base = {
  label: string; hideLabel?: boolean; unit?: string; info?: string; caption?: ReactNode;
  min?: number; max?: number; step?: number;        // 0, 100, 1
  showValue?: boolean; formatValue?: (value: number) => string;
  ticks?: boolean;
  start?: ReactNode; end?: ReactNode;
  showInput?: boolean; inputLabel?: string;        // "`label` value"
  disabled?: boolean; name?: string; className?: string;
};
type Single = { range?: false; value?: number; defaultValue?: number; onChange?: (value: number) => void };
type Range = { range: true; value?: [number, number]; defaultValue?: [number, number];
  onChange?: (value: [number, number]) => void; thumbLabels?: [string, string] };  // Minimum, Maximum
export type SliderProps = Base & (Single | Range);
```

A range submits `name-min` and `name-max`. `defaultValue` left out is
`min` (and `[min, max]`).

## Measures

Thumb 16 (`spacing-200`), edge 2; line 4 (`spacing-050`) at radius full;
the track box 24 tall so the ring of 2 at offset 2 fits; the balloon
caption/md Semibold on 20 with `spacing-100` inline padding, radius sm, a
caret of 4; the field `sm` and 64 wide (`--slider-field-width`); head and
caption as the Field's, the unit `text/tertiary`; ticks 2 × 4 in
`surface/raised`.

## Contrast

The fill and the thumb's edge (`interactive/accent`) on `surface/base` and
`surface/raised` ≥ 3:1; the thumb's edge on its own fill ≥ 3:1; the empty
line (`border/strong`) on both surfaces ≥ 3:1, already held; the balloon's
text on the accent ≥ AA, already held.

## Best practice, and the alternatives (for the page)

- A slider is for a value the reader feels rather than knows: volume,
  brightness, a price band. For a value they know, the field alone is
  better, and `showInput` gives both.
- The balloon always shown is the drawing's choice; the common practice
  shows it on hover and focus. Both are one component: `showValue` off
  and the value in `end` or in the field.
- The `tag-like` balloon is an alternative drawing, not built; a caller
  can restyle `.balloon` through `className`.
- `ticks` for ten steps or fewer; more crowd the line.
- A range with two fields is the fullest form; a range with only balloons
  is what the drawing calls "Range slider + Label".

## Tests

Structure and names; single and range; controlled and uncontrolled;
`onChange` with a number or a pair; clamping the pair; `--slider-from`,
`--slider-to`, `--slider-ticks`; the balloon's text and `aria-valuetext`
from `formatValue`; the field: a value inside moves the slider, one outside
keeps the text, marks invalid and says the bound; `disabled`; the
stylesheet: the pseudo-element rules one per rule, no shared pseudo
selectors, reduced motion; axe. Contrast cases as above.

## Records

CHANGELOG under Unreleased; README's count; MEMORY.md's claim; the plan;
nav entry (thirty); section card.

*Corrected 2026-09-24 (fidelity audit):* MEMORY.md recorded the Slider as
"seen in Chromium … no overflow at 375". The production build did not bear
it out: the track was 0 wide and the field 802 at every width, and the page
scrolled sideways, because `control.module.css`'s `.control { width: 100% }`
beat `.field` on the build's chunk order. The field's width is a custom
property that the shared rule reads, since 2026-09-24 (branch
`fidelity-part-1`); named `--alpenglow-control-width` and registered with
`@property` not to inherit since 2026-09-25, so a page's own property of a
common name cannot reach it.
