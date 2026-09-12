# Elevation and states — design

**Date:** 2026-09-12
**Status:** approved by Fernando, ready for an implementation plan
**Source:** a survey of how eleven reference systems paint dark-mode layers,
hovers and borders, with every value read from the package each one publishes
(Primer, Atlassian, Radix Colors and Themes, Adobe Spectrum, IBM Carbon,
Vercel Geist, shadcn/ui, Apple UIKit, Discord, Notion, Material 2 and 3).

---

## Why

Fernando's question: in dark mode, are panels, elevated surfaces and hovers
done with white alphas or with a colour scale? The colour scales looked too
strong to him.

The survey answered it with a pattern that repeats in every system measured,
and a measurement that explains his impression.

**The pattern.** Layers are opaque steps of a *surface* scale whose steps are
much finer than a palette ramp's. Transient states — hover, pressed, selected
on a control with no fill of its own — are alphas, and the alpha is rarely
pure white: it is a mid grey (Primer `#656c76` at 20%, Apple `120,120,128`
at 36%, Carbon `#8d8d8d` at 16%, Discord `78,80,88` at 30%) or a lightly
tinted near-white (Atlassian `#E3E4F2` at 12%), so that one token lightens a
dark surface and darkens a light one. Borders are moving to alpha (shadcn,
Primer's muted border, Atlassian's input border, Apple's separator). Material
3 abandoned Material 2's white-overlay-per-dp for opaque tonal surface roles.

**The measurement.** Adjacent surface levels, in OKLCH lightness:

| Scale | ΔL between surface levels |
|---|---|
| Radix gray dark 1 → 5 | .036 .039 .033 .028 |
| Atlassian DarkNeutral 0 → 300 | .025 .029 .020 .054 |
| Spectrum gray dark 25 → 300 | .044 .030 .041 .024 .027 |
| Geist dark bg → gray-400 | .073 .022 .042 .020 |
| Carbon g100 bg → layer-03 | .068 .076 .094 |
| shadcn dark bg → accent | .060 .064 .102 |
| **Alpenglow dark 950 → 700** | **.085 .085 .100** |

The systems that read as calm sit at .02–.045 per level. Alpenglow's ramp is
right for text and fills and was being used as a surface scale, at one whole
stop per level. The hover was worse: `stone/700` over a dark card is ΔL
+.184, and over the canvas +.269, against +.05 to +.09 in the references. In
light the opaque hover `mist/100` is invisible on `surface/sunken` (ΔL .001),
which is the collision the alpha approach exists to remove.

## What this spec settles

1. A twelfth stop, `925`, the surface step.
2. The dark ladder `950 → 925 → 900`.
3. The wash: two alpha tokens replacing the opaque neutral hover and pressed.
4. `border/subtle` as an alpha in both modes.
5. Surface-to-surface separation measured in OKLCH lightness, not WCAG ratio.
6. A docs page, `/elevation`, and the entries on Decisions.

## What it leaves alone

- The opaque three-step ladders of accent, danger, success and tertiary, and
  their themed labels (invariant 2). A filled button changes its own colour.
- `border/default` and `border/strong`: the first is a documented exception,
  the second is the 3:1 guarantee every form control relies on. Both stay
  opaque.
- `interactive/selected` and the `*-subtle` surfaces: persistent states keep an
  opaque tint, as every reference does.
- The light ladder: `stone/050 → white → white`, ΔL .025 then the shadow.
- The input's resting border (the blocked pair in `MEMORY.md`) and the site's
  page-level use of the palette.

---

## 1. The bedrock

### `925`

Every family gains a stop at L .205, generated like the others: chroma and
hue interpolated between 900 and 950 by lightness. The eleven existing stops
do not move — `scripts/generate-ramps.mjs` reproduces them byte for byte.

| Family | 925 |
|---|---|
| `night` | `#12142C` |
| `stone` | `#15171C` |
| the other eight | generated, never aliased |

It is generated in every family so that a stop number keeps meaning the same
amount of light everywhere, which is the rule that makes families
interchangeable by role. Only `night` and `stone` — the two surface ladders —
are aliased at it.

**This reverses a recorded rule.** "Eleven stops and no half steps" was
written on 2026-09-11 against a twenty-step neutral whose adjacent steps gave
the theme two *text* levels 1.22:1 apart. A surface step is a different
thing: no text is ever set in one surface against another, and the survey
shows every calm system placing its surface levels closer than any palette
ramp places its text stops. The rule is restated: **no half steps for text or
fills; one surface step, 925, and no more.** The `975` the old rule refused
stays refused.

### Alpha primitives

| Name | Ink | Alpha | For |
|---|---|---|---|
| `alpha/haze-08` | `mist/500` `#6A908F` | 8% | wash-hover, light |
| `alpha/haze-12` | `mist/500` | 12% | wash-hover, dark |
| `alpha/haze-16` | `mist/500` | 16% | wash-pressed, light |
| `alpha/haze-20` | `mist/500` | 20% | wash-pressed, dark |
| `alpha/ink-08` | `stone/950` `#0B0D12` | 8% | border/subtle, light |

*Haze* is the mist family as a wash. `mist/500` is the family's mid stop
(L .625): over a light surface it darkens with a faint cyan cast, which is the
cast the light hover already had; over a dark one it lightens, and at 12% its
hue moves the result ΔEok .003 from what a neutral `stone/500` would give. One
ink serves both modes, as the references do. `mist` keeps its role — soft
states — and gains dark mode, which it had been kept out of because its
opaque 800 collided with the overlay.

`border/subtle` in dark uses the existing `alpha/white-16`.

Counts: 121 opaque primitives (white + ten families of twelve) and 21 alpha.

## 2. The theme

### Surfaces

| Token | Light | Dark | Was (dark) |
|---|---|---|---|
| `surface/base` | `stone/050` | `night/950` | — |
| `surface/raised` | `white` | **`night/925`** | `night/900` |
| `surface/overlay` | `white` | **`night/900`** | `night/800` |
| `surface/sunken` | `stone/100` | `night/950` | — |

Dark ladder: ΔL .043 and .043 (WCAG 1.08 and 1.11). Three colour levels,
`sunken` still shares the canvas, and the rule "when you run out, separate
with a border" is unchanged. `night/800` leaves the ladder; nothing else
aliases it, and it stays in the ramp.

A product on the `stone` ladder aliases the same stops: ΔL .045 and .039.

### The wash

`interactive/neutral-hover` and `interactive/neutral-pressed` are removed.
Two tokens replace them:

| Token | Light | Dark | Use |
|---|---|---|---|
| `interactive/wash-hover` | `alpha/haze-08` | `alpha/haze-12` | Transient wash over any surface or neutral fill: rows, menu items, ghost and outline buttons, the neutral button, icon buttons |
| `interactive/wash-pressed` | `alpha/haze-16` | `alpha/haze-20` | The same, pressed |

The count stays at 54.

A wash is a *state layer*: it has no label of its own, and the text beneath
keeps its token. Measured over every surface it can appear on:

| Mode, state | base | raised | overlay | sunken |
|---|---|---|---|---|
| light hover, ΔL | −.026 | −.029 | −.029 | −.024 |
| light pressed, ΔL | −.053 | −.058 | −.058 | −.050 |
| dark hover, ΔL | +.064 | +.057 | +.050 | +.064 |
| dark pressed, ΔL | +.106 | +.094 | +.083 | +.106 |

The old hover on a dark card was +.184; the new one is +.057. The old light
hover on a white card was −.056; the new one is −.029, and it now shows on
`sunken`.

Text under the wash, the tightest pair in each cell (`text/tertiary`):

| Mode, state | base | raised | overlay | sunken |
|---|---|---|---|---|
| light hover | 4.64 | 4.95 | 4.95 | **4.27** |
| light pressed | **4.28** | 4.54 | 4.54 | **3.94** |
| dark hover | 7.17 | 6.50 | 5.80 | 7.17 |
| dark pressed | 6.37 | 5.76 | 5.14 | 6.37 |

Primary, secondary, accent, danger, success, warning and info clear AA under
both washes on `base`, `raised` and `overlay` in both modes, and under the
hover wash on `sunken`; the one status dip is `text/accent` under the light
pressed wash on sunken, 4.38. Tertiary clears AA under both washes on
`raised` and `overlay`, which are the surfaces rows and menu items sit on.
On `base` it clears hover and misses pressed by 0.22; on `sunken` it misses
both. The suite asserts the guarantees and records the figures outside them.
Nothing in the system today puts tertiary text on a washed control over
sunken or base, and no control that can be pressed sits on a well.

The neutral button keeps its opaque fill (`stone/050` / `stone/800`) and takes
the wash on top: light hover −.026 (was −.031), dark hover +.038 (was +.100),
dark pressed +.062 (was +.200). Its label stays at 14.05 / 9.80 or better.

The menu keeps its rule: the accent and danger rows hover to their own subtle
surfaces; the neutral row takes the wash. `text/accent` on the wash over the
overlay is 5.50 light and 7.86 dark — it now passes with a margin, and the
rule still stands as the design.

### `border/subtle`

| Mode | Value | base | raised | overlay | sunken |
|---|---|---|---|---|---|
| Light | `alpha/ink-08` | 1.19 | 1.18 | 1.18 | 1.18 |
| Dark | `alpha/white-16` | 1.54 | 1.62 | 1.65 | 1.54 |

Was `stone/100` (1.17 on white, 1.00 on sunken) and `night/700` (1.97 on the
old raised, 1.50 on the old overlay). The light separator keeps its weight
and stops disappearing on sunken; the dark one comes down from 1.97 toward
the reference (Radix gray6 on gray2, 1.53; Atlassian's alpha border on
DarkNeutral100, about 1.5). The trap "border/subtle as night/800 collides with
the overlay" no longer exists, because the token no longer picks a stop.

### Pairs that move with the ladder (dark)

| Pair | Was | Now |
|---|---|---|
| `text/disabled` on `surface/overlay` | 2.30 | 3.03 |
| `text/disabled` on `surface/raised` | 3.03 | 3.36 |
| `text/inert` on `surface/overlay` | 1.50 | 1.97 |
| `interactive/neutral` on `surface/overlay` | 1.00, outline only | 1.33 |
| `border/default` on `surface/overlay` | 2.26 | 2.97 |
| `border/default` on `surface/raised` | 2.97 | 3.30 |
| `text/tertiary` on `surface/overlay` | 5.18 | 6.81 |
| the dialog against its scrim | 1.43 | **1.19** |

The last one is the cost. The dark scrim is the darkest ink at 95% over the
canvas, and the dialog moved a stop closer to it. Nothing darker than the
ink exists, and a lighter scrim moves toward the dialog. Invariant 11 already
answers it: in dark the border carries the edge — `border/default` is 2.97
against the dialog and 3.5 against the scrim — with the shadow as reinforcement.
The suite records 1.19 rather than asserting 1.4.

## 3. The instrument

WCAG's ratio is a text-legibility measure with a +0.05 floor that flattens
the dark end: Radix's `gray1 → gray2` is 1.06:1, Atlassian's `N0 → N100` is
1.065, and both are steps everyone sees. Alpenglow's own new step is 1.08:1,
and the old 1.09 floor would have refused it while passing the .085 jump that
looked wrong.

Surface against surface — the ladder, a well inside a card, a panel over a
card — is therefore measured in OKLCH lightness, with a floor of **ΔL .035**,
just under the smallest step Radix ships. Text on a surface and a boundary on
a surface stay on WCAG: 4.5, 3.0, and the 1.1 visibility floor for decorative
edges. `contrast.ts` gains `lightness(hex)` and `tokenContrast` learns to
composite an alpha token over the ground it is measured on.

## 4. Components

The wash is applied two ways, and a stylesheet comment says which:

- A control with no fill of its own — ghost and outline buttons, a table row,
  a menu item, a calendar day — sets `background` to the wash.
- A control with a fill — the neutral button, the calendar's month buttons,
  the dialog's icon buttons — keeps `background-color` and sets
  `background-image` to a gradient of the wash on hover and pressed, so the
  wash composites over the fill. A gradient is not animatable, so on those
  the state change is instant where a ghost's fades; the alternative, a
  pseudo-element with an opacity transition, is a second box to size and
  clip on every filled control, and was not taken.

Consumers: `Button.module.css` (solid neutral, outline, ghost),
`Table.module.css` (row hover), `DropdownMenu.module.css` (row focus),
`Calendar.module.css` (day pill, month buttons), `Dialog.module.css` (icon
buttons), `app/docs.css` (nav links, token-table rows, row actions, the
narrow-screen toggle, the theme toggle's track).

`FillTone` in `vocabulary.ts` asked for a rest, hover and pressed fill and a
label. It now asks for a rest fill and a label: a tone either owns a ladder or
takes the wash, and the neutral tone takes the wash.

## 5. Tests

`contrast.test.ts`:

- the dark ladder and sunken-in-a-card in ΔL, floor .035, still ordered;
- the wash is visible over all four surfaces in both modes (ΔL ≥ .02 hover,
  and pressed further than hover);
- text under the wash: the guarantee and the recorded figures above;
- the neutral label on the neutral fill under both washes;
- `border/subtle` ≥ 1.1 on all four surfaces in both modes — the line that
  used to exclude base and sunken is gone;
- the recorded exemptions, the separator figures, the accent-row figure and
  the scrim figure at their new values;
- the structural check that every fill has an `on-*` skips the wash, with the
  reason.

`generated.test.ts` covers the new primitives with no new case. The menu test
that pins the hover token moves to the wash. `custom-properties.test.ts`
catches any stylesheet still reading the removed names.

## 6. Documentation

- **`/elevation`, "Elevation and states"**, under Foundations: the ladder in
  both modes with ΔL beside WCAG; the wash composited over each surface with
  the tightest text pair; the borders; and the survey table — what each
  reference system does for layers, states and borders, with the values read
  from its package — as the evidence the decision rests on.
- **Decisions**: the ladder entry rewritten for `925`; a new entry, *Hover is
  a wash, not a fill*; a new entry, *Surfaces are measured in lightness*.
- **Colour**: alpha tokens composited over `surface/raised` in the tables;
  the surface prose; twelve stops.
- The Dropdown menu and Date picker pages' evidence, which quoted the old
  hover token.
- `README.md`, `MEMORY.md` (invariant 4, the counts, open work),
  `skills/applying-alpenglow-tokens/SKILL.md` (quick reference, decisions,
  traps, every token table, the primitives table), `docs/figma/*` regenerated.

The Figma file is not touched in this session — the MCP is not authorised
here. The regenerated JSON and `apply-variables.md` carry the change; the
plugin script re-points aliases by name and adds the new primitives.

## 7. Breaking change

`alpenglow` is at `0.1.0`. Two token names leave: `interactive/neutral-hover`
and `interactive/neutral-pressed`, and with them the CSS custom properties
`--ap-color-interactive-neutral-hover` / `-pressed` and the Tailwind utilities
`bg-interactive-neutral-hover` / `-pressed`. Every dark surface value changes.
The next version is `0.2.0`.
