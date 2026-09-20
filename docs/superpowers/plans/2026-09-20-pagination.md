# Pagination — implementation plan

> **For agentic workers:** executed inline in the session that wrote the spec (superpowers:executing-plans). Short on purpose: the spec carries the decisions and numbers, this carries the order.

**Goal:** `Pagination` in the package — the drawn pages, and the page size as an editable combobox inside the summary sentence — with its contrast cases and the `/pagination` docs page.

**Architecture:** `pages.ts` is a pure function from page, count, siblings and boundaries to the items shown. `Pagination.tsx` is controlled and stateless but for the combobox's draft, which lives in `PageSize.tsx`: an input and a `popover="manual"` listbox placed by CSS anchor positioning, the DropdownMenu's trade.

**Tech Stack:** React 19, TypeScript, CSS Modules, Vitest 5 + jsdom + Testing Library, `src/test/popover.ts`, axe.

**Spec:** `docs/superpowers/specs/2026-09-20-pagination-design.md`.

## Global Constraints

- **Do not commit**; stage by path when asked.
- No colour literals; motion tokens only; `box-sizing` declared; every `var(--ap-…)` real, local properties without the `--ap-` prefix; `'use client'`; the Compiler lint; compound selectors only.
- The Figma key stays out of the repository. `npm run check` and `npm run build:docs` before reporting.

## Tasks

1. **Contrast cases** (spec §4).
2. **`pages.test.ts`, then `pages.ts`.**
3. **`Pagination.test.tsx`, then `PageSize.tsx`, `Pagination.tsx`, `Pagination.module.css`, `index.ts`.**
4. **Export, docs page, navigation**: `src/index.ts`; `app/pagination/page.tsx`; `contents.ts`, count to fifteen; the Components card.
5. **By hand** in the Browser pane (spec §6); fix what it finds.
6. **Records**, then **code review as its own phase**.
