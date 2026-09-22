# SegmentedControl — design

2026-09-22. Second piece of the roadmap's third wave. Not drawn on its own:
the product's `Tabs` set, the track with a lifted thumb, is the drawing, and
the package already has it as the Tabs' `segmented` variant since 2026-09-18.
What is missing is the same drawing over a value. The Tabs page says it:
"a control that holds a value and shows no panel is a radio group, however
much it looks like the segmented track".

## Decision (Fernando took A, 2026-09-22)

The Tabs keep their `segmented` variant, and the two components share the
stylesheet. A segmented Tabs switches views of one object and has the tabs
semantics, a tab list with panels; a SegmentedControl holds a value, "Day /
Week / Month" over a calendar, and is a radio group. One drawing, two
semantics, one set of rules, the way `choice.module.css` serves Checkbox and
Radio. B, taking the variant from the Tabs, would lose the tabs semantics
where views are what is switched and break `variant="segmented"` from 0.4.0;
C, copying the rules, would leave two places to keep one drawing in.

## Shape

```
fieldset.track[role=radiogroup][.fullWidth][disabled]   style: --segmented-index, --segmented-count
  legend.hidden                     the group's name, off screen
  span.thumb[aria-hidden]           one element, moved by index, while something is checked
  label.segment[.selected][.disabled] × n
    input.input[type=radio][name][value][checked][disabled]   off screen
    span.ghost > span.label
```

The inputs are real radios, so arrows move and select, Space checks, a
disabled segment is skipped, the value is submitted under `name`, and the
state is announced. The component writes no keyboard handling. Focus lands
on the input, off screen, and the segment draws the ring through
`:has(:focus-visible)`.

`selected` and `disabled` are classes, not attribute selectors: the Tabs
mark a selected tab with `aria-selected` on a button, the SegmentedControl
with `checked` on a radio, and the shared rules cannot know which. Each
component puts the class on.

## Shared stylesheet

`src/components/segmented.module.css`: `.track`, `.segment`, `.ghost`,
`.thumb`, and their hover, pressed, selected, disabled, focus and reduced
motion rules, moved out of `Tabs.module.css` unchanged in value. The Tabs
add `track`, `segment`, `ghost` and `thumb` from it to their list, tabs,
ghosts and thumb in the segmented variant, and `--tabs-index` and
`--tabs-count` become `--segmented-index` and `--segmented-count`. Nothing
drawn changes. The Tabs' own `.tab` base rule stays, and the shared
`.segment` declares what a `label` needs that a `button` had from `.tab`:
the flex box, the cursor, the weight, no wrapping. Where both declare, the
values are the same — except the type. `.tab` resets `font` to inherit, and
two single-class rules are ordered by the bundler, which put the Tabs last:
in Chromium a segmented tab measured 14/22 instead of 12/16 (found in the
review, 2026-09-22). So every segment rule is `.track > .segment`, a child
of the track, two classes to one, and wins by specificity; a child and not
a descendant, since a segmented Tabs in a panel of another is no child of
the outer track. A test holds the shape.

## The boundary

The roadmap had the SegmentedControl share `choice.module.css`'s rule for
the unmarked boundary, `border/strong` at 3:1. It does not, and this is the
decision: on an unchecked checkbox the border is the whole control; here
the segments are visible text, the selected one has a shape (the thumb, a
surface step above the track and the `sm` shadow) and a colour
(`text/accent`), and the radio announces the state. The track stays as the
Tabs decided on 2026-09-18, `surface/sunken` with a `border/subtle`
hairline. The contrast cases for the segment already exist: the label under
both washes on the track, the label on the thumb, the thumb's step above
the track and above a card.

## API

```ts
type SegmentedOption = { value: string; label: string; disabled?: boolean };
type SegmentedControlProps = {
  options: readonly SegmentedOption[];
  label: string;                 // the group's name, off screen
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  name?: string;                 // a useId unless told; give one in a form
  disabled?: boolean;            // the fieldset's, so every radio
  fullWidth?: boolean;
  className?: string;
};
```

Controlled and uncontrolled as the Tabs: `value` wins, `defaultValue` seeds
the inner state, `onChange` says the value once and never for the option
already chosen. A `value` that names nothing, or a disabled option, checks
nothing: a radio group may have no answer yet, and the thumb is not drawn
then. Not the Tabs' fallback to the first: a form must not answer for the
reader.

Not built, recorded: a count (the Tabs' is "not drawn with a count"), an
icon-only segment (a list/grid switch), a second size. One size, 32.

## Docs

`/segmented-control`: the control over "Day / Week / Month", `fullWidth`,
a disabled option, the group disabled, inside a form that shows the value
it submits, "SegmentedControl or Tabs", measures, props, the pairs. The Tabs
page's sentence on the radio group links here. Nav entry, section card,
twenty-nine components.

## Tests

`SegmentedControl.test.tsx`: the group's name; radios, one per option,
sharing a name; `defaultValue` checked; controlled shows what the caller
says and only asks; `onChange` once on a choice, never for the chosen one;
a disabled option and a disabled group; nothing checked for a value that
names nothing; `--segmented-index` and `--segmented-count`, and no thumb
with nothing checked; `className` on the root; axe. `segmented.module.css`
read: border-box, the thumb's travel and its `none` under reduced motion,
no descendant selector from a variant. The Tabs' tests move their `.thumb`
reads to the shared module and their custom properties to the new names.

## Records

CHANGELOG under Unreleased; README's count if the suite grows; MEMORY.md's
claim; the plan.
