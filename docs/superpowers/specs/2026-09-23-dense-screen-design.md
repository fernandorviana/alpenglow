# The dense screen — design

2026-09-23. The first piece of the roadmap's fourth wave: "a real screen
built only from Alpenglow — a scheduling day view with a data table beside
it … density, mode and width are switchable … whatever it cannot be
finished without moves up the list". Promised alongside wave 1 and never
built; every component it needs shipped in `0.5.0`. Decided with Fernando
section by section. The page shape — a live block with a row of actions
over it, a note under it, then the code and the parts — is taken from
ABUI's block pages (abui.io/blocks/availability), which Fernando showed as
the reference for "good to use and to consult".

This spec covers five things, because the screen cannot be finished
without the first three: **system density** as a foundation, a **current
row** on the Table, the **Link's new-tab announcement** for an internal
link, the **screen** itself, and a **Density** page under Foundations. The
rest of wave 4 — breakpoints, Paths, brand theming, the specimen's own
light and dark with the state matrix, the developer surface — gets its own
specs.

## Decisions

### The frame

1. **Two routes, one screen.** `/screen` is a site page, in the DocPage
   with the rail. `/screen/full` is the screen alone, with no rail and no
   drawer, reading `density`, `theme` and `width` from its query. The site
   page shows `/screen/full` in an **iframe**, so the width switch changes
   a real viewport: the SideNav's `useMediaQuery`, the Toast's and the
   CommandPalette's 480px rules behave as they would in a product, and
   whatever fails, fails in a product too, not because of the frame. Taken
   over a scoped container (the approach that would have needed every
   component to answer its container instead of the viewport, and would
   have left the top layer answering the window anyway).

2. **Mode and density sit on the iframe's `:root`.** Only the screen
   changes; the site around it stays as it is. The scoped dark block in the
   generated `tokens.css` is therefore **not** in this spec: it goes back
   to the specimen piece, where a Try it beside its dark twin on one page
   needs it.

3. **The head of `/screen`**, after ABUI: the title "A scheduling day", a
   line — "Built only from Alpenglow, nothing drawn beside it" — and a row
   of actions: **Open full screen**, a Link to `/screen/full` with the
   current combination, `target="_blank"`, said as opening a new tab
   (decision 12); **Source**, to the screen's folder on GitHub; and a
   count, "N components, 0 local values", computed from the same source
   the local-values test reads (decision 20).

4. **The frame's bar is the system's own controls**: three
   SegmentedControls — width 1440 / 1024 / 768 / 375, density Comfortable
   / Compact, mode Light / Dark. Their state is in `/screen`'s query, so a
   combination can be linked, and Open full screen carries it.

5. **The iframe** is the chosen width by 900 tall, with a Card's border
   and radius so it reads as a screen set on the page. When the width does
   not fit the column it is scaled with `transform: scale` and a caption
   says so ("Shown at 67%"). Mode and density reach it by `postMessage`
   without a reload; the width only resizes it.

6. **Under the frame, for whoever consults it**: *What it proves*, a short
   list of what the screen exercises with the measures (the contrast pairs
   in each mode, the targets in compact); *What moved up the list*, the
   honest record of what the screen could not do without the system
   growing, each with its commit — it opens with the Table's current row,
   the Link's announcement and system density; *Composition*, which
   component sits in which zone, names over a small drawing of the zones.

### The screen

7. **A fictional practice**, "Ridge Physio", a physiotherapy clinic's day
   with five practitioners and about thirty-four appointments. Nothing from
   the original product. The TopBar's brand is a plain glyph and the name.

8. **Zones.** The **SideNav**: Today, Calendar, Clients, Messages, Reports,
   Settings in its footer; only Today is real, the others lead to an
   EmptyState in the body (the first-run state the Paths will need). The
   **TopBar**: the date with ‹ › and **Today** at the start; the search
   button with its **⌘K** hint, a notifications button and the receptionist's
   Avatar at the end. The **day bar**: Filters (practitioner, kind,
   status), a summary in Badges ("34 booked · 5 pending · 2 cancelled"),
   and **New appointment**. The **body**: the Scheduler in day view, one
   column per practitioner, and beside it the Table of the day's
   appointments — time, client, practitioner, type, status.

