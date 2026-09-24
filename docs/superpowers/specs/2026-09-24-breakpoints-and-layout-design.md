# Breakpoints and layout — design

2026-09-24. The second piece of the roadmap's fourth wave: "named
breakpoints as tokens, replacing the site's 1496 / 1160 and the SideNav's
760 literal; the page grid and the gutters the screen uses; the decision to
ship no z-index tokens". Decided with Fernando section by section, after a
read of the breakpoints of twelve systems (verified at their sources),
StatCounter's widths for August 2026, the original product's design file
(margins and gaps measured on eight frames at 1440) and claude.ai's own
stylesheets (Tailwind's five steps, sixteen and fourteen uses of `md` and
`sm`).

This spec covers four things: a **breakpoint scale** and how it reaches
CSS, JS, Tailwind and Figma; **layout margin and gap** by breakpoint; the
**no z-index tokens** decision with the isolation it needs; and a **Layout
page** under Foundations. The Table's columns that give way as its space
shrinks — found while deciding this — get their own spec, next.

## Decisions

### The scale

1. **Tailwind's five steps and one below them.**

   | Name | rem | px |
   |---|---|---|
   | `xs` | 30 | 480 |
   | `sm` | 40 | 640 |
   | `md` | 48 | 768 |
   | `lg` | 64 | 1024 |
   | `xl` | 80 | 1280 |
   | `2xl` | 96 | 1536 |

   Tailwind's scale is the one most developers already carry, claude.ai
   uses the same five, and 768 is shared by nine of the twelve systems
   read. `xs` is where a phone's layout ends: the Toast and the
   CommandPalette already turn at 480, and every phone width in the data
   (360–440) is under it. `sm` and `2xl` have no reader yet; they ship
   because the scale is a known one, the one exception to "no token
   without a reader", and said so on the page.

2. **320 is a floor, not a breakpoint.** `(width >= 320px)` is true on
   every screen and changes nothing. It is the narrowest width the system
   is built and tested at — WCAG 1.4.10's reflow — and ships as
   `minViewport = 320`, named on the page and in Figma as
   `breakpoint/min`.

3. **The source** is `src/tokens/scale.ts`: `breakpoint` in px and
   `minViewport`. Everything a browser reads is in rem (÷ 16), so the scale
   follows a reader's default font size: someone with larger text gets the
   narrower layout sooner.

4. **How it reaches each place.** A media query cannot read a custom
   property, so the token is not a `var()` inside `@media`:

   | Where | What |
   |---|---|
   | `tokens.css` | `--ap-breakpoint-xs: 30rem` … for JS and reading, with a comment saying `@media` cannot use them |
   | `tailwind-theme.css` | `--breakpoint-xs: 30rem` and the other five restated, so `xs:` exists and the five stay pinned if Tailwind's defaults move |
   | the package root | `breakpoint`, and `media.up.md` = `'(width >= 48rem)'`, `media.down.md` = `'(width < 48rem)'` for each step, for `useMediaQuery` |
   | Figma, `Alpenglow Scale` | `breakpoint/xs` … `breakpoint/2xl` and `breakpoint/min`, scope `WIDTH_HEIGHT`, for frame widths |

   Taken over `@custom-media` resolved at build, which would need a plugin
   in two pipelines and leave a copied `.module.css` that does not work on
   its own.

5. **Written in range syntax.** `@media (width < 48rem)` and `@media
   (width >= 48rem)`. No more `max-width: 1279px` beside `min-width:
   1280px`, no more minus-one values.

6. **A test holds it.** It walks `src/` and `app/` — `.css`, inline
   `<style>` strings and media-query strings in `.ts` and `.tsx` — and
   fails on any width in an `@media` or a `matchMedia` that is not one of
   the six in rem. Out of its reach: `prefers-*`, `pointer`, `hover` and
   `forced-colors`, which are not widths; `@container`, where a component
   answers its own space (decision 12); test files.

### The site on the same scale

