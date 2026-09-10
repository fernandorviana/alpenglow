# Alpenglow — project memory

A durable brief for anyone (person or agent) picking this up cold. It records
what is not derivable from reading the code: why things are the way they are,
what must not be "corrected", and what is still open.

Last verified against the tree on **2026-09-10**, commit `3dd47f0`.

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
| Primitives | `src/tokens/primitives.ts` | no | 81 opaque colours + 14 alpha (12 on the ramps, 2 shadow inks). Never referenced directly. |
| Theme | `src/tokens/theme.ts` | Light / Dark | 53 semantic tokens: `surface` 11, `text` 11, `interactive` 23, `border` 8. Every value is an alias — no raw hex. |
| Elevation | `src/tokens/elevation.ts` | Light / Dark | Shadows, one step (`md`). Geometry is shared; only the ink changes. |
| Scale | `src/tokens/scale.ts` | no | Spacing, radius, border width. Dimension must not be reachable by a theme switch. |

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

3. **`tertiary` and `success` are solid-only, enforced by the type union.**
   `brand-2/500` is 1.45:1 on white and `green/500` is 1.67:1 — there is no
   compliant text or border colour for either, so
   `variant="outline" tone="tertiary"` does not compile.

4. **The dark elevation ramp holds four levels, not five.** When you run out,
   separate with a border rather than inventing a step.

5. **A loading button is `disabled` but must not look disabled.** Every
   paint-bearing disabled rule in `Button.module.css` carries `:not(.loading)`.
   Busy and unavailable are different states. The spinner inherits
   `currentColor`, so without the exclusion all five tones collapse to grey.
   `src/components/Button/Button.test.tsx` reads the stylesheet and asserts
   this; the guard has been proven to fail when the bug is reintroduced.

6. **Reduced motion slows the spinner, it does not freeze it.** A frozen
   spinner reads as a hung page. What it drops is the length change.

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
   halves stop matching declaration for declaration.

10. **Dark elevation is modest on purpose.** The dark shadow was never drawn,
    so its values are a decision. Black at 64% over the dark canvas reaches
    1.16:1 against it; black at 8% over white reaches 1.19:1. An 8% shadow in
    light does more than a 64% one in dark, so dark does not chase a shadow
    that cannot work — it stops at `alpha/black-32` and `-48`.

11. **The DropdownMenu has a border in dark and none in light.** Invariant 4
    applied, not an accident of asymmetry: in dark the shadow stops separating, and
    `border/default` is 1.77:1 against the canvas there against 1.31:1 in
    light. Each menu tone also hovers to its own subtle fill rather than one
    shared neutral — `text/accent` on the neutral fill is 3.50:1 in dark.
    Both are asserted in `DropdownMenu.test.tsx` and `contrast.test.ts`.

12. **The DropdownMenu's tests stub the popover API, and only part of it.**
    jsdom 30 implements none of it. The stub in `DropdownMenu.test.tsx` covers
    show, hide, toggle, the queued `toggle` event and invoker clicks. Esc, light dismiss,
    focus return and placement are deliberately absent — they are the
    browser's, and all four were checked in Chrome — Esc by hand, because the
    browser automation sends an untrusted Esc that the close watcher ignores.
    Do not grow the stub to imitate them; delete it when jsdom ships popover,
    which a guard test will announce. The same Chrome check caught a keyboard
    ring losing on specificity, which jsdom cannot compute — look at
    `:focus-visible` in a real browser after touching a focus rule.

---

## Conventions

- **No colour literals in component files.** Every value is a token. The only
  literals are geometry that follows from the scale (control heights) and the
  spinner's own dimensions.
- **Comments record the decision, not the mechanism** — including alternatives
  that were rejected, with the measurement that rejected them.
- **Focus adds geometry, never recolours a border**, so colour is never the
  only channel carrying a state.
- **Icons are IBM Carbon** (Apache 2.0), a peer install rather than a bundled
  dependency. Fifteen icons were drawn for this system because Carbon has no
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

---

## Verification

```bash
npm run check       # tsc --noEmit, then the full suite
npm test            # 389 tests across 16 files
npm run build:css   # regenerate both stylesheets
npm run build:docs  # static export
```

CI (`.github/workflows/ci.yml`) runs typecheck + tests, regenerates the
stylesheets and fails on a diff, then builds the docs. A stale generated
stylesheet is a silent failure — that gate is the reason it exists.

The contrast suite (`src/tokens/contrast.test.ts`, 95 cases) derives its
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

### 1. The tokens still promise components that do not exist

