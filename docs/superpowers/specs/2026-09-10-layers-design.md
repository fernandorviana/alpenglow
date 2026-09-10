# The layers — design

**Date:** 2026-09-10
**Status:** approved, ready for an implementation plan
**Source:** the brand foundation document (v0.2) and the moodboard grid, both
kept out of this repository because they name the original client.

---

## Why this page

The site explains every token and every measurement, and never once explains
the name. Alpenglow has a story that does real work: the light that stays on
the peaks after the valley has gone dark is the reason `surface/overlay` is a
lighter colour step in dark mode and a white card with a shadow in light. That
reasoning lives on the Decisions page as a number. Nothing on the site turns
it into an image a reader can carry from one page to the next.

This subproject adds that image. It is narrative and one diagram. It changes
no token, no component and no colour — the palette is a separate decision that
is still open, and everything here is built so that it survives whatever that
decision turns out to be.

---

## What this spec settles

1. The layer vocabulary, and what each word maps to in the code and in Figma.
2. The one rule that explains why the token files are split the way they are.
3. Where the metaphor is allowed to appear, and where it is not.
4. The three lines of copy that carry the concept, and where each one lives.
5. The "Why Alpenglow?" page and the architecture diagram.

## What it leaves alone

- **Colour.** The Eleonora palette in the brand document collides with the
  current danger colour and fails 1.4.11 on `border.default`. That is its own
  subproject and nothing here depends on it.
- **The Figma file.** Generated from the tokens after the palette settles.
- **The wordmark, the underglow device, the editorial grid.** The visual
  language of the site is the subproject after this one.
- **Motion tokens.** Recorded below under *Open work*, with the layer they
  belong to.
- **The README.** Its drift is a separate item in `MEMORY.md`; this spec adds
  nothing to it.

---

## The vocabulary

The metaphor is a landscape under a particular light. Each word names a layer
that exists in the code, or is drawn dashed because it does not exist yet.

| Layer | Is | In the code | In Figma |
|---|---|---|---|
| **Bedrock** | Raw colour. Buried: nothing references it directly. | `src/tokens/primitives.ts` | `Alpenglow Primitives`, hidden from publishing |
| **Outcrop** | Bedrock that reaches the surface: dimension and type. Used directly. | `src/tokens/scale.ts`, `src/tokens/typography.ts` | `Alpenglow Scale` |
| **Contours** | Semantic roles. Lines that join every place sharing one meaning. Every one is an alias. | the keys of `src/tokens/theme.ts` and of `src/tokens/elevation.ts` | `Alpenglow Theme`; elevation is an effect style, not a variable |
| **Light** | Eleonora. The values the contours take under each mode. | the `light` / `dark` values in `theme.ts` and `elevation.ts` | the `Light` / `Dark` modes of `Alpenglow Theme` |
| **Terrain** | Components. | `src/components` | the component library |
| **Paths** | Patterns: recommended ways through a task. | none yet | none yet |
| **Crest** | Any product built on the system. The first one is this site. | `app/` | — |

Three of these words need a sentence of justification, because each replaces
one from the brand document.

**Outcrop** replaces "bedrock has two strata". An outcrop is the geological
term for bedrock exposed at the surface, which is exactly what `scale.ts` is:
a raw value a component may use without an alias.

**Crest** replaces "summit". The brand document forbids summit-conquest
language and then uses the word. A crest is the ridge line, which is where
alpenglow lands first, and it is a line rather than a point, so it reads as a
layer in the diagram the way the contours do. *Zenith* was rejected: it is the
sun at its highest, which is noon, the opposite of twilight.

**Crest is any product, not the last layer.** The site imports every one of the
thirteen components. It is a product built on the system, and it is the one
that exists, so it is drawn solid.

### The modes are day and night. Eleonora is the twilight.

Light and dark are not two themes; they are two modes of one theme, and the
code already says so: one `theme.ts`, every token with both values. The
narrative follows the code. Day is the light mode, night is the dark mode, and
Eleonora is what the two share — the theme is the thing that stays constant
when the light changes. Alpenglow itself is a twilight phenomenon, morning and
evening, which is why the theme lives at the intersection rather than in
either mode.

