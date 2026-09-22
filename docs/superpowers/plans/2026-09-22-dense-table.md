# The dense Table, and Filters — plan

Spec: `../specs/2026-09-22-dense-table-design.md`.

1. Table: tests for the root, the sticky header, the selection bar and the
   footer; then the structure, the stylesheet and the props.
2. `Filters`: tests, component, stylesheet, index; export; contrast cases.
3. Browser: a bounded table with the header pinned, the bar following the
   page over a long table, the stripe, light and dark, a phone width;
   Filters adding, changing and removing.
4. `app/table/page.tsx`: a "Dense" section — the composed screen with the
   toolbar, Filters, the table with sticky header, selection bar and footer.
   `app/filters/page.tsx`; nav entry (twenty-seven); section card.
5. `npm run check`, `npm run build:docs`; code review; records.
