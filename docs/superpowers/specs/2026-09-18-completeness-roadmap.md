# A more complete Alpenglow — roadmap

Decided with Fernando on 2026-09-18, after the two site surveys
(`2026-09-15-atlassian-site-survey.md`,
`2026-09-18-design-system-sites-survey.md`). This is a roadmap, not a
design: each component below still gets a spec of its own, in this folder,
before it is built.

## Decisions taken with Fernando, 2026-09-18

- **Alpenglow is for designers and developers equally.** It is a product
  and a portfolio that shows mastery as a designer and a design-system
  architect, and it must be excellent for developers too — just not only
  for them. The surveys' "developer-first" framing was corrected.
- **It is meant to be used in real implementations.** Adoption is a goal,
  not a side effect.
- **The idea is a more complete design system.** Coverage is now a goal.
  This replaces the earlier priority of six to eight components over broad
  coverage. The bar per component does not drop (see "Done" below).
- **No embedded Storybook.** Interactive pieces on the site are built from
  Alpenglow's own components, so the tool is also the proof.

## What exists (2026-09-18, `0.2.0`)

Sixteen exported pieces: Avatar and AvatarGroup, Badge, Button, Calendar,
Checkbox, DatePicker, Dialog, DropdownMenu, Field, Input, Loader, Radio,
Select, Switch, Table, Textarea. 54 theme tokens, five token files, the
Tailwind theme, the contrast instrument (`contrast`, `resolve`,
`tokenContrast` are public exports).

The site already holds components the package does not: `Card`,
`CopyButton`, `CodeBlock`, the `Search` combobox, the `Nav` rail and
drawer, `Pager`, `OnThisPage`, `ThemeToggle`. **Crest feeds Terrain:**
where a site piece is the general pattern, the package component is
graduated from it rather than written beside it, and the site then
consumes the package's.

## Done, for every component

Unchanged from how the first sixteen were made; written down so parallel
sessions hold the same line.

1. A spec in this folder, with the decisions and the rejected alternatives.
2. Drawn in the Alpenglow Figma file, or the deviation recorded. **Which of
   the components below are already drawn is not known from the
   repository** — the file key is private and Fernando pastes it when a
   session needs it. First step of each spec: look.
3. Native element or platform feature first (`<dialog>`, `popover`, CSS
   anchor positioning, `<details>`, `<progress>`, `<input type=range>`);
   a hand-built widget only with the reason recorded.
4. No colour literals; timing from the motion tokens; `box-sizing`
   declared; `'use client'` where React's client build is needed — the
   existing suites enforce all four the day the files exist.
5. Every text and boundary pair measured in both modes by
   `contrast.test.ts`; a new token gets its `use` note and a consumer.
6. Tests beside the component, stylesheet-reading where the rule is
   visual; axe on the page and on every state a page renders closed.
7. A docs page in the one-page shape (Try it, Choosing, anatomy, states,
   accessibility, props), its entry in `contents.ts`, a Props table so the
   search indexes it.
8. Checked in a real browser, both modes, 800 and 320, focus ring by eye.
9. `MEMORY.md`, the README's counts, and the changelog entry.

## The instrument: one dense screen

A real screen built only from Alpenglow — a scheduling day view with a
data table beside it, the kind of interface the system was made for —
lives on the site as a page of its own. Density, mode and width are
switchable. It is built alongside wave 1, and **whatever it cannot be
finished without moves up the list**. It is also the portfolio's best
single picture. No product or brand name from the original work appears
in it.

---

## Wave 1 — what blocks any real screen

| Component | Built on | Reads | Notes |
|---|---|---|---|
| **Tabs** | `role="tablist"`, roving tabindex; a link variant for routes | `border/*`, `interactive/selected`, the wash | The selected indicator adds geometry, never colour alone (Conventions). |
| **Tooltip** | `popover` + anchor positioning, as DropdownMenu | `surface/inverse`, its `on-` text | Open decision: `popover="hint"` is not in Safari; `manual` with hover and focus handlers is the likely call. Never on a disabled control. |
| **Toast** | `popover="manual"` for the top layer; `role="status"` / `"alert"` | `surface/inverse` or `overlay`, `elevation/md` | A region component plus an imperative `toast()`; reduced motion keeps the fade, drops the travel. |
| **Alert** (inline) | a block with `role` by tone | `TintTone` — `surface/<t>-subtle` + `text/<t>` | The ceiling already exists in `vocabulary.ts`; icon carries the tone with the colour. |
| **Card** | graduated from `app/ui/Card` | `surface/raised`, `border/subtle` | Invariant 4 decides its edge per mode. |
| **Pagination** | `nav` + Buttons | Button's tokens | Also the Table's footer in wave 2. |
| **Link** | `<a>` | `text/accent`, focus geometry | Inline and standalone; the Button-as-link question is decided here once. |