This is also the sentence that finally explains invariant 1 without a number:
in the evening the valley darkens first and the crests stay lit, so in dark
mode the higher surface is the lighter one.

---

## The rule that explains the file split

> **A value needs a contour only if the light changes it.**

`16px` is 16px by day and by night, so spacing is outcrop and a component may
use it directly. A grey is near-black by day and near-white by night, so
colour is buried and reaches a component only through a role. This is the
whole reason `scale.ts` and `typography.ts` are separate files from
`primitives.ts`, and the reason the Figma primitives collection is hidden while
the scale collection is published. The Figma split is the same rule in
literal form.

Two consequences the brand document gets wrong, and this spec corrects:

- **Elevation is a contour, not bedrock.** The brand document lists elevation
  among the primitives. The code already disagrees, and the rule says why:
  `src/tokens/elevation.ts` carries a light and a dark value for its one step,
  and its own header explains that it cannot live in the scale *because it
  varies by mode*. The colour steps (`surface/raised`, `surface/overlay`) and
  the shadow (`elevation/md`) are both contours. The file is not a fourth
  Figma collection — effects are styles there, not variables — so the
  three-collection architecture holds.
- **No `component.*` layer.** A fourth indirection pays for itself when a
  second theme needs to override values per component. With thirteen
  components and one theme it is cost without return; CSS Modules already
  scope each one.

---

## Where the metaphor may appear

**Narrative, diagrams and page headings only.** The brand document's own
principle — the metaphor must explain the architecture, not make tokens harder
to find — is adopted as a hard rule:

- Token names stay `surface/raised`, `--ap-color-text-primary`, `--ap-spacing-200`.
  No token is renamed to fit the landscape.
- The Figma modes stay `Light` and `Dark`. "Day" and "night" are the story told
  about them, not their names.
- File names stay `primitives.ts`, `scale.ts`, `typography.ts`, `theme.ts`.
- `MEMORY.md` gains the vocabulary table so that the next session, human or
  agent, uses the same words.

The brand document's avoid-list applies in full: no literal mountains, no
hiking or travel imagery, no summit language, no topographic texture as
wallpaper. And the repository rule stays absolute: the original client and the
original file name appear nowhere in it.

---

## The three lines

Five candidate lines were competing for the same job. Three survive, each with
one home:

| Line | Lives |
|---|---|
| **Bring structure to light.** | Tagline. The home page lead, and later the wordmark. |
| **Structure exists beneath the surface. Light makes it visible.** | Opens the "Why Alpenglow?" page. |
| **Clarity, layer by layer.** | The architecture line: caption of the diagram, and the section heading it sits under. |

Dropped: *A shared language for design and code* and *Structure beneath every
experience*. The current home title, *A design system that shows its working*,
is decided when the home page is edited — it is the strongest statement of
the measurement argument and may well stay as the H1 with the tagline beneath.

The vision and the mission from the brand document are not published as a
"Vision / Mission" section. They are folded into the page copy: the vision
(*reveal the structure that makes complex products clear*) is what the page
says; the mission (*turn decisions into reusable layers*) is what the diagram
shows.

---

## Deliverables

### 1. The page: `/why`

`app/why/page.tsx`, rendered through `DocPage` like every other page. Nav
entry under *Start here*, second item, label **Why Alpenglow**, so that a
reader who starts at Overview meets the concept before the accessibility and
decisions pages assume it.

Sections, in order:

1. **The name.** Alpenglow, the light that stays on the peaks after the valley
   has gone dark. One paragraph. The name's personal origin is stated the way
   the README states it: *a name to which the sense of "light" is usually
   attributed*, never as fact.
2. **Structure exists beneath the surface.** The opening line, then the idea:
   every clear interface rests on decisions nobody sees, and this system makes
   them visible by measuring them. This is where the page connects the
   metaphor to the site's existing argument — the ratios on every page are the
   structure brought to light.
3. **Clarity, layer by layer.** The diagram, then one short paragraph per
   layer, in the order of the table above. Each paragraph ends by naming what
   the layer is in the code.
4. **The rule.** *A value needs a contour only if the light changes it*, with
   the `16px` / grey example, and the sentence about the hidden Figma
   collection.
5. **Day, night, and the twilight between.** Modes versus theme, and the
   explanation of invariant 1 in prose. Links to the Decisions page for the
   numbers, and to the Colour page for the surfaces.

