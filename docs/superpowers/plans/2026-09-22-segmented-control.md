# SegmentedControl — plan

Spec: `../specs/2026-09-22-segmented-control-design.md`.

1. `src/components/segmented.module.css`: the segmented rules moved out of
   `Tabs.module.css`; the Tabs take the shared classes and the new custom
   property names; Tabs tests updated; `npm run check` green with nothing
   drawn changed.
2. `SegmentedControl` tests, component, index, exports.
3. Browser: the docs page beside the Tabs' segmented specimen, light and
   dark, keyboard, a phone width.
4. `app/segmented-control/page.tsx`; nav entry (twenty-nine); section card;
   the Tabs page's link.
5. `npm run check`, `npm run build:docs`; code review; records.
