# The chart palette — design

2026-09-23. The roadmap's foundation "a data-visualisation palette, each
step with its measured ratio on `surface/base` and `raised` in both modes —
Cloudscape names a ratio in a description; this measures it". The
categorical half went to main with the Scheduler on 2026-09-23 as the
`category/*` group (b3738b9); this spec adds the two ramps a chart still
needs, a sequential one for magnitude and a diverging one for a value on
either side of a centre, and writes down the rules for using all three.
Every figure below was read from `src/tokens/contrast.ts` over the
primitives, not estimated, and each is held by the suite.

No chart component. The palette is for whatever draws the chart — Recharts,
D3, Observable Plot, a `<canvas>` — through the custom properties, and the
documentation page's charts are static SVG drawn from the tokens. A Chart
component would be a library, and a library is not this system's job.

## Decisions

1. **Twelve tokens under `chart/`.** Five sequential steps,
   `chart/sequential-1` … `chart/sequential-5`, and seven diverging,
   `chart/low-3`, `chart/low-2`, `chart/low-1`, `chart/mid`, `chart/high-1`,
   `chart/high-2`, `chart/high-3`. The theme goes from 82 to 94 entries. A
   step is numbered by its distance from the canvas: `sequential-1` and
   `mid` sit nearest it in both modes, `sequential-5`, `low-3` and `high-3`
   furthest. The categorical six stay `category/*`, this spec adds their
   rules, not their tokens.

2. **The sequential ramp is one hue, twilight, five steps.** Light is
   twilight 200 / 400 / 500 / 600 / 800, dark the same list in the other
   order, 800 / 600 / 500 / 400 / 200, so in both modes the low end is the
   step nearest the canvas and a heatmap reads "more" as "further from the
   ground", ink in light and light in dark. Measured:

   | step | light | on base / raised | dark | on base / raised | ΔL to the step before |
   |---|---|---|---|---|---|
   | 1 | twilight/200 | 1.30 / 1.39 | twilight/800 | 1.47 / 1.37 | — |
   | 2 | twilight/400 | 2.34 / 2.52 | twilight/600 | 3.27 / 3.03 | .16 / .20 |
   | 3 | twilight/500 | 3.65 / 3.92 | twilight/500 | 4.97 / 4.61 | .11 / .10 |
   | 4 | twilight/600 | 5.55 / 5.96 | twilight/400 | 7.73 / 7.18 | .10 / .11 |
   | 5 | twilight/800 | 12.28 / 13.19 | twilight/200 | 13.99 / 12.99 | .20 / .16 |

   Steps 1 and 2 do not reach 3:1 against the canvas, by construction: a
   heatmap's low cell sits near its ground and is identified by the legend
   and its neighbours, not by its own edge. What the suite holds is the
   separation between neighbours, ΔL ≥ .09 in OKLCH, twice the surface
   ladder's step of .043 (the tightest pair, 500 to 600, measures .099), and 3:1 for steps 3 to 5 on both surfaces in both modes.
   The wider ramp 100 / 300 / 500 / 700 / 900 separates better (ΔL .12 to
   .20) and was refused: its dark 900 is 1.06:1 against the card, ΔL .04,
   one surface step and no more, so the low cell would vanish on a card.

   Twilight rather than the alternatives. The "alpenglow" ramp, flare/200,
   flare/400, glow/500, twilight/600, twilight/800, has the same figures to
   the decimal, because every family shares one lightness per stop, and is
   sequential by construction for the same reason; but in dark the order of
   the hues reverses (gold low in light, violet low in dark), and a map that
   changes direction when the mode changes is not one map. Glacier measures
   weaker (500 at 3.20 on the light base) and is the first category, which
   would put a heatmap and a bar chart's first series in one hue. Twilight
   is the accent, but a cell has no button's shape, and the accent as the
   first chart colour is Carbon's and Cloudscape's precedent.

3. **The diverging ramp is twilight against flare, three steps a side and
   a neutral centre.** ColorBrewer's PuOr pair, safe under the common
   colour-vision deficiencies, and never red against green. Light: `low-3`
   to `low-1` twilight 800 / 600 / 400, `mid` stone/200, `high-1` to
   `high-3` flare 400 / 600 / 800. Dark: twilight 200 / 400 / 600,
   stone/800, flare 600 / 400 / 200. Neighbours are ΔL ≥ .16 apart at every
   step; the ends measure 12.28 / 13.19 and 11.84 / 12.72 in light, 13.99 /
   12.99 and 14.00 / 13.00 in dark; the `±1` steps 2.34 / 2.52 and 2.36 /
   2.53 in light, 7.73 / 7.18 and 7.68 / 7.13 in dark; the centre 1.27 /
   1.36 light and 1.58 / 1.47 dark, ΔL .075 and .17 from the canvas. Stone
   is the centre because it is the neutral; mist has a cyan cast that would
   lean the centre towards one side. The warm side is "high" by the thermal
   convention and nothing more: the rule is that a sign never rests on hue
   alone, a diverging chart carries its zero line and its legend.

