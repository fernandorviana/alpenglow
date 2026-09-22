# Progress — design

2026-09-22. Tenth piece of the roadmap's second wave.

## What is drawn

Not published as a component. Two places in the drawings have it:

| Where | Drawn |
|---|---|
| Onboarding, the top edge of the page | 4 tall, the page's whole width, square; track `border/default`; the fill a gradient, cyan into the accent; no label, no value |
| Uploaded Document, "is uploading" | 4 tall under the file's name, radius sm; track `surface/sunken`; fill `glacier/400`; no label, no value |

The product's file has other bars on a page too large for the connector to
read; only these two were seen.

## Decisions

1. **Only the linear bar** (Fernando, 2026-09-22, "what best practice says"):
   determinate and indeterminate. The ring is the Loader; a determinate ring
   has no drawing and no case; a segmented bar has no drawing, the onboarding
   being continuous.
2. **The native element.** `<progress>`, as the roadmap has it. The name, the
   value and the state are the platform's. It is painted on the element
   itself with `appearance: none`, the track as its background and the fill as
   a second background sized by `--progress-value`, and the two families of
   browser pseudo-elements (`::-webkit-progress-bar`, `::-webkit-progress-value`,
   `::-moz-progress-bar`) made transparent. One drawing for every browser; a
   change of value can transition, which a pseudo-element's width cannot in
   all of them. The pseudo-element rules are separate, since an unknown
   pseudo-element drops the rule it is in.
3. **The gradient is meaning, not decoration** (Fernando, 2026-09-22). The
   proposal called the onboarding gradient decoration and left it out; his
   correction: it says how close to the end you are. The theme has no
   gradient token, so the fill is `--progress-fill`, the tone's colour unless
   set, and the onboarding page composes the gradient from two theme tokens,
   `text/info` into `interactive/accent`, and says why. The component ships
   no gradient of its own.
4. **The track is the pressed wash, not `surface/sunken`**, for the
   Skeleton's reason: `surface/sunken` is `surface/base` in dark, nothing on
   the page and a hole on a card, where the wash composites over any surface
   in both modes.
5. **Sizes** `sm` (4, the drawn one, default) and `md` (8, for a bar that is
   the page's subject). Radius `full`.
6. **Label and value.** `label` is required, visible unless `hideLabel`, and
   names the element by `aria-labelledby` or `aria-label`. `showValue` puts
   the value at the end of the label's line, tabular, a percentage unless
   `valueText` says otherwise ("3 of 5"); `valueText` is also
   `aria-valuetext`, so what is seen is what is said.
7. **Tones** as the Loader's: `accent` (default), `neutral`, `success` for
   done, `danger` for failed. One vocabulary of tones.
8. **Indeterminate** when `value` is undefined: a band that crosses the
   track, its own 1.5s and not a motion token. Reduced motion does not freeze
   it (invariant 6): the band is held at the centre and breathes at 3s.
9. **A change of value travels** over `motion/travel`, `standard`; under
   reduced motion it does not.
10. **Placement is the caller's.** The onboarding bar is this bar with the
    label hidden, square by `--progress-radius: 0`, pinned by the caller; the
    page shows the pattern and it is not a variant.

## Shape

```
div.progress[.sm|.md][.accent|.neutral|.success|.danger] (className)
  div.head            only with a visible label or a value
    span.label#id
    span.value        showValue
  progress.bar[value][max][aria-labelledby|aria-label][aria-valuetext]
```

The fill's length is `--progress-value`, `value / max` as a percentage, set
inline and held within 0 and 100 as the platform holds the value: a negative
`background-size` is invalid and would paint the whole bar. The percentage in
words is floored, so it never says done before it is. `--progress-fill` (an image) and `--progress-radius` are read by the
stylesheet and set by nobody in the package.

## Contrast

The fill is the information, and is held to 3:1 against every surface it can
stand on, in both modes, for each tone. The track is the Loader's track:
decoration, not held.

## From the review

- The share was not clamped: a value below 0 painted a full bar, one over
  `max` said more than 100%, and a `max` of 0 said `NaN%`. Held now, with
  tests. `Math.round` said 100% at 99.5; floored.
- The usage snippet passed custom properties to `style` as a bare literal,
  which TypeScript rejects; it shows the cast.

## Not here

A ring; segments; a gradient token; a `label` element (there is no control to
label).

## Tests

Roles and names: `progressbar` named by the label, visible or not; value, max
and `aria-valuetext`; `--progress-value` as a percentage; indeterminate with
no `value`; `showValue` with and without `valueText`; sizes and tones as
classes; stylesheet: the wash, `appearance: none`, the three pseudo-elements
transparent in their own rules, the transition on the travel token, the
indeterminate loop and its reduced-motion form, box-sizing; axe. Four
contrast cases, the fill's tones on every surface.
