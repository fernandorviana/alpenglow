# Alpenglow — project memory

A durable brief for anyone (person or agent) picking this up cold. It records
what is not derivable from reading the code: why things are the way they are,
what must not be "corrected", and what is still open.

Last verified against the tree on **2026-09-09**, commit `d327a13`.

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

Three token layers, mirrored in Figma as three variable collections. TypeScript
is the source of truth; both stylesheets are generated from it.

| Layer | File | Varies by mode | Holds |
|---|---|---|---|
| Primitives | `src/tokens/primitives.ts` | no | 81 opaque colours + 12 alpha. Never referenced directly. |
| Theme | `src/tokens/theme.ts` | Light / Dark | 53 semantic tokens: `surface` 11, `text` 11, `interactive` 23, `border` 8. Every value is an alias — no raw hex. |
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
  a listbox.

---

## Verification

```bash
npm run check       # tsc --noEmit, then the full suite
npm test            # 253 tests across 11 files
npm run build:css   # regenerate both stylesheets
npm run build:docs  # static export
```

CI (`.github/workflows/ci.yml`) runs typecheck + tests, regenerates the
stylesheets and fails on a diff, then builds the docs. A stale generated
stylesheet is a silent failure — that gate is the reason it exists.

The contrast suite (`src/tokens/contrast.test.ts`, 80 cases) derives its
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

### 1. The tokens promise a system twice the size of the component set

Eight tokens name components that do not exist: `surface/raised` (table body),
`surface/overlay` (modals, popovers, dropdowns), `surface/sunken` (table
headers), `surface/scrim` (modal backdrop), `surface/inverse` (tooltips),
`interactive/selected` (row, tab, nav). For a system pitched at dense,
data-heavy interfaces, **Table** is the load-bearing absence.

### 2. README drift

- Claims **49** semantic tokens; there are **53**.
- Two different `## Icons` sections that contradict each other and the code:
  one says icons are not re-exported, the other says they ship from
  `alpenglow/icons`, and `src/index.ts` does `export * from './icons/index'`.
- Two near-duplicate "Running it" blocks, with different Carbon URLs.
- Claims 97 contrast assertions; the suite runs 80 cases — plausible but
  unverified, worth recounting alongside the 53.

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
- **The CSS delivery model, before Table.** How does a consumer receive
  `tokens.css`, and do the CSS Module class names survive a library build? This
  is architecture, not packaging: if the answer forces a change in how
  components are styled, it is much cheaper to learn at twelve components than
  at twenty-five. Settle it with a *throwaway* build — generate once, install
  the tarball into a scratch Vite app, check light and dark, delete it. Nothing
  to maintain afterwards.

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