7. **Measure where the content breaks, then round to the safe step.** The
   site's breakpoints were derived from its own layout and held by tests
   to the numbers they are made of. Each moves to the step on the safe
   side of its measure, and its test changes from an equality to an
   inequality, so the derivation stays checked:

   | Today | Becomes | Why it is safe | What changes |
   |---|---|---|---|
   | 1496 (wide page) and 1440 (the drawer overlays) | one edge at `2xl` | at 1536 with the drawer in the flow and 40 margins, 1144 is left; the wide page needs 1108 with 20 gaps (1120 with today's 24) | two tiers become one; between 1441 and 1535 the drawer overlays, as it does at 1440 today |
   | 1160 (the evidence column goes) | `xl` | higher, so the column goes sooner and is never squeezed; at `lg` the new margin and gap would leave 708 for a Table specimen's 704, four pixels of room | 1160–1279 lose the evidence column |
   | 760 / 761 (the narrow bar) | `md` | where the SideNav turns too | 761–767 get the narrow bar |
   | 370 (the specimen bleeds to the edge) | `xs` | higher, so the Calendar has room on every phone | every phone shows specimens edge to edge, 40px wider |
   | 1000 inline on the Scheduler page | `lg` | 24 sooner | nothing visible |

   The rule goes on the Layout page for anyone with a layout of their own,
   with the site's arithmetic as its example.

### Margin and gap

8. **Two tokens that change with the viewport**, measured from the
   original product's design file (40 around the content at 1440, 20
   between columns and cards, a 12-column guide with a 20 gutter) and
   stepped down for narrower screens:

   | Mode | Viewport | `layout/margin` | `layout/gap` |
   |---|---|---|---|
   | Narrow | < `lg` | 16 | 16 |
   | Medium | `lg` to < `xl` | 24 | 20 |
   | Wide | ≥ `xl` | 40 | 20 |

   **Margin** is the space around the content region — from the edge of
   the navigation, the edge of the window and the TopBar alike. **Gap** is
   the space between panes and between the columns of a composition. Two
   names because the file keeps them apart (40 and 20) and so do the
   systems read. The margin stays 16 up to `lg` because the Scheduler's
   five columns need 722: at 768 with the SideNav in its sheet, 768 − 2×16
   = 736 fits and 2×24 would not.

9. **A custom property can change inside a media query**, so the tokens
   are plain `var()`s for whoever uses them:

   ```css
   :root { --ap-layout-margin: 16px; --ap-layout-gap: 16px; }
   @media (width >= 64rem) { :root { --ap-layout-margin: 24px; --ap-layout-gap: 20px; } }
   @media (width >= 80rem) { :root { --ap-layout-margin: 40px; } }
   ```

   Source `src/tokens/layout.ts`, beside `density.ts`. Tailwind gains
   `--spacing-layout-margin` and `--spacing-layout-gap` through `@theme
   inline`, as density does, so `px-layout-margin` follows the viewport
   where it is used. Figma gains a fifth collection, **Alpenglow Layout**,
   modes Narrow, Medium and Wide, scope `GAP`: a designer sets a frame's
   mode and the measures follow. Not "Compact / Expanded": Density already
   has a Compact, and two meanings for one word in one file is a trap.

10. **The navigation is outside the grid.** Margin and gap apply to the
    content region only. The SideNav is its own column with its own
    widths (200, 80, a sheet below `md`) and its own padding; the margin
    starts at its edge. Below `md`, with the SideNav in its sheet, the
    content has the whole width and the margin starts at the window's
    edge. On the site the rail and the drawer are outside it the same way.

11. **The TopBar's padding is the margin.** Its fixed 24 would sit 8 in
    from the content at 16 and 16 out from it at 40. It becomes
    `padding-inline: var(--ap-layout-margin)`, so the date and the avatar
    line up with the content under them. In the original the bar spanned
    the navigation too and 24 did not need to align; here the TopBar sits
    in the content column.

