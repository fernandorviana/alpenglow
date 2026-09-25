# Alpenglow — project memory

A durable brief for anyone (person or agent) picking this up cold. It records
what is not derivable from reading the code: why things are the way they are,
what must not be "corrected", and what is still open.

Last verified against the tree on **2026-09-18**, after the navigation became two bars with a page per section (invariant 19; spec `docs/superpowers/specs/2026-09-14-two-level-navigation-design.md`), the site gained a search (invariant 22; spec `docs/superpowers/specs/2026-09-14-search-design.md`), and the Atlassian site (open work, item -4) and eighteen more design-system sites (item -5) were surveyed, and the roadmap to a more complete system was written (item -6).

---

## What this is

A design system for dense, data-heavy interfaces. Light and dark, with every
contrast ratio measured rather than assumed. Theme name: **Eleonora**.

It ships as two things at once, and the distinction matters:

- **A component library** in `src/` — React, CSS Modules, no styling framework.
- **A documentation site** in `app/` — Next.js 16 App Router, static export,
  deployed to Vercel.

It is a public portfolio piece. Keep the writing at the standard of the code.

---

## Architecture

Three token layers, mirrored in Figma as three variable collections, plus an
elevation file that is not a collection — effects are styles in Figma, not
variables — and, since 2026-09-23, **density**, a fourth collection whose
modes are Comfortable and Compact rather than Light and Dark. TypeScript is
the source of truth; both stylesheets are generated from it.