4. **A value inside a cell takes a named text token, measured per step.**
   Light: `text/primary` on steps 1 and 2 (11.70, 6.47), `white` on 4 and 5
   (5.96, 13.19). Step 3, twilight/500, carries neither at AA, 4.15 with
   `text/primary` and 3.92 with white, which is the 500 stop's known
   property ("carries no label at all", primitives.ts); it is recorded as
   an exemption at its figures, as `text/disabled` is, and a value on it is
   set as large text, 3:1, or beside the cell. Dark: `text/primary` on 1
   and 2 (12.28, 5.55), night/950 on 3 to 5 (4.97, 7.73, 13.99); night/950
   is what `interactive/on-accent` resolves to in dark, and the page says
   so. Diverging: every step carries one of the two at AA or better, light
   `white` on `low-3`, `low-2`, `high-2`, `high-3` (13.19, 5.96, 5.74,
   12.72) and `text/primary` on `low-1`, `mid`, `high-1` (6.47, 11.93,
   6.43); dark night/950 on the `±3` and `±2` steps (13.99, 7.73, 7.68, 14.00)
   and `text/primary` on the `±1` steps and `mid` (5.55, 5.34, 11.43).
   No `chart/on-*` tokens: the rule names an existing token per step, and
   the suite holds each pairing.

5. **The categorical rules.** Series take the six category hues in the
   order glacier, flare, moss, glow, amber, ember, by hue distance, so the
   closest pairs come last: ember against glow measures 1.01:1 and glacier
   against moss 1.03 in light, the six fills sharing one lightness. That
   sharing is the point, every category label and tint holds the same
   figures, and it is also the warning: on a chart the six differ by hue
   alone, so a reader who does not see hue does not see six series. Every
   categorical chart labels its series directly or by a marker shape, not
   by a colour legend alone. There is no seventh hue: a seventh series
   splits the chart, or takes a pattern fill. The six are not statuses, a
   warning is not "amber", which the category group already says.

6. **The rest of a chart uses tokens that exist.** Gridlines
   `border/subtle`, axes `border/default`, tick and axis labels
   `text/secondary`, a title `text/primary`, the hover of a bar the wash.
   A chart sits on a card or on the canvas, which is why every figure is
   read against both.

## Deliverables

- `src/tokens/theme.ts`: the twelve entries with a comment block in the
  file's style; `src/styles/tokens.css`, `tailwind-theme.css` and
  `docs/figma/alpenglow-variables.json` regenerated, `scripts/export-figma.ts`
  gaining `'color/chart'` with fill scopes. Fernando applies the twelve variables
  in Figma.
- `src/tokens/contrast.test.ts`: the sequential steps' neighbour ΔL and the
  3:1 of steps 3 to 5 on both surfaces; the diverging neighbours' ΔL, the
  ends and `±1` steps at 3:1 where they reach it and recorded where they do
  not; the per-step label pairings at AA; the light step-3 exemption at
  4.15 and 3.92.
- `app/colour/page.tsx`: a sixth table, "Chart", one row per token, the
  ratio against `surface/raised` as the other groups, with `floor` at 3
  and the near-canvas steps recorded rather than held (`sequential-1`,
  `sequential-2`, `mid` and the light `low-1` / `high-1`).
- `app/data-vis/page.tsx`: "Data visualisation" under Foundations. Three
  charts as inline SVG from the tokens, a bar chart in six categories with
  direct labels, a heatmap on the sequential ramp with values in the cells
  under the label rule, a diverging bar chart with its zero line; the two
  ramps as strips with each step's figures on base and raised in both modes,
  the label per step; the categorical order and the six-series rule; the
  tokens for the rest of a chart. A nav entry and a Foundations card.
- README counts, CHANGELOG, MEMORY.md (whose Theme row still says 58 and
  is brought to 94), this spec, the plan.

## Not in this spec

A Chart component or a charting library. Pattern fills as tokens. A second
sequential hue. Colour-vision simulation in the suite: the ΔL figures are
the instrument, a simulated view is a later page.