9. **One state, two views.**
   - A card chosen in the Scheduler marks its row in the Table and scrolls
     it into view; a row chosen in the Table selects its card. Both use the
     same `currentId` (decision 11).
   - The Filters narrow both views.
   - The Table's checkbox selection opens bulk actions, Confirm and Cancel,
     each with a Toast and Undo; the cards change kind at once.
   - A card dragged or resized in the Scheduler changes its time in the
     Table, with a Toast and Undo.
   - ⌘K opens the CommandPalette over clients and commands ("Go to
     tomorrow", "New appointment", "Switch to dark").
   - The current appointment opens a **Drawer** with its details and its
     actions.
   - **New appointment**, or a drag on an empty slot, opens a **Dialog**
     with the form — Field, Input, Select, DatePicker: the "form in a
     dialog" of the Paths.

10. **By width.**

    | Width | SideNav | Body |
    |---|---|---|
    | 1440 | expanded | Scheduler and Table side by side, about 60 / 40 |
    | 1024 | collapsed to its rail | Tabs, **Schedule** / **Appointments** |
    | 768 | a sheet from the TopBar's menu | Tabs; the Scheduler with all five columns |
    | 375 | a sheet | Tabs; the Scheduler one practitioner at a time, chosen in a Select, as the phone drawing; the Table collapsed to its list |

    The screen's own breakpoints are literals in its stylesheet for now,
    commented as waiting on the breakpoints piece of this wave.

### What moved up the list

11. **The Table gains a current row.** It has multiple selection by
    checkbox and nothing for "the one being looked at". `currentId?: string
    | null` and `onCurrentChange?: (id: string) => void`. With
    `onCurrentChange`, the primary cell's content is wrapped in a bare
    button that calls it — a row is pressable only then, as the Table sorts
    only with `onSortChange` — and the current row's button carries
    `aria-current="true"`. The row is marked by the Scheduler's own ring for
    its selected card, an inset `border/accent` ring, and **not** by
    `interactive/selected`: that fill and the start stripe already mean
    "chosen by checkbox", and a row can be both. The checkbox, the row
    action and anything else in a cell keep their own presses. Scrolling the
    current row into view is the caller's, through its id, not a prop.

12. **The Link says a new tab for an internal link too.** Today
    `newTab = external && target === '_blank'` (`Link.tsx:52`), so an
    internal link opened in a new tab is not announced. It becomes `target
    === '_blank'`, whatever `external` says. The icon stays the external
    one's, shown only with `external`.

### Density as a foundation

13. **A `density/*` layer with two modes**, comfortable (the default, what
    is drawn today) and compact, chosen by `data-density="compact"` on
    **any element**, not only `:root`: custom properties inherit, so a part
    of a page can be compact. The screen puts it on the iframe's `:root`.

14. **Five tokens, only what the screen proves** — invariant 7's lesson,
    no density added silently:

    | Token | Comfortable | Compact | Read by |
    |---|---|---|---|
    | `density/control` | 40 | 32 | Button, Input, Select, NativeSelect, Combobox, DatePicker — the height when no `size` is passed (the SegmentedControl is 32 at every density and takes no size) |
    | `density/row` | 72 | 48 | the Table's rows |
    | `density/row-header` | 44 | 36 | the Table's header |
    | `density/hour` | 80 | 64 | the Scheduler's hour; a quarter is 16, one caption line |
    | `density/nav-item` | 40 | 32 | the SideNav's and SideNavSecondary's items |

15. **Explicit wins.** A `size` passed to a control and the Table's
    `density` prop keep winning over the token. With no attribute nothing
    changes from today. It ships in `0.6.0` under **Added**, nothing under
    Changed.

16. **Compact does not apply to touch.** Inside `@media (pointer:
    coarse)` the compact block restates the comfortable values. 32 passes
    WCAG 2.5.8's 24, but under a finger at 375 it is small, and density is
    for the pointer and the keyboard. Recorded as an invariant in
    `MEMORY.md`; the note under the frame says it, since the Browser pane
    emulates a mouse and will not show it.

17. **Everywhere the tokens go.** `build-css` generates the density block
    and the compact block, beside the scale; the Tailwind theme gains the
    same variables; the Figma export gains a fourth collection, **Alpenglow
    Density**, modes Comfortable and Compact, with `scopes` set — on
    Fernando's list to apply, beside the 36 `category/*` and `chart/*`.

18. **A Density page under Foundations**: the table above, the touch rule,
    and a Try it with the two modes side by side on a Table, a row of
    controls and a slice of the Scheduler.

### Data, state and determinism

19. **A fixed day, not today.** The screen opens on **Thursday 17
    September 2026 at 11:20**, `now` fixed, so the now line is always in
    the same place with some of the day past; screenshots, tests and axe
    give the same result every time, and the portfolio's picture is never
    an empty Sunday. **Today** goes back to it; ‹ › walk the other days.

    `app/screen/data.ts` is pure: five practitioners, each with a
    `category/*` tone and working hours; about sixty fictional clients with
    varied names; `appointmentsFor(date)` builds a day from a seed taken
    from the date, so every day is plausible and always the same — thirty
    to thirty-six appointments in the Scheduler's kinds (confirmed,
    pending, cancelled, a blocker for lunch, one external). No network, no
    persistence; a reload starts over, and the Drawer's foot says "Changes
    reset on reload".

    `app/screen/state.ts` is one `useReducer`: the date, the appointments
    by id, the filters, `currentId`, the Table's selection, the Drawer, the
    Dialog and the draft. Every action that changes data — move, resize,
    confirm, cancel, create — returns its inverse beside the new state; a
    Toast's Undo dispatches that inverse, so there is no global history.
    The reducer is tested on its own.

