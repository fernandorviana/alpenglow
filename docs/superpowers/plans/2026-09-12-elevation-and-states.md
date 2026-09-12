# Elevation and states — implementation plan

**Goal:** Land the surface step `925`, the dark ladder `950 → 925 → 900`, the
wash tokens, the alpha `border/subtle`, the lightness instrument, the
components that consume them, and the documentation that records why.

**Spec:** `docs/superpowers/specs/2026-09-12-elevation-and-states-design.md`

## Global constraints

- TypeScript is the source; never hand-edit `src/styles/*.css` — run `npm run build:css`.
- Every value in `theme.ts` is an alias; every alpha needs an `alpha/*` primitive.
- No colour literal in a component file.
- `npm run check` passes at the end of every task.
- Branch `feat/elevation-and-states`; integrate by rebasing onto and fast-forwarding local `main`; do not push.
- Commit messages end with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.

## Tasks

- [ ] **1. Tokens and instrument.** `generate-ramps.mjs` (done), `primitives.ts` (925 in every family, five alphas), `theme.ts` (ladder, wash, border/subtle, notes), `contrast.ts` (`lightness`, compositing `tokenContrast`), `vocabulary.ts` (`FillTone`), `contrast.test.ts` rewritten where the spec says, `npm run build:css`, `export-figma`.
- [ ] **2. Components and site styles.** Button, Table, DropdownMenu (+ test), Calendar, Dialog, `app/docs.css`.
- [ ] **3. Docs.** `/elevation` page + nav, Decisions, Colour, Dropdown menu and Date picker evidence, README.
- [ ] **4. Records.** `MEMORY.md`, the token skill, `package.json` version `0.2.0`.
- [ ] **5. Check in the browser**, both modes: the ladder, a hovered row, ghost and neutral buttons, the menu, the dialog over its scrim, the calendar.
- [ ] **6. Integrate** onto local `main`.
