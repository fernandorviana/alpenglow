# The chart palette — plan

Spec: `../specs/2026-09-23-chart-palette-design.md`.

1. `theme.ts`: the thirteen `chart/*` entries with their comment; the export
   script's scope; `npm run build:css` and the Figma export.
2. `contrast.test.ts`: the sequential and diverging cases, the neighbour ΔL,
   the label pairings, the light step-3 exemption at its figures. Red first,
   then the tokens make them green.
3. The Colour page's sixth table, with `against` and `floor` taught the new
   group; its test already demands a row per token.
4. `/data-vis`: the three SVG charts, the ramp tables on both surfaces in
   both modes, the rules; nav entry, Foundations card; the pages test and
   the search index follow.
5. Browser: light and dark, a phone width.
6. `npm run check`, `npm run build:docs`; code review; README, CHANGELOG,
   MEMORY.md.