12. **No column grid in code; one in Figma.** Alpenglow ships no
    12-column grid classes. A dense app's layout is panes — navigation,
    one or two working panes, a drawer over them; Material 3's and
    Primer's model — and the Scheduler and the Table size themselves. In
    the original file the 12-column grid was a guide on 2 of about 15
    frames and no layout followed its columns. The pane model goes on the
    Layout page as prose and a drawing: one pane below `xl` (two behind
    Tabs), two side by side from `xl`, the navigation on `md`. For
    designers, `apply-variables.md` describes a 12-column layout grid
    style whose gutter and offset are bound to `layout/gap` and
    `layout/margin`. The two kinds of responsiveness are named apart:
    **the viewport** for the chrome and the page's composition, **the
    container** for a component answering its own space (the Alert's
    400px today, the Table's columns in its spec).

### Layering

13. **No z-index tokens.** A z-index scale orders layers that compete on
    one stack; here nothing does. What floats goes to the top layer — the
    Dialog, Drawer, Popover, Tooltip, Select, Combobox, DatePicker,
    DropdownMenu, PageSize, Toast, the SideNav's sheet and, through the
    Dialog, the CommandPalette: twelve components, no z-index, stacked in
    the order they opened. What stacks inside a component is shut in its
    own `isolation: isolate`. **The rule:** a z-index lives only inside a
    component that isolates, never above 3; above the page there is only
    the top layer. The page's own stack belongs to the product, and a
    sticky bar at `z-index: 1` sits over everything Alpenglow draws.
    Stated on Decisions, with one paragraph and a link on the Layout page.

14. **Three components escape today** and are fixed: the Scheduler (a
    sticky head at 3, hours at 2), the Table (a sticky header at 1) and
    the Slider (the upper input at 1) have no isolation, so their values
    join the page's stack — a product's sticky bar at 1 or 2 would have
    the Scheduler's head scroll over it. Each gains `isolation: isolate`
    on its root. A test: any `.module.css` under `src/components/` with a
    `z-index` declares `isolation: isolate`, and no value is above 3. The
    site is outside the test — its skip link (3), sidebar (2) and rail (1)
    are the page's stack, which is the product's.

## Migrations

| Where | Today | Becomes |
|---|---|---|
| SideNav `narrow` default | `(max-width: 760px)` | `media.down.md` |
| Toast, CommandPalette | `(max-width: 480px)` | `(width < 30rem)`: a window of exactly 480 is no longer a phone |
| TopBar | `padding-inline` 24 | `var(--ap-layout-margin)` |
| Scheduler, Table, Slider | no isolation | `isolation: isolate` on the root |
| The screen | 1280 / 1279, 800, 480; margins 24 / 16, gap 24 | `xl`, `lg` (the navigation's sheet), `xs`; `layout/margin` and `layout/gap`, and the 800 query goes |
| `app/docs.css` | 1496, 1440 / 761, 1160, 760, 370; `.page` padding 40 / 32, 32 / 20 and gaps 32, 24 | decision 7's steps; `.page` padding `layout/margin` on every side but the foot (96 / 48 stays), gaps `layout/gap` |
| `app/ui/Nav.tsx` | `NARROW = '(max-width: 760px)'` | `media.down.md` |
| `app/scheduler/page.tsx` | `max-width: 1000px`, `(max-width: 760px)` | `lg`, `media.down.md` |
| `app/navigation/page.tsx` | props table default `'(max-width: 760px)'` | `media.down.md` |

The screen at `xl` with the SideNav expanded leaves the Table about 260
beside the Scheduler's 722 (about 290 today): tight, and the reason the
Table's columns come next. At 1440 it has about 420.

## Deliverables

- `src/tokens/scale.ts` (`breakpoint`, `minViewport`), `src/tokens/layout.ts`
  (the margin and gap by mode, and `media`); `build-css`, `build-tailwind`,
  `export-figma`, `apply-variables.md`; the root exports.
- Tests: the generated blocks (`--ap-breakpoint-*`, the layout block and
  its two queries, `--breakpoint-*` and `--spacing-layout-*` through a real
  Tailwind `compile()`, the Scale additions and the Layout collection in the
  Figma export); the scale test (decision 6); the layering test (decision
  14); `media` and `breakpoint` exported and shaped; the TopBar reading the
  margin; the SideNav's default; `Nav.test` and `DocPage.test` as
  inequalities; the screen's local-values test still passing without its
  literals.
- The migrations above.
- `app/layout/page.tsx` — "Breakpoints and layout" — under Foundations,
  after Density: the scale with who reads each step and the floor; using
  it (range syntax, `media`, `xs:`); the rule for a layout of one's own
  with the site's arithmetic; the viewport and the container; margin and
  gap with a drawing of the pane model in its three modes, the navigation
  outside it; layering, one paragraph and a link.
- `/decisions`: the z-index decision.
- `contents.ts`, the Foundations cards, `CHANGELOG.md` under Unreleased —
  **Added**: `breakpoint`, `media`, `layout/margin`, `layout/gap`, the
  `xs:` variant, the Layout page; **Changed**: the SideNav turns at 768,
  the Toast and the CommandPalette below 480, the TopBar's padding follows
  the margin, the Scheduler, Table and Slider isolate.
- `MEMORY.md`: the claim; two invariants — no width outside the scale, no
  z-index outside an isolate; the Figma list (`breakpoint/*`, the Layout
  collection, the 12-column grid style). The roadmap's wave 4 row, with
  the Table's columns under what moved up.
- Seen in Chromium: the site and the screen at 375, 768, 1024, 1280, 1440
  and 1536; 320 with no sideways scroll; the site's drawer at 1500, now
  overlaying; the Scheduler's head under a test sticky bar at `z-index: 1`.

## Not in this spec

- **The Table's columns giving way** as its space shrinks, by priority,
  whether the viewport or a side panel narrows it — its own spec, next.
  Until then the Table keeps its 40rem container query.
- A spacing token for inside a pane (the 8 between dashboard cards is
  `spacing/100`); it comes with the Paths if a pane's spacing ever has to
  follow the viewport or the density.
- A reading measure as a token (the site's 37.5rem stays local); margin or
  gap that follow the density; a `3xl`; more margin steps.
- Strategies for overlays outside the top layer (portals, third-party
  libraries): the page says only that one with a high z-index stays under
  an open `<dialog>`, which is the behaviour wanted.
- Not checked, said so on the page: Safari, Firefox, a real touch device,
  text zoom beyond the browser's default font size.
