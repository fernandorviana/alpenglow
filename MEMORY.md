# Alpenglow — project memory

A durable brief for anyone (person or agent) picking this up cold. It records
what is not derivable from reading the code: why things are the way they are,
what must not be "corrected", and what is still open.

Last verified against the tree on **2026-09-12**, at the site-layout commit (no bar across the top, the section list, the pager, the skip link).

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
elevation file that is not a fourth collection — effects are styles in Figma,
not variables. TypeScript is the source of truth; both stylesheets are
generated from it.

| Layer | File | Varies by mode | Holds |
|---|---|---|---|
| Primitives | `src/tokens/primitives.ts` | no | 113 opaque colours (white + ten families of eleven stops, 050–950, generated in OKLCH with one lightness per stop — `scripts/generate-ramps.mjs` — plus `925`, the surface step, in stone and night only) + 21 alpha (12 on the black/white ramps, 4 inks — the light divider, two shadows, the dark scrim — the light scrim's mist, and 4 hazes: mist/500 at 8/12/16/20 for the wash). Never referenced directly. |
| Theme | `src/tokens/theme.ts` | Light / Dark | 54 semantic tokens: `surface` 11, `text` 12, `interactive` 23, `border` 8. Every value is an alias — no raw hex. |
| Elevation | `src/tokens/elevation.ts` | Light / Dark | Shadows, two steps (`md` for anchored panels, `lg` for the Dialog). Geometry is shared; only the ink changes. |
| Scale | `src/tokens/scale.ts` | no | Spacing, radius, border width. Dimension must not be reachable by a theme switch. |
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

8. **The Table keeps its selection column when it collapses.** Below `40rem`
   of container width the table becomes a list: header gone, secondary columns
   gone. The drawing's mobile frame shows the primary cell and the row action
   only, and it has no selection column to show. Selection is a feature the
   caller opts into, so hiding the checkbox there would remove it on a phone
   rather than lay it out differently. The empty and loading cells are
   excluded from the same hide rule because they are the only content those
   two states have.

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

19. **The site's narrow-screen menu is a fixed overlay, and the component
    owns what the stylesheet cannot.** Below 760px the sidebar is a sticky bar
    with a toggle; open, `.sidebar[data-open='true']` fixes it over the whole
    viewport (`100dvh`, a scroll of its own) rather than growing the bar and
    pushing the page down. `app/ui/Nav.tsx` then sets `data-nav-open` on
    `html` to lock document scroll, puts `inert` on every sibling of the nav —
    siblings, not a named element, so the overlay covers whatever the shell
    holds — closes on Esc, and closes when the viewport widens past the
    breakpoint, because on a wide screen the sidebar shows whatever `open`
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
    an entry animation.
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
- **Prefer the native element.** `Select` wraps `<select>` rather than building
  a listbox, and `DropdownMenu` is a `popover` placed with CSS anchor
  positioning rather than a portal and a positioning library.
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
npm test            # 940 tests across 39 files
npm run build:css   # regenerate both stylesheets
npm run build:docs  # static export
npm run build:lib       # the package, in dist/
npm run check:package   # publint, attw, and what the build must never lose
```

CI (`.github/workflows/ci.yml`) runs typecheck, lint and tests, regenerates the
stylesheets and fails on a diff, then builds the docs. A stale generated
stylesheet is a silent failure — that gate is the reason it exists.

The contrast suite (`src/tokens/contrast.test.ts`, 130 cases) derives its
assertions from the theme keys rather than listing pairs, so a new token is
covered the moment it exists. It caught five real defects on its first run,
including a divider that resolved to the same colour as the surface beneath it.

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
to leave it and revisit.

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