Ships as **`0.3.0`**, with the first `CHANGELOG.md`.

## Wave 2 — containers, finding things, and the dense Table

| Component | Built on | Notes |
|---|---|---|
| **Popover** | extracted from DatePicker and DropdownMenu | One placement stylesheet, two existing consumers moved onto it; `src/test/popover.ts` already serves both. |
| **Combobox** | graduated from `app/ui/search/Search.tsx` (Input + listbox) | The IME, Esc and `isComposing` rules of invariant 22 come with it. ~~Select stays native~~ (revised 2026-09-21: `Select` is a listbox of the system's own and the native one is `NativeSelect`; see `2026-09-21-select-design.md`, whose `options.ts` is this Combobox's base); the Select page's test for telling them apart gains a third case. |
| **Drawer** | ~~`<dialog>`, side-anchored~~ `popover="manual"` over the content, or in the flow beside it | ~~Shares `src/test/dialog.ts`~~ Revised 2026-09-21 (Fernando): not modal, since the calendar beside it stays live and a form left half-way is asked about by a Dialog. Invariant 20's close rules apply unchanged: it never closes itself. Drawn as the Side Drawer set. |
| **Accordion** | `<details name>` | Exclusive groups are the platform's. |
| **Breadcrumb** | `nav` > `ol` | `aria-current="page"` on the last item. |
| **Skeleton**, **EmptyState**, **Progress** | `<progress>` for the last | Skeleton's shimmer is an `infinite` loop and keeps its own timing; reduced motion slows, never freezes (invariant 6). |
| **Tag** | ~~Badge's tones~~, removable | Decided 2026-09-21 (`2026-09-21-tag-design.md`): a sibling of the Badge and not a variant, and neutral only until the theme has colours for categories. |
| **Table, dense** | the existing Table | Sorting (`aria-sort`), sticky header, a bulk-actions bar over a selection, column filters, Pagination as footer. Invariants 7 and 8 stand. |

Ships as **`0.4.0`**.

## Wave 3 — navigation, the remaining inputs, the scheduler

| Component | Built on | Notes |
|---|---|---|
| **SideNav**, **TopBar** | graduated from `app/ui/Nav` | "Menu" is reserved for navigation (Conventions); the rail, the drawer and the narrow overlay of invariant 19 are the pattern. |
| **SegmentedControl** | a radio group | Shares `choice.module.css`'s rules for the unmarked boundary. |
| **Slider** | `<input type=range>` | Track and thumb boundaries at 3:1. |
| **FileUpload** | `<input type=file>` + drop | The drop zone's dashed edge is a boundary and is measured. |
| **Scheduler** | Calendar's date logic | Day and week; the component the system's origin asks for. Its own spec, likely its own wave. |
| **CommandPalette** | Dialog + Combobox | The site's ⌘K, once both parts are in the package. |

Ships as **`0.5.0`**; `1.0.0` is a separate decision about the stability
promise, not a wave.

---

## Wave 4 — the screen, the foundations, and staying measured

Added 2026-09-23, the day wave 3 shipped as `0.5.0`. With every component
the dense screen needs now in the package, the instrument this roadmap
promised alongside wave 1 and never built comes first; the foundations
listed below it are what the screen and a second team both need; and the
one claim no system read makes — contrast that survives customisation —
is the wave's third leg.