| Layer | File | Varies by mode | Holds |
|---|---|---|---|
| Primitives | `src/tokens/primitives.ts` | no | 113 opaque colours (white + ten families of eleven stops, 050–950, generated in OKLCH with one lightness per stop — `scripts/generate-ramps.mjs` — plus `925`, the surface step, in stone and night only) + 21 alpha (12 on the black/white ramps, 4 inks — the light divider, two shadows, the dark scrim — the light scrim's mist, and 4 hazes: mist/500 at 8/12/16/20 for the wash). Never referenced directly. |
| Theme | `src/tokens/theme.ts` | Light / Dark | 94 semantic tokens: `surface` 11, `text` 12, `interactive` 23, `border` 12, `category` 24 (2026-09-23), `chart` 12 (2026-09-23). The last two groups and the four `border/*-subtle` of 2026-09-20 are **not yet variables in Figma**, whose Theme collection still has 54; `docs/figma/alpenglow-variables.json` has all 94. Every value is an alias — no raw hex. |
| Elevation | `src/tokens/elevation.ts` | Light / Dark | Shadows, three steps (`sm` for a part that lifts inside its own control — the segmented tab's thumb, 2026-09-18 — `md` for anchored panels, `lg` for the Dialog). Geometry is shared; only the ink changes. |
| Scale | `src/tokens/scale.ts` | no | Spacing, radius, border width. Dimension must not be reachable by a theme switch. |
| Density | `src/tokens/density.ts` | Comfortable / Compact, by `data-density="compact"` on any element, not by the theme | Five heights (2026-09-23, the dense screen): `control` 40/32, `row` 72/48, `row-header` 44/36, `hour` 80/64, `nav-item` 40/32. Dimension that a density switch reaches and a theme switch still does not: the two axes are independent, and the compact block is re-stated as comfortable under `(pointer: coarse)` (invariant 23). A literal `size` or Table `density` never reads it. In `tokens.css`, the Tailwind theme and the Figma export as `Alpenglow Density`, **not yet applied in the Figma file**. Exported from the package root as `density`, `densityModes` and the `Density` type. In Tailwind the tokens are `--spacing-density-*` in an `@theme inline` block, so `h-density-row` reads `--ap-density-row` where it is used; a plain `@theme` resolves the variable once on `:root` and a compact region never sees it. `data-density="comfortable"` gives a region inside a compact one the room back. |
| Breakpoints & layout | `src/tokens/scale.ts` (`breakpoint`, `minViewport`, `media`), `src/tokens/layout.ts` (`layout`, `layoutModes`) | no (breakpoints); Narrow / Medium / Wide by viewport width, not by the theme or density (layout) | Six breakpoints — Tailwind's five plus `xs` below them: `xs` 480, `sm` 640, `md` 768, `lg` 1024, `xl` 1280, `2xl` 1536 — and `minViewport` 320, the floor the system is tested at. `media.up.*` and `media.down.*` are range-syntax query strings (`'(width >= 48rem)'`) for JS; a media query cannot read the `--ap-breakpoint-*` custom properties, so `tokens.css` carries them for reading only. `layout/margin` 16/24/40 and `layout/gap` 16/20/20 step at `lg` and `xl` inside `tokens.css`, so `var(--ap-layout-margin)` needs no query of its own. In Figma, `breakpoint/*` in the Scale collection and a fifth collection, `Alpenglow Layout` (modes Narrow, Medium, Wide), plus an `Alpenglow / 12 columns` grid style bound to it — **none of it applied in the Figma file yet**. Built 2026-09-24 on `breakpoints-and-layout` (invariants 24–25). |
| Motion | `src/tokens/motion.ts` | no | `duration/fade` 120ms (a change in place), `duration/travel` 140ms (something that moves, and what changes with it), `easing/standard` and `easing/enter`. |

Generated artefacts, both written by `npm run build:css`:

- `src/styles/tokens.css` — plain CSS custom properties, consumable by anyone.
- `src/styles/tailwind-theme.css` — Tailwind v4 `@theme`, pointing at the
  variables above rather than restating the palette.

**Never hand-edit the two files in `src/styles/`.** CI regenerates them and
fails on a diff.

---

## Invariants — things that look like bugs and are not

These are written up on the site's Decisions page and in the token skill. They
have all been mistaken for errors at least once.

1. **Light and dark are not symmetric.** In light, `surface/raised` and
   `surface/overlay` are both white and the shadow separates them. In dark,
   shadows stop reading as elevation, so `overlay` must be a lighter colour
   step. Do not tidy this into symmetry.

2. **`on-*` foregrounds are themed, not constant.** In dark the accent fill
   *lightens* across hover and pressed while its label *darkens* to compensate.
   A white label there fails AA at the hover step.

3. **`tertiary` is solid-only because it has to be; `success` because it was
   never drawn.** Both are enforced by the type union. The tertiary fill is
   `flare/400`, 2.53:1 on white, and the theme has no tertiary text colour
   (`flare/700` would clear 7.84:1, but the button that needs it has not been
   drawn), so `variant="outline" tone="tertiary"` does not compile. The
   tertiary ladder *lightens* on hover and pressed in both modes — 400, 300,
   200 with a dark label — because `flare/500` carries no label at all
   (4.29:1 dark, 3.80:1 white). `success` was once
   excluded for the same reason, but field validation added `text/success`
   and `border/success`, which clear 4.5:1 and 3:1 on the canvas: an outline
   success is possible, and stays out until someone draws it (decided
   2026-09-11). The Button page renders both ratios live.

4. **The dark elevation ramp holds three colour levels — 950, 925, 900 —
   and `sunken` shares the canvas.** The ramp ends at 950, so in dark
   `surface/sunken` resolves to `surface/base` — a well reads as recessed
   inside a card (ΔL .043) and on the canvas it takes a border. When you run
   out, separate with a border rather than inventing a step; `contrast.test.ts`
   asserts the equality so it is not mistaken for an oversight. `925` (L
   .205) is the **surface step**, added 2026-09-12 after a survey of eleven
   reference systems (the spec of that date): every one that reads as calm
   places adjacent surface levels at ΔL .025–.045, and this ladder jumped a
   whole stop, .085. It is the one half step there will be: the rule against
   them was written on 2026-09-11 against a twenty-step neutral that gave the
   theme two *text* levels 1.22:1 apart, and no text is ever set in one
   surface against another. It exists in `night` and `stone` only — it was
   generated in every family at first, and Fernando had the other eight
   removed the same day: no finer steps outside the surface ladders; the
   `975` stays refused. **Surface against surface
   is measured in OKLCH lightness (floor .035, `SURFACE_STEP`), not in the
   WCAG ratio**, which flattens the dark end — the 950→925 step is 1.08:1 and
   plainly visible, and the 1.09 floor the suite used to hold would have
   refused it while passing the .085 jump. Text and boundaries stay on the
   ratio. The dark ladder is `night`; a product that wants a neutral dark
   aliases the same stops of `stone`, and every pair holds (the tightest,
   `border/strong` on `stone/800`, is 3.44:1). Never mix the two families in
   one ladder. The tail is deep on purpose — 700–950 at L .43 / .33 / .245 /
   .205 / .16, canvas `#090B1F` — decided 2026-09-11 so the dark theme reads
   as night. One cost, recorded not asserted: the dialog sits 1.19:1 above
   its scrim (1.43 while overlay was `night/800`); nothing darker than the ink
   exists, and the border carries the edge, as it does for the menu.

5. **A loading button is `disabled` but must not look disabled.** Every
   paint-bearing disabled rule in `Button.module.css` carries `:not(.loading)`.
   Busy and unavailable are different states. The spinner inherits
   `currentColor`, so without the exclusion all five tones collapse to grey.
   `src/components/Button/Button.test.tsx` reads the stylesheet and asserts
   this; the guard has been proven to fail when the bug is reintroduced.

6. **Reduced motion slows the spinner, it does not freeze it.** A frozen
   spinner reads as a hung page. What it drops is the length change.
   `Loader.test.tsx` reads the stylesheet; deleting the media query, setting
   `animation: none`, and keeping the length change at full speed were each
   tried against it and each fails.

7. **The Table's `compact` density is not in the drawing.** Figma draws one
   size, a 72px row, which is comfortable rather than dense. `comfortable` is
   that row unchanged and remains the default; `compact` (48px) was added so
   the component that should prove "dense, data-heavy interfaces" is not the
   one proving it least. Do not delete it as drift — and do not silently add
   more, which is the mistake the Loader made.

8. **A Table's columns leave by rank; the primary, selection and action
   columns never do.** From 2026-09-24 (spec
   `docs/superpowers/specs/2026-09-24-table-responsive-columns-design.md`)
   the Table no longer collapses to a list under 40rem. Each Table writes
   container queries for its own root (`columns.ts`): a column shrinks to
   its minimum (96; 160 for the primary; a fixed column's `width`), then
   leaves, the lowest priority first; the sorted column is raised so it
   stays; the row's inline actions gather into "⋯" before any column
   leaves. Hidden is `display: none`, header and cells, so the
   accessibility tree matches the screen. The `<style>` is rendered in
   place in the root, not hoisted with `href` and `precedence`: React
   never removes a hoisted sheet, and an earlier sort's rules would keep
   hiding. Do not "fix" it into the head.

9. **The theme toggle's dark rules are written twice, on purpose.** Once under
   `@media (prefers-color-scheme: dark)` scoped with
   `:root:not([data-theme='light'])`, once under `:root[data-theme='dark']` —
   the same shape as the generated token file. It is what puts the knob in the
   right place on the first paint instead of sliding it there once React has
   read `localStorage`, and it is why the component holds no visual state at
   all. `app/ui/ThemeToggle.test.tsx` reads `app/docs.css` and fails if the two
   halves stop matching declaration for declaration. It holds no React state
   either: `useSyncExternalStore` reads the choice from storage, and from the
   root where storage refuses the write, so tabs stay in step. The server
   snapshot says "no choice", so `aria-checked` corrects itself after
   hydration — invisible, because the knob is CSS. Copying storage into state
   from an effect on mount is what the Compiler lint rejected. A click also
   puts `data-theme-swap` on the root for the frame the theme is written in,
   and `docs.css` turns every transition but the toggle's own off under it:
   measured on /button before that, a flip started 99 colour transitions at
   once and the buttons faded while the page snapped. The knob still slides.

10. **Dark elevation is modest on purpose.** The dark shadow was never drawn,
    so its values are a decision. Black at 64% over the dark canvas reaches
    1.05:1 against it; black at 8% over white reaches 1.19:1. An 8% shadow in
    light does more than a 64% one in dark, so dark does not chase a shadow
    that cannot work — it stops at `alpha/black-32` and `-48`.

11. **The DropdownMenu has a border in dark and none in light.** Invariant 4
    applied, not an accident of asymmetry: in dark the shadow stops separating, and
    `border/default` is 3.55:1 against the canvas there against 1.60:1 in
    light. Each menu tone also hovers to its own subtle fill rather than one
    shared neutral — `text/accent` on the opaque neutral fill was 3.50:1 in
    dark when the rule was made, 4.59 after the deeper tail, and would be
    7.86 on the wash the neutral row takes now; the rule is the design, not
    the margin, and the suite records the figure.
    Both are asserted in `DropdownMenu.test.tsx` and `contrast.test.ts`.

21. **Hover and pressed are a wash, not a fill, on everything that has no
    ladder of its own.** `interactive/wash-hover` / `wash-pressed` are
    `mist/500` at 8/16% light and 12/20% dark (`alpha/haze-*`), laid over
    whatever is beneath: rows, menu items, ghost and outline buttons as
    `background`; the neutral button, the calendar's month buttons, the
    dialog's icon buttons and the site's theme toggle as a
    `background-image` gradient over their own fill (a gradient does not
    animate, so those change instantly where a ghost fades — accepted over a
    pseudo-element per filled control). `interactive/neutral-hover` and
    `-pressed` are gone (2026-09-12; the package went to `0.2.0` for it).
    The opaque one they replaced was ΔL +.184 over a dark card against the
    references' +.05 to +.09, and in light was the same primitive as
    `surface/sunken`, invisible there. The text under a wash keeps its own
    token and is measured there: every text token clears AA under both
    washes on base, raised and overlay and under hover on sunken, except
    `text/tertiary`, which holds on raised and overlay only (the surfaces
    rows and menu items sit on; base and sunken figures are recorded), and
    `text/accent` under the light pressed wash on sunken (4.38, recorded).
    `border/subtle` is an alpha for the same reason — `alpha/ink-08` light,
    `alpha/white-16` dark — and reads on all four surfaces; the old
    `stone/100` was invisible on light sunken and the old `night/700` was
    1.97:1 on a dark card, twice what the references draw. `FillTone` asks
    for a rest fill and a label only; a tone either owns a ladder or takes
    the wash.

22. **The site's search is built from the pages and lives in the rail; it
    suggests and never completes.** From 2026-09-14 (spec
    `docs/superpowers/specs/2026-09-14-search-design.md`). The index,
    `app/ui/search/search-index.json`, is **generated and git-ignored**:
    `scripts/build-search-index.ts` loads `app/ui/search/extract.tsx` through
    Vite SSR (`next/navigation` aliased to `app/ui/search/navigation-stub.ts`,
    which the extractor sets before each page), renders every page in `PAGES`
    with `renderToStaticMarkup`, and walks the article into entries — one per
    page (the intro), one per anchored `h2` (its text to the next `h2`, the
    pager's `nav` skipped), one per row of a Props table, and the 54 theme
    tokens read from `theme.ts`, landing on `id={tokenId(token)}` rows on the
    Colour page (`app/ui/slug.ts`, where `slug` moved from `DocPage`).
    `build:search` runs inside `build:docs` and `predev`; a clone that has not
    built typechecks through `search-index.d.ts`, and under vitest the
    loader's `import()` is aliased (`vitest.config.ts`, a whole-specifier
    regex — the alias plugin replaces only what matched) to the committed
    empty stand-in `search-index.empty.json`, held by `load.test.ts`: Vite
    refuses a dynamic import of a missing file at transform time, and every
    suite that mounts the Nav went through it — found by the review, with
    the JSON moved away. Do not commit the JSON and do not add a CI diff
    guard for it — prose changes in most commits. The extractor joins text
    nodes with a space; `textContent` glued a card's title to its blurb. The matcher
    (`app/ui/search/index.ts`, pure) is a prefix with one typo from four
    characters, weighted title 10/9/6 by kind, labels 4, body 1 × mentions ÷
    length, ties to reading order, eight hits; every rule is a case in
    `search.test.ts`. The palette is the package's `CommandPalette` since
    2026-09-23 (before that the `Dialog` and `Input` wired in `Search.tsx`
    itself), opened by ⌘K/Ctrl+K anywhere and by a rail item
    at the head of the rail — Fernando moved it there from the drawer during
    the first browser check ("fora do painel secundário") — which on a
    narrow screen is the first row of the open menu (`grid-area: search`,
    hidden while closed; the bar has 2px to spare at 320). Esc is stopped in
    the field so the Nav's document listener does not close that menu under
    the palette; an IME's committing Enter (`isComposing`) is left alone; a
    failed load is forgotten on close and tried again on the next open. No
    inline completion (the M3 site's), by decision: the date mask's class
    of bug.
    No popularity: `SUGGESTED` in `contents.ts` is five pages by hand,
    after five recents in `localStorage['alpenglow-search-recent']` inside
    try/catch. `Nav.test.tsx` and `pages.test.tsx` mock `useRouter` now, or
    `Nav` throws. Checked in the Browser pane on 2026-09-14, light and dark,
    800 and 320: the automation's "Return" key does not reach the handler
    (its "Enter" does), like its Esc — not the component.

23. **Compact does not apply to touch.** From 2026-09-23 (spec
    `docs/superpowers/specs/2026-09-23-dense-screen-design.md`, decision
    16). `tokens.css` declares the density tokens three times: comfortable
    on `:root`, compact on `[data-density="compact"]`, and comfortable again
    on `[data-density="compact"]` inside `@media (pointer: coarse)`. The
    third block looks like a copy-paste of the first and is not: compact's
    32 passes WCAG 2.5.8's 24, but under a finger at 375 it is small, and
    density is for the pointer and the keyboard, so a product that sets
    compact once gets comfortable on a phone without asking. A literal
    `size="sm"` is still 32 on touch — the caller's choice, not density's.
    `src/styles/generated.test.ts` ("gives touch the comfortable values
    back") fails if the coarse block goes or stops restating every token.
    The Browser pane emulates a mouse, so no browser check here has seen
    it; the "Not checked" line under the screen's frame says so.

24. **No width in a media query outside the breakpoint scale.** Every
    `@media` width feature in `src/` and `app/` names one of the six
    breakpoints, in rem and range syntax — `(width >= 48rem)`, never
    `max-width: 767px` — held to it by `src/styles/breakpoints.test.ts`,
    which reads only width features. `@container` queries are not
    breakpoints and are exempt: the Alert's 400px, and the Table's
    generated per-column px thresholds (`columns.ts`).

25. **No z-index in `src/components/` outside a module that isolates, and
    none above 3.** A `z-index` declaration lives only in a stylesheet
    whose own selector also declares `isolation: isolate` — six modules
    do: the Scheduler, the Table, the Slider, the Card, Tabs and the
    shared segmented module, the first three added 2026-09-24 — so a
    product's own stacking context always wins: its sticky bar at
    `z-index: 1` sits over the Scheduler's head.
    `src/components/layering.test.ts` enforces both the isolation and the
    ceiling.

12. **The popover stub is shared, and only covers part of the API.** jsdom 30
    implements none of it. `src/test/popover.ts` covers show, hide, toggle, the
    queued `toggle` event and invoker clicks, and has two consumers —
    `DropdownMenu` and `DatePicker`. Esc, light dismiss, focus return and
    placement are deliberately absent — they are the browser's, and all four
    were checked in Chrome for DropdownMenu — Esc by hand, because the browser
    automation's Esc is ignored. Rechecked by hand on 2026-09-10 in Chrome and
    Safari 26.6 (Firefox not yet): Esc and the outside click close the menu,
    after a click or ArrowDown, and Esc returns focus to the trigger. The
    automation's keydown is trusted but carries `keyCode` 0 and an empty
    `code`, and Chromium's close watcher does not read it as Esc. Pressed by
    hand in the same Browser pane, `keyCode` is 27 and the menu closes. An
    automated outside click closes it too. A menu left open by an automated Esc
    is the tool, not the component — do not add Esc or outside-click handlers
    to DropdownMenu. Do not grow the stub to imitate them; delete it when jsdom
    ships popover, which a guard test will announce. The same Chrome check
    caught a keyboard ring losing on specificity, which jsdom cannot compute —
    look at
    `:focus-visible` in a real browser after touching a focus rule.

13. **The calendar's spilled days are inert but still painted.** The days from
    the adjacent months are rendered, greyed, not focusable and not clickable,
    and their numbers are `aria-hidden`. They take `text/inert`, which measures
    1.72:1 in light and 1.50:1 in dark against the panel. That is what makes
    those figures defensible — decoration is exempt, an interactive control is
    not. The token is not the drawn light-grey primitive on purpose: a
    primitive does not switch with the theme, and on the dark panel it measured
    7.90:1, brighter than an unavailable day. `contrast.test.ts` asserts
    `text/inert` stays below `text/disabled` in both modes. But a
    spilled day inside a selected range still takes the range band, because
    with March 2023 visible the cells spilled in at the top are 26–28 February
    and a range that started on 20 February covers them. Unpainted, the band
    would break at exactly the boundary the range crosses. Both halves of that
    rule are tested; removing either one looks like a tidy-up and is a
    regression.

14. **The range band spans the whole 40px cell, not the drawn 32px pill.** At
    the drawn size, consecutive days sit 8px apart and an interval reads as
    loose squares rather than a period. The ends are shaped by the cell's own
    rounded inline ends, not by a pill drawn on top — start, middle and end are
    one solid accent fill with on-accent labels throughout.
    `Calendar.test.tsx` reads the stylesheet and fails if the band moves back
    onto the pill. The 280px width is a floor (`flex-shrink: 0`): squeezed into
    a 200px flex row, the cells measured 28.6px around 32px day buttons. In a
    container too narrow for it the Calendar overflows. Fernando's ruling:
    wider is acceptable, narrower is not. Do not make it fluid below 280.

15. **The DatePicker panel is `popover="manual"`, not `auto` like the
    DropdownMenu, on purpose.** In range mode the first Esc must only cancel a
    pending start, and with `auto` the platform's close request would dismiss
    the panel instead. Dismissal — Esc, an outside press, focus leaving — is
    the component's own and is tested. Aligning it to the menu's `auto` looks
    like a tidy-up and is a regression. Outside a `Field` the text input names
    itself with `label`, through its own `aria-label`; inside one, the Field's
    label element names it and the `aria-label` is left off.

16. **The DatePicker panel's Calendar mounts only while open.** Kept mounted in
    the hidden panel, the build month reached the server HTML of any picker
    with no value and no `defaultMonth`, a closed picker reopened on the month
    it was left on rather than the value it holds now, and a hidden 42-cell
    grid re-rendered on every keystroke in the field. `open` is set from
    `beforetoggle`, so the grid is in place before the panel paints. Keeping it
    mounted "to open faster" is a regression.

17. **The Calendar's hydration flag.** `hydrated` is `false` on the server and
    in the client's hydration pass. Today's date — the today marker, the tab
    stop, and the month a calendar with no seed opens on — and the
    `formatRange` text of the status region wait for it. A Calendar with no
    month seed (no `month`, `defaultMonth` or value) renders an empty six-row
    grid until then. React 19 does not patch a mismatched attribute or text
    node on hydration; it keeps the server's, so nothing the build machine and
    the browser can disagree on may reach the server HTML. The flag is
    `useHydrated` (`src/components/useHydrated.ts`), shared with DatePicker
    and DropdownMenu, whose triggers carry `popovertarget` only once hydrated,
    so a click before hydration cannot open a panel or menu behind React's
    back. One exception is accepted on
    purpose: the date field's separator and digit order come from `Intl` and
    reach the server HTML (the value, the shell and the hint), because numeric
    two-digit date literals are stable across CLDR builds.

18. **The date field's mask rebuilds from digits and never intercepts keys.**
    Every edit — typing, a paste, autofill, a deletion in the middle, the end
    of an IME composition — goes through `edit` in `DatePicker.tsx`, which
    extracts the digits, runs `applyMask` from `mask.ts`, and puts the caret
    back by digit count. Handling `keydown` looks like a simplification and
    breaks paste, autofill, IME and Android, whose keyboards report
    `Unidentified`. Three more rules only look inconsistent: an insertion is
    checked and rejected whole while a deletion is never refused (checking
    deletions "for consistency" traps Backspace); a Backspace that only
    removed a separator removes the digit beside it instead; and a separator
    inserted after a lone day or month digit completes that part (`1/` becomes
    `01/`).

19. **The site's navigation is two bars on a wide screen and one on a narrow
    one, and the component owns what the stylesheet cannot.** From 2026-09-14
    the shape is the Material 3 site's: an 80px rail with the four sections
    (`app/ui/contents.ts` — Start here `/`, Developers `/develop`,
    Foundations `/foundations`, Components `/components`; a Carbon icon on a
    56×32 pill, `interactive/selected` for the section the reader is in,
    `aria-current="page"` on the section's own page and `"location"` inside
    it) and a 232px drawer with the brand and the current section's pages,
    "Overview" first. Each section has a page presenting the pages inside it
    with the cards the home used to hold; the home keeps the hero, the three
    Start here cards and three section cards. The theme toggle stands on end
    at the rail's foot, 48×84 as drawn (it lay down while it lived in a bar
    and a sidebar); the drawer carries no caption naming the section, the
    rail's filled pill does that. The rail costs 80px, so the wide
    breakpoint is 1496, now `2xl` (derived in `Nav.test.tsx` from the rail,
    the drawer, the page's padding and the 704 a Table specimen needs) and
    the evidence column leaves at 1160, now `xl`. Below 768 (`media.down.md`,
    since 2026-09-24; 760px until breakpoints were tokens — from 761 to 767
    it is now the sheet too) the nav is a sticky bar
    with a toggle — the rail and the drawer take `display: contents`, so the
    brand and the toggle are the same elements in both layouts; open, `.sidebar[data-open='true']` fixes it over the whole
    viewport (`100dvh`, a scroll of its own) rather than growing the bar and
    pushing the page down. `app/ui/Nav.tsx` then sets `data-nav-open` on
    `html` to lock document scroll, puts `inert` on every sibling of the nav —
    siblings, not a named element, so the overlay covers whatever the shell
    holds — closes on Esc, and closes when the viewport widens past the
    breakpoint, because on a wide screen the bars show whatever `open`
    says and the lock and the inert page would outlive the overlay. `NARROW`
    is exported from `Nav.tsx` and `Nav.test.tsx` finds the stylesheet's media
    block by it, so the two cannot drift apart. `inert` is written as an
    attribute, not the property, because jsdom 30 does not reflect the
    property. A route change closes the menu during the render that sees the
    new `pathname`, not in an effect. Deriving `open` from the route it was
    opened on (`openOn === pathname`) looks simpler and reopens the overlay
    when Back returns to that route; a test fails on it. The theme toggle is
    inside the nav (2026-09-12, when the bar across the top of the page was
    removed): a sticky foot of the sidebar on a wide screen, and the foot of
    the open overlay on a narrow one — at 320px the bar holds the brand and
    the page's name with nothing to spare, and the 84px toggle beside them
    clipped the brand to "Alpen". Left out on purpose: a hamburger icon and
    an entry animation. The open menu lists every section and page, the
    section's title being the link to its page: one tap to any page, where
    the rail would cost two.
20. **A click on the Dialog's backdrop does not close it, and Esc does not
    close it by itself.** Esc arrives as `cancel`, which is prevented and
    handed to `onClose`; the caller sets `open`. A stray click beside a form
    must not discard it, so there is no light dismiss — the platform default
    for `showModal()`. The `close` event also calls `onClose`, but only while
    `open` is still true: Chrome closes on a second Esc without user
    activation and fires no `cancel`. Focus goes to `initialFocus`, never an
    `autoFocus` child: React's client renderer does not write the attribute
    `showModal()` reads. When the back button disappears under focus — the
    first step of a flow has none — focus moves to the close button, because
    the platform would drop it to the body behind the modal (found in Chrome).
    `src/test/dialog.ts` stubs `showModal` and `close` for jsdom and fails its
    own test the day jsdom ships them.

---

## Conventions

- **No colour literals in component files.** Every value is a token. The only
  literals are geometry that follows from the scale (control heights) and the
  spinner's own dimensions.
- **Comments record the decision, not the mechanism** — including alternatives
  that were rejected, with the measurement that rejected them.
- **Focus adds geometry, never recolours a border**, so colour is never the
  only channel carrying a state.
- **Icons are IBM Carbon** (Apache 2.0), installed by the consumer. No
  component imports Carbon — only the docs site does — so it is a dev
  dependency, not a peer. Fifteen icons were drawn for this system because Carbon has no
  equivalent; eight more exist in Carbon under a different name, and that
  mapping is on the Icons page.
- **Prefer the native element.** `NativeSelect` wraps `<select>`, and
  `DropdownMenu` is a `popover` placed with CSS anchor positioning rather
  than a portal and a positioning library. **One exception, decided
  2026-09-21 with its reasons in the Select's spec:** `Select` is a listbox
  of the system's own, because the drawn options hold what a native list
  cannot show. It still stands on the native `popover` and anchors.
- **"Menu" alone is reserved for navigation.** The command list is
  `DropdownMenu` (renamed from `Menu` before it merged): navigation menus are
  planned, and they are a different pattern for which `role="menu"` is wrong.
  Name a new overlay by what it holds, not by the popover mechanism.
- **Docs pages group by what the reader is deciding, not by look.** Textarea
  lives with Input (same stylesheet, same Field); Select and DropdownMenu keep
  separate pages because one holds a value and the other runs a command — the
  Select page carries the test for telling them apart.
- **Tests do not group; they live beside their component.** Loader's tests
  once sat in `Avatar.test.tsx`, Radio's in `Checkbox.test.tsx` and Textarea's
  in `Input.test.tsx`, following the docs pages — and all three were recorded
  here as untested. Stylesheets are the other way round: Checkbox and Radio
  share `choice.module.css` as Input, Textarea and Select share
  `control.module.css`, and neither needs a module of its own. A test that
  reads a stylesheet uses `readCss` and `block` from `src/test/css.ts`.
- **`.ratio` is one reading, `.ratioLine` is a sentence of them.** `.ratio`
  does not wrap, so "11.26 AAA" never splits. Put on a paragraph of readings
  for its monospace, it made the home page 527px and Decisions 588px wide on a
  375px phone. `app/ui/Ratio.test.tsx` renders every docs page in jsdom and
  fails on a `.ratio` inside a `.ratio`; the `@ui` alias is in
  `vitest.config.ts` for that reason.
- **A module that needs React's client build opens with `'use client'`.** The
  docs pages are all client components, so the site cannot show a missing one;
  a consumer's Server Component page fails to prerender. `directives.test.ts`
  reads what `react.react-server.js` exports and flags any module importing
  something else without the directive.
- **`src/` and `app/` pass the React hooks lint, Compiler rules included**
  (`npm run lint`). `src/` because registry code becomes code the consumer's
  `eslint-config-next` lints. `app/` because it is a Next app like those
  consumers: left out while nothing was copied from it, it accumulated two
  set-state-in-effect errors (`Nav`, `ThemeToggle`) before it was brought in.
- **Control heights share one type and are held to it.** `ControlSize`
  (`sm | md | lg`, 32/40/48px) belongs to Button, Input, Select and
  DatePicker; `vocabulary.test.ts` fails when `Button.module.css` and
  `control.module.css` stop agreeing. `LoaderSize`, `BadgeSize` and
  `AvatarSize` measure other things and keep their own names, as does
  `DialogSize` (`xs | sm | md | lg`, 320/480/640/960px wide). Checkbox, Radio,
  Switch and Textarea are one size on purpose: a field's size changes its box,
  never its text, and the checkbox aligns to the first line of text.
- **A component's tones are a list inside a ceiling the tokens set.** `Tone`
  names seven. `FillTone` and `TintTone` in `src/components/vocabulary.ts` are
  computed from `theme.ts`; each component's array `satisfies` its ceiling, and
  `vocabulary.test.ts` fails when a listed tone has no rule. The lists are not
  derived — derived, the Loader would gain `warning` the day the token existed.
  The tint ceiling reads the `surface/<t>-subtle` + `text/<t>` pair because
  `text/tertiary` is a hierarchy level, not the tertiary tone. A class assertion
  cannot prove a tone is painted: in tests the CSS-module map returns a name for
  any key, so the rule is read from the stylesheet.
- **No publish skips the gates.** `prepublishOnly` runs `check`, `build:lib`
  and `check:package`, so `npm publish` by hand and `npm stage publish` in the
  Release workflow go through the same checks as CI.
- **Timing comes from the motion tokens; loops keep their own.** A transition
  or a one-shot animation reads `--ap-motion-duration-*` and
  `--ap-motion-easing-*`: `travel` when something moves and for whatever
  changes with it, `fade` otherwise. `src/components/motion.test.ts` fails on a
  written duration or curve in a component stylesheet or `app/docs.css`, and on
  a `transform` transition without `travel`. An `infinite` animation is exempt:
  the Loader's cycle and curves were measured for its arc. Reduced motion stays
  per component, because what must survive differs.
- **Every `var(--ap-…)` names a token that exists.** An undeclared custom
  property fails silently — the property falls back to its initial value — so
  `src/components/custom-properties.test.ts` checks every stylesheet and page
  in `src/components` and `app` against `tokens.css`.
- **Every component stylesheet declares border-box for its own boxes.** Sizes
  here include padding and border, and the package cannot assume the app has a
  reset: in a Vite app without one, a `md` field measured 58px. The docs site's
  global `*, *::before, *::after` rule hides the omission, so
  `src/components/box-sizing.test.ts` fails when a rule sizes, pads or borders
  a box its stylesheet has not listed in its `box-sizing: border-box` rule.
- **axe checks structure, on every page and in every state a page cannot
  show.** `app/pages.test.tsx` runs `src/test/axe.ts` — WCAG A and AA,
  `color-contrast` off because jsdom has no layout — over each docs page and
  the site navigation, so a new component is covered once it has a page.
  States a page renders closed are checked beside their component: the open
  menu, the open date picker in single and mid-range, and every text control
  in a `Field` with an error. A closed popover's rows are hidden, and axe
  skips them. `src/test/axe.test.tsx` fails if the helper stops reporting
  known violations, because every other axe assertion expects an empty list.
  Not covered: focus order, what a screen reader announces, anything that
  needs layout, and an idref to a missing id, which axe calls "needs review".

---

## Vocabulary

The architecture is explained on the site as a landscape under a particular
light (`/why`). The words are for narrative, diagrams and headings — **never
for token names, file names, CSS variables or Figma modes**, which keep their
technical names. The modes are `Light` and `Dark` in code and Figma; "day"
and "night" in prose.

| Word | Is | In the code | In Figma |
|---|---|---|---|
| **Bedrock** | Raw colour. Buried: nothing references it directly. | `primitives.ts` | `Alpenglow Primitives`, hidden from publishing |
| **Outcrop** | Bedrock that reaches the surface: dimension, type and motion. Used directly. | `scale.ts`, `typography.ts`, `motion.ts` | `Alpenglow Scale`; motion has no Figma counterpart |
| **Contours** | Semantic roles. Every one is an alias. | the keys of `theme.ts` and `elevation.ts` | `Alpenglow Theme`; elevation is an effect style |
| **Light** | Eleonora — the values the contours take under each mode. | the light / dark values of `theme.ts` and `elevation.ts` | the `Light` / `Dark` modes |
| **Terrain** | Components. | `src/components` | the library |
| **Paths** | Patterns. None yet; drawn dashed. | — | — |
| **Crest** | Any product built on the system. The site is the first. | `app/` | — |

The rule behind the file split, and the reason the primitives collection is
hidden while the scale collection is published:

> **A value needs a contour only if the light changes it.**

Rejected words, so they are not proposed again: *summit* (the brand
foundation forbids conquest language and then used it), *zenith* (the sun at
noon — the opposite of twilight), "future themes" as a layer (one theme,
Eleonora; light and dark are its modes, not themes).

Three lines carry the concept, one home each: **Bring structure to light**
(tagline, the home page's H1 — swapped with *A design system that shows its
working* on 2026-09-11, which now opens the lead), **Structure exists beneath the surface. Light
makes it visible** (opens `/why`), **Clarity, layer by layer** (the diagram's
caption).

---

## Verification

```bash
npm run check       # tsc --noEmit, the hooks lint on src/ and app/, then the full suite
npm test            # 2552 tests across 115 files (fidelity-part-1, 2026-09-25)
npm run build:css   # regenerate both stylesheets
npm run build:docs  # static export (regenerates the search index first)
npm run build:lib       # the package, in dist/
npm run check:package   # publint, attw, and what the build must never lose
npm run audit:responsive  # the built site (out/), every route at 320, 375, 768, 1024, 1440; dark at 375 and 1440
npm run audit:css-order -- --a <dev url> --b <built url>  # element boxes, dev against the build; skips /screen
```

**Done means seen in the production build** (the fidelity audit's rule,
2026-09-24, open work item -7): at 320, 375, 768, 1024 and 1440, light and
dark, with `npm run audit:responsive` on `out/` after `npm run build:docs`
and exit 0 — no route scrolling sideways. The script takes dark at 375 and
1440 only; dark at the other widths is by eye. `next dev` loads CSS in
import order and the build in chunk order, and the two disagreed on the
Slider, the Switch's description and the Combobox's text input (squeezed
to 20px after the tags in the build): a check in dev at desktop width is
not a check. The fix each time is a custom property the shared rule reads,
under the package's name (`--alpenglow-*`), never a second rule on the
same property. Both scripts drive a headless Chrome over CDP (Google
Chrome at its macOS path, or `CHROME=`; Node 22 or later) and write to
`.audit/` (git-ignored); both exit 1 when a run errored and 2 when
`--only` names no route, and `--only` takes `/drawer/` as `/drawer`.
`audit:css-order` skips `/screen`, the page that frames `/screen/full` in
an iframe: its diffs came and went with CPU load while dev measured alone
matched the build, a measurement of contention and not of CSS order
(ruling, 2026-09-25); it prints the skip and why, and `/screen/full` is
still compared. `npm run check` does not build the docs.

CI (`.github/workflows/ci.yml`) runs typecheck, lint and tests, regenerates the
stylesheets and fails on a diff, then builds the docs. A stale generated
stylesheet is a silent failure — that gate is the reason it exists.

The contrast suite (`src/tokens/contrast.test.ts`, 257 cases on 2026-09-25)
derives its assertions from the theme keys rather than listing pairs, so a
new token is covered the moment it exists. It caught five real defects on
its first run, including a divider that resolved to the same colour as the
surface beneath it.

---

## Deployment

- GitHub: `fernandorviana/alpenglow`. Pushes to `main` trigger production.
- Live: <https://alpenglow-rose.vercel.app>
- Vercel project `alpenglow` under `fernando-viana-design`, linked locally
  (`.vercel/` and `.env*` are gitignored — the link writes an OIDC token into
  `.env.local` that must never be committed).
- `vercel.json` sets `buildCommand: npm run build:docs`. `next.config.ts` uses
  `output: 'export'` with `DOCS_BASE` for subpath hosting.

---

## Open work

### -7. The fidelity audit: the drawing is the default (2026-09-24)

On 2026-09-24 Fernando found the system in many places nothing like what
was drawn, and its responsive behaviour bad in many cases. The audit that
followed read the Alpenglow file and, for the calendar, the product file
against the production build at 320, 375, 768, 1024 and 1440, light and
dark: spec `docs/superpowers/specs/2026-09-24-fidelity-audit.md` — the
method, why it drifted (six causes), and about 150 findings, each marked
**fix** (a bug), **drawing** (an unrecorded departure; the drawing wins),
**decide** (a departure an agent recorded; Fernando rules) or **owner**
(recorded as Fernando's). Part 1, the fixes, is branch `fidelity-part-1` (plan
`docs/superpowers/plans/2026-09-24-fidelity-part-1.md`), not yet on main;
its last task runs the whole built site at the five widths and the CSS
order against dev. Part 2, the drawing's rows, and the decide rows wait on
Fernando.

**The rule, from 2026-09-24:**

- The drawing is the default. A departure is a proposal to Fernando, named
  as one, with the drawn value beside it, and it lands only with
  Fernando's yes, recorded in Fernando's words with the date.
- "Not drawn" is written only after searching both Figma files.
- Done means seen in the production build at 320, 375, 768, 1024 and 1440,
  light and dark (`npm run audit:responsive`; Verification, above).
- A global rule in `app/docs.css` never outranks a component's. Every
  `.prose` rule is `:where(.prose) :where(…)` and weighs nothing
  (`app/ui/ProseScope.test.tsx`).

**The owner's rule, 2026-09-25**, in Fernando's words: "Em telemóveis não há
drawer ao lado do conteúdo. O conteúdo é o que aparece e abrir drawers ou
navegação é com overlays." (On phones there is no drawer beside the
content. The content is what shows, and drawers and navigation open as
overlays.) Below `md` an inline Drawer opens as the overlay one
(`DRAWER_NARROW`, `media.down.md`), the SideNav is a sheet, and /scheduler's
side column is an overlay Drawer.

**Settled:** the drawn inputs have **no border at rest**, a hairline only
on hover and on focus (`701:12644`, `701:12617`). The code's transparent
resting border is the drawing; the 2026-09-07 `border/default` note is not
(item -1 and the Blocked pair, below, corrected). The hover hairline is not
built.

**Records corrected** — each claim about the drawing or about a check
marked "corrected 2026-09-24, fidelity audit" where it stood: the Toast is
drawn, tone-filled notifications with a close (`1219:21015`,
`1219:20982`), and Fernando's inverse-surface ruling, taken on "not
drawn", is **reopened, pending Fernando's ruling** — the component is
unchanged;
phone and tablet top bars (`116:9367`, `120:9434`, `2787:6033`) and a
phone bottom bar (`638:10984`) are drawn; the SideNav item is drawn 48
(`160:9623`), built 40; the Table's cells are not the drawn type (primary
`body/lg` Medium drawn, `body/md` regular built); a week with several
people (`4914:35448`) and a phone agenda list (`19848:139575`) are drawn;
the Loader is one arc since 46bb6ab where two are drawn; the Select is
drawn 48 at md; the Slider overflowed at every width in the production
build, and the Pagination footer at 320 pushed the page 16px sideways; the
Scheduler's quarter-hour card is built 20 and drawn 24 (`4914:36173`); the
FileUpload card is a full-width row where a 208 × 64 tile is drawn.
Brought up to date as well: the /input lede, "breakpoints are not tokens
yet" on /navigation and /screen, /accessibility's "four pairs below 4.5:1"
(two; the placeholder and the pressed green clear AA), the stale
`.prose`-outranks comments in five component files, and counts that
disagreed between pages: primitives 134 everywhere, opaque and alpha,
held by `app/primitive-count.test.tsx`; spacing 22 (with `0`); and the home
card's "thirty-three components" against the 48 /components derives from
the package — the card no longer states a number.

**Waiting on Fernando** — taken on `fidelity-part-1` where nothing is
drawn or the drawing left a choice; proposals, not settled:

- In dark, the theme toggle's track and inline code on `surface/overlay`.
  Neither has a dark drawing.
- In dark, the SegmentedControl thumb's `border/strong` hairline
  (`border/default` measured 2.975 against the thumb). It reaches the Tabs'
  segmented variant too. No dark drawing.
- /scheduler on a phone: the side column — the draft, Availability and its
  slots, the mini-calendar, the event types and the selected event — as an
  overlay Drawer from a toolbar button; a new or pressed event opens it
  with the focus on the event; from `md` to where the week and the column
  fit side by side, the column goes under the grid.
- The dense demo's bulk bar: the drawn "Show only selected" Switch stays in
  the bar while it fits and gathers into "⋯" as a checkbox row when it does
  not; under 25rem of Table, Clear is a ✕ named by its Tooltip; /screen's
  Confirm and Cancel are icon buttons.
- The home Developers card shows only `npm i alpenglow`: the stylesheet's
  import line no longer fit a card at 768.
- The inline Drawer's line is `md`, the SideNav's, not `sm`: the owner's
  words set the behaviour, not the width.
- The collapsed SideNav item is a circle at `density/nav-item` (40), not the
  drawn 48, until the token moves.
- The Scheduler's quarter-hour floor, 20 built against 24 drawn; and
  `scrollToDay` off by default, so a 0.5.0 consumer sees no change.
- Below `md` a Drawer is now modal (ruling of 2026-09-25, on the phones
  rule): the page outside is `inert`, the panel `aria-modal`, Tab goes
  round inside it and the focus comes back on close — before, at 320,
  where it covers the screen, Tab and a screen reader reached the page it
  hid. By `inert` rather than `showModal()`, so the element stays one
  popover across the line and Esc stays the Drawer's; a `<dialog>` outside
  stays alive for the "leave without saving?" Dialog. No scrim. From `md`
  up it is not modal, as the drawer spec says. The cost if Fernando wants
  the page behind a phone's Drawer reachable: one condition.
- /accessibility's exceptions table loses its Why column below about
  580px, as its columns leave by rank.
- /dark-mode shows only Dark below 426, its Light leaving by rank.
- /layout's mode headers wrap to two lines, where /table says a header
  does not wrap (the alternative was clipping at every width).
- The dense demo's bulk bar keeps the widest set's slot width, so at 768,
  with the Switch tucked into "⋯", about 160px stand empty before Clear.

### -6. The roadmap to a more complete system (2026-09-18)

Decided with Fernando after the two site surveys: Alpenglow is for
designers and developers **equally**, it is meant to be **used in real
implementations**, and **the idea is a more complete design system** — this
replaces the earlier priority of six to eight components over broad
coverage; the bar per component does not drop. No embedded Storybook:
interactive pieces are built from the system's own components. The roadmap
is `docs/superpowers/specs/2026-09-18-completeness-roadmap.md`: a "done"
list of nine steps every component meets (steps 2 and 8 amended 2026-09-24
by the fidelity audit's rule, item -7: the drawing is the default, and
"checked" means the production build at five widths in both modes); one
dense screen built only from
Alpenglow as the instrument that reorders the list; three waves —
**wave 1 (`0.3.0`, with the first `CHANGELOG.md`)** Tabs, Tooltip, Toast,
Alert, Card, Pagination, Link; **wave 2 (`0.4.0`)** Popover (extracted from
DatePicker and DropdownMenu), Combobox (graduated from the site's Search),
Drawer, Accordion, Breadcrumb, Skeleton, EmptyState, Progress, Tag, and the
dense Table (sort, sticky header, bulk actions, filters, pagination);
**wave 3 (`0.5.0`, cut 2026-09-23)** SideNav and TopBar (graduated from the site's Nav),
SegmentedControl, Slider, FileUpload, Scheduler, CommandPalette. "Crest
feeds Terrain": a site piece that is the general pattern is graduated into
the package, not rewritten beside it. Foundations to add: breakpoints as
tokens, ~~a data-vis palette with measured ratios~~ (done 2026-09-23), grid, content and voice,
the first Paths — and a candidate decision to ship **no z-index tokens**,
since every overlay lives in the top layer. Around the code: a deprecation
policy, brand theming that re-runs the contrast suite, a public Figma
library, starters, the LLM surface; the shadcn registry and an MCP server
are reopened, not decided. Each component still gets its own spec, and
whether it is already drawn in Figma is not known from the repository.
Nothing is built.

Claimed components (add a line before starting; one per session and branch):

- **Breakpoints and layout** (wave 4, second piece) — built 2026-09-24 on
  branch `breakpoints-and-layout` (`22aa8b9^..e66bd3c`, 18 commits, the
  first two the spec and the plan), on main and pushed 2026-09-24 as
  `e66bd3c`, unreleased
  (Unreleased in `CHANGELOG.md`, for `0.6.0`). Spec
  `docs/superpowers/specs/2026-09-24-breakpoints-and-layout-design.md`,
  plan `docs/superpowers/plans/2026-09-24-breakpoints-and-layout.md`.
  Six breakpoints — Tailwind's five plus `xs` below them: `xs` 480, `sm`
  640, `md` 768, `lg` 1024, `xl` 1280, `2xl` 1536 — and `minViewport` 320,
  the floor the system is tested at; `breakpoint`, `minViewport` and
  `media` (range-syntax query strings, `media.up.md` is
  `'(width >= 48rem)'`) exported from `src/tokens/scale.ts`. A new
  `src/tokens/layout.ts` exports `layout` and `layoutModes`: `layout/margin`
  16/24/40 and `layout/gap` 16/20/20, stepping up at `lg` and `xl`.
  `tokens.css` gets a breakpoints block (`--ap-breakpoint-*`, for JS and
  reading only — a media query cannot read a custom property) and a layout
  block restated inside `@media (width >= 64rem)` and
  `@media (width >= 80rem)`, so `var(--ap-layout-margin)` needs no query of
  its own. Tailwind's `--breakpoint-*` restates the five and adds `xs`;
  `--spacing-layout-*` is written inline so `px-layout-margin` and
  `gap-layout-gap` read the token where it is used. In Figma:
  `breakpoint/*` in the Scale collection, a fifth collection
  `Alpenglow Layout` (modes Narrow, Medium, Wide) and an
  `Alpenglow / 12 columns` grid style bound to it, both described in
  `docs/figma/apply-variables.md` — **none of it applied in the Figma file
  yet**. Two new invariants (24, 25): no width in a media query outside the
  breakpoint scale (`src/styles/breakpoints.test.ts`, which reads only
  width features), and no z-index in `src/components/` outside a module
  that isolates, none above 3 (`src/components/layering.test.ts`). The
  Scheduler, the Table and the Slider now declare `isolation: isolate`, so
  a product's own sticky bar at `z-index: 1` sits over the Scheduler's
  head and nothing else about the three changes. The SideNav's narrow
  default moved to `media.down.md` (768, not 760 — from 761 to 767 it is
  now the sheet); the Toast and the CommandPalette take their phone layout
  below `xs` (480), not at 480 and below; the TopBar pads its sides by
  `var(--ap-layout-margin)` (16 below 1024, 24 to 1279, 40 from 1280),
  where it was 24 at every width. The site and the screen move onto the
  scale: the site's own breakpoints — 1496 (the wide page with the
  section list beside the prose) and 1440 (where the drawer left the
  flow) and 1160 (the evidence column) → `2xl` and `xl`, and 370 (the
  Calendar specimen's edge-to-edge bleed) → `xs` — are now inequalities
  against the breakpoint scale, tested as inequalities rather than
  literal pixels; 760 (the old SideNav literal) → `md` and 1000 (the
  Scheduler docs page's inline query, `app/scheduler/page.tsx`) → `lg`
  are straight replacements, not inequalities.
  A Breakpoints and layout page under Foundations (`/layout`), and the
  z-index decision on `/decisions`: no z-index tokens, one rule — a
  z-index lives only inside a module that declares `isolation: isolate`,
  and never above 3. Found and not fixed in the package: **the Table's
  columns give way as its space shrinks** — its own spec, next; at `xl`
  with the SideNav expanded the screen's Table has about 260.
- **Table responsive columns** (wave 4, third piece) — built 2026-09-24 on
  branch `table-responsive-columns` (`f595b9a^..e7c9ebc`, 22 commits, the
  first three the spec, its amendment and the plan, the last nine a final
  review's fixes), on main and pushed 2026-09-24 as `192aec1`, unreleased
  (Unreleased in `CHANGELOG.md`, for `0.6.0`). Spec
  `docs/superpowers/specs/2026-09-24-table-responsive-columns-design.md`,
  plan `docs/superpowers/plans/2026-09-24-table-responsive-columns.md`.
  Columns shrink to their minimum (96; 160 for the primary) and then
  leave, the lowest priority first, as the Table's own width shrinks,
  whether the window or a side panel narrows it, replacing the 40rem
  collapse to a list; the primary, selection and action columns never
  leave, the sorted column is raised to stay, and the row's own actions
  gather into "⋯" before any column does. The Button gained a square,
  icon-only form for the actions that need one. The final review's fixes:
  a header now clips with an ellipsis instead of overflowing its fixed
  column, and `.truncate` reaches the primary cell's own button under
  `onCurrentChange`, which its own `text-overflow` could not; the dense
  screen's Client and Practitioner minimums moved to `spacing[1200]` and
  Status to a literal 136, dropping its floor from 290 to 258.
- **The dense screen** (wave 4, first piece) — built 2026-09-23 on branch
  `feat/dense-screen` (`ac2a4f9^..cb3f95f`, 26 commits, the first the
  spec and plan, the last four the final review's fixes), on main and
  pushed 2026-09-24 as `cb3f95f`,
  unreleased (Unreleased in `CHANGELOG.md`, for `0.6.0`). Spec
  `docs/superpowers/specs/2026-09-23-dense-screen-design.md`, plan
  `docs/superpowers/plans/2026-09-23-dense-screen.md`; page shape after
  ABUI's block pages, which Fernando showed. Five things, because the
  screen could not be finished without the first three: **density** as a
  foundation (the Architecture row, invariant 23), the Table's
  **current row**, the **Link's new-tab announcement** for an internal
  link, **the screen** at `/screen` (in the DocPage) and `/screen/full`
  (alone, no rail — `app/ui/Chrome.tsx` leaves the site's chrome out
  there; `noindex`, out of the sitemap and the search), and a **Density
  page** under Foundations. The screen is "Ridge Physio", a fictional
  clinic, five practitioners, Thursday 17 September 2026 at 11:20 fixed
  (`app/screen/data.ts`, seeded by date, pure); one `useReducer`
  (`state.ts`) whose every data action returns its inverse, which the
  Toast's Undo dispatches — no history. `screen.module.css` is layout
  only and `local-values.test.ts` fails on a colour, size or spacing that
  is not a `var(--ap-…)`; the "18 components, 0 local values" count is read
  from `app/screen/` at build time. Decisions that look like mistakes:
  **an iframe, not a scoped container** — the width switch must change a
  real viewport so `useMediaQuery`, the Toast's and the palette's 480px
  rules and the top layer answer it as in a product; mode and density go
  in by `postMessage`, accepted only from `location.origin`, and a
  pre-paint script reads the query (`frame.ts`); the base path is
  build-time (`NEXT_PUBLIC_DOCS_BASE`) and the query is read after commit,
  because reading `window.location` in render broke a client-side arrival.
  **The current row is an inset `outline` on the `tr`, not the selection's
  fill** — the fill and the start stripe mean "chosen by checkbox", and a
  row can be both; per-cell inset shadows on first/last child were tried
  and broke under RTL and under the container collapse. **`.auto` padding
  is derived from the token** (`(control − line − 2 × hairline) / 2`), so
  40 is exactly md and 32 exactly sm with no rule per mode; the Button's
  `.auto` copies md's letter-spacing too, so nothing changes without the
  attribute. **The Table's inline padding is `row / 6 + 4`** — 16 at 72,
  12 at 48, the two drawn pairs without a sixth token. **SideNav item
  padding comes from the 24px icon, not the 22px line**, or the items
  measured 42/34. **The screen's narrow query was 800**, not the
  SideNav's 760 (768, `media.down.md`, since 2026-09-24) — a literal
  until breakpoints were tokens; it is now `media.down.lg` (1024),
  because the spec puts 768 in the sheet and 1024 on the rail. **Visited days
  keep their edits for the session** and
  going to the same date is a no-op (ruling R7): an Undo after returning
  to its day must hit the same records; a reload resets. **"Booked"
  counts confirmed only** (26 booked · 6 pending · 2 cancelled, ruling
  R8), so the three badges are disjoint — Fernando to choose. Found by
  the screen and **not fixed in the package** (listed under the frame,
  open): ~~the
  Scheduler's column heads misalign with long names (the screen uses first
  names)~~ (closed 2026-09-25 on `fidelity-part-1`: head and body are sized
  from the same properties; the screen keeps first names, since four of
  five full names would end in an ellipsis); ~~the Table always collapses
  under a 40rem container (a meta
  line in the collapsed list), and a collapsed row stays 77 tall in both
  densities~~ (closed 2026-09-24: columns leave by rank); the TopBar has
  no phone layout, though phone and tablet top bars are drawn (`116:9367`,
  `120:9434`, `2787:6033`); a compact 30-minute card clips its time line; ~~the
  Button has no square icon-only shape~~ (closed 2026-09-24: `icon`); ~~the
  bulk bar wraps in a narrow Table~~ (closed 2026-09-25: one row, a list of
  actions gathers into "⋯" by its slot's width, Clear a ✕ under 25rem; the
  drawn Switch is a `checked` action, the Switch while it fits and a
  menuitemcheckbox in "⋯" when not, its width measured in BulkBar); below 1280 the SideNav animates 200 → 80 on
  load; at 1440 the first paint is the Tabs layout until hydration
  (`useMediaQuery`'s server snapshot); below 1280 the current row is not
  scrolled into view on switching to Appointments; the **Filters** bar is
  its drawn 58 (12 around a 32 `sm` button) at every width and every
  density, so in the day bar it reads as a tall box beside 24px Badges —
  the "tall box at 768" of an earlier task, not a 768 layout fault (seen
  at all four widths; left as the component draws it). **Site-wide, open:**
  `app/docs.css`'s global `:focus-visible` comes after component CSS and
  overrides rules of the same specificity — a second ring inside the
  palette's field on `/screen/full`, the same weight problem the Combobox
  entry records; likely `:where(:focus-visible)`. Deferred minors in the
  ledger (`.superpowers/sdd/2026-09-23-dense-screen/progress.md`): the
  `.auto` calc duplicated in `Combobox.tsx`; the frame script's binary
  density check; no tests for move/resize Undo, the drawer's Confirm and
  Cancel, Book, the palette's commands, or a message from the right source
  with the wrong origin; commit links on `/screen` are raw `a`, and their
  hashes need re-checking after the merge; spec decision 6's drawing of
  the zones was not built (a Table instead). Seen in Chromium through the
  frame's own switches: 1440, 1024, 768 and 375 × light and dark ×
  comfortable and compact, all sixteen, with no horizontal overflow at
  375 on either tab; the focus ring by eye on the frame's switch, a card
  and a row's button; a card dragged with its Toast and Undo; the Drawer;
  the Dialog; ⌘K inside the frame, "Go to tomorrow" by Enter and Esc
  closing it. Browser pane artefacts: the first capture after a mode or
  tab switch often shows the frame half-painted while the computed styles
  are already settled — a second capture is right; a ref inside the iframe
  cannot be clicked, only coordinates. Not checked: Safari, Firefox, a
  screen reader, a real touch device (so invariant 23 is unseen), Esc on
  the New appointment Dialog, a build with `DOCS_BASE` set. **Fernando
  still has to apply the Alpenglow Density collection in Figma** (Needs
  the account owner).
- **CommandPalette** — built 2026-09-23, on main (48bffcf), released in
  0.5.0; sixth and last of wave 3, "the site's ⌘K graduated". Spec
  `docs/superpowers/specs/2026-09-23-command-palette-design.md`, plan
  `docs/superpowers/plans/2026-09-23-command-palette.md`. Controlled Dialog
  + Input as one combobox over a listbox of grouped `CommandItem`s (data,
  not JSX: label, description = the site's crumb, detail = its excerpt,
  icon, `shortcut` drawn as a key cap and binding nothing, keywords, disabled,
  mono); `filter` as the Combobox's, `null` for a caller that narrows (the
  site's index stays in the site); `status` for a caller's own line over
  what it still shows; the keyboard is the site's, over a disabled row;
  rows of its own (the OptionList draws checks, a command is not chosen),
  `step`/`first`/`last`/`fold`/`found` shared — `found()` in
  `listbox/options.ts` now serves the OptionList's mark and the palette's.
  `useCommandPaletteShortcut(onOpen, key)` binds ⌘/Ctrl+key on a ref
  written in an effect, **not `useEffectEvent`**: the peer range starts at
  React 19.0 and that hook arrived in 19.2. `app/ui/search/Search.tsx` is
  rewritten on it (index, recent, suggested and the hrefs stay the site's;
  a row's id is `<group>:<href>`); `applyTheme` extracted from the
  ThemeToggle for the page's "Switch to dark"; `navigation-stub.ts` and
  `Ratio.test.tsx` gained `useRouter` since the page navigates. The page's
  Try it binds **⌘J**, because ⌘K is the site's search and two palettes
  answered one key in Chromium. Recorded, not fixed: a typo hit from the
  site's index ("buton") is listed unmarked, the palette marking by
  folding the query. Browser pane: Esc and Enter do not reach the dialog
  (tool artefact; `cancel` dispatched by hand closes it) and `100vw` does
  not follow the 375 emulation, so the phone check is the Dialog's own
  `max-width` plus the stylesheet's 480px rule. Seen in Chromium: the
  page's palette by button and ⌘J, the filter and the mark, the arrows'
  fill, Enter switching the theme, the site's ⌘K on the component listing
  tokens in mono, light and dark. Not checked: Safari, Firefox, a screen
  reader, a real phone.
- **Chart palette** (foundation) — built 2026-09-23, on main (43dca92), released in 0.5.0;
  the roadmap's data-vis palette, closing wave 3's foundations beside the
  category palette. Spec
  `docs/superpowers/specs/2026-09-23-chart-palette-design.md`, plan
  `docs/superpowers/plans/2026-09-23-chart-palette.md`. Twelve `chart/*`
  tokens: sequential twilight 200/400/500/600/800 (dark the other way, so
  step 1 is always nearest the canvas); diverging twilight 800/600/400,
  stone/200, flare 400/600/800 (dark 200/400/600, stone/800, 600/400/200),
  ColorBrewer's PuOr pair. Decisions: single hue over the "alpenglow"
  multi-hue ramp, whose hue order would reverse between modes; glacier
  refused as the first category; the near-canvas steps are under 3:1 by
  construction and **recorded, not graded** (`Ratio recorded`, a
  `gradeNote` badge), the suite holding neighbour ΔL ≥ .09 / .16 instead;
  a value inside a cell takes `text/primary` near the canvas and
  `interactive/on-accent` further out, the light sequential-3
  (twilight/500) carrying neither at AA — 4.15 / 3.92, large text only;
  category order on a chart glacier, flare, moss, glow, amber, ember, and
  a series is labelled directly or by shape, never by a colour legend
  alone. What the two pages share is `app/ui/chart.ts`. The search
  extractor now skips text under `role="img"` (the SVG charts' ticks).
  **Fernando still has to apply the 12 variables in Figma.** Seen in
  Chromium: the three charts on a card and on the canvas, light and dark,
  375 with no overflow. Not built: a Chart component, pattern fills,
  colour-vision simulation.

- **Scheduler** — phase 1 built 2026-09-23, on main (b3738b9); phase 2
  built 2026-09-23, on main (f6ab769); both released in 0.5.0; fifth of wave 3. Specs
  `docs/superpowers/specs/2026-09-23-scheduler-design.md` and
  `2026-09-23-scheduler-interaction-design.md`, plans
  `docs/superpowers/plans/2026-09-23-scheduler.md` and
  `2026-09-23-scheduler-interaction.md`. **Phase 2**: Fernando named Vimcal
  as the behaviour reference (its public docs confirm A for Slots, Z Time
  Travel, D/W/M views, ⌘K, ⌘;; the rest from memory, marked so in the
  spec). Three gestures, each armed by its callback only: `onCreate` (press
  = `defaultDuration` 30, drag = the span, snapping to `step` 15; Enter on
  the region places a keyboard cursor, arrows move it, Shift stretches it,
  Enter proposes; ⌘V pastes after the hot event or at the cursor, ⌘D
  duplicates, both with `from`), `onMove` (drag along or across columns;
  Shift+arrows), `onResize` (the drawn handle on the selected card;
  Alt+Shift+Up/Down), `onRemove` (× on availability cards; Delete). The
  **hot event** is the hovered one if it is still there, else the focused
  one (Vimcal's hover-and-press, made accessible). `draft` is controlled,
  drawn dashed and pulsing at 1.8s (the Skeleton's pace) while the caller's
  panel is open; the drag draws its own ghost. A `role="status"` says the
  time as it moves. **Touch taps and does not drag**, by decision: a
  vertical drag is the grid's own scroll and `touch-action: none` would
  take scrolling from every finger; a long press is the next step if a
  product needs it. Placement is measured from the events layer (`.events`
  absolute, inset by the pad), so no custom property is read from JS; tests
  mock the layers' rects. `formatSlots(events, locale)` writes the drawn
  "Copy to clipboard" text. Review fixed: paste from another day shrank to
  one step; a stale hover id swallowed the keyboard; the status was silent
  while the cursor moved; the Escape listener re-bound on every move; the
  page's slot title repeated its kind. Seen in Chromium: a drag creating
  the pulsing draft with the New event panel, a card moved to another day
  with the Undo toast, a resize by the handle, an availability slot with
  its × and the slots' text, the cursor by keyboard. Not built: Time
  Travel (a second zone's hours), long-press drag on touch, a month view,
  an agenda list. **Drawn** on the
  product's Calendar V2 page: the weekly view (hours column with the zone,
  a 64 header with today in a 28 accent circle, All-day row, 81 hours, the
  hours outside the working day hatched, the coral now line with its time,
  118 cards in 129 columns at radius 8), the daily view with several people
  (a column per person, avatar and name, a colour each), the daily view on
  a phone (one column, 24-hour labels) and the Appointment Status sheet
  (regular at four durations, pending, cancelled struck, time blocker
  dotted, external with a bar, availability in teal, everything faded when
  past, hover, selected, the dashed "(No title)" being created). Fernando
  took **A in two phases**: the grid, the events, selection and the
  keyboard now; drag to create and to move, the keyboard equivalents and
  availability as a second spec once this is on main. **The package takes
  the grid; the screen is the caller's** (toolbar, mini-calendar, filters,
  the selected event's panel), composed on `/scheduler` from Button, Select
  in a Field, Calendar, Checkbox and Card. Wall-clock `ISODateTime`
  strings, no `Date` leaving, on the Calendar's `date.ts` (which gained
  `startOfWeek`) plus `time.ts`; `layout.ts` gives lanes to overlaps (the
  drawn cascade is not replicated). Each column is a `section` with a `ul`
  of buttons named "title, time, kind", not a `grid` of cells; one tab
  stop, arrows within and across columns to the nearest by start, Home,
  End; `aria-current` on the selected. `now` is a prop, the clock through
  `useSyncExternalStore` (null on the server) when left out, past derived
  from it, all-day past by its date. **The category palette landed here**:
  24 `category/*` theme tokens (six hues × fill, on, subtle, text, the
  accent's stops), a fifth table on the Colour page, 12 contrast cases,
  the Figma export regenerated — **Fernando still has to apply the new
  variables in Figma** (`docs/figma/alpenglow-variables.json`). Lessons:
  Node's ICU puts thin spaces in `formatRange` and Chrome's does not, so
  the page failed to hydrate until `time.ts` composed ranges from parts
  with plain spaces; an hour label 80 tall with `translateY(-50%)` sat 40
  up, so it is lifted by half a line; the card floor is a quarter of the
  hour (20), since the drawn 24 in 81 overlaps the next quarter — drawn 24
  (the product file, `4914:36173`), built 20, Fernando's to rule (the spec
  and the page said 24 until 2026-09-24); the search
  index's per-page cap went 25 → 32 KB for the Colour page at 82 tokens.
  Review fixed all-day past, the floor, the All-day lists' names,
  `renderEvent` documented as seen not read, `startOfWeek` shared; the
  scroll effect deliberately ignores a `workingHours` change. Not built:
  drag (phase 2), a week of several people, a month view, an agenda list,
  the on-appointment and people-waiting bars. Seen in Chromium: week,
  day by person, kinds, keyboard, light and dark, 375 with one column and
  no overflow; the pane's Enter did not activate the button (a tool
  artefact; user-event holds it). Not checked: Safari, Firefox, touch, a
  screen reader, RTL.
- **FileUpload** — built 2026-09-22, on main, released in 0.5.0; fourth of wave 3. Spec
  `docs/superpowers/specs/2026-09-22-file-upload-design.md`, plan
  `docs/superpowers/plans/2026-09-22-file-upload.md`. **Drawn**: the
  product's "Upload image" dialog in three states (rest, dragged over,
  uploading with a ring and "Uploading name"), the Uploaded Document card
  (icon, name, "PDF . Download" or the 4 bar) and the "+" tile among a
  client's documents. Fernando asked for alternatives; four were shown
  (drawn single zone; zone + cards; compact button + list; the tile) and
  he took **B, zone and cards, as the component with A, C and D as
  variants** (`variant` zone / compact / tile; a single-file zone shows the
  upload inside itself as drawn). A real file input, the zone its label,
  named by the words alone through `aria-labelledby` (the hint is inside
  the same label); the component checks `accept` and `maxSize`, hands the
  accepted to `onAdd`, shows the refused as failed cards with the reason
  and does no network; `files` and every status are the caller's. Colours:
  the dashed edge `border/strong` (the roadmap's boundary; the drawn edge
  fails), dragged over `surface/accent-subtle` with `border/accent`; two
  contrast cases (223). Drag state by an enter/leave depth counter, not
  `relatedTarget`. From the review, each with a test: the variant classes
  on the root were the label's own classes and the root drew a second
  dashed box around the list (seen in Chromium) — parts are `.drop`,
  `.button`, `.square`, apart from `.zone/.compact/.tile`; a dangling
  `aria-describedby` while the single zone uploads; refused ids stepped
  inside a state updater (StrictMode); hover beating disabled by sheet
  order; a refused card's × ignoring `disabled`. Seen in Chromium: rest,
  dragged over (synthetic), a drop with two accepted and two refused, the
  bars climbing to Download, the single zone uploading, compact, tile,
  focus ring, light and dark, no overflow at 375. `/file-upload` page with
  a pretend upload and "Best practice, and the alternatives"; nav entry
  (thirty-one); section card. Recorded, not built: a drop of several files
  on a single zone keeps the first silently; a real drag with a mouse and
  Safari, Firefox, a screen reader, RTL not checked.
- **Slider** — built 2026-09-22, on main, released in 0.5.0; third of wave 3. Spec
  `docs/superpowers/specs/2026-09-22-slider-design.md`, plan
  `docs/superpowers/plans/2026-09-22-slider.md`. **Drawn** as the Slider
  set (node 1127:19816; the MCP's metadata for it breaks mid-response, so
  the drawing was read from the render and the measures from the scale):
  a thin track, a round thumb with an accent edge, label with unit and
  info, caption, values or icons at the ends, a balloon "always visible",
  a field beside to type the value with "Value can't be more than 100%",
  a range with two thumbs and two fields, a rating with a mark per step,
  and a bare slider. Fernando: **"Faz o que conseguires … sugere tu as
  melhores práticas e alternativas"** — everything drawn is one
  component, `Slider` with `range`, on real `input type="range"`s painted
  by the component (the input's track transparent; line, fill, ticks and
  balloon the component's, inset by half a thumb so they share the thumb's
  travel exactly). Colours are the Switch's precedent: `border/strong`
  empty, `interactive/accent` fill and thumb edge, `surface/raised` thumb,
  the drawn grey track failing 3:1. A range is two inputs with
  `pointer-events: none` and their thumbs `auto` (each family's rule), so
  either thumb is grabbed with a mouse or a finger; a press on the line
  reaches the track and moves the nearer thumb; when both stand on one
  spot the one that can move is on top. The field is the Input: inside
  the range it moves the thumb, outside it stays as typed, invalid, with
  the bound in its own message. From the review, each with a test: a
  typed value is snapped to the step grid as the input snaps it; a value
  refused for crossing the other thumb is applied when that thumb moves
  past it; each field has its own error; ticks only when the step divides
  the range. Seen in Chromium: fill, thumb centre and balloon at one x;
  both thumbs of a range dragged, a press on the line, 101 refused, arrows
  with the field following, the ring on the thumb, light and dark, no
  overflow at 375 — not in the production build, where the track was 0 and
  the field 802 wide at every width and the page scrolled sideways, the
  shared `.control { width: 100% }` winning on chunk order (corrected
  2026-09-24, fidelity audit; fixed 2026-09-24 on `fidelity-part-1`: the
  field's width reaches the shared rule as `--alpenglow-control-width`,
  registered not to inherit). Two
  contrast cases (221). `/slider` page with every
  drawn usage and "Best practice, and the alternatives"; nav entry
  (thirty); section card. Not built, recorded: the tag-like balloon; a
  decimal comma in the field; balloons overlap when values meet. Not
  checked: Safari (thumb pointer-events, fieldset), Firefox, touch, a
  screen reader, RTL. **Open (Fernando, 2026-09-22): the Slider's drawing
  is weak and is to be redesigned later**; the code is built so that a
  new drawing lands in one stylesheet (thumb, line, balloon, field width
  are custom properties and one family rule each) and the API stays.
- **SegmentedControl** — built 2026-09-22, on main, released in 0.5.0; second of wave 3.
  Spec `docs/superpowers/specs/2026-09-22-segmented-control-design.md`, plan
  `docs/superpowers/plans/2026-09-22-segmented-control.md`. Not drawn on its
  own: the product's `Tabs` set is the drawing, already the Tabs' segmented
  variant. Fernando took **A**: the Tabs keep the variant and the two share
  `src/components/segmented.module.css` (`.track`, `.segment`, `.ghost`,
  `.thumb`, `.selected` and `.disabled` as classes each component puts on),
  the way `choice.module.css` serves Checkbox and Radio. A `fieldset` with
  `role="radiogroup"`, the legend off screen, a `label` per option around a
  radio off screen, so keyboard, submission and state are the platform's;
  the component writes no keyboard handling. A value that names nothing, or
  a disabled option, checks nothing and draws no thumb — not the Tabs'
  fallback to the first. The roadmap's "shares `choice.module.css`'s
  unmarked boundary" was **not** taken and is recorded on the page: the
  segments are text, the chosen one has a shape and a colour, and the radio
  says the state; the track keeps the Tabs' hairline of 2026-09-18. From the
  review, with a test: the shared `.segment` and the Tabs' `.tab { font:
  inherit }` were one class each and the bundler's order let the Tabs win —
  a segmented tab measured 14/22 instead of 12/16 in Chromium — so every
  segment rule is `.track > .segment`, a child, two classes to one. Seen in
  Chromium: the thumb on the chosen segment, arrows choosing, the ring on
  the label for a radio focused off screen, a form submitting `period=month`,
  the Tabs' specimen unchanged, light and dark, a phone width. No new
  contrast case: the segment's pairs were measured for the Tabs.
  `/segmented-control` page; nav entry (twenty-nine); section card; the Tabs
  page links here. Not built, recorded: a count, an icon-only segment, a
  second size. Not checked: Safari (a `fieldset` as a grid), Firefox, a
  screen reader, RTL.
- **SideNav, SideNavSecondary and TopBar** — built 2026-09-22, on main, released in 0.5.0;
  first of wave 3. Spec `docs/superpowers/specs/2026-09-22-navigation-design.md`,
  plan `docs/superpowers/plans/2026-09-22-navigation.md`. **Drawn**: the Side
  Navigation set (200 open, 80 closed with icons, items 48 in a capsule
  at `160:9623` — this said 40, corrected 2026-09-24, fidelity audit; built
  40, `density/nav-item` — the current one on `surface/base` in
  `text/accent`, Settings at the foot), the
  Second Level Navigation set (240 open, 24 closed as a strip with the
  collapse button, sections under caption/sm captions with a chevron, items
  40 at radius md, the current one on `surface/raised`), and the Top Bar (64
  on `surface/raised`, menu and logo at the start, Create, three icon
  buttons and the Avatar at the end). Fernando took **A, two levels as two
  components**, and the design as proposed: the collapse control is the
  TopBar's menu button and the caller holds `collapsed` and `open`; on a
  narrow screen (`narrow`, a media query, `media.down.md` — 768, since
  2026-09-24; 760px until breakpoints were tokens) the SideNav is a
  **modal `<dialog>`** with the Dialog's mechanics;
  collapsed items keep their names in Tooltips; a section is a `<details>`;
  the caption is `text/tertiary`, not the drawn `text/disabled`. What is
  graduated from the site's nav is the pattern, not the M3 rail, which the
  site keeps. From the review: a section's `open` was written every render
  and a folded section reopened on a re-render (the Accordion's lesson) —
  each section reads its default once, with a test; sections keyed by index
  and caption; a press on a link in the drawer does not close it, the caller
  closes on navigation, said in the type and on the page; no phone version
  of the top bar's actions or the second level is built, the page says what
  a caller does. This said none was drawn: phone and tablet top bars are
  (`116:9367`, `120:9434`, `2787:6033`), and a phone bottom bar
  (`638:10984`) (corrected 2026-09-24, fidelity audit). Seen in Chromium:
  80 and 24 collapsed, the drawer
  with its scrim over the page, light and dark, a phone width. Two contrast
  cases. `/navigation` page with the composed shell and controls; nav entry;
  section card; `useMediaQuery` hook (`src/components/useMediaQuery.ts`,
  false on the server). Not checked: Safari, Firefox, a screen reader, the
  collapsed tooltip by eye, RTL.
- **Table, dense, and Filters** — built 2026-09-22, on main, in 0.4.0; the last
  of wave 2. Spec `docs/superpowers/specs/2026-09-22-dense-table-design.md`,
  plan `docs/superpowers/plans/2026-09-22-dense-table.md`. Fernando gave two
  product pages: **Filters, "future proof"** (a bar above the table: chips
  "**Status** is **Active** and **Invite Pending** ×", a "+" that opens the
  fields and then a field's checkboxes, a chip that reopens its values,
  Clear) and **bulk actions** (an accent bar floating at the foot with
  "2 SELECTED", icon actions, a Switch "Show only selected" and "Clear
  Selection"; a stripe of accent at the start of a selected row; a footer
  "Show [10] · 1-10 of 72" with the Pagination). Asked what goes into the
  Table and what stays apart, he said **"faz e depois avaliamos"**: the
  recommended split was built. **Into the Table**: `stickyHeader` inside a
  `maxHeight` region (sticky is held by the nearest scrolling ancestor and
  the frame scrolls sideways, so a header cannot stick to the page; the line
  under it is a shadow, a collapsed border scrolling away in Chromium), the
  selection bar rendered by the Table with `bulkActions`, `footer`, the
  stripe; the root became a wrapper (root > frame > region > table, then the
  dock and the footer). **Beside it, `Filters`**, controlled, chips as the
  Tag, values in a Popover of Checkboxes, the "+" a Popover with the fields
  on one side and the picked field's values on the other. **The bar is a
  neutral floating panel, not the drawn accent** (decided 2026-09-22): what
  the caller puts in it reads the theme's text tokens, illegible on accent,
  and there are no tokens for controls on an inverse surface yet — the same
  open item as status-on-inverse. **Confirmed by Fernando after using it
  (2026-09-22): the bar keeps the less accented colours**; the accent
  drawing is not waited for.
  The chip says "is A **or** B" where the drawing says "and": asked whether
  the filters were good, told yes, and that "and" reads as both; `describe`
  changes the words. The toolbar's filter icon is not composed: it repeated
  the "+". From the browser and the review: the dock stretched the bar to
  its zero height (18px) — `align-items: flex-start`; the bar ran past a
  phone's viewport — it wrapped (one row since 2026-09-25); the last rows lay under the bar with no way
  out — `--table-foot-room` pads the region while the bar is shown, measured
  clear; Filters dropped a value it did not know — kept after the known
  ones; the docs' "show only selected" survived Clear selection with its
  Switch gone — it follows the selection. Recorded, not solved: the count is
  a `role="status"` inserted with the bar, so the first selection is not
  announced. Two contrast cases (the stripe on the selected row; the count
  on the overlay; the chip's words on sunken). The Table page's "Dense"
  section is the composed screen (search, Filters, bounded table, bar,
  Pagination) over 72 rows; `/filters` page; nav entry; section card. Not
  checked: Safari, Firefox, a screen reader, RTL.
- **Progress** — built 2026-09-22, on main, in 0.4.0; tenth of wave 2. Spec
  `docs/superpowers/specs/2026-09-22-progress-design.md`, plan
  `docs/superpowers/plans/2026-09-22-progress.md`. Not published as a
  component; drawn twice: **along the top edge of the onboarding** (4 tall,
  the page's width, square, track `border/default`, the fill a gradient of
  cyan into the accent) and **under a file being uploaded** (4 tall, radius
  sm, track `surface/sunken`, fill `glacier/400`). Fernando asked for a
  proposal from best practice: **only the linear bar**, determinate and
  indeterminate; the ring is the Loader, and a segmented bar has no drawing.
  **The onboarding gradient is meaning, not decoration (Fernando,
  2026-09-22)**: the proposal called it decoration and he corrected it — the
  colour shifting as the bar grows says how close to the end you are. The
  theme has no gradient token, so the fill is `--progress-fill` (an image)
  and the page composes it from `text/info` into `interactive/accent`; the
  component ships no gradient. Recorded, not built: the drawn gradient
  stretches within the fill; a gradient fixed to the track, so the accent is
  reached only at the end, would need the fill clipped from the track and is
  not possible with one background. **A native `progress` painted on the
  element itself**: `appearance: none`, the track its background colour (the
  pressed wash, for the Skeleton's reason), the fill a background image sized
  by `--progress-value`, the three browser pseudo-elements transparent each
  in a rule of its own; so a change of value transitions on `travel` and
  every browser draws the same bar. Seen in Chromium: the element's own
  background paints and `background-size` transitions. Sizes `sm` 4 and `md`
  8; the Loader's tones; `label` required, `hideLabel`, `showValue`,
  `valueText` (also `aria-valuetext`); no `value` is a band crossing in 1.5s,
  reduced motion holds it centred and breathes it at 3s. From the review: the
  share is held within 0 and 100 (a negative `background-size` is invalid and
  painted a full bar; `max` 0 said `NaN%`), the percentage is floored, the
  usage snippet shows the `CSSProperties` cast. Eight contrast cases, the
  fill's tones on every surface. The fill's leading edge is square inside the
  round track, invisible at 4 and faint at 8; not fixed. Not checked: Safari,
  Firefox (whether `::-moz-progress-bar` of an indeterminate bar stays
  transparent), a screen reader, reduced motion by eye.
- **EmptyState** — built 2026-09-22, on main, in 0.4.0; ninth of wave 2. Spec
  `docs/superpowers/specs/2026-09-22-empty-state-design.md`, plan
  `docs/superpowers/plans/2026-09-22-empty-state.md`. Not drawn as a
  component; Fernando asked first what it is and whether it depends on the
  component (it does in what it says, not in its shape), then gave **the
  product's page of a location just created**: empty is quiet and in place
  there — "+ Add description" where the content will be, `--` for a count,
  a grey placeholder for the picture, "Can't load map" as a white label over
  a grey area. The drawing covers a record and not a list or a search with
  nothing. Shown six treatments of the large one, **his set (2026-09-22): A,
  an icon in a circle centred with a primary action; C, `media` in the
  icon's place; E, `variant="dashed"` (his own "+" tiles), for first use
  only; G, two actions at most, one primary; H, no results as a rule of
  content, not a look.** Left out: concentric halos, ghost rows (the
  Skeleton). `title` (a heading, `headingLevel` 3), `description` held to
  40ch, `icon` hidden, `media` not hidden, `action`, `secondaryAction` which
  **the type refuses without an `action`**, `size` `lg`|`sm`, `variant`.
  The circle is `interactive/wash-pressed`, not a surface, for the
  Skeleton's reason. The small size's parts take their differences as custom
  properties (`--empty-*`), not by descent. **The drawn "+ Add" in place is
  the ghost Button with an icon and is documented as a pattern, not a
  component**; "Can't load map" is the small size on a surface over the
  placeholder, composed on the page. From the review: `.lg`'s padding is
  `--empty-inset` (24) and not 40, since a Table's empty cell has its own —
  the empty table measured 264 against 260 with three rows; the docs' "no
  results" example got the live count the page tells callers to add. Not
  checked: Safari, Firefox, a screen reader.
- **Breadcrumb** — built 2026-09-21, on main, in 0.4.0; eighth of wave 2. Spec
  `docs/superpowers/specs/2026-09-21-breadcrumb-design.md`, plan
  `docs/superpowers/plans/2026-09-21-breadcrumb.md`. Not published in the
  library; **drawn in the product's client record**, in the top bar: the
  section as a capsule on a grey fill with its icon, **a slash**, the page in
  Semibold, two levels only. Proposed first with a chevron, before the
  drawing was seen; the slash it is. Shown three ways to a third level,
  **Fernando's decisions (2026-09-21): the root is a capsule at rest, every
  link is a capsule under the pointer, and only the first has an icon.**
  `nav` > `ol`; ancestors with `href` are links through `Anchor`
  (`renderLink`), one without is words; the last is the page, a span with
  `aria-current="page"`, never a link; slashes and icon `aria-hidden`. The
  capsule is 28, radius md; the root's fill is `interactive/neutral`, not the
  drawn `surface/base` (a hole in dark); hover is the wash, over the fill or
  over nothing; no underline; `.link.link` against a page's `a` rules. A long
  name is cut at 24ch. **`maxItems` folds the middle into a "…" button that
  unfolds it in place, not a menu**: the DropdownMenu's rows are buttons and
  a crumb has to stay a link. The drawn "back to Clients" pill in the page
  is an outline Button at sm with an icon and `href`, which the system has;
  the page shows it and it is not part of this. From the review: the focus
  after unfolding goes to the first link after the root, or to the list when
  there is none; a first item with no `href` keeps the icon. `Pager.test.tsx`
  names its neighbours, so a new page between Badge and Button moved one.
  **Seen in the same drawing: Tags in categorical colours** (Anxiety,
  Depression, CBT) — the palette the Tag's neutral-only decision is waiting
  for. Not checked: Safari, Firefox, a screen reader, dark by eye.
- **Skeleton** — built 2026-09-21, on main, in 0.4.0; seventh of wave 2. Spec
  `docs/superpowers/specs/2026-09-21-skeleton-design.md`, plan
  `docs/superpowers/plans/2026-09-21-skeleton.md`. **Not drawn.** One
  `Skeleton`, `variant` `text` | `circle` | `rect`, `lines`, `width`,
  `height`, `size`; **primitives and no moulds** (no SkeletonCard, no
  SkeletonTable: a mould is a second drawing to keep in step). **A sweep per
  shape at 1.8s** (Fernando, 2026-09-21): shown a pulse and a sweep he asked
  the speed and whether one band could cross every shape at once; shown that
  too (a viewport-wide gradient, `background-attachment: fixed`) with a
  control for the pace, he took a sweep for each shape at 1.8s. The single
  band is not built. The loop keeps its own timing, not a motion token.
  **Reduced motion does not freeze it** (invariant 6): the travel is dropped
  and the band breathes in place at 3.6s. **The fill is
  `interactive/wash-pressed`, not a surface**: `surface/sunken` is
  `surface/base` in dark, nothing on the page and a hole on a card; the band
  is the same wash again. Not held to a contrast ratio, and no contrast
  cases: it is not information, `aria-busy` on the caller's region is. Spans,
  `aria-hidden`; a transparent hairline for forced colours; reversed under
  `:dir(rtl)`. Only the browser showed: **a text shape as a block with
  margins of (1lh − ink)/2 collapsed out of its heading**, and the docs' card
  was 30 shorter while loading; it is an inline-block, `vertical-align:
  middle`, so the line box is the line's own height, and the card measured
  224 before and after. From the review: `className` and `style` go to the
  group of lines, once. Recorded, not measured: one compositor layer per
  shape. Not checked: Safari, Firefox, forced colours and reduced motion by
  eye.
- **Accordion** — built 2026-09-21, on main, in 0.4.0; sixth of wave 2. Spec
  `docs/superpowers/specs/2026-09-21-accordion-design.md`, plan
  `docs/superpowers/plans/2026-09-21-accordion.md`. **It is drawn**: a
  published Accordion set, the sections of the Side Drawer's View and Edit —
  a row of 64 (16, the drawn 32, 16), a `border/subtle` hairline under every
  item, a chevron of 20 at the start, a title in 16/24 Semibold, a count in a
  capsule of 20 on `surface/sunken` or a Badge, an Icon Button at the end in
  the state "Hover Add New Diagnosis", and several open at once ("Everything
  Open"). Older frames have the chevron at the end; shown both, **Fernando
  took the start** (2026-09-21). **`<details>`**, as the roadmap has it, so
  find-in-page opens the section with the match; several open by default,
  **`exclusive` shares one `name`** and closing the others is the platform's.
  The title is a heading in the `<summary>` (`headingLevel`, 3), `text/primary`.
  **The action is outside the `<summary>`** — a button inside a control is
  invalid — laid over the row's end with the summary keeping 64 clear
  (`--accordion-action-room` for a wider one; the package's icon-only Button
  at sm measured 50, not the drawn 32), and **always shown**, not on hover.
  The chevron's turn is `--accordion-turn` from `.details[open]`, `-90deg`
  under `:dir(rtl)`. The opening animates only under
  `@supports (interpolate-size: allow-keywords)` with `::details-content`
  and only under no-preference; **`::details-content` has its box-sizing in
  its own rule**, since a browser that does not know the pseudo-element
  drops the whole selector list it is in. `toggle` also fires for an item
  that mounts open and for one the prop moved, so what the caller was last
  told is kept in a ref; a controlled item is put back to its prop after
  every render. From the review: a closed item nested in an open one
  inherited the turn, so every item sets it; `defaultOpen` is read once, so
  a default that flips does not override the reader; the action's room is a
  property. The Drawer page's inline panel now has the drawn sections. Not
  checked: Safari, Firefox, a screen reader, find-in-page by hand, RTL by eye.
- **Drawer** — built 2026-09-21, on main, in 0.4.0; fifth of wave 2. Spec
  `docs/superpowers/specs/2026-09-21-drawer-design.md`, plan
  `docs/superpowers/plans/2026-09-21-drawer.md`. **It is drawn**: the
  published Side Drawer set (Create, View and Edit; md 480, lg 768), the
  whole height, square, white on the lg shadow, and **the Popover's shell,
  not the Dialog's**. Fernando's decisions, all 2026-09-21: **the end side**
  (the start is the navigation's; `side="start"` exists, top and bottom do
  not); **not modal** — the roadmap said `<dialog>`, side-anchored, but in the
  product the calendar stays live beside it and a form left half-way is asked
  about with a modal, so **the panel never closes itself**: Esc from inside
  and the close call `onClose`, a press outside does nothing, and the docs'
  example opens a Dialog `xs` over it; **expand is full screen**, as Asana's
  task pane, and is not md to lg; **two kinds**, `mode="overlay"` over the
  content and `mode="inline"` a sibling the content makes room for (the
  calendar); **resizable, both kinds**, off unless asked. One element,
  rendered only while open: overlay and anything expanded is
  `popover="manual"` (`role="dialog"`, the top layer with no z-index, no
  light dismiss, nothing inert), inline is in the flow (`role="region"`,
  `surface/raised`, `border/subtle` on the inner edge, no shadow). `display`
  only under `:popover-open` and on `.flow`. The handle is a focusable
  vertical `separator` with the width as its value: drag with capture, Left
  and Right by 16 in the direction the edge moves (RTL read from the panel),
  Home, End, double click back; a resize leaves the panel 320 and the content
  320, read again at every resize; no handle where there is nothing to give.
  Esc is left to anything inside with a popover open (`:popover-open`, in a
  try). Only the browser showed: **the focus did not come back after the
  "leave without saving?" Dialog** — a closed dialog's button is still
  `document.activeElement` until the next frame, so the return waits a task
  and takes a not-rendered active element (`checkVisibility`) as lost; and it
  is not taken back from a reader who has gone elsewhere. From the review:
  the limit read at every resize, `aria-valuenow` never past its most,
  expanded keeps the entrance animation rather than `none` (back from `none`
  it replayed on collapse), the inline panel gives way (`flex: 0 1 auto`)
  when the content has a least width. Recorded, not solved: `header` without
  `aria-label` leaves the panel unnamed and the type does not say so; the
  footer is pinned to the foot where the drawing has it after the fields;
  the drawn View and Edit's sections are the Accordion, next. The product's
  file was only reachable as thumbnails. Not checked: Safari, Firefox, a
  screen reader, touch drag, RTL by eye.
- **Tag** — built 2026-09-21, on main, in 0.4.0; fourth of wave 2. Spec
  `docs/superpowers/specs/2026-09-21-tag-design.md`, plan
  `docs/superpowers/plans/2026-09-21-tag.md`. The published `tag` is an icon;
  **the Tag is drawn once, inside the Combobox's frame**: a capsule 32 tall,
  an Avatar of 28, a name in `caption/md`, a close. **A sibling of the Badge
  and not a variant**, the question the roadmap left open: a Badge is a
  rectangle that says a state and is never touched, a Tag stands for a thing
  and has a button. **Neutral only** (Fernando, shown the Badge's tones on
  it): the theme's tones are meanings and a tag is painted by category, for
  which the theme has no colours; the roadmap's line is struck through.
  `children`, `start`, `size` (`md` 32, `sm` 24), `onRemove`, `removeLabel`,
  `removeProps`, `disabled`. It does not remove itself. On a card it is
  `surface/sunken`; **a field hands it `--tag-fill`**, and the Combobox gives
  `surface/raised` and, through `removeProps`, `tabIndex={-1}` and a
  `mousedown` that keeps the focus in the field — **the Combobox's private
  tag is gone**. The Avatar's scale has 24 and 30 and no 28, so the Avatar is
  24: four in all round in the 32 tag, flush in the 24 one. From the review:
  a transparent hairline for forced colours, with `.start` laid over it so a
  24 Avatar does not make the 24 tag 26; the docs' example dropped the focus
  to the body on a removal and now gives it to the list (`tabIndex={-1}`),
  and the page says the focus is the caller's to place; `.sm .remove` was a
  descent and is `.remove.removeSm`; a test holds the Combobox to
  `--tag-fill`. Not here: a pressed tag (a filter that toggles is a button
  with `aria-pressed`), a group. Not checked: Safari, Firefox, a screen
  reader, forced colours by eye.
- **Combobox** — built 2026-09-21, on main, in 0.4.0; third of wave 2. Spec
  `docs/superpowers/specs/2026-09-21-combobox-design.md`, plan
  `docs/superpowers/plans/2026-09-21-combobox.md`. **It is drawn, as a work
  in progress**: "Multiple Select With Search" on the Figma file's Combobox
  page — a search of published components finds nothing, and it was first
  proposed as not drawn until Fernando gave the page. Tags in a field that
  grows (32 tall, Avatar 28, a close), a close that clears them all at the
  first row's end, the menu's rows with a checkbox before every option and an
  "All" row that is a dash while some are chosen. **One component, two
  forms**: single is not drawn and is the Select with a field to type in;
  `multiple` is the drawn one. Set down without asking: what was typed is
  shown in the label by weight (Bold in a Medium list), since the filter
  finds it anywhere and the eye asks why a row is there; `clearable`, on with
  `multiple`; **the checkbox is the package's, the accent, not the drawn
  inverse fill**, and it is a picture (`.box` in `OptionList.module.css`)
  because an input in an option is `nested-interactive` to axe; **the tag is
  private until the roadmap's Tag is drawn**, 24 tall so a row of tags leaves
  md at 40. **`src/components/listbox/`** is shared with the Select, which
  was moved onto it first: `options.ts` (`fold`, `contains`,
  `filterEntries` added) and `OptionList`. Not exported. The list is
  `popover="manual"` — an `auto` one would close on every press in the field
  — and closes when the focus leaves the box and the list. **The value is
  always from the list**: typed and chose nothing, the choice is put back;
  emptied, a single choice is taken away. Typing makes the first option that
  can be chosen active (`best`), so Enter takes the best match. From
  invariant 22: suggests and never completes, the IME's Enter is the
  composition's, Home and End are the caret's until an option is active, Esc
  closes then reverts and goes no further. Many: the list stays open and
  what was typed is cleared; Backspace takes the last tag; a tag's button is
  out of the tab order (six tags, six stops; the keyboard has Backspace and
  the list); the "All" row hides while something is typed. Only the browser
  showed: the clear and the chevron wrapped to the last row with the field,
  so with tags they are pinned out of the flow; and a page's
  `:focus-visible` outline weighs the same as one class and drew a second
  ring in the box where it loaded later. From the review: the active option
  is kept by value, since a fetch changes the rows under an index; `fold` is
  character by character ('İ' lowercases to two code points); a form's
  reset. The site's search stays its own: a palette with sections, recents
  and a router. Not checked: Safari, Firefox, a screen reader, an IME by
  hand, dark by eye.
- **Select** — built 2026-09-21, on main, in 0.4.0; second of wave 2. Spec
  `docs/superpowers/specs/2026-09-21-select-design.md`, plan
  `docs/superpowers/plans/2026-09-21-select.md`. **A decision revised, not
  erased.** `Select` was the native `<select>` (Conventions, "Prefer the
  native element"; the roadmap's "Select stays native"). Fernando asked
  whether the menu's surface had been applied to the selects; it had not, and
  his drawing asks for what a native list cannot show — an Avatar in the
  Staff field, a code in bold in a Service option — in a list that is the
  OS's and so differs by browser. Offered `appearance: base-select` (Chrome
  and Edge 135, Safari 27, Firefox behind a flag; the OS list elsewhere), he
  asked why everyone's select is custom and whether a button with a list is
  a select at all. It is, when the choice stays shown. **`Select` is now the
  system's own list on `floating.module.css`, the same in every browser, and
  the native one is `NativeSelect`, unchanged** (a long form on a phone, a
  very long list). Breaking, before 0.3.0 on purpose. When `base-select` is
  everywhere, look again; the two components' props were kept apart for it.
  **The open list is not drawn**: it is the menu's rows. Shown a check with
  Semibold against a filled row, he chose **the check alone, in the accent,
  no Semibold**; the wash is the active option's, so chosen and active are
  never one mark, and there is no `:hover` rule since the pointer makes an
  option active. `options` is an array (`value`, `label`, `start`,
  `description`, `content`, `disabled`; groups), `label` always words and
  `content` shown in its place. The APG's select-only combobox: a `button`
  with `role="combobox"`, **the focus never leaves it**,
  `aria-activedescendant`, a press in the list kept from taking the focus;
  Tab chooses and moves on; Esc is stopped so a Dialog around it stays.
  `popover="auto"` with `popovertarget` once hydrated, because the invoker
  is the one press outside that must not close and reopen it. `name` goes
  through a hidden input, so `required` is said and not enforced. The
  floating surface gained **`--floating-overflow`** so a list can scroll
  without setting a property the surface sets. Only the browser showed: a 24
  Avatar in a 22 line made the md field 42. From the review: the list
  follows the keyboard into view and not the pointer, or a half-visible
  option under the pointer ran the list to its end; `togglePopover(force)`
  again; eight rows is the only cap, since a list capped to its room never
  flips; an uncontrolled Select listens for its form's reset. Recorded, not
  solved: a press on the Field's label while the list is open closes and
  reopens it. **The Popover's `position-try-order: most-block-size` has a
  cost seen while reviewing this: a panel opens above whenever there is more
  room above, even if it fits below.** Left, since a tall form cut off is
  worse; look again if it reads wrong. Not checked: Safari, Firefox, a screen
  reader, touch.
- **Popover** — built 2026-09-21, on main, in 0.4.0; first of wave 2. Spec
  `docs/superpowers/specs/2026-09-21-popover-design.md`, plan
  `docs/superpowers/plans/2026-09-21-popover.md`. **It is drawn**: a
  published `Popover` set of four product panels (Messages, User Menu, New
  and Edit Appointment). The component is their shell, in the Dialog's shape
  and not modal; the docs page rebuilds New Appointment and Messages from the
  system's parts; the User Menu is a DropdownMenu under a profile header,
  recorded and not built. **Two pieces.** (1)
  **`src/components/floating.module.css`**: the anchored top-layer surface,
  written out four times, is written once, for DropdownMenu, DatePicker, the
  Pagination's page size and the Popover — not the Tooltip, whose edge is
  `border/subtle` and which is not shown at all without anchors. **Two
  classes from two modules weigh the same and the later stylesheet wins, so
  the shared class sets nothing a consumer also sets**: padding, radius and
  width stay with each, and what differs travels as `--floating-anchor`,
  `--floating-area`, `--floating-elevation`, `--floating-gap`. Consumers'
  stylesheet tests read the two files as one and also assert the class is on
  the element, or a dropped class would pass. The gap is now a margin on both
  block sides. (2) **`Popover`**: `popover="auto"`, so light dismiss, Esc and
  focus return are the platform's; `role="dialog"` never `aria-modal`;
  `popovertarget` only once hydrated; `children`, `actions` and
  `headerActions` may be functions handed `{ close }`; the panel element is
  state, not a ref, because `close` goes to the caller's render functions and
  the Compiler lint refuses a ref read on the way. **`display` only under
  `:popover-open`**: set on the class alone it outranks the UA's `display:
  none` and the panel never closes. Only the browser showed: capped at the
  viewport's height a tall panel ran off the screen with its buttons, so the
  cap is `100%` of the area it is placed in with `position-try-order:
  most-block-size`, which takes the roomier side first since a panel that
  never overflows never flips; and a wrapper could not inherit that
  percentage inside an auto height, so the body did not scroll and ran out of
  the panel — the open popover itself is the flex column. A DatePicker inside
  it opens over it and does not close it. From the review: `togglePopover(open)`
  for the controlled prop, since `showPopover()` throws on a panel the trigger
  already opened and `shown` is a task behind the platform. Recorded, not
  solved: the trigger has to be a `button` and the type does not say so. Not
  checked: Safari, Firefox, a screen reader, light dismiss by hand.
- **Link** — built 2026-09-21, on main, in 0.4.0; **the last of wave 1**. Spec
  `docs/superpowers/specs/2026-09-21-link-design.md`, plan
  `docs/superpowers/plans/2026-09-21-link.md`. Not drawn (the published
  `link` is an icon). **A decision against the default, Fernando's,
  2026-09-21: no line at rest, in a sentence too; the accent always, the
  line on hover.** Measured first and shown to him: `text/accent` against
  `text/primary` is 2.73:1 light and 1.64:1 dark, against `text/secondary`
  2.06 and 1.03, all under the 3:1 colour alone would need (WCAG 1.4.1,
  G183). **The cue that is not colour is weight**: a link is Medium in a
  sentence that is Regular, and the line comes on hover and on
  focus-visible with the ring. The suite records the four ratios and asserts
  they are under 3, so a theme that reaches 3:1 reopens the question. It does
  not hold inside text already Medium or heavier, which the page says.
  Whoever "fixes" this changes the spec's table first. `inline` inherits its
  sentence; `standalone` is `body/md`, inline-flex, 24 tall (2.5.8 exempts
  only a link in a sentence); `iconEnd`; `external` is `_blank` +
  `noreferrer` + "opens in a new tab" said and not shown (`externalLabel`);
  no `:visited`, no hover colour (one accent text token). **The
  Button-as-link question, left to "best practice in code": `Button` takes
  `href`** and is an `a` with the same classes; a button variant on the Link
  would have copied every size, tone and state. An `a` has no `disabled`:
  disabled or loading it has no `href`, `role="link"`, `aria-disabled`, no
  handlers and no tabIndex, and `render` is not called. The stylesheet's
  `:not(:disabled)` is now `:not(:disabled):not([aria-disabled='true'])` —
  two `:not`s and no comma, because the loading test splits selector lists on
  commas. **`render={(props) => <NextLink {...props} />}`** on both, the
  DropdownMenu's `trigger` idiom, typed in `src/components/linkRender.tsx`,
  whose `Anchor` component exists because the Compiler lint refuses a ref
  handed to a function during render; as a prop to a component it is fine.
  **The later pass, same day:** `CardTitle` takes `render` and the
  Pagination `renderLink` (with `hrefFor`), both through `Anchor`. The Tabs
  have no link variant yet — the roadmap names one and the code never had
  it — so there was nothing to move; it takes `render` when it is built. Only the browser showed: the
  docs' `.prose a` (0,1,1) outranked `.button` and made the Button-link
  Medium and underlined on hover, so the docs rule is `a:not([class])` and
  the Button names the element, `a.button:hover`, against a consumer's
  `a:hover`. **With it, the visually-hidden rule has one home**,
  `src/components/visuallyHidden.module.css`, used by the Toast, the Alert,
  the Pagination and the Link. From the review: a caller's `rel` joins
  `noreferrer`; the new tab is said only if `target` is still `_blank`; a
  third overload takes `href: string | undefined`; `displayName`. Not
  checked: Safari, Firefox, a screen reader.
- **Card** — built 2026-09-21, on main, in 0.4.0. Spec
  `docs/superpowers/specs/2026-09-21-card-design.md`, plan
  `docs/superpowers/plans/2026-09-21-card.md`. **One card is drawn**, the
  published `Card - Locations` (Default and Hover); Fernando: the product
  has more, it is a complex tool, ignore the calendar's. He chose: **a
  surface and parts, the rest the caller's** over a bare surface or closed
  props; **the drawn fill with no border, "for now"**, over the site's raised
  card with a hairline; **the wash for hover**, not the drawn
  `surface/accent-subtle`, which is kept for a selected card. The fill is
  `surface/sunken`, so **a Card stands on `surface/raised`**: in dark sunken
  is the canvas (invariant 4) and on the canvas it is not seen. The site's
  navigation cards (`app/ui/Card.tsx`, on the canvas) were therefore **not**
  moved onto it, which the roadmap had planned; an `outline` variant is what
  they would move to. Set down without asking, to be corrected on sight:
  nothing is behind the hover (the drawn counts are always shown as Badges
  on the picture, "See details" is gone since the card is the link), the
  picture's hover is the wash and not 8% black (no token), and `CardBody`
  and `CardActions` beside the three parts agreed. `CardTitle` with `href`
  is a plain `a` whose `::after` covers the card; the ring is on the card
  through `:has()`, inside `@supports selector(:has(*))`. `CardActions` is
  **the package's one z-index**, held in by `isolation: isolate` on the
  card, because a positioned part before the link in the DOM would be under
  its `::after`. **Measured:** `text/tertiary`, the drawn captions' token,
  is 4.27:1 on the fill under the wash in light, so a linked card's captions
  are `text/secondary`; the suite records the number. `.title.title` and
  `.link.link` are doubled so a page's `h3` margin and link colour do not
  win. From the review: `.media > img`, not any `img` inside (an avatar laid
  over the picture was stretched to cover it); a card that holds cards does
  not hover and does not hand its two custom properties down; a transparent
  hairline, given back by the padding, because forced colours remove the
  fill that is its only edge; `id` goes on the title's element, linked or
  not; the dead `background-color` transition is gone, the wash snaps as on
  the Button and only the shadow travels. No photograph ships with the
  site, so the docs picture is drawn from tokens. Not checked: Safari,
  Firefox, a screen reader, forced colours by eye.
- **Pagination** — built 2026-09-20, on main, in 0.4.0. Spec
  `docs/superpowers/specs/2026-09-20-pagination-design.md`, plan
  `docs/superpowers/plans/2026-09-20-pagination.md`. **It is drawn**: the
  published `Pagination Item` (40; Selected with a 2 by 16 bar, round Hover
  and Focus, Disabled), `Navigation Button` and `Pagination` in four
  overflow shapes, and two unpublished footer frames with "Show", a 40
  Select and "1-10 of 72 results". **Fernando asked for the Select to go**:
  the page size inside the sentence, a number with a chevron that can be
  typed or picked, and to have it investigated. What came back and he took:
  it is the APG's **editable combobox with `aria-autocomplete="none"`**
  (`PageSize.tsx`, private to the Pagination until wave 2's Combobox) — an
  `input` and a `popover="manual"` listbox on the menu's surface and anchor
  positioning; `<datalist>` refused (no CSS, no page zoom, not announced by
  NVDA with Firefox) and `type="number"` refused (spinners, the wheel,
  "e"); the chevron shows at rest because touch has no hover; the width is
  `ch` over tabular figures, which is exact, so `field-sizing` (Baseline
  only since June 2026) is not needed; Enter or blur commits, Esc closes the
  list and then reverts, junk reverts with no error, `maxPageSize` 100;
  changing the size keeps the first row in view; `summary` is a function
  because word order is a language's. **The sentence is "Showing [10] per
  page · 71–72 of 72"**: "Showing 10 of 72" is false on the last page,
  which he agreed is a problem. `pages.ts` is a pure function and the four
  drawn shapes are it at siblings 1 and boundaries 1: seven places always,
  so the arrows never move, and never a gap for one page. Arrows at an end
  are `aria-disabled`, never `disabled`, or the focus falls to the body;
  `hrefFor` renders links; the page arrived at is said in a `status`;
  unselected numbers are `text/secondary` as the drawn footer has them.
  Only the browser showed three things: the listbox was a `ul` inside the
  summary's `p`, which the parser closes early and React fails to hydrate —
  it is spans with roles now, and the summary a `div` (the Tooltip's and
  the Alert's lessons again); nine places of 40 do not fit 280, so a place
  gives way to 24; and with `flex-basis` instead of `width` every place
  collapsed to 24 on the desktop, because the nav is sized by its content
  and a basis is not content. From the review, each with a test: typing
  clears the highlighted option, or Enter took the option highlighted
  before the typing and threw the typed number away; a modified or middle
  click on a page link does not page this list; nothing above
  `maxPageSize` is offered, and with no options it is a plain field with
  no chevron; a NaN `page` is the first; `announce={false}` for the second
  of two Paginations on one list. Not checked: Safari and Firefox, a screen
  reader, rtl by eye. Open: a compact size for the
  dense Table's footer (wave 2); "go to page"; rebinding the Figma frames and drawing the inline
  field there.
- **Alert** — built 2026-09-20, on main, in 0.4.0. Spec
  `docs/superpowers/specs/2026-09-20-alert-design.md`, plan
  `docs/superpowers/plans/2026-09-20-alert.md`. **It is drawn**: the
  published `Notification status` set (880 by 56, radius 12, icon 20, 14/22
  Medium with a Semibold fragment, `surface/*-subtle` and `text/*`; Info,
  Danger, Success, Alert; a 24 close, no button, one filled action pill).
  Decided with Fernando: **every edge is soft** — the drawing edges Danger
  and Success in the theme's 600 borders and Info and Alert in primitives
  with no token, and shown drawn, all strong and all soft he chose soft, so
  four tokens were added, `border/{info,success,warning,danger}-subtle`
  (light the drawn stops with `ember/200` and `moss/200` for the two drawn
  strong, dark `*/700`; 1.25 to 1.60 light, 1.90 to 2.05 dark, recorded and
  held to no floor); **the action is an outline in `currentColor`, "for
  now"** — the drawn fill has tokens for two tones of four, filling the
  other two would take about eight, and white on the drawn `glacier/500` is
  about 3.4:1; it returns when the theme has the fills. By convention:
  `warning` for the drawn "Alert" state; a `title` that is not drawn; it
  never hides itself (`onClose` tells the caller); not a live region unless
  `announce` (then `alert` for danger and warning, `status` for the rest),
  with the tone always said in words; the close is the Toast's 32, not the
  drawn 24; dark keeps the tint, a surface step above a card, not the
  Badge's outline. The Figma variable `radius/lg` is 12 where the code's
  `lg` is 8 and `xl` 12: the number was kept. A grid inside a root that is
  an inline-size container, so under 400 of its own width the action drops
  under the message and the close keeps the corner; no column-gap, because
  an empty action track beside a gap put the close 20 from the edge, which
  only the browser showed. The title is a `div`, not a `p`: the docs' prose
  rule gave the `p` a margin, as a consumer's reset would. Carbon's vectors
  moved to `src/components/statusGlyphs.tsx`, shared with the Toast. The
  search index's 200 KB total cap was crossed by this 5.6 KB page and is
  now 25 KB per page, which is what it was for. By hand in the Browser
  pane: 56 tall, 8 between parts, 12 to the close in every shape, both
  modes, the 320 specimen. From the review: the root is `width: 100%`,
  because a size container cannot take its width from its content and was
  0 wide in a flex row; `alertTones` satisfies `TintTone` and is in
  vocabulary.test.ts; `ALERT_NARROW` is the 400 the container query says,
  held by a test; the search index keeps a total budget too, 400 KB (206
  today); the Toaster takes `closeLabel`. Not checked: Safari and Firefox,
  a screen reader. Open: the tone said to screen readers is an English
  word in the Alert and the Toast, with no prop; the four variables in Figma (only when asked); the filled
  action; a neutral tone; the banners and trial bars, which Fernando will
  draw.
- **Toast** — built 2026-09-20, on main, in 0.4.0. Spec
  `docs/superpowers/specs/2026-09-20-toast-design.md`, plan
  `docs/superpowers/plans/2026-09-20-toast.md`. **It is drawn**: tone-filled
  notifications with a close (`1219:21015`, `1219:20982`). This entry said
  "It is not drawn" (corrected 2026-09-24, fidelity audit), and Fernando's
  decisions below were taken on that premise, so they are **reopened,
  pending Fernando's ruling**; the component stands as built until
  Fernando rules. What
  the 2026-09-20 searches found: the
  published `Notification status` set on the Figma file's *Notifications*
  page is the inline **Alert** (880 by 56, a tinted status surface with a
  border of its tone; Info, Danger, Success, Alert; close, no button, one
  action) and is kept for the Alert, the next component; the three trial
  bars beside it are banners, which Fernando will draw with the other bars.
  Decided with Fernando: **the surface is `surface/inverse`**, chosen over
  the overlay surface after seeing both over a card in both modes — a toast
  floats in a corner away from where the reader looks, the opposite case to
  the Tooltip's; **no colour for the tone for now**, the icon is
  `text/inverse` and its shape carries the tone, because the theme has only
  text and border for the inverse surface and he is about to change the
  theme; simple — a message, one action at most, a close. Measured: the
  theme's wash is a surface step on the inverse surface in both modes (ΔL
  .043 and .040), so hover is the wash as everywhere; `border/focus` is
  1.64:1 on it in dark, so **the ring is `currentColor`** and a test refuses
  `border/focus` in the stylesheet. `toast()` is a function over a module
  store (`store.ts`, no React) read by `Toaster` through
  `useSyncExternalStore`; no provider. The region is a named
  `popover="manual"` **open from the start and while empty** — a closed
  popover is `display: none` and a live region that is not rendered is not
  listening — closed and opened in one task on every arrival (not while
  focus is inside), to sit above what entered the top layer since; nothing
  is painted between the two calls, so the toasts showing do not fade again. 5s, 10s with an action, an error stays;
  each toast has its own clock, held by the pointer, the focus and a hidden
  document, and restarted whole. F6 focuses the newest, Esc dismisses and
  gives focus back. Three show, the rest wait; they stretch to the widest.
  Carbon's vectors are inlined, since the package does not depend on
  `@carbon/icons-react` at runtime. The site mounts one `Toaster` in
  `app/layout.tsx`; `app/ui/ToastSpecimen.tsx` is the picture of one for the
  anatomy and the Components card, whose visual is inert. Known limit: a
  modal `<dialog>` makes the top layer inert too, so a toast raised over an
  open Dialog can be neither pressed nor heard. By hand in the Browser
  pane: 24 from the corner, 48 tall, 8 apart, both modes, the wash on the
  close, F6 and Esc, the fourth arriving when one goes, 288 wide at 320
  with no page overflow. The pane reports `document.hidden`, so the clock
  never ran there: auto-dismiss is covered by the suite only. Not checked:
  Safari and Firefox, a screen reader (whether the close-and-open keeps the
  live region listening is the thing to hear), the five other placements
  by eye. From the review, each with a test: a focused toast dismissed with nowhere
  to send the focus lets the hold go by hand (a removed element fires no
  blur); the action's handler runs after the toast is gone, so one that
  throws cannot leave it up; `toast()` on the server does nothing; F6 from
  inside the region is the browser's. Open: status-on-inverse tokens, then
  colour on the icon; an exit animation; an error is `role="alert"` inside
  a polite list and may be said twice; `ToastSpecimen` restates the
  stylesheet by hand.
- **Tooltip** — built 2026-09-19, on main, in 0.4.0. Spec
  `docs/superpowers/specs/2026-09-19-tooltip-design.md`, plan
  `docs/superpowers/plans/2026-09-19-tooltip.md`. **It is drawn** — on the
  *Tooltip* page of the Figma file, as two frames, `Tootltip` and `Popover`,
  which are not published components: a search for a component named
  "tooltip" finds nothing, and a first proposal (an inverse surface) was made
  and withdrawn before Fernando pointed at the drawing. The drawn surface is
  the overlay one. **The edge is `border/subtle`, not `border/default`**:
  Fernando found `default` too strong and will add border tokens after his
  colour and layout tests in Figma; the drawn `stone/200` is 1.36:1 on the
  surface, between `subtle` (1.18 light, 1.65 dark) and `default` (1.72,
  2.97), and the suite records all four figures. A compact `sm` size was
  added for the word or two on an icon button; `md` is the drawn card. One
  `Tooltip` covers both frames (hover and focus, nothing to click); the
  click Popover of wave 2 will share its surface. `popover="manual"` with
  anchor positioning; where anchor positioning is missing it is
  `display: none` rather than centred, and `aria-describedby` still reads it.
  Spans all the way down, so it can sit inside a paragraph without the HTML
  parser closing the `p` early. The anchor name travels as one custom
  property on the wrapper (jsdom drops `anchor-name` from an inline style).
  From the review: a press on the panel does not close it; the Esc that
  dismisses it is cancelled, so a Dialog behind it stays open; one tooltip
  at a time, kept by module functions because the Compiler lint refuses a
  component reassigning a module variable. **In tests, `.focus()` after
  another test's pointerdown is not `:focus-visible` in jsdom** — the suite's
  `tabTo` sends a Tab keydown first. Checked in the Browser pane, both modes:
  8 above and centred, stays open under the pointer, Esc cancelled, no
  console errors; the pane's screenshot lags a frame behind a hover. Not
  checked: Safari and Firefox, a screen reader, a tooltip inside a real
  Dialog, a flip at the viewport's edge by eye. Open: the wrapper is
  `inline-flex` and does not stretch a `fullWidth` trigger; the site's rail
  Search still keeps ⌘K in a `title` (its tests assert it), which this
  component was partly built to replace; the Figma frames are bound to old
  primitives, and the cover's title layer still carries the name of the
  original Figma file.
- **Tabs** — built 2026-09-18, on main as `14c99ea`, unreleased. Spec
  `docs/superpowers/specs/2026-09-18-tabs-design.md`, plan
  `docs/superpowers/plans/2026-09-18-tabs.md`. `variant` is `underline`
  (not drawn: proposed, and approved by Fernando with one correction — the
  hover is a rounded 32px ghost inside the 40px tab, not the tab's box),
  `segmented` and `pill` (drawn as `Tabs`, `Tab Pill`, `Tab Group`). Seven
  deviations from the drawing are in the spec and on `/tabs`; the ones that
  look like mistakes: the segmented track is `surface/sunken` with a hairline
  because the drawn `surface/base` is the canvas; the thumb is
  `surface/overlay`, not `raised`, because in dark a `raised` thumb on a card
  is the card's own colour; the selected pill's count is `text/accent` on
  `interactive/selected` because the drawn white does not read. Added
  `elevation/sm`. **Every variant selector is compound (`.tab.underline`),
  never descendant (`.underline .tab`)**, and the variant's class is on the
  bar, the list and every tab: a Tabs nested in another's panel took the
  outer one's look, which only the browser showed; `Tabs.test.tsx` refuses
  the shape. The root is `min-width: 0` so a long list scrolls instead of
  widening a flex parent (found at 320). A count gets a real space before it
  or the accessible name is "Participants12". Checked in the Browser pane,
  both modes, 1280 and 320: ring on the ghost clear of the bar, thumb slides,
  dark track by its hairline, selected tab kept in view. Not checked: Safari
  and Firefox (`:dir(rtl)` on the thumb, anchorless so low risk), a screen
  reader, `dir="rtl"` by eye. Open for Fernando: writing the deviations back
  to the Figma file (the Montserrat counter and the stray `brand-alt/800`
  are leftovers there); route tabs (`nav` + `aria-current`) wait for the
  navigation components.

### -5. Eighteen design-system sites were read; the improvements are listed (2026-09-18)

Fernando asked for the same survey as the Atlassian one across the best-rated
systems — what sets each apart, its strengths, its gaps, across technology,
code, design, layout and tokens — compiled into candidate improvements.
Read in the Browser pane on 2026-09-18 (home, Button, colour/tokens, and a
probe of framework, custom elements, `:root` custom-property count and body
face): Material 3, Carbon, Polaris (now inside shopify.dev, web components),
Primer, Spectrum, Fluent 2, Lightning 2 (zeroheight), shadcn/ui, Radix
Themes, GOV.UK, USWDS, Cloudscape, Geist, Chakra, Nord, Gestalt (2.0 behind
a login), Helios, Ant Design. Recorded in
`docs/superpowers/specs/2026-09-18-design-system-sites-survey.md`: a
technology table, a profile per system, the cross-cutting patterns, sixteen
candidate improvements in order of worth and nine refusals with reasons.
The finding that matters: **not one of the eighteen prints a contrast ratio
beside a token pair or a component state**; three make contrast structural
without measuring (Spectrum's grays generated to target ratios, USWDS's
grade "magic number" — 40+ → 3:1, 50+ → 4.5:1, 70+ → 7:1 — and Cloudscape's
ratio in a charts token's description), and USWDS alone renders every
interactive state statically. That is where Alpenglow already stands alone,
and the first four improvements build on it: a state matrix with the ratio
in every cell in both modes (needs the scoped-mode block in `tokens.css`
from the Atlassian survey and a `data-state` rule for forced paint); a
"what the suite holds" list per component page; the Colour page's stops
explained by job, as Radix and Geist do; a `why` beside `use` on the tokens
that carry a decision. Then the 2026 baseline every developer-first site
has: `llms.txt` and Copy-page-as-Markdown (one more output of the search
extractor), Source · Issue links beside the title, version, date and
lifecycle on the page, Geist's tone × variant matrix, Helios's anatomy table
(Required / Optional / focus only), Gestalt's "also known as" aliases fed to
the search index, enum values explained per line in Props, "which of the 54
tokens this component reads", a drawer filter past a dozen components,
page feedback tied to the undecided analytics event, Nord's "rendered live —
inspect away" line, a freshness line. Refused: tabs, a Storybook or
configurator, a live editor, primitive tabs, an MCP server, the three
predict-without-measuring rules (named on Decisions as the alternatives),
web components, a cookie banner, sponsors and blogs, a login-gated site.
Nothing is built.

### -4. The Atlassian site was read; what of it is ours to take (2026-09-15)

Fernando liked the complexity of atlassian.design and asked for a survey.
Read in the Browser pane the same day — home, Components, Button on all four
tabs, Tokens, Colour palette, Elevation, Spacing, Accessibility, Tools,
Release phases, the search and the 404 — and recorded in
`docs/superpowers/specs/2026-09-15-atlassian-site-survey.md`: what their
site does, eight things worth taking, five to take when there is something
to attach them to, and seven refused with the reason. Nothing is built. The
eight, in order of worth to a portfolio piece: a light/dark switch on the
specimen rather than the site (two "Try it"s side by side, one per mode —
costs a scoped dark block in the generated `tokens.css`); a page for
`skills/applying-alpenglow-tokens`, which is in the repository and nowhere
on the site; a Source link to the component's folder on every component
page, derived from `package.json` as the footer's links are; a keyboard
legend and a body snippet in the search dialog; an `app/not-found.tsx` in
the site's chrome; both names — the custom property and the Tailwind class
— on every token row; a `CHANGELOG.md`, then "since 0.x" on tokens and a
git-built *Changes* section per component; Do/Don't pairs only where a
decision already exists. Refused: tabs per component, generated props, the
checkerboard, the mirrored dark ramp, a token picker.

### -3. Code blocks became windows (2026-09-14)

`app/ui/CodeBlock.tsx` replaced every bare `pre` on Install, Tailwind, Dark
mode and Developers: the Card's surface (invariant 4 — sunken is the canvas
in dark, and the old block had no edge), a caption with the file's name and
CSS-counter line numbers when `title` is given, a copy button, and colour from
`app/ui/highlight.ts` — five token kinds painted with `text/*` tokens, no
shiki, on Decisions. The home card's picture stays the small `pre`: Fernando said on 2026-09-15
to leave it, since the cards will get assets of their own. The same day the
drawer got a
**laptop tier**: from 1440 (now `2xl`) down to 761 it is absolute under the
rail, `visibility: hidden` and `translateX(-100%)`, slid out by
`.sidebar:hover` and `:focus-within` (the search dialog excluded), on
Decisions, on Space, and asserted in `Nav.test.tsx`. Not changed with it:
the 1160 breakpoint (now `xl`), which still assumes the drawer's 232
beside the page and could fall to 928;
and the brand, which leaves the page with the drawer on that tier — the
rail is 80 wide. What the code block leaves open: the tokenizer knows the site's
samples, not the languages — `html` reads script keywords throughout, `sh`
has comments and strings only, and a mixed block (an npm line over an import)
is typed `ts`; a block is titled only where its code already named its file in
a comment; the home card's `.miniCode` stays a picture, not a CodeBlock; and
the copy button's live region has not been heard in a screen reader.


### -2. The search landed; what is open (2026-09-14)

`ddb82a7`, live the same day (spec
`docs/superpowers/specs/2026-09-14-search-design.md`, invariant 22). Checked
in the Browser pane only — Chromium, light and dark, 800 and 320 — and on
the live site once. Open, in the order it probably matters:

- **Nobody has used it yet.** The ranking rules were set from a handful of
  queries (`butt`, `npm`, `surface/raised`, `dialgo`, `figma`). Fernando has
  not typed into it; the weights in `app/ui/search/index.ts` (title 10/9/6,
  labels 4, body 1 × mentions ÷ length) are the first guess, and every one
  is a case in `search.test.ts` — change the test first.
- **One page can crowd the eight slots.** `butt` lists the Button page and
  then five of its own sections, each matched only by the page label (4 ×
  0.7), ahead of two Decisions entries whose *titles* say "button" (6 ×
  0.7, but grouped after Components because groups follow their best hit).
  A cap per page, or a smaller label weight, is the likely tune; not
  decided.
- **The shortcut is a tooltip.** The rail caption has one line, so ⌘K /
  Ctrl K lives in the button's `title` and `aria-keyshortcuts` only. If the
  shortcut needs to be seen, the Install or Developers page could say it;
  the M3 rail says "Search" alone and was the model.
- **The accessible name is asserted, not heard.** jsdom names the button
  "Search" (content) with the title as description, as the spec says; the
  Browser pane's tree showed `button "Search — ⌘K"`, which is that tool's
  computation. Not yet checked in Chrome's accessibility panel or with
  VoiceOver, nor in Safari or Firefox at all — Esc, focus return and the
  top layer over the narrow overlay are the things to press by hand there
  (the DropdownMenu note, invariant 12, applies: the pane's Esc and Return
  are not trusted keys; its Enter is).
- **IME and Android are guarded, not tried.** `isComposing` is honoured
  and tested in jsdom; no real IME has typed into the field.
- **Avatar and Badge have no Props table**, so their props are not
  searchable; every other component page's are. A table on those two pages
  is indexed the day it exists, no code change.
- **No record of what readers search for.** The site has Vercel Analytics;
  a custom event on Enter (query, chosen href) would be the ground for the
  "popularity" the suggestions decided against. Not built, not decided.
- **The index chunk is 176 KB** (303 entries, ~35 KB compressed), fetched
  on the first open. Grows with the prose; `extract.test.tsx` fails at
  200 KB so a specimen dumping data is noticed, and the cap will need
  raising as pages are added — deliberately, after looking at what grew.

### -1. The docs content pass is done; five decisions wait on Fernando (2026-09-13)

Every page was rewritten on 2026-09-12 and 13 with the `better-*` skills
(accessibility, layout, writing, typography, colors, ui) in one shape: a
"Try it" or "See it", a "Choosing …" section on when to use the thing
against its neighbours, anatomy with the drawn numbers, states,
accessibility, props. The home is a card index in the M3 shape; the site
has no bar across the top, a section list beside the prose from 1496
(1440 until the rail), now `2xl`, the
measurements against the right edge, a skip link, a `main`, a pager. Every
number that was text became a computation. Both modes were checked on every
page (see the screenshot workaround in the private memory).

The chrome gained a **footer** on 2026-09-13, the one thing the sidebar had
no room for: where the package is (`npm`), where the source is (repository,
issues, MIT licence), three pages each from the developer and the system
paths, and the icon set and the typeface credited under a rule. Its off-site
URLs are derived from `package.json` — repository, bugs, name, licence,
version — the way the Install page reads the version, so the foot of the
site cannot name a repository the package does not; `Footer.test.tsx` holds
every on-site link to a page the sidebar lists, so a footer link cannot
outlive its page. It sits outside `main`, where `contentinfo` is a landmark,
in a column that holds the page above it: the footer runs to the page's
width rather than under the sidebar, rests at the foot of the viewport on a
page shorter than the window, and goes inert with the rest of the column
under the narrow-screen menu. Tertiary text on the raised surface, its
lightest pairing, measures 5.38:1 light and 7.55:1 dark.

Three package files changed and are unreleased: the Button's press scale
(0.96, colour alone under reduced motion), the Dialog's title wrapping
(header gap 40 → 24), and tabular figures in the Table's end-aligned cells.
The next version carries them.

Open, each recorded on its page rather than resolved:

- **The text field at 14px on iOS.** iOS Safari zooms into a field under
  16px. Two fixes, sixteen on a phone or fourteen held by a transform, and
  each looks different (Input, Typography).
- ~~**The text field's resting border.** The 2026-09-07 decision kept a
  `border/default` hairline; the code draws none. Both versions are on
  Decisions and Input; neither has been chosen.~~ Settled 2026-09-24 by the
  fidelity audit: the drawn inputs have **no border at rest**, a hairline
  only on hover and on focus (`701:12644`, `701:12617`). The code draws
  none at rest, as drawn; the 2026-09-07 note described neither. The hover
  hairline is not built (the audit's "decide").
- **The menu's radii are not concentric.** `xl` outside, `lg` rows at 8
  padding; concentric wants 16 outside. Drawn numbers, recorded on Space
  and shape and Dropdown menu.
- **The Tailwind theme keeps Tailwind's palette.** `bg-blue-500` compiles
  beside the tokens. A `--color-*: initial` in the generated `@theme` would
  make the system's colours the only ones; it changes what consumers get.
- **`glow` has no consumer** and the site's page-level look was never
  redesigned for the palette (carried from item 1).

Ordered by what it costs the project *as a portfolio piece*, which is not the
same as what it would cost a library with adopters. Reviewers arrive through the
documentation site, so an absent component costs more than an absent package.

### 0. Elevation and states landed; the Figma file has not seen it (2026-09-12)

Spec: `docs/superpowers/specs/2026-09-12-elevation-and-states-design.md`.
Fernando asked whether dark-mode layers and hovers are done with white alphas
or a colour scale, and said the colour scales looked too strong. Eleven
reference systems were read from their published packages; the survey is on
`/elevation` and in the spec. What landed: the surface step `925` in every
family; the dark ladder `950 / 925 / 900`; `interactive/wash-hover` and
`wash-pressed` (`alpha/haze-*`, mist/500 at 8/12/16/20) replacing the opaque
`interactive/neutral-hover` / `-pressed`; `border/subtle` as an alpha;
surface-to-surface separation measured in OKLCH ΔL (`lightness`,
`SURFACE_STEP` in `contrast.ts`; `tokenContrast` composites an alpha token
over a ground); `FillTone` relaxed to rest + label; every component and the
site moved onto the wash; the `/elevation` page and three Decisions entries;
the package at `0.2.0`. Invariants 4 and 21 carry the rules.

Open from it:

- **The Figma file is in step (done 2026-09-12, through the MCP).** The ten
  `925`s and five alphas were created in `Alpenglow Primitives` (hidden, all
  four scopes; 143 variables there, the extra one being the pre-existing
  `black`), `surface/raised`, `surface/overlay` and `border/subtle` were
  re-pointed, `neutral-hover` / `-pressed` deleted and the two wash
  variables created with their descriptions. All 54 Theme variables were
  read back and compared against `docs/figma/alpenglow-variables.json` by
  alias name and resolved value together, alpha included: zero mismatches.
  Nodes were not rebound and paint styles were not touched, as before.
- **Not yet seen in a browser by a person.** The change was checked in the
  Browser pane, both modes (see the commit); Fernando has not looked.
- **The neutral button's hover is instant, not faded**, because the wash is
  a `background-image` gradient over its fill. Accepted; a pseudo-element
  with an opacity transition would reverse it.
- **The filled ladders were left alone** — accent, danger, success and
  tertiary still hover to their own opaque stops (ΔL .10 per step in dark).
  Not in the question that was asked; a wash over those fills would need the
  `on-*` labels re-measured on the composite.

### 0b. Four 600 stops brought back to the generator (2026-09-12)

`primitives.ts` says every value is read from `scripts/generate-ramps.mjs`,
and at `dc3aaca` that was byte-true. The deep tail (`1ceacad`) changed the
lightness of 700–950, and `drift()` interpolates hue between 500 and 950 by
lightness, so the generator's four 600s (glow, twilight, flare, moss) moved by
one unit in one channel while the file kept the old hexes — the commit copied
only the forty tail stops. Decided for the generator: it is the stated
source, the docs already quoted its post-tail figures (twilight/600 on white
5.96, which the old hex gave as 5.98), and no ratio quoted anywhere moves at
two decimals except glow/600 against ember/600, 1.02 → 1.01. The Figma file
followed the same day through the MCP: `glow/600`, `twilight/600`,
`flare/600` and `moss/600` in `Alpenglow Primitives` had their colour re-set
(values, not aliases — no theme variable moved) and were read back.

### 1. The bedrock landed; the theme is expected to move (2026-09-11)

`dc3aaca` replaced the twenty-step neutral and the two brand ramps with ten
OKLCH families of eleven stops (invariant 4, primitives.ts). The theme kept
its 54 keys and was re-aliased by role; every ratio in the docs, this file and
the token skill was re-measured; `docs/figma/alpenglow-variables.json` and
`docs/figma/apply-variables.md` are generated from the tokens by
`scripts/export-figma.ts`. The same day the Figma file was brought in step
through the MCP: the ten families created in `Alpenglow Primitives`, all 54
`Alpenglow Theme` aliases re-pointed and verified by resolved hex in both
modes, the 80 old primitives deleted. The file key stays out of the
repository; Fernando pastes the URL when a session needs it.

`1ceacad`, later the same day, deepened the tail: 700–950 at L .43 / .33 /
.245 / .16 in every family, the dark canvas `#090B1F`. Fernando approved it
for a dark theme that reads as night, in preference to switching the ladder
to `stone`. Every dark pair gained; the one cost is the 950→900 step at
1.19:1; a deeper tail was measured and refused (invariant 4). The 40 moved
primitives and the three shadow inks were written to the Figma file and read
back. Light mode moved with it — `text/primary` is `stone/900` `#1E2026`.

What is open, in the order it will probably be taken:

- **Fernando is testing the bedrock in Figma, with the deep tail, and expects
  the semantic layer to change.** `src/tokens/theme.ts` stays the source: change the alias, run
  `npm run check` (the contrast suite says which pairs fall and by how much),
  regenerate the JSON, and the plugin script in `apply-variables.md` re-points
  the Figma aliases by name. The ratios quoted in prose on the docs pages and
  in `skills/applying-alpenglow-tokens/SKILL.md` are text, not computation —
  they have to be re-read after every theme change. The skill's tables were
  generated from the tokens and should be regenerated the same way. The
  first such call was made on 2026-09-12: with the deep tail, light-mode
  body text reads as ink (`stone/900` `#1E2026`, 16.28:1), so
  `text/secondary` in Light moved from `stone/700` to `stone/800`
  (`#32353C`, 12.28:1). It sits 1.33:1 from primary now, against 2.01
  before — close to the 1.22 the old neutral was refused for. Looked at on
  the live /table in light the same day: the header still separates from
  the cells, but by size, case and tracking, not colour; the e-mails under
  the names are tertiary and still read as a third level (2.28:1 from
  secondary). Where the change will show is a form label or metadata beside
  body copy with no typographic difference — not yet looked at. There is no
  stop between 800 and 700, so the alternative is back to `stone/700`.
  Fernando has not called it either way. Figma was re-pointed the same day.
- **The live site applies the colours badly** (Fernando, right after the
  merge, before any page had been redesigned for the palette). This is the
  page-level look — the brand gradient exists nowhere on the site, glow has no
  consumer at all, and the pages were composed for the old violet — not the
  tokens. Nothing was changed yet; it waits for the Figma test.
- **Figma nodes were not rebound and paint styles were not touched.** Anything
  that was bound directly to an old primitive is detached now; components
  bound to Theme variables followed the aliases. A rebinding pass is a
  separate, deliberate job. `black` is the one primitive left visible to
  publishing; it predates this work and was left as found.
- **`tertiary` could gain an outline variant** (`flare/700` is 7.84:1 on
  white) once someone draws it — see invariant 3.
- **A product that wants neutral dark surfaces aliases `stone` instead of
  `night`**; since the deep tail every pair holds without a move. Measured,
  not built.
- **A Display P3 pass** would add saturation at the 300–400 stops of the vivid
  families, which sRGB clips; nothing else changes.
- **Seen with the deep tail on 2026-09-12**, on the live site in the Browser
  pane, both modes: /colour (ramps and token tables), /button (all five solid
  tones, outline and ghost), and the Dialog open over its scrim. No console
  errors; the computed canvas was `#090B1F` dark and `#F5F7F9` light, the
  computed `text/primary` `#1E2026`. What was not exercised: hover and pressed
  states, the DatePicker panel, the Table, and a phone width.

### 1. Every token has a consumer (done 2026-09-11)

`surface/scrim` was the last token promising a component that did not exist;
the Dialog consumes it, retuned to the drawn wash (`alpha/mist-95` light,
`alpha/ink-95` dark — the spec is
`docs/superpowers/specs/2026-09-11-dialog-design.md`). The `use` notes on
`surface/sunken` and `surface/inverse`, which named progress tracks and
tooltips, now name what paints them. `surface/overlay` has three consumers —
DropdownMenu, the DatePicker panel and the Dialog. Table is the consumer of
`surface/raised` (table body) and of `interactive/selected` (row), which is why
`surface/sunken` no longer claims table headers: the header band is
`surface/base`, and the reason is recorded on the token itself.

Still to do by hand: press Esc on an open Dialog. The automated browser used
for the check does not turn a synthetic Escape into a close request, not even
for a plain `<dialog>`, so that behaviour is covered only by the test's
dispatched `cancel`. The Figma file's `color/surface/scrim` variable was
brought to the drawn wash with the bedrock on 2026-09-11 (`alpha/mist-95` /
`alpha/ink-95`).

The README's counts — 54 semantic tokens, 111 + 16 primitives, 123 contrast
cases — were checked against the tree on 2026-09-11. They are stated as cases,
the number the suite reports, rather than as assertions, which nothing counts.
For a system whose pitch is *measured rather than assumed*, a drifted number in
the README is the most expensive kind of typo.

### 2. Packaging — published (`0.2.0`, 2026-09-12)

`alpenglow@0.2.0` is on npm as `latest`, released through the Release
workflow from tag `v0.2.0` on `3c6120f`: the workflow ran the gates and
staged it, Fernando approved the staged version on npmjs.com, and it went
public about two minutes after the approval. 99 files, shasum `a96a9d88`.
Installed from the registry into an empty app it resolves 49 exports and
ships `--ap-night-925`, the two wash tokens and no `neutral-hover`. It is
the first version released through the staged flow, and the first breaking
one (two token names gone; see invariant 21).

`alpenglow@0.1.0` is on npm, published by hand from `b69bfcd`: 97 files,
70.4 kB packed. Its shasum, `c033a274`, is the one `npm publish --dry-run`
printed minutes before, so the tarball on the registry is the one the gates
checked. Installed from the registry into an empty app, it resolves the
JavaScript entry (48 exports, the Dialog among them) and all three stylesheet
entries.

`npm run build:lib` emits `dist/`, `npm run check:package` runs `publint
--strict`, `attw --profile esm-only` and `scripts/verify-package.ts`, CI runs
both, and `prepublishOnly` runs every gate before any publish. Before
publishing, the tarball was installed into a Next 16 + Tailwind app (Server
Component page, `layer(components)` override winning) and a Vite app with no
CSS reset; that second app found the box-model dependency recorded in
Conventions. Later versions go through the Release workflow — see Needs the
account owner. The spec is
`docs/superpowers/specs/2026-09-11-npm-package-design.md`.

The order, decided 2026-09-11 after two throwaway spikes: **sizes and tone**
first, because they break the API and should do it before anything is
published — done the same day, see
`docs/superpowers/specs/2026-09-11-sizes-and-tone-design.md`; then **an npm
package, `0.x`**; then **a shadcn registry, only if someone asks for one**.

This reverses two earlier rulings, and the reasons are what changed:

- Packaging was deferred because every new component would touch the exports
  map. It will not: the package exports one JavaScript entry plus
  `./styles.css` and `./tailwind-theme.css`, whatever the component count. Early compatibility
  expectations are what `0.x` is for.
- The registry was chosen first, then demoted once the source was ruled
  unlayered (Fernando: a Tailwind distribution must not bend the base code). A
  registry copies CSS Modules that the consumer's JavaScript imports, and a
  consumer cannot put those into a cascade layer, so every Tailwind override
  needs `!`. A single stylesheet can be layered by whoever imports it.

The package's shape, as measured in Vite (`@tailwindcss/vite`) and Next
(`@tailwindcss/postcss`), Tailwind 4.3.3, production builds, in Chrome:

- **Build:** Vite library mode with `preserveModules`, which keeps each
  module's `'use client'`, and every CSS Module compiled into one `styles.css`
  (about 46KB unminified, sent whole). Declarations come from
  `tsc -p tsconfig.lib.json`, finished by `scripts/finish-lib.ts`: tsc keeps
  the CSS import in `index.d.ts` and writes extensionless relative imports, and
  `attw` failed on both under `node16` and `bundler` until that script removed
  one and added `.js` to the other.
- **Tokens are an import the consumer writes.** Shipping
  `import './styles/tokens.css'` inside the barrel loses them silently under
  `sideEffects: ["*.css"]`: the bundler skips the barrel.
- **The source stays unlayered, and the consumer chooses the layer.** After
  `@import "tailwindcss";`, `@import "alpenglow/styles.css" layer(components);`
  resolves from `node_modules` in both setups and lands between `base` and
  `utilities`: components survive preflight, `className="rounded-none"` wins,
  token utilities such as `bg-surface-sunken` resolve. The price is the
  consumer's to take: their own unlayered `button { background: none }` then
  beats the button. Imported without `layer()`, everything behaves as today,
  and `rounded-none!` written in source still wins.
- **Do not ship a prewrapped `styles.layer.css` for JavaScript imports.**
  Imported before Tailwind's CSS, its `components` layer is declared first and
  preflight strips the button and the checkbox. Imported after, it works — but
  a Vite build merged two pages' CSS into one chunk and kept the first page's
  order, so the result depends on the bundler.
- **`tailwind-theme.css` needs a `@custom-variant dark`**, so Tailwind's `dark:`
  follows the tokens' rule: `[data-theme='dark']`, or the system preference
  under `:root:not([data-theme='light'])`. Verified in all four combinations of
  attribute and system; `scripts/build-tailwind.ts` emits it, and
  `generated.test.ts` holds it to `tokens.css`.

Kept from the first spike, for if the registry is ever built: `src/` copies
unchanged when each file's `target` mirrors `src/components/`, items depend on
each other through an `@alpenglow` namespace, and the item's `css` field adds
the tokens `@import` to the consumer's `globals.css`. next-themes with
`attribute={['class', 'data-theme']}` drives shadcn's `.dark` and this system's
`data-theme` from one switch.

Done on the way: **dependency hygiene** — no runtime dependencies; `react` and
`react-dom` are `^19.0.0` peers; `next`, `@vercel/analytics` and
`@carbon/icons-react` are dev dependencies because only the site imports them.
The Vercel build gets them only because it installs dev dependencies, which
stops being true if `NODE_ENV=production` or `NPM_CONFIG_PRODUCTION` is ever
set on the project. And the Checkbox's missing `'use client'` and the two hooks
lint failures the first spike found; see Conventions.

### 3. Structural accessibility — axe in the suite (done 2026-09-11)

The contrast suite covers colour; `axe-core` now covers structure. What it
runs and what it cannot see is in Conventions. Its first run over every page
and the open states found no violation, so no component changed; the
mutations that proved it can fail were a label with no `htmlFor`, a calendar
button with no name, the menu's `role="menu"` removed, and an ARIA attribute
the dialog role does not allow.

---

## Blocked pair — decide together

These two are deliberately parked and depend on each other.

**The input's resting-state boundary.** The field has no border at rest; its
fill is 1.07:1 against a card and identical to the canvas. The decision was
to leave it and revisit. Settled on the drawing's side 2026-09-24 (fidelity
audit): the drawn inputs have no border at rest, a hairline only on hover
and on focus (`701:12644`, `701:12617`), so the code matches the drawing and
the 2026-09-07 `border/default` note does not. What stays open is WCAG
1.4.11 against a drawing that has no resting border.

**The state colours were one step off the Figma file** — the error and
success border and fill were drawn lighter than measurement allowed, below
the 3:1 that WCAG 1.4.11 requires *when the border is the field's only
boundary*. The bedrock closed that half: `border/danger` is `ember/600`
(5.93:1 on white) and `border/success` is `moss/600` (5.09:1), and the Figma
theme now aliases the same primitives. What remains blocked is the resting
border itself — if it returns, these are the values it takes, and they pass.

---

## Needs the account owner

**Releasing `alpenglow`.** `0.1.0` was published by hand on 2026-09-11, and
the same day npm was told to trust `release.yml` in
`fernandorviana/alpenglow` with stage permission only (`npm trust github
alpenglow --file release.yml --repository fernandorviana/alpenglow
--allow-stage-publish`; `npm trust list alpenglow` shows it). A new version:

1. Bump `version`, commit, push a matching `v*` tag. The Release workflow
   runs the gates and stages it. A tag for a version npm already has, such as
   `v0.1.0`, is skipped.
2. Fernando approves the staged version on npmjs.com, with 2FA, to make it
   public. Nothing in CI can make it public alone.

Every npm write from the owner's account — login, a manual publish, `npm
trust` — asks for 2FA in the browser. npm stopped accepting authenticator apps
for new 2FA setups in 2025; the account uses a passkey.

`eleonora` is not reserved: npm's policy discourages packages published only
to hold a name.

**Applying the variables in Figma.** `docs/figma/alpenglow-variables.json`
is ahead of the file: the Theme collection there still has 54 of 94 — the
24 `category/*` and 12 `chart/*` (2026-09-23) and the four
`border/*-subtle` (2026-09-20) are missing — and the fourth collection,
**Alpenglow Density** (five `density/*` variables, modes Comfortable and
Compact, scope `WIDTH_HEIGHT`, from the dense screen, on main as
`cb3f95f`), does not exist yet. Also not yet applied, from breakpoints and
layout (2026-09-24, on main as `e66bd3c`):
`breakpoint/*` inside the existing Scale collection, and a fifth
collection, **Alpenglow Layout** (`layout/margin` and `layout/gap`, modes
Narrow, Medium, Wide), plus an `Alpenglow / 12 columns` grid style bound
to it. `docs/figma/apply-variables.md`
has both ways: A, the prompt for an agent with the Figma MCP (how the
2026-09-12 round was done), and B, a plugin-console script, which creates
all five collections.