Three tokens still name components that do not exist: `surface/sunken`
(wells, progress tracks), `surface/scrim` (modal backdrop), `surface/inverse`
(tooltips, inverted banners). DropdownMenu claimed `surface/overlay`, and is its only
consumer until a modal or a popover exists. Table claimed two more off this list — it is the consumer of
`surface/raised` (table body) and of `interactive/selected` (row), which is
why `surface/sunken` no longer claims table headers: the header band is
`surface/base`, and the reason is recorded on the token itself.

### 2. README drift

- Two different `## Icons` sections that contradict each other and the code:
  one says icons are not re-exported, the other says they ship from
  `alpenglow/icons`, and `src/index.ts` does `export * from './icons/index'`.
- Two near-duplicate "Running it" blocks, with different Carbon URLs.

The counts were corrected with the DropdownMenu work: 53 semantic tokens, 81 + 14
primitives, and 95 contrast cases — stated as cases, the number the suite
reports, rather than as assertions, which nothing counts.

For a system whose pitch is *measured rather than assumed*, a drifted number in
the README is the most expensive kind of typo. Cheap to fix, and it is the
credibility of the central argument.

Fix `dist-docs/` in the same pass — three files, 292K, Vite-hashed, left over
from the docs setup that preceded Next.js. Not in `.gitignore`; the current
build writes to `out/`.

### 3. Cover Loader, Radio and Textarea with tests

These three are the untested ones, and the risk is specific rather than
general. The Loader's reduced-motion contract — keep turning, drop the length
change — exists today only as a comment in `Loader.module.css`; nothing fails
if someone removes the media query. `Button.test.tsx` shows the pattern to
copy: read the stylesheet, assert the selector invariant. `Radio` also needs a
CSS module of its own rather than borrowing one.

### 4. Sizing does not compose

`Button`, `Input`, `Select` and `Loader` take `sm | md | lg`. `Checkbox`,
`Radio`, `Switch`, `Textarea` and `Field` take no size at all, so a large input
cannot line up with its checkbox.

### 5. No shared tone vocabulary

`BadgeTone` has 6 members, `ButtonTone` 5, `LoaderTone` 4 plus `onFill`, with
`warning`, `info` and `tertiary` appearing in some and not others. Some
divergence is right — a warning button is usually a design error — but there is
no exported `Tone` type naming the vocabulary that each component subsets.
`DropdownMenuItemTone` makes it four, with 3 members (`default`, `accent`, `danger`).

### 6. Packaging — deliberately deferred

`src/index.ts` is already a complete public entry point. What is missing is the
manifest and build around it: `exports`, `main`, `module`, `types`, `files`,
`sideEffects`, a library build, and a real version. That work is scheduled for
after the component set settles, not overlooked.

**This was ranked first and then moved down, on purpose.** The reasoning, so it
does not get re-litigated: packaging is mostly mechanical and does not get more
expensive as components are added — but *maintaining* it does, since every new
component touches the exports map. A first published version covering half the
intended system also creates compatibility expectations too early. Reviewers of
a portfolio piece arrive through the docs site, not through npm.

Two parts do **not** wait, because they get more expensive later:

- **Dependency hygiene, now.** `next` and `@vercel/analytics` belong to the
  docs site, not the library, and `react`/`react-dom` should be
  `peerDependencies`. Ten minutes, unrelated to publishing.
- **The CSS delivery model, now.** How does a consumer receive `tokens.css`,
  and do the CSS Module class names survive a library build? This is
  architecture, not packaging: if the answer forces a change in how components
  are styled, it is much cheaper to learn at twelve components than at
  twenty-five. Settle it with a *throwaway* build — generate once, install the
  tarball into a scratch Vite app, check light and dark, delete it. Nothing to
  maintain afterwards.

The rest — `exports`, `files`, `sideEffects`, version, the build config,
`npm pack` — waits until the component set stops moving.

### 7. No structural accessibility assertions

The contrast suite covers colour, which is the hard part. There is no `axe`
pass, so role, accessible-name and state regressions are caught only by the
hand-written tests — and three components have none.

---

## Blocked pair — decide together

These two are deliberately parked and depend on each other.

**The input's resting-state boundary.** The field has no border at rest; its
fill is 1.06:1 against a card and identical to the canvas. The decision was
to leave it and revisit.

**Four state colours are one step off the Figma file** — the error and success
border and fill. The Figma values were requested, but measurement puts
`red/400` at 2.75 (border) / 2.58 (fill) and `green/500` at 1.67 / 1.57, all
below the 3:1 that WCAG 1.4.11 requires *when the border is the field's only
boundary*. If the resting border decision changes, so does whether these values
are usable.

---

## Needs the account owner

`npm login` — the placeholder reservations for the `alpenglow` and `eleonora`
package names have not been made, and only the account owner can do it.