The evidence rail (the `evidence` slot of `DocPage`) carries the counts of the
three token layers — bedrock, outcrop, contours — derived from the token
objects the same way the home page derives its counts. Nothing typed by hand.
Components are not counted there: there is no manifest to derive the number
from, and the nav already lists them.

Voice: the brand document's *prefer* column. Explain the decision, not only
the rule; no hype; no conquest.

### 2. The diagram

An inline SVG component, `app/ui/Layers.tsx`, used once on the `/why` page.

- **Six horizontal bands**, bottom to top: Bedrock, Outcrop, Contours, Terrain,
  Paths, Crest. Bedrock is drawn as a solid mass; Outcrop as the same mass
  breaking the surface at one side; Contours as a set of lines; Terrain as a
  filled profile; Paths and Crest as a ridge line, Paths dashed.
- **Light is not a band.** It is a direction: a single source at one upper
  corner, drawn as rays that cross every layer, so that the diagram says the
  same thing the brand document says about the underglow — the light has a
  source and is never a symmetrical halo.
- **Neutral tokens only.** Fills and strokes use `surface/*`, `border/*` and
  `text/*` variables. No hex, no primitive, no accent colour. This is what
  makes the diagram indifferent to the palette decision: when the colours
  change, the diagram follows.
- **Both modes**, by construction, since every colour is a theme token.
- **Accessible.** `role="img"` with an `aria-label` naming the six layers in
  order, and each band labelled in visible text, not only in the drawing.
- **Static.** No animation. Ambient motion is reserved by the brand document
  for brand contexts, and a documentation page is a working surface.

### 3. Home page

The lead paragraph gains the tagline as its first sentence, and the *Three
layers* section gets a one-line pointer to `/why`. No other change; the home
page decision about its H1 is taken during this work, not before.

### 4. `MEMORY.md`

A new section, **Vocabulary**, holding the layer table and the rule, placed
after *Conventions*. It is the public record; the next reader must not
rediscover the words.

---

## Testing

The site's tests read stylesheets and markup rather than trust comments. The
same standard here:

- `app/ui/Layers.test.tsx` renders the diagram and asserts that no `fill` or
  `stroke` attribute in the output is a colour literal — every one must be a
  `var(--ap-…)`. This is the diagram's version of the Button test: the
  guarantee that the palette decision cannot strand it.
- The same test asserts the `aria-label` names all six layers in order and
  that Paths is the only dashed band.
- `npm run check` and `npm run build:docs` pass. The nav test, if one exists
  by then, includes `/why`.

---

## Open work this spec creates or touches

Recorded here so that the next subproject does not re-derive them.

- **Palette.** Blocked on a decision about the primary action colour, which
  in the brand document sits within 10° of hue of the danger colour in both
  modes. Nothing here depends on it.
- **Dark-mode shadows.** Wanted in addition to the lighter step, not instead
  of it — and that is what the code does: `elevation/md` renders in dark as
  `alpha/black-32` and `alpha/black-48`, kept modest on purpose because a
  64% shadow in dark reaches only 1.16:1 against `surface/base`, and the
  overlay takes a 1px border to do the rest. What is open is the `sm` and
  `lg` steps the drawing has in light, which land when a component asks for
  them, and whether the dark ink changes with the palette.
- **Motion tokens.** Possible and cheap: durations and easings as
  `src/tokens/motion.ts`, emitted as `--ap-duration-*` and `--ap-easing-*`.
  They do not vary by mode, so they are outcrop, beside the scale. Reduced
  motion stays a media query inside components — invariant 6 slows the
  spinner rather than freezing it, which a single "reduced" value could not
  express. Five components currently hard-code 120ms and 140ms; that is the
  migration. In Figma, durations are number variables; easings are not
  representable as variables and stay documentation.
- **One exposed primitive.** `Calendar.module.css` colours out-of-month days
  with `--ap-gray-light-400` directly. The comment justifies the 1.65:1, but
  a primitive does not change with the mode, so the ratio it cites is only
  true by day. It belongs on the `date-picker` branch, where the file lives.
- **The visual language** — wordmark, underglow, grid — is the next
  subproject, and it reuses the vocabulary and the diagram from this one.
