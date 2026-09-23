# Scheduler, phase 2 — plan

Spec: `../specs/2026-09-23-scheduler-interaction-design.md`.

1. `interaction.ts` with its tests: snap, the spans of a drag, a press, a
   move and a resize, `formatSlots`.
2. The events layer measured from its rect; the drag on pointer events
   (create, move, resize, cancel, edge scroll); the draft, the ghost and
   the cursor; the keyboard on the hot event and the cursor; the status;
   the stylesheet; the tests.
3. Browser: a drag to create, a card moved across a column, a resize, the
   cursor by keyboard, the pulse, light and dark, a phone width.
4. `/scheduler`: New Event panel on `draft`, the Availability mode,
   `formatSlots` under "Copy to clipboard", the Undo toast.
5. `npm run check`, `npm run build:docs`; code review; records.