20. **The proof of "only from Alpenglow".** The screen has one stylesheet,
    `screen.module.css`, for layout only — grid, areas, widths. A test
    reads it and fails on any colour, font size or spacing that is not a
    `var(--ap-…)`. The count on the page is the number of distinct
    `@/components` imports under `app/screen/`, read at build time.

21. **The frame's messages.** `/screen/full`'s InlineScript sets
    `data-theme` and `data-density` on `:root` from the query before paint,
    so nothing flashes. The page sends `{ type: 'alpenglow:frame', density,
    theme }`; the iframe accepts it only from `location.origin` and ignores
    anything else. `/screen/full` is `noindex`, out of the sitemap and out
    of the search index; `/screen` is in both.

## Deliverables

- `src/tokens/density.ts`, `build-css`, the Tailwind theme and the Figma
  export; each consumer in decision 14 reading its token; tests that the
  generated CSS has the three blocks and that each component reads its
  token, and that an explicit `size` wins.
- The Table's `currentId` and `onCurrentChange`, with tests and axe; its
  page's props table and a line in its states.
- The Link's announcement, with a test.
- `app/screen/` — `page.tsx`, `full/page.tsx`, `Screen.tsx` and its zones,
  `data.ts`, `state.ts`, `screen.module.css`, the frame — with the reducer
  tests, a render test with axe per state (Drawer open, Dialog open, the
  EmptyState, a selection with bulk actions), the linking test both ways,
  the message origin test and the local-values test.
- `app/density/page.tsx` under Foundations.
- `contents.ts`, the section cards, the changelog under Unreleased,
  `MEMORY.md` (the claim, invariant 16, the Figma collection to apply),
  the roadmap's wave 4 row.
- Seen in Chromium: four widths × two modes × two densities, the focus
  ring by eye, 375 with no overflow; the linking, a drag with its Undo,
  the Dialog, the Drawer, ⌘K.

## Not in this spec

- Breakpoints as tokens (the screen's literals wait for them), the Paths
  pages, brand theming, the scoped dark block and the state matrix, the
  developer surface — each wave 4's own spec.
- Density for components the screen does not show; a third density mode.
- A drop onto the Scheduler from outside it (a waiting list dragged in).
- Persistence, real dates, a network.
- Not checked, expected to be said so on the page: Safari, Firefox, a real
  touch device, a screen reader.