| Piece | Built on | Notes |
|---|---|---|
| **The dense screen** — built 2026-09-23, on main 2026-09-24 as `cb3f95f`, unreleased | Scheduler, Table, SideNav, TopBar, Filters, CommandPalette, Toast | A scheduling day with a table beside it, on the site as a page of its own; density, mode and width switchable; nothing from the original product's name in it. Whatever it cannot be finished without moves up the list, as promised. The portfolio's single best picture. **What moved up:** density became a foundation (five `density/*` tokens, compact on any element, comfortable under touch, a Density page; 34ab2ad, 10aec6f, 455785e), the Table gained a current row (`currentId`, 702370d, 6308409) and the Link says a new tab for an internal link (b6ac4ee). Spec `2026-09-23-dense-screen-design.md`; the gaps it found and did not fix are listed under the frame on `/screen` and in `MEMORY.md`. |
| **Breakpoints and layout** — built 2026-09-24, on main 2026-09-24 as `e66bd3c`, unreleased | `scale.ts` | Named breakpoints as tokens, replacing the site's 1496 / 1160 and the SideNav's 760 literal; the page grid and the gutters the screen uses; the decision to ship **no z-index tokens**, stated on Decisions with the one rule (the top layer, and `isolation` where a card stacks). **What moved up:** the Table's columns giving way as its space shrinks, built (the next row). |
| **Table responsive columns** — built 2026-09-24 on branch `table-responsive-columns`, unreleased | Table, Button | Columns shrink to a minimum and leave by priority as the Table's own width shrinks, whether the window or a side panel narrows it; the row's actions gather into "⋯" first; the primary, selection and actions never leave. Replaces the 40rem collapse to a list. **What moved up:** the Button's icon-only form. Spec `2026-09-24-table-responsive-columns-design.md`. |
| **Paths** | the dense screen | The first three patterns, drawn dashed in the Vocabulary until now: a filtered table, a form in a dialog, an empty first-run state, each a page with the composition and what the suite holds for it. |
| **Brand theming that stays measured** | `theme.ts`, `contrast.test.ts` | A documented path and a script: re-point the accent aliases in a copy of the theme, run the suite against it, get the pairs that fall. A page that shows a second brand passing, and one failing, with the list. |
| **The specimen's own light and dark, and the state matrix** | `tokens.css` | A scoped dark block in the generated stylesheet so a "Try it" can stand beside its dark twin; a state matrix per component with the ratio in every cell in both modes, forced by `data-state`. The two site pieces the surveys ranked first. |
| **The developer surface** | the search extractor | `llms.txt`, each page as Markdown, a Source link beside every title, the `applying-alpenglow-tokens` skill on a page of its own, `app/not-found.tsx` in the site's chrome. |

Ships as **`0.6.0`**. Content and voice guidance rides with the Paths.
Carried alongside, when Fernando wants them: the Slider's redesign (his
call of 2026-09-22), the Scheduler's third phase (a long press to drag on
touch, Time Travel), the input's resting boundary (the blocked pair), and
the 36 `category/*` and `chart/*` variables and the `Alpenglow Density`
collection still to apply in Figma.

## Wave 5 — adoption

Starters for Next.js and Vite with the Tailwind theme and the dark switch
wired; the public Figma library; the deprecation policy; the decisions on
the shadcn registry and an MCP server; and, once wave 4 has held for a
release, the `1.0.0` stability promise. Not scheduled until wave 4 is on
main.

## Foundations to add

- **Breakpoints as tokens.** The site's 1496 / 1160 / 760 are derived from
  its own layout; a product needs named ones in `scale.ts`.
- **Layering without a z-index scale.** Every overlay here lives in the
  top layer (`popover`, `<dialog>`). Candidate decision: Alpenglow ships
  **no z-index tokens**, says why, and documents the one rule. None of the
  nineteen systems read can say that.
- **A data-visualisation palette**, each step with its measured ratio on
  `surface/base` and `raised` in both modes — Cloudscape names a ratio in a
  description; this measures it.
- **Grid and page layout**, and **content and voice** guidance.
- **Paths.** The Vocabulary draws patterns dashed. The first ones come out
  of the dense screen: a filtered table, a form in a dialog, an empty
  first-run state.

## Around the code — what adoption needs

In the order it unblocks a second team:

1. `CHANGELOG.md` and a deprecation policy, from wave 1.
2. **Brand theming that stays measured.** A documented path: re-point the
   accent aliases in a copy of `theme.ts`, run the contrast suite against
   it, get the list of pairs that fall. No system read guarantees contrast
   after customisation.
3. A public Figma library (the Alpenglow file is clean of earlier names;
   the key in private notes stays private).
4. Starters: Next.js and Vite, with the Tailwind theme and the dark switch
   wired.
5. The LLM surface: `llms.txt`, each page as Markdown from the search
   extractor, the skill on a page of its own.
6. Reopened, not decided: the shadcn registry (the cascade-layer problem of
   2026-09-11 stands) and an MCP server.

The site work from the two surveys runs beside the waves, not after them:
the specimen's own light/dark, the state matrix with ratios, the playground
built from the system's own controls, token lineage on hover, the Source
link and the 404.

## Working in parallel

One component per session and per branch; a session claims its component
by adding a line under this roadmap's entry in `MEMORY.md` before it
starts. Shared files — `src/index.ts`, `contents.ts`, `theme.ts`,
`MEMORY.md`, the README — are touched last and staged by path. Rebase and
fast-forward; tell the other session when a shared file moved. `npm run
check` and `npm run build:docs` before any push.

## Open, for Fernando

- The order inside wave 1, and whether the dense screen is a scheduling
  day, a data table page, or both.
- Tooltip's mechanism (above), and whether Tag is a Badge.
- No z-index tokens: adopt as a stated decision, or not.
- The Prioridades section of the private `CLAUDE.md` still states the old
  priority.
